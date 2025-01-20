import type { EdwinWallet } from '../../types';
import { EdwinConfig } from "../../types";
import { EdwinEVMWallet } from "./evm_wallet";

export class EdwinProvider {
    public wallets: Record<string, EdwinWallet> = {};

    constructor(config: EdwinConfig) {
        this.wallets['evm'] = new EdwinEVMWallet(config.evmPrivateKey);
    }
}