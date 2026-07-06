import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Store, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
          <h1 style={{ fontSize: '2.5rem', marginBottom: 16, color: 'white' }}>Join PrintShield</h1>
          <p style={{ fontSize: '1.1rem', color: 'white', opacity: 0.8, lineHeight: 1.6 }}>
            Create an account to experience seamless, secure document printing across local shops.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 40, textAlign: 'left' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><CheckCircle2 size={20} /> <span style={{opacity: 0.9}}>End-to-end encryption</span></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><CheckCircle2 size={20} /> <span style={{opacity: 0.9}}>No traces left behind</span></div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><CheckCircle2 size={20} /> <span style={{opacity: 0.9}}>Fast & reliable network</span></div>
          </div>
        </motion.div>
        

        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50%', height: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
      </div>


      <div className="auth-form-pane" style={{ overflowY: 'auto' }}>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="auth-card"
          style={{ maxWidth: 520, margin: 'auto', padding: '40px 0' }}
        >
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Create an Account</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Get started with PrintShield in seconds</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="alert alert-error">
              {error}
            </motion.div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
             <button 
               type="button"
               className={`btn ${form.role === 'customer' ? 'btn-primary' : 'btn-secondary'}`} 
               style={{ height: 80, flexDirection: 'column', gap: 6, borderRadius: 'var(--radius-md)' }}
               onClick={() => handleRoleSelect('customer')}
             >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                   <User size={18} /> Customer
                </div>
                <div style={{ fontSize: 12, opacity: form.role==='customer' ? 0.9 : 0.6, fontWeight: 500 }}>Send files to shops</div>
             </button>
             <button 
               type="button"
               className={`btn ${form.role === 'printer' ? 'btn-primary' : 'btn-secondary'}`}
               style={{ height: 80, flexDirection: 'column', gap: 6, borderRadius: 'var(--radius-md)' }}
               onClick={() => handleRoleSelect('printer')}
             >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                   <Store size={18} /> Shop Owner
                </div>
                <div style={{ fontSize: 12, opacity: form.role==='printer' ? 0.9 : 0.6, fontWeight: 500 }}>Receive & print files</div>
             </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 44, width: '100%' }}
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
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

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 44, width: '100%' }}
                  type="password"
                  name="password"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {form.role === 'printer' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px', overflow: 'hidden' }}
              >
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Shop Name</label>
                  <div style={{ position: 'relative' }}>
                    <Store size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 44, width: '100%' }}
                      type="text"
                      name="printerName"
                      placeholder="e.g. Quick Print Solutions"
                      value={form.printerName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Location (Optional)</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      className="form-input"
                      style={{ paddingLeft: 44, width: '100%' }}
                      type="text"
                      name="location"
                      placeholder="e.g. Mumbai, Maharashtra"
                      value={form.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <button className="btn btn-primary btn-lg" style={{ width: '100%', gridColumn: 'span 2', marginTop: 16 }} type="submit" disabled={loading}>
              {loading ? <div className="spinner" style={{ borderTopColor: 'white' }} /> : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 15, color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700 }}>Sign In</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
