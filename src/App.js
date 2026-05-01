// App.js
import React from 'react';
import { AppProvider, useApp } from './lib/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Deals from './pages/Deals';
import AIChat from './pages/AIChat';
import Transactions from './pages/Transactions';
import Listings from './pages/Listings';
import Contacts from './pages/Contacts';
import Settings from './pages/Settings';

function AppContent() {
  const { activeView, isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
          LOADING...
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard />;
      case 'deals': return <Deals />;
      case 'ai-chat': return <AIChat />;
      case 'transactions': return <Transactions />;
      case 'listings': return <Listings />;
      case 'contacts': return <Contacts />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const isFullscreen = activeView === 'ai-chat';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        overflowY: isFullscreen ? 'hidden' : 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
