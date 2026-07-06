import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Building04Icon,
  UserMultipleIcon,
  DashboardSquare01Icon,
  Money03Icon,
  Settings01Icon,
  Logout01Icon
} from 'hugeicons-react';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Admin Sidebar */}
      <aside style={{ 
        width: 250, 
        background: 'var(--color-surface-2)', // Slightly different from user dashboard
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0'
      }}>
        <div style={{ padding: '0 20px', marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Building04Icon color="var(--color-accent)" size={24} />
          <h2 style={{ fontSize: '1.2rem', letterSpacing: '-0.5px' }}>Smart<span style={{ color: 'var(--color-accent)' }}>Admin</span></h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, padding: '0 10px' }}>
           <div className="sidebar-link" onClick={() => navigate('/admin')} style={linkStyle(isActive('/admin'))}>
             <DashboardSquare01Icon size={20} /> Overview
           </div>
           <div className="sidebar-link" onClick={() => navigate('/admin/users')} style={linkStyle(isActive('/admin/users'))}>
             <UserMultipleIcon size={20} /> Users & Subs
           </div>
           <div className="sidebar-link" onClick={() => navigate('/admin/financials')} style={linkStyle(isActive('/admin/financials'))}>
             <Money03Icon size={20} /> Revenue
           </div>
           <div className="sidebar-link" onClick={() => navigate('/admin/settings')} style={linkStyle(isActive('/admin/settings'))}>
             <Settings01Icon size={20} /> Platform Config
           </div>
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid var(--color-border-subtle)', margin: '0 10px' }}>
          <div className="sidebar-link" onClick={() => navigate('/login')} style={linkStyle(false, true)}>
            <Logout01Icon size={20} /> Exit Admin
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
        {/* Top Header */}
        <header style={{ padding: '20px 40px', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-surface-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Superadmin Mode Active</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 35, height: 35, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
            <span>Admin</span>
          </div>
        </header>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

const linkStyle = (active: boolean, isLogout: boolean = false): React.CSSProperties => ({
  display: 'flex', 
  alignItems: 'center', 
  gap: 12, 
  padding: '12px 20px', 
  borderRadius: 8, 
  cursor: 'pointer',
  background: active ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
  color: active ? 'var(--color-accent)' : (isLogout ? 'var(--color-error)' : 'var(--color-text-muted)'),
  fontWeight: active ? 600 : 500,
  transition: 'all 0.2s'
});

export default AdminLayout;
