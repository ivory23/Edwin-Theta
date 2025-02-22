import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { EdwinEVMWallet } from '../../core/wallets';
import { Chain } from '../../core/types';
import { LidoProtocol } from './lidoProtocol';

export class LidoPlugin extends EdwinPlugin {
    constructor(wallet: EdwinEVMWallet) {
        super('lido', [new LidoProtocol(wallet)]);
    }

    supportsChain = (_: Chain) => true;
}

export const lido = (wallet: EdwinEVMWallet) => new LidoPlugin(wallet);
