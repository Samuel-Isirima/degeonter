require('dotenv').config();

import express, { Application, Request, Response } from 'express'
import routes from './routes';
import rabbitMQService, { startQueueProcessors } from './services/rabbitmq.service';
import { fetchLatestCoins, processToken } from './controllers/TokenController';

const app: Application = express()
const port = process.env.APP_PORT || 3000

  
// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Create the queues for data

// (async () => {
//     try {
//       await rabbitMQService.connect()
//       const queues = ["NEW_TOKENS", /* checked */"MINTABILITY", "MARKET_CAP", "DEV", "DISTRIBUTION"]
//     //   for (const queue of queues) {
//     //     await rabbitMQService.getChannel(queue)
//     //   }
//     // rabbitMQService.getChannel("NEW_TOKENS")
//     //   await rabbitMQService.close()

//     } catch (error) 
//     {
//       console.error("Error:", error)
//     }
//   })();

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

// devHistory('6d22FozaKK239PoBYVffkYKA1QPQZE8fC7AQkpmHQfjp')

// getTokenDistribution("G7UBEu5Ebbni4KMUViZnuqziRGesR2przSA34beipump")

async function startPullingNewTokens() {
    while (true) {
      await fetchLatestCoins(); // Wait for the function to finish
      console.log("Waiting 30 seconds before the next call...")
      await new Promise((resolve) => setTimeout(resolve, 7000)) // Wait 7 seconds
    }
}
  

// Example usage
(async () => {
    await startQueueProcessors([
      {
        queueName: "NEW_TOKENS",
        processor: processToken
      }
    ]);
})();
  

  