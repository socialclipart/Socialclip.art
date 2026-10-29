// Bildansicht auf den Projekt-Detailseiten
const box = document.getElementById('lightbox'), full = document.getElementById('lightbox-img');
let opener;
document.querySelectorAll('[data-zoom]').forEach(b => b.addEventListener('click', () => {
  opener = b;
  full.src = b.dataset.zoom;
  full.alt = b.querySelector('img').alt;
  document.getElementById('lightbox-caption').textContent = b.dataset.caption;
  box.showModal();
}));
document.getElementById('lightbox-close').addEventListener('click', () => box.close());
box.addEventListener('click', e => { if (e.target === box) box.close(); });
box.addEventListener('close', () => opener?.focus());
