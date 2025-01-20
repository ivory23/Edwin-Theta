import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
} from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import type {
    Address,
    WalletClient,
    PublicClient,
    Chain,
    HttpTransport,
    Account,
    PrivateKeyAccount,
} from "viem";
import * as viemChains from "viem/chains";
import type { SupportedChain } from "../../types";
import { EdwinWallet } from ".";

export class EdwinEVMWallet extends EdwinWallet {
    private currentChain: SupportedChain = "mainnet";
    public chains: Record<string, Chain> = { ...viemChains };
    private account: PrivateKeyAccount | undefined;
    constructor(
        privateKey: `0x${string}`) {
        super(privateKey);
    }

    getAddress(): Address | undefined {
        return this.account?.address;
    }

    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        const transport = this.createHttpTransport(chainName);

        const publicClient = createPublicClient({
            chain: this.chains[chainName],
            transport,
        });
        return publicClient;
    }

    getWalletClient(chainName: SupportedChain): WalletClient {
        const transport = this.createHttpTransport(chainName);

        const walletClient = createWalletClient({
            chain: this.chains[chainName],
            transport,
            account: this.account,
        });

        return walletClient;
    }

    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = viemChains[chainName];

        if (!chain?.id) {
            throw new Error("Invalid chain name");
        }

        return chain;
    }

    async getWalletBalance(): Promise<string | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
            if (!this.account?.address) {
                throw new Error("Account not set");
            }
            const balance = await client.getBalance({
                address: this.account.address,
            });
            const balanceFormatted = formatUnits(balance, 18);
            console.log(
                "Wallet balance cached for chain: ",
                this.currentChain
            );
            return balanceFormatted;
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    async getWalletBalanceForChain(
        chainName: SupportedChain
    ): Promise<string | null> {
        try {
            const client = this.getPublicClient(chainName);
            if (!this.account?.address) {
                throw new Error("Account not set");
            }
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    addChain(chain: Record<string, Chain>) {
        this.setChains(chain);
    }

    switchChain(chainName: SupportedChain, customRpcUrl?: string) {
        if (!this.chains[chainName]) {
            const chain = EdwinEVMWallet.genChainFromName(
                chainName,
                customRpcUrl
            );
            this.addChain({ [chainName]: chain });
        }
        this.setCurrentChain(chainName);
    }

    private setAccount = (privateKey: `0x${string}`) => {
        this.account = privateKeyToAccount(privateKey);
    };

    private setChains = (chains?: Record<string, Chain>) => {
        if (!chains) {
            return;
        }
        Object.keys(chains).forEach((chain: string) => {
            this.chains[chain] = chains[chain];
        });
    };

    private setCurrentChain = (chain: SupportedChain) => {
        this.currentChain = chain;
    };

    private createHttpTransport = (chainName: SupportedChain) => {
        const chain = this.chains[chainName];

        if (chain.rpcUrls.custom) {
            return http(chain.rpcUrls.custom.http[0]);
        }
        return http(chain.rpcUrls.default.http[0]);
    };

    static genChainFromName(
        chainName: string,
        customRpcUrl?: string | null
    ): Chain {
        const baseChain = viemChains[chainName as keyof typeof viemChains];

        if (!baseChain?.id) {
            throw new Error("Invalid chain name");
        }

        const viemChain: Chain = customRpcUrl
            ? {
                  ...baseChain,
                  rpcUrls: {
                      ...baseChain.rpcUrls,
                      custom: {
                          http: [customRpcUrl],
                      },
                  },
              }
            : baseChain;

        return viemChain;
    }
}
