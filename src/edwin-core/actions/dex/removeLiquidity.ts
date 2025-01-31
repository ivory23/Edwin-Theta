import { z } from "zod";
import { Edwin } from "../../../edwin-client";
import { EdwinAction, IDEXProtocol } from "../../../types";

export const removeLiquidityTemplate = `You are an AI assistant specialized in processing DeFi liquidity removal requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested liquidity removal:
1. Chain to execute on
2. Protocol to use (DEX)
3. Pool address
4. Amount of LP tokens to remove (can be "max")

Before providing the final JSON output, show your reasoning process inside <analysis> tags and validate:
- The protocol is supported
- The pool address is valid
- The amount is valid or "max"
- Any protocol-specific requirements

Provide the final output in JSON format:

\`\`\`json
{
    "chain": string,
    "protocol": string,
    "address": string,
    "amount": string
}
\`\`\`
`;


export class RemoveLiquidityAction implements EdwinAction {
    name = "REMOVE_LIQUIDITY";
    description = "Removes liquidity from a DEX pool, withdrawing the underlying tokens back to the user's wallet. Required parameters: chain (blockchain network), protocol (DEX name), address (pool address), and amount (quantity of LP tokens to remove, can be 'max' for full withdrawal)";
    template = removeLiquidityTemplate;
    edwin: Edwin;
    schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        poolAddress: z.string(),
        amount: z.string()
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol.toLowerCase()] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        return await protocol.removeLiquidity(params);
    }
}