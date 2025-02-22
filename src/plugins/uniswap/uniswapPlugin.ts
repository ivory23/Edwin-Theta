import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { UniswapProtocol } from './uniswapProtocol';
import { EdwinEVMWallet } from '../../core/wallets';
import { Chain } from '../../core/types';

export class uniswapPlugin extends EdwinPlugin {
    constructor(wallet: EdwinEVMWallet) {
        super('uniswap', [new UniswapProtocol(wallet)]);
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const uniswap = (wallet: EdwinEVMWallet) => new uniswapPlugin(wallet);
