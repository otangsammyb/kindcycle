import React from 'react';
import AdminLayout from './Layout';
import { Money03Icon } from 'hugeicons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const AdminFinancials: React.FC = () => {
  const [payments, setPayments] = React.useState<any[]>([]);
  const [revenueData, setRevenueData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [paymentsRes, chartRes] = await Promise.all([
          api.get('/admin/financials'),
          api.get('/admin/revenue-chart')
        ]);
        setPayments(paymentsRes.data.data.payments);
        setRevenueData(chartRes.data.data.revenueData);
      } catch (err) {
        console.error('Error fetching financial data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinancialData();
  }, []);

  if (isLoading) return <div style={{ padding: 40 }}>Loading financial data...</div>;

  return (
    <AdminLayout>
      <div style={{ padding: 40, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ padding: 15, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 12, color: 'var(--color-success)' }}>
              <Money03Icon size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.5rem', marginBottom: 5 }}>Financial Dashboards</h1>
              <p style={{ color: 'var(--color-text-muted)' }}>Revenue streams from Stripe and CamPay.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary">Export CSV</button>
          </div>
        </div>

        {/* Charts and Tables */}
        <div className="glass-panel" style={{ padding: 30, marginBottom: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <h3 style={{ fontSize: '1.2rem' }}>Revenue by Provider</h3>
            <div style={{ display: 'flex', gap: 15, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-primary-light)' }}/> Stripe</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-accent)' }}/> CamPay (XAF Converted)</div>
            </div>
          </div>
          <div style={{ height: 400, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStripe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary-light)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary-light)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCampay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="var(--color-text-muted)" />
                <YAxis stroke="var(--color-text-muted)" tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary-light)" fillOpacity={1} fill="url(#colorStripe)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transaction History */}
        <h2 style={{ fontSize: '1.5rem', marginBottom: 20 }}>Recent Transactions</h2>
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--color-surface-2)' }}>
              <tr>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Transaction ID</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>User</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Provider</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)' }}>Amount</th>
                <th style={{ padding: '20px 30px', fontWeight: 600, borderBottom: '1px solid var(--color-border-subtle)', textAlign: 'right' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((t, i) => (
                 <tr key={t._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '20px 30px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{t._id.substring(t._id.length - 8).toUpperCase()}</td>
                  <td style={{ padding: '20px 30px' }}>
                    <div style={{ fontWeight: 500 }}>{t.userId?.name || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{t.userId?.email}</div>
                  </td>
                  <td style={{ padding: '20px 30px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{t.method.replace('_', ' ')}</span>
                  </td>
                  <td style={{ padding: '20px 30px', fontWeight: 500, color: t.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                    ${t.amount} {t.currency}
                  </td>
                  <td style={{ padding: '20px 30px', textAlign: 'right', color: 'var(--color-text-muted)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
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

export default AdminFinancials;
