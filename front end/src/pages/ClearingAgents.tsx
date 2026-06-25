import { useMemo, useRef, useState } from 'react';
import { Search, Eye, Printer, Paperclip, ChevronDown, FileText, Check, Upload, Download, Trash2, Loader2, Plus, X } from 'lucide-react';
import { useDataStore, toast } from '@/store';
import { Invoice } from '@/types';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/Badge';
import { formatDate } from '@/utils';
import { InvoicePDFViewer, downloadInvoicePDF } from '@/components/pdf/InvoicePDF';

// Build a URL for a stored document path. Files are served through the backend's
// image.php endpoint, which is reachable via the same `/backend/api` proxy the rest
// of the app uses — so this works on localhost and in production alike.
// Pass `download` to force the browser to save the file instead of opening it.
const fileUrl = (path: string, download = false) =>
  `/backend/api/image.php?path=${encodeURIComponent(path)}${download ? '&download=1' : ''}`;

// Clearing-document slots. `key` is the upload field name the backend expects,
// `field` is the Invoice property holding the stored path, `deleteFlag` removes it.
const DOC_TYPES = [
  { key: 'exportCertificate', label: 'Export Certificate', field: 'exportCertificatePath', deleteFlag: 'deleteExportCertificate' },
  { key: 'transferDocument', label: 'Transfer Document', field: 'transferDocumentPath', deleteFlag: 'deleteTransferDocument' },
  { key: 'inspectionCertificate', label: 'Inspection Certificate', field: 'inspectionCertificatePath', deleteFlag: 'deleteInspectionCertificate' },
  { key: 'customsDocument', label: 'Customs Document', field: 'customsDocumentPath', deleteFlag: 'deleteCustomsDocument' },
] as const;

export default function ClearingAgents() {
  const { invoices, quotations, vehicleModels, makeModels, updateInvoice, addInvoiceDocument, deleteInvoiceDocument } = useDataStore();
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [query, setQuery] = useState('');
  const [includeAttachmentsInView, setIncludeAttachmentsInView] = useState(false);

  // Documents dropdown: which invoice's menu is open (with anchor position) + busy slot.
  const [menu, setMenu] = useState<{ id: string; top: number; right: number } | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<{ id: string; docKey: string } | null>(null);

  // "Add document type" form (custom clearing documents).
  const [addOpen, setAddOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [customBusyId, setCustomBusyId] = useState<number | null>(null);

  const resetAddForm = () => { setAddOpen(false); setNewDocName(''); setNewDocFile(null); };
  const closeMenu = () => { setMenu(null); resetAddForm(); };

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const q = quotations.find((x) => x.id === i.quotationId);
      return (`${i.id} ${q?.name || ''} ${q?.id || ''}`).toLowerCase().includes(query.toLowerCase());
    });
  }, [invoices, quotations, query]);

  // Live lookup so the open menu reflects uploads/deletes immediately.
  const menuInvoice = menu ? invoices.find((x) => x.id === menu.id) ?? null : null;

  const docCount = (inv: Invoice) =>
    DOC_TYPES.filter((d) => (inv as any)[d.field]).length + (inv.customDocuments?.length ?? 0);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    if (menu?.id === id) { closeMenu(); return; }
    resetAddForm();
    const r = e.currentTarget.getBoundingClientRect();
    setMenu({ id, top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
  };

  const triggerUpload = (id: string, docKey: string) => {
    pendingRef.current = { id, docKey };
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const pending = pendingRef.current;
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !pending) return;
    setBusyKey(`${pending.id}:${pending.docKey}`);
    try {
      const fd = new FormData();
      fd.append(pending.docKey, file);
      await updateInvoice(pending.id, fd);
      toast.success('Document uploaded');
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setBusyKey(null);
      pendingRef.current = null;
    }
  };

  const handleDocDelete = async (id: string, deleteFlag: string) => {
    setBusyKey(`${id}:${deleteFlag}`);
    try {
      const fd = new FormData();
      fd.append(deleteFlag, 'true');
      await updateInvoice(id, fd);
      toast.success('Document removed');
    } catch {
      toast.error('Failed to remove document');
    } finally {
      setBusyKey(null);
    }
  };

  const submitNewDoc = async (invoiceId: string) => {
    const name = newDocName.trim();
    if (!name) { toast.error('Enter a document type name'); return; }
    if (!newDocFile) { toast.error('Choose a file to upload'); return; }
    setAddBusy(true);
    try {
      const fd = new FormData();
      fd.append('invoice_id', invoiceId);
      fd.append('doc_type', name);
      fd.append('file', newDocFile);
      await addInvoiceDocument(invoiceId, fd);
      toast.success('Document added');
      resetAddForm();
    } catch {
      toast.error('Failed to add document');
    } finally {
      setAddBusy(false);
    }
  };

  const removeCustomDoc = async (invoiceId: string, docId: number) => {
    setCustomBusyId(docId);
    try {
      await deleteInvoiceDocument(invoiceId, docId);
      toast.success('Document removed');
    } catch {
      toast.error('Failed to remove document');
    } finally {
      setCustomBusyId(null);
    }
  };

  const handleDownloadInvoice = async (i: Invoice, includeAttachments: boolean) => {
    const q = quotations.find((x) => x.id === i.quotationId);
    const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
    const m = makeModels.find((x) => x.id === q?.makeModelId);
    if (!q || !v || !m) return;
    await downloadInvoicePDF({ invoice: i, quotation: q, vehicle: v, make: m, includeAttachments });
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-center flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clearing Agent Portal</h2>
          <p className="text-xs text-slate-500">View and download standalone invoices or combined packages for customs clearing</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 w-full sm:w-80 shadow-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search invoices..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="table-wrap flex-1 min-h-0 flex flex-col">
        {filtered.length === 0 ? <EmptyState title="No invoices available" /> : (
          <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
            <table className="table w-full relative">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                <tr>
                  <th>Invoice ID</th>
                  <th>Customer Name</th>
                  <th>Vehicle Details</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => {
                  const q = quotations.find((x) => x.id === i.quotationId);
                  const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
                  const m = makeModels.find((x) => x.id === q?.makeModelId);
                  return (
                    <tr key={i.id}>
                      <td className="font-semibold text-brand-600">{i.id}</td>
                      <td className="font-medium text-slate-700">{q?.name || 'N/A'}</td>
                      <td className="text-slate-600 text-xs">
                        {m && v ? `${m.name} ${v.name} (${v.year})` : 'N/A'}
                      </td>
                      <td><StatusBadge status={i.status} /></td>
                      <td className="text-slate-500">{formatDate(i.createdAt)}</td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={(e) => openMenu(e, i.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition"
                            title="Attach clearing documents"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            Documents
                            {docCount(i) > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold">{docCount(i)}</span>
                            )}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setViewing(i);
                              setIncludeAttachmentsInView(false); // Default to invoice only
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 transition"
                            title="Open Preview Modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(i, false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold border border-brand-200/50 transition"
                            title="Download Invoice Only"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Invoice Only
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(i, true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold border border-emerald-200/50 transition"
                            title="Download Combined PDF"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Combined PDF
                          </button>
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

      {/* Shared hidden input used by every "upload" action in the dropdown */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} accept="image/*,application/pdf" />

      {/* Documents dropdown (fixed-positioned so it is not clipped by the scroll container) */}
      {menu && menuInvoice && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            className="fixed z-50 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
            style={{ top: menu.top, right: menu.right }}
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h4 className="text-sm font-semibold text-slate-800">Clearing Documents</h4>
              <p className="text-[11px] text-slate-500">Invoice {menuInvoice.id} · attach files for customs clearing</p>
            </div>
            <div className="p-2 divide-y divide-slate-100">
              {DOC_TYPES.map((d) => {
                const path = (menuInvoice as any)[d.field] as string | null | undefined;
                const busy = busyKey === `${menuInvoice.id}:${d.key}` || busyKey === `${menuInvoice.id}:${d.deleteFlag}`;
                return (
                  <div key={d.key} className="flex items-center gap-2.5 py-2 px-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${path ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {path ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 truncate">{d.label}</p>
                      <p className={`text-[10px] ${path ? 'text-emerald-600' : 'text-slate-400'}`}>{path ? 'Attached' : 'Not attached'}</p>
                    </div>
                    {busy ? (
                      <Loader2 className="w-4 h-4 text-brand-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {path && (
                          <a
                            href={fileUrl(path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
                            title="View document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {path && (
                          <a
                            href={fileUrl(path, true)}
                            download
                            className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"
                            title="Download document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => triggerUpload(menuInvoice.id, d.key)}
                          className="p-1.5 rounded-md hover:bg-brand-50 text-brand-600"
                          title={path ? 'Replace file' : 'Upload file'}
                        >
                          <Upload className="w-3.5 h-3.5" />
                        </button>
                        {path && (
                          <button
                            onClick={() => handleDocDelete(menuInvoice.id, d.deleteFlag)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500"
                            title="Remove document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* User-defined (custom) document types */}
              {(menuInvoice.customDocuments ?? []).map((doc) => {
                const busy = customBusyId === doc.id;
                return (
                  <div key={doc.id} className="flex items-center gap-2.5 py-2 px-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 truncate">{doc.docType}</p>
                      <p className="text-[10px] text-emerald-600">Attached · custom</p>
                    </div>
                    {busy ? (
                      <Loader2 className="w-4 h-4 text-brand-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <a
                          href={fileUrl(doc.filePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"
                          title="View document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={fileUrl(doc.filePath, true)}
                          download
                          className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-600"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => removeCustomDoc(menuInvoice.id, doc.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-500"
                          title="Remove document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add a new (custom) document type */}
            <div className="px-2 pb-2 pt-1 border-t border-slate-100 bg-slate-50/50">
              {addOpen ? (
                <div className="space-y-2 p-1">
                  <input
                    autoFocus
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Document type name (e.g. Insurance)"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer px-2.5 py-1.5 rounded-lg border border-dashed border-slate-300 hover:bg-white">
                    <Upload className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{newDocFile ? newDocFile.name : 'Choose file…'}</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => setNewDocFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      onClick={() => submitNewDoc(menuInvoice.id)}
                      disabled={addBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold disabled:opacity-60"
                    >
                      {addBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add
                    </button>
                    <button
                      onClick={resetAddForm}
                      disabled={addBusy}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-white disabled:opacity-60"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-brand-600 hover:bg-brand-50 text-xs font-semibold border border-dashed border-brand-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add document type
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {viewing && (() => {
        const q = quotations.find((x) => x.id === viewing.quotationId);
        const v = vehicleModels.find((x) => x.id === q?.vehicleModelId);
        const m = makeModels.find((x) => x.id === q?.makeModelId);
        return (
          <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Invoice ${viewing.id} - Document Viewer`} size="xl">
            {q && v && m ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <InvoicePDFViewer
                    invoice={viewing}
                    quotation={q}
                    vehicle={v}
                    make={m}
                    includeAttachments={includeAttachmentsInView}
                  />
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">Document Options</h4>
                      <p className="text-slate-500 text-[11px] mt-1">Configure whether to view or print with associated vault attachments.</p>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer p-2.5 bg-white rounded-lg border text-xs text-slate-700 hover:bg-slate-50 transition">
                      <input
                        type="checkbox"
                        checked={includeAttachmentsInView}
                        onChange={(e) => setIncludeAttachmentsInView(e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      Include attachments in PDF
                    </label>

                    <div className="space-y-2 pt-2 border-t">
                      <button
                        onClick={() => downloadInvoicePDF({ invoice: viewing, quotation: q, vehicle: v, make: m, includeAttachments: false })}
                        className="w-full btn-primary text-xs py-2 bg-brand-600 hover:bg-brand-700 flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> Download Invoice Only
                      </button>
                      <button
                        onClick={() => downloadInvoicePDF({ invoice: viewing, quotation: q, vehicle: v, make: m, includeAttachments: true })}
                        className="w-full btn-secondary text-xs py-2 border-slate-300 hover:bg-slate-100 flex items-center justify-center gap-2"
                      >
                        <Printer className="w-4 h-4" /> Download Combined PDF
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t">
                    <button
                      onClick={() => setViewing(null)}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Missing data to display this invoice.</p>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
