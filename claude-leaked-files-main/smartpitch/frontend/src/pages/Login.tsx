import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtificialIntelligence01Icon, Mail01Icon, ViewIcon, ViewOffSlashIcon } from 'hugeicons-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const { login } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      const user = res.data.data.user;
      login(res.data.token, user);
      
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', padding: 20 }}>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: 400, padding: '50px 40px', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => navigate('/')}>
            <ArtificialIntelligence01Icon color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>Welcome back</h1>
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Sign in to continue to SmartPitch.</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <Mail01Icon size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="email" 
              name="email" 
              placeholder="Email address" 
              style={{ paddingLeft: 46 }} 
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ position: 'relative' }}>
             <div 
              style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', zIndex: 10 }}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <ViewOffSlashIcon size={20} color="var(--color-text-muted)"/> : <ViewIcon size={20} color="var(--color-text-muted)"/>}
            </div>
            <input 
              type={showPassword ? 'text' : 'password'} 
              name="password" 
              placeholder="Password" 
              style={{ paddingInline: 46 }} 
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 500 }}>Forgot password?</span>
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 10 }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 30, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Don't have an account? <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/register')}>Create an account</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
