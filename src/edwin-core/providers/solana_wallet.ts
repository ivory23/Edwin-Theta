import bs58 from "bs58";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
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
        return new Connection(customRpcUrl || process.env.SOLANA_RPC_URL!, 'confirmed');
    }

    signTransaction(transaction: VersionedTransaction) {
        transaction.sign([this.wallet]);
    }
}