import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDataStore, toast } from '@/store';
import { Gauge, KeyRound, User, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login() {
  const login = useDataStore((s) => s.login);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { username: '', password: '' }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await login(data.username, data.password);
      toast.success('Successfully logged in!');
      navigate('/admin');
    } catch (e: any) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: e.message || 'Invalid username or password',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#1a3a6e', // Brand Navy
        background: '#ffffff',
        customClass: {
          popup: 'rounded-2xl shadow-xl border border-slate-100',
          confirmButton: 'px-5 py-2.5 rounded-xl font-semibold text-sm transition',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-900 via-brand-900 to-navy-950 p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-bluegray-400/15 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-hero flex items-center justify-center shadow-lg shadow-brand-500/20 mb-4">
            <Gauge className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">D&N Automart</h1>
          <p className="text-slate-400 text-sm mt-1">Vehicle Import & Logistics Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register('username', { required: 'Username is required' })}
                type="text"
                autoComplete="off"
                placeholder="Enter username"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 transition"
              />
            </div>
            {errors.username && (
              <p className="text-xs text-red-400 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                {...register('password', { required: 'Password is required' })}
                type="password"
                autoComplete="new-password"
                placeholder="Enter password"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 transition"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-hero hover:opacity-95 text-white font-semibold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
