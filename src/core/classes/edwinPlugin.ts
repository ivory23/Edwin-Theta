import { EdwinTool } from '../types';
import { EdwinService } from './edwinToolProvider';

export abstract class EdwinPlugin {
    protected tools: EdwinTool[];

    constructor(
        protected name: string,
        private toolProviders: EdwinService[]
    ) {
        this.tools = [];
    }

    getTools(): EdwinTool[] {
        return [];
    }
}
