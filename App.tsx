import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './components/Layout/MainLayout';
import { Role } from './types';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));
const Chat = lazy(() => import('./pages/Chat'));
const Reports = lazy(() => import('./pages/Reports'));
const Finance = lazy(() => import('./pages/Finance'));
const RecycleBin = lazy(() => import('./pages/RecycleBin'));
const Profile = lazy(() => import('./pages/Profile'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
    );
}

function App() {
  return (
    <ErrorBoundary>
    <HashRouter>
      <AuthProvider>
        <ThemeProvider>
          <LanguageProvider>
             <AppRoutes />
        </LanguageProvider>
        </ThemeProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;