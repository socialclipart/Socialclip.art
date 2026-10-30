import test from 'node:test';
import assert from 'node:assert/strict';
import { quelltext, normUrl, laden, pruefen } from '../lib/fakten.js';
import { createHandler } from '../lib/handler.js';

const GUT = `<!doctype html><html lang="de"><head><title>Friseur Müller Erlangen – Haarschnitt &amp; Farbe</title>
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Dein Friseur in der Erlanger Innenstadt.">
<meta property="og:image" content="/bild.jpg"><link rel="icon" href="/favicon.ico">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"HairSalon","name":"Müller"}</script></head>
<body><h1>Friseur Müller</h1><img src="a.jpg" alt="Salon innen"><img src="b.jpg" alt="">
<p>Hauptstraße 1, 91054 Erlangen · <a href="tel:+49913112345">09131 12345</a> · <a href="mailto:info@mueller.de">Mail</a></p>
<a href="https://wa.me/49170">WhatsApp</a><a href="https://www.instagram.com/mueller/">Insta</a><a href="https://www.instagram.com/p/xyz">Post</a>
<form><input name="n"></form><footer>© 2019–2026 Müller · <a href="/impressum">Impressum</a> · <a href="/datenschutz">Datenschutz</a></footer></body></html>`;

test('liest eine gute Seite vollständig aus', () => {
  const q = quelltext(GUT, 'https://mueller.de/', 2026);
  assert.equal(q.https, true);
  assert.equal(q.titel, 'Friseur Müller Erlangen – Haarschnitt & Farbe');
  assert.equal(q.viewport, true);
  assert.deepEqual(q.h1, ['Friseur Müller']);
  for (const k of ['impressum', 'datenschutz', 'telefonLink', 'email', 'formular', 'whatsapp', 'adresse', 'strukturiert', 'vorschaubild', 'favicon']) assert.equal(q[k], true, k);
  assert.equal(q.bilder, 2); assert.equal(q.bilderMitAlt, 1);
  assert.equal(q.copyrightJahr, 2026);
  assert.deepEqual(q.social, { instagram: 'https://www.instagram.com/mueller/' });
});

test('erkennt Mängel einer schwachen Seite', () => {
  const q = quelltext('<html><body><p>Ruf an: 09131 12345</p><p>© 2017</p></body></html>', 'http://alt.de/', 2026);
  assert.equal(q.https, false); assert.equal(q.viewport, false); assert.equal(q.titel, '');
  assert.equal(q.impressum, false); assert.equal(q.telefonLink, false); assert.equal(q.telefonText, true);
  assert.equal(q.copyrightJahr, 2017); assert.deepEqual(q.social, {});
});

test('normUrl unterscheidet Website und Firmenname', () => {
  assert.equal(normUrl('mueller.de').href, 'https://mueller.de/');
  assert.equal(normUrl('http://www.x.de/a').href, 'http://www.x.de/a');
  assert.equal(normUrl('Friseur Müller'), null);
  assert.equal(normUrl('Bäckerei'), null);
});

test('folgt Weiterleitungen und prüft jede Adresse', async () => {
  const geprueft = [];
  const fetchImpl = async (u) => u.href === 'http://a.de/' ? new Response(null, { status: 301, headers: { location: 'https://a.de/' } }) : new Response('<title>A</title>', { headers: { 'content-type': 'text/html' } });
  const r = await laden(new URL('http://a.de/'), { fetchImpl, pruefen: async (u) => geprueft.push(u.href) });
  assert.equal(r.url, 'https://a.de/'); assert.deepEqual(geprueft, ['http://a.de/', 'https://a.de/']);
});

test('blockiert interne Adressen', async () => {
  await assert.rejects(laden(new URL('http://127.0.0.1/'), { fetchImpl: async () => new Response('') }));
  await assert.rejects(laden(new URL('http://192.168.0.1/'), { fetchImpl: async () => new Response('') }));
});

test('nur Firmenname ohne Google-Schlüssel ergibt ehrliches Ergebnis ohne Website', async () => {
  const r = await pruefen({ eingabe: 'Friseur Müller' }, { env: {}, fetchImpl: async () => { throw new Error('kein Abruf erwartet'); } });
  assert.equal(r.website, undefined); assert.ok(r.fehler.includes('google_aus')); assert.equal(r.name, 'Friseur Müller');
});

test('Firmenname mit Google findet Website, Profil und Konkurrenz', async () => {
  const fetchImpl = async (u, o) => {
    const s = String(u);
    if (s.includes('searchText')) return Response.json({ places: [{ id: 'p1', displayName: { text: 'Friseur Müller' }, rating: 4.2, userRatingCount: 12, websiteUri: 'https://mueller.de/', primaryType: 'hair_care', location: { latitude: 49.6, longitude: 11 }, regularOpeningHours: { weekdayDescriptions: ['Mo'] }, photos: [1, 2] }] });
    if (s.includes('searchNearby')) return Response.json({ places: [{ id: 'p1' }, { id: 'p2', displayName: { text: 'Salon B' }, rating: 4.8, userRatingCount: 140 }] });
    if (s.includes('pagespeed')) return Response.json({ lighthouseResult: { categories: { performance: { score: 0.42 }, seo: { score: 0.9 } }, audits: { 'largest-contentful-paint': { numericValue: 5300 } } } });
    return new Response(GUT, { headers: { 'content-type': 'text/html' } });
  };
  const r = await pruefen({ eingabe: 'Friseur Müller' }, { env: { GOOGLE_PLACES_KEY: 'k' }, fetchImpl, pruefen: async () => {} });
  assert.equal(r.name, 'Friseur Müller'); assert.equal(r.google.bewertungen, 12); assert.equal(r.google.zeiten, true);
  assert.deepEqual(r.konkurrenz, [{ name: 'Salon B', sterne: 4.8, bewertungen: 140, website: false }]);
  assert.equal(r.website.impressum, true); assert.equal(r.messung.tempo, 42); assert.equal(r.messung.ladezeit, 5.3);
});

test('Server verlangt Zugangscode und prüft Eingabe', async () => {
  const h = createHandler({ env: { CHECK_TOKEN: 'geheim' }, pruefen: async (x) => ({ ok: x.eingabe }) });
  const req = (token, body) => new Request('http://x/api/check', { method: 'POST', headers: { 'content-type': 'application/json', 'x-check-token': token, origin: 'https://socialclip.art' }, body: JSON.stringify(body) });
  assert.equal((await h(req('falsch', { eingabe: 'a.de' }))).status, 401);
  assert.equal((await h(req('geheim', { eingabe: '' }))).status, 400);
  const ok = await h(req('geheim', { eingabe: 'a.de' }));
  assert.equal(ok.status, 200); assert.deepEqual(await ok.json(), { ok: 'a.de' });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://socialclip.art');
  const fremd = await h(new Request('http://x/api/check', { method: 'POST', headers: { origin: 'https://boese.de' } }));
  assert.equal(fremd.status, 403);
  assert.equal((await createHandler({ env: {} })(req('x', {}))).status, 503);
});
