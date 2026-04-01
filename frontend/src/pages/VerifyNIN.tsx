import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../services/profileAPI';
import { useAuthStore } from '../store/authStore';
import { Shield, Search, CheckCircle, AlertTriangle, ArrowRight, Smartphone, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function VerifyNIN() {
  const [step, setStep] = useState(1);
  const [nin, setNin] = useState('');
  const [fullPhone, setFullPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [consent, setConsent] = useState(false);
  const [initData, setInitData] = useState<{ requestRef: string; maskedPhone: string } | null>(null);
  
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const initiateMutation = useMutation({
    mutationFn: () => profileApi.verifyNIN(nin, consent),
    onSuccess: (res: any) => {
      setInitData(res.data);
      setStep(2);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Verification failed')
  });

  const sendOtpMutation = useMutation({
    mutationFn: () => profileApi.sendOTP(initData!.requestRef, fullPhone),
    onSuccess: () => {
      toast.success('OTP sent successfully!');
      setStep(3);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send OTP')
  });

  const confirmOtpMutation = useMutation({
    mutationFn: () => profileApi.confirmOTP(initData!.requestRef, otp),
    onSuccess: () => {
      toast.success('Identity verified successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      // Update local storage user
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.nin_verified = true;
      localStorage.setItem('user', JSON.stringify(storedUser));
      setStep(4);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Invalid OTP')
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 flex">
          <div className={`h-full bg-primary-600 transition-all duration-500 ${step === 1 ? 'w-1/4' : step === 2 ? 'w-2/4' : step === 3 ? 'w-3/4' : 'w-full'}`} />
        </div>

        <div className="p-8 md:p-12">
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mx-auto mb-4">
                  <Shield size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Verify Your Identity</h1>
                <p className="text-gray-500 mt-2">Enter your 11-digit National Identification Number (NIN) to get started.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">NIN Number</label>
                  <input 
                    type="text" 
                    maxLength={11}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all font-mono tracking-widest text-lg"
                    placeholder="00000000000"
                    value={nin}
                    onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <input 
                    type="checkbox" 
                    id="consent"
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600 leading-tight cursor-pointer">
                    I hereby give my consent to Micro Fams to verify my identity using my National Identification Number (NIN) against government records.
                  </label>
                </div>

                <button 
                  onClick={() => initiateMutation.mutate()}
                  disabled={nin.length !== 11 || !consent || initiateMutation.isPending}
                  className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {initiateMutation.isPending ? 'Checking records...' : 'Verify NIN'}
                  {!initiateMutation.isPending && <ArrowRight size={20} />}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <Smartphone size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Phone Verification</h1>
                <p className="text-gray-500 mt-2">We found a registered phone number: <span className="font-bold text-gray-900">{initData?.maskedPhone}</span></p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Enter Full Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all text-lg"
                    placeholder="08030000000"
                    value={fullPhone}
                    onChange={(e) => setFullPhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">Must match the registered number on your NIN profile.</p>
                </div>

                <button 
                  onClick={() => sendOtpMutation.mutate()}
                  disabled={!fullPhone || sendOtpMutation.isPending}
                  className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {sendOtpMutation.isPending ? 'Sending OTP...' : 'Confirm & Send OTP'}
                </button>
                <button onClick={() => setStep(1)} className="w-full text-gray-500 text-sm font-medium">Use different NIN</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mx-auto mb-4">
                  <Key size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Enter OTP</h1>
                <p className="text-gray-500 mt-2">Enter the 6-digit code sent to your phone number.</p>
              </div>

              <div className="space-y-4">
                <input 
                  type="text" 
                  maxLength={6}
                  className="w-full px-4 py-4 rounded-xl border-2 border-gray-100 focus:border-primary-500 outline-none transition-all font-mono tracking-[1em] text-center text-3xl"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />

                <button 
                  onClick={() => confirmOtpMutation.mutate()}
                  disabled={otp.length < 4 || confirmOtpMutation.isPending}
                  className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {confirmOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button 
                  onClick={() => sendOtpMutation.mutate()} 
                  disabled={sendOtpMutation.isPending}
                  className="w-full text-primary-600 text-sm font-bold"
                >
                  Resend Code
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-8 animate-bounce-in">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
                <CheckCircle size={48} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Verification Complete!</h1>
                <p className="text-gray-500 mt-2 leading-relaxed">Your identity has been successfully verified. Your profile has been updated with your official records.</p>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors"
              >
                Go to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
