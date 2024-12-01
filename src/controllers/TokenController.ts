import { Router, Request, Response, NextFunction} from 'express'
import bodyParser from 'body-parser';
import axios from 'axios';
const dotenv = require('dotenv');
dotenv.config();
import { GraphQLClient, gql } from 'graphql-request';
import { GET_LATEST_TOKENS_CREATED } from '../graphql/queries/tokenQueries';



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




