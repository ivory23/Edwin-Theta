import { parseEther } from "viem";
import type { IStakingProtocol, StakeParams, SupportedChain } from "../../types";
import type { Transaction } from "../../types";
import { EdwinEVMWallet } from "../../edwin-core/providers/evm_wallet";

export class LidoProtocol implements IStakingProtocol {
    supportedChains: SupportedChain[] = ["mainnet"];

    async stake(params: StakeParams, walletProvider: EdwinEVMWallet): Promise<string> {
        const { chain, amount } = params;

        throw new Error("Not implemented");
    }

    async unstake(params: StakeParams, walletProvider: EdwinEVMWallet): Promise<string> {
        const { chain, amount } = params;

        throw new Error("Not implemented");
    }

    async claimRewards(params: StakeParams, walletProvider: EdwinEVMWallet): Promise<string> {
        const { chain } = params;

        throw new Error("Not implemented");
    }
}
