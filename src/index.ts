require('dotenv').config();

import express, { Application, Request, Response } from 'express'
import routes from './routes';
import { connect } from 'http2';
import cors from 'cors';
import rabbitMQService from './services/rabbitmq.service';
import { fetchLatestCoins } from './controllers/TokenController';

const app: Application = express()
const port = process.env.APP_PORT || 3000

  
// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Create the queues for data

(async () => {
    try {
      await rabbitMQService.connect()
  
      const queues = ["NEW_TOKENS", "ANALYZED_TOKENS"]
      for (const queue of queues) {
        await rabbitMQService.createQueue(queue)
      }

    //   await rabbitMQService.close()

    } catch (error) 
    {
      console.error("Error:", error)
    }
  })();

//app.use('/api/v1', routes)
app.use('/api/v1', routes)

try 
{
    app.listen(port, () => 
    {
        console.log(`App running on http://localhost:${port}`)
    })
} 
catch (error : any) 
{
    console.log(`An error occurred while trying to initialize serrvice: ${error.message}`)
}                    


//Start the new tokens subscription | PS: It's not actually a subscription service. it's just a recalling of the function
startPullingNewTokens()


async function startPullingNewTokens() {
    while (true) {
      await fetchLatestCoins(); // Wait for the function to finish
      console.log("Waiting 10 seconds before the next call...")
      await new Promise((resolve) => setTimeout(resolve, 7000)) // Wait 7 seconds
    }
}
  