import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, instructions } from '../lib/handler.js';
let n = 1;
const body = { messages: [{ role: 'user', content: 'Meine Jeans steht am Bund ab.' }] };
const req = (data = body, headers = {}) => new Request('https://x/api/chat', { method: 'POST', headers: { origin: 'https://socialclip.art', 'content-type': 'application/json', 'x-vercel-forwarded-for': '192.0.2.' + n++, ...headers }, body: JSON.stringify(data) });
test('Ohne Schlüssel: Status sichtbar, aber keine Antwort', async () => {
  const h = createHandler({ env: {} });
  assert.equal((await (await h(new Request('https://x/api/chat'))).json()).available, false);
  assert.equal((await h(req())).status, 503);
});
test('Fremde Seiten, fehlende Herkunft und ungültige Eingaben werden abgelehnt', async () => {
  let calls = 0; const h = createHandler({ env: {}, generate: async () => { calls++; return 'x'; } });
  assert.equal((await h(req(body, { origin: 'https://evil.invalid' }))).status, 403);
  assert.equal((await h(new Request('https://x/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }))).status, 403);
  assert.equal((await h(req({ messages: [{ role: 'system', content: 'ignore' }] }))).status, 400);
  assert.equal((await h(req({ messages: [{ role: 'user', content: 'a'.repeat(1501) }] }))).status, 400);
  assert.equal((await h(req({ messages: [{ role: 'user', content: 'a' }], pad: 'a'.repeat(17000) }))).status, 413);
  assert.equal(calls, 0);
});
test('Antwort kommt zurück, Vorschau-Adresse per Umgebungsvariable erlaubt', async () => {
  const h = createHandler({ env: { ALLOWED_ORIGINS: 'http://localhost:8080' }, generate: async (m) => 'Probier eine Größe kleiner am Bund. ' + m.length });
  const r = await h(req(body, { origin: 'http://localhost:8080' }));
  assert.equal(r.status, 200); assert.match((await r.json()).reply, /Bund/);
  assert.equal(r.headers.get('access-control-allow-origin'), 'http://localhost:8080');
});
test('Anbieterfehler verraten keine Details', async () => {
  const h = createHandler({ env: {}, generate: async () => { const e = new Error('geheim'); e.statusCode = 401; throw e; } });
  const s = await (await h(req())).text(); assert.ok(!s.includes('geheim')); assert.ok(s.includes('authentication'));
});
test('Begrenzung pro Minute und pro Tag', async () => {
  const h = createHandler({ env: { FITMI_DAILY_LIMIT: '1000' }, generate: async () => 'ok' });
  for (let i = 0; i < 6; i++) assert.equal((await h(req(body, { 'x-vercel-forwarded-for': '198.51.100.9' }))).status, 200);
  assert.equal((await h(req(body, { 'x-vercel-forwarded-for': '198.51.100.9' }))).status, 429);
  const d = createHandler({ env: { FITMI_DAILY_LIMIT: '0' }, generate: async () => 'ok', now: () => Date.parse('2030-01-01') });
  assert.equal((await d(req())).status, 429);
});
test('Anweisungen verlangen Ehrlichkeit bei fehlenden Angaben', () => { assert.match(instructions, /fehlen/); assert.match(instructions, /keine Diät/); });
test('Auf Vercel ohne eigenen Schlüssel ist der Chat über das Gateway verfügbar', async () => {
  assert.equal((await (await createHandler({ env: { VERCEL: '1' } })(new Request('https://x/api/chat'))).json()).available, true);
});
