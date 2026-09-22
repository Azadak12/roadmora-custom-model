/* The very first thing visitors see: big title, subtitle, the two CTA buttons ('Discover Your Career Path' / 'See How It Works'), and the stat numbers. Used on: HomePage. Each button's color has its own dedicated class (hero-cta-btn, hero-secondary-btn) in styles-site.css — no shared color classes here. */
import { useEffect, useRef } from 'react';

export default function Hero() {
  const cardRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    const title = titleRef.current;
    if (card) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity .8s ease .4s, transform .8s ease .4s';
    }
    if (title) {
      title.style.opacity = '0';
      title.style.transform = 'translateY(20px)';
      title.style.transition = 'opacity .7s ease .1s, transform .7s ease .1s';
    }
    requestAnimationFrame(() => {
      if (card) {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }
      if (title) {
        title.style.opacity = '1';
        title.style.transform = 'translateY(0)';
      }
    });
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero__mesh"></div>
      <div className="hero__content">
        <div className="hero__badge">✦ AI-Powered Career Guidance</div>
        <h1 className="hero__title" ref={titleRef}>
          Stop Guessing.<br />
          <span className="gradient-text">Start Growing.</span>
        </h1>
        <p className="hero__subtitle">
          Roadmora AI analyzes your education, skills, experience, and interests —
          then ranks real occupations and shows available training and labor-market information.
        </p>
        <div className="hero__actions">
          <a href="#cta" className="btn hero-cta-btn btn--lg">
            Discover Your Career Path
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="#how" className="btn hero-secondary-btn btn--lg">See How It Works</a>
        </div>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="stat-num">923</span>
            <span className="stat-label">O*NET Occupations</span>
          </div>
          <div className="hero__divider"></div>
          <div className="hero__stat">
            <span className="stat-num">41</span>
            <span className="stat-label">Career Interest Areas</span>
          </div>
          <div className="hero__divider"></div>
          <div className="hero__stat">
            <span className="stat-num">3</span>
            <span className="stat-label">Matches Shown at Most</span>
          </div>
        </div>
      </div>
      <div className="hero__visual">
        <div className="roadmap-card" id="roadmapCard" ref={cardRef}>
          <div className="rmc-header">
            <span className="rmc-dot rmc-dot--green"></span>
            <span className="rmc-dot rmc-dot--yellow"></span>
            <span className="rmc-dot rmc-dot--red"></span>
            <span className="rmc-title">What Your Results Include</span>
          </div>
          <div className="rmc-career">
            <div className="rmc-icon">🎯</div>
            <div>
              <div className="rmc-career-title">Ranked occupation matches</div>
              <div className="rmc-match">Based on your assessment answers</div>
            </div>
          </div>
          <div className="rmc-section-label">Available information</div>
          <div className="rmc-skills">
            <div className="rmc-skill rmc-skill--have">Match score</div>
            <div className="rmc-skill rmc-skill--have">U.S. median wage</div>
            <div className="rmc-skill rmc-skill--have">Projected growth</div>
          </div>
          <div className="rmc-section-label">Occupation details</div>
          <div className="rmc-roadmap">
            <div className="rmc-step">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Education requirements</div>
            </div>
            <div className="rmc-step">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Experience and training</div>
            </div>
            <div className="rmc-step">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Core responsibilities</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
