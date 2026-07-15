"use client";
import { useEffect, useMemo, useState } from 'react';
import GoogleAuthButton from './GoogleAuthButton';
import { supabase, isSupabaseOAuthConfigured }  from '@/services/supabase';

const getVerifiedTotpFactor = (factors: any) =>
  factors?.totp?.find((factor: any) => factor.status === 'verified') || null;

export default function SupabaseMfaSection() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [verifiedFactor, setVerifiedFactor] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [code, setCode] = useState('');

  const qrCode = useMemo(() => enrollment?.totp?.qr_code || '', [enrollment]);
  const secret = useMemo(() => enrollment?.totp?.secret || '', [enrollment]);

  const loadMfaState = async () => {
    setLoading(true);
    setError('');

    try {
      if (!isSupabaseOAuthConfigured) {
        setError('Supabase Auth is not configured in the client environment.');
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase!.auth.getSession();
      if (sessionError) throw sessionError;

      setSession(sessionData.session);

      if (!sessionData.session) {
        setVerifiedFactor(null);
        return;
      }

      const { data, error: factorsError } = await supabase!.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      setVerifiedFactor(getVerifiedTotpFactor(data));
    } catch (err: any) {
      setError(err.message || 'Failed to load MFA settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMfaState();
  }, []);

  const beginEnrollment = async () => {
    setWorking(true);
    setError('');
    setCode('');

    try {
      const { data, error: enrollError } = await supabase!.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (enrollError) throw enrollError;
      setEnrollment(data);
    } catch (err: any) {
      setError(err.message || 'Could not start MFA enrollment.');
    } finally {
      setWorking(false);
    }
  };

  const verifyEnrollment = async (event: any) => {
    event.preventDefault();
    setWorking(true);
    setError('');

    try {
      if (!enrollment?.id) throw new Error('Start enrollment before verifying.');

      const { data: challengeData, error: challengeError } = await supabase!.auth.mfa.challenge({
        factorId: enrollment.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase!.auth.mfa.verify({
        factorId: enrollment.id,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) throw verifyError;

      setEnrollment(null);
      setCode('');
      await loadMfaState();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setWorking(false);
    }
  };

  const disableMfa = async () => {
    setWorking(true);
    setError('');

    try {
      if (!verifiedFactor?.id) throw new Error('No verified MFA factor found.');

      const { error: unenrollError } = await supabase!.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });

      if (unenrollError) throw unenrollError;

      setVerifiedFactor(null);
      await loadMfaState();
    } catch (err: any) {
      setError(err.message || 'Could not disable MFA.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-700">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-500 mt-1">
            Use an authenticator app to generate a 6-digit login code.
          </p>
        </div>

        {session && verifiedFactor && (
          <button
            onClick={disableMfa}
            disabled={working}
            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 text-sm font-medium transition-colors"
          >
            {working ? 'Disabling...' : 'Disable'}
          </button>
        )}

        {session && !verifiedFactor && !enrollment && (
          <button
            onClick={beginEnrollment}
            disabled={working}
            className="px-4 py-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-60 text-sm font-medium transition-colors"
          >
            {working ? 'Starting...' : 'Enable'}
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading MFA settings...</p>}

      {!loading && !session && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Supabase TOTP requires an active Supabase Auth session. Continue with Google to connect your account, then return here to enable MFA.
          </p>
          <div className="max-w-sm">
            <GoogleAuthButton mode="link" onError={setError} />
          </div>
        </div>
      )}

      {error && (
        <p className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-2">{error}</p>
      )}

      {session && verifiedFactor && (
        <p className="bg-green-50 text-green-600 text-sm rounded-lg px-4 py-2">
          MFA is enabled for this account.
        </p>
      )}

      {session && enrollment && (
        <form onSubmit={verifyEnrollment} className="space-y-5 border border-gray-100 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5">
            <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-center">
              {qrCode ? (
                <div dangerouslySetInnerHTML={{ __html: qrCode }} />
              ) : (
                <span className="text-sm text-gray-400">QR unavailable</span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700">Scan QR Code</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Scan this QR with Google Authenticator, 1Password, Authy, or another TOTP app.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manual Secret</label>
                <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm font-mono text-gray-700 break-all">
                  {secret || 'Secret unavailable'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-digit Code</label>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="______"
                  className="w-full max-w-xs border border-gray-300 rounded-lg px-3 py-2 text-center tracking-widest text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={working || code.length !== 6}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {working ? 'Verifying...' : 'Verify and Activate'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEnrollment(null);
                setCode('');
                setError('');
              }}
              disabled={working}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
