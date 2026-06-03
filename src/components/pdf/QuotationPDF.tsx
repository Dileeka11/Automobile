import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import { MakeModel, Quotation, VehicleModel } from '@/types';
import { formatCurrency, formatDate, vehicleTotal } from '@/utils';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#4f46e5', paddingBottom: 12, marginBottom: 18 },
  companyBlock: {},
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#4f46e5' },
  companyMeta: { fontSize: 9, color: '#475569', marginTop: 2 },
  docTitleBlock: { alignItems: 'flex-end' },
  docTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  docMeta: { fontSize: 9, color: '#475569', marginTop: 2 },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#4f46e5', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
  twoCol: { flexDirection: 'row', gap: 20 },
  col: { flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 4 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 90, color: '#64748b', fontFamily: 'Helvetica-Bold' },
  value: { flex: 1, color: '#0f172a' },
  table: { marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 4 },
  tHead: { flexDirection: 'row', backgroundColor: '#4f46e5', padding: 8 },
  tHeadCell: { color: '#fff', fontFamily: 'Helvetica-Bold', fontSize: 10 },
  tRow: { flexDirection: 'row', padding: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tCellLabel: { flex: 2 },
  tCellValue: { flex: 1, textAlign: 'right' },
  totalRow: { flexDirection: 'row', padding: 10, backgroundColor: '#eef2ff' },
  totalLabel: { flex: 2, fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#4338ca' },
  totalValue: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 12, color: '#4338ca' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 9, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
});

interface Props {
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
}

export function QuotationDoc({ quotation, vehicle, make }: Props) {
  const rows: [string, number][] = [
    ['CIF Value', vehicle.cifValue],
    ['LC Amount', vehicle.lcAmount],
    ['TT Amount', vehicle.ttAmount],
    ['Tax Amount', vehicle.taxAmount],
    ['Service Charge', vehicle.serviceCharge],
    ['Clearing Charge', vehicle.clearingCharge],
    ['DMI Charge', vehicle.dmiCharge],
  ];
  const total = vehicleTotal(vehicle);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>AutoSales (Pvt) Ltd</Text>
            <Text style={styles.companyMeta}>No. 100, Galle Road, Colombo 03</Text>
            <Text style={styles.companyMeta}>Tel: +94 11 234 5678 | info@autosales.lk</Text>
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>QUOTATION</Text>
            <Text style={styles.docMeta}>No: {quotation.id}</Text>
            <Text style={styles.docMeta}>Date: {formatDate(quotation.createdAt)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customer Details</Text>
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

        <Text style={styles.sectionTitle}>Vehicle Details</Text>
        <View style={styles.twoCol}>
          <View style={styles.col}>
            <View style={styles.row}><Text style={styles.label}>Make:</Text><Text style={styles.value}>{make.name}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Model:</Text><Text style={styles.value}>{vehicle.name}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Engine:</Text><Text style={styles.value}>{vehicle.engineCapacity}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Color:</Text><Text style={styles.value}>{vehicle.color}</Text></View>
          </View>
          <View style={styles.col}>
            <View style={styles.row}><Text style={styles.label}>Grade:</Text><Text style={styles.value}>{vehicle.grade}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Year:</Text><Text style={styles.value}>{vehicle.year}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Mileage:</Text><Text style={styles.value}>{vehicle.mileage.toLocaleString()} km</Text></View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cost Breakdown</Text>
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
        </View>

        <Text style={styles.footer}>
          This quotation is valid for 14 days. Thank you for choosing AutoSales.
        </Text>
      </Page>
    </Document>
  );
}

export function QuotationPDFViewer(props: Props) {
  return (
    <PDFViewer style={{ width: '100%', height: '70vh', border: 0 }}>
      <QuotationDoc {...props} />
    </PDFViewer>
  );
}

export async function downloadQuotationPDF(props: Props) {
  const blob = await pdf(<QuotationDoc {...props} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `Quotation_${props.quotation.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
