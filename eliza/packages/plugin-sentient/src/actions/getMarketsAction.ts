import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import { decodeEventLog, parseAbiItem, createPublicClient, http } from "viem";
import type { Market, Address } from "../types";
import { FACTORY_ABI, MARKET_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";

function debugLog(section: string, data: any) {
    console.log(`\n=== ${section} ===`);
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(20), "\n");
}

export const getMarketsAction = {
    name: "GET_MARKETS",
    description: "Get all prediction markets on Mode Network",
    similes: [
        "GET_MARKETS",
        "LIST_MARKETS",
        "SHOW_MARKETS",
        "VIEW_MARKETS",
        "DISPLAY_MARKETS",
        "FETCH_MARKETS",
        "listmarkets",
        "list_markets",
        "list markets",
        "show markets",
        "view markets",
        "get markets",
        "display markets",
        "fetch markets",
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Show me all prediction markets",
                    action: "GET_MARKETS",
                },
            },
        ],
    ],
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        debugLog("GET_MARKETS ACTION START", {
            timestamp: new Date().toISOString(),
        });

        try {
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            });

            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            );

            debugLog("FETCHING MARKETS", {
                factoryAddress,
                chainId: chain.id,
            });

            // Get all MarketCreated events
            const events = await publicClient.getLogs({
                address: factoryAddress as Address,
                event: parseAbiItem(
                    "event MarketCreated(bytes32 marketId, address indexed marketAddress, string question, uint256 endTime, address collateralToken, uint256 virtualLiquidity)"
                ),
                fromBlock: 0n,
                toBlock: "latest",
            });

            debugLog("MARKET EVENTS FOUND", {
                count: events.length,
            });

            // Parse each market event
            const markets = await Promise.all(
                events.map(async (event) => {
                    try {
                        const decoded = decodeEventLog({
                            abi: FACTORY_ABI,
                            data: event.data,
                            topics: event.topics,
                        });
                        if (decoded.eventName === "MarketCreated") {
                            const args = {
                                marketId: decoded.args[0] as string,
                                marketAddress: decoded.args[1] as Address,
                                question: decoded.args[2] as string,
                                endTime: decoded.args[3] as bigint,
                                collateralToken: decoded.args[4] as Address,
                                virtualLiquidity: decoded.args[5] as bigint,
                            };

                            // Get additional market info
                            const marketInfo = (await publicClient.readContract(
                                {
                                    address: args.marketAddress,
                                    abi: MARKET_ABI,
                                    functionName: "getMarketInfo",
                                }
                            )) as [string, bigint, Address, number];

                            return {
                                id: args.marketId,
                                address: args.marketAddress,
                                question: marketInfo[0],
                                endTime: marketInfo[1],
                                collateralToken: marketInfo[2],
                                virtualLiquidity: args.virtualLiquidity,
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error("Error parsing market:", error);
                        return null;
                    }
                })
            );

            const validMarkets = markets.filter((m): m is Market => m !== null);
            const result = {
                count: validMarkets.length,
                markets: validMarkets,
            };

            if (callback) {
                if (result.markets.length === 0) {
                    await callback({
                        text: "No prediction markets found on Mode Network.",
                        action: "GET_MARKETS",
                        content: result,
                    });
                } else {
                    const marketsText = result.markets
                        .map(
                            (m) =>
                                `\n• Market ${m.id}\n` +
                                `  Question: '${m.question}'\n` +
                                `  Address: ${m.address}\n` +
                                `  End Time: ${new Date(
                                    Number(m.endTime)
                                ).toLocaleString()}\n` +
                                `  Liquidity: ${m.virtualLiquidity} MODE`
                        )
                        .join("");

                    await callback({
                        text: `📈 Market List:${marketsText}\n\nTotal Markets: ${result.count}`,
                        action: "GET_MARKETS",
                        content: result,
                    });
                }
            }

            return result;
        } catch (error) {
            debugLog("GET_MARKETS ERROR", {
                error: error.message,
                stack: error.stack,
            });
            if (callback) {
                await callback({
                    text: `Error getting markets: ${error.message}`,
                    action: "ERROR",
                    content: { error: error.message },
                });
            }
            throw error;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        try {
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            );
            const providerUrl = runtime.getSetting("EVM_PROVIDER_URL");

            if (!factoryAddress || !factoryAddress.startsWith("0x")) {
                throw new Error(
                    "Invalid or missing PREDICTION_MARKET_FACTORY address"
                );
            }

            if (!providerUrl || !providerUrl.includes("mode.network")) {
                throw new Error("Invalid or missing Mode Network provider URL");
            }

            // Verify wallet provider exists
            const provider = runtime.providers.find(
                (p) => (p as any).name === "wallet"
            );
            if (!provider) {
                throw new Error("Wallet provider not found");
            }

            return true;
        } catch (error) {
            console.error("GET_MARKETS validation error:", error);
            return false;
        }
    },
};
