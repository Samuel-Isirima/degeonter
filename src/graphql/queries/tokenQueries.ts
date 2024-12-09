
export const GET_LATEST_TOKENS_CREATED = `
  query MyQuery {
    Solana(dataset: realtime, network: solana) {
      Instructions(
        where: {
          Instruction: {
            Program: {
              Address: { is: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
              Method: { in: ["initializeMint", "initializeMint2", "initializeMint3"] }
            }
          }
        }
        orderBy: { ascending: Block_Time }
        limit: { count: 10 }
      ) {
        Block {
          Date
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

export const GET_TOKEN_MARKET_CAP_HISTORY = (tokenMint: string, startTime = '2024-12-03T09:36:17Z') => ` 


query HistoricalMarketCap {
  Solana {
    DEXTradeByTokens(
      limit: {count: 50}
      where: {Trade: {Currency: {MintAddress: {is: "${tokenMint}"}}}, Block: {Time: {after: "${startTime}"}}}
      orderBy: {ascending: Block_Time}
      limitBy: {by: Block_Height, count: 1}
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