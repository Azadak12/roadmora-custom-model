import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import HowItWorks from '../sections/HowItWorks.jsx';
import TechStack from '../sections/TechStack.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function HowItWorksPage() {
  useScrollReveal();
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 'var(--nav-h, 72px)' }}>
        <HowItWorks />
        <TechStack />
      </div>
      <Footer />
    </>
  );
}
