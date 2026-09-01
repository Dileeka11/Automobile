import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Printer, Save, RotateCcw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { toast } from '@/store';
import { Invoice, MakeModel, Quotation, VehicleModel } from '@/types';
import { quotationTotal } from '@/utils';
import {
  LeaseInvoiceData,
  LeaseInvoicePDFViewer,
  downloadLeaseInvoicePDF,
} from '@/components/pdf/LeaseInvoicePDF';

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
  /** Advance already collected (advance + LC + other + installments) */
  totalAdvance: number;
  onDownloaded?: () => void;
}

const DEFAULT_DIRECTOR = 'K. M. C. DILHAN ABEYRATHNA';
const API = '/backend/api/lease_invoices.php';

const todayIso = () => new Date().toISOString().split('T')[0];

/** Invoice numbering used on the printed form: <seq>-<DDMMYYYY> */
const buildInvoiceNo = (invoiceId: string, iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp = Number.isNaN(d.getTime())
    ? ''
    : `${p(d.getDate())}${p(d.getMonth() + 1)}${d.getFullYear()}`;
  const seq = (invoiceId.match(/\d+/g)?.pop() || invoiceId).slice(-4);
  return `${seq}-${stamp}`;
};

const withBalance = (f: LeaseInvoiceData): LeaseInvoiceData => ({
  ...f,
  balance: Math.max(0, (f.totalCost || 0) - (f.advance || 0) - (f.leaseAmount || 0)),
});

const Section = ({ children }: { children: ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 pt-1">{children}</p>
);

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <label className="label text-xs">{label}</label>
    {children}
  </div>
);

export default function LeaseInvoiceModal({
  open,
  onClose,
  invoice,
  quotation,
  vehicle,
  make,
  totalAdvance,
  onDownloaded,
}: Props) {
  const total = quotationTotal(quotation);

  /** Values derived from the invoice/quotation — used until something is saved */
  const buildDefaults = useCallback((): LeaseInvoiceData => {
    const iso = todayIso();
    return withBalance({
      date: iso,
      invoiceNo: buildInvoiceNo(invoice.id, iso),
      customerName: quotation.name,
      address: quotation.address,
      telNo: quotation.mobileNo,
      bankName: '',
      bankBranch: '',
      forSale: quotation.name,
      make: make.name,
      model: vehicle.name,
      yom: String(vehicle.year ?? ''),
      engineCapacity: vehicle.engineCapacity || '',
      chassisNumber: '',
      engineNumber: '',
      advance: totalAdvance,
      leaseAmount: Math.max(0, total - totalAdvance),
      balance: 0,
      totalCost: total,
      directorName: DEFAULT_DIRECTOR,
    });
  }, [invoice.id, quotation, make, vehicle, total, totalAdvance]);

  const [form, setForm] = useState<LeaseInvoiceData>(buildDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  /** Snapshot of the last loaded/saved state, to detect unsaved edits */
  const baseline = useRef<string>('');
  /** Kept in a ref so a store refresh cannot re-trigger the load and drop edits */
  const buildDefaultsRef = useRef(buildDefaults);
  buildDefaultsRef.current = buildDefaults;

  const data = useMemo(() => withBalance(form), [form]);
  const dirty = JSON.stringify(data) !== baseline.current;

  const set = <K extends keyof LeaseInvoiceData>(key: K, value: LeaseInvoiceData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* Load the saved lease invoice; fall back to computed defaults when there is none */
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    (async () => {
      let next = buildDefaultsRef.current();
      let stamp: string | null = null;
      try {
        const resp = await fetch(`${API}?invoiceId=${encodeURIComponent(invoice.id)}`);
        if (resp.ok) {
          const saved = await resp.json();
          if (saved && saved.invoiceNo !== undefined) {
            // Saved values win — the document only changes when the user changes it
            next = withBalance({
              date: (saved.date || next.date).split(' ')[0],
              invoiceNo: saved.invoiceNo ?? next.invoiceNo,
              customerName: saved.customerName ?? next.customerName,
              address: saved.address ?? next.address,
              telNo: saved.telNo ?? next.telNo,
              bankName: saved.bankName ?? '',
              bankBranch: saved.bankBranch ?? '',
              forSale: saved.forSale ?? next.forSale,
              make: saved.make ?? next.make,
              model: saved.model ?? next.model,
              yom: saved.yom ?? next.yom,
              engineCapacity: saved.engineCapacity ?? next.engineCapacity,
              chassisNumber: saved.chassisNumber ?? '',
              engineNumber: saved.engineNumber ?? '',
              advance: Number(saved.advance) || 0,
              leaseAmount: Number(saved.leaseAmount) || 0,
              balance: 0,
              totalCost: Number(saved.totalCost) || 0,
              directorName: saved.directorName || DEFAULT_DIRECTOR,
            });
            stamp = saved.updatedAt || null;
          }
        }
      } catch {
        /* offline / not migrated yet — keep the computed defaults */
      }
      if (!active) return;
      baseline.current = JSON.stringify(next);
      setForm(next);
      setSavedAt(stamp);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [open, invoice.id]);

  /* Debounce so the preview is not rebuilt on every keystroke */
  const [previewData, setPreviewData] = useState<LeaseInvoiceData>(data);
  useEffect(() => {
    const t = setTimeout(() => setPreviewData(data), 500);
    return () => clearTimeout(t);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, ...data }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      baseline.current = JSON.stringify(data);
      setSavedAt(new Date().toISOString());
      setForm((f) => ({ ...f })); // refresh the dirty flag
      toast.success('Lease invoice details saved');
    } catch (e: any) {
      toast.error(e?.message || 'Could not save lease invoice details');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(buildDefaults());
    toast.info('Reloaded from the invoice — press Save to keep it');
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadLeaseInvoicePDF(data);
      onDownloaded?.();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Lease Invoice — ${invoice.id}`} size="2xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LeaseInvoicePDFViewer data={previewData} />
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Lease Invoice Details</h3>
              <button
                type="button"
                onClick={handleReset}
                title="Reload every field from the invoice"
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-brand-600 font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 italic py-4">Loading saved details...</p>
            ) : (
              <>
                {/* ── Document ── */}
                <Section>Document</Section>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Date">
                    <input
                      type="date"
                      className="input text-xs"
                      value={form.date}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          date: e.target.value,
                          invoiceNo: buildInvoiceNo(invoice.id, e.target.value),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Invoice No">
                    <input
                      className="input text-xs"
                      value={form.invoiceNo}
                      onChange={(e) => set('invoiceNo', e.target.value)}
                    />
                  </Field>
                </div>

                {/* ── Customer ── */}
                <Section>Customer</Section>
                <Field label="Name">
                  <input
                    className="input text-xs"
                    value={form.customerName}
                    onChange={(e) => set('customerName', e.target.value)}
                  />
                </Field>
                <Field label="Address">
                  <input
                    className="input text-xs"
                    value={form.address}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Tel. No">
                    <input
                      className="input text-xs"
                      value={form.telNo}
                      onChange={(e) => set('telNo', e.target.value)}
                    />
                  </Field>
                  <Field label="For Sale">
                    <input
                      className="input text-xs"
                      value={form.forSale}
                      onChange={(e) => set('forSale', e.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Bank Name">
                    <input
                      className="input text-xs"
                      placeholder="e.g. SAMPATH BANK"
                      value={form.bankName}
                      onChange={(e) => set('bankName', e.target.value)}
                    />
                  </Field>
                  <Field label="Bank Branch">
                    <input
                      className="input text-xs"
                      placeholder="e.g. Basar Branch, Mathara"
                      value={form.bankBranch}
                      onChange={(e) => set('bankBranch', e.target.value)}
                    />
                  </Field>
                </div>

                {/* ── Vehicle ── */}
                <Section>Vehicle</Section>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Make">
                    <input
                      className="input text-xs"
                      placeholder="e.g. TOYOTA"
                      value={form.make}
                      onChange={(e) => set('make', e.target.value)}
                    />
                  </Field>
                  <Field label="Model">
                    <input
                      className="input text-xs"
                      placeholder="e.g. 5BA-KSP210 YARIS G"
                      value={form.model}
                      onChange={(e) => set('model', e.target.value)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="YOM">
                    <input
                      className="input text-xs"
                      placeholder="e.g. 2026"
                      value={form.yom}
                      onChange={(e) => set('yom', e.target.value)}
                    />
                  </Field>
                  <Field label="Engine Capacity">
                    <input
                      className="input text-xs"
                      placeholder="e.g. 996CC"
                      value={form.engineCapacity}
                      onChange={(e) => set('engineCapacity', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="Chassis Number">
                  <input
                    className="input text-xs"
                    placeholder="e.g. KSP210-0161362"
                    value={form.chassisNumber}
                    onChange={(e) => set('chassisNumber', e.target.value)}
                  />
                </Field>
                <Field label="Engine Number">
                  <input
                    className="input text-xs"
                    placeholder="e.g. 1KR-3735043"
                    value={form.engineNumber}
                    onChange={(e) => set('engineNumber', e.target.value)}
                  />
                </Field>

                {/* ── Amounts ── */}
                <Section>Amounts</Section>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Advance (LKR)">
                    <input
                      type="number"
                      className="input text-xs"
                      value={form.advance}
                      onChange={(e) => set('advance', Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Lease Amount (LKR)">
                    <input
                      type="number"
                      className="input text-xs"
                      value={form.leaseAmount}
                      onChange={(e) => set('leaseAmount', Number(e.target.value) || 0)}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Total Cost (LKR)">
                    <input
                      type="number"
                      className="input text-xs"
                      value={form.totalCost}
                      onChange={(e) => set('totalCost', Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Balance (LKR)">
                    <input
                      className="input text-xs bg-slate-100"
                      value={data.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      readOnly
                    />
                  </Field>
                </div>

                {/* ── Signature ── */}
                <Section>Signature</Section>
                <Field label="Director Name">
                  <input
                    className="input text-xs"
                    value={form.directorName}
                    onChange={(e) => set('directorName', e.target.value)}
                  />
                </Field>
              </>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] px-1">
              {dirty ? (
                <span className="text-amber-600 font-semibold">Unsaved changes</span>
              ) : savedAt ? (
                <span className="text-emerald-600 font-semibold">Saved</span>
              ) : (
                <span className="text-slate-400">Not saved yet</span>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || loading || !dirty}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              {saving ? 'Saving...' : 'Save Details'}
            </button>

            <button
              onClick={handleDownload}
              disabled={downloading || loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-2 px-3 rounded-lg text-xs transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 text-white" />
              {downloading ? 'Preparing PDF...' : 'Download Lease Invoice'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
