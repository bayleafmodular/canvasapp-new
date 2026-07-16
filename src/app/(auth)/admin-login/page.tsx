"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

import { loginUser, verifyLoginTwoFactor } from '@/services/api';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function AdminLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [twoFactorOtp, setTwoFactorOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const completeLogin = ({ token, user }: { token: string; user: any }) => {
    if (!['admin', 'staff'].includes(user.role)) {
      setServerError('Access denied. Please use the user login page.');
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', user.role);
    localStorage.setItem('permissions', JSON.stringify(user.permissions || {}));

    if (user.role === 'admin') navigate.push('/admin-dashboard');
    else navigate.push(user.permissions?.['dashboard.show'] ? '/admin-dashboard' : '/staff-dashboard');
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await loginUser(data);
      if (res.data.requiresTwoFactor) {
        setTwoFactorEmail(res.data.email);
        return;
      }

      completeLogin(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong';
      const email = err.response?.data?.email;
      if (err.response?.status === 403 && email) {
        navigate.push('/verify-email?email=' + encodeURIComponent(email));
        return;
      }
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitTwoFactor = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setServerError('');
    try {
      const res = await verifyLoginTwoFactor({ email: twoFactorEmail, otp: twoFactorOtp });
      completeLogin(res.data);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="text-center mb-6">
          {/* <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl mx-auto mb-3">👑</div> */}
          <h2 className="text-2xl font-bold text-gray-800">Admin / Staff Login</h2>
          <p className="text-gray-500 text-sm mt-1">Restricted access — authorized person only</p>
        </div>

        {serverError && (
          <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{serverError}</p>
        )}

        {!twoFactorEmail && <GoogleAuthButton mode="admin" disabled={loading} onError={setServerError} />}

        {!twoFactorEmail && <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-400 uppercase">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>}

        {twoFactorEmail ? (
          <form onSubmit={submitTwoFactor} className="space-y-5">
            <p className="text-sm text-gray-500">Enter the 6-digit code sent to {twoFactorEmail}.</p>
            <input
              value={twoFactorOtp}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTwoFactorOtp(event.target.value)}
              maxLength={6}
              required
              placeholder="______"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center tracking-widest text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify 2FA'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
                placeholder="admin@example.com"
                className={`w-full border rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-indigo-400'
                  }`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{(errors.email as any).message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  placeholder="Your password"
                  className={`w-full border rounded-lg pl-3 pr-10 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${errors.password
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-400'
                    : 'border-gray-300 focus:ring-indigo-400'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{(errors.password as any).message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-indigo-500 hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {/* <p className="text-sm text-center text-gray-500 mt-6">
          Not an admin?{' '}
          <Link href="/login" className="text-indigo-500 hover:underline font-medium">User Login</Link>
        </p> */}
      </div>
    </div>
  );
}
