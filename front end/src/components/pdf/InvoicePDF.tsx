import { useState, useEffect } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Svg, Path, Rect, Circle, Line, G, Polygon } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { Invoice, MakeModel, Quotation, VehicleModel } from '@/types';
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
const GREEN = '#047857';
const AMBER = '#92400e';

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
    marginBottom: 16,
    marginTop: 10,
  },
  docTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docTitle: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: GREEN,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
    color: AMBER,
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
    fontSize: 11,
    color: WHITE,
  },
  totalValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: WHITE,
  },
  /* ── Deduction rows ── */
  deductionRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
    backgroundColor: '#f0fdf4',
  },
  deductionLabel: {
    flex: 2,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  deductionValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  /* ── Balance ── */
  balanceRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  balanceLabel: {
    flex: 2,
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: AMBER,
  },
  balanceValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: AMBER,
  },
  balancePaidRow: {
    backgroundColor: '#d1fae5',
    borderColor: '#34d399',
  },
  balancePaidText: {
    color: GREEN,
  },
  /* ── Payment status ── */
  milestoneBox: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  milestoneItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 3,
    borderWidth: 1,
  },
  milestoneComplete: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  milestonePending: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  milestoneLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  milestoneStatus: {
    fontSize: 8,
    marginTop: 1,
  },
  /* ── Logistics Schedule ── */
  logisticsBox: {
    marginTop: 10,
    padding: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    backgroundColor: '#f8fafc',
  },
  logisticsTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 2,
  },
  logisticsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  logisticsItem: {
    flex: 1,
  },
  logisticsLabel: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginBottom: 2,
  },
  logisticsValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: RED,
  },
  /* ── Signature area ── */
  sigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  sigBlock: {
    alignItems: 'center',
    width: 180,
  },
  sigLine: {
    width: 150,
    height: 1,
    backgroundColor: DARK_TEXT,
    marginTop: 35,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 9,
    color: GRAY_TEXT,
  },
  /* ── Footer ── */
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
  attachmentPage: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  attachmentTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_GRAY,
    paddingBottom: 4,
  },
  attachmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_BLUE,
    padding: 10,
  },
  attachmentImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
  pdfPlaceholderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: BORDER_GRAY,
    borderRadius: 4,
    width: '80%',
  },
  pdfPlaceholderText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginBottom: 8,
  },
  pdfPlaceholderLink: {
    fontSize: 9,
    color: BLUE,
  },
  yardGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  yardPhotoBox: {
    width: '47%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER_GRAY,
    padding: 4,
    borderRadius: 3,
  },
  yardPhotoImg: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
  },
  yardPhotoLabel: {
    fontSize: 8,
    color: GRAY_TEXT,
    marginTop: 3,
    textAlign: 'center',
  },
});

interface Props {
  invoice: Invoice;
  quotation: Quotation;
  vehicle: VehicleModel;
  make: MakeModel;
  includeAttachments?: boolean;
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

function CheckMark({ complete }: { complete: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill={complete ? '#34d399' : '#fdba74'} />
      {complete ? (
        <Path d="M8 12l3 3 5-6" fill="none" stroke={WHITE} strokeWidth={2.5} />
      ) : (
        <Path d="M12 7v6M12 15v1" fill="none" stroke={WHITE} strokeWidth={2} />
      )}
    </Svg>
  );
}

const isImage = (path?: string | null) => {
  if (!path) return false;
  const ext = path.substring(path.lastIndexOf('.') + 1).toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
};

export function InvoiceDoc({ invoice, quotation, vehicle, make, includeAttachments = true }: Props) {
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
          <View style={s.docTitleLeft}>
            <Text style={s.docTitle}>INVOICE</Text>
            <Text style={[s.statusBadge, isPaid ? s.statusPaid : s.statusPending]}>
              {isPaid ? '● PAID' : '● PENDING'}
            </Text>
          </View>
          <View style={s.docMetaBlock}>
            <Text style={s.docMeta}>Invoice No:</Text>
            <Text style={s.docMetaValue}>{invoice.id}</Text>
            <Text style={s.docMeta}>Ref Quotation:</Text>
            <Text style={s.docMetaValue}>{quotation.id}</Text>
            <Text style={s.docMeta}>Date:</Text>
            <Text style={s.docMetaValue}>{formatDate(invoice.createdAt)}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── Bill To ── */}
        <Text style={s.sectionTitle}>Bill To</Text>
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

        {/* ── Vehicle ── */}
        <Text style={s.sectionTitle}>Vehicle Information</Text>
        <View style={s.col}>
          <View style={s.row}>
            <Text style={s.label}>Vehicle:</Text>
            <Text style={s.value}>{make.name} {vehicle.name} — {vehicle.engineCapacity}, {vehicle.color}, {vehicle.grade}, {String(vehicle.year)}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>Mileage:</Text>
            <Text style={s.value}>{vehicle.mileage.toLocaleString()} km</Text>
          </View>
        </View>

        {/* ── Itemized Costs ── */}
        <Text style={s.sectionTitle}>Itemized Costs</Text>
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
          {/* Advance Paid */}
          <View style={s.tRow}>
            <Text style={s.tCellLabel}>Advance Paid</Text>
            <Text style={s.tCellValue}>- {formatCurrency(invoice.advanceAmount)}</Text>
          </View>
          {/* LC Deduction */}
          {invoice.isLcComplete && (
            <View style={s.deductionRow}>
              <Text style={s.deductionLabel}>✓ LC Payment Completed (Deducted)</Text>
              <Text style={s.deductionValue}>- {formatCurrency(vehicle.lcAmount)}</Text>
            </View>
          )}
          {/* TT Deduction */}
          {invoice.isTtComplete && (
            <View style={s.deductionRow}>
              <Text style={s.deductionLabel}>✓ TT Payment Completed (Deducted)</Text>
              <Text style={s.deductionValue}>- {formatCurrency(vehicle.ttAmount)}</Text>
            </View>
          )}
        </View>

        {/* ── Balance Due ── */}
        <View style={[s.balanceRow, isPaid ? s.balancePaidRow : {}]}>
          <Text style={[s.balanceLabel, isPaid ? s.balancePaidText : {}]}>
            {isPaid ? 'FULLY PAID' : 'BALANCE DUE'}
          </Text>
          <Text style={[s.balanceValue, isPaid ? s.balancePaidText : {}]}>
            {formatCurrency(invoice.balance)}
          </Text>
        </View>

        {/* ── Logistics Schedule (if dates are added) ── */}
        {(invoice.etdDate || invoice.arrivalDate) && (
          <View style={s.logisticsBox}>
            <Text style={s.logisticsTitle}>Logistics Information</Text>
            <View style={s.logisticsRow}>
              {invoice.etdDate && (
                <View style={s.logisticsItem}>
                  <Text style={s.logisticsLabel}>ETD Date (Estimated Departure)</Text>
                  <Text style={s.logisticsValue}>{formatDate(invoice.etdDate)}</Text>
                </View>
              )}
              {invoice.arrivalDate && (
                <View style={s.logisticsItem}>
                  <Text style={s.logisticsLabel}>Arrival Date (Estimated)</Text>
                  <Text style={s.logisticsValue}>{formatDate(invoice.arrivalDate)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Payment Milestones ── */}
        <View style={s.milestoneBox}>
          <View style={[s.milestoneItem, invoice.isLcComplete ? s.milestoneComplete : s.milestonePending]}>
            <CheckMark complete={!!invoice.isLcComplete} />
            <View>
              <Text style={[s.milestoneLabel, { color: invoice.isLcComplete ? GREEN : AMBER }]}>LC Payment</Text>
              <Text style={[s.milestoneStatus, { color: invoice.isLcComplete ? GREEN : AMBER }]}>
                {invoice.isLcComplete ? 'Completed' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={[s.milestoneItem, invoice.isTtComplete ? s.milestoneComplete : s.milestonePending]}>
            <CheckMark complete={!!invoice.isTtComplete} />
            <View>
              <Text style={[s.milestoneLabel, { color: invoice.isTtComplete ? GREEN : AMBER }]}>TT Payment</Text>
              <Text style={[s.milestoneStatus, { color: invoice.isTtComplete ? GREEN : AMBER }]}>
                {invoice.isTtComplete ? 'Completed' : 'Pending'}
              </Text>
            </View>
          </View>
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

      {/* ── Page 2: LC Copy (if attached and is image) ── */}
      {includeAttachments && invoice.lcCopyPath && isImage(invoice.lcCopyPath) && (
        <Page size="A4" style={s.attachmentPage}>
          <Text style={s.attachmentTitle}>ATTACHMENT: LC COPY</Text>
          <View style={s.attachmentContainer}>
            <Image src={`http://localhost/Automobile/backend/api/image.php?path=${encodeURIComponent(invoice.lcCopyPath)}`} style={s.attachmentImage} />
          </View>
        </Page>
      )}

      {/* ── Page 3: Inspection Certificate (if attached and is image) ── */}
      {includeAttachments && invoice.inspectionCertificatePath && isImage(invoice.inspectionCertificatePath) && (
        <Page size="A4" style={s.attachmentPage}>
          <Text style={s.attachmentTitle}>ATTACHMENT: INSPECTION CERTIFICATE</Text>
          <View style={s.attachmentContainer}>
            <Image src={`http://localhost/Automobile/backend/api/image.php?path=${encodeURIComponent(invoice.inspectionCertificatePath)}`} style={s.attachmentImage} />
          </View>
        </Page>
      )}

      {/* ── Page 4: Yard Pictures (if attached) ── */}
      {includeAttachments && invoice.yardPictures && invoice.yardPictures.length > 0 && (
        <Page size="A4" style={s.attachmentPage}>
          <Text style={s.attachmentTitle}>ATTACHMENT: YARD PICTURES</Text>
          <View style={s.yardGridContainer}>
            {invoice.yardPictures.map((pic, idx) => (
              <View key={pic.id} style={s.yardPhotoBox}>
                <Image src={`http://localhost/Automobile/backend/api/image.php?path=${encodeURIComponent(pic.file_path)}`} style={s.yardPhotoImg} />
                <Text style={s.yardPhotoLabel}>Yard Photo {idx + 1}</Text>
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  );
}

export async function getMergedPDFBlob(props: Props): Promise<Blob> {
  const includeAttachments = props.includeAttachments ?? true;

  // 1. Generate the base PDF document containing the invoice and image attachments
  const baseBlob = await pdf(<InvoiceDoc {...props} />).toBlob();
  
  if (!includeAttachments) {
    return baseBlob;
  }

  // 2. Collect PDF attachment URLs to merge
  const pdfUrlsToMerge: string[] = [];
  if (props.invoice.lcCopyPath && !isImage(props.invoice.lcCopyPath)) {
    pdfUrlsToMerge.push(`http://localhost/Automobile/backend/api/image.php?path=${encodeURIComponent(props.invoice.lcCopyPath)}`);
  }
  if (props.invoice.inspectionCertificatePath && !isImage(props.invoice.inspectionCertificatePath)) {
    pdfUrlsToMerge.push(`http://localhost/Automobile/backend/api/image.php?path=${encodeURIComponent(props.invoice.inspectionCertificatePath)}`);
  }

  if (pdfUrlsToMerge.length === 0) {
    return baseBlob;
  }

  try {
    const mergedPdf = await PDFDocument.create();
    const basePdfBytes = await baseBlob.arrayBuffer();
    const basePdfDoc = await PDFDocument.load(basePdfBytes);
    const basePages = await mergedPdf.copyPages(basePdfDoc, basePdfDoc.getPageIndices());
    basePages.forEach((page) => mergedPdf.addPage(page));

    // Fetch and append PDF attachment pages
    for (const url of pdfUrlsToMerge) {
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const arrayBuffer = await resp.arrayBuffer();
      const attachmentPdfDoc = await PDFDocument.load(arrayBuffer);
      const attachmentPages = await mergedPdf.copyPages(attachmentPdfDoc, attachmentPdfDoc.getPageIndices());
      attachmentPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedBytes = await mergedPdf.save();
    return new Blob([mergedBytes as any], { type: 'application/pdf' });
  } catch (err) {
    console.error('Error merging PDF attachments:', err);
    return baseBlob;
  }
}

export function InvoicePDFViewer(props: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getMergedPDFBlob(props).then((blob) => {
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
  }, [props.invoice, props.quotation, props.vehicle, props.make, props.includeAttachments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-slate-50 border rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        <p className="text-xs text-slate-500 mt-2 font-medium">Generating document preview...</p>
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

export async function downloadInvoicePDF(props: Props) {
  const blob = await getMergedPDFBlob(props);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = props.includeAttachments ? `Invoice_${props.invoice.id}_Combined.pdf` : `Invoice_${props.invoice.id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
