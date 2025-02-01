import type { IStakingProtocol, StakeParams, SupportedChain } from '../../types';
import { EdwinEVMWallet } from '../../edwin-core/wallets/evm_wallet';

export class LidoProtocol implements IStakingProtocol {
    private wallet: EdwinEVMWallet;

    constructor(wallet: EdwinEVMWallet) {
        this.wallet = wallet;
    }

    supportedChains: SupportedChain[] = ['mainnet'];

    async getPortfolio(): Promise<string> {
        return '';
    }

    async stake(params: StakeParams): Promise<string> {
        const { chain, amount } = params;

        throw new Error('Not implemented');
    }

    async unstake(params: StakeParams): Promise<string> {
        const { chain, amount } = params;

        throw new Error('Not implemented');
    }

    async claimRewards(params: StakeParams): Promise<string> {
        const { chain } = params;

        throw new Error('Not implemented');
    }
}
