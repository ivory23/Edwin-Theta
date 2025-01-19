// src/protocols/aave.ts
import { Pool } from "@aave/contract-helpers";
import { ethers, providers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { AaveV3Base } from "@bgd-labs/aave-address-book";
var AaveProtocol = class {
  async submitTransaction(provider, wallet, tx) {
    console.log("Preparing to send transaction...");
    const extendedTxData = await tx.tx();
    console.log("Got extended transaction data");
    const { from, ...txData } = extendedTxData;
    console.log(`Transaction from address: ${from}`);
    console.log("Sending transaction...");
    const txResponse = await wallet.sendTransaction(txData);
    console.log(`Transaction sent with hash: ${txResponse.hash}`);
    return {
      hash: txResponse.hash,
      from,
      to: txData.to,
      value: BigInt(txData.value || 0)
    };
  }
  async supply(params) {
    const { chain, amount, asset, data, walletProvider } = params;
    console.log(
      `Calling the inner AAVE logic to supply ${amount} ${asset}`
    );
    try {
      walletProvider.switchChain(chain);
      console.log(`Switched to chain: ${chain}`);
      const walletClient = walletProvider.getWalletClient(chain);
      console.log(`Got wallet client for chain: ${chain}`);
      console.log(`Transport RPC URL: ${walletClient.transport.url}`);
      const provider = new providers.JsonRpcProvider(walletClient.transport.url);
      console.log(`Created ethers provider`);
      const ethers_wallet = new ethers.Wallet(
        process.env.EVM_PRIVATE_KEY,
        provider
      );
      ethers_wallet.connect(provider);
      console.log(`Created ethers wallet`);
      const pool = new Pool(ethers_wallet.provider, {
        POOL: AaveV3Base.POOL,
        WETH_GATEWAY: AaveV3Base.WETH_GATEWAY
      });
      console.log(
        `Initialized Aave Pool with contract: ${AaveV3Base.POOL}`
      );
      const assetKey = Object.keys(AaveV3Base.ASSETS).find(
        (key) => key.toLowerCase() === asset.toLowerCase()
      );
      const reserve = assetKey ? AaveV3Base.ASSETS[assetKey].UNDERLYING : void 0;
      if (!reserve) {
        throw new Error(`Unsupported asset: ${asset}`);
      }
      const decimals = AaveV3Base.ASSETS[assetKey].decimals;
      const amountInWei = parseUnits(amount, decimals);
      console.log(
        `Converted amount ${amount} to wei: ${amountInWei.toString()}`
      );
      console.log(`Reserve: ${reserve}`);
      const supplyParams = {
        user: walletClient.account?.address,
        reserve,
        // The address of the reserve
        amount
      };
      console.log(`Prepared supply params:`, supplyParams);
      const txs = await pool.supply(supplyParams);
      console.log(`Generated ${txs.length} supply transaction(s)`);
      const balance = await provider.getBalance(
        walletClient.account.address
      );
      console.log(`Balance: ${balance}`);
      if (txs && txs.length > 0) {
        console.log(`Submitting supply transactions`);
        const results = [];
        for (const tx of txs) {
          const result = await this.submitTransaction(
            ethers_wallet.provider,
            ethers_wallet,
            tx
          );
          results.push(result);
        }
        return results[results.length - 1];
      }
      throw new Error("No transaction generated from Aave Pool");
    } catch (error) {
      console.error("Aave supply error:", error);
      throw new Error(`Aave supply failed: ${error.message}`);
    }
  }
  async withdraw(params) {
    const { amount, asset } = params;
    console.log(
      `Calling the inner AAVE logic to withdraw ${amount} ${asset}`
    );
    try {
      throw new Error("Not implemented");
    } catch (error) {
      console.error("Aave withdraw error:", error);
      throw new Error(`Aave withdraw failed: ${error.message}`);
    }
  }
};

// src/protocols/uniswap.ts
import { parseEther } from "viem";
var UniswapProtocol = class {
  async swap(params) {
    const {
      walletProvider,
      chain,
      contract,
      tokenIn,
      tokenOut,
      amount,
      slippage
    } = params;
    await walletProvider.switchChain(chain);
    const walletClient = walletProvider.getWalletClient(chain);
    return {
      hash: "0x123",
      from: walletClient.account?.address || "0x456",
      to: "0x789",
      value: parseEther(amount)
    };
  }
  async addLiquidity(params) {
    const {
      walletProvider,
      chain,
      contract,
      tokenA,
      tokenB,
      amount,
      amountB
    } = params;
    await walletProvider.switchChain(chain);
    const walletClient = walletProvider.getWalletClient(chain);
    return {
      hash: "0x123",
      from: walletClient.account?.address || "0x456",
      to: "0x789",
      value: parseEther("0")
    };
  }
  async getQuote(params) {
    return "0";
  }
};

// src/protocols/lido.ts
import { parseEther as parseEther2 } from "viem";
var LidoProtocol = class {
  async stake(params) {
    const { walletProvider, chain, contract, amount } = params;
    await walletProvider.switchChain(chain);
    const walletClient = walletProvider.getWalletClient(chain);
    return {
      hash: "0x123",
      from: walletClient.account?.address || "0x456",
      to: "0x789",
      value: parseEther2(amount)
    };
  }
  async unstake(params) {
    const { walletProvider, chain, contract, amount } = params;
    await walletProvider.switchChain(chain);
    const walletClient = walletProvider.getWalletClient(chain);
    return {
      hash: "0x123",
      from: walletClient.account?.address || "0x456",
      to: "0x789",
      value: parseEther2("0")
    };
  }
  async claimRewards(params) {
    const { walletProvider, chain, contract } = params;
    await walletProvider.switchChain(chain);
    const walletClient = walletProvider.getWalletClient(chain);
    return {
      hash: "0x123",
      from: walletClient.account?.address || "0x456",
      to: "0x789",
      value: parseEther2("0")
    };
  }
};

// src/protocols/index.ts
var protocols = {
  // Lending
  aave: new AaveProtocol(),
  // DEX
  uniswap: new UniswapProtocol(),
  // Staking
  lido: new LidoProtocol()
};
function getLendingProtocol(name) {
  const protocol = protocols[name.toLowerCase()];
  return "supply" in protocol ? protocol : void 0;
}

// src/actions/lending.ts
var SupplyAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async supply(params) {
    console.log(
      `Supplying: ${params.amount} ${params.asset} to ${params.protocol} on ${params.chain})`
    );
    try {
      const lendingProtocol = getLendingProtocol(params.protocol);
      if (!lendingProtocol) {
        throw new Error(`Unsupported protocol: ${params.protocol}`);
      }
      return await lendingProtocol.supply({
        ...params,
        walletProvider: this.walletProvider
      });
    } catch (error) {
      if (error.message) {
        throw new Error(`Supply failed: ${error.message}`);
      }
      throw new Error(`Supply failed: ${error}`);
    }
  }
};

// src/actions/stake.ts
var StakeAction = class {
  constructor(walletProvider) {
    this.walletProvider = walletProvider;
  }
  async stake(params) {
    console.log(`Staking: ${params} tokens t)`);
    if (!params.data) {
      params.data = "0x";
    }
    const walletClient = this.walletProvider.getWalletClient(params.chain);
    try {
      return {
        hash: "0x123",
        from: "0x456",
        to: "0x789",
        value: 0n
      };
    } catch (error) {
      if (error.message) {
        throw new Error(`Staking failed: ${error.message}`);
      }
      throw new Error(`Staking failed: ${error}`);
    }
  }
};

// src/providers/wallet.ts
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as viemChains from "viem/chains";
import NodeCache from "node-cache";
var EdwinWallet = class _EdwinWallet {
  constructor(accountOrPrivateKey, chains) {
    this.cacheKey = "evm/wallet";
    this.currentChain = "mainnet";
    this.CACHE_EXPIRY_SEC = 5;
    this.chains = { ...viemChains };
    this.setAccount = (accountOrPrivateKey) => {
      if (typeof accountOrPrivateKey === "string") {
        this.account = privateKeyToAccount(accountOrPrivateKey);
      } else {
        this.account = accountOrPrivateKey;
      }
    };
    this.setChains = (chains) => {
      if (!chains) {
        return;
      }
      Object.keys(chains).forEach((chain) => {
        this.chains[chain] = chains[chain];
      });
    };
    this.setCurrentChain = (chain) => {
      this.currentChain = chain;
    };
    this.createHttpTransport = (chainName) => {
      const chain = this.chains[chainName];
      if (chain.rpcUrls.custom) {
        return http(chain.rpcUrls.custom.http[0]);
      }
      return http(chain.rpcUrls.default.http[0]);
    };
    this.setAccount(accountOrPrivateKey);
    this.setChains(chains);
    if (chains && Object.keys(chains).length > 0) {
      this.setCurrentChain(Object.keys(chains)[0]);
    }
    this.cache = new NodeCache({ stdTTL: this.CACHE_EXPIRY_SEC });
  }
  getAddress() {
    return this.account?.address;
  }
  getCurrentChain() {
    return this.chains[this.currentChain];
  }
  getPublicClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const publicClient = createPublicClient({
      chain: this.chains[chainName],
      transport
    });
    return publicClient;
  }
  getWalletClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const walletClient = createWalletClient({
      chain: this.chains[chainName],
      transport,
      account: this.account
    });
    return walletClient;
  }
  getChainConfigs(chainName) {
    const chain = viemChains[chainName];
    if (!chain?.id) {
      throw new Error("Invalid chain name");
    }
    return chain;
  }
  async getWalletBalance() {
    try {
      const client = this.getPublicClient(this.currentChain);
      if (!this.account?.address) {
        throw new Error("Account not set");
      }
      const balance = await client.getBalance({
        address: this.account.address
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
  async getWalletBalanceForChain(chainName) {
    try {
      const client = this.getPublicClient(chainName);
      if (!this.account?.address) {
        throw new Error("Account not set");
      }
      const balance = await client.getBalance({
        address: this.account.address
      });
      return formatUnits(balance, 18);
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  }
  addChain(chain) {
    this.setChains(chain);
  }
  switchChain(chainName, customRpcUrl) {
    if (!this.chains[chainName]) {
      const chain = _EdwinWallet.genChainFromName(
        chainName,
        customRpcUrl
      );
      this.addChain({ [chainName]: chain });
    }
    this.setCurrentChain(chainName);
  }
  static genChainFromName(chainName, customRpcUrl) {
    const baseChain = viemChains[chainName];
    if (!baseChain?.id) {
      throw new Error("Invalid chain name");
    }
    const viemChain = customRpcUrl ? {
      ...baseChain,
      rpcUrls: {
        ...baseChain.rpcUrls,
        custom: {
          http: [customRpcUrl]
        }
      }
    } : baseChain;
    return viemChain;
  }
};

// src/types/index.ts
import * as viemChains2 from "viem/chains";
var _SupportedChainList = Object.keys(viemChains2);
export {
  EdwinWallet,
  StakeAction,
  SupplyAction
};
//# sourceMappingURL=index.mjs.map