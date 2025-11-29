import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { PublicHome } from './pages/public/PublicHome';
import { PublicDetail } from './pages/public/PublicDetail';
import { Login } from './pages/admin/Login';
import { AdminLayout } from './pages/admin/AdminLayout';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/news/:id" element={<PublicDetail />} />
          <Route path="/admin" element={<Login />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;