import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction } from '../../../types';
import { ICookieProtocol } from '../../../types';

export const getAgentByTwitterTemplate = `You are an AI assistant specialized in retrieving agent information by Twitter username. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract:
1. Twitter username
2. Time interval (_3Days or _7Days)

This must be your only output and it should be in JSON format:

\`\`\`json
{
    "twitterUsername": string,
    "interval": "_3Days" | "_7Days"
}
\`\`\`
`;

export class GetAgentByTwitterAction implements EdwinAction {
    name = 'GET_AGENT_BY_TWITTER';
    description = 'Retrieves agent details and metrics using their Twitter username';
    template = getAgentByTwitterTemplate;
    edwin: Edwin;
    schema = z.object({
        twitterUsername: z.string(),
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
        return await protocol.getAgentByTwitter(params.twitterUsername, params.interval);
    }
}
