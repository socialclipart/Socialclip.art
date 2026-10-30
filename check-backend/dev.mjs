// Lokaler Testserver: CHECK_TOKEN=… node dev.mjs  →  http://localhost:8787/api/check
import { createServer } from 'node:http';
import { createHandler } from './lib/handler.js';
const handle = createHandler();
createServer(async (req, res) => {
  const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : await new Promise((ok) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => ok(d)); });
  const r = await handle(new Request('http://localhost:8787' + req.url, { method: req.method, headers: req.headers, body }));
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
}).listen(8787, () => console.log('Check-Server läuft auf http://localhost:8787/api/check'));
