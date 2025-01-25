import type { ToolBase } from "@goat-sdk/core";
import type { ZodType } from "zod";

export interface MarketParams {
    question: string;
    description: string;
    endDate: number;
    initialLiquidity: bigint;
    collateralToken: `0x${string}`;
    protocolFee: bigint;
    outcomeDescriptions: string[];
}

export interface Market {
    id: string;
    address: `0x${string}`;
    question: string;
    endTime: bigint;
    collateralToken: `0x${string}`;
    virtualLiquidity: bigint;
}

export interface TradeParams {
    marketAddress: `0x${string}`;
    isYes: boolean;
    amount: bigint;
}

export interface LiquidityParams {
    marketAddress: `0x${string}`;
    amount: bigint;
}

export interface ResolveParams {
    marketAddress: `0x${string}`;
    outcome: boolean;
}

export interface MarketInfo {
    question: string;
    endTime: bigint;
    collateralToken: `0x${string}`;
    outcome: number;
}

export interface PredictionMarketTools {
    getMarkets: () => Promise<{ count: number; markets: Market[] }>;
    getMarketCount: () => Promise<{ count: number }>;
    createMarket: (params: MarketParams) => Promise<{
        marketId: string;
        marketAddress: `0x${string}`;
        transactionHash: `0x${string}`;
    }>;
    getMinMarketDuration: () => Promise<{ duration: number }>;
    getMarketByID: (params: {
        marketId: string;
    }) => Promise<{ marketAddress: `0x${string}` }>;
    getOwner: () => Promise<{
        owner: `0x${string}`;
        error?: string;
    }>;
    isPaused: () => Promise<{ paused: boolean }>;
    buyPosition: (params: TradeParams) => Promise<{
        transactionHash: `0x${string}`;
        amount: bigint;
    }>;
    sellPosition: (params: TradeParams) => Promise<{
        transactionHash: `0x${string}`;
        amount: bigint;
    }>;
    addLiquidity: (params: LiquidityParams) => Promise<{
        transactionHash: `0x${string}`;
        amount: bigint;
    }>;
    resolveMarket: (params: ResolveParams) => Promise<{
        transactionHash: `0x${string}`;
        outcome: boolean;
    }>;
    getMarketInfo: (marketAddress: `0x${string}`) => Promise<MarketInfo>;
    getPrice: (
        marketAddress: `0x${string}`,
        outcomeId: bigint
    ) => Promise<bigint>;
}

export type PredictionMarketTool = ToolBase<ZodType, any>;
