import type { ILendingProtocol, IStakingProtocol, IDEXProtocol, EdwinWallet } from "../types";
import { AaveProtocol } from "./aave/aave";
import { UniswapProtocol } from "./uniswap/uniswap";
import { LidoProtocol } from "./lido/lido";

const protocols: Record<
    string,
    ILendingProtocol | IStakingProtocol | IDEXProtocol
> = {
    // Lending
    aave: new AaveProtocol(),
    // DEX
    uniswap: new UniswapProtocol(),
    // Staking
    lido: new LidoProtocol(),
};

export function getProtocol(
    name: string
): ILendingProtocol | IStakingProtocol | IDEXProtocol | undefined {
    return protocols[name.toLowerCase()];
}

// Type-safe getters for specific protocol types
export function getLendingProtocol(name: string): ILendingProtocol | undefined {
    const protocol = protocols[name.toLowerCase()];
    // Verify that the protocol implements the ILendingProtocol interface
    if (!protocol || !("supply" in protocol)) {
        return undefined;
    }

    return "supply" in protocol ? (protocol as ILendingProtocol) : undefined;
}

export function getStakingProtocol(name: string): IStakingProtocol | undefined {
    const protocol = protocols[name.toLowerCase()];
    return "stake" in protocol ? (protocol as IStakingProtocol) : undefined;
}

export function getDEXProtocol(name: string): IDEXProtocol | undefined {
    const protocol = protocols[name.toLowerCase()];
    return "swap" in protocol ? (protocol as IDEXProtocol) : undefined;
}