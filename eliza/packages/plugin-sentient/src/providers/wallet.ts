import {
    createWalletClient,
    http,
    createPublicClient,
    type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { modeTestnet } from "viem/chains";

export const chain = modeTestnet;

export function getWalletClient(
    getSetting: (key: string) => string | undefined
): WalletClient | null {
    console.log("🔑 Initializing wallet client...");

    const privateKey = getSetting("EVM_PRIVATE_KEY");
    if (!privateKey) {
        console.error("❌ No private key found");
        return null;
    }

    const provider = getSetting("EVM_PROVIDER_URL");
    if (!provider) {
        console.error("❌ No provider URL found");
        throw new Error("EVM_PROVIDER_URL not configured");
    }

    try {
        return createWalletClient({
            account: privateKeyToAccount(privateKey as `0x${string}`),
            chain: chain,
            transport: http(provider),
        });
    } catch (error) {
        console.error("❌ Error creating wallet client:", error);
        return null;
    }
}

export function getWalletProvider(walletClient: WalletClient) {
    return {
        name: "wallet",
        async get(_runtime: any, _message: any, _state: any) {
            try {
                const address = walletClient.account.address;
                const publicClient = createPublicClient({
                    chain: chain,
                    transport: http(),
                });

                return {
                    walletClient,
                    publicClient,
                    account: { address },
                    chain,
                };
            } catch (error) {
                console.error("❌ Error in wallet provider get():", error);
                throw error;
            }
        },
    };
}
