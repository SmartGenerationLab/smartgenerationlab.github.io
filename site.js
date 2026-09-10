// 테마 전환 + 히어로 점 필드. 색은 colors.css 변수에서 읽는다 — HEX 직접 기입 없음.
(function () {
  'use strict';
  const root = document.documentElement;
  const params = new URLSearchParams(location.search);
  if (params.get('theme') === 'dark' || params.get('theme') === 'light') root.dataset.theme = params.get('theme');

  // ---- 테마 토글 (localStorage 저장) ----
  const toggle = document.querySelector('[data-theme-toggle]');
  function applyTheme(name) {
    root.dataset.theme = name;
    try { localStorage.setItem('sgl-theme', name); } catch (e) { /* 저장 불가 환경 */ }
    if (field) field.recolor();
  }
  if (toggle) toggle.addEventListener('click', () => applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  // ---- 모바일 메뉴 ----
  const menu = document.querySelector('[data-menu-toggle]'), header = document.querySelector('.site-header');
  if (menu && header) {
    menu.addEventListener('click', () => { const open = header.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('open')) { header.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });
  }

  // ---- 히어로 점 필드 — brand-v2.html field() 이식. opacity 대신 합성색을 애니메이션 ----
  let field = null;
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
