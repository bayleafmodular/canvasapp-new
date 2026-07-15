"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useState, useEffect } from 'react';
import { useRouter as useNavigate, useParams } from 'next/navigation';

import Layout from '@/components/layout/Layout';
import { getUserOrders } from '@/services/api';
import OrderTable from '@/components/orders/OrderTable';
import OrderDetails from '@/components/orders/OrderDetails';

function UserDashboard_Inner() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { id } = useParams() as { id: string };

  const selectedOrder = orders.find(order => order.id === id) || null;
  const hasIdParam = Boolean(id);

  useEffect(() => {
    let cancelled = false;
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getUserOrders();
        if (!cancelled) {
          setOrders(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load user orders:", err);
          setError(err.response?.data?.message || "Failed to load your orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => { cancelled = true; };
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        {!hasIdParam ? (
          <>
            {/* Welcome & Info */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
                <p className="text-gray-500 text-sm mt-1">Track status and review details of your submitted blueprints.</p>
              </div>
            </div>

            {/* Shared Order Table */}
            <OrderTable
              orders={orders}
              loading={loading}
              error={error}
              isAdmin={false}
              onView={(order: any) => navigate.push(`/user-dashboard/orders/${order.id}`)}
            />
          </>
        ) : (
          /* Shared Detailed View */
          loading ? (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex items-center justify-center min-h-[300px]">
              <div className="flex items-center gap-2 text-gray-500 font-medium animate-pulse">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Loading order details...
              </div>
            </div>
          ) : !selectedOrder ? (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 text-center py-12">
              <p className="text-gray-500 text-sm font-semibold">Order not found.</p>
              <button
                onClick={() => navigate.push('/user-dashboard')}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          ) : (
            <OrderDetails
              order={selectedOrder}
              isAdmin={false}
              onBack={() => navigate.push('/user-dashboard')}
              onStatusChange={() => { }}
              updating={false}
            />
          )
        )}
      </div>
    </Layout>
  );
}


export default function UserDashboard() {
  return (
    <PrivateRoute allowedRoles={['user']}>
      <UserDashboard_Inner />
    </PrivateRoute>
  );
}
