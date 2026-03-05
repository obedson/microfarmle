import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { logAudit } from '../utils/audit';

const router = Router();

// Admin only routes
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [users, properties, bookings, revenue] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('properties').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('id', { count: 'exact', head: true }),
      supabase.from('bookings').select('total_amount').eq('payment_status', 'paid')
    ]);

    const totalRevenue = revenue.data?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;

    res.json({
      totalUsers: users.count || 0,
      totalProperties: properties.count || 0,
      totalBookings: bookings.count || 0,
      totalRevenue
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get all users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Suspend user
router.post('/users/:id/suspend', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await supabase
      .from('users')
      .update({ is_suspended: true })
      .eq('id', id);

    await logAudit({
      user_id: req.user.id,
      action: 'user.suspend',
      resource_type: 'user',
      resource_id: id,
      details: { reason },
      ip_address: req.ip
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Get audit logs
router.get('/audit-logs', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, users(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
