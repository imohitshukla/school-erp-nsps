import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyCollectionReport from './pages/DailyCollectionReport';
import FeeDashboard from './pages/FeeDashboard';
import FeeReports from './pages/FeeReports';

import FeePayment from './pages/FeePayment';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import Academic from './pages/Academic';
import Administration from './pages/Administration';
import Communication from './pages/Communication';
import SchoolRegistration from './pages/SchoolRegistration';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<SchoolRegistration />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes wrapped in Layout */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="academic" element={<Academic />} />
            <Route path="admin" element={<Administration />} />
            <Route path="communication" element={<Communication />} />
            <Route path="fees/dashboard" element={<FeeDashboard />} />
            <Route path="fees/reports" element={<FeeReports />} />
            <Route path="fees/daily-collection" element={<DailyCollectionReport />} />
            <Route path="fees/payment" element={<FeePayment />} />
            <Route path="*" element={<div className="p-8 text-gray-500">Page under construction</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
