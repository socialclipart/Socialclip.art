/* SocialClip Check – Ergebnis-Seite: liest die Fakten aus dem Link und zeigt die Auswertung */
(function () {
  var WA = '4917646188101';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function datum(d) { var p = String(d || '').split('-'); return p.length === 3 ? +p[2] + '.' + +p[1] + '.' + p[0] : ''; }
  function stufe(n) { return n >= 80 ? 'gut' : n >= 55 ? 'mittel' : 'schwach'; }
  var URTEIL = { gut: 'Starker Auftritt', mittel: 'Ausbaufähig', schwach: 'Hier verschenkst du Kunden' };

  function anzeigen(f) {
    var C = window.SCCheck, b = C.bewerten(f), B = C.BEREICHE, h = '';
    if (!b.pruefbar) return '<div class="card"><h1 style="font-size:28px">Keine Auswertung möglich</h1><p>Für diesen Betrieb konnten keine Daten geprüft werden.</p></div>';
    var wUrl = f.website && f.website.url;
    h += '<section class="hero"><div class="ring ' + b.stufe + '" style="--n:' + b.note + '"><b>' + b.note + '</b><span>VON 100</span></div><div>' +
      '<p class="eyebrow">Online-Check · ' + esc(datum(f.datum)) + '</p>' +
      '<h1>' + esc(f.name) + '</h1>' +
      '<p>' + (wUrl ? '<a href="' + esc(wUrl) + '" target="_blank" rel="noopener nofollow">' + esc(wUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + '</a>' : 'Keine Website gefunden') + (f.google && f.google.adresse ? ' · ' + esc(f.google.adresse) : '') + '</p>' +
      '<span class="urteil ' + b.stufe + '">' + URTEIL[b.stufe] + '</span></div></section>';

    h += '<div class="bereiche">' + Object.keys(B).filter(function (k) { return b.bereiche[k]; }).map(function (k) {
      var n = b.bereiche[k].note;
      return '<div class="bereich"><small>' + B[k].ico + ' ' + B[k].name + '</small><b>' + n + '</b><span class="muted"> / 100</span><div class="balken"><i class="' + stufe(n) + '" style="width:' + n + '%"></i></div></div>';
    }).join('') + '</div>';

    if (f.fehler && f.fehler.indexOf('google_aus') !== -1 || f.fehler && f.fehler.indexOf('google') !== -1)
      h += '<p class="hinweis">Das Google-Profil konnte bei diesem Check nicht abgefragt werden und fließt nicht in die Note ein.</p>';

    if (b.top.length) {
      h += '<h2 class="abschnitt">Die <em class="s">wichtigsten</em> Baustellen</h2><div class="top3">' + b.top.map(function (m) {
        return '<article class="mangel"><h3>' + esc(m.titel) + '</h3><p>' + esc(m.text) + '</p>' + (m.leistung ? '<a href="' + m.leistung.url + '" target="_blank" rel="noopener">So hilft SocialClip: ' + esc(m.leistung.name) + ' →</a>' : '') + '</article>';
      }).join('') + '</div>';
    } else h += '<h2 class="abschnitt">Stark – <em class="s">keine</em> größeren Baustellen gefunden.</h2>';

    if (f.konkurrenz && f.konkurrenz.length && f.google) {
      var zeilen = [{ name: f.google.name, sterne: f.google.sterne, bewertungen: f.google.bewertungen, website: !!(f.website && f.website.erreichbar !== false), du: true }].concat(f.konkurrenz);
      h += '<h2 class="abschnitt">Vergleich mit Betrieben <em class="s">in deiner Nähe</em></h2><div class="card" style="padding:8px 14px;overflow-x:auto"><table class="vergleich"><thead><tr><th>Betrieb</th><th>Sterne</th><th>Bewertungen</th><th>Website</th></tr></thead><tbody>' +
        zeilen.map(function (z) { return '<tr' + (z.du ? ' class="du"' : '') + '><td>' + esc(z.name) + (z.du ? ' (du)' : '') + '</td><td>' + (z.sterne != null ? String(z.sterne).replace('.', ',') + ' ★' : '–') + '</td><td>' + (z.bewertungen || 0) + '</td><td>' + (z.website ? '✓' : '–') + '</td></tr>'; }).join('') +
        '</tbody></table></div>';
    }

    var gut = b.punkte.filter(function (p) { return p.ok; }), rest = b.maengel.slice(3);
    h += '<h2 class="abschnitt">Alle Prüfpunkte</h2><details class="alle" open><summary>' + b.punkte.length + ' Punkte geprüft · ' + gut.length + ' in Ordnung</summary><div class="liste">' +
      rest.concat(gut).map(function (p) {
        var cls = p.ok ? 'ok' : p.wert > 0.3 ? 'halb' : 'nein';
        return '<div class="punkt ' + cls + '"><span class="ic">' + (p.ok ? '✓' : p.wert > 0.3 ? '!' : '✕') + '</span><div><b>' + esc(p.titel) + '</b><span>' + esc(p.text) + '</span></div></div>';
      }).join('') + '</div></details>';

    var nachricht = 'Hallo SocialClip, ich habe meinen Online-Check gesehen (' + f.name + ', ' + b.note + '/100). Können wir sprechen, was ihr verbessern würdet?';
    h += '<section class="cta"><p class="eyebrow">Persönlich aus Erlangen</p><h2>Sollen wir das <em class="s">für dich</em> lösen?</h2>' +
      '<p>Wir gehen die Punkte gemeinsam durch – kostenlos und unverbindlich. Du bekommst einen klaren Vorschlag mit festem Preis.</p>' +
      '<div class="knoepfe"><a class="btn wa" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(nachricht) + '">Per WhatsApp antworten</a><a class="btn" href="tel:+' + WA + '">Anrufen</a><a class="btn" href="https://socialclip.art/preise/">Pakete &amp; Preise</a></div></section>';
    return h;
  }
  window.SCCheckAnzeige = anzeigen;

  document.addEventListener('DOMContentLoaded', function () {
    var ziel = document.getElementById('inhalt'), d = location.hash.slice(1);
    if (!ziel) return;
    if (!d) { ziel.innerHTML = '<div class="card"><h1 style="font-size:28px">Kein Ergebnis gefunden</h1><p>Dieser Link enthält keine Auswertung. Bitte den vollständigen Link verwenden.</p><a class="btn main" href="https://socialclip.art/">Zu SocialClip</a></div>'; return; }
    window.SCCheck.dekodieren(d).then(function (f) {
      document.title = 'Online-Check: ' + f.name + ' | SocialClip';
      ziel.innerHTML = anzeigen(f);
    }).catch(function () {
      ziel.innerHTML = '<div class="card"><h1 style="font-size:28px">Link unvollständig</h1><p>Die Auswertung konnte nicht gelesen werden. Vermutlich wurde der Link beim Kopieren abgeschnitten.</p></div>';
    });
  });
})();
