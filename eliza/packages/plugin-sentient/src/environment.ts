import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";
import { isAddress } from "viem";

export const sentientEnvSchema = z.object({
    EVM_PRIVATE_KEY: z
        .string()
        .min(1, "Private key is required")
        .refine((key) => /^0x[a-fA-F0-9]{64}$/.test(key), {
            message:
                "Private key must be a 0x-prefixed 64-character hex string",
        }),
    EVM_PROVIDER_URL: z
        .string()
        .min(1, "Provider URL is required")
        .includes("mode.network", {
            message: "Must be a Mode Network provider URL",
        }),
    PREDICTION_MARKET_FACTORY: z
        .string()
        .min(1, "Factory address is required")
        .refine((address) => isAddress(address), {
            message: "Factory address must be a valid address",
        }),
    MODE_TOKEN_ADDRESS: z
        .string()
        .min(1, "MODE token address is required")
        .refine((address) => isAddress(address), {
            message: "MODE token address must be a valid address",
        }),
});

export type SentientConfig = z.infer<typeof sentientEnvSchema>;

export async function validateSentientConfig(
    runtime: IAgentRuntime
): Promise<SentientConfig> {
    const config = {
        EVM_PRIVATE_KEY: runtime.getSetting("EVM_PRIVATE_KEY"),
        EVM_PROVIDER_URL: runtime.getSetting("EVM_PROVIDER_URL"),
        PREDICTION_MARKET_FACTORY: runtime.getSetting(
            "PREDICTION_MARKET_FACTORY"
        ),
        MODE_TOKEN_ADDRESS: runtime.getSetting("MODE_TOKEN_ADDRESS"),
    };

    return sentientEnvSchema.parse(config);
}
