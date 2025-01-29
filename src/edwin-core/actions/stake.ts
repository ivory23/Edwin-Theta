import type { EdwinAction, StakeParams } from "../../types";
import { stakeTemplate } from "../templates";
import { Edwin } from "../../edwin-client";

export class StakeAction implements EdwinAction {
    public name = 'STAKE';
    public description = 'Stake assets to a staking protocol';
    public template = stakeTemplate;
    public edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: StakeParams): Promise<string> {
        console.log(`Staking: ${params.amount} ${params.asset} on ${params.chain})`);

        throw new Error("Not implemented");
    }
}