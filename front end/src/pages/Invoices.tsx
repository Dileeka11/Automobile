import { useMemo, useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, Eye, Printer, Receipt, CheckCircle2, Edit, AlertTriangle, Undo } from 'lucide-react';
import { useDataStore, toast, quotationTotal } from '@/store';
import { Invoice, InvoicePayment } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils';
import { InvoicePDFViewer, downloadInvoicePDF } from '@/components/pdf/InvoicePDF';
import {
  ConsolidatedReceiptPDFViewer,
  InstallmentSlipPDFViewer,
  downloadConsolidatedReceiptPDF,
  downloadInstallmentSlipPDF,
} from '@/components/pdf/ReceiptPDF';

const schema = z.object({
  quotationId: z.string().min(1, 'Select a quotation'),
  ttAmount: z.coerce.number().min(0),
  advanceAmount: z.coerce.number().min(0),
  status: z.enum(['pending', 'partial', 'paid']),
  isLcComplete: z.boolean().default(false),
  lcNumber: z.string().optional().nullable(),
  lcOpenType: z.enum(['company', 'personal', '']).optional().nullable(),
  isTtComplete: z.boolean().default(false),
  etdDate: z.string().optional().nullable(),
  arrivalDate: z.string().optional().nullable(),
});
type FormData = z.infer<typeof schema>;

export default function Invoices() {
  const { invoices, quotations, vehicleModels, makeModels, addInvoice, updateInvoice, deleteInvoice, fetchData } = useDataStore();
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

  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [viewingReceipt, setViewingReceipt] = useState<boolean>(false);
  const [viewingInstallmentSlip, setViewingInstallmentSlip] = useState<InvoicePayment | null>(null);
  
  const [includeAttachmentsInView, setIncludeAttachmentsInView] = useState(true);

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { quotationId: '', ttAmount: 0, advanceAmount: 0, status: 'pending', isLcComplete: false, lcNumber: '', lcOpenType: '', isTtComplete: false, etdDate: '', arrivalDate: '' },
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

  const paymentsSum = useMemo(() => payments.reduce((sum, p) => sum + Number(p.amount), 0), [payments]);

  const totalAdvance = useMemo(() => {
    if (!selectedQuotation) return Number(advance || 0);
    const lcVal = selectedQuotation.lcAmount || 0;
    const ttVal = selectedQuotation.ttAmount || 0;
    return Number(advance || 0) + (isLcChecked ? lcVal : 0) + (isTtChecked ? ttVal : 0) + paymentsSum;
  }, [selectedQuotation, advance, isLcChecked, isTtChecked, paymentsSum]);

  const balance = useMemo(() => {
    if (!selectedQuotation) return 0;
    return Math.max(0, total - totalAdvance);
  }, [selectedQuotation, total, totalAdvance]);

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
            message: `Invoice ${i.id}: Other Payment is not complete. Remind to collect Other Payment.`,
          });
        }
      }
    });
    return list;
  }, [invoices]);

  const fetchPayments = async (invoiceId: string) => {
    try {
      const resp = await fetch(`/backend/api/invoice_payments.php?invoiceId=${invoiceId}`);
      if (resp.ok) {
        const data = await resp.json();
        setPayments(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentsLoaded(true);
    }
  };

  // Persist the balance (and live advance/LC/TT form values) to the DB so the
  // invoice table and PDF always match the edit-page yellow box.
  const syncBalance = async (extraAmount = 0, excludePaymentId = -1) => {
    if (!editingInvoice || !selectedQuotation) return;
    const lcVal = selectedQuotation.lcAmount || 0;
    const ttVal = selectedQuotation.ttAmount || 0;
    const installmentsSum = payments
      .filter((p) => p.id !== excludePaymentId)
      .reduce((sum, p) => sum + Number(p.amount), 0) + extraAmount;
    const advanceVal = Number(advance || 0);
    const totalAdvanceVal = advanceVal
      + (isLcChecked ? lcVal : 0)
      + (isTtChecked ? ttVal : 0)
      + installmentsSum;
    const balanceVal = Math.max(0, quotationTotal(selectedQuotation) - totalAdvanceVal);
    await updateInvoice(editingInvoice.id, {
      advanceAmount: advanceVal,
      isLcComplete: isLcChecked,
      isTtComplete: isTtChecked,
      balance: balanceVal,
    });
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    const amount = parseFloat(newPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid payment amount.', confirmButtonColor: '#4f46e5' });
      return;
    }
    try {
      const resp = await fetch('/backend/api/invoice_payments.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: editingInvoice.id,
          amount,
          paymentDate: newPaymentDate,
          notes: newPaymentNotes
        })
      });
      if (resp.ok) {
        const newPayment = await resp.json();
        setNewPaymentAmount('');
        setNewPaymentNotes('');
        await syncBalance(amount);
        fetchPayments(editingInvoice.id);
        Swal.fire({ icon: 'success', title: 'Installment Recorded!', text: `LKR ${amount.toLocaleString()} has been recorded successfully.`, confirmButtonColor: '#4f46e5', timer: 2500, timerProgressBar: true });
        setViewingInstallmentSlip(newPayment);
      } else {
        const errData = await resp.json();
        Swal.fire({ icon: 'error', title: 'Failed', text: errData.error || 'Failed to record payment.', confirmButtonColor: '#4f46e5' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Could not connect to the server.', confirmButtonColor: '#4f46e5' });
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!editingInvoice) return;
    const result = await Swal.fire({
      title: 'Delete Installment?',
      text: 'This payment record will be permanently removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      const resp = await fetch(`/backend/api/invoice_payments.php?id=${paymentId}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        await syncBalance(0, paymentId);
        fetchPayments(editingInvoice.id);
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Installment has been removed.', confirmButtonColor: '#4f46e5', timer: 2000, timerProgressBar: true });
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: 'Could not delete the installment.', confirmButtonColor: '#4f46e5' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Network Error', text: 'Could not connect to the server.', confirmButtonColor: '#4f46e5' });
    }
  };

  // Keep editingInvoice reference updated while the modal is open
  useEffect(() => {
    if (modalOpen && editingInvoice) {
      const updated = invoices.find((inv) => inv.id === editingInvoice.id);
      if (updated) {
        setEditingInvoice(updated);
      }
    }
  }, [invoices]);

  // Auto-sync the stored balance/advance to match the live yellow-box values.
  // Persists (debounced) whenever the edit form's advance/LC/TT/installments
  // change, so the invoice table & PDF always reflect the yellow box.
  useEffect(() => {
    if (!modalOpen || !editingInvoice || !selectedQuotation || !paymentsLoaded) return;
    const advanceVal = Number(advance || 0);
    const inSync =
      Math.abs(Number(editingInvoice.balance ?? 0) - balance) < 0.01 &&
      Math.abs(Number(editingInvoice.advanceAmount ?? 0) - advanceVal) < 0.01 &&
      !!editingInvoice.isLcComplete === isLcChecked &&
      !!editingInvoice.isTtComplete === isTtChecked;
    if (inSync) return;
    const t = setTimeout(() => {
      updateInvoice(editingInvoice.id, {
        advanceAmount: advanceVal,
        isLcComplete: isLcChecked,
        isTtComplete: isTtChecked,
        balance,
      });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, editingInvoice, selectedQuotation, paymentsLoaded, advance, isLcChecked, isTtChecked, balance]);

  const openAdd = () => {
    setEditingInvoice(null);
    reset({ quotationId: '', ttAmount: 0, advanceAmount: 0, status: 'pending', isLcComplete: false, lcNumber: '', lcOpenType: '', isTtComplete: false, etdDate: '', arrivalDate: '' });
    setLcCopyFile(null);
    setInspectionCertificateFile(null);
    setYardPicturesFiles([]);
    setPendingDeleteLcCopy(false);
    setPendingDeleteInspectionCertificate(false);
    setPendingDeleteYardPictureIds([]);
    setPayments([]); // Clear payments for new invoice
    setPaymentsLoaded(false);
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
      lcNumber: i.lcNumber || '',
      lcOpenType: i.lcOpenType || '',
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

    // Fetch payments for this invoice
    setPaymentsLoaded(false);
    fetchPayments(i.id);

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
    const installmentsSum = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAdvanceVal = Number(data.advanceAmount || 0)
      + (data.isLcComplete ? lcAmountVal : 0)
      + (data.isTtComplete ? ttAmountVal : 0)
      + installmentsSum;
    const balanceVal = Math.max(0, quotationTotal(selectedQuotation) - totalAdvanceVal);

    try {
      if (editingInvoice) {
        const formData = new FormData();
        formData.append('quotationId', data.quotationId);
        formData.append('ttAmount', String(data.ttAmount));
        formData.append('advanceAmount', String(data.advanceAmount));
        formData.append('balance', String(balanceVal));
        formData.append('status', data.status);
        formData.append('isLcComplete', String(!!data.isLcComplete));
        formData.append('lcNumber', data.lcNumber || '');
        formData.append('lcOpenType', data.lcOpenType || '');
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
          lcNumber: data.lcNumber,
          lcOpenType: data.lcOpenType === '' ? null : data.lcOpenType,
          isTtComplete: !!data.isTtComplete,
          etdDate: data.etdDate,
          arrivalDate: data.arrivalDate,
        });
        toast.success('Invoice created');
      }
      // Close modal first, then refresh list
      setModalOpen(false);
      setEditingInvoice(null);
      setPayments([]);
      fetchData();
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
    const newLcStatus = !i.isLcComplete;
    const q = quotations.find((x) => x.id === i.quotationId);
    const totalVal = q ? quotationTotal(q) : 0;
    const lcVal = q ? (q.lcAmount || 0) : 0;
    const ttVal = q ? (q.ttAmount || 0) : 0;
    const newTotalAdvance = i.advanceAmount
      + (newLcStatus ? lcVal : 0)
      + (i.isTtComplete ? ttVal : 0);
    const newBalance = Math.max(0, totalVal - newTotalAdvance);
    updateInvoice(i.id, { isLcComplete: newLcStatus, balance: newBalance });
    toast.success(`LC status set to ${newLcStatus ? 'Complete' : 'Pending'} for ${i.id}. Balance updated.`);
  };

  const handleToggleTt = (i: Invoice) => {
    const newTtStatus = !i.isTtComplete;
    const q = quotations.find((x) => x.id === i.quotationId);
    const totalVal = q ? quotationTotal(q) : 0;
    const lcVal = q ? (q.lcAmount || 0) : 0;
    const ttVal = q ? (q.ttAmount || 0) : 0;
    const newTotalAdvance = i.advanceAmount
      + (i.isLcComplete ? lcVal : 0)
      + (newTtStatus ? ttVal : 0);
    const newBalance = Math.max(0, totalVal - newTotalAdvance);
    updateInvoice(i.id, { isTtComplete: newTtStatus, balance: newBalance });
    toast.success(`Other Payment status set to ${newTtStatus ? 'Complete' : 'Pending'} for ${i.id}. Balance updated.`);
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
                  <th>Other Payment Status</th>
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
                  // Compute Total Advance & Balance live (matches edit-page yellow box).
                  // i.ttAmount from GET = SUM of installment payments.
                  const rowInstallments = Number(i.ttAmount || 0);
                  const rowTotalAdvance = Number(i.advanceAmount || 0)
                    + (i.isLcComplete ? Number(q?.lcAmount || 0) : 0)
                    + (i.isTtComplete ? Number(q?.ttAmount || 0) : 0)
                    + rowInstallments;
                  const rowBalance = q ? Math.max(0, quotationTotal(q) - rowTotalAdvance) : i.balance;
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
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs font-medium ${i.isLcComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {i.isLcComplete ? 'Complete' : 'Pending'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {formatCurrency(q?.lcAmount || 0)}
                          </span>
                          {i.lcNumber && (
                            <span className="text-[10px] font-mono text-brand-600">
                              No: {i.lcNumber} {i.lcOpenType ? `(${i.lcOpenType === 'company' ? 'Company' : 'Personal'})` : ''}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-xs font-medium ${i.isTtComplete ? 'text-emerald-700' : 'text-slate-500'}`}>
                            {i.isTtComplete ? 'Complete' : 'Pending'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {formatCurrency(q?.ttAmount || 0)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">{formatCurrency(q ? rowTotalAdvance : i.advanceAmount)}</span>
                          <span className="text-[10px] text-slate-400">advance: {formatCurrency(i.advanceAmount)}</span>
                        </div>
                      </td>
                      <td className="font-semibold">{formatCurrency(rowBalance)}</td>
                      <td><StatusBadge status={i.status} /></td>
                      <td className="text-slate-500">{formatDate(i.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => togglePaid(i)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Toggle paid"><CheckCircle2 className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(i)} className="p-2 rounded-lg hover:bg-slate-100 text-brand-600" title="Edit"><Edit className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingInvoice ? "Edit Invoice" : "New Invoice"} size="2xl">
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
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                <div><span className="text-slate-500">LC Amount:</span> <span className="font-semibold text-emerald-700">{formatCurrency(selectedQuotation.lcAmount || 0)}</span></div>
                <div><span className="text-slate-500">Quoted TT:</span> <span className="font-semibold text-brand-700">{formatCurrency(selectedQuotation.ttAmount || 0)}</span></div>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-200">
                <span className="text-slate-600 font-medium">Total Vehicle Cost</span>
                <span className="font-bold text-brand-700">{formatCurrency(total)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Advance Amount (LKR)</label>
              <input type="number" step="0.01" {...register('advanceAmount')} placeholder="Enter Advance Amount (e.g. 200000)" className="input" />
            </div>
            <div>
              <label className="label">Status</label>
              <select {...register('status')} className="input">
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="flex items-end md:col-span-2">
              <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                {selectedQuotation && (isLcChecked || isTtChecked || payments.length > 0) && (
                  <div className="space-y-1 text-xs text-amber-700 pb-2 border-b border-amber-200">
                    <div className="flex justify-between">
                      <span>Advance</span>
                      <span className="font-medium">{formatCurrency(Number(advance || 0))}</span>
                    </div>
                    {isLcChecked && (
                      <div className="flex justify-between">
                        <span>+ LC Amount</span>
                        <span className="font-medium">{formatCurrency(selectedQuotation.lcAmount || 0)}</span>
                      </div>
                    )}
                    {isTtChecked && (
                      <div className="flex justify-between">
                        <span>+ Other Payment</span>
                        <span className="font-medium">{formatCurrency(selectedQuotation.ttAmount || 0)}</span>
                      </div>
                    )}
                    {payments.map((p) => (
                      <div key={p.id} className="flex justify-between">
                        <span>+ Installment <span className="font-mono text-amber-600">({formatDate(p.paymentDate)})</span></span>
                        <span className="font-medium">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold border-t border-amber-200 pt-1">
                      <span>Total Advance</span>
                      <span>{formatCurrency(totalAdvance)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <p className="text-xs text-amber-700 font-medium">Balance</p>
                  <p className="text-xl font-bold text-amber-900">{formatCurrency(balance)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Payment Milestones Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isLcComplete')} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300" />
                  <span className="text-sm text-slate-700 font-medium">LC Amount Completed / Opened</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">LC Number</label>
                    <input type="text" {...register('lcNumber')} placeholder="Enter LC Number" className="input" />
                  </div>
                  <div>
                    <label className="label">LC Open Type</label>
                    <select {...register('lcOpenType')} className="input">
                      <option value="">Select Type</option>
                      <option value="company">Company</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isTtComplete')} className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 border-slate-300" />
                  <span className="text-sm text-slate-700 font-medium">Other Payment Completed / Paid</span>
                </label>
              </div>
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
            <>
              {/* Installment Payments System */}
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand-600" />
                  Installment Payments (Set by Set)
                </h4>
                
                {/* Add Payment Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Record New Installment</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Amount (LKR)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={newPaymentAmount} 
                        onChange={(e) => setNewPaymentAmount(e.target.value)} 
                        placeholder="e.g. 500000" 
                        className="input text-xs" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Date</label>
                      <input 
                        type="date" 
                        value={newPaymentDate} 
                        onChange={(e) => setNewPaymentDate(e.target.value)} 
                        className="input text-xs" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Notes</label>
                      <input 
                        type="text" 
                        value={newPaymentNotes} 
                        onChange={(e) => setNewPaymentNotes(e.target.value)} 
                        placeholder="Cheque, Transfer reference, etc." 
                        className="input text-xs" 
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={handleAddPayment} 
                      className="btn-primary py-1 px-3 text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Record Installment
                    </button>
                  </div>
                </div>

                {/* Payments List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Payment History</h5>
                    {payments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setViewingReceipt(true)}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                        title="Print Consolidated Receipt"
                      >
                        <Printer className="w-3 h-3" />
                        Print Receipt
                      </button>
                    )}
                  </div>
                  {payments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No installments recorded yet for this invoice.</p>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Receipt No</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Date</th>
                            <th className="px-4 py-2 text-left font-semibold text-slate-600">Notes</th>
                            <th className="px-4 py-2 text-right font-semibold text-slate-600">Amount (LKR)</th>
                            <th className="px-4 py-2 text-center font-semibold text-slate-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {payments.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-mono text-slate-600">REC-{p.id}</td>
                              <td className="px-4 py-2 text-slate-700">{formatDate(p.paymentDate)}</td>
                              <td className="px-4 py-2 text-slate-500 italic">{p.notes || '—'}</td>
                              <td className="px-4 py-2 text-right font-bold text-slate-800">{formatCurrency(p.amount)}</td>
                              <td className="px-4 py-2">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setViewingInstallmentSlip(p)}
                                    className="p-1 text-brand-600 hover:bg-brand-50 rounded"
                                    title="View Installment Receipt"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePayment(p.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Installment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-bold text-slate-800">Attachments & Documents</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">LC Copy (Image/PDF)</label>
                    {editingInvoice.lcCopyPath && !pendingDeleteLcCopy && (
                      <div className="mb-2 text-xs flex items-center gap-2">
                        <span className="text-slate-500">Current LC Copy: </span>
                        <a 
                          href={`/backend/api/image.php?path=${encodeURIComponent(editingInvoice.lcCopyPath)}`} 
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
                        <button type="button" onClick={() => setPendingDeleteLcCopy(false)} className="text-brand-600 hover:text-brand-800 hover:underline ml-2 flex items-center gap-0.5 font-bold">
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
                          href={`/backend/api/image.php?path=${encodeURIComponent(editingInvoice.inspectionCertificatePath)}`} 
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
                        <button type="button" onClick={() => setPendingDeleteInspectionCertificate(false)} className="text-brand-600 hover:text-brand-800 hover:underline ml-2 flex items-center gap-0.5 font-bold">
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
                              src={`/backend/api/image.php?path=${encodeURIComponent(pic.file_path)}`} 
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
            </>
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
          <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Invoice ${viewing.id}`} size="2xl">
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
                        <span className="text-slate-600 font-medium">LC Number</span>
                        <span className="font-semibold text-slate-700">
                          {viewing.lcNumber || '—'} {viewing.lcOpenType ? `(${viewing.lcOpenType === 'company' ? 'Company' : 'Personal'})` : ''}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-t">
                        <span className="text-slate-600 font-medium">LC Copy</span>
                        {viewing.lcCopyPath ? (
                          <a 
                            href={`/backend/api/image.php?path=${encodeURIComponent(viewing.lcCopyPath)}`} 
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
                            href={`/backend/api/image.php?path=${encodeURIComponent(viewing.inspectionCertificatePath)}`} 
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
                            href={`/backend/api/image.php?path=${encodeURIComponent(pic.file_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-slate-200 rounded overflow-hidden aspect-video hover:opacity-95 transition"
                          >
                            <img 
                              src={`/backend/api/image.php?path=${encodeURIComponent(pic.file_path)}`} 
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

      {/* Consolidated Receipt Modal — header "Print Receipt" button */}
      {viewingReceipt && (() => {
        const q = quotations.find((x) => x.id === editingInvoice?.quotationId);
        const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
        const m = makeModels.find((x) => x.id === q?.makeModelId);
        // Use live form values so receipt always matches the yellow box
        const liveInvoice = editingInvoice
          ? { ...editingInvoice, advanceAmount: Number(advance || 0), isLcComplete: isLcChecked, isTtComplete: isTtChecked }
          : editingInvoice;
        return (
          <Modal open={viewingReceipt} onClose={() => setViewingReceipt(false)} title={`Payment Receipt — INV-${editingInvoice?.id}`} size="2xl">
            {liveInvoice && q && v && m ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ConsolidatedReceiptPDFViewer
                    invoice={liveInvoice}
                    quotation={q}
                    vehicle={v}
                    make={m}
                    allPayments={payments}
                  />
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Actions</h3>
                    <button
                      onClick={() => downloadConsolidatedReceiptPDF({ invoice: liveInvoice, quotation: q, vehicle: v, make: m, allPayments: payments })}
                      className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" />
                      Download Receipt PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p>Missing data to render receipt preview</p>
            )}
          </Modal>
        );
      })()}

      {/* Installment Slip Modal — per-row print icon */}
      {viewingInstallmentSlip && (() => {
        const q = quotations.find((x) => x.id === editingInvoice?.quotationId);
        const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
        const m = makeModels.find((x) => x.id === q?.makeModelId);
        return (
          <Modal open={!!viewingInstallmentSlip} onClose={() => setViewingInstallmentSlip(null)} title={`Installment Receipt — REC-${viewingInstallmentSlip.id}`} size="2xl">
            {editingInvoice && q && v && m ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InstallmentSlipPDFViewer
                    payment={viewingInstallmentSlip}
                    invoice={editingInvoice}
                    quotation={q}
                    vehicle={v}
                    make={m}
                  />
                </div>
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Actions</h3>
                    <button
                      onClick={() => downloadInstallmentSlipPDF({ payment: viewingInstallmentSlip, invoice: editingInvoice, quotation: q, vehicle: v, make: m })}
                      className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-white" />
                      Download Installment Slip
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p>Missing data to render receipt preview</p>
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
