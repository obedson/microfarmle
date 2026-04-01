import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/profileAPI';
import { useAuthStore } from '../store/authStore';
import { CreditCard, Shield, CheckCircle, ArrowRight, Lock, Rocket, Smartphone, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function BecomeAMember() {
  const [step, setStep] = useState(1);
  const [nin, setNin] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(false);
  const [initData, setInitData] = useState<{ requestRef: string; maskedPhone: string } | null>(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    if (user?.nin_verified && user?.is_platform_subscriber) {
      navigate('/dashboard');
    } else if (user?.is_platform_subscriber) {
      setStep(3); // Skip to NIN if already subscribed
    }
  }, [user, navigate]);

  const subscribeMutation = useMutation({
    mutationFn: (ref: string) => profileApi.subscribe(ref),
    onSuccess: () => {
      toast.success('Subscription confirmed!');
      updateUser({ is_platform_subscriber: true });
      setStep(2);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Subscription failed')
  });

  const initiateMutation = useMutation({
    mutationFn: () => profileApi.verifyNIN(nin, consent),
    onSuccess: (res: any) => {
      setInitData(res.data);
      setStep(4);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'NIN lookup failed')
  });

  const sendOtpMutation = useMutation({
    mutationFn: () => profileApi.sendOTP(initData!.requestRef, fullPhone),
    onSuccess: () => {
      toast.success('OTP sent!');
      setStep(5);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send OTP')
  });

  const confirmOtpMutation = useMutation({
    mutationFn: () => profileApi.confirmOTP(initData!.requestRef, otp),
    onSuccess: () => {
      toast.success('Identity verified!');
      updateUser({ nin_verified: true });
      setStep(6);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Verification failed')
  });

  const handlePaystackPayment = () => {
    const handler = (window as any).PaystackPop.setup({
      key: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
      email: user?.email,
      amount: 5000 * 100,
      currency: 'NGN',
      callback: (response: any) => subscribeMutation.mutate(response.reference),
      onClose: () => toast.error('Payment window closed')
    });
    handler.openIframe();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Progress Header */}
        <div className="bg-gray-900 px-8 py-6 text-white flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Become a Premium Member</h1>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-semibold">Step {step} of 7</p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map(s => (
              <div key={s} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${s <= step ? 'bg-primary-500' : 'bg-gray-700'}`} />
            ))}
          </div>
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center text-primary-600 mx-auto">
                <CreditCard size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Platform Subscription</h2>
                <p className="text-gray-500 mt-2">Unlock all features for a one-time fee: <span className="font-bold text-gray-900">₦5,000</span></p>
              </div>
              <button onClick={handlePaystackPayment} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
                Pay ₦5,000 Securely
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Payment Confirmed!</h2>
                <p className="text-gray-500 mt-2">Now let's verify your identity.</p>
              </div>
              <button onClick={() => setStep(3)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-colors flex items-center justify-center gap-2">
                Continue <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center text-primary-600 mx-auto mb-4">
                  <Shield size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">NIN Verification</h2>
                <p className="text-gray-500 mt-2">Enter your 11-digit NIN.</p>
              </div>
              <div className="space-y-4">
                <input type="text" maxLength={11} className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 outline-none transition-all font-mono tracking-widest text-center text-2xl" placeholder="00000000000" value={nin} onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))} />
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <input type="checkbox" id="consent" className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <label htmlFor="consent" className="text-sm text-gray-600 leading-tight">I consent to identity verification against government records.</label>
                </div>
                <button onClick={() => initiateMutation.mutate()} disabled={nin.length !== 11 || !consent || initiateMutation.isPending} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 disabled:opacity-50">
                  {initiateMutation.isPending ? 'Verifying...' : 'Next Step'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 mx-auto">
                <Smartphone size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Confirm Phone</h2>
                <p className="text-gray-500 mt-2">NIN linked phone: <span className="font-bold text-gray-900">{initData?.maskedPhone}</span></p>
              </div>
              <div className="space-y-4">
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all text-lg" placeholder="08030000000" value={fullPhone} onChange={(e) => setFullPhone(e.target.value)} />
                <button onClick={() => sendOtpMutation.mutate()} disabled={!fullPhone || sendOtpMutation.isPending} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700">
                  Confirm & Send OTP
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-3xl flex items-center justify-center text-yellow-600 mx-auto">
                <Key size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Enter OTP</h2>
                <p className="text-gray-500 mt-2">Enter the code sent to your phone.</p>
              </div>
              <div className="space-y-4">
                <input type="text" maxLength={6} className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 outline-none transition-all font-mono tracking-[1em] text-center text-3xl" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
                <button onClick={() => confirmOtpMutation.mutate()} disabled={otp.length < 4 || confirmOtpMutation.isPending} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700">
                  Verify OTP
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-8 animate-fade-in text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center text-green-600 mx-auto">
                <Lock size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Verification Complete</h2>
                <p className="text-gray-500 mt-2">Your identity has been successfully verified.</p>
              </div>
              <button onClick={() => setStep(7)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-colors">
                Continue
              </button>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-8 animate-bounce-in text-center">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-primary-300">
                <Rocket size={48} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Welcome to Micro Fams!</h2>
                <p className="text-gray-500 mt-2 text-lg">You are now a verified premium member.</p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700">
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
