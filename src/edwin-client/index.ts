import type { EdwinConfig, EdwinAction } from '../types';
import { EdwinProvider } from '../edwin-core/providers';
import {
  SupplyAction,
  WithdrawAction,
  StakeAction
 } from '../edwin-core/actions';


const ACTION_MAP: Record<string, new (provider: EdwinProvider) => EdwinAction> = {
  'supply': SupplyAction,
  'withdraw': WithdrawAction,
  'stake': StakeAction,
};

export class Edwin {
  public provider: EdwinProvider;
  public actions: EdwinAction[] = [];

  constructor(config: EdwinConfig) {
    // Initialize provider
    this.provider = new EdwinProvider(config);

    // Initialize actions with the wallet
    this.actions = config.actions
      .map(actionName => {
        const ActionClass = ACTION_MAP[actionName.toLowerCase()];
        if (!ActionClass) {
          throw new Error(`Unsupported action: ${actionName}`);
        }
        // Give each action the provider for usage in the action
        return new ActionClass(this.provider);
      })
      .filter((action): action is EdwinAction => action !== null);
  }

  public async getActions() {
    return this.actions;
  }
}
