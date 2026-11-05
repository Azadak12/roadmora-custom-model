import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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

export default function Nav() {
  const { user, isAdmin, signOut } = useAuth();
  const { openAuth } = useAuthModal();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function isActive(to) {
    if (to === '/') return location.pathname === '/';
    return location.pathname === to;
  }

  function handleLinkClick(e, to) {
    e.preventDefault();
    setMenuOpen(false);
    if (to === '/assessment' && !user) {
      openAuth('login');
      return;
    }
    navigate(to);
  }

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav" ref={navRef}>
      <div className="nav__inner">
        <Link to="/" className="nav__logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
        </Link>
        <ul className={`nav__links${menuOpen ? ' open' : ''}`} id="navLinks">
          {LINKS.map((link) => (
            <li key={link.to}>
              <a
                href={link.to}
                className={`nav__link${isActive(link.to) ? ' active' : ''}`}
                onClick={(e) => handleLinkClick(e, link.to)}
              >
                {link.label}
              </a>
            </li>
          ))}
          {user && (
            <li>
              <Link to="/dashboard" className="nav__link nav-auth-in" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
            </li>
          )}
          {isAdmin && (
            <li>
              <Link to="/admin" className="nav__link nav-auth-in" onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            </li>
          )}
        </ul>
        <div className="nav__actions">
          {!user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="btn nav-login-btn" onClick={() => openAuth('login')}>Login</button>
              <button className="btn nav-getstarted-btn" onClick={() => openAuth('signup')}>Get Started</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="nav-user-badge">
                {(user.user_metadata?.full_name || user.email).split(/[@\s]/)[0]}
              </span>
              <button className="btn nav-logout-btn" onClick={() => signOut()}>Logout</button>
            </div>
          )}
        </div>
        <button className="nav__burger" id="burger" aria-label="Toggle menu" onClick={() => setMenuOpen((v) => !v)}>
          <span style={menuOpen ? { transform: 'translateY(7px) rotate(45deg)' } : undefined}></span>
          <span style={menuOpen ? { opacity: 0 } : undefined}></span>
          <span style={menuOpen ? { transform: 'translateY(-7px) rotate(-45deg)' } : undefined}></span>
        </button>
      </div>
    </nav>
  );
}
