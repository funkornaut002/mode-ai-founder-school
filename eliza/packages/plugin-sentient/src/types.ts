import type { Plugin as CorePlugin } from "@elizaos/core";
import type { Address as ViemAddress, Hash as ViemHash } from "viem";

export type Address = ViemAddress;
export type Hash = ViemHash;

export interface MarketParams {
    question: string;
    description: string;
    endDate: number;
    initialLiquidity: number | bigint;
    collateralToken: Address;
    protocolFee: number | bigint;
    outcomeDescriptions: string[];
}

export interface Market {
    id: string;
    address: Address;
    question: string;
    endTime: bigint;
    collateralToken: Address;
    virtualLiquidity: bigint;
}

export interface Plugin extends CorePlugin {
    name: string;
    description: string;
    services: any[];
    actions: any[];
    settings?: {
        required?: string[];
        optional?: string[];
    };
    chains?: {
        evm?: string[];
    };
    defaultChain?: string;
}
