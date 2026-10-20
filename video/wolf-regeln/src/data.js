import { RULES } from './rules.js';
import { TIMING } from './timing.js';
export const W = 1080, H = 1920;
export const LEAD = 0.7, TAIL = 2.4;

// Zeitachse einer Regel: Sätze mit absoluten Start-/Endzeiten im Video.
export function timeline(n, voice = 'karlsson') {
  const r = RULES[n - 1], tm = TIMING[voice][n];
  const lines = r.lines.map((l, i) => ({ ...l, i, a: LEAD + tm.sentences[i].a, b: LEAD + tm.sentences[i].b }));
  lines.forEach((l, i) => { l.next = i + 1 < lines.length ? lines[i + 1].a : Infinity; });
  const dur = Math.ceil((LEAD + tm.duration + TAIL) * 30) / 30;
  const cue = name => { const l = lines.find(x => x.fx === name); return l ? l.a : Infinity; };
  const intro = lines[0], out = lines.find(l => l.fx === 'outro');
  const shakes = [[intro.a + .35, 14, .3], [out.a, 8, .2], ...lines.filter(l => l.big).map(l => [l.a, 9, .18])];
  const flashes = [[intro.a + .35, '255,236,190', .16, .3], [out.a, '255,236,190', .12, .35], ...lines.filter(l => l.big).map(l => [l.a, '255,240,210', .08, .15])];
  return { ...r, voice, lines, dur, cue, shakes, flashes };
}
export const durationFor = (n, v) => timeline(n, v).dur;
export const scenes = ['bg', 'props', 'text', 'fx'];
