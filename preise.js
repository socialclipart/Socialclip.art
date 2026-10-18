(() => {
  // Alle Preise in Euro, hier zentral anpassen. Bei UST > 0 gelten sie als Nettopreise.
  const UST = 0; // 0 = Kleinunternehmerregelung (§ 19 UStG), 0.19 = Regelbesteuerung
  const UST_NOTE = UST ? `Alle Preise netto zzgl. ${UST * 100} % MwSt.` : 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';
  const TOTAL = UST ? 'netto' : 'gesamt';
  const RABATT = [[4, 0.15], [3, 0.10], [2, 0.05]]; // ab X Leistungen → Rabatt
  // label = Chip auf der Seite, name = Beschreibung im Angebot
  const SERVICES = [
    { id: 'web', name: 'Website', variants: [
      { label: 'Basic', name: 'Onepager Basic · eine Seite, ohne Extras', once: 350 },
      { label: 'Plus', name: 'Onepager Plus · mit Kontaktformular & Google-Grundoptimierung', once: 690 },
      { label: 'Business', name: 'Business-Website bis 5 Seiten', once: 1490 },
      { label: 'Eigene Idee', name: 'Persönliche Idee · wir besprechen alles gemeinsam', request: true, fields: [
        { key: 'Seiten', label: 'Wie viele Seiten ungefähr?', type: 'number', placeholder: 'z. B. 8' },
        { key: 'Idee', label: 'Beschreib kurz deine Idee', type: 'text', placeholder: 'z. B. Online-Shop, Buchung, Galerie …' }] }] },
    { id: 'social', name: 'Social Media', note: 'Strategie, Beiträge, Reels und Stories.', variants: [
      { label: 'Start', name: 'Start · Instagram, 8 Beiträge/Monat', once: 290, monthly: 740 },
      { label: 'Wachstum', name: 'Wachstum · 2 Kanäle, 12 Beiträge, 1 Shooting', once: 390, monthly: 1140 },
      { label: 'Premium', name: 'Premium · 3 Kanäle, 16 Beiträge, 2 Shootings, Ads', once: 590, monthly: 1540 }] },
    { id: 'nova', name: 'KI-Telefon Nova', note: 'Nimmt Anrufe an, wenn niemand abhebt. Inkl. Telefonnummer, einmalig 490 € Einrichtung.', estimator: true, variants: [
      { label: '150 Min', name: 'Basis · 150 Minuten/Monat, jede weitere 0,50 €', minutes: 150, once: 490, monthly: 150 },
      { label: '300 Min', name: 'Standard · 300 Minuten/Monat, jede weitere 0,45 €', minutes: 300, once: 490, monthly: 250 },
      { label: '600 Min', name: 'Profi · 600 Minuten/Monat, jede weitere 0,40 €', minutes: 600, once: 490, monthly: 430 },
      { label: '1.200 Min', name: 'Business · 1.200 Minuten/Monat, jede weitere 0,35 €', minutes: 1200, once: 490, monthly: 750 }] },
    { id: 'logo', name: 'Logo', note: 'Inkl. 2 Entwürfen und 2 Korrekturrunden.', variants: [
      { label: 'Logo', name: 'Logo', once: 150, from: true },
      { label: '+ Branding', name: 'Logo + Farben, Schriften & Vorlagen', once: 490, from: true }] },
    { id: 'flyer', name: 'Flyer', note: 'Druckfertig, inkl. 2 Korrekturrunden.', variants: [
      { label: 'Einseitig', name: 'Flyer einseitig', once: 60 },
      { label: 'Zweiseitig', name: 'Flyer zweiseitig', once: 90 },
      { label: 'Faltflyer', name: 'Faltflyer', once: 150 }] },
    { id: 'visitenkarte', name: 'Visitenkarte', note: 'Druckfertig, inkl. 2 Korrekturrunden.', variants: [
      { label: 'Einseitig', name: 'Visitenkarte einseitig', once: 50 },
      { label: 'Beidseitig', name: 'Visitenkarte beidseitig', once: 80 }] },
    { id: 'speisekarte', name: 'Speisekarte', note: 'Der genaue Preis richtet sich nach Seitenzahl und Umfang.', variants: [
      { label: 'Individuell', name: 'Speisekarte, je nach Seitenzahl', once: 80, from: true, fields: [
        { key: 'Seiten', label: 'Wie viele Seiten ungefähr?', type: 'number', placeholder: 'z. B. 4' }] }] },
    { id: 'tiktok', name: 'TikTok', note: 'Konzepte, Schnitt und Betreuung, einmalig 290 € Einrichtung.', variants: [
      { label: '8 Videos', name: 'TikTok Marketing · 8 Videos pro Monat', once: 290, monthly: 590 },
      { label: 'Individuell', name: 'TikTok Marketing · Anzahl Videos selbst wählen', request: true, fields: [
        { key: 'Videos pro Monat', label: 'Wie viele Videos pro Monat?', type: 'number', placeholder: 'z. B. 12' }] }] },
    { id: 'online', name: 'Online Ads', note: 'Google- und Meta-Anzeigen, Werbebudget zahlst du direkt an die Plattform. Einmalig 290 € Einrichtung.', variants: [
      { label: 'Betreuung', name: 'Anzeigen-Betreuung', once: 290, monthly: 390 }] },
    { id: 'foto-video', name: 'Foto & Video', variants: [
      { label: 'Bis 20 Fotos', name: 'Fotobearbeitung bis 20 Bilder', once: 150 },
      { label: 'Video bis 60 Sek.', name: 'Videoschnitt bis 60 Sekunden', once: 190 }] },
    { id: 'lebenslauf', name: 'Lebenslauf', variants: [
      { label: 'Lebenslauf', name: 'Lebenslauf', once: 50 },
      { label: '+ Anschreiben', name: 'Lebenslauf + Anschreiben (+20 €)', once: 70 }] },
    { id: 'mehr', name: 'Strategie & mehr', aliases: ['strategie', 'neukunden', 'programmierung'], variants: [
      { label: 'Strategie', name: 'Marketingstrategie · Workshop & Plan', once: 390 },
      { label: 'Neukunden', name: 'Neukundengewinnung · Konzept & Umsetzungsplan', once: 490 },
      { label: 'Programmierung', name: 'Programmierung · individuelles Projekt', once: 690, from: true }] }
  ];

  const grid = document.getElementById('pkGrid');
  if (!grid) return;
  const rows = document.getElementById('pkRows');
  const checkout = document.getElementById('angebot');
  const summary = document.getElementById('pkSummary');
  const form = document.getElementById('preisForm');
  const status = document.getElementById('preisStatus');
  const success = document.getElementById('preisSuccess');
  const offer = document.getElementById('preisOffer');
  const selected = new Map(); // id → variant index
  const details = new Map(); // id → { Feldname: Wert }
  const tiles = new Map();
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const euro = value => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const price = v => v.request ? 'nach Absprache' : `${v.from ? 'ab ' : ''}${euro(v.once)}${v.monthly ? ` + ${euro(v.monthly)}/Monat` : ''}`;
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const discountRate = count => (RABATT.find(([min]) => count >= min) || [0, 0])[1];
  const tilePrice = service => {
    const fixed = service.variants.filter(v => !v.request);
    const monthly = fixed.filter(v => v.monthly).map(v => v.monthly);
    if (monthly.length) return `ab ${euro(Math.min(...monthly))}/Monat`;
    return `${fixed.length > 1 || fixed[0].from || fixed.length < service.variants.length ? 'ab ' : ''}${euro(Math.min(...fixed.map(v => v.once)))}`;
  };

  document.querySelectorAll('[data-ust-note]').forEach(el => { el.textContent = UST_NOTE; });

  // Untere Leiste: Rabattstufen, Zähler, Button
  const dock = document.createElement('div');
  dock.className = 'pk-dock';
  dock.innerHTML = `<div class="pk-dock-in"><div class="pk-meter">${[...RABATT].reverse().map(([min, rate]) => `<div class="pk-step" data-min="${min}"><span></span><small>${min === 2 ? '2 Leistungen' : min === 4 ? '4+' : min} · −${rate * 100} %</small></div>`).join('')}</div><div><div class="pk-total" aria-live="polite">0 €</div><div class="pk-save">Tippe auf eine Leistung, um zu starten.</div></div><a class="pk-cta" href="#angebot">Angebot holen →</a></div>`;
  document.body.append(dock);
  document.body.classList.add('pk-has-dock');
  const totalEl = dock.querySelector('.pk-total');
  const saveEl = dock.querySelector('.pk-save');
  const cta = dock.querySelector('.pk-cta');
  const toastEl = document.createElement('div');
  toastEl.className = 'pk-toast';
  toastEl.setAttribute('role', 'status');
  document.body.append(toastEl);

  SERVICES.forEach((service, i) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'pk-tile';
    tile.setAttribute('aria-pressed', 'false');
    tile.innerHTML = `<small>${String(i + 1).padStart(2, '0')}</small><b>${service.name}</b><em>${tilePrice(service)}</em><i aria-hidden="true">+</i>`;
    tile.addEventListener('click', () => toggle(service.id));
    tiles.set(service.id, tile);
    grid.append(tile);
  });

  function toggle(id, on = !selected.has(id), variant = 0) {
    const tile = tiles.get(id);
    if (on) {
      if (!selected.has(id)) selected.set(id, variant);
      tile.classList.remove('pop');
      void tile.offsetWidth;
      tile.classList.add('pop');
    } else {
      selected.delete(id);
    }
    tile.classList.toggle('on', on);
    tile.setAttribute('aria-pressed', String(on));
    tile.querySelector('i').textContent = on ? '✓' : '+';
    drawRows();
    update();
  }

  function drawRows() {
    rows.replaceChildren();
    for (const service of SERVICES) {
      if (!selected.has(service.id)) continue;
      const index = selected.get(service.id);
      const variant = service.variants[index];
      const values = details.get(service.id) || {};
      const row = document.createElement('div');
      row.className = 'pk-row';
      row.innerHTML = `<div class="pk-row-head"><b>${service.name}</b><div class="pk-seg" role="radiogroup" aria-label="${service.name}: Variante">${service.variants.map((v, j) => `<button type="button" role="radio" aria-checked="${j === index}" class="${j === index ? 'on' : ''}" data-j="${j}">${v.label}</button>`).join('')}</div><span class="pk-row-price">${price(variant)}</span><button type="button" class="pk-remove" aria-label="${service.name} entfernen">×</button></div>
        ${service.note ? `<p class="pk-row-note">${service.note}</p>` : ''}
        ${service.estimator ? `<div class="pk-fields"><label>Wie viele Anrufe soll Nova ungefähr pro Tag annehmen?<input type="number" min="1" max="200" inputmode="numeric" placeholder="z. B. 5" data-estimate value="${escape(values._calls || '')}"></label><p class="pk-hint" aria-live="polite"></p></div>` : ''}
        ${variant.fields ? `<div class="pk-fields">${variant.fields.map(f => `<label>${f.label}<input type="${f.type}" data-field="${f.key}" placeholder="${f.placeholder}"${f.type === 'number' ? ' min="1" inputmode="numeric"' : ''} value="${escape(values[f.key] || '')}"></label>`).join('')}</div>` : ''}`;
      row.querySelectorAll('.pk-seg button').forEach(button => button.addEventListener('click', () => {
        selected.set(service.id, Number(button.dataset.j));
        drawRows();
        update();
      }));
      row.querySelector('.pk-remove').addEventListener('click', () => toggle(service.id, false));
      row.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', () => {
        details.set(service.id, { ...(details.get(service.id) || {}), [input.dataset.field]: input.value });
        update();
      }));
      const estimate = row.querySelector('[data-estimate]');
      if (estimate) {
        // Annahme: ca. 2,5 Minuten pro Anruf, 22 Arbeitstage im Monat
        const hint = row.querySelector('.pk-hint');
        const showHint = () => {
          const calls = Number(estimate.value);
          if (!calls || calls < 0) { hint.textContent = ''; return null; }
          const minutes = Math.ceil(calls * 2.5 * 22 / 10) * 10;
          const found = service.variants.findIndex(v => v.minutes >= minutes);
          const pick = found === -1 ? service.variants.length - 1 : found;
          hint.textContent = `Das sind etwa ${minutes.toLocaleString('de-DE')} Minuten im Monat. Empfehlung: ${service.variants[pick].label}${found === -1 ? ', für mehr Minuten sprich uns gern an' : ''}.`;
          return pick;
        };
        showHint();
        estimate.addEventListener('input', showHint);
        estimate.addEventListener('change', () => {
          details.set(service.id, { ...(details.get(service.id) || {}), _calls: estimate.value });
          const pick = showHint();
          if (pick !== null && pick !== selected.get(service.id)) { selected.set(service.id, pick); drawRows(); update(); }
        });
      }
      rows.append(row);
    }
  }

  function calculate() {
    const items = SERVICES.filter(s => selected.has(s.id)).map(service => {
      const variant = service.variants[selected.get(service.id)];
      const values = details.get(service.id) || {};
      const info = (variant.fields || []).map(f => values[f.key] && String(values[f.key]).trim() ? `${f.key}: ${String(values[f.key]).trim()}` : '').filter(Boolean).join(', ');
      return { service, variant, details: info };
    });
    // Leistungen nach Absprache haben noch keinen Preis und zählen nicht für den Paketrabatt
    const fixed = items.filter(i => !i.variant.request);
    const once = fixed.reduce((sum, i) => sum + i.variant.once, 0);
    const monthly = fixed.reduce((sum, i) => sum + (i.variant.monthly || 0), 0);
    const rate = discountRate(fixed.length);
    const round = v => Math.round(v * 100) / 100;
    return { items, fixedCount: fixed.length, hasRequest: fixed.length < items.length, once, monthly, rate, onceNet: round(once * (1 - rate)), monthlyNet: round(monthly * (1 - rate)), hasFrom: fixed.some(i => i.variant.from) };
  }

  function totalsHTML(c) {
    const lines = [];
    if (c.once) {
      if (c.rate) lines.push(`<tr><td>Einmalig</td><td>${euro(c.once)}</td></tr><tr class="pr-discount"><td>Paketrabatt ${c.rate * 100} %</td><td>−${euro(c.once - c.onceNet)}</td></tr>`);
      lines.push(`<tr class="pr-total"><td>Einmalig ${TOTAL}</td><td>${c.hasFrom ? 'ab ' : ''}${euro(c.onceNet)}</td></tr>`);
      if (UST) lines.push(`<tr class="pr-gross"><td>inkl. ${UST * 100} % MwSt.</td><td>${euro(Math.round(c.onceNet * (1 + UST) * 100) / 100)}</td></tr>`);
    }
    if (c.monthly) {
      if (c.rate) lines.push(`<tr><td>Monatlich</td><td>${euro(c.monthly)}</td></tr><tr class="pr-discount"><td>Paketrabatt ${c.rate * 100} %</td><td>−${euro(c.monthly - c.monthlyNet)}</td></tr>`);
      lines.push(`<tr class="pr-total"><td>Monatlich ${TOTAL}</td><td>${euro(c.monthlyNet)}</td></tr>`);
      if (UST) lines.push(`<tr class="pr-gross"><td>inkl. ${UST * 100} % MwSt.</td><td>${euro(Math.round(c.monthlyNet * (1 + UST) * 100) / 100)}</td></tr>`);
    }
    if (c.hasRequest) lines.push(`<tr class="pr-gross"><td colspan="2">${lines.length ? 'zzgl. ' : ''}Leistungen nach Absprache – den genauen Preis erhältst du im Angebot.</td></tr>`);
    return `<table class="pr-totals">${lines.join('')}</table>`;
  }

  let shown = [0, 0];
  let lastRate = 0;
  function update() {
    const c = calculate();
    checkout.hidden = !c.items.length;
    dock.querySelectorAll('.pk-step').forEach(step => step.classList.toggle('full', c.fixedCount >= Number(step.dataset.min)));
    if (c.rate > lastRate) { toast(`${c.rate * 100} % Rabatt freigeschaltet!`); burst(); }
    lastRate = c.rate;
    count(Math.round(c.onceNet), Math.round(c.monthlyNet), c.hasFrom);
    const saved = (c.once - c.onceNet) + (c.monthly - c.monthlyNet);
    const next = [...RABATT].reverse().find(([min]) => c.fixedCount < min);
    const toNext = next ? `noch ${next[0] - c.fixedCount} bis −${next[1] * 100} %` : 'maximaler Rabatt';
    saveEl.textContent = !c.items.length ? 'Tippe auf eine Leistung, um zu starten.' : saved ? `Du sparst ${euro(Math.round(saved))}${c.monthly - c.monthlyNet ? ' (inkl. Monatsrabatt)' : ''} · ${toNext}` : c.fixedCount ? toNext : 'Preis nach Absprache';
    cta.classList.toggle('ready', c.items.length > 0);
    summary.innerHTML = c.items.length ? `<ul class="pr-lines">${c.items.map(i => `<li><span>${i.service.name}<small>${i.variant.name}${i.details ? ` · ${escape(i.details)}` : ''}</small></span><b>${price(i.variant)}</b></li>`).join('')}</ul>${totalsHTML(c)}` : '';
  }

  function count(once, monthly, from) {
    const [fromOnce, fromMonthly] = shown;
    const start = performance.now();
    const step = now => {
      const k = reduceMotion() ? 1 : Math.min(1, (now - start) / 450);
      const e = 1 - Math.pow(1 - k, 3);
      const o = Math.round(fromOnce + (once - fromOnce) * e);
      const m = Math.round(fromMonthly + (monthly - fromMonthly) * e);
      totalEl.innerHTML = `${from && o ? '<small>ab </small>' : ''}${o || !m ? euro(o) : ''}${m ? `${o ? ' + ' : ''}${euro(m)}<small>/Monat</small>` : ''}`;
      if (k < 1) requestAnimationFrame(step); else shown = [once, monthly];
    };
    requestAnimationFrame(step);
  }

  function toast(text) {
    toastEl.textContent = text;
    toastEl.classList.add('show');
    clearTimeout(toastEl.timer);
    toastEl.timer = setTimeout(() => toastEl.classList.remove('show'), 1900);
  }

  function burst() {
    if (reduceMotion()) return;
    const box = dock.querySelector('.pk-meter').getBoundingClientRect();
    for (let i = 0; i < 26; i++) {
      const spark = document.createElement('div');
      spark.className = 'pk-spark';
      spark.style.left = `${box.left + Math.random() * box.width}px`;
      spark.style.top = `${box.top}px`;
      spark.style.background = ['#e6d0ad', '#f4f1ea', '#d2b894'][i % 3];
      spark.style.setProperty('--x', `${Math.random() * 160 - 80}px`);
      spark.style.setProperty('--y', `${-60 - Math.random() * 120}px`);
      document.body.append(spark);
      setTimeout(() => spark.remove(), 950);
    }
  }

  function offerText(c, data) {
    const lines = c.items.map(i => `- ${i.service.name} (${i.variant.name}${i.details ? `; ${i.details}` : ''}): ${price(i.variant)}`);
    const sums = [];
    if (c.once) sums.push(`Einmalig ${TOTAL}: ${c.hasFrom ? 'ab ' : ''}${euro(c.onceNet)}`);
    if (c.monthly) sums.push(`Monatlich ${TOTAL}: ${euro(c.monthlyNet)}`);
    return [`Angebot ${data.number}`, `Kunde: ${data.name}${data.company ? `, ${data.company}` : ''}`, `E-Mail: ${data.email}`, data.phone ? `Telefon: ${data.phone}` : '', '', 'Leistungen:', ...lines, '', c.rate ? `Paketrabatt: ${c.rate * 100} %` : 'Kein Paketrabatt', ...sums, UST_NOTE, '', data.message ? `Nachricht: ${data.message}` : ''].filter((line, i, all) => line || all[i - 1]).join('\n');
  }

  function showOffer(c, data) {
    const today = new Date();
    const valid = new Date(today.getTime() + 30 * 864e5);
    const date = d => d.toLocaleDateString('de-DE');
    offer.innerHTML = `<div class="po-head"><img src="/logo/socialclip-logo-footer-cream.svg" alt="SocialClip"><div><b>Angebot ${data.number}</b>${date(today)} · gültig bis ${date(valid)}</div></div>
      <div class="po-parties"><div><small>Für</small>${escape(data.name)}${data.company ? `<br>${escape(data.company)}` : ''}<br>${escape(data.email)}${data.phone ? `<br>${escape(data.phone)}` : ''}</div><div><small>Von</small>SocialClip Art · Media · Digital<br>Mircea Alin, Donato-Polli-Str. 38<br>91056 Erlangen · 0176 46188101</div></div>
      <table class="po-items"><thead><tr><th>Leistung</th><th>Einmalig</th><th>Monatlich</th></tr></thead><tbody>${c.items.map(i => `<tr><td>${i.service.name}<small>${i.variant.name}${i.details ? ` · ${escape(i.details)}` : ''}</small></td><td>${i.variant.request ? 'nach Absprache' : `${i.variant.from ? 'ab ' : ''}${euro(i.variant.once)}`}</td><td>${i.variant.monthly ? euro(i.variant.monthly) : '–'}</td></tr>`).join('')}</tbody></table>
      ${totalsHTML(c)}
      <p class="po-note">Alle Preise in Euro. ${UST_NOTE} Monatliche Leistungen: Mindestlaufzeit 3 Monate, danach monatlich kündbar. Druckkosten und Werbebudgets sind nicht enthalten. „ab“-Preise und Leistungen „nach Absprache“ werden nach einem kurzen Gespräch verbindlich festgelegt. Dieses Angebot wird nach persönlicher Abstimmung bestätigt.</p>
      <div class="po-actions"><button type="button" class="service-button primary" data-print>Als PDF speichern</button></div>`;
    offer.hidden = false;
    offer.querySelector('[data-print]').addEventListener('click', () => window.print());
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const c = calculate();
    if (!c.items.length) return;
    const fd = new FormData(form);
    const data = Object.fromEntries(['name', 'company', 'email', 'phone', 'message'].map(k => [k, String(fd.get(k) || '').trim()]));
    const now = new Date();
    data.number = `SC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    status.textContent = 'Wird gesendet …';
    try {
      const body = new FormData();
      body.append('_subject', `Angebotsanfrage ${data.number}: ${c.items.map(i => i.service.name).join(', ')}`);
      body.append('name', data.name);
      body.append('email', data.email);
      body.append('message', offerText(c, data));
      const response = await fetch(form.action, { method: 'POST', body, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('send failed');
      status.textContent = '';
      form.hidden = true;
      success.hidden = false;
      showOffer(c, data);
      offer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      status.textContent = 'Das hat leider nicht geklappt. Versuch es bitte noch einmal oder ruf uns an: 0176 46188101.';
    } finally {
      submit.disabled = false;
    }
  });

  // Vorauswahl über /preise/?l=flyer,visitenkarte (auch IDs aus dem Project Builder wie strategie)
  const preselect = new URLSearchParams(location.search).get('l');
  if (preselect) for (const id of preselect.split(',')) {
    const direct = SERVICES.find(s => s.id === id);
    const alias = SERVICES.find(s => s.aliases && s.aliases.includes(id));
    if (direct) toggle(direct.id, true);
    else if (alias && !selected.has(alias.id)) toggle(alias.id, true, alias.aliases.indexOf(id));
  }
  lastRate = calculate().rate;
  update();
})();
