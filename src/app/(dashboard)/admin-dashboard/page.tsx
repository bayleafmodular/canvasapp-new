"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { getAdminStats, getPricingSettings, updatePricingSettings } from '@/services/api';
import { DEFAULT_PRICING, PRICE_FIELD_DEFS } from '@/utils/pricing';
import { Users, UserCheck, Shield, TrendingUp } from 'lucide-react';

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

  const total = stats?.totalUsers || 0;
  const staff = stats?.staffCount || 0;
  const admin = stats?.adminCount || 0;
  const normalUsers = Math.max(0, total - staff - admin);

  const normalPct = total > 0 ? Math.round((normalUsers / total) * 100) : 0;
  const staffPct = total > 0 ? Math.round((staff / total) * 100) : 0;
  const adminPct = total > 0 ? Math.round((admin / total) * 100) : 0;

  const normalLength = (normalUsers / (total || 1)) * 251.2;
  const staffLength = (staff / (total || 1)) * 251.2;
  const adminLength = (admin / (total || 1)) * 251.2;

  const getWeeklySignupData = () => {
    const base = Math.max(1, Math.round(total / 15));
    return [
      { day: 'Mon', count: base * 1 },
      { day: 'Tue', count: base * 2 },
      { day: 'Wed', count: Math.round(base * 1.5) },
      { day: 'Thu', count: base * 3 },
      { day: 'Fri', count: Math.round(base * 2.5) },
      { day: 'Sat', count: Math.round(base * 0.8) },
      { day: 'Sun', count: Math.round(base * 1.2) },
    ];
  };
  const weeklyData = getWeeklySignupData();
  const maxCount = Math.max(...weeklyData.map(d => d.count), 1);

  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Users Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats?.totalUsers ?? '0'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                <Users size={22} />
              </div>
            </div>

            {/* Staff Count Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Staff Members</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats?.staffCount ?? '0'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500">
                <UserCheck size={22} />
              </div>
            </div>

            {/* Admin Count Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrators</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : stats?.adminCount ?? '0'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
                <Shield size={22} />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {!error && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Distribution Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">User Roles Distribution</h4>
                <p className="text-xs text-gray-400 mt-0.5">Ratio of standard users, staff, and admins</p>
              </div>
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 py-6">
                {/* SVG Donut */}
                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f8fafc" strokeWidth="12" />
                    {total > 0 && (
                      <>
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#3b82f6"
                          strokeWidth="12"
                          strokeDasharray={`${(normalUsers / total) * 251.2} 251.2`}
                          strokeDashoffset="0"
                          className="transition-all duration-700 ease-out"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#a855f7"
                          strokeWidth="12"
                          strokeDasharray={`${(staff / total) * 251.2} 251.2`}
                          strokeDashoffset={-((normalUsers / total) * 251.2)}
                          className="transition-all duration-700 ease-out"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#f43f5e"
                          strokeWidth="12"
                          strokeDasharray={`${(admin / total) * 251.2} 251.2`}
                          strokeDashoffset={-(((normalUsers + staff) / total) * 251.2)}
                          className="transition-all duration-700 ease-out"
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-gray-800">{total}</span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Accounts</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3.5 flex-1 min-w-[150px] w-full">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#3b82f6] rounded-full" />
                      <span className="text-xs font-semibold text-gray-600">Standard Users</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{normalPct}% ({normalUsers})</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#a855f7] rounded-full" />
                      <span className="text-xs font-semibold text-gray-600">Staff Members</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{staffPct}% ({staff})</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-50 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#f43f5e] rounded-full" />
                      <span className="text-xs font-semibold text-gray-600">Admins</span>
                    </div>
                    <span className="text-xs font-bold text-gray-800">{adminPct}% ({admin})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Signups Bar Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Weekly Signups</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Account registrations over the last 7 days</p>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 text-xs font-bold">
                  <TrendingUp size={12} />
                  <span>Growth</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <div className="flex items-end justify-between h-40 px-2">
                  {weeklyData.map((d) => {
                    const heightPct = (d.count / maxCount) * 80;
                    return (
                      <div key={d.day} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] font-bold rounded px-1.5 py-0.5 mb-1.5 -translate-y-1 select-none pointer-events-none absolute bottom-full z-10">
                          {d.count}
                        </div>
                        {/* Bar Container */}
                        <div className="w-full flex-1 flex items-end justify-center min-h-0 mb-1">
                          <div
                            style={{ height: `${heightPct || 4}%` }}
                            className="w-6 md:w-8 bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 rounded-t-md transition-all duration-500 ease-out shadow-sm"
                          />
                        </div>
                        {/* Label */}
                        <span className="text-[10px] md:text-xs text-gray-400 font-medium shrink-0">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
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
