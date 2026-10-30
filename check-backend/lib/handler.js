import { createHash, timingSafeEqual } from 'node:crypto';
import { pruefen as standardPruefen } from './fakten.js';

const allowedOrigins = new Set(['https://socialclip.art', 'https://www.socialclip.art', 'http://localhost:8080']);
const buckets = new Map();
const gleich = (a, b) => { const x = createHash('sha256').update(String(a)).digest(), y = createHash('sha256').update(String(b)).digest(); return timingSafeEqual(x, y); };

// Nur der Inhaber darf prüfen: Zugangscode (CHECK_TOKEN) im Header. So kann niemand Kosten erzeugen.
export function createHandler({ pruefen = standardPruefen, env = process.env, now = Date.now } = {}) {
  return async function handle(request) {
    const origin = request.headers.get('origin');
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' };
    if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
    const respond = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
    if (origin && !allowedOrigins.has(origin)) return respond({ error: 'origin_not_allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Check-Token', 'Access-Control-Max-Age': '600' } });
    if (!env.CHECK_TOKEN) return respond({ error: 'not_configured', message: 'Der Check ist noch nicht eingerichtet (CHECK_TOKEN fehlt).' }, 503);
    const token = request.headers.get('x-check-token') || '';
    if (!gleich(token, env.CHECK_TOKEN)) return respond({ error: 'unauthorized', message: 'Zugangscode falsch.' }, 401);
    if (request.method === 'GET') return respond({ ok: true, google: !!env.GOOGLE_PLACES_KEY, version: 1 });
    if (request.method !== 'POST') return respond({ error: 'method_not_allowed' }, 405, { 'Allow': 'GET, POST, OPTIONS' });
    if (Number(request.headers.get('content-length') || 0) > 2000) return respond({ error: 'request_too_large' }, 413);
    let input; try { input = JSON.parse(await request.text()); } catch { return respond({ error: 'invalid_json' }, 400); }
    const eingabe = typeof input?.eingabe === 'string' ? input.eingabe.trim() : '';
    const ort = typeof input?.ort === 'string' && input.ort.trim() ? input.ort.trim().slice(0, 60) : 'Erlangen';
    if (eingabe.length < 2 || eingabe.length > 200) return respond({ error: 'invalid_input', message: 'Bitte Website oder Firmennamen eingeben.' }, 400);
    // Schutz gegen Dauerschleifen, auch mit gültigem Code
    const t = now();
    for (const [k, v] of buckets) if (t - v.start > 60000) buckets.delete(k);
    const b = buckets.get('x') || { start: t, count: 0 }; b.count++; buckets.set('x', b);
    if (b.count > 30) return respond({ error: 'rate_limited', message: 'Bitte kurz warten (max. 30 Checks pro Minute).' }, 429, { 'Retry-After': '60' });
    try { return respond(await pruefen({ eingabe, ort })); }
    catch { return respond({ error: 'temporarily_unavailable', message: 'Der Check hat gerade nicht geklappt. Bitte gleich noch einmal versuchen.' }, 503); }
  };
}
