import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'customer', printerName: '', location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleRoleSelect = (role) => {
    setForm(f => ({ ...f, role }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill all required fields.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      addToast(`Welcome, ${data.user.name}! 🎉`, 'success');
      navigate(data.user.role === 'printer' ? '/printer/dashboard' : '/customer/search');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card page-md" style={{ width: '100%', padding: '40px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="navbar-logo" style={{ margin: '0 auto 16px', width: 48, height: 48, fontSize: '1.5rem' }}>P</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Create an Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Join PrintShield for secure and easy document printing</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
           <button 
             type="button"
             className={`btn ${form.role === 'customer' ? 'btn-primary' : 'btn-secondary'}`} 
             style={{ height: 60, flexDirection: 'column', gap: 4 }}
             onClick={() => handleRoleSelect('customer')}
           >
              <div style={{ fontWeight: 700 }}>Customer</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Send files to shops</div>
           </button>
           <button 
             type="button"
             className={`btn ${form.role === 'printer' ? 'btn-primary' : 'btn-secondary'}`}
             style={{ height: 60, flexDirection: 'column', gap: 4 }}
             onClick={() => handleRoleSelect('printer')}
           >
              <div style={{ fontWeight: 700 }}>Shop Owner</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Receive & print files</div>
           </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              name="name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

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
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {form.role === 'printer' && (
            <>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Shop Name</label>
                <input
                  className="form-input"
                  type="text"
                  name="printerName"
                  placeholder="e.g. Quick Print Solutions"
                  value={form.printerName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Location (Optional)</label>
                <input
                  className="form-input"
                  type="text"
                  name="location"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button className="btn btn-primary btn-md" style={{ width: '100%', gridColumn: 'span 2', marginTop: 12 }} type="submit" disabled={loading}>
            {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
