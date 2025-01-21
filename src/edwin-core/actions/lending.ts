import { EdwinWallet } from "../providers/index";
import type { Transaction } from "../../types";
import { SupplyParams, WithdrawParams } from "../../types/";
import { getLendingProtocol } from "../../protocols";
import { EdwinAction } from "../../types";
import { z } from "zod";
import { supplyTemplate } from "../templates";

export class SupplyAction implements EdwinAction {
    public name = 'supply';
    public description = 'Supply assets to a lending protocol';
    public template = supplyTemplate;
    public schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        amount: z.string(),
        asset: z.string(),
        data: z.string().optional(),
        walletProvider: z.instanceof(EdwinWallet)
    });
    constructor() {}

    async execute(params: SupplyParams): Promise<Transaction> {
        console.log(
            `Supplying: ${params.amount} ${params.asset} to ${params.protocol} on ${params.chain})`
        );

        try {
            // Get the appropriate protocol service based on the protocol name
            const lendingProtocol = getLendingProtocol(params.protocol);
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
    public schema = z.object({
        protocol: z.string(),
        chain: z.string(),
        amount: z.string(),
        asset: z.string(),
        data: z.string().optional(),
        walletProvider: z.instanceof(EdwinWallet)
    });
    
    constructor() {}

    async execute(params: WithdrawParams): Promise<Transaction> {
        console.log(
            `Withdrawing: ${params.amount} ${params.asset} from ${params.protocol} on ${params.chain})`
        );

        try {
            // Get the appropriate protocol service based on the protocol name
            const lendingProtocol = getLendingProtocol(params.protocol);
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
