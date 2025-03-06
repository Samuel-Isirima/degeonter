import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();
import { GET_DEV_PREVIOUS_PROJECTS, GET_LATEST_TOKENS_CREATED, GET_TOKENS_MARKET_CAP_HISTORY, GET_TOKEN_DISTRIBUTION, GET_TRADE_HISTORY_FOR_MULTIPLE_TOKENS} from '../graphql/queries/tokenQueries';
import { getImportantTradeData, parseTokenMarketCapHistoryAPIResponse } from '../methods/marketCap';
import rabbitmqService, { TokenQueueMessageInterface } from '../services/rabbitmq.service';
import { calculateTokenHoldings } from '../methods/tokenHolders';
import Token from '../models/Token';
import rabbitMQService from '../services/rabbitmq.service';


export const fetchLatestCoins = async () => 
{
  var tokens_array: any[] = []
  var token_mints_array: any[] = []

  console.log('called fetch latest coins')
   const api_key = process.env.API_KEY
   const graphqlEndpoint = process.env.API_ENDPOINT || ''
   // Define the request payload
   const payload = {
     query: GET_LATEST_TOKENS_CREATED
   };
  let api_call_response
   
  try
  {
  api_call_response = await axios.post(graphqlEndpoint, payload, {
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${api_key}`,
     }
   })
  }
  catch(error)
  {
     console.error('Error executing query:', error);
     return({ message: `An unexpected error has occured. Please try again later.`,
     error: error})
  }
  //We get the dev's wallet from the result of this query
  let api_response_data = api_call_response.data.data.Solana.Instructions
  console.log('API response fetched, going to wait 30 seconds now before sending to queue')
  console.log(api_response_data)
  //At this point, the data is an array of data that looks like this
  /**
   * [
        {
            "Block": {
                "Date": "2024-12-25",
                "Time": "2024-12-25T15:06:50Z"
            },
            "Instruction": {
                "Accounts": [
                    {
                        "Address": "5L4ha3NaMy9xZztSFVAWFhjsig3KqmNBZ4TJ2iXMpump",
                        "Token": {
                            "Mint": "5L4ha3NaMy9xZztSFVAWFhjsig3KqmNBZ4TJ2iXMpump",
                            "Owner": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
                        }
                    }
                ],
                "Program": {
                    "AccountNames": [
                        "mint"
                    ]
                }
            },
            "Transaction": {
                "Signature": "WacTdhdNcTcNzLiTEgJD61UJXsEKejHudkmd1c6wntK4kxKanUMynrWtynRMV1MSm7vuzF75DkpUafWoYBndF83",
                "Signer": "EzgcgmJNF2zEQHAdgfds3BphQZv8P5Yx3AzA4Cqu1grC"
            }
        }]
   */
   // Loop through the response and create interface instances
   api_response_data.forEach(async (entry) => {
    // Map the response to the interface
    const token = {
      payload: entry,
      blockTime: entry.Block.Time,
      devAddress: entry.Transaction.Signer || "",
      tokenMint: entry.Instruction.Accounts[0]?.Token.Mint || "",
      filters: {}
    }

    //put it into an array
    tokens_array.push(token)
    token_mints_array.push(token.tokenMint)

  })

  console.log('Going to wait 20 seconds for transactions to build before processing tokens market caps')
  await new Promise((resolve) => setTimeout(resolve, 20000)) // Wait 20 seconnds for transactions to build to weed out quick one buy rugs

  await rabbitMQService.sendToQueue("NEW_TOKENS", JSON.stringify(token_mints_array))

}


export const marketCapHistory = async ( queueMessage: string ) => 
{

  var tokenMintsArray = JSON.parse(queueMessage)
  var marketCapFilters = [{token: {}, canBuy: [true], comment: [""], data: {}}]
  const api_key = process.env.API_KEY
  const graphqlEndpoint = process.env.API_ENDPOINT || ''
  
  // Define the request payload
  const payload = {
    query: GET_TOKENS_MARKET_CAP_HISTORY(arrayToQuotedCSV(tokenMintsArray))
  };

  try {
    // Send the request using Axios
    const response = await axios.post(graphqlEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      }
    });


    const tokenTradesGroupedByMintAddress = response.data.data.Solana.DEXTradeByTokens.reduce((acc, item) => {
    const mintAddress = item.Trade.Currency.MintAddress;
      if (!acc[mintAddress]) {
        acc[mintAddress] = [];
      }
      acc[mintAddress].push(item);
      return acc;
    }, {});
    
    //Now, for each mintAddress in the group, run the processing
    // Log each group separately
    for (const [mintAddress, trades] of Object.entries(tokenTradesGroupedByMintAddress)) {
      console.log(`-------------------------------------------------- PROCESSING for ${mintAddress} -------------------------------------------------- `);
      
      // Ensure processMarketCapForSingleToken is an async function if needed
      var mc_result = await processMarketCapForSingleToken(mintAddress, trades);
      
      const cannotBuy = mc_result.canBuy.some(val => val === false)


      //Send to the buy queue if the token passes the filters
      if(!cannotBuy)
        await rabbitMQService.sendToQueue("BUY", JSON.stringify(mc_result));
    }

    
   
  }
  catch(error)
  {
    console.error('Error executing query:', error);
  }
}



export const tokenDistribution = async ( queueMessage: string ) => 
{

  var tokenObject: TokenQueueMessageInterface = JSON.parse(queueMessage)
  const tokenMint = tokenObject.tokenMint
  var distributionFilter = {canBuy: [true], comment: [""]}
  
  const api_key = process.env.API_KEY
  const graphqlEndpoint = process.env.API_ENDPOINT || ''
  // const tokenMint = req.body.tokenMint
  
  // Define the request payload
  const payload = {
    query: GET_TOKEN_DISTRIBUTION(tokenMint)
  };

  try {
    // Send the request using Axios
    const response = await axios.post(graphqlEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      }
    });

    //console.log(response.data.data)
    const [addressHoldings, ownerHoldings] = calculateTokenHoldings(response.data.data)
    
    //For each owner holdings, apart from the first one which is always the bonding curve, if any other owner accounts hold more than 3%, flag
    // Filter entries with percentage > 2
    const holdersWithMoreThan2Percent = ownerHoldings.filter(holder => parseFloat(holder.percentage) > 2);
    console.log(ownerHoldings)

    if(holdersWithMoreThan2Percent.length > 6)  //First one accounting for the bonding curve holdings, and one for dev. Anything else, is a danger
    {
      distributionFilter.canBuy.push(true)
      distributionFilter.comment = ["❌ More than six wallets holding over 2% of the total supply of the token"] 
    }
    else
    {
      distributionFilter.canBuy.push(true)
      distributionFilter.comment = ["✅ Only one wallet holding over 3% of the total supply of the token | The bonding curve wallet"] 
    }

  }
  catch (error) 
  {
  console.error('Error executing query:', error)
  }

  tokenObject.filters.distributionFilter = distributionFilter
  return JSON.stringify(tokenObject)
}




  export const processToken = async (tokenDetails : string) =>
  {
    console.log("IN PROCESS TOKEN METHOD")
    await marketCapHistory(tokenDetails)
   

  }


  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  function arrayToQuotedCSV(array) {
    return array.map(item => `"${item}"`).join(',');
  }

  const processMarketCapForSingleToken = (mintAddress, tokenData) => 
  {
    var marketCapFilter = {token: {mintAddress: mintAddress}, canBuy: [true], comment: [""], data: {}}
    //Now get the market cap details at various times
    const marketCapHistory = parseTokenMarketCapHistoryAPIResponse(tokenData);
    // console.log('MARKET CAP HISTORY RESULT')
    // console.log(marketCapHistory)
    const importantMCData = getImportantTradeData(marketCapHistory);


   if(importantMCData.latestTime.market_cap < 8_000)
   {
    //Essentially, never buying any coin with less than 15k mc. It could be a regular rug pull
    marketCapFilter.canBuy.push(false)
    marketCapFilter.comment = ["❌ Token Market Cap less than $8k"] 
   }
   else if(importantMCData.latestTime.market_cap > 8_000 && importantMCData.latestTime.market_cap < 21_000)
   {
    //Essentially, never buying any coin with more than 15k mc; When this strategy works and builds liquidity, we can modify to allow for conviction buying
    marketCapFilter.canBuy.push(true)
    marketCapFilter.comment = ["✅ Token Market Cap above $6k and less than $21k"] 
   }
   else
   {
     //Essentially, never buying any coin with more than 15k mc; When this strategy works and builds liquidity, we can modify to allow for conviction buying
     marketCapFilter.canBuy.push(false)
     marketCapFilter.comment = ["❌ Token Market Cap above $21k"] 
   }

   if(importantMCData.highestMarketCap.time.timeAgoInMinutes >= 4)
   {
    marketCapFilter.canBuy.push(false)
    marketCapFilter.comment = ["❌ Token ATH was over 4 minutes ago. Token may be dying"] 
   }
   else
   {
    marketCapFilter.canBuy.push(true)
    marketCapFilter.comment = ["✅ Token ATH was over less minutes ago. Token may be able to recover"]
   }

   if(importantMCData.latestTime.market_cap < (0.5 * importantMCData.highestMarketCap.market_cap))
   {
    marketCapFilter.canBuy.push(false)
    marketCapFilter.comment = ["❌ Token Market Cap has fallen below 50% of ATH. Token is dying"]    //coin is dying
   }
   else
   {
    marketCapFilter.canBuy.push(true)
    marketCapFilter.comment = ["✅ Token Market Cap is still above 50% of ATH. Token may be able to recover"]
   }

   
  //For time difference in minutes
  marketCapFilter.data = { marketCap: importantMCData.latestTime.market_cap }
  return marketCapFilter
  }