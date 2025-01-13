import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import rabbitMQService, { TokenQueueMessageInterface } from "../services/rabbitmq.service";
import { TokenBuyTransactionQueueMessageInterface } from "../types";
class MemecoinBuyer {
  private solanaConnection: Connection
  private BUY_AMOUNT = 0.01   //In solana
  private BUY_SLIPPAGE = 30     //Percentage


  constructor(solanaConnection: Connection) {
    this.solanaConnection = solanaConnection;
  }



  decideBuy = (token_details : string ) =>
  {
    var token_details_object: TokenQueueMessageInterface = JSON.parse(token_details)
    const tokenMint = token_details_object.tokenMint
    const marketCap = token_details_object.filters.marketCapFilter.data.marketCap
    

    const filters = token_details_object.filters
    
    // Sum up the scores
    const totalScore: any = Object.values(filters).reduce((sum, filter: any) => sum + filter.score, 0)

    if(totalScore > 15) // 30 for the three filters
    {
      //buy, and take profit at 2x
      //build transaction object
      
      const tokenBuyObject: TokenBuyTransactionQueueMessageInterface = {
        payload: token_details_object,
        tokenMint: tokenMint,
        buyAmountInSOL: this.BUY_AMOUNT,
        expectedPNLinPercentage: 100,
        marketCap: marketCap,
        slippage: this.BUY_SLIPPAGE
      }

    //Send this to the buy queue
    rabbitMQService.sendToQueue("BUY_TOKEN", JSON.stringify(tokenBuyObject))

    }
    else
    {
      //don't buy
    }

  }

  // Method to carry out a buy transaction
  async buyToken(
    tokenMintAddress: string,
    amountInSOL: number,
    slippage: number
  ): Promise<void> {
    try {
      const buyerKeypair = Keypair.generate(); // Replace with your wallet keypair
      const tokenMint = new PublicKey(tokenMintAddress);
      const buyerPublicKey = buyerKeypair.publicKey;

      // Simulate a transaction to buy memecoin
      console.log(`Buying memecoin from mint ${tokenMintAddress}...`);
      console.log(`Amount in SOL: ${amountInSOL}, Slippage: ${slippage * 100}%`);

      // Create the transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: buyerPublicKey,
          toPubkey: tokenMint, // Replace with the actual marketplace or recipient address
          lamports: amountInSOL * 1e9, // Convert SOL to lamports
        })
      );

      // Use sendAndConfirmTransaction
      const signature = await sendAndConfirmTransaction(
        this.solanaConnection,
        transaction,
        [buyerKeypair] // Include the buyer's keypair to sign the transaction
      );

      console.log(`Transaction sent and confirmed! Signature: ${signature}`);
    } catch (error) {
      console.error(`Error buying memecoin: ${error instanceof Error ? error.message : error}`);
    }
  }
}

// Example usage
const connection = new Connection("https://api.mainnet-beta.solana.com"); // Replace with your cluster endpoint
const memecoinBuyer = new MemecoinBuyer(connection);
// memecoinBuyer.buyMemecoin("TokenMintAddressHere", 1, 0.01);
