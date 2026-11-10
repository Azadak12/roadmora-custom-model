import { Route, Routes } from 'react-router-dom';
import AuthModal from './components/AuthModal.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import AssessmentPage from './pages/AssessmentPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
      <AuthModal />
    </>
  );
}

export default App;

