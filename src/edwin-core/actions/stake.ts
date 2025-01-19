import { EdwinWallet } from "../components/evm_wallet";
import type { Transaction } from "../../types";
import { StakingParams } from "../../protocols/interfaces/staking";

// Exported for tests
export class StakeAction {
    constructor(private walletProvider: EdwinWallet) {}

    async stake(params: StakingParams): Promise<Transaction> {
        console.log(`Staking: ${params} tokens t)`);

        if (!params.data) {
            params.data = "0x";
        }

        // this.walletProvider.switchChain(params.chain);

        const walletClient = this.walletProvider.getWalletClient(params.chain);

        try {
            return {
                hash: "0x123",
                from: "0x456",
                to: "0x789",
                value: 0n,
            };
        } catch (error: any) {
            // If error has a message, use it
            if (error.message) {
                throw new Error(`Staking failed: ${error.message}`);
            }
            // Otherwise, use the error itself
            throw new Error(`Staking failed: ${error}`);
        }
    }
}