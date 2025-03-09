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

  // await new Promise((resolve) => setTimeout(resolve, 30000)) // Wait 30 seconnds for transactions to build to weed out quick one buy rugs

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
        await rabbitMQService.sendToQueue("MARKET_CAP_PROCESSED", JSON.stringify(mc_result));
    }

    
   
  }
  catch(error)
  {
    console.error('Error executing query:', error);
  }
}



export const tokenDistribution = async ( queueMessage: string ) => 
{

  var tokenObject = JSON.parse(queueMessage)
  //var marketCapFilter = {token: {mintAddress: mintAddress}, canBuy: [true], comment: [""], data: {}}
  //
  const tokenMint = tokenObject.token.mintAddress

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
    
    //Get number of holders
    var totalHolders = ownerHoldings.length
    if(totalHolders < 5)
    {
      distributionFilter.canBuy.push(false)
      distributionFilter.comment = ["❌ Token has less than 5 holders. Potential rug."] 
    }
    else
    {
      distributionFilter.canBuy.push(true)
      distributionFilter.comment = ["✅ Token has more than 5 holders"]
    }

    //GEt holders with similar holdings
    // const holdersWithSimilarHoldings = ownerHoldings.filter(holder => (parseFloat(holder.percentage) > 1 && parseFloat(holder.percentage) < 2))

    //For each owner holdings, apart from the first one which is always the bonding curve, if any other owner accounts hold more than 3%, flag
    // Filter entries with percentage > 2
    const holdersWithMoreThan5Percent = ownerHoldings.filter(holder => parseFloat(holder.percentage) > 5);
    console.log("holders with more than 5 percent")
    console.log(JSON.stringify(holdersWithMoreThan5Percent))
    
    if(holdersWithMoreThan5Percent.length > 1)  //First one accounting for the bonding curve holdings. Anything else, is a danger
    {
      distributionFilter.canBuy.push(false)
      distributionFilter.comment = ["❌ There is/are [a] wallet[s] holding over 5% of the total supply of the token"] 
    }
    else
    {
      distributionFilter.canBuy.push(true)
      distributionFilter.comment = ["✅ No wallets holding over 5% of the token"] 
    }

    const holdersWithMoreThan2Percent = ownerHoldings.filter(holder => parseFloat(holder.percentage) > 2);
    console.log("holders with more than 2 percent")
    console.log(JSON.stringify(holdersWithMoreThan2Percent))

    if(holdersWithMoreThan2Percent.length > 5)  //First one accounting for the bonding curve holdings, and one for dev. Anything else, is a danger
    {
      distributionFilter.canBuy.push(false)
      distributionFilter.comment = ["❌ More than four wallets holding over 2% of the total supply of the token"] 
    }
    else
    {
      distributionFilter.canBuy.push(true)
      distributionFilter.comment = ["✅ under four wallets holding over 2% of the total supply of the token | The bonding curve wallet"] 
    }


    const cannotBuy = distributionFilter.canBuy.some(val => val === false)


    //Send to the buy queue if the token passes the filters
    if(!cannotBuy)
      await rabbitMQService.sendToQueue("BUY", JSON.stringify(tokenObject));

  }
  catch (error) 
  {
  console.error('Error executing query:', error)
  }

  

  
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


   if(importantMCData.latestTime.market_cap < 15_000)
   {
    //Essentially, never buying any coin with less than 15k mc. It could be a regular rug pull
    marketCapFilter.canBuy.push(false)
    marketCapFilter.comment = ["❌ Token Market Cap less than $15k"] 
   }
   else if(importantMCData.latestTime.market_cap > 15_000 && importantMCData.latestTime.market_cap < 41_000)
   {
    //Essentially, never buying any coin with more than 15k mc; When this strategy works and builds liquidity, we can modify to allow for conviction buying
    marketCapFilter.canBuy.push(true)
    marketCapFilter.comment = ["✅ Token Market Cap above $15k and less than $41k"] 
   }
   else
   {
     //Essentially, never buying any coin with more than 15k mc; When this strategy works and builds liquidity, we can modify to allow for conviction buying
     marketCapFilter.canBuy.push(false)
     marketCapFilter.comment = ["❌ Token Market Cap above $41k"] 
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