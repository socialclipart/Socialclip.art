/**
 * findflix → Google-Tabelle
 *
 * Empfängt die Webhook-Ereignisse von findflix (Einstellungen → Ziele → Webhook)
 * und schreibt sie in diese Google-Tabelle:
 *   - Tab "Leads":      eine Zeile pro Betrieb, wird bei jedem Ereignis aktualisiert.
 *                       Die Spalten "Mein Status", "Nächster Schritt" und "Notiz"
 *                       gehören dir und werden nie überschrieben.
 *   - Tab "Ereignisse": jedes Ereignis einzeln, mit den Originaldaten.
 *
 * Einrichtung: siehe README.md im selben Ordner.
 */

var LEADS_SHEET = 'Leads';
var EVENTS_SHEET = 'Ereignisse';

var LEAD_HEADERS = [
  'Lead-ID', 'Firma', 'Website', 'E-Mail', 'Telefon', 'Ort',
  'findflix-Stufe', 'Score', 'Report-Link', 'Letztes Ereignis', 'Zuletzt aktualisiert',
  'Mein Status', 'Nächster Schritt', 'Notiz'
];
var EVENT_HEADERS = ['Zeitpunkt', 'Ereignis', 'Lead-ID', 'Firma', 'Website', 'Rohdaten (JSON)'];

// Die ersten 11 Spalten schreibt das Skript, ab "Mein Status" nur du.
var MANAGED_COLUMNS = 11;

// Feldnamen, unter denen findflix (oder ein anderes System) die Werte schicken kann.
var FIELDS = {
  id: ['lead_id', 'leadId', 'contact_id', 'business_id', 'company_id', 'id'],
  company: ['company_name', 'companyName', 'company', 'business_name', 'businessName', 'firma', 'name'],
  website: ['website', 'url', 'domain', 'site', 'homepage'],
  email: ['email', 'e_mail', 'mail'],
  phone: ['phone', 'telephone', 'telefon', 'phone_number'],
  city: ['city', 'ort', 'location', 'address_city'],
  stage: ['stage', 'stage_name', 'stageName', 'pipeline_stage', 'status'],
  score: ['score', 'rating', 'overall_score', 'total_score'],
  report: ['report_url', 'reportUrl', 'report_link', 'analysis_url', 'pro_analysis_url', 'report'],
  event: ['event', 'event_type', 'eventType', 'type', 'trigger']
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (!isAuthorized_(e)) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    var raw = (e && e.postData && e.postData.contents) || '';
    var payload;
    try {
      payload = JSON.parse(raw);
    } catch (err) {
      payload = { raw: raw };
    }
    // Lead-Export kann mehrere Leads auf einmal schicken.
    var items = Array.isArray(payload) ? payload
      : Array.isArray(payload.leads) ? payload.leads
      : [payload];
    var topEvent = Array.isArray(payload) ? '' : pick_(flatten_(payload), FIELDS.event);
    items.forEach(function (item) { handleItem_(item, topEvent); });
    return json_({ ok: true, received: items.length });
  } finally {
    lock.releaseLock();
  }
}

// Zum Testen im Browser: zeigt nur, dass die Web-App läuft.
function doGet() {
  return json_({ ok: true, service: 'findflix-webhook' });
}

function handleItem_(item, topEvent) {
  var flat = flatten_(item);
  var now = new Date();
  var website = normalizeUrl_(pick_(flat, FIELDS.website));
  var lead = {
    id: String(pick_(flat, FIELDS.id) || website || ''),
    company: pick_(flat, FIELDS.company),
    website: website,
    email: pick_(flat, FIELDS.email),
    phone: pick_(flat, FIELDS.phone),
    city: pick_(flat, FIELDS.city),
    stage: pick_(flat, FIELDS.stage),
    score: pick_(flat, FIELDS.score),
    report: pick_(flat, FIELDS.report),
    event: pick_(flat, FIELDS.event) || topEvent || 'lead'
  };

  var events = sheet_(EVENTS_SHEET, EVENT_HEADERS);
  events.appendRow([now, lead.event, lead.id, lead.company, lead.website, JSON.stringify(item).slice(0, 49000)]);

  if (!lead.id) return;
  var leads = sheet_(LEADS_SHEET, LEAD_HEADERS);
  var row = findRow_(leads, lead.id, lead.website);
  var values = [
    lead.id, lead.company, lead.website, lead.email, lead.phone, lead.city,
    lead.stage, lead.score, lead.report, lead.event, now
  ];
  if (row) {
    // Leere Werte überschreiben vorhandene Angaben nicht.
    var current = leads.getRange(row, 1, 1, MANAGED_COLUMNS).getValues()[0];
    for (var i = 0; i < values.length; i++) {
      if (values[i] === '' || values[i] === null || values[i] === undefined) values[i] = current[i];
    }
    leads.getRange(row, 1, 1, MANAGED_COLUMNS).setValues([values]);
  } else {
    leads.appendRow(values.concat(['Neu', '', '']));
  }
}

function isAuthorized_(e) {
  var token = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!token) return true;
  return e && e.parameter && e.parameter.token === token;
}

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sh;
}

function findRow_(sh, id, website) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var data = sh.getRange(2, 1, last - 1, 3).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]) === id) return i + 2;
    if (website && normalizeUrl_(data[i][2]) === website) return i + 2;
  }
  return 0;
}

// {a: {b: 1}} → {"a.b": 1, "b": 1}; der kurze Schlüssel gewinnt nicht gegen einen vorhandenen.
function flatten_(obj, prefix, out) {
  out = out || {};
  if (obj === null || typeof obj !== 'object') return out;
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    var key = prefix ? prefix + '.' + k : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flatten_(v, key, out);
    } else {
      out[key] = v;
      if (!(k in out)) out[k] = v;
    }
  });
  return out;
}

function pick_(flat, names) {
  for (var i = 0; i < names.length; i++) {
    var v = flat[names[i]];
    if (v !== undefined && v !== null && v !== '') return Array.isArray(v) ? v.join(', ') : v;
  }
  return '';
}

function normalizeUrl_(u) {
  if (!u) return '';
  return String(u).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Einmal im Editor ausführen: legt die beiden Tabs an und erzeugt einen geheimen Token.
function einrichten() {
  sheet_(LEADS_SHEET, LEAD_HEADERS);
  sheet_(EVENTS_SHEET, EVENT_HEADERS);
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('TOKEN');
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('TOKEN', token);
  }
  Logger.log('Token: ' + token);
  Logger.log('Ziel-URL für findflix: <Web-App-URL>?token=' + token);
}
