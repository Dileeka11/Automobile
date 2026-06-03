import { useEffect } from 'react';
import { useDataStore, toast } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Inbox, CheckCircle2, UserCheck, MessageSquare, Trash2, Mail } from 'lucide-react';

export default function Leads() {
  const { leads, fetchLeads, updateLeadStatus, deleteLead } = useDataStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateLeadStatus(id, status);
      toast.success("Lead status updated");
    } catch (e: any) {
      toast.error("Failed to update lead status");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteLead(id);
      toast.success("Lead deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete lead");
    }
  };

  const convertToQuotation = (lead: any) => {
    // Navigate to quotations page and pre-fill form by state
    navigate('/quotations', {
      state: {
        prefill: {
          name: lead.name,
          email: lead.email,
          mobileNo: lead.phone || '',
          address: '',
          nic: ''
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 font-display">CRM Website Leads</h2>
        <p className="text-sm text-slate-500">View and respond to inquiries submitted from the public contact forms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['New', 'Contacted', 'Converted'].map((stage) => {
          const stageLeads = leads.filter(l => l.status === stage);
          return (
            <div key={stage} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Inbox className="w-5 h-5 text-brand-600" /> {stage}
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                  {stageLeads.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {stageLeads.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 italic text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    No leads in this stage
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div key={lead.id} className="card p-4 space-y-3 hover:shadow-md transition">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{lead.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}
                          </p>
                          {lead.phone && <p className="text-[11px] text-slate-400">Phone: {lead.phone}</p>}
                        </div>
                        <button onClick={() => handleDelete(lead.id)} className="text-slate-400 hover:text-red-500 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-3">{lead.message}</span>
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                        {lead.status === 'New' && (
                          <button className="text-brand-600 hover:underline" onClick={() => handleStatusChange(lead.id, 'Contacted')}>
                            Mark Contacted
                          </button>
                        )}
                        {lead.status === 'Contacted' && (
                          <button className="text-brand-600 hover:underline" onClick={() => handleStatusChange(lead.id, 'Converted')}>
                            Mark Converted
                          </button>
                        )}
                        {lead.status !== 'Converted' ? (
                          <button onClick={() => convertToQuotation(lead)} className="px-2.5 py-1 bg-brand-600 text-white rounded text-[11px] hover:bg-brand-700 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" /> Convert
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-4 h-4" /> Converted
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
