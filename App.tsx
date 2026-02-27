import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';

const PublicHome = lazy(() => import('./pages/public/PublicHome').then(m => ({ default: m.PublicHome })));
const PublicDetail = lazy(() => import('./pages/public/PublicDetail').then(m => ({ default: m.PublicDetail })));
const Login = lazy(() => import('./pages/admin/Login').then(m => ({ default: m.Login })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-maroon-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/news/:id" element={<PublicDetail />} />
            <Route path="/admin" element={<Login />} />
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;