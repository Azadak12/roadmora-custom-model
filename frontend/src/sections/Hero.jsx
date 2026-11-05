/* Homepage hero: navy band, headline + actions on the left,
   "What Your Results Include" card on the right, stat pills underneath. */
import { Link } from 'react-router-dom';

const STATS = [
  { icon: 'briefcase', num: '923', label: 'O*NET Occupations' },
  { icon: 'clock', num: '5 steps', label: 'Short assessment' },
  { icon: 'layers', num: '41', label: 'Career Interest Areas' },
  { icon: 'target', num: 'Top 3', label: 'Ranked matches' },
];

const ICONS = {
  briefcase: <path d="M4 8h16v11H4zM9 8V5h6v3" />,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  layers: <path d="m12 4 8 4-8 4-8-4 8-4Zm-8 8 8 4 8-4M4 16l8 4 8-4" />,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" /></>,
};

function Icon({ name, size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__content">
            <span className="hero__badge">AI-Powered Career Guidance</span>
            <h1 className="hero__title">
              Stop Guessing.<br />
              <span className="hero__title-accent">Start Growing.</span>
            </h1>
            <p className="hero__subtitle">
              Roadmora AI analyzes your education, skills, experience, and interests —
              then ranks real occupations and shows available training and labor-market information.
            </p>
            <div className="hero__actions">
              <Link to="/assessment" className="btn hero-cta-btn btn--lg">
                Discover Your Career Path
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/how-it-works" className="btn hero-secondary-btn btn--lg">See How It Works</Link>
            </div>
            <p className="hero__note">Free to use · No credit card required</p>
          </div>

          <div className="hero__visual">
            <div className="roadmap-card">
              <div className="rmc-header">
                <span className="rmc-dot rmc-dot--green"></span>
                <span className="rmc-dot rmc-dot--yellow"></span>
                <span className="rmc-dot rmc-dot--red"></span>
                <span className="rmc-title">What Your Results Include</span>
              </div>
              <div className="rmc-career">
                <div className="rmc-icon"><Icon name="target" size={24} /></div>
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
        </div>

        <ul className="hero__stats">
          {STATS.map((s) => (
            <li className="hero__stat" key={s.label}>
              <span className="hero__stat-num"><Icon name={s.icon} />{s.num}</span>
              <span className="hero__stat-label">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
