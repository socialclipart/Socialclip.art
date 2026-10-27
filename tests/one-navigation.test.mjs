import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../app-beta/app.js', import.meta.url), 'utf8');
const bridgeSource = readFileSync(new URL('../map/one-bridge.js', import.meta.url), 'utf8');
const origin = 'https://socialclip.art';

function app() {
  const handlers = {}, nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      hidden: true, dataset: { src: '/map/?city=1' }, contentWindow: {}, innerHTML: '',
      classList: { toggle() {} }, handlers: {}, validity: '',
      addEventListener(type, fn) { this.handlers[type] = fn; },
      hasAttribute(name) { return Object.hasOwn(this, name); },
      setCustomValidity(text) { this.validity = text; },
      focus() { this.focused = true; }, scrollIntoView() {},
      replaceChildren() { this.innerHTML = ''; },
      reportValidity() { return !this.elements.description.validity; }, reset() { this.resetCalled = true; }
    });
    return nodes.get(id);
  };
  node('requestform').elements = { description: node('description'), category: node('category') };
  const location = { origin, hash: '#start' };
  let networkCalls = 0;
  const window = { SOCIALCLIP_CONFIG: {}, addEventListener(type, fn) { handlers[type] = fn; }, scrollTo() {} };
  vm.runInNewContext(appSource, {
    window, location, crypto: {}, localStorage: { getItem() { return null; } },
    document: { getElementById: node, querySelectorAll: () => [], body: { classList: { toggle() {} } } },
    FormData: class { constructor(form) { this.data = form.testdata; } get(key) { return this.data[key]; } },
    fetch() { networkCalls++; throw Error('Demo must never send'); }
  });
  return { handlers, node, location, calls: () => networkCalls };
}

test('ONE loads one real Map frame and retains its document across section changes', () => {
  const h = app(), frame = h.node('socialclip-map-frame');
  assert.equal(frame.hasAttribute('src'), false);
  h.location.hash = '#entdecken'; h.handlers.hashchange();
  assert.equal(frame.src, '/map/?city=1');
  frame.src = 'same-document-marker';
  h.location.hash = '#live'; h.handlers.hashchange();
  h.location.hash = '#entdecken'; h.handlers.hashchange();
  assert.equal(frame.src, 'same-document-marker');
});

test('Navigation rejects foreign origins, other frames and unknown actions', () => {
  const h = app(), source = h.node('socialclip-map-frame').contentWindow;
  for (const event of [
    { origin: 'https://foreign.invalid', source, data: { type: 'sc-one:navigate', page: 'live' } },
    { origin, source: {}, data: { type: 'sc-one:navigate', page: 'live' } },
    { origin, source, data: { type: 'other', page: 'live' } },
    { origin, source, data: { type: 'sc-one:navigate', page: 'https://foreign.invalid' } },
    { origin, source, data: null }
  ]) { h.handlers.message(event); assert.equal(h.location.hash, '#start'); }
  h.handlers.message({ origin, source, data: { type: 'sc-one:navigate', page: 'live' } });
  assert.equal(h.location.hash, 'live');
});

test('Local request preview escapes input, sends nothing, and can be cleared', () => {
  const h = app(), form = h.node('requestform');
  form.testdata = { category: 'Auto', location: 'Erlangen', when: 'Morgen', description: '<img src=x onerror=alert(1)>' };
  form.handlers.submit({ preventDefault() {}, currentTarget: form });
  assert.match(h.node('requestresult').innerHTML, /&lt;img/);
  assert.doesNotMatch(h.node('requestresult').innerHTML, /<img/);
  assert.match(h.node('requestresult').innerHTML, /Demo – nicht versendet/);
  assert.equal(h.calls(), 0);
  h.node('clearrequest').handlers.click();
  assert.equal(h.node('requestresult').hidden, true);
  assert.equal(h.node('requestresult').innerHTML, '');
  assert.equal(form.resetCalled, true);
});

test('Whitespace-only requests show validation instead of a false preview', () => {
  const h = app(), form = h.node('requestform');
  form.testdata = { description: '             ' };
  form.handlers.submit({ preventDefault() {}, currentTarget: form });
  assert.match(form.elements.description.validity, /mindestens 12/);
  assert.equal(h.node('requestresult').hidden, true);
});

test('Content skip link focuses the main area without changing sections', () => {
  const h = app(); h.location.hash = '#main'; h.handlers.hashchange();
  assert.equal(h.node('main').focused, true);
});

function bridge({ standalone = false, foreignParent = false } = {}) {
  const messages = []; let click;
  const window = { location: { origin, href: origin + '/map/' } };
  window.parent = standalone ? window : {
    location: { origin: foreignParent ? 'https://foreign.invalid' : origin, pathname: '/app-beta/' },
    postMessage: (...args) => messages.push(args)
  };
  vm.runInNewContext(bridgeSource, { window, URL, document: { addEventListener(type, fn) { click = fn; } } });
  function dispatch(href, extra = {}) {
    const event = { target: { closest: () => ({ href }) }, button: 0, prevented: false,
      preventDefault() { this.prevented = true; }, ...extra };
    click?.(event); return event;
  }
  return { messages, dispatch, hasListener: () => !!click };
}

test('Embedded Map requests a section change without top-level navigation', () => {
  const h = bridge();
  assert.equal(h.dispatch(origin + '/app-beta/#live').prevented, true);
  assert.equal(h.messages.length, 1);
  assert.equal(h.messages[0][0].page, 'live');
  assert.equal(h.messages[0][1], origin);
});

test('Standalone, modified clicks and unrelated links retain normal browser behavior', () => {
  assert.equal(bridge({ standalone: true }).hasListener(), false);
  assert.equal(bridge({ foreignParent: true }).dispatch(origin + '/app-beta/#live').prevented, false);
  const h = bridge();
  for (const href of ['https://foreign.invalid/app-beta/#live', origin + '/other/#live', origin + '/app-beta/?other=1#live', origin + '/app-beta/#unknown']) {
    assert.equal(h.dispatch(href).prevented, false);
  }
  assert.equal(h.dispatch(origin + '/app-beta/#live', { ctrlKey: true }).prevented, false);
  assert.equal(h.messages.length, 0);
});
