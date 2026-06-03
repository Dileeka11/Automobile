import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search, Eye, Printer, FileText } from 'lucide-react';
import { useDataStore, toast } from '@/store';
import { Quotation } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/utils';
import { QuotationPDFViewer, downloadQuotationPDF } from '@/components/pdf/QuotationPDF';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  address: z.string().min(2, 'Required'),
  nic: z.string().min(5, 'Invalid NIC'),
  mobileNo: z.string().min(7, 'Invalid mobile'),
  email: z.string().email('Invalid email'),
  makeModelId: z.string().min(1, 'Required'),
  vehicleModelId: z.string().min(1, 'Required'),
});
type FormData = z.infer<typeof schema>;

export default function Quotations() {
  const { quotations, makeModels, vehicleModels, addQuotation, updateQuotation, deleteQuotation } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);
  const [toDelete, setToDelete] = useState<Quotation | null>(null);
  const [viewing, setViewing] = useState<Quotation | null>(null);
  const [query, setQuery] = useState('');

  const { register, handleSubmit, reset, control, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const selectedMake = useWatch({ control, name: 'makeModelId' });

  const filteredVehicles = useMemo(() => vehicleModels.filter((v) => v.makeModelId === selectedMake), [vehicleModels, selectedMake]);

  const openAdd = () => {
    setEditing(null);
    const firstMake = makeModels[0]?.id || '';
    const firstVeh = vehicleModels.find((v) => v.makeModelId === firstMake)?.id || '';
    reset({ name: '', address: '', nic: '', mobileNo: '', email: '', makeModelId: firstMake, vehicleModelId: firstVeh });
    setModalOpen(true);
  };
  const openEdit = (q: Quotation) => { setEditing(q); reset(q); setModalOpen(true); };

  const onSubmit = (data: FormData) => {
    if (editing) { updateQuotation(editing.id, data); toast.success('Quotation updated'); }
    else { addQuotation(data); toast.success('Quotation created'); }
    setModalOpen(false);
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search quotations..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> New Quotation</button>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? <EmptyState title="No quotations" /> : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Customer</th><th>NIC</th><th>Mobile</th><th>Vehicle</th><th>Date</th><th className="text-right">Actions</th></tr></thead>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><label className="label">Full Name</label><input {...register('name')} className="input" />{errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}</div>
            <div className="md:col-span-2"><label className="label">Address</label><input {...register('address')} className="input" />{errors.address && <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>}</div>
            <div><label className="label">NIC</label><input {...register('nic')} className="input" />{errors.nic && <p className="text-xs text-red-600 mt-1">{errors.nic.message}</p>}</div>
            <div><label className="label">Mobile No</label><input {...register('mobileNo')} className="input" />{errors.mobileNo && <p className="text-xs text-red-600 mt-1">{errors.mobileNo.message}</p>}</div>
            <div className="md:col-span-2"><label className="label">Email</label><input type="email" {...register('email')} className="input" />{errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}</div>
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
                {filteredVehicles.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.year} {v.color}</option>)}
              </select>
              {errors.vehicleModelId && <p className="text-xs text-red-600 mt-1">{errors.vehicleModelId.message}</p>}
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
        onConfirm={() => { if (toDelete) { deleteQuotation(toDelete.id); toast.success('Quotation deleted'); } }}
        message={`Delete quotation "${toDelete?.id}"?`}
      />
    </div>
  );
}
