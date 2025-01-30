import { Edwin } from "../../../edwin-client";
import { EdwinAction, IDEXProtocol } from "../../../types";

export const getPoolsTemplate = `You are an AI assistant specialized in processing DeFi liquidity provision requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

First, review the recent messages from the conversation:

<recent_messages>
{{recentMessages}}
</recent_messages>

Your goal is to extract the following information about the requested liquidity provision:
1. Chain to execute on
2. Protocol to use (DEX)
3. Name of first asset
4. Name of second asset


This must be your only output and it should be in JSON format, or you will be fired:

\`\`\`json
{
    "chain": string,
    "protocol": string,
    "asset": string,
    "assetB": string
}
\`\`\`
`; 

export class GetPoolsAction implements EdwinAction {
    name = "GET_POOLS";
    description = "Retrieves available liquidity pools from a DEX, including pool addresses, token reserves, fees, and APY information. Required parameters: chain (blockchain network), protocol (DEX name), asset (first token symbol), and assetB (second token symbol)";
    template = getPoolsTemplate;
    edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol.toLowerCase()] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        if (!protocol.getPools) {
            throw new Error(`Protocol ${params.protocol} does not support getPools`);
        }
        return await protocol.getPools(params);
    }
}