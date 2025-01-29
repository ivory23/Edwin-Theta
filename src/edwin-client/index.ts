import type { EdwinConfig, EdwinAction, DeFiProtocol } from '../types';

import {
  EdwinEVMWallet,
  EdwinSolanaWallet,
  EdwinWallet
} from '../edwin-core/wallets';

import { 
  SupplyAction,
  WithdrawAction,
  StakeAction,
  AddLiquidityAction,
  GetPoolsAction,
  RemoveLiquidityAction,
  SwapAction
} from '../edwin-core/actions';

import { 
  AaveProtocol,
  LidoProtocol,
  LuloProtocol,
  MeteoraProtocol,
  UniswapProtocol
} from '../protocols';

const ACTION_MAP: Record<string, new (edwin: Edwin) => EdwinAction> = {
  'supply': SupplyAction,
  'withdraw': WithdrawAction,
  'stake': StakeAction,
  'addLiquidity': AddLiquidityAction,
  'getPools': GetPoolsAction,
  'removeLiquidity': RemoveLiquidityAction,
  'swap': SwapAction
};

type SupportedActions = keyof typeof ACTION_MAP;
type ActionMap = {
  [K in SupportedActions]: InstanceType<typeof ACTION_MAP[K]>
}

export class Edwin {
  private wallets: Record<string, EdwinWallet> = {};
  public actions: ActionMap;
  public protocols: Record<string, DeFiProtocol> = {};

  constructor(config: EdwinConfig) {
    // Initialize wallets
    if (config.evmPrivateKey) {
        this.wallets['evm'] = new EdwinEVMWallet(config.evmPrivateKey);
    }
    if (config.solanaPrivateKey) {
        this.wallets['solana'] = new EdwinSolanaWallet(config.solanaPrivateKey);
    }
    // Initialize actions dynamically based on config
    this.actions = config.actions.reduce((acc, actionName) => {
      const ActionClass = ACTION_MAP[actionName as SupportedActions];
      if (!ActionClass) {
        throw new Error(`Unsupported action: ${actionName}`);
      }
      return {
        ...acc,
        [actionName]: new ActionClass(this)
      };
    }, {} as ActionMap);

    // Initialize protocols
    this.protocols['aave'] = new AaveProtocol(this.wallets['evm'] as EdwinEVMWallet);
    this.protocols['lido'] = new LidoProtocol(this.wallets['evm'] as EdwinEVMWallet);
    this.protocols['uniswap'] = new UniswapProtocol(this.wallets['evm'] as EdwinEVMWallet);
    this.protocols['lulo'] = new LuloProtocol(this.wallets['solana'] as EdwinSolanaWallet);
    this.protocols['meteora'] = new MeteoraProtocol(this.wallets['solana'] as EdwinSolanaWallet);    
  }

  public async getActions() {
    return Object.values(this.actions);
  }

  public async getPortfolio() {
      // Build wallet address section
      const walletAddresses = Object.entries(this.wallets)
          .map(([type, wallet]) => {
              const address = wallet.getAddress();
              // Capitalize wallet type and format address
              const formattedType = type.toUpperCase();
              return `${formattedType} wallet address: ${address}`;
          })
          .join('\n');

      // Get portfolio positions per each protocol
      const portfolioPromises = Object.entries(this.protocols).map(async ([name, protocol]) => {
          try {
              const portfolio = await protocol.getPortfolio();
              // Skip if portfolio is empty, null, undefined or empty string
              if (!portfolio || portfolio.length === 0) {
                  return null;
              }
              return `${name.toUpperCase()} Portfolio:\n${portfolio}`;
          } catch (error) {
              console.error(`Error getting portfolio for ${name}:`, error);
              return null;
          }
      });

      // Combine wallet addresses and portfolio results
      const portfolioResults = (await Promise.all(portfolioPromises))
          .filter(result => result !== null);

      return [walletAddresses, ...portfolioResults].join('\n\n');
  }
}
