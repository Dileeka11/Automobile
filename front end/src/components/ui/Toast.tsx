import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store';
import { cn } from '@/utils';

const iconMap = { success: CheckCircle2, error: XCircle, info: Info };
const colorMap = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = iconMap[t.type];
        return (
          <div key={t.id} className={cn('flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md', colorMap[t.type])}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button onClick={() => remove(t.id)}><X className="w-4 h-4 opacity-60 hover:opacity-100" /></button>
          </div>
        );
      })}
    </div>
  );
}
