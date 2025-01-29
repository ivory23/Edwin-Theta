import type { WithdrawParams, EdwinAction, ILendingProtocol } from "../../../types";
import { Edwin } from "../../../edwin-client";


export const withdrawTemplate = `You are an AI assistant specialized in processing DeFi withdraw requests from lending protocols. Your task is to extract specific information from user messages and format it into a structured JSON response.

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

Your goal is to extract the following information about the requested withdraw action:
1. Chain to execute on
2. Protocol to withdraw from
3. Amount to withdraw (can be "max")
4. Asset to withdraw

Before providing the final JSON output, show your reasoning process inside <analysis> tags and validate:
- The protocol is supported
- The amount is valid or "max"
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

export class WithdrawAction implements EdwinAction {
    public name = 'withdraw';
    public description = 'Withdraw assets from a lending protocol';
    public template = withdrawTemplate;
    public edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: WithdrawParams): Promise<string> {
        console.log(
            `Withdrawing: ${params.amount} ${params.asset} from ${params.protocol} on ${params.chain})`
        );
        try {
            // Get the appropriate protocol service based on the protocol name
            const lendingProtocol = this.edwin.protocols[params.protocol.toLowerCase()] as ILendingProtocol;
            if (!lendingProtocol) {
                throw new Error(`Unsupported protocol: ${params.protocol}`);
            }
            // Use the protocol-specific withdraw implementation
            return await lendingProtocol.withdraw(params);
        } catch (error: any) {
            // If error has a message, use it
            if (error.message) {
                throw new Error(`Withdraw failed: ${error.message}`);
            }
            // Otherwise, use the error itself
            throw new Error(`Withdraw failed: ${error}`);
        }
    }
}
