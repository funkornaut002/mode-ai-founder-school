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
import { parseUnits, isAddress, createPublicClient, http } from "viem";
import type { Address } from "../types";
import { MARKET_ABI } from "../constants/abi";
import { chain } from "../providers/wallet";
import { validateSentientConfig } from "../environment";
import { useGetWalletClient } from "../hooks/useGetWalletClient";
import { z } from "zod";

// ERC20 approve function ABI
const ERC20_ABI = [
    {
        inputs: [
            { internalType: "address", name: "spender", type: "address" },
            { internalType: "uint256", name: "amount", type: "uint256" },
        ],
        name: "approve",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;

const BuyPositionSchema = z.object({
    marketAddress: z.string(),
    outcomeId: z.number().min(0).max(1), // 0 for No, 1 for Yes
    amount: z.number().positive(),
    maxPriceImpactBps: z.number().default(100), // Default to 1% max price impact
    minTokensOut: z.number().default(0),
});

export interface BuyPositionContent extends Content {
    marketAddress: string;
    outcomeId: number;
    amount: number;
    maxPriceImpactBps?: number;
    minTokensOut?: number;
}

const buyPositionTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "marketAddress": "0x1234...5678",
    "outcomeId": 1,
    "amount": 100,
    "maxPriceImpactBps": 100,
    "minTokensOut": 0
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested position purchase:
- Market address (required)
- Outcome ID (0 for No, 1 for Yes)
- Amount of MODE tokens to invest
- Maximum price impact in basis points (optional, default 100 = 1%)
- Minimum tokens to receive (optional, default 0)

Respond with a JSON markdown block containing only the extracted values.`;

function getErrorMessage(error: any): string {
    // Check if it's a contract revert error
    if (error.cause?.name === "ContractFunctionRevertedError") {
        const signature = error.cause.signature;
        // Map known error signatures
        switch (signature) {
            case "Market_TradingEnded":
                return "Trading has ended for this market";
            case "Market_InvalidOutcome":
                return "Invalid outcome ID provided";
            case "Market_PriceImpactTooHigh":
                return "Price impact is too high. Try reducing the amount or increasing maxPriceImpactBps";
            case "Market_InsufficientOutput":
                return "Insufficient tokens would be received. Try adjusting minTokensOut";
            default:
                return `Market contract error: ${signature || "Unknown error"}`;
        }
    }
    // Handle other types of errors
    return error.message || "Unknown error occurred";
}

export const buyPositionAction: Action = {
    name: "BUY_POSITION",
    description: "Buy a position in a prediction market",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting BUY_POSITION handler...");

        try {
            // Initialize or update state
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Compose buy position context
            const buyContext = composeContext({
                state,
                template: buyPositionTemplate,
            });

            // Generate buy position content
            const content = (
                await generateObject({
                    runtime,
                    context: buyContext,
                    modelClass: ModelClass.SMALL,
                    schema: BuyPositionSchema,
                })
            ).object as unknown as BuyPositionContent;

            const walletClient = await useGetWalletClient(runtime);
            if (!walletClient) {
                throw new Error("Wallet client not available");
            }

            const publicClient = createPublicClient({
                chain,
                transport: http(),
            });

            // Validate market address
            if (!isAddress(content.marketAddress)) {
                throw new Error("Invalid market address");
            }

            // Check if trading has ended
            const marketInfo = await publicClient.readContract({
                address: content.marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "getMarketInfo",
            });

            if (
                BigInt(marketInfo[1]) <= BigInt(Math.floor(Date.now() / 1000))
            ) {
                throw new Error("Trading has ended for this market");
            }

            const collateralToken = marketInfo[2] as Address;

            // Calculate expected price impact
            const priceImpact = await publicClient.readContract({
                address: content.marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "calculatePriceImpact",
                args: [
                    BigInt(content.outcomeId),
                    parseUnits(content.amount.toString(), 18),
                ],
            });

            if (priceImpact > BigInt(content.maxPriceImpactBps || 100)) {
                throw new Error(
                    `Price impact too high: ${Number(priceImpact) / 100}%. Maximum allowed: ${(content.maxPriceImpactBps || 100) / 100}%`
                );
            }

            // Calculate expected tokens out
            const expectedTokens = await publicClient.readContract({
                address: content.marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "calcBuyAmount",
                args: [
                    BigInt(content.outcomeId),
                    parseUnits(content.amount.toString(), 18),
                ],
            });

            // Convert amount to wei
            const amountInWei = parseUnits(content.amount.toString(), 18);

            elizaLogger.log("Approving MODE tokens...");

            // Approve MODE tokens first
            const approveHash = await walletClient.writeContract({
                address: collateralToken,
                abi: ERC20_ABI,
                functionName: "approve",
                args: [content.marketAddress as Address, amountInWei],
                chain,
                account: walletClient.account,
            });

            elizaLogger.log("MODE tokens approved. Hash:", approveHash);
            elizaLogger.log("Buying position with parameters:", {
                marketAddress: content.marketAddress,
                outcomeId: content.outcomeId,
                amount: content.amount,
                maxPriceImpactBps: content.maxPriceImpactBps,
                minTokensOut: content.minTokensOut,
                expectedTokens: expectedTokens.toString(),
                priceImpact: Number(priceImpact) / 100,
            });

            // Execute buy transaction
            const hash = await walletClient.writeContract({
                address: content.marketAddress as Address,
                abi: MARKET_ABI,
                functionName: "buy",
                chain,
                account: walletClient.account,
                args: [
                    BigInt(content.outcomeId),
                    amountInWei,
                    BigInt(content.maxPriceImpactBps || 100),
                    BigInt(content.minTokensOut || 0),
                ],
            });

            elizaLogger.success(
                "Position purchased successfully! Transaction hash: " + hash
            );

            if (callback) {
                await callback({
                    text: `Position purchased successfully!\nMarket: ${content.marketAddress}\nOutcome: ${content.outcomeId === 1 ? "Yes" : "No"}\nAmount: ${content.amount} MODE\nExpected Tokens: ${Number(expectedTokens) / 1e18}\nPrice Impact: ${Number(priceImpact) / 100}%\nApproval: ${approveHash}\nTransaction: ${hash}\n\nNote: Maximum price impact was set to ${content.maxPriceImpactBps || 100} basis points (${(content.maxPriceImpactBps || 100) / 100}%) for your protection.`,
                    action: "BUY_POSITION",
                    source: "contract",
                    content: {
                        marketAddress: content.marketAddress,
                        outcomeId: content.outcomeId,
                        amount: content.amount,
                        expectedTokens: expectedTokens.toString(),
                        priceImpact: Number(priceImpact) / 100,
                        approvalHash: approveHash,
                        transactionHash: hash,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error buying position:", error);
            if (callback) {
                const errorMessage = getErrorMessage(error);
                await callback({
                    text: `Error buying position: ${errorMessage}`,
                    action: "BUY_POSITION",
                    content: { error: errorMessage },
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
                    text: "Buy 100 MODE worth of Yes position in market 0x1234...5678",
                },
            },
        ],
    ],
    similes: [
        "BUY_MARKET_POSITION",
        "PURCHASE_POSITION",
        "TAKE_POSITION",
        "BET_ON_MARKET",
        "INVEST_IN_MARKET",
        "buy position",
        "take position",
        "place bet",
    ],
};
