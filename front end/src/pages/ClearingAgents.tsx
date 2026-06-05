import { useMemo, useState } from 'react';
import { Search, Eye, Printer } from 'lucide-react';
import { useDataStore } from '@/store';
import { Invoice } from '@/types';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import StatusBadge from '@/components/ui/Badge';
import { formatDate } from '@/utils';
import { InvoicePDFViewer, downloadInvoicePDF } from '@/components/pdf/InvoicePDF';

export default function ClearingAgents() {
  const { invoices, quotations, vehicleModels, makeModels } = useDataStore();
  const [viewing, setViewing] = useState<Invoice | null>(null);
  const [query, setQuery] = useState('');
  const [includeAttachmentsInView, setIncludeAttachmentsInView] = useState(false);

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const q = quotations.find((x) => x.id === i.quotationId);
      return (`${i.id} ${q?.name || ''} ${q?.id || ''}`).toLowerCase().includes(query.toLowerCase());
    });
  }, [invoices, quotations, query]);

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
          <div className="overflow-auto flex-1 min-h-0">
            <table className="table">
              <thead>
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
