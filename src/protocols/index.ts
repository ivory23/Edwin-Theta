import { ILendingProtocol, IStakingProtocol, IDEXProtocol } from "./interfaces";
import { AaveProtocol } from "./aave";
import { UniswapProtocol } from "./uniswap";
import { LidoProtocol } from "./lido";

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
