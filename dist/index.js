"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  EdwinWallet: () => EdwinWallet,
  StakeAction: () => StakeAction,
  SupplyAction: () => SupplyAction
});
module.exports = __toCommonJS(index_exports);

// src/protocols/aave.ts
var import_contract_helpers = require("@aave/contract-helpers");
var import_ethers = require("ethers");
var import_utils = require("ethers/lib/utils");
var import_aave_address_book = require("@bgd-labs/aave-address-book");
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
      const provider = new import_ethers.providers.JsonRpcProvider(walletClient.transport.url);
      console.log(`Created ethers provider`);
      const ethers_wallet = new import_ethers.ethers.Wallet(
        process.env.EVM_PRIVATE_KEY,
        provider
      );
      ethers_wallet.connect(provider);
      console.log(`Created ethers wallet`);
      const pool = new import_contract_helpers.Pool(ethers_wallet.provider, {
        POOL: import_aave_address_book.AaveV3Base.POOL,
        WETH_GATEWAY: import_aave_address_book.AaveV3Base.WETH_GATEWAY
      });
      console.log(
        `Initialized Aave Pool with contract: ${import_aave_address_book.AaveV3Base.POOL}`
      );
      const assetKey = Object.keys(import_aave_address_book.AaveV3Base.ASSETS).find(
        (key) => key.toLowerCase() === asset.toLowerCase()
      );
      const reserve = assetKey ? import_aave_address_book.AaveV3Base.ASSETS[assetKey].UNDERLYING : void 0;
      if (!reserve) {
        throw new Error(`Unsupported asset: ${asset}`);
      }
      const decimals = import_aave_address_book.AaveV3Base.ASSETS[assetKey].decimals;
      const amountInWei = (0, import_utils.parseUnits)(amount, decimals);
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
var import_viem = require("viem");
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
      value: (0, import_viem.parseEther)(amount)
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
      value: (0, import_viem.parseEther)("0")
    };
  }
  async getQuote(params) {
    return "0";
  }
};

// src/protocols/lido.ts
var import_viem2 = require("viem");
var LidoProtocol = class {
  async stake(params) {
    const { walletProvider, chain, contract, amount } = params;
    await walletProvider.switchChain(chain);
    const walletClient = walletProvider.getWalletClient(chain);
    return {
      hash: "0x123",
      from: walletClient.account?.address || "0x456",
      to: "0x789",
      value: (0, import_viem2.parseEther)(amount)
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
      value: (0, import_viem2.parseEther)("0")
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
      value: (0, import_viem2.parseEther)("0")
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
var import_viem3 = require("viem");
var import_accounts = require("viem/accounts");
var viemChains = __toESM(require("viem/chains"));
var import_node_cache = __toESM(require("node-cache"));
var EdwinWallet = class _EdwinWallet {
  constructor(accountOrPrivateKey, chains) {
    this.cacheKey = "evm/wallet";
    this.currentChain = "mainnet";
    this.CACHE_EXPIRY_SEC = 5;
    this.chains = { ...viemChains };
    this.setAccount = (accountOrPrivateKey) => {
      if (typeof accountOrPrivateKey === "string") {
        this.account = (0, import_accounts.privateKeyToAccount)(accountOrPrivateKey);
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
        return (0, import_viem3.http)(chain.rpcUrls.custom.http[0]);
      }
      return (0, import_viem3.http)(chain.rpcUrls.default.http[0]);
    };
    this.setAccount(accountOrPrivateKey);
    this.setChains(chains);
    if (chains && Object.keys(chains).length > 0) {
      this.setCurrentChain(Object.keys(chains)[0]);
    }
    this.cache = new import_node_cache.default({ stdTTL: this.CACHE_EXPIRY_SEC });
  }
  getAddress() {
    return this.account?.address;
  }
  getCurrentChain() {
    return this.chains[this.currentChain];
  }
  getPublicClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const publicClient = (0, import_viem3.createPublicClient)({
      chain: this.chains[chainName],
      transport
    });
    return publicClient;
  }
  getWalletClient(chainName) {
    const transport = this.createHttpTransport(chainName);
    const walletClient = (0, import_viem3.createWalletClient)({
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
      const balanceFormatted = (0, import_viem3.formatUnits)(balance, 18);
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
      return (0, import_viem3.formatUnits)(balance, 18);
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
var viemChains2 = __toESM(require("viem/chains"));
var _SupportedChainList = Object.keys(viemChains2);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EdwinWallet,
  StakeAction,
  SupplyAction
});
//# sourceMappingURL=index.js.map