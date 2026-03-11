import { Router, Request, Response, NextFunction } from 'express';
import { bnovoClient } from '../services/bnovo-client';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await bnovoClient.getAccount();
    res.json(response.data);
  } catch (err) {
    next(err);
  }
});

export default router;
