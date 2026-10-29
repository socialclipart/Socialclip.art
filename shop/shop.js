// SocialClip Shop: Produktliste, Filter und Live-Wand-Vorschau (läuft komplett im Browser)
(() => {
  const WA = 'https://wa.me/4917646188101?text=';
  const wa = (t) => WA + encodeURIComponent(t);

  // preview: welcher Typ in der Wand-Vorschau gezeigt wird (falls vorhanden)
  const PRODUKTE = [
    { cat: 'wand', ico: '🧊', name: '3D-Logo für die Wand', text: 'Dein Logo als Acryl-Schriftzug mit Tiefe – für Empfang, Büro oder Laden.', ab: 249, tag: 'Bestseller', preview: 'logo3d' },
    { cat: 'wand', ico: '💡', name: 'LED-Neon mit Logo', text: 'Dein Logo als leuchtendes Neon-Schild. Der Hingucker für jeden Laden.', ab: 299, tag: 'Beliebt', preview: 'neon' },
    { cat: 'wand', ico: '✨', name: 'Neon-Schriftzug / Spruch', text: 'Wunschtext in Neon, z. B. „Kein Plan B.“ oder dein Firmenname.', ab: 199, preview: 'neon' },
    { cat: 'wand', ico: '⭕', name: '3D-Ladenschild rund', text: 'Rundes Firmenschild mit 3D-Logo, ca. 60 cm – innen oder außen.', ab: 399, preview: 'rund' },
    { cat: 'wand', ico: '🪟', name: 'Acrylglas-Schild', text: 'Edles Glasschild mit Logo und Abstandshaltern – für Eingang und Empfang.', ab: 79, preview: 'acryl' },
    { cat: 'wand', ico: '🚪', name: 'Türschild / Praxisschild', text: 'Hochwertiges Schild mit Name, Logo und Öffnungszeiten.', ab: 79, preview: 'acryl' },
    { cat: 'wand', ico: '🖼️', name: 'Leinwand mit Logo oder Foto', text: 'Dein Branding oder Lieblingsfoto auf Leinwand für Büro und Laden.', ab: 69 },
    { cat: 'laden', ico: '🕘', name: 'Öffnungszeiten-Aufkleber', text: 'Folie für Tür oder Fenster, passend zu deinem Logo.', ab: 39 },
    { cat: 'laden', ico: '🏪', name: 'Schaufensterbeschriftung', text: 'Logo, Leistungen und Kontakt groß ins Fenster – sichtbar für alle.', ab: 149 },
    { cat: 'laden', ico: '⭐', name: 'NFC-Aufsteller „Bewerte uns“', text: 'Handy dranhalten – und der Kunde landet direkt bei deinen Google-Bewertungen.', ab: 89, tag: 'Neu' },
    { cat: 'laden', ico: '💳', name: 'NFC-Bewertungskarte', text: 'Karte im Scheckkartenformat für mehr Google-Bewertungen.', ab: 29 },
    { cat: 'laden', ico: '🧍', name: 'Roll-up Display', text: 'Mobiler Aufsteller für Messen, Events und den Eingangsbereich.', ab: 129 },
    { cat: 'laden', ico: '🚩', name: 'Beachflag', text: 'Fahne mit Logo – fällt vor dem Laden schon von Weitem auf.', ab: 119 },
    { cat: 'laden', ico: '🟫', name: 'Fußmatte mit Logo', text: 'Der erste Eindruck schon an der Tür.', ab: 79 },
    { cat: 'laden', ico: '🏷️', name: 'Logo-Aufkleber (100 Stk.)', text: 'Für Verpackung, Tüten, Rechnungen und Produkte.', ab: 49 },
    { cat: 'auto', ico: '🚗', name: 'Magnetschilder fürs Auto', text: 'Ein Paar Magnetschilder mit Logo und Nummer – einfach drauf und wieder ab.', ab: 79 },
    { cat: 'auto', ico: '🚐', name: 'Heckscheiben-Beschriftung', text: 'Logo, Website und Telefonnummer auf der Heckscheibe.', ab: 99 },
    { cat: 'auto', ico: '🚚', name: 'Fahrzeugbeschriftung', text: 'Komplette Beschriftung für Transporter und Firmenwagen.', ab: 349 },
    { cat: 'druck', ico: '🪪', name: 'Visitenkarten (500 Stk.)', text: 'Inklusive Design, beidseitig, hochwertiges Papier.', ab: 79 },
    { cat: 'druck', ico: '📄', name: 'Flyer', text: 'Gestaltung und Druck – für Aktionen, Eröffnung oder Briefkasten.', ab: 99 },
    { cat: 'druck', ico: '🍽️', name: 'Speisekarte', text: 'Modern gestaltet, leicht zu lesen, auch als digitale Version.', ab: 119 },
    { cat: 'druck', ico: '✏️', name: 'Logo-Design', text: 'Dein eigenes Logo – Grundlage für alles andere im Shop.', ab: 149 },
    { cat: 'merch', ico: '👕', name: 'T-Shirt mit Logo', text: 'Für dich und dein Team – bedruckt oder bestickt.', ab: 29 },
    { cat: 'merch', ico: '🧥', name: 'Hoodie mit Logo', text: 'Bequem, hochwertig, mit deinem Logo auf Brust oder Rücken.', ab: 59 },
    { cat: 'merch', ico: '☕', name: 'Tasse mit Logo', text: 'Für Büro, Kunden oder als Geschenk.', ab: 19 },
    { cat: 'merch', ico: '👥', name: 'Team-Paket (10 Shirts)', text: 'Einheitlicher Auftritt für dein ganzes Team.', ab: 249 },
    { cat: 'poster', ico: '🔥', name: 'Motivationsposter', text: 'Eigene Business-Sprüche im Luxus-Look, z. B. „Kein Plan B.“', ab: 29, preview: 'poster' },
    { cat: 'poster', ico: '🏆', name: 'Personalisiertes Poster', text: 'Dein Spruch mit Firmenname, z. B. „Müller GmbH · Est. 2019“.', ab: 39, tag: 'Geschenkidee', preview: 'poster' },
    { cat: 'poster', ico: '🖤', name: 'Poster gerahmt', text: 'Fertig zum Aufhängen im schwarzen Rahmen, 50 × 70 cm.', ab: 59, preview: 'poster' },
  ];

  const LABEL = { logo3d: '3D-Logo · ab 249 €', neon: 'LED-Neon · ab 199 €', poster: 'Poster · ab 29 €', rund: 'Ladenschild · ab 399 €', acryl: 'Acrylglas · ab 79 €' };

  const grid = document.getElementById('grid');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  grid.innerHTML = PRODUKTE.map((p) => `
    <article class="shop-card" data-cat="${p.cat}">
      <div class="shop-ico" aria-hidden="true">${p.ico}</div>
      <div class="shop-body">
        ${p.tag ? `<span class="shop-tag">${p.tag}</span>` : ''}
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.text)}</p>
        <div class="shop-price">ab ${p.ab} € <small>inkl. Gestaltung</small></div>
        <div class="shop-act">
          <a href="${wa(`Hallo SocialClip, ich interessiere mich für: ${p.name} (ab ${p.ab} €).`)}">Anfragen</a>
          ${p.preview ? `<button type="button" data-preview="${p.preview}">Vorschau</button>` : ''}
        </div>
      </div>
    </article>`).join('');

  document.getElementById('filter').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll('#filter button').forEach((x) => x.classList.toggle('on', x === b));
    document.querySelectorAll('.shop-card').forEach((c) => { c.hidden = b.dataset.cat !== 'alle' && c.dataset.cat !== b.dataset.cat; });
  });

  // Live-Wand-Vorschau
  const stage = document.getElementById('stage');
  const item = document.getElementById('item');
  const img = document.getElementById('itemImg');
  const txt = document.getElementById('itemText');
  const badge = document.getElementById('badge');
  const waBtn = document.getElementById('previewWa');
  const state = { type: 'logo3d', room: 'buero', hasLogo: false };

  const update = () => {
    item.dataset.type = state.type;
    stage.dataset.room = state.room;
    badge.textContent = LABEL[state.type];
    const was = state.hasLogo ? 'mein Logo' : `„${txt.textContent}“`;
    waBtn.href = wa(`Hallo SocialClip, ich interessiere mich für: ${LABEL[state.type]} mit ${was} (Vorschau Raum: ${state.room}). Mein Logo schicke ich gleich mit.`);
  };
  const seg = (id, key) => document.getElementById(id).addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    document.querySelectorAll(`#${id} button`).forEach((x) => x.classList.toggle('on', x === b));
    if (key === 'col') item.style.setProperty('--col', b.dataset.col);
    else state[key] = b.dataset[key];
    update();
  });
  seg('typeSeg', 'type');
  seg('roomSeg', 'room');
  seg('colSeg', 'col');

  document.getElementById('logoText').addEventListener('input', (e) => {
    txt.textContent = e.target.value || 'Dein Firmenname';
    state.hasLogo = false;
    img.hidden = true;
    txt.hidden = false;
    update();
  });
  document.getElementById('logoFile').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { img.src = r.result; img.hidden = false; txt.hidden = true; state.hasLogo = true; update(); };
    r.readAsDataURL(f);
  });
  document.getElementById('size').addEventListener('input', (e) => item.style.setProperty('--s', e.target.value / 100));

  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-preview]');
    if (!b) return;
    const t = b.dataset.preview;
    document.querySelectorAll('#typeSeg button').forEach((x) => x.classList.toggle('on', x.dataset.type === t));
    state.type = t;
    update();
    document.getElementById('vorschau').scrollIntoView({ behavior: 'smooth' });
  });
  update();
})();
