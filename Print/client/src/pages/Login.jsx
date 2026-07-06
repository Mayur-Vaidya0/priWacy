import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      navigate(data.user.role === 'printer' ? '/printer/dashboard' : '/customer/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card page-sm" style={{ width: '100%', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="navbar-logo" style={{ margin: '0 auto 16px', width: 48, height: 48, fontSize: '1.5rem' }}>P</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Enter your credentials to access your account</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button className="btn btn-primary btn-md" style={{ width: '100%', marginTop: 20 }} type="submit" disabled={loading}>
            {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
