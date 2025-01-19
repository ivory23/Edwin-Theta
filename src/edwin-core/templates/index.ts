export const stakeTemplate = `You are an AI assistant specialized in processing DeFi staking requests. Your task is to extract specific information from user messages and format it into a structured JSON response.


....


`;

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

export const addLiquidityTemplate = `You are an AI assistant specialized in processing DeFi liquidity provision requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

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

Your goal is to extract the following information about the requested liquidity provision:
1. Chain to execute on
2. Protocol to use (DEX)
3. Pool address
4. Amounts to provide for each token
5. Token addresses or symbols

Before providing the final JSON output, show your reasoning process inside <analysis> tags and validate:
- The protocol is supported
- The pool address is valid
- The amounts are valid
- The tokens exist on the chain
- Any protocol-specific requirements

Provide the final output in JSON format:

\`\`\`json
{
    "chain": string,
    "protocol": string,
    "pool": string,
    "amounts": string[],
    "tokens": string[]
}
\`\`\`
`;

export const removeLiquidityTemplate = `You are an AI assistant specialized in processing DeFi liquidity removal requests. Your task is to extract specific information from user messages and format it into a structured JSON response.

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
    "pool": string,
    "amount": string
}
\`\`\`
`;
