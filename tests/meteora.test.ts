import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, expect, it } from 'vitest';
import { safeJsonStringify } from '../src/utils';
import edwinLogger from '../src/utils/logger';
import { calculateAmounts, extractBalanceChanges } from '../src/plugins/meteora/utils';
import DLMM from '@meteora-ag/dlmm';
import { BN } from '@coral-xyz/anchor';
import { EdwinSolanaWallet } from '../src/core/wallets';
import { MeteoraProtocol } from '../src/plugins/meteora/meteoraProtocol';

// Meteora test
describe('Meteora test', () => {
    if (!process.env.SOLANA_PRIVATE_KEY) {
        throw new Error('SOLANA_PRIVATE_KEY is not set');
    }
    const meteora = new MeteoraProtocol(new EdwinSolanaWallet(process.env.SOLANA_PRIVATE_KEY));

    it('test meteora getPools', async () => {
        const results = await meteora.getPools({
            asset: 'sol',
            assetB: 'usdc',
        });
        expect(results).toBeDefined();
        expect(results).toBeInstanceOf(Array);
        expect(results.length).toBe(10);
    }, 30000); // 30 second timeout

    it('test meteora getPositions - note - need to use a paid RPC for this test', async () => {
        const positions = await meteora.getPositions();
        edwinLogger.info('🚀 ~ it ~ getPositions result:', safeJsonStringify(positions));
    }, 120000); // 120 second timeout

    it('test meteora create position and add liquidity, then check for new position', async () => {
        const results = await meteora.getPools({
            asset: 'sol',
            assetB: 'usdc',
        });
        const topPoolAddress = results[0].address;

        const result = await meteora.addLiquidity({
            poolAddress: topPoolAddress,
            amount: 'auto',
            amountB: '2',
        });
        // Verify liquidity was added correctly
        expect(result.liquidityAdded).toBeDefined();
        expect(result.liquidityAdded).toHaveLength(2);
        expect(result.liquidityAdded[1]).toBeCloseTo(2, 1); // Verify USDC amount is approximately 2
        expect(result.liquidityAdded[0]).toBeGreaterThan(0); // Verify SOL amount is non-zero
        edwinLogger.info('🚀 ~ it ~ result:', result);

        const positionAddress = result.positionAddress;
        // Get positions after adding liquidity
        const positions = await meteora.getPositionsFromPool({
            poolAddress: topPoolAddress,
        });
        // Check that positions is ok - should be 1 position
        expect(positions).toBeDefined();
        expect(positions.length).toBe(1);
        expect(positions[0].publicKey.toString()).toBe(positionAddress);
    }, 120000); // 120 second timeout

    it('test meteora remove liquidity', async () => {
        // Get initial positions
        const positions = await meteora.getPositions();
        edwinLogger.info('🚀 ~ it ~ initial positions:', positions);

        if (!positions || positions.size === 0) {
            return it.skip('No positions found to close - skipping test');
        }

        // Remove liquidity from first position found
        const poolAddress = Array.from(positions.keys())[0];
        const result = await meteora.removeLiquidity({
            poolAddress: poolAddress,
            shouldClosePosition: true,
        });
        edwinLogger.info('🚀 ~ it ~ removeLiquidity result:', result);

        // Check positions after removal
        const positionsAfter = await meteora.getPositionsFromPool({
            poolAddress: poolAddress,
        });
        edwinLogger.info('🚀 ~ it ~ positions after removal:', positionsAfter);

        // Verify position was closed
        expect(positionsAfter.length).toBe(positions.size - 1);
    }, 60000); // 60 second timeout
});

describe('Meteora utils', () => {
    if (!process.env.SOLANA_PRIVATE_KEY) {
        throw new Error('SOLANA_PRIVATE_KEY is not set');
    }
    const wallet = new EdwinSolanaWallet(process.env.SOLANA_PRIVATE_KEY);
    const meteora = new MeteoraProtocol(wallet);

    describe('calculateAmounts', () => {
        // Mock DLMM instance
        const mockDlmmPool = {
            tokenX: { decimal: 9 },
            tokenY: { decimal: 6 },
        } as DLMM;

        it('should calculate amounts when amount is auto', async () => {
            const result = await calculateAmounts(
                'auto',
                '100',
                '2', // price per token
                mockDlmmPool
            );

            expect(result[0]).toBeInstanceOf(BN);
            expect(result[1]).toBeInstanceOf(BN);

            // For amountB = 100 and price = 2
            // amountA should be 50 (100/2) in base units
            expect(result[0].toString()).toBe((50 * 10 ** 9).toString());
            // amountB should be 100 in base units
            expect(result[1].toString()).toBe((100 * 10 ** 6).toString());
        });

        it('should calculate amounts when amountB is auto', async () => {
            const result = await calculateAmounts(
                '50',
                'auto',
                '2', // price per token
                mockDlmmPool
            );

            expect(result[0]).toBeInstanceOf(BN);
            expect(result[1]).toBeInstanceOf(BN);

            // For amountA = 50 and price = 2
            // amountA should be 50 in base units
            expect(result[0].toString()).toBe((50 * 10 ** 9).toString());
            // amountB should be 100 (50*2) in base units
            expect(result[1].toString()).toBe((100 * 10 ** 6).toString());
        });

        it('should handle direct amounts', async () => {
            const result = await calculateAmounts(
                '50',
                '100',
                '2', // price per token (not used in this case)
                mockDlmmPool
            );

            expect(result[0]).toBeInstanceOf(BN);
            expect(result[1]).toBeInstanceOf(BN);

            expect(result[0].toString()).toBe((50 * 10 ** 9).toString());
            expect(result[1].toString()).toBe((100 * 10 ** 6).toString());
        });

        it('should throw error when both amounts are auto', async () => {
            await expect(calculateAmounts('auto', 'auto', '2', mockDlmmPool)).rejects.toThrow(TypeError);
        });

        it('should throw error for invalid number inputs', async () => {
            await expect(calculateAmounts('invalid', '100', '2', mockDlmmPool)).rejects.toThrow(TypeError);
        });
    });

    describe('extractBalanceChanges', () => {
        it('should correctly extract balance changes from a transaction', async () => {
            const tokenXMint = await wallet.getTokenAddress('sol');
            const tokenYMint = await wallet.getTokenAddress('usdc');
            if (!tokenXMint || !tokenYMint) {
                throw new Error('Token address not found');
            }

            const connection = wallet.getConnection();
            const result = await extractBalanceChanges(
                connection,
                '31brBmpbZMqduwi3u1Z6Si2Xt4izdkX2TE45jdeeq1oVreiahKyfaHSArMKdyqKWeYFT6GwGWRBxwfnwfbGbPypR',
                tokenXMint,
                tokenYMint
            );

            expect(result).toHaveProperty('liquidityRemoved');
            expect(result).toHaveProperty('feesClaimed');
            expect(result.liquidityRemoved).toHaveLength(2);
            expect(result.feesClaimed).toHaveLength(2);

            // Test against known values from the transaction
            expect(result).toEqual({
                liquidityRemoved: [0, 20.274523],
                feesClaimed: [0.000004094, 0.003779],
            });

            const result2 = await extractBalanceChanges(
                connection,
                '57FFqxEZqbyfesEcSiMNGsHUTfSzKRvcreqBzJirFWrHHW37YaRvNGd8EfGPVSEzXuQrdZbxZWM4NjBLkFZ7TmVN',
                tokenXMint,
                tokenYMint
            );

            // Test against known values from the transaction
            expect(result2).toEqual({
                liquidityRemoved: [0.051702288, 0],
                feesClaimed: [0.00000511, 0.000032],
            });
        }, 20000);

        it('should handle transaction not found', async () => {
            const connection = wallet.getConnection();
            await expect(
                extractBalanceChanges(connection, 'invalid_signature', 'token_x_address', 'token_y_address')
            ).rejects.toThrow(Error);
        }, 20000);
    });
});
