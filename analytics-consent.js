/* SocialClip: basic consent mode. No Google tag is requested before opt-in. */
(function () {
  'use strict';
  if (window.SocialClipAnalytics) return;

  var MEASUREMENT_ID = 'G-CHX4825P8G';
  var STORAGE_KEY = 'socialclip.analytics-consent.v1';
  var LIFETIME = 180 * 24 * 60 * 60 * 1000;
  var DISABLE_KEY = 'ga-disable-' + MEASUREMENT_ID;
  var started = false;
  var banner;
  var status;
  var closeButton;
  var returnFocus;

  window[DISABLE_KEY] = true;

  function readChoice() {
    try {
      var item = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (item && item.version === 1 && item.measurementId === MEASUREMENT_ID &&
          (item.value === 'granted' || item.value === 'denied') &&
          Number.isFinite(item.expiresAt) && item.expiresAt > Date.now()) {
        return item.value;
      }
    } catch (error) { /* Storage can be unavailable in private browsing. */ }
    return null;
  }

  var choice = readChoice();

  function saveChoice(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        measurementId: MEASUREMENT_ID,
        value: value,
        updatedAt: Date.now(),
        expiresAt: Date.now() + LIFETIME
      }));
    } catch (error) { /* This visit still respects the selected value. */ }
  }

  function removeAnalyticsCookies() {
    var domains = ['', location.hostname, '.' + location.hostname];
    var labels = location.hostname.split('.');
    if (labels.length > 2) domains.push('.' + labels.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
          (domain ? '; domain=' + domain : '') + '; SameSite=Lax; Secure';
      });
    });
  }

  function safePageLocation() {
    // Intro names, project details, query strings and fragments are not sent.
    return location.origin + location.pathname;
  }

  function safeReferrer() {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : ''; }
    catch (error) { return ''; }
  }

  function enableAnalytics() {
    if (choice !== 'granted') return;
    window[DISABLE_KEY] = false;
    if (started) return;
    started = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: LIFETIME / 1000,
      cookie_update: false,
      cookie_flags: 'SameSite=Lax;Secure',
      cookie_path: '/',
      page_location: safePageLocation(),
      page_referrer: safeReferrer()
    });

    var tag = document.createElement('script');
    tag.id = 'socialclip-google-analytics';
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
    tag.addEventListener('load', function () { tag.dataset.loaded = 'true'; });
    document.head.appendChild(tag);
  }

  function stopAnalytics() {
    window[DISABLE_KEY] = true;
    removeAnalyticsCookies();
    // A new document guarantees the already-loaded library is unloaded as well.
    // The saved rejection prevents it from loading again after this reload.
    if (started) location.reload();
  }

  function updateStatus() {
    if (!status) return;
    status.textContent = choice === 'granted'
      ? 'Deine aktuelle Auswahl: Statistik erlaubt.'
      : choice === 'denied'
        ? 'Deine aktuelle Auswahl: Statistik abgelehnt.'
        : 'Freiwillig. Du kannst die Website auch ohne Statistik nutzen.';
    closeButton.hidden = !choice;
  }

  function openSettings(focus) {
    if (!banner) return;
    returnFocus = document.activeElement;
    updateStatus();
    banner.hidden = false;
    document.documentElement.classList.add('sc-analytics-prompt-open');
    if (focus) banner.querySelector('[data-analytics-allow]').focus();
  }

  function closeSettings() {
    if (!banner) return;
    banner.hidden = true;
    document.documentElement.classList.remove('sc-analytics-prompt-open');
    if (returnFocus && returnFocus.isConnected && returnFocus !== document.body) returnFocus.focus();
  }

  function choose(value) {
    choice = value;
    saveChoice(value);
    updateStatus();
    closeSettings();
    if (value === 'granted') enableAnalytics();
    else stopAnalytics();
  }

  function init() {
    banner = document.createElement('aside');
    banner.id = 'sc-analytics-banner';
    banner.className = 'sc-analytics-banner';
    banner.hidden = true;
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'sc-analytics-title');
    banner.innerHTML = '<div class="sc-analytics-heading">' +
      '<h2 id="sc-analytics-title">Darf die Statistik mitlaufen?</h2>' +
      '<button class="sc-analytics-close" type="button" data-analytics-close aria-label="Statistik-Einstellungen schließen" hidden>×</button></div>' +
      '<p>Mit deiner Zustimmung nutzen wir Google Analytics 4, um Besuche und die Nutzung dieser Website auszuwerten. Dabei werden Cookies gesetzt und Nutzungsdaten an Google übermittelt, auch in die USA. Deine Wahl kannst du jederzeit unten ändern.</p>' +
      '<div class="sc-analytics-actions"><button type="button" data-analytics-allow>Statistik erlauben</button><button type="button" data-analytics-deny>Ablehnen</button></div>' +
      '<p class="sc-analytics-status" aria-live="polite"></p>' +
      '<div class="sc-analytics-links"><a href="/datenschutz.html#statistik">Datenschutz</a><a href="/impressum.html">Impressum</a></div>';
    document.body.prepend(banner);
    status = banner.querySelector('.sc-analytics-status');
    closeButton = banner.querySelector('[data-analytics-close]');
    banner.querySelector('[data-analytics-allow]').addEventListener('click', function () { choose('granted'); });
    banner.querySelector('[data-analytics-deny]').addEventListener('click', function () { choose('denied'); });
    closeButton.addEventListener('click', closeSettings);
    banner.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && choice) closeSettings();
    });

    var settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'sc-analytics-settings';
    settings.textContent = 'STATISTIK-EINSTELLUNGEN';
    settings.setAttribute('aria-controls', 'sc-analytics-banner');
    settings.addEventListener('click', function () { openSettings(true); });
    var footer = document.querySelector('footer .footer-legal') ||
      document.querySelector('footer nav') || document.querySelector('footer');
    (footer || document.body).appendChild(settings);

    document.querySelectorAll('[data-analytics-open]').forEach(function (button) {
      button.addEventListener('click', function () { openSettings(true); });
    });

    updateStatus();
    if (choice === 'granted') enableAnalytics();
    else {
      removeAnalyticsCookies();
      if (!choice) openSettings(false);
    }
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    choice = readChoice();
    updateStatus();
    if (choice === 'granted') enableAnalytics();
    else {
      stopAnalytics();
      if (!choice && !started) openSettings(false);
    }
  });

  window.SocialClipAnalytics = { openSettings: function () { openSettings(true); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());
