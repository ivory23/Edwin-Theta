import { IDEXProtocol, SwapParams, LiquidityParams, Transaction, SupportedChain } from "../../types";
import { EdwinSolanaWallet } from "../../edwin-core/providers/solana_wallet";
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { Keypair, PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import BN from 'bn.js';


interface MeteoraPool {
    address: string;
    name: string;
    mint_x: string;
    mint_y: string;
    reserve_x: string;
    reserve_y: string;
    reserve_x_amount: number;
    reserve_y_amount: number;
    bin_step: number;
    base_fee_percentage: string;
    max_fee_percentage: string;
    protocol_fee_percentage: string;
    liquidity: string;
    reward_mint_x: string;
    reward_mint_y: string;
    fees_24h: number;
    today_fees: number;
    trade_volume_24h: number;
    cumulative_trade_volume: string;
    cumulative_fee_volume: string;
    current_price: number;
    apr: number;
    apy: number;
    farm_apr: number;
    farm_apy: number;
    hide: boolean;
}



export class MeteoraProtocol implements IDEXProtocol {
    public supportedChains: SupportedChain[] = ["solana"];

    private async getPoolAddress(tokenA: string, tokenB: string): Promise<MeteoraPool> {
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

        return pool;
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

    async getPools(tokenA: string, tokenB: string, limit: number = 10): Promise<MeteoraPool[]> {
        const response = await fetch(`https://dlmm-api.meteora.ag/pair/all_with_pagination?search_term=${tokenA}-${tokenB}&limit=${limit}`);
        const pools: MeteoraPool[] = await response.json();
        if (!pools) {
            throw new Error(`No pool found for ${tokenA}-${tokenB}`);
        }
        return pools;
    }
    
    async addLiquidity(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<string> {
        const { chain, asset, amount, assetB, amountB } = params;
        console.log(`Calling Meteora protocol to add liquidity ${amount} ${asset} and ${amountB} ${assetB}`);

        try {
            if (chain !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }
            const connection = walletProvider.getConnection();
            // Get pool address for token pair
            const pool = await this.getPoolAddress(asset, assetB);
            console.log("🚀 ~ addLiquidity ~ pool:", pool.name);
            console.log("🚀 ~ addLiquidity ~ pool:", pool.address);
            const dlmmPool = await DLMM.create(connection, new PublicKey(pool.address));
            
            const activeBin = await dlmmPool.getActiveBin();

            const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
            const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
            const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
            
            const activeBinPricePerToken = dlmmPool.fromPricePerLamport(Number(activeBin.price));
            console.log("🚀 ~ addLiquidity ~ activeBinPricePerToken:", activeBinPricePerToken)
            console.log(activeBin.price);
            const totalXAmount = new BN(100);
            const totalYAmount = totalXAmount.mul(new BN(Number(activeBinPricePerToken)));
            const newBalancePosition = Keypair.generate();
            console.log("totalXAmount", totalXAmount.toString());
            console.log("totalYAmount", totalYAmount.toString());

            // const createPositionTx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
            //     positionPubKey: newBalancePosition.publicKey,
            //     user: walletProvider.getPublicKey(),
            //     totalXAmount,
            //     totalYAmount,
            //     strategy: {
            //         maxBinId,
            //         minBinId,
            //         strategyType: StrategyType.SpotBalanced,
            //     },
            // });

            // const createBalancePositionTxHash = await sendAndConfirmTransaction(
            //     connection,
            //     createPositionTx,
            //     [walletProvider.getSigner(), newBalancePosition]
            //   );
            return "amountX: " + totalXAmount.toString() + " amountY: " + totalYAmount.toString();
            // return createBalancePositionTxHash as `0x${string}`;
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
