import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageCropper from '@/components/ui/ImageCropper';
import ClientsManager from '@/components/website/ClientsManager';
import { toast } from '@/store';

const API = '/backend/api/hero_slides.php';
const SLOTS = [1, 2, 3] as const;
/** Matches the hero carousel on the landing page */
const ASPECT = 3 / 2;
const OUTPUT_WIDTH = 1200;

/** Falls back to the bundled image when a slot has never been customised */
const DEFAULT_PREVIEW: Record<number, string> = {
  1: '/hero-car.png',
  2: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800',
  3: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=800',
};

interface HeroSlide {
  slot: number;
  filePath: string;
  altText: string | null;
  updatedAt: string | null;
}

const proxyUrl = (path: string) => `/backend/api/image.php?path=${encodeURIComponent(path)}`;

export default function WebsiteCustomize() {
  const [slides, setSlides] = useState<Record<number, HeroSlide>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [toReset, setToReset] = useState<number | null>(null);

  /* Cropper state */
  const [cropSlot, setCropSlot] = useState<number | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [altText, setAltText] = useState('');
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    try {
      const resp = await fetch(API);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const rows: HeroSlide[] = await resp.json();
      const map: Record<number, HeroSlide> = {};
      rows.forEach((r) => { map[r.slot] = r; });
      setSlides(map);
    } catch (e: any) {
      toast.error(e?.message || 'Could not load website images');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Release the object URL once the cropper closes
  useEffect(() => () => { if (cropSrc) URL.revokeObjectURL(cropSrc); }, [cropSrc]);

  const closeCropper = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropSlot(null);
    setAltText('');
  };

  const handlePick = (slot: number, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Please choose an image under 10MB');
      return;
    }
    setCropSrc(URL.createObjectURL(file));
    setCropSlot(slot);
    setAltText(slides[slot]?.altText || '');
  };

  const handleUpload = async (blob: Blob) => {
    if (cropSlot === null) return;
    setUploadingSlot(cropSlot);
    try {
      const fd = new FormData();
      fd.append('slot', String(cropSlot));
      fd.append('alt_text', altText);
      fd.append('file', blob, `hero_${cropSlot}.jpg`);

      const resp = await fetch(API, { method: 'POST', body: fd });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const saved: HeroSlide = await resp.json();
      setSlides((s) => ({ ...s, [saved.slot]: saved }));
      toast.success(`Slide ${cropSlot} updated`);
      closeCropper();
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleReset = async (slot: number) => {
    try {
      const resp = await fetch(`${API}?slot=${slot}`, { method: 'DELETE' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      setSlides((s) => {
        const next = { ...s };
        delete next[slot];
        return next;
      });
      toast.success(`Slide ${slot} reset to the default image`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not reset the slide');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-600" />
            Website Customize
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Replace the three images in the home page hero carousel. Pictures are cropped to 3:2
            ({OUTPUT_WIDTH} × {Math.round(OUTPUT_WIDTH / ASPECT)}) so they always fit the slider.
          </p>
        </div>
        <button onClick={load} className="btn-secondary" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {SLOTS.map((slot) => {
          const slide = slides[slot];
          const preview = slide ? proxyUrl(slide.filePath) : DEFAULT_PREVIEW[slot];
          return (
            <div key={slot} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="relative bg-slate-100">
                <img
                  src={preview}
                  alt={slide?.altText || `Hero slide ${slot}`}
                  className="w-full aspect-[3/2] object-cover"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 text-white text-[11px] font-bold">
                  Slide {slot}
                </span>
                {!slide && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-white/90 text-slate-600 text-[11px] font-semibold">
                    Default
                  </span>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="text-xs text-slate-500 min-h-[16px]">
                  {slide ? (
                    <>Uploaded {slide.updatedAt ? new Date(slide.updatedAt.replace(' ', 'T')).toLocaleString() : ''}</>
                  ) : (
                    <>No custom image — the built-in picture is shown.</>
                  )}
                </div>

                <input
                  ref={(el) => { fileInputs.current[slot] = el; }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handlePick(slot, e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputs.current[slot]?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {slide ? 'Replace Image' : 'Upload Image'}
                  </button>
                  {slide && (
                    <button
                      onClick={() => setToReset(slot)}
                      title="Reset to the default image"
                      className="px-3 rounded-lg border border-slate-200 text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ClientsManager />

      <Modal
        open={cropSlot !== null && !!cropSrc}
        onClose={closeCropper}
        title={`Crop image — Slide ${cropSlot ?? ''}`}
        size="lg"
      >
        {cropSrc && (
          <div className="space-y-4">
            <ImageCropper
              src={cropSrc}
              aspect={ASPECT}
              outputWidth={OUTPUT_WIDTH}
              busy={uploadingSlot !== null}
              onCropped={handleUpload}
              onCancel={closeCropper}
              confirmLabel="Crop & Upload"
            />
            <div>
              <label className="label text-xs">Image description (optional)</label>
              <input
                className="input text-xs"
                placeholder="e.g. Toyota Yaris on the showroom floor"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={toReset !== null}
        onClose={() => setToReset(null)}
        onConfirm={() => { if (toReset !== null) handleReset(toReset); }}
        message={`Reset slide ${toReset} back to the default image? The uploaded picture is deleted.`}
      />
    </div>
  );
}
