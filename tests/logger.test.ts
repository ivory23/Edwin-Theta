import { describe, it, expect, beforeEach } from 'vitest';
import { Edwin } from '../src/edwin-client';
import { edwinLogger } from '../src/utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('Logger Test', () => {
    describe('Logger', () => {
        it('should log message', async () => {
            edwinLogger.log('Hello, world!');
        });

        it('should log message', async () => {
            edwinLogger.log('Hello, world!', "I'm Edwin");
        });

        it('should log info message', async () => {
            edwinLogger.info('Hello, world!');
        });

        it('should log debug message', async () => {
            edwinLogger.debug('Hello, world!');
        });

        it('should log success message', async () => {
            edwinLogger.success('Hello, world!');
        });

        it('should log assert message', async () => {
            edwinLogger.assert('Hello, world!');
        });

        it('should log error message', async () => {
            edwinLogger.error('Hello, world!');
        });

        it('should log warning message', async () => {
            edwinLogger.warn('Hello, world!');
        });

        // it('should throw error for invalid interval', async () => {
        //     await expect(
        //         edwin.actions.getAgentByTwitter.execute({
        //             twitterUsername: 'cookiedotfun',
        //             interval: 'invalid',
        //         })
        //     ).rejects.toThrow();
        // });
    });
});
