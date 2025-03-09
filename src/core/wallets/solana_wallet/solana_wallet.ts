import bs58 from 'bs58';
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    VersionedTransaction,
    SystemProgram,
    Commitment,
    Finality,
} from '@solana/web3.js';
import { TokenListProvider } from '@solana/spl-token-registry';
import { EdwinWallet } from '../wallet';
import { JitoJsonRpcClient } from './jito_client';
import edwinLogger from '../../../utils/logger';
import { withRetry } from '../../../utils';

const NATIVE_SOL_MINT = 'So11111111111111111111111111111111111111112';

interface TokenInfo {
    symbol: string;
    address: string;
}

interface TokenBalance {
    owner?: string;
    mint?: string;
    uiTokenAmount: {
        uiAmount: number | null;
    };
}

interface SignatureStatus {
    err: unknown;
    confirmationStatus?: 'confirmed' | 'finalized' | 'processed';
}

interface JitoResponse {
    error?: {
        message: string;
    };
    result: string;
}

export class EdwinSolanaWallet extends EdwinWallet {
    private wallet: Keypair;
    private wallet_address: PublicKey;

    constructor(protected privateKey: string) {
        super();
        this.wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
        this.wallet_address = this.wallet.publicKey;
    }

    getPublicKey(): PublicKey {
        return this.wallet_address;
    }

    getConnection(customRpcUrl?: string, commitment: Commitment = 'confirmed'): Connection {
        return new Connection(
            customRpcUrl || process.env.SOLANA_RPC_URL! || 'https://api.mainnet-beta.solana.com',
            commitment
        );
    }

    signTransaction(transaction: VersionedTransaction) {
        transaction.sign([this.wallet]);
    }

    getAddress(): string {
        return this.wallet_address.toBase58();
    }

    getSigner(): Keypair {
        return this.wallet;
    }

    async getTokenAddress(symbol: string): Promise<string | null> {
        const tokens = await new TokenListProvider().resolve();
        const tokenList = tokens.filterByChainId(101).getList();

        const token = tokenList.find((t: TokenInfo) => t.symbol.toLowerCase() === symbol.toLowerCase());
        return token ? token.address : null;
    }

    async getBalance(mintAddress?: string, commitment: Commitment = 'confirmed'): Promise<number> {
        const connection = this.getConnection();

        if (!mintAddress || mintAddress === NATIVE_SOL_MINT) {
            return (await connection.getBalance(this.wallet_address, commitment)) / LAMPORTS_PER_SOL;
        }

        const tokenMint = new PublicKey(mintAddress);
        const tokenAccounts = await connection.getTokenAccountsByOwner(this.wallet_address, {
            mint: tokenMint,
        });

        if (tokenAccounts.value.length === 0) {
            return 0;
        }

        const tokenAccount = tokenAccounts.value[0];
        const tokenAccountBalance = await connection.getTokenAccountBalance(tokenAccount.pubkey, commitment);
        return tokenAccountBalance.value.uiAmount || 0;
    }

    // Function to gracefully wait for transaction confirmation
    async waitForConfirmationGracefully(
        connection: Connection,
        signature: string,
        timeout: number = 120000 // Timeout in milliseconds
    ): Promise<SignatureStatus> {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            // Fetch the status of the transaction
            const { value } = await connection.getSignatureStatus(signature, {
                searchTransactionHistory: true,
            });
            edwinLogger.info('🚀 ~ waitForConfirmationGracefully ~ value:', value);
            if (value) {
                // Check for transaction error
                if (value.err) {
                    throw new Error(`Transaction failed: ${JSON.stringify(value.err)}`);
                }
                if (value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized') {
                    return value; // Transaction is confirmed or finalized
                }
            }

            // Wait for a short interval before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Transaction confirmation timed out');
    }

    /**
     * Sends a signed transaction using Jito's low latency transaction send API.
     * Includes a tip to Jito validators to incentivize inclusion.
     *
     * This method:
     *  1. Uses the provided connection to fetch a recent blockhash
     *  2. Adds a tip instruction to a Jito validator
     *  3. Signs and sends the transaction via Jito's API
     */
    async sendTransaction(connection: Connection, transaction: Transaction, signers: Keypair[]): Promise<string> {
        // Initialize Jito client
        const jitoClient = new JitoJsonRpcClient(
            process.env.JITO_RPC_URL || 'https://mainnet.block-engine.jito.wtf/api/v1',
            process.env.JITO_UUID
        );

        // Get a random Jito tip account
        const jitoTipAccount = new PublicKey(await jitoClient.getRandomTipAccount());
        const jitoTipAmount = 1000; // 0.000001 SOL tip

        // Add Jito tip instruction to the transaction
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: this.wallet_address,
                toPubkey: jitoTipAccount,
                lamports: jitoTipAmount,
            })
        );

        // Fetch a fresh blockhash
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = this.wallet_address;

        // Sign the transaction with all required signers
        transaction.sign(...signers);

        // Serialize the transaction and encode it as base64
        const serializedTx = transaction.serialize();
        const base64Tx = Buffer.from(serializedTx).toString('base64');

        // Use your Jito RPC URL (set via env variable) or default to a known endpoint
        const jitoRpcUrl = process.env.JITO_RPC_URL || 'https://mainnet.block-engine.jito.wtf';
        const jitoApiEndpoint = `${jitoRpcUrl}/api/v1/transactions`;

        const response = await fetch(jitoApiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'sendTransaction',
                params: [
                    base64Tx,
                    {
                        encoding: 'base64',
                    },
                ],
            }),
        });

        const data = (await response.json()) as JitoResponse;
        if (data.error) {
            throw new Error(data.error.message);
        }
        return data.result; // Transaction signature returned by Jito
    }

    async getTransactionTokenBalanceChange(signature: string, asset: string, commitment: Finality = 'confirmed') {
        //    - For SOL, check lamport balance changes (and add back the fee).
        //    - For SPL tokens, check the token account balance changes.
        let actualOutputAmount: number;
        const mint = await this.getTokenAddress(asset);
        if (!mint) {
            throw new Error(`Token ${asset} not found`);
        }
        const connection = this.getConnection();
        // Fetch the parsed transaction details (make sure to set the proper options)
        const txInfo = await withRetry(
            () =>
                connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                    commitment: commitment,
                }),
            'Get parsed transaction'
        );
        if (!txInfo || !txInfo.meta) {
            throw new Error('Could not fetch transaction details');
        }
        // Check if the output asset is SOL. This check may vary depending on your wallet's representation.
        if (asset.toLowerCase() === 'sol') {
            // SOL changes are reflected in lamport balances.
            const accountKeys = txInfo.transaction.message.accountKeys;
            const walletIndex = accountKeys.findIndex(key => key.pubkey.toString() === this.getAddress());
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
            const findBalance = (balances: TokenBalance[]) =>
                balances.find(
                    balance =>
                        balance.owner && balance.mint && balance.owner === this.getAddress() && balance.mint === mint
                );
            const preBalanceEntry = findBalance(preTokenBalances);
            const postBalanceEntry = findBalance(postTokenBalances);
            const preBalance = preBalanceEntry?.uiTokenAmount.uiAmount ?? 0;
            const postBalance = postBalanceEntry?.uiTokenAmount.uiAmount ?? 0;
            actualOutputAmount = (postBalance || 0) - (preBalance || 0);
        }
        return actualOutputAmount;
    }
}
