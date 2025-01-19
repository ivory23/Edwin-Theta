import { type Transaction } from "../types";
import {
    type ILendingProtocol,
    type LendingProtocolParams,
} from "./interfaces";
import { parseEther } from "viem";

export class Morpho implements ILendingProtocol {
    async supply(params: LendingProtocolParams): Promise<Transaction> {
        const { walletProvider, chain, amount, data } = params;

        // Switch to the correct chain
        await walletProvider.switchChain(chain);
        const walletClient = walletProvider.getWalletClient(chain);

        // Implement Morpho-specific supply logic here
        // For example:
        // const hash = await walletClient.sendTransaction({
        //     account: walletClient.account,
        //     to: contract,
        //     value: parseEther(amount),
        //     data: data,
        // });

        // Temporary mock implementation
        return {
            hash: "0x123",
            from: "0x456",
            to: "0x789",
            value: parseEther(amount),
        };
    }
}
