import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { AaveProtocol } from './aaveProtocol';
import { EdwinEVMWallet } from '../../core/wallets';
import { Chain, EdwinTool } from '../../core/types';
import { z } from 'zod';
import { SupplyParameters, WithdrawParameters } from './paramters';

class AavePlugin extends EdwinPlugin {
    constructor(wallet: EdwinEVMWallet) {
        super('aave', [new AaveProtocol(wallet)]);
    }

    getTools(): Record<string, EdwinTool> {
        const aaveProtocol = this.toolProviders.find(provider => provider instanceof AaveProtocol) as AaveProtocol;

        return {
            aave_supply: {
                name: 'aave_supply',
                description: 'Supply assets to AAVE protocol',
                schema: z.object({
                    chain: z.string().min(1),
                    asset: z.string().min(1),
                    amount: z.number().positive(),
                }),
                execute: async (params: SupplyParameters) => {
                    return await aaveProtocol.supply(params);
                },
            },
            aave_withdraw: {
                name: 'aave_withdraw',
                description: 'Withdraw assets from AAVE protocol',
                schema: z.object({
                    asset: z.string().min(1),
                    amount: z.number().positive(),
                }),
                execute: async (params: WithdrawParameters) => {
                    return await aaveProtocol.withdraw(params);
                },
            },
        };
    }

    supportsChain = (chain: Chain) => chain.type === 'solana';
}

export const aave = (wallet: EdwinEVMWallet) => new AavePlugin(wallet);
