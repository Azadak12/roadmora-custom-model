export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <a href="#home" className="nav__logo">
              <span className="logo-icon">◈</span> Roadmora<span className="logo-accent">AI</span>
            </a>
            <p className="footer-tagline">Guiding you from career confusion to a clear, structured, and practical career path.</p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="LinkedIn">in</a>
              <a href="#" className="social-link" aria-label="GitHub">GH</a>
              <a href="#" className="social-link" aria-label="Twitter">X</a>
            </div>
          </div>
          <div className="footer-col">
            <h5>Platform</h5>
            <ul>
              <li><a href="#how">How It Works</a></li>
              <li><a href="#features">Features</a></li>
              <li><a href="#assessment">Career Assessment</a></li>
              <li><a href="#">Dashboard</a></li>
              <li><a href="#">Resume Builder</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Use</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>For Students</h5>
            <ul>
              <li><a href="#">University Students</a></li>
              <li><a href="#">Fresh Graduates</a></li>
              <li><a href="#">Career Changers</a></li>
              <li><a href="#">Tech Beginners</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Roadmora AI — Final Year Project. All rights reserved.</p>
          <p className="footer-disclaimer">AI-assisted career guidance only. Not a substitute for professional career counselling.</p>
        </div>
      </div>
    </footer>
  );
}
