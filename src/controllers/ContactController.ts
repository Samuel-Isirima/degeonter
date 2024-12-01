import { Router, Request, Response, NextFunction} from 'express'
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
const dotenv = require('dotenv');
dotenv.config();

import RequestValidator from '../helpers/RequestValidator';
import Contact, { IContact } from '../models/Contact';
import { generateRandomString } from '../utils/RandomStringGenerator';


export const store = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
{
    var contact: IContact | null = null

    const validationRule = {
        "name": "required|string",
        "email": "required|string|email",
        "message": "required|string",
        "services": "required|string|min:8",
    };

    const validationResult: any = await RequestValidator(req.body, validationRule, {})
    .catch((err) => {
    console.error(err)
    })

    if(validationResult.status === false)
    {
    const errorMessages: String[] = validationResult.formattedErrors
    return res.status(401).send({ message: `${errorMessages[0]}`})
    }


    const payload = req.body  
    try 
    {
        var unique_id = generateRandomString(32)

        //create contact
        contact = await Contact.create({
            email: payload.email,
            name: payload.name,
            message: payload.message,
            services: payload.services,
            unique_id: unique_id
        })

        //send email response

       
    } 
    catch (error) 
    {
    console.log(error)
    return res.status(403).send({ message: `An unexpected error has occured. Please try again later.`,
    error: error})
    }

  return res.status(200).send({ message: `Your message has been received. We would reach out to you shortly.`})
})





export const all = (bodyParser.urlencoded(), async(req: Request, res: Response, next: NextFunction) => 
{
    
    try 
    {
      //fetch the contacts
      const contacts: IContact[] | null = await Contact.find()
      if(!contacts)
      {
          return res.status(401).send({ message: `Contacts not found.`})
      }
      return res.status(200).send({ message: `Contacts retrieved successfully.`, contacts: contacts})
  
       
    } 
    catch (error) 
    {
    console.log(error)
    return res.status(403).send({ message: `An unexpected error has occured. Please try again later.`,
    error: error})
    }

  return res.status(200).send({ message: `Your message has been received. We would reach out to you shortly.`})
})



