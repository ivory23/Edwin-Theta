import { IDEXProtocol, SwapParams, LiquidityParams, Transaction, SupportedChain } from "../../types";
import { EdwinSolanaWallet } from "../../edwin-core/providers/solana_wallet";
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { BN } from '@coral-xyz/anchor';


interface MeteoraPool {
    address: string;
    name: string;
    // ... other pool properties
}

export class MeteoraProtocol implements IDEXProtocol {
    public supportedChains: SupportedChain[] = ["solana"];

    private async getPoolAddress(tokenA: string, tokenB: string): Promise<string> {
        const response = await fetch('https://dlmm-api.meteora.ag/pair/all');
        const pools: MeteoraPool[] = await response.json();
        const poolName = `${tokenA}-${tokenB}`;
        const reversedPoolName = `${tokenB}-${tokenA}`;

        const pool = pools.find(p => {
            return p.name.toLowerCase() === poolName.toLowerCase() || p.name.toLowerCase() === reversedPoolName.toLowerCase();
        });

        if (!pool) {
            throw new Error(`No pool found for ${tokenA}-${tokenB}`);
        }

        return pool.address;
    }

    async swap(params: SwapParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        try {
            // TODO: Implement Meteora swap logic
            throw new Error("Meteora swap not implemented");
        } catch (error: unknown) {
            console.error("Meteora swap error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Meteora swap failed: ${message}`);
        }
    }

    async addLiquidity(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        const { chain, asset, amount, assetB, amountB } = params;
        console.log(`Calling Meteora protocol to add liquidity ${amount} ${asset} and ${amountB} ${assetB}`);

        try {
            if (chain !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }
            const connection = walletProvider.getConnection();
            
            console.log("🚀 ~ addLiquidity ~ asset:", asset)
            const a = new BN(1.5);
            const a2 = new BN(parseFloat('1.5'));
            console.log("🚀 ~ addLiquidity ~ assetB:", assetB)
            const b = new BN(parseFloat(amount));
            console.log("🚀 ~ addLiquidity ~ b:", b)

            // Get pool address for token pair
            const poolAddress = await this.getPoolAddress(asset, assetB);
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
            
            const activeBin = await dlmmPool.getActiveBin();

            const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
            const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
            const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
            
            const activeBinPricePerToken = dlmmPool.fromPricePerLamport(Number(activeBin.price));
            const totalXAmount = new BN(amount);
            // const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));
            const totalYAmount = new BN(amountB);
            const newBalancePosition = Keypair.generate();
            
            const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
                positionPubKey: newBalancePosition.publicKey,
                user: walletProvider.getPublicKey(),
                totalXAmount,
                totalYAmount,
                strategy: {
                    maxBinId,
                    minBinId,
                    strategyType: StrategyType.SpotBalanced,
                },
            });

            const createBalancePositionTxHash = await sendAndConfirmTransaction(
                connection,
                createPositionTx,
                [walletProvider.getSigner(), newBalancePosition]
              );
              console.log(
                "🚀 ~ createBalancePositionTxHash:",
                createBalancePositionTxHash
              );

            // TODO: Implement Meteora add liquidity logic
            throw new Error("Meteora add liquidity not implemented");
        } catch (error: unknown) {
            console.error("Meteora add liquidity error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Meteora add liquidity failed: ${message}`);
        }
    }

    async removeLiquidity(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<Transaction> {
        const { chain, amount, asset, assetB } = params;
        console.log(`Calling Meteora protocol to remove liquidity ${amount} ${asset}-${assetB}`);

        try {
            if (chain !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }

            // TODO: Implement Meteora remove liquidity logic
            throw new Error("Meteora remove liquidity not implemented");
        } catch (error: unknown) {
            console.error("Meteora remove liquidity error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Meteora remove liquidity failed: ${message}`);
        }
    }

    async getQuote(params: SwapParams, walletProvider: EdwinSolanaWallet): Promise<string> {
        const { chain, amount, tokenIn, tokenOut } = params;
        console.log(`Getting Meteora quote for ${amount} ${tokenIn} to ${tokenOut}`);

        try {
            // TODO: Implement Meteora quote logic
            throw new Error("Meteora quote not implemented");
        } catch (error: unknown) {
            console.error("Meteora quote error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Meteora quote failed: ${message}`);
        }
    }
}
