import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArtificialIntelligence01Icon, Mail01Icon, UserIcon, ViewIcon, ViewOffSlashIcon } from 'hugeicons-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

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
      const res = await api.post('/auth/register', formData);
      login(res.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA', padding: 20 }}>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: 450, padding: 50, zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} onClick={() => navigate('/')}>
            <ArtificialIntelligence01Icon color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>Create an account</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Start generating stunning pitch decks.</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-error)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <UserIcon size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              name="name" 
              placeholder="Full Name" 
              style={{ paddingLeft: 46 }} 
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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
              placeholder="Password (min 8 chars)" 
              style={{ paddingInline: 46 }} 
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 10 }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 30, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <span style={{ color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>Sign in</span>
        </p>
      </div>
    </div>
  );
};

export default Register;
