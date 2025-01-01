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
import { analyzeDevPreviousProjectsPriceHistory, getFirstAddressInEachBlock, getTimeDifferenceBetweenTokenCreationAndATH } from '../methods/devHistory';
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

  // return res.status(200).json({ data: api_response_data, message: 'Tokens fetched.' });


}




export const mintability = async ( queue_message: string ) => 
{
  var token_details_object: TokenQueueMessageInterface = JSON.parse(queue_message)


  const tokenMint = token_details_object.tokenMint
  var mintFilter = {score: 0, comment: [""]}
    try {
        // Validate input
        if (!tokenMint) {
          return
        }
        // Solana connection
        const connection = new Connection("https://api.mainnet-beta.solana.com");
        const publicKey = new PublicKey(tokenMint);
        // Fetch account info
        const accountInfo = await connection.getParsedAccountInfo(publicKey);
        if (accountInfo.value) {
          const data = accountInfo.value.data;
    
          if ('parsed' in data) 
          {
            const parsedData = data as ParsedAccountData;
            const mintAuthority = parsedData.parsed.info.mintAuthority;
    
            if (mintAuthority) 
            {
              mintFilter.score = 0
              mintFilter.comment = ["[DANGEROUS] This token is minatable"]
            } 
            else 
            {
              mintFilter.score = 10
              mintFilter.comment = ["[BEAUTIFUL] This token is not minatable"]
            }
          } 
          else 
          {
            mintFilter.score = 0
            mintFilter.comment = ["[WARNING] Token account data is not parsed. Unable to fetch mint authority."]
          }
        } 
        else 
        {
          mintFilter.score = 0
          mintFilter.comment = ["[DANGEROUS] Token not found."]
        }
      } catch (error) {
        mintFilter.score = 0
        mintFilter.comment = [`[DANGEROUS] An error occured while trying to get the mintability of this token. ${error}`]
      }

      //Now write this to the queue
      token_details_object.filters.mintFilter = mintFilter
      return JSON.stringify(token_details_object)
}




export const marketCapHistory = async ( queue_message: string ) => 
{

  var token_details_object: TokenQueueMessageInterface = JSON.parse(queue_message)
  const tokenMint = token_details_object.tokenMint

  var marketCapFilter = {score: 0, comment: [""], data: {}}
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
   if(importantMCData.latestTime.market_cap > 15_000)
   {
    //Essentially, never buying any coin with more than 15k mc; When this strategy works and builds liquidity, we can modify to allow for conviction buying
    marketCapFilter.score += 1;
    marketCapFilter.comment = ["[WARNING] Token Market Cap already about $15k"] 
  }

   if(importantMCData.highestMarketCap.time.timeAgoInMinutes >= 4)
   {
    marketCapFilter.score += 1;
    marketCapFilter.comment = ["[WARNING] Token ATH was over 4 minutes ago. Token may be dying"] 
   }
   if(importantMCData.latestTime.market_cap < (0.7 * importantMCData.highestMarketCap.market_cap))
   {
    marketCapFilter.score += 1;
    marketCapFilter.comment = ["[WARNING] Token Market Cap has fallen below 70% of ATH"] 
   }

   
  //For time difference in minutes

  token_details_object.filters.marketCapFilter = marketCapFilter
  return JSON.stringify(token_details_object)
      // rabbitmqService.sendToQueue("MARKET_CAP", JSON.stringify(token_details_object))
  }
  catch(error)
  {
    console.error('Error executing query:', error);
  }
}



export const devHistory = async ( queue_message: string ) => 
{

  var token_details_object: TokenQueueMessageInterface = JSON.parse(queue_message)
  const tokenMint = token_details_object.tokenMint
  const devWalletAddress = token_details_object.devAddress
  // const devWalletAddress = devAddress

  var devFilter = {score: 0, comment: [""], data: {}}

  const api_key = process.env.API_KEY
  const graphqlEndpoint = process.env.API_ENDPOINT || ''
  let response
  // Define the request payload
  let payload = {
    query: GET_DEV_PREVIOUS_PROJECTS(devWalletAddress)
  };

  try {
    // Send the request using Axios
    response = await axios.post(graphqlEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      }
    });

    console.log(response.data.data)
  }
  catch (error) 
  {
  console.error('Error executing query:', error);
  //log the error
  }

const devPreviousProjects = getFirstAddressInEachBlock(response.data.data)
console.log('DEV PREVIOUS PROJECTS')
console.log(devPreviousProjects)
//If this wallet is a new one, with no previous project, exit
if(!devPreviousProjects.length)
{
  
  /**
   *
   * First time dev
   * OR NOT 
   * The EAP API only gives historical data up to 8 hours back, hence, if this dev had created a token 10 hours ago, 
   * we wouldn't be able to get it 
   * SO the dev could actually be a based dev, but we'd never know 
   * So assume dev is a jeet, as there would be more jeets than based devs
   */
  devFilter.score = 1
  devFilter.comment = ["[WARNING] This may be a first time dev. Project may not even take off"]
}
else if(devPreviousProjects.length > 2) //This is within the past 8 hours, as the EAP API only provides data for up to 8 hours behind
{
  devFilter.score = 0.5
  devFilter.comment = ["[WARNING] This is a pump and dump dev.", `[INFO] This dev has created ${devPreviousProjects.length} projects in the past 8 hours`]
}

//Now get analysis on previous dev projects
// const tokensPriceHistoryQuery 
payload = 
    {
      query: GET_TRADE_HISTORY_FOR_MULTIPLE_TOKENS(arrayToQuotedCsv(devPreviousProjects))
    }

    try {
      // Send the request using Axios
      response = await axios.post(graphqlEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`,
        }
      });
  
    }
    catch (error) 
    {
    console.error('Error executing query:', error);
    //Log the error  
    }


  //get token analysis
  const devPreviousTokensPriceHistory = analyzeDevPreviousProjectsPriceHistory(response.data.data)
  const devPreviousProjectsAnalysis = getTimeDifferenceBetweenTokenCreationAndATH(devPreviousTokensPriceHistory)

  console.log("DEV PREVIOUS TOKENS ANALYSIS")
  console.log(devPreviousProjectsAnalysis)

  //With these analysis, we can get the average amount/time when the dev and his team rugs. Include this data when sending to bot. 
  //So bot can sell before the rug MC/time, whichever one is closest 

  //Get the mode for ATH and time to ATH before rug
  const modes: ModeResult = calculateMode(devPreviousProjectsAnalysis, 0.5, 1000)
  devFilter.data = {rugATHMode: modes.ATHMode, rugTimeInMinutes: modes.TimeDifferenceMinutesMode}
  
  if(modes.ATHMode > 20000)
  {

    devFilter.score += 7
    devFilter.comment.push("[BEAUTIFUL] This dev has many projects that reached $20k MC. Hence, you can make a 2x from his project")
    
  }
  else if(modes.ATHMode < 20000 && modes.ATHMode > 12000)
  {
      devFilter.score += 4
      devFilter.comment.push("[OKAY] This dev has many projects that reached $14k MC. Hence, you may make a 1.5x from his project")
  }
  else
  {
    devFilter.score += 1
    devFilter.comment.push("[WARNING] This dev rugs projects before they can even get to the $10k MC mark.")
  }


  //For time difference in minutes

  token_details_object.filters.devFilter = devFilter
  return JSON.stringify(token_details_object)
  // rabbitmqService.sendToQueue("DEV", JSON.stringify(token_details_object))
 
}







export const tokenDistribution = async ( queue_message: string ) => 
{

  var token_details_object: TokenQueueMessageInterface = JSON.parse(queue_message)
  const tokenMint = token_details_object.tokenMint
  var distributionFilter = {score: 0, comment: [""]}
  
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
    // Filter entries with percentage > 3
    const holdersWithMoreThan3Percent = ownerHoldings.filter(holder => parseFloat(holder.percentage) > 3);

    if(holdersWithMoreThan3Percent.length > 2)  //First one accounting for the bonding curve holdings, and one for dev. Anything else, is a danger
    {
      distributionFilter.score = 2;
      distributionFilter.comment = ["[WARNING] There are more than 2 wallets holding over 3% of the total supply of the token"]
    }
    else
    {
      distributionFilter.score = 8;
      distributionFilter.comment = ["[BEAUTIFUL] Only one wallet holding over 3% of the total supply of the token | The bonding curve wallet"]
    }

  }
  catch (error) 
  {
  console.error('Error executing query:', error)
  }



  token_details_object.filters.distributionFilter = distributionFilter
  return JSON.stringify(token_details_object)
  // rabbitmqService.sendToQueue("DISTRIBUTION", JSON.stringify(token_details_object))
}



  const arrayToQuotedCsv = (array) => {
    // Map each element to a quoted string and join with commas
    return array.map(element => `"${element}"`).join(',');
  };
    
  interface DataPoint {
    MintAddress: string;
    TimeDifferenceMinutes: number;
    ATH: number;
  }
  
  interface ModeResult {
    TimeDifferenceMinutesMode: number;
    ATHMode: number;
  }
  
  function calculateMode(data: DataPoint[], timeBinSize: number, athBinSize: number): ModeResult {
    const timeBins: Record<string, number> = {};
    const athBins: Record<string, number> = {};
  
    let maxTimeFrequency = 0;
    let maxAthFrequency = 0;
  
    let timeModeBin = '';
    let athModeBin = '';
  
    for (const { TimeDifferenceMinutes, ATH } of data) {
      // Calculate TimeDifferenceMinutes bin
      const timeBin = Math.floor(TimeDifferenceMinutes / timeBinSize) * timeBinSize;
      const timeBinKey = timeBin.toFixed(5); // For consistent bin keys
      timeBins[timeBinKey] = (timeBins[timeBinKey] || 0) + 1;
  
      if (timeBins[timeBinKey] > maxTimeFrequency) {
        maxTimeFrequency = timeBins[timeBinKey];
        timeModeBin = timeBinKey;
      }
  
      // Calculate ATH bin
      const athBin = Math.floor(ATH / athBinSize) * athBinSize;
      const athBinKey = athBin.toString(); // For consistent bin keys
      athBins[athBinKey] = (athBins[athBinKey] || 0) + 1;
  
      if (athBins[athBinKey] > maxAthFrequency) {
        maxAthFrequency = athBins[athBinKey];
        athModeBin = athBinKey;
      }
    }
  
    return {
      TimeDifferenceMinutesMode: parseFloat(timeModeBin),
      ATHMode: parseFloat(athModeBin),
    };
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
    const dev_history_result: string | undefined = await devHistory(market_cap_result) || ''
    console.log(dev_history_result)
    const distribution_result: string | undefined = await tokenDistribution(dev_history_result) || ''
    console.log(distribution_result)

  }


  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
