import type { ILendingProtocol, IStakingProtocol, IDEXProtocol } from "../types";
import { AaveProtocol } from "./aave";
import { LidoProtocol } from "./lido";
import { LuloProtocol } from "./lulo";

const LendingProtocols = {
    aave: AaveProtocol,
    lulo: LuloProtocol
}

const StakingProtocols = {
    lido: LidoProtocol
}

const DEXProtocols = {
    uniswap: UniswapProtocol,
}

export function getLendingProtocol(name: string): ILendingProtocol {
    if (!Object.keys(LendingProtocols).includes(name.toLowerCase())) {
        throw new Error(`Unsupported lending protocol: ${name}`);
    }
    const Protocol = LendingProtocols[name.toLowerCase() as keyof typeof LendingProtocols];
    if (Protocol) {
        return new Protocol();
    }
    throw new Error(`Unsupported lending protocol: ${name}`);
}

export function getStakingProtocol(name: string): IStakingProtocol {
    if (!Object.keys(StakingProtocols).includes(name.toLowerCase())) {
        throw new Error(`Unsupported staking protocol: ${name}`);
    }
    const Protocol = StakingProtocols[name.toLowerCase() as keyof typeof StakingProtocols];
    if (Protocol) {
        return new Protocol();
    }
    throw new Error(`Unsupported staking protocol: ${name}`);
}

export function getDEXProtocol(name: string): IDEXProtocol {
    if (!Object.keys(DEXProtocols).includes(name.toLowerCase())) {
        throw new Error(`Unsupported DEX protocol: ${name}`);
    }
    const Protocol = DEXProtocols[name.toLowerCase() as keyof typeof DEXProtocols];
    if (Protocol) {
        return new Protocol();
    }
    throw new Error(`Unsupported DEX protocol: ${name}`);
}