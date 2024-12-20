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


function extractUniqueAddresses(response) {
  const uniqueAddresses = new Set(); // Use a Set to ensure uniqueness

  // Traverse the response object
  response.forEach(item => {
    console.log(item.BalanceUpdate)
      if (item.BalanceUpdate) 
      {
        uniqueAddresses.add(item.BalanceUpdate.Account.Address); // Add to Set
      }
  });

  // Convert the Set to an array and return it
  return Array.from(uniqueAddresses);
}

// Example usage:
const response = [
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "AnWPrgR6ca5y9FwNrxo7ZF7qr64HxYJoCKbWvRxy826B"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "915459774.555588"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "8xVLRHixVEGWnsC478STaGs4bjh2fD3VF2CSXUdAzMs3"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "31041761.488254"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "CJQ964DWedvd9gcYvdv6u3WBCwLGpNX6Up7KRyuMyV2e"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "24530067.429713"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "3pjyrmJe8QkGXwHdUVJgo2waZqpp8D5HGeXruaPBFwSb"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "21773466.040771"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "CpBXUaxS3nYvyrYrDUgjkrmFvHCKpn8b7wbftpaD95Rb"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "12932988.432844"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "DEpgZqfDX8B1gbMTwRT8q9vFx1gdY5KWGFyBvARdFodg"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "9331421.488463"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "hi19113P6d87ozEB4VGVtY4o5vkfs6S4zrdvGTYQGJW"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "6002082.891467"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "HxehYKeC7UyhW9aNNreXTHqA9D37SniZUQjJhanweh1g"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "4001887.032229"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "6tdWa3roZRdYcB8bSS9GJSwYMnS9mdh8u9ax6WznjEN2"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "3237682.210124"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "EDYpoj2fMQVvsVuC52r22gvduTyePLjL3XvnPKk5LRLz"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "3155712.098587"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "2CtA5DY1M2ifaZBNL1i7Ak6W47WmiYmce8NqG6Agh6WB"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "3093455.077756"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "BUaiCkb4HBjEtZKrmbgkQoJ53MHFHWgVju2ZZL9rZWPa"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "2405311.729796"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "9phGLtrU2Ly5iud7gHeghaMVTsfKhGdHaD49jQD5DeBD"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "1442652.826471"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "9iD3vYUAUAKMRFrk47gha6HWLA7N2WjqmztHkCcaA4n1"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "1440532.000737"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "7yN9uLoMj2UXjfPJWALqKpXjEPZQWLvNyy3GMkphQV8C"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "1088673.301494"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "EN4cPawL1UNaLPA9LLSscx38sVr411iCc8jp1Z6TRe7P"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "1088673.301494"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "ED5e3auPQnFp9L5KD5vtE4A4DC9YpvmYLrs1GdkMgHTj"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "985568.172530"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "DNjndwZzzhKdYLNd39EC4JHekxKdrwUvcTMhncyCa2b8"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "978399.909194"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "DJQSagcYUGCfjL9km3AnxMJs4w6ePgohHbrL3wdMqSvi"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "958268.389914"
        },
        {
          "BalanceUpdate": {
            "Account": {
              "Address": "EbLdxWPxriPxtdycrGVYyPiUMtRX85sR7xR1VGxcfsoQ"
            },
            "Currency": {
              "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
              "Name": "Unicorn Shart Dust",
              "Symbol": "$USD"
            }
          },
          "TotalHolding": "875766.384862"
        }
    ];

const uniqueAddresses = extractUniqueAddresses(response);
console.log(uniqueAddresses.length)
console.log(uniqueAddresses);
