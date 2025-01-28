import { IDEXProtocol, LiquidityParams, SupportedChain } from "../../types";
import { EdwinSolanaWallet } from "../../edwin-core/providers/solana_wallet";
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { Keypair, PublicKey, SendTransactionError } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

interface MeteoraPoolResult {
    pairs: MeteoraPool[];
}

interface MeteoraPool {
    address: string;
    name: string;
    bin_step: number;
    base_fee_percentage: string;
    max_fee_percentage: string;
    protocol_fee_percentage: string;
    liquidity: string;
    fees_24h: number;
    trade_volume_24h: number;
    current_price: number;
    apr: number;
}

export class MeteoraProtocol implements IDEXProtocol {
    private static readonly BASE_URL = "https://dlmm-api.meteora.ag";
    public supportedChains: SupportedChain[] = ["solana"];

    async swap(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<string> {
        const { asset, chain, amount, poolAddress } = params;
        try {
            if (!amount || !poolAddress) {
                throw new Error("Amount and pool address are required for Meteora swap");
            }
            if (chain.toLowerCase() !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }

            const connection = walletProvider.getConnection();
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));

            // Determine swap direction
            const swapYtoX = asset === dlmmPool.tokenY.publicKey.toString();
            const swapAmount = new BN(Number(amount) * 10 ** (swapYtoX ? dlmmPool.tokenY.decimal : dlmmPool.tokenX.decimal));

            // Get swap quote
            const binArrays = await dlmmPool.getBinArrayForSwap(swapYtoX);
            const swapQuote = await dlmmPool.swapQuote(
                swapAmount,
                swapYtoX,
                new BN(10), // slippage tolerance
                binArrays
            );

            // Execute swap
            const swapTx = await dlmmPool.swap({
                inToken: dlmmPool.tokenX.publicKey,
                outToken: dlmmPool.tokenY.publicKey,
                binArraysPubkey: swapQuote.binArraysPubkey,
                inAmount: swapAmount,
                lbPair: dlmmPool.pubkey,
                user: walletProvider.getPublicKey(),
                minOutAmount: swapQuote.minOutAmount,
            });

            const prioritizedTx = await walletProvider.getIncreasedTransactionPriorityFee(connection, swapTx);
            const signature = await walletProvider.sendTransaction(connection, prioritizedTx, [walletProvider.getSigner()]);
            await walletProvider.waitForConfirmationGracefully(connection, signature);
            
            return signature;
        } catch (error: unknown) {
            console.error("Meteora swap error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Meteora swap failed: ${message}`);
        }
    }

    async getPositions(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<any> {
        const { poolAddress } = params;
        try {
            const connection = walletProvider.getConnection();
            if (poolAddress) {
                const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
                const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(walletProvider.getPublicKey());
                if (!userPositions || userPositions.length === 0) {
                    return [];
                }
                const binData = userPositions[0].positionData.positionBinData;
                return binData;
            } else {
                const dlmmPools = await DLMM.getAllLbPairPositionsByUser(connection, walletProvider.getPublicKey());
                return dlmmPools;
            }
        } catch (error: unknown) {
            console.error("Meteora getPositions error:", error);
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Meteora getPositions failed: ${message}`);
        }
    }

    async getPools(params: LiquidityParams, limit: number = 10): Promise<MeteoraPool[]> {
        const { asset, assetB } = params;
        if (!asset || !assetB) {
            throw new Error("Asset A and Asset B are required for Meteora getPools");
        }
        const response = await fetch(`${MeteoraProtocol.BASE_URL}/pair/all_with_pagination?search_term=${asset}-${assetB}&limit=${limit}`);
        const result: MeteoraPoolResult = await response.json();
        if (!result.pairs) {
            throw new Error(`No pool found for ${asset}-${assetB}`);
        }

        return result.pairs.map(pool => ({
            address: pool.address,
            name: pool.name,
            bin_step: pool.bin_step,
            base_fee_percentage: pool.base_fee_percentage,
            max_fee_percentage: pool.max_fee_percentage,
            protocol_fee_percentage: pool.protocol_fee_percentage,
            liquidity: pool.liquidity,
            fees_24h: pool.fees_24h,
            trade_volume_24h: pool.trade_volume_24h,
            current_price: pool.current_price,
            apr: pool.apr
        }));
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
        const { chain, amount, amountB, poolAddress } = params;
        console.log(`Calling Meteora protocol to add liquidity to pool ${poolAddress} with ${amount} and ${amountB}`);

        try {
            if (!amount) {
                throw new Error("Amount for Asset A is required for Meteora liquidity provision");
            } else if (!amountB) {
                throw new Error("Amount for Asset B is required for Meteora liquidity provision");
            } else if (!poolAddress) {
                throw new Error("Pool address is required for Meteora liquidity provision");
            } else if (chain.toLowerCase() !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }

            const connection = walletProvider.getConnection();
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));

            // Check for existing positions
            const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(walletProvider.getPublicKey());
            const existingPosition = userPositions?.[0];

            const activeBin = await dlmmPool.getActiveBin();
            const TOTAL_RANGE_INTERVAL = 10;
            const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
            const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;
            
            const activeBinPricePerToken = dlmmPool.fromPricePerLamport(Number(activeBin.price));
            const [totalXAmount, totalYAmount] = await this.calculateAmounts(amount, amountB, activeBinPricePerToken, dlmmPool);

            let tx;
            let newBalancePosition;
            if (existingPosition) {
                // Add to existing position
                tx = await dlmmPool.addLiquidityByStrategy({
                    positionPubKey: existingPosition.publicKey,
                    user: walletProvider.getPublicKey(),
                    totalXAmount,
                    totalYAmount,
                    strategy: {
                        maxBinId,
                        minBinId,
                        strategyType: StrategyType.SpotBalanced,
                    },
                });
            } else {
                // Create new position
                newBalancePosition = Keypair.generate();
                tx = await dlmmPool.initializePositionAndAddLiquidityByStrategy({
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
            }

            const prioritizedTx = await walletProvider.getIncreasedTransactionPriorityFee(connection, tx);
            const signature = await walletProvider.sendTransaction(
                connection, 
                prioritizedTx, 
                existingPosition ? [walletProvider.getSigner()] : [walletProvider.getSigner(), newBalancePosition as Keypair]
            );

            const confirmation = await walletProvider.waitForConfirmationGracefully(connection, signature);
            if (confirmation.err) {
                throw new Error(`Transaction failed: ${confirmation.err.toString()}`);
            }

            return signature;
        } catch (error: unknown) {
            if (error instanceof SendTransactionError) {
                const logs = await error.getLogs(walletProvider.getConnection());
                console.error("Transaction failed with logs:", logs);
                throw new Error(`Transaction failed: ${error.message}\nLogs: ${logs?.join('\n')}`);
            }
            throw error;
        }
    }

    async removeLiquidity(params: LiquidityParams, walletProvider: EdwinSolanaWallet): Promise<string> {
        const { chain, poolAddress } = params;
        try {
            if (chain !== "solana") {
                throw new Error("Meteora protocol only supports Solana");
            }
            if (!poolAddress) {
                throw new Error("Pool address is required for Meteora liquidity removal");
            }

            const connection = walletProvider.getConnection();
            const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
            
            // Get user positions for this pool
            const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(walletProvider.getPublicKey());
            if (!userPositions || userPositions.length === 0) {
                throw new Error("No positions found in this pool");
            }

            // Get all bin IDs where user has liquidity
            const binIdsToRemove = userPositions[0].positionData.positionBinData.map(bin => bin.binId);
            
            // Remove 100% of liquidity from all bins
            const removeLiquidityTx = await dlmmPool.removeLiquidity({
                position: userPositions[0].publicKey,
                user: walletProvider.getPublicKey(),
                binIds: binIdsToRemove,
                bps: new BN(100 * 100), // 100%
                shouldClaimAndClose: true
            });

            // Handle multiple transactions if needed
            if (Array.isArray(removeLiquidityTx)) {
                for (const tx of removeLiquidityTx) {
                    const prioritizedTx = await walletProvider.getIncreasedTransactionPriorityFee(connection, tx);
                    const signature = await walletProvider.sendTransaction(connection, prioritizedTx, [walletProvider.getSigner()]);
                    await walletProvider.waitForConfirmationGracefully(connection, signature);
                }
                return "Multiple transactions completed";
            } else {
                const newBalancePosition = Keypair.generate();
                const prioritizedTx = await walletProvider.getIncreasedTransactionPriorityFee(connection, removeLiquidityTx);
                const signature = await walletProvider.sendTransaction(
                    connection, 
                    prioritizedTx, 
                    [walletProvider.getSigner(), newBalancePosition]
                );
                await walletProvider.waitForConfirmationGracefully(connection, signature);
                return signature;
            }
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
