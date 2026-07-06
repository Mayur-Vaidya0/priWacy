import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully.', 'info');
    navigate('/login');
  };

  const homeLink = user?.role === 'printer' ? '/printer/dashboard' : '/customer/search';

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="navbar"
    >
      <Link to={homeLink} className="navbar-brand">
        <div className="navbar-logo" style={{ borderRadius: 8, width: 32, height: 32, fontSize: 18 }}>
          <ShieldCheck size={20} />
        </div>
        <span className="navbar-title">PrintShield</span>
      </Link>

      <div className="navbar-right">
        {user && (
          <>
            <div className="navbar-user">
              <div className="navbar-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="navbar-user-text">
                <span className="navbar-user-name">{user.name}</span>
                <span className="navbar-user-id" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {user.role === 'printer' ? <span style={{fontSize:10}}>🏪</span> : <span style={{fontSize:10}}>👤</span>} 
                  {user.publicId}
                </span>
              </div>
            </div>

            {user.role === 'customer' && (
              <Link to="/customer/files" className="btn btn-secondary btn-sm" title="My Files">
                <User size={16} /> My Files
              </Link>
            )}

            <button
              id="logout-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
