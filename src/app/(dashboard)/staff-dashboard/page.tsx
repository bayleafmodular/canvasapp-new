"use client";
import PrivateRoute from '@/components/PrivateRoute';
import Layout from '@/components/layout/Layout';

const stats = [
  { label: 'Total Users', value: '—', bg: 'bg-yellow-500' },
  { label: 'Active Users', value: '—', bg: 'bg-green-500' },
];

const activities = [
  'User account updated',
  'New task assigned',
  'Report submitted',
  'Meeting scheduled',
];

function StaffDashboard_Inner() {
  return (
    <Layout>
      <div className="space-y-6">

        {/* Welcome */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800">Staff Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your tasks, track activity, and stay on top of your work.</p>
        </div>

        {/* Stats */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-xl shadow-md p-5 text-white`}>
              <p className="text-sm font-medium opacity-80">{label}</p>
              <p className="text-4xl font-bold mt-1">{value}</p>
            </div>
          ))}
        </div> */}

        {/* Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-semibold text-gray-700 mb-4">Recent Activity</h3>
          <ul className="space-y-3">
            {activities.map((item) => (
              <li key={item} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-sm text-gray-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </Layout>
  );
}


export default function StaffDashboard() {
  return (
    <PrivateRoute allowedRoles={['staff']}>
      <StaffDashboard_Inner />
    </PrivateRoute>
  );
}
