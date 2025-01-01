
export const GET_LATEST_TOKENS_CREATED = `
query MyQuery {
  Solana(dataset: realtime, network: solana) {
    Instructions(
      where: {Transaction: {Result: {Success: true}}, Instruction: {Program: {Address: {is: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"}, Method: {in: ["initializeMint", "initializeMint2", "initializeMint3", "pump", "create"]}}}}
      orderBy: {descending: Block_Time}
      limit: {count: 10}
    ) {
      Block {
        Date
        Time
      }
      Instruction {
        Accounts {
          Token {
            Mint
            Owner
          }
          Address
        }
        Program {
          AccountNames
        }
      }
      Transaction {
        Signature
        Signer
      }
    }
  }
}

`;



// 4. Check Liquidity
export const GET_TOKEN_LIQUIDITY_DETAILS = (poolAddress: string) => `
query GetLatestLiquidityForPool {
    Solana {
      DEXPools(
        where: {
          Pool: {
            Market: {
              MarketAddress: {
                is: "${poolAddress}"
              }
            }
          }
          Transaction: { Result: { Success: true } }
        }
        orderBy: { descending: Block_Slot }
        limit: { count: 1 }
      ) {
        Pool {
          Market {
            MarketAddress
            BaseCurrency {
              MintAddress
              Symbol
              Name
            }
            QuoteCurrency {
              MintAddress
              Symbol
              Name
            }
          }
          Dex {
            ProtocolFamily
            ProtocolName
          }
          Quote {
            PostAmount
            PriceInUSD
            PostAmountInUSD
          }
          Base {
            PostAmount
          }
        }
      }
    }
  }
`;




// 4. Check Liquidity
export const GET_TOKEN_CURRENT_PRICE = (tokenMint: string) => `
{
    Solana {
      DEXTradeByTokens(
        limit: {count: 1}
        orderBy: {descending: Block_Time}
        where: {Trade: {Currency: {MintAddress: {is: "${tokenMint}"}}, Side: {Currency: {MintAddress: {is: "So11111111111111111111111111111111111111112"}}}}}
      ) {
        Block {
          Time
        }
        Trade {
          Price
          PriceInUSD
          Currency {
            Name
            MintAddress
            Symbol
          }
        }
        
      }
    }
  }
  
`;




// 4. Get token market cap history. Using the start time as current date
//This query gets the price of the token for the last 10 transactions
//Returns empty if there has been no trades on this coin today

export const GET_TOKEN_MARKET_CAP_HISTORY = (tokenMint: string, startTime = getTimeOneHourAgo()) => ` 


query HistoricalMarketCap {
  Solana {
    DEXTradeByTokens(
      limit: {count: 1000}
      where: {Trade: {Currency: {MintAddress: {is: "${tokenMint}"}}}, Block: {Time: {after: "${startTime}"}}}
      orderBy: {descending: Block_Time}
    ) {
      Block {
        Height
        Time
      }
      Trade {
        PriceInUSD
      }
    }
  }
}

`;



function getTimeOneHourAgo(): string {
  const now = new Date(); // Current date and time
  now.setHours(now.getHours() - 1); // Subtract 1 hour

  // Format to ISO 8601 format with 'Z'
  const isoString = now.toISOString(); // Returns in ISO format automatically
  return isoString;
}



// 4. Get dev previous queries
export const GET_DEV_PREVIOUS_PROJECTS = (devWalletAddress: string) => `
query MyQuery {
  Solana(network: solana) {
     Instructions(
      where: {Transaction: {Signer: {is: "${devWalletAddress}"}, Result: {Success: true}}, Instruction: {Program: 
        {
          Method: 
          {in: ["initializeMint", "initializeMint2", "initializeMint3", "create", "pump"]}}}}
    ) 
    {
      Transaction {
        Signer
        Signature
      }
      Instruction {
        Accounts {
          Address
        }
      }
    }
  }
}
`;




// 4. Get dev previous queries
export const GET_TRADE_HISTORY_FOR_MULTIPLE_TOKENS = (tokenAddresses: string[]) => `
query HistoricalMarketCap {
  Solana {
    DEXTradeByTokens(
      limit: {count: 100000}
      where: {Trade: {Currency: {MintAddress: {in: [${tokenAddresses}]}}}, Block: {Time: { after: "2024-12-16T00:00:00Z"}}}
      orderBy: {descending: Trade_PriceInUSD}
    ) {
      Block {
        Height
        Time
      }
      Trade {
        PriceInUSD
         Currency {
            Name
            Symbol
            MintAddress
          }
      }
    }
  }
}
`;


export const GET_TOKEN_DISTRIBUTION = (tokenAddress: string) => `
query MyQuery {
  Solana {
    BalanceUpdates(
      limit: {count: 20} 
      orderBy: {descendingByField: "TotalHolding"}
      where: {BalanceUpdate: {Currency: {MintAddress: {is: "${tokenAddress}"}}}}
    ) {
      BalanceUpdate {
        Currency {
          Name
          MintAddress
          Symbol
        }
        Account {
          Address
          Owner
          Token {
            Owner
          }
        }
      }
      TotalHolding: sum(of: BalanceUpdate_Amount)
    }
  }
}
`;