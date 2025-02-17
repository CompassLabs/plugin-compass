import { z } from 'zod';
import { schemas } from '@compass-labs/sdk';

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
    responseSchemaDescriptions: Record<string, string>
) => {
    return `
Given the model of the onchain read data in the JSON format: ${JSON.stringify(modelResponse)} and detailed explanation of the this data fields: ${JSON.stringify(responseSchemaDescriptions)}.

You need to return human readable response based on the json format. Explaining the response in a human readable format. Make this concise.

NOTES: 
    - this is not transaction data, this is data obtained from the blockchain.
    - try to explain the data in a way that a user can understand.
    - avoid using markdown in the answer.
`;
};


export const errorTemplate = (error: string) => {
    return `
Given the API error: ${error}.

You need to return the error message in a human readable format. Make it concise.
`;
}


export const missingFieldsTemplate = (missingFields: string[], requestSchemaDescriptions: Record<string, string>) => {
return `
Your objective here is to gather information from the user to later perform an action against the compass api.

Given the missing fields of the request: ${missingFields.join(', ')}, come up with a user friendly question based on the missing fields descriptions: ${JSON.stringify(requestSchemaDescriptions)}.

Make this question concise and clear.
`
}
