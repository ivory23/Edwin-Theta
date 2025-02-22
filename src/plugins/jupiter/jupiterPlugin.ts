import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { EdwinTool, Chain } from '../../core/types';
import { z } from 'zod';
import { JupiterService } from './jupiterService';
import { EdwinSolanaWallet } from '../../core/wallets';
import { SwapParameters } from './parameters';

export class JupiterPlugin extends EdwinPlugin {
    constructor(wallet: EdwinSolanaWallet) {
        super('jupiter', [new JupiterService(wallet)]);
    }

    getTools(): Record<string, EdwinTool> {
        const jupiterService = this.toolProviders.find(
            provider => provider instanceof JupiterService
        ) as JupiterService;

        return {
            jupiterSwap: {
                name: 'jupiter_swap',
                description: 'Swap tokens using Jupiter aggregator',
                schema: z.object({
                    asset: z.string().min(1),
                    assetB: z.string().min(1),
                    amount: z.number().positive(),
                }),
                execute: async (params: SwapParameters) => {
                    return await jupiterService.swap(params);
                },
            },
        };
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const jupiter = (wallet: EdwinSolanaWallet) => new JupiterPlugin(wallet);
