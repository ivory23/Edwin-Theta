import type { IDEXProtocol, SwapParams, LiquidityParams, EdwinWallet, SupportedChain } from "../../types";
import type { Transaction } from "../../types";
import { EdwinEVMWallet } from "../../edwin-core/providers/evm_wallet";

export class UniswapProtocol implements IDEXProtocol {
    supportedChains: SupportedChain[] = ["mainnet"];

    async swap(params: SwapParams, walletProvider: EdwinEVMWallet): Promise<Transaction> {
        const {
            chain,
            contract,
            tokenIn,
            tokenOut,
            amount,
            slippage,
        } = params;

        throw new Error("Not implemented");
    }

    async addLiquidity(params: LiquidityParams, walletProvider: EdwinEVMWallet): Promise<string> {
        const {
            chain,
            asset,
            amount,
            assetB,
            amountB,
        } = params;

        throw new Error("Not implemented");
    }

    async removeLiquidity(params: LiquidityParams, walletProvider: EdwinEVMWallet): Promise<Transaction> {
        throw new Error("Not implemented");
    }

    async getQuote(params: SwapParams): Promise<string> {
        throw new Error("Not implemented");
    }
}

