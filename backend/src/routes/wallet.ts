import { Router } from 'express';
import { walletController } from '../controllers/walletController.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Dedicated rate limiter for wallet mutations - Fixed IPv6 issue
const walletLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per user
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many wallet requests, please try again later' }
});

// All wallet routes require authentication
router.use(authenticateToken as any);

// Individual wallet routes
router.get('/', walletController.getWallet);
router.get('/transactions/:id', walletController.getTransaction);
router.post('/p2p/lookup', walletLimiter, walletController.lookupRecipient);
router.post('/p2p', walletLimiter, walletController.initiateP2P);
router.post('/withdraw', walletLimiter, walletController.previewWithdrawal);
router.post('/withdraw/confirm', walletLimiter, walletController.confirmWithdrawal);
router.post('/withdraw/:requestId/sync', walletLimiter, walletController.syncWithdrawal);
router.get('/withdraw/:id/status', walletController.getWithdrawalStatus);

// Group wallet routes
router.get('/groups/:id', walletController.getGroupWallet);
router.post('/groups/:id/withdraw', walletLimiter, walletController.initiateGroupWithdrawal);
router.get('/groups/:id/withdraw/:requestId', walletController.getGroupWithdrawalRequest);
router.post('/groups/:id/withdraw/:requestId/approve', walletLimiter, walletController.castApprovalVote);

export default router;
