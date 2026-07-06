import React, { useState } from 'react';
import DashboardLayout from './Layout';
import { UserIcon, GithubIcon, Notification01Icon } from 'hugeicons-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../utils/api';

const Settings: React.FC = () => {
  const { user, checkAuth } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [githubToken, setGithubToken] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingToken, setIsUpdatingToken] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    setMessage('');
    try {
      await api.patch('/auth/update-profile', { name });
      await checkAuth(); // Refresh user in store
      setMessage('Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error', err);
      setMessage('Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateGithubToken = async () => {
    setIsUpdatingToken(true);
    setMessage('');
    try {
      await api.post('/auth/github-token', { token: githubToken });
      await checkAuth();
      setMessage('GitHub token updated!');
      setGithubToken('');
    } catch (err) {
      console.error('Update token error', err);
      setMessage('Failed to update token.');
    } finally {
      setIsUpdatingToken(false);
    }
  };

  const handleRemoveToken = async () => {
    if (!window.confirm('Remove GitHub tokens? You won\'t be able to analyze private repos.')) return;
    setIsUpdatingToken(true);
    try {
      await api.post('/auth/github-token', { token: null });
      await checkAuth();
      setMessage('Token removed.');
    } catch (err) {
      console.error('Remove token error', err);
    } finally {
      setIsUpdatingToken(false);
    }
  };

  return (
    <DashboardLayout>
      <div style={{ padding: 40, maxWidth: 800, width: '100%' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 10 }}>Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 40 }}>Manage your preferences and integrations.</p>

        {/* Profile Settings */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><UserIcon /> Profile details</h2>
          <div className="glass-panel" style={{ padding: 30 }}>
            {message && <div style={{ padding: 10, borderRadius: 8, background: 'rgba(52, 211, 153, 0.1)', color: 'var(--color-success)', marginBottom: 20, fontSize: '0.9rem' }}>{message}</div>}
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--color-text-muted)' }}>Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 8, color: 'var(--color-text-muted)' }}>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.7 }} />
              </div>
            </div>
            <button className="btn-secondary" style={{ padding: '8px 16px' }} onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* GitHub Integration */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><GithubIcon /> GitHub Integration</h2>
          <div className="glass-panel" style={{ padding: 30 }}>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
              {user?.githubToken ? '✅ GitHub token is connected (********).' : 'Provide a Personal Access Token to allow SmartPitch to read your private repositories.'}
            </p>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <input type="password" placeholder="ghp_..." value={githubToken} onChange={(e) => setGithubToken(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={handleUpdateGithubToken} disabled={isUpdatingToken || !githubToken}>
                {isUpdatingToken ? 'Updating...' : 'Update Token'}
              </button>
              {user?.githubToken && (
                <button className="btn-secondary" style={{ padding: '8px 16px', color: 'var(--color-error)' }} onClick={handleRemoveToken}>Remove Token</button>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}><Notification01Icon /> Email Notifications</h2>
          <div className="glass-panel" style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 15 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Email me when a Pitch Generation completes</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked />
              <span>Send me product updates and tips</span>
            </label>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default Settings;
