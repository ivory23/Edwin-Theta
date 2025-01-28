import { EdwinAction } from "../../types";
import { EdwinProvider } from "../providers";
import { IDEXProtocol } from "../../types";
import { getDEXProtocol } from "../../protocols";
import { addLiquidityTemplate, removeLiquidityTemplate, getPoolsTemplate } from "../templates";
import { getPositionsTemplate } from "../templates/dex";


export class SwapAction implements EdwinAction {
    name = "SWAP";
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
    name = "ADD_LIQUIDITY";
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
    name = "REMOVE_LIQUIDITY";
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

export class GetPoolsAction implements EdwinAction {
    name = "GET_POOLS";
    description = "Get pools from a DEX";
    template = getPoolsTemplate;
    provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: any): Promise<any> {
        const protocol = getDEXProtocol(params.protocol) as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        if (!protocol.getPools) {
            throw new Error(`Protocol ${params.protocol} does not support getPools`);
        }
        return await protocol.getPools(params);
    }
}

export class GetPositionsAction implements EdwinAction {
    name = "GET_POSITIONS";
    description = "Get existing positions from a DEX";
    template = getPositionsTemplate;
    provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: any): Promise<any> {
        const protocol = getDEXProtocol(params.protocol) as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        if (!protocol.getPositions) {
            throw new Error(`Protocol ${params.protocol} does not support getPositions`);
        }
        const wallet = this.provider.getWallet(params.chain);
        return await protocol.getPositions(params, wallet);
    }
}