import { Link } from 'react-router-dom';
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../sections/Hero.jsx';
import SocialProof from '../sections/SocialProof.jsx';
import CtaSection from '../sections/CtaSection.jsx';
import Disclaimer from '../sections/Disclaimer.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

const OVERVIEW_CARDS = [
  {
    to: '/how-it-works',
    icon: '🗺️',
    title: 'How It Works',
    desc: 'From confusion to clarity in four structured steps — no vague advice, no generic chatbot responses.',
    cta: 'See the Process',
  },
  {
    to: '/features',
    icon: '⚙️',
    title: 'Features',
    desc: 'AI recommendations, skill-gap analysis, learning roadmaps, market insights, and a personal dashboard.',
    cta: 'Explore Features',
  },
  {
    to: '/assessment',
    icon: '📋',
    title: 'Take the Assessment',
    desc: 'Answer structured questions about your skills, interests, and goals — get a personalized career roadmap.',
    cta: 'Start Assessment',
  },
  {
    to: '/about',
    icon: '💡',
    title: 'About Roadmora AI',
    desc: 'Built to solve a real problem: millions of students graduate with skills but no clear direction.',
    cta: 'Learn More',
  },
  {
    to: '/contact',
    icon: '📬',
    title: 'Contact Us',
    desc: 'Have a question or feedback? We\'re here to help — reach out and we\'ll respond within 24 hours.',
    cta: 'Get in Touch',
  },
];

export default function HomePage() {
  useScrollReveal();

  return (
    <>
      <Nav />
      <Hero />
      <SocialProof />

      <section className="home-overview">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Everything in One Place</span>
            <h2 className="section-title">What Roadmora AI <span className="gradient-text">offers you</span></h2>
            <p className="section-sub">Navigate to any section to explore in depth — or start your assessment right now.</p>
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
      <Footer />
    </>
  );
}
