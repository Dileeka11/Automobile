import { create } from 'zustand';
import { Invoice, MakeModel, Quotation, ToastMessage, VehicleModel, Lead, Investor, Investment, LogisticsItem, Expense, User } from '@/types';
import { vehicleTotal } from '@/utils';

// Helper for JSON requests
async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
  }
  return res.json();
}

interface DataState {
  makeModels: MakeModel[];
  vehicleModels: VehicleModel[];
  quotations: Quotation[];
  invoices: Invoice[];
  leads: Lead[];
  investors: Investor[];
  investments: Investment[];
  logistics: LogisticsItem[];
  expenses: Expense[];
  reports: any;
  dashboardData: any;
  loading: boolean;

  fetchData: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
  fetchReports: () => Promise<void>;

  // MakeModel CRUD
  addMakeModel: (m: Omit<MakeModel, 'id'>) => Promise<void>;
  updateMakeModel: (id: string, m: Partial<MakeModel>) => Promise<void>;
  deleteMakeModel: (id: string) => Promise<void>;

  // VehicleModel CRUD
  addVehicleModel: (v: Omit<VehicleModel, 'id'>) => Promise<void>;
  updateVehicleModel: (id: string, v: Partial<VehicleModel>) => Promise<void>;
  deleteVehicleModel: (id: string) => Promise<void>;

  // Quotation CRUD
  addQuotation: (q: Omit<Quotation, 'id' | 'createdAt'>) => Promise<Quotation>;
  updateQuotation: (id: string, q: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;

  // Invoice CRUD
  addInvoice: (i: Omit<Invoice, 'id' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, i: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Agreements
  signAgreement: (quotationId: string, signatureBase64: string) => Promise<any>;

  // Leads
  fetchLeads: () => Promise<void>;
  updateLeadStatus: (id: number, status: string) => Promise<void>;
  deleteLead: (id: number) => Promise<void>;

  // Logistics
  fetchLogistics: () => Promise<void>;
  updateLogistics: (item: Partial<LogisticsItem>) => Promise<void>;

  // Registration checklist
  fetchRegistration: (vehicleId: number) => Promise<any>;
  updateRegistration: (regData: any) => Promise<void>;

  // Vault documents
  fetchDocuments: (vehicleId: number) => Promise<any[]>;
  uploadDocument: (vehicleId: number, documentType: string, file: File) => Promise<any>;
  deleteDocument: (id: number) => Promise<void>;

  // Investors
  fetchInvestors: () => Promise<void>;
  addInvestor: (i: { name: string; phone: string; email: string }) => Promise<void>;
  updateInvestor: (id: number, i: Partial<Investor>) => Promise<void>;
  deleteInvestor: (id: number) => Promise<void>;

  // Investments
  fetchInvestments: () => Promise<void>;
  addInvestment: (inv: { investorId: number; vehicleId: number; investedAmount: number; roiPercentage: number }) => Promise<void>;
  settleInvestment: (investmentId: number) => Promise<void>;
  fetchAvailableVehicles: () => Promise<any[]>;

  // Expenses
  fetchExpenses: (vehicleId?: number) => Promise<Expense[]>;
  addExpense: (exp: { vehicleId: number; expenseType: string; amount: number; description: string; dateIncurred: string }) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;

  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUsers: () => Promise<void>;
  addUser: (u: Omit<User, 'id' | 'createdAt'> & { password?: string }) => Promise<void>;
  updateUser: (id: number, u: Partial<User> & { password?: string }) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
}

export const useDataStore = create<DataState>((set) => ({
  makeModels: [],
  vehicleModels: [],
  quotations: [],
  invoices: [],
  leads: [],
  investors: [],
  investments: [],
  logistics: [],
  expenses: [],
  reports: null,
  dashboardData: null,
  loading: false,

  currentUser: localStorage.getItem('dn_user') ? JSON.parse(localStorage.getItem('dn_user')!) : null,
  users: [],

  fetchData: async () => {
    set({ loading: true });
    try {
      const makeModels = await apiFetch('/api/make-models.php');
      const vehicleModels = await apiFetch('/api/vehicle-models.php');
      const quotations = await apiFetch('/api/quotations.php');
      const invoices = await apiFetch('/api/invoices.php');
      set({ makeModels, vehicleModels, quotations, invoices, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  fetchDashboard: async () => {
    try {
      const data = await apiFetch('/api/dashboard.php');
      set({ dashboardData: data });
    } catch (e) {
      console.error(e);
    }
  },

  fetchReports: async () => {
    try {
      const data = await apiFetch('/api/reports.php');
      set({ reports: data });
    } catch (e) {
      console.error(e);
    }
  },

  addMakeModel: async (m) => {
    const newM = await apiFetch('/api/make-models.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m),
    });
    set((s) => ({ makeModels: [...s.makeModels, newM] }));
  },

  updateMakeModel: async (id, m) => {
    const updated = await apiFetch(`/api/make-models.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m),
    });
    set((s) => ({ makeModels: s.makeModels.map((x) => x.id === id ? updated : x) }));
  },

  deleteMakeModel: async (id) => {
    await apiFetch(`/api/make-models.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ makeModels: s.makeModels.filter((x) => x.id !== id) }));
  },

  addVehicleModel: async (v) => {
    const newV = await apiFetch('/api/vehicle-models.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    set((s) => ({ vehicleModels: [...s.vehicleModels, newV] }));
  },

  updateVehicleModel: async (id, v) => {
    const updated = await apiFetch(`/api/vehicle-models.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    set((s) => ({ vehicleModels: s.vehicleModels.map((x) => x.id === id ? updated : x) }));
  },

  deleteVehicleModel: async (id) => {
    await apiFetch(`/api/vehicle-models.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ vehicleModels: s.vehicleModels.filter((x) => x.id !== id) }));
  },

  addQuotation: async (q) => {
    const newQ = await apiFetch('/api/quotations.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    });
    set((s) => ({ quotations: [newQ, ...s.quotations] }));
    return newQ;
  },

  updateQuotation: async (id, q) => {
    const updated = await apiFetch(`/api/quotations.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q),
    });
    set((s) => ({ quotations: s.quotations.map((x) => x.id === id ? { ...x, ...updated } : x) }));
  },

  deleteQuotation: async (id) => {
    await apiFetch(`/api/quotations.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ quotations: s.quotations.filter((x) => x.id !== id) }));
  },

  addInvoice: async (i) => {
    const newI = await apiFetch('/api/invoices.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    });
    set((s) => ({ invoices: [newI, ...s.invoices] }));
    return newI;
  },

  updateInvoice: async (id, i) => {
    const updated = await apiFetch(`/api/invoices.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    });
    set((s) => ({ invoices: s.invoices.map((x) => x.id === id ? updated : x) }));
  },

  deleteInvoice: async (id) => {
    await apiFetch(`/api/invoices.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ invoices: s.invoices.filter((x) => x.id !== id) }));
  },

  signAgreement: async (quotationId, signatureBase64) => {
    return apiFetch('/api/agreements.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quotationId, signatureBase64 }),
    });
  },

  fetchLeads: async () => {
    const leads = await apiFetch('/api/leads.php');
    set({ leads });
  },

  updateLeadStatus: async (id, status) => {
    await apiFetch(`/api/leads.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    set((s) => ({ leads: s.leads.map((x) => x.id === id ? { ...x, status: status as any } : x) }));
  },

  deleteLead: async (id) => {
    await apiFetch(`/api/leads.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ leads: s.leads.filter((x) => x.id !== id) }));
  },

  fetchLogistics: async () => {
    const logistics = await apiFetch('/api/logistics.php');
    set({ logistics });
  },

  updateLogistics: async (item) => {
    await apiFetch('/api/logistics.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    // refresh logistics state
    const logistics = await apiFetch('/api/logistics.php');
    set({ logistics });
  },

  fetchRegistration: async (vehicleId) => {
    return apiFetch(`/api/registration.php?vehicle_id=${vehicleId}`);
  },

  updateRegistration: async (regData) => {
    await apiFetch('/api/registration.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regData),
    });
  },

  fetchDocuments: async (vehicleId) => {
    return apiFetch(`/api/documents.php?vehicle_id=${vehicleId}`);
  },

  uploadDocument: async (vehicleId, documentType, file) => {
    const formData = new FormData();
    formData.append('vehicle_id', String(vehicleId));
    formData.append('document_type', documentType);
    formData.append('file', file);
    return apiFetch('/api/documents.php', {
      method: 'POST',
      body: formData, // Fetch automatically handles content-type for FormData
    });
  },

  deleteDocument: async (id) => {
    await apiFetch(`/api/documents.php?id=${id}`, { method: 'DELETE' });
  },

  fetchInvestors: async () => {
    const investors = await apiFetch('/api/investors.php');
    set({ investors });
  },

  addInvestor: async (i) => {
    const newInv = await apiFetch('/api/investors.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    });
    set((s) => ({ investors: [...s.investors, newInv] }));
  },

  updateInvestor: async (id, i) => {
    const updated = await apiFetch(`/api/investors.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(i),
    });
    set((s) => ({ investors: s.investors.map((x) => x.id === id ? { ...x, ...updated } : x) }));
  },

  deleteInvestor: async (id) => {
    await apiFetch(`/api/investors.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ investors: s.investors.filter((x) => x.id !== id) }));
  },

  fetchInvestments: async () => {
    const investments = await apiFetch('/api/investors.php?action=get_investments');
    set({ investments });
  },

  addInvestment: async (inv) => {
    await apiFetch('/api/investors.php?action=add_investment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv),
    });
    const investments = await apiFetch('/api/investors.php?action=get_investments');
    set({ investments });
  },

  settleInvestment: async (investmentId) => {
    await apiFetch('/api/investors.php?action=settle_investment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investmentId }),
    });
    const investments = await apiFetch('/api/investors.php?action=get_investments');
    set({ investments });
  },

  fetchAvailableVehicles: async () => {
    return apiFetch('/api/investors.php?action=vehicles_available');
  },

  fetchExpenses: async (vehicleId) => {
    const url = vehicleId ? `/api/expenses.php?vehicle_id=${vehicleId}` : '/api/expenses.php';
    const expenses = await apiFetch(url);
    if (!vehicleId) set({ expenses });
    return expenses;
  },

  addExpense: async (exp) => {
    await apiFetch('/api/expenses.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(exp),
    });
    const expenses = await apiFetch('/api/expenses.php');
    set({ expenses });
  },

  deleteExpense: async (id) => {
    await apiFetch(`/api/expenses.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
  },

  login: async (username, password) => {
    const user = await apiFetch('/api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('dn_user', JSON.stringify(user));
    set({ currentUser: user });
  },

  logout: () => {
    localStorage.removeItem('dn_user');
    set({ currentUser: null });
  },

  fetchUsers: async () => {
    const users = await apiFetch('/api/users.php');
    set({ users });
  },

  addUser: async (u) => {
    const newUser = await apiFetch('/api/users.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u),
    });
    set((s) => ({ users: [newUser, ...s.users] }));
  },

  updateUser: async (id, u) => {
    const updated = await apiFetch(`/api/users.php?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(u),
    });
    set((s) => ({ users: s.users.map((x) => x.id === id ? updated : x) }));
  },

  deleteUser: async (id) => {
    await apiFetch(`/api/users.php?id=${id}`, { method: 'DELETE' });
    set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
  },
}));

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
    const id = Math.random().toString(36).substring(2, 9).toUpperCase();
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
