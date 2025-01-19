import { BaseProtocolParams } from "./base";
import type { Transaction } from "./base";

export interface SwapParams extends BaseProtocolParams {
    contract: string;
    tokenIn: string;
    tokenOut: string;
    amountOut?: string;
    slippage: number;
    recipient?: string;
}

export interface LiquidityParams extends BaseProtocolParams {
    contract: string;
    tokenA: string;
    tokenB: string;
    amountB: string;
}

export interface IDEXProtocol {
    swap(params: SwapParams): Promise<Transaction>;
    addLiquidity?(params: LiquidityParams): Promise<Transaction>;
    removeLiquidity?(params: LiquidityParams): Promise<Transaction>;
    getQuote?(params: SwapParams): Promise<string>;
}
