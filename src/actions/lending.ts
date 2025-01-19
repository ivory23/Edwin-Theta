import { EdwinWallet } from "../providers/wallet";
import type { Transaction } from "../types";
import { SupplyParams } from "../protocols/interfaces/lending";
import { getLendingProtocol } from "../protocols";

export class SupplyAction {
    constructor(private walletProvider: EdwinWallet) {}

    async supply(params: SupplyParams): Promise<Transaction> {
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
            return await lendingProtocol.supply({
                ...params,
                walletProvider: this.walletProvider,
            });
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