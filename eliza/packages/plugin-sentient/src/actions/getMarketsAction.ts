import type { Action } from "@elizaos/core";
import {
    elizaLogger,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { isAddress, createPublicClient, http } from "viem";
import type { Address } from "../types";
import { MARKET_ABI, FACTORY_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";
import { validateSentientConfig } from "../environment";

type MarketInfo = readonly [
    question: string,
    endTime: bigint,
    collateralToken: Address,
    initialLiquidity: bigint,
    protocolFee: bigint,
    outcomeDescriptions: string[],
];

function formatDate(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return (
        date.toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "UTC",
            hour12: true,
        }) + " UTC"
    );
}

function formatMarketResponse(marketData: any) {
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = Number(marketData.endTime);
    const isEnded = endTime <= currentTime;
    elizaLogger.log("Market Data:", marketData);
    console.log(marketData);
    return `Here are the details for market ${marketData.marketAddress}:

Question: '${marketData.question}'
End Time: ${formatDate(BigInt(marketData.endTime))}
Collateral Token: MODE (${marketData.collateralToken})
Status: ${isEnded ? "Ended" : "Trading"}

Current Prices:
YES: ${(Number(marketData.yesPrice) / 1e18).toFixed(2)} MODE
NO: ${(Number(marketData.noPrice) / 1e18).toFixed(2)} MODE`;
}

export const getMarketsAction: Action = {
    name: "GET_MARKETS",
    description: "Get details of a specific prediction market",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        _state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        // Only handle messages that contain a market ID or address
        const marketIdMatch =
            message.content?.text?.match(/0x[a-fA-F0-9]{64}/)?.[0];
        const marketAddressMatch =
            message.content?.text?.match(/0x[a-fA-F0-9]{40}/)?.[0];

        if (!marketIdMatch && !marketAddressMatch) {
            return false;
        }

        try {
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            });

            let marketAddress: string;

            if (marketIdMatch) {
                // If we have a market ID, get the address from the factory
                const factoryAddress = runtime.getSetting(
                    "PREDICTION_MARKET_FACTORY"
                );
                if (!factoryAddress || !isAddress(factoryAddress)) {
                    throw new Error("Invalid factory address configuration");
                }

                marketAddress = (await publicClient.readContract({
                    address: factoryAddress as Address,
                    abi: FACTORY_ABI,
                    functionName: "markets",
                    args: [marketIdMatch],
                })) as Address;

                if (
                    !marketAddress ||
                    marketAddress ===
                        "0x0000000000000000000000000000000000000000"
                ) {
                    throw new Error("Market not found");
                }
            } else if (marketAddressMatch && isAddress(marketAddressMatch)) {
                marketAddress = marketAddressMatch;
            } else {
                return false;
            }

            // Get market info
            const marketInfo = (await publicClient.readContract({
                address: marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "getMarketInfo",
            })) as unknown as MarketInfo;

            // Get current prices
            const yesPrice = await publicClient.readContract({
                address: marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "getPrice",
                args: [BigInt(1)], // YES position
            });

            const noPrice = await publicClient.readContract({
                address: marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "getPrice",
                args: [BigInt(0)], // NO position
            });

            const marketData = {
                marketId: marketIdMatch || null,
                marketAddress,
                question: marketInfo[0],
                endTime: marketInfo[1].toString(),
                collateralToken: marketInfo[2],
                initialLiquidity: Number(marketInfo[3]) / 1e18,
                protocolFee: Number(marketInfo[4]),
                outcomeDescriptions: marketInfo[5],
                yesPrice: yesPrice.toString(),
                noPrice: noPrice.toString(),
            };

            if (callback) {
                await callback({
                    text: formatMarketResponse(marketData),
                    action: "GET_MARKETS",
                    source: "contract",
                    content: marketData,
                });
            }

            return true;
        } catch (error) {
            if (callback) {
                await callback({
                    text: `Error getting market: ${error.message}`,
                    action: "GET_MARKETS",
                    source: "error",
                });
            }
            return false;
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
                    text: "Show me market 0x2fd57cf9be6a2f570794344dabcf3b894d1379e2b4fbaa218bb95708b0a9579f",
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
    ],
};
