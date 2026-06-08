export interface MakeModel {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  makeModelId: string;
  name: string;
  engineCapacity: string;
  color: string;
  grade: string;
  year: number;
}

export interface Quotation {
  id: string;
  name: string;
  address: string;
  nic: string;
  mobileNo: string;
  email: string;
  makeModelId: string;
  vehicleModelId: string;
  cifValue: number;
  lcAmount: number;
  ttAmount: number;
  taxAmount: number;
  serviceCharge: number;
  clearingCharge: number;
  mileage: number;
  dmiCharge: number;
  createdAt: string;
  status?: string;
}

export type InvoiceStatus = 'pending' | 'paid';

export interface Invoice {
  id: string;
  quotationId: string;
  ttAmount: number;
  advanceAmount: number;
  balance: number;
  status: InvoiceStatus;
  isLcComplete?: boolean;
  isTtComplete?: boolean;
  lcCopyPath?: string | null;
  inspectionCertificatePath?: string | null;
  etdDate?: string | null;
  arrivalDate?: string | null;
  yardPictures?: { id: number; file_path: string }[];
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'New' | 'Contacted' | 'Converted' | 'Closed' | 'Completed';
  created_at: string;
}

export interface Investor {
  id: number;
  name: string;
  phone: string;
  email: string;
  created_at: string;
}

export interface Investment {
  id: number;
  investorId: number;
  investorName: string;
  vehicleId: number;
  vehicleName: string;
  chassisNumber: string;
  investedAmount: number;
  roiPercentage: number;
  profitShareAmount: number | null;
  status: 'Active' | 'Settled';
}

export interface LogisticsItem {
  vehicleId: number;
  chassisNumber: string;
  vehicleStatus: string;
  customerName: string;
  customerPhone: string;
  make: string;
  model: string;
  year: number;
  color: string;
  logisticsId: number | null;
  shippingCompany: string | null;
  vesselName: string | null;
  etd: string | null;
  eta: string | null;
  portOfLoading: string | null;
  portOfDischarge: string | null;
}

export interface Expense {
  id: number;
  vehicle_id: number;
  expense_type: string;
  amount: number;
  description: string;
  date_incurred: string;
  vehicleName?: string;
  chassisNumber?: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'executive' | 'sales' | 'agent';
  createdAt: string;
}

export interface CashbookExpense {
  id: number;
  expenseType: string;
  amount: number;
  description: string;
  dateIncurred: string;
  createdAt?: string;
}
