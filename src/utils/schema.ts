import { z, ZodSchema, ZodObject, ZodOptional, ZodNullable } from 'zod';


function checkContent(object: any, schema: z.ZodObject<any, any>): boolean {
    return schema.safeParse(object).success;
}

function getMissingFields(
    object: any,
    schema: ZodObject<any, any>,
    path: string = ''
): Array<string> {
    const missingFields: string[] = [];

    for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        const fieldValue = object?.[key];
        const fullPath = path ? `${path}.${key}` : key;

        const isOptional = isZodOptional(fieldSchema) || isZodNullable(fieldSchema);

        if (!isOptional && (fieldValue === undefined || fieldValue === null)) {
            missingFields.push(fullPath);
        }

        if (isZodObject(fieldSchema) && typeof fieldValue === 'object' && fieldValue !== null) {
            missingFields.push(...getMissingFields(fieldValue, fieldSchema, fullPath));
        }
    }

    return missingFields;
}


type Endpoint = {
    method: string;
    path: string;
    requestFormat: string;
    parameters: any;
    response: z.ZodObject<any, any>;
    errors: Array<object>;
};

function isZodObject(obj: any): obj is z.ZodObject<any> {
    return obj && typeof obj.parse === 'function' && typeof obj.shape === 'object';
}

function isZodOptional(obj: any): obj is ZodOptional<any> {
    return obj && typeof obj.unwrap === 'function' && obj._def.typeName === 'ZodOptional';
}

function isZodNullable(obj: any): obj is ZodNullable<any> {
    return obj && typeof obj.unwrap === 'function' && obj._def.typeName === 'ZodNullable';
}

function getNullableSchema<T extends ZodSchema>(schema: T): ZodSchema {
    if (isZodObject(schema)) {
        const shape = schema.shape;
        const nullableShape = Object.fromEntries(
            Object.entries(shape).map(([key, value]: [string, ZodSchema]) => [
                key,
                getNullableSchema(value).nullable(),
            ])
        );

        return z.object(nullableShape) as unknown as T;
    }

    if (isZodOptional(schema) || isZodNullable(schema)) {
        return schema;
    }

    return schema.nullable() as unknown as T;
}


function getZodDescriptions<T extends ZodObject<any, any>>(schema: T): Record<string, string> {
    const descriptions: Record<string, string> = {};
    const shape = schema.shape;
    for (const key in shape) {
        if (isZodObject(shape[key])) {
            descriptions[key] = JSON.stringify(getZodDescriptions(shape[key] as ZodObject<any, any>));
        } else {
            descriptions[key] = shape[key].description;
        }
    }
    return descriptions;
}

export {
    checkContent,
    getMissingFields,
    Endpoint,
    getNullableSchema,
    getZodDescriptions
};
