/* trace.log — no frameworks, no trackers, no external JS dependencies. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const base = window.TRACE_BASEURL || '';

  // Theme preference
  const themeButton = $('.theme-toggle');
  function updateThemeButton() {
    if (!themeButton) return;
    const light = document.documentElement.dataset.theme === 'light';
    themeButton.setAttribute('aria-label', light ? '다크 테마 켜기' : '라이트 테마 켜기');
    themeButton.setAttribute('title', light ? '다크 테마 켜기' : '라이트 테마 켜기');
  }
  updateThemeButton();
  themeButton?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('trace-theme', next); } catch (_) { /* optional storage */ }
    updateThemeButton();
  });

  // Mobile navigation
  const menuButton = $('.mobile-toggle');
  const mobileNav = $('#mobile-navigation');
  function closeMobileNav() {
    if (!mobileNav || !menuButton) return;
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '모바일 메뉴 열기');
  }
  menuButton?.addEventListener('click', () => {
    mobileNav.hidden = !mobileNav.hidden;
    const open = !mobileNav.hidden;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '모바일 메뉴 닫기' : '모바일 메뉴 열기');
  });
  $$('a', mobileNav || document.createElement('nav')).forEach(a => a.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMobileNav(); });

  // Archive category filtering
  const filters = $$('.filter-button');
  filters.forEach(button => button.addEventListener('click', () => {
    const selected = button.dataset.category;
    filters.forEach(b => {
      const active = b === button;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
    let visibleCount = 0;
    $$('.archive-item').forEach(item => {
      const visible = selected === 'all' || selected === item.dataset.category;
      item.hidden = !visible;
      if (visible) visibleCount++;
    });
    const empty = $('.archive-empty');
    if (empty) empty.hidden = visibleCount > 0;
  }));

  // Built-in site search. The index is compiled automatically by Jekyll.
  const dialog = $('#search-dialog');
  const input = $('#site-search-input');
  const results = $('#site-search-results');
  const hint = $('.search-hint');
  let searchIndex;
  let request;
  const normalize = s => String(s || '').toLocaleLowerCase('ko').trim();
  const categoryNames = {
    'development': '개발', 'ctf-wargame': 'CTF/Wargame',
    'bug-bounty': 'Bug Bounty', 'docs': '블로그/기술문서',
    'research': '논문/컨퍼런스', 'activities': '공모전/자격증'
  };
  const make = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value) node.textContent = value;
    return node;
  };
  async function getIndex() {
    if (searchIndex) return searchIndex;
    if (!request) {
      request = fetch(`${base}/search.json`).then(response => {
        if (!response.ok) throw new Error('Search index unavailable');
        return response.json();
      }).then(data => { searchIndex = data; return data; }).catch(err => { request = undefined; throw err; });
    }
    return request;
  }
  async function updateResults() {
    if (!input || !results) return;
    const q = normalize(input.value);
    results.replaceChildren();
    if (q.length === 0) {
      hint.hidden = false;
      return;
    }
    hint.hidden = true;
    try {
      const posts = await getIndex();
      if (q !== normalize(input.value)) return;
      const tokens = q.split(/\s+/);
      const matched = posts.filter(post => {
        const haystack = normalize([post.title, post.description, categoryNames[post.category], ...(post.tags || []), post.content].join(' '));
        return tokens.every(token => haystack.includes(token));
      }).slice(0, 12);
      if (!matched.length) {
        results.append(make('p', 'search-empty', '검색 결과가 없습니다. 다른 키워드로 검색해 보세요.'));
        return;
      }
      matched.forEach(post => {
        const a = make('a', 'search-result');
        // URLs are produced by the local Jekyll index, not an external API.
        a.href = post.url;
        a.append(make('div', 'search-result-title', post.title));
        a.append(make('div', 'search-result-meta', `${categoryNames[post.category] || '기록'} / ${post.date}`));
        results.append(a);
      });
    } catch (_) {
      results.append(make('p', 'search-empty', '검색 인덱스를 불러오지 못했습니다. 배포 후 다시 시도해 주세요.'));
    }
  }
  input?.addEventListener('input', updateResults);
  function openSearch() {
    if (!dialog?.showModal) return;
    if (!dialog.open) dialog.showModal();
    input?.focus();
    getIndex().catch(() => {});
  }
  $$('.search-toggle').forEach(btn => btn.addEventListener('click', openSearch));
  $('.close-search')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  document.addEventListener('keydown', event => {
    const target = event.target;
    const editing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !editing)) {
      event.preventDefault();
      openSearch();
    }
  });

  $('.copy-url')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(location.href);
      const original = button.textContent;
      button.textContent = '복사 완료 ✓';
      setTimeout(() => { button.textContent = original; }, 1700);
    } catch (_) {
      button.textContent = '주소창에서 링크를 복사해 주세요';
    }
  });
})();
