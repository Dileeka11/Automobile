import { InvoiceStatus } from '@/types';
import { CheckCircle2, Clock } from 'lucide-react';

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === 'paid') {
    return <span className="badge-paid"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
  }
  return <span className="badge-pending"><Clock className="w-3 h-3" /> Pending</span>;
}
