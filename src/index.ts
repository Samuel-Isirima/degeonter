require('dotenv').config();

import express, { Application, Request, Response } from 'express'
import routes from './routes';
import { connect } from 'http2';
import cors from 'cors';

const app: Application = express()
const port = process.env.APP_PORT || 3000

  
// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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