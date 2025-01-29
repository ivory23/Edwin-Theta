import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, expect, it } from 'vitest';
import { Edwin, EdwinConfig } from '../src';

// Meteora test
describe('Meteora test', () => {
    it('test meteora getPools', async () => {
        const edwinConfig: EdwinConfig = {
            actions: ['getPools']
        };
        const edwin = new Edwin(edwinConfig);
        const results = await edwin.actions.getPools.execute({
            asset: 'sol',
            assetB: 'usdc',
            protocol: 'meteora'
        });
        console.log("🚀 ~ it ~ getPools result:", results);
    }, 30000); // 30 second timeout

    it('test meteora getPositions - note - need to use a paid RPC', async () => {
        const edwinConfig: EdwinConfig = {
            solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
            actions: ['getPositions']
        };
        const edwin = new Edwin(edwinConfig);
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana',
        });
        console.log("🚀 ~ it ~ getPositions result:", positions);
    }, 120000); // 120 second timeout
    
    it('test meteora create position and add liquidity, then check for new position', async () => {
        const edwinConfig: EdwinConfig = {
            solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
            actions: ['addLiquidity', 'getPools', 'getPositions']
        };
        const edwin = new Edwin(edwinConfig);
        const results = await edwin.actions.getPools.execute({
            asset: 'sol',
            assetB: 'usdc',
            protocol: 'meteora'
        });
        console.log("🚀 ~ it ~ result:", results)
        const topPoolAddress = results[0].address;

        const result = await edwin.actions.addLiquidity.execute({
            poolAddress: topPoolAddress,
            amount: 'auto',
            amountB: '2',
            protocol: 'meteora',
            chain: 'solana'
        });
        console.log("🚀 ~ it ~ result:", result)

        // Get positions after adding liquidity
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana'
        });
        console.log("🚀 ~ it ~ positions:", positions)
        
        // Check that positions is ok - should be 1 position
        expect(positions).toBeDefined();
        expect(positions.length).toBe(1);
    }, 120000); // 120 second timeout

    it('test meteora remove liquidity', async () => {
        const edwinConfig: EdwinConfig = {
            solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
            actions: ['removeLiquidity', 'getPositions']
        };
        const edwin = new Edwin(edwinConfig);
        const positions = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana'
        });
        console.log("🚀 ~ it ~ initial positions:", positions);
        expect(positions).toBeDefined();

        if (!positions || positions.length === 0) {
            it.skip("No positions found to close - skipping test");
        }

        // Remove liquidity from first position found
        const poolAddress = positions.keys().toArray()[0];
        const result = await edwin.actions.removeLiquidity.execute({
            protocol: 'meteora',
            chain: 'solana',
            poolAddress: poolAddress,
        });
        console.log("🚀 ~ it ~ removeLiquidity result:", result);

        // Check positions after removal
        const positionsAfter = await edwin.actions.getPositions.execute({
            protocol: 'meteora',
            chain: 'solana'
        });
        console.log("🚀 ~ it ~ positions after removal:", positionsAfter);

        // Verify position was closed
        expect(positionsAfter.length).toBe(positions.length - 1);
    }, 60000); // 60 second timeout
});
