// Lokaler Testserver: FITMI_FAKE=1 node dev.mjs  →  http://localhost:8788/api/chat
// Mit echter KI: ANTHROPIC_API_KEY=… node dev.mjs
import { createServer } from 'node:http';
import { createHandler } from './lib/handler.js';
const handle = createHandler({ env: { ...process.env, ALLOWED_ORIGINS: 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:8081' } });
createServer(async (req, res) => {
  const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : await new Promise((ok) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => ok(d)); });
  const r = await handle(new Request('http://localhost:8788' + req.url, { method: req.method, headers: req.headers, body }));
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
}).listen(8788, () => console.log('FITMI-Testserver läuft auf http://localhost:8788/api/chat'));
