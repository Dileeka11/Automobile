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

export type FuelType =
  | 'Petrol'
  | 'Diesel'
  | 'Electric'
  | 'Petrol Hybrid'
  | 'Diesel Hybrid'
  | 'E-Power Hybrid';

/** Vehicle age bucket – only used for Electric / E-Power Hybrid (excise is age dependent). */
export type VehicleAge = 'less' | 'more';

export const FUEL_TYPES: FuelType[] = [
  'Petrol',
  'Diesel',
  'Electric',
  'Petrol Hybrid',
  'Diesel Hybrid',
  'E-Power Hybrid',
];

/** Electric & E-Power Hybrid are taxed per kW of motor power, everything else per cc. */
export const isKwFuel = (fuel: FuelType | '') => fuel === 'Electric' || fuel === 'E-Power Hybrid';

interface TaxBreakdownRow {
  type: string;
  name: string;
  taxBase: string;
  rate: string;
  amount: number;
}

interface TaxCalculationResult {
  hsCode?: string;
  cifLkr: number;
  rows: TaxBreakdownRow[];
  totalTax: number;
}

interface CcSlab {
  hsCode: string;
  min: number;
  max: number;
  rate: number;
}

/** Excise duty (XID) slabs per cc – 2025 gazette rates. */
const XID_CC_SLABS: Record<'Petrol' | 'Diesel' | 'Petrol Hybrid' | 'Diesel Hybrid', CcSlab[]> = {
  Petrol: [
    { hsCode: '8703.21.69', min: 814, max: 1000, rate: 2450 },
    { hsCode: '8703.22.50', min: 1001, max: 1300, rate: 3850 },
    { hsCode: '8703.22.50', min: 1301, max: 1500, rate: 4450 },
    { hsCode: '8703.23.52', min: 1501, max: 1600, rate: 5150 },
    { hsCode: '8703.23.55', min: 1601, max: 1800, rate: 6400 },
    { hsCode: '8703.23.69', min: 1801, max: 2000, rate: 7700 },
    { hsCode: '8703.23.70', min: 2001, max: 2500, rate: 8450 },
    { hsCode: '8703.23.70', min: 2501, max: 2800, rate: 9650 },
    { hsCode: '8703.23.70', min: 2751, max: 3000, rate: 10850 },
    { hsCode: '8703.24.50', min: 3001, max: 4000, rate: 12050 },
    { hsCode: '8703.25.50', min: 4001, max: 50000, rate: 13300 },
  ],
  Diesel: [
    { hsCode: '8703.31.70', min: 0, max: 1500, rate: 5550 },
    { hsCode: '8703.32.52', min: 1501, max: 1600, rate: 6950 },
    { hsCode: '8703.32.55', min: 1601, max: 1800, rate: 8300 },
    { hsCode: '8703.32.59', min: 1801, max: 2000, rate: 9650 },
    { hsCode: '8703.32.79', min: 2001, max: 2500, rate: 9650 },
    { hsCode: '8703.33.50', min: 2501, max: 2750, rate: 10850 },
    { hsCode: '8703.33.50', min: 2751, max: 3000, rate: 12050 },
    { hsCode: '8703.33.50', min: 3001, max: 4000, rate: 13300 },
    { hsCode: '8703.33.50', min: 4001, max: 50000, rate: 14500 },
  ],
  'Petrol Hybrid': [
    { hsCode: '8703.40.35', min: 1001, max: 1300, rate: 2750 },
    { hsCode: '8703.40.35', min: 1301, max: 1500, rate: 3450 },
    { hsCode: '8703.40.51', min: 1501, max: 1600, rate: 4800 },
    { hsCode: '8703.40.53', min: 1601, max: 1800, rate: 6300 },
    { hsCode: '8703.40.58', min: 1801, max: 2000, rate: 6900 },
    { hsCode: '8703.40.71', min: 2001, max: 2500, rate: 7250 },
    { hsCode: '8703.40.71', min: 2501, max: 2750, rate: 8450 },
    { hsCode: '8703.40.71', min: 2751, max: 3000, rate: 9650 },
    { hsCode: '8703.40.91', min: 3001, max: 4000, rate: 10850 },
    { hsCode: '8703.40.91', min: 4001, max: 50000, rate: 12050 },
  ],
  'Diesel Hybrid': [
    { hsCode: '8703.50.28', min: 0, max: 1000, rate: 4150 },
    { hsCode: '8703.50.35', min: 1001, max: 1500, rate: 4150 },
    { hsCode: '8703.50.51', min: 1501, max: 1600, rate: 5550 },
    { hsCode: '8703.50.53', min: 1601, max: 1800, rate: 6900 },
    { hsCode: '8703.50.58', min: 1801, max: 2000, rate: 8350 },
    { hsCode: '8703.50.78', min: 2001, max: 2500, rate: 8450 },
    { hsCode: '8703.50.78', min: 2501, max: 2750, rate: 9650 },
    { hsCode: '8703.50.78', min: 2751, max: 3000, rate: 10850 },
    { hsCode: '8703.50.98', min: 3001, max: 4000, rate: 12050 },
    { hsCode: '8703.50.98', min: 4001, max: 50000, rate: 13300 },
  ],
};

/** Excise per kW for Electric vehicles: [≤ 1 year old, > 1 year old]. */
function electricKwRate(kw: number, age: VehicleAge) {
  const young = age === 'less';
  if (kw <= 50) return { rate: young ? 18100 : 36200, hsCode: '8703.80.31' };
  if (kw <= 100) return { rate: young ? 24100 : 36200, hsCode: '8703.80.32' };
  if (kw <= 200) return { rate: young ? 36200 : 60400, hsCode: '8703.80.33' };
  return { rate: young ? 96600 : 132800, hsCode: '8703.80.34' };
}

/** Excise per kW for E-Power Hybrids: [≤ 1 year old, > 1 year old]. */
function ePowerKwRate(kw: number, age: VehicleAge) {
  const young = age === 'less';
  if (kw <= 50) return { rate: young ? 30770 : 43440, hsCode: '8703.80.71' };
  if (kw <= 100) return { rate: young ? 40970 : 43440, hsCode: '8703.80.73' };
  if (kw <= 200) return { rate: young ? 41630 : 63420, hsCode: '8703.80.75' };
  return { rate: young ? 111090 : 139440, hsCode: '8703.80.77' };
}

const fmt = (n: number) => n.toLocaleString('en-US');

function calculateExcise(fuel: FuelType, engine: number, age: VehicleAge) {
  // Small cars carry a flat minimum excise instead of a per-cc rate
  if (fuel === 'Petrol' && engine <= 813) {
    return { base: 1, rate: '1,992,000', amount: 1992000, hsCode: '8703.21.69' };
  }
  if (fuel === 'Petrol Hybrid' && engine < 1000) {
    return { base: 1, rate: '1,810,900', amount: 1810900, hsCode: '8703.40.28' };
  }

  if (isKwFuel(fuel)) {
    const { rate, hsCode } = fuel === 'Electric' ? electricKwRate(engine, age) : ePowerKwRate(engine, age);
    return { base: Math.ceil(engine), rate: `${fmt(rate)}/kW`, amount: Math.ceil(engine * rate), hsCode };
  }

  const slab = XID_CC_SLABS[fuel as keyof typeof XID_CC_SLABS].find((s) => engine >= s.min && engine <= s.max);
  if (slab) {
    return { base: Math.ceil(engine), rate: `${fmt(slab.rate)}/cc`, amount: Math.ceil(engine * slab.rate), hsCode: slab.hsCode };
  }

  return { base: Math.ceil(engine), rate: '0', amount: 0, hsCode: 'Unknown' };
}

/** Luxury tax: charged on the part of CIF (LKR) above the fuel-type threshold. */
function calculateLuxuryTax(cifLkr: number, fuel: FuelType) {
  let threshold = 5000000;
  let multiplier = 1;
  switch (fuel) {
    case 'Diesel':
      multiplier = 1.2;
      break;
    case 'Petrol Hybrid':
      threshold = 5500000;
      multiplier = 0.8;
      break;
    case 'Diesel Hybrid':
      threshold = 5500000;
      multiplier = 0.9;
      break;
    case 'Electric':
    case 'E-Power Hybrid':
      threshold = 6000000;
      multiplier = 0.6;
      break;
  }
  const base = Math.max(0, Math.ceil(cifLkr - threshold));
  if (base === 0) return { base: 0, rate: '0%', amount: 0 };
  return { base, rate: `${100 * multiplier}%`, amount: Math.ceil(base * multiplier) };
}

export function calculateSriLankaTax(
  cifJpy: number,
  jpyRate: number,
  fuelType: FuelType,
  capacity: number,
  age: VehicleAge = 'more'
): TaxCalculationResult {
  // 1. CIF in LKR
  const cifLkr = Math.round(cifJpy * jpyRate);

  // 2. Customs Import Duty (CID) – 30% of CIF
  const cidAmount = Math.ceil(cifLkr * 0.3);

  // 3. Surcharge (SUR) – 50% of CID
  const surAmount = Math.ceil(cidAmount * 0.5);

  // 4. Excise Duty (XID) – per cc / per kW / flat, depending on fuel type
  const xid = calculateExcise(fuelType, capacity, age);

  // 5. VAT – 18% on (CIF + 10%) + CID + SUR + XID. Only computed once every component is present.
  let vatBase = 0;
  let vatAmount = 0;
  if (cifLkr > 0 && cidAmount > 0 && surAmount > 0 && xid.amount > 0) {
    vatBase = Math.ceil(1.1 * cifLkr) + Math.ceil(cidAmount) + Math.ceil(surAmount) + Math.ceil(xid.amount);
    vatAmount = Math.ceil(0.18 * vatBase);
  }

  // 6. SSCL – 2.5% on the VAT base
  const sslAmount = Math.ceil(0.025 * vatBase);

  // 7. Luxury Tax (LXT)
  const lxt = calculateLuxuryTax(cifLkr, fuelType);

  // 8. Fixed per-unit charges (only once there is a CIF value)
  const hasCif = cifLkr > 0;
  const velAmount = hasCif ? 15000 : 0;
  const comAmount = hasCif ? 4000 : 0;

  const totalTax = hasCif
    ? cidAmount + surAmount + xid.amount + vatAmount + velAmount + lxt.amount + comAmount + sslAmount
    : 0;

  const rows: TaxBreakdownRow[] = [
    { type: 'CID', name: 'Customs Import Duty', taxBase: fmt(Math.ceil(cifLkr)), rate: '30%', amount: cidAmount },
    { type: 'SUR', name: 'Surcharge on Customs Duty', taxBase: fmt(Math.ceil(cidAmount)), rate: '50%', amount: surAmount },
    { type: 'XID', name: 'Excise Duty', taxBase: fmt(xid.base), rate: xid.rate, amount: xid.amount },
  ];
  if (lxt.base !== 0) {
    rows.push({ type: 'LXT', name: 'Luxury Tax', taxBase: fmt(lxt.base), rate: lxt.rate, amount: lxt.amount });
  }
  rows.push(
    { type: 'VAT', name: 'Value Added Tax', taxBase: fmt(vatBase), rate: '18%', amount: vatAmount },
    { type: 'SSL', name: 'Social Security Contribution Levy', taxBase: fmt(vatBase), rate: '2.5%', amount: sslAmount },
    { type: 'VEL', name: 'Vehicle Entitlement Levy', taxBase: hasCif ? '1' : '0', rate: '15,000/Unit', amount: velAmount },
    { type: 'COM/EXM/SEL', name: 'Computer & Examination Fees', taxBase: hasCif ? '1' : '0', rate: '4,000/Unit', amount: comAmount }
  );

  return { hsCode: xid.hsCode, cifLkr, rows, totalTax };
}

/** Keeps only digits and one decimal part, strips leading zeros and adds thousands separators. */
function formatNumberInput(value: string): string {
  const [intPart, ...decimals] = value.replace(/[^\d.]/g, '').split('.');
  const grouped = intPart.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimals.length ? `${grouped}.${decimals.join('')}` : grouped;
}

function parseNumberInput(value: string): number {
  return Number(value.replace(/,/g, '')) || 0;
}

/** Result shown while required inputs are missing: every row zero, no HS code. */
function emptyTaxResult() {
  const zero = (type: string, name: string, rate: string) => ({ type, name, taxBase: '0', rate, amount: 0 });
  return {
    hsCode: undefined as string | undefined,
    cifLkr: 0,
    totalTax: 0,
    rows: [
      zero('CID', 'Customs Import Duty', '30%'),
      zero('SUR', 'Surcharge on Customs Duty', '50%'),
      zero('XID', 'Excise Duty', '0'),
      zero('VAT', 'Value Added Tax', '18%'),
      zero('SSL', 'Social Security Contribution Levy', '2.5%'),
      zero('VEL', 'Vehicle Entitlement Levy', '15,000/Unit'),
      zero('COM/EXM/SEL', 'Computer & Examination Fees', '4,000/Unit'),
    ],
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
  const [ageInput, setAgeInput] = useState<VehicleAge | ''>('');

  // Computed values
  const [isCalculated, setIsCalculated] = useState(true);
  const [copied, setCopied] = useState(false);

  const cifJpy = parseNumberInput(cifJpyInput);
  const jpyRate = parseNumberInput(jpyRateInput);
  const capacity = parseNumberInput(capacityInput);
  const kwFuel = isKwFuel(fuelType);

  // Same required-field rules as the reference calculator: all inputs filled, and age for EV / E-Power
  const isValid =
    cifJpyInput.trim() !== '' &&
    jpyRateInput.trim() !== '' &&
    capacityInput.trim() !== '' &&
    (!kwFuel || ageInput !== '');

  const result = useMemo(() => {
    if (!isValid) return emptyTaxResult();
    return calculateSriLankaTax(cifJpy, jpyRate, fuelType, capacity, ageInput || 'more');
  }, [isValid, cifJpy, jpyRate, fuelType, capacity, ageInput]);

  const handleReset = () => {
    setCifJpyInput('1,000');
    setJpyRateInput('5');
    setFuelType('Petrol');
    setCapacityInput('2,000');
    setAgeInput('');
    setIsCalculated(true);
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculated(true);
  };

  const handleCopyBreakdown = () => {
    const text = [
      `D&N Automart - Tax Calculation`,
      `HS Code: ${result.hsCode ?? '-'}`,
      `CIF Value (JPY): ${cifJpy.toLocaleString('en-US')}`,
      `Rate: ${jpyRate}`,
      `CIF Value (LKR): ${result.cifLkr.toLocaleString('en-US')}`,
      `Fuel: ${fuelType} | ${kwFuel ? 'Motor Power' : 'Capacity'}: ${capacity.toLocaleString('en-US')} ${kwFuel ? 'kW' : 'cc'}`,
      ...(kwFuel ? [`Age: ${ageInput === 'less' ? 'Less than a year' : ageInput === 'more' ? 'More than a year' : '-'}`] : []),
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
                    inputMode="decimal"
                    value={cifJpyInput}
                    onChange={(e) => setCifJpyInput(formatNumberInput(e.target.value))}
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
                    inputMode="decimal"
                    value={jpyRateInput}
                    onChange={(e) => setJpyRateInput(formatNumberInput(e.target.value))}
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
                      {FUEL_TYPES.map((fuel) => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
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
                    {kwFuel ? 'Motor Power (kW)' : 'Engine Capacity (cc)'}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(formatNumberInput(e.target.value))}
                    placeholder={kwFuel ? '100' : '2,000'}
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 text-slate-800 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm"
                  />
                </div>

                {/* Field 5: Vehicle age – EV / E-Power excise depends on it */}
                {kwFuel && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                      Manufacture Year
                    </label>
                    <div className="relative">
                      <select
                        value={ageInput}
                        onChange={(e) => setAgeInput(e.target.value as VehicleAge | '')}
                        className={`w-full appearance-none px-4 py-3.5 rounded-2xl border ${ageInput ? 'border-slate-200' : 'border-rose-300'} bg-white text-slate-800 text-base font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition shadow-sm pr-10 cursor-pointer`}
                      >
                        <option value="">Select Year</option>
                        <option value="less">Less than a year</option>
                        <option value="more">More than a year</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {!ageInput && (
                      <p className="text-rose-600 text-xs mt-1.5">Manufacture year is required for {fuelType}.</p>
                    )}
                  </div>
                )}

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
                    Estimates based on the 2025 Sri Lanka Customs / Treasury gazettes (30% CID, 50% SUR, excise by cc or kW, luxury tax above the CIF threshold, 18% VAT and 2.5% SSCL). Final duty is decided by Sri Lanka Customs.
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
                <span>HS Code: {result.hsCode ?? <span className="italic text-slate-400 font-normal">(HS Code will appear here)</span>}</span>
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

