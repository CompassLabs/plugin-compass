import { z } from 'zod';
import { schemas } from 'compass-api-tools';

export const argumentTemplate = (schema: z.ZodObject<any, any>, accountAddress: string) => {
    return `
For the context, use {{recentMessages}} to reuse some of the information that a user has provided before.

You are helping users perform actions against the compass api. 

Extract the necessary information from the user to make the request based on ${schema.shape} schema shape.

Return the result in JSON format.

Example:
   "AaveGetAssetPrice" schema shape is as follows:
        ${schemas.AaveGetAssetPrice.shape}

    For the question like: "What is the price of ARB?", your response should be:
        {
            chain: null,
            asset: "ARB"
        }

    For the question like: "What is the price of ARB on arbitrum?", your response should be:
        {
            chain: "arbitrum:mainnet",
            asset: "ARB"
        }

Notes:
 - Use ${accountAddress} as the account address. Some of the fields that require it are "account", "user", "onBehalfOf".
 - Never ever in any case try to fill the information that has not been provided by the user in previous messages. 
   Instead, set it to be null.
`;
};

export const readEndpointResponseTemplate = (
    schema: z.ZodObject<any, any>,
    modelResponse: object,
    endpointResponseDescription: string
) => {
    return `
Given the response from the model in the JSON format: ${JSON.stringify(modelResponse)}. The given schema for such response is: ${JSON.stringify(schema.shape)}. 

And the description of the response is: ${endpointResponseDescription}.

You need to return human readable response based on the schema shape. Explaining the response in a human readable format.
`;
};
