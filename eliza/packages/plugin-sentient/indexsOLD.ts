// import { type Plugin } from "@elizaos/core";
// import { getOnChainActions } from "./src/actions/predictionMarket";
// import { getWalletClient, getWalletProvider } from "./wallet";

// const createPredictionMarketPlugin = async (
//     getSetting: (key: string) => string | undefined
// ): Promise<Plugin> => {
//     const walletClient = getWalletClient(getSetting);
//     if (!walletClient) {
//         throw new Error("Failed to initialize wallet client");
//     }

//     const actions = await getOnChainActions(walletClient);

//     return {
//         name: "Mode Prediction Markets",
//         description:
//             "Create and trade in AI-powered prediction markets on Mode Network",
//         providers: [getWalletProvider(walletClient)],
//         evaluators: [],
//         services: [],
//         actions: actions,
//     };
// };

// export default createPredictionMarketPlugin;
