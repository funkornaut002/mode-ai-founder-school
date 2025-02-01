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
import { FACTORY_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";
import { validateSentientConfig } from "../environment";

type GetMarketResponse = {
    marketId: `0x${string}`;
    marketAddress: Address;
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

        elizaLogger.log("Fetching market:", { marketId, factoryAddress });

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

        return {
            marketId,
            marketAddress,
        };
    }
}

export const getMarketsAction: Action = {
    name: "GET_MARKETS",
    description: "Get market address by ID from the factory contract",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting GET_MARKETS handler...");

        try {
            // Extract market ID from message
            const marketIdMatch =
                message.content?.text?.match(/0x[a-fA-F0-9]{64}/);
            if (!marketIdMatch) {
                throw new Error(
                    "Please provide a valid market ID hash (64 characters starting with 0x)"
                );
            }

            const marketId = marketIdMatch[0] as `0x${string}`;
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            ) as Address;

            if (!factoryAddress || !isAddress(factoryAddress)) {
                throw new Error("Invalid factory address configuration");
            }

            // Fetch market data
            const action = new GetMarketAction();
            const response = await action.getMarket(factoryAddress, marketId);

            elizaLogger.success(
                "Market found! Address: " + response.marketAddress
            );

            if (callback) {
                await callback({
                    text: `📈 Market found!\nID: ${response.marketId}\nAddress: ${response.marketAddress}`,
                    action: "GET_MARKETS",
                    content: response,
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error getting market:", error);
            if (callback) {
                await callback({
                    text: `Error getting market: ${error.message}`,
                    action: "GET_MARKETS",
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        try {
            await validateSentientConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("GET_MARKETS validation error:", error);
            return false;
        }
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me market 0x7b117239fb5993098323baced4ab297452d3fb903b4803b58f5c3b09018aafe7",
                    action: "GET_MARKETS",
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
        "get market",
        "show market",
        "view market",
        "display market",
        "fetch market",
        "market info",
        "market details",
    ],
};
