import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { MeteoraProtocol } from './meteoraProtocol';
import { EdwinSolanaWallet } from '../../core/wallets';
import { Chain } from '../../core/types';

export class MeteoraPlugin extends EdwinPlugin {
    constructor(wallet: EdwinSolanaWallet) {
        super('meteora', [new MeteoraProtocol(wallet)]);
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const meteora = (wallet: EdwinSolanaWallet) => new MeteoraPlugin(wallet);
