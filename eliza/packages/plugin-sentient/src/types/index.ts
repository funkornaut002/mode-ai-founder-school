import type { Token } from "@lifi/types";
import type {
    Account,
    Address,
    Chain,
    Hash,
    HttpTransport,
    PublicClient,
    WalletClient,
} from "viem";
import * as viemChains from "viem/chains";

const _SupportedChainList = Object.keys(viemChains) as Array<
    keyof typeof viemChains
>;
export type SupportedChain = (typeof _SupportedChainList)[number];

// Re-export viem types that are used across the project
export type { Address, Hash } from "viem";

// Transaction types
export interface Transaction {
    hash: Hash;
    from: Address;
    to: Address;
    value: bigint;
    data?: `0x${string}`;
    chainId?: number;
}

// Token types
export interface TokenWithBalance {
    token: Token;
    balance: bigint;
    formattedBalance: string;
    priceUSD: string;
    valueUSD: string;
}

export interface WalletBalance {
    chain: SupportedChain;
    address: Address;
    totalValueUSD: string;
    tokens: TokenWithBalance[];
}

// Chain configuration
export interface ChainMetadata {
    chainId: number;
    name: string;
    chain: Chain;
    rpcUrl: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    blockExplorerUrl: string;
}

export interface ChainConfig {
    chain: Chain;
    publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
    walletClient?: WalletClient;
}

// Action parameters
export interface TransferParams {
    fromChain: SupportedChain;
    toAddress: Address;
    amount: string;
    data?: `0x${string}`;
}

export interface SwapParams {
    chain: SupportedChain;
    fromToken: Address;
    toToken: Address;
    amount: string;
    slippage?: number;
}

export interface BridgeParams {
    fromChain: SupportedChain;
    toChain: SupportedChain;
    fromToken: Address;
    toToken: Address;
    amount: string;
    toAddress?: Address;
}

// Plugin configuration
export interface EvmPluginConfig {
    rpcUrl?: {
        ethereum?: string;
        abstract?: string;
        base?: string;
        sepolia?: string;
        bsc?: string;
        arbitrum?: string;
        avalanche?: string;
        polygon?: string;
        optimism?: string;
        cronos?: string;
        gnosis?: string;
        fantom?: string;
        fraxtal?: string;
        klaytn?: string;
        celo?: string;
        moonbeam?: string;
        aurora?: string;
        harmonyOne?: string;
        moonriver?: string;
        arbitrumNova?: string;
        mantle?: string;
        linea?: string;
        scroll?: string;
        filecoin?: string;
        taiko?: string;
        zksync?: string;
        canto?: string;
        alienx?: string;
    };
    secrets?: {
        EVM_PRIVATE_KEY: string;
    };
    testMode?: boolean;
    multicall?: {
        batchSize?: number;
        wait?: number;
    };
}

// LiFi types
export type LiFiStatus = {
    status: "PENDING" | "DONE" | "FAILED";
    substatus?: string;
    error?: Error;
};

export type LiFiRoute = {
    transactionHash: Hash;
    transactionData: `0x${string}`;
    toAddress: Address;
    status: LiFiStatus;
};

// Provider types
export interface TokenData extends Token {
    symbol: string;
    decimals: number;
    address: Address;
    name: string;
    logoURI?: string;
    chainId: number;
}

export interface TokenPriceResponse {
    priceUSD: string;
    token: TokenData;
}

export interface TokenListResponse {
    tokens: TokenData[];
}

export interface ProviderError extends Error {
    code?: number;
    data?: unknown;
}

// Prediction Market types
export interface Market {
    id: string;
    address: Address;
    question: string;
    endTime: bigint;
    collateralToken: Address;
    virtualLiquidity: bigint;
}

export interface MarketParams {
    question: string;
    description: string;
    endDate: number;
    initialLiquidity: bigint;
    collateralToken: Address;
    protocolFee: bigint;
    outcomeDescriptions: string[];
}

// Simplified base types
export type MarketBase = {
    id: string;
    address: Address;
    question: string;
    endTime: bigint;
    collateralToken: Address;
    virtualLiquidity: bigint;
};

export type MarketActionResult = {
    transactionHash: Hash;
};

// Simplified interface without nested Promises
export interface PredictionMarketActions {
    getMarkets: () => Promise<Market[]>;
    getMarketCount: () => Promise<number>;
    createMarket: (params: MarketParams) => Promise<MarketActionResult>;
    getMinMarketDuration: () => Promise<number>;
    getMarketByID: (marketId: string) => Promise<Address>;
    getOwner: () => Promise<Address>;
    isPaused: () => Promise<boolean>;
    buyPosition: (params: TradeParams) => Promise<MarketActionResult>;
    sellPosition: (params: TradeParams) => Promise<MarketActionResult>;
    addLiquidity: (params: LiquidityParams) => Promise<MarketActionResult>;
    resolveMarket: (params: ResolveParams) => Promise<MarketActionResult>;
    getMarketInfo: (marketAddress: Address) => Promise<MarketInfo>;
    getPrice: (marketAddress: Address, outcomeId: bigint) => Promise<bigint>;
}

export interface TradeParams {
    marketAddress: Address;
    isYes: boolean;
    amount: bigint;
}

export interface LiquidityParams {
    marketAddress: Address;
    amount: bigint;
}

export interface ResolveParams {
    marketAddress: Address;
    outcome: boolean;
}

export interface MarketInfo {
    question: string;
    endTime: bigint;
    collateralToken: Address;
    outcome: number;
}

export interface SentientPluginConfig {
    EVM_PRIVATE_KEY: string;
    EVM_PROVIDER_URL: string;
    PREDICTION_MARKET_FACTORY: string;
    MODE_TOKEN_ADDRESS: string;
}
