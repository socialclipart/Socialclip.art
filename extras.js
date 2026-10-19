/* Neue Effekte auf der Startseite (extras.css)
   3 Tageszeit-Stimmung
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
