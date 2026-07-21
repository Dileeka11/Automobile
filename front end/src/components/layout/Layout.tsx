import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastContainer from '@/components/ui/Toast';
import { useDataStore } from '@/store';

const titles: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/make-models': 'Make Models',
  '/admin/vehicle-models': 'Vehicle Models',
  '/admin/quotations': 'Quotations',
  '/admin/invoices': 'Invoices',
  '/admin/clearing-agents': 'Clearing Agents',
  '/admin/logistics': 'Logistics & Vault',
  '/admin/investors': 'Investors & Split',
  '/admin/reports': 'Accounting & Reports',
  '/admin/cashbook': 'Corporate Cashbook',
  '/admin/leads': 'CRM Leads',
  '/admin/users': 'User Priorities'
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = titles[pathname] || 'D&N Automart';

  const currentUser = useDataStore((s) => s.currentUser);
  const fetchData = useDataStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentUser?.role === 'agent' && pathname !== '/admin/clearing-agents') {
      navigate('/admin/clearing-agents', { replace: true });
    }
  }, [currentUser, pathname, navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-silver-100 via-brand-50/40 to-bluegray-100/50">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenu={() => setOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
