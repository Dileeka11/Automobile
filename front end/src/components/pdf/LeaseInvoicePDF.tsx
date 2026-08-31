import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Svg, Polygon, Rect } from '@react-pdf/renderer';
import { FooterStripes, ContactIcon } from './InvoicePDF';

/* ─── Brand colors matching the printed lease invoice ─── */
const NAVY = '#1a3a6e';
const BLUE = '#2f5fbf';
const LIGHT_BLUE = '#9fb8dd';
const RED = '#c1272d';
const DARK_TEXT = '#111111';
const GRAY_TEXT = '#5a6577';
const LINE = '#000000';

const LOGO_URL = '/logo.png';

export interface LeaseInvoiceData {
  date: string; // ISO yyyy-mm-dd
  invoiceNo: string;
  customerName: string;
  address: string;
  telNo: string;
  bankName: string;
  bankBranch: string;
  forSale: string;
  make: string;
  model: string;
  yom: string;
  engineCapacity: string;
  chassisNumber: string;
  engineNumber: string;
  advance: number;
  leaseAmount: number;
  balance: number;
  totalCost: number;
  directorName: string;
}

const s = StyleSheet.create({
  page: {
    position: 'relative',
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: DARK_TEXT,
    paddingTop: 150,
    paddingBottom: 40,
    paddingHorizontal: 55,
  },
  logoImage: {
    position: 'absolute',
    top: 26,
    left: 45,
    width: 105,
    height: 92,
    objectFit: 'contain',
  },
  docTitle: {
    position: 'absolute',
    top: 55,
    left: 290,
    fontSize: 22,
    fontFamily: 'Times-Bold',
    color: DARK_TEXT,
    letterSpacing: 1.5,
  },
  /* ── Header field lines ── */
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 11,
  },
  fieldLabel: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
  },
  fieldValue: {
    fontFamily: 'Times-Roman',
    fontSize: 10.5,
    flex: 1,
  },
  /* ── Table ── */
  table: {
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 0.8,
    borderColor: LINE,
  },
  tHeadRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: LINE,
  },
  tRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: LINE,
  },
  totalRow: {
    flexDirection: 'row',
    borderTopWidth: 0.8,
    borderTopColor: LINE,
  },
  cellLabel: {
    width: '57%',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    borderRightWidth: 0.8,
    borderRightColor: LINE,
    fontSize: 10,
  },
  cellValue: {
    width: '43%',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    fontSize: 10,
    textAlign: 'right',
  },
  headCell: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    textAlign: 'center',
  },
  boldCell: {
    fontFamily: 'Times-Bold',
  },
  /* ── Remarks ── */
  remarksTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
    marginTop: 2,
  },
  remarksText: {
    fontSize: 10,
    lineHeight: 1.45,
    textAlign: 'justify',
    marginTop: 8,
  },
  /* ── Signature ── */
  sigArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  sigLeft: {
    width: '52%',
  },
  sigRight: {
    width: '44%',
    alignItems: 'center',
  },
  companyBlue: {
    fontFamily: 'Times-Bold',
    fontSize: 10.5,
    color: BLUE,
  },
  companySub: {
    fontFamily: 'Times-Bold',
    fontSize: 9,
    color: BLUE,
    marginTop: 1,
  },
  dottedLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: DARK_TEXT,
    borderBottomStyle: 'dotted',
    width: 165,
    marginTop: 26,
  },
  directorTag: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginTop: 1.5,
    marginLeft: 95,
  },
  sigName: {
    fontSize: 10.5,
    marginTop: 5,
  },
  sigRole: {
    fontSize: 10.5,
    marginTop: 14,
  },
  footerRow: {
    position: 'absolute',
    bottom: 5,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  footerBold: {
    fontSize: 6.5,
    fontFamily: 'Times-Bold',
    color: DARK_TEXT,
  },
  footerText: {
    fontSize: 6.5,
    color: GRAY_TEXT,
  },
});

/* ── Decorative header ribbon matching the letterhead ── */
function LeaseHeaderRibbon() {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0 }}>
      <Svg width={595} height={130} viewBox="0 0 595 130">
        <Polygon points="170,0 345,0 313,26 138,26" fill={LIGHT_BLUE} />
        <Polygon points="350,0 472,0 440,26 318,26" fill={RED} />
        <Polygon points="477,0 595,0 595,26 445,26" fill={BLUE} />
        <Rect x={40} y={118} width={515} height={2} fill={NAVY} />
        <Rect x={40} y={122} width={515} height={0.7} fill={BLUE} />
      </Svg>
    </View>
  );
}

const money = (v: number) =>
  `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number.isFinite(v) ? v : 0,
  )} LKR`;

const dmy = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const REMARKS =
  'The above-mentioned total landed cost is subject to change due to fluctuations in exchange rates, ' +
  'revisions in applicable customs duty rates, demurrage charges, or any other unforeseen expenses incurred ' +
  'during clearance and delivery. Final invoicing will reflect such adjustments, if applicable. ' +
  'This invoice issued up on importer request.';

export function LeaseInvoiceDoc({ data }: { data: LeaseInvoiceData }) {
  const rows: [string, string][] = [
    ['MAKE', data.make],
    ['MODEL', data.model],
    ['YOM', data.yom],
    ['ENGINE CAPACITY', data.engineCapacity],
    ['CHASSIS NUMBER', data.chassisNumber],
    ['ENGINE NUMBER', data.engineNumber],
    ['ADVANCE', money(data.advance)],
    ['LEASE AMOUNT', money(data.leaseAmount)],
    ['BALANCE', money(data.balance)],
  ];

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <LeaseHeaderRibbon />
        <Image src={LOGO_URL} style={s.logoImage} />
        <Text style={s.docTitle}>INVOICE</Text>

        {/* ── Header details ── */}
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>DATE: </Text>
          <Text style={s.fieldValue}>{dmy(data.date)}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>INVOICE NO: </Text>
          <Text style={s.fieldValue}>{data.invoiceNo}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>NAME: </Text>
          <Text style={s.fieldValue}>{data.customerName}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>ADDRESS: </Text>
          <Text style={s.fieldValue}>{data.address}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>TEL. NO: </Text>
          <Text style={s.fieldValue}>{data.telNo}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>To: </Text>
          <Text style={s.fieldValue}>{[data.bankName, data.bankBranch].filter(Boolean).join(', ')}</Text>
        </View>
        <View style={s.fieldRow}>
          <Text style={s.fieldLabel}>FOR SALE: </Text>
          <Text style={s.fieldValue}>{data.forSale}</Text>
        </View>

        {/* ── Vehicle / value table ── */}
        <View style={s.table}>
          <View style={s.tHeadRow}>
            <Text style={[s.cellLabel, s.headCell]}>DESCRIPTION</Text>
            <Text style={[s.cellValue, s.headCell]}>VALUE</Text>
          </View>
          {rows.map(([label, value]) => (
            <View key={label} style={s.tRow}>
              <Text style={s.cellLabel}>{label}</Text>
              <Text style={s.cellValue}>{value}</Text>
            </View>
          ))}
          {/* blank filler rows, as on the printed form */}
          {[0, 1, 2].map((i) => (
            <View key={`blank-${i}`} style={s.tRow}>
              <Text style={s.cellLabel}> </Text>
              <Text style={s.cellValue}> </Text>
            </View>
          ))}
          <View style={s.totalRow}>
            <Text style={[s.cellLabel, s.boldCell]}>TOTAL COST</Text>
            <Text style={[s.cellValue, s.boldCell]}>{money(data.totalCost)}</Text>
          </View>
        </View>

        {/* ── Remarks ── */}
        <Text style={s.remarksTitle}>**Remarks:</Text>
        <Text style={s.remarksText}>{REMARKS}</Text>

        {/* ── Signatures ── */}
        <View style={s.sigArea}>
          <View style={s.sigLeft}>
            <Text style={s.companyBlue}>D &amp; N AUTOMART (PVT) LTD</Text>
            <Text style={s.companySub}>PV 00332056</Text>
            <View style={s.dottedLine} />
            <Text style={s.directorTag}>Director</Text>
            <Text style={s.sigName}>{data.directorName}</Text>
            <Text style={s.sigRole}>DIRECTOR OF D AND N AUTOMART (PVT) LTD</Text>
          </View>
          <View style={s.sigRight}>
            <Text style={s.companyBlue}>D &amp; N AUTOMART (PVT) LTD</Text>
            <Text style={s.companySub}>PV 00332056</Text>
            <Text style={s.companySub}>A162/19, Nilminiuyana, Madola, Avissawella</Text>
            <Text style={s.companySub}>0775146380 | 0773446380</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <FooterStripes />
        <View style={s.footerRow}>
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

export async function getLeaseInvoiceBlob(data: LeaseInvoiceData): Promise<Blob> {
  return pdf(<LeaseInvoiceDoc data={data} />).toBlob();
}

export function LeaseInvoicePDFViewer({ data }: { data: LeaseInvoiceData }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getLeaseInvoiceBlob(data).then((blob) => {
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
    };
  }, [data]);

  useEffect(
    () => () => {
      setPdfUrl((oldUrl) => {
        if (oldUrl) URL.revokeObjectURL(oldUrl);
        return null;
      });
    },
    [],
  );

  if (loading && !pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-slate-50 border rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="text-xs text-slate-500 mt-2 font-medium">Generating lease invoice preview...</p>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl || ''}
      style={{ width: '100%', height: '82vh', border: 0 }}
      className="rounded-xl border border-slate-200 shadow-sm"
    />
  );
}

export async function downloadLeaseInvoicePDF(data: LeaseInvoiceData) {
  const blob = await getLeaseInvoiceBlob(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lease_Invoice_${data.invoiceNo || 'draft'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
