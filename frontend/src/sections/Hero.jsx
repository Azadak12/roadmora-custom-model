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
          Roadmora AI analyzes your education, skills, interests, and goals —
          then builds you a personalized career path with a step-by-step roadmap to get there.
        </p>
        <div className="hero__actions">
          <a href="#cta" className="btn btn--primary btn--lg">
            Discover Your Career Path
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a href="#how" className="btn btn--outline btn--lg">See How It Works</a>
        </div>
        <div className="hero__stats">
          <div className="hero__stat">
            <span className="stat-num">14+</span>
            <span className="stat-label">Career Dimensions Analyzed</span>
          </div>
          <div className="hero__divider"></div>
          <div className="hero__stat">
            <span className="stat-num">AI</span>
            <span className="stat-label">Personalized Roadmaps</span>
          </div>
          <div className="hero__divider"></div>
          <div className="hero__stat">
            <span className="stat-num">100%</span>
            <span className="stat-label">Structured Guidance</span>
          </div>
        </div>
      </div>
      <div className="hero__visual">
        <div className="roadmap-card" id="roadmapCard" ref={cardRef}>
          <div className="rmc-header">
            <span className="rmc-dot rmc-dot--green"></span>
            <span className="rmc-dot rmc-dot--yellow"></span>
            <span className="rmc-dot rmc-dot--red"></span>
            <span className="rmc-title">Career Recommendation</span>
          </div>
          <div className="rmc-career">
            <div className="rmc-icon">💻</div>
            <div>
              <div className="rmc-career-title">Full-Stack Developer</div>
              <div className="rmc-match">
                <div className="rmc-match-bar"><div className="rmc-match-fill" style={{ '--w': '87%' }}></div></div>
                <span>87% Match</span>
              </div>
            </div>
          </div>
          <div className="rmc-section-label">Skill Gap Analysis</div>
          <div className="rmc-skills">
            <div className="rmc-skill rmc-skill--have">✓ HTML / CSS</div>
            <div className="rmc-skill rmc-skill--have">✓ JavaScript</div>
            <div className="rmc-skill rmc-skill--need">+ React.js</div>
            <div className="rmc-skill rmc-skill--need">+ Node.js</div>
            <div className="rmc-skill rmc-skill--need">+ PostgreSQL</div>
          </div>
          <div className="rmc-section-label">Your Roadmap</div>
          <div className="rmc-roadmap">
            <div className="rmc-step rmc-step--done">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Foundation <span>4 weeks</span></div>
            </div>
            <div className="rmc-step rmc-step--active">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Core Skills <span>8 weeks</span></div>
            </div>
            <div className="rmc-step">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Projects <span>6 weeks</span></div>
            </div>
            <div className="rmc-step">
              <div className="rmc-step-dot"></div>
              <div className="rmc-step-text">Job Ready <span>4 weeks</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
