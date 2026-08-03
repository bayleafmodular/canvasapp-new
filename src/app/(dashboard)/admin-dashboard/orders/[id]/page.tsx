"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useState, useEffect } from 'react';
import { useRouter as useNavigate, useParams } from 'next/navigation';

import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { getAdminOrders, getAdminOrderById, updateAdminOrderStatus } from '@/services/api';
import { ClipboardList } from 'lucide-react';
import OrderTable from '@/components/orders/OrderTable';
import OrderDetails from '@/components/orders/OrderDetails';

function ManageOrders_Inner() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalCount, setTotalCount] = useState(0);

  const navigate = useNavigate();
  const { id } = useParams() as { id: string };

  const selectedOrder = orders.find(order => order.id === id) || null;
  const hasIdParam = Boolean(id);

  // Load orders from database
  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      try {
        setLoading(true);
        if (hasIdParam) {
          const res = await getAdminOrderById(id);
          if (!cancelled) {
            const orderData = res.data.data || res.data;
            setOrders([orderData]);
            setError(null);
          }
        } else {
          const res = await getAdminOrders({
            page: currentPage,
            limit: 10,
            search: searchTerm,
            status: statusFilter
          });
          if (!cancelled) {
            const dataArray = res.data.data || res.data;
            const totalVal = res.data.total !== undefined ? res.data.total : dataArray.length;
            setOrders(dataArray);
            setTotalCount(totalVal);
            setError(null);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to load orders:", err);
          setError(err.response?.data?.message || "Failed to load orders.");
          toast.error("Failed to load orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    loadOrders();
    return () => { cancelled = true; };
  }, [currentPage, searchTerm, statusFilter, hasIdParam, id]);

  // Handle order status change in database (includes status & remarks)
  const handleStatusChange = async (orderId: string, newStatus: string, remarks: string) => {
    setUpdatingId(orderId);
    try {
      const res = await updateAdminOrderStatus(orderId, newStatus, remarks);
      setOrders(prev => prev.map(order =>
        order.id === orderId ? res.data : order
      ));
      toast.success(`Order updated successfully`);
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {!hasIdParam ? (
          <>
            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Drawing Orders</h2>
                  <p className="text-gray-500 text-sm mt-0.5">Manage and review blueprints ordered by customers.</p>
                </div>
              </div>
            </div>

            {/* Reusable Order Table */}
            <OrderTable
              orders={orders}
              loading={loading}
              error={error}
              isAdmin={true}
              onView={(order: any) => navigate.push(`/admin-dashboard/orders/${order.id}`)}
              totalCount={totalCount}
              currentPage={currentPage}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              onPageChange={(page) => setCurrentPage(page)}
              onSearchChange={(search) => { setSearchTerm(search); setCurrentPage(1); }}
              onStatusFilterChange={(status) => { setStatusFilter(status); setCurrentPage(1); }}
            />
          </>
        ) : (
          /* Reusable Detailed View */
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
                onClick={() => navigate.push('/admin-dashboard/orders')}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Back to Orders List
              </button>
            </div>
          ) : (
            <OrderDetails
              order={selectedOrder}
              isAdmin={true}
              onBack={() => navigate.push('/admin-dashboard/orders')}
              onStatusChange={handleStatusChange}
              updating={updatingId === selectedOrder.id}
            />
          )
        )}
      </div>
    </Layout>
  );
}


export default function ManageOrders() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff']}>
      <ManageOrders_Inner />
    </PrivateRoute>
  );
}
