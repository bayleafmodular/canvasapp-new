"use client";
import { useState } from 'react';
import Link from 'next/link';

import { forgotPassword, resetPassword } from '@/services/api';

export default function ForgotPassword() {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await forgotPassword({ email });
      setMessage(res.data.message);
      setStep('reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset OTP');
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await resetPassword({ email, otp, newPassword });
      setMessage(res.data.message);
      setOtp('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
          <p className="text-gray-500 text-sm mt-1">Reset your password using an email OTP.</p>
        </div>

        {error && <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{error}</p>}
        {message && <p className="bg-green-50 text-green-600 text-sm rounded-lg px-4 py-2 mb-4">{message}</p>}

        {step === 'request' ? (
          <form onSubmit={requestOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitReset} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
              <input
                value={otp}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setOtp(event.target.value)}
                maxLength={6}
                required
                placeholder="______"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center tracking-widest text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setNewPassword(event.target.value)}
                required
                placeholder="Min 6 characters"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button
              type="button"
              onClick={() => setStep('request')}
              className="w-full text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Use a different email
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-500 mt-6">
          Remembered it?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
