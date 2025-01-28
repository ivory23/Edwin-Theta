import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, it } from 'vitest';
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
    
    it.skip('test meteora create position and add liquidity', async () => {
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

        // // Get positions after adding liquidity
        // const positions = await edwin.actions.getPositions.execute({
        //     protocol: 'meteora',
        //     chain: 'solana'
        // });
        // console.log("🚀 ~ it ~ positions:", positions)
    }, 120000); // 120 second timeout
});
