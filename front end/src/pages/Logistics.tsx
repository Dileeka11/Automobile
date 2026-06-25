import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useDataStore, toast } from '@/store';
import { LogisticsItem } from '@/types';
import Modal from '@/components/ui/Modal';
import { Ship, Calendar, FileText, CheckSquare, Upload, Trash2, ClipboardCheck } from 'lucide-react';

export default function Logistics() {
  const { logistics, fetchLogistics, updateLogistics, fetchRegistration, updateRegistration, fetchDocuments, uploadDocument, deleteDocument } = useDataStore();
  
  const [selectedItem, setSelectedItem] = useState<LogisticsItem | null>(null);
  const [isLogisticsModalOpen, setIsLogisticsModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);

  // Form states for Logistics
  const [shippingCompany, setShippingCompany] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [etd, setEtd] = useState('');
  const [eta, setEta] = useState('');
  const [portOfLoading, setPortOfLoading] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState('');

  // Form states for RMV Registration
  const [hasIdCopy, setHasIdCopy] = useState(false);
  const [hasGsCertificate, setHasGsCertificate] = useState(false);
  const [hasTinCertificate, setHasTinCertificate] = useState(false);
  const [hasMt2Form, setHasMt2Form] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [regStatus, setRegStatus] = useState('Pending Documents');

  // Vault states
  const [documents, setDocuments] = useState<any[]>([]);
  const [docType, setDocType] = useState('Proforma Invoice');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchLogistics();
  }, [fetchLogistics]);

  const openLogisticsModal = (item: LogisticsItem) => {
    setSelectedItem(item);
    setShippingCompany(item.shippingCompany || '');
    setVesselName(item.vesselName || '');
    setEtd(item.etd || '');
    setEta(item.eta || '');
    setPortOfLoading(item.portOfLoading || '');
    setPortOfDischarge(item.portOfDischarge || '');
    setVehicleStatus(item.vehicleStatus);
    setIsLogisticsModalOpen(true);
  };

  const handleSaveLogistics = async () => {
    if (!selectedItem) return;
    try {
      await updateLogistics({
        vehicleId: selectedItem.vehicleId,
        shippingCompany,
        vesselName,
        etd,
        eta,
        portOfLoading,
        portOfDischarge,
        vehicleStatus
      });
      toast.success("Logistics updated successfully");
      setIsLogisticsModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const openVaultModal = async (item: LogisticsItem) => {
    setSelectedItem(item);
    setIsVaultModalOpen(true);
    try {
      const docs = await fetchDocuments(item.vehicleId);
      setDocuments(docs);
    } catch (e: any) {
      toast.error("Failed to load documents");
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedFile) {
      toast.error("Please choose a file");
      return;
    }
    try {
      await uploadDocument(selectedItem.vehicleId, docType, selectedFile);
      toast.success("Document uploaded successfully");
      setSelectedFile(null);
      // Reload documents list
      const docs = await fetchDocuments(selectedItem.vehicleId);
      setDocuments(docs);
    } catch (e: any) {
      toast.error(e.message || "Failed to upload document");
    }
  };

  const handleDeleteDoc = async (id: number) => {
    if (!selectedItem) return;
    
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to recover this document!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDocument(id);
      toast.success("Document deleted");
      const docs = await fetchDocuments(selectedItem.vehicleId);
      setDocuments(docs);
    } catch (e: any) {
      toast.error("Failed to delete document");
    }
  };

  const openRegModal = async (item: LogisticsItem) => {
    setSelectedItem(item);
    setIsRegModalOpen(true);
    try {
      const reg = await fetchRegistration(item.vehicleId);
      setHasIdCopy(!!reg.has_id_copy);
      setHasGsCertificate(!!reg.has_gs_certificate);
      setHasTinCertificate(!!reg.has_tin_certificate);
      setHasMt2Form(!!reg.has_mt2_form);
      setRegistrationNumber(reg.registration_number || '');
      setRegStatus(reg.status || 'Pending Documents');
    } catch (e: any) {
      toast.error("Failed to load registration details");
    }
  };

  const handleSaveRegistration = async () => {
    if (!selectedItem) return;
    try {
      await updateRegistration({
        vehicleId: selectedItem.vehicleId,
        hasIdCopy,
        hasGsCertificate,
        hasTinCertificate,
        hasMt2Form,
        registrationNumber,
        status: regStatus
      });
      toast.success("Registration status updated successfully");
      setIsRegModalOpen(false);
      fetchLogistics(); // Refresh main list to show status changes
    } catch (e: any) {
      toast.error("Failed to save registration checklist");
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 font-display">Logistics & Document Vault</h2>
          <p className="text-sm text-slate-500">Track shipping progress, manage customs documents, and complete registration.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="card overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
            <table className="table w-full text-left border-collapse relative">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Vehicle Details</th>
                  <th className="px-6 py-4">Chassis Number</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Vessel / ETA</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {logistics.map((item) => (
                  <tr key={item.vehicleId} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.make} {item.model}</div>
                      <div className="text-xs text-slate-400">{item.year} | {item.color}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{item.chassisNumber || 'Not assigned'}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.customerName}</div>
                      <div className="text-xs text-slate-400">{item.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.vehicleStatus === 'Ordered' ? 'bg-amber-100 text-amber-800' :
                        item.vehicleStatus === 'Shipped' ? 'bg-brand-100 text-brand-800' :
                        item.vehicleStatus === 'Clearing' ? 'bg-bluegray-100 text-bluegray-700' :
                        item.vehicleStatus === 'Registered' ? 'bg-teal-100 text-teal-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.vehicleStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.vesselName ? (
                        <div>
                          <div className="font-medium text-slate-800">{item.vesselName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> ETA: {item.eta || 'N/A'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No shipment registered</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1" onClick={() => openLogisticsModal(item)}>
                          <Ship className="w-4 h-4" /> Logistics
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1" onClick={() => openVaultModal(item)}>
                          <FileText className="w-4 h-4" /> Vault
                        </button>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 flex items-center gap-1" onClick={() => openRegModal(item)}>
                          <CheckSquare className="w-4 h-4" /> Register
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Logistics Details Modal */}
      <Modal open={isLogisticsModalOpen} onClose={() => setIsLogisticsModalOpen(false)} title="Update Logistics & Shipping Details" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Shipping Company</label>
              <input type="text" value={shippingCompany} onChange={(e) => setShippingCompany(e.target.value)} className="input" placeholder="e.g. NYK Line" />
            </div>
            <div>
              <label className="label">Vessel Name</label>
              <input type="text" value={vesselName} onChange={(e) => setVesselName(e.target.value)} className="input" placeholder="e.g. Aries Leader" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">ETD (Departure)</label>
              <input type="date" value={etd} onChange={(e) => setEtd(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">ETA (Arrival)</label>
              <input type="date" value={eta} onChange={(e) => setEta(e.target.value)} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Port of Loading</label>
              <input type="text" value={portOfLoading} onChange={(e) => setPortOfLoading(e.target.value)} className="input" placeholder="e.g. Yokohama" />
            </div>
            <div>
              <label className="label">Port of Discharge</label>
              <input type="text" value={portOfDischarge} onChange={(e) => setPortOfDischarge(e.target.value)} className="input" placeholder="e.g. Hambantota" />
            </div>
          </div>
          <div>
            <label className="label">Import Status</label>
            <select value={vehicleStatus} onChange={(e) => setVehicleStatus(e.target.value)} className="input">
              <option value="Ordered">Ordered</option>
              <option value="Shipped">Shipped</option>
              <option value="Clearing">Clearing</option>
              <option value="Registered">Registered</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsLogisticsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleSaveLogistics} className="btn-primary">Save Details</button>
          </div>
        </div>
      </Modal>

      {/* Document Vault Modal */}
      <Modal open={isVaultModalOpen} onClose={() => setIsVaultModalOpen(false)} title="Document Vault" size="xl">
        <div className="space-y-4">
          <form onSubmit={handleUploadFile} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
            <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5"><Upload className="w-4 h-4" /> Upload New Document</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Document Category</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input">
                  <option value="Proforma Invoice">Proforma Invoice</option>
                  <option value="LC Copy">LC Copy</option>
                  <option value="Yard Photo">Yard Photo</option>
                  <option value="JAAI">JAAI</option>
                  <option value="E-Certificate">E-Certificate</option>
                  <option value="Bank Release">Bank Release</option>
                  <option value="CUSDEC">CUSDEC</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Choose File</label>
                <input type="file" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button type="submit" className="btn-primary text-xs py-1 px-3">Upload File</button>
            </div>
          </form>

          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-2">Uploaded Documents</h4>
            {documents.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-4 text-center">No documents uploaded for this vehicle.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex justify-between items-center py-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{doc.document_type}</span>
                      <div className="text-slate-400 text-[10px]">Uploaded at: {doc.uploaded_at}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`http://automobile.sourcecode.lk/${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Download</a>
                      <button type="button" onClick={() => handleDeleteDoc(doc.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-3 border-t">
            <button type="button" onClick={() => setIsVaultModalOpen(false)} className="btn-secondary">Close Vault</button>
          </div>
        </div>
      </Modal>

      {/* RMV Registration Modal */}
      <Modal open={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} title="RMV Registration Checklist" size="xl">
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Toggle documents received from the customer and update RMV submission status.</p>
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hasIdCopy" checked={hasIdCopy} onChange={(e) => setHasIdCopy(e.target.checked)} className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
              <label htmlFor="hasIdCopy" className="text-sm text-slate-700 font-medium">NIC / ID copy of customer received</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hasGs" checked={hasGsCertificate} onChange={(e) => setHasGsCertificate(e.target.checked)} className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
              <label htmlFor="hasGs" className="text-sm text-slate-700 font-medium">Grama Niladhari (GS) residency certificate</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hasTin" checked={hasTinCertificate} onChange={(e) => setHasTinCertificate(e.target.checked)} className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
              <label htmlFor="hasTin" className="text-sm text-slate-700 font-medium">TIN registration certificate</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="hasMt2" checked={hasMt2Form} onChange={(e) => setHasMt2Form(e.target.checked)} className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500" />
              <label htmlFor="hasMt2" className="text-sm text-slate-700 font-medium">MT-2 application form</label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Status</label>
              <select value={regStatus} onChange={(e) => setRegStatus(e.target.value)} className="input">
                <option value="Pending Documents">Pending Documents</option>
                <option value="Submitted to RMV">Submitted to RMV</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Vehicle Number Plate</label>
              <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="input" placeholder="e.g. WP CAD-4488" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsRegModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="button" onClick={handleSaveRegistration} className="btn-primary flex items-center gap-1">
              <ClipboardCheck className="w-4 h-4" /> Save Checklist
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
