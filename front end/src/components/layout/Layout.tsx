import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ToastContainer from '@/components/ui/Toast';
import { useDataStore } from '@/store';

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/make-models': 'Make Models',
  '/vehicle-models': 'Vehicle Models',
  '/quotations': 'Quotations',
  '/invoices': 'Invoices',
  '/logistics': 'Logistics & Vault',
  '/investors': 'Investors & Split',
  '/reports': 'Accounting & Reports',
  '/leads': 'CRM Leads',
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = titles[pathname] || 'D&N Automate';

  const fetchData = useDataStore((s) => s.fetchData);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
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
