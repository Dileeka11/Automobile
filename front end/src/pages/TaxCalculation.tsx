import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calculator, 
  ArrowLeft, 
  ExternalLink, 
  RotateCcw, 
  HelpCircle, 
  Check, 
  Copy, 
  Printer, 
  ShieldCheck,
  Fuel,
  Gauge,
  Coins,
  Receipt
} from 'lucide-react';

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid Petrol' | 'Hybrid Diesel' | 'Electric';

interface TaxBreakdownRow {
  type: string;
  name: string;
  taxBase: string;
  rate: string;
  amount: number;
}

interface TaxCalculationResult {
  hsCode: string;
  cifLkr: number;
  rows: TaxBreakdownRow[];
  totalTax: number;
}

export function calculateSriLankaTax(
  cifJpy: number,
  jpyRate: number,
  fuelType: FuelType,
  capacity: number
): TaxCalculationResult {
  // 1. CIF in LKR
  const cifLkr = Math.round((cifJpy || 0) * (jpyRate || 0));

  // 2. Customs Import Duty (CID) - standard 30% for passenger cars
  const cidAmount = Math.round(cifLkr * 0.30);

  // 3. Surcharge on Customs Duty (SUR) - 50% of CID
  const surAmount = Math.round(cidAmount * 0.50);

  // 4. Excise Duty (XID / SPD) & HS Code based on fuel type & engine capacity / motor power
  let hsCode = '8703.22.50';
  let xidRatePerUnit = 4450;
  let xidUnitLabel = '/cc';

  const cc = Math.max(0, capacity || 0);

  switch (fuelType) {
    case 'Petrol':
      if (cc <= 1000) {
        hsCode = '8703.21.50';
        xidRatePerUnit = 2450;
      } else if (cc <= 1300) {
        hsCode = '8703.22.50';
        xidRatePerUnit = 3850;
      } else if (cc <= 1500) {
        hsCode = '8703.22.50';
        xidRatePerUnit = 4450;
      } else if (cc <= 1600) {
        hsCode = '8703.23.51';
        xidRatePerUnit = 5150;
      } else if (cc <= 1800) {
        hsCode = '8703.23.52';
        xidRatePerUnit = 6400;
      } else if (cc <= 2000) {
        hsCode = '8703.23.69';
        xidRatePerUnit = 7700;
      } else if (cc <= 2500) {
        hsCode = '8703.23.70';
        xidRatePerUnit = 8450;
      } else if (cc <= 2750) {
        hsCode = '8703.24.51';
        xidRatePerUnit = 9650;
      } else if (cc <= 3000) {
        hsCode = '8703.24.52';
        xidRatePerUnit = 10850;
      } else if (cc <= 4000) {
        hsCode = '8703.24.53';
        xidRatePerUnit = 12050;
      } else {
        hsCode = '8703.24.54';
        xidRatePerUnit = 13300;
      }
      break;

    case 'Diesel':
      if (cc <= 1000) {
        hsCode = '8703.31.50';
        xidRatePerUnit = 2450;
      } else if (cc <= 1300) {
        hsCode = '8703.31.50';
        xidRatePerUnit = 3850;
      } else if (cc <= 1500) {
        hsCode = '8703.31.50';
        xidRatePerUnit = 4450;
      } else if (cc <= 1600) {
        hsCode = '8703.32.51';
        xidRatePerUnit = 5150;
      } else if (cc <= 1800) {
        hsCode = '8703.32.52';
        xidRatePerUnit = 6400;
      } else if (cc <= 2000) {
        hsCode = '8703.32.69';
        xidRatePerUnit = 7700;
      } else if (cc <= 2500) {
        hsCode = '8703.32.70';
        xidRatePerUnit = 8450;
      } else if (cc <= 2750) {
        hsCode = '8703.33.51';
        xidRatePerUnit = 9650;
      } else if (cc <= 3000) {
        hsCode = '8703.33.52';
        xidRatePerUnit = 10850;
      } else if (cc <= 4000) {
        hsCode = '8703.33.53';
        xidRatePerUnit = 12050;
      } else {
        hsCode = '8703.33.54';
        xidRatePerUnit = 13300;
      }
      break;

    case 'Hybrid Petrol':
      if (cc <= 1000) {
        hsCode = '8703.40.51';
        xidRatePerUnit = 2050;
      } else if (cc <= 1300) {
        hsCode = '8703.40.51';
        xidRatePerUnit = 2650;
      } else if (cc <= 1500) {
        hsCode = '8703.40.52';
        xidRatePerUnit = 3350;
      } else if (cc <= 1600) {
        hsCode = '8703.40.53';
        xidRatePerUnit = 4000;
      } else if (cc <= 1800) {
        hsCode = '8703.40.53';
        xidRatePerUnit = 4600;
      } else if (cc <= 2000) {
        hsCode = '8703.40.54';
        xidRatePerUnit = 5500;
      } else if (cc <= 2500) {
        hsCode = '8703.40.55';
        xidRatePerUnit = 6850;
      } else if (cc <= 3000) {
        hsCode = '8703.40.56';
        xidRatePerUnit = 8450;
      } else {
        hsCode = '8703.40.57';
        xidRatePerUnit = 10000;
      }
      break;

    case 'Hybrid Diesel':
      if (cc <= 1500) {
        hsCode = '8703.50.51';
        xidRatePerUnit = 3850;
      } else if (cc <= 1800) {
        hsCode = '8703.50.52';
        xidRatePerUnit = 4600;
      } else if (cc <= 2000) {
        hsCode = '8703.50.53';
        xidRatePerUnit = 5750;
      } else if (cc <= 2500) {
        hsCode = '8703.50.54';
        xidRatePerUnit = 7200;
      } else {
        hsCode = '8703.50.55';
        xidRatePerUnit = 8850;
      }
      break;

    case 'Electric':
      xidUnitLabel = '/kW';
      if (cc <= 50) {
        hsCode = '8703.80.51';
        xidRatePerUnit = 25000;
      } else if (cc <= 100) {
        hsCode = '8703.80.52';
        xidRatePerUnit = 35000;
      } else {
        hsCode = '8703.80.53';
        xidRatePerUnit = 55000;
      }
      break;
  }

  const xidAmount = cc * xidRatePerUnit;

  // 5. VAT Base: Sri Lanka Customs adds 10% uplift to CIF + CID + SUR + XID
  const vatBase = Math.round(cifLkr * 1.1 + cidAmount + surAmount + xidAmount);
  const vatAmount = Math.round(vatBase * 0.18);

  // 6. Social Security Contribution Levy (SSL / SSCL) - 2.5% on VAT base
  const sslBase = vatBase;
  const sslAmount = Math.round(sslBase * 0.025);

  // 7. Vehicle Entitlement / Emission Levy (VEL)
  const velBase = 1;
  const velRate = '15,000/Unit';
  const velAmount = 15000;

  // 8. Computer & Examination / Customs entry fees (COM/EXM/SEL)
  const comBase = 1;
  const comRate = '4,000/Unit';
  const comAmount = 4000;

  // Total Tax
  const totalTax = cidAmount + surAmount + xidAmount + vatAmount + sslAmount + velAmount + comAmount;

  return {
    hsCode,
    cifLkr,
    rows: [
      {
        type: 'CID',
        name: 'Customs Import Duty',
        taxBase: cifLkr.toLocaleString('en-US'),
        rate: '30%',
        amount: cidAmount,
      },
      {
        type: 'SUR',
        name: 'Surcharge on Customs Duty',
        taxBase: cidAmount.toLocaleString('en-US'),
        rate: '50%',
        amount: surAmount,
      },
      {
        type: 'XID',
        name: 'Excise Duty',
        taxBase: cc.toLocaleString('en-US'),
        rate: `${xidRatePerUnit.toLocaleString('en-US')}${xidUnitLabel}`,
        amount: xidAmount,
      },
      {
        type: 'VAT',
        name: 'Value Added Tax',
        taxBase: vatBase.toLocaleString('en-US'),
        rate: '18%',
        amount: vatAmount,
      },
      {
        type: 'SSL',
        name: 'Social Security Contribution Levy',
        taxBase: sslBase.toLocaleString('en-US'),
        rate: '2.5%',
        amount: sslAmount,
      },
      {
        type: 'VEL',
        name: 'Vehicle Emission Levy',
        taxBase: velBase.toString(),
        rate: velRate,
        amount: velAmount,
      },
      {
        type: 'COM/EXM/SEL',
        name: 'Computer & Examination Fees',
        taxBase: comBase.toString(),
        rate: comRate,
        amount: comAmount,
      },
    ],
    totalTax,
  };
}

export default function TaxCalculation() {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith('/admin');

  // Input States matching Image 2
  const [cifJpyInput, setCifJpyInput] = useState<string>('1,000');
  const [jpyRateInput, setJpyRateInput] = useState<string>('5');
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [capacityInput, setCapacityInput] = useState<string>('2,000');

  // Computed values
  const [isCalculated, setIsCalculated] = useState(true);
  const [copied, setCopied] = useState(false);

  // Handle number parse safely
  const cifJpy = parseFloat(cifJpyInput.replace(/,/g, '')) || 0;
  const jpyRate = parseFloat(jpyRateInput.replace(/,/g, '')) || 0;
  const capacity = parseFloat(capacityInput.replace(/,/g, '')) || 0;

  const result = useMemo(() => {
    return calculateSriLankaTax(cifJpy, jpyRate, fuelType, capacity);
  }, [cifJpy, jpyRate, fuelType, capacity]);

  const handleReset = () => {
    setCifJpyInput('1,000');
    setJpyRateInput('5');
    setFuelType('Petrol');
    setCapacityInput('2,000');
    setIsCalculated(true);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
  };

  const handleCopyBreakdown = () => {
    const text = [
      `D&N Automart - Tax Calculation`,
      `HS Code: ${result.hsCode}`,
      `CIF Value (JPY): ${cifJpy.toLocaleString('en-US')}`,
      `Rate: ${jpyRate}`,
      `CIF Value (LKR): ${result.cifLkr.toLocaleString('en-US')}`,
      `Fuel: ${fuelType} | Capacity: ${capacity.toLocaleString('en-US')} ${fuelType === 'Electric' ? 'kW' : 'cc'}`,
      `---------------------------------`,
      ...result.rows.map(r => `${r.type}: Base ${r.taxBase} @ ${r.rate} = LKR ${r.amount.toLocaleString('en-US')}`),
      `---------------------------------`,
      `Total Tax: LKR ${result.totalTax.toLocaleString('en-US')}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`min-h-screen ${isAdminView ? '' : 'bg-slate-50 text-slate-800'}`}>
      {/* Public Header if not inside Admin */}
      {!isAdminView && (
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-sm ring-1 ring-slate-200 group-hover:scale-105 transition">
                <img src="/logo.png" alt="D&N Automart" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 group-hover:text-brand-600 transition">
                  D&N AUTOMART
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-400 ml-2">
                  Tax Calculation
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </Link>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page Banner / Title */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" /> Sri Lanka Customs Duty Estimator
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tax Calculation
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Calculate accurate vehicle import duties, customs excise, VAT, and levies under official Sri Lanka Customs tariff structures.
          </p>
        </div>

        {/* 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* =========================================
              LEFT COLUMN: INPUT CARD (Image 1 replica)
             ========================================= */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
              <form onSubmit={handleCalculate} className="space-y-6">
                
                {/* Field 1: CIF Value (JPY) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    CIF Value (JPY)
                  </label>
                  <input
                    type="text"
                    value={cifJpyInput}
                    onChange={(e) => setCifJpyInput(e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-800 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm"
                  />
                </div>

                {/* Field 2: JPY to LKR Rate */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    JPY to LKR Rate
                  </label>
                  <input
                    type="text"
                    value={jpyRateInput}
                    onChange={(e) => setJpyRateInput(e.target.value)}
                    placeholder="5.35"
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-800 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm"
                  />
                  {/* Link: Sri Lanka Customs Weekly Exchange Rates */}
                  <a
                    href="https://www.customs.gov.lk/rates.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 text-xs sm:text-sm font-semibold mt-2.5 transition group"
                  >
                    <span>View Sri Lanka Customs Weekly Exchange Rates</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                  </a>
                </div>

                {/* Field 3: Fuel Type (full width) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Fuel Type
                  </label>
                  <div className="relative">
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as FuelType)}
                      className="w-full appearance-none px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-slate-800 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm pr-10 cursor-pointer"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Hybrid Petrol">Hybrid Petrol</option>
                      <option value="Hybrid Diesel">Hybrid Diesel</option>
                      <option value="Electric">Electric</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Field 4: Engine Capacity (cc) (full width) */}
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    {fuelType === 'Electric' ? 'Motor Power (kW)' : 'Engine Capacity (cc)'}
                  </label>
                  <input
                    type="text"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    placeholder={fuelType === 'Electric' ? '100' : '2,000'}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-800 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm"
                  />
                </div>

                {/* Vertically Stacked Action Buttons matching Image 2: Calculate Tax (top, red) & Reset (bottom, gray) */}
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 px-6 rounded-full bg-[#e1252b] hover:bg-[#c91d23] text-white font-semibold text-base shadow-lg shadow-rose-600/30 transition-all text-center active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Calculate Tax
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-4 px-6 rounded-full bg-[#eaebee] hover:bg-[#dfe1e5] text-slate-800 font-semibold text-base transition-all text-center active:scale-[0.98] cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </form>

              {/* Helpful Information Notes */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>
                    Calculations follow the latest Sri Lanka Customs Tariff Guide (including 30% CID, 50% SUR, specific excise rates, 18% VAT, and 2.5% SSCL).
                  </span>
                </div>
              </div>
            </div>
          </div>


          {/* =========================================
              RIGHT COLUMN: RESULTS CARD (Image 2 replica)
             ========================================= */}
          <div className="lg:col-span-7 w-full">
            <div className="bg-[#18191d] rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-rose-600/5 rounded-full blur-3xl pointer-events-none" />

              {/* Top Capsule 1: HS Code */}
              <div className="w-full bg-[#24262c] text-slate-200 font-semibold px-5 py-3.5 rounded-2xl text-sm sm:text-base mb-3 flex items-center justify-between">
                <span>HS Code: {result.hsCode}</span>
                <span className="text-xs text-slate-400 font-normal">{fuelType}</span>
              </div>

              {/* Top Capsule 2: CIF Value (LKR) */}
              <div className="w-full bg-[#24262c] text-slate-200 font-semibold px-5 py-3.5 rounded-2xl text-sm sm:text-base mb-6 flex items-center justify-between">
                <span>CIF Value (LKR): {result.cifLkr.toLocaleString('en-US')}</span>
                <span className="text-xs text-slate-400 font-normal">
                  Rate: {jpyRate}
                </span>
              </div>

              {/* Title Header with Quick Actions */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Tax Calculation
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyBreakdown}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                    title="Copy calculation summary"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                    title="Print calculation"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print</span>
                  </button>
                </div>
              </div>

              {/* Breakdown Table matching Image 2 */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs sm:text-sm font-semibold text-slate-400">
                      <th className="py-3 text-left w-1/4">Type</th>
                      <th className="py-3 text-left w-1/4">Tax Base</th>
                      <th className="py-3 text-left w-1/4">Rate</th>
                      <th className="py-3 text-right w-1/4">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {result.rows.map((row) => (
                      <tr key={row.type} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 font-bold text-white pr-2">
                          {row.type}
                        </td>
                        <td className="py-3.5 text-slate-300 pr-2">
                          {row.taxBase}
                        </td>
                        <td className="py-3.5 text-slate-300 pr-2">
                          {row.rate}
                        </td>
                        <td className="py-3.5 font-semibold text-white text-right">
                          {row.amount.toLocaleString('en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Tax Footer matching Image 2 */}
              <div className="border-t border-slate-800 mt-4 pt-5 flex items-center justify-end gap-6 sm:gap-12">
                <span className="text-base sm:text-lg font-bold text-slate-200">
                  Total Tax
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {result.totalTax.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Public Footer if not inside Admin */}
      {!isAdminView && (
        <footer className="mt-16 bg-white border-t border-slate-200 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} D&N Automart (PVT) LTD. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/" className="hover:text-brand-600 transition">Home</Link>
              <Link to="/tax-calculation" className="text-rose-600 font-semibold hover:text-rose-700 transition">Tax Calculator</Link>
              <a href="https://www.customs.gov.lk/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 transition flex items-center gap-1">
                Sri Lanka Customs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

