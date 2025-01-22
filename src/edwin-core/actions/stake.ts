import type { Transaction, EdwinAction, StakeParams } from "../../types";
import { EdwinProvider } from "../providers";
import { stakeTemplate } from "../templates";
// Exported for tests
export class StakeAction implements EdwinAction {
    public name = 'stake';
    public description = 'Stake assets to a staking protocol';
    public template = stakeTemplate;
    public provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: StakeParams): Promise<Transaction> {
        console.log(`Staking: ${params.amount} ${params.asset} on ${params.chain})`);

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