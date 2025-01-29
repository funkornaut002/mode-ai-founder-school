import type { Plugin } from "@elizaos/core";
import { predictionMarketsAction } from "./actions/predictionMarketsAction";
import { getWalletClient, getWalletProvider } from "./providers/wallet";

// Add debug function
function debugLog(section: string, data: any) {
    console.log(`\n=== ${section} ===`);
    console.log(JSON.stringify(data, null, 2));
    console.log("=".repeat(20), "\n");
}

const createSentientPlugin = async (
    getSetting: (key: string) => string | undefined
): Promise<Plugin> => {
    debugLog("PLUGIN INITIALIZATION START", {
        timestamp: new Date().toISOString(),
        phase: "start",
    });

    // Log settings
    const privateKey = getSetting("EVM_PRIVATE_KEY");
    const providerUrl = getSetting("EVM_PROVIDER_URL");
    const factoryAddress = getSetting("PREDICTION_MARKET_FACTORY");

    debugLog("ENVIRONMENT SETTINGS", {
        hasPrivateKey: !!privateKey,
        hasProviderUrl: !!providerUrl,
        hasFactoryAddress: !!factoryAddress,
        factoryAddress,
    });

    const walletClient = getWalletClient(getSetting);
    if (!walletClient) {
        debugLog("INITIALIZATION ERROR", {
            error: "Failed to initialize wallet client",
            phase: "wallet_client_creation",
        });
        throw new Error("Failed to initialize wallet client");
    }
    debugLog("WALLET CLIENT", {
        initialized: true,
        type: walletClient.constructor.name,
    });

    const walletProvider = getWalletProvider(walletClient);
    debugLog("WALLET PROVIDER", {
        initialized: true,
        name: walletProvider.name,
    });

    // Log action registration
    debugLog("ACTION REGISTRATION", {
        name: predictionMarketsAction.name,
        hasHandler: !!predictionMarketsAction.handler,
        hasValidate: !!predictionMarketsAction.validate,
        similes: predictionMarketsAction.similes,
        handlerType: typeof predictionMarketsAction.handler,
    });

    const plugin: Plugin = {
        name: "@elizaos/plugin-sentient",
        description:
            "Create and trade in AI-powered prediction markets on Mode Network",
        actions: [predictionMarketsAction],
        providers: [walletProvider],
        evaluators: [],
        services: [],
    };

    debugLog("PLUGIN CREATION COMPLETE", {
        name: plugin.name,
        actionCount: plugin.actions.length,
        providerCount: plugin.providers.length,
        timestamp: new Date().toISOString(),
    });

    return plugin;
};

export * from "./actions/predictionMarketsAction";
export * from "./providers/wallet";
export * from "./types";

export default createSentientPlugin;
