import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useVaultStore } from './store/vaultStore';
import Sidebar from './components/Sidebar';
import VaultLockBanner from './components/VaultLockBanner';
import UnlockPage      from './pages/UnlockPage';
import DashboardPage   from './pages/DashboardPage';
import FilesPage       from './pages/FilesPage';
import FileDetailPage  from './pages/FileDetailPage';
import UploadPage      from './pages/UploadPage';
import SystemPage      from './pages/SystemPage';

// Guard: redirect to /unlock if vault is locked
function ProtectedLayout({ children }) {
  const isUnlocked = useVaultStore(s => s.isUnlocked);
  if (!isUnlocked) return <Navigate to="/unlock" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <VaultLockBanner />
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#21262D',
            border: '1px solid #30363D',
            color: '#E6EDF3',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
          },
          success: {
            iconTheme: { primary: '#3FB950', secondary: '#21262D' },
          },
          error: {
            iconTheme: { primary: '#F85149', secondary: '#21262D' },
          },
        }}
      />

      <Routes>
        {/* Public */}
        <Route path="/unlock" element={<UnlockPage />} />

        {/* Protected */}
        <Route path="/" element={
          <ProtectedLayout><DashboardPage /></ProtectedLayout>
        } />
        <Route path="/files" element={
          <ProtectedLayout><FilesPage /></ProtectedLayout>
        } />
        <Route path="/files/:id" element={
          <ProtectedLayout><FileDetailPage /></ProtectedLayout>
        } />
        <Route path="/upload" element={
          <ProtectedLayout><UploadPage /></ProtectedLayout>
        } />
        <Route path="/system" element={
          <ProtectedLayout><SystemPage /></ProtectedLayout>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
