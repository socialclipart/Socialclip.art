/* SocialClip Check – internes Werkzeug: viele Betriebe prüfen, nach Bedarf sortieren, Ergebnis-Links verschicken */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var C, liste = [], filter = 'alle', laufend = 0, warteschlange = [];
  var GLEICHZEITIG = 2;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lesen(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function schreiben(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function status(t, art) { $('status').textContent = t || ''; $('status').className = 'status' + (art ? ' ' + art : ''); }
  function einst() { return { server: $('server').value.trim(), code: $('code').value }; }
  function speichern() { schreiben('sccheck-liste', liste.filter(function (e) { return e.f; }).map(function (e) { return { id: e.id, f: e.f }; })); }

  function anfrage(methode, body) {
    var e = einst();
    if (!e.server || !e.code) return Promise.reject(new Error('Bitte zuerst unter „Verbindung einrichten“ Server-Adresse und Zugangscode eintragen.'));
    return fetch(e.server, { method: methode, headers: { 'Content-Type': 'application/json', 'X-Check-Token': e.code }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'Fehler ' + r.status); return j; }); },
        function () { throw new Error('Server nicht erreichbar. Adresse prüfen.'); });
  }

  // ---------- Prüfen (max. 2 gleichzeitig, weil Google pro Seite bis zu 40 Sek. misst) ----------
  function weiter() {
    while (laufend < GLEICHZEITIG && warteschlange.length) {
      var e = warteschlange.shift(); laufend++;
      (function (e) {
        anfrage('POST', { eingabe: e.eingabe, ort: e.ort }).then(function (f) {
          e.f = f; e.fehler = null; speichern();
        }, function (err) { e.fehler = err.message; }).then(function () { laufend--; zeichnen(); weiter(); fertig(); });
      })(e);
    }
  }
  function fertig() {
    if (laufend || warteschlange.length) return status('Prüfe … noch ' + (laufend + warteschlange.length) + ' offen');
    var n = liste.filter(function (e) { return e.fehler; }).length;
    status(n ? n + ' Check(s) fehlgeschlagen – mit „Nochmal“ erneut versuchen.' : 'Fertig.', n ? 'fehler' : 'ok');
  }
  function starten() {
    var zeilen = $('eingabe').value.split(/\n+/).map(function (z) { return z.trim(); }).filter(function (z) { return z.length >= 2; });
    if (!zeilen.length) return status('Bitte mindestens einen Betrieb eintragen.', 'fehler');
    var e = einst(); if (!e.server || !e.code) { $('einst').open = true; return status('Bitte zuerst die Verbindung einrichten.', 'fehler'); }
    var ort = $('ort').value.trim() || 'Erlangen'; schreiben('sccheck-ort', ort);
    zeilen.slice(0, 50).forEach(function (z) {
      var neu = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), eingabe: z, ort: ort };
      liste.unshift(neu); warteschlange.push(neu);
    });
    $('eingabe').value = ''; zeichnen(); weiter(); fertig();
  }

  // ---------- Liste ----------
  function zeichnen() {
    var daten = liste.map(function (e) { return { e: e, b: e.f ? C.bewerten(e.f) : null }; });
    var sichtbar = daten.filter(function (x) {
      if (filter === 'alle') return true;
      if (!x.b || !x.b.pruefbar) return false;
      if (filter === 'ohne') return !(x.e.f.website && x.e.f.website.erreichbar !== false);
      return x.b.note < 55;
    });
    if (filter !== 'alle') sichtbar.sort(function (a, b) { return a.b.note - b.b.note; });
    var fertigeDaten = daten.filter(function (x) { return x.b && x.b.pruefbar; });
    $('zusammen').textContent = fertigeDaten.length ? fertigeDaten.length + ' geprüft · ' + fertigeDaten.filter(function (x) { return x.b.note < 55; }).length + ' mit großem Bedarf' : '';
    $('zeilen').innerHTML = sichtbar.length ? sichtbar.map(function (x) {
      var e = x.e, b = x.b;
      if (!b) return '<div class="zeile' + (e.fehler ? ' fehlgeschlagen' : '') + '" data-id="' + e.id + '"><div class="lade"></div><div class="info"><b>' + esc(e.eingabe) + '</b><span' + (e.fehler ? ' style="color:var(--red)"' : '') + '>' + esc(e.fehler || 'Wird geprüft … (bis zu 1 Minute)') + '</span></div><div class="tasten">' +
        (e.fehler ? '<button class="btn klein" data-a="nochmal">Nochmal</button><button class="btn klein" data-a="weg" aria-label="Entfernen">✕</button>' : '') + '</div></div>';
      var f = e.f, w = f.website && f.website.erreichbar !== false;
      if (!b.pruefbar) return '<div class="zeile fehlgeschlagen" data-id="' + e.id + '"><div class="lade"></div><div class="info"><b>' + esc(f.name) + '</b><span style="color:var(--red)">Nicht prüfbar: Firmennamen gehen nur mit Google-Zugang. Bitte die Website eintragen.</span></div><div class="tasten"><button class="btn klein" data-a="weg" aria-label="Entfernen">✕</button></div></div>';
      return '<div class="zeile" data-id="' + e.id + '"><div class="ring klein ' + b.stufe + '" style="--n:' + b.note + '"><b>' + b.note + '</b></div><div class="info"><b>' + esc(f.name) + '</b>' +
        '<span class="muted">' + (w ? esc(f.website.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) : 'keine Website') + (f.google ? ' · ' + (f.google.sterne != null ? String(f.google.sterne).replace('.', ',') + ' ★ · ' : '') + f.google.bewertungen + ' Bew.' : '') + '</span>' +
        '<span>' + (b.top[0] ? '⚠️ ' + esc(b.top[0].titel) : '✓ keine großen Mängel') + '</span></div>' +
        '<div class="tasten"><button class="btn klein" data-a="ansehen">Ansehen</button><button class="btn klein" data-a="kopieren">Link kopieren</button><button class="btn klein wa" data-a="wa">WhatsApp</button><button class="btn klein" data-a="weg" aria-label="Entfernen">✕</button></div></div>';
    }).join('') : '<div class="leer muted">' + (liste.length ? 'Nichts in diesem Filter.' : 'Noch keine Betriebe geprüft. Trag oben ein paar ein – zum Beispiel alle Friseure aus deiner Akquise-Liste.') + '</div>';
  }

  function nachricht(f, url) {
    var b = C.bewerten(f);
    return 'Hallo, hier ist SocialClip aus Erlangen. Ich habe mir den Online-Auftritt von ' + f.name + ' angeschaut – ' + b.note + ' von 100 Punkten' +
      (b.top[0] ? ', größte Baustelle: ' + b.top[0].titel : '') + '. Die kostenlose Auswertung: ' + url + ' – Wenn Sie mögen, gehe ich die Punkte kurz mit Ihnen durch.';
  }

  $('zeilen') && document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-a]'); if (!t) return;
    var z = t.closest('.zeile'), e = liste.filter(function (x) { return x.id === z.dataset.id; })[0]; if (!e) return;
    var a = t.dataset.a;
    if (a === 'weg') { liste.splice(liste.indexOf(e), 1); speichern(); return zeichnen(); }
    if (a === 'nochmal') { e.fehler = null; warteschlange.push(e); zeichnen(); weiter(); return fertig(); }
    var fenster = a === 'ansehen' || a === 'wa' ? window.open('about:blank', '_blank') : null; // vor dem Warten öffnen, sonst blockiert der Browser
    C.link(e.f).then(function (url) {
      if (a === 'ansehen') fenster.location = url;
      else if (a === 'wa') fenster.location = 'https://wa.me/?text=' + encodeURIComponent(nachricht(e.f, url));
      else if (a === 'kopieren') {
        var fertigText = function () { t.textContent = 'Kopiert ✓'; setTimeout(function () { t.textContent = 'Link kopieren'; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(fertigText, function () { prompt('Link kopieren:', url); });
        else prompt('Link kopieren:', url);
      }
    });
  });

  function csv() {
    var kopf = ['Betrieb', 'Website', 'Note', 'Größte Baustelle', 'Sterne', 'Bewertungen', 'Telefon', 'Adresse', 'Geprüft am'];
    var zeilen = liste.filter(function (e) { return e.f && C.bewerten(e.f).pruefbar; }).map(function (e) {
      var f = e.f, b = C.bewerten(f), g = f.google || {};
      return [f.name, f.website && f.website.erreichbar !== false ? f.website.url : '', b.note, b.top[0] ? b.top[0].titel : '', g.sterne == null ? '' : String(g.sterne).replace('.', ','), g.bewertungen || '', g.telefon || '', g.adresse || '', f.datum];
    });
    var text = '﻿' + [kopf].concat(zeilen).map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
    a.download = 'socialclip-check-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  }

  document.addEventListener('DOMContentLoaded', function () {
    C = window.SCCheck;
    var e = lesen('sccheck-einst', {});
    $('server').value = e.server || ''; $('code').value = e.code || ''; $('ort').value = lesen('sccheck-ort', 'Erlangen');
    if (!e.server || !e.code) $('einst').open = true;
    liste = lesen('sccheck-liste', []);
    ['server', 'code'].forEach(function (id) { $(id).addEventListener('change', function () { schreiben('sccheck-einst', einst()); }); });
    $('testen').addEventListener('click', function () {
      schreiben('sccheck-einst', einst()); status('Teste Verbindung …');
      anfrage('GET').then(function (j) { status('Verbunden ✓' + (j.google ? ' · Google-Profil-Abfrage aktiv' : ' · Google-Profil-Abfrage aus (nur Websites prüfbar)'), 'ok'); }, function (err) { status(err.message, 'fehler'); });
    });
    $('los').addEventListener('click', starten);
    $('eingabe').addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) starten(); });
    document.querySelectorAll('.chip').forEach(function (c) { c.addEventListener('click', function () {
      filter = c.dataset.f; document.querySelectorAll('.chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); zeichnen();
    }); });
    $('csv').addEventListener('click', csv);
    $('leeren').addEventListener('click', function () { if (confirm('Wirklich alle Ergebnisse aus der Liste löschen?')) { liste = []; speichern(); zeichnen(); } });
    zeichnen();
  });
})();
