import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';

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
    <div className="auth-wrapper">

      <div className="auth-image-pane">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', maxWidth: 400 }}
        >
          <div style={{ display: 'inline-flex', padding: 20, background: 'rgba(255,255,255,0.1)', borderRadius: 24, marginBottom: 32 }}>
            <ShieldCheck size={64} color="white" />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 16, color: 'white' }}>PrintShield</h1>
          <p style={{ fontSize: '1.1rem', color: 'white', opacity: 0.8, lineHeight: 1.6 }}>
            The most secure way to send, manage, and print your documents. Your privacy is our priority.
          </p>
        </motion.div>
        

        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
      </div>


      <div className="auth-form-pane">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="auth-card"
        >
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Welcome Back</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Enter your credentials to access your account</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert alert-error">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 44, width: '100%' }}
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0 }}>Password</label>
                <a href="#" style={{ fontSize: 13, color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative', marginTop: 8 }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 44, width: '100%' }}
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} type="submit" disabled={loading}>
              {loading ? (
                <div className="spinner" style={{ borderTopColor: 'white' }} />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 15, color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>Create one</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
