// Handy-Vorschau: App in echter Handybreite (390 px) rendern und passend in den Rahmen skalieren.
// Oben bleiben 34 px als Statusleiste frei, die Höhe füllt den restlichen Bildschirm.
(function () {
  var screen = document.querySelector('.one-screen');
  if (!screen) return;
  var frame = screen.querySelector('iframe');
  function fit() {
    var scale = screen.clientWidth / 390;
    screen.style.setProperty('--one-scale', scale);
    frame.style.height = Math.round((screen.clientHeight - 44) / scale) + 'px';
  }
  fit();
  if (window.ResizeObserver) new ResizeObserver(fit).observe(screen);
  else window.addEventListener('resize', fit);
})();

// Uhrzeit in der Statusleiste wie auf einem echten Handy
(function () {
  var el = document.getElementById('oneTime');
  if (!el) return;
  function tick() { var d = new Date(); el.textContent = d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); }
  tick(); setInterval(tick, 15000);
})();
