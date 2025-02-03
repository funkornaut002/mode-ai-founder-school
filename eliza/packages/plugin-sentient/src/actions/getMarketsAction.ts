import type { Action } from "@elizaos/core";
import { HandlerCallback, IAgentRuntime, Memory, State } from "@elizaos/core";
import { createPublicClient, http, isAddress } from "viem";
import type { Address } from "../types";
import { FACTORY_ABI, MARKET_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";
import { validateSentientConfig } from "../environment";

type GetMarketResponse = {
    marketId: `0x${string}`;
    marketAddress: Address;
    question?: string;
    endTime?: bigint;
    collateralToken?: Address;
    outcome?: number;
};

/**
 * Class to handle fetching market details from the factory contract
 */
export class GetMarketAction {
    async getMarket(
        factoryAddress: Address,
        marketId: `0x${string}`
    ): Promise<GetMarketResponse> {
        const publicClient = createPublicClient({
            chain,
            transport: http(),
        });

        const marketAddress = (await publicClient.readContract({
            address: factoryAddress,
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

        try {
            const marketInfo = (await publicClient.readContract({
                address: marketAddress,
                abi: MARKET_ABI,
                functionName: "getMarketInfo",
            })) as [string, bigint, Address, number];

            const [question, endTime, collateralToken, outcome] = marketInfo;

            return {
                marketId,
                marketAddress,
                question,
                endTime,
                collateralToken,
                outcome,
            };
        } catch {
            return {
                marketId,
                marketAddress,
            };
        }
    }
}

function formatDate(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
        hour12: false,
    };
    return date.toLocaleString("en-US", options) + " UTC";
}

function formatMarketResponse(response: GetMarketResponse): string {
    let text = `📈 Market Details:\n`;
    text += `• ID: ${response.marketId}\n`;
    text += `• Address: ${response.marketAddress}`;

    if (response.question) {
        text += `\n• Question: '${response.question}'`;
    }
    if (response.endTime) {
        text += `\n• End Time: ${formatDate(response.endTime)}`;
    }
    if (response.collateralToken) {
        text += `\n• Collateral: MODE (${response.collateralToken})`;
    }
    if (response.outcome !== undefined) {
        text += `\n• Status: ${response.outcome === 0 ? "Trading" : response.outcome === 1 ? "Yes" : "No"}`;
    }

    return text;
}

export const getMarketsAction: Action = {
    name: "GET_MARKETS",
    description: "Get market details by ID from the factory contract",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        // Only handle direct market ID queries
        const marketIdMatch = message.content?.text?.match(/0x[a-fA-F0-9]{64}/);
        if (!marketIdMatch) {
            return false;
        }

        try {
            const marketId = marketIdMatch[0] as `0x${string}`;
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            ) as Address;

            if (!factoryAddress || !isAddress(factoryAddress)) {
                throw new Error("Invalid factory address configuration");
            }

            // Get market data from contract
            const action = new GetMarketAction();
            const response = await action.getMarket(factoryAddress, marketId);

            // Only respond if we got valid data from the contract
            if (
                response.marketAddress ===
                    "0x0000000000000000000000000000000000000000" ||
                !response.question ||
                !response.endTime
            ) {
                return false;
            }

            if (callback) {
                const formattedResponse = formatMarketResponse(response);
                await callback({
                    text: formattedResponse,
                    action: "GET_MARKETS",
                    source: "contract",
                    content: {
                        marketId: response.marketId,
                        marketAddress: response.marketAddress,
                        question: response.question,
                        endTime: response.endTime.toString(),
                        collateralToken: response.collateralToken,
                        outcome: response.outcome,
                    },
                });
            }

            return true;
        } catch (error) {
            if (callback) {
                await callback({
                    text: `Error getting market: ${error.message}`,
                    action: "GET_MARKETS",
                });
            }
            return true;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        try {
            await validateSentientConfig(runtime);
            return true;
        } catch {
            return false;
        }
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "0x7b117239fb5993098323baced4ab297452d3fb903b4803b58f5c3b09018aafe7",
                },
            },
        ],
    ],
    similes: [
        "GET_MARKET",
        "SHOW_MARKET",
        "VIEW_MARKET",
        "DISPLAY_MARKET",
        "FETCH_MARKET",
        "market info",
        "market details",
    ],
};
