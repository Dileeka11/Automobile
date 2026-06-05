import { useEffect, useState } from 'react';
import { useDataStore, toast } from '@/store';
import Modal from '@/components/ui/Modal';
import { Landmark, Users, Plus, BadgeDollarSign, CheckCircle2 } from 'lucide-react';

export default function Investors() {
  const { investors, investments, fetchInvestors, fetchInvestments, addInvestor, addInvestment, settleInvestment, fetchAvailableVehicles } = useDataStore();

  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);

  // New Investor form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // New Investment form states
  const [investorId, setInvestorId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [roiPercentage, setRoiPercentage] = useState('5');
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);

  useEffect(() => {
    fetchInvestors();
    fetchInvestments();
  }, [fetchInvestors, fetchInvestments]);

  const openInvestmentModal = async () => {
    if (investors.length === 0) {
      toast.error("Please add at least one investor first");
      return;
    }
    try {
      const vehs = await fetchAvailableVehicles();
      setAvailableVehicles(vehs);
      setInvestorId(String(investors[0].id));
      if (vehs.length > 0) {
        setVehicleId(String(vehs[0].id));
      }
      setIsInvestModalOpen(true);
    } catch (e) {
      toast.error("Failed to load available vehicles");
    }
  };

  const handleAddInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await addInvestor({ name, phone, email });
      toast.success("Investor registered successfully");
      setIsInvestorModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investorId || !vehicleId || !investedAmount) {
      toast.error("All fields are required");
      return;
    }
    try {
      await addInvestment({
        investorId: Number(investorId),
        vehicleId: Number(vehicleId),
        investedAmount: Number(investedAmount),
        roiPercentage: Number(roiPercentage)
      });
      toast.success("Investment registered successfully");
      setIsInvestModalOpen(false);
      setInvestedAmount('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSettle = async (id: number) => {
    if (!confirm("Are you sure you want to settle this investment? This will lock in the ROI profit share.")) return;
    try {
      await settleInvestment(id);
      toast.success("Investment settled successfully");
    } catch (e: any) {
      toast.error("Failed to settle investment");
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 font-display">Investor Funding & Profit Splits</h2>
          <p className="text-sm text-slate-500">Manage capital partners, record vehicle specific investments, and settle ROI earnings.</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => setIsInvestorModalOpen(true)} className="btn-secondary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Investor
          </button>
          <button onClick={openInvestmentModal} className="btn-primary flex items-center gap-1.5">
            <Landmark className="w-4 h-4" /> Record Investment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Investors Column */}
        <div className="lg:col-span-1 flex flex-col min-h-0 space-y-4">
          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><Users className="w-5 h-5 text-brand-600" /> Investors List</h3>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full font-semibold text-slate-500">{investors.length} Total</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {investors.length === 0 ? (
              <div className="card text-center py-8 text-slate-400 italic text-sm">No investors found</div>
            ) : (
              investors.map((inv) => (
                <div key={inv.id} className="card p-4 hover:shadow-md transition">
                  <h4 className="font-bold text-slate-900">{inv.name}</h4>
                  <div className="text-xs text-slate-500 mt-1">Phone: {inv.phone || 'N/A'}</div>
                  <div className="text-xs text-slate-500">Email: {inv.email || 'N/A'}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Investments Column */}
        <div className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
          <div className="flex items-center justify-between flex-shrink-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><BadgeDollarSign className="w-5 h-5 text-brand-600" /> Active Investments & Splits</h3>
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-semibold">{investments.length} Investments</span>
          </div>

          <div className="card overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="table w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Investor</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Amount Funded</th>
                    <th className="px-6 py-4">ROI %</th>
                    <th className="px-6 py-4">Earnings</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {investments.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{inv.investorName}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{inv.vehicleName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.chassisNumber}</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">LKR {Number(inv.investedAmount).toLocaleString()}</td>
                      <td className="px-6 py-4 font-semibold text-brand-600">{inv.roiPercentage}%</td>
                      <td className="px-6 py-4">
                        {inv.status === 'Settled' ? (
                          <div className="text-emerald-600 font-bold font-mono">
                            +LKR {Number(inv.profitShareAmount).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Accruing...</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'Active' ? (
                          <button onClick={() => handleSettle(inv.id)} className="px-2.5 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Settle
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Investor Modal */}
      <Modal open={isInvestorModalOpen} onClose={() => setIsInvestorModalOpen(false)} title="Register Investor Profile" size="xl">
        <form onSubmit={handleAddInvestor} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Sunil Shantha" />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="e.g. 0771234567" />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="e.g. sunil@example.com" />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsInvestorModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Register Investor</button>
          </div>
        </form>
      </Modal>

      {/* Add Investment Modal */}
      <Modal open={isInvestModalOpen} onClose={() => setIsInvestModalOpen(false)} title="Record Vehicle Investment" size="xl">
        <form onSubmit={handleAddInvestment} className="space-y-4">
          <div>
            <label className="label">Select Investor</label>
            <select value={investorId} onChange={(e) => setInvestorId(e.target.value)} className="input">
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Select Vehicle Profile</label>
            {availableVehicles.length === 0 ? (
              <p className="text-red-500 text-xs mt-1">No active import vehicles found. Start a quotation and sign an agreement first!</p>
            ) : (
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="input">
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year}) - {v.chassisNumber || 'No chassis'}</option>
                ))}
              </select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Invested Amount (LKR)</label>
              <input type="number" required value={investedAmount} onChange={(e) => setInvestedAmount(e.target.value)} className="input" placeholder="e.g. 1000000" />
            </div>
            <div>
              <label className="label">Target ROI Rate (%)</label>
              <input type="number" required value={roiPercentage} onChange={(e) => setRoiPercentage(e.target.value)} className="input" placeholder="e.g. 5" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button type="button" onClick={() => setIsInvestModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={availableVehicles.length === 0} className="btn-primary">Record Investment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
