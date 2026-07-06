/**
 * KindCycle Auth Module — Per-Tab Session
 * 
 * Uses sessionStorage for isolation (one tab's logout doesn't affect others).
 * On first load, seeds sessionStorage from localStorage (set at login).
 */
const auth = {
  _seeded: false,

  _seed() {
    if (this._seeded) return;
    this._seeded = true;
    // If sessionStorage is empty, inherit from localStorage (new tab opened by user)
    if (!sessionStorage.getItem('kc_token') && localStorage.getItem('kc_token')) {
      sessionStorage.setItem('kc_token', localStorage.getItem('kc_token'));
      sessionStorage.setItem('kc_refresh', localStorage.getItem('kc_refresh') || '');
      sessionStorage.setItem('kc_user', localStorage.getItem('kc_user') || '');
    }
  },

  getToken() {
    this._seed();
    return sessionStorage.getItem('kc_token');
  },

  getRefresh() {
    this._seed();
    return sessionStorage.getItem('kc_refresh');
  },

  getUser() {
    this._seed();
    try { return JSON.parse(sessionStorage.getItem('kc_user')); } catch { return null; }
  },

  isLoggedIn() { return !!this.getToken() && !!this.getUser(); },
  getRole() { return this.getUser()?.role; },
  getId() { return this.getUser()?._id; },

  setSession(data) {
    // Write to both: localStorage ensures new tabs can inherit; sessionStorage is this tab's source
    const { accessToken, refreshToken, user } = data;
    const userStr = JSON.stringify(user);

    localStorage.setItem('kc_token', accessToken);
    localStorage.setItem('kc_refresh', refreshToken);
    localStorage.setItem('kc_user', userStr);

    sessionStorage.setItem('kc_token', accessToken);
    sessionStorage.setItem('kc_refresh', refreshToken);
    sessionStorage.setItem('kc_user', userStr);
  },

  updateUser(user) {
    const userStr = JSON.stringify(user);
    sessionStorage.setItem('kc_user', userStr);
    localStorage.setItem('kc_user', userStr);
  },

  logout() {
    // Only clear THIS tab's sessionStorage — other tabs keep their sessions
    api.post('/auth/logout').catch(() => {});
    sessionStorage.removeItem('kc_token');
    sessionStorage.removeItem('kc_refresh');
    sessionStorage.removeItem('kc_user');
    // Also clear localStorage so future new-tab loads don't inherit
    localStorage.removeItem('kc_token');
    localStorage.removeItem('kc_refresh');
    localStorage.removeItem('kc_user');
    window.location.href = '/login.html';
  },

  requireAuth(redirectTo = '/login.html') {
    if (!this.isLoggedIn()) {
      window.location.href = redirectTo + '?next=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  },

  requireRole(role, redirectTo = '/') {
    if (!this.requireAuth()) return false;
    if (this.getRole() !== role && this.getRole() !== 'admin') {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  redirectIfLoggedIn(target = '/') {
    if (this.isLoggedIn()) {
      const role = this.getRole();
      if (role === 'admin') window.location.href = '/admin.html';
      else if (role === 'giver') window.location.href = '/dashboard-giver.html';
      else window.location.href = '/dashboard-receiver.html';
    }
  }
};

window.auth = auth;
