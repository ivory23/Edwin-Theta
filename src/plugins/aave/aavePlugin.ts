import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { AaveProtocol } from './aaveProtocol';
import { EdwinEVMWallet } from '../../core/wallets';
import { Chain } from '../../core/types';

export class AavePlugin extends EdwinPlugin {
    constructor(wallet: EdwinEVMWallet) {
        super('aave', [new AaveProtocol(wallet)]);
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const aave = (wallet: EdwinEVMWallet) => new AavePlugin(wallet);
