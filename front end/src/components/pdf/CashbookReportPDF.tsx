import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/utils';

/* ─── Brand colors matching the other documents ─── */
const NAVY = '#1a3a6e';
const LIGHT_BLUE = '#e8eef7';
const WHITE = '#ffffff';
const DARK_TEXT = '#1a1a2e';
const GRAY_TEXT = '#5a6577';
const BORDER_GRAY = '#d0d7e2';
const GREEN = '#047857';
const RED = '#b91c1c';

const LOGO_URL = '/logo.png';

export type CashbookRevenueRow = {
  invoiceId: string;
  customerName: string;
  vehicleDetails: string;
  serviceCharge: number;
  createdAt: string;
};

export type CashbookExpenseRow = {
  id: number;
  expenseType: string;
  description: string;
  amount: number | string;
  dateIncurred: string;
};

export type CashbookReportProps = {
  from: string;
  to: string;
  revenues: CashbookRevenueRow[];
  expenses: CashbookExpenseRow[];
  totalInflow: number;
  totalOutflow: number;
  netProfit: number;
};

const s = StyleSheet.create({
  page: {
    position: 'relative',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: DARK_TEXT,
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 30,
  },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  logoImage: { width: 45, height: 48, objectFit: 'contain' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 1.5 },
  docMetaBlock: { alignItems: 'flex-end' },
  docMeta: { fontSize: 7, color: GRAY_TEXT, marginBottom: 0.5 },
  docMetaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK_TEXT, marginBottom: 1.5 },
  divider: { height: 1, backgroundColor: NAVY, marginBottom: 8 },

  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    backgroundColor: NAVY,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginBottom: 3,
    marginTop: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* Summary cards */
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  summaryCard: { flex: 1, padding: 6, backgroundColor: LIGHT_BLUE, borderRadius: 2 },
  summaryLabel: { fontSize: 6.5, color: GRAY_TEXT, marginBottom: 2, textTransform: 'uppercase' },
  summaryValue: { fontSize: 11, fontFamily: 'Helvetica-Bold' },

  /* Tables */
  table: { borderWidth: 1, borderColor: BORDER_GRAY, borderRadius: 2 },
  tHead: { flexDirection: 'row', backgroundColor: NAVY, paddingVertical: 3, paddingHorizontal: 6 },
  tHeadCell: { color: WHITE, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_GRAY,
  },
  tRowAlt: { backgroundColor: '#f5f8fc' },
  cell: { fontSize: 7.5 },
  cellRight: { fontSize: 7.5, textAlign: 'right' },
  totalRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, backgroundColor: NAVY },
  totalLabel: { flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: WHITE },
  totalValue: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: WHITE },
  emptyNote: { fontSize: 7.5, color: GRAY_TEXT, fontStyle: 'italic', padding: 8, textAlign: 'center' },

  /* Net position */
  netRow: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 3,
    marginTop: 10,
    borderWidth: 1,
  },
  netLabel: { flex: 3, fontFamily: 'Helvetica-Bold', fontSize: 11 },
  netValue: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 11 },

  footer: {
    position: 'absolute',
    bottom: 18,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: BORDER_GRAY,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: GRAY_TEXT },
});

const periodLabel = (from: string, to: string) => {
  if (from && to) return `${formatDate(from)}  to  ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Up to ${formatDate(to)}`;
  return 'All time';
};

export function CashbookReportDoc({
  from, to, revenues, expenses, totalInflow, totalOutflow, netProfit,
}: CashbookReportProps) {
  const positive = netProfit >= 0;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Header ── */}
        <View style={s.headerBar}>
          <Image src={LOGO_URL} style={s.logoImage} />
          <View style={s.docMetaBlock}>
            <Text style={s.docMeta}>Report Period:</Text>
            <Text style={s.docMetaValue}>{periodLabel(from, to)}</Text>
            <Text style={s.docMeta}>Generated:</Text>
            <Text style={s.docMetaValue}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>

        <Text style={s.docTitle}>CASHBOOK REPORT</Text>
        <View style={s.divider} />

        {/* ── Summary ── */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Realized Revenue</Text>
            <Text style={[s.summaryValue, { color: GREEN }]}>{formatCurrency(totalInflow)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>General Expenses</Text>
            <Text style={[s.summaryValue, { color: RED }]}>{formatCurrency(totalOutflow)}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryLabel}>Net Margin / Profit</Text>
            <Text style={[s.summaryValue, { color: positive ? NAVY : RED }]}>{formatCurrency(netProfit)}</Text>
          </View>
        </View>

        {/* ── Service Charge Revenues ── */}
        <Text style={s.sectionTitle}>Service Charge Revenues ({revenues.length})</Text>
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.tHeadCell, { flex: 1.2 }]}>Invoice ID</Text>
            <Text style={[s.tHeadCell, { flex: 1.6 }]}>Customer</Text>
            <Text style={[s.tHeadCell, { flex: 2 }]}>Vehicle</Text>
            <Text style={[s.tHeadCell, { flex: 1 }]}>Date</Text>
            <Text style={[s.tHeadCell, { flex: 1.2, textAlign: 'right' }]}>Service Charge</Text>
          </View>
          {revenues.length === 0 ? (
            <Text style={s.emptyNote}>No fully-paid service charge revenues in this period.</Text>
          ) : (
            revenues.map((r, i) => (
              <View key={`${r.invoiceId}-${i}`} style={[s.tRow, ...(i % 2 ? [s.tRowAlt] : [])]}>
                <Text style={[s.cell, { flex: 1.2 }]}>{r.invoiceId}</Text>
                <Text style={[s.cell, { flex: 1.6 }]}>{r.customerName}</Text>
                <Text style={[s.cell, { flex: 2 }]}>{r.vehicleDetails}</Text>
                <Text style={[s.cell, { flex: 1 }]}>{formatDate(r.createdAt)}</Text>
                <Text style={[s.cellRight, { flex: 1.2, color: GREEN }]}>{formatCurrency(r.serviceCharge)}</Text>
              </View>
            ))
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Realized Revenue</Text>
            <Text style={s.totalValue}>{formatCurrency(totalInflow)}</Text>
          </View>
        </View>

        {/* ── Expenses Ledger ── */}
        <Text style={s.sectionTitle}>Expenses Ledger ({expenses.length})</Text>
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.tHeadCell, { flex: 1 }]}>Date</Text>
            <Text style={[s.tHeadCell, { flex: 1.4 }]}>Category</Text>
            <Text style={[s.tHeadCell, { flex: 3.4 }]}>Description</Text>
            <Text style={[s.tHeadCell, { flex: 1.2, textAlign: 'right' }]}>Amount</Text>
          </View>
          {expenses.length === 0 ? (
            <Text style={s.emptyNote}>No expenses recorded in this period.</Text>
          ) : (
            expenses.map((e, i) => (
              <View key={e.id} style={[s.tRow, ...(i % 2 ? [s.tRowAlt] : [])]}>
                <Text style={[s.cell, { flex: 1 }]}>{formatDate(e.dateIncurred)}</Text>
                <Text style={[s.cell, { flex: 1.4 }]}>{e.expenseType}</Text>
                <Text style={[s.cell, { flex: 3.4 }]}>{e.description || '—'}</Text>
                <Text style={[s.cellRight, { flex: 1.2, color: RED }]}>{formatCurrency(Number(e.amount))}</Text>
              </View>
            ))
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total General Expenses</Text>
            <Text style={s.totalValue}>{formatCurrency(totalOutflow)}</Text>
          </View>
        </View>

        {/* ── Net position ── */}
        <View
          style={[
            s.netRow,
            positive
              ? { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }
              : { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
          ]}
        >
          <Text style={[s.netLabel, { color: positive ? GREEN : RED }]}>NET MARGIN / PROFIT</Text>
          <Text style={[s.netValue, { color: positive ? GREEN : RED }]}>{formatCurrency(netProfit)}</Text>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>D&N Automart (PVT) LTD — Corporate Cashbook Report</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function downloadCashbookReportPDF(props: CashbookReportProps) {
  const blob = await pdf(<CashbookReportDoc {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = props.from && props.to ? `${props.from}_to_${props.to}` : 'All-Time';
  a.href = url;
  a.download = `Cashbook_Report_${stamp}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
