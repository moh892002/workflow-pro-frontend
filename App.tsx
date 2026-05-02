
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/Layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Tasks } from './pages/Tasks';
import { EmployeeManagement } from './pages/EmployeeManagement';
import { Chat } from './pages/Chat';
import { Reports } from './pages/Reports';
import { Finance } from './pages/Finance';
import { RecycleBin } from './pages/RecycleBin';
import { Profile } from './pages/Profile';
import { Role } from './types';

const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children?: React.ReactNode, 
  allowedRoles?: Role[] 
}) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />; 
  }
  
  return <MainLayout>{children}</MainLayout>;
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            
            {/* Admin & HR Only */}
            <Route path="/reports" element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.HR_MANAGER]}>
                    <Reports />
                </ProtectedRoute>
            } />
            <Route path="/finance" element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.HR_MANAGER]}>
                    <Finance />
                </ProtectedRoute>
            } />
            <Route path="/recycle-bin" element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.HR_MANAGER]}>
                    <RecycleBin />
                </ProtectedRoute>
            } />
            <Route path="/employees" element={
                <ProtectedRoute allowedRoles={[Role.ADMIN, Role.HR_MANAGER]}>
                    <EmployeeManagement />
                </ProtectedRoute>
            } />

            {/* Profile for Everyone */}
            <Route path="/profile" element={
                <ProtectedRoute>
                    <Profile />
                </ProtectedRoute>
            } />
        </Routes>
    );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
             <AppRoutes />
          </LanguageProvider>
        </ThemeProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;