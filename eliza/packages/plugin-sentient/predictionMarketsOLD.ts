// // import {
// //     type PluginBase,
// //     type WalletClientBase,
// //     type Chain,
// //     ToolBase,
// // } from "@goat-sdk/core";
// import { Content, type Plugin } from "@elizaos/core";
// import {
//     createPublicClient,
//     http,
//     createWalletClient,
//     parseEther,
//     decodeEventLog,
//     type PublicClient,
//     type WalletClient as ViemWalletClient,
//     parseAbiItem,
// } from "viem";
// import { modeTestnet } from "viem/chains";
// import {
//     MarketParams,
//     TradeParams,
//     LiquidityParams,
//     ResolveParams,
// } from "./typess";
// import { type IAgentRuntime, type Memory, type State } from "@elizaos/core";
// import { type ZodType } from "zod";
// import { z } from "zod";
// import type { Log, WalletClient } from "viem";

// const FACTORY_ABI = [
//     { inputs: [], stateMutability: "nonpayable", type: "constructor" },
//     { inputs: [], name: "EnforcedPause", type: "error" },
//     { inputs: [], name: "ExpectedPause", type: "error" },
//     { inputs: [], name: "MarketFactory_FeeTooHigh", type: "error" },
//     { inputs: [], name: "MarketFactory_InvalidEndTime", type: "error" },
//     { inputs: [], name: "MarketFactory_InvalidLiquidity", type: "error" },
//     {
//         inputs: [],
//         name: "MarketFactory_InvalidOutcomeCount",
//         type: "error",
//     },
//     { inputs: [], name: "MarketFactory_InvalidQuestion", type: "error" },
//     { inputs: [], name: "MarketFactory_InvalidToken", type: "error" },
//     { inputs: [], name: "MarketFactory_MarketExists", type: "error" },
//     { inputs: [], name: "MarketFactory_Unauthorized", type: "error" },
//     {
//         inputs: [{ internalType: "address", name: "owner", type: "address" }],
//         name: "OwnableInvalidOwner",
//         type: "error",
//     },
//     {
//         inputs: [{ internalType: "address", name: "account", type: "address" }],
//         name: "OwnableUnauthorizedAccount",
//         type: "error",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: false,
//                 internalType: "bytes32",
//                 name: "marketId",
//                 type: "bytes32",
//             },
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "marketAddress",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "string",
//                 name: "question",
//                 type: "string",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "endTime",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "address",
//                 name: "collateralToken",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "virtualLiquidity",
//                 type: "uint256",
//             },
//         ],
//         name: "MarketCreated",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "agent",
//                 type: "address",
//             },
//         ],
//         name: "MarketCreatorAdded",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "agent",
//                 type: "address",
//             },
//         ],
//         name: "MarketCreatorRemoved",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "previousOwner",
//                 type: "address",
//             },
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "newOwner",
//                 type: "address",
//             },
//         ],
//         name: "OwnershipTransferred",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: false,
//                 internalType: "address",
//                 name: "account",
//                 type: "address",
//             },
//         ],
//         name: "Paused",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: false,
//                 internalType: "address",
//                 name: "account",
//                 type: "address",
//             },
//         ],
//         name: "Unpaused",
//         type: "event",
//     },
//     {
//         inputs: [],
//         name: "MIN_MARKET_DURATION",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [{ internalType: "address", name: "_agent", type: "address" }],
//         name: "addMarketCreator",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [
//             { internalType: "string", name: "_question", type: "string" },
//             { internalType: "uint256", name: "_endTime", type: "uint256" },
//             {
//                 internalType: "address",
//                 name: "_collateralToken",
//                 type: "address",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_virtualLiquidity",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_protocolFee",
//                 type: "uint256",
//             },
//             {
//                 internalType: "string[]",
//                 name: "_outcomeDescriptions",
//                 type: "string[]",
//             },
//         ],
//         name: "createMarket",
//         outputs: [
//             {
//                 internalType: "address",
//                 name: "marketAddress",
//                 type: "address",
//             },
//         ],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [
//             { internalType: "bytes32", name: "_marketId", type: "bytes32" },
//         ],
//         name: "getMarket",
//         outputs: [{ internalType: "address", name: "", type: "address" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [{ internalType: "address", name: "_agent", type: "address" }],
//         name: "isMarketCreator",
//         outputs: [
//             {
//                 internalType: "bool",
//                 name: "_isMarketCreator",
//                 type: "bool",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             { internalType: "bytes32", name: "_marketId", type: "bytes32" },
//         ],
//         name: "markets",
//         outputs: [
//             {
//                 internalType: "address",
//                 name: "_marketAddress",
//                 type: "address",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "owner",
//         outputs: [{ internalType: "address", name: "", type: "address" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "pause",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "paused",
//         outputs: [{ internalType: "bool", name: "", type: "bool" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [{ internalType: "address", name: "_agent", type: "address" }],
//         name: "removeMarketCreator",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "renounceOwnership",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [
//             { internalType: "address", name: "newOwner", type: "address" },
//         ],
//         name: "transferOwnership",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "unpause",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
// ];

// const MARKET_ABI = [
//     {
//         inputs: [
//             { internalType: "string", name: "_question", type: "string" },
//             { internalType: "uint256", name: "_endTime", type: "uint256" },
//             {
//                 internalType: "address",
//                 name: "_collateralToken",
//                 type: "address",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_virtualLiquidity",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_protocolFee",
//                 type: "uint256",
//             },
//             {
//                 internalType: "string[]",
//                 name: "_outcomeDescriptions",
//                 type: "string[]",
//             },
//         ],
//         stateMutability: "nonpayable",
//         type: "constructor",
//     },
//     { inputs: [], name: "Market_AlreadyResolved", type: "error" },
//     { inputs: [], name: "Market_InsufficientBalance", type: "error" },
//     { inputs: [], name: "Market_InsufficientOutput", type: "error" },
//     { inputs: [], name: "Market_InvalidAmount", type: "error" },
//     { inputs: [], name: "Market_InvalidBuyAmount", type: "error" },
//     { inputs: [], name: "Market_InvalidCollateralAmount", type: "error" },
//     { inputs: [], name: "Market_InvalidEndTime", type: "error" },
//     { inputs: [], name: "Market_InvalidFeeRecipient", type: "error" },
//     { inputs: [], name: "Market_InvalidLPTokens", type: "error" },
//     { inputs: [], name: "Market_InvalidOutcome", type: "error" },
//     { inputs: [], name: "Market_InvalidOutcomeCount", type: "error" },
//     { inputs: [], name: "Market_InvalidPositionAmount", type: "error" },
//     { inputs: [], name: "Market_InvalidSellAmount", type: "error" },
//     { inputs: [], name: "Market_NoFeesToCollect", type: "error" },
//     { inputs: [], name: "Market_NoLiquidity", type: "error" },
//     { inputs: [], name: "Market_NoOutcome", type: "error" },
//     { inputs: [], name: "Market_NoTokens", type: "error" },
//     { inputs: [], name: "Market_NotInvalid", type: "error" },
//     { inputs: [], name: "Market_NotResolved", type: "error" },
//     { inputs: [], name: "Market_NotTrading", type: "error" },
//     { inputs: [], name: "Market_PriceImpactTooHigh", type: "error" },
//     { inputs: [], name: "Market_TradingEnded", type: "error" },
//     { inputs: [], name: "Market_TradingNotEnded", type: "error" },
//     { inputs: [], name: "Market_Unauthorized", type: "error" },
//     { inputs: [], name: "ReentrancyGuardReentrantCall", type: "error" },
//     {
//         inputs: [{ internalType: "address", name: "token", type: "address" }],
//         name: "SafeERC20FailedOperation",
//         type: "error",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "recipient",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "amount",
//                 type: "uint256",
//             },
//         ],
//         name: "FeesCollected",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "user",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "amount",
//                 type: "uint256",
//             },
//         ],
//         name: "InvalidMarketClaimed",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "provider",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "amount",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "lpTokens",
//                 type: "uint256",
//             },
//         ],
//         name: "LiquidityAdded",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "provider",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "lpTokens",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "amount",
//                 type: "uint256",
//             },
//         ],
//         name: "LiquidityRemoved",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "oldEndTime",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "newEndTime",
//                 type: "uint256",
//             },
//         ],
//         name: "MarketExtended",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [],
//         name: "MarketInvalidated",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: false,
//                 internalType: "enum IMarket.Outcome",
//                 name: "outcome",
//                 type: "uint8",
//             },
//         ],
//         name: "MarketResolved",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "buyer",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "outcomeTokenId",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "collateralAmount",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "tokenAmount",
//                 type: "uint256",
//             },
//         ],
//         name: "TokensBought",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "seller",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "outcomeTokenId",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "tokenAmount",
//                 type: "uint256",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "returnAmount",
//                 type: "uint256",
//             },
//         ],
//         name: "TokensSold",
//         type: "event",
//     },
//     {
//         anonymous: false,
//         inputs: [
//             {
//                 indexed: true,
//                 internalType: "address",
//                 name: "user",
//                 type: "address",
//             },
//             {
//                 indexed: false,
//                 internalType: "uint256",
//                 name: "amount",
//                 type: "uint256",
//             },
//         ],
//         name: "WinningsClaimed",
//         type: "event",
//     },
//     {
//         inputs: [],
//         name: "accumulatedFees",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeId",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_collateralAmount",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_maxPriceImpactBps",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_minTokensOut",
//                 type: "uint256",
//             },
//         ],
//         name: "buy",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeId",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_investmentAmount",
//                 type: "uint256",
//             },
//         ],
//         name: "calcBuyAmount",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeTokenId",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_positionAmount",
//                 type: "uint256",
//             },
//         ],
//         name: "calcSellAmount",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeId",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_tradeAmount",
//                 type: "uint256",
//             },
//         ],
//         name: "calculatePriceImpact",
//         outputs: [
//             {
//                 internalType: "uint256",
//                 name: "priceImpactBps",
//                 type: "uint256",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeId",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_tokenAmount",
//                 type: "uint256",
//             },
//         ],
//         name: "calculateSellPriceImpact",
//         outputs: [
//             {
//                 internalType: "uint256",
//                 name: "priceImpactBps",
//                 type: "uint256",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "claimInvalidMarket",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "claimWinnings",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "collateralToken",
//         outputs: [
//             { internalType: "contract IERC20", name: "", type: "address" },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "collectFees",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "creator",
//         outputs: [{ internalType: "address", name: "", type: "address" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "endTime",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             { internalType: "uint256", name: "_endTime", type: "uint256" },
//         ],
//         name: "extendMarket",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "getMarketInfo",
//         outputs: [
//             { internalType: "string", name: "_question", type: "string" },
//             { internalType: "uint256", name: "_endTime", type: "uint256" },
//             {
//                 internalType: "address",
//                 name: "_collateralToken",
//                 type: "address",
//             },
//             {
//                 internalType: "enum IMarket.Outcome",
//                 name: "_outcome",
//                 type: "uint8",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "getOutcomeCount",
//         outputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeCount",
//                 type: "uint256",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "outcomeIndex",
//                 type: "uint256",
//             },
//         ],
//         name: "getOutcomeDescription",
//         outputs: [
//             {
//                 internalType: "string",
//                 name: "_description",
//                 type: "string",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeId",
//                 type: "uint256",
//             },
//         ],
//         name: "getPrice",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "getTotalLiquidity",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "getTotalRealCollateral",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "invalidateMarket",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "outcome",
//         outputs: [
//             {
//                 internalType: "enum IMarket.Outcome",
//                 name: "",
//                 type: "uint8",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         name: "outcomeDescriptions",
//         outputs: [{ internalType: "string", name: "", type: "string" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             { internalType: "uint256", name: "_tokenId", type: "uint256" },
//         ],
//         name: "outcomePools",
//         outputs: [
//             {
//                 internalType: "uint256",
//                 name: "virtualLiquidity",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "realTokens",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "realCollateral",
//                 type: "uint256",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "outcomeToken",
//         outputs: [
//             {
//                 internalType: "contract OutcomeToken",
//                 name: "",
//                 type: "address",
//             },
//         ],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "protocolFee",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "question",
//         outputs: [{ internalType: "string", name: "", type: "string" }],
//         stateMutability: "view",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_winningOutcomeTokenId",
//                 type: "uint256",
//             },
//         ],
//         name: "resolveMarket",
//         outputs: [],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [
//             {
//                 internalType: "uint256",
//                 name: "_outcomeId",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_tokenAmount",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_maxPriceImpactBps",
//                 type: "uint256",
//             },
//             {
//                 internalType: "uint256",
//                 name: "_minCollateralOut",
//                 type: "uint256",
//             },
//         ],
//         name: "sell",
//         outputs: [
//             {
//                 internalType: "uint256",
//                 name: "collateralReturned",
//                 type: "uint256",
//             },
//         ],
//         stateMutability: "nonpayable",
//         type: "function",
//     },
//     {
//         inputs: [],
//         name: "winningOutcomeTokenId",
//         outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
//         stateMutability: "view",
//         type: "function",
//     },
// ];

// // Add the Market interface
// interface MarketContract {
//     question: () => Promise<string>;
//     endTime: () => Promise<bigint>;
//     collateralToken: () => Promise<`0x${string}`>;
//     outcome: () => Promise<number>;
//     getPrice: (outcomeId: bigint) => Promise<bigint>;
//     buy: (
//         outcomeId: bigint,
//         collateralAmount: bigint,
//         maxPriceImpactBps: bigint,
//         minTokensOut: bigint
//     ) => Promise<bigint>;
//     sell: (
//         outcomeId: bigint,
//         tokenAmount: bigint,
//         maxPriceImpactBps: bigint,
//         minCollateralOut: bigint
//     ) => Promise<bigint>;
// }

// // Update the market interaction functions
// const getMarketContract = (address: `0x${string}`, wallet: WalletClient) => {
//     const viemWallet = wallet as unknown as ViemWalletClient;
//     return {
//         address,
//         abi: MARKET_ABI,
//         wallet: viemWallet,
//     };
// };

// interface RuntimeWithWallet extends IAgentRuntime {
//     wallet: WalletClient;
// }

// interface MarketCreatedEvent {
//     marketId: string;
//     marketAddress: string;
//     question: string;
//     endTime: bigint;
//     collateralToken: string;
//     virtualLiquidity: bigint;
// }

// // Add at the top with other interfaces
// type EventTopics = [`0x${string}`, ...`0x${string}`[]];

// // Add type for the event args
// type MarketCreatedEventArgs = {
//     marketId: string;
//     marketAddress: `0x${string}`;
//     question: string;
//     endTime: bigint;
//     collateralToken: `0x${string}`;
//     virtualLiquidity: bigint;
// };

// // Add this type
// interface Market {
//     id: string;
//     address: `0x${string}`;
//     question: string;
//     endTime: bigint;
//     collateralToken: `0x${string}`;
//     virtualLiquidity: bigint;
// }

// // Add interface for ABI event
// interface AbiEvent {
//     type: string;
//     name?: string;
//     inputs?: any[];
//     anonymous?: boolean;
// }

// export const predictionMarkets = ({
//     factoryAddress,
// }: {
//     factoryAddress: `0x${string}`;
// }): PluginBase<WalletClientBase> => ({
//     name: "prediction-markets",
//     toolProviders: [],
//     supportsChain: (chain) => true,
//     getTools: async (
//         wallet: WalletClientBase
//     ): Promise<ToolBase<ZodType, any>[]> => {
//         const publicClient = createPublicClient({
//             chain: {
//                 ...modeTestnet,
//                 rpcUrls: {
//                     default: {
//                         http: ["https://sepolia.mode.network"],
//                         webSocket: ["wss://sepolia.mode.network"],
//                     },
//                     public: {
//                         http: ["https://sepolia.mode.network"],
//                         webSocket: ["wss://sepolia.mode.network"],
//                     },
//                 },
//             },
//             transport: http(),
//         });
//         const factoryCode = await publicClient.getCode({
//             address: factoryAddress,
//         });
//         console.log("Factory contract exists:", factoryCode !== "0x");

//         // Verify market contract
//         const marketCode = await publicClient.getCode({
//             address: process.env.MARKET_ADDRESS as `0x${string}`,
//         });
//         console.log("Market contract exists:", marketCode !== "0x");

//         const viemWallet = createWalletClient({
//             chain: {
//                 ...modeTestnet,
//                 rpcUrls: {
//                     default: {
//                         http: ["https://sepolia.mode.network"],
//                         webSocket: ["wss://sepolia.mode.network"],
//                     },
//                 },
//             },
//             transport: http(),
//         });
//         console.log("Created public client for Mode Network");

//         // After creating public client
//         const chainId = await publicClient.getChainId();
//         console.log("Connected to chain:", chainId);
//         const blockNumber = await publicClient.getBlockNumber();
//         console.log("Latest block:", blockNumber);

//         // Update readContract usage
//         const readContract = async (functionName: string, args?: any[]) => {
//             console.log(`Calling contract ${functionName}`, args || "");
//             try {
//                 const result = await publicClient.readContract({
//                     address: factoryAddress,
//                     abi: FACTORY_ABI,
//                     functionName,
//                     args,
//                 });
//                 console.log(`${functionName} returned:`, result);
//                 return result;
//             } catch (error) {
//                 console.error(`Error calling ${functionName}:`, error);
//                 throw error;
//             }
//         };

//         // First, let's add a function to check if the wallet is a market creator
//         const isMarketCreator = async (address: string): Promise<boolean> => {
//             try {
//                 const result = await publicClient.readContract({
//                     address: factoryAddress,
//                     abi: FACTORY_ABI,
//                     functionName: "isMarketCreator",
//                     args: [address],
//                 });
//                 return result as boolean;
//             } catch (error) {
//                 console.error("Error checking market creator status:", error);
//                 return false;
//             }
//         };

//         // Add this function inside getTools
//         const getAllMarkets = async (): Promise<Market[]> => {
//             try {
//                 const events = await publicClient.getLogs({
//                     address: factoryAddress,
//                     event: {
//                         type: "event",
//                         name: "MarketCreated",
//                         inputs:
//                             FACTORY_ABI.find(
//                                 (x: AbiEvent) =>
//                                     x.type === "event" &&
//                                     x.name === "MarketCreated"
//                             )?.inputs || [],
//                     },
//                     fromBlock: 0n,
//                     toBlock: "latest",
//                 });

//                 return events.map((event) => {
//                     const { args } = decodeEventLog({
//                         abi: [
//                             parseAbiItem(
//                                 "event MarketCreated(bytes32 marketId, address indexed marketAddress, string question, uint256 endTime, address collateralToken, uint256 virtualLiquidity)"
//                             ),
//                         ],
//                         data: event.data,
//                         topics: event.topics,
//                     }) as {
//                         args: {
//                             marketId: `0x${string}`;
//                             marketAddress: `0x${string}`;
//                             question: string;
//                             endTime: bigint;
//                             collateralToken: `0x${string}`;
//                             virtualLiquidity: bigint;
//                         };
//                     };
//                     return {
//                         id: args.marketId,
//                         address: args.marketAddress,
//                         question: args.question,
//                         endTime: args.endTime,
//                         collateralToken: args.collateralToken,
//                         virtualLiquidity: args.virtualLiquidity,
//                     };
//                 });
//             } catch (error) {
//                 console.error("Error getting markets:", error);
//                 return [];
//             }
//         };

//         return [
//             {
//                 name: "getMarketCount",
//                 description: "Get number of markets created by this agent",
//                 parameters: z.object({}),
//                 execute: async () => {
//                     const events = await publicClient.getLogs({
//                         address: factoryAddress,
//                         event: {
//                             type: "event",
//                             name: "MarketCreated",
//                             inputs:
//                                 FACTORY_ABI.find(
//                                     (x: AbiEvent) =>
//                                         x.type === "event" &&
//                                         x.name === "MarketCreated"
//                                 )?.inputs || [],
//                         },
//                         fromBlock: 0n,
//                         toBlock: "latest",
//                     });
//                     return { count: events.length };
//                 },
//             },
//             {
//                 name: "createMarket",
//                 description: "Create a new prediction market",
//                 parameters: z.object({
//                     question: z.string(),
//                     description: z.string(),
//                     endDate: z.number(),
//                     collateralToken: z.string(),
//                     initialLiquidity: z.bigint(),
//                     protocolFee: z.bigint(),
//                     outcomeDescriptions: z.array(z.string()),
//                 }),
//                 execute: async (params: MarketParams) => {
//                     try {
//                         console.log("Creating market with params:", params);

//                         // Verify creator status
//                         const isCreator = await publicClient.readContract({
//                             address: factoryAddress,
//                             abi: FACTORY_ABI,
//                             functionName: "isMarketCreator",
//                             args: [wallet.account.address],
//                         });

//                         if (!isCreator) {
//                             throw new Error(
//                                 "Address is not authorized as market creator"
//                             );
//                         }

//                         // Prepare transaction
//                         const { request } = await publicClient.simulateContract(
//                             {
//                                 address: factoryAddress,
//                                 abi: FACTORY_ABI,
//                                 functionName: "createMarket",
//                                 args: [
//                                     params.question,
//                                     BigInt(params.endDate),
//                                     params.collateralToken,
//                                     params.initialLiquidity,
//                                     params.protocolFee,
//                                     params.outcomeDescriptions,
//                                 ],
//                                 account: wallet.account.address,
//                             }
//                         );

//                         // Send transaction
//                         const hash = await walletClient.writeContract(request);
//                         console.log("Transaction sent:", hash);

//                         // Wait for transaction
//                         const receipt =
//                             await publicClient.waitForTransactionReceipt({
//                                 hash,
//                             });

//                         // Get market created event
//                         const marketCreatedEvent = receipt.logs
//                             .filter(
//                                 (log) =>
//                                     log.address.toLowerCase() ===
//                                     factoryAddress.toLowerCase()
//                             )
//                             .map((log) => {
//                                 try {
//                                     return decodeEventLog({
//                                         abi: FACTORY_ABI,
//                                         data: log.data,
//                                         topics: log.topics,
//                                     });
//                                 } catch {
//                                     return null;
//                                 }
//                             })
//                             .find(
//                                 (event) => event?.eventName === "MarketCreated"
//                             );

//                         if (!marketCreatedEvent) {
//                             throw new Error("Market creation event not found");
//                         }

//                         const { marketId, marketAddress } =
//                             marketCreatedEvent.args;

//                         return {
//                             marketId,
//                             marketAddress,
//                             transactionHash: hash,
//                         };
//                     } catch (error) {
//                         console.error("Error creating market:", error);
//                         throw new Error(
//                             `Failed to create market: ${error.message}`
//                         );
//                     }
//                 },
//             },
//             {
//                 name: "getMarketCount",
//                 description: "Get number of markets created by this agent",
//                 parameters: z.object({}),
//                 execute: async () => {
//                     const events = await publicClient.getLogs({
//                         address: factoryAddress,
//                         event: {
//                             type: "event",
//                             name: "MarketCreated",
//                             inputs:
//                                 FACTORY_ABI.find(
//                                     (x: AbiEvent) =>
//                                         x.type === "event" &&
//                                         x.name === "MarketCreated"
//                                 )?.inputs || [],
//                         },
//                         fromBlock: 0n,
//                         toBlock: "latest",
//                     });
//                     return { count: events.length };
//                 },
//             },
//             {
//                 name: "getMarkets",
//                 description: "Get all markets",
//                 parameters: z.object({}),
//                 execute: async () => {
//                     try {
//                         console.log("Getting all markets...");
//                         const events = await publicClient.getLogs({
//                             address: factoryAddress,
//                             event: parseAbiItem(
//                                 "event MarketCreated(bytes32 marketId, address indexed marketAddress, string question, uint256 endTime, address collateralToken, uint256 virtualLiquidity)"
//                             ),
//                             fromBlock: 0n,
//                             toBlock: "latest",
//                         });

//                         console.log("Found market events:", events);

//                         const markets = await Promise.all(
//                             events.map(async (event) => {
//                                 const { args } = decodeEventLog({
//                                     abi: [
//                                         parseAbiItem(
//                                             "event MarketCreated(bytes32 marketId, address indexed marketAddress, string question, uint256 endTime, address collateralToken, uint256 virtualLiquidity)"
//                                         ),
//                                     ],
//                                     data: event.data,
//                                     topics: event.topics,
//                                 }) as {
//                                     args: {
//                                         marketId: `0x${string}`;
//                                         marketAddress: `0x${string}`;
//                                         question: string;
//                                         endTime: bigint;
//                                         collateralToken: `0x${string}`;
//                                         virtualLiquidity: bigint;
//                                     };
//                                 };

//                                 // Get additional market info
//                                 const marketInfo =
//                                     (await publicClient.readContract({
//                                         address: args.marketAddress,
//                                         abi: MARKET_ABI,
//                                         functionName: "getMarketInfo",
//                                     })) as [
//                                         string,
//                                         bigint,
//                                         `0x${string}`,
//                                         bigint,
//                                     ];

//                                 return {
//                                     id: args.marketId,
//                                     address: args.marketAddress,
//                                     question: marketInfo[0],
//                                     endTime: marketInfo[1],
//                                     collateralToken: marketInfo[2],
//                                     virtualLiquidity: args.virtualLiquidity,
//                                 };
//                             })
//                         );

//                         return { count: markets.length, markets };
//                     } catch (error) {
//                         console.error("Error getting markets:", error);
//                         return { count: 0, markets: [] };
//                     }
//                 },
//             },
//             {
//                 name: "getMinMarketDuration",
//                 description: "Get minimum duration required for markets",
//                 parameters: z.object({}),
//                 execute: async () => {
//                     const duration = await publicClient.readContract({
//                         address: factoryAddress,
//                         abi: FACTORY_ABI,
//                         functionName: "MIN_MARKET_DURATION",
//                     });
//                     return { duration: Number(duration) };
//                 },
//             },

//             {
//                 name: "getMarketByID",
//                 description: "Get market address by ID",
//                 parameters: z.object({
//                     marketId: z.string(),
//                 }),
//                 execute: async (params: { marketId: string }) => {
//                     try {
//                         // Pad the address to bytes32
//                         const paddedId = params.marketId
//                             .toLowerCase()
//                             .padEnd(66, "0") as `0x${string}`;
//                         console.log("Using padded market ID:", paddedId);

//                         const address = await publicClient.readContract({
//                             address: factoryAddress,
//                             abi: FACTORY_ABI,
//                             functionName: "getMarket",
//                             args: [paddedId],
//                         });

//                         if (
//                             !address ||
//                             address ===
//                                 "0x0000000000000000000000000000000000000000"
//                         ) {
//                             throw new Error("Market not found");
//                         }

//                         return {
//                             marketAddress: address as `0x${string}`,
//                             error: null,
//                         };
//                     } catch (error) {
//                         console.error("Error getting market by ID:", error);
//                         return {
//                             marketAddress:
//                                 "0x0000000000000000000000000000000000000000" as `0x${string}`,
//                             error: `Failed to get market: ${(error as Error).message}`,
//                         };
//                     }
//                 },
//             },
//             {
//                 name: "getOwner",
//                 description: "Get contract owner address",
//                 parameters: z.object({}),
//                 execute: async () => {
//                     try {
//                         // Call owner() directly on the contract
//                         const owner = (await publicClient.readContract({
//                             address: factoryAddress,
//                             abi: FACTORY_ABI,
//                             functionName: "owner",
//                         })) as `0x${string}`;

//                         console.log("Contract owner read:", owner);

//                         if (!owner) {
//                             throw new Error("Owner address is null");
//                         }

//                         return {
//                             owner,
//                             error: null,
//                         };
//                     } catch (error) {
//                         console.error("Error reading owner:", error);
//                         return {
//                             owner: "0x0000000000000000000000000000000000000000" as `0x${string}`,
//                             error: `Failed to get owner: ${(error as Error).message}`,
//                         };
//                     }
//                 },
//             },
//             {
//                 name: "isPaused",
//                 description: "Check if market creation is paused",
//                 parameters: z.object({}),
//                 execute: async () => {
//                     const paused = await publicClient.readContract({
//                         address: factoryAddress,
//                         abi: FACTORY_ABI,
//                         functionName: "paused",
//                     });
//                     return { paused };
//                 },
//             },
//             {
//                 name: "buyPosition",
//                 description: "Buy position in market",
//                 parameters: z.object({
//                     marketAddress: z.string(),
//                     isYes: z.boolean(),
//                     amount: z.bigint(),
//                 }),
//                 execute: async (params: TradeParams) => {
//                     try {
//                         const marketContract = getMarketContract(
//                             params.marketAddress as `0x${string}`,
//                             wallet
//                         );
//                         const address =
//                             (await wallet.getAddress()) as `0x${string}`;
//                         const hash = await marketContract.wallet.writeContract({
//                             address: marketContract.address,
//                             abi: marketContract.abi,
//                             functionName: "buy",
//                             args: [
//                                 BigInt(params.isYes ? 1 : 0),
//                                 params.amount,
//                                 BigInt(100), // 1% max price impact
//                                 BigInt(0), // min tokens out
//                             ],
//                             chain: modeTestnet,
//                             account: address,
//                         });

//                         return {
//                             transactionHash: hash,
//                             amount: params.amount,
//                         };
//                     } catch (error) {
//                         console.error("Error buying position:", error);
//                         throw error;
//                     }
//                 },
//             },
//             {
//                 name: "addLiquidity",
//                 description: "Add liquidity to market",
//                 parameters: z.object({
//                     marketAddress: z.string(),
//                     amount: z.bigint(),
//                 }),
//                 execute: async (params: LiquidityParams) => {
//                     try {
//                         const marketContract = getMarketContract(
//                             params.marketAddress as `0x${string}`,
//                             wallet
//                         );
//                         const address =
//                             (await wallet.getAddress()) as `0x${string}`;
//                         const hash = await marketContract.wallet.writeContract({
//                             address: marketContract.address,
//                             abi: marketContract.abi,
//                             functionName: "addLiquidity",
//                             args: [params.amount],
//                             chain: modeTestnet,
//                             account: address,
//                         });

//                         return {
//                             transactionHash: hash,
//                             amount: params.amount,
//                         };
//                     } catch (error) {
//                         console.error("Error adding liquidity:", error);
//                         throw error;
//                     }
//                 },
//             },
//             {
//                 name: "resolveMarket",
//                 description: "Resolve market outcome",
//                 parameters: z.object({
//                     marketAddress: z.string(),
//                     outcome: z.boolean(),
//                 }),
//                 execute: async (params: ResolveParams) => {
//                     try {
//                         const marketContract = getMarketContract(
//                             params.marketAddress as `0x${string}`,
//                             wallet
//                         );
//                         const address =
//                             (await wallet.getAddress()) as `0x${string}`;
//                         const hash = await marketContract.wallet.writeContract({
//                             address: marketContract.address,
//                             abi: marketContract.abi,
//                             functionName: "resolveMarket",
//                             args: [params.outcome ? 1n : 0n],
//                             chain: modeTestnet,
//                             account: address,
//                         });

//                         return {
//                             transactionHash: hash,
//                             outcome: params.outcome,
//                         };
//                     } catch (error) {
//                         console.error("Error resolving market:", error);
//                         throw error;
//                     }
//                 },
//             },
//             {
//                 name: "getMarketInfo",
//                 description: "Get market info",
//                 parameters: z.object({
//                     marketAddress: z.string(),
//                 }),
//                 execute: async (params: { marketAddress: `0x${string}` }) => {
//                     try {
//                         const marketInfo = (await publicClient.readContract({
//                             address: params.marketAddress,
//                             abi: MARKET_ABI,
//                             functionName: "getMarketInfo",
//                         })) as [string, bigint, `0x${string}`, bigint];

//                         return {
//                             question: marketInfo[0],
//                             endTime: marketInfo[1],
//                             collateralToken: marketInfo[2],
//                             outcome: marketInfo[3],
//                         };
//                     } catch (error) {
//                         console.error("Error getting market info:", error);
//                         throw error;
//                     }
//                 },
//             },
//             {
//                 name: "getPrice",
//                 description: "Get price for a market outcome",
//                 parameters: z.object({
//                     marketAddress: z.string(),
//                     outcomeId: z.bigint(),
//                 }),
//                 execute: async (params: {
//                     marketAddress: `0x${string}`;
//                     outcomeId: bigint;
//                 }) => {
//                     try {
//                         const price = await publicClient.readContract({
//                             address: params.marketAddress,
//                             abi: MARKET_ABI,
//                             functionName: "getPrice",
//                             args: [params.outcomeId],
//                         });
//                         return price;
//                     } catch (error) {
//                         console.error("Error getting price:", error);
//                         throw error;
//                     }
//                 },
//             },
//         ];
//     },
// });
