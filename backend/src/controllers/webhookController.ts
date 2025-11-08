import { Request, Response } from 'express';
import crypto from 'crypto';
import { BookingModel } from '../models/Booking';
import { asyncHandler, createError } from '../middleware/errorHandler';

const verifyPaystackSignature = (payload: string, signature: string): boolean => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
};

export const paystackWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const payload = JSON.stringify(req.body);

  if (!verifyPaystackSignature(payload, signature)) {
    throw createError('Invalid signature', 400);
  }

  const { event, data } = req.body;

  switch (event) {
    case 'charge.success':
      await handleSuccessfulPayment(data);
      break;
    
    case 'charge.failed':
      await handleFailedPayment(data);
      break;
    
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }

  res.status(200).json({ status: 'success' });
});

const handleSuccessfulPayment = async (data: any) => {
  const { reference, amount, metadata } = data;
  const bookingId = metadata?.booking_id;

  if (!bookingId) {
    console.error('No booking ID in payment metadata');
    return;
  }

  try {
    await BookingModel.updatePaymentStatus(bookingId, 'paid', reference);
    await BookingModel.updateStatus(bookingId, 'confirmed');
    
    console.log(`Payment successful for booking ${bookingId}, amount: ${amount}`);
  } catch (error) {
    console.error('Error updating booking after successful payment:', error);
  }
};

const handleFailedPayment = async (data: any) => {
  const { reference, metadata } = data;
  const bookingId = metadata?.booking_id;

  if (!bookingId) {
    console.error('No booking ID in payment metadata');
    return;
  }

  try {
    await BookingModel.updatePaymentStatus(bookingId, 'failed', reference);
    
    console.log(`Payment failed for booking ${bookingId}`);
  } catch (error) {
    console.error('Error updating booking after failed payment:', error);
  }
};
