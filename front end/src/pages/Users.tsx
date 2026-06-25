import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { useDataStore, toast } from '@/store';
import { Plus, Edit2, Trash2, Key, Shield, UserCheck, Loader2 } from 'lucide-react';
import { User } from '@/types';

type FormData = {
  username: string;
  name: string;
  role: 'admin' | 'executive' | 'sales' | 'agent';
  password?: string;
};

const renderRoleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return <span className="px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 rounded-full border border-red-200">Admin</span>;
    case 'executive':
      return <span className="px-2 py-0.5 text-xs font-semibold bg-brand-50 text-brand-700 rounded-full border border-brand-200">Executive</span>;
    case 'agent':
      return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 rounded-full border border-amber-200">Clearing Agent</span>;
    default:
      return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">Sales</span>;
  }
};

export default function Users() {
  const { users, currentUser, fetchUsers, addUser, updateUser, deleteUser, loading } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { username: '', name: '', role: 'sales', password: '' }
  });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Shield className="w-16 h-16 text-red-500 mb-4 animate-pulse" />
        <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
        <p className="text-slate-500 max-w-md mt-2">
          Only administrators with root authorization can access the User Priorities management interface.
        </p>
      </div>
    );
  }

  const openAdd = () => {
    setEditingUser(null);
    reset({ username: '', name: '', role: 'sales', password: '' });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    reset({
      username: u.username,
      name: u.name,
      role: u.role,
      password: ''
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setActionLoading(true);
    try {
      if (editingUser) {
        // password optional for edit
        const payload: any = { username: data.username, name: data.name, role: data.role };
        if (data.password && data.password.trim() !== '') {
          payload.password = data.password;
        }
        await updateUser(editingUser.id, payload);
        toast.success('User updated successfully');
      } else {
        if (!data.password || data.password.trim() === '') {
          toast.error('Password is required for new users');
          setActionLoading(false);
          return;
        }
        await addUser(data as any);
        toast.success('User registered successfully');
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (u: User) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete user ${u.name}. This cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(u.id);
        toast.success('User deleted successfully');
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900">User Priorities Management</h2>
          <p className="text-slate-500 text-sm">Create and modify system authentication profiles</p>
        </div>
        <button onClick={openAdd} className="btn btn-brand flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="card flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
          <table className="table w-full relative">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>System Priority</th>
                <th>Date Created</th>
                <th className="w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading system users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{u.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-xs">{u.username}</td>
                    <td>
                      {renderRoleBadge(u.role)}
                    </td>
                    <td className="text-slate-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-right space-x-1">
                      <button onClick={() => openEdit(u)} className="p-1 text-slate-500 hover:text-brand-600 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {u.username !== 'admin' && (
                        <button onClick={() => handleDelete(u)} className="p-1 text-slate-500 hover:text-red-600 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-600" />
                {editingUser ? 'Edit User Credentials' : 'Add New System Profile'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Full Name</label>
                <input
                  {...register('name', { required: 'Full name is required' })}
                  type="text"
                  placeholder="e.g. Dileeka Bandara"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-brand-500 focus:bg-white transition"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">Username</label>
                <input
                  {...register('username', { required: 'Username is required' })}
                  type="text"
                  disabled={editingUser?.username === 'admin'}
                  placeholder="e.g. db_sales"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-brand-500 focus:bg-white transition disabled:bg-slate-100 disabled:text-slate-500"
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">
                  Password {editingUser && '(Leave blank to keep current)'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-brand-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase">System Priority Role</label>
                <select
                  {...register('role')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-sm outline-none focus:border-brand-500 focus:bg-white transition"
                >
                  <option value="admin">Administrator (Root Controls)</option>
                  <option value="executive">Executive (Logistics & Split)</option>
                  <option value="sales">Sales (Quotations & Invoicing)</option>
                  <option value="agent">Clearing Agent (Invoices View Only)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-brand flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
