import { z } from "zod";
import { Edwin } from "../../../edwin-client";
import { EdwinAction, IDEXProtocol } from "../../../types";

const addLiquidityTemplate = `You are an AI assistant specialized in processing DeFi liquidity provision requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested liquidity provision:
1. Chain to execute on
2. Protocol to use (DEX)
3. Pool address
4. Amount of first token to provide
5. Amount of second token to provide. If the user does not specify an amount, set this to 'auto', the API will calculate the amount of second token to provide.

Provide the final output in JSON format:

\`\`\`json
{
    "chain": string,
    "protocol": string,
    "poolAddress": string,
    "amount": string,
    "amountB": string,
}
\`\`\`
`;

export class AddLiquidityAction implements EdwinAction {
    name = "ADD_LIQUIDITY";
    description = "Adds liquidity to a DEX pool. Required parameters: chain (blockchain network), protocol (DEX name), poolAddress (address of the liquidity pool), amount (quantity of first token to provide), and amountB (quantity of second token to provide, or 'auto' for automatic calculation)";
    template = addLiquidityTemplate;
    edwin: Edwin;
    schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        poolAddress: z.string(),
        amount: z.string(),
        amountB: z.string()
    });

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol.toLowerCase()] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        return await protocol.addLiquidity(params);
    }
}