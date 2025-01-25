import { EdwinAction } from "../../types";
import { EdwinProvider } from "../providers";
import { IDEXProtocol } from "../../types";
import { getDEXProtocol } from "../../protocols";
import { addLiquidityTemplate, removeLiquidityTemplate } from "../templates";


export class SwapAction implements EdwinAction {
    name = "swap";
    description = "Swap tokens on a DEX";
    template = "swap {amount} {tokenIn} to {tokenOut} on {protocol}";
    provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: any): Promise<any> {
        const protocol = getDEXProtocol(params.protocol) as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }

        const wallet = this.provider.getWallet(params.chain);
        return await protocol.swap(params, wallet);
    }
}

export class AddLiquidityAction implements EdwinAction {
    name = "addLiquidity";
    description = "Add liquidity to a DEX pool";
    template = addLiquidityTemplate;
    provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: any): Promise<any> {
        const protocol = getDEXProtocol(params.protocol) as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }

        const wallet = this.provider.getWallet(params.chain);
        return await protocol.addLiquidity(params, wallet);
    }
}

export class RemoveLiquidityAction implements EdwinAction {
    name = "removeLiquidity";
    description = "Remove liquidity from a DEX pool";
    template = removeLiquidityTemplate;
    provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: any): Promise<any> {
        const protocol = getDEXProtocol(params.protocol) as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }

        const wallet = this.provider.getWallet(params.chain);
        return await protocol.removeLiquidity(params, wallet);
    }
}
