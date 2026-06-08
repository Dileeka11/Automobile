import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useDataStore, toast } from '@/store';
import { useNavigate } from 'react-router-dom';
import { Inbox, CheckCircle2, UserCheck, MessageSquare, Trash2, Mail, Phone, Calendar, Search } from 'lucide-react';

export default function Leads() {
  const { leads, fetchLeads, updateLeadStatus, deleteLead } = useDataStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateLeadStatus(id, status);
      toast.success(`Inquiry marked as ${status}`);
    } catch (e: any) {
      toast.error("Failed to update inquiry status");
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This inquiry will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;
    try {
      await deleteLead(id);
      toast.success("Inquiry deleted successfully");
    } catch (e: any) {
      toast.error("Failed to delete inquiry");
    }
  };

  const convertToQuotation = (lead: any) => {
    // Navigate to quotations page and pre-fill form by state
    navigate('/admin/quotations', {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">New</span>;
      case 'Contacted': return <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">Contacted</span>;
      case 'Converted': return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">Converted</span>;
      case 'Completed': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">{status}</span>;
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 font-display">Website Inquiries</h2>
          <p className="text-sm text-slate-500">Manage and respond to customer inquiries from the website.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search inquiries..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full text-left border-collapse relative">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
              <tr className="text-sm">
                <th className="px-6 py-4 font-semibold text-slate-900">ID & Date</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Customer Details</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Inquiry Message</th>
                <th className="px-6 py-4 font-semibold text-slate-900">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Inbox className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                    <p>No inquiries found.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">#{lead.id}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 mt-1 space-y-1">
                        <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {lead.email}</div>
                        {lead.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {lead.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top max-w-md">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-700 text-xs flex gap-2">
                        <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <p className="line-clamp-3" title={lead.message}>{lead.message}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {getStatusBadge(lead.status)}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col items-end gap-2">
                        {lead.status !== 'Completed' && (
                          <button 
                            onClick={() => handleStatusChange(lead.id, 'Completed')}
                            className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                          </button>
                        )}

                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
