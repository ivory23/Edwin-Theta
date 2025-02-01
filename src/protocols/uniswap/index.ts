import type { IDEXProtocol, LiquidityParams, SupportedChain } from '../../types';
import { EdwinEVMWallet } from '../../edwin-core/wallets/evm_wallet';

export class UniswapProtocol implements IDEXProtocol {
    supportedChains: SupportedChain[] = ['mainnet'];
    private wallet: EdwinEVMWallet;

    constructor(wallet: EdwinEVMWallet) {
        this.wallet = wallet;
    }

    async getPortfolio(): Promise<string> {
        return '';
    }

    async swap(params: LiquidityParams): Promise<string> {
        const { chain, asset, amount, assetB, amountB } = params;

        throw new Error(`Not implemented. Params: ${chain} ${asset} ${amount} ${assetB} ${amountB}`);
    }

    async addLiquidity(params: LiquidityParams): Promise<string> {
        const { chain, asset, amount, assetB, amountB } = params;

        throw new Error(`Not implemented. Params: ${chain} ${asset} ${amount} ${assetB} ${amountB}`);
    }

    async removeLiquidity(params: LiquidityParams): Promise<string> {
        const { chain, asset, amount, assetB, amountB } = params;

        throw new Error(`Not implemented. Params: ${chain} ${asset} ${amount} ${assetB} ${amountB}`);
    }

    async getQuote(params: LiquidityParams): Promise<string> {
        throw new Error(`Not implemented. Params: ${JSON.stringify(params)}`);
    }
}
