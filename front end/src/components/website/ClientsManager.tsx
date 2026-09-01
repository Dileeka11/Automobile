import { useEffect, useRef, useState } from 'react';
import { UserSquare2, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageCropper from '@/components/ui/ImageCropper';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/store';

const API = '/backend/api/clients.php';
/** Client cards are square on the landing page */
const ASPECT = 1;
const OUTPUT_WIDTH = 600;

export interface SiteClient {
  id: number;
  name: string;
  city: string | null;
  filePath: string | null;
  sortOrder: number;
}

const proxyUrl = (path: string) => `/backend/api/image.php?path=${encodeURIComponent(path)}`;

export default function ClientsManager() {
  const [clients, setClients] = useState<SiteClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<SiteClient | null>(null);

  /* Add / edit form */
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SiteClient | null>(null);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [pickedSrc, setPickedSrc] = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await fetch(API);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setClients(await resp.json());
    } catch (e: any) {
      toast.error(e?.message || 'Could not load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    if (pickedSrc) URL.revokeObjectURL(pickedSrc);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    setPickedSrc(null);
    setCroppedBlob(null);
    setCroppedPreview(null);
    setName('');
    setCity('');
    setEditing(null);
  };

  const closeForm = () => {
    resetForm();
    setFormOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (c: SiteClient) => {
    resetForm();
    setEditing(c);
    setName(c.name);
    setCity(c.city || '');
    setFormOpen(true);
  };

  const handlePick = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Please choose an image under 10MB');
      return;
    }
    if (pickedSrc) URL.revokeObjectURL(pickedSrc);
    setPickedSrc(URL.createObjectURL(file));
  };

  const handleCropped = (blob: Blob) => {
    if (pickedSrc) URL.revokeObjectURL(pickedSrc);
    if (croppedPreview) URL.revokeObjectURL(croppedPreview);
    setPickedSrc(null);
    setCroppedBlob(blob);
    setCroppedPreview(URL.createObjectURL(blob));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Client name is required');
      return;
    }
    if (!editing && !croppedBlob) {
      toast.error('Please add a picture');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      if (editing) fd.append('id', String(editing.id));
      fd.append('name', name.trim());
      fd.append('city', city.trim());
      if (croppedBlob) fd.append('file', croppedBlob, 'client.jpg');

      const resp = await fetch(API, { method: 'POST', body: fd });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const saved: SiteClient = await resp.json();
      setClients((list) =>
        editing ? list.map((c) => (c.id === saved.id ? saved : c)) : [...list, saved],
      );
      toast.success(editing ? 'Client updated' : 'Client added');
      closeForm();
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: SiteClient) => {
    try {
      const resp = await fetch(`${API}?id=${c.id}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setClients((list) => list.filter((x) => x.id !== c.id));
      toast.success('Client removed');
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove the client');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap border-t border-slate-200 pt-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserSquare2 className="w-5 h-5 text-brand-600" />
            Our Clients
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Cards shown in the "Our Clients" strip on the home page — five per row. Add more than
            five and the strip gets arrows so visitors can browse the rest.
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500 italic py-6">Loading clients...</p>
      ) : clients.length === 0 ? (
        <EmptyState
          title="No clients yet"
          message="Add your first client and it appears on the home page right away."
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm group">
              <div className="relative bg-slate-100">
                {c.filePath ? (
                  <img src={proxyUrl(c.filePath)} alt={c.name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center text-slate-300">
                    <UserSquare2 className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(c)}
                    title="Edit"
                    className="p-2 rounded-lg bg-white text-brand-600 hover:bg-brand-50"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(c)}
                    title="Remove"
                    className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm text-slate-800 truncate" title={c.name}>{c.name}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {c.city || '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editing ? `Edit Client — ${editing.name}` : 'Add Client'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                placeholder="e.g. Mr. Nuwan Sameera"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                className="input"
                placeholder="e.g. Matara"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handlePick(e.target.files?.[0]);
              e.target.value = '';
            }}
          />

          {pickedSrc ? (
            <div>
              <label className="label">Crop the picture (square)</label>
              <ImageCropper
                src={pickedSrc}
                aspect={ASPECT}
                outputWidth={OUTPUT_WIDTH}
                onCropped={handleCropped}
                onCancel={() => {
                  URL.revokeObjectURL(pickedSrc);
                  setPickedSrc(null);
                }}
                confirmLabel="Apply crop"
              />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-28 h-28 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                {croppedPreview ? (
                  <img src={croppedPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : editing?.filePath ? (
                  <img src={proxyUrl(editing.filePath)} alt={editing.name} className="w-full h-full object-cover" />
                ) : (
                  <UserSquare2 className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="space-y-1">
                <button type="button" onClick={() => fileInput.current?.click()} className="btn-secondary">
                  {croppedPreview || editing?.filePath ? 'Change Picture' : 'Choose Picture'}
                </button>
                <p className="text-xs text-slate-400">
                  Cropped to a square, {OUTPUT_WIDTH} × {OUTPUT_WIDTH}.
                </p>
              </div>
            </div>
          )}

          {!pickedSrc && (
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={closeForm} className="btn-secondary">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) handleDelete(toDelete); }}
        message={`Remove "${toDelete?.name}" from the home page clients?`}
      />
    </div>
  );
}
