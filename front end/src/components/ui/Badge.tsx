import { InvoiceStatus } from '@/types';
import { CheckCircle2, Clock, CircleDot } from 'lucide-react';

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === 'paid') {
    return <span className="badge-paid"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
  }
  if (status === 'partial') {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700"><CircleDot className="w-3 h-3" /> Partial</span>;
  }
  return <span className="badge-pending"><Clock className="w-3 h-3" /> Pending</span>;
}
