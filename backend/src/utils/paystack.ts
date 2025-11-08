import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const paystackAPI = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

export const initializePayment = async (data: {
  email: string;
  amount: number;
  reference: string;
  callback_url?: string;
}) => {
  const response = await paystackAPI.post('/transaction/initialize', {
    email: data.email,
    amount: data.amount * 100, // Convert to kobo
    reference: data.reference,
    callback_url: data.callback_url,
  });
  return response.data;
};

export const verifyPayment = async (reference: string) => {
  const response = await paystackAPI.get(`/transaction/verify/${reference}`);
  return response.data;
};
