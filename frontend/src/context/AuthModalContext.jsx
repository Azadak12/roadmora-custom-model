/* Controls whether the login/signup popup (components/AuthModal.jsx) is open, and in which mode (login vs signup). Exposes useAuthModal() -> { openAuth(mode) }. */
import { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('login');

  const openAuth = (initialTab = 'login') => {
    setTab(initialTab);
    setIsOpen(true);
  };
  const closeAuth = () => setIsOpen(false);

  return (
    <AuthModalContext.Provider value={{ isOpen, tab, setTab, openAuth, closeAuth }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
