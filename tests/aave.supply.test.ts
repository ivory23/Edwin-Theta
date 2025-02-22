import { config } from 'dotenv';
config(); // Load test environment variables from .env file

import { describe, it, expect } from 'vitest';
import { Edwin, EdwinConfig } from '../src';

describe('Edwin AAVE test', () => {
    it('Test supply action', async () => {
        const evmPrivateKey = process.env.EVM_PRIVATE_KEY;
        if (!evmPrivateKey) {
            throw new Error('EVM_PRIVATE_KEY or SOLANA_PRIVATE_KEY is not set');
        }

        const edwinConfig: EdwinConfig = {
            evmPrivateKey: evmPrivateKey as `0x${string}`,
            plugins: ['aave'],
        };

        const edwin = new Edwin(edwinConfig);

        expect(edwin).toBeDefined();

        // Test supply action
        const result = await edwin.plugins.aave.supply({
            chain: 'base',
            amount: '0.05',
            asset: 'usdc',
        });
        expect(result).toBeDefined();
        expect(result.hash).toMatch(/^0x/);
        expect(result.from).toMatch(/^0x/);
        expect(result.to).toMatch(/^0x/);
        expect(result.value).toBe(0.05);
    });
});
