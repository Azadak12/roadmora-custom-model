import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import AboutSection from '../sections/AboutSection.jsx';
import Mission from '../sections/Mission.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function AboutPage() {
  useScrollReveal();
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 'var(--nav-h, 72px)' }}>
        <AboutSection />
        <Mission />
      </div>
      <Footer />
    </>
  );
}
