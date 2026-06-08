import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, Eye, Printer, Receipt, CheckCircle2, Edit, AlertTriangle, Undo } from 'lucide-react';
import { useDataStore, toast, quotationTotal } from '@/store';
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
  isLcComplete: z.boolean().default(false),
  isTtComplete: z.boolean().default(false),
  etdDate: z.string().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

export default function Invoices() {
  const { invoices, quotations, vehicleModels, makeModels, addInvoice, updateInvoice, deleteInvoice } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [toDelete, setToDelete] = useState<Invoice | null>(null);
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [query, setQuery] = useState('');
  
  const [lcCopyFile, setLcCopyFile] = useState<File | null>(null);
  const [inspectionCertificateFile, setInspectionCertificateFile] = useState<File | null>(null);
  const [yardPicturesFiles, setYardPicturesFiles] = useState<File[]>([]);
  
  const [pendingDeleteLcCopy, setPendingDeleteLcCopy] = useState(false);
  const [pendingDeleteInspectionCertificate, setPendingDeleteInspectionCertificate] = useState(false);
  const [pendingDeleteYardPictureIds, setPendingDeleteYardPictureIds] = useState<number[]>([]);
  
  const [includeAttachmentsInView, setIncludeAttachmentsInView] = useState(true);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quotationId: '', ttAmount: 0, advanceAmount: 0, status: 'pending', isLcComplete: false, isTtComplete: false, etdDate: '', arrivalDate: '' },
  });

  const selectedQId = useWatch({ control, name: 'quotationId' });
  const advance = useWatch({ control, name: 'advanceAmount' }) || 0;
  const isLcChecked = useWatch({ control, name: 'isLcComplete' }) || false;
  const isTtChecked = useWatch({ control, name: 'isTtComplete' }) || false;
  const etdVal = useWatch({ control, name: 'etdDate' });
  const arrivalVal = useWatch({ control, name: 'arrivalDate' });

  const selectedQuotation = useMemo(() => quotations.find((q) => q.id === selectedQId), [quotations, selectedQId]);
  const selectedVehicle = useMemo(() => vehicleModels.find((v) => v.id === selectedQuotation?.vehicleModelId), [vehicleModels, selectedQuotation]);
  const selectedMake = useMemo(() => makeModels.find((m) => m.id === selectedQuotation?.makeModelId), [makeModels, selectedQuotation]);
  const total = selectedQuotation ? quotationTotal(selectedQuotation) : 0;

  const balance = useMemo(() => {
    if (!selectedQuotation) return 0;
    const lcVal = selectedQuotation.lcAmount || 0;
    const ttVal = selectedQuotation.ttAmount || 0;
    let deduction = 0;
    if (isLcChecked) deduction += lcVal;
    if (isTtChecked) deduction += ttVal;
    return Math.max(0, total - Number(advance || 0) - deduction);
  }, [selectedQuotation, total, advance, isLcChecked, isTtChecked]);

  // Reminders calculation (>= 5 days since creation)
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

  const openAdd = () => {
    setEditingInvoice(null);
    reset({ quotationId: '', ttAmount: 0, advanceAmount: 0, status: 'pending', isLcComplete: false, isTtComplete: false, etdDate: '', arrivalDate: '' });
    setLcCopyFile(null);
    setInspectionCertificateFile(null);
    setYardPicturesFiles([]);
    setPendingDeleteLcCopy(false);
    setPendingDeleteInspectionCertificate(false);
    setPendingDeleteYardPictureIds([]);
    setModalOpen(true);
  };

  const openEdit = (i: Invoice) => {
    setEditingInvoice(i);
    reset({
      quotationId: i.quotationId,
      ttAmount: i.ttAmount,
      advanceAmount: i.advanceAmount,
      status: i.status,
      isLcComplete: !!i.isLcComplete,
      isTtComplete: !!i.isTtComplete,
      etdDate: i.etdDate || '',
      arrivalDate: i.arrivalDate || '',
    });
    setLcCopyFile(null);
    setInspectionCertificateFile(null);
    setYardPicturesFiles([]);
    setPendingDeleteLcCopy(false);
    setPendingDeleteInspectionCertificate(false);
    setPendingDeleteYardPictureIds([]);
    setModalOpen(true);
  };

  const handleQuotationChange = (qId: string) => {
    setValue('quotationId', qId);
    const q = quotations.find((x) => x.id === qId);
    if (q) setValue('ttAmount', q.ttAmount || 0);
  };

  const handleDeleteYardPic = (picId: number) => {
    setPendingDeleteYardPictureIds((prev) => [...prev, picId]);
  };

  const handleDeleteLcCopy = () => {
    setPendingDeleteLcCopy(true);
  };

  const handleDeleteInspectionCertificate = () => {
    setPendingDeleteInspectionCertificate(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedQuotation) { toast.error('Invalid quotation'); return; }
    
    const lcAmountVal = selectedQuotation.lcAmount || 0;
    const ttAmountVal = selectedQuotation.ttAmount || 0;
    
    let formDeduction = 0;
    if (data.isLcComplete) formDeduction += lcAmountVal;
    if (data.isTtComplete) formDeduction += ttAmountVal;
    
    const balanceVal = Math.max(0, quotationTotal(selectedQuotation) - data.advanceAmount - formDeduction);

    try {
      if (editingInvoice) {
        const formData = new FormData();
        formData.append('quotationId', data.quotationId);
        formData.append('ttAmount', String(data.ttAmount));
        formData.append('advanceAmount', String(data.advanceAmount));
        formData.append('balance', String(balanceVal));
        formData.append('status', data.status);
        formData.append('isLcComplete', String(!!data.isLcComplete));
        formData.append('isTtComplete', String(!!data.isTtComplete));
        formData.append('etdDate', data.etdDate || '');
        formData.append('arrivalDate', data.arrivalDate || '');

        if (pendingDeleteLcCopy) {
          formData.append('deleteLcCopy', 'true');
        }
        if (pendingDeleteInspectionCertificate) {
          formData.append('deleteInspectionCertificate', 'true');
        }
        if (pendingDeleteYardPictureIds.length > 0) {
          formData.append('deleteYardPictureIds', pendingDeleteYardPictureIds.join(','));
        }

        if (lcCopyFile) {
          formData.append('lcCopy', lcCopyFile);
        }
        if (inspectionCertificateFile) {
          formData.append('inspectionCertificate', inspectionCertificateFile);
        }
        if (yardPicturesFiles.length > 0) {
          yardPicturesFiles.forEach((file) => {
            formData.append('yardPictures[]', file);
          });
        }

        await updateInvoice(editingInvoice.id, formData);
        toast.success('Invoice updated');
      } else {
        await addInvoice({
          quotationId: data.quotationId,
          ttAmount: data.ttAmount,
          advanceAmount: data.advanceAmount,
          balance: balanceVal,
          status: data.status,
          isLcComplete: !!data.isLcComplete,
          isTtComplete: !!data.isTtComplete,
          etdDate: data.etdDate,
          arrivalDate: data.arrivalDate,
        });
        toast.success('Invoice created');
      }
      setModalOpen(false);
      setEditingInvoice(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save invoice');
    }
  };

  const filtered = invoices.filter((i) => {
    const q = quotations.find((x) => x.id === i.quotationId);
    return (`${i.id} ${q?.name || ''} ${q?.id || ''}`).toLowerCase().includes(query.toLowerCase());
  });

  const handlePrint = async (i: Invoice, includeAttachments = true) => {
    const q = quotations.find((x) => x.id === i.quotationId);
    const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
    const m = makeModels.find((x) => x.id === q?.makeModelId);
    if (!q || !v || !m) { toast.error('Missing data'); return; }
    await downloadInvoicePDF({ invoice: i, quotation: q, vehicle: v, make: m, includeAttachments });
    toast.success('PDF downloaded');
  };

  const togglePaid = (i: Invoice) => {
    updateInvoice(i.id, { status: i.status === 'paid' ? 'pending' : 'paid' });
    toast.success(`Marked as ${i.status === 'paid' ? 'pending' : 'paid'}`);
  };

  const handleToggleLc = (i: Invoice) => {
    const newStatus = !i.isLcComplete;
    const q = quotations.find((x) => x.id === i.quotationId);
    const totalVal = q ? quotationTotal(q) : 0;
    const lcVal = q ? (q.lcAmount || 0) : 0;
    const ttVal = q ? (q.ttAmount || 0) : 0;

    let deduction = 0;
    if (newStatus) deduction += lcVal;
    if (i.isTtComplete) deduction += ttVal;

    const newBalance = Math.max(0, totalVal - i.advanceAmount - deduction);

    updateInvoice(i.id, { 
      isLcComplete: newStatus,
      balance: newBalance
    });
    toast.success(`LC status set to ${newStatus ? 'Complete' : 'Pending'} for ${i.id}. Balance updated.`);
  };

  const handleToggleTt = (i: Invoice) => {
    const newStatus = !i.isTtComplete;
    const q = quotations.find((x) => x.id === i.quotationId);
    const totalVal = q ? quotationTotal(q) : 0;
    const lcVal = q ? (q.lcAmount || 0) : 0;
    const ttVal = q ? (q.ttAmount || 0) : 0;

    let deduction = 0;
    if (i.isLcComplete) deduction += lcVal;
    if (newStatus) deduction += ttVal;

    const newBalance = Math.max(0, totalVal - i.advanceAmount - deduction);

    updateInvoice(i.id, { 
      isTtComplete: newStatus,
      balance: newBalance
    });
    toast.success(`TT status set to ${newStatus ? 'Complete' : 'Pending'} for ${i.id}. Balance updated.`);
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      {/* Reminders Banner */}
      {reminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 flex-shrink-0">
          <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
            Milestone Payment Alerts & Reminders
          </h3>
          <ul className="text-xs text-amber-700 list-disc pl-5 space-y-1">
            {reminders.map((r) => (
              <li key={r.id}>
                <strong>{r.invoiceId}</strong> — {r.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search invoices..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> New Invoice</button>
      </div>

      <div className="table-wrap flex-1 min-h-0 flex flex-col">
        {filtered.length === 0 ? <EmptyState title="No invoices" /> : (
          <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
            <table className="table w-full relative">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th>Invoice</th>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>LC Status</th>
                  <th>TT Status</th>
                  <th>Advance</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const q = quotations.find((x) => x.id === i.quotationId);
                  const days = Math.floor((new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  const showWarning = days >= 5 && (!i.isLcComplete || !i.isTtComplete);
                  return (
                    <tr key={i.id}>
                      <td className="font-semibold text-brand-700">
                        <div className="flex items-center gap-1.5" title={showWarning ? "Milestone payment pending >= 5 days" : undefined}>
                          {i.id}
                          {showWarning && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                        </div>
                      </td>
                      <td className="font-mono text-xs">{i.quotationId}</td>
                      <td>
                        <div>
                          <p className="font-medium text-slate-800">{q?.name || '—'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{q?.nic}</p>
                        </div>
                      </td>
                      <td>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!i.isLcComplete}
                            onChange={() => handleToggleLc(i)}
                            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300"
                          />
                          <span className={`text-xs font-medium ${i.isLcComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {i.isLcComplete ? 'Complete' : 'Pending'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!i.isTtComplete}
                            onChange={() => handleToggleTt(i)}
                            className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300"
                          />
                          <span className={`text-xs font-medium ${i.isTtComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {i.isTtComplete ? 'Complete' : 'Pending'}
                          </span>
                        </label>
                      </td>
                      <td>{formatCurrency(i.advanceAmount)}</td>
                      <td className="font-semibold">{formatCurrency(i.balance)}</td>
                      <td><StatusBadge status={i.status} /></td>
                      <td className="text-slate-500">{formatDate(i.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => togglePaid(i)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Toggle paid"><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(i)} className="p-2 rounded-lg hover:bg-slate-100 text-blue-600" title="Edit"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => { setIncludeAttachmentsInView(true); setViewing(i); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><Eye className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingInvoice ? "Edit Invoice" : "New Invoice"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Select Quotation</label>
            <select className="input" value={selectedQId} onChange={(e) => handleQuotationChange(e.target.value)} disabled={!!editingInvoice}>
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
              <input type="number" step="0.01" {...register('ttAmount')} placeholder="Enter TT Amount (e.g. 500000)" className="input" />
            </div>
            <div>
              <label className="label">Advance Amount (LKR)</label>
              <input type="number" step="0.01" {...register('advanceAmount')} placeholder="Enter Advance Amount (e.g. 200000)" className="input" />
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

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-800">Payment Milestones Status</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isLcComplete')} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300" />
                <span className="text-sm text-slate-700 font-medium">LC Amount Completed / Opened</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isTtComplete')} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300" />
                <span className="text-sm text-slate-700 font-medium">TT Amount Completed / Paid</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Dates Schedule</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">ETD Date</label>
                <input 
                  type="date" 
                  {...register('etdDate')} 
                  className={`input ${etdVal ? 'border-red-500 text-red-600 focus:border-red-600 focus:ring-red-600 accent-red-600 font-bold bg-red-50/50' : ''}`} 
                />
              </div>
              <div>
                <label className="label">Arrival Date</label>
                <input 
                  type="date" 
                  {...register('arrivalDate')} 
                  className={`input ${arrivalVal ? 'border-red-500 text-red-600 focus:border-red-600 focus:ring-red-600 accent-red-600 font-bold bg-red-50/50' : ''}`} 
                />
              </div>
            </div>
          </div>

          {editingInvoice && (
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-bold text-slate-800">Attachments & Documents</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">LC Copy (Image/PDF)</label>
                  {editingInvoice.lcCopyPath && !pendingDeleteLcCopy && (
                    <div className="mb-2 text-xs flex items-center gap-2">
                      <span className="text-slate-500">Current LC Copy: </span>
                      <a 
                        href={`http://automobile.sourcecode.lk/${editingInvoice.lcCopyPath}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-brand-600 hover:underline font-semibold"
                      >
                        View Document
                      </a>
                      <button 
                        type="button" 
                        onClick={handleDeleteLcCopy} 
                        className="text-red-600 hover:text-red-800 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                  {editingInvoice.lcCopyPath && pendingDeleteLcCopy && (
                    <div className="mb-2 text-xs text-red-600 font-semibold italic flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Marked for deletion (Click Save to apply)
                      <button type="button" onClick={() => setPendingDeleteLcCopy(false)} className="text-blue-600 hover:text-blue-800 hover:underline ml-2 flex items-center gap-0.5 font-bold">
                        <Undo className="w-3 h-3" /> Undo
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => setLcCopyFile(e.target.files?.[0] || null)} 
                    className="input text-xs" 
                    accept="image/*,application/pdf"
                  />
                </div>

                <div>
                  <label className="label">Inspection Certificate (Image/PDF)</label>
                  {editingInvoice.inspectionCertificatePath && !pendingDeleteInspectionCertificate && (
                    <div className="mb-2 text-xs flex items-center gap-2">
                      <span className="text-slate-500">Current Certificate: </span>
                      <a 
                        href={`http://automobile.sourcecode.lk/${editingInvoice.inspectionCertificatePath}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-brand-600 hover:underline font-semibold"
                      >
                        View Document
                      </a>
                      <button 
                        type="button" 
                        onClick={handleDeleteInspectionCertificate} 
                        className="text-red-600 hover:text-red-800 hover:underline font-semibold flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  )}
                  {editingInvoice.inspectionCertificatePath && pendingDeleteInspectionCertificate && (
                    <div className="mb-2 text-xs text-red-600 font-semibold italic flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Marked for deletion (Click Save to apply)
                      <button type="button" onClick={() => setPendingDeleteInspectionCertificate(false)} className="text-blue-600 hover:text-blue-800 hover:underline ml-2 flex items-center gap-0.5 font-bold">
                        <Undo className="w-3 h-3" /> Undo
                      </button>
                    </div>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => setInspectionCertificateFile(e.target.files?.[0] || null)} 
                    className="input text-xs" 
                    accept="image/*,application/pdf"
                  />
                </div>
              </div>

              <div>
                <label className="label">Yard Pictures (One or more images)</label>
                
                {editingInvoice.yardPictures && editingInvoice.yardPictures.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                    {editingInvoice.yardPictures.map((pic) => {
                      const isPendingDelete = pendingDeleteYardPictureIds.includes(pic.id);
                      return (
                        <div key={pic.id} className={`relative group border rounded-lg overflow-hidden bg-slate-50 aspect-video ${isPendingDelete ? 'border-red-500 opacity-40' : 'border-slate-200'}`}>
                          <img 
                            src={`http://automobile.sourcecode.lk/${pic.file_path}`} 
                            alt="Yard" 
                            className="w-full h-full object-cover"
                          />
                          {isPendingDelete ? (
                            <button 
                              type="button"
                              onClick={() => setPendingDeleteYardPictureIds((prev) => prev.filter((id) => id !== pic.id))}
                              className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white font-bold text-[10px] gap-1"
                              title="Undo Delete"
                            >
                              <Undo className="w-3.5 h-3.5 text-white" />
                              <span>Undo</span>
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => handleDeleteYardPic(pic.id)}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-90 hover:opacity-100 shadow"
                              title="Delete image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => setYardPicturesFiles(Array.from(e.target.files || []))} 
                  className="input text-xs" 
                  accept="image/*"
                />
              </div>
            </div>
          )}

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
            {q && v && m ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InvoicePDFViewer invoice={viewing} quotation={q} vehicle={v} make={m} includeAttachments={includeAttachmentsInView} />
                </div>
                <div className="space-y-6">
                  {/* Document Actions Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Print & Download</h3>
                    
                    {/* Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-dashed border-slate-200 select-none">
                      <input 
                        type="checkbox" 
                        checked={includeAttachmentsInView} 
                        onChange={(e) => setIncludeAttachmentsInView(e.target.checked)} 
                        className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700">Include attachments in PDF</span>
                    </label>

                    <div className="space-y-2 pt-1">
                      <button 
                        onClick={() => handlePrint(viewing, false)}
                        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 px-3 rounded-lg text-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        Download Invoice Only
                      </button>
                      <button 
                        onClick={() => handlePrint(viewing, true)}
                        className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" />
                        Download Combined PDF
                      </button>
                    </div>
                  </div>
                  {/* Logistics Info Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Logistics Schedule</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">ETD Date:</span>
                        <span className={`font-semibold ${viewing.etdDate ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {viewing.etdDate ? formatDate(viewing.etdDate) : 'Not Scheduled'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Arrival Date:</span>
                        <span className={`font-semibold ${viewing.arrivalDate ? 'text-red-600 font-bold' : 'text-slate-700'}`}>
                          {viewing.arrivalDate ? formatDate(viewing.arrivalDate) : 'Not Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attachments Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Invoice Attachments</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-t">
                        <span className="text-slate-600 font-medium">LC Copy</span>
                        {viewing.lcCopyPath ? (
                          <a 
                            href={`http://automobile.sourcecode.lk/${viewing.lcCopyPath}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-brand-600 hover:underline font-semibold"
                          >
                            View Document
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center py-1 border-t">
                        <span className="text-slate-600 font-medium">Inspection Cert.</span>
                        {viewing.inspectionCertificatePath ? (
                          <a 
                            href={`http://automobile.sourcecode.lk/${viewing.inspectionCertificatePath}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-brand-600 hover:underline font-semibold"
                          >
                            View Document
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Not Uploaded</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Yard Photos Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Yard Pictures</h3>
                    {viewing.yardPictures && viewing.yardPictures.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {viewing.yardPictures.map((pic) => (
                          <a 
                            key={pic.id}
                            href={`http://automobile.sourcecode.lk/${pic.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-slate-200 rounded overflow-hidden aspect-video hover:opacity-95 transition"
                          >
                            <img 
                              src={`http://automobile.sourcecode.lk/${pic.file_path}`} 
                              alt="Yard pic" 
                              className="w-full h-full object-cover" 
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No yard pictures uploaded</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p>Missing data</p>
            )}
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
