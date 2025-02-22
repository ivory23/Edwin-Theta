import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { LuloProtocol } from './luloProtocol';
import { EdwinSolanaWallet } from '../../core/wallets';
import { Chain } from '../../core/types';

export class LuloPlugin extends EdwinPlugin {
    constructor(wallet: EdwinSolanaWallet) {
        super('lulo', [new LuloProtocol(wallet)]);
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const lulo = (wallet: EdwinSolanaWallet) => new LuloPlugin(wallet);
