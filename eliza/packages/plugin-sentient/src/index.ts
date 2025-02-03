/**
 * Sentient Plugin for Mode Network Prediction Markets
 * @module @elizaos/plugin-sentient
 */

import type { Plugin } from "@elizaos/core";
import { createMarketAction } from "./actions/createMarket";
import { getMarketsAction } from "./actions/getMarketsAction";
import { evmWalletProvider } from "./providers/wallet";
import { buyPositionAction } from "./actions/buyPosition";

// Export all public APIs
export * from "./actions/createMarket";
export * from "./actions/getMarketsAction";
export * from "./actions/buyPosition";
export * from "./providers/wallet";
export * from "./types";

/**
 * Sentient Plugin Configuration
 * Provides prediction market functionality on Mode Network
 */
export const sentientPlugin: Plugin = {
    name: "sentient",
    description: "Prediction market plugin for Mode Network",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [createMarketAction, getMarketsAction, buyPositionAction],
};

export default sentientPlugin;
