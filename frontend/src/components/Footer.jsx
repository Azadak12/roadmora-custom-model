/* Site footer, shown at the bottom of every homepage section stack. Used on: HomePage (via App.jsx layout). */
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" className="nav__logo">
              <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
            </a>
            <p className="footer-tagline">Explore career matches and real occupation information.</p>
          </div>
          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><a href="#how">How It Works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#assessment">Career Assessment</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
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
