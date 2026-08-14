import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyCollectionReport from './pages/DailyCollectionReport';
import FeeDashboard from './pages/FeeDashboard';
import FeeReports from './pages/FeeReports';

import FeePayment from './pages/FeePayment';
import FeeSetup from './pages/FeeSetup';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import Academic from './pages/Academic';
import Administration from './pages/Administration';
import Communication from './pages/Communication';
import SchoolRegistration from './pages/SchoolRegistration';
import DataManagement from './pages/DataManagement';
import PlaceholderPage from './pages/PlaceholderPage';
import Admission from './pages/Admission';

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
            <Route path="fees/setup" element={<FeeSetup />} />
            <Route path="fees/reports" element={<FeeReports />} />
            <Route path="fees/daily-collection" element={<DailyCollectionReport />} />
            <Route path="fees/payment" element={<FeePayment />} />
            <Route path="data" element={<DataManagement />} />
            <Route path="admission" element={<Admission />} />
            
            {/* Placeholder routes for incomplete features */}
            <Route path="setup" element={<PlaceholderPage />} />
            <Route path="website" element={<PlaceholderPage />} />
            <Route path="profile" element={<PlaceholderPage />} />
            <Route path="staff-support" element={<PlaceholderPage />} />
            <Route path="student-support" element={<PlaceholderPage />} />
            <Route path="sms" element={<PlaceholderPage />} />
            <Route path="billing" element={<PlaceholderPage />} />
            <Route path="services" element={<PlaceholderPage />} />
            <Route path="qr-posters" element={<PlaceholderPage />} />
            <Route path="post-jobs" element={<PlaceholderPage />} />
            <Route path="account" element={<PlaceholderPage />} />
            
            <Route path="*" element={<PlaceholderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Analytics />
    </AppProvider>
  );
}

export default App;
