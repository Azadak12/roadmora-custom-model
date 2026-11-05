import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '../lib/site.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav__logo">
              <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
            </Link>
            <p className="footer-tagline">Explore career matches built on real occupation data and a self-trained model.</p>
            <a className="footer-email" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </div>
          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/assessment">Career Assessment</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Data Sources</h5>
            <ul>
              <li><a href="https://www.onetcenter.org" target="_blank" rel="noopener noreferrer">O*NET</a></li>
              <li><a href="https://www.bls.gov/ooh/" target="_blank" rel="noopener noreferrer">U.S. BLS</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Roadmora AI — Final Year Project. All rights reserved.</p>
          <p className="footer-disclaimer">AI-assisted career guidance only. Not a substitute for professional career counselling.</p>
        </div>
      </div>
    </footer>
  );
}
