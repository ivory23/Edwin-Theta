import type { SupplyParams, WithdrawParams, EdwinAction, ILendingProtocol } from "../../types";
import { Edwin } from "../../edwin-client";
import { supplyTemplate, withdrawTemplate } from "../templates";

export class SupplyAction implements EdwinAction {
    public name = 'SUPPLY';
    public description = 'Supply assets to a lending protocol';
    public template = supplyTemplate;
    public edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: SupplyParams): Promise<string> {
        console.log(
            `Supplying: ${params.amount} ${params.asset} to ${params.protocol} on ${params.chain})`
        );

        try {
            console.log(`Getting lending protocol for: ${params.protocol}`);
            // Get the appropriate protocol service based on the protocol name
            const lendingProtocol = this.edwin.protocols[params.protocol] as ILendingProtocol;
            if (!lendingProtocol) {
                throw new Error(`Unsupported protocol: ${params.protocol}`);
            }
            // Use the protocol-specific supply implementation
            return await lendingProtocol.supply(params);
        } catch (error: any) {
            // If error has a message, use it
            if (error.message) {
                throw new Error(`Supply failed: ${error.message}`);
            }
            // Otherwise, use the error itself
            throw new Error(`Supply failed: ${error}`);
        }
    }
}
export class WithdrawAction implements EdwinAction {
    public name = 'withdraw';
    public description = 'Withdraw assets from a lending protocol';
    public template = withdrawTemplate;
    public edwin: Edwin;

    constructor(edwin: Edwin) {
        this.edwin = edwin;
    }

    async execute(params: WithdrawParams): Promise<string> {
        console.log(
            `Withdrawing: ${params.amount} ${params.asset} from ${params.protocol} on ${params.chain})`
        );
        try {
            // Get the appropriate protocol service based on the protocol name
            const lendingProtocol = this.edwin.protocols[params.protocol] as ILendingProtocol;
            if (!lendingProtocol) {
                throw new Error(`Unsupported protocol: ${params.protocol}`);
            }
            // Use the protocol-specific withdraw implementation
            return await lendingProtocol.withdraw(params);
        } catch (error: any) {
            // If error has a message, use it
            if (error.message) {
                throw new Error(`Withdraw failed: ${error.message}`);
            }
            // Otherwise, use the error itself
            throw new Error(`Withdraw failed: ${error}`);
        }
    }
}
