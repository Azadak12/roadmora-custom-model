/* The ONLY file that talks to the FastAPI backend. postAssessment() submits the form, getResults() fetches saved results, plus admin endpoints. Every request attaches the Supabase login token automatically. The backend URL comes from VITE_API_BASE_URL in the .env file. */
import { supabase } from './supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Render's free tier sleeps the backend after idle time, so the first real
// request can take 30-60s. Fired fire-and-forget as early as app load (see
// main.jsx) so the instance is already waking up before any page needs data.
export function pingBackend() {
  fetch(`${API_BASE_URL}/health`).catch(() => {});
}

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

async function adminWrite(path, method, data) {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { ...headers, ...(data ? { 'Content-Type': 'application/json' } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail) ? body.detail.map((item) => item.msg).join(', ') : body.detail;
    throw new Error(detail || `Server returned ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const updateAdminUser = (id, data) => adminWrite(`/api/admin/users/${encodeURIComponent(id)}`, 'PATCH', data);
export const deleteAdminUser = (id) => adminWrite(`/api/admin/users/${encodeURIComponent(id)}`, 'DELETE');
export const updateAdminResult = (id, data) => adminWrite(`/api/admin/results/${encodeURIComponent(id)}`, 'PATCH', data);
export const deleteAdminResult = (id) => adminWrite(`/api/admin/results/${encodeURIComponent(id)}`, 'DELETE');

export const createAdminUser = (data) => adminWrite('/api/admin/users', 'POST', data);
