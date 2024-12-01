require('dotenv').config();

import express, { Application, Request, Response } from 'express'
import routes from './routes';
import { connect } from 'http2';
import connectToDatabase from './database/DatabaseConnection';
import cors from 'cors';

const app: Application = express()
const port = process.env.APP_PORT || 3000

const allowedOrigins = ['https://bluhuss.com', 'https://www.bluhuss.com', 'http://localhost:8080'];

// CORS options with dynamic origin check
const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests, or postman)
        if (!origin) return callback(null, true);

        // Check if the origin is in the allowedOrigins array
        if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true); // Allow the origin
        } else {
        callback(new Error('Not allowed by CORS')); // Block the origin
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies to be sent across domains if needed
    optionsSuccessStatus: 200 // For legacy browser support
  };
  
// Use CORS middleware
app.use(cors(corsOptions));
  
// Body parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//connect to database
connectToDatabase();

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