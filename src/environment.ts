import { type IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const compassEnvSchema = z.object({
    COMPASS_WALLET_PRIVATE_KEY: z
        .string()
        .min(1, "Compass plugin requires wallet private key"),
    COMPASS_ARBITRUM_RPC_URL: z
        .string()
        .min(1, "Compass plugin requires Arbitrum RPC URL"),
    COMPASS_ETHEREUM_RPC_URL: z
        .string()
        .min(1, "Compass plugin requires Ethereum RPC URL"),
    COMPASS_BASE_RPC_URL: z
        .string()
        .min(1, "Compass plugin requires Base RPC URL"),
});

export type compassConfig = z.infer<typeof compassEnvSchema>;

export async function validateCompassConfig(
    runtime: IAgentRuntime
): Promise<compassConfig> {
    try {
        const config = {
            COMPASS_WALLET_PRIVATE_KEY:
                runtime.getSetting("COMPASS_WALLET_PRIVATE_KEY") ||
                process.env.COMPASS_WALLET_PRIVATE_KEY,
            COMPASS_ARBITRUM_RPC_URL:
                runtime.getSetting("COMPASS_ARBITRUM_RPC_URL") ||
                process.env.COMPASS_ARBITRUM_RPC_URL,
            COMPASS_ETHEREUM_RPC_URL:
                runtime.getSetting("COMPASS_ETHEREUM_RPC_URL") ||
                process.env.COMPASS_ETHEREUM_RPC_URL,
            COMPASS_BASE_RPC_URL:
                runtime.getSetting("COMPASS_BASE_RPC_URL") ||
                process.env.COMPASS_BASE_RPC_URL,
        };
        return compassEnvSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(errorMessages);
        }
        throw error;
    }
}