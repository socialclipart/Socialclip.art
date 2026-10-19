/* Laufschrift (läuft von selbst, Scrollen beschleunigt und dreht die Richtung)
   und das SocialClip-S, das sich beim Scrollen aus Streifen zusammensetzt. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Laufschrift ---------- */
  const rows = [...document.querySelectorAll('.kinetic-row')];
  if (rows.length) {
    // Inhalt verdoppeln, damit die Schleife nahtlos läuft
    rows.forEach(row => { row.innerHTML += row.innerHTML; });
    let offset = 0;
    let boost = 0;
    let direction = 1;
    let lastY = scrollY;
    let visible = false;
    let frame = 0;
    addEventListener('scroll', () => {
      const delta = scrollY - lastY;
      lastY = scrollY;
      if (delta) direction = delta > 0 ? 1 : -1;
      boost = Math.min(boost + Math.abs(delta) * 0.06, 14);
    }, { passive: true });
    const tick = () => {
      offset += (0.5 + boost) * direction;
      boost *= 0.92;
      rows.forEach((row, i) => {
        const half = row.scrollWidth / 2;
        const x = ((offset * (i % 2 ? -1 : 1)) % half + half) % half;
        row.style.transform = `translate3d(${-x}px,0,0)`;
      });
      frame = visible ? requestAnimationFrame(tick) : 0;
    };
    if (!reduce) {
      new IntersectionObserver(entries => {
        visible = entries.some(e => e.isIntersecting);
        if (visible && !frame) frame = requestAnimationFrame(tick);
      }).observe(document.querySelector('.kinetic'));
    }
  }

  /* ---------- Das S setzt sich zusammen ---------- */
  const section = document.querySelector('.assemble');
  if (!section) return;
  const svg = section.querySelector('svg');
  const pieces = 12;
  const ns = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(ns, 'defs');
  const shape = document.createElementNS(ns, 'g');
  shape.id = 'assembleShape';
  shape.innerHTML = '<path d="M146.10 66.74 L186.11 43.64 A67.10 67.10 0 1 0 94.45 135.30 L100.57 138.84 L146.77 112.16 L117.55 95.29 A20.90 20.90 0 1 1 146.10 66.74 Z"/><path d="M109.90 189.26 L69.89 212.36 A67.10 67.10 0 1 0 161.55 120.70 L155.43 117.16 L109.23 143.84 L138.45 160.71 A20.90 20.90 0 1 1 109.90 189.26 Z"/>';
  defs.append(shape);
  svg.append(defs);
  // Logo (y ca. 10…246) in waagrechte Streifen schneiden
  const top = 8;
  const height = 240;
  const parts = [];
  for (let i = 0; i < pieces; i++) {
    const clip = document.createElementNS(ns, 'clipPath');
    clip.id = `assembleClip${i}`;
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', '40');
    rect.setAttribute('y', String(top + i * height / pieces - 0.4));
    rect.setAttribute('width', '180');
    rect.setAttribute('height', String(height / pieces + 0.8));
    clip.append(rect);
    defs.append(clip);
    const group = document.createElementNS(ns, 'g');
    group.setAttribute('clip-path', `url(#${clip.id})`);
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', '#assembleShape');
    group.append(use);
    svg.append(group);
    const side = i % 2 ? 1 : -1;
    parts.push({ el: group, x: side * (260 + Math.random() * 260), y: (Math.random() - 0.5) * 360, r: (Math.random() - 0.5) * 120, delay: Math.random() * 0.25 });
  }
  const ease = t => 1 - Math.pow(1 - t, 3);
  function update() {
    const rect = section.getBoundingClientRect();
    const travel = section.offsetHeight - innerHeight;
    const progress = reduce ? 1 : Math.min(1, Math.max(0, -rect.top / (travel * 0.8)));
    for (const p of parts) {
      const t = ease(Math.min(1, Math.max(0, (progress - p.delay) / (1 - p.delay))));
      const k = 1 - t;
      p.el.style.transform = `translate(${p.x * k}px,${p.y * k}px) rotate(${p.r * k}deg)`;
      p.el.style.transformOrigin = '128px 128px';
      p.el.style.opacity = String(0.15 + 0.85 * t);
    }
    section.classList.toggle('done', progress > 0.97);
  }
  update();
  if (!reduce) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }, { passive: true });
    addEventListener('resize', update);
  }
})();
