import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No data', message }: { title?: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Inbox className="w-12 h-12 mb-3" />
      <p className="font-medium text-slate-600">{title}</p>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
