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

