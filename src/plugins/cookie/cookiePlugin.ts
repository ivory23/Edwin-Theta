import { EdwinPlugin } from '../../core/classes/edwinPlugin';
import { CookieSwarmClient } from './cookieClient';
import { Chain } from '../../core/types';

export class CookiePlugin extends EdwinPlugin {
    constructor(apiKey: string) {
        super('cookie', [new CookieSwarmClient(apiKey)]);
    }

    supportsChain = (_: Chain) => true;
}

export const cookie = (apiKey: string) => new CookiePlugin(apiKey);
