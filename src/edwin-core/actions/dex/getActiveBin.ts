import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction, IDEXProtocol, SupportedChain } from '../../../types';

const getActiveBinTemplate = `You are an AI assistant specialized in processing DeFi liquidity position requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested position:
1. Chain to execute on
2. Protocol to use (DEX)
3. Pool address (optional)

Provide the final output in JSON format:

\`\`\`json
{
    "chain": string,
    "protocol": string,
    "poolAddress": string,
}
\`\`\`
`;

export class GetActiveBinAction implements EdwinAction {
    name = 'GET_ACTIVE_BIN';
    description =
        'Gets the active bin for a concentrated liquidity pool. Required parameters: chain (blockchain network), protocol (DEX name), asset and assetB (token pair), and optionally poolAddress (address of the specific pool)';
    template = getActiveBinTemplate;
    edwin: Edwin;
    schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        poolAddress: z.string(),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: z.infer<typeof this.schema>) {
        const protocol = this.edwin.protocols[params.protocol] as IDEXProtocol;

        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }

        if (!protocol.getActiveBin) {
            throw new Error(`Protocol ${params.protocol} does not support getting active bin`);
        }

        return await protocol.getActiveBin({
            protocol: params.protocol,
            chain: params.chain as SupportedChain,
            poolAddress: params.poolAddress,
        });
    }
}
