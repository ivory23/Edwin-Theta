import { ZodTypeDef, ZodSchema } from 'zod';

export interface EdwinTool {
    name: string;
    description: string;
    schema: ZodSchema<any, ZodTypeDef, any>;
    execute: (params: any) => Promise<any>;
}
