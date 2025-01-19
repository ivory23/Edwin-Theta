import { createWalletClient, http, type WalletClient, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { SupplyAction } from '../edwin-core/actions/lending';
import { StakeAction } from '../edwin-core/actions/stake';
import type { EdwinConfig, SupportedChain } from '../types';
import { EdwinWallet } from '../edwin-core/components/evm_wallet';

export class Edwin {
  private wallet: EdwinWallet;
  public lending: SupplyAction;
  public staking: StakeAction;

  constructor(config: EdwinConfig) {
    // Initialize wallet
    const account = privateKeyToAccount(config.privateKey);
    this.wallet = new EdwinWallet(account);

    // Initialize actions
    this.lending = new SupplyAction(this.wallet);
    this.staking = new StakeAction(this.wallet);
  }

  public getAddress(): string {
    return this.wallet.getAddress() || "";
  }

  public async switchChain(chain: SupportedChain) {
    this.wallet.switchChain(chain);
  }
}
