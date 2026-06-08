import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import MakeModels from '@/pages/MakeModels';
import VehicleModels from '@/pages/VehicleModels';
import Quotations from '@/pages/Quotations';
import Invoices from '@/pages/Invoices';
import ClearingAgents from '@/pages/ClearingAgents';
import Logistics from '@/pages/Logistics';
import Investors from '@/pages/Investors';
import Reports from '@/pages/Reports';
import Leads from '@/pages/Leads';
import Login from '@/pages/Login';
import Users from '@/pages/Users';
import Cashbook from '@/pages/Cashbook';
import { useDataStore } from '@/store';

function PrivateRoute() {
  const currentUser = useDataStore((s) => s.currentUser);
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/admin" element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="make-models" element={<MakeModels />} />
            <Route path="vehicle-models" element={<VehicleModels />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="clearing-agents" element={<ClearingAgents />} />
            <Route path="logistics" element={<Logistics />} />
            <Route path="investors" element={<Investors />} />
            <Route path="reports" element={<Reports />} />
            <Route path="cashbook" element={<Cashbook />} />
            <Route path="leads" element={<Leads />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
