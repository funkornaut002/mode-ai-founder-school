// import { IAgentRuntime } from "@elizaos/core";
// import { createWalletClient, http, type WalletClient } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { chain } from "../providers/wallet";
// import { useGetAccount } from "./useGetAccount";
// import { WalletClientBase } from "@goat-sdk/core";

// // Re-export with explicit typing
// export { useGetAccount };

// // Explicitly type the wallet client function
// export const useGetWalletClient = async (
//     runtime: IAgentRuntime
// ): Promise<WalletClient> => {
//     const privateKey = runtime.getSetting("EVM_PRIVATE_KEY") as `0x${string}`;
//     if (!privateKey) {
//         throw new Error("EVM_PRIVATE_KEY is missing");
//     }

//     const account = privateKeyToAccount(privateKey);
//     const walletClient = createWalletClient({
//         account,
//         chain,
//         transport: http(chain.rpcUrls.default.http[0]),
//     });

//     return walletClient;
// };

// // Add GOAT wallet integration
// export const useGetGoatWallet = async (
//     runtime: IAgentRuntime
// ): Promise<WalletClientBase> => {
//     const privateKey = runtime.getSetting("EVM_PRIVATE_KEY") as `0x${string}`;
//     if (!privateKey) {
//         throw new Error("EVM_PRIVATE_KEY is missing");
//     }

//     const account = privateKeyToAccount(privateKey);
//     const walletClient = createWalletClient({
//         account,
//         chain,
//         transport: http(chain.rpcUrls.default.http[0]),
//     });

//     return {
//         address: account.address,
//         chain: {
//             id: chain.id,
//             name: chain.name,
//             network: chain.network,
//             nativeCurrency: chain.nativeCurrency,
//         },
//         sendTransaction: walletClient.sendTransaction,
//         signMessage: walletClient.signMessage,
//         signTypedData: walletClient.signTypedData,
//     };
// };
