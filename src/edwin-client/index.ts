import type { EdwinConfig, EdwinAction } from '../types';
import { EdwinProvider } from '../edwin-core/providers';
import {
  SupplyAction,
  WithdrawAction,
  StakeAction,
  AddLiquidityAction,
  GetPoolsAction
} from '../edwin-core/actions';

const ACTION_MAP: Record<string, new (provider: EdwinProvider) => EdwinAction> = {
  'supply': SupplyAction,
  'withdraw': WithdrawAction,
  'stake': StakeAction,
  'addLiquidity': AddLiquidityAction,
  'getPools': GetPoolsAction
};

type SupportedActions = keyof typeof ACTION_MAP;
type ActionMap = {
  [K in SupportedActions]: InstanceType<typeof ACTION_MAP[K]>
}

export class Edwin {
  public provider: EdwinProvider;
  public actions: ActionMap;

  constructor(config: EdwinConfig) {
    // Initialize provider
    this.provider = new EdwinProvider(config);

    // Initialize actions dynamically based on config
    this.actions = config.actions.reduce((acc, actionName) => {
      const ActionClass = ACTION_MAP[actionName as SupportedActions];
      if (!ActionClass) {
        throw new Error(`Unsupported action: ${actionName}`);
      }
      return {
        ...acc,
        [actionName]: new ActionClass(this.provider)
      };
    }, {} as ActionMap);
  }

  public async getActions() {
    return Object.values(this.actions);
  }
}
