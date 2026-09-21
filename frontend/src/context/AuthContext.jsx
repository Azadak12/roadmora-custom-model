/* Global login/session state, backed by Supabase. Exposes useAuth() -> { user, isAdmin, signOut, ... } to any component. isAdmin is decided by matching the logged-in email against VITE_ADMIN_EMAILS in the .env file. */
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined);

  // Undefined means Supabase has not finished restoring the browser session yet.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;

  // This flag controls frontend display only; the backend checks admin access again.
  const value = {
    session,
    user,
    loading: session === undefined,
    isAdmin: !!user && ADMIN_EMAILS.includes((user.email || '').toLowerCase()),
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
