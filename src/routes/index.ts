import e, { Router } from 'express'
import contactRouter from './contact';

const router = Router()

router.use('/contact', contactRouter)


export default router;