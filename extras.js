/* Neue Effekte auf der Startseite (extras.css)
   1 Story-Leiste · 3 Tageszeit-Stimmung
   4 3D-Leistungskarten · 5 Ideen-Generator */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get: key => { try { return localStorage.getItem(key); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* privat */ } }
  };

  const SERVICES = {
    web: { name: 'Webdesign & Websites', url: '/webdesign-erlangen/', builder: 'Webseite' },
    social: { name: 'Social Media', url: '/social-media-erlangen/', builder: 'Social Media' },
    nova: { name: 'KI-Telefonassistenz Nova', url: '/ki-assistent-erlangen/', builder: 'Virtueller Assistent' },
    logo: { name: 'Logo & Branding', url: '/grafikdesign-erlangen/', builder: 'Logo' },
    flyer: { name: 'Flyerdesign', url: '/flyerdesign-erlangen/', builder: 'Flyer' },
    visit: { name: 'Visitenkarten', url: '/visitenkarten-erlangen/', builder: 'Visitenkarte' },
    menu: { name: 'Speisekarten', url: '/speisekarten-design-erlangen/', builder: 'Speisekarte' },
    video: { name: 'Foto & Video', url: '/foto-video-bearbeitung-erlangen/', builder: 'Video & Foto' },
    tiktok: { name: 'TikTok Marketing', url: '/tiktok-marketing-erlangen/', builder: 'TikTok Marketing' },
    ads: { name: 'Online Marketing', url: '/online-marketing-erlangen/', builder: 'Online Marketing' },
    cv: { name: 'Lebenslauf', url: '/lebenslauf-erstellen-erlangen/', builder: 'Lebenslauf' },
    code: { name: 'Programmierung', url: '/programmierung-erlangen/', builder: 'Programmierung' },
    leads: { name: 'Neukundengewinnung', url: '/neukundengewinnung-erlangen/', builder: 'Neukundengewinnung' },
    plan: { name: 'Marketingstrategie', url: '/marketingstrategie-erlangen/', builder: 'Strategieentwicklung' }
  };

  /* ---------- 1 Story-Leiste ---------- */
  const STORIES = [
    { key: 'web', label: 'WEB', icon: 'W', slides: [
      ['WEBDESIGN', 'Deine Website.', 'Modern, schnell und gemacht fürs Handy, denn da suchen deine Kunden.'],
      ['IN ERLANGEN', 'Klar statt kompliziert.', 'Kunden sehen in Sekunden, was du anbietest und wie sie dich erreichen.']] },
    { key: 'social', label: 'SOCIAL', icon: 'S', slides: [
      ['SOCIAL MEDIA', 'Gesehen werden.', 'Beiträge, Reels und Stories für Instagram und TikTok, mit klarer Richtung.'],
      ['BETREUUNG', 'Wir planen, du lebst.', 'Redaktionsplan, Gestaltung und Veröffentlichung aus einer Hand.']] },
    { key: 'nova', label: 'NOVA', icon: 'N', slides: [
      ['KI-TELEFON', 'Nie mehr verpasst.', 'Nova nimmt Anrufe an, wenn du gerade keine Hand frei hast.'],
      ['RUND UM DIE UHR', 'Rückruf per E-Mail.', 'Name, Nummer und Anliegen landen sofort in deinem Postfach.']] },
    { key: 'logo', label: 'DESIGN', icon: 'D', slides: [
      ['DESIGN', 'Ein Auftritt.', 'Logo, Farben und Schriften, die man wiedererkennt.'],
      ['ÜBERALL GLEICH', 'Von Web bis Druck.', 'Einheitlich auf Website, Social Media, Flyer und Visitenkarte.']] },
    { key: 'video', label: 'VIDEO', icon: 'V', slides: [
      ['FOTO & VIDEO', 'Bewegung bleibt hängen.', 'Kurze Videos und starke Fotos für deine Kanäle.'],
      ['SCHNITT', 'Aus Material wird Story.', 'Wir bearbeiten, schneiden und bringen es in Form.']] },
    { key: 'flyer', label: 'DRUCK', icon: 'P', slides: [
      ['FLYER & KARTEN', 'Zum Anfassen.', 'Flyer, Visitenkarten und Speisekarten, druckfertig gestaltet.'],
      ['IN ERLANGEN', 'Gut lesbar, klar strukturiert.', 'Damit deine Kunden das Wichtigste sofort finden.']] }
  ];

  const hero = document.querySelector('.hero');
  if (hero) {
    const bar = document.createElement('div');
    bar.className = 'stories';
    bar.setAttribute('role', 'list');
    bar.setAttribute('aria-label', 'Leistungen als Story');
    const seen = new Set((store.get('sc-stories') || '').split(',').filter(Boolean));
    bar.innerHTML = STORIES.map((s, i) => `<button type="button" class="story-btn${seen.has(s.key) ? ' seen' : ''}" role="listitem" data-story="${i}"><i><b>${s.icon}</b></i>${s.label}</button>`).join('');
    hero.prepend(bar);

    const view = document.createElement('div');
    view.className = 'story-view';
    view.hidden = true;
    view.setAttribute('role', 'dialog');
    view.setAttribute('aria-modal', 'true');
    view.setAttribute('aria-label', 'Story');
    view.innerHTML = '<div class="story-card"><div class="story-bars"></div><div class="story-head"><span class="story-title"></span><button type="button" aria-label="Story schließen">×</button></div><div class="story-slides"></div><button type="button" class="story-tap prev" aria-label="Zurück"></button><button type="button" class="story-tap next" aria-label="Weiter"></button></div>';
    document.body.append(view);
    const bars = view.querySelector('.story-bars');
    const slidesBox = view.querySelector('.story-slides');
    const title = view.querySelector('.story-title');
    const closeBtn = view.querySelector('.story-head button');
    let storyIndex = 0;
    let slideIndex = 0;
    let timer = 0;
    let opener = null;
    const DURATION = 4500;

    function renderStory() {
      const story = STORIES[storyIndex];
      const service = SERVICES[story.key];
      const slides = [...story.slides, ['MEHR ERFAHREN', service.name, 'Lass uns kurz über dein Projekt sprechen, unverbindlich.', true]];
      title.textContent = `SOCIALCLIP · ${story.label}`;
      bars.innerHTML = slides.map(() => '<span><i></i></span>').join('');
      slidesBox.innerHTML = slides.map(([small, strong, text, cta]) => `<div class="story-slide"><small>${small}</small><strong>${strong}</strong><p>${text}</p>${cta ? `<button type="button" data-open-builder="${service.builder}">PROJEKT ANFRAGEN →</button><a class="ghost" href="${service.url}">MEHR ERFAHREN ↗</a>` : ''}</div>`).join('');
      slidesBox.querySelectorAll('[data-open-builder]').forEach(btn => btn.addEventListener('click', () => {
        close();
        const trigger = document.querySelector(`.seo-offer-actions [data-open-builder="${btn.dataset.openBuilder}"]`) || document.querySelector('[data-open-builder]');
        trigger?.click();
      }));
      seen.add(story.key);
      store.set('sc-stories', [...seen].join(','));
      bar.querySelector(`[data-story="${storyIndex}"]`).classList.add('seen');
      showSlide(0);
    }
    function showSlide(index) {
      const slides = slidesBox.children;
      if (index >= slides.length) {
        if (storyIndex < STORIES.length - 1) { storyIndex++; renderStory(); } else close();
        return;
      }
      if (index < 0) {
        if (storyIndex > 0) { storyIndex--; renderStory(); }
        return;
      }
      slideIndex = index;
      [...slides].forEach((slide, i) => slide.classList.toggle('on', i === index));
      [...bars.children].forEach((b, i) => {
        b.classList.toggle('done', i < index);
        b.classList.remove('run');
        if (i === index) { void b.offsetWidth; b.classList.add('run'); }
      });
      clearTimeout(timer);
      if (!reduce && index < slides.length - 1) timer = setTimeout(() => showSlide(slideIndex + 1), DURATION);
    }
    function open(index, from) {
      opener = from;
      storyIndex = index;
      view.hidden = false;
      document.body.style.overflow = 'hidden';
      renderStory();
      closeBtn.focus();
    }
    function close() {
      clearTimeout(timer);
      view.hidden = true;
      document.body.style.overflow = '';
      opener?.focus({ preventScroll: true });
    }
    bar.addEventListener('click', event => {
      const btn = event.target.closest('.story-btn');
      if (btn) open(Number(btn.dataset.story), btn);
    });
    view.querySelector('.story-tap.next').addEventListener('click', () => showSlide(slideIndex + 1));
    view.querySelector('.story-tap.prev').addEventListener('click', () => showSlide(slideIndex - 1));
    closeBtn.addEventListener('click', close);
    view.addEventListener('click', event => { if (event.target === view) close(); });
    document.addEventListener('keydown', event => {
      if (view.hidden) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') showSlide(slideIndex + 1);
      if (event.key === 'ArrowLeft') showSlide(slideIndex - 1);
    });
  }

  /* ---------- 3 Tageszeit-Stimmung ---------- */
  const tint = document.createElement('div');
  tint.className = 'daytime-tint';
  tint.setAttribute('aria-hidden', 'true');
  document.body.append(tint);
  const hour = new Date().getHours();
  document.body.dataset.daytime = hour >= 5 && hour < 11 ? 'morgen' : hour < 17 && hour >= 11 ? 'tag' : hour >= 17 && hour < 22 ? 'abend' : 'nacht';

  /* ---------- 4 3D-Leistungskarten ---------- */
  document.querySelectorAll('.service-list .seo-offer').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduce) return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.classList.add('tilting');
      card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
      card.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
      card.style.setProperty('--gx', `${x * 100}%`);
      card.style.setProperty('--gy', `${y * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('tilting');
      card.style.setProperty('--ry', '0deg');
      card.style.setProperty('--rx', '0deg');
    });
  });
  if (!reduce && 'IntersectionObserver' in window) {
    // Auf dem Handy: Lichtschimmer, wenn eine Karte ins Bild wischt
    const shineObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('shine');
      void entry.target.offsetWidth;
      entry.target.classList.add('shine');
    }), { threshold: 0.85 });
    document.querySelectorAll('.service-list .seo-offer').forEach(card => shineObserver.observe(card));
  }

  /* ---------- 5 Ideen-Generator ---------- */
  const IDEAS = {
    cafe: [['Zeig in einem 15-Sekunden-Reel, wie dein Kuchen des Tages entsteht.', 'social'], ['Lass Gäste per Website einen Tisch reservieren, auch nachts.', 'web'], ['Eine Speisekarte mit Fotos verkauft mehr als reine Textlisten.', 'menu'], ['Nova beantwortet Fragen nach Öffnungszeiten, während du Kaffee machst.', 'nova']],
    friseur: [['Vorher-Nachher-Videos sind auf Instagram echte Kundenmagnete.', 'video'], ['Online-Terminbuchung spart dir jeden Tag Telefonate.', 'web'], ['Nova nimmt Terminwünsche an, während du schneidest.', 'nova'], ['Ein starkes Logo macht deinen Salon wiedererkennbar.', 'logo']],
    handwerk: [['Zeig Baustellen als Zeitraffer, das schafft Vertrauen.', 'tiktok'], ['Eine klare Website mit Referenzen bringt bessere Anfragen.', 'web'], ['Nova geht ran, wenn du auf dem Dach stehst.', 'nova'], ['Flyer im Briefkasten der Nachbarschaft wirken immer noch.', 'flyer']],
    praxis: [['Nova entlastet die Anmeldung bei Terminanfragen.', 'nova'], ['Eine ruhige, klare Website nimmt Patienten die Unsicherheit.', 'web'], ['Kurze Erklärvideos beantworten die häufigsten Fragen.', 'video'], ['Ein einheitlicher Auftritt wirkt professionell und vertrauenswürdig.', 'logo']],
    restaurant: [['Das Tagesgericht als Story jeden Mittag bringt Stammgäste.', 'social'], ['Eine neue Speisekarte kann den Umsatz pro Tisch steigern.', 'menu'], ['Reservierungen per Website statt Telefon-Chaos.', 'web'], ['Google- und Instagram-Anzeigen für dein Viertel.', 'ads']],
    laden: [['Zeig neue Ware als Reel, bevor sie im Schaufenster steht.', 'social'], ['Ein kleiner Online-Auftritt holt Kunden in den Laden.', 'web'], ['Visitenkarten mit QR-Code zur Website an der Kasse.', 'visit'], ['Gezielte Anzeigen im Umkreis von 5 km um deinen Laden.', 'ads']],
    andere: [['Starte mit einem klaren Plan: Wen willst du erreichen und wo?', 'plan'], ['Eine moderne Website ist dein digitales Schaufenster.', 'web'], ['Regelmäßige Beiträge machen dich bekannt.', 'social'], ['Mehr Anfragen durch bessere Kontaktwege.', 'leads']]
  };
  const KEYWORDS = [
    ['web', ['website', 'webseite', 'homepage', 'seite', 'online', 'internet', 'shop', 'google']],
    ['social', ['instagram', 'social', 'insta', 'facebook', 'posts', 'reichweite', 'follower']],
    ['nova', ['telefon', 'anruf', 'ki', 'erreichbar', 'termin', 'assistent', 'nova']],
    ['logo', ['logo', 'branding', 'marke', 'design', 'auftritt', 'farben']],
    ['flyer', ['flyer', 'werbung', 'druck', 'plakat', 'broschüre']],
    ['visit', ['visitenkarte', 'karte', 'visit']],
    ['menu', ['speisekarte', 'menü', 'menu', 'restaurant', 'karte']],
    ['video', ['video', 'foto', 'bilder', 'reel', 'film']],
    ['tiktok', ['tiktok', 'kurzvideo']],
    ['ads', ['anzeige', 'ads', 'werbung', 'marketing', 'kampagne']],
    ['cv', ['lebenslauf', 'bewerbung', 'cv', 'anschreiben']],
    ['code', ['programm', 'app', 'automatisierung', 'tool', 'software', 'funktion']],
    ['leads', ['kunden', 'neukunden', 'anfragen', 'mehr kunden', 'umsatz', 'verkaufen']],
    ['plan', ['strategie', 'plan', 'zielgruppe', 'positionierung', 'konzept']]
  ];

  const ideasEl = document.querySelector('.ideas');
  if (ideasEl) {
    let branch = 'cafe';
    const chips = ideasEl.querySelector('.ideas-chips');
    const reel = ideasEl.querySelector('.slot-reel');
    const result = ideasEl.querySelector('.ideas-result');
    const mix = ideasEl.querySelector('.ideas-mix');
    let last = -1;
    let spinning = false;
    chips.addEventListener('click', event => {
      const btn = event.target.closest('button');
      if (!btn) return;
      branch = btn.dataset.branch;
      chips.querySelectorAll('button').forEach(b => { b.classList.toggle('on', b === btn); b.setAttribute('aria-checked', String(b === btn)); });
      spin();
    });
    const allIdeas = Object.values(IDEAS).flat();
    function spin() {
      if (spinning) return;
      spinning = true;
      const list = IDEAS[branch];
      let pick;
      do { pick = Math.floor(Math.random() * list.length); } while (list.length > 1 && pick === last);
      last = pick;
      const [text, key] = list[pick];
      const filler = Array.from({ length: reduce ? 0 : 10 }, () => allIdeas[Math.floor(Math.random() * allIdeas.length)][0]);
      reel.style.transition = 'none';
      reel.style.transform = 'translateY(0)';
      reel.innerHTML = [...filler, text].map(t => `<p>${escape(t)}</p>`).join('');
      result.textContent = '';
      void reel.offsetWidth;
      const distance = filler.length * 120;
      reel.style.transition = reduce ? 'none' : 'transform 1.6s cubic-bezier(.15,.8,.2,1)';
      reel.style.transform = `translateY(-${distance}px)`;
      setTimeout(() => {
        const service = SERVICES[key];
        result.innerHTML = `Passt dazu: <a href="${service.url}">${service.name} ↗</a>`;
        spinning = false;
      }, reduce ? 0 : 1650);
    }
    mix.addEventListener('click', spin);
    reel.innerHTML = '<p>Wähl deine Branche und drück auf „Idee mischen“.</p>';

    const search = ideasEl.querySelector('.ideas-search');
    const hits = ideasEl.querySelector('.ideas-hits');
    const showHits = () => {
      const query = search.value.trim().toLowerCase();
      if (query.length < 2) { hits.innerHTML = '<li class="ideas-empty">Zum Beispiel: mehr Kunden, Logo, Instagram, Anrufe …</li>'; return; }
      const words = query.split(/\s+/);
      const scored = KEYWORDS.map(([key, keys]) => [key, keys.reduce((sum, k) => sum + (query.includes(k) ? 3 : words.some(w => w.length > 2 && k.startsWith(w)) ? 1 : 0), 0)])
        .filter(([, score]) => score > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
      hits.innerHTML = scored.length
        ? scored.map(([key]) => `<li><a href="${SERVICES[key].url}"><span>${SERVICES[key].name}<small>Passt zu „${escape(search.value.trim())}“</small></span><em>Ansehen ↗</em></a></li>`).join('')
        : '<li class="ideas-empty">Dafür finden wir sicher eine Lösung. <a href="#kontakt">Schreib uns kurz →</a></li>';
    };
    search.addEventListener('input', showHits);
    showHits();
  }

})();
