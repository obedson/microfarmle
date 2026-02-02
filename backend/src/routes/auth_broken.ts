import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
