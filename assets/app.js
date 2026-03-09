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
  let sidebarPinned = false;
  let hoverCloseTimer = null;


  function norm(s){
    return String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

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

    const groupsEls = Array.from(sidebarNav.querySelectorAll('.nav-group'));
    groupsEls.forEach(groupEl => {
      groupEl.addEventListener('mouseenter', () => {
        if (isDesktop()) groupEl.open = true;
      });
      groupEl.addEventListener('mouseleave', () => {
        if (!isDesktop()) return;
        if (groupEl.querySelector('.active')) return;
        groupEl.open = false;
      });
    });

    sidebarNav.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      if (window.innerWidth <= 980) closeSidebar();
    });

    sidebarNav.querySelectorAll('.nav-group-summary a').forEach(anchor => {
      anchor.addEventListener('click', (e) => e.stopPropagation());
    });
  }

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

  function isDesktop(){
    return window.innerWidth > 980;
  }

  function openSidebarTransient(){
    if (!isDesktop() || sidebarPinned) return;
    clearTimeout(hoverCloseTimer);
    document.body.classList.remove('sidebar-collapsed');
    document.body.classList.add('sidebar-hover-open');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
  }

  function closeSidebarTransient(immediate){
    if (!isDesktop() || sidebarPinned) return;
    clearTimeout(hoverCloseTimer);
    const apply = () => {
      document.body.classList.add('sidebar-collapsed');
      document.body.classList.remove('sidebar-hover-open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    };
    if (immediate) apply();
    else hoverCloseTimer = setTimeout(apply, 180);
  }

  function setupReactiveSidebar(){
    if (!sidebar || !isDesktop()) return;
    document.body.classList.add('sidebar-collapsed');
    document.body.classList.add('sidebar-reactive');

    sidebar.addEventListener('mouseenter', openSidebarTransient);
    sidebar.addEventListener('mouseleave', () => closeSidebarTransient(false));
    document.addEventListener('mousemove', (e) => {
      if (!isDesktop() || sidebarPinned) return;
      const inHotZone = e.clientX <= 32;
      const overSidebar = e.target && e.target.closest && !!e.target.closest('#sidebar');
      const overTopbar = e.target && e.target.closest && !!e.target.closest('.topbar');
      if (inHotZone || overSidebar || (overTopbar && e.clientX < 90)) {
        openSidebarTransient();
      } else if (e.clientX > 380 && !overSidebar) {
        closeSidebarTransient(false);
      }
    });
  }

  function toggleSidebar(forceOpen){
    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : document.body.classList.contains('sidebar-collapsed');
    if (window.innerWidth <= 980) {
      document.body.classList.toggle('sidebar-open', shouldOpen);
      if (sidebarBackdrop) sidebarBackdrop.hidden = !shouldOpen;
      if (navToggle) navToggle.setAttribute('aria-expanded', String(shouldOpen));
      return;
    }
    sidebarPinned = shouldOpen;
    document.body.classList.toggle('sidebar-pinned', shouldOpen);
    document.body.classList.toggle('sidebar-reactive', !shouldOpen);
    document.body.classList.toggle('sidebar-collapsed', !shouldOpen);
    document.body.classList.toggle('sidebar-hover-open', false);
    if (navToggle) navToggle.setAttribute('aria-expanded', String(shouldOpen));
  }

  function closeSidebar(){
    if (window.innerWidth <= 980) {
      document.body.classList.remove('sidebar-open');
      if (sidebarBackdrop) sidebarBackdrop.hidden = true;
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }
  }

  if (navToggle) navToggle.addEventListener('click', () => {
    if (window.innerWidth <= 980) {
      toggleSidebar(!document.body.classList.contains('sidebar-open'));
    } else {
      toggleSidebar(document.body.classList.contains('sidebar-collapsed'));
    }
  });
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) {
      document.body.classList.remove('sidebar-open');
      if (sidebarBackdrop) sidebarBackdrop.hidden = true;
      if (!sidebarPinned) {
        document.body.classList.add('sidebar-reactive');
        document.body.classList.add('sidebar-collapsed');
      }
    } else {
      document.body.classList.remove('sidebar-reactive', 'sidebar-hover-open', 'sidebar-collapsed');
    }
  });

  // Lightbox for clicked images
  content.querySelectorAll('img').forEach(img => {
    img.addEventListener('click', ()=>{
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
  lightbox.addEventListener('click', (e)=>{ if(e.target === lightbox) closeLightbox(); });
  lightboxClose.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox(); });

  // Build search index from H3s (ship/build entries), grouped by nearest H2 section
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
    if(!el) return;
    history.replaceState(null, '', `#${entry.id}`);
    el.scrollIntoView({behavior:'smooth', block:'start'});
    el.classList.add('search-hit');
    setTimeout(()=> el.classList.remove('search-hit'), 1500);
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
    if(!text) return '';
    const qn = norm(q);
    const hay = norm(text);
    let hitPos = hay.indexOf(qn);
    let hitLen = qn.length;
    if(hitPos < 0){
      const t = qn.split(' ').filter(Boolean).find(token => hay.includes(token));
      if(t){ hitPos = hay.indexOf(t); hitLen = t.length; }
    }
    if(hitPos < 0) return text.slice(0, 160) + (text.length > 160 ? '…' : '');
    const start = Math.max(0, hitPos - 70);
    const end = Math.min(text.length, hitPos + hitLen + 90);
    let snip = text.slice(start, end).replace(/\s+/g,' ').trim();
    if(start > 0) snip = '… ' + snip;
    if(end < text.length) snip = snip + ' …';
    return snip;
  }

  function renderResults(results, q){
    if(!results.length){
      resultsEl.innerHTML = `<div class="result-item" aria-disabled="true"><div class="result-title">No matches</div><div class="result-meta">Try a ship name, line name, nation, or keyword.</div></div>`;
      resultsEl.classList.add('open');
      return;
    }
    resultsEl.innerHTML = results.map((r,i)=>{
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

  function escapeHtml(s){
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function runSearch(q){
    const qn = norm(q);
    if(!qn){
      closeResults();
      return;
    }
    const tokens = qn.split(' ').filter(Boolean);
    const results = [];
    for(const entry of index){
      const haystack = entry.haystack;
      let score = 0;
      let ok = true;
      for(const t of tokens){
        if(!haystack.includes(t)) { ok = false; break; }
        if(entry.titleNorm.includes(t)) score += 7;
        else if(entry.sectionNorm.includes(t)) score += 3;
        else score += 1;
      }
      if(ok) results.push({ ...entry, score });
    }
    results.sort((a,b)=> (b.score - a.score) || a.title.localeCompare(b.title));
    lastResults = results.slice(0, 30);
    activeIdx = -1;
    renderResults(lastResults, q);
  }

  function setActive(i){
    const items = Array.from(resultsEl.querySelectorAll('.result-item[role="option"]'));
    items.forEach(el=> el.classList.remove('active'));
    if(i < 0 || i >= items.length){
      activeIdx = -1;
      return;
    }
    activeIdx = i;
    items[i].classList.add('active');
    items[i].scrollIntoView({block:'nearest'});
  }

  search.addEventListener('input', ()=> runSearch(search.value));
  search.addEventListener('keydown', (e)=>{
    if(!resultsEl.classList.contains('open')) return;
    if(e.key === 'ArrowDown'){
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, lastResults.length - 1));
    } else if(e.key === 'ArrowUp'){
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, 0));
    } else if(e.key === 'Enter'){
      if(activeIdx >= 0 && lastResults[activeIdx]){
        e.preventDefault();
        gotoEntry(lastResults[activeIdx]);
      }
    } else if(e.key === 'Escape'){
      closeResults();
    }
  });

  resultsEl.addEventListener('click', (e)=>{
    const item = e.target.closest('.result-item[role="option"]');
    if(!item) return;
    const i = parseInt(item.getAttribute('data-i')||'-1', 10);
    if(Number.isFinite(i) && lastResults[i]) gotoEntry(lastResults[i]);
  });

  document.addEventListener('click', (e)=>{
    if(e.target === search || e.target.closest('.search-wrap')) return;
    closeResults();
  });

  function addScrollMargin(){
    content.querySelectorAll('h1[id],h2[id],h3[id]').forEach(h=>{
      h.style.scrollMarginTop = '88px';
    });
  }

  setupReactiveSidebar();
  wrapPageSections();
  makeNav();
  setActiveNav();
  addScrollMargin();
})();
