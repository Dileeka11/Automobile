import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { useDataStore, toast } from '@/store';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Landmark, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils';
import EmptyState from '@/components/ui/EmptyState';

type ExpenseFormData = {
  expenseType: string;
  amount: number;
  description: string;
  dateIncurred: string;
};

export default function Cashbook() {
  const { invoices, quotations, vehicleModels, makeModels, cashbookExpenses, addCashbookExpense, deleteCashbookExpense, loading } = useDataStore();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      expenseType: 'Rent',
      amount: 0,
      description: '',
      dateIncurred: new Date().toISOString().split('T')[0]
    }
  });

  // Calculate Invoiced Service Charge Revenue
  const inflowItems = useMemo(() => {
    return invoices.map((invoice) => {
      const q = quotations.find((x) => x.id === invoice.quotationId);
      const v = q ? vehicleModels.find((x) => x.id === q.vehicleModelId) : null;
      const m = q ? makeModels.find((x) => x.id === q.makeModelId) : null;
      const balanceVal = Number(invoice.balance || 0);
      return {
        invoiceId: invoice.id,
        customerName: q?.name || 'N/A',
        vehicleDetails: m && v ? `${m.name} ${v.name} (${v.year})` : 'N/A',
        serviceCharge: q?.serviceCharge ? Number(q.serviceCharge) : 0,
        createdAt: invoice.createdAt,
        balance: balanceVal,
        isPaid: balanceVal <= 0
      };
    }).filter(item => item.serviceCharge > 0);
  }, [invoices, quotations, vehicleModels, makeModels]);

  const totalInflow = useMemo(() => {
    // Only count service charge as profit if the customer covered the total payment (balance <= 0)
    return inflowItems
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + item.serviceCharge, 0);
  }, [inflowItems]);

  const totalPendingInflow = useMemo(() => {
    // Service charges that are still pending customer covering total payment
    return inflowItems
      .filter(item => !item.isPaid)
      .reduce((sum, item) => sum + item.serviceCharge, 0);
  }, [inflowItems]);

  const totalOutflow = useMemo(() => {
    return cashbookExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }, [cashbookExpenses]);

  const netProfit = useMemo(() => {
    return totalInflow - totalOutflow;
  }, [totalInflow, totalOutflow]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (Number(data.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    setSubmitting(true);
    try {
      await addCashbookExpense({
        expenseType: data.expenseType,
        amount: Number(data.amount),
        description: data.description,
        dateIncurred: data.dateIncurred
      });
      toast.success('Expense recorded successfully');
      reset({
        expenseType: 'Rent',
        amount: 0,
        description: '',
        dateIncurred: new Date().toISOString().split('T')[0]
      });
    } catch (e: any) {
      toast.error(e.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    const result = await Swal.fire({
      title: 'Delete Expense?',
      text: "You won't be able to recover this expense record!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteCashbookExpense(id);
        toast.success('Expense record deleted successfully');
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete expense');
      }
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)] flex flex-col min-h-0 space-y-4">
      <div className="flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-800 font-display">Corporate Cashbook</h2>
        <p className="text-xs text-slate-500">Track company profit margins based on service charges offset by general business expenses</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 flex-shrink-0">
        {/* Total Inflow Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Realized Revenue</span>
            <h3 className="text-2xl font-bold text-emerald-600 font-mono">{formatCurrency(totalInflow)}</h3>
            <p className="text-[10px] text-slate-400">
              Paid service charges.
              {totalPendingInflow > 0 && ` (LKR ${totalPendingInflow.toLocaleString()} pending)`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Total Outflow Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">General Expenses</span>
            <h3 className="text-2xl font-bold text-rose-600 font-mono">{formatCurrency(totalOutflow)}</h3>
            <p className="text-[10px] text-slate-400">Total company operational outflows</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Margin / Profit</span>
            <h3 className={`text-2xl font-bold font-mono ${netProfit >= 0 ? 'text-brand-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </h3>
            <p className="text-[10px] text-slate-400">Net revenue remaining after expenses</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${netProfit >= 0 ? 'bg-brand-50 text-brand-600' : 'bg-red-50 text-red-600'}`}>
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Columns - Tables */}
        <div className="lg:col-span-2 flex flex-col min-h-0 space-y-4">
          {/* General Expenses Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-brand-600" />
                Expenses Ledger
              </h4>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium font-mono">
                {cashbookExpenses.length} Records
              </span>
            </div>

            <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
              {loading && cashbookExpenses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                  Loading ledger...
                </div>
              ) : cashbookExpenses.length === 0 ? (
                <EmptyState title="No expenses recorded yet" />
              ) : (
                <table className="table min-w-full relative">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th className="text-right">Amount</th>
                      <th className="w-16 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashbookExpenses.map((exp) => (
                      <tr key={exp.id}>
                        <td className="text-slate-600 text-xs">{formatDate(exp.dateIncurred)}</td>
                        <td>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            {exp.expenseType}
                          </span>
                        </td>
                        <td className="text-xs text-slate-500 max-w-xs truncate" title={exp.description}>
                          {exp.description || '—'}
                        </td>
                        <td className="text-right font-semibold font-mono text-rose-600 text-xs">
                          {formatCurrency(exp.amount)}
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Revenue Inflow Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                Service Charge Revenues
              </h4>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-medium font-mono">
                {inflowItems.length} Sales
              </span>
            </div>

            <div className="overflow-auto overflow-y-auto flex-1 min-h-0">
              {inflowItems.length === 0 ? (
                <EmptyState title="No service charge revenues generated yet" />
              ) : (
                <table className="table min-w-full relative">
                  <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200">
                    <tr>
                      <th>Invoice ID</th>
                      <th>Customer Name</th>
                      <th>Vehicle</th>
                      <th>Payment Status</th>
                      <th className="text-right">Service Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inflowItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold text-brand-600 text-xs">{item.invoiceId}</td>
                        <td className="text-xs text-slate-700 font-medium">{item.customerName}</td>
                        <td className="text-[11px] text-slate-500">{item.vehicleDetails}</td>
                        <td>
                          {item.isPaid ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              Fully Covered
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100" title={`Pending Balance: LKR ${item.balance.toLocaleString()}`}>
                              Pending (LKR {item.balance.toLocaleString()})
                            </span>
                          )}
                        </td>
                        <td className="text-right font-semibold font-mono text-emerald-600 text-xs">
                          {formatCurrency(item.serviceCharge)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex flex-col min-h-0 overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-600" />
                Record Business Expense
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Deduct corporate operational costs from the cashbook profit margin</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Expense Category</label>
                <select
                  {...register('expenseType', { required: true })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition"
                >
                  <option value="Rent">Rent</option>
                  <option value="Salary">Salaries & Wages</option>
                  <option value="Utility Bills">Utility Bills</option>
                  <option value="Office Equipment">Office Supplies / Equipment</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Other">Other Operational Costs</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Amount (LKR)</label>
                <input
                  {...register('amount', { required: 'Amount is required', min: { value: 1, message: 'Amount must be > 0' } })}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition font-mono"
                />
                {errors.amount && <p className="text-[10px] text-red-500">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Date Incurred</label>
                <input
                  {...register('dateIncurred', { required: 'Date is required' })}
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition font-mono"
                />
                {errors.dateIncurred && <p className="text-[10px] text-red-500">{errors.dateIncurred.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Description / Memo</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder="e.g. Electricity bill for main office"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none focus:border-brand-500 focus:bg-white transition"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 btn btn-brand py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Record Expense
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
