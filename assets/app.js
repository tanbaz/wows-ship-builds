/* ═══════════════════════════════════════════════════════════════
   WoWS Captain Builds — Fully Dynamic Application
   All content loaded from backend API
   ═══════════════════════════════════════════════════════════════ */

(function(){
  const content = document.getElementById('content');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const search = document.getElementById('search');
  const resultsEl = document.getElementById('searchResults');
  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.getElementById('sidebarNav');
  const navToggle = document.getElementById('navToggle');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  /* ── Helpers ──────────────────────────────────────────────── */

  function norm(s){
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(s){
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function isDesktop(){
    return window.innerWidth > 980;
  }

  function nl2br(s) {
    return escapeHtml(s).replace(/\n/g, '<br>');
  }

  /* ── API & Constants ───────────────────────────────────────── */

  const API_BASE = 'http://localhost:3000/api';

  const TIER_ROMAN = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI'};

  const DISPLAY_CATEGORIES = [
    { type: 'Destroyer',  premium: false, label: 'Destroyers',                          id: 'destroyers' },
    { type: 'Cruiser',    premium: false, label: 'Cruisers',                             id: 'cruisers' },
    { type: 'Battleship', premium: false, label: 'Battleships',                          id: 'battleships' },
    { type: 'AirCarrier', premium: false, label: 'Aircraft Carriers',                    id: 'aircraft-carriers' },
    { type: 'Submarine',  premium: false, label: 'Submarines',                           id: 'submarines' },
    { type: 'Destroyer',  premium: true,  label: 'Premium/Special Destroyers',           id: 'premium-destroyers' },
    { type: 'Cruiser',    premium: true,  label: 'Premium/Special Cruisers',             id: 'premium-cruisers' },
    { type: 'Battleship', premium: true,  label: 'Premium/Special Battleships',          id: 'premium-battleships' },
    { type: 'AirCarrier', premium: true,  label: 'Premium/Special Aircraft Carriers',    id: 'premium-aircraft-carriers' },
    { type: 'Submarine',  premium: true,  label: 'Premium/Special Submarines',           id: 'premium-submarines' },
  ];

  const SHIP_TYPE_TO_CLASS = {
    'Destroyer': 'Destroyer',
    'Cruiser': 'Cruiser',
    'Battleship': 'Battleship',
    'AirCarrier': 'AirCarrier',
    'Submarine': 'Submarine'
  };

  let skillIcons = {};
  let upgradeIcons = {};
  let skillGrids = {};

  /* ── Icon Loading ──────────────────────────────────────────── */

  async function loadIconMaps() {
    try {
      const res = await fetch(`${API_BASE}/ships/icons`);
      if (!res.ok) return;
      const data = await res.json();
      skillIcons = data.skills || {};
      upgradeIcons = data.upgrades || {};
      skillGrids = data.skillGrids || {};
    } catch { /* icons unavailable — fall back to text */ }
  }

  function parseJsonField(val) {
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch { return val; }
    }
    return val || [];
  }

  /* ── Build Card Renderer ───────────────────────────────────── */

  function renderBuildCard(build) {
    const selectedSkills = parseJsonField(build.captain_skills);
    const upgrades = parseJsonField(build.upgrades);
    const tags = build.tags || [];

    const selectedMap = new Map();
    if (Array.isArray(selectedSkills)) {
      selectedSkills.forEach((sk, i) => selectedMap.set(sk.name, i + 1));
    }
    const totalPts = Array.isArray(selectedSkills)
      ? selectedSkills.reduce((s, sk) => s + (parseInt(sk.cost) || parseInt(sk.tier) || 0), 0)
      : 0;

    const tierStr = TIER_ROMAN[build.ship_tier] || build.ship_tier;

    // --- Full skill grid (4 rows × 6 cols like in-game) ---
    const shipClass = SHIP_TYPE_TO_CLASS[build.ship_type] || build.ship_type;
    const grid = skillGrids[shipClass] || [];
    let skillGridHtml = '';

    if (grid.length) {
      const rows = {};
      grid.forEach(sk => {
        if (!rows[sk.tier]) rows[sk.tier] = [];
        rows[sk.tier].push(sk);
      });

      const rowsHtml = Object.keys(rows).sort((a,b) => a - b).map(tier => {
        const cols = rows[tier].sort((a,b) => a.col - b.col);
        const cellsHtml = cols.map(sk => {
          const order = selectedMap.get(sk.name);
          const isSelected = order !== undefined;
          return `<div class="sg-cell ${isSelected ? 'sg-selected' : ''}" title="${escapeHtml(sk.name)}">
            <img src="${escapeHtml(sk.icon)}" alt="${escapeHtml(sk.name)}" loading="lazy">
            ${isSelected ? `<span class="sg-order">${order}</span>` : ''}
          </div>`;
        }).join('');
        return `<div class="sg-row">${cellsHtml}</div>`;
      }).join('');

      skillGridHtml = `
        <div class="sg-caption">Captain points: ${totalPts}/21</div>
        <div class="sg-grid">${rowsHtml}</div>`;
    }

    // --- Upgrades strip ---
    let upgradesHtml = '';
    if (Array.isArray(upgrades) && upgrades.length) {
      const ugTiles = upgrades.map(ug => {
        const name = typeof ug === 'string' ? ug : (ug.name || '');
        const iconUrl = upgradeIcons[name] || '';
        if (iconUrl) {
          return `<div class="ug-cell" title="${escapeHtml(name)}">
            <img src="${escapeHtml(iconUrl)}" alt="${escapeHtml(name)}" loading="lazy">
          </div>`;
        }
        return `<div class="ug-cell ug-noicon" title="${escapeHtml(name)}">
          <span>${escapeHtml(name.split(' ').map(w=>w[0]).join('').slice(0,3))}</span>
        </div>`;
      }).join('');
      upgradesHtml = `<div class="sg-upgrades">${ugTiles}</div>`;
    }

    // --- Structured notes ---
    let notesHtml = '';
    if (build.description) {
      notesHtml += `<div class="bc-description"><p>${nl2br(build.description)}</p></div>`;
    }
    if (build.play_style_notes) {
      notesHtml += `<div class="bc-playstyle"><p>${nl2br(build.play_style_notes)}</p></div>`;
    }
    if (build.alternative_notes) {
      notesHtml += `<details class="bc-alternatives"><summary>Alternatives & Notes</summary><p>${nl2br(build.alternative_notes)}</p></details>`;
    }

    let tagsHtml = '';
    if (tags.length) {
      tagsHtml = `<div class="build-card-tags">${tags.map(t => `<span class="build-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
    }

    return `
      <div class="build-card" id="build-${build.id}">
        <div class="bc-header">
          <div class="bc-ship-info">
            <span class="bc-tier">${escapeHtml(String(tierStr))}</span>
            <span class="bc-ship-name">${escapeHtml(build.ship_name)}</span>
          </div>
          <div class="bc-build-name">${escapeHtml(build.title)}</div>
        </div>
        <div class="bc-content">
          <div class="bc-left">
            <div class="bc-body">
              ${skillGridHtml}
            </div>
            ${upgradesHtml}
          </div>
          <div class="bc-right">
            ${notesHtml}
            ${tagsHtml}
          </div>
        </div>
      </div>
    `;
  }

  /* ── Load Page Content (Introduction) ──────────────────────── */

  async function loadPageContent() {
    const introSection = document.getElementById('intro-section');
    try {
      const res = await fetch(`${API_BASE}/content/index`);
      if (!res.ok) throw new Error('API unavailable');
      const sections = await res.json();

      if (!sections || !sections.length) throw new Error('No content');

      let html = '<h1 id="introduction">Captain Builds</h1>';
      for (const sec of sections) {
        if (sec.body) {
          const paragraphs = sec.body.split('\n\n').filter(Boolean);
          html += paragraphs.map(p => `<p>${nl2br(p)}</p>`).join('');
        }
      }
      introSection.innerHTML = html;
    } catch {
      // Fallback: minimal intro
      introSection.innerHTML = `
        <h1 id="introduction">Captain Builds</h1>
        <p>Please read the notes below the builds to avoid confusion. The numbers on the skills indicate the recommended pick order.</p>
        <p>These builds are intended for random battles. Ranked and competitive builds may differ.</p>
        <p class="error-state">Full introduction could not be loaded from the server.</p>
      `;
    }
  }

  /* ── Load All Builds ───────────────────────────────────────── */

  let allBuildsGrouped = [];

  async function loadAllBuilds() {
    const container = document.getElementById('builds-container');
    try {
      const res = await fetch(`${API_BASE}/builds?limit=500`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      const builds = data.builds || data;

      if (!builds || !builds.length) {
        container.innerHTML = '<p class="error-state">No builds available yet.</p>';
        return;
      }

      let html = '';

      for (const cat of DISPLAY_CATEGORIES) {
        const catBuilds = builds.filter(b =>
          b.ship_type === cat.type && !!b.is_premium === cat.premium
        );

        if (!catBuilds.length) continue;

        // Sort by tier desc, then ship name
        catBuilds.sort((a, b) => (b.ship_tier - a.ship_tier) || a.ship_name.localeCompare(b.ship_name));

        html += `
          <section class="builds-section" data-section="${cat.id}" id="page-${cat.id}">
            <h2 id="${cat.id}">${escapeHtml(cat.label)}</h2>
            <div class="build-cards-list">
              ${catBuilds.map(b => renderBuildCard(b)).join('')}
            </div>
          </section>
        `;

        // Store for nav building
        allBuildsGrouped.push({
          label: cat.label,
          id: cat.id,
          builds: catBuilds
        });
      }

      container.innerHTML = html;

      // Build search index
      rebuildSearchIndex(builds);

    } catch (err) {
      container.innerHTML = `
        <div class="error-state">
          <p>Could not load builds from server.</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
      console.error('Failed to load builds:', err);
    }
  }

  /* ── Load Changelog ────────────────────────────────────────── */

  async function loadFullChangelog() {
    const section = document.getElementById('changelog-section');
    try {
      const res = await fetch(`${API_BASE}/changelog?limit=100`);
      if (!res.ok) return;
      const data = await res.json();

      if (!data || !data.length) {
        section.innerHTML = '';
        return;
      }

      let html = `
        <section class="page-section" data-section="changelog" id="page-changelog">
          <h2 id="changelog">Change Log</h2>
      `;
      for (const group of data) {
        html += `<ul><li><strong>Update: ${escapeHtml(group.date)}</strong></li></ul><ul>`;
        for (const item of group.items) {
          html += `<li>${escapeHtml(item)}</li>`;
        }
        html += '</ul>';
      }
      html += '</section>';
      section.innerHTML = html;
    } catch {
      // Changelog not critical
    }
  }

  /* ── Navigation Builder (from API data) ────────────────────── */

  function buildNavFromData() {
    if (!sidebarNav) return;

    const navFrag = document.createDocumentFragment();

    // Introduction link
    const topList = document.createElement('ul');
    topList.className = 'nav-list nav-list-top';
    const introLi = document.createElement('li');
    introLi.className = 'nav-item';
    introLi.innerHTML = '<a href="#introduction" class="nav-link nav-link-top">Introduction</a>';
    topList.appendChild(introLi);
    navFrag.appendChild(topList);

    // Category groups with build entries
    for (const group of allBuildsGrouped) {
      const details = document.createElement('details');
      details.className = 'nav-group';
      details.dataset.target = group.id;

      const summary = document.createElement('summary');
      summary.className = 'nav-group-summary';
      summary.innerHTML = `<span class="nav-group-label"><a href="#${group.id}" class="nav-group-link">${escapeHtml(group.label)}</a></span><span class="nav-chevron" aria-hidden="true"></span>`;
      details.appendChild(summary);

      const list = document.createElement('ul');
      list.className = 'nav-list nav-list-builds';

      // Deduplicate by build title for nav (some titles repeat)
      const seen = new Set();
      for (const b of group.builds) {
        const key = b.title;
        if (seen.has(key)) continue;
        seen.add(key);

        const li = document.createElement('li');
        li.className = 'nav-item nav-item-build';
        li.innerHTML = `<a href="#build-${b.id}" class="nav-link">${escapeHtml(b.title)}</a>`;
        list.appendChild(li);
      }

      details.appendChild(list);
      navFrag.appendChild(details);
    }

    // Changelog link
    const changelogGroup = document.createElement('details');
    changelogGroup.className = 'nav-group';
    const changelogSummary = document.createElement('summary');
    changelogSummary.className = 'nav-group-summary';
    changelogSummary.innerHTML = '<span class="nav-group-label"><a href="#changelog" class="nav-group-link">Change Log</a></span><span class="nav-chevron" aria-hidden="true"></span>';
    changelogGroup.appendChild(changelogSummary);
    navFrag.appendChild(changelogGroup);

    sidebarNav.innerHTML = '';
    sidebarNav.appendChild(navFrag);

    // Close sidebar on link click (mobile)
    sidebarNav.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      if (!isDesktop()) closeSidebar();
    });

    // Allow group-header links to work without toggling the details
    sidebarNav.querySelectorAll('.nav-group-summary a').forEach(anchor => {
      anchor.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  /* ── Active Navigation Tracking ──────────────────────────── */

  function setActiveNav(){
    const links = Array.from(document.querySelectorAll('.sidebar-nav a[href^="#"]'));
    const headings = Array.from(content.querySelectorAll('h1[id], h2[id]'));
    if (!links.length || !headings.length || !('IntersectionObserver' in window)) return;

    const linkMap = new Map();
    links.forEach(link => linkMap.set(link.getAttribute('href').slice(1), link));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        links.forEach(l => l.classList.remove('active'));
        const current = linkMap.get(id);
        if (current) {
          current.classList.add('active');
          const details = current.closest('details');
          if (details) details.open = true;
        }
      });
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });

    headings.forEach(h => observer.observe(h));
  }

  /* ── Sidebar Toggle (CLICK ONLY — no hover behavior) ─────── */

  function openSidebar(){
    if (isDesktop()) {
      document.body.classList.remove('sidebar-closed');
      if (navToggle) {
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
      }
    } else {
      document.body.classList.add('sidebar-open');
      if (sidebarBackdrop) sidebarBackdrop.hidden = false;
      if (navToggle) {
        navToggle.classList.add('active');
        navToggle.setAttribute('aria-expanded', 'true');
      }
    }
  }

  function closeSidebar(){
    if (isDesktop()) {
      document.body.classList.add('sidebar-closed');
      if (navToggle) {
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    } else {
      document.body.classList.remove('sidebar-open');
      if (sidebarBackdrop) sidebarBackdrop.hidden = true;
      if (navToggle) {
        navToggle.classList.remove('active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    }
  }

  function toggleSidebar(){
    if (isDesktop()) {
      const isClosed = document.body.classList.contains('sidebar-closed');
      if (isClosed) openSidebar();
      else closeSidebar();
    } else {
      const isOpen = document.body.classList.contains('sidebar-open');
      if (isOpen) closeSidebar();
      else openSidebar();
    }
  }

  if (navToggle) navToggle.addEventListener('click', toggleSidebar);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

  window.addEventListener('resize', () => {
    if (isDesktop()) {
      document.body.classList.remove('sidebar-open');
      if (sidebarBackdrop) sidebarBackdrop.hidden = true;
    }
  });

  if (isDesktop()) {
    document.body.classList.remove('sidebar-closed');
    if (navToggle) {
      navToggle.classList.add('active');
      navToggle.setAttribute('aria-expanded', 'true');
    }
  }

  /* ── Lightbox (Image Viewer) ─────────────────────────────── */

  function closeLightbox(){
    lightbox.classList.remove('open');
    lightboxImg.removeAttribute('src');
    document.body.style.overflow = '';
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  function bindLightbox() {
    content.querySelectorAll('img').forEach(img => {
      img.addEventListener('click', () => {
        lightboxImg.src = img.getAttribute('src');
        lightboxImg.alt = img.getAttribute('alt') || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  /* ── Search ──────────────────────────────────────────────── */

  const index = [];
  let activeIdx = -1;
  let lastResults = [];

  function rebuildSearchIndex(builds) {
    index.length = 0;
    for (const b of builds) {
      const skillNames = parseJsonField(b.captain_skills).map(s => s.name).join(', ');
      const searchText = [b.description, b.play_style_notes, b.alternative_notes, skillNames].filter(Boolean).join(' ');
      const catLabel = DISPLAY_CATEGORIES.find(c => c.type === b.ship_type && !!c.premium === !!b.is_premium)?.label || b.ship_type;
      index.push({
        id: `build-${b.id}`,
        title: `${b.ship_name} \u2014 ${b.title}`,
        section: catLabel,
        text: searchText,
        titleNorm: norm(`${b.ship_name} ${b.title}`),
        sectionNorm: norm(catLabel),
        textNorm: norm(searchText),
        get haystack(){ return `${this.titleNorm} ${this.sectionNorm} ${this.textNorm}`; }
      });
    }
  }

  function gotoEntry(entry){
    const el = document.getElementById(entry.id);
    if (!el) return;
    history.replaceState(null, '', `#${entry.id}`);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('search-hit');
    setTimeout(() => el.classList.remove('search-hit'), 1500);
    closeResults();
  }

  function closeResults(){
    resultsEl.classList.remove('open');
    resultsEl.innerHTML = '';
    activeIdx = -1;
    lastResults = [];
  }

  function makeSnippet(entry, q){
    const text = entry.text || '';
    if (!text) return '';
    const qn = norm(q);
    const hay = norm(text);
    let hitPos = hay.indexOf(qn);
    let hitLen = qn.length;
    if (hitPos < 0) {
      const t = qn.split(' ').filter(Boolean).find(token => hay.includes(token));
      if (t) { hitPos = hay.indexOf(t); hitLen = t.length; }
    }
    if (hitPos < 0) return text.slice(0, 160) + (text.length > 160 ? '\u2026' : '');
    const start = Math.max(0, hitPos - 70);
    const end = Math.min(text.length, hitPos + hitLen + 90);
    let snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snip = '\u2026 ' + snip;
    if (end < text.length) snip = snip + ' \u2026';
    return snip;
  }

  function renderResults(results, q){
    if (!results.length) {
      resultsEl.innerHTML = `<div class="result-item" aria-disabled="true"><div class="result-title">No matches</div><div class="result-meta">Try a ship name, line name, nation, or keyword.</div></div>`;
      resultsEl.classList.add('open');
      return;
    }
    resultsEl.innerHTML = results.map((r, i) => {
      const snippet = makeSnippet(r, q);
      const meta = r.section ? r.section : 'Build';
      return `
        <div class="result-item" role="option" data-i="${i}" aria-selected="false">
          <div class="result-title">${escapeHtml(r.title)}</div>
          <div class="result-meta">${escapeHtml(meta)}</div>
          ${snippet ? `<div class="result-snippet">${escapeHtml(snippet)}</div>` : ''}
        </div>
      `;
    }).join('');
    resultsEl.classList.add('open');
  }

  function runSearch(q){
    const qn = norm(q);
    if (!qn) { closeResults(); return; }
    const tokens = qn.split(' ').filter(Boolean);
    const results = [];
    for (const entry of index) {
      const haystack = entry.haystack;
      let score = 0;
      let ok = true;
      for (const t of tokens) {
        if (!haystack.includes(t)) { ok = false; break; }
        if (entry.titleNorm.includes(t)) score += 7;
        else if (entry.sectionNorm.includes(t)) score += 3;
        else score += 1;
      }
      if (ok) results.push({ ...entry, score });
    }
    results.sort((a, b) => (b.score - a.score) || a.title.localeCompare(b.title));
    lastResults = results.slice(0, 30);
    activeIdx = -1;
    renderResults(lastResults, q);
  }

  function setActive(i){
    const items = Array.from(resultsEl.querySelectorAll('.result-item[role="option"]'));
    items.forEach(el => el.classList.remove('active'));
    if (i < 0 || i >= items.length) { activeIdx = -1; return; }
    activeIdx = i;
    items[i].classList.add('active');
    items[i].scrollIntoView({ block: 'nearest' });
  }

  search.addEventListener('input', () => runSearch(search.value));
  search.addEventListener('keydown', (e) => {
    if (!resultsEl.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(activeIdx + 1, lastResults.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(activeIdx - 1, 0)); }
    else if (e.key === 'Enter') { if (activeIdx >= 0 && lastResults[activeIdx]) { e.preventDefault(); gotoEntry(lastResults[activeIdx]); } }
    else if (e.key === 'Escape') { closeResults(); }
  });

  resultsEl.addEventListener('click', (e) => {
    const item = e.target.closest('.result-item[role="option"]');
    if (!item) return;
    const i = parseInt(item.getAttribute('data-i') || '-1', 10);
    if (Number.isFinite(i) && lastResults[i]) gotoEntry(lastResults[i]);
  });

  document.addEventListener('click', (e) => {
    if (e.target === search || e.target.closest('.search-wrap')) return;
    closeResults();
  });

  /* ── Scroll Margin for Anchor Links ──────────────────────── */

  function addScrollMargin(){
    const margin = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-total')) || 108) + 16 + 'px';
    content.querySelectorAll('h1[id],h2[id],.build-card[id]').forEach(el => {
      el.style.scrollMarginTop = margin;
    });
  }

  /* ── Go-to-Top Button ─────────────────────────────────────── */

  function initGoToTop() {
    const btn = document.createElement('button');
    btn.className = 'go-to-top';
    btn.innerHTML = '&#9650;';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.title = 'Back to top';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    let visible = false;
    window.addEventListener('scroll', () => {
      const shouldShow = window.scrollY > 400;
      if (shouldShow !== visible) {
        visible = shouldShow;
        btn.classList.toggle('visible', visible);
      }
    }, { passive: true });
  }

  /* ── Initialize ──────────────────────────────────────────── */

  async function init() {
    // Load icons first (needed for build card rendering)
    await loadIconMaps();

    // Load all data in parallel
    await Promise.allSettled([
      loadPageContent(),
      loadAllBuilds(),
      loadFullChangelog()
    ]);

    // Build navigation from loaded data
    buildNavFromData();

    // Set up active nav tracking
    setActiveNav();

    // Add scroll margins
    addScrollMargin();

    // Bind lightbox to images
    bindLightbox();

    // Go-to-top button
    initGoToTop();
  }

  init();

})();
