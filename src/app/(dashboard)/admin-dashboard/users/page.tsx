"use client";
import PrivateRoute from '@/components/PrivateRoute';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';
import { createAdminUser, getAdminUsers, updateUserRole, deleteUser } from '@/services/api';
import { Trash2, AlertTriangle, Search } from 'lucide-react';

const roleBadge: Record<string, string> = {
  admin: 'bg-red-100 text-red-600',
  staff: 'bg-yellow-100 text-yellow-600',
  user: 'bg-indigo-100 text-indigo-600',
};

// decode JWT payload without a library
const getLoggedInId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return JSON.parse(atob(token.split('.')[1])).id;
  } catch {
    return null;
  }
};

const getPermissions = () => {
  try {
    return JSON.parse(localStorage.getItem('permissions') || '{}');
  } catch {
    return {};
  }
};

function DeleteModal({ user, onConfirm, onCancel, deleting }: { user: any; onConfirm: () => void; onCancel: () => void; deleting: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-800 text-center">Delete User</h3>
        <p className="text-sm text-gray-500 text-center mt-2">
          Are you sure you want to delete <span className="font-medium text-gray-700">{user.name}</span>? This action cannot be undone.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageUsers_Inner() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user' });
  const [searchTerm, setSearchTerm] = useState('');
  const loggedInId = getLoggedInId();
  const role = localStorage.getItem('role');
  const permissions = getPermissions();
  const canCreate = role === 'admin' || permissions['users.create'];
  const canEdit = role === 'admin' || permissions['users.edit'];
  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role].some((value) => value?.toLowerCase().includes(query))
    );
  }, [users, searchTerm]);

  useEffect(() => {
    getAdminUsers()
      .then((res) => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id: string, newRole: string) => {
    if (!canEdit) return;
    setUpdating(id);
    try {
      const res = await updateUserRole(id, newRole);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data : u)));
      toast.success('User role updated successfully');
    } catch {
      toast.error('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    try {
      const res = await createAdminUser(newUser);
      setUsers((prev) => [res.data, ...prev]);
      setNewUser({ name: '', email: '', password: '', role: 'user' });
      toast.success('User created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmUser) return;
    setDeleting(true);
    try {
      await deleteUser(confirmUser._id);
      setUsers((prev) => prev.filter((u) => u._id !== confirmUser._id));
      toast.success('User deleted successfully');
      setConfirmUser(null);
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Layout>
      {confirmUser && (
        <DeleteModal
          user={confirmUser}
          onConfirm={handleDelete}
          onCancel={() => setConfirmUser(null)}
          deleting={deleting}
        />
      )}
      <div className="space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Users</h2>
          <p className="text-gray-500 text-sm mt-1">View, update roles, and remove users from the platform.</p>
        </div>

        {/* Table */}
        {canCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-700">Create User</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                required
                placeholder="Email"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                required
                placeholder="Password"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {creating ? 'Creating...' : 'Create User'}
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
                  placeholder="Search users by name, email or role"
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-gray-400 uppercase text-xs tracking-wide">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Verified</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">Loading...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No users found</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No matching users found</td>
                  </tr>
                ) : filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">

                    {/* Name + avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-700">{u.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-gray-500">{u.email}</td>

                    {/* Role selector — clean pill style */}
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          value={u.role}
                          disabled={!canEdit || updating === u._id || u._id === loggedInId}
                          onChange={(e) => handleRoleChange(u._id, e.target.value)}
                          title={u._id === loggedInId ? 'You cannot change your own role' : ''}
                          className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold cursor-pointer
                            border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-300
                            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                            ${roleBadge[u.role]}`}
                        >
                          <option value="user">User</option>
                          <option value="staff">Staff</option>
                          <option value="admin">Admin</option>
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-current opacity-60 text-[10px]">▾</span>
                      </div>
                    </td>

                    {/* Verified */}
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${u.isVerified ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {u.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    {/* Delete */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setConfirmUser(u)}
                        disabled={!canEdit}
                        className="p-2 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}


export default function ManageUsers() {
  return (
    <PrivateRoute allowedRoles={['admin', 'staff']} requiredPermission="users.show">
      <ManageUsers_Inner />
    </PrivateRoute>
  );
}
