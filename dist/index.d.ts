import { Hash, Address, Chain, PrivateKeyAccount, PublicClient, HttpTransport, Account, WalletClient } from 'viem';
import { Token } from '@lifi/types';
import * as viemChains from 'viem/chains';

declare const _SupportedChainList: Array<keyof typeof viemChains>;
type SupportedChain = (typeof _SupportedChainList)[number];
interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    chainId?: number;
}
interface TokenWithBalance {
    token: Token;
    balance: bigint;
    formattedBalance: string;
    priceUSD: string;
    valueUSD: string;
}
interface WalletBalance {
    chain: SupportedChain;
    address: Address;
    totalValueUSD: string;
    tokens: TokenWithBalance[];
}
interface ChainMetadata {
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

declare class EdwinWallet {
    private cache;
    private cacheKey;
    private currentChain;
    private CACHE_EXPIRY_SEC;
    chains: Record<string, Chain>;
    account: PrivateKeyAccount | undefined;
    constructor(accountOrPrivateKey: PrivateKeyAccount | `0x${string}`, chains?: Record<string, Chain>);
    getAddress(): Address | undefined;
    getCurrentChain(): Chain;
    getPublicClient(chainName: SupportedChain): PublicClient<HttpTransport, Chain, Account | undefined>;
    getWalletClient(chainName: SupportedChain): WalletClient;
    getChainConfigs(chainName: SupportedChain): Chain;
    getWalletBalance(): Promise<string | null>;
    getWalletBalanceForChain(chainName: SupportedChain): Promise<string | null>;
    addChain(chain: Record<string, Chain>): void;
    switchChain(chainName: SupportedChain, customRpcUrl?: string): void;
    private setAccount;
    private setChains;
    private setCurrentChain;
    private createHttpTransport;
    static genChainFromName(chainName: string, customRpcUrl?: string | null): Chain;
}

interface BaseProtocolParams {
    protocol: string;
    chain: SupportedChain;
    amount: string;
    asset: string;
    data?: string;
    walletProvider: EdwinWallet;
}

interface LendingProtocolParams extends BaseProtocolParams {
}
interface SupplyParams extends LendingProtocolParams {
}

declare class SupplyAction {
    private walletProvider;
    constructor(walletProvider: EdwinWallet);
    supply(params: SupplyParams): Promise<Transaction>;
}

interface StakingParams extends BaseProtocolParams {
    contract: string;
}

declare class StakeAction {
    private walletProvider;
    constructor(walletProvider: EdwinWallet);
    stake(params: StakingParams): Promise<Transaction>;
}

export { type ChainMetadata, EdwinWallet, StakeAction, SupplyAction, type SupportedChain, type TokenWithBalance, type Transaction, type WalletBalance };
