import { EdwinAction, IDEXProtocol } from '../../../types';
import { Edwin } from '../../../edwin-client';
import { z } from 'zod';

export const getPositionsTemplate = `You are an AI assistant specialized in processing DeFi liquidity removal requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested liquidity provision:
1. Chain to execute on
2. Protocol to use (DEX)

This must be your only output and it should be in JSON format, or you will be fired:

\`\`\`json
{
    "chain": string,
    "protocol": string
}
\`\`\`
`;

export class GetPositionsAction implements EdwinAction {
    name = 'GET_POSITIONS';
    description =
        "Retrieves user's active liquidity positions from a DEX, including position IDs, token amounts, pool information, and current value. Required parameters: chain (blockchain network) and protocol (DEX name)";
    template = getPositionsTemplate;
    edwin: Edwin;
    schema = z.object({
        protocol: z.string(),
        chain: z.string(),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol.toLowerCase()] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        if (!protocol.getPositions) {
            throw new Error(`Protocol ${params.protocol} does not support getPositions`);
        }
        return await protocol.getPositions(params);
    }
}
