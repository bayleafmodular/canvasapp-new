"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { getAdminStats, getPricingSettings, updatePricingSettings } from '@/services/api';
import { DEFAULT_PRICING, PRICE_FIELD_DEFS } from '@/utils/pricing';

function AdminDashboard_Inner() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricing, setPricing] = useState<any>(DEFAULT_PRICING);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingSaving, setPricingSaving] = useState(false);
  const role = localStorage.getItem('role');
  const permissions = JSON.parse(localStorage.getItem('permissions') || '{}');
  const canEditPricing = role === 'admin' || permissions['pricing.edit'];

  useEffect(() => {
    getAdminStats()
      .then((res) => setStats(res.data))
      .catch(() => setError('Failed to load stats'))
      .finally(() => setLoading(false));

    getPricingSettings()
      .then((res) => setPricing(res.data))
      .catch(() => toast.error('Failed to load pricing settings'))
      .finally(() => setPricingLoading(false));
  }, []);

  const updateRate = (key: string, value: any) => {
    setPricing((prev: any) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [key]: value,
      },
    }));
  };

  const savePricing = async (event: React.FormEvent) => {
    event.preventDefault();
    setPricingSaving(true);
    try {
      const payload = {
        currency: pricing.currency,
        rates: Object.fromEntries(
          PRICE_FIELD_DEFS.map(({ key }) => [key, Number(pricing.rates[key]) || 0])
        ),
      };
      const res = await updatePricingSettings(payload);
      setPricing(res.data);
      toast.success('Pricing settings updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update pricing settings');
    } finally {
      setPricingSaving(false);
    }
  };

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers, bg: 'bg-blue-500' },
    { label: 'Active Users', value: stats?.activeUsers, bg: 'bg-green-500' },
    { label: 'Staff Count', value: stats?.staffCount, bg: 'bg-purple-500' },
  ];

  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {role === 'admin'
              ? 'Full system access — manage users, roles, and platform settings.'
              : 'Staff member access — view stats, manage users, and platform settings.'}
          </p>
        </div>

        {/* Stats */}
        {error ? (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map(({ label, value, bg }) => (
              <div key={label} className={`${bg} rounded-xl shadow-md p-5 text-white`}>
                <p className="text-sm font-medium opacity-80">{label}</p>
                <p className="text-4xl font-bold mt-1">
                  {loading ? '...' : value ?? '0'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Recent Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 uppercase text-xs tracking-wide">
                  <th className="pb-3 pr-6">Name</th>
                  <th className="pb-3 pr-6">Email</th>
                  <th className="pb-3 pr-6">Role</th>
                  <th className="pb-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-sm">Loading...</td></tr>
                ) : stats?.recentUsers?.length ? (
                  stats.recentUsers.map((u: any) => (
                    <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-6 font-medium text-gray-700">{u.name}</td>
                      <td className="py-3 pr-6 text-gray-500">{u.email}</td>
                      <td className="py-3 pr-6">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize
                          ${u.role === 'admin' ? 'bg-red-100 text-red-600' :
                            u.role === 'staff' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-indigo-100 text-indigo-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="py-4 text-center text-gray-400 text-sm">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={savePricing} className="bg-white rounded-xl shadow-md p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-700">Canvas Pricing</h3>
            <p className="text-gray-500 text-sm mt-1">Rates used when users click Show Price inside the canvas app.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <input
                value={pricing.currency}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPricing((prev: any) => ({ ...prev, currency: event.target.value }))}
                disabled={pricingLoading || pricingSaving || !canEditPricing}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {PRICE_FIELD_DEFS.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} rate</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.rates?.[field.key] ?? 0}
                  onChange={(event) => updateRate(field.key, event.target.value)}
                  disabled={pricingLoading || pricingSaving || !canEditPricing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400 mt-1">{field.unit}</p>
              </div>
            ))}
          </div>

          {canEditPricing ? (
            <button
              type="submit"
              disabled={pricingLoading || pricingSaving}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {pricingSaving ? 'Saving...' : 'Save Pricing'}
            </button>
          ) : (
            <p className="text-sm text-gray-500">You can view pricing, but need pricing edit permission to update it.</p>
          )}
        </form>

      </div>
    </Layout>
  );
}


export default function AdminDashboard() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff']} requiredPermission="dashboard.show">
      <AdminDashboard_Inner />
    </PrivateRoute>
  );
}
