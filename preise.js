(() => {
  // Alle Preise in Euro, hier zentral anpassen. Bei UST > 0 gelten sie als Nettopreise.
  const UST = 0; // 0 = Kleinunternehmerregelung (§ 19 UStG), 0.19 = Regelbesteuerung
  const UST_NOTE = UST ? `Alle Preise netto zzgl. ${UST * 100} % MwSt.` : 'Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.';
  const TOTAL = UST ? 'netto' : 'gesamt';
  const RABATT = [[4, 0.15], [3, 0.10], [2, 0.05]]; // ab X Leistungen → Rabatt
  const SERVICES = [
    { id: 'social', name: 'Social Media', desc: 'Strategie, Beiträge, Reels und Stories für Instagram, Facebook oder TikTok.', variants: [
      { name: 'Start · Instagram, 8 Beiträge/Monat', once: 290, monthly: 740 },
      { name: 'Wachstum · 2 Kanäle, 12 Beiträge, 1 Shooting', once: 390, monthly: 1140 },
      { name: 'Premium · 3 Kanäle, 16 Beiträge, 2 Shootings, Ads', once: 590, monthly: 1540 }] },
    { id: 'nova', name: 'KI-Telefonassistenz Nova', desc: 'Nimmt Anrufe an, wenn niemand abhebt, und schickt dir Rückrufwünsche per E-Mail. Inkl. Telefonnummer, Einrichtung und Pflege. Wähle, wie viele Gesprächsminuten du pro Monat brauchst.', estimator: true, variants: [
      { name: 'Basis · 150 Minuten/Monat, jede weitere 0,50 €', minutes: 150, once: 490, monthly: 150 },
      { name: 'Standard · 300 Minuten/Monat, jede weitere 0,45 €', minutes: 300, once: 490, monthly: 250 },
      { name: 'Profi · 600 Minuten/Monat, jede weitere 0,40 €', minutes: 600, once: 490, monthly: 430 },
      { name: 'Business · 1.200 Minuten/Monat, jede weitere 0,35 €', minutes: 1200, once: 490, monthly: 750 }] },
    { id: 'web', name: 'Webseite', desc: 'Moderne Website mit mobiler Darstellung, klaren Inhalten und Kontaktwegen.', variants: [
      { name: 'Onepager Basic · eine Seite, ohne Extras', once: 350 },
      { name: 'Onepager Plus · mit Kontaktformular & Google-Grundoptimierung', once: 690 },
      { name: 'Business-Website bis 5 Seiten', once: 1490 },
      { name: 'Persönliche Idee · wir besprechen alles gemeinsam', request: true, fields: [
        { key: 'Seiten', label: 'Wie viele Seiten ungefähr?', type: 'number', placeholder: 'z. B. 8' },
        { key: 'Idee', label: 'Beschreib kurz deine Idee', type: 'text', placeholder: 'z. B. Online-Shop, Buchung, Galerie …' }] }] },
    { id: 'tiktok', name: 'TikTok Marketing', desc: 'Kurzvideo-Konzepte, Schnitt und Betreuung deines TikTok-Kanals.', variants: [
      { name: '8 Videos pro Monat', once: 290, monthly: 590 },
      { name: 'Individuell · Anzahl Videos selbst wählen', request: true, fields: [
        { key: 'Videos pro Monat', label: 'Wie viele Videos pro Monat?', type: 'number', placeholder: 'z. B. 12' }] }] },
    { id: 'online', name: 'Online Marketing', desc: 'Einrichtung und Betreuung von Google- und Meta-Anzeigen. Werbebudget zahlst du direkt an die Plattform.', variants: [
      { name: 'Anzeigen-Betreuung', once: 290, monthly: 390 }] },
    { id: 'logo', name: 'Logo & Branding', desc: 'Ein Logo und eine visuelle Sprache, die wiedererkannt wird. Inkl. 2 Entwürfen und 2 Korrekturrunden, weitere Korrekturen nach Aufwand.', variants: [
      { name: 'Logo', once: 150, from: true },
      { name: 'Logo + Farben, Schriften & Vorlagen', once: 490, from: true }] },
    { id: 'flyer', name: 'Flyer', desc: 'Druckfertiges Flyerdesign für Angebote, Aktionen und Veranstaltungen. Inkl. 2 Korrekturrunden, Druck nicht enthalten.', variants: [
      { name: 'Einseitig', once: 60 },
      { name: 'Zweiseitig', once: 90 },
      { name: 'Faltflyer', once: 150 }] },
    { id: 'visitenkarte', name: 'Visitenkarte', desc: 'Druckfertiges Visitenkartendesign. Inkl. 2 Korrekturrunden, Druck nicht enthalten.', variants: [
      { name: 'Einseitig', once: 50 },
      { name: 'Beidseitig', once: 80 }] },
    { id: 'speisekarte', name: 'Speisekarte', desc: 'Individuelle Speisekarte im Stil deines Betriebs, druckfertig. Der genaue Preis richtet sich nach Seitenzahl und Umfang.', variants: [
      { name: 'Individuell, je nach Seitenzahl', once: 80, from: true, fields: [
        { key: 'Seiten', label: 'Wie viele Seiten ungefähr?', type: 'number', placeholder: 'z. B. 4' }] }] },
    { id: 'foto-video', name: 'Foto & Video', desc: 'Bearbeitung deiner Fotos und Schnitt von Kurzvideos.', variants: [
      { name: 'Fotobearbeitung bis 20 Bilder', once: 150 },
      { name: 'Videoschnitt bis 60 Sekunden', once: 190 }] },
    { id: 'lebenslauf', name: 'Lebenslauf', desc: 'Klar gestalteter Lebenslauf als PDF. Für 20 € mehr gibt es das passende Anschreiben dazu.', variants: [
      { name: 'Lebenslauf', once: 50 },
      { name: 'Lebenslauf + Anschreiben (+20 €)', once: 70 }] },
    { id: 'programmierung', name: 'Programmierung', desc: 'Individuelle Webfunktionen, Tools und Automatisierungen.', variants: [
      { name: 'Individuelles Projekt', once: 690, from: true }] },
    { id: 'neukunden', name: 'Neukundengewinnung', desc: 'Angebot, Sichtbarkeit und Kontaktwege aufeinander abstimmen.', variants: [
      { name: 'Konzept & Umsetzungsplan', once: 490 }] },
    { id: 'strategie', name: 'Marketingstrategie', desc: 'Zielgruppe, Kanäle und Schwerpunkte in einem klaren Plan.', variants: [
      { name: 'Strategie-Workshop & Plan', once: 390 }] }
  ];

  const root = document.getElementById('preisRechner');
  if (!root) return;
  const list = root.querySelector('.pr-list');
  const summary = root.querySelector('.pr-summary-body');
  const form = document.getElementById('preisForm');
  const status = document.getElementById('preisStatus');
  const success = document.getElementById('preisSuccess');
  const offer = document.getElementById('preisOffer');
  const selected = new Map(); // id → variant index
  const bar = document.createElement('a');
  bar.className = 'pr-bar';
  bar.href = '#preisSumme';
  bar.hidden = true;
  document.body.append(bar);

  const euro = value => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const price = v => v.request ? 'Preis nach Absprache' : `${v.from ? 'ab ' : ''}${euro(v.once)}${v.monthly ? ` + ${euro(v.monthly)}/Monat` : ''}`;
  const fixedFrom = service => {
    const fixed = service.variants.filter(v => !v.request);
    const monthly = fixed.filter(v => v.monthly).map(v => v.monthly);
    return `${service.variants.length > 1 || fixed[0].from ? 'ab ' : ''}${euro(Math.min(...fixed.map(v => v.once)))}${monthly.length ? ` + ${euro(Math.min(...monthly))}/Monat` : ''}`;
  };
  const escape = text => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const discountRate = count => (RABATT.find(([min]) => count >= min) || [0, 0])[1];

  document.querySelectorAll('[data-ust-note]').forEach(el => { el.textContent = UST_NOTE; });

  for (const service of SERVICES) {
    const card = document.createElement('div');
    card.className = 'pr-item';
    card.dataset.id = service.id;
    const estimator = service.estimator ? `<div class="pr-estimate"><label for="e-${service.id}">Wie viele Anrufe soll Nova ungefähr pro Tag annehmen?</label><input id="e-${service.id}" type="number" min="1" max="200" inputmode="numeric" placeholder="z. B. 5"><p aria-live="polite"></p></div>` : '';
    const fields = (v, i) => v.fields ? `<div class="pr-fields" data-variant="${i}"${i ? ' hidden' : ''}>${v.fields.map(f => `<label>${f.label}<input type="${f.type}" data-field="${f.key}" placeholder="${f.placeholder}"${f.type === 'number' ? ' min="1" inputmode="numeric"' : ''}></label>`).join('')}</div>` : '';
    const options = estimator + service.variants.map((v, i) => `<label class="pr-variant"><input type="radio" name="v-${service.id}" value="${i}"${i ? '' : ' checked'}><span>${v.name}</span><b>${price(v)}</b></label>${fields(v, i)}`).join('');
    card.innerHTML = `<label class="pr-head"><input type="checkbox" class="pr-check" aria-describedby="d-${service.id}"><span class="pr-name">${service.name}</span><span class="pr-from">${fixedFrom(service)}</span></label><p class="pr-desc" id="d-${service.id}">${service.desc}</p><div class="pr-variants">${options}</div>`;
    const check = card.querySelector('.pr-check');
    check.addEventListener('change', () => {
      if (check.checked) selected.set(service.id, Number(card.querySelector('input[type=radio]:checked').value));
      else selected.delete(service.id);
      card.classList.toggle('selected', check.checked);
      render();
    });
    card.querySelectorAll('input[type=radio]').forEach(radio => radio.addEventListener('change', () => {
      if (!check.checked) { check.checked = true; card.classList.add('selected'); }
      selected.set(service.id, Number(radio.value));
      card.querySelectorAll('.pr-fields').forEach(box => { box.hidden = box.dataset.variant !== radio.value; });
      render();
    }));
    card.querySelectorAll('[data-field]').forEach(input => input.addEventListener('input', render));
    if (service.estimator) {
      // Annahme: ca. 2,5 Minuten pro Anruf, 22 Arbeitstage im Monat
      const input = card.querySelector('.pr-estimate input');
      const result = card.querySelector('.pr-estimate p');
      input.addEventListener('input', () => {
        const calls = Number(input.value);
        if (!calls || calls < 0) { result.textContent = ''; return; }
        const minutes = Math.ceil(calls * 2.5 * 22 / 10) * 10;
        const index = service.variants.findIndex(v => v.minutes >= minutes);
        const pick = index === -1 ? service.variants.length - 1 : index;
        result.textContent = `Das sind etwa ${minutes.toLocaleString('de-DE')} Minuten im Monat. Empfehlung: ${service.variants[pick].name.split(' · ')[0]}${index === -1 ? ' – sprich uns für mehr Minuten gern an' : ''}.`;
        const radio = card.querySelectorAll('input[type=radio]')[pick];
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      });
    }
    list.append(card);
  }

  function calculate() {
    const items = [...selected].map(([id, index]) => {
      const service = SERVICES.find(s => s.id === id);
      const details = [...list.querySelectorAll(`[data-id="${id}"] .pr-fields[data-variant="${index}"] [data-field]`)]
        .filter(input => input.value.trim()).map(input => `${input.dataset.field}: ${input.value.trim()}`).join(', ');
      return { service, variant: service.variants[index], details };
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
    const rows = [];
    if (c.once) {
      if (c.rate) rows.push(`<tr><td>Einmalig</td><td>${euro(c.once)}</td></tr><tr class="pr-discount"><td>Paketrabatt ${c.rate * 100} %</td><td>−${euro(c.once - c.onceNet)}</td></tr>`);
      rows.push(`<tr class="pr-total"><td>Einmalig ${TOTAL}</td><td>${c.hasFrom ? 'ab ' : ''}${euro(c.onceNet)}</td></tr>`);
      if (UST) rows.push(`<tr class="pr-gross"><td>inkl. ${UST * 100} % MwSt.</td><td>${euro(Math.round(c.onceNet * (1 + UST) * 100) / 100)}</td></tr>`);
    }
    if (c.monthly) {
      if (c.rate) rows.push(`<tr><td>Monatlich</td><td>${euro(c.monthly)}</td></tr><tr class="pr-discount"><td>Paketrabatt ${c.rate * 100} %</td><td>−${euro(c.monthly - c.monthlyNet)}</td></tr>`);
      rows.push(`<tr class="pr-total"><td>Monatlich ${TOTAL}</td><td>${euro(c.monthlyNet)}</td></tr>`);
      if (UST) rows.push(`<tr class="pr-gross"><td>inkl. ${UST * 100} % MwSt.</td><td>${euro(Math.round(c.monthlyNet * (1 + UST) * 100) / 100)}</td></tr>`);
    }
    if (c.hasRequest) rows.push(`<tr class="pr-gross"><td colspan="2">${rows.length ? 'zzgl. ' : ''}Leistungen nach Absprache – den genauen Preis erhältst du im Angebot.</td></tr>`);
    return `<table class="pr-totals">${rows.join('')}</table>`;
  }

  function nextDiscountHint(count) {
    const next = [...RABATT].reverse().find(([min]) => count < min);
    if (!next) return 'Du erhältst den maximalen Paketrabatt.';
    const missing = next[0] - count;
    return `Noch ${missing} ${missing === 1 ? 'Leistung' : 'Leistungen'} bis ${next[1] * 100} % Paketrabatt.`;
  }

  function render() {
    const c = calculate();
    form.hidden = !c.items.length;
    bar.hidden = !c.items.length;
    bar.innerHTML = `<span>${c.items.length} ${c.items.length === 1 ? 'Leistung' : 'Leistungen'} · ${[c.once ? euro(c.onceNet) : '', c.monthly ? `${euro(c.monthlyNet)}/Monat` : ''].filter(Boolean).join(' + ') || 'nach Absprache'}</span><b>Zum Angebot →</b>`;
    if (!c.items.length) {
      summary.innerHTML = `<p class="pr-empty">Wähle links eine oder mehrere Leistungen. Ab 2 Leistungen gibt es 5 %, ab 3 Leistungen 10 % und ab 4 Leistungen 15 % Paketrabatt.</p>`;
      return;
    }
    summary.innerHTML = `<ul class="pr-lines">${c.items.map(i => `<li><span>${i.service.name}<small>${i.variant.name}${i.details ? ` · ${escape(i.details)}` : ''}</small></span><b>${price(i.variant)}</b></li>`).join('')}</ul>${totalsHTML(c)}<p class="pr-next">${nextDiscountHint(c.fixedCount)}</p>`;
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
      <p class="po-note">Alle Preise in Euro. ${UST_NOTE} Monatliche Leistungen: Mindestlaufzeit 3 Monate, danach monatlich kündbar. Druckkosten und Werbebudgets sind nicht enthalten. „ab“-Preise werden nach einem kurzen Gespräch verbindlich festgelegt. Leistungen „nach Absprache“ werden nach einem Gespräch ergänzt. Dieses Angebot wird nach persönlicher Abstimmung bestätigt.</p>
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

  // Vorauswahl über /preise/?l=flyer,visitenkarte
  const preselect = new URLSearchParams(location.search).get('l');
  if (preselect) for (const id of preselect.split(',')) {
    const card = list.querySelector(`[data-id="${CSS.escape(id)}"] .pr-check`);
    if (card) { card.checked = true; card.dispatchEvent(new Event('change')); }
  }
  render();
})();
