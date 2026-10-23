// Verschlüsselt die Lead-Liste für /leads/ (AES-GCM, Schlüssel aus Passwort per PBKDF2).
// Aufruf: LEADS_PASSWORT='…' node leads/verschluesseln.mjs <leads.json> [status.json] > leads/daten.enc.json
// Die unverschlüsselte Liste nie ins Repository legen.
import { readFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const [leadsPath, statusPath] = process.argv.slice(2);
const pw = process.env.LEADS_PASSWORT;
if (!leadsPath || !pw) {
  console.error("Aufruf: LEADS_PASSWORT='…' node leads/verschluesseln.mjs <leads.json> [status.json]");
  process.exit(1);
}
const payload = {
  stand: new Date().toLocaleDateString('de-DE'),
  leads: JSON.parse(readFileSync(leadsPath, 'utf8')),
  status: statusPath ? JSON.parse(readFileSync(statusPath, 'utf8')) : {},
};
const iter = 310000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload)));
const b64 = (u) => Buffer.from(u).toString('base64');
process.stdout.write(JSON.stringify({ v: 1, iter, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(data)) }));
