import SiteLayout from '../components/SiteLayout.jsx';
import PageHeader from '../components/PageHeader.jsx';
import AssessmentSection from '../sections/AssessmentSection.jsx';

const STEPS = [
  { name: 'Personal', desc: 'Basic details about you. All optional.' },
  { name: 'Education', desc: 'Your highest education and current status.' },
  { name: 'Skills', desc: 'Technical tools, soft skills, and languages.' },
  { name: 'Experience', desc: 'Internships and previous job roles.' },
  { name: 'Interests', desc: 'Career interest areas and preferred industries.' },
];

const TIPS = [
  { icon: '🎯', title: 'Choose interests carefully', desc: 'Interest areas feed both the model and the re-ranking. Pick the ones you would genuinely enjoy, not just the ones you know.' },
  { icon: '🛠️', title: 'Add tools you actually use', desc: 'Selected technical skills are matched against real technology tags for each occupation.' },
  { icon: '💼', title: 'Include past roles', desc: 'Previous jobs and internships help surface occupations directly related to your experience.' },
];

export default function AssessmentPage() {
  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Career Assessment"
        title={<>Tell us about <span className="gradient-text">yourself</span></>}
        subtitle="Answer five short steps and get up to three ranked occupation matches. The more detail you give, the sharper the results."
        meta={['5 steps', 'Only 3 required fields', 'Free to use']}
      />

      <section className="assess-intro">
        <div className="container">
          <ol className="step-strip">
            {STEPS.map((s, i) => (
              <li className="step-strip__item reveal" key={s.name}>
                <span className="step-strip__num">{i + 1}</span>
                <strong>{s.name}</strong>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
          <div className="info-grid info-grid--3 assess-tips">
            {TIPS.map((t) => (
              <div className="info-card info-card--compact reveal" key={t.title}>
                <div className="info-card__icon">{t.icon}</div>
                <h3>{t.title}</h3>
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AssessmentSection />
    </SiteLayout>
  );
}
