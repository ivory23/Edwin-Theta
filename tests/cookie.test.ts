import { describe, it, expect, beforeEach } from 'vitest';
import { Edwin } from '../src/edwin-client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.COOKIE_API_KEY;
if (!API_KEY) {
    throw new Error('COOKIE_API_KEY environment variable is required');
}

describe('CookieSwarm Integration', () => {
    let edwin: Edwin;

    beforeEach(() => {
        // Initialize Edwin with cookie actions and API key
        edwin = new Edwin({
            actions: ['getAgentByTwitter', 'getAgentByContract', 'getAgentsPaged', 'searchTweets'],
        });
    });

    describe('GetAgentByTwitterAction', () => {
        it('should fetch agent data by Twitter username', async () => {
            const result = await edwin.actions.getAgentByTwitter.execute({
                twitterUsername: 'cookiedotfun',
                interval: '_3Days',
            });

            const parsed = JSON.parse(result);
            expect(parsed.ok.agentName).toBeDefined();
            expect(parsed.ok.twitterUsernames).toContain('cookiedotfun');
        });

        it('should throw error for invalid interval', async () => {
            await expect(
                edwin.actions.getAgentByTwitter.execute({
                    twitterUsername: 'cookiedotfun',
                    interval: 'invalid',
                })
            ).rejects.toThrow();
        });
    });

    describe('GetAgentByContractAction', () => {
        it('should fetch agent data by contract address', async () => {
            const result = await edwin.actions.getAgentByContract.execute({
                contractAddress: '0xc0041ef357b183448b235a8ea73ce4e4ec8c265f',
                interval: '_7Days',
            });

            const parsed = JSON.parse(result);
            expect(parsed.ok.agentName).toBeDefined();
            expect(parsed.ok.contracts).toContainEqual(
                expect.objectContaining({
                    contractAddress: '0xc0041ef357b183448b235a8ea73ce4e4ec8c265f',
                })
            );
        });
    });

    describe('GetAgentsPagedAction', () => {
        it('should fetch paged agent data', async () => {
            const result = await edwin.actions.getAgentsPaged.execute({
                interval: '_3Days',
                page: 1,
                pageSize: 20,
            });

            const parsed = JSON.parse(result);
            expect(parsed.ok.data).toBeDefined();
            expect(parsed.ok.data.length).toBeLessThanOrEqual(20);
            expect(parsed.ok.currentPage).toBe(1);
        });

        it('should throw error for invalid page size', async () => {
            await expect(
                edwin.actions.getAgentsPaged.execute({
                    interval: '_3Days',
                    page: 1,
                    pageSize: 30, // > 25
                })
            ).rejects.toThrow();
        });
    });

    describe('SearchTweetsAction', () => {
        it('should search tweets with date range', async () => {
            const today = new Date();
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            const result = await edwin.actions.searchTweets.execute({
                searchQuery: 'cookie token utility',
                from: lastWeek.toISOString().split('T')[0],
                to: today.toISOString().split('T')[0],
            });

            const parsed = JSON.parse(result);
            expect(parsed.ok).toBeDefined();
            expect(Array.isArray(parsed.ok)).toBe(true);
        });
    });
});
