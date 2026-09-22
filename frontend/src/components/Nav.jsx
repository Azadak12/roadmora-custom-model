/* The top navigation bar, fixed at the top of every page. Contains the logo, nav links, and Login/Get Started buttons. */
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#how', label: 'How It Works' },
  { href: '#features', label: 'Features' },
  { href: '#assessment', label: 'Assessment' },
  { href: '#about', label: 'About' },
];

export default function Nav() {
  const { user, isAdmin, signOut } = useAuth();
  const { openAuth } = useAuthModal();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Track the section nearest the top so the current navigation link is marked.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);

      let current = 'home';
      document.querySelectorAll('section[id]').forEach((sec) => {
        const top = sec.offsetTop - 100;
        if (window.scrollY >= top) current = sec.getAttribute('id');
      });
      setActive(current);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Offset the destination by the fixed navigation height.
  function smoothScrollTo(hash) {
    const target = document.querySelector(hash);
    if (!target || !navRef.current) return;
    const navH = navRef.current.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // The assessment link opens login for guests; other links scroll in-page.
  function handleLinkClick(e, href) {
    if (href === '#assessment' && !user) {
      e.preventDefault();
      openAuth('login');
      setMenuOpen(false);
      return;
    }
    e.preventDefault();
    smoothScrollTo(href);
    setMenuOpen(false);
  }

  return (
    <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav" ref={navRef}>
      <div className="nav__inner">
        <a href="#home" className="nav__logo" onClick={(e) => handleLinkClick(e, '#home')}>
          <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
        </a>
        <ul className={`nav__links${menuOpen ? ' open' : ''}`} id="navLinks">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={`nav__link${active === link.href.slice(1) ? ' active' : ''}`}
                onClick={(e) => handleLinkClick(e, link.href)}
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
