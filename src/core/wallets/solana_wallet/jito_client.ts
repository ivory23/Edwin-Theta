import axios, { AxiosInstance } from 'axios';
import edwinLogger from '../../../utils/logger';

interface JsonRpcRequest {
    jsonrpc: string;
    id: number;
    method: string;
    params: any[];
}

export class JitoJsonRpcClient {
    private baseUrl: string;
    private uuid?: string;
    private client: AxiosInstance;

    constructor(baseUrl: string, uuid?: string) {
        this.baseUrl = baseUrl;
        this.uuid = uuid;
        this.client = axios.create({
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async sendRequest(endpoint: string, method: string, params?: any[]): Promise<any> {
        const url = `${this.baseUrl}${endpoint}`;

        const data: JsonRpcRequest = {
            jsonrpc: '2.0',
            id: 1,
            method,
            params: params || [],
        };

        try {
            const response = await this.client.post(url, data);
            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                edwinLogger.error(`HTTP error: ${error.message}`);
                throw error;
            } else {
                edwinLogger.error(`Unexpected error: ${error}`);
                throw new Error('An unexpected error occurred');
            }
        }
    }

    async getTipAccounts(): Promise<any> {
        const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
        return this.sendRequest(endpoint, 'getTipAccounts');
    }

    async getRandomTipAccount(): Promise<any> {
        const tipAccountsResponse = await this.getTipAccounts();
        if (
            tipAccountsResponse.result &&
            Array.isArray(tipAccountsResponse.result) &&
            tipAccountsResponse.result.length > 0
        ) {
            const randomIndex = Math.floor(Math.random() * tipAccountsResponse.result.length);
            return tipAccountsResponse.result[randomIndex];
        } else {
            throw new Error('No tip accounts available');
        }
    }

    async sendBundle(params: any[]): Promise<any> {
        const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
        return this.sendRequest(endpoint, 'sendBundle', params);
    }

    async sendTxn(params: any[], bundleOnly: boolean = false): Promise<any> {
        let endpoint = '/transactions';
        const queryParams: string[] = [];

        if (bundleOnly) {
            queryParams.push('bundleOnly=true');
        }

        if (this.uuid) {
            queryParams.push(`uuid=${this.uuid}`);
        }

        if (queryParams.length > 0) {
            endpoint += `?${queryParams.join('&')}`;
        }

        return this.sendRequest(endpoint, 'sendTransaction', params);
    }

    async getInFlightBundleStatuses(params: any[]): Promise<any> {
        const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
        return this.sendRequest(endpoint, 'getInflightBundleStatuses', params);
    }

    async getBundleStatuses(params: any[]): Promise<any> {
        const endpoint = this.uuid ? `/bundles?uuid=${this.uuid}` : '/bundles';
        return this.sendRequest(endpoint, 'getBundleStatuses', params);
    }

    async confirmInflightBundle(bundleId: string | number, timeoutMs: number = 60000): Promise<any> {
        const start = Date.now();

        while (Date.now() - start < timeoutMs) {
            try {
                const response = await this.getInFlightBundleStatuses([[bundleId]]);

                if (
                    response.result &&
                    response.result.value &&
                    Array.isArray(response.result.value) &&
                    response.result.value.length > 0
                ) {
                    const bundleStatus = response.result.value[0];

                    edwinLogger.info(`Bundle status: ${bundleStatus.status}, Landed slot: ${bundleStatus.landed_slot}`);

                    if (bundleStatus.status === 'Failed') {
                        return bundleStatus;
                    } else if (bundleStatus.status === 'Landed') {
                        // If the bundle has landed, get more detailed status
                        const detailedStatus = await this.getBundleStatuses([[bundleId]]);
                        if (
                            detailedStatus.result &&
                            detailedStatus.result.value &&
                            Array.isArray(detailedStatus.result.value) &&
                            detailedStatus.result.value.length > 0
                        ) {
                            return detailedStatus.result.value[0];
                        } else {
                            return bundleStatus;
                        }
                    }
                } else {
                    edwinLogger.info('No status returned for the bundle. It may be invalid or very old.');
                }
            } catch (error) {
                edwinLogger.error('Error checking bundle status:', error);
            }

            // Wait for a short time before checking again
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // If we've reached this point, the bundle hasn't reached a final state within the timeout
        edwinLogger.info(`Bundle ${bundleId} has not reached a final state within ${timeoutMs}ms`);
        return { status: 'Timeout' };
    }
}
