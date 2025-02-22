import { config } from 'dotenv';
config();

import { describe, expect, it } from 'vitest';
import { Edwin, EdwinConfig } from '../src';

describe('Jupiter Swap Test', () => {
    const edwinConfig: EdwinConfig = {
        solanaPrivateKey: process.env.SOLANA_PRIVATE_KEY,
        plugins: ['jupiter'],
    };
    const edwin = new Edwin(edwinConfig);

    it('should swap USDC to SOL and back', async () => {
        // Initial balances
        const initialSolBalance = await edwin.wallets.solana.getBalance();
        const initialUsdcBalance = await edwin.wallets.solana.getBalanceOfToken('usdc');
        console.log('Initial balances:');
        console.log('SOL:', initialSolBalance);
        console.log('USDC:', initialUsdcBalance);

        // First swap: USDC to SOL
        const swapResult1 = await edwin.actions.swap.execute({
            protocol: 'jupiter',
            chain: 'solana',
            asset: 'usdc',
            assetB: 'sol',
            amount: '1', // 1 USDC
        });
        console.log('Swap 1 (USDC -> SOL) output amount:', swapResult1);

        // Check balances after first swap
        const midSolBalance = await edwin.getBalance('solana');
        const midUsdcBalance = await edwin.getBalanceOfToken('solana', 'usdc');
        console.log('\nBalances after first swap:');
        console.log('SOL:', midSolBalance);
        console.log('USDC:', midUsdcBalance);
        console.log('SOL change:', midSolBalance - initialSolBalance);
        console.log('USDC change:', midUsdcBalance - initialUsdcBalance);

        // Second swap: SOL back to USDC
        const solSwapBack = swapResult1;
        const swapResult2 = await edwin.actions.swap.execute({
            protocol: 'jupiter',
            chain: 'solana',
            asset: 'sol',
            assetB: 'usdc',
            amount: solSwapBack.toString(), // Swap a smaller amount of SOL back
        });
        console.log('\nSwap 2 (SOL -> USDC) output amount:', swapResult2);

        // Final balances
        const finalSolBalance = await edwin.getBalance('solana');
        const finalUsdcBalance = await edwin.getBalanceOfToken('solana', 'usdc');
        console.log('\nFinal balances:');
        console.log('SOL:', finalSolBalance);
        console.log('USDC:', finalUsdcBalance);
        console.log('Total SOL change:', finalSolBalance - initialSolBalance);
        console.log('Total USDC change:', finalUsdcBalance - initialUsdcBalance);

        // Verify the swaps were successful
        expect(swapResult1).toBeDefined();
        expect(swapResult2).toBeDefined();
        expect(typeof swapResult1).toBe('number');
        expect(typeof swapResult2).toBe('number');
    }, 60000); // 60 second timeout
});
