import e, { Router } from 'express'
import tokenRouter from './token';

const router = Router()

router.use('/token', tokenRouter)


export default router;