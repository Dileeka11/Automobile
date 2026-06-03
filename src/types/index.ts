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
  mileage: number;
  cifValue: number;
  lcAmount: number;
  ttAmount: number;
  taxAmount: number;
  serviceCharge: number;
  clearingCharge: number;
  dmiCharge: number;
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
  createdAt: string;
}

export type InvoiceStatus = 'pending' | 'paid';

export interface Invoice {
  id: string;
  quotationId: string;
  ttAmount: number;
  advanceAmount: number;
  balance: number;
  status: InvoiceStatus;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
