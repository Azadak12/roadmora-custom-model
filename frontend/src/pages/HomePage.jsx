import { Link } from 'react-router-dom';
import SiteLayout from '../components/SiteLayout.jsx';
import Hero from '../sections/Hero.jsx';
import SocialProof from '../sections/SocialProof.jsx';
import CtaSection from '../sections/CtaSection.jsx';
import Disclaimer from '../sections/Disclaimer.jsx';

const OVERVIEW_CARDS = [
  {
    to: '/how-it-works',
    icon: '⚙️',
    title: 'How It Works',
    desc: 'See how a self-trained model turns your answers into an interest profile and ranks real occupations.',
    cta: 'See the process',
  },
  {
    to: '/features',
    icon: '✨',
    title: 'Features',
    desc: 'Ranked matches with match scores, U.S. wage and growth data, education, training, and core tasks.',
    cta: 'Explore features',
  },
  {
    to: '/assessment',
    icon: '📋',
    title: 'Take the Assessment',
    desc: 'Five short steps covering your education, skills, experience, and interests.',
    cta: 'Start now',
  },
  {
    to: '/about',
    icon: '💡',
    title: 'About Roadmora AI',
    desc: 'Why we built a structured, data-driven alternative to generic career advice.',
    cta: 'Read our story',
  },
];

const HIGHLIGHTS = [
  { title: 'Real occupation data', desc: 'Every match is a real occupation from the U.S. Department of Labor’s O*NET database.' },
  { title: 'Our own trained model', desc: 'Predictions come from a PyTorch network trained for this project, not a chatbot.' },
  { title: 'Results you can revisit', desc: 'Sign in and your top match from each assessment is saved to your dashboard.' },
];

const INCLUDED = [
  { icon: <path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7Z" />, title: 'Ranked occupation matches', desc: 'Up to three real occupations ranked against your answers.' },
  { icon: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />, title: 'Match score', desc: 'How closely each occupation fits your interest profile and details.' },
  { icon: <path d="M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6" />, title: 'U.S. median wage', desc: 'Annual pay figures from the Bureau of Labor Statistics, when published.' },
  { icon: <path d="m3 17 6-6 4 4 8-8M15 7h6v6" />, title: 'Projected growth', desc: 'How demand for the occupation is expected to change.' },
  { icon: <path d="m2 9 10-5 10 5-10 5ZM6 11v5c3 2 9 2 12 0v-5" />, title: 'Education requirements', desc: 'The typical education level reported by O*NET.' },
  { icon: <path d="M4 8h16v11H4zM9 8V5h6v3" />, title: 'Experience and training', desc: 'Related work experience and on-the-job training.' },
  { icon: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />, title: 'Core responsibilities', desc: 'What people in the role actually do day to day.' },
];

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <SocialProof />

      <section className="home-included">
        <div className="container container--narrow">
          <div className="section-header">
            <h2 className="section-title">What you get free, instantly</h2>
            <p className="section-sub">No credit card. Your career matches appear right after the last step.</p>
          </div>
          <ul className="included-list">
            {INCLUDED.map((item) => (
              <li className="included-item" key={item.title}>
                <span className="included-item__icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg>
                </span>
                <div>
                  <strong>{item.title} <span className="free-badge">FREE</span></strong>
                  <p>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="section-actions">
            <Link to="/assessment" className="btn cta-section-btn btn--lg">Show Me My Matching Careers</Link>
          </div>
        </div>
      </section>

      <section className="home-highlights">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why people trust Roadmora AI</h2>
            <p className="section-sub">Your matches combine your answers with official occupation data, so they reflect how you actually like to work.</p>
          </div>
          <div className="highlights-grid">
            {HIGHLIGHTS.map((h, i) => (
              <div className="highlight reveal" key={h.title}>
                <span className="highlight__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-overview">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Everything you need, <span className="gradient-text">one click away</span></h2>
            <p className="section-sub">Learn how Roadmora AI works, see what your results include, or jump straight into the assessment.</p>
          </div>
          <div className="overview-grid">
            {OVERVIEW_CARDS.map((card) => (
              <Link to={card.to} key={card.to} className="overview-card reveal">
                <div className="ov-icon">{card.icon}</div>
                <h3 className="ov-title">{card.title}</h3>
                <p className="ov-desc">{card.desc}</p>
                <span className="ov-cta">
                  {card.cta}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
      <Disclaimer />
    </SiteLayout>
  );
}
