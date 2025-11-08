import { Router } from 'express';
import { initializePayment, verifyPayment } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/initialize', authenticateToken, initializePayment);
router.get('/verify/:reference', verifyPayment);

export default router;
