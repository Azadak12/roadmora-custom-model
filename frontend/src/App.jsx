/* Top-level router: defines the 4 routes (/  /dashboard  /admin/login  /admin) and mounts the global AuthModal so it can pop up from any page. */
import { Route, Routes } from 'react-router-dom';
import AuthModal from './components/AuthModal.jsx';
import HomePage from './pages/HomePage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
      </Routes>
      <AuthModal />
    </>
  );
}

export default App;

