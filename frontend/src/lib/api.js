/* The ONLY file that talks to the FastAPI backend. postAssessment() submits the form, getResults() fetches saved results, plus admin endpoints. Every request attaches the Supabase login token automatically. The backend URL comes from VITE_API_BASE_URL in the .env file. */
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Read the current session for each request so refreshed tokens are used.
async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not logged in');
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function postAssessment(data) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  // Surface FastAPI's detail message when available; keep a status fallback.
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server returned ${res.status}`);
  }
  return res.json();
}

export async function getResults() {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}/api/results`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server returned ${res.status}`);
  }
  return res.json();
}

// All admin reads use the same bearer-token and error-handling path.
async function adminGet(path) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Server returned ${res.status}`);
  }
  return res.json();
}

export const getAdminStats = () => adminGet('/api/admin/stats');
export const getAdminUsers = () => adminGet('/api/admin/users');
export const getAdminResults = () => adminGet('/api/admin/results');
