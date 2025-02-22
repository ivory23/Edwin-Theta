export interface JupiterQuoteParameters {
    inputMint: string;
    outputMint: string;
    amount: string | number;
    slippageBps?: number;
}

export interface SwapParameters {
    asset: string;
    assetB: string;
    amount: string;
}
