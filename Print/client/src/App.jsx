import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import CustomerSearch from './pages/CustomerSearch';
import PrinterProfile from './pages/PrinterProfile';
import CustomerFiles from './pages/CustomerFiles';
import PrinterDashboard from './pages/PrinterDashboard';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />


            <Route path="/customer/search" element={
              <ProtectedRoute role="customer"><CustomerSearch /></ProtectedRoute>
            } />
            <Route path="/customer/printer/:publicId" element={
              <ProtectedRoute role="customer"><PrinterProfile /></ProtectedRoute>
            } />
            <Route path="/customer/files" element={
              <ProtectedRoute role="customer"><CustomerFiles /></ProtectedRoute>
            } />


            <Route path="/printer/dashboard" element={
              <ProtectedRoute role="printer"><PrinterDashboard /></ProtectedRoute>
            } />


            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
