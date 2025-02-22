import { EdwinEVMWallet, EdwinSolanaWallet, EdwinWallet } from '../core/wallets';
import { EdwinPlugin } from '../core/classes';
import type { EdwinTool } from '../core/types';
import { aave, lido, lulo, meteora, uniswap, jupiter, cookie } from '../plugins';

export interface EdwinConfig {
    evmPrivateKey?: `0x${string}`;
    solanaPrivateKey?: string;
    plugins: string[];
}

export class Edwin {
    public wallets: Record<string, EdwinWallet> = {};
    public plugins: Record<string, EdwinPlugin> = {};

    constructor(config: EdwinConfig) {
        // Initialize wallets
        if (config.evmPrivateKey) {
            this.wallets.evm = new EdwinEVMWallet(config.evmPrivateKey);
        }
        if (config.solanaPrivateKey) {
            this.wallets.solana = new EdwinSolanaWallet(config.solanaPrivateKey);
        }

        // Initialize plugins
        if (this.wallets.evm) {
            this.plugins.aave = aave(this.wallets.evm as EdwinEVMWallet);
            this.plugins.lido = lido(this.wallets.evm as EdwinEVMWallet);
            this.plugins.uniswap = uniswap(this.wallets.evm as EdwinEVMWallet);
        }

        if (this.wallets.solana) {
            this.plugins.lulo = lulo(this.wallets.solana as EdwinSolanaWallet);
            this.plugins.meteora = meteora(this.wallets.solana as EdwinSolanaWallet);
            this.plugins.jupiter = jupiter(this.wallets.solana as EdwinSolanaWallet);
        }

        if (process.env.COOKIE_API_KEY) {
            this.plugins.cookie = cookie(process.env.COOKIE_API_KEY);
        }
    }

    async getTools(): Promise<Record<string, EdwinTool>> {
        const tools: Record<string, EdwinTool> = {};
        for (const plugin of Object.values(this.plugins)) {
            const pluginTools = plugin.getTools();
            for (const [name, tool] of Object.entries(pluginTools)) {
                tools[name] = tool;
            }
        }
        return tools;
    }
}
