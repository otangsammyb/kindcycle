import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layout01Icon, 
  CreditCardIcon, 
  Settings01Icon, 
  Logout01Icon,
  PresentationOnlineIcon
} from 'hugeicons-react';
import { useAuthStore } from '../../store/authStore';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{ 
        width: 250, 
        background: 'var(--color-surface-1)', 
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0'
      }}>
        <div style={{ padding: '0 20px', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Smart<span style={{ color: 'var(--color-primary)' }}>Pitch</span></h2>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, background: 'var(--color-surface-2)', color: 'var(--color-primary)', border: '1px solid var(--color-border)', padding: '2px 10px', borderRadius: 4, textTransform: 'uppercase' }}>{user?.plan || 'FREE'}</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, padding: '0 10px' }}>
           <div className="sidebar-link active" onClick={() => navigate('/dashboard')} style={linkStyle(true)}>
             <Layout01Icon size={20} /> New Pitch
           </div>
           <div className="sidebar-link" onClick={() => navigate('/dashboard/analyses')} style={linkStyle(false)}>
             <PresentationOnlineIcon size={20} /> My Decks
           </div>
           <div className="sidebar-link" onClick={() => navigate('/dashboard/billing')} style={linkStyle(false)}>
             <CreditCardIcon size={20} /> Billing & Plan
           </div>
           <div className="sidebar-link" onClick={() => navigate('/dashboard/settings')} style={linkStyle(false)}>
             <Settings01Icon size={20} /> Settings
           </div>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid var(--color-border-subtle)', margin: '0 10px' }}>
          <div className="sidebar-link" onClick={handleLogout} style={linkStyle(false, true)}>
            <Logout01Icon size={20} /> Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
        {children}
      </main>
    </div>
  );
};

const linkStyle = (active: boolean, isLogout: boolean = false): React.CSSProperties => ({
  display: 'flex', 
  alignItems: 'center', 
  gap: 12, 
  padding: '12px 20px', 
  borderRadius: '0 24px 24px 0', 
  cursor: 'pointer',
  background: active ? '#E8F0FE' : 'transparent',
  color: active ? 'var(--color-primary)' : (isLogout ? 'var(--color-error)' : 'var(--color-text-muted)'),
  fontWeight: active ? 600 : 500,
  transition: 'all 0.15s'
});

export default DashboardLayout;
