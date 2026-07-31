import React, { useState, useMemo } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';

export default function OrderTable({ orders, loading, error, isAdmin, onView }: { orders: any[]; loading: boolean; error: any; isAdmin: boolean; onView: (order: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
      const id = order.id || '';
      const customerName = order.customerName || '';
      const email = order.email || '';
      const productName = order.productName || '';
      const status = order.status || '';

      const matchesSearch =
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder={isAdmin ? "Search by Order ID, customer, email..." : "Search by Order ID, title..."}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full md:w-44 rounded-lg border border-gray-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="all">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="In Review">In Review</option>
            <option value="Processing">Processing</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID</th>
                {isAdmin ? (
                  <th className="px-6 py-4 font-semibold">Customer</th>
                ) : (
                  <th className="px-6 py-4 font-semibold">Order Name/Title</th>
                )}
                {isAdmin && <th className="px-6 py-4 font-semibold">Product Name</th>}
                {isAdmin && <th className="px-6 py-4 font-semibold">Total Price</th>}
                <th className="px-6 py-4 font-semibold">Created Date</th>
                {!isAdmin && <th className="px-6 py-4 font-semibold">Last Updated Date</th>}
                <th className="px-6 py-4 font-semibold">Current Status</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-gray-400 font-medium animate-pulse">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      Loading orders...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-red-500 font-medium">
                    {error}
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-10 text-center text-gray-400 font-medium">
                    {orders.length === 0 ? "You have no orders yet." : "No orders matched your search filters."}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-gray-800">{order.id}</td>
                    {isAdmin ? (
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-800">{order.customerName}</div>
                          <div className="text-xs text-gray-400">{order.email}</div>
                        </div>
                      </td>
                    ) : (
                      <td className="px-6 py-4 font-medium text-gray-800">{order.productName}</td>
                    )}
                    {isAdmin && <td className="px-6 py-4 font-medium text-gray-700">{order.productName}</td>}
                    {isAdmin && <td className="px-6 py-4 font-bold text-gray-800">{formatPrice(order.totalPrice)}</td>}
                    <td className="px-6 py-4 text-gray-500">{formatDate(order.orderDate || order.createdAt)}</td>
                    {!isAdmin && (
                      <td className="px-6 py-4 text-gray-500">{formatDate(order.updatedAt || order.orderDate || order.createdAt)}</td>
                    )}
                    <td className="px-6 py-4">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onView(order)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm shadow-indigo-100"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Showing Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span> ({filteredOrders.length} total orders)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
