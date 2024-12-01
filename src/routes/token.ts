import { Router, Request, Response, NextFunction} from 'express'
const dotenv = require('dotenv');
dotenv.config();

const TokenController = require('../controllers/TokenController');

const TokenRouter: Router = Router()

TokenRouter.post('/fetch-latest', TokenController.fetchLatestCoins)

export default TokenRouter;