
import { z } from 'zod';
import { argumentTemplate, readEndpointResponseTemplate, errorTemplate, missingFieldsTemplate } from './templates';
import {
    IAgentRuntime,
    State,
    generateObject,
    ModelClass,
    composeContext,
    generateText,
} from '@elizaos/core';


// ******* ENDPOINT CALL ARGUMENT RESPONSE ********

function composeEndpointArgumentContext(
    schema: z.ZodObject<any, any>,
    currentState: State,
    accountAddress: string,
): string {
    return composeContext({
        state: currentState,
        template: argumentTemplate(schema, accountAddress),
    });
}

async function generateArgument(
    runtime: IAgentRuntime,
    context: string,
    schema: z.ZodObject<any, any>
): Promise<unknown> {
    const { object } = await generateObject({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
        schema: schema as any,
    });

    return object;
}


// ******* READ ENDPOINT RESPONSE RESPONSE ********

function composeReadEndpointResponseContext(
    modelResponse: object,
    currentState: State,
    responseSchemaDescriptions: Record<string, string>
) {
    return composeContext({
        state: currentState,
        template: readEndpointResponseTemplate(modelResponse, responseSchemaDescriptions),
    });
}

async function generateReadEndpointResponse(
    runtime: IAgentRuntime,
    context: string,
): Promise<string> {
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    return response;
}


// ******* ERROR RESPONSE ********


function composeErrorContext(
    error: string,
    currentState: State
) {
    return composeContext({
        state: currentState,
        template: errorTemplate(error),
    });
}


async function generateErrorResponse(
    runtime: IAgentRuntime,
    context: string
): Promise<string> {
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    return response;
}


// ********** MISSING FIELDS RESPONSE **********

function composeMissingFieldsContext(
    missingFields: Array<string>,
    currentState: State,
    requestSchemaDescriptions: Record<string, string>
) {
    return composeContext({
        state: currentState,
        template: missingFieldsTemplate(missingFields, requestSchemaDescriptions),
    });
}

async function generateMissingFieldsResponse(
    runtime: IAgentRuntime,
    context: string
) {
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });
    return response
}

export {
    composeEndpointArgumentContext,
    generateArgument,
    composeReadEndpointResponseContext,
    generateReadEndpointResponse,
    composeErrorContext,
    generateErrorResponse,
    composeMissingFieldsContext,
    generateMissingFieldsResponse
};