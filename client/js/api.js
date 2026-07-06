/**
 * KindCycle API Module
 * Centralised fetch wrapper for all API calls
 */
const API_BASE = '/api';

const api = {
  async request(method, path, body = null, isFormData = false) {
    const headers = {};
    const token = auth.getToken ? auth.getToken() : sessionStorage.getItem('kc_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({ success: false, error: res.statusText }));

    if (!res.ok) {
      // Handle token expiry — try refresh
      if (res.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
        const refreshed = await api.refreshToken();
        if (refreshed) return api.request(method, path, body, isFormData);
        if (auth.logout) auth.logout();
        else window.location.href = '/login.html';
      }
      throw new Error(data.error || 'Request failed');
    }
    return data;
  },

  get: (path) => api.request('GET', path),
  post: (path, body) => api.request('POST', path, body),
  patch: (path, body) => api.request('PATCH', path, body),
  put: (path, body) => api.request('PUT', path, body),
  delete: (path) => api.request('DELETE', path),
  upload: (path, formData) => api.request('POST', path, formData, true),

  async refreshToken() {
    const refreshToken = auth.getRefresh ? auth.getRefresh() : sessionStorage.getItem('kc_refresh');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      // Update both storages
      sessionStorage.setItem('kc_token', data.data.accessToken);
      sessionStorage.setItem('kc_refresh', data.data.refreshToken);
      localStorage.setItem('kc_token', data.data.accessToken);
      localStorage.setItem('kc_refresh', data.data.refreshToken);
      return true;
    } catch { return false; }
  }
};

window.api = api;
