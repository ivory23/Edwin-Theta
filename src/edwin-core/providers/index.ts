import { EdwinConfig, SupportedChain } from "../../types";
import { EdwinEVMWallet, _SupportedEVMChainList } from "./evm_wallet";
import { EdwinWallet } from "./wallet";

export class EdwinProvider {
    public wallets: Record<string, EdwinWallet> = {};

    constructor(config: EdwinConfig) {
        this.wallets['evm'] = new EdwinEVMWallet(config.evmPrivateKey);
        // Extendable to add more wallets such as solana
    }

    getWallet(chain: SupportedChain): EdwinWallet {
        // Check if the chain is an EVM chain using the list from evm_wallet
        const evmChainNames = _SupportedEVMChainList.map(name => name.toLowerCase());
        if (evmChainNames.includes(chain.toLowerCase())) {
            return this.wallets['evm'];
        }
        else if (chain === 'solana') {
            return this.wallets['solana'];
        }
        throw new Error(`No matching wallet is loaded in Edwin to support chain: ${chain}`);
    }
}

export { EdwinWallet } from "./wallet";
export { EdwinEVMWallet } from "./evm_wallet";
