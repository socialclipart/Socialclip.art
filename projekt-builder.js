(() => {
  const triggers = [...document.querySelectorAll('[data-detail-project]')];
  if (!triggers.length) return;
  const services = ["Webseite", "Flyer", "Online Marketing", "Visitenkarte", "Social Media", "Logo", "Video & Foto", "Lebenslauf", "Speisekarte", "Virtueller Assistent", "Programmierung", "Neukundengewinnung", "Strategieentwicklung", "TikTok Marketing"];
  const selection = new Set();
  let opener = null;
  let previousOverflow = '';
  const dialog = document.createElement('dialog');
  dialog.className = 'detail-project-builder';
  dialog.id = 'detailProjectBuilder';
  dialog.setAttribute('aria-labelledby', 'detailProjectTitle');
  dialog.innerHTML = `<div class="detail-builder-head"><span>SOCIALCLIP / PROJECT BUILDER</span><button class="detail-builder-close" type="button" aria-label="Schließen">×</button></div>
    <div class="detail-builder-body"><h2 id="detailProjectTitle">Was brauchst<br><span>du?</span></h2><p class="detail-builder-sub">Wähle eine oder mehrere Leistungen.</p>
    <div class="detail-builder-options" id="detailProjectOptions"></div>
    <div class="detail-builder-summary"><div class="detail-builder-label">DEIN PROJEKT</div><div id="detailProjectSummary" class="detail-builder-tags" aria-live="polite"></div><p id="detailProjectHint" class="detail-builder-hint" aria-live="polite"></p><button class="detail-builder-submit" type="button">PROJEKT ANFRAGEN <span aria-hidden="true">→</span></button><a class="detail-builder-price" href="/preise/">IM PREISRECHNER BERECHNEN <span aria-hidden="true">→</span></a></div></div>`;
  document.body.append(dialog);
  const options = dialog.querySelector('#detailProjectOptions');
  const summary = dialog.querySelector('#detailProjectSummary');
  const hint = dialog.querySelector('#detailProjectHint');
  const buttons = [];
  const priceLink = dialog.querySelector('.detail-builder-price');
  const priceIds = {"Webseite": "web", "Flyer": "flyer", "Online Marketing": "online", "Visitenkarte": "visitenkarte", "Social Media": "social", "Logo": "logo", "Video & Foto": "foto-video", "Lebenslauf": "lebenslauf", "Speisekarte": "speisekarte", "Virtueller Assistent": "nova", "Programmierung": "programmierung", "Neukundengewinnung": "neukunden", "Strategieentwicklung": "strategie", "TikTok Marketing": "tiktok"};
  function updateSelection() {
    for (const button of buttons) {
      const selected = selection.has(button.dataset.service);
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    summary.replaceChildren();
    for (const service of selection) {
      const tag = document.createElement('span');
      tag.textContent = service;
      summary.append(tag);
    }
    if (!selection.size) summary.textContent = 'Noch keine Auswahl';
    const ids = [...selection].map(service => priceIds[service]).filter(Boolean);
    priceLink.href = `/preise/${ids.length ? `?l=${ids.join(',')}` : ''}#rechner`;
    hint.textContent = '';
  }
  services.forEach((service, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.service = service;
    button.className = 'detail-builder-option';
    button.setAttribute('aria-pressed', 'false');
    const name = document.createElement('span'); name.textContent = service;
    const number = document.createElement('small'); number.textContent = String(index + 1).padStart(2, '0');
    button.append(name, number);
    button.addEventListener('click', () => {
      if (selection.has(service)) selection.delete(service); else selection.add(service);
      updateSelection();
    });
    options.append(button); buttons.push(button);
  });
  triggers.forEach(trigger => trigger.addEventListener('click', () => {
    if (!services.includes(trigger.dataset.detailProject)) return;
    opener = trigger;
    selection.add(trigger.dataset.detailProject);
    updateSelection();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.scrollTop = 0;
  }));
  dialog.querySelector('.detail-builder-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus({preventScroll:true});
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.querySelector('.detail-builder-submit').addEventListener('click', () => {
    if (!selection.size) { hint.textContent = 'Wähle bitte mindestens eine Leistung aus.'; return; }
    const target = new URL('/', location.origin);
    for (const service of selection) target.searchParams.append('anfrage', service);
    target.hash = 'kontakt';
    location.assign(target.href);
  });
})();
