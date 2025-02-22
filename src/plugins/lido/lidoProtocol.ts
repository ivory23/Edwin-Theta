import type { SupportedChain } from '../../core/types';
import type { StakeParameters } from './parameters';
import { EdwinEVMWallet } from '../../core/wallets/evm_wallet/evm_wallet';

export class LidoProtocol {
    private wallet: EdwinEVMWallet;

    constructor(wallet: EdwinEVMWallet) {
        this.wallet = wallet;
    }

    supportedChains: SupportedChain[] = ['mainnet'];

    async getPortfolio(): Promise<string> {
        return '';
    }

    async stake(params: StakeParameters): Promise<string> {
        const { amount } = params;

        throw new Error(`Not implemented. Params: ${amount}`);
    }

    async unstake(params: StakeParameters): Promise<string> {
        const { amount } = params;

        throw new Error(`Not implemented. Params: ${amount}`);
    }

    async claimRewards(params: StakeParameters): Promise<string> {
        const { asset, amount } = params;
        throw new Error(`Not implemented. Params: ${asset}, ${amount}`);
    }
}
