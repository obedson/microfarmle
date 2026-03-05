import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      email: string;
    };
  };
}

export async function verifyPaystackPayment(reference: string): Promise<{
  valid: boolean;
  amount: number;
  email: string;
  message?: string;
}> {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.get<PaystackVerificationResponse>(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { data } = response.data;

    if (data.status !== 'success') {
      return {
        valid: false,
        amount: 0,
        email: '',
        message: 'Payment not successful',
      };
    }

    // Convert from kobo to naira
    const amountInNaira = data.amount / 100;

    return {
      valid: true,
      amount: amountInNaira,
      email: data.customer.email,
    };
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    return {
      valid: false,
      amount: 0,
      email: '',
      message: error.response?.data?.message || 'Payment verification failed',
    };
  }
}

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}
