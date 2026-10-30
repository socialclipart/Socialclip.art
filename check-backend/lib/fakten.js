// Sammelt prüfbare Fakten über einen Betrieb: Website-Quelltext, Google-Messung (PageSpeed) und Google-Profil (Places).
// Keine KI. Bewertet wird nicht hier, sondern auf der Website mit den festen Regeln aus /check/regeln.js.
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const UA = 'Mozilla/5.0 (compatible; SocialClipCheck/1.0; +https://socialclip.art/check/)';
const MAX_BYTES = 2_500_000;

// ---------- Sicherheit: keine internen Adressen abrufen ----------
function privat(ip) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return privat(v.slice(7));
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}
async function sicher(url) {
  if (!/^https?:$/.test(url.protocol)) throw new Error('protokoll');
  if (url.port && !['80', '443'].includes(url.port)) throw new Error('port');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const ips = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!ips.length || ips.some((x) => privat(x.address))) throw new Error('adresse');
}

export function normUrl(eingabe) {
  let s = String(eingabe || '').trim();
  if (!s || /\s/.test(s) || !/\.[a-z]{2,}/i.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try { const u = new URL(s); return u.hostname.includes('.') ? u : null; } catch { return null; }
}

// Lädt eine Seite, folgt Weiterleitungen selbst (jede einzeln geprüft) und begrenzt Größe und Zeit
export async function laden(start, { fetchImpl = fetch, pruefen = sicher, timeout = 12000 } = {}) {
  let url = start, kette = [];
  for (let i = 0; i < 6; i++) {
    await pruefen(url);
    const r = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(timeout),
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'de-DE,de;q=0.9' } });
    if (r.status >= 300 && r.status < 400 && r.headers.get('location')) {
      kette.push(url.href); url = new URL(r.headers.get('location'), url); continue;
    }
    let html = '';
    if (r.body && /html|xml|text/i.test(r.headers.get('content-type') || 'text/html')) {
      const reader = r.body.getReader(), dec = new TextDecoder(); let n = 0;
      while (true) { const { done, value } = await reader.read(); if (done) break; n += value.length; html += dec.decode(value, { stream: true }); if (n > MAX_BYTES) { await reader.cancel(); break; } }
    }
    return { status: r.status, url: url.href, kette, html };
  }
  throw new Error('zu_viele_weiterleitungen');
}

// ---------- Quelltext auslesen (ohne Bibliothek, robust gegen kaputtes HTML) ----------
const text = (s) => s.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i')); return m ? (m[2] ?? m[3] ?? m[4] ?? '').trim() : null; };
const meta = (html, key) => {
  for (const t of html.match(/<meta\b[^>]*>/gi) || []) {
    const k = (attr(t, 'name') || attr(t, 'property') || '').toLowerCase();
    if (k === key) return attr(t, 'content') || '';
  }
  return null;
};

export function quelltext(html, seitenUrl, jahr = new Date().getFullYear()) {
  const links = (html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || []).map((a) => ({ href: (attr(a, 'href') || '').trim(), text: text(a).toLowerCase() }));
  const hrefs = links.map((l) => l.href.toLowerCase());
  const body = text(html), bodyL = body.toLowerCase();
  const titel = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  const h1 = (html.match(/<h1\b[\s\S]*?<\/h1>/gi) || []).map(text).filter(Boolean);
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const mitAlt = imgs.filter((t) => (attr(t, 'alt') || '').length > 1).length;
  const ld = (html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || []).join(' ');
  const jahre = [...body.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map((m) => +m[1]);
  const social = {};
  for (const [k, re] of [['instagram', /instagram\.com\/(?!p\/|reel|explore)/], ['facebook', /facebook\.com\/(?!sharer|share|dialog)/], ['tiktok', /tiktok\.com\/@/], ['youtube', /youtube\.com\/(@|channel|c\/|user)/], ['linkedin', /linkedin\.com\/(company|in)\//]]) {
    const h = links.find((l) => re.test(l.href)); if (h) social[k] = h.href;
  }
  let host = ''; try { host = new URL(seitenUrl).hostname; } catch {}
  return {
    https: seitenUrl.startsWith('https://'),
    titel: titel ? text(titel).slice(0, 200) : '',
    beschreibung: (meta(html, 'description') || '').slice(0, 300),
    viewport: /width\s*=\s*device-width/i.test(meta(html, 'viewport') || ''),
    h1: h1.slice(0, 3).map((x) => x.slice(0, 120)),
    impressum: links.some((l) => /impressum|imprint|legal-notice/.test(l.href.toLowerCase() + ' ' + l.text)),
    datenschutz: links.some((l) => /datenschutz|privacy/.test(l.href.toLowerCase() + ' ' + l.text)),
    telefonLink: hrefs.some((h) => h.startsWith('tel:')),
    telefonText: /(\+49|0)\s?\(?\d{2,5}\)?[\s/-]?\d{3,}/.test(body),
    email: hrefs.some((h) => h.startsWith('mailto:')) || /[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(body),
    formular: /<form\b/i.test(html) && /<(input|textarea)\b/i.test(html),
    whatsapp: hrefs.some((h) => /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//.test(h)),
    adresse: /\b\d{5}\s+[A-ZÄÖÜ][a-zäöüß]+/.test(body),
    strukturiert: /"@type"\s*:\s*"?(\[?[^"]*")?(LocalBusiness|Organization|Restaurant|Store|[A-Za-z]*Business|AutoRepair|HairSalon|BeautySalon|Dentist|Physician|ProfessionalService|FoodEstablishment)/i.test(ld),
    vorschaubild: !!meta(html, 'og:image'),
    favicon: /<link\b[^>]*rel\s*=\s*["']?[^"'>]*icon/i.test(html),
    bilder: imgs.length, bilderMitAlt: mitAlt,
    copyrightJahr: jahre.length ? Math.max(...jahre.filter((j) => j <= jahr + 1)) || null : null,
    social,
    woerter: body ? body.split(' ').length : 0,
    cookieHinweis: /cookie/i.test(bodyL),
    host
  };
}

// ---------- Google-Messung (PageSpeed Insights, Handy) ----------
export async function pagespeed(url, { key, fetchImpl = fetch } = {}) {
  const q = new URLSearchParams({ url, strategy: 'mobile', locale: 'de' });
  for (const c of ['performance', 'seo', 'accessibility', 'best-practices']) q.append('category', c);
  if (key) q.set('key', key);
  const r = await fetchImpl('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q, { signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error('pagespeed_' + r.status);
  const j = await r.json(), lh = j.lighthouseResult || {}, cat = lh.categories || {}, au = lh.audits || {};
  const p = (k) => (cat[k] && cat[k].score != null ? Math.round(cat[k].score * 100) : null);
  return {
    tempo: p('performance'), seo: p('seo'), barrierefrei: p('accessibility'), technik: p('best-practices'),
    ladezeit: au['largest-contentful-paint']?.numericValue ? Math.round(au['largest-contentful-paint'].numericValue / 100) / 10 : null,
    bild: au['final-screenshot']?.details?.data?.length < 200000 ? au['final-screenshot'].details.data : null
  };
}

// ---------- Google-Profil (Places API, neu) ----------
const FELDER = ['id', 'displayName', 'formattedAddress', 'rating', 'userRatingCount', 'websiteUri', 'nationalPhoneNumber',
  'regularOpeningHours', 'photos', 'googleMapsUri', 'primaryType', 'primaryTypeDisplayName', 'location', 'businessStatus'];
function profil(p) {
  return {
    id: p.id, name: p.displayName?.text || '', adresse: p.formattedAddress || '', sterne: p.rating ?? null,
    bewertungen: p.userRatingCount ?? 0, website: p.websiteUri || '', telefon: p.nationalPhoneNumber || '',
    zeiten: !!p.regularOpeningHours?.weekdayDescriptions?.length, fotos: (p.photos || []).length,
    maps: p.googleMapsUri || '', typ: p.primaryType || '', typName: p.primaryTypeDisplayName?.text || '',
    lage: p.location || null, status: p.businessStatus || ''
  };
}
export async function googleProfil(suche, { key, fetchImpl = fetch } = {}) {
  const r = await fetchImpl('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST', signal: AbortSignal.timeout(12000),
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': FELDER.map((f) => 'places.' + f).join(',') },
    body: JSON.stringify({ textQuery: suche, languageCode: 'de', regionCode: 'DE', maxResultCount: 1 })
  });
  if (!r.ok) throw new Error('places_' + r.status);
  const p = (await r.json()).places?.[0];
  return p ? profil(p) : null;
}
export async function konkurrenz(g, { key, fetchImpl = fetch } = {}) {
  if (!g?.lage || !g.typ) return [];
  const r = await fetchImpl('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST', signal: AbortSignal.timeout(12000),
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': ['id', 'displayName', 'rating', 'userRatingCount', 'websiteUri'].map((f) => 'places.' + f).join(',') },
    body: JSON.stringify({ includedTypes: [g.typ], maxResultCount: 8, rankPreference: 'POPULARITY', languageCode: 'de',
      locationRestriction: { circle: { center: g.lage, radius: 3000 } } })
  });
  if (!r.ok) return [];
  return ((await r.json()).places || []).filter((p) => p.id !== g.id).slice(0, 3)
    .map((p) => ({ name: p.displayName?.text || '', sterne: p.rating ?? null, bewertungen: p.userRatingCount ?? 0, website: !!p.websiteUri }));
}

// ---------- Alles zusammen ----------
export async function pruefen({ eingabe, ort = 'Erlangen' }, opt = {}) {
  const env = opt.env || process.env, f = opt.fetchImpl || fetch;
  const placesKey = env.GOOGLE_PLACES_KEY, psKey = env.PAGESPEED_KEY || env.GOOGLE_PLACES_KEY;
  const ergebnis = { eingabe: String(eingabe).slice(0, 200), ort, datum: new Date().toISOString().slice(0, 10), fehler: [] };
  let url = normUrl(eingabe);

  // Google-Profil: bei Firmennamen direkt, bei Website über den Domainnamen
  if (placesKey) {
    try {
      const suche = url ? url.hostname.replace(/^www\./, '').replace(/\.[a-z]+$/, '').replace(/[-_.]/g, ' ') + ' ' + ort : eingabe + ' ' + ort;
      ergebnis.google = await googleProfil(suche, { key: placesKey, fetchImpl: f });
      if (ergebnis.google && url && ergebnis.google.website && !ergebnis.google.website.includes(url.hostname.replace(/^www\./, ''))) ergebnis.google = null;
      if (ergebnis.google) ergebnis.konkurrenz = await konkurrenz(ergebnis.google, { key: placesKey, fetchImpl: f });
      if (!url && ergebnis.google?.website) url = normUrl(ergebnis.google.website);
    } catch { ergebnis.fehler.push('google'); }
  } else ergebnis.fehler.push('google_aus');
  ergebnis.name = ergebnis.google?.name || (url ? url.hostname.replace(/^www\./, '') : String(eingabe).trim());

  if (url) {
    const [seite, ps] = await Promise.allSettled([
      laden(url, { fetchImpl: f, pruefen: opt.pruefen }),
      opt.ohnePagespeed ? Promise.reject(new Error('aus')) : pagespeed(url.href, { key: psKey, fetchImpl: f })
    ]);
    if (seite.status === 'fulfilled' && seite.value.status < 400 && seite.value.html) {
      ergebnis.website = { url: seite.value.url, status: seite.value.status, ...quelltext(seite.value.html, seite.value.url) };
      // Ohne https-Eingabe zusätzlich prüfen, ob http automatisch auf https umleitet – schon im Ergebnis enthalten
    } else {
      ergebnis.website = { url: url.href, erreichbar: false, status: seite.value?.status || 0 };
      ergebnis.fehler.push('website');
    }
    if (ps.status === 'fulfilled') ergebnis.messung = ps.value; else ergebnis.fehler.push('messung');
  }
  return ergebnis;
}
