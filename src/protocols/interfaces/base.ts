import type { Transaction, SupportedChain } from "../../types";
import type { EdwinWallet } from "../../providers/wallet";

// Base interface for all protocol parameters
export interface BaseProtocolParams {
    protocol: string;
    chain: SupportedChain;
    amount: string;
    asset: string;
    data?: string;
    walletProvider: EdwinWallet;
}

// Common types used across protocols
export type { Transaction };
