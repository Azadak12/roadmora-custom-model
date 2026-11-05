import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import Features from '../sections/Features.jsx';
import Compare from '../sections/Compare.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function FeaturesPage() {
  useScrollReveal();
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 'var(--nav-h, 72px)' }}>
        <Features />
        <Compare />
      </div>
      <Footer />
    </>
  );
}
