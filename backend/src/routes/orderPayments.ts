import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import axios from 'axios';

const router = Router();

// Initialize payment for order
router.post('/orders/:orderId/pay', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    // Get order details
    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Initialize Paystack payment
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: req.user.email,
        amount: Math.round(order.total_amount * 100), // Convert to kobo
        reference: `order_${orderId}_${Date.now()}`,
        metadata: {
          order_id: orderId,
          user_id: req.user.id,
          type: 'order'
        },
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update order with payment reference
    await supabase
      .from('orders')
      .update({ 
        payment_reference: paystackResponse.data.data.reference,
        payment_status: 'pending'
      })
      .eq('id', orderId);

    res.json({
      success: true,
      authorization_url: paystackResponse.data.data.authorization_url,
      reference: paystackResponse.data.data.reference
    });
  } catch (error) {
    console.error('Payment initialization error:', error);
    res.status(500).json({ error: 'Failed to initialize payment' });
  }
});

// Get order status
router.get('/orders/:orderId/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, status, payment_status, total_amount')
      .eq('id', orderId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order status' });
  }
});

export default router;
