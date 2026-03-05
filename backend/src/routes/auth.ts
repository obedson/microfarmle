import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { supabase } from '../utils/supabase.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, phone, created_at, referral_code, paid_referrals_count')
      .eq('id', req.user?.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// Get referral stats
router.get('/referral-stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data: referrals, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('referred_by', req.user?.id);

    if (error) throw error;

    const { data: paidReferrals } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('payment_status', 'paid')
      .in('user_id', referrals.map(r => r.id));

    const referralsWithStatus = referrals.map(ref => ({
      ...ref,
      has_paid: paidReferrals?.some(p => p.user_id === ref.id) || false
    }));

    res.json({
      total: referrals.length,
      referrals: referralsWithStatus
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch referral stats' });
  }
});

export default router;
