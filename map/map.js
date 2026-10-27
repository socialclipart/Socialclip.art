/* SocialClip Map: Geschäfte in Nürnberg, Fürth und Erlangen entdecken und hinfinden
   Karte: OpenFreeMap · Firmen: OpenStreetMap (map/firmen.json, wöchentlich per GitHub Actions) · Wege: FOSSGIS-Routing */
(function () {
  // Städte der Map: Mittelpunkt [Länge, Breite]
  var STAEDTE = {
    nuernberg: { name: 'Nürnberg', mitte: [11.0775, 49.4521] },
    fuerth:    { name: 'Fürth', mitte: [10.9886, 49.4771] },
    erlangen:  { name: 'Erlangen', mitte: [11.0039, 49.5897] }
  };
  var stadt = 'erlangen';
  try { if (STAEDTE[localStorage.getItem('scmap-stadt')]) stadt = localStorage.getItem('scmap-stadt'); } catch (e) {}
  var START = STAEDTE[stadt].mitte;
  // Besuchszähler: zählt nur, wenn die Statistik erlaubt wurde (analytics-consent.js)
  function zaehle(name) { try { if (window.gtag) window.gtag('event', name); } catch (e) {} }
  var RADIUS = 1000;                         // „In deiner Nähe“ in Metern
  var STYLE = 'https://tiles.openfreemap.org/styles/positron';   // schlichte Grundkarte, Farben setzt gestalten()
  // Kartenstile Tag (hell, Farben aus der VIERTEL-Designstudie) und Nacht (Neon).
  // Beide setzen dieselben Ebenen, damit setzeStil() jederzeit umschalten kann.
  var GROSS = ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]];
  function txt(farbe, halo) { return { 'text-color': farbe, 'text-halo-color': halo }; }
  function stilFarben(c) {
    return {
      background: { 'background-color': c.grund }, landuse_residential: { 'fill-color': c.wohnen },
      park: { 'fill-color': c.park }, landcover_wood: { 'fill-color': c.wald },
      water: { 'fill-color': c.wasser }, waterway: { 'line-color': c.fluss },
      building: { 'fill-color': c.haus, 'fill-outline-color': c.hausRand },
      highway_path: { 'line-color': c.pfad }, highway_minor: { 'line-color': c.strasse },
      highway_major_casing: { 'line-color': c.hauptRand }, highway_major_inner: { 'line-color': c.haupt },
      highway_motorway_casing: { 'line-color': c.hauptRand }, highway_motorway_inner: { 'line-color': c.autobahn },
      railway: { 'line-color': c.bahn }, railway_transit: { 'line-color': c.bahn }, railway_service: { 'line-color': c.bahn },
      railway_dashline: { 'line-color': c.bahnStrich }, railway_transit_dashline: { 'line-color': c.bahnStrich }, railway_service_dashline: { 'line-color': c.bahnStrich },
      'highway-name-minor': txt(c.schrift, c.halo), 'highway-name-major': txt(c.schrift, c.halo), 'highway-name-path': txt(c.schrift, c.halo),
      water_name_point_label: txt(c.wasserSchrift, c.halo), water_name_line_label: txt(c.wasserSchrift, c.halo),
      label_other: txt(c.ort, c.halo), label_village: txt(c.ort, c.halo), label_town: txt(c.ort, c.halo), label_city: txt(c.ort, c.halo)
    };
  }
  var STILE = {
    tag: {
      farben: stilFarben({ grund: '#e9efdc', wohnen: '#e6ecd8', park: '#d3e3bd', wald: '#c6dbac', wasser: '#c3e2db', fluss: '#aad3ca',
        haus: '#f1f4e8', hausRand: '#dfe6d0', pfad: '#d9e1c8', strasse: '#fafaf1', hauptRand: '#d6dec5', haupt: '#fffef8', autobahn: '#f6f8e4',
        bahn: '#cfd8bf', bahnStrich: '#fafaf1', schrift: '#7d8a74', wasserSchrift: '#4e8a80', ort: '#203c32', halo: '#f4f7ec' }),
      haus: '#f4f7ec', hausDeckkraft: 0.97, dach: '#fbfcf6',
      licht: { anchor: 'viewport', color: '#fffdf2', intensity: 0.32, position: [1.5, 215, 35] },
      baum: '#a9c78b', baumRand: '#8fb173',
      weg: '#ddf77b', wegRand: '#203c32', bus: '#ff9a52', wegStrich: '#203c32', rand: '#fffef8', text: '#203c32', halo: '#fffef8',
      glow: false, theme: '#e9efdc'
    },
    nacht: {
      farben: stilFarben({ grund: '#0c0a1d', wohnen: '#131028', park: '#0d2a26', wald: '#0d2a26', wasser: '#071f3b', fluss: '#0f5f95',
        haus: '#1c1838', hausRand: '#2c2557', pfad: '#3b2f72', strasse: '#3a2c78', hauptRand: '#ff3d9a', haupt: '#ff9a4d', autobahn: '#ffd166',
        bahn: '#4d3f8f', bahnStrich: '#0c0a1d', schrift: '#b9b0ff', wasserSchrift: '#4fc3ff', ort: '#ffffff', halo: '#0c0a1d' }),
      haus: ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#211c48', 30, '#3b2d82', 60, '#6a3fb0'], hausDeckkraft: 0.92, dach: '#3a3270',
      licht: { anchor: 'viewport', color: '#ffffff', intensity: 0.3, position: [1.15, 210, 30] },
      baum: '#1f5c47', baumRand: '#2f8a68',
      weg: '#22e6ff', wegRand: '#0c0a1d', bus: '#ff4fd8', wegStrich: '#0c0a1d', rand: '#0c0a1d', text: '#f3eeff', halo: '#0c0a1d',
      glow: true, theme: '#0c0a1d'
    }
  };
  // Einstellungen aus dem Menü (bleiben auf dem Gerät gespeichert)
  // City Mode verwendet dieselben OpenStreetMap-Daten und vorhandenen 3D-Layer.
  STILE.city = {
    farben: stilFarben({grund:'#071526',wohnen:'#0d2034',park:'#0a302b',wald:'#123d35',wasser:'#092c49',fluss:'#156184',haus:'#172b42',hausRand:'#426487',pfad:'#326278',strasse:'#c66942',hauptRand:'#ee532e',haupt:'#ff9b48',autobahn:'#ffc16d',bahn:'#296784',bahnStrich:'#071526',schrift:'#a1bfd2',wasserSchrift:'#6ecbe5',ort:'#f2f5ff',halo:'#08182b'}),
    haus:['interpolate',['linear'],['coalesce',['get','render_height'],8],0,'#132c46',20,'#244264',65,'#394578'],
    hausDeckkraft:0.97,dach:'#345478',
    licht:{anchor:'viewport',color:'#ffd8ae',intensity:0.38,position:[1.3,225,48]},
    weg:'#ffb15c',wegRand:'#0c2133',bus:'#60e5e9',wegStrich:'#112638',
    rand:'#081a2c',text:'#eef5fc',halo:'#081525',glow:true,theme:'#081525'
  };
  var EIN = { tagNacht: 'tag', dreiD: true, farben: true, neon: true, baeume: true, schilder: true, cityMode: true };
  try {
    var alt = localStorage.getItem('scmap-stil'); if (alt) EIN.tagNacht = alt;
    var gesp = JSON.parse(localStorage.getItem('scmap-einst') || '{}');
    for (var k in gesp) if (k in EIN) EIN[k] = gesp[k];
    // Designrevision V2: vorhandene lokale Nacht-Wahl nicht mit der neuen City-Ansicht verwechseln.
    // Einmalig aktivieren, danach bleibt eine bewusste Nutzerwahl erhalten.
    if (localStorage.getItem('scmap-city-design-v2') !== '1') {
      EIN.cityMode = true;
      localStorage.setItem('scmap-einst', JSON.stringify(EIN));
      localStorage.setItem('scmap-city-design-v2', '1');
    }
  } catch (e) {}
  try { if (new URLSearchParams(location.search).get('city') === '1') EIN.cityMode = true; } catch (e) {}
  function einstSpeichern() { try { localStorage.setItem('scmap-einst', JSON.stringify(EIN)); } catch (e) {} }
  function tagOderNacht() { if (EIN.tagNacht !== 'auto') return EIN.tagNacht; var h = new Date().getHours(); return h >= 19 || h < 7 ? 'nacht' : 'tag'; }
  var stilName = tagOderNacht();
  if (/[?&]stil=nacht/.test(location.search)) stilName = 'nacht';
  if (!STILE[stilName]) stilName = 'tag';
  var STIL = STILE[stilName];
  var PHOTON = 'https://photon.komoot.io/api/';
  var TRANSIT = 'https://api.transitous.org/api/v1/plan';   // Bus & Bahn mit Echtzeit (Transitous, offene Fahrplandaten)
  var ROUTER = 'https://routing.openstreetmap.de/routed-';
  var CACHE_KEY = 'scmap-v1', OK_KEY = 'scmap-ok';
  var SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
  var MODES = {
    foot: { name: 'Zu Fuß', wie: 'zu Fuß', e: '🚶', apple: 'w', google: 'walking' },
    bike: { name: 'Rad', wie: 'mit dem Rad', e: '🚲', apple: 'w', google: 'bicycling' },
    car:  { name: 'Auto', wie: 'mit dem Auto', e: '🚗', apple: 'd', google: 'driving' },
    bus:  { name: 'Bus/Bahn', wie: 'mit Bus & Bahn', e: '🚆' }
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
    if (f.adresse) return 'Adresse';
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
    var mitte = map ? map.getCenter().toArray() : center, b = map && map.getBounds();
    all.forEach(function (f) {
      if (b ? b.contains(ll(f)) && abstand(mitte, ll(f)) < 1500 : f.dist <= RADIUS) zahl[f.kat] = (zahl[f.kat] || 0) + 1;
    });
    $('cats').innerHTML = (aktiv ? '<button class="cat clear" type="button" data-alle>✕ Alle</button>' : '') + ORDER.filter(function (k) { return zahl[k] || aktiv === k; }).map(function (k) {
      return '<button class="cat" type="button" data-k="' + k + '" aria-pressed="' + (aktiv === k) + '">' + CATS[k].ico + ' ' + CATS[k].name + ' <b>' + (zahl[k] || 0) + '</b></button>';
    }).join('');
    catsPfeile();
  }

  function liste() {
    sel = null; routeWeg(); if (selMarker) { selMarker.remove(); selMarker = null; }
    var tr = treffer(), q = $('q').value.trim();
    var cityStat = $('cityHudStat');
    if (cityStat) cityStat.textContent = all.filter(function(f){
      return !f.adresse && f.dist <= 1000 && (!aktiv || f.kat === aktiv);
    }).length.toLocaleString('de-DE');
    kartenDaten(tr); kategorien();
    var nah = tr.filter(function (f) { return f.dist <= RADIUS; }).length;
    var sorted = tr.slice().sort(function (a, b) { return (b.star - a.star) || (a.dist - b.dist); }).slice(0, 60);
    var titel = q ? '„' + esc(q) + '“' : aktiv ? CATS[aktiv].ico + ' ' + CATS[aktiv].name : me && abstand(me, center) < 50 ? 'In deiner Nähe' : center === START ? 'In ' + STAEDTE[stadt].name : 'Hier in der Gegend';
    var schnell = Object.keys(orte).map(function (k) { return '<button class="schnell" type="button" data-ort-los="' + k + '">' + ORTE_NAME[k][0] + ' ' + ORTE_NAME[k][2] + '</button>'; }).join('');
    var h = (aktiv || q ? '<button class="back" type="button" data-alle>‹ Alle Geschäfte</button>' : (schnell ? '<div class="schnell-reihe">' + schnell + '</div>' : '') + '<div class="staedte">' + Object.keys(STAEDTE).map(function (k) {
      return '<button class="stadt" type="button" data-stadt="' + k + '" aria-pressed="' + (k === stadt && !me) + '">' + STAEDTE[k].name + '</button>';
    }).join('') + '</div>') + '<h2>' + titel + '</h2><p class="sum muted">' + (tr.length
      ? nah + ' im Umkreis von 1 km' + (me && abstand(me, center) < 50 ? ' um dich' : center === START ? ' um ' + STAEDTE[stadt].name + ' Mitte' : ' um die Kartenmitte') + ' · ' + tr.length + ' insgesamt'
      : 'Nichts gefunden – probier ein anderes Wort.') + '</p>';
    // Adressen oben, wenn man offenbar eine Adresse sucht (Hausnummer) oder kein Geschäft passt
    var adrOben = q.length >= 3 && (/\d/.test(q) || !tr.length);
    if (q.length >= 3 && adrOben) h += '<div id="adressen" class="adressen"></div>';
    h += sorted.map(function (f) { return zeile(f, f.dist); }).join('');
    if (q.length >= 3 && !adrOben) h += '<div id="adressen" class="adressen"></div>';
    h += '<button class="join-link" type="button" data-join>⭐ <b>Dein Geschäft hier zeigen?</b><br><span class="muted">Mit goldenem Pin, Foto und „Das kann ich“ – zum Start kostenlos.</span></button>';
    $('sheetBody').innerHTML = h;
    $('sheetBody').scrollTop = 0;
    if (q.length >= 3) adressenSuchen(q);
    if (map) schilderZeichnen();
  }

  function zeile(f, d) {
    var c = CATS[f.kat];
    return '<button class="row' + (f.star ? ' star' : '') + '" type="button" data-id="' + f.id + '">' +
      '<span class="ic" style="background:' + c.farbe + '22">' + (f.star ? '⭐' : c.ico) + '</span>' +
      '<span class="tx"><b>' + esc(f.name) + '</b><span>' + esc(art(f)) + '</span></span>' +
      '<span class="dist">' + meter(d) + '</span></button>';
  }

  // ---------- Adressen (Photon/OpenStreetMap), damit man überall hinfinden kann ----------
  var adrTimer, adrNr = 0;
  function adressenSuchen(q) {
    clearTimeout(adrTimer);
    adrTimer = setTimeout(function () {
      fetch(PHOTON + '?q=' + encodeURIComponent(q) + '&lat=' + center[1] + '&lon=' + center[0] + '&limit=5&lang=de')
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var box = $('adressen');
          if (!box || $('q').value.trim() !== q) return;
          var orte = j.features.map(function (p) {
            var e = p.properties, strasse = [e.street, e.housenumber].filter(Boolean).join(' ');
            var f = { id: 'adr-' + (++adrNr), adresse: true, kat: 'sonst', t: {}, lat: p.geometry.coordinates[1], lon: p.geometry.coordinates[0],
              name: e.name || strasse || e.city || q,
              ort: [e.name ? strasse : '', [e.postcode, e.city || e.town || e.village].filter(Boolean).join(' ')].filter(Boolean).join(', ') };
            f.dist = abstand(center, ll(f)); byId[f.id] = f;
            return f;
          });
          if (!orte.length) return;
          box.innerHTML = '<h3>📍 Adressen & Orte</h3>' + orte.map(function (f) {
            return '<button class="row" type="button" data-id="' + f.id + '"><span class="ic adr">📍</span>' +
              '<span class="tx"><b>' + esc(f.name) + '</b><span>' + esc(f.ort) + '</span></span><span class="dist">' + meter(f.dist) + '</span></button>';
          }).join('');
        }).catch(function () {});
    }, 400);
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
    map.flyTo({ center: ll(f), zoom: Math.max(map.getZoom(), 17), padding: { bottom: window.innerHeight * 0.45 }, duration: 700 });
    zeichneDetail();
  }

  function zeichneDetail() {
    var f = sel, t = f.t, c = CATS[f.kat];
    var adr = [t['addr:street'] && (t['addr:street'] + ' ' + (t['addr:housenumber'] || '')).trim(), t['addr:city']].filter(Boolean).join(', ') || f.ort || '';
    var web = f.web || t.website || t['contact:website'], tel = f.telefon || t.phone || t['contact:phone'];
    var h = '<div class="det"><button class="back" type="button" data-back>‹ Zurück zur Liste</button>';
    if (f.star && f.bild) h += '<img class="hero" src="' + esc(f.bild) + '" alt="">';
    if (f.star) h += '<span class="badge">⭐ Schaufenster</span>';
    h += '<h2>' + esc(f.name) + '</h2><p class="kind">' + (f.adresse ? '📍' : c.ico) + ' ' + esc(art(f)) + ' · ' + meter(f.dist) + '</p>';
    var kannClaim = !f.star && !f.adresse;
    if (kannClaim && rolle === 'chef') h += '<button class="claim" type="button" data-claim><span>🏪</span><span><b>Ist das deine Firma?</b><br>Profil kostenlos ergänzen →</span></button>';

    h += '<div class="modes">' + Object.keys(MODES).map(function (k) {
      var info = routeInfo && routeInfo.modus === k && routeInfo.dauer ? minuten(routeInfo.dauer) : MODES[k].name;
      if (k === 'bus' && bus && bus.verbindungen) info = minuten(bus.verbindungen[bus.wahl].duration);
      var an = k === 'bus' ? !!bus : (routeInfo && routeInfo.modus === k);
      return '<button class="mode" type="button" data-mode="' + k + '" aria-pressed="' + an + '"><span class="e">' + MODES[k].e + '</span><b>' + info + '</b></button>';
    }).join('') + '</div>';
    if (bus) h += busHtml();
    if (routeInfo && routeInfo.fehler) h += '<div class="route-info">' + esc(routeInfo.fehler) + '</div>';
    else if (routeInfo && routeInfo.laedt) h += '<div class="route-info">Weg wird berechnet …</div>';
    else if (routeInfo) h += '<div class="route-info"><span class="ri-ic">' + MODES[routeInfo.modus].e + '</span><span><b>Dein Weg zu ' + esc(f.name) + '</b><br>' + minuten(routeInfo.dauer) + ' · ' + meter(routeInfo.strecke) + ' ' + MODES[routeInfo.modus].wie + '</span></div>';

    var m = routeInfo ? routeInfo.modus : modus;
    var start = bus && bus.verbindungen ? '<button class="act main" type="button" data-reise>▶ Los geht’s – ich begleite dich</button>'
      : bus ? '' : '<button class="act main" type="button" data-go>▶ ' + MODES[m === 'bus' ? 'foot' : m].e + ' Los geht’s</button>';
    h += '<div class="acts">';
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
    h += '</div><div class="merken"><span>Speichern als</span>' + Object.keys(ORTE_NAME).map(function (k) {
      var an = orte[k] && Math.abs(orte[k].lat - f.lat) < 1e-5 && Math.abs(orte[k].lon - f.lon) < 1e-5;
      return '<button type="button" data-ort-setzen="' + k + '" aria-pressed="' + !!an + '">' + ORTE_NAME[k][0] + ' ' + ORTE_NAME[k][1] + '</button>';
    }).join('') + '</div><div class="info">';
    if (t.opening_hours) h += '<div>🕒 ' + esc(t.opening_hours) + '</div>';
    if (t.cuisine) h += '<div>🍴 ' + esc(t.cuisine.replace(/;/g, ', ').replace(/_/g, ' ')) + '</div>';
    h += '</div>';
    // Geschäfte in der Nähe des Ziels
    var umgebung = all.filter(function (x) { return x !== f && x.kat !== 'sonst'; })
      .map(function (x) { return { f: x, d: abstand(ll(f), ll(x)) }; })
      .sort(function (a, b) { return a.d - b.d; }).slice(0, 6);
    if (umgebung.length) h += '<h3 class="nah-titel">Geschäfte in der Nähe</h3>' + umgebung.map(function (u) { return zeile(u.f, u.d); }).join('');
    if (kannClaim && rolle !== 'chef') h += '<button class="claim" type="button" data-claim><span>🏪</span><span><b>Ist das deine Firma?</b><br>Profil kostenlos ergänzen →</span></button>';
    if (start) h += '<div class="start-leiste">' + start + '</div>';
    $('sheetBody').innerHTML = h + '</div>';
  }

  function routeWeg() {
    routeInfo = null; bus = null;
    var src = map && map.getSource('route');
    if (src) src.setData({ type: 'FeatureCollection', features: [] });
    if (src) map.getSource('schritte').setData({ type: 'FeatureCollection', features: [] });
  }
  function wegZeigen(r, k) {
    map.getSource('route').setData({ type: 'Feature', properties: { modus: k }, geometry: r.geometry });
    var st = r.legs[0].steps;
    // Nummern nur an echten Abbiegungen (nicht bei „geradeaus weiter“)
    var echte = st.slice(1, -1).filter(function (s) { return s.maneuver.modifier && s.maneuver.modifier !== 'straight' && s.maneuver.type !== 'new name'; });
    map.getSource('schritte').setData({ type: 'FeatureCollection', features: echte.map(function (s, i) {
      return { type: 'Feature', properties: { nr: String(i + 1) }, geometry: { type: 'Point', coordinates: s.maneuver.location } };
    }) });
  }

  // ---------- Bus & Bahn (Transitous) ----------
  var bus = null;
  // Verkehrsmittel: Symbol und Name je Art
  var ART_OEPNV = { BUS: ['🚌', 'Bus'], COACH: ['🚌', 'Fernbus'], TRAM: ['🚋', 'Tram'], SUBWAY: ['🚇', 'U-Bahn'], METRO: ['🚈', 'S-Bahn'],
    SUBURBAN: ['🚈', 'S-Bahn'], REGIONAL_RAIL: ['🚆', 'Zug'], REGIONAL_FAST_RAIL: ['🚆', 'Zug'], RAIL: ['🚆', 'Zug'],
    LONG_DISTANCE: ['🚄', 'Fernzug'], HIGHSPEED_RAIL: ['🚄', 'Fernzug'], NIGHT_RAIL: ['🚆', 'Nachtzug'], FERRY: ['⛴️', 'Fähre'] };
  function oepnv(l) { return ART_OEPNV[l.mode] || ['🚆', 'Bahn']; }
  function linienStil(l) {
    var bg = l.routeColor ? '#' + l.routeColor.replace('#', '') : '', fg = l.routeTextColor ? '#' + l.routeTextColor.replace('#', '') : '#fff';
    return bg && bg !== '#' ? ' style="background:' + esc(bg) + ';color:' + esc(fg) + '"' : '';
  }
  function meldungen(l) {
    return (l.alerts || []).map(function (a) {
      var t = a.headerText || a.descriptionText || '';
      return t ? '<small class="meldung">⚠️ ' + esc(t) + '</small>' : '';
    }).join('');
  }
  function uhr(iso) { return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  function verspaetung(ist, plan) { return Math.round((new Date(ist) - new Date(plan)) / 60000); }
  // Linienverlauf entpacken (Google-Polyline mit wählbarer Genauigkeit)
  function polyline(str, p) {
    var f = Math.pow(10, p), i = 0, lat = 0, lon = 0, out = [];
    while (i < str.length) {
      var b, sh = 0, v = 0;
      do { b = str.charCodeAt(i++) - 63; v |= (b & 31) << sh; sh += 5; } while (b >= 32);
      lat += (v & 1) ? ~(v >> 1) : (v >> 1);
      sh = 0; v = 0;
      do { b = str.charCodeAt(i++) - 63; v |= (b & 31) << sh; sh += 5; } while (b >= 32);
      lon += (v & 1) ? ~(v >> 1) : (v >> 1);
      out.push([lon / f, lat / f]);
    }
    return out;
  }
  function busSuchen() {
    var ziel = sel;
    modus = 'bus'; routeInfo = null;
    map.getSource('route').setData({ type: 'FeatureCollection', features: [] });
    var los = function () {
      bus = { laedt: true }; zeichneDetail();
      fetch(TRANSIT + '?fromPlace=' + me[1] + ',' + me[0] + '&toPlace=' + ziel.lat + ',' + ziel.lon + '&numItineraries=5')
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (sel !== ziel) return;
          var v = (j.itineraries || []).filter(function (it) { return it.legs.some(function (l) { return l.mode !== 'WALK'; }); }).slice(0, 4);
          if (!v.length) throw new Error('keine');
          bus = { verbindungen: v, wahl: 0 };
          zeichneDetail(); busZeigen(true);
        })
        .catch(function () {
          if (sel !== ziel) return;
          bus = { fehler: 'Gerade keine Verbindung mit Bus oder Bahn gefunden. Vielleicht ist es zu Fuß schneller.' };
          zeichneDetail();
        });
    };
    if (me) return los();
    bus = { laedt: true }; zeichneDetail();
    standort(function (ok) {
      if (ok) los(); else { bus = { fehler: 'Erlaube deinen Standort, damit wir Verbindungen suchen können.' }; zeichneDetail(); }
    });
  }
  function gleis(l) { return /BUS|COACH|TRAM/.test(l.mode) ? 'Steig' : 'Gleis'; }
  function abfahrt(l) {
    var d = verspaetung(l.startTime, l.scheduledStartTime);
    return l.cancelled ? '<s>' + uhr(l.scheduledStartTime) + '</s> <em class="aus">Fällt aus</em>'
      : uhr(l.scheduledStartTime) + (l.realTime ? (d > 0 ? ' <em class="spaet">+' + d + ' Min.</em>' : ' <em class="puenktlich">pünktlich</em>') : '');
  }
  function busHtml() {
    if (bus.laedt) return '<div class="route-info">Verbindungen mit Bus & Bahn werden gesucht …</div>';
    if (bus.fehler) return '<div class="route-info">' + esc(bus.fehler) + '</div>';
    var h = '<div class="bus-liste">' + bus.verbindungen.map(function (v, i) {
      var fahrt = v.legs.filter(function (l) { return l.mode !== 'WALK'; }), erste = fahrt[0];
      var aus = v.legs.some(function (l) { return l.cancelled; }), warn = v.legs.some(function (l) { return (l.alerts || []).length; });
      return '<button class="verb' + (i === bus.wahl ? ' aktiv' : '') + (aus ? ' faellt-aus' : '') + '" type="button" data-verb="' + i + '">' +
        '<span class="v-zeit"><b>' + uhr(v.startTime) + ' – ' + uhr(v.endTime) + '</b><span>' + minuten(v.duration) + '</span></span>' +
        '<span class="v-legs">' + v.legs.map(function (l) {
          return l.mode === 'WALK' ? '<span class="v-fuss">🚶 ' + Math.max(1, Math.round(l.duration / 60)) + '</span>'
            : '<span class="linie"' + linienStil(l) + '>' + oepnv(l)[0] + ' ' + esc(l.displayName || l.routeShortName || oepnv(l)[1]) + '</span>';
        }).join('<i>›</i>') + '</span>' +
        '<small>ab ' + esc(erste.from.name) + (erste.from.track ? ' · ' + gleis(erste) + ' ' + esc(erste.from.track) : '') + ' · ' + abfahrt(erste) + (warn ? ' · <em class="spaet">⚠️ Meldung</em>' : '') + '</small></button>';
    }).join('') + '</div>';
    // Ablauf der gewählten Verbindung
    var v = bus.verbindungen[bus.wahl];
    h += '<ol class="bus-schritte">' + v.legs.map(function (l, i) {
      if (l.mode === 'WALK') {
        var bis = i === v.legs.length - 1 ? 'zum Ziel' : 'bis ' + esc(l.to.name);
        return '<li><span class="sp">🚶</span><span>' + Math.max(1, Math.round(l.duration / 60)) + ' Min. zu Fuß ' + bis + '<small>' + meter(l.distance || 0) + '</small></span></li>';
      }
      var n = (l.intermediateStops || []).length + 1;
      return '<li><span class="sp linie-rund"' + linienStil(l) + '>' + oepnv(l)[0] + '</span><span><b>' + oepnv(l)[1] + ' ' + esc(l.displayName || l.routeShortName || '') + '</b> Richtung ' + esc(l.headsign || l.to.name) +
        '<small>ab ' + esc(l.from.name) + (l.from.track ? ' (' + gleis(l) + ' ' + esc(l.from.track) + ')' : '') + ' · ' + abfahrt(l) + '</small>' + meldungen(l) +
        '<small>' + n + (n === 1 ? ' Station' : ' Stationen') + ' bis ' + esc(l.to.name) + ' · an ' + uhr(l.endTime) + '</small></span></li>';
    }).join('') + '</ol><p class="quelle">Fahrplan & Echtzeit: <a href="https://transitous.org/sources/" target="_blank" rel="noopener">Transitous</a> · Angaben ohne Gewähr</p>';
    return h;
  }
  // Gewählte Verbindung auf die Karte: Fußwege gestrichelt, Bus & Bahn als farbiges Band
  function busZeigen(einpassen) {
    var v = bus.verbindungen[bus.wahl], b = new maplibregl.LngLatBounds(), stopps = [];
    var feats = v.legs.map(function (l) {
      var c = polyline(l.legGeometry.points, l.legGeometry.precision || 6);
      c.forEach(function (p) { b.extend(p); });
      if (l.mode !== 'WALK') stopps.push(l.from, l.to);
      var farbe = l.routeColor ? '#' + l.routeColor.replace('#', '') : null;
      return { type: 'Feature', properties: { modus: l.mode === 'WALK' ? 'foot' : 'bus', farbe: farbe && farbe.length === 7 ? farbe : null }, geometry: { type: 'LineString', coordinates: c } };
    });
    map.getSource('route').setData({ type: 'FeatureCollection', features: feats });
    map.getSource('schritte').setData({ type: 'FeatureCollection', features: stopps.map(function (st) {
      return { type: 'Feature', properties: { nr: '' }, geometry: { type: 'Point', coordinates: [st.lon, st.lat] } };
    }) });
    if (einpassen) {
      blatt('52vh');
      map.fitBounds(b, { padding: { top: 130, bottom: window.innerHeight * 0.55, left: 40, right: 70 }, maxZoom: 16.5, duration: 800 });
    }
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
    if (k === 'bus') return busSuchen();
    bus = null;
    modus = k;
    var ziel = sel;
    var los = function () {
      routeInfo = { modus: k, laedt: true }; zeichneDetail();
      routeHolen(me, ziel, k)
        .then(function (r) {
          if (sel !== ziel) return;
          routeInfo = { modus: k, dauer: r.duration, strecke: r.distance, route: r };
          wegZeigen(r, k);
          zeichneDetail();
          if (danach) return danach();
          var b = new maplibregl.LngLatBounds();
          r.geometry.coordinates.forEach(function (p) { b.extend(p); });
          blatt('40vh');
          map.fitBounds(b, { padding: { top: 130, bottom: window.innerHeight * 0.42, left: 40, right: 70 }, maxZoom: 17, duration: 800 });
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
  // Ansagen über die Sprachausgabe des Geräts; Stimme und Tempo wählt man im Menü
  var stimmeName = '', tempo = 1;
  try { stimmeName = localStorage.getItem('scmap-stimme') || ''; tempo = +localStorage.getItem('scmap-tempo') || 1; } catch (e) {}
  function deutscheStimmen() {
    return window.speechSynthesis ? speechSynthesis.getVoices().filter(function (v) { return /^de/i.test(v.lang); }) : [];
  }
  function sprechen(text, immer) {
    if ((!ton && !immer) || !window.speechSynthesis) return;
    var u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = tempo;
    var v = deutscheStimmen().filter(function (x) { return x.name === stimmeName; })[0];
    if (v) u.voice = v;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  function stimmenListe() {
    var liste = deutscheStimmen(), sel = $('stimme');
    sel.innerHTML = '<option value="">Standard des Geräts</option>' + liste.map(function (v) {
      var name = v.name.replace(/\s*\(.*\)\s*/, ' ').replace(/Microsoft |Google /, '').replace(/\s*-\s*(German|Deutsch).*$/i, '').trim();
      return '<option value="' + esc(v.name) + '"' + (v.name === stimmeName ? ' selected' : '') + '>' + esc(name) + (/premium|enhanced|natural|neural/i.test(v.name + v.voiceURI) ? ' ✨' : '') + '</option>';
    }).join('');
    $('stimmeHinweis').textContent = liste.length ? liste.length + ' deutsche Stimmen auf diesem Gerät. Mehr und schönere Stimmen (✨) kannst du in den Einstellungen deines Handys unter Bedienungshilfen → Gesprochene Inhalte → Stimmen laden.'
      : 'Auf diesem Gerät wurde keine deutsche Stimme gefunden. In den Handy-Einstellungen unter Bedienungshilfen kannst du welche laden.';
    document.querySelectorAll('[data-tempo]').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.tempo === tempo); });
  }
  if (window.speechSynthesis) speechSynthesis.addEventListener('voiceschanged', stimmenListe);
  $('stimme').addEventListener('change', function () {
    stimmeName = this.value;
    try { localStorage.setItem('scmap-stimme', stimmeName); } catch (e) {}
    sprechen('Hallo, so klinge ich bei deinen Ansagen.', true);
  });
  document.querySelector('.tempo').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tempo]'); if (!b) return;
    tempo = +b.dataset.tempo;
    try { localStorage.setItem('scmap-tempo', tempo); } catch (x) {}
    stimmenListe(); sprechen('In 50 Metern rechts abbiegen.', true);
  });
  $('stimmeTest').addEventListener('click', function () { sprechen('In 50 Metern rechts abbiegen. Danach kommt dein Bus in 3 Minuten.', true); });
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
    if (modus === 'bus') modus = 'foot';
    if (!sel || !routeInfo || !routeInfo.route) return weg(modus, navStart);
    zaehle('map_navigation');
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
    if (nav.reise && nav.reise.phase !== 'gehen') return reisePos(p);
    if (!nav.route) return;
    var r = nav.route, steps = r.legs[0].steps, pos = aufStrecke(p, r), rest = Math.max(0, r.distance - pos.km);
    var auto = nav.modus === 'car';

    // Vom Weg abgekommen: neu berechnen (höchstens alle 12 Sekunden)
    if (pos.weg > (auto ? 60 : 35) && !nav.neu) {
      nav.neu = true;
      routeHolen(p, nav.ziel, nav.modus).then(function (neu) {
        if (!nav) return;
        nav.route = neu; nav.schritt = -1;
        wegZeigen(neu, nav.modus);
        sprechen('Neue Route');
        navPos(me);
      }).catch(function () {}).then(function () { setTimeout(function () { if (nav) nav.neu = false; }, 12000); });
    }

    if (rest < 20 && nav.reise && nav.reise.i < nav.reise.v.legs.length - 1) return reiseWeiter();
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
    if (nav.reise) reiseUnterwegs(rest);
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

  // ---------- Reisebegleitung mit Bus & Bahn ----------
  // Phasen je Abschnitt: „gehen“ (Fußweg mit Pfeilen), „warten“ (an der Haltestelle), „fahren“ (im Bus/Zug)
  function minBis(iso) { return Math.round((new Date(iso) - Date.now()) / 60000); }
  function linienName(l) { return oepnv(l)[1] + ' ' + (l.displayName || l.routeShortName || ''); }
  function naechsteFahrt(ab) { var L = nav.reise.v.legs; for (var j = ab; j < L.length; j++) if (L[j].mode !== 'WALK') return L[j]; return null; }

  function reiseStart() {
    zaehle('map_bus_bahn');
    var v = bus.verbindungen[bus.wahl];
    nav = { ziel: sel, zielEcht: sel, modus: 'foot', route: null, schritt: -1, jetzt: false, folgen: true,
      reise: { v: v, i: 0, gefragt: {}, phase: '' } };
    document.body.classList.add('navigating');
    $('nav').hidden = false; $('navMitte').hidden = true;
    $('navTon').textContent = ton ? '🔊' : '🔇';
    try { navigator.wakeLock.request('screen').then(function (l) { if (nav) nav.lock = l; else l.release(); }).catch(function () {}); } catch (e) {}
    nav.watch = navigator.geolocation.watchPosition(function (pos) { navPos([pos.coords.longitude, pos.coords.latitude]); },
      function () {}, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
    nav.reise.takt = setInterval(reiseTakt, 10000);
    nav.reise.live = setInterval(reiseLive, 60000);
    merken();
    reiseAbschnitt();
  }

  // Einen Abschnitt beginnen
  function reiseAbschnitt() {
    var R = nav.reise, l = R.v.legs[R.i], letzter = R.i === R.v.legs.length - 1;
    $('navFrage').hidden = true;
    if (l.mode === 'WALK') {
      if (!letzter && (l.distance || 0) < 30) return reiseWeiter();      // Haltestelle direkt nebenan
      R.phase = 'gehen'; R.gehStart = Date.now();
      var zielPunkt = letzter ? nav.zielEcht : { lat: l.to.lat, lon: l.to.lon, name: l.to.name };
      sprechen(letzter ? 'Jetzt zu Fuß zum Ziel' : 'Geh zur Haltestelle ' + l.to.name);
      routeHolen(me, zielPunkt, 'foot').then(function (rt) {
        if (!nav || nav.reise !== R || R.v.legs[R.i] !== l) return;
        nav.route = rt; nav.ziel = zielPunkt; nav.schritt = -1;
        wegZeigen(rt, 'foot'); navPos(me);
      }).catch(function () {});
      return;
    }
    R.phase = 'warten'; nav.route = null;
    // Strecke dieser Fahrt auf der Karte
    var c = polyline(l.legGeometry.points, l.legGeometry.precision || 6);
    map.getSource('route').setData({ type: 'Feature', properties: { modus: 'bus', farbe: l.routeColor ? '#' + l.routeColor : null }, geometry: { type: 'LineString', coordinates: c } });
    map.getSource('schritte').setData({ type: 'FeatureCollection', features: [] });
    sprechen('Warte auf ' + linienName(l) + ' Richtung ' + (l.headsign || l.to.name));
    reiseAnzeige();
  }
  function reiseWeiter() {
    var R = nav.reise;
    if (R.phase === 'warten') { R.phase = 'fahren'; R.gefragt = {}; sprechen('Gute Fahrt'); return reiseAnzeige(); }
    R.i++; R.gefragt = {};
    if (R.i >= R.v.legs.length) return navEnde();
    reiseAbschnitt();
  }

  // Unten während des Fußwegs: wann der nächste Bus fährt, Warnung wenn es knapp wird
  function reiseUnterwegs(rest) {
    var R = nav.reise, f = naechsteFahrt(R.i);
    if (!f) return;
    var bis = minBis(f.startTime), gehen = Math.ceil(rest / 75);
    var t = oepnv(f)[0] + ' ' + (f.displayName || f.routeShortName) + ' fährt ' + uhr(f.startTime) + (bis >= 0 ? ' (in ' + bis + ' Min.)' : '');
    if (f.cancelled) t = '⚠️ ' + linienName(f) + ' fällt aus';
    else if (bis >= 0 && gehen > bis) t += ' · ⚠️ knapp, beeil dich!';
    $('navRest').innerHTML = esc(t).replace('⚠️ knapp, beeil dich!', '<em class="spaet">⚠️ knapp, beeil dich!</em>');
  }

  // Anzeige oben/unten beim Warten und Fahren
  function reiseAnzeige() {
    var R = nav.reise, l = R.v.legs[R.i];
    $('navPfeil').innerHTML = oepnv(l)[0];
    $('navEnde').textContent = 'Beenden';
    if (R.phase === 'warten') {
      var bis = minBis(l.startTime);
      $('navDist').textContent = l.cancelled ? 'Fällt aus!' : bis > 0 ? 'in ' + bis + ' Min.' : bis === 0 ? 'kommt jetzt' : 'sollte da sein';
      $('navText').textContent = linienName(l) + ' → ' + (l.headsign || l.to.name);
      $('navStr').textContent = l.from.name + (l.from.track ? ' · ' + gleis(l) + ' ' + l.from.track : '');
      $('navZeit').textContent = 'Abfahrt ' + uhr(l.startTime);
      var d = verspaetung(l.startTime, l.scheduledStartTime);
      $('navRest').innerHTML = l.realTime ? (d > 0 ? '<em class="spaet">+' + d + ' Min. Verspätung</em>' : '<em class="puenktlich">pünktlich (live)</em>') : 'laut Fahrplan';
      if (bis <= 0 && !R.gefragt.ein) frage('ein', 'Bist du in ' + linienName(l) + ' eingestiegen?', 'Ja, bin drin', 'Noch nicht');
    } else {
      var halte = (l.intermediateStops || []).concat([l.to]), i = naechsterHalt(halte), noch = halte.length - i;
      $('navDist').textContent = noch <= 1 ? 'Nächste aussteigen!' : 'Noch ' + noch + ' Stationen';
      $('navText').textContent = 'Aussteigen: ' + l.to.name;
      $('navStr').textContent = noch > 1 ? 'Nächster Halt: ' + halte[i].name : linienName(l);
      $('navZeit').textContent = 'an ' + uhr(l.endTime);
      $('navRest').textContent = linienName(l) + ' → ' + (l.headsign || l.to.name);
      if (noch <= 1 && !R.gefragt.ansage) { R.gefragt.ansage = true; sprechen('Nächste Haltestelle aussteigen: ' + l.to.name); }
      if ((noch <= 1 && minBis(l.endTime) <= 0 || abstand(me, [l.to.lon, l.to.lat]) < 80) && !R.gefragt.aus)
        frage('aus', 'Bist du in ' + l.to.name + ' ausgestiegen?', 'Ja, ausgestiegen', 'Noch nicht');
    }
  }
  // Welche Haltestelle kommt als Nächstes? (die nächstgelegene, die wir noch nicht passiert haben)
  function naechsterHalt(halte) {
    var R = nav.reise, best = 0, d = Infinity;
    halte.forEach(function (h, i) { var x = abstand(me, [h.lon, h.lat]); if (x < d) { d = x; best = i; } });
    // ohne GPS-Bewegung nach Fahrplan schätzen
    if (!R.gps) halte.forEach(function (h, i) { if (h.arrival && new Date(h.arrival) < Date.now()) best = Math.max(best, i + 1); });
    else if (d < 60) best++;                                   // gerade an einer Haltestelle → die nächste
    R.halt = Math.max(R.halt || 0, Math.min(best, halte.length - 1));
    return R.halt;
  }
  function reisePos(p) {
    var R = nav.reise, l = R.v.legs[R.i];
    R.gps = true;
    if (nav.folgen) map.easeTo({ center: p, zoom: 15.5, pitch: 45, duration: 900 });
    // Losgefahren? (mehr als 200 m von der Haltestelle weg)
    if (R.phase === 'warten' && abstand(p, [l.from.lon, l.from.lat]) > 200 && minBis(l.startTime) <= 1) return reiseWeiter();
    reiseAnzeige();
  }
  // Alle 10 Sekunden: Countdown erneuern und nachfragen, wenn es Zeit ist
  function reiseTakt() {
    if (!nav || !nav.reise) return;
    var R = nav.reise, l = R.v.legs[R.i];
    if (R.phase === 'gehen') {
      var f = naechsteFahrt(R.i);
      if (f && minBis(f.startTime) < -1 && !R.gefragt.weg)
        return frage('weg', 'Hast du ' + linienName(f) + ' verpasst?', 'Ja, neue Verbindung', 'Nein, alles gut');
      if (R.i < R.v.legs.length - 1 && Date.now() - R.gehStart > (l.duration + 90) * 1000 && !R.gefragt.da)
        frage('da', 'Bist du an der Haltestelle ' + l.to.name + '?', 'Ja, bin da', 'Noch nicht');
      if (nav.route) navPos(me);
    } else reiseAnzeige();
  }
  // Jede Minute: Echtzeit der nächsten Fahrt neu holen (Verspätung, Ausfall, Meldungen)
  function reiseLive() {
    if (!nav || !nav.reise || nav.reise.phase === 'fahren') return;
    var R = nav.reise, f = naechsteFahrt(R.i), ziel = nav.zielEcht || nav.ziel;
    if (!f) return;
    fetch(TRANSIT + '?fromPlace=' + me[1] + ',' + me[0] + '&toPlace=' + ziel.lat + ',' + ziel.lon + '&numItineraries=6')
      .then(function (x) { return x.json(); })
      .then(function (j) {
        if (!nav || nav.reise !== R) return;
        (j.itineraries || []).forEach(function (it) {
          it.legs.forEach(function (n) {
            if (n.tripId !== f.tripId) return;
            ['startTime', 'endTime', 'cancelled', 'realTime', 'alerts', 'intermediateStops'].forEach(function (k) { if (n[k] !== undefined) f[k] = n[k]; });
            f.from.track = n.from.track || f.from.track;
          });
        });
        if (f.cancelled && !R.gefragt.ausfall) frage('ausfall', '⚠️ ' + linienName(f) + ' fällt aus. Neue Verbindung suchen?', 'Ja, neu suchen', 'Weiter so');
        if (R.phase === 'warten') reiseAnzeige();
      }).catch(function () {});
  }
  // Frage-Kasten in der Navigation
  function frage(key, text, ja, nein) {
    var R = nav.reise;
    R.gefragt[key] = true;
    $('navFrageText').textContent = text; $('navJa').textContent = ja; $('navNein').textContent = nein;
    $('navFrage').dataset.key = key; $('navFrage').hidden = false;
    sprechen(text);
  }
  $('navFrage').addEventListener('click', function (e) {
    var ja = e.target.closest('#navJa'), nein = e.target.closest('#navNein');
    if (!ja && !nein || !nav || !nav.reise) return;
    var key = this.dataset.key, R = nav.reise;
    this.hidden = true;
    if (ja) {
      if (key === 'weg' || key === 'ausfall') { var z = nav.zielEcht || nav.ziel; zurueck(); if (sel === z) busSuchen(); return; }
      return reiseWeiter();
    }
    // „Noch nicht“: später noch einmal fragen
    if (key !== 'weg' && key !== 'ausfall') setTimeout(function () { if (nav && nav.reise === R) R.gefragt[key] = false; }, 90000);
  });

  function navEnde() {
    if (!nav) return;
    if (nav.reise) { clearInterval(nav.reise.takt); clearInterval(nav.reise.live); $('navFrage').hidden = true; }
    navigator.geolocation.clearWatch(nav.watch);
    if (nav.lock) nav.lock.release().catch(function () {});
    if (window.speechSynthesis) speechSynthesis.cancel();
    nav = null;
    document.body.classList.remove('navigating');
    $('nav').hidden = true;
    if (selMarker) selMarker.getElement().classList.remove('ziel');
    map.easeTo({ pitch: dreiD ? 55 : 0, bearing: dreiD ? -20 : 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
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
      // Nur in der Region (bis 12 km von einer Stadtmitte) als Mittelpunkt nutzen
      var naechste = Object.keys(STAEDTE).sort(function (a, b) { return abstand(me, STAEDTE[a].mitte) - abstand(me, STAEDTE[b].mitte); })[0];
      if (abstand(me, STAEDTE[naechste].mitte) < 12000) { center = me; stadt = naechste; } else { me = null; center = START; }
      if (!me) { meMarker.remove(); meMarker = null; return fertig && fertig(false); }
      all.forEach(function (f) { f.dist = abstand(center, ll(f)); });
      fertig && fertig(true);
    }, function () { fertig && fertig(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  }

  // ---------- Karte ----------
  function gestalten() {
    var vor = map.getStyle().layers.filter(function (l) { return l.type === 'symbol'; })[0].id;
    // Straßennamen in gesperrten Großbuchstaben entlang der Straße
    ['highway-name-minor', 'highway-name-major'].forEach(function (id) {
      if (!map.getLayer(id)) return;
      map.setLayoutProperty(id, 'text-transform', 'uppercase');
      map.setLayoutProperty(id, 'text-letter-spacing', 0.28);
      map.setLayoutProperty(id, 'text-size', ['interpolate', ['linear'], ['zoom'], 14, 9, 18, 12]);
    });
    map.addLayer({ id: 'neon-glow', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', filter: GROSS,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#ff4f8b', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 6, 17, 34],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 12, 4, 17, 22], 'line-opacity': 0.45 } }, 'highway_major_casing');
    // Durchgehende leuchtende Straßen im City Mode; klassisches Rendering bleibt unverändert.
    var CITY_ROADS = ['in', ['get', 'class'], ['literal', ['minor', 'residential', 'service', 'street', 'tertiary', 'secondary', 'primary']]];
    map.addLayer({ id: 'city-strassen-licht', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: CITY_ROADS, minzoom: 12, layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
      paint: { 'line-color': '#ff7935', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 2.5, 15, 10, 18, 25],
        'line-blur': ['interpolate', ['linear'], ['zoom'], 12, 2, 15, 7, 18, 16], 'line-opacity': 0.64 } }, 'highway_major_casing');
    map.addLayer({ id: 'city-strassen-kern', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: CITY_ROADS, minzoom: 12, layout: { 'line-cap': 'round', 'line-join': 'round', visibility: 'none' },
      paint: { 'line-color': '#ff9e52', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.9, 15, 2.3, 18, 5.5],
        'line-opacity': 0.77 } }, 'highway_major_casing');
    // Häuser als weiche 3D-Klötze (mindestens 6 m, damit alles plastisch wirkt)
    fensterBilder();
    var HOEHE = ['max', 6, ['coalesce', ['get', 'render_height'], 8]], BASIS = ['coalesce', ['get', 'render_min_height'], 0];
    map.addLayer({ id: 'gebaeude-3d', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14.5, maxzoom: 16, paint: {
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, ['max', 6, ['coalesce', ['get', 'render_height'], 8]]],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-vertical-gradient': true
    } }, vor);
    // Häuser, in denen ein Geschäft ist, in der Farbe der Kategorie (füllt laedenFaerben())
    map.addLayer({ id: 'gebaeude-wand', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 16, paint: {
      'fill-extrusion-height': HOEHE, 'fill-extrusion-base': BASIS, 'fill-extrusion-vertical-gradient': true
    } }, vor);
    map.addLayer({ id: 'gebaeude-dach', type: 'fill-extrusion', source: 'openmaptiles', 'source-layer': 'building', minzoom: 16, paint: {
      'fill-extrusion-height': ['+', HOEHE, 0.4], 'fill-extrusion-base': HOEHE, 'fill-extrusion-vertical-gradient': false
    } }, vor);
    map.addSource('laeden', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({ id: 'laeden-wand', type: 'fill-extrusion', source: 'laeden', minzoom: 16, paint: {
      'fill-extrusion-height': ['+', 0.6, ['get', 'h']], 'fill-extrusion-base': ['get', 'b'], 'fill-extrusion-vertical-gradient': true
    } }, vor);
    map.addLayer({ id: 'laeden-dach', type: 'fill-extrusion', source: 'laeden', minzoom: 16, paint: {
      'fill-extrusion-height': ['+', 1, ['get', 'h']], 'fill-extrusion-base': ['+', 0.6, ['get', 'h']]
    } }, vor);
    map.addLayer({ id: 'laeden-3d', type: 'fill-extrusion', source: 'laeden', minzoom: 14.5, maxzoom: 16, paint: {
      'fill-extrusion-color': ['get', 'farbe'],
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14.5, 0, 15.5, ['+', 0.6, ['get', 'h']]],
      'fill-extrusion-base': ['get', 'b'], 'fill-extrusion-opacity': 1
    } }, vor);
    // Bäume als kleine runde Kronen
    map.addSource('baeume', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    // Bäume als aufrechte kleine Bäume mit Stamm und runder Krone
    map.addImage('baum-tag', baumBild('#9cc47a', '#7ea862', '#c4e0a4', '#8a6a4a'), { pixelRatio: 2 });
    map.addImage('baum-nacht', baumBild('#1f6b52', '#164e3c', '#35a37c', '#3b2f5c'), { pixelRatio: 2 });
    ['tag', 'nacht'].forEach(function (n) {
      map.addLayer({ id: 'baeume-' + n, type: 'symbol', source: 'baeume', minzoom: 14.5, layout: {
        'icon-image': 'baum-' + n, 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-ignore-placement': true,
        'icon-pitch-alignment': 'viewport', 'icon-rotation-alignment': 'viewport', visibility: 'none',
        'icon-size': ['interpolate', ['exponential', 2], ['zoom'], 14.5, 0.25, 16, 0.5, 18, 1.4]
      } });
    });
    fetch('/map/baeume.json').then(function (r) { return r.json(); }).then(function (b) {
      map.getSource('baeume').setData({ type: 'FeatureCollection', features: b.map(function (p) { return { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: p } }; }) });
    }).catch(function () {});
  }

  // Häuser mit Geschäft einfärben (das Haus unter dem Punkt suchen) – läuft, wenn die Karte ruht
  var hausCache = {}, schilder = [], dreiD = EIN.dreiD;
  function hell(hex, t) {
    var n = parseInt(hex.slice(1), 16), m = function (c) { return Math.round(c + (255 - c) * t); };
    return 'rgb(' + m(n >> 16) + ',' + m((n >> 8) & 255) + ',' + m(n & 255) + ')';
  }
  function pastell(hex) {
    var n = parseInt(hex.slice(1), 16), m = function (c) { return Math.round(c + (255 - c) * 0.3); };
    return 'rgb(' + m(n >> 16) + ',' + m((n >> 8) & 255) + ',' + m(n & 255) + ')';
  }
  // Umriss um etwa m Meter nach außen schieben (vom Mittelpunkt weg)
  function aufblasen(geo, m) {
    var polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
    var neu = polys.map(function (poly) {
      var ring = poly[0], cx = 0, cy = 0;
      ring.forEach(function (p) { cx += p[0]; cy += p[1]; });
      cx /= ring.length; cy /= ring.length;
      var kx = Math.cos(cy * Math.PI / 180) * 111320, ky = 110540;
      return poly.map(function (r) {
        return r.map(function (p) {
          var dx = (p[0] - cx) * kx, dy = (p[1] - cy) * ky, l = Math.sqrt(dx * dx + dy * dy) || 1;
          return [p[0] + dx / l * m / kx, p[1] + dy / l * m / ky];
        });
      });
    });
    return geo.type === 'Polygon' ? { type: 'Polygon', coordinates: neu[0] } : { type: 'MultiPolygon', coordinates: neu };
  }

  function haeuserFaerben() {
    if (!all.length || map.getZoom() < 15) return;
    var b = map.getBounds(), neu = false;
    all.forEach(function (f) {
      if (f.kat === 'sonst' || f.adresse || hausCache[f.id] || !b.contains(ll(f))) return;
      var h = map.queryRenderedFeatures(map.project(ll(f)), { layers: ['building'] })[0];
      if (!h) return;
      var g = h.geometry.coordinates, schluessel = JSON.stringify(g[0] && g[0][0] && g[0][0][0] !== undefined && g[0][0].length ? g[0][0] : g[0]);
      if (hausCache[schluessel]) { hausCache[f.id] = true; return; }
      hausCache[f.id] = true;
      hausCache[schluessel] = { type: 'Feature', geometry: aufblasen(h.geometry, 0.6), properties: { farbe: pastell(CATS[f.kat].farbe), neon: CATS[f.kat].farbe, kat: f.kat, dach: hell(CATS[f.kat].farbe, 0.6),
        h: Math.max(6, h.properties.render_height || 8), b: h.properties.render_min_height || 0 } };
      neu = true;
    });
    if (neu) map.getSource('laeden').setData({ type: 'FeatureCollection', features: Object.keys(hausCache).map(function (k) { return hausCache[k]; }).filter(function (x) { return x !== true; }) });
  }

  // Schwebende Schilder mit Gehzeit für die nächsten Geschäfte in der Bildmitte
  function gehzeit(f) { return Math.max(1, Math.round(f.dist / 80)) + ' Min. zu Fuß'; }
  function schilderZeichnen() {
    schilder.forEach(function (m) { m.remove(); }); schilder = [];
    if (!all.length || nav || !EIN.schilder || map.getZoom() < 16) return;
    var b = map.getBounds(), mitte = map.getCenter().toArray();
    var auswahl = treffer().filter(function (f) { return f.kat !== 'sonst' && f !== sel && b.contains(ll(f)); })
      .sort(function (x, y) { return (y.star - x.star) || (abstand(mitte, ll(x)) - abstand(mitte, ll(y))); }).slice(0, 30);
    if (sel && b.contains(ll(sel))) auswahl.unshift(sel);
    // Höchstens 5 Schilder, die sich auf dem Bildschirm nicht überdecken
    var plaetze = [], liste = $('sheet').getBoundingClientRect(), oben = $('cats').getBoundingClientRect().bottom + 60;
    auswahl = auswahl.filter(function (f) {
      if (plaetze.length >= 12) return false;
      var p = map.project(ll(f));
      // nicht unter der Liste oder unter Suche/Kategorien verstecken
      if (p.y < oben || p.x < 95 || p.x > innerWidth - 95 || (p.x > liste.left - 100 && p.x < liste.right + 100 && p.y > liste.top - 60)) return false;
      if (plaetze.some(function (q) { return Math.abs(q.x - p.x) < 60 && Math.abs(q.y - p.y) < 30; })) return false;
      plaetze.push(p); return true;
    });
    auswahl.forEach(function (f) {
      var el = document.createElement('button');
      el.type = 'button'; el.className = 'schild' + (f === sel ? ' aktiv' : '');
      el.innerHTML = '<span class="s-ic">' + (f.star ? '⭐' : f.adresse ? '📍' : CATS[f.kat].ico) + '</span><span class="s-tx"><b>' + esc(f.name) + '</b><small>' + gehzeit(f) + '</small></span>';
      el.addEventListener('click', function (e) { e.stopPropagation(); detail(f.id); });
      var m = new maplibregl.Marker({ element: el, anchor: 'bottom', offset: [0, -10] }).setLngLat(ll(f)).addTo(map);
      // Überdeckt es ein schon gesetztes Schild? Dann weglassen (höchstens 5)
      var a = el.getBoundingClientRect();
      var frei = schilder.length < 5 && schilder.every(function (o) {
        var c = o.getElement().getBoundingClientRect();
        return a.right + 6 < c.left || c.right + 6 < a.left || a.bottom + 6 < c.top || c.bottom + 6 < a.top;
      });
      if (frei || f === sel) schilder.push(m); else m.remove();
    });
  }

  // Wandmuster mit Fenstern (64×64 Pixel, wird auf die Hauswände gekachelt)
  function fensterMuster(wand, fenster, rahmen, leuchten) {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = wand; g.fillRect(0, 0, 64, 64);
    g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, 60, 64, 4);           // Fuge zwischen Stockwerken
    [[10, 16], [38, 16]].forEach(function (p, i) {
      g.fillStyle = rahmen; g.fillRect(p[0] - 2, p[1] - 2, 20, 28);
      g.fillStyle = leuchten && (i === 0) ? leuchten : fenster; g.fillRect(p[0], p[1], 16, 24);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(p[0], p[1], 16, 3); // Lichtkante
    });
    return g.getImageData(0, 0, 64, 64);
  }
  function baumBild(krone, schatten, licht, stamm) {
    var c = document.createElement('canvas'); c.width = 48; c.height = 64;
    var g = c.getContext('2d');
    g.fillStyle = 'rgba(32,60,50,.18)'; g.beginPath(); g.ellipse(24, 60, 13, 4, 0, 0, 7); g.fill();   // Schatten am Boden
    g.fillStyle = stamm; g.fillRect(21, 34, 6, 26);                                                   // Stamm
    g.fillStyle = schatten; g.beginPath(); g.arc(24, 24, 20, 0, 7); g.fill();                          // Krone (Schattenseite)
    g.fillStyle = krone; g.beginPath(); g.arc(22, 22, 18, 0, 7); g.fill();                             // Krone
    g.fillStyle = licht; g.beginPath(); g.arc(17, 16, 7, 0, 7); g.fill();                              // Lichtfleck
    return g.getImageData(0, 0, 48, 64);
  }
  function fensterBilder() {
    var opt = { pixelRatio: 2 };
    map.addImage('haus-tag', fensterMuster('#eef2e4', '#bccbb2', '#f8faf2'), opt);
    map.addImage('haus-nacht', fensterMuster('#241f4a', '#16123a', '#2e2860', '#ffd36b'), opt);
    // Ruhige navyfarbene Fassaden, warme Fenster statt knalliger pinker Dächer.
    map.addImage('haus-city', fensterMuster('#12283c', '#30647e', '#091929', '#ffc77f'), opt);
    var cityWands = ['#12344b', '#202d52', '#173e49', '#253554'];
    ORDER.forEach(function (k) {
      map.addImage('w-' + k + '-tag', fensterMuster(pastell(CATS[k].farbe), '#5b6b62', '#fffef8'), opt);
      map.addImage('w-' + k + '-nacht', fensterMuster(CATS[k].farbe, '#1a1640', '#fff', '#fff3b0'), opt);
      map.addImage('w-' + k + '-city', fensterMuster(cityWands[ORDER.indexOf(k) % cityWands.length], '#39738f', '#142334', '#ffbe72'), opt);
    });
  }

  // Tag/Nacht umschalten, ohne die Karte neu zu laden
  function setzeStil(name) {
    stilName = name; STIL = STILE[name];
    var dunkel = name !== 'tag', muster = name === 'city' ? 'city' : dunkel ? 'nacht' : 'tag';
    // Bei Geschäftshäusern keine grellen Neon-/Pinkdächer: ein stimmiges Miniaturstadt-Farbsystem.
    var cityRoof = ['match', ['get', 'kat'],
      'essen', '#23546a', 'lebensm', '#344d70', 'schoen', '#36466d', 'gesund', '#1b5b66',
      'handwerk', '#3b4a6d', 'auto', '#1f536a', 'mode', '#3e426f', 'wohnen', '#2b4b68',
      'technik', '#164d65', 'web', '#3a486d', 'dienst', '#2b4661', 'freizeit', '#245966', '#293f5b'];
    var cityWall = ['match', ['get', 'kat'],
      'essen', '#244e60', 'lebensm', '#294361', 'gesund', '#1b515b', 'auto', '#1b475b', '#253c56'];

    var f = STIL.farben;
    Object.keys(f).forEach(function (id) {
      if (!map.getLayer(id)) return;
      for (var k in f[id]) map.setPaintProperty(id, k, f[id][k]);
    });
    map.setLayoutProperty('neon-glow', 'visibility', STIL.glow && EIN.neon ? 'visible' : 'none');
    map.setLayoutProperty('firmen-glow', 'visibility', STIL.glow && EIN.neon ? 'visible' : 'none');
    map.setPaintProperty('gebaeude-3d', 'fill-extrusion-color', STIL.haus);
    map.setPaintProperty('gebaeude-wand', 'fill-extrusion-pattern', 'haus-' + muster);
    map.setPaintProperty('gebaeude-dach', 'fill-extrusion-color', name === 'city'
      ? ['interpolate', ['linear'], ['coalesce', ['get', 'render_height'], 8], 0, '#263d56', 18, '#2e4b65', 40, '#415171']
      : STIL.dach);
    map.setPaintProperty('laeden-wand', 'fill-extrusion-pattern', ['concat', 'w-', ['get', 'kat'], '-', muster]);
    map.setPaintProperty('laeden-dach', 'fill-extrusion-color', name === 'city' ? cityRoof : ['get', dunkel ? 'neon' : 'dach']);
    map.setPaintProperty('laeden-3d', 'fill-extrusion-color', name === 'city' ? cityWall : ['get', dunkel ? 'neon' : 'farbe']);
    map.setPaintProperty('laeden-3d', 'fill-extrusion-opacity', dunkel ? 0.86 : 1);
    map.setPaintProperty('gebaeude-3d', 'fill-extrusion-opacity', STIL.hausDeckkraft);
    map.setLayoutProperty('baeume-tag', 'visibility', name === 'tag' && EIN.baeume ? 'visible' : 'none');
    map.setLayoutProperty('baeume-nacht', 'visibility', dunkel && EIN.baeume ? 'visible' : 'none');
    ['laeden-3d', 'laeden-wand', 'laeden-dach'].forEach(function (id) { map.setLayoutProperty(id, 'visibility', EIN.farben ? 'visible' : 'none'); });
    map.setLight(STIL.licht);
    map.setLayoutProperty('city-strassen-licht', 'visibility', name === 'city' ? 'visible' : 'none');
    map.setLayoutProperty('city-strassen-kern', 'visibility', name === 'city' ? 'visible' : 'none');
    map.setPaintProperty('neon-glow', 'line-color', name === 'city' ? '#ff752e' : '#ff4f8b');
    map.setPaintProperty('neon-glow', 'line-opacity', name === 'city' ? 0.65 : 0.45);
    map.setPaintProperty('neon-glow', 'line-width', name === 'city'
      ? ['interpolate',['linear'],['zoom'],12,9,17,42]
      : ['interpolate',['linear'],['zoom'],12,6,17,34]);
    map.setPaintProperty('firmen-glow', 'circle-opacity', name === 'city' ? 0.69 : 0.7);
    map.setPaintProperty('firmen', 'circle-radius', name === 'city'
      ? ['interpolate',['linear'],['zoom'],11,3,14,5.8,16,7.2,18,8]
      : ['interpolate',['linear'],['zoom'],11,2.5,14,4.5,16,5,18,6]);
    map.setPaintProperty('route-rand', 'line-color', STIL.wegRand);
    map.setPaintProperty('route', 'line-color', ['case', ['==', ['get', 'modus'], 'bus'], ['coalesce', ['get', 'farbe'], STIL.bus], STIL.weg]);
    map.setPaintProperty('route-strich', 'line-color', STIL.wegStrich);
    map.setPaintProperty('firmen', 'circle-stroke-color', STIL.rand);
    map.setPaintProperty('firmen-name', 'text-color', STIL.text);
    map.setPaintProperty('firmen-name', 'text-halo-color', STIL.halo);
    document.body.classList.toggle('nacht', dunkel);
    document.querySelector('meta[name=theme-color]').setAttribute('content', STIL.theme);
    $('stilKnopf').textContent = dunkel ? '☀️' : '🌙';
    $('stilKnopf').setAttribute('aria-label', dunkel ? 'Helle Karte' : 'Nachtkarte');
  }

  function start() {
    if (map) return;
    blatt(EIN.cityMode && innerWidth < 900 ? '23vh' : '34vh');
    $('sheetBody').innerHTML = '<p class="muted">Lade Geschäfte aus Nürnberg, Fürth und Erlangen …</p>';
    map = new maplibregl.Map({ container: 'map', style: STYLE, center: START, zoom: EIN.cityMode ? 15.3 : 16, pitch: EIN.cityMode ? 56 : dreiD ? 55 : 0, bearing: EIN.cityMode ? -34 : dreiD ? -20 : 0, maxPitch: 65, attributionControl: false });
    map.on('dragstart', function () { if (nav && nav.folgen) { nav.folgen = false; $('navMitte').hidden = false; } });
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Wege: <a href="https://routing.openstreetmap.de">FOSSGIS</a> · Fahrplan: <a href="https://transitous.org/sources/">Transitous</a>' }), 'bottom-left');

    var bereit = new Promise(function (ok) { map.on('load', ok); });
    var daten = Promise.all([laden(), fetch('/map/profile.json').then(function (r) { return r.json(); }).catch(function () { return []; })]);

    bereit.then(function () {
      gestalten();
      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'route-rand', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 7, 18, 16] } });
      map.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 4.5, 18, 11] } });
      map.addLayer({ id: 'route-strich', type: 'line', source: 'route', filter: ['!=', ['get', 'modus'], 'bus'], layout: { 'line-join': 'round' },
        paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 18, 2.2], 'line-dasharray': [2, 2.5], 'line-opacity': 0.8 } });
      map.addSource('schritte', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'schritte', type: 'circle', source: 'schritte', minzoom: 16, paint: { 'circle-radius': 9, 'circle-color': '#203c32', 'circle-stroke-color': '#ddf77b', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'schritte-nr', type: 'symbol', source: 'schritte', minzoom: 16, layout: { 'text-field': ['get', 'nr'], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-allow-overlap': true },
        paint: { 'text-color': '#fff' } });
      map.addSource('firmen', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'firmen-glow', type: 'circle', source: 'firmen', paint: {
        'circle-color': ['get', 'farbe'], 'circle-blur': 1, 'circle-opacity': 0.7,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 6, 14, 12, 17, 22]
      } });
      map.addLayer({ id: 'firmen', type: 'circle', source: 'firmen', paint: {
        'circle-color': ['get', 'farbe'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 2.5, 14, 4.5, 16, 5, 18, 6],
        'circle-opacity': ['interpolate', ['linear'], ['zoom'], 15, 1, 17, 0.85],
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 15, 1.5]
      } });
      map.addLayer({ id: 'firmen-name', type: 'symbol', source: 'firmen', minzoom: 18.5, layout: {
        'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 12, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true
      }, paint: { 'text-halo-width': 1.5 } });
      setzeStil(EIN.cityMode ? 'city' : stilName);
      map.on('click', 'firmen', function (e) { detail(e.features[0].properties.id); });
      map.on('idle', haeuserFaerben);
      map.on('moveend', schilderZeichnen);
      map.on('moveend', kartenBewegt);
      ortMarker();
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
      if (rolle === 'chef') chefStart();
    }).catch(function () {
      $('sheetBody').innerHTML = '<p class="muted">Die Geschäfte konnten gerade nicht geladen werden. Bitte später noch einmal versuchen.</p>';
    });
  }

  // ---------- Bedienung ----------
  // ---------- Rolle: Nutzer oder Geschäftsführer ----------
  var rolle = 'nutzer';
  function rolleSetzen(neu) {
    rolle = neu;
    try { localStorage.setItem('scmap-rolle', neu); } catch (e) {}
    document.querySelectorAll('[data-rolle]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.rolle === neu); });
    $('q').placeholder = neu === 'chef' ? 'Name deines Geschäfts …' : 'Geschäft, Adresse oder was du brauchst …';
  }
  // Bereich für Geschäftsführer im unteren Blatt
  function chefStart() {
    zaehle('map_geschaeftsfuehrer');
    sel = null; routeWeg(); if (selMarker) { selMarker.remove(); selMarker = null; }
    blatt('52vh');
    $('sheetBody').innerHTML = '<div class="chef"><button class="back" type="button" data-alle>‹ Erst mal nur umschauen</button>' +
      '<h2>Willkommen, Geschäftsführer 👋</h2><p class="muted">Zeig dein Geschäft auf der SocialClip Map – zum Start kostenlos für Betriebe aus Nürnberg, Fürth und Erlangen.</p>' +
      '<button class="act main" type="button" data-chef-suche>🔍 Mein Geschäft auf der Karte suchen</button>' +
      '<button class="act" type="button" data-join>➕ Mein Geschäft fehlt – neu eintragen</button>' +
      '<ul class="perks"><li>⭐ Goldener Pin und ganz oben in der Liste</li><li>📸 Titelbild und „Wer steckt dahinter?“</li>' +
      '<li>🛠️ „Das kann ich“ – Kunden finden dich über deine Leistungen</li><li>🔥 Aktion der Woche</li></ul></div>';
    $('sheetBody').scrollTop = 0;
  }
  $('gate').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rolle]'); if (!b) return;
    try { localStorage.setItem(OK_KEY, '1'); } catch (x) {}
    rolleSetzen(b.dataset.rolle);
    $('gate').hidden = true;
    if (!map) start(); else if (all.length) { if (rolle === 'chef') chefStart(); else liste(); }
    homeAnleitung();
  });

  // ---------- Anleitung „Zum Home-Bildschirm hinzufügen“ (nur am Handy, nur bis man es gemacht hat) ----------
  var installEvent = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; });
  function alsAppGeoeffnet() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  function homeAnleitung() {
    var handy = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    try { if (localStorage.getItem('scmap-home')) return; } catch (e) {}
    if (!handy || alsAppGeoeffnet()) return;
    var ua = navigator.userAgent, ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var schritte = ios
      ? (/CriOS|FxiOS/.test(ua)
        ? ['Tippe oben rechts in der Adressleiste auf <b>Teilen</b> ' + TEILEN, 'Wähle <b>„Zum Home-Bildschirm“</b> ' + PLUS, 'Tippe oben rechts auf <b>„Hinzufügen“</b>']
        : ['Tippe unten in der Leiste auf <b>Teilen</b> ' + TEILEN, 'Scroll etwas nach unten und tippe auf <b>„Zum Home-Bildschirm“</b> ' + PLUS, 'Tippe oben rechts auf <b>„Hinzufügen“</b> – fertig!'])
      : ['Tippe oben rechts auf die <b>drei Punkte ⋮</b>', 'Wähle <b>„Zum Startbildschirm hinzufügen“</b> oder <b>„App installieren“</b>', 'Bestätige mit <b>„Installieren“</b> bzw. <b>„Hinzufügen“</b>'];
    $('homeSchritte').innerHTML = schritte.map(function (t, i) { return '<li><span class="nr">' + (i + 1) + '</span><span>' + t + '</span></li>'; }).join('');
    $('homeInstall').hidden = !installEvent;
    $('home').hidden = false;
  }
  var TEILEN = '""" + TEILEN + """', PLUS = '""" + PLUS + """';
  $('homeInstall').addEventListener('click', function () {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent.userChoice.then(function (w) { if (w.outcome === 'accepted') { try { localStorage.setItem('scmap-home', '1'); } catch (e) {} $('home').hidden = true; } });
  });
  $('homeFertig').addEventListener('click', function () { try { localStorage.setItem('scmap-home', '1'); } catch (e) {} $('home').hidden = true; });
  $('homeSpaeter').addEventListener('click', function () { $('home').hidden = true; });
  window.addEventListener('appinstalled', function () { try { localStorage.setItem('scmap-home', '1'); } catch (e) {} $('home').hidden = true; });
  // Menü hinter dem „S“
  $('menuKnopf').addEventListener('click', function () { menuZeigen(); $('menu').hidden = false; });
  $('menu').addEventListener('click', function (e) {
    if (e.target === this || e.target.closest('[data-close]')) { this.hidden = true; return; }
    var b = e.target.closest('[data-rolle]');
    if (b) {
      rolleSetzen(b.dataset.rolle); this.hidden = true;
      if (all.length) { if (rolle === 'chef') chefStart(); else liste(); }
      return;
    }
    if (e.target.closest('[data-join]')) { this.hidden = true; beitreten(null); }
  });
  var STUFEN = [24, 52, 90], ziehen = null;
  function blattHoehe() { return $('sheet').getBoundingClientRect().height / innerHeight * 100; }
  $('grip').addEventListener('click', function () {
    if (ziehen && ziehen.bewegt) return;
    var jetzt = blattHoehe();
    blatt((jetzt > 70 ? 34 : 90) + 'vh');
  });
  function ziehStart(e) {
    if (innerWidth >= 900) return;
    // im Inhalt nur ziehen, wenn ganz oben gescrollt und nach unten/oben gewischt wird
    if (e.target.closest('#sheetBody') && $('sheetBody').scrollTop > 0) return;
    if (e.target.closest('input, textarea')) return;
    ziehen = { y: e.touches[0].clientY, h: blattHoehe(), bewegt: false, imInhalt: !!e.target.closest('#sheetBody') };
  }
  function ziehBewegen(e) {
    if (!ziehen) return;
    var dy = e.touches[0].clientY - ziehen.y;
    if (!ziehen.bewegt) {
      if (Math.abs(dy) < 8) return;
      // im Inhalt: nach oben wischen = scrollen, außer das Blatt ist noch nicht ganz offen
      if (ziehen.imInhalt && dy < 0 && ziehen.h >= 89) { ziehen = null; return; }
      ziehen.bewegt = true;
      $('sheet').style.transition = 'none';
    }
    e.preventDefault();
    var h = Math.max(14, Math.min(92, ziehen.h - dy / innerHeight * 100));
    document.documentElement.style.setProperty('--sheet', h + 'vh');
  }
  function ziehEnde() {
    if (!ziehen) return;
    var war = ziehen; ziehen = war.bewegt ? { bewegt: true } : null;
    setTimeout(function () { ziehen = null; }, 50);
    if (!war.bewegt) return;
    $('sheet').style.transition = '';
    var h = blattHoehe(), richtung = h - war.h;
    // in Wischrichtung zur nächsten Stufe einrasten
    var ziel = richtung > 0 ? STUFEN.filter(function (x) { return x >= h - 4; })[0] || 90 : STUFEN.slice().reverse().filter(function (x) { return x <= h + 4; })[0] || 24;
    blatt(ziel + 'vh');
  }
  $('sheet').addEventListener('touchstart', ziehStart, { passive: true });
  $('sheet').addEventListener('touchmove', ziehBewegen, { passive: false });
  $('sheet').addEventListener('touchend', ziehEnde);
  $('sheet').addEventListener('touchcancel', ziehEnde);
  $('q').addEventListener('input', function () { if (all.length) { liste(); blatt('52vh'); } });
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') e.target.blur(); });
  // Kategorien am PC: Pfeile und Mausrad schieben die Leiste seitlich
  function catsPfeile() {
    var c = $('cats');
    $('catsL').hidden = c.scrollLeft < 5;
    $('catsR').hidden = c.scrollLeft + c.clientWidth >= c.scrollWidth - 5;
  }
  $('cats').addEventListener('scroll', catsPfeile);
  window.addEventListener('resize', catsPfeile);
  $('catsL').addEventListener('click', function () { $('cats').scrollLeft -= $('cats').clientWidth * 0.7; });
  $('catsR').addEventListener('click', function () { $('cats').scrollLeft += $('cats').clientWidth * 0.7; });
  $('cats').addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); this.scrollBy({ left: e.deltaY, behavior: 'auto' }); }
  }, { passive: false });
  function stadtWaehlen(k) {
    stadt = k; START = STAEDTE[k].mitte; center = START; me = null;
    if (meMarker) { meMarker.remove(); meMarker = null; }
    try { localStorage.setItem('scmap-stadt', k); } catch (e) {}
    all.forEach(function (f) { f.dist = abstand(center, ll(f)); });
    map.flyTo({ center: START, zoom: 16, duration: 1200 });
    liste();
  }
  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('.cat'); if (!b) return;
    if (b.hasAttribute('data-alle') || aktiv === b.dataset.k) return zurueck();
    if (!aktiv) merken();
    aktiv = b.dataset.k; liste();
  });
  $('sheetBody').addEventListener('click', function (e) {
    var r = e.target.closest('.row'); if (r) return detail(r.dataset.id);
    var st = e.target.closest('[data-stadt]'); if (st) return stadtWaehlen(st.dataset.stadt);
    var ol = e.target.closest('[data-ort-los]'); if (ol) return ortOeffnen(ol.dataset.ortLos);
    var os = e.target.closest('[data-ort-setzen]');
    if (os) {
      var k = os.dataset.ortSetzen;
      orte[k] = { name: sel.ort || [sel.name, sel.t['addr:street']].filter(Boolean).join(', ') || sel.name, lat: sel.lat, lon: sel.lon };
      if (sel.adresse && sel.ort) orte[k].name = sel.name + (sel.ort ? ', ' + sel.ort : '');
      orteSpeichern(); $('q').placeholder = rolle === 'chef' ? 'Name deines Geschäfts …' : 'Geschäft, Adresse oder was du brauchst …';
      return zeichneDetail();
    }
    var m = e.target.closest('[data-mode]'); if (m) return weg(m.dataset.mode);
    if (e.target.closest('[data-go]')) return navStart();
    var vb = e.target.closest('[data-verb]');
    if (vb) { bus.wahl = +vb.dataset.verb; zeichneDetail(); return busZeigen(true); }
    if (e.target.closest('[data-reise]')) return reiseStart();
    if (e.target.closest('[data-chef-suche]')) { liste(); blatt('34vh'); return $('q').focus(); }
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
  function dreiDSetzen(an) {
    dreiD = EIN.dreiD = an; einstSpeichern();
    $('dreiD').setAttribute('aria-pressed', an);
    if (map) map.easeTo({ pitch: an ? 55 : 0, bearing: an ? -20 : 0, duration: 700 });
  }
  function cityModeSetzen(an) {
    EIN.cityMode = !!an;
    einstSpeichern();
    document.body.classList.toggle('city-mode', EIN.cityMode);
    $('cityKnopf').setAttribute('aria-pressed', String(EIN.cityMode));
    $('cityKnopf').setAttribute('aria-label', EIN.cityMode ? 'City Mode beenden' : 'City Mode starten');
    $('cityHud').hidden = !EIN.cityMode;
    if (!map || !map.getLayer('firmen')) return;
    setzeStil(EIN.cityMode ? 'city' : tagOderNacht());
    map.easeTo({pitch:EIN.cityMode ? 56 : EIN.dreiD ? 55 : 0,
      bearing:EIN.cityMode ? -34 : EIN.dreiD ? -20 : 0,
      zoom:EIN.cityMode ? Math.max(15.2,map.getZoom()) : map.getZoom(),
      duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850});
    schilderZeichnen();
    liste();
  }
  document.body.classList.toggle('city-mode', !!EIN.cityMode);
  $('cityHud').hidden = !EIN.cityMode;
  $('cityKnopf').setAttribute('aria-pressed', String(!!EIN.cityMode));
  $('cityKnopf').addEventListener('click', function(){cityModeSetzen(!EIN.cityMode);});
  $('dreiD').setAttribute('aria-pressed', dreiD);
  $('dreiD').addEventListener('click', function () { if(EIN.cityMode) cityModeSetzen(false); dreiDSetzen(!dreiD); });
  $('stilKnopf').addEventListener('click', function () {
    if (!map || !map.getLayer('firmen')) return;
    if(EIN.cityMode) cityModeSetzen(false);
    EIN.tagNacht = stilName === 'nacht' ? 'tag' : 'nacht'; einstSpeichern();
    setzeStil(EIN.tagNacht);
  });

  // ---------- Menü: Einstellungen ----------
  function menuZeigen() {
    document.querySelectorAll('[data-einst]').forEach(function (c) { c.checked = !!EIN[c.dataset.einst]; });
    document.querySelectorAll('[data-tagnacht]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tagnacht === EIN.tagNacht); });
    orteZeigen(); stimmenListe();
  }
  $('menu').addEventListener('change', function (e) {
    var c = e.target.closest('[data-einst]'); if (!c) return;
    var k = c.dataset.einst;
    if (k === 'dreiD') { if(EIN.cityMode) cityModeSetzen(false); return dreiDSetzen(c.checked); }
    EIN[k] = c.checked; einstSpeichern();
    if (map && map.getLayer('firmen')) setzeStil(stilName);
    if (k === 'schilder' && map) schilderZeichnen();
  });
  $('menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tagnacht]'); if (!b) return;
    if(EIN.cityMode) cityModeSetzen(false);
    EIN.tagNacht = b.dataset.tagnacht; einstSpeichern(); menuZeigen();
    if (map && map.getLayer('firmen')) setzeStil(tagOderNacht());
  });

  // ---------- Meine Orte: Zuhause und Arbeit (nur auf diesem Gerät) ----------
  var ORTE_NAME = { zuhause: ['🏠', 'Zuhause', 'Nach Hause'], arbeit: ['💼', 'Arbeit', 'Zur Arbeit'] }, orte = {}, ortMarkerListe = [];
  try { orte = JSON.parse(localStorage.getItem('scmap-orte') || '{}'); } catch (e) {}
  function orteSpeichern() { try { localStorage.setItem('scmap-orte', JSON.stringify(orte)); } catch (e) {} ortMarker(); }
  function ortMarker() {
    if (!map) return;
    ortMarkerListe.forEach(function (m) { m.remove(); }); ortMarkerListe = [];
    Object.keys(orte).forEach(function (k) {
      var el = document.createElement('button'); el.type = 'button'; el.className = 'ort-pin'; el.innerHTML = '<span>' + ORTE_NAME[k][0] + '</span>';
      el.title = ORTE_NAME[k][1];
      el.addEventListener('click', function (e) { e.stopPropagation(); ortOeffnen(k); });
      ortMarkerListe.push(new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([orte[k].lon, orte[k].lat]).addTo(map));
    });
  }
  function ortOeffnen(k) {
    var o = orte[k]; if (!o) return;
    var f = { id: 'ort-' + k, adresse: true, kat: 'sonst', t: {}, lat: o.lat, lon: o.lon, name: ORTE_NAME[k][1], ort: o.name };
    f.dist = abstand(center, ll(f)); byId[f.id] = f;
    $('menu').hidden = true;
    detail(f.id);
  }
  function orteZeigen() {
    $('meineOrte').innerHTML = Object.keys(ORTE_NAME).map(function (k) {
      var o = orte[k], n = ORTE_NAME[k];
      return '<div class="ort-zeile"><span class="ort-ic">' + n[0] + '</span><span class="ort-tx"><b>' + n[1] + '</b><small>' +
        (o ? esc(o.name) : 'Noch nicht festgelegt – such deine Adresse und tippe dort auf „' + n[0] + ' ' + n[1] + '“') + '</small></span>' +
        (o ? '<button type="button" class="ort-los" data-ort-los="' + k + '">Hin</button><button type="button" class="ort-weg" data-ort-weg="' + k + '" aria-label="' + n[1] + ' löschen">✕</button>'
           : '<button type="button" class="ort-los" data-ort-such="' + k + '">Suchen</button>') + '</div>';
    }).join('');
  }
  $('meineOrte').addEventListener('click', function (e) {
    var los = e.target.closest('[data-ort-los]'), weg = e.target.closest('[data-ort-weg]'), such = e.target.closest('[data-ort-such]');
    if (los) return ortOeffnen(los.dataset.ortLos);
    if (weg) { delete orte[weg.dataset.ortWeg]; orteSpeichern(); return orteZeigen(); }
    if (such) { $('menu').hidden = true; $('q').value = ''; $('q').placeholder = 'Adresse für ' + ORTE_NAME[such.dataset.ortSuch][1] + ' eingeben …'; $('q').focus(); }
  });

  // ---------- Karte verschoben: Liste und Kategorie-Zahlen passen sich automatisch an ----------
  function kartenBewegt() {
    if (!all.length || nav) return;
    var mitte = map.getCenter().toArray();
    if (sel || abstand(mitte, center) < 250) return kategorien();
    center = mitte;
    all.forEach(function (f) { f.dist = abstand(center, ll(f)); });
    liste();
  }
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

  // Wer schon eine Rolle gewählt hat, wird nicht mehr gefragt (wechseln geht im Menü)
  try {
    var gespeicherteRolle = localStorage.getItem('scmap-rolle');
    if (localStorage.getItem(OK_KEY) && gespeicherteRolle) { rolleSetzen(gespeicherteRolle); $('gate').hidden = true; start(); homeAnleitung(); }
    else if (localStorage.getItem(OK_KEY)) start();
  } catch (e) {}
})();
