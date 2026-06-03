import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice, MakeModel, Quotation, ToastMessage, VehicleModel } from '@/types';
import { generateId, vehicleTotal } from '@/utils';

// ---------------- Seed Data ----------------
const seedMakeModels: MakeModel[] = [
  { id: 'MK1', name: 'Toyota' },
  { id: 'MK2', name: 'Honda' },
  { id: 'MK3', name: 'Nissan' },
  { id: 'MK4', name: 'Suzuki' },
  { id: 'MK5', name: 'BMW' },
];

const seedVehicleModels: VehicleModel[] = [
  { id: 'VM1', makeModelId: 'MK1', name: 'Aqua', engineCapacity: '1500cc', color: 'White', grade: 'S', year: 2019, mileage: 45000, cifValue: 2800000, lcAmount: 50000, ttAmount: 150000, taxAmount: 1200000, serviceCharge: 35000, clearingCharge: 45000, dmiCharge: 20000 },
  { id: 'VM2', makeModelId: 'MK1', name: 'Premio', engineCapacity: '1800cc', color: 'Pearl', grade: 'F', year: 2018, mileage: 60000, cifValue: 4500000, lcAmount: 80000, ttAmount: 250000, taxAmount: 2100000, serviceCharge: 50000, clearingCharge: 60000, dmiCharge: 25000 },
  { id: 'VM3', makeModelId: 'MK2', name: 'Vezel', engineCapacity: '1500cc', color: 'Black', grade: 'Z', year: 2020, mileage: 30000, cifValue: 5200000, lcAmount: 90000, ttAmount: 280000, taxAmount: 2400000, serviceCharge: 55000, clearingCharge: 65000, dmiCharge: 30000 },
  { id: 'VM4', makeModelId: 'MK2', name: 'Civic', engineCapacity: '1800cc', color: 'Red', grade: 'EX', year: 2021, mileage: 22000, cifValue: 6800000, lcAmount: 100000, ttAmount: 320000, taxAmount: 3100000, serviceCharge: 60000, clearingCharge: 70000, dmiCharge: 35000 },
  { id: 'VM5', makeModelId: 'MK3', name: 'X-Trail', engineCapacity: '2000cc', color: 'Silver', grade: 'GT', year: 2019, mileage: 55000, cifValue: 7200000, lcAmount: 110000, ttAmount: 350000, taxAmount: 3400000, serviceCharge: 65000, clearingCharge: 75000, dmiCharge: 40000 },
  { id: 'VM6', makeModelId: 'MK4', name: 'Swift', engineCapacity: '1200cc', color: 'Blue', grade: 'RS', year: 2022, mileage: 15000, cifValue: 3200000, lcAmount: 60000, ttAmount: 180000, taxAmount: 1500000, serviceCharge: 40000, clearingCharge: 50000, dmiCharge: 22000 },
  { id: 'VM7', makeModelId: 'MK5', name: 'X1', engineCapacity: '2000cc', color: 'Black', grade: 'M Sport', year: 2020, mileage: 38000, cifValue: 12500000, lcAmount: 180000, ttAmount: 600000, taxAmount: 5800000, serviceCharge: 90000, clearingCharge: 110000, dmiCharge: 60000 },
];

const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
};

const seedQuotations: Quotation[] = [
  { id: 'Q1001', name: 'Kasun Perera', address: 'No.12, Galle Road, Colombo', nic: '199012345678', mobileNo: '0771234567', email: 'kasun@example.com', makeModelId: 'MK1', vehicleModelId: 'VM1', createdAt: monthsAgo(5) },
  { id: 'Q1002', name: 'Nimali Silva', address: '45, Temple Road, Kandy', nic: '198754321987', mobileNo: '0779876543', email: 'nimali@example.com', makeModelId: 'MK2', vehicleModelId: 'VM3', createdAt: monthsAgo(4) },
  { id: 'Q1003', name: 'Ruwan Fernando', address: '78, Beach Road, Negombo', nic: '199234567891', mobileNo: '0712345678', email: 'ruwan@example.com', makeModelId: 'MK3', vehicleModelId: 'VM5', createdAt: monthsAgo(3) },
  { id: 'Q1004', name: 'Dilani Jayasinghe', address: '9, Lake View, Nuwara Eliya', nic: '199512345670', mobileNo: '0701234567', email: 'dilani@example.com', makeModelId: 'MK1', vehicleModelId: 'VM2', createdAt: monthsAgo(2) },
  { id: 'Q1005', name: 'Sahan Wickramasinghe', address: '23, Hill Street, Galle', nic: '198812345671', mobileNo: '0761234567', email: 'sahan@example.com', makeModelId: 'MK4', vehicleModelId: 'VM6', createdAt: monthsAgo(1) },
  { id: 'Q1006', name: 'Tharushi Rajapaksha', address: '56, Main Street, Matara', nic: '199712345672', mobileNo: '0751234567', email: 'tharushi@example.com', makeModelId: 'MK5', vehicleModelId: 'VM7', createdAt: monthsAgo(0) },
];

const seedInvoices: Invoice[] = [
  { id: 'INV2001', quotationId: 'Q1001', ttAmount: 150000, advanceAmount: 2000000, balance: 2300000, status: 'pending', createdAt: monthsAgo(5) },
  { id: 'INV2002', quotationId: 'Q1002', ttAmount: 280000, advanceAmount: 4000000, balance: 6320000, status: 'paid', createdAt: monthsAgo(4) },
  { id: 'INV2003', quotationId: 'Q1003', ttAmount: 350000, advanceAmount: 5000000, balance: 8240000, status: 'pending', createdAt: monthsAgo(3) },
  { id: 'INV2004', quotationId: 'Q1004', ttAmount: 250000, advanceAmount: 3500000, balance: 3540000, status: 'paid', createdAt: monthsAgo(2) },
];

// ---------------- Store ----------------
interface DataState {
  makeModels: MakeModel[];
  vehicleModels: VehicleModel[];
  quotations: Quotation[];
  invoices: Invoice[];

  // MakeModel CRUD
  addMakeModel: (m: Omit<MakeModel, 'id'>) => void;
  updateMakeModel: (id: string, m: Partial<MakeModel>) => void;
  deleteMakeModel: (id: string) => void;

  // VehicleModel CRUD
  addVehicleModel: (v: Omit<VehicleModel, 'id'>) => void;
  updateVehicleModel: (id: string, v: Partial<VehicleModel>) => void;
  deleteVehicleModel: (id: string) => void;

  // Quotation CRUD
  addQuotation: (q: Omit<Quotation, 'id' | 'createdAt'>) => Quotation;
  updateQuotation: (id: string, q: Partial<Quotation>) => void;
  deleteQuotation: (id: string) => void;

  // Invoice CRUD
  addInvoice: (i: Omit<Invoice, 'id' | 'createdAt'>) => Invoice;
  updateInvoice: (id: string, i: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      makeModels: seedMakeModels,
      vehicleModels: seedVehicleModels,
      quotations: seedQuotations,
      invoices: seedInvoices,

      addMakeModel: (m) => set((s) => ({ makeModels: [...s.makeModels, { id: generateId('MK'), ...m }] })),
      updateMakeModel: (id, m) => set((s) => ({ makeModels: s.makeModels.map((x) => x.id === id ? { ...x, ...m } : x) })),
      deleteMakeModel: (id) => set((s) => ({ makeModels: s.makeModels.filter((x) => x.id !== id) })),

      addVehicleModel: (v) => set((s) => ({ vehicleModels: [...s.vehicleModels, { id: generateId('VM'), ...v }] })),
      updateVehicleModel: (id, v) => set((s) => ({ vehicleModels: s.vehicleModels.map((x) => x.id === id ? { ...x, ...v } : x) })),
      deleteVehicleModel: (id) => set((s) => ({ vehicleModels: s.vehicleModels.filter((x) => x.id !== id) })),

      addQuotation: (q) => {
        const newQ: Quotation = { id: generateId('Q'), createdAt: new Date().toISOString(), ...q };
        set((s) => ({ quotations: [newQ, ...s.quotations] }));
        return newQ;
      },
      updateQuotation: (id, q) => set((s) => ({ quotations: s.quotations.map((x) => x.id === id ? { ...x, ...q } : x) })),
      deleteQuotation: (id) => set((s) => ({ quotations: s.quotations.filter((x) => x.id !== id) })),

      addInvoice: (i) => {
        const newI: Invoice = { id: generateId('INV'), createdAt: new Date().toISOString(), ...i };
        set((s) => ({ invoices: [newI, ...s.invoices] }));
        return newI;
      },
      updateInvoice: (id, i) => set((s) => ({ invoices: s.invoices.map((x) => x.id === id ? { ...x, ...i } : x) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) })),
    }),
    { name: 'vsm-data-v1' }
  )
);

// helper to compute vehicle total used elsewhere
export { vehicleTotal };

// ---------------- Toast Store ----------------
interface ToastState {
  toasts: ToastMessage[];
  push: (t: Omit<ToastMessage, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = generateId('T');
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push({ type: 'success', message }),
  error: (message: string) => useToastStore.getState().push({ type: 'error', message }),
  info: (message: string) => useToastStore.getState().push({ type: 'info', message }),
};
