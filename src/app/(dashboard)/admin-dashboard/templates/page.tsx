"use client";
import PrivateRoute from '@/components/PrivateRoute';
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter as useNavigate } from 'next/navigation';
import Link from 'next/link';

import Layout from '@/components/layout/Layout';
import { getTemplates, deleteTemplate, updateTemplate } from '@/services/templateApi';
import { Plus, Search, Filter, MoreVertical, Edit2, Eye, EyeOff, Trash2, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import TemplatePreview from '@/components/TemplatePreview';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

const getPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('permissions') || '{}');
  } catch {
    return {};
  }
};

function ManageTemplates_Inner() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const role = localStorage.getItem('role');
  const permissions = getPermissions();
  const canCreate = role === 'admin' || permissions['templates.create'];
  const canEdit = role === 'admin' || permissions['templates.edit'];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await getTemplates();
      setTemplates(res.data);
    } catch (err: any) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (template: any) => {
    const newStatus = template.status === 'active' ? 'hidden' : 'active';
    try {
      await updateTemplate(template.id, { status: newStatus });
      setTemplates((prev: any) => prev.map((t: any) => t.id === template.id ? { ...t, status: newStatus } : t));
      toast.success(`Template marked as ${newStatus}`);
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteClick = (template: any) => {
    setTemplateToDelete(template);
  };

  const executeDelete = async () => {
    if (!templateToDelete) return;
    setIsDeleting(true);
    try {
      await deleteTemplate(templateToDelete.id);
      setTemplates((prev: any) => prev.filter((t: any) => t.id !== templateToDelete.id));
      toast.success('Template deleted');
      setTemplateToDelete(null);
    } catch (err: any) {
      toast.error('Failed to delete template');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    return templates.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || (t.category || 'Uncategorized').toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, searchQuery, statusFilter, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category || 'Uncategorized'));
    return Array.from(cats);
  }, [templates]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Templates</h2>
            <p className="text-gray-500 text-sm mt-1">Create, edit, and organize canvas templates.</p>
          </div>
          {canCreate && (
            <Link
              href="/admin-dashboard/templates/new"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Add Template
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full md:w-40"
            >
              <option value="all">All Categories</option>
              {uniqueCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-full md:w-40"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Template</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Objects</th>
                  <th className="px-6 py-4 text-center">Layers</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Updated</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">Loading templates...</td>
                  </tr>
                ) : filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                      No templates found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map(template => (
                    <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center shrink-0 p-1 overflow-hidden">
                            <TemplatePreview objects={template.objects} strokeColor="#6366f1" className="w-full h-full" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{template.name}</p>
                            <p className="text-xs text-gray-400 truncate max-w-xs">{template.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {template.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-gray-500">
                        {template.objects?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-gray-500">
                        {template.layers?.length || 0}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => canEdit && handleToggleStatus(template)}
                          disabled={!canEdit}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            !canEdit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                            template.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 cursor-pointer'
                            }`}
                        >
                          {template.status === 'active' ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(template)}
                            disabled={!canEdit}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                            title={template.status === 'active' ? 'Hide Template' : 'Show Template'}
                          >
                            {template.status === 'active' ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          {canEdit ? (
                            <Link
                              href={`/admin-dashboard/templates/${template.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 text-gray-300 cursor-not-allowed"
                              title="Edit (Requires Permission)"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
                           <button
                            onClick={() => handleDeleteClick(template)}
                            disabled={!canEdit}
                            className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!templateToDelete}
        title="Delete Template"
        itemName={templateToDelete?.name || ''}
        onConfirm={executeDelete}
        onCancel={() => setTemplateToDelete(null)}
        isDeleting={isDeleting}
      />
    </Layout>
  );
}


export default function ManageTemplates() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff']} requiredPermission="templates.show">
      <ManageTemplates_Inner />
    </PrivateRoute>
  );
}
