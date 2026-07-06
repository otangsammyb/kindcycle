import React from 'react';
import AdminLayout from './Layout';
import { UserMultipleIcon, Search01Icon } from 'hugeicons-react';
import api from '../../utils/api';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.data.users);
      } catch (err) {
        console.error('Error fetching users', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div style={{ padding: 40 }}>Loading users...</div>;

  return (
    <AdminLayout>
      <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ padding: 15, background: 'rgba(6, 182, 212, 0.1)', borderRadius: 12, color: 'var(--color-accent)' }}>
              <UserMultipleIcon size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: 5 }}>User Management</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>Manage subscribers, quotas, and accounts.</p>
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 30, marginBottom: 20 }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <Search01Icon size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              style={{ paddingLeft: 46 }} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-surface-2)' }}>
              <tr>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Name</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Email</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Plan</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Join Date</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Status</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <tr key={u._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '20px 30px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '20px 30px', color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td style={{ padding: '20px 30px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      fontSize: '0.8rem',
                      background: u.plan === 'agency' ? 'rgba(124, 58, 237, 0.2)' : u.plan === 'founder' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255,255,255,0.1)',
                      color: u.plan === 'agency' ? 'var(--color-primary-light)' : u.plan === 'founder' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      textTransform: 'uppercase'
                    }}>{u.plan}</span>
                  </td>
                  <td style={{ padding: '20px 30px', color: 'var(--color-text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '20px 30px' }}>
                    <span style={{ color: 'var(--color-success)' }}>●</span> Active
                  </td>
                  <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                    <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Edit User</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
