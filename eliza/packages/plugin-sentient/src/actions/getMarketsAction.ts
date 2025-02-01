import type { Action } from "@elizaos/core";
import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";
import { createPublicClient, http, isAddress } from "viem";
import type { Address } from "../types";
import { FACTORY_ABI, MARKET_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";
import { validateSentientConfig } from "../environment";

// Define the Market type to match our actual data structure
type Market = {
    marketId: `0x${string}`;
    marketAddress: `0x${string}`;
    question: string;
    endTime: bigint;
    collateralToken: `0x${string}`;
    outcome: number;
};

function debugLog(section: string, data: any) {
    elizaLogger.log(`\n=== ${section} ===`);
    // Convert BigInt to string before stringifying
    const seen = new WeakSet();
    const replacer = (key: string, value: any) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
        }
        return value;
    };
    elizaLogger.log(JSON.stringify(data, replacer, 2));
}

// Helper function to safely format date
function formatDate(timestamp: bigint | undefined | null): string {
    if (timestamp === undefined || timestamp === null) return "N/A";
    try {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    } catch (error) {
        elizaLogger.error("Error formatting date:", error);
        return "N/A";
    }
}

export const getMarketsAction: Action = {
    name: "GET_MARKET",
    description: "Get market details by ID on Mode Network",
    similes: [
        "GET_MARKETS",
        "SHOW_MARKET",
        "VIEW_MARKET",
        "DISPLAY_MARKET",
        "FETCH_MARKET",
        "getmarket",
        "get_market",
        "get market",
        "show market",
        "view market",
        "display market",
        "fetch market",
        "MARKET_INFO",
        "MARKET_DETAILS",
        "market info",
        "market details",
    ],
    validate: async (runtime: IAgentRuntime) => {
        try {
            await validateSentientConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("GET_MARKET validation error:", error);
            return false;
        }
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<Market | null> => {
        debugLog("GET_MARKET ACTION START", {
            timestamp: new Date().toISOString(),
            messageText: message.content?.text,
        });

        try {
            // Extract market ID from the message
            const marketIdMatch =
                message.content?.text?.match(/0x[a-fA-F0-9]{64}/);
            if (!marketIdMatch) {
                if (callback) {
                    await callback({
                        text: "Please provide a valid market ID hash (64 characters starting with 0x).",
                        action: "GET_MARKET",
                        content: null,
                    });
                }
                return null;
            }

            const marketId = marketIdMatch[0] as `0x${string}`;

            // Initialize public client
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            });

            // Get factory address from settings
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            );
            if (!factoryAddress || !isAddress(factoryAddress)) {
                throw new Error("Invalid factory address configuration");
            }

            debugLog("FETCHING MARKET", {
                factoryAddress,
                marketId,
                chainId: chain.id,
            });

            // Get market address using getMarket function
            const marketAddress = (await publicClient.readContract({
                address: factoryAddress as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: "getMarket",
                args: [marketId],
            })) as Address;

            if (
                !marketAddress ||
                marketAddress === "0x0000000000000000000000000000000000000000"
            ) {
                throw new Error("Market not found");
            }

            debugLog("FETCHED MARKET ADDRESS", {
                marketAddress,
            });

            // Get market details using getMarketInfo
            const marketInfo = (await publicClient.readContract({
                address: marketAddress,
                abi: MARKET_ABI,
                functionName: "getMarketInfo",
            })) as [string, bigint, Address, number];

            const [question, endTime, collateralToken, outcome] = marketInfo;

            debugLog("FETCHED MARKET INFO", {
                question,
                endTime: endTime.toString(),
                collateralToken,
                outcome,
            });

            const market: Market = {
                marketId,
                marketAddress,
                question,
                endTime,
                collateralToken,
                outcome,
            };

            if (callback) {
                const marketText =
                    `\n• Market ${marketId.slice(0, 10)}...\n` +
                    `  Question: '${market.question}'\n` +
                    `  Address: ${market.marketAddress}\n` +
                    `  End Time: ${formatDate(market.endTime)}\n` +
                    `  Status: ${outcome === 0 ? "Trading" : outcome === 1 ? "Yes" : "No"}\n` +
                    `  Collateral: MODE (${market.collateralToken})`;

                await callback({
                    text: `📈 Market Details:${marketText}`,
                    action: "GET_MARKET",
                    content: market,
                });
            }

            return market;
        } catch (error) {
            debugLog("GET_MARKET ERROR", {
                error: error.message,
                stack: error.stack,
            });
            if (callback) {
                await callback({
                    text: `Error getting market: ${error.message}`,
                    action: "ERROR",
                    content: { error: error.message },
                });
            }
            return null;
        }
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me market 0x7b117239fb5993098323baced4ab297452d3fb903b4803b58f5c3b09018aafe7",
                    action: "GET_MARKET",
                },
            },
        ],
    ],
};
