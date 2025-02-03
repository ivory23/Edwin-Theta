import { DeFiProtocol } from '../types';
import { AaveProtocol, LidoProtocol, LuloProtocol, MeteoraProtocol, UniswapProtocol } from '../protocols';
import { EdwinEVMWallet, EdwinSolanaWallet } from '../edwin-core/wallets';
import CookieSwarmClient from '../protocols/cookie';

export function initializeProtocols(
    evmWallet?: EdwinEVMWallet,
    solanaWallet?: EdwinSolanaWallet
): Record<string, DeFiProtocol> {
    const protocols: Record<string, DeFiProtocol> = {};

    if (evmWallet) {
        protocols['aave'] = new AaveProtocol(evmWallet);
        protocols['lido'] = new LidoProtocol(evmWallet);
        protocols['uniswap'] = new UniswapProtocol(evmWallet);
    }

    if (solanaWallet) {
        protocols['lulo'] = new LuloProtocol(solanaWallet);
        protocols['meteora'] = new MeteoraProtocol(solanaWallet);
    }

    if (process.env.COOKIE_API_KEY) {
        protocols['cookie'] = new CookieSwarmClient(process.env.COOKIE_API_KEY);
    }

    return protocols;
}
