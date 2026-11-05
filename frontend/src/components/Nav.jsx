import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/features', label: 'Features' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const linkClass = ({ isActive }) => `nav__link${isActive ? ' active' : ''}`;

export default function Nav() {
  const { user, signOut } = useAuth();
  const { openAuth } = useAuthModal();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleAssessmentClick(e) {
    if (user) return;
    e.preventDefault();
    setMenuOpen(false);
    openAuth('login');
  }

  function openAuthFromMenu(mode) {
    setMenuOpen(false);
    openAuth(mode);
  }

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
  }

  const displayName = user ? (user.user_metadata?.full_name || user.email).split(/[@\s]/)[0] : '';

  return (
    <nav className={`nav${scrolled || menuOpen ? ' scrolled' : ''}${user ? ' nav--authed' : ''}`} id="nav">
      <div className="nav__inner">
        <Link to="/" className="nav__logo">
          <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
        </Link>

        <ul
          className={`nav__links${menuOpen ? ' open' : ''}`}
          id="navLinks"
          onClick={(e) => { if (e.target.closest('a')) setMenuOpen(false); }}
        >
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={linkClass}
                onClick={link.to === '/assessment' ? handleAssessmentClick : undefined}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          {user && <li className="nav__divider" aria-hidden="true"></li>}
          {user && (
            <li>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
            </li>
          )}
          <li className="nav__mobile-actions">
            {!user ? (
              <>
                <button className="btn nav-login-btn" onClick={() => openAuthFromMenu('login')}>Login</button>
                <button className="btn nav-getstarted-btn" onClick={() => openAuthFromMenu('signup')}>Get Started</button>
              </>
            ) : (
              <button className="btn nav-logout-btn" onClick={handleSignOut}>Logout ({displayName})</button>
            )}
          </li>
        </ul>

        <div className="nav__actions">
          {!user ? (
            <>
              <button className="btn nav-login-btn" onClick={() => openAuth('login')}>Login</button>
              <button className="btn nav-getstarted-btn" onClick={() => openAuth('signup')}>Get Started</button>
            </>
          ) : (
            <>
              <span className="nav-user-badge">{displayName}</span>
              <button className="btn nav-logout-btn" onClick={handleSignOut}>Logout</button>
            </>
          )}
        </div>

        <button
          className="nav__burger"
          id="burger"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span style={menuOpen ? { transform: 'translateY(7px) rotate(45deg)' } : undefined}></span>
          <span style={menuOpen ? { opacity: 0 } : undefined}></span>
          <span style={menuOpen ? { transform: 'translateY(-7px) rotate(-45deg)' } : undefined}></span>
        </button>
      </div>
    </nav>
  );
}
