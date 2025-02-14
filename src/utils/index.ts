import edwinLogger from './logger';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

/**
 * Safely stringifies JSON that may contain BigInt values
 * @param obj The object to stringify
 * @returns JSON string with BigInt values converted to strings
 */
export function safeJsonStringify(obj: any): string {
    return JSON.stringify(obj, (_, value) => {
        // Handle both BigInt and BigInt constructor values
        if (typeof value === 'bigint' || value?.constructor?.name === 'BigInt') {
            return value.toString();
        }
        return value;
    });
}

/**
 * Retries an operation with exponential backoff
 * @param operation The operation to retry
 * @param context A description of the operation
 * @returns The result of the operation
 */
async function withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            return await operation();
        } catch (error: unknown) {
            lastError = error as Error;
            const isTimeout =
                error instanceof Error &&
                (error.message.toLowerCase().includes('timeout') ||
                    error.message.toLowerCase().includes('connectionerror'));

            if (!isTimeout) {
                throw error;
            }

            if (attempt === MAX_RETRIES) {
                edwinLogger.error(`${context} failed after ${MAX_RETRIES} attempts:`, error);
                throw new Error(`${context} failed after ${MAX_RETRIES} retries: ${lastError.message}`);
            }

            const delay = INITIAL_DELAY * attempt;
            edwinLogger.warn(`${context} attempt ${attempt} failed, retrying in ${delay}ms:`, error);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    // lastError will always be defined here since we must have caught at least one error to reach this point
    throw lastError!;
}

export { withRetry };