/* Scene 08 VISUAL WORLD: Inhalte für die drei Kacheln
   1 FORM   – Partikel formen das SocialClip-S, weichen Maus/Finger aus
   2 STORY  – Handy mit Story: Idee → Design → Sichtbar
   3 LICHT  – Lichtkegel folgt Maus/Finger und legt WIRKUNG. frei */
(() => {
  const cards = document.querySelectorAll('.visual-grid .visual-card');
  if (cards.length < 3) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1 FORM ---------- */
  const formCard = cards[0];
  const canvas = document.createElement('canvas');
  canvas.className = 'vw-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  formCard.prepend(canvas);
  const ctx = canvas.getContext('2d');
  const logo = [
    'M146.10 66.74 L186.11 43.64 A67.10 67.10 0 1 0 94.45 135.30 L100.57 138.84 L146.77 112.16 L117.55 95.29 A20.90 20.90 0 1 1 146.10 66.74 Z',
    'M109.90 189.26 L69.89 212.36 A67.10 67.10 0 1 0 161.55 120.70 L155.43 117.16 L109.23 143.84 L138.45 160.71 A20.90 20.90 0 1 1 109.90 189.26 Z'
  ].map(d => new Path2D(d));
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  const pointer = { x: -9999, y: -9999 };

  function buildParticles() {
    const rect = formCard.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Logo (ca. 134 × 236 Einheiten, Mitte 128/128) einpassen und in ein Raster abtasten
    const scale = Math.min(width * 0.55 / 134, height * 0.74 / 236);
    const offsetX = width / 2 - 128 * scale;
    const offsetY = height / 2 - 128 * scale - 8;
    const probe = document.createElement('canvas').getContext('2d');
    probe.canvas.width = Math.ceil(width);
    probe.canvas.height = Math.ceil(height);
    probe.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    logo.forEach(path => probe.fill(path));
    const data = probe.getImageData(0, 0, probe.canvas.width, probe.canvas.height).data;
    const step = width < 500 ? 6 : 7;
    const old = particles;
    particles = [];
    for (let y = 0; y < probe.canvas.height; y += step) {
      for (let x = 0; x < probe.canvas.width; x += step) {
        if (data[(y * probe.canvas.width + x) * 4 + 3] > 128) {
          const prev = old[particles.length];
          particles.push({ hx: x, hy: y, x: prev ? prev.x : Math.random() * width, y: prev ? prev.y : Math.random() * height, vx: 0, vy: 0, r: 1 + Math.random() * 1.2, a: .5 + Math.random() * .5 });
        }
      }
    }
  }

  function drawForm(time) {
    ctx.clearRect(0, 0, width, height);
    const breathe = Math.sin(time / 1400) * 2;
    for (const p of particles) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 90) {
        const force = (90 - dist) / 90 * 3.2;
        p.vx += dx / (dist || 1) * force;
        p.vy += dy / (dist || 1) * force;
      }
      p.vx += (p.hx - p.x) * 0.035;
      p.vy += (p.hy + breathe - p.y) * 0.035;
      p.vx *= 0.84;
      p.vy *= 0.84;
      p.x += p.vx;
      p.y += p.vy;
      ctx.fillStyle = `rgba(244,241,234,${p.a})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const setPointer = (card, target) => event => {
    const rect = card.getBoundingClientRect();
    target.x = event.clientX - rect.left;
    target.y = event.clientY - rect.top;
    target.active = true;
  };
  formCard.addEventListener('pointermove', setPointer(formCard, pointer));
  formCard.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });

  /* ---------- 2 STORY ---------- */
  const storyCard = cards[1];
  const slides = [
    { word: 'IDEE.', note: 'Alles beginnt mit deiner Idee.' },
    { word: 'DESIGN.', note: 'Wir geben ihr Form und Licht.' },
    { word: 'SICHTBAR.', note: 'Und bringen sie zu deinen Kunden.' }
  ];
  const phone = document.createElement('div');
  phone.className = 'vw-phone';
  phone.setAttribute('aria-hidden', 'true');
  phone.innerHTML = `<div class="vw-bars">${slides.map(() => '<span><i></i></span>').join('')}</div><div class="vw-profile"><img src="/logo/socialclip-symbol-cream.svg" alt=""><b>socialclip.art</b></div>${slides.map((s, i) => `<div class="vw-slide vw-slide-${i}"><strong>${s.word}</strong><small>${s.note}</small></div>`).join('')}`;
  storyCard.prepend(phone);
  let story = 0;
  function showStory(index) {
    story = index % slides.length;
    phone.querySelectorAll('.vw-slide').forEach((slide, i) => slide.classList.toggle('on', i === story));
    phone.querySelectorAll('.vw-bars span').forEach((bar, i) => {
      bar.classList.toggle('done', i < story);
      bar.classList.remove('run');
      if (i === story) { void bar.offsetWidth; bar.classList.add('run'); }
    });
  }
  showStory(0);
  let storyTimer = reduce ? null : setInterval(() => showStory(story + 1), 2800);
  phone.addEventListener('click', () => {
    showStory(story + 1);
    if (storyTimer) { clearInterval(storyTimer); storyTimer = setInterval(() => showStory(story + 1), 2800); }
  });

  /* ---------- 3 LICHT ---------- */
  const lightCard = cards[2];
  const light = document.createElement('div');
  light.className = 'vw-light';
  light.setAttribute('aria-hidden', 'true');
  light.innerHTML = '<span class="vw-light-word">WIRKUNG.</span><span class="vw-light-hint">Bewege das Licht</span>';
  lightCard.prepend(light);
  const spot = { x: 0, y: 0, tx: 0, ty: 0, active: false };
  lightCard.addEventListener('pointermove', event => {
    const rect = lightCard.getBoundingClientRect();
    spot.tx = event.clientX - rect.left;
    spot.ty = event.clientY - rect.top;
    spot.active = true;
    light.classList.add('touched');
  });
  lightCard.addEventListener('pointerleave', () => { spot.active = false; });

  function drawLight(time) {
    const rect = lightCard.getBoundingClientRect();
    if (!spot.active) {
      // ohne Maus kreist das Licht langsam über das Wort
      spot.tx = rect.width / 2 + Math.cos(time / 1600) * rect.width * 0.3;
      spot.ty = rect.height / 2 + Math.sin(time / 1100) * rect.height * 0.18;
    }
    spot.x += (spot.tx - spot.x) * 0.12;
    spot.y += (spot.ty - spot.y) * 0.12;
    light.style.setProperty('--lx', `${spot.x}px`);
    light.style.setProperty('--ly', `${spot.y}px`);
  }

  /* ---------- Schleife nur, wenn sichtbar ---------- */
  let visible = false;
  let frame = 0;
  function loop(time) {
    drawForm(time);
    drawLight(time);
    frame = visible ? requestAnimationFrame(loop) : 0;
  }
  buildParticles();
  if (reduce) {
    particles.forEach(p => { p.x = p.hx; p.y = p.hy; });
    drawForm(0);
    light.style.setProperty('--lx', '50%');
    light.style.setProperty('--ly', '50%');
  } else {
    new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible && !frame) frame = requestAnimationFrame(loop);
    }).observe(document.querySelector('.visual-grid'));
  }
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { buildParticles(); if (reduce) { particles.forEach(p => { p.x = p.hx; p.y = p.hy; }); drawForm(0); } }, 150);
  });
})();
