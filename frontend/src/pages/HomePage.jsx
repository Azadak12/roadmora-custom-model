/* The full public landing page — just stacks all the sections/ components in order (Nav, Hero, HowItWorks, ... Assessment, Footer). To reorder sections on the homepage, reorder the list below. To edit a section's content, go to the matching file in sections/. */
import Nav from '../components/Nav.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../sections/Hero.jsx';
import SocialProof from '../sections/SocialProof.jsx';
import HowItWorks from '../sections/HowItWorks.jsx';
import Features from '../sections/Features.jsx';
import Compare from '../sections/Compare.jsx';
import CtaSection from '../sections/CtaSection.jsx';
import AssessmentSection from '../sections/AssessmentSection.jsx';
import AboutSection from '../sections/AboutSection.jsx';
import Mission from '../sections/Mission.jsx';
import TechStack from '../sections/TechStack.jsx';
import Disclaimer from '../sections/Disclaimer.jsx';
import Contact from '../sections/Contact.jsx';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

export default function HomePage() {
  useScrollReveal();

  return (
    <>
      <Nav />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Compare />
      <CtaSection />
      <AssessmentSection />
      <AboutSection />
      <Mission />
      <TechStack />
      <Disclaimer />
      <Contact />
      <Footer />
    </>
  );
}
