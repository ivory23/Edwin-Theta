import { EdwinConfig } from "../../types";
import { EdwinEVMWallet } from "./evm_wallet";
import { EdwinWallet } from "./wallet";
export class EdwinProvider {
    public wallets: Record<string, EdwinWallet> = {};

    constructor(config: EdwinConfig) {
        this.wallets['evm'] = new EdwinEVMWallet(config.evmPrivateKey);
    }
}

export { EdwinWallet } from "./wallet";
export { EdwinEVMWallet } from "./evm_wallet";