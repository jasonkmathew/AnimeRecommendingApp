import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Hop as Home, User, Heart, Sparkles, Search, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from '../ui/AuthModal';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/discover', label: 'Discover', icon: Compass },
    { to: '/match', label: 'Soul Match', icon: Sparkles },
    ...(user ? [{ to: '/profile', label: 'Profile', icon: User }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <Sparkles size={24} />
            <span>AnimeIQ</span>
          </Link>

          <div className="navbar-links">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`nav-link ${isActive(to) ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
          </div>

          <form className="navbar-search" onSubmit={handleSearch}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <div className="navbar-actions">
            {user ? (
              <div className="user-menu">
                <Link to="/profile" className="user-avatar-btn">
                  <div className="avatar-sm">
                    {user.email?.[0]?.toUpperCase() || 'A'}
                  </div>
                </Link>
                <button className="btn-ghost" onClick={handleSignOut} title="Sign out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button className="btn-primary btn-sm" onClick={() => setAuthOpen(true)}>
                Sign In
              </button>
            )}
          </div>

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <form className="mobile-search" onSubmit={handleSearch}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-link ${isActive(to) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
            {user ? (
              <button className="mobile-link" onClick={handleSignOut}>
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button className="mobile-link" onClick={() => { setAuthOpen(true); setMobileMenuOpen(false); }}>
                <User size={18} />
                <span>Sign In</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
