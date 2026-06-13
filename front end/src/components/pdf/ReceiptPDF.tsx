import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { Invoice, MakeModel, Quotation, VehicleModel, InvoicePayment } from '@/types';
import { formatCurrency, formatDate, quotationTotal } from '@/utils';

const NAVY = '#1a3a6e';
const BLUE = '#2956a8';
const LIGHT_BLUE = '#e8eef7';
const WHITE = '#ffffff';
const DARK_TEXT = '#1a1a2e';
const GRAY_TEXT = '#5a6577';
const BORDER_GRAY = '#d0d7e2';
const GREEN = '#047857';
const AMBER = '#92400e';

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: DARK_TEXT,
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: NAVY,
    paddingBottom: 15,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: GRAY_TEXT,
    marginTop: 2,
  },
  titleBlock: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: BLUE,
    letterSpacing: 1,
  },
  receiptNo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  card: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardLabel: {
    color: GRAY_TEXT,
  },
  cardValue: {
    fontFamily: 'Helvetica-Bold',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    backgroundColor: NAVY,
    padding: 5,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentSummary: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  paymentSummaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
    paddingTop: 8,
    marginTop: 8,
  },
  grandAmount: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  balanceAmount: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: AMBER,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: WHITE,
    alignSelf: 'flex-start',
  },
  statusPAID: {
    backgroundColor: GREEN,
  },
  statusPARTIAL: {
    backgroundColor: BLUE,
  },
  statusPENDING: {
    backgroundColor: AMBER,
  },
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER_GRAY,
    paddingTop: 15,
    alignItems: 'center',
  },
  footerText: {
    color: GRAY_TEXT,
    fontSize: 8,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: DARK_TEXT,
    alignItems: 'center',
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 8,
    color: GRAY_TEXT,
  }
});

interface ReceiptDocProps {
  payment: InvoicePayment;
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
  allPayments: InvoicePayment[];
}

export function ReceiptDocument({ payment, invoice, quotation, vehicle, make, allPayments }: ReceiptDocProps) {
  const totalInstallmentsPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const initialAdvance = Number(invoice.advanceAmount || 0) - totalInstallmentsPaid;
  const totalPaid = Number(invoice.advanceAmount || 0);
  const statusStr = invoice.status ? invoice.status.toUpperCase() : 'PENDING';

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.companyName}>AUTOMOBILE</Text>
            <Text style={s.companyTagline}>Premium Vehicle Importers & Dealers</Text>
          </View>
          <View style={s.titleBlock}>
            <Text style={s.docTitle}>PAYMENT RECEIPT</Text>
            <Text style={s.receiptNo}>Receipt No: REC-{payment.id}</Text>
            <Text style={{ fontSize: 8, color: GRAY_TEXT, marginTop: 2 }}>Date: {formatDate(payment.paymentDate)}</Text>
          </View>
        </View>

        {/* Invoice & Customer info grid */}
        <View style={s.grid}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Customer Details</Text>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Name:</Text>
              <Text style={s.cardValue}>{quotation.name}</Text>
            </View>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>NIC:</Text>
              <Text style={s.cardValue}>{quotation.nic}</Text>
            </View>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Mobile:</Text>
              <Text style={s.cardValue}>{quotation.mobileNo}</Text>
            </View>
            {quotation.email && (
              <View style={s.cardRow}>
                <Text style={s.cardLabel}>Email:</Text>
                <Text style={s.cardValue}>{quotation.email}</Text>
              </View>
            )}
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Vehicle Details</Text>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Vehicle:</Text>
              <Text style={s.cardValue}>{make.name} {vehicle.name}</Text>
            </View>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Model Year:</Text>
              <Text style={s.cardValue}>{vehicle.year}</Text>
            </View>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Color:</Text>
              <Text style={s.cardValue}>{vehicle.color}</Text>
            </View>
            <View style={s.cardRow}>
              <Text style={s.cardLabel}>Quotation Ref:</Text>
              <Text style={s.cardValue}>{quotation.id}</Text>
            </View>
          </View>
        </View>

        {/* Section title */}
        <Text style={s.sectionTitle}>Payment Details</Text>

        {/* Payment Summary Box */}
        <View style={s.paymentSummary}>
          <View style={s.paymentSummaryRow}>
            <Text style={{ color: GRAY_TEXT, fontFamily: 'Helvetica-Bold' }}>Current Installment Paid:</Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: NAVY }}>{formatCurrency(payment.amount)}</Text>
          </View>
          {payment.notes && (
            <View style={[s.paymentSummaryRow, { marginTop: 4 }]}>
              <Text style={s.cardLabel}>Notes:</Text>
              <Text style={s.cardValue}>{payment.notes}</Text>
            </View>
          )}

          <View style={[s.paymentSummaryRow, { borderTopWidth: 1, borderTopColor: '#bbf7d0', paddingTop: 8, marginTop: 8 }]}>
            <Text style={s.cardLabel}>Total Vehicle Cost:</Text>
            <Text style={s.cardValue}>{formatCurrency(quotationTotal(quotation))}</Text>
          </View>
          <View style={s.paymentSummaryRow}>
            <Text style={s.cardLabel}>Advance Payment:</Text>
            <Text style={s.cardValue}>{formatCurrency(initialAdvance)}</Text>
          </View>
          <View style={s.paymentSummaryRow}>
            <Text style={s.cardLabel}>Total Installments Paid:</Text>
            <Text style={s.cardValue}>{formatCurrency(totalInstallmentsPaid)}</Text>
          </View>

          <View style={s.paymentSummaryTotal}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: DARK_TEXT }}>Total Paid To Date:</Text>
            <Text style={s.grandAmount}>{formatCurrency(totalPaid)}</Text>
          </View>

          <View style={s.paymentSummaryRow}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: AMBER }}>Remaining Balance:</Text>
            <Text style={s.balanceAmount}>{formatCurrency(invoice.balance)}</Text>
          </View>
        </View>

        {/* Status */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 8, color: GRAY_TEXT, marginBottom: 4 }}>Payment Status:</Text>
          <View style={[s.statusBadge, s[`status${statusStr}` as keyof typeof s] || s.statusPENDING]}>
            <Text>{statusStr}</Text>
          </View>
        </View>

        {/* Signature lines */}
        <View style={s.signatureRow}>
          <View style={s.signatureLine}>
            <Text style={s.signatureText}>Prepared By</Text>
          </View>
          <View style={s.signatureLine}>
            <Text style={s.signatureText}>Customer Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Thank you for your business!</Text>
          <Text style={[s.footerText, { marginTop: 2 }]}>Automobile Importers • Tel: +94 77 123 4567 • Email: info@automobile.lk</Text>
        </View>
      </Page>
    </Document>
  );
}

interface ViewerProps {
  payment: InvoicePayment;
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
  allPayments: InvoicePayment[];
}

export function ReceiptPDFViewer(props: ViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const doc = <ReceiptDocument {...props} />;
    pdf(doc).toBlob().then((blob) => {
      if (!active) return;
      const url = URL.createObjectURL(blob);
      setPdfUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return url;
      });
      setLoading(false);
    });

    return () => {
      active = false;
      setPdfUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return null;
      });
    };
  }, [props.payment, props.invoice, props.quotation, props.vehicle, props.make, props.allPayments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-slate-50 border rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="text-xs text-slate-500 mt-2 font-medium">Generating receipt preview...</p>
      </div>
    );
  }

  return (
    <iframe 
      src={pdfUrl || ''} 
      style={{ width: '100%', height: '70vh', border: 0 }}
      className="rounded-xl border border-slate-200 shadow-sm"
    />
  );
}

export async function downloadReceiptPDF(props: ViewerProps) {
  const doc = <ReceiptDocument {...props} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_${props.payment.id}_Invoice_${props.invoice.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
