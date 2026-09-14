import { useAuth } from '../context/AuthContext.jsx';
import { useAuthModal } from '../context/AuthModalContext.jsx';

export default function CtaSection() {
  const { user } = useAuth();
  const { openAuth } = useAuthModal();

  function handleClick(e) {
    if (!user) {
      e.preventDefault();
      openAuth('login');
    }
  }

  return (
    <section className="cta-section" id="cta">
      <div className="cta-mesh"></div>
      <div className="container">
        <div className="cta-inner reveal">
          <span className="section-eyebrow">Ready to Begin?</span>
          <h2 className="cta-title">Your career path starts<br /><span className="gradient-text">with one assessment.</span></h2>
          <p className="cta-sub">No experience needed. No right or wrong answers. Just honest inputs — and Roadmora AI does the rest.</p>
          <div className="cta-actions">
            <a href="#assessment" className="btn btn--primary btn--xl" onClick={handleClick}>
              Start Your Career Assessment
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <p className="cta-note">Free to use · No credit card required · Takes about 10 minutes</p>
          </div>
        </div>
      </div>
    </section>
  );
}
