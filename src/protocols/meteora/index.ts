import { IDEXProtocol, SwapParams, LiquidityParams, Transaction, SupportedChain } from "../../types";
import { EdwinSolanaWallet } from "../../edwin-core/providers/solana_wallet";
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { Keypair, PublicKey, sendAndConfirmTransaction, SendTransactionError, ComputeBudgetProgram, VersionedTransaction } from "@solana/web3.js";
import BN from 'bn.js';

interface MeteoraPoolResult {
    pairs: MeteoraPool[];
}

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

    async getPools(params: LiquidityParams, limit: number = 10): Promise<MeteoraPool[]> {
        const { asset, assetB } = params;
        if (!asset || !assetB) {
            throw new Error("Asset A and Asset B are required for Meteora getPools");
        }
        const response = await fetch(`https://dlmm-api.meteora.ag/pair/all_with_pagination?search_term=${asset}-${assetB}&limit=${limit}`);
        const result: MeteoraPoolResult = await response.json();
        if (!result.pairs) {
            throw new Error(`No pool found for ${asset}-${assetB}`);
        }
        return result.pairs;
    }

    private async calculateAmounts(amount: string, amountB: string, activeBinPricePerToken: string, dlmmPool: DLMM): Promise<[BN, BN]> {
        let totalXAmount;
        let totalYAmount;

        if (amount === "auto" && amountB === "auto") {
            throw new Error("Amount for both first asset and second asset cannot be 'auto' for Meteora liquidity provision");
        } else if (!amount || !amountB) {
            throw new Error("Both amounts must be specified for Meteora liquidity provision");
        }

        if (amount === "auto") {
            // Calculate amount based on amountB
            if (!isNaN(Number(amountB))) {
                totalXAmount = new BN (Number(amountB) / Number(activeBinPricePerToken) * 10 ** (dlmmPool.tokenX.decimal));
                totalYAmount = new BN(Number(amountB) * 10 ** dlmmPool.tokenY.decimal);
            } else {
                throw new Error("Invalid amountB value for second token for Meteora liquidity provision");
            }
        } else if (amountB === "auto") {
            // Calculate amountB based on amount
            if (!isNaN(Number(amount))) {
                totalXAmount = new BN(Number(amount) * 10 ** dlmmPool.tokenX.decimal);
                totalYAmount = new BN(Number(amount) * Number(activeBinPricePerToken) * 10 ** (dlmmPool.tokenY.decimal));
            } else {
                throw new Error("Invalid amount value for first token for Meteora liquidity provision");
            }
        } else {
            // Both are numbers
            if (!isNaN(Number(amount)) && !isNaN(Number(amountB))) {
                totalXAmount = new BN(Number(amount) * 10 ** dlmmPool.tokenX.decimal);
                totalYAmount = new BN(Number(amountB) * 10 ** dlmmPool.tokenY.decimal);
            } else {
                throw new Error("Both amounts must be numbers or 'auto' for Meteora liquidity provision");
            }
        }
        return [totalXAmount, totalYAmount];
    }
    async addLiquidity(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<string> {
        const { chain, amount,amountB, poolAddress } = params;
        console.log(`Calling Meteora protocol to add liquidity to pool ${poolAddress} with ${amount} and ${amountB}`);

        try {
            if (!amount) {
                throw new Error("Amount for Asset A is required for Meteora liquidity provision");
            } else if (!amountB) {
                throw new Error("Amount for Asset B is required for Meteora liquidity provision");
            } else if (!poolAddress) {
                throw new Error("Pool address is required for Meteora liquidity provision");
            } else if (chain !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }
            const connection = walletProvider.getConnection();
            // Get pool address for token pair
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
            
            const activeBin = await dlmmPool.getActiveBin();

            const TOTAL_RANGE_INTERVAL = 10; // 10 bins on each side of the active bin
            const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
            const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
            
            const activeBinPricePerToken = dlmmPool.fromPricePerLamport(Number(activeBin.price));
            console.log("🚀 ~ addLiquidity ~ activeBinPricePerToken:", activeBinPricePerToken)
            console.log(activeBin.price);

            const [totalXAmount, totalYAmount] = await this.calculateAmounts(amount, amountB, activeBinPricePerToken, dlmmPool);

            const newBalancePosition = Keypair.generate();
            console.log("totalXAmount", totalXAmount.toString());
            console.log("totalYAmount", totalYAmount.toString());
            // Future features: support increasing liquidity for existing positions
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

            // Add compute units to transaction after creation
            createPositionTx.instructions[0] =  ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 200000 });

            const createBalancePositionTxHash = await sendAndConfirmTransaction(
                connection,
                createPositionTx,
                [walletProvider.getSigner(), newBalancePosition]
              );
            return "amountX: " + totalXAmount.toString() + " amountY: \n" + totalYAmount.toString(), "TX Hash: " + createBalancePositionTxHash;
            // return createBalancePositionTxHash as `0x${string}`;
        } catch (error: unknown) {
            if (error instanceof SendTransactionError) {
                console.error("Transaction logs:", error.getLogs(walletProvider.getConnection()));
            }
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
            // Future features:
            // support removing liquidity for existing positions
            // support closing positions
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
