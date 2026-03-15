import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { paymentAPI } from '../api/client';
import { CheckCircle2, XCircle, Loader2, ArrowRight, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    
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
        setDetails(response.data.data);
        setStatus('success');
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center shadow-xl border-gray-100">
        {status === 'verifying' && (
          <div className="space-y-6 py-4">
            <div className="relative">
              <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="text-primary-600 animate-spin" size={40} />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Securing Payment</h2>
              <p className="text-gray-500 mt-2 font-medium">
                We're double-checking your transaction with Paystack. This usually takes a few seconds.
              </p>
            </div>
            <div className="pt-4">
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 animate-progress origin-left"></div>
              </div>
            </div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="space-y-6 py-4 animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Payment Confirmed!</h2>
              <p className="text-gray-500 mt-2 font-medium">
                Your booking is now active. A formal receipt has been sent to your email.
              </p>
            </div>
            
            {details && (
              <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-100">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                  <span>Reference</span>
                  <span className="text-gray-600">{details.reference?.slice(0, 12)}...</span>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="font-bold text-gray-700">Amount Paid</span>
                  <span className="font-black text-primary-600">₦{details.amount?.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 pt-4">
              <Link to="/my-bookings">
                <Button className="w-full flex items-center justify-center gap-2 py-4">
                  View My Bookings <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-4">
                  <Home size={18} /> Back to Home
                </Button>
              </Link>
            </div>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="space-y-6 py-4 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 shadow-inner">
              <XCircle size={48} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Verification Failed</h2>
              <p className="text-gray-500 mt-2 font-medium">
                We couldn't verify your payment reference. If you've been debited, please contact our support.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-4">
              <Button onClick={() => window.location.reload()} className="w-full">
                Retry Verification
              </Button>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-gray-400 font-medium">
              Reference: {searchParams.get('reference') || 'Unknown'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentCallback;
