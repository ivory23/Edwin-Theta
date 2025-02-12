import { Connection, Transaction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import DLMM from '@meteora-ag/dlmm';
import edwinLogger from '../../utils/logger';
import { EdwinSolanaWallet } from '../../edwin-core/wallets/solana_wallet/solana_wallet';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

interface ParsedInstruction {
    parsed?: {
        type: string;
        info: {
            amount: string;
            authority: string;
            destination: string;
            mint: string;
            source: string;
            tokenAmount: {
                amount: string;
                decimals: number;
                uiAmount: number;
                uiAmountString: string;
            };
        };
    };
}

interface InnerInstruction {
    index: number;
    instructions: ParsedInstruction[];
}

interface TokenAmount {
    amount: string;
    decimals: number;
    uiAmount: number;
    uiAmountString: string;
}

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

export async function calculateAmounts(
    amount: string,
    amountB: string,
    activeBinPricePerToken: string,
    dlmmPool: DLMM
): Promise<[BN, BN]> {
    let totalXAmount;
    let totalYAmount;

    if (amount === 'auto' && amountB === 'auto') {
        throw new TypeError(
            "Amount for both first asset and second asset cannot be 'auto' for Meteora liquidity provision"
        );
    } else if (!amount || !amountB) {
        throw new TypeError('Both amounts must be specified for Meteora liquidity provision');
    }

    if (amount === 'auto') {
        // Calculate amount based on amountB
        if (!isNaN(Number(amountB))) {
            totalXAmount = new BN((Number(amountB) / Number(activeBinPricePerToken)) * 10 ** dlmmPool.tokenX.decimal);
            totalYAmount = new BN(Number(amountB) * 10 ** dlmmPool.tokenY.decimal);
        } else {
            throw new TypeError('Invalid amountB value for second token for Meteora liquidity provision');
        }
    } else if (amountB === 'auto') {
        // Calculate amountB based on amount
        if (!isNaN(Number(amount))) {
            totalXAmount = new BN(Number(amount) * 10 ** dlmmPool.tokenX.decimal);
            totalYAmount = new BN(Number(amount) * Number(activeBinPricePerToken) * 10 ** dlmmPool.tokenY.decimal);
        } else {
            throw new TypeError('Invalid amount value for first token for Meteora liquidity provision');
        }
    } else if (!isNaN(Number(amount)) && !isNaN(Number(amountB))) {
        // Both are numbers
        totalXAmount = new BN(Number(amount) * 10 ** dlmmPool.tokenX.decimal);
        totalYAmount = new BN(Number(amountB) * 10 ** dlmmPool.tokenY.decimal);
    } else {
        throw new TypeError("Both amounts must be numbers or 'auto' for Meteora liquidity provision");
    }
    return [totalXAmount, totalYAmount];
}

export async function extractBalanceChanges(
    connection: Connection,
    signature: string,
    tokenXAddress: string,
    tokenYAddress: string
): Promise<{ liquidityRemoved: [number, number]; feesClaimed: [number, number] }> {
    const METEORA_DLMM_PROGRAM_ID = 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo';

    // Fetch the parsed transaction details.
    const txInfo = await connection.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 });

    if (!txInfo || !txInfo.meta) {
        throw new Error('Transaction details not found or not parsed');
    }

    const outerInstructions = txInfo.transaction.message.instructions;
    const innerInstructions = txInfo.meta.innerInstructions || [];

    const innerMap: Record<number, any[]> = {};
    for (const inner of innerInstructions) {
        innerMap[inner.index] = inner.instructions;
    }

    const meteoraInstructionIndices: number[] = [];
    outerInstructions.forEach((ix: any, index: number) => {
        if (ix.programId == METEORA_DLMM_PROGRAM_ID) {
            meteoraInstructionIndices.push(index);
        }
    });

    if (meteoraInstructionIndices.length < 2) {
        throw new Error('Expected at least two Meteora instructions in the transaction');
    }

    const removeLiquidityIndex = meteoraInstructionIndices[0];
    const claimFeeIndex = meteoraInstructionIndices[1];

    const decodeTokenTransfers = (instructions: any[]): any[] => {
        const transfers = [];
        for (const ix of instructions) {
            if (ix.program === 'spl-token' && ix.parsed && ix.parsed.type === 'transferChecked') {
                transfers.push(ix.parsed.info);
            }
        }
        return transfers;
    };

    const removeLiquidityTransfers = innerMap[removeLiquidityIndex]
        ? decodeTokenTransfers(innerMap[removeLiquidityIndex])
        : [];
    const claimFeeTransfers = innerMap[claimFeeIndex] ? decodeTokenTransfers(innerMap[claimFeeIndex]) : [];

    const liquidityRemovedA =
        removeLiquidityTransfers.find(transfer => transfer.mint == tokenXAddress)?.tokenAmount.uiAmount || 0;
    const liquidityRemovedB =
        removeLiquidityTransfers.find(transfer => transfer.mint == tokenYAddress)?.tokenAmount.uiAmount || 0;

    const feesClaimedA = claimFeeTransfers.find(transfer => transfer.mint == tokenXAddress)?.tokenAmount.uiAmount || 0;
    const feesClaimedB = claimFeeTransfers.find(transfer => transfer.mint == tokenYAddress)?.tokenAmount.uiAmount || 0;

    return {
        liquidityRemoved: [liquidityRemovedA, liquidityRemovedB],
        feesClaimed: [feesClaimedA, feesClaimedB],
    };
}

export async function simulateAddLiquidityTransaction(
    connection: Connection,
    tx: Transaction,
    wallet: EdwinSolanaWallet
): Promise<TokenAmount[]> {
    // Convert to versioned transaction
    const latestBlockhash = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
        payerKey: wallet.getPublicKey(),
        recentBlockhash: latestBlockhash.blockhash,
        instructions: tx.instructions,
    }).compileToV0Message();
    const versionedTx = new VersionedTransaction(messageV0);

    // Assume `connection` is a Connection and `transaction` is your built Transaction.
    const simulationResult = await connection.simulateTransaction(versionedTx, { innerInstructions: true });
    edwinLogger.debug('Simulation result: ', JSON.stringify(simulationResult, null, 2));

    let tokenAmounts: TokenAmount[] = [];
    if (simulationResult.value.innerInstructions) {
        const innerInstructions = simulationResult.value.innerInstructions as InnerInstruction[];

        for (const innerInstruction of innerInstructions) {
            if (innerInstruction.instructions) {
                for (const instruction of innerInstruction.instructions) {
                    if (instruction.parsed && instruction.parsed.type === 'transferChecked') {
                        edwinLogger.debug('Transfer info:', instruction.parsed.info);
                        edwinLogger.debug('Transfer info amounts:', instruction.parsed.info.tokenAmount);
                        tokenAmounts.push(instruction.parsed.info.tokenAmount);
                    }
                }
            }
        }
    }
    edwinLogger.info('Token amounts:', tokenAmounts);

    return tokenAmounts;
}
