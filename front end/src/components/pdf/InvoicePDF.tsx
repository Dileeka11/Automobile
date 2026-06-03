import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import { Invoice, MakeModel, Quotation, VehicleModel } from '@/types';
import { formatCurrency, formatDate, vehicleTotal } from '@/utils';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#059669', paddingBottom: 12, marginBottom: 18 },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#059669' },
  companyMeta: { fontSize: 9, color: '#475569', marginTop: 2 },
  docTitleBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold' },
  docMeta: { fontSize: 9, color: '#475569', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, fontSize: 9, marginTop: 4, fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#059669', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
  twoCol: { flexDirection: 'row', gap: 20 },
  col: { flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 4 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 90, color: '#64748b', fontFamily: 'Helvetica-Bold' },
  value: { flex: 1 },
  table: { marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  tHead: { flexDirection: 'row', backgroundColor: '#059669', padding: 8 },
  tHeadCell: { color: '#fff', fontFamily: 'Helvetica-Bold' },
  tRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tCellLabel: { flex: 2 },
  tCellValue: { flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#ecfdf5' },
  totalLabel: { flex: 2, fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#065f46' },
  totalValue: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#065f46' },
  balanceRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fef3c7', borderRadius: 4, marginTop: 8 },
  balanceLabel: { flex: 2, fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#92400e' },
  balanceValue: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 14, color: '#92400e' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 9, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
});

interface Props {
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
}

export function InvoiceDoc({ invoice, quotation, vehicle, make }: Props) {
  const rows: [string, number][] = [
    ['CIF Value', vehicle.cifValue],
    ['LC Amount', vehicle.lcAmount],
    ['TT Amount', invoice.ttAmount],
    ['Tax Amount', vehicle.taxAmount],
    ['Service Charge', vehicle.serviceCharge],
    ['Clearing Charge', vehicle.clearingCharge],
    ['DMI Charge', vehicle.dmiCharge],
  ];
  const total = vehicleTotal(vehicle);
  const isPaid = invoice.status === 'paid';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>D&N Automate</Text>
            <Text style={styles.companyMeta}>No. 100, Galle Road, Colombo 03</Text>
            <Text style={styles.companyMeta}>Tel: +94 11 234 5678 | info@dnautomate.lk</Text>
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>INVOICE</Text>
            <Text style={styles.docMeta}>No: {invoice.id}</Text>
            <Text style={styles.docMeta}>Ref Quotation: {quotation.id}</Text>
            <Text style={styles.docMeta}>Date: {formatDate(invoice.createdAt)}</Text>
            <Text style={[styles.badge, { backgroundColor: isPaid ? '#d1fae5' : '#fef3c7', color: isPaid ? '#065f46' : '#92400e' }]}>
              {isPaid ? 'PAID' : 'PENDING'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bill To</Text>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.row}><Text style={styles.label}>Name:</Text><Text style={styles.value}>{quotation.name}</Text></View>
            <View style={styles.row}><Text style={styles.label}>NIC:</Text><Text style={styles.value}>{quotation.nic}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Mobile:</Text><Text style={styles.value}>{quotation.mobileNo}</Text></View>
          </View>
          <View style={styles.col}>
            <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{quotation.email}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Address:</Text><Text style={styles.value}>{quotation.address}</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Vehicle</Text>
        <View style={styles.col}>
          <View style={styles.row}>
            <Text style={styles.label}>Vehicle:</Text>
            <Text style={styles.value}>{make.name} {vehicle.name} — {vehicle.engineCapacity}, {vehicle.color}, {vehicle.grade}, {vehicle.year}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Itemized Costs</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={[styles.tHeadCell, styles.tCellLabel]}>Description</Text>
            <Text style={[styles.tHeadCell, styles.tCellValue]}>Amount</Text>
          </View>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.tRow}>
              <Text style={styles.tCellLabel}>{label}</Text>
              <Text style={styles.tCellValue}>{formatCurrency(value)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.tRow}>
            <Text style={styles.tCellLabel}>Advance Paid</Text>
            <Text style={styles.tCellValue}>- {formatCurrency(invoice.advanceAmount)}</Text>
          </View>
          {invoice.isLcComplete && (
            <View style={styles.tRow}>
              <Text style={[styles.tCellLabel, { color: '#047857', fontFamily: 'Helvetica-Bold' }]}>LC Payment Completed (Deducted)</Text>
              <Text style={[styles.tCellValue, { color: '#047857', fontFamily: 'Helvetica-Bold' }]}>- {formatCurrency(vehicle.lcAmount)}</Text>
            </View>
          )}
          {invoice.isTtComplete && (
            <View style={styles.tRow}>
              <Text style={[styles.tCellLabel, { color: '#047857', fontFamily: 'Helvetica-Bold' }]}>TT Payment Completed (Deducted)</Text>
              <Text style={[styles.tCellValue, { color: '#047857', fontFamily: 'Helvetica-Bold' }]}>- {formatCurrency(vehicle.ttAmount)}</Text>
            </View>
          )}
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>BALANCE DUE</Text>
          <Text style={styles.balanceValue}>{formatCurrency(invoice.balance)}</Text>
        </View>

        <Text style={styles.footer}>
          Please settle the balance within 7 days. Thank you for your business.
        </Text>
      </Page>
    </Document>
  );
}

export function InvoicePDFViewer(props: Props) {
  return (
    <PDFViewer style={{ width: '100%', height: '70vh', border: 0 }}>
      <InvoiceDoc {...props} />
    </PDFViewer>
  );
}

export async function downloadInvoicePDF(props: Props) {
  const blob = await pdf(<InvoiceDoc {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Invoice_${props.invoice.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
