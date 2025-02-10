export abstract class EdwinWallet {
    abstract getAddress(): string;

    abstract getBalance(): Promise<number>;

    abstract getConnection(customRpcUrl?: string): any;
}
