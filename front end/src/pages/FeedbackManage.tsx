import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { MessageSquareQuote, Check, Trash2, Undo2, Star, RefreshCw, MapPin } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { toast } from '@/store';
import { formatDate } from '@/utils';

const API = '/backend/api/feedback.php';

export interface Feedback {
  id: number;
  name: string;
  city: string | null;
  rating: number;
  message: string;
  isApproved: boolean;
  createdAt: string;
}

type View = 'pending' | 'approved';

const Stars = ({ value }: { value: number }) => (
  <span className="flex gap-0.5 text-amber-400">
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`w-3 h-3 ${n <= value ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} />
    ))}
  </span>
);

export default function FeedbackManage() {
  const [view, setView] = useState<View>('pending');
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [reading, setReading] = useState<Feedback | null>(null);

  const load = async (status: View) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}?status=${status}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setItems(await resp.json());
    } catch (e: any) {
      toast.error(e?.message || 'Could not load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(view); }, [view]);

  const setApproval = async (f: Feedback, isApproved: boolean) => {
    setBusyId(f.id);
    try {
      const resp = await fetch(`${API}?id=${f.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      // It moves to the other tab, so drop it from the current list
      setItems((list) => list.filter((x) => x.id !== f.id));
      toast.success(isApproved ? 'Published to the website' : 'Removed from the website');
    } catch (e: any) {
      toast.error(e?.message || 'Could not update the feedback');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (f: Feedback) => {
    const result = await Swal.fire({
      title: 'Delete this feedback?',
      text: `"${f.name}" — this cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it',
    });
    if (!result.isConfirmed) return;

    setBusyId(f.id);
    try {
      const resp = await fetch(`${API}?id=${f.id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setItems((list) => list.filter((x) => x.id !== f.id));
      toast.success('Feedback deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Could not delete the feedback');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-brand-600" />
            Feedback Manage
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Approve what visitors send in. Only approved feedback appears on the home page.
          </p>
        </div>
        <button onClick={() => load(view)} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Pending ⇄ Published switch */}
      <div className="inline-flex bg-slate-100 border border-slate-200 rounded-xl p-1">
        <button
          onClick={() => setView('pending')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            view === 'pending' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Waiting for approval
        </button>
        <button
          onClick={() => setView('approved')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
            view === 'approved' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Showing on the website
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500 italic p-6">Loading feedback...</p>
        ) : items.length === 0 ? (
          <EmptyState
            title={view === 'pending' ? 'Nothing waiting' : 'Nothing published yet'}
            message={
              view === 'pending'
                ? 'New feedback from the website shows up here for approval.'
                : 'Approve feedback from the other tab and it appears on the home page.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Rating</th>
                  <th>Feedback</th>
                  <th>Received</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <div className="font-semibold text-slate-800">{f.name}</div>
                      {f.city && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {f.city}
                        </div>
                      )}
                    </td>
                    <td><Stars value={f.rating} /></td>
                    <td className="max-w-md">
                      <p className="text-xs text-slate-600 line-clamp-2">{f.message}</p>
                      {f.message.length > 120 && (
                        <button
                          onClick={() => setReading(f)}
                          className="text-[11px] font-semibold text-brand-600 hover:underline"
                        >
                          Read full
                        </button>
                      )}
                    </td>
                    <td className="text-slate-500 text-xs whitespace-nowrap">{formatDate(f.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        {view === 'pending' ? (
                          <button
                            onClick={() => setApproval(f, true)}
                            disabled={busyId === f.id}
                            title="Approve and show on the website"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => setApproval(f, false)}
                            disabled={busyId === f.id}
                            title="Take it off the website"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-600 text-xs font-semibold transition"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Remove from site
                          </button>
                        )}
                        <button
                          onClick={() => remove(f)}
                          disabled={busyId === f.id}
                          title="Delete permanently"
                          className="p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!reading} onClose={() => setReading(null)} title={`Feedback — ${reading?.name ?? ''}`} size="md">
        {reading && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Stars value={reading.rating} />
              <span className="text-xs text-slate-500">{formatDate(reading.createdAt)}</span>
            </div>
            {reading.city && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {reading.city}
              </p>
            )}
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{reading.message}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
