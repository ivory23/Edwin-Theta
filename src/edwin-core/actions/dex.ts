import { EdwinAction } from "../../types";
import { IDEXProtocol } from "../../types";
import { addLiquidityTemplate, removeLiquidityTemplate, getPoolsTemplate } from "../templates";
import { Edwin } from "../../edwin-client";


export class SwapAction implements EdwinAction {
    name = "SWAP";
    description = "Swap tokens on a DEX";
    template = "swap {amount} {tokenIn} to {tokenOut} on {protocol}";
    edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        return await protocol.swap(params);
    }
}

export class AddLiquidityAction implements EdwinAction {
    name = "ADD_LIQUIDITY";
    description = "Add liquidity to a DEX pool";
    template = addLiquidityTemplate;
    edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        return await protocol.addLiquidity(params);
    }
}

export class RemoveLiquidityAction implements EdwinAction {
    name = "REMOVE_LIQUIDITY";
    description = "Remove liquidity from a DEX pool";
    template = removeLiquidityTemplate;
    edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        return await protocol.removeLiquidity(params);
    }
}

export class GetPoolsAction implements EdwinAction {
    name = "GET_POOLS";
    description = "Get pools from a DEX";
    template = getPoolsTemplate;
    edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: any): Promise<any> {
        const protocol = this.edwin.protocols[params.protocol] as IDEXProtocol;
        if (!protocol) {
            throw new Error(`Protocol ${params.protocol} not found`);
        }
        if (!protocol.getPools) {
            throw new Error(`Protocol ${params.protocol} does not support getPools`);
        }
        return await protocol.getPools(params);
    }
}

