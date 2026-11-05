import SiteLayout from '../components/SiteLayout.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Contact from '../sections/Contact.jsx';

export default function ContactPage() {
  return (
    <SiteLayout>
      <PageHeader
        crumb="Contact"
        eyebrow="Contact"
        title={<>We're here to <span className="gradient-text">help</span></>}
        subtitle="Questions about your results, feedback on the platform, or interest in the project? Get in touch."
      />
      <Contact />
    </SiteLayout>
  );
}
