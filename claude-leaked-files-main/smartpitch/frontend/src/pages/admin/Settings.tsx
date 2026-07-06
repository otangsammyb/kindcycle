import React, { useState, useEffect } from 'react';
import AdminLayout from './Layout';
import api from '../../utils/api';
import { FloppyDiskIcon, ArrowPathIcon, AlertCircleIcon } from 'hugeicons-react';

interface ConfigItem {
  key: string;
  value: any;
  description?: string;
}

const AdminSettings: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/admin/config');
      setConfigs(res.data.data.configs);
    } catch (err) {
      console.error('Failed to fetch configs', err);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: any) => {
    setSaving(key);
    setMessage(null);
    try {
      await api.post('/admin/config', { key, value });
      setMessage({ type: 'success', text: `Updated ${key} successfully` });
      // Update local state
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
    } catch (err) {
      console.error('Update failed', err);
      setMessage({ type: 'error', text: `Failed to update ${key}` });
    } finally {
      setSaving(null);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get('key') as string;
    const value = formData.get('value') as string;
    const description = formData.get('description') as string;

    if (!key || !value) return;

    setSaving('new');
    try {
      await api.post('/admin/config', { key, value: JSON.parse(value), description });
      setMessage({ type: 'success', text: 'Setting saved' });
      fetchConfigs();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error saving setting' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: 40, maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Platform Configuration</h1>
            <p style={{ color: 'var(--color-text-muted)' }}>Manage global system parameters and pricing.</p>
          </div>
          <button className="btn-secondary" onClick={fetchConfigs} disabled={loading}>
            <ArrowPathIcon size={18} style={{ marginRight: 8, animation: loading ? 'spin 1s linear infinite' : '' }} /> Refresh
          </button>
        </div>

        {message && (
          <div style={{ 
            padding: 16, 
            borderRadius: 8, 
            background: message.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <AlertCircleIcon size={20} />
            {message.text}
          </div>
        )}

        {/* Create New Config */}
        <div className="glass-panel" style={{ padding: 30, marginBottom: 40 }}>
          <h3 style={{ marginBottom: 20 }}>Add New Parameter</h3>
          <form onSubmit={handleCreateOrUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Key</label>
              <input name="key" placeholder="e.g. STRIPE_ENABLED" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Value (JSON)</label>
              <input name="value" placeholder="true" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Description</label>
              <input name="description" placeholder="Enable or disable Stripe..." />
            </div>
            <button className="btn-primary" type="submit" disabled={saving === 'new'}>
              {saving === 'new' ? 'Saving...' : 'Add'}
            </button>
          </form>
        </div>

        {/* Config List */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--color-surface-2)', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '16px 24px' }}>Parameter Key</th>
                <th style={{ padding: '16px 24px' }}>Value</th>
                <th style={{ padding: '16px 24px' }}>Description</th>
                <th style={{ padding: '16px 24px' }}>Last Updated</th>
                <th style={{ padding: '16px 24px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.key} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 600 }}>{config.key}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <input 
                      type="text" 
                      defaultValue={JSON.stringify(config.value)} 
                      onBlur={(e) => {
                        try {
                          const newVal = JSON.parse(e.target.value);
                          if (JSON.stringify(newVal) !== JSON.stringify(config.value)) {
                            handleUpdate(config.key, newVal);
                          }
                        } catch(err) {
                          alert('Invalid JSON value');
                          e.target.value = JSON.stringify(config.value);
                        }
                      }}
                      style={{ padding: '8px 12px', fontSize: '0.9rem' }}
                    />
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{config.description}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>{new Date().toLocaleDateString()}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <button 
                      className="btn-secondary" 
                      onClick={() => handleUpdate(config.key, config.value)}
                      disabled={saving === config.key}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <FloppyDiskIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {configs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>No platform parameters defined.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
