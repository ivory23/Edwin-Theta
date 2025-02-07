import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, expect, it } from 'vitest';
import { Edwin, EdwinConfig } from '../src';
import { safeJsonStringify } from '../src/utils';
import edwinLogger from '../src/utils/logger';

// Meteora test
describe('Meteora test', () => {
    const edwinConfig: EdwinConfig = {
        solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
        actions: ['getPositions', 'getPools', 'addLiquidity', 'removeLiquidity'],
    };
    const edwin = new Edwin(edwinConfig);

    it('test meteora getPools', async () => {
        const results = await edwin.actions.getPools.execute({
            asset: 'sol',
            assetB: 'usdc',
            protocol: 'meteora',
        });
        edwinLogger.info('🚀 ~ it ~ getPools result:', results);
    }, 30000); // 30 second timeout

    it('test meteora getPositions - note - need to use a paid RPC', async () => {
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        edwinLogger.info('🚀 ~ it ~ getPositions result:', safeJsonStringify(positions));
    }, 120000); // 120 second timeout

    it('test meteora create position and add liquidity, then check for new position', async () => {
        const results = await edwin.actions.getPools.execute({
            asset: 'sol',
            assetB: 'usdc',
            protocol: 'meteora',
        });
        edwinLogger.info('🚀 ~ it ~ result:', results);
        const topPoolAddress = results[0].address;

        const result = await edwin.actions.addLiquidity.execute({
            poolAddress: topPoolAddress,
            amount: 'auto',
            amountB: '2',
            protocol: 'meteora',
            chain: 'solana',
        });
        edwinLogger.info('🚀 ~ it ~ result:', result);

        // Get positions after adding liquidity
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        edwinLogger.info('🚀 ~ it ~ positions:', positions);

        // Check that positions is ok - should be 1 position
        expect(positions).toBeDefined();
        expect(positions.size).toBe(1);
        const positionKey = positions.keys().toArray()[0];
        edwinLogger.info('🚀 ~ it ~ positions:', positionKey);
    }, 120000); // 120 second timeout

    it('test meteora remove liquidity', async () => {
        // Get initial positions
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        edwinLogger.info('🚀 ~ it ~ initial positions:', positions);

        if (!positions || positions.size === 0) {
            return it.skip('No positions found to close - skipping test');
        }

        // Remove liquidity from first position found
        const poolAddress = positions.keys().toArray()[0];
        const result = await edwin.actions.removeLiquidity.execute({
            protocol: 'meteora',
            chain: 'solana',
            poolAddress: poolAddress,
        });
        edwinLogger.info('🚀 ~ it ~ removeLiquidity result:', result);

        // Check positions after removal
        const positionsAfter = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        edwinLogger.info('🚀 ~ it ~ positions after removal:', positionsAfter);

        // Verify position was closed
        expect(positionsAfter.size).toBe(positions.size - 1);
    }, 60000); // 60 second timeout
});
