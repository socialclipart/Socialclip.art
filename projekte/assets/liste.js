// Filter auf der Projekte-Übersicht: Alle / Abgeschlossen / In Arbeit
const filters = [...document.querySelectorAll('[data-filter]')];
filters.forEach(b => b.addEventListener('click', () => {
  filters.forEach(f => f.setAttribute('aria-pressed', String(f === b)));
  let count = 0;
  document.querySelectorAll('.pj-card[data-status]').forEach(p => {
    p.hidden = b.dataset.filter !== 'all' && p.dataset.status !== b.dataset.filter;
    if (!p.hidden) count++;
  });
  document.getElementById('filter-status').textContent = count + (count === 1 ? ' Projekt angezeigt' : ' Projekte angezeigt');
}));
