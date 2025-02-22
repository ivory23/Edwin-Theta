import { tool } from '@langchain/core/tools';
import type { Edwin } from '../../client/index';
import type { EdwinTool } from '../../core/types';

export type GetEdwinToolsParams = {
    edwin: Edwin;
};

function createToolFromEdwinTool(edwinTool: EdwinTool) {
    return tool(
        async (args: unknown) => {
            try {
                const result = await edwinTool.execute(args);
                return JSON.stringify(result);
            } catch (error) {
                if (error instanceof Error) {
                    throw new Error(`${edwinTool.name} failed: ${error.message}`);
                }
                throw error;
            }
        },
        {
            name: edwinTool.name.toLowerCase(),
            description: edwinTool.description,
            schema: edwinTool.schema,
        }
    );
}

/**
 * Converts Edwin actions to Langchain tools
 */
export async function getEdwinTools({ edwin }: GetEdwinToolsParams) {
    const tools = await edwin.getTools();
    return tools.map(createToolFromEdwinTool);
}
