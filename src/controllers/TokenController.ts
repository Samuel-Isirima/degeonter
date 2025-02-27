import { Router, Request, Response, NextFunction, response} from 'express'
import bodyParser from 'body-parser';
import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();
import { GraphQLClient, gql } from 'graphql-request';
import { GET_DEV_PREVIOUS_PROJECTS, GET_LATEST_TOKENS_CREATED, GET_TOKEN_DISTRIBUTION, GET_TOKEN_MARKET_CAP_HISTORY, GET_TRADE_HISTORY_FOR_MULTIPLE_TOKENS} from '../graphql/queries/tokenQueries';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';
import { getImportantTradeData, parseTokenMarketCapHistoryAPIResponse } from '../methods/marketCap';
import { exit } from 'process';
import rabbitmqService, { TokenQueueMessageInterface } from '../services/rabbitmq.service';
import { calculateTokenHoldings } from '../methods/tokenHolders';
// import { NewTokenQueueMessageInterface } from '../services/rabbitmq.service';

export const fetchLatestCoins = async () => 
{
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
   api_response_data.forEach((entry) => {
    // Map the response to the interface
    const message: TokenQueueMessageInterface = {
      payload: entry,
      blockTime: entry.Block.Time,
      devAddress: entry.Transaction.Signer || "",
      tokenMint: entry.Instruction.Accounts[0]?.Token.Mint || "",
      filters: {}
    }
    rabbitmqService.sendToQueue("NEW_TOKENS", JSON.stringify(message))
  })


}


export const marketCapHistory = async ( queue_message: string ) => 
{

  var token_details_object: TokenQueueMessageInterface = JSON.parse(queue_message)
  const tokenMint = token_details_object.tokenMint

  var marketCapFilter = {canBuy: [true], comment: [""], data: {}}
  const api_key = process.env.API_KEY
  const graphqlEndpoint = process.env.API_ENDPOINT || ''
  
  // Define the request payload
  const payload = {
    query: GET_TOKEN_MARKET_CAP_HISTORY(tokenMint)
  };

  try {
    // Send the request using Axios
    const response = await axios.post(graphqlEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      }
    });

    console.log(response.data.data)

    // Store the response data in a variable
    const response_data = response.data.data;
    //Now get the market cap details at various times
    const marketCapHistory = parseTokenMarketCapHistoryAPIResponse(response_data);
    const importantMCData = getImportantTradeData(marketCapHistory);

    /*
    Here now for our algo
    The target of this project is not to get 100m runner projects but to get a 2x, 3x and at the most 5x from early launches
    before they die or get rugged, ofcourse based on filters
    So if a coin has already done a 3x or 4x, we'd skip through it
    Hence
    if MC < 80% ATH, coin is already dying; we skip
    

    Scratch that. The algo should be based on time
    If ATH timestamp > 5 minutes { and MC < 80% ATH } { and ATH > $15k}
    If coin is older than 10m, don't buy

    */


   if(importantMCData.latestTime.market_cap < 15_000)
   {
    //Essentially, never buying any coin with less than 15k mc. It could be a regular rug pull
    marketCapFilter.canBuy.push(false)
    marketCapFilter.comment = ["❌ Token Market Cap less than $15k"] 
   }
   else
   {
    //Essentially, never buying any coin with more than 15k mc; When this strategy works and builds liquidity, we can modify to allow for conviction buying
    marketCapFilter.canBuy.push(true)
    marketCapFilter.comment = ["✅ Token Market Cap above $15k"] 
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

   if(importantMCData.latestTime.market_cap < (0.7 * importantMCData.highestMarketCap.market_cap))
   {
    marketCapFilter.canBuy.push(false)
    marketCapFilter.comment = ["❌ Token Market Cap has fallen below 70% of ATH. Token is dying"]    //coin is dying
   }
   else
   {
    marketCapFilter.canBuy.push(true)
    marketCapFilter.comment = ["✅ Token Market Cap is still above 70% of ATH. Token may be able to recover"]
   }

   
  //For time difference in minutes
  marketCapFilter.data = { marketCap: importantMCData.latestTime.market_cap }
  token_details_object.filters.marketCapFilter = marketCapFilter
  return JSON.stringify(token_details_object)
  }
  catch(error)
  {
    console.error('Error executing query:', error);
  }
}



export const tokenDistribution = async ( queue_message: string ) => 
{

  var token_details_object: TokenQueueMessageInterface = JSON.parse(queue_message)
  const tokenMint = token_details_object.tokenMint
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

    console.log(response.data.data)
    const [addressHoldings, ownerHoldings] = calculateTokenHoldings(response.data.data)
    
    //For each owner holdings, apart from the first one which is always the bonding curve, if any other owner accounts hold more than 3%, flag
    // Filter entries with percentage > 2
    const holdersWithMoreThan2Percent = ownerHoldings.filter(holder => parseFloat(holder.percentage) > 2);

    if(holdersWithMoreThan2Percent.length > 5)  //First one accounting for the bonding curve holdings, and one for dev. Anything else, is a danger
    {
      distributionFilter.canBuy.push(true)
      distributionFilter.comment = ["❌ More than five wallets holding over 2% of the total supply of the token"] 
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

  token_details_object.filters.distributionFilter = distributionFilter
  return JSON.stringify(token_details_object)
}




  export const processToken = async (token_details : string) =>
  {

    console.log("IN PRODESS TOKEN METHOD")
    console.log(token_details)

    // const mintability_result: string | undefined = await mintability(token_details) || '' //All tokens created with the pump program are not mintable. This is not necessary
    // console.log(mintability_result)

    delay(5000)
    const market_cap_result: string | undefined = await marketCapHistory(token_details) || ''
    console.log(market_cap_result)
    const distribution_result: string | undefined = await tokenDistribution(dev_history_result) || ''
    console.log(distribution_result)

  }


  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
