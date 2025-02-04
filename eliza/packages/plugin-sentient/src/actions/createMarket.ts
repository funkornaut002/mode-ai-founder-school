import type { Action } from "@elizaos/core";
import {
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
import { useGetWalletClient } from "../hooks/useGetWalletClient";
import { z } from "zod";
import { isAddress, parseUnits, createPublicClient, http } from "viem";
import { FACTORY_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";

const CreateMarketSchema = z.object({
    question: z.string(),
    endDate: z.number().transform((val) => {
        // Convert timestamp to Date object
        const date = new Date(val);

        // If it's already a valid timestamp, just ensure it ends at 23:59:59
        if (!isNaN(date.getTime())) {
            date.setUTCHours(23, 59, 59, 999);
            return date.getTime();
        }

        throw new Error("Invalid date format");
    }),
    initialLiquidity: z.number().default(10),
    protocolFee: z.number().default(1),
    outcomeDescriptions: z.array(z.string()).default(["Yes", "No"]),
});

export interface CreateMarketContent extends Content {
    question: string;
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
    "endDate": 1711929599000,
    "initialLiquidity": 100,
    "protocolFee": 1,
    "outcomeDescriptions": ["Yes", "No"]
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested market creation:
- Question for the market
- End date (timestamp in milliseconds)
  Examples of valid end dates:
  - "end of Q1 2024" -> 1711929599000 (March 31, 2024, 23:59:59 UTC)
  - "end of Q2 2024" -> 1719791999000 (June 30, 2024, 23:59:59 UTC)
  - "end of Q3 2024" -> 1727797199000 (September 30, 2024, 23:59:59 UTC)
  - "end of Q4 2024" -> 1735689599000 (December 31, 2024, 23:59:59 UTC)
  - "December 31, 2024" -> 1735689599000 (December 31, 2024, 23:59:59 UTC)
  Note: All end dates will be set to 23:59:59 UTC of the specified date
- Initial liquidity amount in MODE tokens (default to 10)
- Protocol fee percentage (default to 1)
- Outcome descriptions (array of strings, default to ["Yes", "No"])

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

            // Get wallet client and public client
            const walletClient = await useGetWalletClient(runtime);
            const publicClient = createPublicClient({
                chain,
                transport: http(),
            });

            // Get factory address
            const factoryAddress = runtime.getSetting(
                "PREDICTION_MARKET_FACTORY"
            )!;
            if (!isAddress(factoryAddress)) {
                throw new Error("Invalid factory address");
            }

            // Get MIN_MARKET_DURATION from contract
            const minDuration = (await publicClient.readContract({
                address: factoryAddress as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: "MIN_MARKET_DURATION",
            })) as bigint;

            // Convert endDate from milliseconds to seconds and validate
            const endTimeSeconds = Math.floor(content.endDate / 1000);
            const currentTimeSeconds = Math.floor(Date.now() / 1000);
            const duration = endTimeSeconds - currentTimeSeconds;

            if (duration < Number(minDuration)) {
                throw new Error(
                    `Market duration must be at least ${minDuration} seconds from now`
                );
            }

            elizaLogger.log("Creating market with parameters:", {
                question: content.question,
                endTimeSeconds,
                currentTimeSeconds,
                duration,
                minDuration: minDuration.toString(),
                initialLiquidity: content.initialLiquidity,
                protocolFee: content.protocolFee,
                outcomeDescriptions: content.outcomeDescriptions,
            });

            // Create market transaction
            const hash = await walletClient.writeContract({
                address: factoryAddress as `0x${string}`,
                abi: FACTORY_ABI,
                functionName: "createMarket",
                chain,
                account: walletClient.account,
                args: [
                    content.question,
                    BigInt(endTimeSeconds),
                    "0xf8865d1d66451518fb9117cb1d0e4b0811a42823", // MODE token address
                    parseUnits(content.initialLiquidity.toString(), 18),
                    BigInt(content.protocolFee),
                    content.outcomeDescriptions,
                ],
            });

            elizaLogger.success(
                "Market created successfully! Transaction hash: " + hash
            );

            if (callback) {
                callback({
                    text: `Market created successfully!\nQuestion: ${content.question}\nEnd Time: ${endTimeSeconds} (${new Date(content.endDate).toUTCString()})\nInitial Liquidity: ${content.initialLiquidity} MODE\nTransaction: ${hash}`,
                    content: {
                        hash,
                        question: content.question,
                        endTime: endTimeSeconds,
                        endTimeUTC: new Date(content.endDate).toUTCString(),
                        initialLiquidity: content.initialLiquidity,
                        outcomeDescriptions: content.outcomeDescriptions,
                    },
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
                user: "user",
                content: {
                    text: "Create a prediction market for ETH price reaching $3000 by end of Q1 2024",
                    action: "CREATE_MARKET",
                },
            },
        ],
    ],
};
