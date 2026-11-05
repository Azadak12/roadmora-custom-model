import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import AssessmentSection from '../sections/AssessmentSection.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function AssessmentPage() {
  useScrollReveal();
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 'var(--nav-h, 72px)' }}>
        <AssessmentSection />
      </div>
      <Footer />
    </>
  );
}
