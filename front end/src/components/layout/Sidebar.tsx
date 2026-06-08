import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tag, Car, FileText, Receipt, Gauge, Ship, Landmark, BarChart3, BookOpen, Inbox, Users, LogOut, UserCheck } from 'lucide-react';
import { cn } from '@/utils';
import { useDataStore } from '@/store';

const baseLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/make-models', label: 'Make Models', icon: Tag },
  { to: '/admin/vehicle-models', label: 'Vehicle Models', icon: Car },
  { to: '/admin/quotations', label: 'Quotations', icon: FileText },
  { to: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { to: '/admin/clearing-agents', label: 'Clearing Agents', icon: UserCheck },
  // { to: '/admin/logistics', label: 'Logistics & Vault', icon: Ship }, // Temporarily locked
  // { to: '/admin/investors', label: 'Investors & Split', icon: Landmark }, // Temporarily locked
  // { to: '/admin/reports', label: 'Accounting & Reports', icon: BarChart3 }, // Temporarily locked
  { to: '/admin/cashbook', label: 'Corporate Cashbook', icon: BookOpen },
  { to: '/admin/leads', label: 'CRM Leads', icon: Inbox },
];

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  const { currentUser, logout } = useDataStore();
  const navigate = useNavigate();

  let links = [...baseLinks];
  if (currentUser?.role === 'agent') {
    links = baseLinks.filter((l) => l.to === '/admin/clearing-agents');
  } else if (currentUser?.role === 'admin') {
    links.push({ to: '/admin/users', label: 'User Priorities', icon: Users });
  }

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform lg:translate-x-0 flex flex-col',
        'bg-gradient-to-b from-navy-900 to-navy-950 text-slate-100',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10 flex-shrink-0">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-1">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">D&N Automate</h1>
            <p className="text-xs text-slate-400">Sales Management</p>
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto flex-1 mb-[160px]">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end} onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition',
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Card & Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-navy-950 flex flex-col gap-2.5">
          <div className="flex items-center gap-3 px-2 py-1.5 bg-white/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm">
              {currentUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
          <div className="text-[10px] text-slate-500 text-center">
            <p>© {new Date().getFullYear()} D&N Automate</p>
          </div>
        </div>
      </aside>
    </>
  );
}
