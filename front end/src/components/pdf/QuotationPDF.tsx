import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Image, Svg, Path, Rect, Circle, Line, G, Polygon } from '@react-pdf/renderer';
import { MakeModel, Quotation, VehicleModel } from '@/types';
import { formatCurrency, formatDate, vehicleTotal } from '@/utils';

/* ─── Brand colors matching letterhead ─── */
const NAVY = '#1a3a6e';
const BLUE = '#2956a8';
const RED = '#e63030';
const LIGHT_BLUE = '#e8eef7';
const WHITE = '#ffffff';
const DARK_TEXT = '#1a1a2e';
const GRAY_TEXT = '#5a6577';
const BORDER_GRAY = '#d0d7e2';

const LOGO_URL = '/logo.png';

const s = StyleSheet.create({
  page: {
    position: 'relative',
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: DARK_TEXT,
    paddingTop: 100,
    paddingBottom: 100,
    paddingHorizontal: 40,
  },
  /* ── Header area ── */
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 12,
  },
  logoImage: {
    width: 75,
    height: 80,
    objectFit: 'contain',
  },
  /* ── Document title ── */
  docTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    marginTop: 10,
  },
  docTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 2,
  },
  docMetaBlock: {
    alignItems: 'flex-end',
  },
  docMeta: {
    fontSize: 9,
    color: GRAY_TEXT,
    marginBottom: 2,
  },
  docMetaValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
    marginBottom: 4,
  },
  /* ── Divider ── */
  divider: {
    height: 2,
    backgroundColor: NAVY,
    marginBottom: 16,
  },
  dividerThin: {
    height: 1,
    backgroundColor: BORDER_GRAY,
    marginVertical: 10,
  },
  /* ── Section ── */
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 8,
    marginTop: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  /* ── Two-column info ── */
  twoCol: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  col: {
    flex: 1,
    padding: 8,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 80,
    color: GRAY_TEXT,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: DARK_TEXT,
  },
  /* ── Cost table ── */
  table: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 3,
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tHeadCell: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
  },
  tRowAlt: {
    backgroundColor: '#f5f8fc',
  },
  tCellLabel: {
    flex: 2,
    fontSize: 9,
  },
  tCellValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: NAVY,
  },
  totalLabel: {
    flex: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: WHITE,
  },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: WHITE,
  },
  /* ── Validity note ── */
  noteBox: {
    marginTop: 16,
    padding: 10,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  noteText: {
    fontSize: 9,
    color: GRAY_TEXT,
    fontStyle: 'italic',
  },
  /* ── Signature area ── */
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  sigBlock: {
    alignItems: 'center',
    width: 180,
  },
  sigLine: {
    width: 150,
    height: 1,
    backgroundColor: DARK_TEXT,
    marginTop: 40,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 9,
    color: GRAY_TEXT,
  },
  /* ── Footer ── */
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 55,
  },
  footerContent: {
    position: 'absolute',
    bottom: 8,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    fontSize: 8,
    color: GRAY_TEXT,
  },
  footerBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
  },
  watermark: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    alignItems: 'center',
    opacity: 0.06,
  },
  watermarkImage: {
    width: 280,
    height: 300,
    objectFit: 'contain',
  },
});

interface Props {
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
}

/* ── Shared SVG components ── */
function HeaderCornerStripes() {
  return (
    <View style={{ position: 'absolute', top: 0, right: 0 }}>
      <Svg width={120} height={90} viewBox="0 0 120 90">
        <Polygon points="30,0 120,0 120,90" fill={BLUE} opacity={0.85} />
        <Polygon points="0,0 120,0 120,70" fill={NAVY} opacity={0.15} />
        <Line x1={15} y1={0} x2={120} y2={75} stroke={RED} strokeWidth={4} />
      </Svg>
    </View>
  );
}


function FooterStripes() {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      <Svg width={595} height={55} viewBox="0 0 595 55">
        <Rect x={0} y={0} width={595} height={3} fill={RED} />
        <Rect x={0} y={5} width={595} height={50} fill={WHITE} />
        <Rect x={0} y={5} width={200} height={2} fill={BLUE} />
        <Rect x={395} y={5} width={200} height={2} fill={BLUE} />
      </Svg>
    </View>
  );
}

function ContactIcon({ type }: { type: 'phone' | 'email' | 'location' }) {
  const size = 14;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {type === 'phone' && (
        <G>
          <Circle cx={12} cy={12} r={11} fill={NAVY} />
          <Path d="M8 7c0-.5.4-1 .9-1h1.2c.4 0 .8.3.9.7l.5 1.5c.1.3 0 .7-.3.9l-.8.5c.4 1 1.2 1.8 2.2 2.2l.5-.8c.2-.3.6-.4.9-.3l1.5.5c.4.1.7.5.7.9v1.2c0 .5-.5.9-1 .9C11.5 14 10 12.5 8 7z" fill={WHITE} />
        </G>
      )}
      {type === 'email' && (
        <G>
          <Circle cx={12} cy={12} r={11} fill={NAVY} />
          <Path d="M6 8h12c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1V9c0-.6.4-1 1-1z" fill="none" stroke={WHITE} strokeWidth={1} />
          <Path d="M5.5 8.5l6.5 4 6.5-4" fill="none" stroke={WHITE} strokeWidth={1} />
        </G>
      )}
      {type === 'location' && (
        <G>
          <Circle cx={12} cy={12} r={11} fill={RED} />
          <Path d="M12 5c-2.8 0-5 2.2-5 5 0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" fill="none" stroke={WHITE} strokeWidth={1} />
          <Circle cx={12} cy={10} r={2} fill="none" stroke={WHITE} strokeWidth={1} />
        </G>
      )}
    </Svg>
  );
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
      <Page size="A4" style={s.page}>
        {/* ── Watermark ── */}
        <View style={s.watermark}>
          <Image src={LOGO_URL} style={s.watermarkImage} />
        </View>

        {/* ── Header background elements ── */}
        <HeaderCornerStripes />

        <View style={s.headerBar}>
          <Image src={LOGO_URL} style={s.logoImage} />
        </View>

        {/* ── Title row ── */}
        <View style={s.docTitleRow}>
          <Text style={s.docTitle}>QUOTATION</Text>
          <View style={s.docMetaBlock}>
            <Text style={s.docMeta}>Quotation No:</Text>
            <Text style={s.docMetaValue}>{quotation.id}</Text>
            <Text style={s.docMeta}>Date:</Text>
            <Text style={s.docMetaValue}>{formatDate(quotation.createdAt)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Customer Details ── */}
        <Text style={s.sectionTitle}>Customer Details</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={s.row}><Text style={s.label}>Name:</Text><Text style={s.value}>{quotation.name}</Text></View>
            <View style={s.row}><Text style={s.label}>NIC:</Text><Text style={s.value}>{quotation.nic}</Text></View>
            <View style={s.row}><Text style={s.label}>Mobile:</Text><Text style={s.value}>{quotation.mobileNo}</Text></View>
          </View>
          <View style={s.col}>
            <View style={s.row}><Text style={s.label}>Email:</Text><Text style={s.value}>{quotation.email}</Text></View>
            <View style={s.row}><Text style={s.label}>Address:</Text><Text style={s.value}>{quotation.address}</Text></View>
          </View>
        </View>

        {/* ── Vehicle Details ── */}
        <Text style={s.sectionTitle}>Vehicle Details</Text>
        <View style={s.twoCol}>
          <View style={s.col}>
            <View style={s.row}><Text style={s.label}>Make:</Text><Text style={s.value}>{make.name}</Text></View>
            <View style={s.row}><Text style={s.label}>Model:</Text><Text style={s.value}>{vehicle.name}</Text></View>
            <View style={s.row}><Text style={s.label}>Engine:</Text><Text style={s.value}>{vehicle.engineCapacity}</Text></View>
            <View style={s.row}><Text style={s.label}>Color:</Text><Text style={s.value}>{vehicle.color}</Text></View>
          </View>
          <View style={s.col}>
            <View style={s.row}><Text style={s.label}>Grade:</Text><Text style={s.value}>{vehicle.grade}</Text></View>
            <View style={s.row}><Text style={s.label}>Year:</Text><Text style={s.value}>{String(vehicle.year)}</Text></View>
            <View style={s.row}><Text style={s.label}>Mileage:</Text><Text style={s.value}>{vehicle.mileage.toLocaleString()} km</Text></View>
          </View>
        </View>

        {/* ── Cost Breakdown ── */}
        <Text style={s.sectionTitle}>Cost Breakdown</Text>
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.tHeadCell, s.tCellLabel]}>Description</Text>
            <Text style={[s.tHeadCell, s.tCellValue]}>Amount (LKR)</Text>
          </View>
          {rows.map(([label, value], idx) => (
            <View key={label} style={[s.tRow, idx % 2 === 1 ? s.tRowAlt : {}]}>
              <Text style={s.tCellLabel}>{label}</Text>
              <Text style={s.tCellValue}>{formatCurrency(value)}</Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TOTAL</Text>
            <Text style={s.totalValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* ── Validity Note ── */}
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            This quotation is valid for 14 days from the date of issue. Prices may be subject to change based on exchange rate fluctuations. Terms and conditions apply.
          </Text>
        </View>

        {/* ── Signature ── */}
        <View style={s.sigRow}>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Customer Signature</Text>
          </View>
          <View style={s.sigBlock}>
            <View style={s.sigLine} />
            <Text style={s.sigLabel}>Authorized Signature</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <FooterStripes />
        <View style={s.footerContent}>
          <View style={s.footerItem}>
            <ContactIcon type="phone" />
            <Text style={s.footerBold}>+94 77 344 6380</Text>
          </View>
          <View style={s.footerItem}>
            <ContactIcon type="email" />
            <Text style={s.footerBold}>dandn.automart@gmail.com</Text>
          </View>
          <View style={s.footerItem}>
            <ContactIcon type="location" />
            <View>
              <Text style={s.footerText}>A162/19, Nilminiuyana, Madola,</Text>
              <Text style={s.footerText}>Avissawella</Text>
            </View>
          </View>
        </View>
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
