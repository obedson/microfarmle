import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { GroupModel } from '../models/Group.js';
import { ContributionModel } from '../models/Contribution.js';
import supabase from '../utils/supabase.js';

const router = Router();

// Verify Paystack signature
const verifyPaystackSignature = (req: Request): boolean => {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return hash === req.headers['x-paystack-signature'];
};

router.post('/paystack', async (req: Request, res: Response) => {
  try {
    // Verify signature
    if (!verifyPaystackSignature(req)) {
      console.error('Invalid Paystack signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Paystack webhook event:', event.event);

    // Handle successful charge
    if (event.event === 'charge.success') {
      const { reference, amount, customer, metadata } = event.data;
      
      // Handle property booking payment
      if (reference.startsWith('BOOK-')) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('*')
          .eq('payment_reference', reference)
          .single();

        if (booking) {
          await supabase
            .from('bookings')
            .update({ 
              payment_status: 'paid',
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id);
          
          console.log(`✅ Booking payment confirmed: ${reference}`);
        }
      }
      
      // Handle marketplace order payment
      else if (metadata?.type === 'marketplace_order' && metadata?.order_id) {
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', metadata.order_id);

        if (!error) {
          console.log(`✅ Marketplace order payment confirmed: ${reference}`);
        } else {
          console.error('Failed to update order:', error);
        }
      }
      
      // Check if it's a group join payment
      else if (reference.startsWith('GRP-')) {
        const { data: membership } = await supabase
          .from('group_members')
          .select('*')
          .eq('payment_reference', reference)
          .single();

        if (membership) {
          await GroupModel.confirmPayment(membership.id);
          console.log(`✅ Group payment confirmed: ${reference}`);
        }
      }
      
      // Check if it's a contribution payment
      else if (reference.startsWith('CONTRIB-')) {
        const { data: contribution } = await supabase
          .from('member_contributions')
          .select('*')
          .eq('payment_reference', reference)
          .single();

        if (contribution) {
          await ContributionModel.recordPayment(
            contribution.id,
            amount / 100, // Paystack amount is in kobo
            reference
          );
          console.log(`✅ Contribution payment confirmed: ${reference}`);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

export default router;
