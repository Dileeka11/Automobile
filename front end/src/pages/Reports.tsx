import { useEffect } from 'react';
import { useDataStore } from '@/store';
import { BarChart3, Receipt, FileSpreadsheet, Percent, Coins } from 'lucide-react';

export default function Reports() {
  const { reports, fetchReports } = useDataStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (!reports) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  const { vatReturns = [], salesSummary = [], expensesSummary = [], profitMargins = [] } = reports;

  // Calculate totals
  const totalVat = vatReturns.reduce((acc: number, curr: any) => acc + Number(curr.vatAmount), 0);
  const totalServiceCharge = vatReturns.reduce((acc: number, curr: any) => acc + Number(curr.serviceCharge), 0);
  const totalExpenses = expensesSummary.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0);
  const totalNetProfit = profitMargins.reduce((acc: number, curr: any) => acc + Number(curr.netProfit), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 font-display">Accounting & Financial Reports</h2>
        <p className="text-sm text-slate-500">Analyze VAT returns, review overhead expenses, and evaluate vehicle import net profit margins.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Total Service Billed</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">LKR {totalServiceCharge.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">VAT Liability (15%)</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">LKR {totalVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase">Operating Expenses</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="card p-5 flex items-center gap-4 bg-gradient-to-br from-brand-900 to-indigo-950 text-white shadow-xl shadow-brand-950/20 border-0">
          <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300 uppercase">Net Profit Margin</div>
            <div className="text-xl font-bold font-mono mt-0.5">LKR {totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VAT Returns Table */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><Receipt className="w-5 h-5 text-brand-600" /> VAT Liability Returns</h3>
          <div className="overflow-x-auto">
            <table className="table w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50">
                  <th className="px-4 py-3">Quotation</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3 text-right">Service Charge</th>
                  <th className="px-4 py-3 text-right">VAT (15%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vatReturns.map((v: any) => (
                  <tr key={v.quotationId} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{v.quotationId}</td>
                    <td className="px-4 py-3">
                      <div>{v.customerName}</div>
                      <div className="text-[10px] text-slate-400">{v.vehicleName}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">LKR {Number(v.serviceCharge).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">LKR {Number(v.vatAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Summary */}
        <div className="card p-5 space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><Coins className="w-5 h-5 text-brand-600" /> Operating Expenses Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="table w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50">
                  <th className="px-4 py-3">Expense Category</th>
                  <th className="px-4 py-3">Incurred Count</th>
                  <th className="px-4 py-3 text-right">Total Outflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expensesSummary.map((e: any) => (
                  <tr key={e.category} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{e.category}</td>
                    <td className="px-4 py-3 text-slate-500">{e.count} records</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600">LKR {Number(e.totalAmount).toLocaleString()}</td>
                  </tr>
                ))}
                {expensesSummary.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400 italic">No expenses recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Net Profit Margin per vehicle */}
      <div className="card p-5 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-1.5"><FileSpreadsheet className="w-5 h-5 text-brand-600" /> Vehicle Net Profit Margins</h3>
        <div className="overflow-x-auto">
          <table className="table w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase bg-slate-50">
                <th className="px-4 py-3">Vehicle Details</th>
                <th className="px-4 py-3">Chassis No</th>
                <th className="px-4 py-3 text-right">Total Revenue</th>
                <th className="px-4 py-3 text-right">Import Costs</th>
                <th className="px-4 py-3 text-right">Overhead Expenses</th>
                <th className="px-4 py-3 text-right">Investor Split</th>
                <th className="px-4 py-3 text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {profitMargins.map((pm: any) => (
                <tr key={pm.vehicleId} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{pm.vehicleName}</div>
                    <div className="text-[10px] text-slate-400">Customer: {pm.customerName}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">{pm.chassisNumber || 'In Progress'}</td>
                  <td className="px-4 py-3 text-right font-mono">LKR {Number(pm.revenue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">LKR {Number(pm.baseCost).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-500">LKR {Number(pm.additionalExpenses).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600">LKR {Number(pm.investorProfitShare).toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-mono font-bold ${Number(pm.netProfit) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    LKR {Number(pm.netProfit).toLocaleString()}
                  </td>
                </tr>
              ))}
              {profitMargins.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 italic">No vehicle sales recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
