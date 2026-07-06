import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogOut, Printer, User } from 'lucide-react';

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
    <nav className="navbar">
      <Link to={homeLink} className="navbar-brand">
        <div className="navbar-logo" style={{ borderRadius: 6, width: 28, height: 28, fontSize: 16 }}>P</div>
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
                <span className="navbar-user-id">
                  {user.role === 'printer' ? '🖨️' : '👤'} {user.publicId}
                </span>
              </div>
            </div>

            {user.role === 'customer' && (
              <Link to="/customer/files" className="btn btn-ghost btn-sm" title="My Files">
                <User size={15} /> My Files
              </Link>
            )}

            <button
              id="logout-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
