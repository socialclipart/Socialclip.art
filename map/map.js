/* SocialClip Map: Geschäfte in Erlangen entdecken und hinfinden
   Karte: OpenFreeMap · Firmen: OpenStreetMap (map/firmen.json, wöchentlich per GitHub Actions) · Wege: FOSSGIS-Routing */
(function () {
  var START = [11.0039, 49.5897];           // Erlangen Mitte [Länge, Breite]
  var RADIUS = 1000;                         // „In deiner Nähe“ in Metern
  var STYLE = 'https://tiles.openfreemap.org/styles/positron';   // schlichte Grundkarte, Farben setzt gestalten()
  // Eigene SocialClip-Farben für die Grundkarte (Ebene: { Eigenschaft: Wert })
  var FARBEN = {
    background: { 'background-color': '#f7f2ea' },
    landuse_residential: { 'fill-color': '#f2ebe0' },
    park: { 'fill-color': '#d9ecd0' },
    landcover_wood: { 'fill-color': '#cfe5c4' },
    water: { 'fill-color': '#a9d6ee' },
    waterway: { 'line-color': '#93c8e6' },
    building: { 'fill-color': '#ece2d5', 'fill-outline-color': '#e0d3c3' },
    highway_path: { 'line-color': '#e3d6c4' },
    highway_minor: { 'line-color': '#ffffff' },
    highway_major_casing: { 'line-color': '#eadccb' },
    highway_major_inner: { 'line-color': '#fffaf4' },
    highway_motorway_casing: { 'line-color': '#f0c9a4' },
    highway_motorway_inner: { 'line-color': '#ffe3c8' },
    railway: { 'line-color': '#d8cfc3' }, railway_transit: { 'line-color': '#d8cfc3' }, railway_service: { 'line-color': '#d8cfc3' },
    'highway-name-minor': { 'text-color': '#7a6e62' }, 'highway-name-major': { 'text-color': '#6b5f53' },
    'highway-name-path': { 'text-color': '#9a8d7f' },
    water_name_point_label: { 'text-color': '#3f7fa8' }, water_name_line_label: { 'text-color': '#3f7fa8' }
  };
  var ROUTER = 'https://routing.openstreetmap.de/routed-';
  var CACHE_KEY = 'scmap-v1', OK_KEY = 'scmap-ok';
  var SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  var MODES = {
    foot: { name: 'Zu Fuß', wie: 'zu Fuß', e: '🚶', apple: 'w', google: 'walking' },
    bike: { name: 'Rad', wie: 'mit dem Rad', e: '🚲', apple: 'w', google: 'bicycling' },
    car:  { name: 'Auto', wie: 'mit dem Auto', e: '🚗', apple: 'd', google: 'driving' }
  };

  // Kategorien: Symbol, Farbe und welche OSM-Merkmale dazugehören
  var CATS = {
    essen:    { name: 'Essen & Trinken', ico: '🍽️', farbe: '#e78a53', amenity: ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'ice_cream', 'biergarten'] },
    lebensm:  { name: 'Lebensmittel', ico: '🥖', farbe: '#d9a441', shop: ['bakery', 'butcher', 'supermarket', 'convenience', 'greengrocer', 'deli', 'beverages', 'confectionery', 'kiosk'] },
    schoen:   { name: 'Friseur & Beauty', ico: '💇', farbe: '#d16ba5', shop: ['hairdresser', 'beauty', 'cosmetics', 'massage', 'tattoo', 'nails'] },
    gesund:   { name: 'Gesundheit', ico: '🩺', farbe: '#5fb37d', amenity: ['doctors', 'dentist', 'pharmacy', 'clinic', 'veterinary'], shop: ['optician', 'hearing_aids', 'medical_supply'], healthcare: ['*'] },
    handwerk: { name: 'Handwerk', ico: '🔧', farbe: '#8d99ae', craft: ['*'], shop: ['hardware', 'doityourself', 'locksmith'] },
    auto:     { name: 'Auto & Rad', ico: '🚗', farbe: '#4f8fd1', shop: ['car', 'car_repair', 'car_parts', 'tyres', 'bicycle', 'motorcycle'], amenity: ['car_wash', 'fuel', 'car_rental'] },
    mode:     { name: 'Mode & Schmuck', ico: '👗', farbe: '#b07cd8', shop: ['clothes', 'shoes', 'jewelry', 'bag', 'boutique', 'fashion_accessories', 'tailor', 'watches'] },
    wohnen:   { name: 'Wohnen & Geschenke', ico: '🛋️', farbe: '#c98b6b', shop: ['furniture', 'florist', 'gift', 'interior_decoration', 'houseware', 'garden_centre', 'books', 'stationery', 'toys', 'art', 'second_hand'] },
    technik:  { name: 'Technik & Handy', ico: '📱', farbe: '#6fa3a3', shop: ['electronics', 'mobile_phone', 'computer', 'hifi', 'photo', 'appliance'] },
    web:      { name: 'Web, Design & Medien', ico: '💻', farbe: '#f2b48a', office: ['it', 'advertising_agency', 'graphic_design', 'company'], shop: ['copyshop'], craft: ['photographer', 'printer'] },
    dienst:   { name: 'Büros & Dienste', ico: '💼', farbe: '#a3a3a3', office: ['*'], amenity: ['bank', 'post_office', 'driving_school'], shop: ['travel_agency', 'laundry', 'dry_cleaning', 'estate_agent', 'funeral_directors'] },
    freizeit: { name: 'Sport & Freizeit', ico: '⚽', farbe: '#7cc07c', leisure: ['fitness_centre', 'sports_centre'], shop: ['sports', 'outdoor', 'music', 'pet', 'games'] },
    sonst:    { name: 'Weitere Geschäfte', ico: '🛍️', farbe: '#7d7973' }
  };
  var ORDER = ['essen', 'lebensm', 'schoen', 'gesund', 'handwerk', 'auto', 'mode', 'wohnen', 'technik', 'web', 'dienst', 'freizeit', 'sonst'];

  // Deutsche Namen für häufige Arten
  var ART = {
    restaurant: 'Restaurant', cafe: 'Café', fast_food: 'Imbiss', bar: 'Bar', pub: 'Kneipe', ice_cream: 'Eisdiele', biergarten: 'Biergarten',
    bakery: 'Bäckerei', butcher: 'Metzgerei', supermarket: 'Supermarkt', convenience: 'Laden', greengrocer: 'Obst & Gemüse', kiosk: 'Kiosk', beverages: 'Getränke',
    hairdresser: 'Friseur', beauty: 'Kosmetik', cosmetics: 'Kosmetik', massage: 'Massage', tattoo: 'Tattoo', nails: 'Nagelstudio',
    doctors: 'Arztpraxis', clinic: 'Praxis & Klinik', physiotherapy: 'Physiotherapie', psychotherapist: 'Psychotherapie', alternative: 'Heilpraktiker', hearing_aids: 'Hörakustik', dentist: 'Zahnarzt', pharmacy: 'Apotheke', veterinary: 'Tierarzt', optician: 'Optiker', physiotherapist: 'Physiotherapie',
    car: 'Autohandel', car_repair: 'Autowerkstatt', tyres: 'Reifen', bicycle: 'Fahrradladen', car_wash: 'Waschanlage', fuel: 'Tankstelle',
    clothes: 'Mode', shoes: 'Schuhe', jewelry: 'Schmuck', tailor: 'Schneiderei', florist: 'Blumen', books: 'Buchhandlung', gift: 'Geschenke', furniture: 'Möbel',
    electronics: 'Elektronik', mobile_phone: 'Handyladen', computer: 'Computer', photo: 'Foto',
    it: 'IT-Firma', advertising_agency: 'Werbeagentur', graphic_design: 'Grafikdesign', photographer: 'Fotograf', printer: 'Druckerei', copyshop: 'Copyshop',
    electrician: 'Elektriker', plumber: 'Installateur', carpenter: 'Schreiner', painter: 'Maler', roofer: 'Dachdecker', locksmith: 'Schlüsseldienst', hvac: 'Heizung & Klima',
    company: 'Firma', bank: 'Bank', post_office: 'Post', driving_school: 'Fahrschule', lawyer: 'Anwalt', tax_advisor: 'Steuerberatung', insurance: 'Versicherung', estate_agent: 'Makler',
    fitness_centre: 'Fitnessstudio', sports: 'Sportgeschäft', pet: 'Tierbedarf', laundry: 'Wäscherei', travel_agency: 'Reisebüro'
  };

  // Weitere Suchwörter, damit man z. B. mit „Nägel“ das Nagelstudio findet
  var SUCHE = {
    Nagelstudio: 'nägel nails maniküre pediküre', Friseur: 'haare frisör barber', Kosmetik: 'beauty',
    Autowerkstatt: 'kfz reparatur', Reifen: 'reifenwechsel', Imbiss: 'döner pizza burger', Zahnarzt: 'zähne'
  };

  var $ = function (id) { return document.getElementById(id); };
  var map, all = [], byId = {}, center = START, me = null, meMarker = null, selMarker = null;
  var aktiv = null, sel = null, modus = 'foot', routeInfo = null, starMarkers = [];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function kategorie(t) {
    for (var i = 0; i < ORDER.length - 1; i++) {
      var c = CATS[ORDER[i]];
      for (var key in c) {
        if (!Array.isArray(c[key]) || !t[key]) continue;
        if (c[key][0] === '*' || c[key].indexOf(String(t[key]).split(';')[0]) !== -1) return ORDER[i];
      }
    }
    return 'sonst';
  }
  function art(f) {
    if (f.star) return f.slogan || CATS[f.kat].name;
    var t = f.t, v = (t.shop || t.amenity || t.craft || t.office || t.healthcare || t.leisure || '').split(';')[0];
    // Nagelstudios stehen in OSM meist als shop=beauty mit beauty=nails – oder man erkennt sie am Namen
    if (v === 'beauty' && (/nails/.test(t.beauty || '') || /nail|n[aä]gel/i.test(f.name))) return 'Nagelstudio';
    return ART[v] || (v ? v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ') : 'Geschäft');
  }
  function abstand(a, b) {
    var R = 6371000, r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function meter(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km'; }
  function minuten(s) { var m = Math.max(1, Math.round(s / 60)); return m < 60 ? m + ' Min.' : Math.floor(m / 60) + ' Std. ' + (m % 60) + ' Min.'; }
  function blatt(h) { document.documentElement.style.setProperty('--sheet', h); setTimeout(function () { map && map.resize(); }, 320); }
  function ll(f) { return [f.lon, f.lat]; }

  // ---------- Daten ----------
  function laden() {
    return fetch('/map/firmen.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) { if (!d.length) throw new Error('leer'); return d; })
      .catch(live);
  }
  function live() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (c && Date.now() - c.zeit < 864e5) return Promise.resolve(c.daten);
    } catch (e) {}
    var um = '(around:2000,' + START[1] + ',' + START[0] + ')';
    var q = '[out:json][timeout:25];(' + ['shop', 'craft', 'office', 'healthcare', 'amenity'].map(function (k) { return 'nwr["' + k + '"]["name"]' + um + ';'; }).join('') + ');out center tags;';
    var versuch = function (i) {
      return fetch(SERVERS[i] + '?data=' + encodeURIComponent(q))
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function (e) { if (i + 1 < SERVERS.length) return versuch(i + 1); throw e; });
    };
    return versuch(0).then(function (j) {
      var daten = j.elements.map(function (e) {
        var lat = e.lat || (e.center && e.center.lat), lon = e.lon || (e.center && e.center.lon);
        return lat ? { id: e.type + e.id, name: e.tags.name, lat: lat, lon: lon, t: e.tags } : null;
      }).filter(Boolean);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ zeit: Date.now(), daten: daten })); } catch (e) {}
      return daten;
    });
  }

  // ---------- Filter & Liste ----------
  function passt(f, q) {
    if (aktiv && f.kat !== aktiv) return false;
    if (!q) return true;
    var a = art(f), text = [f.name, a, SUCHE[a], CATS[f.kat].name, (f.kann || []).join(' '), f.t.cuisine, f.t.description].join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return text.indexOf(w) !== -1; });
  }
  function treffer() {
    var q = $('q').value.trim().toLowerCase();
    return all.filter(function (f) { return passt(f, q); });
  }

  function kartenDaten(liste) {
    var src = map && map.getSource('firmen');
    if (!src) return;
    src.setData({ type: 'FeatureCollection', features: liste.filter(function (f) { return !f.star; }).map(function (f) {
      return { type: 'Feature', id: f.n, properties: { id: f.id, farbe: CATS[f.kat].farbe, name: f.name }, geometry: { type: 'Point', coordinates: ll(f) } };
    }) });
    var sichtbar = {};
    liste.forEach(function (f) { if (f.star) sichtbar[f.id] = 1; });
    starMarkers.forEach(function (m) { m.getElement().style.display = sichtbar[m._id] ? '' : 'none'; });
  }

  function kategorien() {
    var zahl = {};
    all.forEach(function (f) { if (f.dist <= RADIUS) zahl[f.kat] = (zahl[f.kat] || 0) + 1; });
    $('cats').innerHTML = (aktiv ? '<button class="cat clear" type="button" data-alle>✕ Alle</button>' : '') + ORDER.filter(function (k) { return zahl[k] || aktiv === k; }).map(function (k) {
      return '<button class="cat" type="button" data-k="' + k + '" aria-pressed="' + (aktiv === k) + '">' + CATS[k].ico + ' ' + CATS[k].name + ' <b>' + (zahl[k] || 0) + '</b></button>';
    }).join('');
  }

  function liste() {
    sel = null; routeWeg(); if (selMarker) { selMarker.remove(); selMarker = null; }
    var tr = treffer(), q = $('q').value.trim();
    kartenDaten(tr); kategorien();
    var nah = tr.filter(function (f) { return f.dist <= RADIUS; }).length;
    var sorted = tr.slice().sort(function (a, b) { return (b.star - a.star) || (a.dist - b.dist); }).slice(0, 60);
    var titel = q ? '„' + esc(q) + '“' : aktiv ? CATS[aktiv].ico + ' ' + CATS[aktiv].name : 'In deiner Nähe';
    var h = (aktiv || q ? '<button class="back" type="button" data-alle>‹ Alle Geschäfte</button>' : '') + '<h2>' + titel + '</h2><p class="sum muted">' + (tr.length
      ? nah + ' im Umkreis von 1 km' + (me ? '' : ' um die Innenstadt') + ' · ' + tr.length + ' in Erlangen'
      : 'Nichts gefunden – probier ein anderes Wort.') + '</p>';
    h += sorted.map(function (f) {
      var c = CATS[f.kat];
      return '<button class="row' + (f.star ? ' star' : '') + '" type="button" data-id="' + f.id + '">' +
        '<span class="ic" style="background:' + c.farbe + '22">' + (f.star ? '⭐' : c.ico) + '</span>' +
        '<span class="tx"><b>' + esc(f.name) + '</b><span>' + esc(art(f)) + '</span></span>' +
        '<span class="dist">' + meter(f.dist) + '</span></button>';
    }).join('');
    h += '<button class="join-link" type="button" data-join>⭐ <b>Dein Geschäft hier zeigen?</b><br><span class="muted">Mit goldenem Pin, Foto und „Das kann ich“ – zum Start kostenlos.</span></button>';
    $('sheetBody').innerHTML = h;
    $('sheetBody').scrollTop = 0;
  }

  // ---------- Detail & Weg ----------
  function detail(id) {
    var f = byId[id]; if (!f) return;
    if (!sel) merken();
    sel = f; routeWeg();
    if (selMarker) selMarker.remove(); selMarker = null;
    if (!f.star) {
      var el = document.createElement('div'); el.className = 'pin-sel';
      selMarker = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, 4] }).setLngLat(ll(f)).addTo(map);
    }
    blatt('52vh');
    map.flyTo({ center: ll(f), zoom: Math.max(map.getZoom(), 16), padding: { bottom: window.innerHeight * 0.45 }, duration: 700 });
    zeichneDetail();
  }

  function zeichneDetail() {
    var f = sel, t = f.t, c = CATS[f.kat];
    var adr = [t['addr:street'] && (t['addr:street'] + ' ' + (t['addr:housenumber'] || '')).trim(), t['addr:city']].filter(Boolean).join(', ') || f.ort || '';
    var web = f.web || t.website || t['contact:website'], tel = f.telefon || t.phone || t['contact:phone'];
    var h = '<div class="det"><button class="back" type="button" data-back>‹ Zurück zur Liste</button>';
    if (f.star && f.bild) h += '<img class="hero" src="' + esc(f.bild) + '" alt="">';
    if (f.star) h += '<span class="badge">⭐ Schaufenster</span>';
    h += '<h2>' + esc(f.name) + '</h2><p class="kind">' + c.ico + ' ' + esc(art(f)) + ' · ' + meter(f.dist) + '</p>';

    h += '<div class="modes">' + Object.keys(MODES).map(function (k) {
      var info = routeInfo && routeInfo.modus === k && routeInfo.dauer ? minuten(routeInfo.dauer) : MODES[k].name;
      return '<button class="mode" type="button" data-mode="' + k + '" aria-pressed="' + (routeInfo && routeInfo.modus === k) + '"><span class="e">' + MODES[k].e + '</span><b>' + info + '</b></button>';
    }).join('') + '</div>';
    if (routeInfo && routeInfo.fehler) h += '<div class="route-info">' + esc(routeInfo.fehler) + '</div>';
    else if (routeInfo && routeInfo.laedt) h += '<div class="route-info">Weg wird berechnet …</div>';
    else if (routeInfo) h += '<div class="route-info"><b>' + minuten(routeInfo.dauer) + '</b> · ' + meter(routeInfo.strecke) + ' ' + MODES[routeInfo.modus].wie + '</div>';

    var m = routeInfo ? routeInfo.modus : modus;
    h += '<div class="acts"><button class="act main" type="button" data-go>▶ ' + MODES[m].e + ' Los geht’s</button>';
    if (f.whatsapp) h += '<a class="act" href="https://wa.me/' + esc(f.whatsapp) + '">💬 WhatsApp</a>';
    if (tel) h += '<a class="act" href="tel:' + esc(tel.replace(/[^+\d]/g, '')) + '">📞 Anrufen</a>';
    if (web && /^https?:\/\//.test(web)) h += '<a class="act" href="' + esc(web) + '" target="_blank" rel="noopener">🌐 Website</a>';
    h += '</div>';
    if (routeInfo && routeInfo.route) {
      var st = routeInfo.route.legs[0].steps;
      h += '<details class="steps"><summary>Wegbeschreibung · ' + (st.length - 1) + ' Schritte</summary><ol>' + st.slice(1).map(function (s, i) {
        return '<li><span class="sp">' + pfeil(s) + '</span><span>' + esc(anweisung(s)) + (s.name ? '<small>' + esc(s.name) + '</small>' : '') + '</span><em>' + meter(st[i].distance) + '</em></li>';
      }).join('') + '</ol></details>';
    }

    if (f.star) {
      if (f.aktion) h += '<p class="deal">🔥 ' + esc(f.aktion) + '</p>';
      if (f.story) h += '<p>' + esc(f.story) + '</p>';
      if (f.kann) h += '<p><b>Das kann ich:</b></p><div class="tags">' + f.kann.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>';
    }
    h += '<div class="info">';
    if (adr) h += '<div>📍 ' + esc(adr) + '</div>';
    if (t.opening_hours) h += '<div>🕒 ' + esc(t.opening_hours) + '</div>';
    if (t.cuisine) h += '<div>🍴 ' + esc(t.cuisine.replace(/;/g, ', ').replace(/_/g, ' ')) + '</div>';
    h += '</div>';
    if (!f.star) h += '<button class="claim" type="button" data-claim><span>🏪</span><span><b>Ist das deine Firma?</b><br>Profil kostenlos ergänzen →</span></button>';
    $('sheetBody').innerHTML = h + '</div>';
  }

  function routeWeg() {
    routeInfo = null;
    var src = map && map.getSource('route');
    if (src) src.setData({ type: 'FeatureCollection', features: [] });
  }

  // Weg mit Abbiege-Schritten holen; s.km = wo der Schritt entlang der Strecke beginnt
  function routeHolen(von, ziel, k) {
    return fetch(ROUTER + k + '/route/v1/driving/' + von.join(',') + ';' + ziel.lon + ',' + ziel.lat + '?overview=full&geometries=geojson&steps=true')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.code !== 'Ok' || !j.routes.length) throw new Error(j.code);
        var r = j.routes[0], c = r.geometry.coordinates, km = 0;
        r.kum = [0];
        for (var i = 1; i < c.length; i++) r.kum[i] = r.kum[i - 1] + abstand(c[i - 1], c[i]);
        r.legs[0].steps.forEach(function (s) { s.km = km; km += s.distance; });
        return r;
      });
  }

  function weg(k, danach) {
    if (!sel) return;
    modus = k;
    var ziel = sel;
    var los = function () {
      routeInfo = { modus: k, laedt: true }; zeichneDetail();
      routeHolen(me, ziel, k)
        .then(function (r) {
          if (sel !== ziel) return;
          routeInfo = { modus: k, dauer: r.duration, strecke: r.distance, route: r };
          map.getSource('route').setData({ type: 'Feature', properties: { modus: k }, geometry: r.geometry });
          zeichneDetail();
          if (danach) return danach();
          var b = new maplibregl.LngLatBounds();
          r.geometry.coordinates.forEach(function (p) { b.extend(p); });
          blatt('40vh');
          map.fitBounds(b, { padding: { top: 130, bottom: window.innerHeight * 0.42, left: 40, right: 70 }, maxZoom: 17, pitch: 0, bearing: 0, duration: 800 });
        })
        .catch(function () {
          if (sel !== ziel) return;
          routeInfo = { modus: k, fehler: 'Der Weg konnte gerade nicht berechnet werden. Bitte gleich noch einmal versuchen.' };
          zeichneDetail();
        });
    };
    if (me) return los();
    routeInfo = { modus: k, laedt: true }; zeichneDetail();
    standort(function (ok) {
      if (ok) los();
      else { routeInfo = { modus: k, fehler: 'Erlaube deinen Standort, damit wir dir den Weg zeigen können.' }; zeichneDetail(); }
    });
  }

  // ---------- Navigation in der App ----------
  var DREH = { 'sharp left': -135, left: -90, 'slight left': -45, straight: 0, 'slight right': 45, right: 90, 'sharp right': 135, uturn: 180 };
  var WORT = { 'sharp left': 'Scharf links', left: 'Links', 'slight left': 'Leicht links', straight: 'Geradeaus', 'slight right': 'Leicht rechts', right: 'Rechts', 'sharp right': 'Scharf rechts', uturn: 'Wenden' };
  var nav = null, ton = true;

  function anweisung(s) {
    var m = s.maneuver, w = WORT[m.modifier] || 'Weiter';
    if (m.type === 'arrive') return 'Ziel erreicht';
    if (m.type === 'depart') return 'Los geht’s';
    if (/roundabout|rotary/.test(m.type)) return m.exit ? 'Im Kreisverkehr die ' + m.exit + '. Ausfahrt' : 'In den Kreisverkehr';
    if (m.modifier === 'uturn') return 'Wenden';
    if (m.modifier === 'straight' || m.type === 'new name' || !m.modifier) return 'Geradeaus weiter';
    if (/fork|continue|merge|ramp/.test(m.type)) return w + ' halten';
    return w + ' abbiegen';
  }
  function pfeil(s) {
    var m = s.maneuver;
    if (m.type === 'arrive') return '🏁';
    if (/roundabout|rotary/.test(m.type)) return '<b class="kreis">↻</b>';
    return '<svg viewBox="0 0 24 24" style="transform:rotate(' + (DREH[m.modifier] || 0) + 'deg)" aria-hidden="true"><path d="M12 2l7.5 8.5H15V22H9V10.5H4.5z" fill="currentColor"/></svg>';
  }
  function sprechen(text) {
    if (!ton || !window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE';
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  // Nächster Punkt auf der Strecke: wie weit sind wir schon (km) und wie weit daneben (weg)
  function aufStrecke(p, r) {
    var c = r.geometry.coordinates, kx = Math.cos(p[1] * Math.PI / 180) * 111320, ky = 110540, best = { weg: Infinity, km: 0, i: 1 };
    for (var i = 1; i < c.length; i++) {
      var ax = (c[i - 1][0] - p[0]) * kx, ay = (c[i - 1][1] - p[1]) * ky, dx = (c[i][0] - p[0]) * kx - ax, dy = (c[i][1] - p[1]) * ky - ay;
      var l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / l)) : 0;
      var d = Math.sqrt(Math.pow(ax + t * dx, 2) + Math.pow(ay + t * dy, 2));
      if (d < best.weg) best = { weg: d, km: r.kum[i - 1] + t * (r.kum[i] - r.kum[i - 1]), i: i };
    }
    return best;
  }
  function richtung(a, b) {
    var r = Math.PI / 180, y = Math.sin((b[0] - a[0]) * r) * Math.cos(b[1] * r);
    var x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos((b[0] - a[0]) * r);
    return Math.atan2(y, x) / r;
  }

  function navStart() {
    if (!sel || !routeInfo || !routeInfo.route) return weg(modus, navStart);
    nav = { ziel: sel, modus: routeInfo.modus, route: routeInfo.route, schritt: -1, jetzt: false, folgen: true };
    document.body.classList.add('navigating');
    $('nav').hidden = false; $('navMitte').hidden = true;
    $('navTon').textContent = ton ? '🔊' : '🔇';
    if (selMarker) selMarker.getElement().classList.add('ziel');
    try { navigator.wakeLock.request('screen').then(function (l) { if (nav) nav.lock = l; else l.release(); }).catch(function () {}); } catch (e) {}
    nav.watch = navigator.geolocation.watchPosition(function (pos) { navPos([pos.coords.longitude, pos.coords.latitude]); },
      function () {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
    merken();
    navPos(me);
  }

  function navPos(p) {
    if (!nav) return;
    me = p; meMarker.setLngLat(p);
    var r = nav.route, steps = r.legs[0].steps, pos = aufStrecke(p, r), rest = Math.max(0, r.distance - pos.km);
    var auto = nav.modus === 'car';

    // Vom Weg abgekommen: neu berechnen (höchstens alle 12 Sekunden)
    if (pos.weg > (auto ? 60 : 35) && !nav.neu) {
      nav.neu = true;
      routeHolen(p, nav.ziel, nav.modus).then(function (neu) {
        if (!nav) return;
        nav.route = neu; nav.schritt = -1;
        map.getSource('route').setData({ type: 'Feature', properties: { modus: nav.modus }, geometry: neu.geometry });
        sprechen('Neue Route');
        navPos(me);
      }).catch(function () {}).then(function () { setTimeout(function () { if (nav) nav.neu = false; }, 12000); });
    }

    if (rest < 20) {
      $('navPfeil').innerHTML = '🏁'; $('navDist').textContent = 'Du bist da!'; $('navText').textContent = nav.ziel.name; $('navStr').textContent = '';
      $('navZeit').textContent = 'Angekommen 🎉'; $('navRest').textContent = '';
      $('navEnde').textContent = 'Fertig';
      if (nav.schritt !== 'da') { nav.schritt = 'da'; sprechen('Du bist da. ' + nav.ziel.name); }
      return;
    }

    // Nächster Abbiegepunkt vor uns
    var k = 1;
    while (k < steps.length - 1 && steps[k].km <= pos.km + 3) k++;
    var s = steps[k], bis = Math.max(0, s.km - pos.km);
    $('navPfeil').innerHTML = pfeil(s);
    $('navDist').textContent = bis < 10 ? 'Jetzt' : meter(bis);
    $('navText').textContent = anweisung(s);
    $('navStr').textContent = s.name || '';
    $('navZeit').textContent = minuten(r.duration * rest / r.distance);
    $('navRest').textContent = meter(rest) + ' · Ankunft ' + new Date(Date.now() + r.duration * rest / r.distance * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    $('navEnde').textContent = 'Beenden';
    if (k !== nav.schritt) {
      nav.schritt = k; nav.jetzt = false;
      sprechen((bis > 25 ? 'In ' + meter(bis).replace(' m', ' Metern').replace(' km', ' Kilometern') + ' ' : '') + anweisung(s).replace(/^\S+/, function (w) { return bis > 25 ? w.toLowerCase() : w; }));
    } else if (!nav.jetzt && bis < (auto ? 40 : 15)) {
      nav.jetzt = true; sprechen('Jetzt ' + anweisung(s).replace(/^\S+/, function (w) { return w.toLowerCase(); }));
    }

    if (nav.folgen) {
      var c = r.geometry.coordinates;
      map.easeTo({ center: p, bearing: richtung(c[pos.i - 1], c[pos.i]), pitch: 55, zoom: auto ? 16.5 : 17.6,
        padding: { top: 150, bottom: 120, left: 0, right: 0 }, duration: 900 });
    }
  }

  function navEnde() {
    if (!nav) return;
    navigator.geolocation.clearWatch(nav.watch);
    if (nav.lock) nav.lock.release().catch(function () {});
    if (window.speechSynthesis) speechSynthesis.cancel();
    nav = null;
    document.body.classList.remove('navigating');
    $('nav').hidden = true;
    if (selMarker) selMarker.getElement().classList.remove('ziel');
    map.easeTo({ pitch: 40, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
    if (sel) zeichneDetail();
  }

  // ---------- Standort ----------
  function standort(fertig) {
    if (!navigator.geolocation) return fertig && fertig(false);
    navigator.geolocation.getCurrentPosition(function (pos) {
      me = [pos.coords.longitude, pos.coords.latitude];
      if (!meMarker) {
        var el = document.createElement('div'); el.className = 'me';
        meMarker = new maplibregl.Marker({ element: el }).setLngLat(me).addTo(map);
      } else meMarker.setLngLat(me);
      // Nur innerhalb von Erlangen als Mittelpunkt nutzen
      center = abstand(me, START) < 15000 ? me : START;
      all.forEach(function (f) { f.dist = abstand(center, ll(f)); });
      fertig && fertig(true);
    }, function () { fertig && fertig(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  // ---------- Karte ----------
  function gestalten() {
    Object.keys(FARBEN).forEach(function (id) {
      if (!map.getLayer(id)) return;
      for (var k in FARBEN[id]) map.setPaintProperty(id, k, FARBEN[id][k]);
    });
    // Gebäude ab Zoom 15 in 3D, sanft eingeblendet
    var vor = map.getStyle().layers.filter(function (l) { return l.type === 'symbol'; })[0];
    map.addLayer({ id: 'gebaeude-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 15, paint: {
      'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#f1e8dc', 40, '#e6d8c6'],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, ['coalesce', ['get', 'render_height'], 8]],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.7
    } }, vor && vor.id);
  }

  function start() {
    $('gate').hidden = true;
    try { localStorage.setItem(OK_KEY, '1'); } catch (e) {}
    blatt('34vh');
    $('sheetBody').innerHTML = '<p class="muted">Lade Geschäfte aus Erlangen …</p>';
    map = new maplibregl.Map({ container: 'map', style: STYLE, center: START, zoom: 15.5, pitch: 40, maxPitch: 65, attributionControl: false });
    map.on('dragstart', function () { if (nav && nav.folgen) { nav.folgen = false; $('navMitte').hidden = false; } });
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Wege: <a href="https://routing.openstreetmap.de">FOSSGIS</a>' }), 'bottom-left');

    var bereit = new Promise(function (ok) { map.on('load', ok); });
    var daten = Promise.all([laden(), fetch('/map/profile.json').then(function (r) { return r.json(); }).catch(function () { return []; })]);

    bereit.then(function () {
      gestalten();
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'route-rand', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#0b57d0', 'line-width': 9 } });
      map.addLayer({ id: 'route', type: 'line', source: 'route', filter: ['!=', ['get', 'modus'], 'foot'], layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#4f8ff7', 'line-width': 6 } });
      // Zu Fuß: gepunktete Linie wie bei Google Maps
      map.setFilter('route-rand', ['!=', ['get', 'modus'], 'foot']);
      map.addLayer({ id: 'route-fuss', type: 'line', source: 'route', filter: ['==', ['get', 'modus'], 'foot'], layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1a73e8', 'line-width': 7, 'line-dasharray': [0.1, 1.8] } });
      map.addSource('firmen', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'firmen', type: 'circle', source: 'firmen', paint: {
        'circle-color': ['get', 'farbe'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 14, 4.5, 17, 8],
        'circle-stroke-color': '#fff', 'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 15, 1.5]
      } });
      map.addLayer({ id: 'firmen-name', type: 'symbol', source: 'firmen', minzoom: 16.5, layout: {
        'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true
      }, paint: { 'text-color': '#333', 'text-halo-color': '#fff', 'text-halo-width': 1.5 } });
      map.on('click', 'firmen', function (e) { detail(e.features[0].properties.id); });
      map.on('mouseenter', 'firmen', function () { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'firmen', function () { map.getCanvas().style.cursor = ''; });
      return daten;
    }).then(function (res) {
      var stars = res[1].map(function (p) { p.star = true; p.id = 'p-' + p.id; p.kat = CATS[p.kategorie] ? p.kategorie : 'sonst'; p.t = {}; return p; });
      all = res[0].map(function (f) { f.star = false; f.kat = kategorie(f.t); return f; }).concat(stars);
      all.forEach(function (f, i) { f.n = i; f.dist = abstand(center, ll(f)); byId[f.id] = f; });
      stars.forEach(function (f) {
        var el = document.createElement('div'); el.className = 'pin-star'; el.innerHTML = '<span>' + CATS[f.kat].ico + '</span>';
        el.title = f.name;
        el.addEventListener('click', function (e) { e.stopPropagation(); detail(f.id); });
        var m = new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat(ll(f)).addTo(map);
        m._id = f.id; starMarkers.push(m);
      });
      liste();
    }).catch(function () {
      $('sheetBody').innerHTML = '<p class="muted">Die Geschäfte konnten gerade nicht geladen werden. Bitte später noch einmal versuchen.</p>';
    });
  }

  // ---------- Bedienung ----------
  $('load').addEventListener('click', start);
  $('grip').addEventListener('click', function () {
    var jetzt = getComputedStyle(document.documentElement).getPropertyValue('--sheet').trim();
    blatt(jetzt === '78vh' ? '34vh' : '78vh');
  });
  $('q').addEventListener('input', function () { if (all.length) { liste(); blatt('52vh'); } });
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') e.target.blur(); });
  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('.cat'); if (!b) return;
    if (b.hasAttribute('data-alle') || aktiv === b.dataset.k) return zurueck();
    if (!aktiv) merken();
    aktiv = b.dataset.k; liste();
  });
  $('sheetBody').addEventListener('click', function (e) {
    var r = e.target.closest('.row'); if (r) return detail(r.dataset.id);
    var m = e.target.closest('[data-mode]'); if (m) return weg(m.dataset.mode);
    if (e.target.closest('[data-go]')) return navStart();
    if (e.target.closest('[data-back]') || e.target.closest('[data-alle]')) return zurueck();
    if (e.target.closest('[data-claim]')) return beitreten(sel);
    if (e.target.closest('[data-join]')) beitreten(null);
  });
  $('join').addEventListener('click', function (e) { if (e.target === this || e.target.closest('[data-close]')) this.hidden = true; });

  // Zurück: eine Ebene hoch (Navigation → Firma → Kategorie → alle). Auch die Zurück-Taste am Handy.
  var tiefe = 0;
  function merken() { try { history.pushState({ map: 1 }, ''); tiefe++; } catch (e) {} }
  function eineEbeneHoch() {
    if (nav) return navEnde();
    if (sel) { blatt('34vh'); return liste(); }
    aktiv = null; $('q').value = ''; liste();
  }
  function zurueck() { if (tiefe > 0) history.back(); else eineEbeneHoch(); }
  window.addEventListener('popstate', function () { tiefe = Math.max(0, tiefe - 1); if (map) eineEbeneHoch(); });
  $('navEnde').addEventListener('click', zurueck);
  $('navTon').addEventListener('click', function () {
    ton = !ton; this.textContent = ton ? '🔊' : '🔇';
    if (!ton && window.speechSynthesis) speechSynthesis.cancel();
  });
  $('navMitte').addEventListener('click', function () { if (!nav) return; nav.folgen = true; this.hidden = true; navPos(me); });

  // Firmen melden sich: Formular (Formspree) oder WhatsApp, bei „Ist das deine Firma?“ schon ausgefüllt
  function beitreten(f) {
    var form = $('joinForm');
    form.reset(); form.hidden = false; $('joinOk').hidden = true; $('joinErr').hidden = true;
    form.firma.value = f ? f.name : '';
    form.eintrag.value = f ? f.name + ' (' + f.id + ', ' + art(f) + ')' : '';
    $('joinT').textContent = f ? 'Ist „' + f.name + '“ deine Firma?' : 'Zeig dein Geschäft im ⭐ Schaufenster';
    $('joinWa').href = 'https://wa.me/4917646188101?text=' + encodeURIComponent(f
      ? 'Hallo SocialClip, ich bin von „' + f.name + '“ und möchte mein Profil auf der SocialClip Map ergänzen.'
      : 'Hallo SocialClip, ich möchte mein Geschäft auf der SocialClip Map zeigen.');
    $('join').hidden = false;
  }
  $('joinForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = this, knopf = form.querySelector('[type=submit]');
    knopf.disabled = true; knopf.textContent = 'Wird gesendet …'; $('joinErr').hidden = true;
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); form.hidden = true; $('joinOk').hidden = false; })
      .catch(function () { $('joinErr').hidden = false; })
      .then(function () { knopf.disabled = false; knopf.textContent = 'Profil kostenlos ergänzen'; });
  });
  $('locate').addEventListener('click', function () {
    if (!map) return start();
    standort(function (ok) {
      if (!ok) { alert('Standort nicht verfügbar. Bitte erlaube den Standortzugriff in deinem Browser.'); return; }
      map.flyTo({ center: me, zoom: 16 });
      if (sel) zeichneDetail(); else liste();
    });
  });
  $('surprise').addEventListener('click', function () {
    if (!all.length) return;
    var nah = all.filter(function (f) { return f.dist <= RADIUS * 1.5 && f.kat !== 'sonst'; });
    if (nah.length) detail(nah[Math.floor(Math.random() * nah.length)].id);
  });

  // Wer schon einmal zugestimmt hat, sieht die Karte direkt
  try { if (localStorage.getItem(OK_KEY)) start(); } catch (e) {}
})();
