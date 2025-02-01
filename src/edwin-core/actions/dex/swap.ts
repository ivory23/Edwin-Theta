import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction, IDEXProtocol } from '../../../types';

export class SwapAction implements EdwinAction {
    name = 'SWAP';
    description = 'Swap tokens on a DEX';
    template = 'swap {amount} {tokenIn} to {tokenOut} on {protocol}';
    edwin: Edwin;
    schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        asset: z.string(),
        amount: z.string(),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol.toLowerCase()] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        return await protocol.swap(params);
    }
}
