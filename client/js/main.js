/**
 * KindCycle Main Module — shared UI init, navbar, toasts, SSE notifications
 */

// --- Navbar ---
const initNavbar = () => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const navActions = document.getElementById('nav-actions');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 10);
  }, { passive: true });

  navToggle?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    navActions?.classList.toggle('open');
  });

  if (auth.isLoggedIn() && navActions) {
    const user = auth.getUser();
    const initial = (user.name || 'U')[0].toUpperCase();
    navActions.innerHTML = `
      <div class="user-nav" id="user-nav">
        <button class="notif-bell" id="notif-bell" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <span class="notif-badge hidden" id="notif-badge">0</span>
        </button>
        <div class="user-avatar" id="user-avatar-btn" title="${user.name}">
          ${initial}
        </div>
        <div class="user-menu" id="user-menu">
          <div style="padding:10px 12px 4px;font-size:.75rem;font-weight:600;color:var(--color-text-muted);text-transform:uppercase;letter-spacing:.06em">${user.role}</div>
          <a href="${getDashboardLink(user.role)}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </a>
          <a href="/fundraisers.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Fundraisers
          </a>
          <a href="/settings.html">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </a>
          <div class="divider"></div>
          <button onclick="handleLogout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </div>`;

    document.getElementById('user-avatar-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('user-menu')?.classList.toggle('open');
    });
    document.getElementById('notif-bell')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openNotifPanel();
    });
    document.addEventListener('click', () => {
      document.getElementById('user-menu')?.classList.remove('open');
      document.getElementById('notif-panel')?.classList.remove('open');
    });

    loadUnreadCount();
    initSSE();
  }
};

const getDashboardLink = (role) => {
  if (role === 'admin') return '/admin.html';
  if (role === 'giver') return '/dashboard-giver.html';
  return '/dashboard-receiver.html';
};

// --- SSE Real-Time Notifications ---
let _sseSource = null;

const initSSE = () => {
  if (!auth.isLoggedIn()) return;
  if (_sseSource) return; // already open

  const token = auth.getToken();
  _sseSource = new EventSource(`/api/notifications/stream?token=${token}`);

  _sseSource.onmessage = (e) => {
    if (!e.data || e.data.startsWith(':')) return;
    try {
      const notif = JSON.parse(e.data);
      handleIncomingNotification(notif);
    } catch { /* ignore */ }
  };

  _sseSource.onerror = () => {
    _sseSource?.close();
    _sseSource = null;
    // Reconnect after 10s
    setTimeout(initSSE, 10000);
  };
};

const handleIncomingNotification = (notif) => {
  // Update badge
  const badge = document.getElementById('notif-badge');
  if (badge) {
    const current = parseInt(badge.textContent) || 0;
    badge.textContent = current + 1;
    badge.classList.remove('hidden');
  }

  // Show toast
  showToast(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:6px"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> ${notif.title}: ${notif.message}`, 'info', 6000);

  // Refresh panel if open
  if (document.getElementById('notif-panel')?.classList.contains('open')) {
    loadNotifications();
  }
};

const loadUnreadCount = async () => {
  try {
    const res = await api.get('/notifications?limit=1');
    const count = res.data?.unread || 0;
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = count;
      count > 0 ? badge.classList.remove('hidden') : badge.classList.add('hidden');
    }
  } catch { /* non-fatal */ }
};

const openNotifPanel = async () => {
  let panel = document.getElementById('notif-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'notif-panel';
    panel.className = 'notif-panel';
    panel.innerHTML = `
      <div class="notif-panel-header">
        <span>Notifications</span>
        <button onclick="markAllRead()" class="mark-all-btn">Mark all read</button>
      </div>
      <div id="notif-list" class="notif-list">Loading...</div>`;
    document.body.appendChild(panel);
    panel.addEventListener('click', e => e.stopPropagation());
  }
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) loadNotifications();
};

const loadNotifications = async () => {
  const list = document.getElementById('notif-list');
  if (!list) return;
  try {
    const res = await api.get('/notifications?limit=20');
    const notifs = res.data?.notifications || [];
    if (!notifs.length) { list.innerHTML = '<div class="notif-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;opacity:0.5;display:block;margin:0 auto 12px"><path d="M22 11v1a10 10 0 1 1-9-10"/><path d="M22 4L12 14.01l-3-3"/></svg>No notifications yet</div>'; return; }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" onclick="readNotif('${n._id}', '${n.link || ''}')">
        <div class="notif-title">${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${timeAgo(n.createdAt)}</div>
      </div>`).join('');
  } catch { list.innerHTML = '<div class="notif-empty">Failed to load.</div>'; }
};

window.readNotif = async (id, link) => {
  await api.patch(`/notifications/${id}/read`).catch(() => {});
  if (link) window.location.href = link;
};

window.markAllRead = async () => {
  await api.patch('/notifications/read-all').catch(() => {});
  await loadUnreadCount();
  loadNotifications();
};

const timeAgo = (dateStr) => {
  const d = new Date(dateStr);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};
window.timeAgo = timeAgo;

window.handleLogout = () => {
  if (_sseSource) { _sseSource.close(); _sseSource = null; }
  auth.logout();
};

// --- Toast Notifications ---
const createToastContainer = () => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
};

const showToast = (message, type = 'success', duration = 4000) => {
  const container = createToastContainer();
  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span style="flex:1">${message}</span><span class="toast-dismiss" onclick="this.parentElement.remove()">×</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.style.animation = 'toastIn .3s ease reverse', duration - 300);
  setTimeout(() => toast.remove(), duration);
};
window.showToast = showToast;

// --- Counter Animation ---
const animateCounter = (el, target) => {
  let val = 0;
  const step = Math.ceil(target / 60);
  const timer = setInterval(() => {
    val = Math.min(val + step, target);
    el.textContent = val.toLocaleString();
    if (val >= target) clearInterval(timer);
  }, 16);
};

const initCounters = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, parseInt(e.target.dataset.target));
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
};

// --- Helpers ---
const getConditionLabel = (c) => {
  const map = {
    new: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> New',
    like_new: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Like New',
    good: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> Good',
    fair: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> Fair',
    poor: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> Poor'
  };
  return map[c] || c;
};

const getEmojiForCategory = (cat, size = 18) => {
  const base = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:2px">`;
  const map = {
    Clothing: `${base}<path d="M20.38 3.46L16 2a8 8 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>`,
    Electronics: `${base}<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    Furniture: `${base}<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>`,
    Books: `${base}<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    Food: `${base}<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
    Toys: `${base}<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
    Sports: `${base}<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    Medical: `${base}<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    'School Supplies': `${base}<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
    Household: `${base}<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    'Baby & Kids': `${base}<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    Tools: `${base}<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
    Other: `${base}<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`
  };
  return map[cat] || map.Other;
};

window.getConditionLabel = getConditionLabel;
window.getEmojiForCategory = getEmojiForCategory;
window.getDashboardLink = getDashboardLink;

// --- Item Card Renderer ---
const renderItemCard = (item) => {
  const img = item.images?.[0]?.url
    ? `<img src="${item.images[0].url}" alt="${item.title}" loading="lazy" />`
    : `<div class="item-img-placeholder">${getEmojiForCategory(item.category)}</div>`;

  const verifiedBadge = item.giver?.idVerified
    ? `<svg class="verified-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : '';

  const giverInitial = (item.giver?.name || 'U')[0].toUpperCase();

  return `
    <div class="item-card" onclick="window.location.href='/item.html?id=${item._id}'">
      <div class="item-img">
        ${img}
        <div class="item-badge">
          <span class="condition-badge">${getConditionLabel(item.condition)}</span>
        </div>
      </div>
      <div class="item-body">
        <span class="item-category">${item.category}</span>
        <h3 class="item-title">${item.title}</h3>
        <div class="item-meta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${item.location?.city || 'Nearby'}
          <span>·</span>
          ${item.deliveryMethod === 'pickup' ? 'Pickup' : item.deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup/Delivery'}
        </div>
        <div class="item-giver">
          <div class="giver-avatar">${giverInitial}</div>
          <span class="giver-name">${item.giver?.name || 'Anonymous'}</span>
          ${verifiedBadge}
        </div>
      </div>
    </div>`;
};
window.renderItemCard = renderItemCard;

// --- Notification Panel Styles (injected) ---
const injectNotifStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .notif-bell{position:relative;background:none;border:none;cursor:pointer;padding:6px;color:var(--color-text,#1a202c);display:flex;align-items:center;border-radius:8px;transition:background .2s}
    .notif-bell:hover{background:rgba(79,70,229,.1)}
    .notif-badge{position:absolute;top:0;right:0;background:#ef4444;color:#fff;font-size:10px;font-weight:700;border-radius:50%;min-width:16px;height:16px;display:flex;align-items:center;justify-content:center;padding:0 3px}
    .notif-badge.hidden{display:none}
    .notif-panel{position:fixed;top:70px;right:16px;width:340px;max-height:480px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);z-index:9999;display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb}
    .notif-panel.open{display:flex}
    .notif-panel-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #f0f0f0;font-weight:700;font-size:.95rem}
    .mark-all-btn{font-size:.75rem;color:#4F46E5;background:none;border:none;cursor:pointer;font-weight:600}
    .notif-list{overflow-y:auto;flex:1}
    .notif-item{padding:12px 16px;border-bottom:1px solid #f5f5f5;cursor:pointer;transition:background .18s}
    .notif-item:hover{background:#f9fafb}
    .notif-item.unread{background:#eef2ff;border-left:3px solid #4F46E5}
    .notif-item.unread:hover{background:#e0e7ff}
    .notif-title{font-weight:600;font-size:.875rem;margin-bottom:2px}
    .notif-msg{font-size:.8rem;color:#6b7280;margin-bottom:4px}
    .notif-time{font-size:.72rem;color:#9ca3af}
    .notif-empty{padding:32px;text-align:center;color:#9ca3af;font-size:.875rem}
  `;
  document.head.appendChild(style);
};

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  injectNotifStyles();
  initNavbar();
  initCounters();
});
