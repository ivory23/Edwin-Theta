import { BaseProtocolParams } from "./base";
import type { Transaction } from "./base";

export interface StakingParams extends BaseProtocolParams {
    contract: string;
}

export interface IStakingProtocol {
    stake(params: StakingParams): Promise<Transaction>;
    unstake(params: StakingParams): Promise<Transaction>;
    claimRewards?(params: StakingParams): Promise<Transaction>;
}
