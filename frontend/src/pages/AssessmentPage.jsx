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
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" /></svg>, title: 'Choose interests carefully', desc: 'Interest areas feed both the model and the re-ranking. Pick the ones you would genuinely enjoy, not just the ones you know.' },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4Z" /></svg>, title: 'Add tools you actually use', desc: 'Selected technical skills are matched against real technology tags for each occupation.' },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h16v11H4zM9 8V5h6v3" /></svg>, title: 'Include past roles', desc: 'Previous jobs and internships help surface occupations directly related to your experience.' },
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
          <h2 className="assess-intro__title">What the assessment covers</h2>
          <ol className="step-strip">
            {STEPS.map((s, i) => (
              <li className="step-strip__item reveal" key={s.name}>
                <span className="step-strip__num">{i + 1}</span>
                <strong>{s.name}</strong>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
          <h2 className="assess-intro__title">Tips for sharper results</h2>
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
