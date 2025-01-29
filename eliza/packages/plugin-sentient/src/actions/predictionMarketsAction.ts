import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import { decodeEventLog, parseAbiItem, parseEther } from "viem";
import type { MarketParams, Market, Address } from "../types";
import { FACTORY_ABI, MARKET_ABI } from "../constants/abi";

type MarketCreatedEvent = {
    eventName: "MarketCreated";
    args: {
        marketId: string;
        marketAddress: Address;
        question: string;
        endTime: bigint;
        collateralToken: Address;
        virtualLiquidity: bigint;
    };
};

// Helper function to validate market parameters
function isMarketParams(params: unknown): params is MarketParams {
    return (
        typeof params === "object" &&
        params !== null &&
        "question" in params &&
        "description" in params &&
        "endDate" in params &&
        "initialLiquidity" in params &&
        "collateralToken" in params &&
        "protocolFee" in params &&
        "outcomeDescriptions" in params
    );
}

// Add at the top after imports
function debugLog(section: string, data: any) {
    console.log(`\n=== ${section} ===`);
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(20), "\n");
}

export const predictionMarketsAction = {
    name: "PREDICTION_MARKETS",
    description:
        "Create and interact with AI-powered prediction markets on Mode Network",
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Create a prediction market: Will SOL reach $300 by Feb 2025?",
                    action: "CREATE_PREDICTION_MARKET",
                    params: {
                        question: "Will SOL reach $300 by Feb 2025?",
                        description:
                            "A market to predict if SOL will reach $300 by February 2025",
                        endDate: 1739577600000,
                        initialLiquidity: 10,
                        collateralToken:
                            "0xf8865d1d66451518fb9117cb1d0e4b0811a42823",
                        protocolFee: 1,
                        outcomeDescriptions: ["Yes", "No"],
                    },
                },
            },
        ],
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
    similes: [
        "create market",
        "new market",
        "make market",
        "list markets",
        "show markets",
        "get markets",
        "view markets",
        "CREATE_PREDICTION_MARKET",
        "GET_MARKETS",
        "PREDICTION_MARKETS",
    ],
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: any
    ) => {
        debugLog("ACTION HANDLER ENTRY", {
            timestamp: new Date().toISOString(),
            messageContent: message.content,
            hasCallback: !!callback,
        });

        try {
            // Get wallet provider from runtime
            debugLog("RUNTIME PROVIDERS", {
                availableProviders: runtime.providers.map((p: any) => p.name),
                providerCount: runtime.providers.length,
            });

            const provider = runtime.providers.find(
                (p) => (p as any).name === "wallet"
            );

            if (!provider) {
                debugLog("PROVIDER ERROR", {
                    error: "Wallet provider not found",
                    availableProviders: runtime.providers.map(
                        (p: any) => p.name
                    ),
                });
                throw new Error("Wallet provider not found");
            }

            debugLog("PROVIDER FOUND", {
                name: (provider as any).name,
                type: provider.constructor.name,
            });

            const { walletClient, publicClient, account, chain } =
                await provider.get(runtime, message, state);

            debugLog("CLIENT INITIALIZATION", {
                hasWalletClient: !!walletClient,
                hasPublicClient: !!publicClient,
                hasAccount: !!account,
                hasChain: !!chain,
                address: account?.address,
                chainId: chain?.id,
            });

            // Get factory address from settings
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            );
            debugLog("FACTORY ADDRESS", {
                address: factoryAddress,
                isValid: factoryAddress?.startsWith("0x"),
            });

            // Create tools object for contract interaction
            const tools = {
                async createMarket(params: MarketParams) {
                    console.log("Creating market with params:", params);

                    // Verify creator status
                    const isCreator = await publicClient.readContract({
                        address: factoryAddress as Address,
                        abi: FACTORY_ABI,
                        functionName: "isMarketCreator",
                        args: [account.address],
                    });

                    if (!isCreator) {
                        throw new Error(
                            "Address is not authorized as market creator"
                        );
                    }

                    // Prepare transaction
                    const { request } = await publicClient.simulateContract({
                        address: factoryAddress as Address,
                        abi: FACTORY_ABI,
                        functionName: "createMarket",
                        args: [
                            params.question,
                            BigInt(params.endDate),
                            params.collateralToken as Address,
                            parseEther(params.initialLiquidity.toString()),
                            BigInt(params.protocolFee),
                            params.outcomeDescriptions,
                        ],
                        account: account.address,
                    });

                    // Send transaction
                    const hash = await walletClient.writeContract(request);
                    console.log("Transaction sent:", hash);

                    // Wait for transaction
                    const receipt =
                        await publicClient.waitForTransactionReceipt({
                            hash,
                            timeout: 60_000,
                            confirmations: 1,
                        });

                    // Find market created event
                    const marketCreatedEvent = receipt.logs
                        .filter(
                            (log) =>
                                log.address.toLowerCase() ===
                                factoryAddress.toLowerCase()
                        )
                        .map((log) => {
                            try {
                                const decoded = decodeEventLog({
                                    abi: FACTORY_ABI,
                                    data: log.data,
                                    topics: log.topics,
                                });
                                if (decoded.eventName === "MarketCreated") {
                                    return {
                                        eventName: decoded.eventName,
                                        args: {
                                            marketId: decoded.args[0] as string,
                                            marketAddress: decoded
                                                .args[1] as Address,
                                            question: decoded.args[2] as string,
                                            endTime: decoded.args[3] as bigint,
                                            collateralToken: decoded
                                                .args[4] as Address,
                                            virtualLiquidity: decoded
                                                .args[5] as bigint,
                                        },
                                    } as MarketCreatedEvent;
                                }
                                return null;
                            } catch {
                                return null;
                            }
                        })
                        .find((event) => event?.eventName === "MarketCreated");

                    if (!marketCreatedEvent) {
                        throw new Error(
                            "Market creation event not found in transaction logs"
                        );
                    }

                    return {
                        marketId: marketCreatedEvent.args.marketId,
                        marketAddress: marketCreatedEvent.args.marketAddress,
                        transactionHash: hash,
                    };
                },

                async getMarkets() {
                    console.log(
                        "Getting markets from factory:",
                        factoryAddress
                    );

                    // Get all MarketCreated events
                    const events = await publicClient.getLogs({
                        address: factoryAddress as Address,
                        event: parseAbiItem(
                            "event MarketCreated(bytes32 marketId, address indexed marketAddress, string question, uint256 endTime, address collateralToken, uint256 virtualLiquidity)"
                        ),
                        fromBlock: 0n,
                        toBlock: "latest",
                    });

                    console.log(`Found ${events.length} market events`);

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
                                        marketAddress: decoded
                                            .args[1] as Address,
                                        question: decoded.args[2] as string,
                                        endTime: decoded.args[3] as bigint,
                                        collateralToken: decoded
                                            .args[4] as Address,
                                        virtualLiquidity: decoded
                                            .args[5] as bigint,
                                    };

                                    // Get additional market info
                                    const marketInfo =
                                        (await publicClient.readContract({
                                            address: args.marketAddress,
                                            abi: MARKET_ABI,
                                            functionName: "getMarketInfo",
                                        })) as [
                                            string,
                                            bigint,
                                            Address,
                                            number,
                                        ];

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

                    const validMarkets = markets.filter(
                        (m): m is Market => m !== null
                    );
                    return {
                        count: validMarkets.length,
                        markets: validMarkets,
                    };
                },
            };

            // Action type detection
            let actionType = message.content?.action?.toUpperCase();
            debugLog("ACTION DETECTION", {
                initialType: actionType,
                messageText: message.content?.text,
                hasParams: !!message.content?.params,
            });

            // If no direct action, try to detect from text
            if (!actionType && message.content?.text) {
                const text = message.content.text.toUpperCase();
                if (
                    text.includes("CREATE") ||
                    text.includes("NEW") ||
                    text.includes("MAKE")
                ) {
                    actionType = "CREATE_PREDICTION_MARKET";
                } else if (
                    text.includes("SHOW") ||
                    text.includes("LIST") ||
                    text.includes("GET") ||
                    text.includes("VIEW")
                ) {
                    actionType = "GET_MARKETS";
                }
                debugLog("TEXT BASED ACTION DETECTION", {
                    text,
                    detectedAction: actionType,
                });
            }

            console.log("🎯 Final action type:", actionType);

            let result;
            switch (actionType) {
                case "CREATE_PREDICTION_MARKET":
                    debugLog("CREATE MARKET START", {
                        params: message.content?.params,
                    });
                    if (
                        !message.content?.params ||
                        !isMarketParams(message.content.params)
                    ) {
                        throw new Error("Missing or invalid market parameters");
                    }

                    result = await tools.createMarket(message.content.params);
                    if (callback) {
                        await callback({
                            text: `📊 New market created!\nQuestion: ${message.content.params.question}\nMarket ID: ${result.marketId}\nAddress: ${result.marketAddress}\nTransaction: ${result.transactionHash}`,
                            action: actionType,
                            content: result,
                        });
                    }
                    break;

                case "GET_MARKETS":
                    debugLog("GET MARKETS START", {
                        factoryAddress,
                    });
                    result = await tools.getMarkets();
                    if (callback) {
                        if (result.markets.length === 0) {
                            await callback({
                                text: "No prediction markets found on Mode Network.",
                                action: actionType,
                                content: result,
                            });
                        } else {
                            const marketsText = result.markets
                                .map(
                                    (m) =>
                                        `\n• Market ${m.id}\n` +
                                        `  Question: '${m.question}'\n` +
                                        `  Address: ${m.address}\n` +
                                        `  End Time: ${new Date(Number(m.endTime)).toLocaleString()}\n` +
                                        `  Liquidity: ${m.virtualLiquidity} MODE`
                                )
                                .join("");

                            await callback({
                                text: `📈 Market List:${marketsText}\n\nTotal Markets: ${result.count}`,
                                action: actionType,
                                content: result,
                            });
                        }
                    }
                    break;

                default:
                    debugLog("NO ACTION MATCH", {
                        receivedType: actionType,
                        messageContent: message.content,
                    });
                    console.log("No valid action type found in message:", {
                        text: message.content?.text,
                        action: message.content?.action,
                        detectedAction: actionType,
                    });
                    if (callback) {
                        await callback({
                            text:
                                "I couldn't determine what action you want to take. You can:\n" +
                                "1. Create a new prediction market\n" +
                                "2. View all existing markets",
                            action: "HELP",
                            content: { error: "No valid action detected" },
                        });
                    }
                    return null;
            }

            return result;
        } catch (error) {
            debugLog("ACTION ERROR", {
                error: error.message,
                stack: error.stack,
                phase: "action_execution",
            });
            console.error("❌ Prediction markets action failed:", error);
            if (callback) {
                await callback({
                    text: `Error: ${error.message}`,
                    action: "ERROR",
                    content: { error: error.message },
                });
            }
            throw error;
        }
    },
    validate: async (runtime: IAgentRuntime) => {
        debugLog("ACTION VALIDATION", {
            timestamp: new Date().toISOString(),
            hasPrivateKey: !!runtime.getSetting("EVM_PRIVATE_KEY"),
        });
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        const isValid =
            typeof privateKey === "string" && privateKey.startsWith("0x");
        console.log("✅ Validation result:", isValid);
        return isValid;
    },
};
