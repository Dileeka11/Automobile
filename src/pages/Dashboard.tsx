import { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { FileText, Receipt, Wallet, Clock, TrendingUp } from 'lucide-react';
import { useDataStore } from '@/store';
import { formatCurrency, formatDate } from '@/utils';
import StatusBadge from '@/components/ui/Badge';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444'];

function KPI({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4 hover:shadow-xl transition">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { quotations, invoices, makeModels, vehicleModels } = useDataStore();

  const totalRevenue = invoices.reduce((s, i) => s + i.balance + i.advanceAmount, 0);
  const pendingInvoices = invoices.filter((i) => i.status === 'pending').length;

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), quotations: 0, invoices: 0 };
    });
    quotations.forEach((q) => {
      const d = new Date(q.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === k);
      if (m) m.quotations += 1;
    });
    invoices.forEach((i) => {
      const d = new Date(i.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const m = months.find((x) => x.key === k);
      if (m) m.invoices += 1;
    });
    return months;
  }, [quotations, invoices]);

  const makeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    quotations.forEach((q) => {
      const m = makeModels.find((mm) => mm.id === q.makeModelId);
      if (m) counts[m.name] = (counts[m.name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [quotations, makeModels]);

  const recentQuotations = [...quotations].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);
  const recentInvoices = [...invoices].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={FileText} label="Total Quotations" value={String(quotations.length)} accent="bg-gradient-to-br from-indigo-500 to-indigo-600" />
        <KPI icon={Receipt} label="Total Invoices" value={String(invoices.length)} accent="bg-gradient-to-br from-emerald-500 to-emerald-600" />
        <KPI icon={Wallet} label="Total Revenue" value={formatCurrency(totalRevenue)} accent="bg-gradient-to-br from-pink-500 to-pink-600" />
        <KPI icon={Clock} label="Pending Invoices" value={String(pendingInvoices)} accent="bg-gradient-to-br from-amber-500 to-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Monthly Activity</h3>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-4 h-4" /> Last 6 months
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Bar dataKey="quotations" fill="#6366f1" name="Quotations" radius={[6, 6, 0, 0]} />
              <Bar dataKey="invoices" fill="#10b981" name="Invoices" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Sales by Make</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={makeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                {makeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Quotations</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Date</th></tr></thead>
              <tbody>
                {recentQuotations.map((q) => {
                  const v = vehicleModels.find((vm) => vm.id === q.vehicleModelId);
                  return (
                    <tr key={q.id}>
                      <td className="font-mono text-xs">{q.id}</td>
                      <td className="font-medium">{q.name}</td>
                      <td className="text-slate-600">{v?.name || '-'}</td>
                      <td className="text-slate-500">{formatDate(q.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Recent Invoices</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>ID</th><th>Balance</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {recentInvoices.map((i) => (
                  <tr key={i.id}>
                    <td className="font-mono text-xs">{i.id}</td>
                    <td className="font-semibold">{formatCurrency(i.balance)}</td>
                    <td><StatusBadge status={i.status} /></td>
                    <td className="text-slate-500">{formatDate(i.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
