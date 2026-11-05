import SiteLayout from '../components/SiteLayout.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Features from '../sections/Features.jsx';
import Compare from '../sections/Compare.jsx';

const RESULT_PARTS = [
  { label: 'Match score', desc: 'How closely the occupation fits your interest profile and details.' },
  { label: 'Median annual wage', desc: 'U.S. BLS figure for the occupation, when published.' },
  { label: 'Projected growth', desc: 'BLS employment outlook for the coming decade.' },
  { label: 'Education', desc: 'Typical education level reported by O*NET.' },
  { label: 'Experience & training', desc: 'Related work experience and on-the-job training.' },
  { label: 'Core tasks', desc: 'What people in this role actually do day to day.' },
];

export default function FeaturesPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Features"
        title={<>Everything you need to <span className="gradient-text">choose with confidence</span></>}
        subtitle="Roadmora AI turns a short assessment into ranked occupation matches, backed by the same data career counsellors use."
        meta={['Up to 3 ranked matches', 'Official O*NET details', 'BLS wage & growth data']}
      />

      <Features />

      <section className="result-anatomy">
        <div className="container">
          <div className="split">
            <div className="split__text reveal">
              <span className="section-eyebrow">Inside a Result</span>
              <h2 className="section-title">Every match comes with <span className="gradient-text">the details</span></h2>
              <p>
                A job title alone isn't enough to make a decision. Each match brings together what the role pays, how
                demand is changing, and what it takes to get there.
              </p>
              <p>When a figure isn't published for an occupation, the result says so instead of guessing.</p>
            </div>
            <div className="anatomy-card reveal">
              <div className="anatomy-card__head">
                <span className="rmc-dot rmc-dot--green"></span>
                <span className="rmc-dot rmc-dot--yellow"></span>
                <span className="rmc-dot rmc-dot--red"></span>
                <span className="anatomy-card__title">Career match</span>
              </div>
              <ul className="anatomy-list">
                {RESULT_PARTS.map((p) => (
                  <li key={p.label}>
                    <span className="anatomy-list__check">✓</span>
                    <div>
                      <strong>{p.label}</strong>
                      <p>{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Compare />
    </SiteLayout>
  );
}
