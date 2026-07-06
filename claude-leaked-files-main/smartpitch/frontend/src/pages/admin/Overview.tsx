import React from 'react';
import AdminLayout from './Layout';
import { 
  ArrowUpRight01Icon, 
  UserGroupIcon, 
  CreditCardIcon, 
  ArtificialIntelligence04Icon,
  Presentation02Icon
} from 'hugeicons-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const AdminOverview: React.FC = () => {
  const [stats, setStats] = React.useState<any>(null);
  const [revenueData, setRevenueData] = React.useState<any[]>([]);
  const [recentUsers, setRecentUsers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, revenueRes, usersRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/revenue-chart'),
          api.get('/admin/users')
        ]);
        setStats(statsRes.data.data);
        setRevenueData(revenueRes.data.data.revenueData);
        setRecentUsers(usersRes.data.data.users.slice(0, 5));
      } catch (err) {
        console.error('Error fetching admin data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) return <div style={{ padding: 40 }}>Loading data...</div>;

  return (
    <AdminLayout>
      <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 5 }}>Platform Overview</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>System-wide metrics and analytics.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 40 }}>
          <KPICard title="Monthly Recurring Revenue" value={stats?.mrr || '$0'} trend={stats?.trends.mrr} icon={<CreditCardIcon color="#10B981"/>} />
          <KPICard title="Active Subscribers" value={stats?.activeSubscribers || 0} trend={stats?.trends.subscribers} icon={<UserGroupIcon color="var(--color-accent)"/>} />
          <KPICard title="Pitches Generated" value={stats?.totalPitches || 0} trend={stats?.trends.pitches} icon={<Presentation02Icon color="var(--color-primary-light)"/>} />
          <KPICard title="AI API Cost (Est.)" value={stats?.estCost || '$0'} trend={stats?.trends.cost} icon={<ArtificialIntelligence04Icon color="#EF4444"/>} />
        </div>

        {/* Charts and Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 30 }}>
          <div className="glass-panel" style={{ padding: 30 }}>
            <h3 style={{ marginBottom: 30, fontSize: '1.2rem' }}>Revenue Growth</h3>
            <div style={{ height: 350, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" />
                  <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    itemStyle={{ color: 'var(--color-accent)' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: 30 }}>
            <h3 style={{ marginBottom: 30, fontSize: '1.2rem' }}>Recent Users</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              {recentUsers.map((u: any) => (
                <div key={u.id || u.email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: u.plan === 'agency' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(255,255,255,0.05)', color: u.plan === 'agency' ? 'var(--color-primary-light)' : 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {u.plan}
                  </span>
                </div>
              ))}
            </div>
            <button className="btn-secondary" style={{ width: '100%', marginTop: 20 }} onClick={() => navigate('/admin/users')}>View All Users</button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

const KPICard = ({ title, value, trend, icon }: any) => (
  <div className="glass-panel" style={{ padding: 25, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.1, transform: 'scale(2)' }}>
      {icon}
    </div>
    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 10 }}>{title}</p>
    <div style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 10 }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: trend.startsWith('+') ? 'var(--color-success)' : 'var(--color-error)', fontSize: '0.9rem' }}>
      <ArrowUpRight01Icon size={16} /> <span>{trend} vs last month</span>
    </div>
  </div>
);

export default AdminOverview;
