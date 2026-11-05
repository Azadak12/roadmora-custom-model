import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function SiteLayout({ children }) {
  useScrollReveal();
  return (
    <>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
