import { useCallback, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Move } from 'lucide-react';

interface Props {
  /** Object URL / data URL of the picked file */
  src: string;
  /** Output width in pixels; height follows the aspect ratio */
  outputWidth?: number;
  aspect?: number;
  /** Called with the cropped JPEG whenever the user confirms */
  onCropped: (blob: Blob) => void;
  onCancel: () => void;
  busy?: boolean;
  confirmLabel?: string;
}

const FRAME_W = 480;

/**
 * Minimal pan + zoom cropper with a fixed aspect ratio. The image is drawn into
 * the frame with a "cover" fit, and the same transform is replayed onto a canvas
 * so what the user frames is exactly what gets uploaded.
 */
export default function ImageCropper({
  src,
  outputWidth = 1200,
  aspect = 3 / 2,
  onCropped,
  onCancel,
  busy = false,
  confirmLabel = 'Use this image',
}: Props) {
  const frameH = Math.round(FRAME_W / aspect);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  /** Scale at which the image exactly covers the frame */
  const baseScale = natural ? Math.max(FRAME_W / natural.w, frameH / natural.h) : 1;
  const scale = baseScale * zoom;
  const drawW = natural ? natural.w * scale : 0;
  const drawH = natural ? natural.h * scale : 0;

  const clamp = useCallback(
    (o: { x: number; y: number }) => {
      const minX = FRAME_W - drawW;
      const minY = frameH - drawH;
      return {
        x: Math.min(0, Math.max(minX, o.x)),
        y: Math.min(0, Math.max(minY, o.y)),
      };
    },
    [drawW, drawH, frameH],
  );

  /** Zoom around the middle of the frame instead of the top-left corner */
  const applyZoom = (nextZoom: number) => {
    if (!natural) {
      setZoom(nextZoom);
      return;
    }
    const newScale = baseScale * nextZoom;
    const cx = (-offset.x + FRAME_W / 2) / scale;
    const cy = (-offset.y + frameH / 2) / scale;
    const nx = FRAME_W / 2 - cx * newScale;
    const ny = frameH / 2 - cy * newScale;
    setZoom(nextZoom);
    setOffset({
      x: Math.min(0, Math.max(FRAME_W - natural.w * newScale, nx)),
      y: Math.min(0, Math.max(frameH - natural.h * newScale, ny)),
    });
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    const w = el.naturalWidth;
    const h = el.naturalHeight;
    const base = Math.max(FRAME_W / w, frameH / h);
    setNatural({ w, h });
    setZoom(1);
    setOffset({ x: (FRAME_W - w * base) / 2, y: (frameH - h * base) / 2 });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const d = drag.current;
    setOffset(clamp({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    drag.current = null;
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img || !natural) return;

    const outW = outputWidth;
    const outH = Math.round(outputWidth / aspect);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Frame rectangle expressed in source-image pixels
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sw = FRAME_W / scale;
    const sh = frameH / scale;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob((blob) => blob && onCropped(blob), 'image/jpeg', 0.9);
  };

  return (
    <div className="space-y-3">
      <div
        className="relative mx-auto overflow-hidden rounded-xl border-2 border-dashed border-brand-300 bg-slate-100 cursor-move select-none touch-none"
        style={{ width: FRAME_W, height: frameH, maxWidth: '100%' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          src={src}
          onLoad={handleLoad}
          alt="Crop preview"
          draggable={false}
          className="absolute max-w-none origin-top-left pointer-events-none"
          style={{ width: drawW || undefined, height: drawH || undefined, left: offset.x, top: offset.y }}
        />
        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/40" />
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/50 px-2 py-1 text-[10px] font-semibold text-white pointer-events-none">
          <Move className="w-3 h-3" /> Drag to reposition
        </div>
      </div>

      <div className="flex items-center gap-3 mx-auto" style={{ maxWidth: FRAME_W }}>
        <ZoomOut className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => applyZoom(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <ZoomIn className="w-4 h-4 text-slate-400 flex-shrink-0" />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="button" onClick={handleConfirm} disabled={busy || !natural} className="btn-primary">
          {busy ? 'Uploading...' : confirmLabel}
        </button>
      </div>
    </div>
  );
}
