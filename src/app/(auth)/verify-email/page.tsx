"use client";
import { useState } from 'react';
import { useSearchParams, useRouter as useNavigate } from 'next/navigation';

import { useForm } from 'react-hook-form';
import { verifyOtp, resendOtp } from '@/services/api';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const onSubmit = async (data: any) => {
    const { otp } = data;
    setLoading(true);
    setServerError('');
    try {
      const res = await verifyOtp({ email, otp });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.user.role);
      localStorage.setItem('permissions', JSON.stringify(res.data.user.permissions || {}));
      const role = res.data.user.role;
      if (role === 'admin') navigate.push('/admin-dashboard');
      else if (role === 'staff') navigate.push(res.data.user.permissions?.['dashboard.show'] ? '/admin-dashboard' : '/staff-dashboard');
      else navigate.push('/user-dashboard');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    setServerError('');
    try {
      await resendOtp({ email });
      setResendMsg('A new OTP has been sent to your email.');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    navigate.push('/register');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Check your email</h2>
          <p className="text-gray-500 text-sm mt-1">
            We sent a 6-digit OTP to <span className="font-medium text-gray-700">{email}</span>
          </p>
        </div>

        {serverError && (
          <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{serverError}</p>
        )}
        {resendMsg && (
          <p className="bg-green-50 text-green-600 text-sm rounded-lg px-4 py-2 mb-4">{resendMsg}</p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter OTP</label>
            <input
              {...register('otp', {
                required: 'OTP is required',
                pattern: { value: /^\d{6}$/, message: 'OTP must be 6 digits' },
              })}
              placeholder="______"
              maxLength={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center tracking-widest text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.otp && <p className="text-red-500 text-xs mt-1">{(errors.otp as any).message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-5">
          Didn&apos;t receive it?{' '}
          <button
            onClick={handleResend}
            disabled={resending}
            className="text-indigo-600 hover:underline font-medium disabled:opacity-50"
          >
            {resending ? 'Resending...' : 'Resend OTP'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
