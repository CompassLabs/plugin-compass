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
    modelResponse: object,
) => {
    return `
Given the model of the onchain read data in the JSON format: ${JSON.stringify(modelResponse)}.

You need to return human readable response based on the json format. Explaining the response in a human readable format. Make this concise.

NOTES: 
    - this is not transaction data, this is data obtained from the blockchain.
    - try to explain the data in a way that a user can understand.
`;
};


export const errorTemplate = (error: string) => {
    return `
Given the API error: ${error}.

You need to return the error message in a human readable format. Make it concise.
`;
}