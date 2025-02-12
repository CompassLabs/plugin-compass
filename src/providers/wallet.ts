import { arbitrum, base, mainnet } from 'viem/chains';
import { privateKeyToAccount, PrivateKeyAccount } from 'viem/accounts';
import { WalletClient, PublicClient, createWalletClient, publicActions, http, Hex } from 'viem';

export const CHAIN_CONFIG = {
    'ethereum:mainnet': {
        chain: mainnet,
        rpcUrl: process.env.COMPASS_ETH_RPC_URL,
    },
    'arbitrum:mainnet': {
        chain: arbitrum,
        rpcUrl: process.env.COMPASS_ARBITRUM_RPC_URL,
    },
    'base:mainnet': {
        chain: base,
        rpcUrl: process.env.COMPASS_BASE_RPC_URL,
    },
} as const;

export const getAccount = (): PrivateKeyAccount => {
    const rawPrivateKey = process.env.COMPASS_WALLET_PRIVATE_KEY;
    if (!rawPrivateKey) {
        throw new Error('COMPASS_WALLET_PRIVATE_KEY is not set');
    }
    if (!/^(0x)?[0-9a-fA-F]{64}$/.test(rawPrivateKey)) {
        throw new Error("Invalid COMPASS_WALLET_PRIVATE_KEY format");
    }
    const privateKey = rawPrivateKey.startsWith('0x')
        ? (rawPrivateKey as `0x${string}`)
        : (`0x${rawPrivateKey}` as `0x${string}`);
    const account = privateKeyToAccount(privateKey);
    return account;
};

export const getWalletClient = (account: PrivateKeyAccount, chain: string): WalletClient => {
    const chainConfig = CHAIN_CONFIG[chain];
    if (!chainConfig) {
        throw new Error(`Chain ${chain} is not supported`);
    }
    const { chain_, rpcUrl } = chainConfig;
    return createWalletClient({chain: chain_, transport: http(rpcUrl), account}).extend(publicActions);
}