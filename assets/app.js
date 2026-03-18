/* ═══════════════════════════════════════════════════════════════
   WoWS Captain Builds — Application Logic
   Sidebar: Click-only toggle (no hover/reactive behavior)
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

  /* ── Premium category name mapping ───────────────────────── */

  const premiumCategoryMap = {
    'destroyers': 'Premium/Special Destroyers',
    'cruisers': 'Premium/Special Cruisers',
    'battleships': 'Premium/Special Battleships',
    'aircraft carriers': 'Premium/Special Aircraft Carriers',
    'submarines': 'Premium/Special Submarines'
  };

  function getDisplayGroupTitle(title, seenCounts){
    const key = norm(title);
    const count = (seenCounts.get(key) || 0) + 1;
    seenCounts.set(key, count);
    if (count >= 2 && premiumCategoryMap[key]) return premiumCategoryMap[key];
    return title;
  }

  /* ── Content Structure ───────────────────────────────────── */

  function ensureIntroductionSection(){
    const firstH1 = content.querySelector('h1[id]');
    if (!firstH1) return;
    firstH1.id = 'introduction';
    const label = firstH1.textContent.trim();
    if (!label || norm(label) !== 'captain builds') {
      firstH1.textContent = 'Captain Builds';
    }
  }

  function wrapPageSections(){
    ensureIntroductionSection();
    const kids = Array.from(content.childNodes);
    const frag = document.createDocumentFragment();

    let intro = document.createElement('section');
    intro.className = 'page-section page-section-intro';
    intro.dataset.section = 'introduction';
    intro.id = 'page-introduction';
    let current = intro;
    let pageIndex = 0;

    function newSection(h2){
      pageIndex += 1;
      const sec = document.createElement('section');
      sec.className = 'page-section';
      sec.dataset.section = (h2.id || ('section-' + pageIndex));
      sec.dataset.variant = String((pageIndex % 6) + 1);
      sec.id = 'page-' + sec.dataset.section;
      return sec;
    }

    for (const node of kids){
      if (node.nodeType === 1 && node.tagName === 'H2' && (node.textContent || '').trim()) {
        frag.appendChild(current);
        current = newSection(node);
      }
      current.appendChild(node);
    }
    frag.appendChild(current);
    content.appendChild(frag);
  }

  /* ── Sidebar Navigation Builder ──────────────────────────── */

  function makeNav(){
    if (!sidebarNav) return;
    const sections = Array.from(content.querySelectorAll('.page-section'));
    const specialItems = [];
    const groups = [];
    const seenCounts = new Map();

    const introH1 = content.querySelector('#introduction');
    if (introH1) {
      specialItems.push({ title: 'Introduction', id: 'introduction' });
    }

    sections.forEach(sec => {
      const h2 = sec.querySelector('h2[id]');
      if (!h2) return;
      const title = (h2.textContent || '').trim();
      const displayTitle = getDisplayGroupTitle(title, seenCounts);
      const items = Array.from(sec.querySelectorAll('h3[id]'))
        .map(h3 => ({ title: (h3.textContent || '').trim(), id: h3.id }))
        .filter(item => item.title && item.id);
      groups.push({ title: displayTitle, id: h2.id, items, open: false });
    });

    const navFrag = document.createDocumentFragment();

    if (specialItems.length) {
      const list = document.createElement('ul');
      list.className = 'nav-list nav-list-top';
      specialItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.innerHTML = `<a href="#${item.id}" class="nav-link nav-link-top">${escapeHtml(item.title)}</a>`;
        list.appendChild(li);
      });
      navFrag.appendChild(list);
    }

    groups.forEach(group => {
      const details = document.createElement('details');
      details.className = 'nav-group';
      if (group.open) details.open = true;
      details.dataset.target = group.id;
      const summary = document.createElement('summary');
      summary.className = 'nav-group-summary';
      summary.innerHTML = `<span class="nav-group-label"><a href="#${group.id}" class="nav-group-link">${escapeHtml(group.title)}</a></span><span class="nav-chevron" aria-hidden="true"></span>`;
      details.appendChild(summary);

      const list = document.createElement('ul');
      list.className = 'nav-list nav-list-builds';
      group.items.forEach(item => {
        const li = document.createElement('li');
        li.className = 'nav-item nav-item-build';
        li.innerHTML = `<a href="#${item.id}" class="nav-link">${escapeHtml(item.title)}</a>`;
        list.appendChild(li);
      });
      details.appendChild(list);
      navFrag.appendChild(details);
    });

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
    const headings = Array.from(content.querySelectorAll('h1[id], h2[id], h3[id]')).filter(h => h.id);
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

  // Toggle button click
  if (navToggle) {
    navToggle.addEventListener('click', toggleSidebar);
  }

  // Backdrop click closes sidebar (mobile)
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }

  // Handle resize: reset mobile state when going to desktop
  window.addEventListener('resize', () => {
    if (isDesktop()) {
      document.body.classList.remove('sidebar-open');
      if (sidebarBackdrop) sidebarBackdrop.hidden = true;
    }
  });

  // Default state: sidebar OPEN on desktop, closed on mobile
  if (isDesktop()) {
    document.body.classList.remove('sidebar-closed');
    if (navToggle) {
      navToggle.classList.add('active');
      navToggle.setAttribute('aria-expanded', 'true');
    }
  }

  /* ── Lightbox (Image Viewer) ─────────────────────────────── */

  content.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.getAttribute('src');
      lightboxImg.alt = img.getAttribute('alt') || '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

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

  /* ── Search ──────────────────────────────────────────────── */

  const index = [];
  let currentSection = 'Introduction';
  content.querySelectorAll('h1, h2, h3').forEach(h => {
    const tag = h.tagName.toLowerCase();
    const title = (h.textContent || '').replace(/\s+/g, ' ').trim();
    if (tag === 'h2' && title) currentSection = title;
    if (tag === 'h3' && h.id && title) {
      const parts = [];
      let node = h.nextElementSibling;
      while (node && !(node.tagName === 'H3' || node.tagName === 'H2')) {
        parts.push(node.textContent || '');
        node = node.nextElementSibling;
      }
      const text = parts.join(' ').replace(/\s+/g, ' ').trim();
      index.push({
        id: h.id,
        title,
        section: currentSection,
        text,
        titleNorm: norm(title),
        sectionNorm: norm(currentSection),
        textNorm: norm(text),
        get haystack(){ return `${this.titleNorm} ${this.sectionNorm} ${this.textNorm}`; }
      });
    }
  });

  let activeIdx = -1;
  let lastResults = [];

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
    if (hitPos < 0) return text.slice(0, 160) + (text.length > 160 ? '…' : '');
    const start = Math.max(0, hitPos - 70);
    const end = Math.min(text.length, hitPos + hitLen + 90);
    let snip = text.slice(start, end).replace(/\s+/g, ' ').trim();
    if (start > 0) snip = '… ' + snip;
    if (end < text.length) snip = snip + ' …';
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
    if (!qn) {
      closeResults();
      return;
    }
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
    if (i < 0 || i >= items.length) {
      activeIdx = -1;
      return;
    }
    activeIdx = i;
    items[i].classList.add('active');
    items[i].scrollIntoView({ block: 'nearest' });
  }

  search.addEventListener('input', () => runSearch(search.value));
  search.addEventListener('keydown', (e) => {
    if (!resultsEl.classList.contains('open')) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, lastResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && lastResults[activeIdx]) {
        e.preventDefault();
        gotoEntry(lastResults[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      closeResults();
    }
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
    content.querySelectorAll('h1[id],h2[id],h3[id]').forEach(h => {
      h.style.scrollMarginTop = margin;
    });
  }

  /* ── Dynamic Builds from Backend API ────────────────────── */

  const API_BASE = 'http://localhost:3000/api';

  const TIER_ROMAN = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII',8:'VIII',9:'IX',10:'X',11:'XI'};
  const CATEGORY_ORDER = ['Destroyer','Cruiser','Battleship','AirCarrier','Submarine'];
  const CATEGORY_LABELS = {
    'Destroyer': 'Destroyers',
    'Cruiser': 'Cruisers',
    'Battleship': 'Battleships',
    'AirCarrier': 'Aircraft Carriers',
    'Submarine': 'Submarines'
  };

  // Icon maps + skill grids loaded from backend (WoWS API data)
  let skillIcons = {};
  let upgradeIcons = {};
  let skillGrids = {}; // { Battleship: [{name,icon,tier,col},...], ... }

  // Map our ship_type values to WoWS API class names
  const SHIP_TYPE_TO_CLASS = {
    'Destroyer': 'Destroyer',
    'Cruiser': 'Cruiser',
    'Battleship': 'Battleship',
    'AirCarrier': 'AirCarrier',
    'Submarine': 'Submarine'
  };

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

  function renderBuildCard(build) {
    const selectedSkills = parseJsonField(build.captain_skills);
    const upgrades = parseJsonField(build.upgrades);
    const tags = build.tags || [];

    // Build a set of selected skill names with their pick order
    const selectedMap = new Map();
    if (Array.isArray(selectedSkills)) {
      selectedSkills.forEach((sk, i) => selectedMap.set(sk.name, i + 1));
    }
    const totalPts = Array.isArray(selectedSkills)
      ? selectedSkills.reduce((s, sk) => s + (parseInt(sk.cost) || parseInt(sk.tier) || 0), 0)
      : 0;

    // --- Ship header (matches ShipBuilder style) ---
    const tierStr = TIER_ROMAN[build.ship_tier] || build.ship_tier;

    // --- Full skill grid (4 rows × 6 cols like in-game) ---
    const shipClass = SHIP_TYPE_TO_CLASS[build.ship_type] || build.ship_type;
    const grid = skillGrids[shipClass] || [];
    let skillGridHtml = '';

    if (grid.length) {
      // Group by tier (row)
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

    // --- Upgrades strip at bottom ---
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

    // --- Notes below the card ---
    let notesHtml = '';
    const noteItems = [];
    if (build.description) noteItems.push(build.description);
    if (build.play_style_notes) noteItems.push(build.play_style_notes);
    if (build.alternative_notes) noteItems.push(build.alternative_notes);
    if (noteItems.length) {
      notesHtml = `<ul class="bc-notes">${noteItems.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`;
    }

    let tagsHtml = '';
    if (tags.length) {
      tagsHtml = `<div class="build-card-tags">${tags.map(t => `<span class="build-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
    }

    return `
      <div class="build-card" id="dynamic-build-${build.id}">
        <div class="bc-header">
          <div class="bc-ship-info">
            <span class="bc-tier">${escapeHtml(tierStr)}</span>
            <span class="bc-ship-name">${escapeHtml(build.ship_name)}</span>
          </div>
          <div class="bc-build-name">Build: ${escapeHtml(build.title)}</div>
        </div>
        <div class="bc-body">
          ${skillGridHtml}
          ${upgradesHtml}
        </div>
        ${notesHtml}
        ${tagsHtml}
      </div>
    `;
  }

  // Map ship_type to the existing h2 section IDs in the page
  const TYPE_TO_SECTION_ID = {
    'Destroyer':   'destroyers',
    'Cruiser':     'cruisers',
    'Battleship':  'battleships',
    'AirCarrier':  'aircraft-carriers',
    'Submarine':   'submarines'
  };

  async function loadDynamicBuilds() {
    try {
      // Load icon maps first so build cards can render with icons
      await loadIconMaps();

      const res = await fetch(`${API_BASE}/builds?limit=200`);
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      const builds = data.builds || data;

      if (!builds || !builds.length) return;

      // Group by ship_type
      const grouped = {};
      for (const b of builds) {
        const type = b.ship_type || 'Other';
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(b);
      }

      // Sort within each group by tier descending, then ship name
      for (const type of Object.keys(grouped)) {
        grouped[type].sort((a, b) => (b.ship_tier - a.ship_tier) || a.ship_name.localeCompare(b.ship_name));
      }

      // Inject builds into existing page sections
      for (const type of CATEGORY_ORDER) {
        if (!grouped[type] || !grouped[type].length) continue;
        const sectionId = TYPE_TO_SECTION_ID[type];
        if (!sectionId) continue;

        // Find the existing section wrapper (created by wrapPageSections)
        const section = content.querySelector(`#page-${sectionId}`) ||
                        content.querySelector(`.page-section h2#${sectionId}`)?.closest('.page-section');
        if (!section) continue;

        // Create a container for dynamic build cards
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'dynamic-builds-section';
        cardsContainer.id = `dynamic-${type.toLowerCase()}`;
        cardsContainer.innerHTML = `
          <div class="build-cards-grid">
            ${grouped[type].map(b => renderBuildCard(b)).join('')}
          </div>
        `;

        // Insert after the h2 heading (before the first h3 ship entry)
        const firstH3 = section.querySelector('h3');
        if (firstH3) {
          section.insertBefore(cardsContainer, firstH3);
        } else {
          section.appendChild(cardsContainer);
        }
      }

      // Add builds to the search index
      for (const b of builds) {
        const skillNames = parseJsonField(b.captain_skills).map(s => s.name).join(', ');
        const searchText = [b.description, b.play_style_notes, b.alternative_notes, skillNames].filter(Boolean).join(' ');
        index.push({
          id: `dynamic-build-${b.id}`,
          title: `${b.ship_name} — ${b.title}`,
          section: CATEGORY_LABELS[b.ship_type] || b.ship_type,
          text: searchText,
          titleNorm: norm(`${b.ship_name} ${b.title}`),
          sectionNorm: norm(CATEGORY_LABELS[b.ship_type] || b.ship_type),
          textNorm: norm(searchText),
          get haystack(){ return `${this.titleNorm} ${this.sectionNorm} ${this.textNorm}`; }
        });
      }

    } catch (err) {
      // Backend not available — silently show static content only
      console.log('Dynamic builds: API not available, showing static content only.');
    }
  }

  /* ── Dynamic Changelog from Backend API ─────────────────── */

  async function loadDynamicChangelog() {
    try {
      const res = await fetch(`${API_BASE}/changelog?limit=50`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.length) return;

      // Find the existing change-log section
      const changelogH3 = document.getElementById('change-log');
      if (!changelogH3) return;

      // Find the existing UL after the h3
      let existingUl = changelogH3.nextElementSibling;
      while (existingUl && existingUl.tagName !== 'UL') existingUl = existingUl.nextElementSibling;

      // Build dynamic entries and prepend to existing changelog
      const dynamicEntries = document.createElement('div');
      dynamicEntries.className = 'dynamic-changelog';

      for (const group of data) {
        const header = document.createElement('li');
        header.innerHTML = `<strong>Update: ${escapeHtml(group.date)}</strong>`;

        const subList = document.createElement('ul');
        for (const item of group.items) {
          const li = document.createElement('li');
          li.textContent = item;
          subList.appendChild(li);
        }

        if (existingUl) {
          // Prepend before existing entries
          existingUl.insertBefore(subList, existingUl.firstChild);
          existingUl.insertBefore(header, existingUl.firstChild);
        }
      }
    } catch {
      // Changelog API not available — keep static entries only
    }
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

  wrapPageSections();
  makeNav();
  setActiveNav();
  addScrollMargin();
  loadDynamicBuilds();
  loadDynamicChangelog();
  initGoToTop();

})();
