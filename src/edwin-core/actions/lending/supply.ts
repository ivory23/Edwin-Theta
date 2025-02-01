import { EdwinAction, ILendingProtocol, SupplyParams } from '../../../types';
import { Edwin } from '../../../edwin-client';
import { z } from 'zod';

export const supplyTemplate = `You are an AI assistant specialized in processing DeFi supply/lending requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Here's a list of supported chains:
<supported_chains>
{{supportedChains}}
</supported_chains>

Here's a list of supported protocols:
<supported_protocols>
{{supportedProtocols}}
</supported_protocols>

Your goal is to extract the following information about the requested supply action:
1. Chain to execute on
2. Protocol to use (must be one of the supported protocols)
3. Amount to supply
4. Asset to supply (token address or symbol)

Before providing the final JSON output, show your reasoning process inside <analysis> tags and validate:
- The protocol is supported
- The amount is valid
- The asset exists on the chain
- Any protocol-specific requirements

Provide the final output in JSON format:

\`\`\`json
{
    "chain": string,
    "protocol": string,
    "amount": string,
    "asset": string
}
\`\`\`
`;

export class SupplyAction implements EdwinAction {
    public name = 'SUPPLY';
    public description = 'Supply assets to a lending protocol';
    public template = supplyTemplate;
    public edwin: Edwin;
    public schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        asset: z.string(),
        amount: z.string(),
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: SupplyParams): Promise<string> {
        console.log(`Supplying: ${params.amount} ${params.asset} to ${params.protocol} on ${params.chain})`);

        try {
            console.log(`Getting lending protocol for: ${params.protocol}`);
            // Get the appropriate protocol service based on the protocol name
            const lendingProtocol = this.edwin.protocols[params.protocol] as ILendingProtocol;
            if (!lendingProtocol) {
                throw new Error(`Unsupported protocol: ${params.protocol}`);
            }
            // Use the protocol-specific supply implementation
            return await lendingProtocol.supply(params);
        } catch (error: any) {
            // If error has a message, use it
            if (error.message) {
                throw new Error(`Supply failed: ${error.message}`);
            }
            // Otherwise, use the error itself
            throw new Error(`Supply failed: ${error}`);
        }
    }
}
