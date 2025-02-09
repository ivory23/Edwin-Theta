import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, expect, it } from 'vitest';
import { Edwin, EdwinConfig } from '../src';
import { safeJsonStringify } from '../src/utils';
import { MeteoraProtocol } from '../src/protocols';

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
        console.log('🚀 ~ it ~ getPools result:', results);
    }, 30000); // 30 second timeout

    // Test extractBalanceChanges for transaction signature y496Xe9J4P1i1EAJA1Kuvm6ndzCVWNPW12Tw5eN8QC2RUR1FrorG1YYg4XRM1dqMEYjDPw15Zryq75St7hwy1T3
    it('test meteora extractBalanceChanges', async () => {
        const tokenXMint = await edwin.getTokenAddress('sol');
        const tokenYMint = await edwin.getTokenAddress('usdc');
        if (!tokenXMint || !tokenYMint) {
            throw new Error('Token address not found');
        }
        const result = await (edwin.protocols.meteora as MeteoraProtocol).extractBalanceChanges(
            'y496Xe9J4P1i1EAJA1Kuvm6ndzCVWNPW12Tw5eN8QC2RUR1FrorG1YYg4XRM1dqMEYjDPw15Zryq75St7hwy1T3',
            tokenXMint,
            tokenYMint
        );
        console.log('🚀 ~ it ~ result:', result);
        expect(result).toEqual({
            liquidityRemoved: [0.004645062, 2.922796],
            feesClaimed: [0.000002349, 0.00067],
        });
    }, 60000); // 60 second timeout

    it('test meteora getPositions - note - need to use a paid RPC', async () => {
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        console.log('🚀 ~ it ~ getPositions result:', safeJsonStringify(positions));
    }, 120000); // 120 second timeout

    it('test meteora create position and add liquidity, then check for new position', async () => {
        const results = await edwin.actions.getPools.execute({
            asset: 'sol',
            assetB: 'usdc',
            protocol: 'meteora',
        });
        console.log('🚀 ~ it ~ result:', results);
        const topPoolAddress = results[0].address;

        const result = await edwin.actions.addLiquidity.execute({
            poolAddress: topPoolAddress,
            amount: 'auto',
            amountB: '2',
            protocol: 'meteora',
            chain: 'solana',
        });
        console.log('🚀 ~ it ~ result:', result);

        // Get positions after adding liquidity
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        console.log('🚀 ~ it ~ positions:', positions);

        // Check that positions is ok - should be 1 position
        expect(positions).toBeDefined();
        expect(positions.size).toBe(1);
        const positionKey = positions.keys().toArray()[0];
        console.log('🚀 ~ it ~ positions:', positionKey);
    }, 120000); // 120 second timeout

    it('test meteora remove liquidity', async () => {
        // Get initial positions
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        console.log('🚀 ~ it ~ initial positions:', positions);

        if (!positions || positions.size === 0) {
            return it.skip('No positions found to close - skipping test');
        }

        // Remove liquidity from first position found
        const poolAddress = positions.keys().toArray()[0];
        const result = await edwin.actions.removeLiquidity.execute({
            protocol: 'meteora',
            chain: 'solana',
            poolAddress: poolAddress,
            shouldClosePosition: true,
        });
        console.log('🚀 ~ it ~ removeLiquidity result:', result);

        // Check positions after removal
        const positionsAfter = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        console.log('🚀 ~ it ~ positions after removal:', positionsAfter);

        // Verify position was closed
        expect(positionsAfter.size).toBe(positions.size - 1);
    }, 60000); // 60 second timeout
});
