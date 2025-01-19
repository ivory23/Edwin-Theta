import { BaseProtocolParams } from "./base";
import type { Transaction } from "./base";

export interface LendingProtocolParams extends BaseProtocolParams {}

export interface SupplyParams extends LendingProtocolParams {}

export interface WithdrawParams extends LendingProtocolParams {}

export interface ILendingProtocol {
    supply(params: SupplyParams): Promise<Transaction>;
    withdraw?(params: WithdrawParams): Promise<Transaction>;
}
