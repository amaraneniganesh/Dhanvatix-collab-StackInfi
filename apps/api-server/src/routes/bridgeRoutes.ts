import { Router } from 'express';
import { generateBridgeToken, consumeBridgeToken } from '../controllers/bridgeController';

const router = Router();

router.post('/generate', generateBridgeToken);
router.post('/consume', consumeBridgeToken);

export default router;
