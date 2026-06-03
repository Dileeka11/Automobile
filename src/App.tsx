import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import Dashboard from '@/pages/Dashboard';
import MakeModels from '@/pages/MakeModels';
import VehicleModels from '@/pages/VehicleModels';
import Quotations from '@/pages/Quotations';
import Invoices from '@/pages/Invoices';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="make-models" element={<MakeModels />} />
          <Route path="vehicle-models" element={<VehicleModels />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="invoices" element={<Invoices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
