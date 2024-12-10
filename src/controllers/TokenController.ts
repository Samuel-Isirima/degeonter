import { Router, Request, Response, NextFunction} from 'express'
import bodyParser from 'body-parser';
import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();
import { GraphQLClient, gql } from 'graphql-request';
import { GET_LATEST_TOKENS_CREATED, GET_TOKEN_MARKET_CAP_HISTORY} from '../graphql/queries/tokenQueries';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';
import { getImportantTradeData, parseTokenMarketCapHistoryAPIResponse } from '../methods/marketCap';
import { exit } from 'process';

export const fetchLatestCoins = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
{
   const api_key = process.env.API_KEY

   const graphqlEndpoint = process.env.API_ENDPOINT || ''
   
   // Define the request payload
   const payload = {
     query: GET_LATEST_TOKENS_CREATED
   };
   
   // Send the request using Axios
   axios.post(graphqlEndpoint, payload, {
     headers: {
       'Content-Type': 'application/json',
       'Authorization': `Bearer ${api_key}`,
     }
   })
   .then(response => {
     console.log('GraphQL Response:', response.data);
     return res.status(200).send({ message: `Request successful.`, data: response.data})
   })
   .catch(error => {
     console.error('Error executing query:', error);
     return res.status(403).send({ message: `An unexpected error has occured. Please try again later.`,
     error: error})
   });
})




export const tokenIsMintable = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
{
    try {
        const { tokenMint } = req.body;
        // Validate input
        if (!tokenMint) {
          return res.status(400).json({ error: 'Token mint address is required.' });
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
              return res.status(200).json({ mintable: true, mintAuthority });
            } 
            else 
            {
              return res.status(200).json({ mintable: false, message: 'Token is not mintable.' });
            }
          } 
          else 
          {
            return res.status(500).json({ error: 'Account data is not parsed. Unable to fetch mint authority.' });
          }
        } 
        else 
        {
          return res.status(404).json({ error: 'Invalid token mint address or account not found.' });
        }
      } catch (error) {
        // Handle unexpected errors
        next(error);
      }
});




export const getTokenMarketCapHistory = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
{
  const api_key = process.env.API_KEY
  const graphqlEndpoint = process.env.API_ENDPOINT || ''
  const tokenMint = req.body.tokenMint
  
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
    //Now calculate the market cap at various times
    const marketCapHistory = parseTokenMarketCapHistoryAPIResponse(response_data);

    const importantMCData = getImportantTradeData(marketCapHistory);

    /*
    Here now for our algo
    The target of this project is not to get 100m runner projects but to get a 2x, 3x and at the most 5x from early launches
    before they die or get rugged, ofcourse based on filters
    So if a coin has already done a 3x or 4x, we'd skip through it
    Hence, if ATH > 1.5x ATL, we skip
    if MC < 80% ATH, coin is already dying; we skip
    
    */

    // Send a successful response
    return res.status(200).send({ 
      message: `Request successful.`,
      data: marketCapHistory
    });

    } 
    catch (error) 
    {
    console.error('Error executing query:', error);
    // Send an error response

    return res.status(403).send({ 
      message: `An unexpected error has occurred. Please try again later.`,
      error: error 
    });
  }
})



