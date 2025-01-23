import { Transaction as SolanaTransaction } from "@solana/web3.js";
import { VersionedTransaction } from "@solana/web3.js";

import { Transaction, ILendingProtocol, SupplyParams, SupportedChain, WithdrawParams } from "../../types";
import { EdwinSolanaWallet } from "../../edwin-core/providers/solana_wallet";


export class LuloProtocol implements ILendingProtocol {
    public supportedChains: SupportedChain[] = ["solana"];

    async supply(params: SupplyParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        try {
            const response = await fetch(
                `https://api.flexlend.fi/generate/account/deposit?priorityFee=50000`,
                {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-wallet-pubkey": walletProvider.getPublicKey().toBase58(),
                      "x-api-key": process.env.FLEXLEND_API_KEY!,
                    },
                    body: JSON.stringify({
                      owner: walletProvider.getPublicKey().toBase58(),
                      mintAddress: params.asset, // This should be the mint address of the asset
                      depositAmount: params.amount.toString(),
                    }),
                  },
            );
            console.log(response);
            const {
                data: { transactionMeta },
            } = await response.json();

            // Deserialize the transaction
            const luloTxn = VersionedTransaction.deserialize(
                Buffer.from(transactionMeta[0].transaction, "base64"),
            );
        
            // Get a recent blockhash and set it
            const connection = walletProvider.getConnection();
            const { blockhash } = await connection.getLatestBlockhash();
            luloTxn.message.recentBlockhash = blockhash;
        
            // Sign and send transaction
            walletProvider.signTransaction(luloTxn);
        
            const signature = await connection.sendTransaction(luloTxn, {
                preflightCommitment: "confirmed",
                maxRetries: 3,
            });

            // Wait for confirmation using the latest strategy
            const latestBlockhash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            });

            return {
                hash: signature as `0x${string}`,
                from: walletProvider.getPublicKey().toBase58() as `0x${string}`,
                to: transactionMeta[0].to as `0x${string}`,
                value: Number(params.amount)
            };
        } catch (error: any) {
            throw new Error(`Lulo supply failed: ${error.message}`);
        }
    }

    async withdraw(params: WithdrawParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        try {
            const response = await fetch(
                `https://blink.lulo.fi/actions/withdraw?amount=${params.amount}&symbol=${params.asset}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json", 
                    },
                    body: JSON.stringify({
                        account: walletProvider.getPublicKey().toBase58(),
                    }),
                }
            );

            const data = await response.json();
            const solTx = SolanaTransaction.from(Buffer.from(data.transaction, "base64"));
            
            return {
                hash: data.signature as `0x${string}`,
                from: walletProvider.getPublicKey().toBase58() as `0x${string}`, 
                to: data.to as `0x${string}`,
                value: Number(params.amount)
            };
        } catch (error: any) {
            throw new Error(`Lulo withdraw failed: ${error.message}`);
        }
    }
}
