export interface TokenBuyTransactionQueueMessageInterface {
    payload: any;
    tokenMint: string;
    buyAmountInSOL: number;
    expectedPNLinPercentage: number;
    marketCap: number;
    slippage: number;
}



