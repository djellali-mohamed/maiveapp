import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import './styles/brand.css';

// Layout components
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { StatusBar } from './components/layout/StatusBar';

// Pages
import { POSPage } from './pages/POSPage';
import { InventoryPage } from './pages/InventoryPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Store
import { useSessionStore } from './store/session.store';
import { useUIStore } from './store/ui.store';

// Login Modal
import { LoginModal } from './components/LoginModal';

function AppContent() {
  const { isAuthenticated, cashier } = useSessionStore();
  const { language } = useUIStore();
  const [showLogin, setShowLogin] = useState(false);

  // Update i18n language when UI store changes
  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Check if user needs to login
  useEffect(() => {
    if (!isAuthenticated) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-maive-cream flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl text-maive-noir mb-2">MAIVÉ</h1>
          <p className="text-maive-muted font-body">L'essence de votre renaissance</p>
        </div>
        {showLogin && <LoginModal onClose={() => {}} />}
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex bg-maive-cream overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/pos" element={<POSPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/sales" element={<SalesHistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={<Navigate to="/pos" replace />} />
          </Routes>
        </main>
        <StatusBar />
      </div>
    </div>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
