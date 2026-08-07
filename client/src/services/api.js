// Centralised API helper — reads base URL from .env (VITE_API_URL)
// so we never hardcode localhost:5001 in any component.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
  'Bypass-Tunnel-Reminder': 'true',
});

const api = {
  get: async (path) => {
    const res = await fetch(`${BASE_URL}${path}`, { headers: getAuthHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  post: async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  postForm: async (path, formData) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  /**
   * Fetches a file from an authenticated endpoint and triggers a browser download.
   * @param {string} path   - API path, e.g. '/api/students/export'
   * @param {string} filename - Suggested filename for the download
   */
  downloadBlob: async (path, filename) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Bypass-Tunnel-Reminder': 'true',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Download failed');
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

export default api;
