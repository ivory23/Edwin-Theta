import type { Transaction, EdwinAction, StakeParams } from "../../types";
import { EdwinProvider } from "../providers";
import { stakeTemplate } from "../templates";

export class StakeAction implements EdwinAction {
    public name = 'STAKE';
    public description = 'Stake assets to a staking protocol';
    public template = stakeTemplate;
    public provider: EdwinProvider;

    constructor(provider: EdwinProvider) {
        this.provider = provider;
    }

    async execute(params: StakeParams): Promise<Transaction> {
        console.log(`Staking: ${params.amount} ${params.asset} on ${params.chain})`);

        throw new Error("Not implemented");
    }
}