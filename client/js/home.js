/**
 * Home page JS — categories, featured items, location detection
 */

const HOME_CATEGORY_ICONS = {
  'Clothing': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>`,
  'Electronics': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  'Furniture': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z"/><path d="M4 18v2M20 18v2M12 4v9"/></svg>`,
  'Books': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  'Toys': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16 3.95 6.06M14.31 16H2.83M16.62 12 10.88 21.94"/></svg>`,
  'Sports': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93 19.07 19.07M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/></svg>`,
  'Kitchen': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  'Food': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3v7"/></svg>`,
  'Tools': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.77 3.77z"/></svg>`,
  'Health': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  'Baby': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M12 2a7 7 0 0 1 7 7c0 5-3 9-7 11C8 18 5 14 5 9a7 7 0 0 1 7-7z"/></svg>`,
  'Other': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
};
const getIconForCategory = (name) => HOME_CATEGORY_ICONS[name] || HOME_CATEGORY_ICONS['Other'];

document.addEventListener('DOMContentLoaded', async () => {
  auth.redirectIfLoggedIn = () => {}; // Allow everyone to see landing

  // Update nav buttons if logged in
  if (auth.isLoggedIn()) {
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    if (btnLogin) btnLogin.style.display = 'none';
    if (btnRegister) {
      btnRegister.textContent = 'Go to Dashboard';
      btnRegister.href = getDashboardLink(auth.getRole());
    }
  }

  loadCategories();
  loadFeaturedItems();
  loadHomeFundraisers();
});

let selectedCategory = 'all';

const loadHomeFundraisers = async () => {
  const grid = document.getElementById('fundraiser-home-grid');
  if (!grid) return;
  try {
    const res = await api.get('/fundraisers?limit=3&status=active');
    const fundraisers = res.data?.fundraisers || [];
    if (!fundraisers.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--color-text-muted);padding:40px 0">No active fundraisers yet. <a href="/fundraisers.html" style="color:#4F46E5;font-weight:600">Start one!</a></div>`;
      return;
    }
    grid.innerHTML = fundraisers.map(f => {
      const raised = f.raised || 0;
      let pct = Number(((raised / f.goalAmount) * 100).toFixed(1)) || 0;
      pct = Math.min(100, pct);
      const cover = f.coverImage
        ? `<img src="${f.coverImage}" alt="${f.title}" />`
        : `<svg class="fh-cover-placeholder" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;
      return `
        <div class="fh-card" onclick="window.location.href='/fundraisers.html'">
          <div class="fh-cover">${cover}<span class="fh-category-tag">${f.category || 'General'}</span></div>
          <div class="fh-body">
            <div class="fh-title">${f.title}</div>
            <div class="fh-progress-bar"><div class="fh-progress-fill" style="width:${pct}%"></div></div>
            <div class="fh-meta">
              <span class="fh-raised">${raised.toLocaleString()} XAF raised</span>
              <span>${pct}% of goal</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
              <span style="font-size:.78rem;color:var(--color-text-muted)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:text-bottom;margin-right:4px"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> ${f.donorCount || 0} donor${f.donorCount !== 1 ? 's' : ''}</span>
              ${raised >= f.goalAmount
                ? `<button class="fh-donate-btn" style="background:#f59e0b;color:#fff;border:none;font-weight:800;display:inline-flex;align-items:center;cursor:default" onclick="event.stopPropagation();"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="margin-right:4px"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.999 14.413-3.713-3.705L7.7 11.292l2.299 2.295 5.294-5.294 1.414 1.414-6.706 6.706z"/></svg> Goal Achieved</button>`
                : `<button class="fh-donate-btn" onclick="event.stopPropagation();window.location.href='/fundraisers.html'"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:text-bottom;margin-right:4px"><path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/></svg> Donate</button>`
              }
            </div>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--color-text-muted);padding:40px 0">Could not load fundraisers.</div>`;
  }
};

const loadCategories = async () => {
  try {
    const res = await api.get('/items/categories');
    const categories = res.data;
    const scroll = document.getElementById('categories-scroll');
    if (!scroll) return;

    categories.forEach(cat => {
      const chip = document.createElement('div');
      chip.className = 'cat-chip';
      chip.dataset.cat = cat.name;
      chip.innerHTML = `
        ${getIconForCategory(cat.name)}
        ${cat.name}
        ${cat.count > 0 ? `<span class="cat-count">${cat.count}</span>` : ''}
      `;
      chip.addEventListener('click', () => {
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedCategory = cat.name;
        loadFeaturedItems(cat.name);
      });
      scroll.appendChild(chip);
    });

    // All chip click
    const allChip = scroll.querySelector('[data-cat="all"]');
    allChip?.addEventListener('click', () => {
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      allChip.classList.add('active');
      selectedCategory = 'all';
      loadFeaturedItems('all');
    });
  } catch (err) {
    console.warn('Could not load categories:', err.message);
  }
};

const loadFeaturedItems = async (category = 'all') => {
  const grid = document.getElementById('items-grid');
  if (!grid) return;

  // Show skeletons
  grid.innerHTML = Array(4).fill('<div class="item-skeleton"></div>').join('');

  try {
    const params = new URLSearchParams({ limit: 8, status: 'approved' });
    if (category !== 'all') params.append('category', category);

    // Try to get user location for proximity
    if (navigator.geolocation) {
      const pos = await new Promise(r => navigator.geolocation.getCurrentPosition(r, () => r(null), { timeout: 2000 }));
      if (pos) {
        params.append('lat', pos.coords.latitude);
        params.append('lng', pos.coords.longitude);
      }
    }

    const res = await api.get(`/items?${params}`);
    const items = res.data?.items || [];

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1" class="empty-state">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          </div>
          <div class="empty-title">No items found</div>
          <div class="empty-desc">No items available in this category yet.</div>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(renderItemCard).join('');
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1" class="empty-state">
      <div class="empty-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <div class="empty-title">Could not load items</div>
      <div class="empty-desc">Make sure the API server is running.</div>
    </div>`;
    console.warn('Items load error:', err.message);
  }
};
