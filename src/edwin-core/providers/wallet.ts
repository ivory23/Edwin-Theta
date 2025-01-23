import { privateKeyToAddress } from 'viem/accounts';
import { Chain } from 'viem';
import { Address } from "viem";

export class EdwinWallet {
    private address: Address | undefined;

    constructor(protected privateKey: string) {
        this.address = privateKeyToAddress(privateKey as `0x${string}`);
    }
    
    getAddress(): Address | undefined {
        return this.address;
    }
    
    getCurrentChain(): Chain {
        throw new Error("Method not implemented.");
    }
}