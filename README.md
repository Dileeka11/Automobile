# AutoSales — Vehicle Sales Management System

Modern frontend-only Vehicle Sales Management app built with React 18, TypeScript, Vite, Tailwind CSS, Zustand and `@react-pdf/renderer`. All data is persisted in `localStorage`.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Features

- **Dashboard** — KPI cards (quotations, invoices, revenue, pending), monthly bar chart, sales-by-make pie chart, recent tables.
- **Make Models** — CRUD with inline edit/delete.
- **Vehicle Models** — full CRUD with all cost fields, LKR currency formatting, computed total.
- **Quotations** — customer form with cascading Make → Vehicle dropdowns, list with search, PDF export (styled A4).
- **Invoices** — select quotation (auto-fills customer/vehicle), auto-calculated balance, status badges, PDF export.
- Toasts, confirmation dialogs, responsive layout, glassmorphism cards.
- Mock seed data on first load (cleared by removing the `vsm-data-v1` key in localStorage).

## Tech Stack

React 18 · TypeScript · Vite · Tailwind CSS · React Router v6 · React Hook Form + Zod · Zustand · @react-pdf/renderer · Recharts · Lucide React

## Folder Structure

```
src/
  components/
    layout/   (Sidebar, TopBar, Layout)
    ui/       (Modal, Toast, ConfirmDialog, Badge, EmptyState)
    pdf/      (QuotationPDF, InvoicePDF)
  pages/      (Dashboard, MakeModels, VehicleModels, Quotations, Invoices)
  store/      (Zustand persisted store + toast store)
  types/      (TypeScript domain types)
  utils/      (formatCurrency, generateId, vehicleTotal, ...)
```
