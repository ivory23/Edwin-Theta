import type { Token } from "@lifi/types";
import type {
    Address,
    Chain,
    Hash,
} from "viem";
import * as viemChains from "viem/chains";
import { EdwinWallet } from "../edwin-core/providers";
import { z } from "zod";


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
    evmPrivateKey: `0x${string}`;
    solanaPrivateKey: `0x${string}`;
    actions: string[];
}

// Base interface for all protocol parameters
export interface ActionParams {
    protocol: string;
    chain: SupportedChain;
    amount: string;
    asset: string;
    data?: string;
    walletProvider: EdwinWallet;
}

export interface SupplyParams extends ActionParams {}

export interface WithdrawParams extends ActionParams {}

export interface StakeParams extends ActionParams {}
export interface SwapParams extends ActionParams {
    contract: string;
    tokenIn: string;
    tokenOut: string;
    amountOut?: string;
    slippage: number;
    recipient?: string;
}

export interface LiquidityParams extends ActionParams {
    contract: string;
    tokenA: string;
    tokenB: string;
    amountB: string;
}

export interface ILendingProtocol {
    supply(params: SupplyParams): Promise<Transaction>;
    withdraw(params: WithdrawParams): Promise<Transaction>;
}

export interface IStakingProtocol {
    stake(params: StakeParams): Promise<Transaction>;
    unstake(params: StakeParams): Promise<Transaction>;
    claimRewards?(params: StakeParams): Promise<Transaction>;
}

export interface IDEXProtocol {
    swap(params: SwapParams): Promise<Transaction>;
    addLiquidity?(params: LiquidityParams): Promise<Transaction>;
    removeLiquidity?(params: LiquidityParams): Promise<Transaction>;
    getQuote?(params: SwapParams): Promise<string>;
}

export interface EdwinAction {
    name: string;
    description: string;
    schema: z.ZodSchema;
    execute: (params: ActionParams) => Promise<Transaction>;
}