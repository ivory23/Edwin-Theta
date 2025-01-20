import { EdwinConfig } from "../../types";
import { EdwinEVMWallet } from "./evm_wallet";

export class EdwinWallet {
    private privateKey: string;
    public address: string;
    
    constructor(privateKey: string) {
        this.privateKey = privateKey;
        this.address = "0x123";
    }
};  


export class EdwinProvider {
    public wallets: Record<string, EdwinWallet> = {};

    constructor(config: EdwinConfig) {
        this.wallets['evm'] = new EdwinEVMWallet(config.evmPrivateKey);
    }
}