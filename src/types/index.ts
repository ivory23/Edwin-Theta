import type { Token } from "@lifi/types";
import type {
    Address,
    Chain,
    Hash,
} from "viem";
import * as viemChains from "viem/chains";

const _SupportedChainList = Object.keys(viemChains) as Array<
    keyof typeof viemChains
>;
export type SupportedChain = (typeof _SupportedChainList)[number];

// Transaction types
export interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    chainId?: number;
}

// Token types
export interface TokenWithBalance {
    token: Token;
    balance: bigint;
    formattedBalance: string;
    priceUSD: string;
    valueUSD: string;
}

export interface WalletBalance {
    chain: SupportedChain;
    address: Address;
    totalValueUSD: string;
    tokens: TokenWithBalance[];
}

// Chain configuration
export interface ChainMetadata {
    chainId: number;
    name: string;
    chain: Chain;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl: string;
}

export interface EdwinConfig {
    privateKey: `0x${string}`;
}

export interface SupplyParams {
    chain: string;
    protocol: string;
    contract: string;
    amount: string;
    asset: string;
}

export interface WithdrawParams {
    chain: string;
    protocol: string;
    contract: string;
    amount: string;
    asset: string;
}

export interface StakeParams {
    chain: string;
    protocol: string;
    contract: string;
    amount: string;
    asset: string;
}
