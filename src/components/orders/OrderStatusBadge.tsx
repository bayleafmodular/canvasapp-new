import React from 'react';

const statusStyles: Record<string, string> = {
  Pending: 'bg-gray-50 text-gray-700 border-gray-200',
  'In Review': 'bg-blue-50 text-blue-800 border-blue-200',
  Processing: 'bg-blue-50 text-blue-800 border-blue-200',
  Approved: 'bg-green-50 text-green-800 border-green-200',
  Rejected: 'bg-red-50 text-red-800 border-red-200',
  Completed: 'bg-purple-50 text-purple-800 border-purple-200',
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const currentStatus = status || 'Pending';
  const styleClass = statusStyles[currentStatus] || 'bg-gray-50 text-gray-600 border-gray-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}>
      {currentStatus}
    </span>
  );
}
