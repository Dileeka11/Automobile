import { useEffect } from 'react';
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
import WebsiteCustomize from '@/pages/WebsiteCustomize';
import FeedbackManage from '@/pages/FeedbackManage';
import TaxCalculation from '@/pages/TaxCalculation';
import { useDataStore, toast } from '@/store';

/**
 * Strict authentication guard for the admin panel.
 * Nobody can access admin without entering valid username & password.
 * Session is kept in memory/sessionStorage only for the active browser session.
 * Auto-logs out on inactivity (30 minutes) and verifies user validity on load.
 */
function PrivateRoute() {
  const { currentUser, verifySession, logout } = useDataStore();

  useEffect(() => {
    if (currentUser) {
      verifySession();
    }
  }, []);

  // Inactivity timeout: automatically log out after 30 minutes of no user activity
  useEffect(() => {
    if (!currentUser) return;

    let timer: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
        toast.info('Session timed out due to inactivity. Please log in again.');
      }, INACTIVITY_LIMIT);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [currentUser, logout]);

  return currentUser ? <Outlet /> : <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/tax-calculation" element={<TaxCalculation />} />
        <Route path="/tax_calculation" element={<Navigate to="/tax-calculation" replace />} />
        <Route path="/tax-calculator" element={<Navigate to="/tax-calculation" replace />} />
        {/* Old bookmark — the login now lives at /admin */}
        <Route path="/login" element={<Navigate to="/admin" replace />} />

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
            <Route path="website" element={<WebsiteCustomize />} />
            <Route path="feedback" element={<FeedbackManage />} />
            <Route path="tax-calculation" element={<TaxCalculation />} />
            <Route path="tax_calculation" element={<Navigate to="/admin/tax-calculation" replace />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
