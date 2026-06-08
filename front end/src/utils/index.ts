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

export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');
