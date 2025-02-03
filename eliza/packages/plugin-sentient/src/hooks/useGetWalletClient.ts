import { IAgentRuntime } from "@elizaos/core";
import { WalletClient } from "viem";
import { initWalletProvider } from "../providers/wallet";

export const useGetWalletClient = async (
    runtime: IAgentRuntime
): Promise<WalletClient> => {
    const walletProvider = await initWalletProvider(runtime);
    return walletProvider.getWalletClient("modeTestnet");
};
