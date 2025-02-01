import { DeFiProtocol } from '../types';
import { AaveProtocol, LidoProtocol, LuloProtocol, MeteoraProtocol, UniswapProtocol } from '../protocols';
import { EdwinEVMWallet, EdwinSolanaWallet } from '../edwin-core/wallets';

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

    return protocols;
}
