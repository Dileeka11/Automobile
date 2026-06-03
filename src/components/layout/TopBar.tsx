import { Menu, Bell, Search, User } from 'lucide-react';

interface Props { onMenu: () => void; title?: string; }

export default function TopBar({ onMenu, title }: Props) {
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

        <button className="p-2 rounded-lg hover:bg-slate-100 relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-hero flex items-center justify-center text-white">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
