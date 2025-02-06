import { ISwapProtocol, SupportedChain } from '../../types';
import { VersionedTransaction } from '@solana/web3.js';
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
    quote: JupiterQuoteResponse;
}

export class JupiterProtocol implements ISwapProtocol {
    supportedChains: SupportedChain[] = ['solana'];
    JUPITER_API_URL = 'https://api.jup.ag/swap/v1/';

    private wallet: EdwinSolanaWallet;

    constructor(wallet: EdwinSolanaWallet) {
        this.wallet = wallet;
    }

    async swap(params: SwapParams): Promise<string> {
        const { quote } = params;

        // 1. Get serialized transaction
        const swapResponse = await this.getSerializedTransaction(quote, this.wallet.getPublicKey().toString());

        // 2. Deserialize the transaction
        const transaction = VersionedTransaction.deserialize(Buffer.from(swapResponse.swapTransaction, 'base64'));

        // 3. Sign the transaction
        this.wallet.signTransaction(transaction);

        // 4. Serialize and send the transaction
        const rawTransaction = transaction.serialize();
        const connection = this.wallet.getConnection();
        // 5. Send transaction with optimized parameters
        const signature = await connection.sendRawTransaction(rawTransaction, {
            maxRetries: 2,
            skipPreflight: true,
        });

        // 6. Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'finalized');

        if (confirmation.value.err) {
            throw new Error(
                `Transaction failed: ${JSON.stringify(confirmation.value.err)}\n` +
                    `https://solscan.io/tx/${signature}/`
            );
        }
        return signature;
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
