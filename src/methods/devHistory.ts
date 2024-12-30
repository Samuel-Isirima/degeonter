/**
 * 
The way to find the tokens created by a particular dev wallet is to look for transactions on the 
solana network where the dev's address is the signer. Now, regular buy and sell transactions from the dev's wallet 
could also have the dev's wallet as a signer. So we filter these by making sure the transaction was one with at least
one of the methods of/for creating tokens on the solana network.
These include initializeMint1,  initializeMint2,  initializeMint3, create, pump
Adding this filter results in transactions involving the dev's wallet address that have these methods.

Now, event with these filters, when the query returns the transaction details, it returns all the addresses that are associated with
that particular transacion, hence making it difficult to find the actual mint address of the token

However, as postulated by an article, whenver a token is minted, the mint address is usually the first in the list of addresses
associated with that mint transaction. Hence, No matter how many addresses that are returned by the query, the actual mint address is the
first one in the array.

So we'd get them by using the function below;
 */

export const  getFirstAddressInEachBlock = function(response: any): string[] {
    const firstAddresses: string[] = []; // Explicitly type the array as string[]
  
    if (response.Solana && response.Solana.Instructions) {
      response.Solana.Instructions.forEach((instruction: any) => {
        if (instruction.Instruction && instruction.Instruction.Accounts) {
          const firstAccount = instruction.Instruction.Accounts[0];
          if (firstAccount && firstAccount.Address) {
            firstAddresses.push(firstAccount.Address);
          }
        }
      });
    }
  
    return firstAddresses;
  }
  


  //Next step is to get 3 evenly(time based) spaced transactions for each of these token, so we 
  //can get the market cap at these three points. This has to be done in one query for all 5 tokens.


export const  analyzeDevPreviousProjectsPriceHistory = function(response) {
    const trades = response.Solana.DEXTradeByTokens;
    // Step 1: Group trades by MintAddress
    const groupedTrades = trades.reduce((acc, trade) => {
      const mintAddress = trade.Trade.Currency.MintAddress;
      if (!acc[mintAddress]) acc[mintAddress] = [];
      acc[mintAddress].push(trade);
      return acc;
    }, {});
  
    // Step 2: Find highest and lowest prices for each MintAddress
    const result = Object.keys(groupedTrades).map(mintAddress => {
      const tradesForAddress = groupedTrades[mintAddress];
      const highest = tradesForAddress.reduce((max, trade) =>
        trade.Trade.PriceInUSD > max.Trade.PriceInUSD ? trade : max, tradesForAddress[0]);
      const lowest = tradesForAddress.reduce((min, trade) =>
        trade.Trade.PriceInUSD < min.Trade.PriceInUSD ? trade : min, tradesForAddress[0]);
  
      return {
        MintAddress: mintAddress,
        Highest: highest,
        Lowest: lowest
      };
    });
  
    return result;
  }
  
  interface Trade {
    MintAddress: string;
    Highest: {
      Block: { Height: string; Time: string };
      Trade: { Currency: { MintAddress: string; Name: string; Symbol: string }; PriceInUSD: number };
    };
    Lowest: {
      Block: { Height: string; Time: string };
      Trade: { Currency: { MintAddress: string; Name: string; Symbol: string }; PriceInUSD: number };
    };
  }
  
  interface TimeDifference {
    MintAddress: string;
    TimeDifferenceMinutes: number;
    ATH: number;
  }
  
export const getTimeDifferenceBetweenTokenCreationAndATH = function(trades: Trade[]): TimeDifference[] {
  /**
   * 
   * For this algo, we'd assume that all the tokens have been rugged back to $5.7k MC
   */
    return trades.map((trade) => {
      const { MintAddress, Highest, Lowest } = trade;
  
      // Parse the timestamps into Date objects
      const highestTime: Date = new Date(Highest.Block.Time);
      const lowestTime: Date = new Date(Lowest.Block.Time);
      const ath = Highest.Trade.PriceInUSD * 1_000_000_000
  
      // Calculate the time difference in minutes
      const timeDifferenceMinutes: number = Math.abs((highestTime.getTime() - lowestTime.getTime()) / (1000 * 60));
  
      return {
        MintAddress,
        TimeDifferenceMinutes: timeDifferenceMinutes,
        ATH: ath
      };
    });
  }
  