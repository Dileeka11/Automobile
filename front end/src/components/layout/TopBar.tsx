import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User, AlertTriangle } from 'lucide-react';
import { useDataStore } from '@/store';

interface Props { onMenu: () => void; title?: string; }

export default function TopBar({ onMenu, title }: Props) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { invoices, currentUser, logout } = useDataStore();
  const navigate = useNavigate();

  const reminders = useMemo(() => {
    const list: { id: string; invoiceId: string; type: 'lc' | 'tt'; message: string }[] = [];
    invoices.forEach((i) => {
      const days = Math.floor((new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 5) {
        if (!i.isLcComplete) {
          list.push({
            id: `${i.id}-lc`,
            invoiceId: i.id,
            type: 'lc',
            message: `Invoice ${i.id}: LC has not been opened. Remind to open LC within 2 days.`,
          });
        }
        if (!i.isTtComplete) {
          list.push({
            id: `${i.id}-tt`,
            invoiceId: i.id,
            type: 'tt',
            message: `Invoice ${i.id}: TT payment is not complete. Remind to collect TT payment.`,
          });
        }
      }
    });
    return list;
  }, [invoices]);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-4 px-4 sm:px-6 py-3">
        <button onClick={onMenu} className="lg:hidden p-2 rounded-lg hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg">
          <Search className="w-4 h-4 text-slate-400" />
          <input placeholder="Search..." className="bg-transparent text-sm outline-none w-48" />
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 relative focus:outline-none"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {reminders.length > 0 && (
              <span className="absolute top-1 right-1 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center min-w-[16px] h-[16px] animate-pulse">
                {reminders.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-150 z-50 overflow-hidden divide-y divide-slate-100">
                <div className="p-4 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-600" /> Notifications
                  </h3>
                  {reminders.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      {reminders.length} Pending
                    </span>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-150">
                  {reminders.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm">
                      No pending payment reminders.
                    </div>
                  ) : (
                    reminders.map((r) => (
                      <div key={r.id} className="p-4 hover:bg-slate-50 transition flex gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-amber-800">
                            {r.type === 'lc' ? 'LC Milestone Warning' : 'TT Milestone Warning'}
                          </p>
                          <p className="text-xs text-slate-600 leading-normal">{r.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center text-white focus:outline-none hover:opacity-90 transition relative"
          >
            <User className="w-5 h-5" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
              
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-150 z-50 overflow-hidden p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-600 font-semibold text-lg">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{currentUser?.name}</h4>
                    <p className="text-xs text-slate-500 truncate">@{currentUser?.username}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Priority Level:</span>
                    <span className="font-semibold capitalize text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                      {currentUser?.role}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                      navigate('/login');
                    }}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-lg transition"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
