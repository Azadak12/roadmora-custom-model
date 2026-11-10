/* React entry point. Wraps the whole app in BrowserRouter (routing), AuthProvider (login state, see context/AuthContext.jsx) and AuthModalProvider (login popup state). You shouldn't need to edit this file for normal UI changes. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { AuthModalProvider } from './context/AuthModalContext.jsx';
import { pingBackend } from './lib/api.js';

// Wake a sleeping backend as early as possible, before any page needs it.
pingBackend();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthModalProvider>
          <App />
        </AuthModalProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
