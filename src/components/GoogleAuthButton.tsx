"use client";

import React from 'react';
import { supabase, isSupabaseOAuthConfigured } from '@/services/supabase';

interface GoogleAuthButtonProps {
  mode?: 'user' | 'admin' | 'link';
  disabled?: boolean;
  onError?: (message: string) => void;
}

export default function GoogleAuthButton({ 
  mode = 'user', 
  disabled = false, 
  onError 
}: GoogleAuthButtonProps) {
  const handleGoogleAuth = async () => {
    if (!isSupabaseOAuthConfigured) {
      onError?.('Google login is not configured yet.');
      return;
    }

    const { error } = await supabase!.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?mode=${mode}`,
      },
    });

    if (error) onError?.(error.message);
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled}
      className="w-full border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-gray-700 font-medium py-2 rounded-lg transition-colors"
    >
      Continue with Google
    </button>
  );
}
