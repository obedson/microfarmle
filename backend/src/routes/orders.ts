import { Router, Response } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Create order
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { items, total, delivery_info } = req.body;

    // Create separate order for each item
    const orderPromises = items.map((item: any) =>
      supabase
        .from('orders')
        .insert([{
          buyer_id: req.user?.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: item.price * item.quantity,
          delivery_address: delivery_info.address,
          phone: delivery_info.phone,
          status: 'pending',
        }])
        .select()
    );

    const results = await Promise.all(orderPromises);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    const orders = results.map(r => r.data).flat();

    res.status(201).json({ success: true, data: orders });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user orders
router.get('/my-orders', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products(
          *,
          users(name, phone, email)
        )
      `)
      .eq('buyer_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get seller sales
router.get('/my-sales', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        products!inner(*)
      `)
      .eq('products.seller_id', req.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update order status
router.put('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Verify seller owns the product
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*, products(*)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (order.products.seller_id !== req.user?.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Order status updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
