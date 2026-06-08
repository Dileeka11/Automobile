import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useDataStore, toast } from '@/store';
import { VehicleModel } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

const schema = z.object({
  makeModelId: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  engineCapacity: z.string().min(1, 'Required'),
  color: z.string().min(1, 'Required'),
  grade: z.string().min(1, 'Required'),
  year: z.coerce.number().min(1980).max(new Date().getFullYear() + 1),
});
type FormData = z.infer<typeof schema>;

export default function VehicleModels() {
  const { vehicleModels, makeModels, addVehicleModel, updateVehicleModel, deleteVehicleModel } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleModel | null>(null);
  const [toDelete, setToDelete] = useState<VehicleModel | null>(null);
  const [query, setQuery] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openAdd = () => {
    setEditing(null);
    reset({ makeModelId: makeModels[0]?.id || '', name: '', engineCapacity: '', color: '', grade: '', year: new Date().getFullYear() });
    setModalOpen(true);
  };
  const openEdit = (v: VehicleModel) => { setEditing(v); reset(v); setModalOpen(true); };

  const onSubmit = (data: FormData) => {
    if (editing) { updateVehicleModel(editing.id, data); toast.success('Vehicle Model updated'); }
    else { addVehicleModel(data); toast.success('Vehicle Model added'); }
    setModalOpen(false);
  };

  const filtered = vehicleModels.filter((v) => {
    const make = makeModels.find((m) => m.id === v.makeModelId)?.name || '';
    return (`${make} ${v.name} ${v.color} ${v.grade} ${v.year}`).toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search vehicles..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Vehicle Model</button>
      </div>

      <div className="table-wrap flex-1 min-h-0 flex flex-col">
        {filtered.length === 0 ? <EmptyState title="No vehicle models" /> : (
          <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
            <table className="table w-full relative">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200"><tr><th>Make</th><th>Model</th><th>Year</th><th>Engine</th><th>Color</th><th>Grade</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((v) => {
                  const make = makeModels.find((m) => m.id === v.makeModelId);
                  return (
                    <tr key={v.id}>
                      <td className="font-medium">{make?.name || '—'}</td>
                      <td>{v.name}</td>
                      <td>{v.year}</td>
                      <td className="text-slate-600">{v.engineCapacity}</td>
                      <td className="text-slate-600">{v.color}</td>
                      <td className="text-slate-600">{v.grade}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setToDelete(v)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vehicle Model' : 'Add Vehicle Model'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Make Model</label>
              <select {...register('makeModelId')} className="input">
                {makeModels.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {errors.makeModelId && <p className="text-xs text-red-600 mt-1">{errors.makeModelId.message}</p>}
            </div>
            <div>
              <label className="label">Model Name</label>
              <input {...register('name')} className="input" placeholder="e.g. Aqua" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
            </div>
            <div><label className="label">Engine Capacity</label><input {...register('engineCapacity')} className="input" placeholder="e.g. 1500cc" /></div>
            <div><label className="label">Color</label><input {...register('color')} className="input" /></div>
            <div><label className="label">Grade</label><input {...register('grade')} className="input" /></div>
            <div><label className="label">Year</label><input type="number" {...register('year')} className="input" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { deleteVehicleModel(toDelete.id); toast.success('Vehicle Model deleted'); } }}
        message={`Delete "${toDelete?.name}"?`}
      />
    </div>
  );
}
