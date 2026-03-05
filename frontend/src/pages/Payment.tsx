import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const amount = searchParams.get('amount');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!type || !id || !amount) {
      alert('Invalid payment parameters');
      navigate('/');
      return;
    }

    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Load Paystack script if not already loaded
      if (!window.PaystackPop) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const { data } = await apiClient.post('/payments/initialize-group', {
        member_id: id,
        amount: Number(amount)
      });

      const handler = window.PaystackPop.setup({
        key: 'pk_test_477fe8b07010d168c214d2dbaebdd5831800e593',
        email: user?.email,
        amount: Number(amount) * 100,
        ref: data.reference,
        callback: (response: any) => {
          verifyPayment(response.reference);
        },
        onClose: () => {
          alert('Payment cancelled');
          navigate(-1);
        }
      });

      handler.openIframe();
      setLoading(false);
    } catch (error: any) {
      console.error('Payment init error:', error);
      alert(error.response?.data?.error || 'Failed to initialize payment');
      navigate(-1);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      await apiClient.post(`/groups/confirm-payment/${id}`);
      alert('Payment successful! You are now a member.');
      
      // Extract groupId from URL or navigate to groups list
      const urlParams = new URLSearchParams(window.location.search);
      const groupId = urlParams.get('groupId');
      
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate('/groups');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
      navigate('/groups');
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Initializing payment...</p>
      </div>
    );
  }

  return null;
}
