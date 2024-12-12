import { Router, Request, Response, NextFunction} from 'express'
const dotenv = require('dotenv');
dotenv.config();

const TokenController = require('../controllers/TokenController');

const TokenRouter: Router = Router()

/////////////////////////////////////////////////////////////////////////////////////// For PUMP.FUN //////////////////////////////////////////////////////////////////////////////////////////// 
TokenRouter.post('/fetch-latest', TokenController.fetchLatestCoins)
TokenRouter.post('/check-mintability', TokenController.tokenIsMintable)
// TokenRouter.post('/get-token-liquidity', TokenController.getTokenLiquidity)      //Pump.fun tokens do not have liquidity until bonding
TokenRouter.post('/marketcap-history', TokenController.getTokenMarketCapHistory)
TokenRouter.post('/dev-history', TokenController.devHistory)
// TokenRouter.post('/check-bonding-progress', TokenController.checkBondingProgress)
// TokenRouter.post('/check-developer-previous-projects', TokenController.developerPreviousProjects)
// TokenRouter.post('/check-age', TokenController.tokenAge)
// TokenRouter.post('/holders-metrics', TokenController.holdersMetrics)
// TokenRouter.post('/good-wallets-watches', TokenController.goodWalletsWatches)
// TokenRouter.post('/social-media-website-community-check', TokenController.sMWCCheck)
// TokenRouter.post('/send-to-bot', TokenController.sendToBot)

/**
 * 
 * The bot would add the address to the database of coin addresses to be monitoring
 * Then be monitoring
 * At 3x, pull out 2x and let the rest go to the moon
 */

/////////////////////////////////////////////////////////////////////////////////////// For PUMP.FUN //////////////////////////////////////////////////////////////////////////////////////////// 

export default TokenRouter;