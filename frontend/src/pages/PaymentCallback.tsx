import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from '../api/client';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (reference) {
      verifyPayment(reference);
    } else {
      setStatus('failed');
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const response = await paymentAPI.verify(reference);
      
      if (response.data.success) {
        setStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setStatus('failed');
      }
    } catch (error) {
      setStatus('failed');
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      {status === 'verifying' && (
        <div>
          <h2>Verifying Payment...</h2>
          <p>Please wait while we confirm your payment.</p>
        </div>
      )}
      
      {status === 'success' && (
        <div>
          <h2 style={{ color: 'green' }}>Payment Successful! 🎉</h2>
          <p>Your booking has been confirmed.</p>
          <p>Redirecting to dashboard...</p>
        </div>
      )}
      
      {status === 'failed' && (
        <div>
          <h2 style={{ color: 'red' }}>Payment Failed</h2>
          <p>There was an issue with your payment. Please try again.</p>
          <button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentCallback;
