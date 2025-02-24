export class MeteoraStatisticalBugError extends Error {
    constructor(message: string, public positionAddress: string) {
        super(message);
        this.name = 'MeteoraStatisticalBugError';
        this.positionAddress = positionAddress;
    }
}
