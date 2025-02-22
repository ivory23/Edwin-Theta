import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { JupiterService } from './jupiterService';
import { EdwinSolanaWallet } from '../../core/wallets';
import { Chain } from '../../core/types';

export class JupiterPlugin extends EdwinPlugin {
    constructor(wallet: EdwinSolanaWallet) {
        super('jupiter', [new JupiterService(wallet)]);
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const jupiter = (wallet: EdwinSolanaWallet) => new JupiterPlugin(wallet);
