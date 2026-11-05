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

export default function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <SocialProof />

      <section className="home-overview">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Explore</span>
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

      <section className="home-highlights">
        <div className="container">
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

      <CtaSection />
      <Disclaimer />
    </SiteLayout>
  );
}
