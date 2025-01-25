import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, it, expect } from 'vitest';
import { Edwin, EdwinConfig } from '../src';
import { LiquidityParams } from '../src/types';
import BN from "bn.js";

// Meteora test
describe('Meteora test', () => {
    it('should initialize Edwin with solana config', async () => {
        const edwinConfig: EdwinConfig = {
            solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
            actions: ['addLiquidity']
        };
        const edwin = new Edwin(edwinConfig);

        const addLiquidityParams: LiquidityParams = {
            chain: 'solana',
            amount: '0.05',
            asset: 'usdc',
            assetB: 'sol',
            amountB: '0.05',
            protocol: 'meteora',
        }
        const result = await edwin.actions.addLiquidity.execute(addLiquidityParams);
        expect(result).toBeDefined();
    }, 30000); // 30 second timeout
});
