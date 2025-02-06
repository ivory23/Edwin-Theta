import bs58 from 'bs58';
import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    VersionedTransaction,
} from '@solana/web3.js';
import { EdwinWallet } from './wallet';

export class EdwinSolanaWallet extends EdwinWallet {
    private wallet: Keypair;
    private wallet_address: PublicKey;
    private static readonly TRANSACTION_PRIORITY_LEVEL = 'VeryHigh';

    constructor(protected privateKey: string) {
        super();
        this.wallet = Keypair.fromSecretKey(bs58.decode(privateKey));
        this.wallet_address = this.wallet.publicKey;
    }

    getPublicKey(): PublicKey {
        return this.wallet_address;
    }

    getConnection(customRpcUrl?: string): Connection {
        return new Connection(
            customRpcUrl || process.env.SOLANA_RPC_URL! || 'https://api.mainnet-beta.solana.com',
            'confirmed'
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

    async getBalance(tokenAddress?: PublicKey): Promise<number> {
        const connection = this.getConnection();
        if (!tokenAddress) {
            // Get SOL balance
            return (await connection.getBalance(this.wallet_address)) / LAMPORTS_PER_SOL;
        }
        // Get token balance
        const token_account = await connection.getTokenAccountBalance(tokenAddress);
        return token_account.value.uiAmount || 0;
    }

    async getPriorityFee(transaction: Transaction) {
        const serializedTransaction = bs58.encode(transaction.serialize({ requireAllSignatures: false }));
        const heliusApiKey = process.env.HELIUS_API_KEY;
        if (!heliusApiKey) {
            throw new Error('HELIUS_API_KEY is not set');
        }
        const heliusApiUrl = `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`;
        const response = await fetch(heliusApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'getPriorityFeeEstimate',
                params: [
                    {
                        transaction: serializedTransaction,
                        options: {
                            priorityLevel: EdwinSolanaWallet.TRANSACTION_PRIORITY_LEVEL,
                        },
                    },
                ],
            }),
        });
        const data = await response.json();
        console.log('🚀 ~ getPriorityFee ~ data:', data);
        return Math.max(data.result.priorityFeeEstimate, 10_000);
    }

    // Function to gracefully wait for transaction confirmation
    async waitForConfirmationGracefully(
        connection: Connection,
        signature: string,
        timeout: number = 120000 // Timeout in milliseconds
    ) {
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            // Fetch the status of the transaction
            const { value } = await connection.getSignatureStatus(signature, {
                searchTransactionHistory: true,
            });
            console.log('🚀 ~ waitForConfirmationGracefully ~ value:', value);
            if (value) {
                if (value.confirmationStatus === 'confirmed' || value.confirmationStatus === 'finalized') {
                    return value; // Transaction is confirmed or finalized
                }
            }

            // Wait for a short interval before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Transaction confirmation timed out');
    }

    async sendTransaction(connection: Connection, transaction: Transaction, signers: Keypair[]) {
        // Get a fresh blockhash right before sending
        const { blockhash } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash; // Update the blockhash

        const messageV0 = transaction.compileMessage();
        const versionedTx = new VersionedTransaction(messageV0);
        versionedTx.sign(signers);

        const signature = await connection.sendTransaction(versionedTx, {
            skipPreflight: false,
            maxRetries: 3,
            preflightCommitment: 'confirmed',
        });
        return signature;
    }

    async getIncreasedTransactionPriorityFee(connection: Connection, transaction: Transaction): Promise<Transaction> {
        // Create a new transaction and filter out any existing compute budget instructions
        const updatedInstructions = transaction.instructions.filter(
            ix => ix.programId.toBase58() !== ComputeBudgetProgram.programId.toBase58()
        );

        // Create a temporary transaction for priority fee estimation
        const tempTransaction = new Transaction();
        tempTransaction.add(...updatedInstructions);
        tempTransaction.feePayer = this.wallet_address;

        const { blockhash } = await connection.getLatestBlockhash();
        if (!blockhash) {
            throw new Error('Failed to get latest blockhash');
        }
        tempTransaction.recentBlockhash = blockhash;

        // Get priority fee estimate
        const priorityFee = await this.getPriorityFee(tempTransaction);

        // Create final transaction with all instructions
        const finalTransaction = new Transaction();
        finalTransaction.add(
            ComputeBudgetProgram.setComputeUnitLimit({ units: 2_000_000 }),
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFee }),
            ...updatedInstructions
        );

        finalTransaction.feePayer = this.wallet_address;
        finalTransaction.recentBlockhash = blockhash;

        return finalTransaction;
    }
}
