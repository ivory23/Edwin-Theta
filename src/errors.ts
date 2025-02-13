export class InsufficientBalanceError extends Error {
    constructor(
        public readonly required: number,
        public readonly available: number,
        public readonly symbol: string
    ) {
        super(`Insufficient ${symbol} balance. Required: ${required}, Available: ${available}`);
        this.name = 'InsufficientBalanceError';
    }
}

export class MeteoraStatisticalBugError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MeteoraStatisticalBugError';
    }
}
