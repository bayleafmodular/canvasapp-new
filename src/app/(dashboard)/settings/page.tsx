"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import SupabaseMfaSection from '@/components/SupabaseMfaSection';
import { getMe, updatePassword, updateProfile } from '@/services/api';

function Settings_Inner() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    fullName: '',
    email: '',
    phone: '',
    profilePicUrl: '',
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    getMe()
      .then((res) => {
        setUser(res.data);
        setProfile({
          name: res.data.name || '',
          username: res.data.username || '',
          fullName: res.data.fullName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          profilePicUrl: res.data.profilePicUrl || '',
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const setProfileField = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const res = await updateProfile(profile);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user-profile-updated'));
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await updatePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your profile, password, login security, and connected accounts.</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-sm text-gray-400">Loading...</div>
        ) : (
          <>
            <form onSubmit={saveProfile} className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold overflow-hidden">
                  {profile.profilePicUrl ? (
                    <img src={profile.profilePicUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    profile.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-700">User Info</h3>
                  <p className="text-sm text-gray-500">Update account details shown across your dashboard.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    value={profile.name}
                    onChange={(event) => setProfileField('name', event.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    value={profile.username}
                    onChange={(event) => setProfileField('username', event.target.value)}
                    placeholder="username"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    value={profile.fullName}
                    onChange={(event) => setProfileField('fullName', event.target.value)}
                    placeholder="Full name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(event) => setProfileField('email', event.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    value={profile.phone}
                    onChange={(event) => setProfileField('phone', event.target.value)}
                    placeholder="+1 555 0100"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Pic URL</label>
                  <input
                    value={profile.profilePicUrl}
                    onChange={(event) => setProfileField('profilePicUrl', event.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </form>

            <form onSubmit={savePassword} className="bg-white rounded-xl shadow-md p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-gray-700">Change Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Google-only accounts can set a password here for email/password login.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPasswords((prev: any) => ({ ...prev, currentPassword: event.target.value }))}
                    placeholder="Required for password accounts"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPasswords((prev: any) => ({ ...prev, newPassword: event.target.value }))}
                    required
                    placeholder="Min 6 characters"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-medium transition-colors"
              >
                {savingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>

            <SupabaseMfaSection />

            {!user?.googleLinked && (
              <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-700">Google Sign-In</h3>
                  <p className="text-sm text-gray-500 mt-1">Connect the Google account that uses the same email address.</p>
                </div>
                <div className="max-w-sm">
                  <GoogleAuthButton mode="link" onError={(message) => toast.error(message)} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}


export default function Settings() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff', 'user']}>
      <Settings_Inner />
    </PrivateRoute>
  );
}
