/**
 * THIS QUERY IS TO GET THE LIQUIDIDTY IN A LIQUIDITY POOL BY THE POOL ADDRESS
 * 
 * query GetLatestLiquidityForPool {
  Solana {
    DEXPools(
      where: {
        Pool: {
          Market: {
            MarketAddress: {
              is: "4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i"
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


THIS IS THE SAMPLE RESPONSE
 * {
  "Solana": {
    "DEXPools": [
      {
        "Pool": {
          "Base": {
            "PostAmount": "40466.287187714"
          },
          "Dex": {
            "ProtocolFamily": "Raydium",
            "ProtocolName": "raydium_amm"
          },
          "Market": {
            "BaseCurrency": {
              "MintAddress": "So11111111111111111111111111111111111111112",
              "Name": "Wrapped Solana",
              "Symbol": "WSOL"
            },
            "MarketAddress": "4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i",
            "QuoteCurrency": {
              "MintAddress": "2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump",
              "Name": "Peanut the Squirrel ",
              "Symbol": "Pnut "
            }
          },
          "Quote": {
            "PostAmount": "7644312.515888",
            "PostAmountInUSD": "9615544.691095833",
            "PriceInUSD": 1.2557657445633863
          }
        }
      }
    ]
  }
}



 */