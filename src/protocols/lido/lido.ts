import { parseEther } from "viem";
import type { IStakingProtocol, StakeParams } from "../../types";
import type { Transaction } from "../../types";
import { EdwinEVMWallet } from "../../edwin-core/providers/evm_wallet";

export class LidoProtocol implements IStakingProtocol {
    async stake(params: StakeParams): Promise<Transaction> {
        const { walletProvider, chain, amount } = params;

        if (!(walletProvider instanceof EdwinEVMWallet)) {
            throw new Error('Wallet provider is not an instance of EdwinEVMWallet');
        }
        const evmWallet = walletProvider as EdwinEVMWallet;
        evmWallet.switchChain(chain);
        console.log(`Switched to chain: ${chain}`);

        const walletClient = evmWallet.getWalletClient(chain);

        // Implement Lido-specific staking logic
        return {
            hash: "0x123",
            from: walletClient.account?.address || "0x456",
            to: "0x789",
            value: parseEther(amount),
        };
    }

    async unstake(params: StakeParams): Promise<Transaction> {
        const { walletProvider, chain, amount } = params;

        if (!(walletProvider instanceof EdwinEVMWallet)) {
            throw new Error('Wallet provider is not an instance of EdwinEVMWallet');
        }
        const evmWallet = walletProvider as EdwinEVMWallet;
        evmWallet.switchChain(chain);
        console.log(`Switched to chain: ${chain}`);

        const walletClient = evmWallet.getWalletClient(chain);

        // Implement Lido-specific unstaking logic
        return {
            hash: "0x123",
            from: walletClient.account?.address || "0x456",
            to: "0x789",
            value: parseEther("0"),
        };
    }

    async claimRewards(params: StakeParams): Promise<Transaction> {
        const { walletProvider, chain } = params;

        if (!(walletProvider instanceof EdwinEVMWallet)) {
            throw new Error('Wallet provider is not an instance of EdwinEVMWallet');
        }
        const evmWallet = walletProvider as EdwinEVMWallet;
        evmWallet.switchChain(chain);
        console.log(`Switched to chain: ${chain}`);

        const walletClient = evmWallet.getWalletClient(chain);

        // Implement rewards claiming logic
        return {
            hash: "0x123",
            from: walletClient.account?.address || "0x456",
            to: "0x789",
            value: parseEther("0"),
        };
    }
}
