"use client";
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';

import { registerUser } from '@/services/api';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setServerError('');
    try {
      const res = await registerUser(data);
      setSuccess('OTP sent to your email!');
      setTimeout(() => navigate.push('/verify-email?email=' + encodeURIComponent(data.email)), 1000);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create an account</h2>

        {serverError && (
          <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2 mb-4">{serverError}</p>
        )}
        {success && (
          <p className="bg-green-50 text-green-600 text-sm rounded-lg px-4 py-2 mb-4">{success}</p>
        )}

        <GoogleAuthButton mode="user" disabled={loading} onError={setServerError} />

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-medium text-gray-400 uppercase">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              {...register('name', { required: 'Name is required' })}
              placeholder="Your name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{(errors.name as any).message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{(errors.email as any).message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              placeholder="Min 6 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{(errors.password as any).message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
