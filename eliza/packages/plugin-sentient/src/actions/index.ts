// import { getSentientActions } from "./goatActions";
// import { useGetGoatWallet } from "../hooks";
// import { IAgentRuntime } from "@elizaos/core";

// export { createMarketAction } from "./createMarket";
// export { getMarketsAction } from "./getMarketsAction";

// // Export action names as constants
// export const ACTION_NAMES = {
//     GET_MARKETS: "GET_MARKETS",
//     CREATE_MARKET: "CREATE_MARKET",
// } as const;

// // Export the action initializer
// export async function initializeActions(runtime: IAgentRuntime) {
//     const wallet = await useGetGoatWallet(runtime);
//     return getSentientActions(wallet);
// }

export * from "./getMarketsAction";
export * from "./createMarket";
export * from "./buyPosition";
