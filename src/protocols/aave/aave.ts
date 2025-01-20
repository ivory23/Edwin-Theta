import { Pool, EthereumTransactionTypeExtended } from "@aave/contract-helpers";
import { ethers, providers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import {
    type ILendingProtocol,
    type SupplyParams,
    type WithdrawParams,
} from "../../types";
import type { Transaction } from "../../types";

import { AaveV3Base } from "@bgd-labs/aave-address-book";
import { EdwinEVMWallet } from "../../edwin-core/providers/evm_wallet";

export class AaveProtocol implements ILendingProtocol {
    private async submitTransaction(
        provider: providers.Provider,
        wallet: ethers.Wallet,
        tx: EthereumTransactionTypeExtended
    ): Promise<Transaction> {
        console.log("Preparing to send transaction...");
        const extendedTxData = await tx.tx();
        console.log("Got extended transaction data");
        const { from, ...txData } = extendedTxData;
        console.log(`Transaction from address: ${from}`);

        console.log("Sending transaction...");
        const txResponse = await wallet.sendTransaction(txData);
        console.log(`Transaction sent with hash: ${txResponse.hash}`);

        return {
            hash: txResponse.hash as `0x${string}`,
            from: from as `0x${string}`,
            to: txData.to as `0x${string}`,
            value: BigInt(txData.value || 0),
        };
    }

    async supply(params: SupplyParams): Promise<Transaction> {
        const { chain, amount, asset, data, walletProvider } = params;
        console.log(
            `Calling the inner AAVE logic to supply ${amount} ${asset}`
        );

        try {
            if (!(walletProvider instanceof EdwinEVMWallet)) {
                throw new Error('Wallet provider is not an instance of EdwinEVMWallet');
            }
            const evmWallet = walletProvider as EdwinEVMWallet;
            evmWallet.switchChain(chain);
            console.log(`Switched to chain: ${chain}`);

            const walletClient = evmWallet.getWalletClient(chain);
            console.log(`Got wallet client for chain: ${chain}`);

            // Log the RPC URL from the transport
            console.log(`Transport RPC URL: ${walletClient.transport.url}`);
            const provider = new providers.JsonRpcProvider(walletClient.transport.url);
            console.log(`Created ethers provider`);

            if (!process.env.EVM_PRIVATE_KEY) {
                throw new Error("EVM_PRIVATE_KEY is not set");
            }
            const ethers_wallet = new ethers.Wallet(
                process.env.EVM_PRIVATE_KEY,
                provider
            );
            ethers_wallet.connect(provider);
            console.log(`Created ethers wallet`);

            const pool = new Pool(ethers_wallet.provider, {
                POOL: AaveV3Base.POOL,
                WETH_GATEWAY: AaveV3Base.WETH_GATEWAY,
            });
            // todo extend to more chains
            console.log(
                `Initialized Aave Pool with contract: ${AaveV3Base.POOL}`
            );

            // Get the reserve address for the input asset
            const assetKey = Object.keys(AaveV3Base.ASSETS).find(
                (key) => key.toLowerCase() === asset.toLowerCase()
            );

            if (!assetKey) {
                throw new Error(`Unsupported asset: ${asset}`);
            }
            // check assetKey is in ASSETS
            if (!AaveV3Base.ASSETS[assetKey as keyof typeof AaveV3Base.ASSETS]) {
                throw new Error(`Unsupported asset: ${asset}`);
            }
            const reserve = AaveV3Base.ASSETS[assetKey as keyof typeof AaveV3Base.ASSETS].UNDERLYING;

            if (!reserve) {
                throw new Error(`Unsupported asset: ${asset}`);
            }
            const decimals = AaveV3Base.ASSETS[assetKey as keyof typeof AaveV3Base.ASSETS].decimals;
            // Convert amount to proper decimals
            const amountInWei = parseUnits(amount, decimals);
            console.log(
                `Converted amount ${amount} to wei: ${amountInWei.toString()}`
            );

            console.log(`Reserve: ${reserve}`);
            // Prepare supply parameters
            const supplyParams = {
                user: walletClient.account?.address as string,
                reserve: reserve, // The address of the reserve
                amount: amount,
            };

            console.log(`Prepared supply params:`, supplyParams);

            // Get supply transaction
            const txs = await pool.supply(supplyParams);

            console.log(`Generated ${txs.length} supply transaction(s)`);

            // Send some example read transaction to assert the provider and the connection
            const balance = await provider.getBalance(
                walletClient.account?.address as string
            );
            console.log(`Balance: ${balance}`);

            // Submit the transactions
            if (txs && txs.length > 0) {
                console.log(`Submitting supply transactions`);
                const results = [];
                for (const tx of txs) {
                    const result = await this.submitTransaction(
                        ethers_wallet.provider,
                        ethers_wallet,
                        tx
                    );
                    results.push(result);
                }
                // Return the last transaction
                return results[results.length - 1];
            }

            throw new Error("No transaction generated from Aave Pool");
        } catch (error: unknown) {
            console.error("Aave supply error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Aave supply failed: ${message}`);
        }
    }

    async withdraw(params: WithdrawParams): Promise<Transaction> {
        const { amount, asset } = params;
        console.log(
            `Calling the inner AAVE logic to withdraw ${amount} ${asset}`
        );
        try {
            throw new Error("Not implemented");
        } catch (error: unknown) {
            console.error("Aave withdraw error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Aave withdraw failed: ${message}`);
        }
    }
}
