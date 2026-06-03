import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import MakeModels from '@/pages/MakeModels';
import VehicleModels from '@/pages/VehicleModels';
import Quotations from '@/pages/Quotations';
import Invoices from '@/pages/Invoices';
import Logistics from '@/pages/Logistics';
import Investors from '@/pages/Investors';
import Reports from '@/pages/Reports';
import Leads from '@/pages/Leads';
import Login from '@/pages/Login';
import Users from '@/pages/Users';
import { useDataStore } from '@/store';

function PrivateRoute() {
  const currentUser = useDataStore((s) => s.currentUser);
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="make-models" element={<MakeModels />} />
            <Route path="vehicle-models" element={<VehicleModels />} />
            <Route path="quotations" element={<Quotations />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="logistics" element={<Logistics />} />
            <Route path="investors" element={<Investors />} />
            <Route path="reports" element={<Reports />} />
            <Route path="leads" element={<Leads />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
