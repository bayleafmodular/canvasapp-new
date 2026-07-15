"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { createStaffUser, getStaffUsers, updateStaffUser } from '@/services/api';
import { Search } from 'lucide-react';

const permissionGroups = [
  {
    label: 'Dashboard',
    permissions: [
      ['dashboard.show', 'Show'],
      ['dashboard.create', 'Create'],
      ['dashboard.edit', 'Edit'],
    ],
  },
  {
    label: 'Staff Users',
    permissions: [
      ['staff.show', 'Show'],
      ['staff.create', 'Create'],
      ['staff.edit', 'Edit'],
    ],
  },
  {
    label: 'All Users',
    permissions: [
      ['users.show', 'Show'],
      ['users.create', 'Create'],
      ['users.edit', 'Edit'],
    ],
  },
  {
    label: 'Pricing',
    permissions: [
      ['pricing.edit', 'Edit'],
    ],
  },
];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  permissions: {},
};

const getPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('permissions') || '{}');
  } catch {
    return {};
  }
};

const normalizePermissions = (permissions: any = {}) =>
  permissionGroups.reduce((acc: any, group) => {
    group.permissions.forEach(([key]) => {
      acc[key] = Boolean(permissions[key]);
    });
    return acc;
  }, {});

function PermissionGrid({ permissions, onChange, disabled }: { permissions: any; onChange: (key: string, value: boolean) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {permissionGroups.map((group) => (
        <div key={group.label} className="border border-gray-100 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">{group.label}</h4>
          <div className="space-y-2">
            {group.permissions.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm text-gray-600">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(permissions[key])}
                  disabled={disabled}
                  onChange={(event) => onChange(key, event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ManageStaff_Inner() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const role = localStorage.getItem('role');
  const permissions = getPermissions();
  const canCreate = role === 'admin' || permissions['staff.create'];
  const canEdit = role === 'admin' || permissions['staff.edit'];

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);
  const filteredStaff = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return staff;

    return staff.filter((user) =>
      [user.name, user.email].some((value) => value?.toLowerCase().includes(query))
    );
  }, [staff, searchTerm]);

  const loadStaff = () => {
    setLoading(true);
    getStaffUsers()
      .then((res) => setStaff(res.data))
      .catch((err: any) => toast.error(err.response?.data?.message || 'Failed to load staff'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const updateField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const updatePermission = (key: string, value: boolean) => {
    setForm((prev: any) => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: value },
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const editStaff = (user: any) => {
    if (!canEdit) return;
    setEditingId(user.id);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      permissions: normalizePermissions(user.permissions),
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (isEditing) {
        const res = await updateStaffUser(editingId!, {
          name: form.name,
          email: form.email,
          permissions: form.permissions,
        });
        setStaff((prev) => prev.map((item) => (item.id === editingId ? res.data : item)));
        toast.success('Staff permissions updated');
      } else {
        const res = await createStaffUser(form);
        setStaff((prev) => [res.data, ...prev]);
        toast.success('Staff user created');
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save staff user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Staff</h2>
          <p className="text-gray-500 text-sm mt-1">Create staff accounts and control which admin areas they can access.</p>
        </div>

        {(canCreate || canEdit) && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-gray-700">
                {isEditing ? 'Edit Staff Rights' : 'Create Staff User'}
              </h3>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Cancel edit
                </button>
              )}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  required={!isEditing}
                  disabled={isEditing}
                  placeholder={isEditing ? 'Password unchanged' : 'Min 6 characters'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                />
              </div>
            </div>

            <PermissionGrid permissions={form.permissions} onChange={updatePermission} disabled={saving} />

            <button
              type="submit"
              disabled={saving || (!isEditing && !canCreate) || (isEditing && !canEdit)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Staff'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <div className='pb-4 px-6'>
              <div className="relative mt-4 max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(event.target.value)}
                  placeholder="Search staff by name or email"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-400 uppercase text-xs tracking-wide">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Permissions</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading...</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No staff users found</td></tr>
                ) : filteredStaff.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">No matching staff users found</td></tr>
                ) : filteredStaff.map((user) => {
                  const allowed = Object.entries(user.permissions || {}).filter(([, value]) => value).length;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700">{user.name}</td>
                      <td className="px-6 py-4 text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 text-gray-500">{allowed} enabled</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => editStaff(user)}
                          disabled={!canEdit}
                          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                        >
                          Edit rights
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}


export default function ManageStaff() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff']} requiredPermission="staff.show">
      <ManageStaff_Inner />
    </PrivateRoute>
  );
}
