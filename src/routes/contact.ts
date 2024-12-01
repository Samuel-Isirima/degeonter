import { Router, Request, Response, NextFunction} from 'express'
const dotenv = require('dotenv');
dotenv.config();

const ContactController = require('../controllers/ContactController');

const contactRouter: Router = Router()

contactRouter.post('/store', ContactController.store)
contactRouter.get('/all', ContactController.all)

export default contactRouter;