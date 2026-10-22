/* SocialClip: Menü, mobiles Menü und Anfrage-Buttons auf den Unterseiten */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ddBtn = $('.dd-btn'), dd = $('#ddPanel');
  if (ddBtn && dd) {
    const set = o => { dd.hidden = !o; ddBtn.setAttribute('aria-expanded', o); };
    ddBtn.addEventListener('click', e => { e.stopPropagation(); set(dd.hidden); });
    if (matchMedia('(hover: hover)').matches) { const w = $('.dd'); let tm; w.addEventListener('pointerenter', () => { clearTimeout(tm); set(true); }); w.addEventListener('pointerleave', () => { tm = setTimeout(() => set(false), 180); }); }
    document.addEventListener('click', e => { if (!e.target.closest('.dd')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape') set(false); });
  }
  const sheet = $('#sheet'), burger = $('#burger');
  if (sheet && burger) {
    const set = o => { sheet.hidden = !o; burger.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; if (o) $('.sheet-nav a', sheet).focus(); };
    burger.addEventListener('click', () => set(true));
    $$('[data-close]', sheet).forEach(el => el.addEventListener('click', () => set(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { set(false); burger.focus(); } });
  }
  const clk = $('#sheetClock');
  if (clk) { const f = () => { clk.textContent = 'Studio Erlangen · ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }); }; f(); setInterval(f, 20000); }
  const nav = $('#nav');
  if (nav) { const s = () => nav.classList.toggle('scrolled', scrollY > 40); addEventListener('scroll', s, { passive: true }); s(); }
  // „Projekt besprechen“ auf den Leistungsseiten: weiter zum Kontaktformular der Startseite
  $$('[data-detail-project]').forEach(b => b.addEventListener('click', () => {
    const u = new URL('/', location.origin); u.searchParams.append('anfrage', b.dataset.detailProject); u.hash = 'kontakt'; location.assign(u.href);
  }));
})();
