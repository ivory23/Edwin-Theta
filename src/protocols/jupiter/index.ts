import { ISwapProtocol, SupportedChain } from '../../types';
import { PublicKey, VersionedTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { EdwinSolanaWallet } from '../../edwin-core/wallets/solana_wallet';

interface JupiterQuoteParams {
    inputMint: string;
    outputMint: string;
    amount: string | number;
    slippageBps?: number;
}

interface SwapInfo {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
}

interface RoutePlan {
    swapInfo: SwapInfo;
    percent: number;
}

interface JupiterQuoteResponse {
    inputMint: string;
    inAmount: string;
    outputMint: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: string;
    slippageBps: number;
    platformFee: null | any;
    priceImpactPct: string;
    routePlan: RoutePlan[];
    contextSlot: number;
    timeTaken: number;
}

interface PriorityLevel {
    maxLamports: number;
    priorityLevel: 'veryHigh' | 'high' | 'medium' | 'low';
}

interface SwapRequestBody {
    quoteResponse: JupiterQuoteResponse;
    userPublicKey: string;
    dynamicComputeUnitLimit?: boolean;
    dynamicSlippage?: boolean;
    prioritizationFeeLamports?: {
        priorityLevelWithMaxLamports: PriorityLevel;
    };
}

interface DynamicSlippageReport {
    slippageBps: number;
    otherAmount: number;
    simulatedIncurredSlippageBps: number;
    amplificationRatio: string;
    categoryName: string;
    heuristicMaxSlippageBps: number;
}

interface PrioritizationType {
    computeBudget: {
        microLamports: number;
        estimatedMicroLamports: number;
    };
}

interface SwapResponse {
    swapTransaction: string;
    lastValidBlockHeight: number;
    prioritizationFeeLamports: number;
    computeUnitLimit: number;
    prioritizationType: PrioritizationType;
    dynamicSlippageReport: DynamicSlippageReport;
    simulationError: null | string;
}

interface SwapParams {
    asset: string;
    assetB: string;
    amount: string;
}

export class JupiterProtocol implements ISwapProtocol {
    supportedChains: SupportedChain[] = ['solana'];
    JUPITER_API_URL = 'https://api.jup.ag/swap/v1/';

    private wallet: EdwinSolanaWallet;

    constructor(wallet: EdwinSolanaWallet) {
        this.wallet = wallet;
    }

    async swap(params: SwapParams): Promise<number> {
        const { asset, assetB, amount } = params;
        if (!asset || !assetB || !amount) {
            throw new Error('Invalid swap params. Need: asset, assetB, amount');
        }
        // 1. Get quote from Jupiter
        const inputMint = await this.wallet.getTokenAddress(asset);
        const outputMint = await this.wallet.getTokenAddress(assetB);
        if (!inputMint || !outputMint) {
            throw new Error(`Invalid asset: ${asset} or ${assetB}`);
        }

        // Get token decimals and adjust amount
        const connection = this.wallet.getConnection();
        const mintInfo = await connection.getParsedAccountInfo(new PublicKey(inputMint));
        if (!mintInfo.value || !('parsed' in mintInfo.value.data)) {
            throw new Error('Could not fetch mint info');
        }
        const decimals = mintInfo.value.data.parsed.info.decimals;
        const adjustedAmount = (Number(amount) * Math.pow(10, decimals)).toString();
        // Cast adjusted amount to integer to avoid scientific notation
        const adjustedAmountInt = BigInt(Math.floor(Number(adjustedAmount))).toString();
        const quoteParams = { inputMint, outputMint, amount: adjustedAmountInt };
        const quote = await this.getQuote(quoteParams);

        // 2. Get serialized transaction
        const swapResponse = await this.getSerializedTransaction(quote, this.wallet.getPublicKey().toString());

        // 3. Deserialize the transaction
        const transaction = VersionedTransaction.deserialize(Buffer.from(swapResponse.swapTransaction, 'base64'));

        // 4. Sign the transaction
        this.wallet.signTransaction(transaction);

        // 5. Serialize and send the transaction
        const rawTransaction = transaction.serialize();
        // 6. Send transaction with optimized parameters
        const signature = await connection.sendRawTransaction(rawTransaction, {
            maxRetries: 2,
            skipPreflight: true,
        });

        // 7. Wait for confirmation
        await this.wallet.waitForConfirmationGracefully(connection, signature);

        // 8. Retrieve the actual output amount based on the output asset type:
        //    - For SOL, check lamport balance changes (and add back the fee).
        //    - For SPL tokens, check the token account balance changes.
        let actualOutputAmount: number;
        // Fetch the parsed transaction details (make sure to set the proper options)
        const txInfo = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });
        if (!txInfo || !txInfo.meta) {
            throw new Error('Could not fetch transaction details');
        }

        // Check if the output asset is SOL. This check may vary depending on your wallet's representation.
        if (assetB.toLowerCase() === 'sol') {
            // SOL changes are reflected in lamport balances.
            const accountKeys = txInfo.transaction.message.accountKeys;
            const walletIndex = accountKeys.findIndex(key => key.pubkey.toString() === this.wallet.getAddress());
            if (walletIndex === -1) {
                throw new Error('Wallet not found in transaction account keys');
            }
            // The difference in lamports includes the fee deduction. Add back the fee
            // to get the total SOL credited from the swap.
            const preLamports = txInfo.meta.preBalances[walletIndex];
            const postLamports = txInfo.meta.postBalances[walletIndex];
            const fee = txInfo.meta.fee; // fee is in lamports
            const lamportsReceived = postLamports - preLamports + fee;
            actualOutputAmount = lamportsReceived / LAMPORTS_PER_SOL;
        } else {
            // For SPL tokens, use token balance changes in the transaction metadata.
            const preTokenBalances = txInfo.meta.preTokenBalances || [];
            const postTokenBalances = txInfo.meta.postTokenBalances || [];
            // Helper function: find the token balance entry for the wallet & token mint.
            const findBalance = (balances: any[]) =>
                balances.find(balance => balance.owner === this.wallet.getAddress() && balance.mint === outputMint);
            const preBalanceEntry = findBalance(preTokenBalances);
            const postBalanceEntry = findBalance(postTokenBalances);
            const preBalance = preBalanceEntry ? preBalanceEntry.uiTokenAmount.uiAmount : 0;
            const postBalance = postBalanceEntry ? postBalanceEntry.uiTokenAmount.uiAmount : 0;
            actualOutputAmount = postBalance - preBalance;
        }
        return actualOutputAmount;
    }

    async getQuote(params: JupiterQuoteParams): Promise<JupiterQuoteResponse> {
        const { inputMint, outputMint, amount, slippageBps = 50 } = params;

        const queryParams = new URLSearchParams({
            inputMint,
            outputMint,
            amount: amount.toString(),
            slippageBps: slippageBps.toString(),
        });

        const response = await fetch(`${this.JUPITER_API_URL}quote?${queryParams}`);

        if (!response.ok) {
            throw new Error(`Jupiter API error: ${response.statusText}`);
        }

        return response.json();
    }

    async getSerializedTransaction(quote: JupiterQuoteResponse, walletAddress: string): Promise<SwapResponse> {
        const body: SwapRequestBody = {
            quoteResponse: quote,
            userPublicKey: walletAddress,
            // Optimize for transaction landing
            dynamicComputeUnitLimit: true,
            dynamicSlippage: true,
            prioritizationFeeLamports: {
                priorityLevelWithMaxLamports: {
                    maxLamports: 1000000,
                    priorityLevel: 'veryHigh',
                },
            },
        };

        const response = await fetch(`${this.JUPITER_API_URL}swap`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`Jupiter API error: ${response.statusText}`);
        }

        return response.json();
    }
}
