import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf, Image, Svg, Path, Rect, Circle, Line, G, Polygon } from '@react-pdf/renderer';
import { MakeModel, Quotation, VehicleModel } from '@/types';
import { formatCurrency, formatDate, quotationTotal } from '@/utils';

/* ─── Brand colors matching letterhead ─── */
const NAVY = '#1a3a6e';
const BLUE = '#4169E1';
const ACCENT = '#647c98';
const LIGHT_BLUE = '#e8eef7';
const WHITE = '#ffffff';
const DARK_TEXT = '#1a1a2e';
const GRAY_TEXT = '#5a6577';
const BORDER_GRAY = '#d0d7e2';

const LOGO_URL = '/logo.png';

const s = StyleSheet.create({
  page: {
    position: 'relative',
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: DARK_TEXT,
    paddingTop: 65,
    paddingBottom: 50,
    paddingHorizontal: 35,
  },
  /* ── Header area ── */
  headerBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 8,
  },
  logoImage: {
    width: 50,
    height: 55,
    objectFit: 'contain',
  },
  /* ── Document title ── */
  docTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
  },
  docTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 1.5,
  },
  docMetaBlock: {
    alignItems: 'flex-end',
  },
  docMeta: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginBottom: 1,
  },
  docMetaValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK_TEXT,
    marginBottom: 2,
  },
  /* ── Divider ── */
  divider: {
    height: 1.5,
    backgroundColor: NAVY,
    marginBottom: 8,
  },
  dividerThin: {
    height: 1,
    backgroundColor: BORDER_GRAY,
    marginVertical: 6,
  },
  /* ── Section ── */
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    backgroundColor: NAVY,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 4,
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  /* ── Two-column info ── */
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 2,
  },
  col: {
    flex: 1,
    padding: 5,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 2,
  },
  singleCol: {
    padding: 5,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  label: {
    width: 60,
    color: GRAY_TEXT,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    flex: 1,
    fontSize: 8,
    color: DARK_TEXT,
  },
  /* ── Cost table ── */
  table: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    borderRadius: 2,
  },
  tHead: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tHeadCell: {
    color: WHITE,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_GRAY,
  },
  tRowAlt: {
    backgroundColor: '#f5f8fc',
  },
  tCellLabel: {
    flex: 2,
    fontSize: 8,
  },
  tCellValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 8,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: NAVY,
  },
  totalLabel: {
    flex: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: WHITE,
  },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: WHITE,
  },
  /* ── Validity note ── */
  noteBox: {
    marginTop: 8,
    padding: 6,
    backgroundColor: LIGHT_BLUE,
    borderRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
  },
  noteText: {
    fontSize: 8,
    color: GRAY_TEXT,
    fontStyle: 'italic',
  },
  /* ── Signature area ── */
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  sigBlock: {
    alignItems: 'center',
    width: 140,
  },
  sigLine: {
    width: 120,
    height: 0.5,
    backgroundColor: DARK_TEXT,
    marginTop: 25,
    marginBottom: 3,
  },
  sigLabel: {
    fontSize: 7.5,
    color: GRAY_TEXT,
  },
  /* ── Footer ── */
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 45,
  },
  footerContent: {
    position: 'absolute',
    bottom: 6,
    left: 25,
    right: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 7,
    color: GRAY_TEXT,
  },
  footerBold: {
    fontSize: 7,
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
    width: 240,
    height: 260,
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
        <Line x1={15} y1={0} x2={120} y2={75} stroke={ACCENT} strokeWidth={4} />
      </Svg>
    </View>
  );
}


function FooterStripes() {
  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      <Svg width={595} height={55} viewBox="0 0 595 55">
        <Rect x={0} y={0} width={595} height={3} fill={ACCENT} />
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
          <Circle cx={12} cy={12} r={11} fill={ACCENT} />
          <Path d="M12 5c-2.8 0-5 2.2-5 5 0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" fill="none" stroke={WHITE} strokeWidth={1} />
          <Circle cx={12} cy={10} r={2} fill="none" stroke={WHITE} strokeWidth={1} />
        </G>
      )}
    </Svg>
  );
}

export function QuotationDoc({ quotation, vehicle, make }: Props) {
  const rows: [string, number][] = [
    ['CIF Value', quotation.cifValue || 0],
    ['LC Amount', quotation.lcAmount || 0],
    ['Other Payment', quotation.ttAmount || 0],
    ['Tax Amount', quotation.taxAmount || 0],
    ['Service Charge', quotation.serviceCharge || 0],
    ['Clearing Charge', quotation.clearingCharge || 0],
    ['DMI Charge', quotation.dmiCharge || 0],
  ];
  const total = quotationTotal(quotation);

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
            <View style={s.row}><Text style={s.label}>Mileage:</Text><Text style={s.value}>{(quotation.mileage || 0).toLocaleString()} km</Text></View>
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
