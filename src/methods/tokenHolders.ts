export const calculateTokenHoldings = (
    response: any,
    totalSupply: number = 1_000_000_000
  ): [{
    address: string;
    balance: number;
    percentage: string;}[],
    { owner, totalOwned, addressCount, percentage }[]
    ] =>
    {
    const addressBalances: Record<string, number> = {}; // Store balances per address
    const ownerBalances: Record<string, number> = {}; // Store total balances per owner
    const ownerAddressCount: Record<string, number> = {}; // Store address count per owner
      
    var data = response.Solana.BalanceUpdates
    // Traverse the response object to sum balances
    data.forEach((item) => {
      if (item.BalanceUpdate) {
        const address = item.BalanceUpdate.Account.Address;
        const owner = item.BalanceUpdate.Account.Owner; // Assuming 'Owner' field exists
        const balance = parseFloat(item.TotalHolding || "0"); // Parse balance as a float
  
        // Sum balances for each address
        addressBalances[address] = (addressBalances[address] || 0) + balance;
  
        // Sum balances for each owner and count addresses
        if (owner) {
          ownerBalances[owner] = (ownerBalances[owner] || 0) + balance;
          ownerAddressCount[owner] = (ownerAddressCount[owner] || 0) + 1;
        }
      }
    });
  
    // Calculate percentages and prepare results for addresses
    const results: { address: string; balance: number; percentage: string }[] = [];
    for (const address in addressBalances) {
      const balance = addressBalances[address];
      const percentage = (balance / totalSupply) * 100; // Calculate percentage
      results.push({ address, balance, percentage: percentage.toFixed(2) }); // Store results
    }
  
    // Prepare results for owners
    const ownerTotals: { owner: string; totalOwned: number; addressCount: number; percentage: any; }[] = [];
    for (const owner in ownerBalances) {
      const totalOwned = ownerBalances[owner];
      const addressCount = ownerAddressCount[owner];
      const percentage = (totalOwned / totalSupply) * 100; // Calculate percentage
      ownerTotals.push({ owner, totalOwned, addressCount, percentage: percentage.toFixed(2) }); // Store total owned and address count per owner
    }
  
    return [ results, ownerTotals ];
  }
  
  
  
  
  // Example usage:
  const response = [
    {
      "BalanceUpdate": {
        "Account": {
          "Address": "AnWPrgR6ca5y9FwNrxo7ZF7qr64HxYJoCKbWvRxy826B",
          "Owner": "9wigmNmv5d9BHacWB7PeaSiRyoZ4Nj2TjTj4uid7Hr9G",
          "Token": {
            "Owner": "9wigmNmv5d9BHacWB7PeaSiRyoZ4Nj2TjTj4uid7Hr9G"
          }
        },
        "Currency": {
          "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
          "Name": "Unicorn Shart Dust",
          "Symbol": "$USD"
        }
      },
      "TotalHolding": "883345486.238372"
    },
    {
      "BalanceUpdate": {
        "Account": {
          "Address": "Bz152Lzk2ZEpwoGSaT2GMbnUKp6pVSSS9meoUs6R1vyD",
          "Owner": "4x4HUhJxmMd36EQuzTxngMHiydnZLYteJQ48WYd8crs",
          "Token": {
            "Owner": "4x4HUhJxmMd36EQuzTxngMHiydnZLYteJQ48WYd8crs"
          }
        },
        "Currency": {
          "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
          "Name": "Unicorn Shart Dust",
          "Symbol": "$USD"
        }
      },
      "TotalHolding": "46874898.407526"
    },
    {
      "BalanceUpdate": {
        "Account": {
          "Address": "8xVLRHixVEGWnsC478STaGs4bjh2fD3VF2CSXUdAzMs3",
          "Owner": "Fs8grxYXXiZskavAFNTYZ2rub7veg278qGqVRR9jJHMt",
          "Token": {
            "Owner": "Fs8grxYXXiZskavAFNTYZ2rub7veg278qGqVRR9jJHMt"
          }
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
          "Address": "3pjyrmJe8QkGXwHdUVJgo2waZqpp8D5HGeXruaPBFwSb",
          "Owner": "7oEGqcyjQxQmJwST191xvEqhmEt8nhMM8QvUmmciuokr",
          "Token": {
            "Owner": "7oEGqcyjQxQmJwST191xvEqhmEt8nhMM8QvUmmciuokr"
          }
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
          "Address": "CpBXUaxS3nYvyrYrDUgjkrmFvHCKpn8b7wbftpaD95Rb",
          "Owner": "8L3ebFPyLSuKnYkPTPdUFpfZwQe3CbLDQDwhvSB9cLri",
          "Token": {
            "Owner": "8L3ebFPyLSuKnYkPTPdUFpfZwQe3CbLDQDwhvSB9cLri"
          }
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
          "Address": "DEpgZqfDX8B1gbMTwRT8q9vFx1gdY5KWGFyBvARdFodg",
          "Owner": "FWdU8vccTFXZvibrzMy1T9HJTCTTSUK7HP1z4s2KmWqF",
          "Token": {
            "Owner": "FWdU8vccTFXZvibrzMy1T9HJTCTTSUK7HP1z4s2KmWqF"
          }
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
          "Address": "hi19113P6d87ozEB4VGVtY4o5vkfs6S4zrdvGTYQGJW",
          "Owner": "oLUoSu1xcwM1pbeNjwxMRa6BamAuxLGnm88tJ2LByp7",
          "Token": {
            "Owner": "oLUoSu1xcwM1pbeNjwxMRa6BamAuxLGnm88tJ2LByp7"
          }
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
          "Address": "5zthU5ZncQP73vKJHwfU9hrs8YZv7yLd6rrAjwHdG2fX",
          "Owner": "6wJo4eJ7Uxprp9UU8GbHbxQLAVR1hepyUQHKSZv9Kgvq",
          "Token": {
            "Owner": "6wJo4eJ7Uxprp9UU8GbHbxQLAVR1hepyUQHKSZv9Kgvq"
          }
        },
        "Currency": {
          "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
          "Name": "Unicorn Shart Dust",
          "Symbol": "$USD"
        }
      },
      "TotalHolding": "5041160.139842"
    },
    {
      "BalanceUpdate": {
        "Account": {
          "Address": "2fkC8cq4ez4foyZwGeWaTdprgYvHMWqMnh6yPvYdAUt6",
          "Owner": "BmViHFpXoaMdu7RyBDEtnTf7iJMJkz9PSL3zw9Y9t2Yk",
          "Token": {
            "Owner": "BmViHFpXoaMdu7RyBDEtnTf7iJMJkz9PSL3zw9Y9t2Yk"
          }
        },
        "Currency": {
          "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
          "Name": "Unicorn Shart Dust",
          "Symbol": "$USD"
        }
      },
      "TotalHolding": "4999134.792885"
    },
    {
      "BalanceUpdate": {
        "Account": {
          "Address": "HxehYKeC7UyhW9aNNreXTHqA9D37SniZUQjJhanweh1g",
          "Owner": "DotRZJycEKwo4HpumgwGfviMofZhqHWmYh1jfuhosrMX",
          "Token": {
            "Owner": "DotRZJycEKwo4HpumgwGfviMofZhqHWmYh1jfuhosrMX"
          }
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
          "Address": "6tdWa3roZRdYcB8bSS9GJSwYMnS9mdh8u9ax6WznjEN2",
          "Owner": "7U2QpgZBs5XZeuqsDeziuG8riCV1gZMKg3V4PRrajPYP",
          "Token": {
            "Owner": "7U2QpgZBs5XZeuqsDeziuG8riCV1gZMKg3V4PRrajPYP"
          }
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
          "Address": "EDYpoj2fMQVvsVuC52r22gvduTyePLjL3XvnPKk5LRLz",
          "Owner": "23ad5YgcqHNnRREh8YPnQ9jTP2ne532GuUDDjhjAtTXk",
          "Token": {
            "Owner": "23ad5YgcqHNnRREh8YPnQ9jTP2ne532GuUDDjhjAtTXk"
          }
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
          "Address": "2CtA5DY1M2ifaZBNL1i7Ak6W47WmiYmce8NqG6Agh6WB",
          "Owner": "DQoKMer2h9bEknbmuTb55a71iPsAAtvXS6MKLkhBviby",
          "Token": {
            "Owner": "DQoKMer2h9bEknbmuTb55a71iPsAAtvXS6MKLkhBviby"
          }
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
          "Address": "BUaiCkb4HBjEtZKrmbgkQoJ53MHFHWgVju2ZZL9rZWPa",
          "Owner": "6DEVYYGpVuySfPYHRMSfbgNvmkUysnLPpTMbLCVGXUnR",
          "Token": {
            "Owner": "6DEVYYGpVuySfPYHRMSfbgNvmkUysnLPpTMbLCVGXUnR"
          }
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
          "Address": "9phGLtrU2Ly5iud7gHeghaMVTsfKhGdHaD49jQD5DeBD",
          "Owner": "G2NKfgi84ujwdHfRhGuNoTFumfcdmWgHPZ4LXDXb5NSg",
          "Token": {
            "Owner": "G2NKfgi84ujwdHfRhGuNoTFumfcdmWgHPZ4LXDXb5NSg"
          }
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
          "Address": "9iD3vYUAUAKMRFrk47gha6HWLA7N2WjqmztHkCcaA4n1",
          "Owner": "CPk6GuXVenYVzDh3y9bJfNymmvHaj4FQv5282kgAyZKM",
          "Token": {
            "Owner": "CPk6GuXVenYVzDh3y9bJfNymmvHaj4FQv5282kgAyZKM"
          }
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
          "Address": "EfBYAkENJRwFbovQTgLeXiDRxJ454rnYJSgDoR1zTWEy",
          "Owner": "C5r7qFGDqwjF6nDJbdq443V4TQfxdxK2rBiVoFUkuNTY",
          "Token": {
            "Owner": "C5r7qFGDqwjF6nDJbdq443V4TQfxdxK2rBiVoFUkuNTY"
          }
        },
        "Currency": {
          "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
          "Name": "Unicorn Shart Dust",
          "Symbol": "$USD"
        }
      },
      "TotalHolding": "1214488.927473"
    },
    {
      "BalanceUpdate": {
        "Account": {
          "Address": "EN4cPawL1UNaLPA9LLSscx38sVr411iCc8jp1Z6TRe7P",
          "Owner": "AjZA8PnmodVsJoR3ZVxVAniugroyHzqLstSLn1YEsd6i",
          "Token": {
            "Owner": "AjZA8PnmodVsJoR3ZVxVAniugroyHzqLstSLn1YEsd6i"
          }
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
          "Address": "7yN9uLoMj2UXjfPJWALqKpXjEPZQWLvNyy3GMkphQV8C",
          "Owner": "AVxbP8cnb9ts9XhMpEaRdiiqApWbHmvBWVNQbPohYtT3",
          "Token": {
            "Owner": "AVxbP8cnb9ts9XhMpEaRdiiqApWbHmvBWVNQbPohYtT3"
          }
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
          "Address": "ED5e3auPQnFp9L5KD5vtE4A4DC9YpvmYLrs1GdkMgHTj",
          "Owner": "8P14YTwzRvkUiUrNErK6cP5DiYd5FSC3ZHN9hQxyfWhp",
          "Token": {
            "Owner": "8P14YTwzRvkUiUrNErK6cP5DiYd5FSC3ZHN9hQxyfWhp"
          }
        },
        "Currency": {
          "MintAddress": "4LWEFRHMofhU3d4B81MYKpfyxYB7yVzw2muNiLSDpump",
          "Name": "Unicorn Shart Dust",
          "Symbol": "$USD"
        }
      },
      "TotalHolding": "985568.172530"
    } 
];

// const totalSupply = 1_000_000_000; // Total supply of tokens
// const holdings = calculateTokenHoldings(response, totalSupply);

// console.log(holdings)