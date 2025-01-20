import { Chain } from 'viem';
import { Address } from "viem";
import { EdwinConfig } from "../../types";
import { EdwinEVMWallet } from "./evm_wallet";
import { privateKeyToAddress } from 'viem/accounts';

export class EdwinWallet {
    private address: Address | undefined;
    
    constructor(protected privateKey: `0x${string}`) {
        this.address = privateKeyToAddress(privateKey);
    }
    
    getAddress(): Address | undefined {
        return this.address;
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
