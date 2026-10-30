/* SocialClip Check – feste Prüfregeln (keine KI).
   Der Server liefert nur Fakten. Hier steht, wie daraus Note und Texte werden.
   Texte und Gewichte darf man hier jederzeit anpassen: Gewicht = wie stark ein Punkt zählt. */
(function () {
  var BEREICHE = {
    google:   { name: 'Google-Profil', ico: '⭐' },
    website:  { name: 'Website', ico: '🌐' },
    handy:    { name: 'Handy & Tempo', ico: '📱' },
    kontakt:  { name: 'Kontakt', ico: '📞' },
    gefunden: { name: 'Bei Google gefunden', ico: '🔎' },
    social:   { name: 'Social Media', ico: '📸' }
  };
  var LEISTUNG = {
    website: { name: 'Neue Website', url: 'https://socialclip.art/webdesign-erlangen/' },
    google:  { name: 'Google-Profil & Bewertungen', url: 'https://socialclip.art/digitalisierung-erlangen/' },
    seo:     { name: 'Bei Google gefunden werden', url: 'https://socialclip.art/online-marketing-erlangen/' },
    social:  { name: 'Social Media', url: 'https://socialclip.art/social-media-erlangen/' }
  };

  // Hilfen: w = Website-Fakten (nur wenn erreichbar), g = Google-Profil
  function W(f) { return f.website && f.website.erreichbar !== false ? f.website : null; }
  function nurW(fn) { return function (f) { var w = W(f); return w ? fn(w, f) : null; }; }
  function G(f) { return f.fehler && (f.fehler.indexOf('google_aus') !== -1 || f.fehler.indexOf('google') !== -1) ? undefined : f.google || null; }
  function nurG(fn) { return function (f) { var g = G(f); return g ? fn(g, f) : null; }; }

  // test(f) gibt zurück: true (ok), false (Mangel), Zahl 0–1 (teilweise) oder null (nicht prüfbar, zählt nicht)
  var REGELN = [
    { id: 'website', bereich: 'website', gewicht: 25, leistung: 'website', titel: 'Eigene Website',
      test: function (f) { return !!W(f); },
      gut: 'Du hast eine eigene Website, die erreichbar ist.',
      schlecht: function (f) { return f.website ? 'Deine Website war beim Check nicht erreichbar. Wer dich jetzt googelt, landet auf einer Fehlerseite.' : 'Du hast keine eigene Website. Viele Kunden googeln vor dem ersten Besuch – ohne Website wirkst du weniger vertrauenswürdig und landest seltener in den Ergebnissen.'; } },
    { id: 'https', bereich: 'website', gewicht: 8, leistung: 'website', titel: 'Sichere Verbindung (Schloss-Symbol)',
      test: nurW(function (w) { return w.https; }),
      gut: 'Deine Seite läuft verschlüsselt (https).',
      schlecht: 'Deine Seite ist nicht verschlüsselt. Browser zeigen „Nicht sicher“ an – das schreckt Besucher ab und Google stuft dich schlechter ein.' },
    { id: 'impressum', bereich: 'website', gewicht: 8, leistung: 'website', titel: 'Impressum',
      test: nurW(function (w) { return w.impressum; }),
      gut: 'Ein Impressum ist verlinkt.',
      schlecht: 'Auf der Startseite ist kein Impressum verlinkt. Das ist in Deutschland Pflicht – fehlt es, drohen Abmahnungen.' },
    { id: 'datenschutz', bereich: 'website', gewicht: 5, leistung: 'website', titel: 'Datenschutzerklärung',
      test: nurW(function (w) { return w.datenschutz; }),
      gut: 'Eine Datenschutzerklärung ist verlinkt.',
      schlecht: 'Es ist keine Datenschutzerklärung verlinkt. Auch die ist Pflicht und schützt dich vor Abmahnungen.' },
    { id: 'aktuell', bereich: 'website', gewicht: 3, leistung: 'website', titel: 'Wirkt aktuell',
      test: nurW(function (w, f) { if (!w.copyrightJahr) return null; return w.copyrightJahr >= +f.datum.slice(0, 4) - 1; }),
      gut: 'Die Seite wirkt gepflegt und aktuell.',
      schlecht: function (f) { return 'Unten auf der Seite steht noch „© ' + f.website.copyrightJahr + '“. Das wirkt, als wäre die Seite seit Jahren nicht gepflegt worden.'; } },
    { id: 'favicon', bereich: 'website', gewicht: 2, leistung: 'website', titel: 'Symbol im Browser-Tab',
      test: nurW(function (w) { return w.favicon; }),
      gut: 'Im Browser-Tab erscheint dein eigenes Symbol.',
      schlecht: 'Im Browser-Tab fehlt dein Logo-Symbol – ein kleines Detail, das aber unprofessionell wirkt.' },

    { id: 'handy', bereich: 'handy', gewicht: 10, leistung: 'website', titel: 'Fürs Handy eingerichtet',
      test: nurW(function (w) { return w.viewport; }),
      gut: 'Die Seite ist fürs Handy eingerichtet.',
      schlecht: 'Die Seite ist nicht fürs Handy eingerichtet. Über 70 % der Besucher kommen per Handy – sie müssen zoomen und wischen und springen schnell wieder ab.' },
    { id: 'tempo', bereich: 'handy', gewicht: 10, leistung: 'website', titel: 'Ladezeit am Handy',
      test: function (f) { return W(f) && f.messung && f.messung.tempo != null ? f.messung.tempo / 100 : null; },
      gut: function (f) { return 'Google gibt deiner Seite am Handy ' + f.messung.tempo + ' von 100 Punkten fürs Tempo.'; },
      schlecht: function (f) { var m = f.messung; return 'Google gibt deiner Seite am Handy nur ' + m.tempo + ' von 100 Punkten fürs Tempo' + (m.ladezeit ? ' – der Hauptinhalt braucht ' + String(m.ladezeit).replace('.', ',') + ' Sekunden' : '') + '. Jede Sekunde mehr kostet Besucher.'; } },

    { id: 'telefon', bereich: 'kontakt', gewicht: 7, leistung: 'website', titel: 'Telefonnummer antippbar',
      test: nurW(function (w) { return w.telefonLink; }),
      gut: 'Deine Telefonnummer lässt sich am Handy direkt antippen.',
      schlecht: function (f) { return f.website.telefonText ? 'Deine Telefonnummer steht zwar da, ist aber nicht antippbar. Am Handy muss man sie abtippen – viele rufen dann gar nicht erst an.' : 'Auf der Startseite ist keine Telefonnummer zu finden. Kunden, die schnell anrufen wollen, suchen woanders.'; } },
    { id: 'kontaktweg', bereich: 'kontakt', gewicht: 4, leistung: 'website', titel: 'E-Mail oder Formular',
      test: nurW(function (w) { return w.email || w.formular; }),
      gut: 'Man kann dich per E-Mail oder Formular erreichen.',
      schlecht: 'Es gibt weder E-Mail-Adresse noch Kontaktformular auf der Startseite. Wer abends anfragen will, kann es nicht.' },
    { id: 'whatsapp', bereich: 'kontakt', gewicht: 2, leistung: 'website', titel: 'WhatsApp-Knopf',
      test: nurW(function (w) { return w.whatsapp; }),
      gut: 'Kunden können dir direkt per WhatsApp schreiben.',
      schlecht: 'Es gibt keinen WhatsApp-Knopf. Viele Kunden schreiben lieber kurz, als anzurufen.' },
    { id: 'adresse', bereich: 'kontakt', gewicht: 3, leistung: 'website', titel: 'Adresse sichtbar',
      test: nurW(function (w) { return w.adresse; }),
      gut: 'Deine Adresse ist auf der Seite zu finden.',
      schlecht: 'Auf der Startseite steht keine Adresse. Kunden wissen nicht sofort, wo du bist – und Google kann dich schlechter deinem Ort zuordnen.' },

    { id: 'titel', bereich: 'gefunden', gewicht: 5, leistung: 'seo', titel: 'Seitentitel',
      test: nurW(function (w) { return w.titel.length >= 10 && w.titel.length <= 75; }),
      gut: function (f) { return 'Dein Seitentitel passt: „' + f.website.titel + '“.'; },
      schlecht: function (f) { var t = f.website.titel; return !t ? 'Deine Seite hat keinen Titel. Das ist die blaue Überschrift bei Google – ohne ihn wirst du kaum gefunden.' : t.length < 10 ? 'Dein Seitentitel „' + t + '“ ist zu kurz und sagt Google nicht, was du anbietest.' : 'Dein Seitentitel ist zu lang und wird bei Google abgeschnitten.'; } },
    { id: 'titelort', bereich: 'gefunden', gewicht: 3, leistung: 'seo', titel: 'Ort im Titel',
      test: nurW(function (w, f) { return w.titel ? w.titel.toLowerCase().indexOf(String(f.ort || '').toLowerCase()) !== -1 : null; }),
      gut: function (f) { return '„' + f.ort + '“ steht im Seitentitel – gut für lokale Suchen.'; },
      schlecht: function (f) { return '„' + f.ort + '“ steht nicht im Seitentitel. Wer „… ' + f.ort + '“ googelt, findet dich dadurch schlechter.'; } },
    { id: 'beschreibung', bereich: 'gefunden', gewicht: 4, leistung: 'seo', titel: 'Beschreibung für Google',
      test: nurW(function (w) { return w.beschreibung.length >= 50; }),
      gut: 'Es gibt eine Beschreibung für die Google-Ergebnisse.',
      schlecht: 'Es fehlt eine gute Beschreibung für die Google-Ergebnisse. Google zeigt dann zufällige Textstücke – das lädt nicht zum Klicken ein.' },
    { id: 'h1', bereich: 'gefunden', gewicht: 3, leistung: 'seo', titel: 'Hauptüberschrift',
      test: nurW(function (w) { return w.h1.length > 0; }),
      gut: 'Die Seite hat eine klare Hauptüberschrift.',
      schlecht: 'Die Seite hat keine Hauptüberschrift. Google erkennt dadurch schlechter, worum es bei dir geht.' },
    { id: 'strukturiert', bereich: 'gefunden', gewicht: 3, leistung: 'seo', titel: 'Firmenangaben für Google',
      test: nurW(function (w) { return w.strukturiert; }),
      gut: 'Die Seite liefert Google deine Firmenangaben in maschinenlesbarer Form.',
      schlecht: 'Die Seite liefert Google keine maschinenlesbaren Firmenangaben (Öffnungszeiten, Adresse, Branche). Andere Betriebe werden dadurch bevorzugt angezeigt.' },
    { id: 'vorschau', bereich: 'gefunden', gewicht: 2, leistung: 'seo', titel: 'Vorschaubild beim Teilen',
      test: nurW(function (w) { return w.vorschaubild; }),
      gut: 'Wird dein Link per WhatsApp geteilt, erscheint ein Vorschaubild.',
      schlecht: 'Wird dein Link per WhatsApp oder Facebook geteilt, erscheint kein Vorschaubild – nur ein grauer Link.' },
    { id: 'bilder', bereich: 'gefunden', gewicht: 2, leistung: 'seo', titel: 'Bildbeschreibungen',
      test: nurW(function (w) { return w.bilder ? w.bilderMitAlt / w.bilder >= 0.8 : null; }),
      gut: 'Deine Bilder haben Beschreibungen.',
      schlecht: function (f) { var w = f.website; return (w.bilder - w.bilderMitAlt) + ' von ' + w.bilder + ' Bildern haben keine Beschreibung. Google kann sie nicht verstehen und zeigt sie nicht in der Bildersuche.'; } },

    { id: 'social', bereich: 'social', gewicht: 5, leistung: 'social', titel: 'Social Media verlinkt',
      test: nurW(function (w) { return Object.keys(w.social || {}).length > 0; }),
      gut: function (f) { return 'Verlinkt: ' + Object.keys(f.website.social).map(function (k) { return k.charAt(0).toUpperCase() + k.slice(1); }).join(', ') + '.'; },
      schlecht: 'Auf der Website ist kein Instagram, Facebook oder TikTok verlinkt. Gerade dort sehen Kunden, wie es bei dir aussieht.' },

    { id: 'gprofil', bereich: 'google', gewicht: 15, leistung: 'google', titel: 'Google-Profil vorhanden',
      test: function (f) { var g = G(f); return g === undefined ? null : !!g; },
      gut: 'Du hast ein Google-Profil – du erscheinst bei Google Maps.',
      schlecht: 'Wir haben kein Google-Profil für dich gefunden. Bei Suchen wie „in der Nähe“ tauchst du damit gar nicht auf.' },
    { id: 'gsterne', bereich: 'google', gewicht: 6, leistung: 'google', titel: 'Sterne bei Google',
      test: nurG(function (g) { return g.sterne == null ? false : g.sterne >= 4.5 ? 1 : g.sterne >= 4.0 ? 0.7 : g.sterne >= 3.5 ? 0.4 : 0; }),
      gut: function (f) { return 'Sehr gut: ' + String(f.google.sterne).replace('.', ',') + ' Sterne bei Google.'; },
      schlecht: function (f) { return f.google.sterne == null ? 'Du hast noch keine Sterne-Bewertung bei Google.' : 'Du hast ' + String(f.google.sterne).replace('.', ',') + ' Sterne. Viele Kunden wählen erst ab 4,5 Sternen.'; } },
    { id: 'gbewertungen', bereich: 'google', gewicht: 8, leistung: 'google', titel: 'Anzahl Bewertungen',
      test: nurG(function (g, f) { var ziel = Math.max(30, schnittKonkurrenz(f) * 0.6); return Math.min(1, g.bewertungen / ziel); }),
      gut: function (f) { return f.google.bewertungen + ' Google-Bewertungen – das schafft Vertrauen.'; },
      schlecht: function (f) { var k = schnittKonkurrenz(f); return 'Du hast nur ' + f.google.bewertungen + ' Google-Bewertung' + (f.google.bewertungen === 1 ? '' : 'en') + (k ? ', Betriebe in deiner Nähe im Schnitt ' + Math.round(k) : '') + '. Mehr Bewertungen bedeuten mehr Vertrauen und bessere Plätze bei Google Maps.'; } },
    { id: 'gzeiten', bereich: 'google', gewicht: 4, leistung: 'google', titel: 'Öffnungszeiten bei Google',
      test: nurG(function (g) { return g.zeiten; }),
      gut: 'Deine Öffnungszeiten sind bei Google eingetragen.',
      schlecht: 'Bei Google stehen keine Öffnungszeiten. Kunden wissen nicht, ob du gerade offen hast – und fahren lieber woanders hin.' },
    { id: 'gfotos', bereich: 'google', gewicht: 3, leistung: 'google', titel: 'Fotos bei Google',
      test: nurG(function (g) { return g.fotos >= 5; }),
      gut: 'Dein Google-Profil hat genug Fotos.',
      schlecht: function (f) { return 'Dein Google-Profil hat nur ' + f.google.fotos + ' Foto' + (f.google.fotos === 1 ? '' : 's') + '. Profile mit vielen Bildern bekommen deutlich mehr Anrufe und Wegbeschreibungen.'; } },
    { id: 'gwebsite', bereich: 'google', gewicht: 3, leistung: 'google', titel: 'Website im Google-Profil',
      test: nurG(function (g) { return !!g.website; }),
      gut: 'Deine Website ist im Google-Profil verlinkt.',
      schlecht: 'In deinem Google-Profil ist keine Website verlinkt. Interessierte kommen nicht weiter zu dir.' },
    { id: 'gtelefon', bereich: 'google', gewicht: 2, leistung: 'google', titel: 'Telefon im Google-Profil',
      test: nurG(function (g) { return !!g.telefon; }),
      gut: 'Deine Telefonnummer steht im Google-Profil.',
      schlecht: 'In deinem Google-Profil steht keine Telefonnummer – der Anruf-Knopf bei Google Maps fehlt.' }
  ];

  function schnittKonkurrenz(f) {
    var k = (f.konkurrenz || []).filter(function (x) { return x.bewertungen; });
    return k.length ? k.reduce(function (s, x) { return s + x.bewertungen; }, 0) / k.length : 0;
  }
  function wert(v) { return v === true ? 1 : v === false ? 0 : v; }
  function txt(t, f) { return typeof t === 'function' ? t(f) : t; }

  function bewerten(f) {
    var punkte = [], bereiche = {};
    REGELN.forEach(function (r) {
      var v = r.test(f); if (v == null) return;
      v = Math.max(0, Math.min(1, wert(v)));
      var p = { id: r.id, bereich: r.bereich, titel: r.titel, gewicht: r.gewicht, wert: v, ok: v >= 0.75,
        text: txt(v >= 0.75 ? r.gut : r.schlecht, f), leistung: LEISTUNG[r.leistung], verlust: r.gewicht * (1 - v) };
      punkte.push(p);
      var b = bereiche[r.bereich] || (bereiche[r.bereich] = { erreicht: 0, max: 0 });
      b.erreicht += r.gewicht * v; b.max += r.gewicht;
    });
    var erreicht = 0, max = 0;
    Object.keys(bereiche).forEach(function (k) { erreicht += bereiche[k].erreicht; max += bereiche[k].max; bereiche[k].note = Math.round(bereiche[k].erreicht / bereiche[k].max * 100); });
    var note = max ? Math.round(erreicht / max * 100) : 0;
    if (!W(f)) note = Math.min(note, 40); // Ohne erreichbare Website nie eine gute Note
    var maengel = punkte.filter(function (p) { return !p.ok; }).sort(function (a, b) { return b.verlust - a.verlust; });
    // Nur ein Firmenname ohne Google-Zugang: nichts prüfbar, keine Note vortäuschen
    var pruefbar = !!f.website || G(f) !== undefined;
    return { pruefbar: pruefbar, note: note, stufe: note >= 80 ? 'gut' : note >= 55 ? 'mittel' : 'schwach', bereiche: bereiche, punkte: punkte, maengel: maengel, top: maengel.slice(0, 3) };
  }

  // ---------- Ergebnis als Link (komprimiert im Adress-Anker, kein Speicher nötig) ----------
  function b64(bytes) { var s = ''; for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); var bin = atob(s), out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  function strom(bytes, s) { return new Response(new Blob([bytes]).stream().pipeThrough(s)).arrayBuffer().then(function (b) { return new Uint8Array(b); }); }
  function kodieren(f) {
    var kopie = JSON.parse(JSON.stringify(f));
    if (kopie.messung) delete kopie.messung.bild;
    var roh = new TextEncoder().encode(JSON.stringify(kopie));
    return strom(roh, new CompressionStream('deflate-raw')).then(b64);
  }
  function dekodieren(s) {
    return strom(unb64(s), new DecompressionStream('deflate-raw')).then(function (b) { return JSON.parse(new TextDecoder().decode(b)); });
  }
  function slug(name) {
    return String(name || 'check').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'check';
  }
  function link(f) {
    return kodieren(f).then(function (d) { return location.origin + '/check/?f=' + slug(f.name) + '#' + d; });
  }

  window.SCCheck = { BEREICHE: BEREICHE, REGELN: REGELN, bewerten: bewerten, kodieren: kodieren, dekodieren: dekodieren, link: link, slug: slug };
})();
