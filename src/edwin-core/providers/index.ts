import { Chain } from 'viem';
import { Address } from "viem";
import { EdwinConfig } from "../../types";
import { EdwinEVMWallet } from "./evm_wallet";

export class EdwinWallet {
    constructor(protected privateKey: `0x${string}`) {}
    
    getAddress(): Address | undefined {
        throw new Error("Method not implemented.");
    }
    
    getCurrentChain(): Chain {
        throw new Error("Method not implemented.");
    }
}
export class EdwinProvider {
    public wallets: Record<string, EdwinWallet> = {};

    constructor(config: EdwinConfig) {
        this.wallets['evm'] = new EdwinEVMWallet(config.evmPrivateKey);
    }
}
