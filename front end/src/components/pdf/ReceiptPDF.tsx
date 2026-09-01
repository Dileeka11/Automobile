import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { Invoice, MakeModel, Quotation, VehicleModel, InvoicePayment } from '@/types';
import { formatCurrency, formatDate, quotationTotal, invoiceSettlement } from '@/utils';

const NAVY = '#1a3a6e';
const BLUE = '#4169E1';
const WHITE = '#ffffff';
const DARK_TEXT = '#1a1a2e';
const GRAY_TEXT = '#5a6577';
const BORDER_GRAY = '#d0d7e2';
const GREEN = '#047857';
const AMBER = '#92400e';

const LOGO_URL = '/logo.png';

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: DARK_TEXT, lineHeight: 1.4 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: NAVY, paddingBottom: 12, marginBottom: 20,
  },
  companyLogoBlock: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImage: { width: 42, height: 45, objectFit: 'contain' },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 2 },
  titleBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: BLUE, letterSpacing: 1 },
  receiptNo: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: DARK_TEXT, marginTop: 4 },
  grid: { flexDirection: 'row', gap: 20, marginBottom: 15 },
  card: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 6, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: {
    fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY,
    borderBottomWidth: 1, borderBottomColor: '#cbd5e1', paddingBottom: 4, marginBottom: 8, textTransform: 'uppercase',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  cardLabel: { color: GRAY_TEXT },
  cardValue: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: {
    fontSize: 10, fontFamily: 'Helvetica-Bold', color: WHITE, backgroundColor: NAVY,
    padding: 5, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  summaryBox: {
    backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1,
    borderRadius: 6, padding: 15, marginBottom: 20,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  divider: { borderTopWidth: 1, borderTopColor: '#bbf7d0', marginTop: 8, marginBottom: 8 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#bbf7d0', paddingTop: 8, marginTop: 8,
  },
  grandAmount: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: GREEN },
  balanceAmount: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: AMBER },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    fontFamily: 'Helvetica-Bold', fontSize: 8, color: WHITE, alignSelf: 'flex-start',
  },
  statusPAID: { backgroundColor: GREEN },
  statusPARTIAL: { backgroundColor: BLUE },
  statusPENDING: { backgroundColor: AMBER },
  footer: { marginTop: 40, borderTopWidth: 1, borderTopColor: BORDER_GRAY, paddingTop: 15, alignItems: 'center' },
  footerText: { color: GRAY_TEXT, fontSize: 8 },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 50 },
  signatureLine: { width: 150, borderTopWidth: 1, borderTopColor: DARK_TEXT, alignItems: 'center', paddingTop: 5 },
  signatureText: { fontSize: 8, color: GRAY_TEXT },
  slipAmountBox: {
    backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1,
    borderRadius: 6, padding: 20, marginBottom: 20, alignItems: 'center',
  },
  slipAmountLabel: { fontSize: 9, color: GRAY_TEXT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  slipAmount: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: NAVY },
});

function PageHeader({ title, receiptNo, date }: { title: string; receiptNo: string; date: string }) {
  return (
    <View style={s.headerRow}>
      <View style={s.companyLogoBlock}>
        <Image src={LOGO_URL} style={s.logoImage} />
        <Text style={s.companyName}>D&N Automart</Text>
      </View>
      <View style={s.titleBlock}>
        <Text style={s.docTitle}>{title}</Text>
        <Text style={s.receiptNo}>{receiptNo}</Text>
        <Text style={{ fontSize: 8, color: GRAY_TEXT, marginTop: 2 }}>Date: {date}</Text>
      </View>
    </View>
  );
}

function CustomerVehicleGrid({ quotation, vehicle, make }: { quotation: Quotation; vehicle: VehicleModel; make: MakeModel }) {
  return (
    <View style={s.grid}>
      <View style={s.card}>
        <Text style={s.cardTitle}>Customer Details</Text>
        <View style={s.cardRow}><Text style={s.cardLabel}>Name:</Text><Text style={s.cardValue}>{quotation.name}</Text></View>
        <View style={s.cardRow}><Text style={s.cardLabel}>NIC:</Text><Text style={s.cardValue}>{quotation.nic}</Text></View>
        <View style={s.cardRow}><Text style={s.cardLabel}>Mobile:</Text><Text style={s.cardValue}>{quotation.mobileNo}</Text></View>
        {quotation.email && <View style={s.cardRow}><Text style={s.cardLabel}>Email:</Text><Text style={s.cardValue}>{quotation.email}</Text></View>}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Vehicle Details</Text>
        <View style={s.cardRow}><Text style={s.cardLabel}>Vehicle:</Text><Text style={s.cardValue}>{make.name} {vehicle.name}</Text></View>
        <View style={s.cardRow}><Text style={s.cardLabel}>Model Year:</Text><Text style={s.cardValue}>{vehicle.year}</Text></View>
        <View style={s.cardRow}><Text style={s.cardLabel}>Color:</Text><Text style={s.cardValue}>{vehicle.color}</Text></View>
        <View style={s.cardRow}><Text style={s.cardLabel}>Quotation Ref:</Text><Text style={s.cardValue}>{quotation.id}</Text></View>
      </View>
    </View>
  );
}

function PageFooter() {
  return (
    <>
      <View style={s.signatureRow}>
        <View style={s.signatureLine}><Text style={s.signatureText}>Prepared By</Text></View>
        <View style={s.signatureLine}><Text style={s.signatureText}>Customer Signature</Text></View>
      </View>
      <View style={s.footer}>
        <Text style={s.footerText}>Thank you for your business!</Text>
        <Text style={[s.footerText, { marginTop: 2 }]}>Automobile Importers • Tel: +94 77 123 4567 • Email: info@automobile.lk</Text>
      </View>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   1. CONSOLIDATED RECEIPT  (header "Print Receipt" button)
   One receipt per invoice — receipt no = RCPT-INV-{id}
   Shows full payment breakdown and current totals.
───────────────────────────────────────────────────────────────── */
interface ConsolidatedProps {
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
  allPayments: InvoicePayment[];
}

export function ConsolidatedReceiptDocument({ invoice, quotation, vehicle, make, allPayments }: ConsolidatedProps) {
  const totalVehicleCost = quotationTotal(quotation);
  const advanceAmount = Number(invoice.advanceAmount || 0);
  const viaCompany = invoice.lcOpenType === 'company';
  const lcAmount = invoice.isLcComplete ? Number(quotation.lcAmount || 0) : 0;
  const ttAmount = invoice.isTtComplete ? Number(quotation.ttAmount || 0) : 0;
  const totalInstallmentsPaid = allPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  const settlement = invoiceSettlement({
    total: totalVehicleCost,
    advanceAmount,
    installments: totalInstallmentsPaid,
    lcAmount: quotation.lcAmount || 0,
    ttAmount: quotation.ttAmount || 0,
    isLcComplete: invoice.isLcComplete,
    isTtComplete: invoice.isTtComplete,
    lcOpenType: invoice.lcOpenType,
  });
  const totalAdvance = settlement.advance;
  const remainingBalance = settlement.balance;
  const statusStr = invoice.status ? invoice.status.toUpperCase() : 'PENDING';
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PageHeader title="PAYMENT RECEIPT" receiptNo={`Receipt No: RCPT-INV-${invoice.id}`} date={today} />
        <CustomerVehicleGrid quotation={quotation} vehicle={vehicle} make={make} />

        <Text style={s.sectionTitle}>Payment Summary</Text>

        <View style={s.summaryBox}>
          <View style={s.row}>
            <Text style={s.cardLabel}>Total Vehicle Cost:</Text>
            <Text style={s.cardValue}>{formatCurrency(totalVehicleCost)}</Text>
          </View>
          <View style={s.divider} />

          <View style={s.row}>
            <Text style={s.cardLabel}>Advance:</Text>
            <Text style={s.cardValue}>{formatCurrency(advanceAmount)}</Text>
          </View>
          {lcAmount > 0 && !viaCompany && (
            <View style={s.row}>
              <Text style={s.cardLabel}>+ LC Amount:</Text>
              <Text style={s.cardValue}>{formatCurrency(lcAmount)}</Text>
            </View>
          )}
          {ttAmount > 0 && !viaCompany && (
            <View style={s.row}>
              <Text style={s.cardLabel}>+ Other Payment:</Text>
              <Text style={s.cardValue}>{formatCurrency(ttAmount)}</Text>
            </View>
          )}
          {allPayments.map((p) => (
            <View key={p.id} style={s.row}>
              <Text style={s.cardLabel}>+ Installment ({formatDate(p.paymentDate)}):</Text>
              <Text style={s.cardValue}>{formatCurrency(Number(p.amount))}</Text>
            </View>
          ))}

          <View style={s.totalRow}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: DARK_TEXT }}>Total Advance:</Text>
            <Text style={s.grandAmount}>{formatCurrency(totalAdvance)}</Text>
          </View>
          {settlement.companyThrough > 0 && (
            <View style={s.row}>
              <Text style={s.cardLabel}>Company Through (LC / Other):</Text>
              <Text style={s.cardValue}>{formatCurrency(settlement.companyThrough)}</Text>
            </View>
          )}
          <View style={s.divider} />
          <View style={s.row}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: AMBER }}>Remaining Balance:</Text>
            <Text style={s.balanceAmount}>{formatCurrency(remainingBalance)}</Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 8, color: GRAY_TEXT, marginBottom: 4 }}>Payment Status:</Text>
          <View style={[s.statusBadge, s[`status${statusStr}` as keyof typeof s] || s.statusPENDING]}>
            <Text>{statusStr}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

/* ─────────────────────────────────────────────────────────────────
   2. INSTALLMENT SLIP  (per-row print icon)
   Simple receipt for one specific installment payment.
───────────────────────────────────────────────────────────────── */
interface SlipProps {
  payment: InvoicePayment;
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
}

export function InstallmentSlipDocument({ payment, invoice, quotation, vehicle, make }: SlipProps) {
  const statusStr = invoice.status ? invoice.status.toUpperCase() : 'PENDING';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <PageHeader
          title="INSTALLMENT RECEIPT"
          receiptNo={`Receipt No: REC-${payment.id}`}
          date={formatDate(payment.paymentDate)}
        />
        <CustomerVehicleGrid quotation={quotation} vehicle={vehicle} make={make} />

        <Text style={s.sectionTitle}>Installment Payment</Text>

        <View style={s.slipAmountBox}>
          <Text style={s.slipAmountLabel}>Amount Paid</Text>
          <Text style={s.slipAmount}>{formatCurrency(Number(payment.amount))}</Text>
          <View style={{ borderTopWidth: 1, borderTopColor: '#bfdbfe', marginTop: 14, marginBottom: 10, width: '60%', alignSelf: 'center' }} />
          <Text style={{ fontSize: 9, color: GRAY_TEXT, marginTop: 2 }}>Invoice Ref: INV-{invoice.id}</Text>
          <Text style={{ fontSize: 9, color: GRAY_TEXT, marginTop: 4 }}>Date: {formatDate(payment.paymentDate)}</Text>
          {payment.notes && (
            <Text style={{ fontSize: 9, color: GRAY_TEXT, marginTop: 4 }}>Notes: {payment.notes}</Text>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 8, color: GRAY_TEXT, marginBottom: 4 }}>Payment Status:</Text>
          <View style={[s.statusBadge, s[`status${statusStr}` as keyof typeof s] || s.statusPENDING]}>
            <Text>{statusStr}</Text>
          </View>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VIEWERS & DOWNLOAD HELPERS
───────────────────────────────────────────────────────────────── */
function PdfViewer({ docElement, deps }: { docElement: React.ReactElement; deps: unknown[] }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    pdf(docElement).toBlob().then((blob) => {
      if (!active) return;
      const url = URL.createObjectURL(blob);
      setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return url; });
      setLoading(false);
    });
    return () => {
      active = false;
      setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-slate-50 border rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        <p className="text-xs text-slate-500 mt-2 font-medium">Generating PDF preview...</p>
      </div>
    );
  }
  return <iframe src={pdfUrl || ''} style={{ width: '100%', height: '82vh', border: 0 }} className="rounded-xl border border-slate-200 shadow-sm" />;
}

export function ConsolidatedReceiptPDFViewer(props: ConsolidatedProps) {
  return (
    <PdfViewer
      docElement={<ConsolidatedReceiptDocument {...props} />}
      deps={[props.invoice, props.quotation, props.vehicle, props.make, props.allPayments]}
    />
  );
}

export function InstallmentSlipPDFViewer(props: SlipProps) {
  return (
    <PdfViewer
      docElement={<InstallmentSlipDocument {...props} />}
      deps={[props.payment, props.invoice, props.quotation, props.vehicle, props.make]}
    />
  );
}

export async function downloadConsolidatedReceiptPDF(props: ConsolidatedProps) {
  const blob = await pdf(<ConsolidatedReceiptDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_INV-${props.invoice.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadInstallmentSlipPDF(props: SlipProps) {
  const blob = await pdf(<InstallmentSlipDocument {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Installment_REC-${props.payment.id}_INV-${props.invoice.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────────────────────────
   LEGACY ALIASES (keep existing imports working)
───────────────────────────────────────────────────────────────── */
export { ConsolidatedReceiptPDFViewer as ReceiptPDFViewer };
export async function downloadReceiptPDF(props: ConsolidatedProps) {
  return downloadConsolidatedReceiptPDF(props);
}
