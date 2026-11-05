import SiteLayout from '../components/SiteLayout.jsx';
import PageHeader from '../components/PageHeader.jsx';
import HowItWorks from '../sections/HowItWorks.jsx';
import TechStack from '../sections/TechStack.jsx';
import CtaSection from '../sections/CtaSection.jsx';

const RIASEC = [
  { code: 'R', name: 'Realistic', tag: 'Doers', desc: 'Hands-on work with tools, machines, plants, or animals.' },
  { code: 'I', name: 'Investigative', tag: 'Thinkers', desc: 'Research, analysis, and solving complex problems.' },
  { code: 'A', name: 'Artistic', tag: 'Creators', desc: 'Design, writing, media, and self-expression.' },
  { code: 'S', name: 'Social', tag: 'Helpers', desc: 'Teaching, caring for, and supporting other people.' },
  { code: 'E', name: 'Enterprising', tag: 'Persuaders', desc: 'Leading, selling, and starting new ventures.' },
  { code: 'C', name: 'Conventional', tag: 'Organizers', desc: 'Data, records, processes, and attention to detail.' },
];

const PIPELINE = [
  {
    title: 'Encode your answers',
    desc: 'Your skills, languages, experience, industries, and selected interest areas are converted into a numeric feature vector.',
  },
  {
    title: 'Predict your interest profile',
    desc: 'A PyTorch neural network trained from scratch outputs a six-dimension RIASEC profile. No external AI API is called.',
  },
  {
    title: 'Find candidate occupations',
    desc: 'Your profile is compared with the official RIASEC profiles of 923 O*NET occupations using cosine similarity, producing a pool of 40 candidates.',
  },
  {
    title: 'Re-rank with your details',
    desc: 'Candidates are re-scored using interest overlap, technology-skill overlap, previous-role relevance, and industry fit. Each signal only counts when you filled in that field.',
  },
  {
    title: 'Show your top matches',
    desc: 'Up to three occupations are returned with a match score, education and training requirements, core tasks, and U.S. wage and growth data where available.',
  },
];

const SOURCES = [
  { icon: '🏛️', title: 'O*NET 31.0', desc: 'Occupation profiles, interest areas, technology skills, education, and tasks from the U.S. Department of Labor. Public domain.' },
  { icon: '📈', title: 'U.S. Bureau of Labor Statistics', desc: 'Median annual wages and projected employment growth for matched occupations.' },
  { icon: '🔒', title: 'Your Assessment', desc: 'Your answers are sent to our own backend. Signed-in users get their top result saved to the dashboard.' },
];

export default function HowItWorksPage() {
  return (
    <SiteLayout>
      <PageHeader
        crumb="How It Works"
        eyebrow="How It Works"
        title={<>From your answers to <span className="gradient-text">real occupations</span></>}
        subtitle="Roadmora AI combines a self-trained neural network with official U.S. occupation data. Here is exactly what happens after you submit the assessment."
        meta={['5-step assessment', 'Self-trained PyTorch model', '923 O*NET occupations']}
      />

      <HowItWorks />

      <section className="riasec">
        <div className="container">
          <div className="split">
            <div className="split__text reveal">
              <span className="section-eyebrow">The Model</span>
              <h2 className="section-title">Built on the <span className="gradient-text">Holland Code</span> framework</h2>
              <p>
                Career-interest inventories used by counsellors describe people with six interest types, known as
                RIASEC. O*NET scores every occupation on the same six types.
              </p>
              <p>
                Roadmora AI predicts your score on each type from your answers. That puts you and every occupation
                on the same scale, so they can be compared directly.
              </p>
            </div>
            <div className="riasec-grid">
              {RIASEC.map((t) => (
                <div className="riasec-card reveal" key={t.code}>
                  <span className="riasec-card__code">{t.code}</span>
                  <div>
                    <strong>{t.name} <em>· {t.tag}</em></strong>
                    <p>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pipeline">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Under the Hood</span>
            <h2 className="section-title">How matches are <span className="gradient-text">ranked</span></h2>
            <p className="section-sub">Interest profiles alone can't separate hundreds of similar jobs, so your specific details refine the result.</p>
          </div>
          <ol className="pipeline-list">
            {PIPELINE.map((p, i) => (
              <li className="pipeline-item reveal" key={p.title}>
                <span className="pipeline-item__num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="sources">
        <div className="container">
          <div className="section-header">
            <span className="section-eyebrow">Data Sources</span>
            <h2 className="section-title">Grounded in <span className="gradient-text">official data</span></h2>
          </div>
          <div className="info-grid info-grid--3">
            {SOURCES.map((s) => (
              <div className="info-card reveal" key={s.title}>
                <div className="info-card__icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TechStack />
      <CtaSection />
    </SiteLayout>
  );
}
