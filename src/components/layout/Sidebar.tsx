import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Tag, Car, FileText, Receipt, Gauge } from 'lucide-react';
import { cn } from '@/utils';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/make-models', label: 'Make Models', icon: Tag },
  { to: '/vehicle-models', label: 'Vehicle Models', icon: Car },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
];

interface Props { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: Props) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform lg:translate-x-0',
        'bg-gradient-to-b from-navy-900 to-navy-950 text-slate-100',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-lg">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">AutoSales</h1>
            <p className="text-xs text-slate-400">Sales Management</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
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

        <div className="absolute bottom-0 left-0 right-0 p-4 text-xs text-slate-500 border-t border-white/10">
          <p>© {new Date().getFullYear()} AutoSales</p>
          <p>v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
