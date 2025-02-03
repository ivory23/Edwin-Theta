import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction } from '../../../types';
import { ICookieProtocol } from '../../../types';

export const getAgentByContractTemplate = `You are an AI assistant specialized in retrieving agent information by contract address. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract:
1. Contract address
2. Time interval (_3Days or _7Days)

This must be your only output and it should be in JSON format:

\`\`\`json
{
    "contractAddress": string,
    "interval": "_3Days" | "_7Days"
}
\`\`\`
`;

export class GetAgentByContractAction implements EdwinAction {
    name = 'GET_AGENT_BY_CONTRACT';
    description = 'Retrieves agent details and metrics using their contract address';
    template = getAgentByContractTemplate;
    edwin: Edwin;
    schema = z.object({
        contractAddress: z.string(),
        interval: z.enum(['_3Days', '_7Days']),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<string> {
        const protocol = this.edwin.protocols['cookie'] as ICookieProtocol;
        if (!protocol) {
            throw new Error('Cookie protocol not found');
        }
        return await protocol.getAgentByContract(params.contractAddress, params.interval);
    }
} 