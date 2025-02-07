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
  // You can override this default fee (in microLamports) by setting the env variable JITO_PRIORITY_FEE
  private static readonly DEFAULT_PRIORITY_FEE = 10_000;

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
    const tokenAccount = await connection.getTokenAccountBalance(tokenAddress);
    return tokenAccount.value.uiAmount || 0;
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Transaction confirmation timed out');
  }

  /**
   * Sends a signed transaction using Jito's low latency transaction send API.
   *
   * This method:
   *  1. Uses the provided connection to fetch a recent blockhash.
   *  2. Compiles the transaction to a VersionedTransaction, signs it,
   *     and then serializes it to base64.
   *  3. Posts the signed transaction to the Jito RPC endpoint using the "jito_sendTransaction" JSON-RPC method.
   *
   * Ensure you have set process.env.JITO_RPC_URL to your Jito RPC endpoint.
   */
  async sendTransaction(
    connection: Connection,
    transaction: Transaction,
    signers: Keypair[]
  ): Promise<string> {
    // Fetch a fresh blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;

    // Compile the transaction message and create a versioned transaction
    const messageV0 = transaction.compileMessage();
    const versionedTx = new VersionedTransaction(messageV0);
    versionedTx.sign(signers);

    // Serialize the transaction and encode it as base64
    const serializedTx = versionedTx.serialize();
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
            encoding: 'base64'
          }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.result; // Transaction signature returned by Jito
  }

  /**
   * Returns a new Transaction that includes ComputeBudget instructions
   * to set a fixed priority fee for faster processing.
   *
   * With Jito, you no longer need to call an external service (like Helius)
   * to get a fee estimate. Instead, we simply use a fixed fee – either from
   * an environment variable (JITO_PRIORITY_FEE) or a default value.
   */
  async getIncreasedTransactionPriorityFee(
    connection: Connection,
    transaction: Transaction
  ): Promise<Transaction> {
    // Filter out any existing compute budget instructions
    const updatedInstructions = transaction.instructions.filter(
      (ix) => ix.programId.toBase58() !== ComputeBudgetProgram.programId.toBase58()
    );

    const { blockhash } = await connection.getLatestBlockhash('finalized');
    if (!blockhash) {
      throw new Error('Failed to get latest blockhash');
    }

    // Use a fixed (or environment–configured) priority fee
    const priorityFee = process.env.JITO_PRIORITY_FEE
      ? Number(process.env.JITO_PRIORITY_FEE)
      : EdwinSolanaWallet.DEFAULT_PRIORITY_FEE;

    // Build a new transaction with the compute budget instructions first
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