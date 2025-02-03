import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction } from '../../../types';
import { ICookieProtocol } from '../../../types';

export const getAgentsPagedTemplate = `You are an AI assistant specialized in retrieving paged agent information. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract:
1. Time interval (_3Days or _7Days)
2. Page number (starts at 1)
3. Page size (between 1 and 25)

This must be your only output and it should be in JSON format:

\`\`\`json
{
    "interval": "_3Days" | "_7Days",
    "page": number,
    "pageSize": number
}
\`\`\`
`;

export class GetAgentsPagedAction implements EdwinAction {
    name = 'GET_AGENTS_PAGED';
    description = 'Retrieves a paginated list of agents ordered by mindshare';
    template = getAgentsPagedTemplate;
    edwin: Edwin;
    schema = z.object({
        interval: z.enum(['_3Days', '_7Days']),
        page: z.number().min(1),
        pageSize: z.number().min(1).max(25),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<string> {
        const protocol = this.edwin.protocols['cookie'] as ICookieProtocol;
        if (!protocol) {
            throw new Error('Cookie protocol not found');
        }
        return await protocol.getAgentsPaged(params.interval, params.page, params.pageSize);
    }
} 