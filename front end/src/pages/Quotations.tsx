import { useMemo, useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search, Eye, Printer, FileText } from 'lucide-react';
import { useDataStore, toast, quotationTotal } from '@/store';
import { Quotation } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate, formatCurrency } from '@/utils';
import { QuotationPDFViewer, downloadQuotationPDF } from '@/components/pdf/QuotationPDF';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  address: z.string().min(2, 'Required'),
  nic: z.string().min(5, 'Invalid NIC'),
  mobileNo: z.string().min(7, 'Invalid mobile'),
  email: z.string().email('Invalid email'),
  makeModelId: z.string().min(1, 'Required'),
  vehicleModelId: z.string().min(1, 'Required'),
  mileage: z.coerce.number().min(0),
  cifValue: z.coerce.number().min(0),
  lcAmount: z.coerce.number().min(0),
  ttAmount: z.coerce.number().min(0),
  taxAmount: z.coerce.number().min(0),
  serviceCharge: z.coerce.number().min(0),
  clearingCharge: z.coerce.number().min(0),
  dmiCharge: z.coerce.number().min(0),
});
type FormData = z.infer<typeof schema>;

const numericFields = ['cifValue', 'lcAmount', 'ttAmount', 'taxAmount', 'serviceCharge', 'clearingCharge', 'dmiCharge'] as const;

const defaultFinancials = { mileage: 0, cifValue: 0, lcAmount: 0, ttAmount: 0, taxAmount: 0, serviceCharge: 0, clearingCharge: 0, dmiCharge: 0 };

export default function Quotations() {
  const { quotations, makeModels, vehicleModels, addQuotation, updateQuotation, deleteQuotation } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [toDelete, setToDelete] = useState<Quotation | null>(null);
  const [viewing, setViewing] = useState<Quotation | null>(null);
  const [query, setQuery] = useState('');

  const location = useLocation();
  const prefill = location.state?.prefill;

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const selectedMake = useWatch({ control, name: 'makeModelId' });
  const selectedVehicleId = useWatch({ control, name: 'vehicleModelId' });

  const filteredVehicles = useMemo(() => vehicleModels.filter((v) => v.makeModelId === selectedMake), [vehicleModels, selectedMake]);
  const selectedVehicle = useMemo(() => vehicleModels.find((v) => v.id === selectedVehicleId), [vehicleModels, selectedVehicleId]);

  // Watch all financial fields for live total
  const watchedCif = useWatch({ control, name: 'cifValue' }) || 0;
  const watchedLc = useWatch({ control, name: 'lcAmount' }) || 0;
  const watchedTt = useWatch({ control, name: 'ttAmount' }) || 0;
  const watchedTax = useWatch({ control, name: 'taxAmount' }) || 0;
  const watchedService = useWatch({ control, name: 'serviceCharge' }) || 0;
  const watchedClearing = useWatch({ control, name: 'clearingCharge' }) || 0;
  const watchedDmi = useWatch({ control, name: 'dmiCharge' }) || 0;
  const liveTotal = Number(watchedCif) + Number(watchedLc) + Number(watchedTt) + Number(watchedTax) + Number(watchedService) + Number(watchedClearing) + Number(watchedDmi);

  // Check for CRM prefill
  useEffect(() => {
    if (prefill) {
      setEditing(null);
      const firstMake = makeModels[0]?.id || '';
      const firstVeh = vehicleModels.find((v) => v.makeModelId === firstMake)?.id || '';
      reset({
        name: prefill.name || '',
        address: prefill.address || '',
        nic: prefill.nic || '',
        mobileNo: prefill.mobileNo || '',
        email: prefill.email || '',
        makeModelId: firstMake,
        vehicleModelId: firstVeh,
        ...defaultFinancials
      });
      setModalOpen(true);
      // Clear location state
      window.history.replaceState({}, document.title);
    }
  }, [prefill, makeModels, vehicleModels, reset]);

  const openAdd = () => {
    setEditing(null);
    const firstMake = makeModels[0]?.id || '';
    const firstVeh = vehicleModels.find((v) => v.makeModelId === firstMake)?.id || '';
    reset({ name: '', address: '', nic: '', mobileNo: '', email: '', makeModelId: firstMake, vehicleModelId: firstVeh, ...defaultFinancials });
    setModalOpen(true);
  };
  const openEdit = (q: Quotation) => {
    setEditing(q);
    reset({
      name: q.name,
      address: q.address,
      nic: q.nic,
      mobileNo: q.mobileNo,
      email: q.email,
      makeModelId: q.makeModelId,
      vehicleModelId: q.vehicleModelId,
      mileage: q.mileage || 0,
      cifValue: q.cifValue || 0,
      lcAmount: q.lcAmount || 0,
      ttAmount: q.ttAmount || 0,
      taxAmount: q.taxAmount || 0,
      serviceCharge: q.serviceCharge || 0,
      clearingCharge: q.clearingCharge || 0,
      dmiCharge: q.dmiCharge || 0,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) {
        await updateQuotation(editing.id, data);
        toast.success('Quotation updated');
      } else {
        await addQuotation(data);
        toast.success('Quotation created');
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'An error occurred');
    }
  };

  const filtered = quotations.filter((q) => (`${q.id} ${q.name} ${q.nic} ${q.email} ${q.mobileNo}`).toLowerCase().includes(query.toLowerCase()));

  const handlePrint = async (q: Quotation) => {
    const v = vehicleModels.find((x) => x.id === q.vehicleModelId);
    const m = makeModels.find((x) => x.id === q.makeModelId);
    if (!v || !m) { toast.error('Missing vehicle/make data'); return; }
    await downloadQuotationPDF({ quotation: q, vehicle: v, make: m });
    toast.success('PDF downloaded');
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotations..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5"><Plus className="w-4 h-4" /> New Quotation</button>
      </div>

      <div className="table-wrap flex-1 min-h-0 flex flex-col">
        {filtered.length === 0 ? <EmptyState title="No quotations" /> : (
          <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
            <table className="table w-full relative">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200"><tr><th>ID</th><th>Customer</th><th>NIC</th><th>Mobile</th><th>Vehicle</th><th>Total</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((q) => {
                  const v = vehicleModels.find((x) => x.id === q.vehicleModelId);
                  const m = makeModels.find((x) => x.id === q.makeModelId);
                  return (
                    <tr key={q.id}>
                      <td className="font-mono text-xs">{q.id}</td>
                      <td className="font-medium">{q.name}</td>
                      <td className="text-slate-600">{q.nic}</td>
                      <td className="text-slate-600">{q.mobileNo}</td>
                      <td><span className="text-slate-700">{m?.name} {v?.name}</span></td>
                      <td className="font-semibold text-brand-700">{formatCurrency(quotationTotal(q))}</td>
                      <td className="text-slate-500">{formatDate(q.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => setViewing(q)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(q)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="Edit"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handlePrint(q)} className="p-2 rounded-lg hover:bg-brand-50 text-brand-600" title="Print PDF"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => setToDelete(q)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Quotation' : 'New Quotation'} size="xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Full Name</label><input {...register('name')} placeholder="Enter customer full name (e.g. John Doe)" className="input" />{errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}</div>
            <div className="md:col-span-2"><label className="label">Address</label><input {...register('address')} placeholder="Enter customer residential or business address" className="input" />{errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}</div>
            <div><label className="label">NIC</label><input {...register('nic')} placeholder="Enter NIC number (e.g. 199912345678 or 991234567V)" className="input" />{errors.nic && <p className="text-xs text-red-600 mt-1">{errors.nic.message}</p>}</div>
            <div><label className="label">Mobile No</label><input {...register('mobileNo')} placeholder="Enter mobile phone number (e.g. 0771234567)" className="input" />{errors.mobileNo && <p className="text-xs text-red-600 mt-1">{errors.mobileNo.message}</p>}</div>
            <div className="md:col-span-2"><label className="label">Email</label><input type="email" {...register('email')} placeholder="Enter email address (e.g. john.doe@example.com)" className="input" />{errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}</div>
            <div>
              <label className="label">Make Model</label>
              <select {...register('makeModelId')} className="input" onChange={(e) => { register('makeModelId').onChange(e); const first = vehicleModels.find((v) => v.makeModelId === e.target.value); setValue('vehicleModelId', first?.id || ''); }}>
                {makeModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Vehicle Model</label>
              <select {...register('vehicleModelId')} className="input">
                {filteredVehicles.length === 0 && <option value="">No vehicles for this make</option>}
                {filteredVehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.year} {v.color} | {v.grade} | {v.engineCapacity}</option>)}
              </select>
              {errors.vehicleModelId && <p className="text-xs text-red-600 mt-1">{errors.vehicleModelId.message}</p>}
            </div>
          </div>

          {/* Vehicle Model Details Card */}
          {selectedVehicle && (
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 to-slate-50/80 p-4">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-3">Selected Vehicle Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">Model</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedVehicle.name}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">Grade</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedVehicle.grade || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">Engine Capacity</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedVehicle.engineCapacity || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">Year / Color</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedVehicle.year} — {selectedVehicle.color}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Details */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800">Cost Breakdown</h4>
              <div className="bg-brand-50 border border-brand-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-brand-600 font-medium mr-1">Total:</span>
                <span className="text-sm font-bold text-brand-700">{formatCurrency(liveTotal)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Mileage (km)</label><input type="number" {...register('mileage')} className="input" /></div>
              {numericFields.map((f) => (
                <div key={f}>
                  <label className="label">{f.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())} (LKR)</label>
                  <input type="number" step="0.01" {...register(f)} className="input" />
                  {errors[f] && <p className="text-xs text-red-600 mt-1">{errors[f]?.message}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary"><FileText className="w-4 h-4" /> {editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {viewing && (() => {
        const v = vehicleModels.find((x) => x.id === viewing.vehicleModelId);
        const m = makeModels.find((x) => x.id === viewing.makeModelId);
        return (
          <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Quotation ${viewing.id}`} size="xl">
            {v && m ? <QuotationPDFViewer quotation={viewing} vehicle={v} make={m} /> : <p>Missing data</p>}
          </Modal>
        );
      })()}

      <ConfirmDialog
        open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) {
            try {
              await deleteQuotation(toDelete.id);
              toast.success('Quotation deleted');
            } catch (e: any) {
              toast.error('Failed to delete quotation');
            }
          }
        }}
        message={`Delete quotation "${toDelete?.id}"?`}
      />
    </div>
  );
}
