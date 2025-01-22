import { privateKeyToAddress } from 'viem/accounts';
import { Chain } from 'viem';
import { Address } from "viem";

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