import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useDataStore, toast } from '@/store';
import { MakeModel } from '@/types';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';

const schema = z.object({ name: z.string().min(2, 'Name must be at least 2 characters') });
type FormData = z.infer<typeof schema>;

export default function MakeModels() {
  const { makeModels, addMakeModel, updateMakeModel, deleteMakeModel } = useDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MakeModel | null>(null);
  const [toDelete, setToDelete] = useState<MakeModel | null>(null);
  const [query, setQuery] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openAdd = () => { setEditing(null); reset({ name: '' }); setModalOpen(true); };
  const openEdit = (m: MakeModel) => { setEditing(m); reset({ name: m.name }); setModalOpen(true); };

  const onSubmit = (data: FormData) => {
    if (editing) { updateMakeModel(editing.id, data); toast.success('Make Model updated'); }
    else { addMakeModel(data); toast.success('Make Model added'); }
    setModalOpen(false);
  };

  const filtered = makeModels.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search makes..." className="bg-transparent outline-none text-sm w-full" />
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Make Model</button>
      </div>

      <div className="table-wrap flex-1 overflow-auto min-h-0">
        {filtered.length === 0 ? <EmptyState title="No make models" message="Click 'Add Make Model' to create one." /> : (
          <table className="table">
            <thead><tr><th>ID</th><th>Name</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono text-xs text-slate-500">{m.id}</td>
                  <td className="font-medium">{m.name}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setToDelete(m)} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Make Model' : 'Add Make Model'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input {...register('name')} className="input" placeholder="e.g. Toyota" autoFocus />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { deleteMakeModel(toDelete.id); toast.success('Make Model deleted'); } }}
        message={`Delete "${toDelete?.name}"? Associated vehicle models may become orphaned.`}
      />
    </div>
  );
}
