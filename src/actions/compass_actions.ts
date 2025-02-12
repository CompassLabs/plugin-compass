import { createApiClient } from 'compass-api-tools';
import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    Handler,
    Validator,
    elizaLogger
} from '@elizaos/core';
import { z } from 'zod';
import {
    composeEndpointArgumentContext,
    checkContent,
    getMissingFields,
    generateArgument,
    composeReadEndpointResponseContext,
    generateReadEndpointResponse,
    Endpoint,
    getNullableSchema,
} from './utils';
import {getAccount, getWalletClient} from './wallet';
import { PrivateKeyAccount } from 'viem/accounts';
import { WalletClient, PublicClient } from 'viem';


async function runCompassAction(endpoint: Endpoint, argument: unknown) {
    try {
        const apiClient = createApiClient('https://api.compasslabs.ai');
        const response = await apiClient[endpoint.method](endpoint.path, argument);
        return response;
    } catch (error) {
        console.log(error);
    }
}

class CompassAction implements Action {
    similes: string[];
    description: string;
    examples: ActionExample[][];
    name: string;
    suppressInitialMessage?: boolean;
    endpoint: Endpoint;
    account: PrivateKeyAccount

    constructor({
        similes,
        description,
        examples,
        name,
        endpoint,
        account,
        suppressInitialMessage = false, // Default value
    }: {
        similes: string[];
        description: string;
        examples: ActionExample[][];
        name: string;
        endpoint: Endpoint;
        account: PrivateKeyAccount;
        suppressInitialMessage?: boolean;
    }) {
        this.similes = similes;
        this.description = description;
        this.examples = examples;
        this.name = name;
        this.suppressInitialMessage = suppressInitialMessage;
        this.endpoint = endpoint;
        this.account = account;
    }
    validate: Validator = async (runtime: IAgentRuntime) => {
        return true;
    };

    handler: Handler = async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        const path: string = this.endpoint.path;
        const requestSchema = this.endpoint.parameters[0].schema;
        const nullableRequestSchema = getNullableSchema(requestSchema) as z.ZodObject<any, any>;
        const responseSchema = this.endpoint.response;
        const accountAddress = this.account.address
        
        const argumentContext = composeEndpointArgumentContext(requestSchema, state, accountAddress);
        const endpointCallArgument = await generateArgument(
            runtime,
            argumentContext,
            nullableRequestSchema
        );

        console.log(`Running endpoint ${path} with argument ${JSON.stringify(endpointCallArgument)}`);

        if (!checkContent(endpointCallArgument, requestSchema)) {
            const missingFields = getMissingFields(endpointCallArgument, requestSchema);
            callback({
                text: `I will need more information to make the request, tell me more about these fields: ${missingFields}`,
            });
            return;
        }
        const compassApiResponse = await runCompassAction(this.endpoint, endpointCallArgument);
        console.log(`API output: ${JSON.stringify(compassApiResponse)}`)
        if (path.includes('/get')) {
            const readEndpointContext = composeReadEndpointResponseContext(
                responseSchema,
                compassApiResponse,
                state,
                this.endpoint
            );
            const readEndpointResponse = await generateReadEndpointResponse(
                runtime,
                readEndpointContext
            );
            callback({
                text: `Following is the response from compass api for ${this.name} action:
                ${readEndpointResponse}`,
            });
            return;
        } else {
            const chain = (endpointCallArgument as { chain: string }).chain;
            const walletClient = getWalletClient(this.account, chain) as WalletClient & PublicClient;
            const txHash = await walletClient.sendTransaction(compassApiResponse);
            const txReceipt = await walletClient.waitForTransactionReceipt({hash: txHash});

            if (txReceipt.status === "success") {
                callback({
                    text: `✅ Transaction executed successfully! Transaction hash: ${txHash}`,
                    content: { hash: txHash, status: "success" },
                });
                return true;
            } else {
                callback({
                    text: `❌ Transaction failed! Transaction hash: ${txHash}`,
                    content: { hash: txHash, status: "failed" },
                });
                return false;
            }
        }
    };
}


export function initializeCompassActions(): Array<Action> {
    const apiClient = createApiClient('https://api.compasslabs.ai');
    const endpoints = apiClient.api;

    const actions: Array<Action> = [];
    for (const endpoint of Object.values(endpoints)) {
        let action: any;

        const name = endpoint.path.split('/').slice(2).join('_');
        const nameUpperCase = name.toUpperCase();
        const similes = generateSimiles(nameUpperCase);
        const description =
            'description' in endpoint ? endpoint.description : 'No description available';
        const account = getAccount();
        action = new CompassAction({
            similes: similes,
            description: description,
            examples: [],
            name: name,
            endpoint: endpoint as Endpoint,
            account: account
        });
        actions.push(action);
    }
    return actions;
}

function generateSimiles(baseName: string): string[] {
    return [
        `EXECUTE_${baseName.toUpperCase()}`,
        `${baseName.toUpperCase()}_ACTION`,
        `PERFORM_${baseName.toUpperCase()}`,
    ];
}

