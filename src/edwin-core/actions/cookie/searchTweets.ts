import { z } from 'zod';
import { Edwin } from '../../../edwin-client';
import { EdwinAction } from '../../../types';
import { ICookieProtocol } from '../../../types';

export const searchTweetsTemplate = `You are an AI assistant specialized in searching tweets. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract:
1. Search query
2. From date (YYYY-MM-DD)
3. To date (YYYY-MM-DD)

This must be your only output and it should be in JSON format:

\`\`\`json
{
    "searchQuery": string,
    "from": string,
    "to": string
}
\`\`\`
`;

export class SearchTweetsAction implements EdwinAction {
    name = 'SEARCH_TWEETS';
    description = 'Searches for tweets matching the given query within a date range';
    template = searchTweetsTemplate;
    edwin: Edwin;
    schema = z.object({
        searchQuery: z.string(),
        from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<string> {
        const protocol = this.edwin.protocols['cookie'] as ICookieProtocol;
        if (!protocol) {
            throw new Error('Cookie protocol not found');
        }
        return await protocol.searchTweets(params.searchQuery, params.from, params.to);
    }
}
