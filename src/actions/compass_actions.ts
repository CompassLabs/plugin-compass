import { createApiClient } from '@compass-labs/sdk';
import {
    Action,
    ActionExample,
    IAgentRuntime,
    Memory,
    State,
    HandlerCallback,
    Handler,
    Validator
} from '@elizaos/core';
import { z } from 'zod';
import {
    checkContent,
    getMissingFields,
    Endpoint,
    getNullableSchema,
    getZodDescriptions
} from '../utils/schema';
import {
    composeEndpointArgumentContext,
    generateArgument,
    composeReadEndpointResponseContext,
    generateReadEndpointResponse,
    composeErrorContext,
    generateErrorResponse,
    composeMissingFieldsContext,
    generateMissingFieldsResponse
} from '../utils/context';
import {getAccount, getWalletClient} from './wallet';
import { PrivateKeyAccount } from 'viem/accounts';
import { WalletClient, PublicClient } from 'viem';
import {validateCompassConfig} from '../environment';

type CompassApiResponse = {
    success: true;
    data: object;
} | {
    success: false;
    data: { message: string };
};

function getApiClient() {
    return createApiClient('https://api.compasslabs.ai');
}

async function runCompassAction(endpoint: Endpoint, argument: unknown): Promise<CompassApiResponse> {
    let data: object;
    let success: boolean;
    let output: CompassApiResponse;
    try {
        const apiClient = getApiClient();
        const response = await apiClient[endpoint.method](endpoint.path, argument);
        data = response;
        success = true;
        output = { success, data };
    } catch (error) {
        if (error.status) {
            data = { message: error.response.data };
        } else {
            data = { message: "Likely invalid request schema" };
        }
        success = false;
        output = { success, data } as CompassApiResponse;
    }
    return output;
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
        await validateCompassConfig(runtime);
        return true;
    };

    handler: Handler = async (
        runtime: IAgentRuntime,
        _message: Memory,
        state?: State,
        _options?: Record<string, unknown>,
        callback?: HandlerCallback
    ) => {
        const path: string = this.endpoint.path;
        const requestSchema = this.endpoint.parameters[0].schema;
        const nullableRequestSchema = getNullableSchema(requestSchema) as z.ZodObject<any, any>;
        const accountAddress = this.account.address
        const responseSchema = this.endpoint.response

        const requestSchemaDescriptions = getZodDescriptions(requestSchema);
        const responseSchemaDescriptions = getZodDescriptions(responseSchema);
        
        const argumentContext = composeEndpointArgumentContext(requestSchema, state, accountAddress);
        const endpointCallArgument = await generateArgument(
            runtime,
            argumentContext,
            nullableRequestSchema
        );

        console.log(`Running endpoint ${path} with argument ${JSON.stringify(endpointCallArgument)}`);

        if (!checkContent(endpointCallArgument, requestSchema)) {
            const missingFields = getMissingFields(endpointCallArgument, requestSchema);
            const missingFieldsContext = composeMissingFieldsContext(missingFields, state, requestSchemaDescriptions);
            const missingFieldsResponse = await generateMissingFieldsResponse(runtime, missingFieldsContext);
            callback({
                text: `${missingFieldsResponse}`,
            });
            return;
        }
        const compassApiResponse = await runCompassAction(this.endpoint, endpointCallArgument);
        if (compassApiResponse.success) {
            return await this.processSuccessfulApiResponse(path, compassApiResponse.data, state, runtime, endpointCallArgument, callback, responseSchemaDescriptions);
        } else {
            const errorContext = composeErrorContext((JSON.stringify((compassApiResponse.data as { message: string }).message)), state)
            const errorResponse = await generateErrorResponse(runtime, errorContext);
            callback({text: `❌ Compass API Error: ${errorResponse}`});
        }
    };

    processSuccessfulApiResponse = async function (path: string, compassApiResponse: object, state: State, runtime: IAgentRuntime, endpointCallArgument: unknown, callback: HandlerCallback, responseSchemaDescriptions: Record<any, any>): Promise<boolean> {
        if (path.includes('/get')) {
            const readEndpointContext = composeReadEndpointResponseContext(
                compassApiResponse,
                state,
                responseSchemaDescriptions
            );
            const readEndpointResponse = await generateReadEndpointResponse(
                runtime,
                readEndpointContext,
            );
            callback({
                text: `${readEndpointResponse}`,
            });
            return;
        } else {
            const chain = (endpointCallArgument as { chain: string }).chain;
            const walletClient = getWalletClient(this.account, chain) as WalletClient & PublicClient;
            const txHash = await walletClient.sendTransaction(compassApiResponse as any);
            const txReceipt = await walletClient.waitForTransactionReceipt({hash: txHash});
            const defaultBlockExplorerUrl = walletClient.chain.blockExplorers.default.url;

            const txHashUrl = `${defaultBlockExplorerUrl}/tx/${txHash}`

            if (txReceipt.status === "success") {
                callback({
                    text: `✅ Transaction executed successfully! Transaction hash: ${txHashUrl}`,
                    content: { hash: txHash, status: "success" },
                });
                return true;
            } else {
                callback({
                    text: `❌ Transaction failed! Transaction hash: ${txHashUrl}`,
                    content: { hash: txHash, status: "failed" },
                });
                return false;
            }
        }
    }
}


export function initializeCompassActions(): Array<Action> {
    const apiClient = getApiClient();
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

