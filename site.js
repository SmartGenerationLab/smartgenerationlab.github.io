// 테마(시스템·라이트·다크) · 모바일 메뉴 · 필터/검색 · 히어로 점 필드. 색은 colors.css 변수에서 읽는다 — HEX 직접 기입 없음.
(function () {
  'use strict';
  const root = document.documentElement;
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const params = new URLSearchParams(location.search);
  if (params.get('theme') === 'dark' || params.get('theme') === 'light') { root.dataset.themeMode = params.get('theme'); root.dataset.theme = params.get('theme'); }

  // ---- 테마: 모드(auto·light·dark)는 저장, 실제 테마는 모드가 auto면 시스템을 따른다 ----
  const toggle = document.querySelector('[data-theme-toggle]');
  const MODES = ['auto', 'light', 'dark'], NAMES = { auto: '시스템 설정', light: '라이트', dark: '다크' };
  let field = null;
  function applyMode(mode) {
    root.dataset.themeMode = mode;
    root.dataset.theme = mode === 'auto' ? (mq.matches ? 'dark' : 'light') : mode;
    try { if (mode === 'auto') localStorage.removeItem('sgl-theme'); else localStorage.setItem('sgl-theme', mode); } catch (e) { /* 저장 불가 환경 */ }
    if (toggle) toggle.setAttribute('aria-label', `테마: ${NAMES[mode]}${mode === 'auto' ? ` (현재 ${NAMES[root.dataset.theme]})` : ''}`);
    if (field) field.recolor();
  }
  if (toggle) toggle.addEventListener('click', () => applyMode(MODES[(MODES.indexOf(root.dataset.themeMode || 'auto') + 1) % MODES.length]));
  mq.addEventListener('change', () => { if ((root.dataset.themeMode || 'auto') === 'auto') applyMode('auto'); });
  applyMode(root.dataset.themeMode || 'auto');

  // ---- 모바일 메뉴 ----
  const menu = document.querySelector('[data-menu-toggle]'), header = document.querySelector('.site-header');
  if (menu && header) {
    menu.addEventListener('click', () => { const open = header.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('open')) { header.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
  }

  // ---- 필터(칩) + 검색: data-filter 칩이 data-area / data-kind 항목을 거른다 ----
  const chips = [...document.querySelectorAll('.chip[data-filter]')];
  const q = document.getElementById('pub-q');
  if (chips.length) {
    const items = [...document.querySelectorAll('[data-area], .timeline li[data-kind]')];
    const groups = [...document.querySelectorAll('.pub-year, .act-year')];
    const count = document.getElementById('pub-count'), empty = document.getElementById('pub-empty');
    let filter = '';
    function run() {
      const text = (q ? q.value : '').trim().toLowerCase();
      let n = 0;
      for (const el of items) {
        const key = el.dataset.area || el.dataset.kind;
        const ok = (!filter || key === filter) && (!text || (el.dataset.text || el.textContent.toLowerCase()).includes(text));
        el.hidden = !ok; if (ok) n++;
      }
      for (const g of groups) g.hidden = ![...g.querySelectorAll('li')].some((li) => !li.hidden);
      if (count) count.textContent = filter || text ? `${n}편` : '';
      if (empty) empty.hidden = n > 0;
    }
    for (const c of chips) c.addEventListener('click', () => { filter = c.dataset.filter; chips.forEach((x) => x.classList.toggle('on', x === c)); run(); });
    if (q) q.addEventListener('input', run);
    // #키 로 들어온 경우 해당 항목이 필터에 가려지지 않게 전체로 둔다
    run();
  }

  // ---- 이메일 서명 복사 (HTML은 text/html + text/plain 둘 다 넣는다) ----
  const sigPrev = document.getElementById('sig-preview'), sigStatus = document.getElementById('sig-status');
  for (const b of document.querySelectorAll('[data-copy-sig]')) b.addEventListener('click', async () => {
    const text = document.getElementById('sig-text').value;
    try {
      if (b.dataset.copySig === 'html' && navigator.clipboard.write && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([sigPrev.innerHTML], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
      } else await navigator.clipboard.writeText(text);
      sigStatus.textContent = b.dataset.copySig === 'html' ? '복사했습니다. 서명 편집기에 붙여 넣으세요.' : '텍스트 서명을 복사했습니다.';
    } catch (e) { sigStatus.textContent = '복사가 막혔습니다. 미리보기를 드래그해 복사하세요.'; }
  });

  // ---- 히어로 점 필드 — brand-v2.html field() 이식. opacity 대신 합성색을 애니메이션 ----
  const host = document.getElementById('hero-field');
  if (host) {
    const cols = +host.dataset.cols || 12, rows = +host.dataset.rows || 12;
    const avail = host.parentElement.clientWidth || 448;
    const sp = Math.max(18, Math.min(+host.dataset.sp || 40, Math.floor((avail - 8) / (cols - 1) / 1.25)));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
    host.style.width = (cols - 1) * sp + 8 + 'px';
    host.style.height = (rows - 1) * sp + 8 + 'px';
    const dots = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const n = r * cols + c, xf = c / (cols - 1), s = Math.pow(1 - xf, 1.5), J = s * sp * 2.6;
        const isGold = r === 0 && c === 0;
        const jx = isGold ? 0 : (hash(n) - 0.5) * 2 * J, jy = isGold ? 0 : (hash(n + 7777) - 0.5) * 2 * J;
        const sz = sp * 0.1 + xf * sp * 0.16;
        const el = document.createElement('i');
        el.style.left = c * sp + 'px'; el.style.top = r * sp + 'px';
        el.style.width = sz + 'px'; el.style.height = sz + 'px';
        el.style.borderRadius = (50 - xf * 30) + '%';
        el.style.transitionDelay = reduce ? '0s' : xf * 1.1 + 's';
        host.appendChild(el);
        dots.push({ el, jx, jy, xf, isGold });
      }
    let colors = null, converged = false;
    function palette() {
      const css = getComputedStyle(root), v = (n) => css.getPropertyValue(n).trim();
      const dark = root.dataset.theme === 'dark';
      const bg = dark ? v('--sgl-ink') : v('--sgl-paper'), fg = dark ? v('--sgl-paper') : v('--sgl-ink');
      const gold = dark ? v('--sgl-gold') : v('--sgl-gold-deep');
      const ch = (h, i) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
      const blend = (a) => '#' + [0, 1, 2].map((i) => Math.round(ch(bg, i) + (ch(fg, i) - ch(bg, i)) * a).toString(16).padStart(2, '0')).join('');
      colors = { gold, on: (xf) => blend(0.18 + xf * 0.82), off: (xf) => blend(0.08 + xf * 0.3) };
    }
    function paint() {
      const m = converged ? 1 : 2.4;
      for (const d of dots) {
        d.el.style.transform = `translate(${d.jx * m}px, ${d.jy * m}px)`;
        d.el.style.backgroundColor = d.isGold ? colors.gold : converged ? colors.on(d.xf) : colors.off(d.xf);
      }
    }
    field = { recolor() { palette(); paint(); } };
    palette();
    if (reduce) { converged = true; paint(); }
    else {
      converged = false; paint();
      setTimeout(() => { converged = true; paint(); }, 500);
      setInterval(() => { converged = false; paint(); setTimeout(() => { converged = true; paint(); }, 1400); }, 11000);
    }
  }
})();
