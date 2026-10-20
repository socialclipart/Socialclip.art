export const W = 1080, H = 1920;
// Hook-Pack: kurze Action-Intros. dur = Länge in Sekunden; shakes/flashes = Einschläge.
export const HOOKS = {
  glass:   { dur: 3.2, shakes: [[.6, 26, .45], [1.0, 10, .2]], flashes: [[.6, '255,255,255', .7, .25]] },
  bomb:    { dur: 3.6, shakes: [[.25, 4, .15], [.95, 5, .15], [1.65, 6, .15], [2.3, 34, .7], [2.55, 10, .2]], flashes: [[2.3, '255,240,200', 1, .35]] },
  trailer: { dur: 4.0, shakes: [[.12, 8, .3], [1.12, 8, .3], [2.12, 12, .35], [3.02, 14, .3]], flashes: [[2.12, '255,236,190', .25, .3], [3.02, '255,236,190', .5, .35]] },
};
