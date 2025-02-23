import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { EdwinTool, Chain } from '../../core/types';
import { z } from 'zod';
import { EOracleService } from './eoracleService';
import { PriceParameters } from './parameters';

export class EOraclePlugin extends EdwinPlugin {
    constructor(apiKey: string) {
        super('eoracle', [new EOracleService(apiKey)]);
    }

    getTools(): Record<string, EdwinTool> {
        const eoracleService = this.toolProviders.find(
            provider => provider instanceof EOracleService
        ) as EOracleService;

        return {
            eoracleGetPrice: {
                name: 'eoracle_get_price',
                description: 'Get price information for a given symbol',
                schema: z.object({
                    symbol: z.string().min(1),
                }),
                execute: async (params: PriceParameters) => {
                    return await eoracleService.getPrice(params.symbol);
                },
            },
        };
    }

    supportsChain = (chain: Chain) => chain.type === 'evm';
}

export const eoracle = (apiKey: string) => new EOraclePlugin(apiKey);
