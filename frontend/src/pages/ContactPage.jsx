import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import Contact from '../sections/Contact.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function ContactPage() {
  useScrollReveal();
  return (
    <>
      <Nav />
      <div style={{ paddingTop: 'var(--nav-h, 72px)' }}>
        <Contact />
      </div>
      <Footer />
    </>
  );
}
