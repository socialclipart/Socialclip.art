/* ONE navigation only. No map data, camera, settings or access rules are changed. */
(function () {
  'use strict';
  if (window.parent === window) return;
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('a[target="_top"]');
    if (!link) return;
    var url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname !== '/app-beta/' || url.search) return;
    var page = url.hash.slice(1);
    if (['live', 'feedback'].indexOf(page) === -1) return;
    // A foreign embedding page must not suppress the standalone links.
    try {
      if (window.parent.location.origin !== window.location.origin || window.parent.location.pathname !== '/app-beta/') return;
    } catch (e) { return; }
    event.preventDefault();
    window.parent.postMessage({ type: 'sc-one:navigate', page: page }, window.location.origin);
  });
})();
