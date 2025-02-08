import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction, ISwapProtocol } from '../../../types';

export class SwapAction implements EdwinAction {
    name = 'SWAP';
    description = 'Swap tokens on a DEX or AMM';
    template = 'swap {amount} {tokenIn} to {tokenOut} on {protocol}';
    edwin: Edwin;
    schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        tokenIn: z.string(),
        tokenOut: z.string(),
        amount: z.string(),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<number> {
        const protocol = this.edwin.protocols[params.protocol.toLowerCase()];

        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }

        // Check if protocol supports swapping
        if (!('swap' in protocol)) {
            throw new Error(`Protocol ${params.protocol} does not support swapping`);
        }

        const swapProtocol = protocol as ISwapProtocol;

        // Validate chain is supported
        if (!swapProtocol.supportedChains.includes(params.chain)) {
            throw new Error(`Chain ${params.chain} is not supported by ${params.protocol}`);
        }

        return await swapProtocol.swap({
            chain: params.chain,
            asset: params.asset,
            assetB: params.assetB,
            amount: params.amount,
        });
    }
}
