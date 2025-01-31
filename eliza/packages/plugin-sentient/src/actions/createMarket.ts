import type { Action } from "@elizaos/core";
import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    elizaLogger,
    composeContext,
    generateObject,
} from "@elizaos/core";
import { validateSentientConfig } from "../environment";
import { useGetWalletClient } from "../hooks";
import { z } from "zod";
import { isAddress, parseUnits } from "viem";
import { FACTORY_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";

const CreateMarketSchema = z.object({
    question: z.string(),
    description: z.string(),
    endDate: z.number(),
    initialLiquidity: z.number().default(10),
    protocolFee: z.number().default(1),
    outcomeDescriptions: z.array(z.string()),
});

export interface CreateMarketContent extends Content {
    question: string;
    description: string;
    endDate: number;
    initialLiquidity: number;
    protocolFee: number;
    outcomeDescriptions: string[];
}

const createMarketTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "question": "Will ETH reach $3000 by end of Q1 2024?",
    "description": "Market to predict if ETH will reach or exceed $3000 before March 31st, 2024",
    "endDate": 1711929599000,
    "initialLiquidity": 100,
    "protocolFee": 1,
    "outcomeDescriptions": ["Yes", "No"]
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested market creation:
- Question for the market
- Description of what is being predicted
- End date (timestamp in milliseconds)
- Initial liquidity amount in MODE tokens
- Protocol fee percentage (default to 1)
- Outcome descriptions (array of strings, usually ["Yes", "No"])

Respond with a JSON markdown block containing only the extracted values.`;

export const createMarketAction: Action = {
    name: "CREATE_MARKET",
    similes: [
        "CREATE_PREDICTION_MARKET",
        "NEW_MARKET",
        "START_MARKET",
        "OPEN_MARKET",
        "INITIALIZE_MARKET",
    ],
    validate: async (runtime: IAgentRuntime) => {
        await validateSentientConfig(runtime);
        return true;
    },
    description: "Create a new binary outcome prediction market",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting CREATE_MARKET handler...");

        try {
            // Initialize or update state
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Compose market creation context
            const marketContext = composeContext({
                state,
                template: createMarketTemplate,
            });

            // Generate market content
            const content = (
                await generateObject({
                    runtime,
                    context: marketContext,
                    modelClass: ModelClass.SMALL,
                    schema: CreateMarketSchema,
                })
            ).object as unknown as CreateMarketContent;

            // Get wallet client
            const walletClient = await useGetWalletClient(runtime);

            // Get factory address
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            )!;
            if (!isAddress(factoryAddress)) {
                throw new Error("Invalid factory address");
            }

            // Create market transaction
            const hash = await walletClient.writeContract({
                address: factoryAddress as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: "createMarket",
                chain,
                account: walletClient.account,
                args: [
                    content.question,
                    content.description,
                    BigInt(content.endDate),
                    parseUnits(content.initialLiquidity.toString(), 18),
                    content.protocolFee,
                    content.outcomeDescriptions,
                ],
            });

            elizaLogger.success(
                "Market created successfully! Transaction hash: " + hash
            );

            if (callback) {
                callback({
                    text: `Market created successfully!\nQuestion: ${content.question}\nTransaction: ${hash}`,
                    content: { hash },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error creating market:", error);
            if (callback) {
                callback({
                    text: `Error creating market: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a market for ETH price prediction",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll create a market to predict ETH price.",
                    action: "CREATE_MARKET",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Successfully created market:\nQuestion: Will ETH reach $3000 by end of Q1 2024?\nTransaction: 0x123...",
                },
            },
        ],
    ] as ActionExample[][],
};
