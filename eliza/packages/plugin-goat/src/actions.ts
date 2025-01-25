import { getOnChainTools } from "@goat-sdk/adapter-vercel-ai";
import { MODE, USDC, erc20 } from "@goat-sdk/plugin-erc20";
import { kim } from "@goat-sdk/plugin-kim";
import { sendETH } from "@goat-sdk/wallet-evm";
import type { WalletClientBase } from "@goat-sdk/core";
import {
    type Action,
    type IAgentRuntime,
    type Content,
    type Memory,
    type State,
    composeContext,
    generateText,
    HandlerCallback,
    ModelClass,
} from "@elizaos/core";
import { predictionMarkets } from "./plugins/predictionMarkets";
import { MarketInfo, MarketParams, type PredictionMarketTools } from "./types";
import { parseEther } from "viem";
import { z } from "zod";
import { modeTestnet } from "viem/chains";

export async function getOnChainActions(
    wallet: WalletClientBase
): Promise<Action[]> {
    const plugin = predictionMarkets({
        factoryAddress: process.env.MARKET_FACTORY_ADDRESS as `0x${string}`,
    });

    const toolsList = await plugin.getTools(wallet);
    console.log(
        "Got tools list:",
        toolsList.map((t) => t.name)
    );

    const tools = toolsList.reduce((acc, tool) => {
        console.log("Converting tool:", tool.name);
        acc[tool.name] = async (params?: any) => {
            console.log(`Calling tool ${tool.name} with params:`, params);
            const result = await tool.execute(params);
            console.log(`Tool ${tool.name} returned:`, result);
            return result;
        };
        return acc;
    }, {} as PredictionMarketTools);

    console.log("Available tools:", Object.keys(tools));

    return [
        {
            name: "createMarket",
            description: "Create a new binary outcome prediction market",
            similes: ["create market", "start prediction", "initialize market"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Create a market asking 'Will ETH reach $5000 by end of 2024?'",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const content = message.content as { text: string };
                const question = content.text.replace(
                    /^Create a market asking ['"](.+)['"]$/,
                    "$1"
                );

                const params: MarketParams = {
                    question,
                    description: "",
                    endDate: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
                    initialLiquidity: parseEther("1"), // 1 MODE
                    collateralToken: process.env
                        .MODE_TOKEN_ADDRESS as `0x${string}`,
                    protocolFee: BigInt(200), // 2%
                    outcomeDescriptions: ["Yes", "No"],
                };

                const result = await tools.createMarket(params);
                return {
                    success: true,
                    message: `Created market "${question}" at address ${result.marketAddress}`,
                    data: result,
                };
            },
        },
        {
            name: "buyPosition",
            description: "Buy YES or NO tokens in a prediction market",
            similes: ["buy prediction", "take position", "invest in outcome"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Buy YES position in market #0x123 with 100 MODE",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const matches = message.content.text.match(
                    /Buy (YES|NO) position in market #(0x[a-fA-F0-9]+) with (\d+) MODE/
                );
                if (!matches) throw new Error("Invalid message format");

                const result = await tools.buyPosition({
                    marketAddress: matches[2] as `0x${string}`,
                    isYes: matches[1] === "YES",
                    amount: BigInt(matches[3]) * BigInt(1e18), // Convert to wei
                });

                return {
                    success: true,
                    message: `Bought ${matches[1]} position for ${matches[3]} MODE`,
                    data: result,
                };
            },
        },
        {
            name: "getMarketInfo",
            description: "Get information about a specific prediction market",
            similes: ["fetch market", "get market details", "view market"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Get market #0x123 details",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const matches = message.content.text.match(
                    /(?:market |market ID |#)?([0-9a-fA-Fx]{42})/
                );
                if (!matches) throw new Error("Invalid message format");

                const marketAddress = matches[1] as `0x${string}`;
                const result = await tools.getMarketInfo(marketAddress);

                return {
                    success: true,
                    message: `Market Info:
Question: ${result.question}
End Time: ${new Date(Number(result.endTime) * 1000).toLocaleString()}
Collateral Token: ${result.collateralToken}
Status: ${result.outcome === 0 ? "Trading" : result.outcome === 1 ? "YES" : "NO"}`,
                    data: result,
                };
            },
        },
        {
            name: "monitorMarket",
            description: "Get current market status and trading activity",
            similes: ["check market", "view trading", "market status"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Monitor Super Bowl market activity",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const matches = message.content.text.match(
                    /market #?(0x[a-fA-F0-9]+)/
                );
                if (!matches) throw new Error("Invalid message format");

                const marketAddress = matches[1] as `0x${string}`;
                const results = (await Promise.all([
                    tools.getMarketInfo(marketAddress),
                    tools.getPrice(marketAddress, 1n), // YES token
                    tools.getPrice(marketAddress, 0n), // NO token
                ])) as [MarketInfo, bigint, bigint];

                const [info, yesPrice, noPrice] = results;

                return {
                    success: true,
                    message: `Market Status:
Question: ${info.question}
YES Price: ${yesPrice} MODE
NO Price: ${noPrice} MODE
End Time: ${new Date(Number(info.endTime) * 1000).toLocaleString()}`,
                    data: { info, yesPrice, noPrice },
                };
            },
        },
        {
            name: "resolveMarket",
            description: "Resolve a prediction market with final outcome",
            similes: ["settle market", "finalize outcome", "close market"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Resolve market #0x123 with YES outcome",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const content = message.content as Content;
                const matches = content.text.match(
                    /market #?(0x[a-fA-F0-9]+) with (YES|NO)/
                );
                if (!matches) throw new Error("Invalid message format");

                return await tools.resolveMarket({
                    marketAddress: matches[1] as `0x${string}`,
                    outcome: matches[2] === "YES",
                });
            },
        },
        {
            name: "addLiquidity",
            description: "Add liquidity to an existing market",
            similes: ["provide liquidity", "fund market", "increase pool"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Add 1000 MODE liquidity to market #0x123",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const content = message.content as Content;
                const matches = content.text.match(
                    /(\d+) MODE liquidity to market #?(0x[a-fA-F0-9]+)/
                );
                if (!matches) throw new Error("Invalid message format");

                return await tools.addLiquidity({
                    marketAddress: matches[1] as `0x${string}`,
                    amount: BigInt(matches[1]) * BigInt(1e18), // Convert to wei
                });
            },
        },
        {
            name: "getMarkets",
            description: "Get all prediction markets and their details",
            similes: ["list markets", "show markets", "view markets"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: { text: "Show me all markets" } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                try {
                    const result = await tools.getMarkets();

                    if (result.count === 0) {
                        return {
                            success: true,
                            message: "No prediction markets found",
                            data: result,
                        };
                    }

                    const marketList = result.markets.map((market) => ({
                        id: market.id,
                        address: market.address,
                        question: market.question,
                        endTime: new Date(
                            Number(market.endTime) * 1000
                        ).toLocaleString(),
                        collateralToken: market.collateralToken,
                        liquidity: market.virtualLiquidity.toString(),
                    }));

                    return {
                        success: true,
                        message: `Found ${result.count} markets`,
                        data: marketList,
                    };
                } catch (error) {
                    console.error("Error listing markets:", error);
                    return {
                        success: false,
                        message: "Failed to fetch markets",
                        error: (error as Error).message,
                    };
                }
            },
        },
        {
            name: "getMarketCount",
            description: "Get total number of markets created",
            similes: ["count markets", "total markets", "market number"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: { text: "How many markets exist?" } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                console.log("Starting getMarketCount handler");
                try {
                    console.log("Calling tools.getMarketCount");
                    const result = await tools.getMarketCount();
                    console.log("Got result:", result);

                    const response = {
                        success: true,
                        message: `There are currently ${result.count} markets created.`,
                        data: result,
                    };
                    console.log("Sending response:", response);
                    return response;
                } catch (error) {
                    console.error("Error in getMarketCount:", error);
                    throw error;
                }
            },
        },
        {
            name: "createMarket",
            description: "Create a new prediction market",
            similes: ["new market", "start market", "create prediction"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Create a market about BTC price above 50k by end of month",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                const content = message.content as { text: string };

                // Extract market parameters from the message
                const question = content.text.replace(
                    /^Create a market asking ['"](.+)['"]$/,
                    "$1"
                );

                const params: MarketParams = {
                    question,
                    description: "",
                    endDate: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
                    initialLiquidity: parseEther("1"), // 1 MODE
                    collateralToken: process.env
                        .MODE_TOKEN_ADDRESS as `0x${string}`,
                    protocolFee: BigInt(200), // 2%
                    outcomeDescriptions: ["Yes", "No"],
                };

                const result = await tools.createMarket(params);

                return {
                    success: true,
                    marketId: result.marketId,
                    marketAddress: result.marketAddress,
                    transactionHash: result.transactionHash,
                };
            },
        },
        {
            name: "getMinMarketDuration",
            description: "Get minimum required duration for markets",
            similes: ["min duration", "market time", "duration check"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "What's the minimum market duration?",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                return await tools.getMinMarketDuration();
            },
        },
        {
            name: "getMarketByID",
            description: "Get market details using its ID",
            similes: ["find market", "lookup market", "get market"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: { text: "Get market 0x123..." } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                try {
                    const matches = message.content.text.match(
                        /(0x[a-fA-F0-9]{64}|0x[a-fA-F0-9]{40})/
                    );
                    if (!matches) throw new Error("Invalid market ID format");

                    const result = await tools.getMarketByID({
                        marketId: matches[1],
                    });

                    return {
                        success: true,
                        message: `Found market at address: ${result.marketAddress}`,
                        data: result,
                    };
                } catch (error) {
                    console.error("Error getting market:", error);
                    return {
                        success: false,
                        message: "Failed to get market details",
                        error: (error as Error).message,
                    };
                }
            },
        },
        {
            name: "getOwner",
            description: "Get contract owner address",
            similes: ["owner check", "contract owner", "admin lookup"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: { text: "Who owns the contract?" } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                try {
                    const result = await tools.getOwner();

                    if (result.error) {
                        return {
                            success: false,
                            message: `Failed to get owner: ${result.error}`,
                            data: result,
                        };
                    }

                    if (
                        result.owner ===
                        "0x0000000000000000000000000000000000000000"
                    ) {
                        return {
                            success: false,
                            message: "Contract owner is not set",
                            data: result,
                        };
                    }

                    return {
                        success: true,
                        message: `The contract owner is: ${result.owner}`,
                        data: result,
                    };
                } catch (error) {
                    console.error("Error getting owner:", error);
                    return {
                        success: false,
                        message: "Failed to get contract owner",
                        error: (error as Error).message,
                    };
                }
            },
        },
        {
            name: "isPaused",
            description: "Check if market creation is paused",
            similes: ["pause check", "market status", "creation state"],
            validate: async () => true,
            examples: [
                [
                    {
                        user: "user",
                        content: {
                            text: "Is market creation paused?",
                        } as Content,
                    },
                ],
            ],
            handler: async (
                runtime: IAgentRuntime,
                message: Memory,
                state: State
            ) => {
                return await tools.isPaused();
            },
        },
    ];
}
export function getActionHandler(
    actionName: string,
    actionDescription: string,
    tools
) {
    return async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options?: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        let currentState = state ?? (await runtime.composeState(message));
        currentState = await runtime.updateRecentMessageState(currentState);

        try {
            // 1. Call the tools needed
            const context = composeActionContext(
                actionName,
                actionDescription,
                currentState
            );
            const result = await generateText({
                runtime,
                context,
                tools,
                maxSteps: 10,
                // Uncomment to see the log each tool call when debugging
                // onStepFinish: (step) => {
                //     console.log(step.toolResults);
                // },
                modelClass: ModelClass.LARGE,
            });

            // 2. Compose the response
            const response = composeResponseContext(result, currentState);
            const responseText = await generateResponse(runtime, response);

            callback?.({
                text: responseText,
                content: {},
            });
            return true;
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);

            // 3. Compose the error response
            const errorResponse = composeErrorResponseContext(
                errorMessage,
                currentState
            );
            const errorResponseText = await generateResponse(
                runtime,
                errorResponse
            );

            callback?.({
                text: errorResponseText,
                content: { error: errorMessage },
            });
            return false;
        }
    };
}

function composeActionContext(
    actionName: string,
    actionDescription: string,
    state: State
): string {
    const actionTemplate = `
# Knowledge
{{knowledge}}

About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}


# Action: ${actionName}
${actionDescription}

{{recentMessages}}

Based on the action chosen and the previous messages, execute the action and respond to the user using the tools you were given.
`;
    return composeContext({ state, template: actionTemplate });
}

function composeResponseContext(result: unknown, state: State): string {
    const responseTemplate = `
    # Action Examples
{{actionExamples}}
(Action examples are for reference only. Do not use the information from them in your response.)

# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

Here is the result:
${JSON.stringify(result)}

{{actions}}

Respond to the message knowing that the action was successful and these were the previous messages:
{{recentMessages}}
  `;
    return composeContext({ state, template: responseTemplate });
}

function composeErrorResponseContext(
    errorMessage: string,
    state: State
): string {
    const errorResponseTemplate = `
# Knowledge
{{knowledge}}

# Task: Generate dialog and actions for the character {{agentName}}.
About {{agentName}}:
{{bio}}
{{lore}}

{{providers}}

{{attachments}}

# Capabilities
Note that {{agentName}} is capable of reading/seeing/hearing various forms of media, including images, videos, audio, plaintext and PDFs. Recent attachments have been included above under the "Attachments" section.

{{actions}}

Respond to the message knowing that the action failed.
The error was:
${errorMessage}

These were the previous messages:
{{recentMessages}}
    `;
    return composeContext({ state, template: errorResponseTemplate });
}

async function generateResponse(
    runtime: IAgentRuntime,
    context: string
): Promise<string> {
    return generateText({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
    });
}
