/* SocialClip Map: Geschäfte in Erlangen entdecken (Daten: OpenStreetMap) */
(function () {
  var START = [49.5897, 11.0039];          // Erlangen Mitte
  var BBOX = '49.54,10.93,49.64,11.08';    // Süd, West, Nord, Ost
  var RADIUS = 1000;                        // „In deiner Nähe“ in Metern
  var CACHE_KEY = 'scmap-v1';
  var SERVERS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

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

  // Deutsche Namen für häufige Arten (für Liste und Popup)
  var ART = {
    restaurant: 'Restaurant', cafe: 'Café', fast_food: 'Imbiss', bar: 'Bar', pub: 'Kneipe', ice_cream: 'Eisdiele', biergarten: 'Biergarten',
    bakery: 'Bäckerei', butcher: 'Metzgerei', supermarket: 'Supermarkt', convenience: 'Laden', greengrocer: 'Obst & Gemüse', kiosk: 'Kiosk', beverages: 'Getränke',
    hairdresser: 'Friseur', beauty: 'Kosmetik', cosmetics: 'Kosmetik', massage: 'Massage', tattoo: 'Tattoo', nails: 'Nagelstudio',
    doctors: 'Arztpraxis', dentist: 'Zahnarzt', pharmacy: 'Apotheke', veterinary: 'Tierarzt', optician: 'Optiker', physiotherapist: 'Physiotherapie',
    car: 'Autohandel', car_repair: 'Autowerkstatt', tyres: 'Reifen', bicycle: 'Fahrradladen', car_wash: 'Waschanlage', fuel: 'Tankstelle',
    clothes: 'Mode', shoes: 'Schuhe', jewelry: 'Schmuck', tailor: 'Schneiderei', florist: 'Blumen', books: 'Buchhandlung', gift: 'Geschenke', furniture: 'Möbel',
    electronics: 'Elektronik', mobile_phone: 'Handyladen', computer: 'Computer', photo: 'Foto',
    it: 'IT-Firma', advertising_agency: 'Werbeagentur', graphic_design: 'Grafikdesign', photographer: 'Fotograf', printer: 'Druckerei', copyshop: 'Copyshop',
    electrician: 'Elektriker', plumber: 'Installateur', carpenter: 'Schreiner', painter: 'Maler', roofer: 'Dachdecker', locksmith: 'Schlüsseldienst', hvac: 'Heizung & Klima',
    bank: 'Bank', post_office: 'Post', driving_school: 'Fahrschule', lawyer: 'Anwalt', tax_advisor: 'Steuerberatung', insurance: 'Versicherung', estate_agent: 'Makler',
    fitness_centre: 'Fitnessstudio', sports: 'Sportgeschäft', pet: 'Tierbedarf', laundry: 'Wäscherei', travel_agency: 'Reisebüro'
  };

  var $ = function (id) { return document.getElementById(id); };
  var map, layer, meMarker, center = START, all = [], stars = [], aktiv = null, markers = {};

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function kategorie(t) {
    for (var i = 0; i < ORDER.length - 1; i++) {
      var c = CATS[ORDER[i]];
      for (var key in c) {
        if (!Array.isArray(c[key]) || !t[key]) continue;
        if (c[key][0] === '*' || c[key].indexOf(t[key]) !== -1) return ORDER[i];
      }
    }
    return 'sonst';
  }

  function art(t) {
    var v = t.shop || t.amenity || t.craft || t.office || t.healthcare || t.leisure || '';
    return ART[v] || (v ? v.replace(/_/g, ' ') : 'Geschäft');
  }

  function abstand(a, b) {
    var R = 6371000, r = Math.PI / 180;
    var dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  function meter(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km'; }

  // Daten laden: erst aus dem Zwischenspeicher (1 Tag), sonst von OpenStreetMap
  function laden() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (c && Date.now() - c.zeit < 864e5) return Promise.resolve(c.daten);
    } catch (e) {}
    var q = '[out:json][timeout:60];(' +
      ['shop', 'craft', 'office', 'healthcare'].map(function (k) { return 'nwr["' + k + '"]["name"](' + BBOX + ');'; }).join('') +
      'nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|biergarten|doctors|dentist|pharmacy|clinic|veterinary|car_wash|fuel|car_rental|bank|post_office|driving_school)$"]["name"](' + BBOX + ');' +
      'nwr["leisure"~"^(fitness_centre|sports_centre)$"]["name"](' + BBOX + ');' +
      ');out center tags;';
    var versuch = function (i) {
      return fetch(SERVERS[i], { method: 'POST', body: 'data=' + encodeURIComponent(q) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .catch(function (e) { if (i + 1 < SERVERS.length) return versuch(i + 1); throw e; });
    };
    return versuch(0).then(function (j) {
      var daten = j.elements.map(function (e) {
        var lat = e.lat || (e.center && e.center.lat), lon = e.lon || (e.center && e.center.lon);
        if (!lat) return null;
        return { id: e.type + e.id, name: e.tags.name, lat: lat, lon: lon, t: e.tags };
      }).filter(Boolean);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ zeit: Date.now(), daten: daten })); } catch (e) {}
      return daten;
    });
  }

  function popup(f) {
    var t = f.t || {}, h = '<div class="pop">';
    if (f.star) {
      if (f.bild) h += '<img src="' + esc(f.bild) + '" alt="">';
      h += '<h3>⭐ ' + esc(f.name) + '</h3><div class="k">' + esc(f.slogan || '') + '</div>';
      if (f.story) h += '<p style="margin-top:6px">' + esc(f.story) + '</p>';
      if (f.kann) h += '<p style="margin-top:6px"><b>Das kann ich:</b> ' + f.kann.map(esc).join(' · ') + '</p>';
      if (f.aktion) h += '<p style="margin-top:6px;color:#b25a24">🔥 ' + esc(f.aktion) + '</p>';
    } else {
      h += '<h3>' + esc(f.name) + '</h3><div class="k">' + esc(art(t)) + '</div>';
      var adr = [t['addr:street'] && (t['addr:street'] + ' ' + (t['addr:housenumber'] || '')), t['addr:city']].filter(Boolean).join(', ');
      if (adr) h += '<div>' + esc(adr) + '</div>';
      if (t.opening_hours) h += '<div class="k">🕒 ' + esc(t.opening_hours) + '</div>';
    }
    var web = f.web || t.website || t['contact:website'], tel = f.telefon || t.phone || t['contact:phone'];
    h += '<div class="acts">';
    if (f.whatsapp) h += '<a href="https://wa.me/' + esc(f.whatsapp) + '">WhatsApp</a>';
    if (tel) h += '<a href="tel:' + esc(tel.replace(/[^+\d]/g, '')) + '">Anrufen</a>';
    if (web && /^https?:\/\//.test(web)) h += '<a href="' + esc(web) + '" target="_blank" rel="noopener">Website</a>';
    h += '<a href="https://www.openstreetmap.org/directions?to=' + f.lat + ',' + f.lon + '" target="_blank" rel="noopener">Route</a></div>';
    if (!f.star) h += '<a class="claim" href="https://wa.me/4917646188101?text=' + encodeURIComponent('Hallo SocialClip, ich bin von „' + f.name + '“ und möchte mein Schaufenster-Profil auf der SocialClip Map.') + '">Ist das dein Geschäft? Schaufenster-Profil holen →</a>';
    return h + '</div>';
  }

  function zeichnen() {
    layer.clearLayers(); markers = {};
    all.forEach(function (f) {
      var c = CATS[f.kat];
      var icon = f.star
        ? L.divIcon({ className: '', html: '<div class="pin-star">' + c.ico + '</div>', iconSize: [30, 30], iconAnchor: [15, 15] })
        : L.divIcon({ className: '', html: '<div class="pin" style="background:' + c.farbe + '"></div>', iconSize: [14, 14], iconAnchor: [7, 7] });
      var m = L.marker([f.lat, f.lon], { icon: icon, zIndexOffset: f.star ? 1000 : 0, title: f.name }).bindPopup(popup(f), { maxWidth: 280 });
      markers[f.id] = m;
    });
    filtern();
  }

  function passt(f, q) {
    if (aktiv && f.kat !== aktiv) return false;
    if (!q) return true;
    var text = [f.name, art(f.t || {}), CATS[f.kat].name, (f.kann || []).join(' '), f.slogan, (f.t || {}).cuisine, (f.t || {}).description].join(' ').toLowerCase();
    return q.split(/\s+/).every(function (w) { return text.indexOf(w) !== -1; });
  }

  function filtern() {
    var q = $('q').value.trim().toLowerCase();
    layer.clearLayers();
    var treffer = all.filter(function (f) { return passt(f, q); });
    treffer.forEach(function (f) { layer.addLayer(markers[f.id]); });

    // Zählung „In deiner Nähe“ pro Kategorie
    var nah = all.filter(function (f) { return f.dist <= RADIUS; }), zahl = {};
    nah.forEach(function (f) { zahl[f.kat] = (zahl[f.kat] || 0) + 1; });
    $('cats').innerHTML = ORDER.filter(function (k) { return zahl[k] || aktiv === k; }).map(function (k) {
      return '<button class="cat" type="button" data-k="' + k + '" aria-pressed="' + (aktiv === k) + '">' + CATS[k].ico + ' ' + CATS[k].name + ' <b>' + (zahl[k] || 0) + '</b></button>';
    }).join('');
    $('nearTitle').textContent = 'Im Umkreis von 1 km: ' + nah.length + ' Geschäfte';

    var liste = treffer.slice().sort(function (a, b) { return (b.star - a.star) || (a.dist - b.dist); }).slice(0, 40);
    $('status').textContent = treffer.length
      ? treffer.length + ' Treffer' + (aktiv ? ' in „' + CATS[aktiv].name + '“' : '') + (q ? ' für „' + q + '“' : '') + ' – die nächsten zuerst.'
      : 'Nichts gefunden. Probier ein anderes Wort oder eine andere Kategorie.';
    $('list').innerHTML = liste.map(function (f) {
      var c = CATS[f.kat];
      if (f.star) return '<button class="item star" type="button" data-id="' + f.id + '">' + (f.bild ? '<img src="' + esc(f.bild) + '" alt="">' : '') +
        '<span class="badge">⭐ Schaufenster</span><h3>' + esc(f.name) + '</h3><p>' + esc(f.slogan || '') + '</p>' +
        '<div class="kann">' + (f.kann || []).map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>' +
        (f.aktion ? '<div class="aktion">🔥 ' + esc(f.aktion) + '</div>' : '') + '<div class="meta">' + meter(f.dist) + ' entfernt</div></button>';
      return '<button class="item" type="button" data-id="' + f.id + '"><h3>' + c.ico + ' ' + esc(f.name) + '</h3><p>' + esc(art(f.t)) + '</p><div class="meta">' + meter(f.dist) + ' entfernt</div></button>';
    }).join('');
  }

  function zeigen(id) {
    var m = markers[id]; if (!m) return;
    map.setView(m.getLatLng(), Math.max(map.getZoom(), 17));
    m.openPopup();
    $('map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function neuerMittelpunkt(p) {
    center = p;
    all.forEach(function (f) { f.dist = abstand(center, [f.lat, f.lon]); });
    filtern();
  }

  function start() {
    $('gate').hidden = true;
    map = L.map('map', { zoomControl: true }).setView(START, 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
    layer = L.layerGroup().addTo(map);
    $('status').textContent = 'Lade Geschäfte aus Erlangen …';

    Promise.all([
      laden(),
      fetch('/map/profile.json').then(function (r) { return r.json(); }).catch(function () { return []; })
    ]).then(function (res) {
      stars = res[1].map(function (p) { p.star = true; p.id = 'p-' + p.id; p.kat = CATS[p.kategorie] ? p.kategorie : 'sonst'; p.t = {}; return p; });
      all = res[0].map(function (f) { f.star = false; f.kat = kategorie(f.t); return f; }).concat(stars);
      all.forEach(function (f) { f.dist = abstand(center, [f.lat, f.lon]); });
      zeichnen();
    }).catch(function () {
      $('status').textContent = 'Die Firmendaten konnten gerade nicht geladen werden. Bitte später noch einmal versuchen.';
    });
  }

  $('load').addEventListener('click', start);
  $('q').addEventListener('input', function () { if (map) filtern(); });
  $('cats').addEventListener('click', function (e) {
    var b = e.target.closest('.cat'); if (!b) return;
    aktiv = aktiv === b.dataset.k ? null : b.dataset.k; filtern();
  });
  $('list').addEventListener('click', function (e) { var b = e.target.closest('.item'); if (b) zeigen(b.dataset.id); });
  $('locate').addEventListener('click', function () {
    if (!map) start();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (pos) {
      var p = [pos.coords.latitude, pos.coords.longitude];
      if (meMarker) meMarker.remove();
      meMarker = L.marker(p, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(map);
      map.setView(p, 16);
      if (all.length) neuerMittelpunkt(p); else center = p;
    }, function () { $('status').textContent = 'Standort nicht freigegeben – wir zeigen Erlangen Mitte.'; });
  });
  $('surprise').addEventListener('click', function () {
    if (!map) { start(); return; }
    var nah = all.filter(function (f) { return f.dist <= RADIUS * 1.5 && f.kat !== 'sonst'; });
    if (nah.length) zeigen(nah[Math.floor(Math.random() * nah.length)].id);
  });
})();
