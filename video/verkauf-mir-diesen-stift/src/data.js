export const W = 1080, H = 1920, DURATION = 42;
// Reihenfolge = Zeichenreihenfolge. Überlappungen sind Übergänge.
export const scenes = [
  { id: 'bg',       start: 0,     end: 42 },
  { id: 'pen',      start: 0,     end: 10.95 },
  { id: 'stickers', start: 2.6,   end: 10.95 },
  { id: 'table',    start: 10.75, end: 19.55 },
  { id: 'gold',     start: 19.3,  end: 26.1 },
  { id: 'phone',    start: 25.75, end: 33.3 },
  { id: 'logo',     start: 32.95, end: 42 },
  { id: 'captions', start: 0,     end: 42 },
  { id: 'fx',       start: 0,     end: 42 },
];
