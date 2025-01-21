import type { Token } from "@lifi/types";
import type { Address, Chain, Hash } from "viem";
import { EdwinWallet } from "../edwin-core/providers/wallet";
import { EdwinProvider } from "../edwin-core/providers";
import { _SupportedEVMChainList } from "../edwin-core/providers/evm_wallet";

export type { EdwinWallet, EdwinProvider };

export type SupportedEVMChain = (typeof _SupportedEVMChainList)[number];

export type SupportedChain = SupportedEVMChain | 'solana';

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
    chain: SupportedEVMChain;
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
    chain: SupportedEVMChain;
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
    supportedChains: SupportedChain[];
    supply(params: SupplyParams, walletProvider: EdwinWallet): Promise<Transaction>;
    withdraw(params: WithdrawParams, walletProvider: EdwinWallet): Promise<Transaction>;
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
    template: string;
    provider: EdwinProvider;
    execute: (params: ActionParams) => Promise<Transaction>;
}
