import SiteLayout from '../components/SiteLayout.jsx';
import PageHeader from '../components/PageHeader.jsx';
import AboutSection from '../sections/AboutSection.jsx';
import Mission from '../sections/Mission.jsx';
import Disclaimer from '../sections/Disclaimer.jsx';

const STATS = [
  { num: '923', label: 'O*NET occupations ranked' },
  { num: '41', label: 'Career interest areas' },
  { num: '6', label: 'RIASEC interest dimensions' },
  { num: '0', label: 'External AI APIs used' },
];

const PROJECT = [
  { icon: '🎓', title: 'Final Year Project', desc: 'Roadmora AI was designed and built as a Final Year Project exploring how machine learning can make career guidance more structured and transparent.' },
  { icon: '🧪', title: 'Trained, not prompted', desc: 'Instead of wrapping a chatbot, the project trains its own PyTorch model and compares it against Ridge and Random Forest baselines.' },
  { icon: '📚', title: 'Open data', desc: 'Occupation data comes from O*NET 31.0 and the U.S. Bureau of Labor Statistics, both published by the U.S. government.' },
];

export default function AboutPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="About Us"
        title={<>Career guidance that starts <span className="gradient-text">with you</span></>}
        subtitle="Roadmora AI helps students and career changers find occupations that fit their interests, skills, and experience, using real data instead of guesswork."
      />

      <section className="stats-band">
        <div className="container">
          <div className="stats-band__grid">
            {STATS.map((s) => (
              <div className="stats-band__item reveal" key={s.label}>
                <span className="stats-band__num gradient-text">{s.num}</span>
                <span className="stats-band__label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AboutSection />
      <Mission />

      <section className="project">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">The Project</span>
            <h2 className="section-title">Built as <span className="gradient-text">academic research</span></h2>
          </div>
          <div className="info-grid info-grid--3">
            {PROJECT.map((p) => (
              <div className="info-card reveal" key={p.title}>
                <div className="info-card__icon">{p.icon}</div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Disclaimer />
    </SiteLayout>
  );
}
