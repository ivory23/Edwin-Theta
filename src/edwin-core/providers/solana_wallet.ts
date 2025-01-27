import bs58 from "bs58";
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { EdwinWallet } from "./wallet";

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

    getConnection(customRpcUrl?: string): Connection {
        return new Connection(customRpcUrl || process.env.SOLANA_RPC_URL! || 'https://api.mainnet-beta.solana.com', 'confirmed');
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

    // Function to gracefully wait for transaction confirmation
    async waitForConfirmationGracefully(
        connection: Connection,
        signature: string,
        timeout: number = 120000 // Timeout in milliseconds
    ) {
        const startTime = Date.now();
        let status = null;
    
        while (Date.now() - startTime < timeout) {
            // Fetch the status of the transaction
            const { value } = await connection.getSignatureStatus(signature, {
                searchTransactionHistory: true,
            });
            console.log("🚀 ~ waitForConfirmationGracefully ~ value:", value)
            if (value) {
                if (value.confirmationStatus === "confirmed" || value.confirmationStatus === "finalized") {
                    return value; // Transaction is confirmed or finalized
                }
            }
        
            // Wait for a short interval before retrying
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        throw new Error("Transaction confirmation timed out");
    }

    async sendTransaction(connection: Connection, transaction: Transaction, signers: Keypair[]) {
        // Get a fresh blockhash right before sending
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
        transaction.recentBlockhash = blockhash; // Update the blockhash
        
        const messageV0 = transaction.compileMessage();
        const versionedTx = new VersionedTransaction(messageV0);
        versionedTx.sign(signers);
        
        const signature = await connection.sendTransaction(versionedTx, {
            skipPreflight: false,
            maxRetries: 3,
            preflightCommitment: 'confirmed'
        });  
        return signature;
    }

    async getIncreasedTransactionPriorityFee(connection: Connection, transaction: Transaction): Promise<Transaction> {
        const newTransaction = new Transaction();
        const updatedInstructions = transaction.instructions.filter(
            (ix) => ix.programId.toBase58() !== ComputeBudgetProgram.programId.toBase58()
          );
        updatedInstructions.unshift(
            ComputeBudgetProgram.setComputeUnitLimit({units: 2_000_000}),
            ComputeBudgetProgram.setComputeUnitPrice({microLamports: 200000}),
        );  
        newTransaction.add(...updatedInstructions);
        newTransaction.feePayer = this.wallet_address;
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        if (!blockhash) {
            throw new Error("Failed to get latest blockhash");
        }
        console.log("🚀 ~ addLiquidity ~ blockhash:", blockhash)
        newTransaction.recentBlockhash = blockhash;
        newTransaction.sign(this.wallet);
        return newTransaction;
    }
}