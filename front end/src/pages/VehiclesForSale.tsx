import { useEffect, useRef, useState } from 'react';
import { CarFront, Plus, Pencil, Trash2, RefreshCw, Images, ImagePlus, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageCropper from '@/components/ui/ImageCropper';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/store';
import type { SaleVehicle, SaleVehicleStatus } from '@/types';

const API = '/backend/api/sale_vehicles.php';
/** All listing photos share the 3:2 frame used by the website cards and gallery */
const ASPECT = 3 / 2;
const OUTPUT_WIDTH = 1200;
const MAX_GALLERY = 5;

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT', 'Tiptronic'];
const CONDITIONS = ['Brand New', 'Reconditioned', 'Used'];
const STATUS_LABEL: Record<SaleVehicleStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold: 'Sold',
};
const STATUS_STYLE: Record<SaleVehicleStatus, string> = {
  available: 'bg-emerald-500 text-white',
  reserved: 'bg-amber-500 text-white',
  sold: 'bg-slate-700 text-white',
};

const proxyUrl = (path: string) => `/backend/api/image.php?path=${encodeURIComponent(path)}`;
const formatPrice = (n: number) => `LKR ${Math.round(n).toLocaleString('en-LK')}`;

interface FormState {
  title: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  fuelType: string;
  transmission: string;
  engineCc: string;
  color: string;
  condition: string;
  price: string;
  description: string;
  status: SaleVehicleStatus;
}

const EMPTY_FORM: FormState = {
  title: '', make: '', model: '', year: '', mileage: '', fuelType: '', transmission: '',
  engineCc: '', color: '', condition: '', price: '', description: '', status: 'available',
};

const toForm = (v: SaleVehicle): FormState => ({
  title: v.title,
  make: v.make || '',
  model: v.model || '',
  year: v.year ? String(v.year) : '',
  mileage: v.mileage !== null ? String(v.mileage) : '',
  fuelType: v.fuelType || '',
  transmission: v.transmission || '',
  engineCc: v.engineCc ? String(v.engineCc) : '',
  color: v.color || '',
  condition: v.condition || '',
  price: String(v.price),
  description: v.description || '',
  status: v.status,
});

async function readError(resp: Response) {
  const err = await resp.json().catch(() => ({}));
  return new Error(err.error || `HTTP ${resp.status}`);
}

export default function VehiclesForSale() {
  const [vehicles, setVehicles] = useState<SaleVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<SaleVehicle | null>(null);

  /* Add / edit modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<'details' | 'photos'>('details');
  const [editing, setEditing] = useState<SaleVehicle | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  /* Cover image: picked → cropped → uploaded with the form */
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement | null>(null);

  /* Gallery image: picked → cropped → uploaded straight away */
  const [gallerySrc, setGallerySrc] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const galleryInput = useRef<HTMLInputElement | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const resp = await fetch(API);
      if (!resp.ok) throw await readError(resp);
      setVehicles(await resp.json());
    } catch (e: any) {
      toast.error(e?.message || 'Could not load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const clearImages = () => {
    [coverSrc, coverPreview, gallerySrc].forEach((u) => u && URL.revokeObjectURL(u));
    setCoverSrc(null);
    setCoverBlob(null);
    setCoverPreview(null);
    setGallerySrc(null);
  };

  const closeModal = () => {
    clearImages();
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openAdd = () => {
    clearImages();
    setEditing(null);
    setForm(EMPTY_FORM);
    setTab('details');
    setModalOpen(true);
  };

  const openEdit = (v: SaleVehicle, startTab: 'details' | 'photos' = 'details') => {
    clearImages();
    setEditing(v);
    setForm(toForm(v));
    setTab(startTab);
    setModalOpen(true);
  };

  /** Keep the list and the open modal in sync with what the server returned */
  const applySaved = (saved: SaleVehicle) => {
    setVehicles((list) =>
      list.some((v) => v.id === saved.id)
        ? list.map((v) => (v.id === saved.id ? saved : v))
        : [saved, ...list],
    );
    setEditing(saved);
  };

  const validImage = (file: File | undefined): file is File => {
    if (!file) return false;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Please choose an image under 10MB');
      return false;
    }
    return true;
  };

  const handleCoverCropped = (blob: Blob) => {
    if (coverSrc) URL.revokeObjectURL(coverSrc);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverSrc(null);
    setCoverBlob(blob);
    setCoverPreview(URL.createObjectURL(blob));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Vehicle title is required');
    if (!(Number(form.price) > 0)) return toast.error('Please enter a price');
    if (!editing && !coverBlob) return toast.error('Please add the main image');

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('action', 'save');
      if (editing) fd.append('id', String(editing.id));
      fd.append('title', form.title.trim());
      fd.append('make', form.make);
      fd.append('model', form.model);
      fd.append('year', form.year);
      fd.append('mileage', form.mileage);
      fd.append('fuel_type', form.fuelType);
      fd.append('transmission', form.transmission);
      fd.append('engine_cc', form.engineCc);
      fd.append('color', form.color);
      fd.append('condition', form.condition);
      fd.append('price', form.price);
      fd.append('description', form.description);
      fd.append('status', form.status);
      if (coverBlob) fd.append('cover', coverBlob, 'cover.jpg');

      const resp = await fetch(API, { method: 'POST', body: fd });
      if (!resp.ok) throw await readError(resp);
      const saved: SaleVehicle = await resp.json();
      const isNew = !editing;
      applySaved(saved);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverBlob(null);
      setCoverPreview(null);

      if (isNew) {
        toast.success('Vehicle added — now add up to 5 more photos');
        setTab('photos');
      } else {
        toast.success('Vehicle updated');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Could not save the vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleGalleryCropped = async (blob: Blob) => {
    if (!editing) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('action', 'add_image');
      fd.append('vehicle_id', String(editing.id));
      fd.append('file', blob, 'photo.jpg');
      const resp = await fetch(API, { method: 'POST', body: fd });
      if (!resp.ok) throw await readError(resp);
      applySaved(await resp.json());
      if (gallerySrc) URL.revokeObjectURL(gallerySrc);
      setGallerySrc(null);
      toast.success('Photo added');
    } catch (e: any) {
      toast.error(e?.message || 'Could not upload the photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async (imageId: number) => {
    try {
      const resp = await fetch(`${API}?image_id=${imageId}`, { method: 'DELETE' });
      if (!resp.ok) throw await readError(resp);
      applySaved(await resp.json());
      toast.success('Photo removed');
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove the photo');
    }
  };

  const handleDelete = async (v: SaleVehicle) => {
    try {
      const resp = await fetch(`${API}?id=${v.id}`, { method: 'DELETE' });
      if (!resp.ok) throw await readError(resp);
      setVehicles((list) => list.filter((x) => x.id !== v.id));
      toast.success('Vehicle removed from the website');
    } catch (e: any) {
      toast.error(e?.message || 'Could not remove the vehicle');
    }
  };

  const photoCount = editing?.images.length ?? 0;
  const coverShown = coverPreview || (editing ? proxyUrl(editing.coverPath) : null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CarFront className="w-5 h-5 text-brand-600" />
            Vehicles For Sale
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Listings shown in the "Vehicles For Sale" section of the website. Each vehicle has one
            main image plus up to {MAX_GALLERY} extra photos.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-secondary" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {loading && vehicles.length === 0 ? (
        <p className="text-sm text-slate-500 italic py-6">Loading vehicles...</p>
      ) : vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles listed"
          message="Add a vehicle and it appears on the website's For Sale section right away."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <div key={v.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
              <div className="relative bg-slate-100">
                <img src={proxyUrl(v.coverPath)} alt={v.title} className="w-full aspect-[3/2] object-cover" />
                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold ${STATUS_STYLE[v.status]}`}>
                  {STATUS_LABEL[v.status]}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] font-semibold flex items-center gap-1">
                  <Images className="w-3 h-3" />
                  {1 + v.images.length}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div>
                  <p className="font-bold text-slate-900 truncate" title={v.title}>{v.title}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {[v.year, v.mileage !== null ? `${v.mileage.toLocaleString()} km` : null, v.fuelType, v.transmission]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
                <p className="text-lg font-black text-brand-700">{formatPrice(v.price)}</p>
                <div className="flex gap-2 mt-auto">
                  <button onClick={() => openEdit(v)} className="btn-secondary flex-1 text-xs">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => openEdit(v, 'photos')} className="btn-secondary flex-1 text-xs">
                    <ImagePlus className="w-3.5 h-3.5" /> Photos ({v.images.length}/{MAX_GALLERY})
                  </button>
                  <button
                    onClick={() => setToDelete(v)}
                    title="Remove"
                    className="px-3 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? `Edit — ${editing.title}` : 'Add Vehicle For Sale'}
        size="xl"
      >
        {/* Tabs — photos unlock once the vehicle is saved */}
        <div className="flex gap-1 border-b border-slate-200 mb-5 -mt-1">
          {(['details', 'photos'] as const).map((t) => {
            const disabled = t === 'photos' && !editing;
            return (
              <button
                key={t}
                type="button"
                disabled={disabled}
                onClick={() => setTab(t)}
                title={disabled ? 'Save the vehicle first' : undefined}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
                  tab === t
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {t === 'details' ? '1. Main image & details' : `2. More photos (${photoCount}/${MAX_GALLERY})`}
              </button>
            );
          })}
        </div>

        {tab === 'details' && (
          <div className="space-y-5">
            {/* Cover image */}
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (validImage(f)) {
                  if (coverSrc) URL.revokeObjectURL(coverSrc);
                  setCoverSrc(URL.createObjectURL(f));
                }
                e.target.value = '';
              }}
            />
            {coverSrc ? (
              <div>
                <label className="label">Crop the main image (3:2)</label>
                <ImageCropper
                  src={coverSrc}
                  aspect={ASPECT}
                  outputWidth={OUTPUT_WIDTH}
                  onCropped={handleCoverCropped}
                  onCancel={() => {
                    URL.revokeObjectURL(coverSrc);
                    setCoverSrc(null);
                  }}
                  confirmLabel="Apply crop"
                />
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="w-full sm:w-64 aspect-[3/2] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center flex-shrink-0 hover:border-brand-400 transition"
                >
                  {coverShown ? (
                    <img src={coverShown} alt="Main" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-slate-400 text-xs font-semibold">
                      <ImagePlus className="w-7 h-7" />
                      Add main image
                    </span>
                  )}
                </button>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-800">Main image <span className="text-red-500">*</span></p>
                  <p className="text-xs text-slate-500">
                    Shown on the website card. Cropped to 3:2 ({OUTPUT_WIDTH} × {Math.round(OUTPUT_WIDTH / ASPECT)}).
                  </p>
                  <button type="button" onClick={() => coverInput.current?.click()} className="btn-secondary text-xs mt-1">
                    {coverShown ? 'Change image' : 'Choose image'}
                  </button>
                </div>
              </div>
            )}

            {!coverSrc && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <label className="label">Title <span className="text-red-500">*</span></label>
                    <input className="input" placeholder="e.g. Toyota Premio G Superior" value={form.title} onChange={(e) => set('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Price (LKR) <span className="text-red-500">*</span></label>
                    <input className="input" type="number" min="0" placeholder="e.g. 14500000" value={form.price} onChange={(e) => set('price', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Make</label>
                    <input className="input" placeholder="e.g. Toyota" value={form.make} onChange={(e) => set('make', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Model</label>
                    <input className="input" placeholder="e.g. Premio" value={form.model} onChange={(e) => set('model', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Year</label>
                    <input className="input" type="number" min="1950" max="2100" placeholder="e.g. 2019" value={form.year} onChange={(e) => set('year', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Mileage (km)</label>
                    <input className="input" type="number" min="0" placeholder="e.g. 42000" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Engine (cc)</label>
                    <input className="input" type="number" min="0" placeholder="e.g. 1500" value={form.engineCc} onChange={(e) => set('engineCc', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Colour</label>
                    <input className="input" placeholder="e.g. Pearl White" value={form.color} onChange={(e) => set('color', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Fuel type</label>
                    <select className="input" value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)}>
                      <option value="">—</option>
                      {FUEL_TYPES.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Transmission</label>
                    <select className="input" value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                      <option value="">—</option>
                      {TRANSMISSIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Condition</label>
                    <select className="input" value={form.condition} onChange={(e) => set('condition', e.target.value)}>
                      <option value="">—</option>
                      {CONDITIONS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={form.status} onChange={(e) => set('status', e.target.value as SaleVehicleStatus)}>
                      {(Object.keys(STATUS_LABEL) as SaleVehicleStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input resize-y"
                    rows={5}
                    maxLength={5000}
                    placeholder="Features, options, service history, auction grade..."
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button type="button" onClick={closeModal} className="btn-secondary">Close</button>
                  <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
                    {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save & Add Photos'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'photos' && editing && (
          <div className="space-y-5">
            <input
              ref={galleryInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (validImage(f)) {
                  if (gallerySrc) URL.revokeObjectURL(gallerySrc);
                  setGallerySrc(URL.createObjectURL(f));
                }
                e.target.value = '';
              }}
            />

            {gallerySrc ? (
              <div>
                <label className="label">Crop the photo (3:2)</label>
                <ImageCropper
                  src={gallerySrc}
                  aspect={ASPECT}
                  outputWidth={OUTPUT_WIDTH}
                  busy={uploadingPhoto}
                  onCropped={handleGalleryCropped}
                  onCancel={() => {
                    URL.revokeObjectURL(gallerySrc);
                    setGallerySrc(null);
                  }}
                  confirmLabel="Crop & Upload"
                />
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Add up to {MAX_GALLERY} extra photos — interior, rear, engine bay, dashboard. They appear in
                  the gallery when a visitor opens this vehicle on the website.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={proxyUrl(editing.coverPath)} alt="Main" className="w-full aspect-[3/2] object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-600 text-white text-[10px] font-bold">MAIN</span>
                  </div>
                  {Array.from({ length: MAX_GALLERY }).map((_, i) => {
                    const img = editing.images[i];
                    if (img) {
                      return (
                        <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200 group">
                          <img src={proxyUrl(img.filePath)} alt={`Photo ${i + 1}`} className="w-full aspect-[3/2] object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">{i + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(img.id)}
                            title="Remove photo"
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white shadow opacity-100 sm:opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }
                    const isNextSlot = i === editing.images.length;
                    return (
                      <button
                        key={`empty-${i}`}
                        type="button"
                        disabled={!isNextSlot}
                        onClick={() => galleryInput.current?.click()}
                        className="aspect-[3/2] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-1 text-xs font-semibold text-slate-400 hover:border-brand-400 hover:text-brand-600 transition disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:text-slate-400 disabled:cursor-default"
                      >
                        <ImagePlus className="w-6 h-6" />
                        {isNextSlot ? 'Add photo' : `Photo ${i + 1}`}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-3 border-t">
                  <button type="button" onClick={closeModal} className="btn-primary">Done</button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) handleDelete(toDelete); }}
        message={`Remove "${toDelete?.title}" and all of its photos from the website?`}
      />
    </div>
  );
}
