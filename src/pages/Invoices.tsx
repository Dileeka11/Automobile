import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, Eye, Printer, Receipt, CheckCircle2 } from 'lucide-react';
import { useDataStore, toast, vehicleTotal } from '@/store';
import { Invoice } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils';
import { InvoicePDFViewer, downloadInvoicePDF } from '@/components/pdf/InvoicePDF';

const schema = z.object({
  quotationId: z.string().min(1, 'Select a quotation'),
  ttAmount: z.coerce.number().min(0),
  advanceAmount: z.coerce.number().min(0),
  status: z.enum(['pending', 'paid']),
});
type FormData = z.infer<typeof schema>;

export default function Invoices() {
  const { invoices, quotations, vehicleModels, makeModels, addInvoice, updateInvoice, deleteInvoice } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [query, setQuery] = useState('');

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quotationId: '', ttAmount: 0, advanceAmount: 0, status: 'pending' },
  });

  const selectedQId = useWatch({ control, name: 'quotationId' });
  const advance = useWatch({ control, name: 'advanceAmount' }) || 0;

  const selectedQuotation = useMemo(() => quotations.find((q) => q.id === selectedQId), [quotations, selectedQId]);
  const selectedVehicle = useMemo(() => vehicleModels.find((v) => v.id === selectedQuotation?.vehicleModelId), [vehicleModels, selectedQuotation]);
  const selectedMake = useMemo(() => makeModels.find((m) => m.id === selectedQuotation?.makeModelId), [makeModels, selectedQuotation]);
  const total = selectedVehicle ? vehicleTotal(selectedVehicle) : 0;
  const balance = Math.max(0, total - Number(advance || 0));

  const openAdd = () => { reset({ quotationId: '', ttAmount: 0, advanceAmount: 0, status: 'pending' }); setModalOpen(true); };

  const handleQuotationChange = (qId: string) => {
    setValue('quotationId', qId);
    const q = quotations.find((x) => x.id === qId);
    const v = vehicleModels.find((vm) => vm.id === q?.vehicleModelId);
    if (v) setValue('ttAmount', v.ttAmount);
  };

  const onSubmit = (data: FormData) => {
    if (!selectedVehicle) { toast.error('Invalid quotation'); return; }
    addInvoice({
      quotationId: data.quotationId,
      ttAmount: data.ttAmount,
      advanceAmount: data.advanceAmount,
      balance: Math.max(0, vehicleTotal(selectedVehicle) - data.advanceAmount),
      status: data.status,
    });
    toast.success('Invoice created');
    setModalOpen(false);
  };

  const filtered = invoices.filter((i) => {
    const q = quotations.find((x) => x.id === i.quotationId);
    return (`${i.id} ${q?.name || ''} ${q?.id || ''}`).toLowerCase().includes(query.toLowerCase());
  });

  const handlePrint = async (i: Invoice) => {
    const q = quotations.find((x) => x.id === i.quotationId);
    const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
    const m = makeModels.find((x) => x.id === q?.makeModelId);
    if (!q || !v || !m) { toast.error('Missing data'); return; }
    await downloadInvoicePDF({ invoice: i, quotation: q, vehicle: v, make: m });
    toast.success('PDF downloaded');
  };

  const togglePaid = (i: Invoice) => {
    updateInvoice(i.id, { status: i.status === 'paid' ? 'pending' : 'paid' });
    toast.success(`Marked as ${i.status === 'paid' ? 'pending' : 'paid'}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoices..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> New Invoice</button>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? <EmptyState title="No invoices" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Invoice</th><th>Quotation</th><th>Customer</th><th>Advance</th><th>Balance</th><th>Status</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((i) => {
                  const q = quotations.find((x) => x.id === i.quotationId);
                  return (
                    <tr key={i.id}>
                      <td className="font-mono text-xs">{i.id}</td>
                      <td className="font-mono text-xs text-slate-500">{i.quotationId}</td>
                      <td className="font-medium">{q?.name || '—'}</td>
                      <td>{formatCurrency(i.advanceAmount)}</td>
                      <td className="font-semibold">{formatCurrency(i.balance)}</td>
                      <td><StatusBadge status={i.status} /></td>
                      <td className="text-slate-500">{formatDate(i.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => togglePaid(i)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Toggle paid"><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => setViewing(i)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handlePrint(i)} className="p-2 rounded-lg hover:bg-brand-50 text-brand-600" title="Print"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => setToDelete(i)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Invoice" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Select Quotation</label>
            <select className="input" value={selectedQId} onChange={(e) => handleQuotationChange(e.target.value)}>
              <option value="">— Choose a quotation —</option>
              {quotations.map((q) => <option key={q.id} value={q.id}>{q.id} — {q.name}</option>)}
            </select>
            {errors.quotationId && <p className="text-xs text-red-600 mt-1">{errors.quotationId.message}</p>}
          </div>

          {selectedQuotation && selectedVehicle && selectedMake && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-slate-500">Customer:</span> <span className="font-medium">{selectedQuotation.name}</span></div>
                <div><span className="text-slate-500">NIC:</span> <span className="font-medium">{selectedQuotation.nic}</span></div>
                <div><span className="text-slate-500">Mobile:</span> <span className="font-medium">{selectedQuotation.mobileNo}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium">{selectedQuotation.email}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Vehicle:</span> <span className="font-medium">{selectedMake.name} {selectedVehicle.name} — {selectedVehicle.year} {selectedVehicle.color}</span></div>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Total Vehicle Cost</span>
                <span className="font-bold text-brand-700">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">TT Amount (LKR)</label>
              <input type="number" step="0.01" {...register('ttAmount')} className="input" />
            </div>
            <div>
              <label className="label">Advance Amount (LKR)</label>
              <input type="number" step="0.01" {...register('advanceAmount')} className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium">Balance</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency(balance)}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={!selectedQuotation}><Receipt className="w-4 h-4" /> Save Invoice</button>
          </div>
        </form>
      </Modal>

      {viewing && (() => {
        const q = quotations.find((x) => x.id === viewing.quotationId);
        const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
        const m = makeModels.find((x) => x.id === q?.makeModelId);
        return (
          <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Invoice ${viewing.id}`} size="xl">
            {q && v && m ? <InvoicePDFViewer invoice={viewing} quotation={q} vehicle={v} make={m} /> : <p>Missing data</p>}
          </Modal>
        );
      })()}

      <ConfirmDialog
        open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { deleteInvoice(toDelete.id); toast.success('Invoice deleted'); } }}
        message={`Delete invoice "${toDelete?.id}"?`}
      />
    </div>
  );
}
