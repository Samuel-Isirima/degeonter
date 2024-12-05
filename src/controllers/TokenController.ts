import { Router, Request, Response, NextFunction} from 'express'
import bodyParser from 'body-parser';
import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();
import { GraphQLClient, gql } from 'graphql-request';
import { GET_LATEST_TOKENS_CREATED, getTokenLiquidityDetails } from '../graphql/queries/tokenQueries';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';

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


    // export const getLiquidity = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
    // {
    //     const { liquidityPoolAddress } = req.body;
    //     const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
       
    //     const acc = await connection.getMultipleAccountsInfo([new PublicKey(liquidityPoolAddress)]);
    //     const parsed = acc.map((v) => (v ? LIQUIDITY_STATE_LAYOUT_V4.decode(v.data) : null));
    //     const lpMint = String(parsed[0]?.lpMint);
    //     let lpReserve_ = parsed[0]?.lpReserve.toNumber() ?? 0; // Provide a default value of 0 if lpReserve is undefined
    //     const accInfo = await connection.getParsedAccountInfo(new PublicKey(lpMint));
    //     const mintInfo = (accInfo?.value?.data as ParsedAccountData)?.parsed?.info; // Add type assertion
    //     let lpReserve = lpReserve_ / Math.pow(10, mintInfo?.decimals);
    //     const actualSupply = mintInfo?.supply / Math.pow(10, mintInfo?.decimals);
    //     const maxLpSupply = Math.max(actualSupply, lpReserve - 1);
    //     const burnAmt = lpReserve - actualSupply;
    //     const burnPct = (burnAmt / lpReserve) * 100;
    //     console.log("isLiquidityLocked", burnPct > 95);
    //     console.log("burnt", burnPct);

    //       return res.status(200).json({ nessage: 'LIquidity '+lpReserve });
    // })



const getTokenLiquidityPoolsAddresses = async (tokenMint: string): Promise<string[]> => {
        let poolAddresses: string[] = []; // Initialize an empty array to store pool addresses.
    
        // Get the API endpoint from the environment variable.
        let endpoint = process.env.COINGECKO_API_URL_FOR_POOL_ADDRESS || '-';
    
        try {
            // Send the request using Axios.
            const response = await axios.get(endpoint + tokenMint, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            // Log the response for debugging purposes.
            console.log('Response:', response.data);
    
            // Extract pool addresses from the response.
            const pools = response.data?.data?.relationships?.top_pools?.data || [];
            poolAddresses = pools.map((pool: { id: string; type: string }) =>
            pool.id.replace('solana_', '') // Remove the 'solana_' prefix.
        );
        } catch (error) {
            console.error('Error fetching pool addresses:', error);
        }
    
        // Return the pool addresses array.
        return poolAddresses;
    };
    


const getPoolLiquidity = async (poolAddress: string) => {
    let basePostAmount
    let quotePostAmount
    let quotePostAmountInUSD
    let quotePriceInUSD
   
    const api_key = process.env.API_KEY
    const graphqlEndpoint = process.env.API_ENDPOINT || ''
    
    // Define the request payload
    const payload = {
      query: getTokenLiquidityDetails(poolAddress)
    };
    
    console.log(getTokenLiquidityDetails(poolAddress))
    // Send the request using Axios
    const response = await axios.post(graphqlEndpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`,
      }
    })

    console.dir(response.data, { depth: null });
    // Extracting values from the response
    const poolData = response.data.data?.Solana?.DEXPools[0]?.Pool;

    if (poolData) {
        basePostAmount = poolData.Base?.PostAmount || null;
        quotePostAmount = poolData.Quote?.PostAmount || null;
        quotePostAmountInUSD = poolData.Quote?.PostAmountInUSD || null;
        quotePriceInUSD = poolData.Quote?.PriceInUSD || null;
    }

    //calculate total liquidity in this pool
    var total_liquidity = 0
    if(poolData?.Market?.BaseCurrency?.Symbol == 'WSOL')
        total_liquidity =  ( parseFloat(basePostAmount) /**This is the amount of WSOL in the pool (WSOL : SOL = 1 : 1) */ * 260 /**SOL token price */) + parseFloat(quotePostAmountInUSD) /**Amount of token(not sol) in pool in USD */
    else
        total_liquidity = parseFloat(quotePostAmountInUSD)

    return {
       total_liquidity
    };
};



export const getTokenLiquidity = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
{
const {tokenMint} = req.body
let total_liquidity = 0

//Get token pool addresses
const pool_addresses = await getTokenLiquidityPoolsAddresses(tokenMint);
console.log(`POOL ADDRESSES :: ${pool_addresses}`)

const liquidityResults = await Promise.all(
    pool_addresses.map(address => getPoolLiquidity(address))
);

total_liquidity = liquidityResults.reduce((sum, liquidity) => sum + liquidity.total_liquidity, 0);

return res.status(200).send({ message: `Request successful.`, total_liquidity: total_liquidity})

})
