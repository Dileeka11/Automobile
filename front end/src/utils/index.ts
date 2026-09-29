import { Quotation } from '@/types';

export const generateId = (prefix = ''): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

export const formatCurrency = (value: number): string => {
  if (Number.isNaN(value) || value === undefined || value === null) return 'LKR 0.00';
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-LK', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

/** CIF value is shown for reference only — it is never part of the total cost. */
export const quotationTotal = (q: Quotation): number =>
  (q.lcAmount || 0) + (q.ttAmount || 0) + (q.taxAmount || 0) + (q.serviceCharge || 0) + (q.clearingCharge || 0) + (q.dmiCharge || 0);

export interface SettlementInput {
  total: number;
  advanceAmount: number;
  /** Sum of installment payments */
  installments: number;
  lcAmount: number;
  ttAmount: number;
  isLcComplete?: boolean;
  isTtComplete?: boolean;
  lcOpenType?: 'company' | 'personal' | '' | null;
}

export interface Settlement {
  /** Cash the customer actually put in: the installments, or the typed advance when there are none */
  advance: number;
  /** False once installments exist — the typed advance is then only the agreed figure, not extra cash */
  advanceCounted: boolean;
  /** LC + Other Payment settled internally (via the LC facility) — not the customer's cash */
  companyThrough: number;
  /** Everything already settled — advance + companyThrough */
  settled: number;
  /** total - settled */
  balance: number;
}

/**
 * Installments are the payments made against the advance, so once any are recorded
 * only they count — the advance typed on the invoice is not added on top of them.
 * With no installments the typed advance is the amount paid.
 *
 * LC and Other Payment, once ticked, are settled internally through the LC facility.
 * They are reported separately (companyThrough) rather than rolled into the customer's
 * advance, but they are still settled money, so the balance is what is left after both:
 *   balance = total - (advance + companyThrough)
 */
export const invoiceSettlement = (i: SettlementInput): Settlement => {
  const lc = i.isLcComplete ? i.lcAmount || 0 : 0;
  const tt = i.isTtComplete ? i.ttAmount || 0 : 0;

  // LC + Other Payment: settled internally and reported separately, but still deducted.
  const companyThrough = lc + tt;
  // The customer's own cash: installments when present, otherwise the typed advance.
  const installments = i.installments || 0;
  const advanceCounted = installments <= 0;
  const advance = advanceCounted ? i.advanceAmount || 0 : installments;
  const settled = advance + companyThrough;

  return {
    advance,
    advanceCounted,
    companyThrough,
    settled,
    balance: Math.max(0, (i.total || 0) - settled),
  };
};

export interface PricingInput {
  lcOpenType?: 'company' | 'personal' | '' | null;
  sellingPrice?: number | null;
  vatPercent?: number | null;
}

export interface InvoicePricing {
  /** Quotation total — what the vehicle costs the company */
  cost: number;
  /** Company LC with a selling price: the customer is billed selling price + VAT */
  isCompanyPriced: boolean;
  sellingPrice: number;
  vatPercent: number;
  vatAmount: number;
  /** What the customer owes in total — selling price + VAT, or the cost for personal LC */
  total: number;
  /** Total vehicle price (selling price + VAT) - cost (company LC only) */
  profit: number;
}

/**
 * Personal LC: the customer pays the quotation total and the service charge is the revenue.
 * Company LC: the customer pays the selling price + VAT; the revenue is that total - cost.
 * A company invoice without a selling price yet falls back to the personal behaviour.
 */
export const invoicePricing = (i: PricingInput, q?: Quotation | null): InvoicePricing => {
  const cost = q ? quotationTotal(q) : 0;
  const sellingPrice = Number(i.sellingPrice || 0);
  const vatPercent = Number(i.vatPercent || 0);
  const isCompanyPriced = i.lcOpenType === 'company' && sellingPrice > 0;
  if (!isCompanyPriced) {
    return { cost, isCompanyPriced, sellingPrice, vatPercent, vatAmount: 0, total: cost, profit: 0 };
  }
  const vatAmount = Math.round(sellingPrice * vatPercent) / 100;
  return {
    cost,
    isCompanyPriced,
    sellingPrice,
    vatPercent,
    vatAmount,
    total: sellingPrice + vatAmount,
    profit: sellingPrice + vatAmount - cost,
  };
};

/**
 * The amount an invoice adds to the cashbook once it is fully paid:
 * the service charge for personal LC, the profit (selling price + VAT - cost) for company LC.
 */
export const cashbookRevenue = (i: PricingInput, q?: Quotation | null): number => {
  if (i.lcOpenType === 'company') return Math.max(0, invoicePricing(i, q).profit);
  return Number(q?.serviceCharge || 0);
};

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');
