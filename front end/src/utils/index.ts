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

export const quotationTotal = (q: Quotation): number =>
  (q.cifValue || 0) + (q.lcAmount || 0) + (q.ttAmount || 0) + (q.taxAmount || 0) + (q.serviceCharge || 0) + (q.clearingCharge || 0) + (q.dmiCharge || 0);

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
  /** Cash the customer put in: advance + installments (+ LC/Other when opened personally) */
  advance: number;
  /** LC + Other Payment settled by the company when the LC is opened through the company */
  companyThrough: number;
  /** Everything already settled — advance + companyThrough */
  settled: number;
  balance: number;
}

/**
 * When the LC is opened through the company, the LC and Other Payment amounts are
 * still deducted from the total, but they are reported separately instead of being
 * rolled into the customer's advance.
 */
export const invoiceSettlement = (i: SettlementInput): Settlement => {
  const viaCompany = i.lcOpenType === 'company';
  const lc = i.isLcComplete ? i.lcAmount || 0 : 0;
  const tt = i.isTtComplete ? i.ttAmount || 0 : 0;

  const companyThrough = viaCompany ? lc + tt : 0;
  const advance = (i.advanceAmount || 0) + (i.installments || 0) + (viaCompany ? 0 : lc + tt);
  const settled = advance + companyThrough;

  return {
    advance,
    companyThrough,
    settled,
    balance: Math.max(0, (i.total || 0) - settled),
  };
};

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');
