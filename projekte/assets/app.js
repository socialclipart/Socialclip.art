const filters=[...document.querySelectorAll('[data-filter]')];filters.forEach(b=>b.addEventListener('click',()=>{filters.forEach(f=>f.setAttribute('aria-pressed',String(f===b)));let count=0;document.querySelectorAll('[data-status]').forEach(p=>{p.hidden=b.dataset.filter!=='all'&&p.dataset.status!==b.dataset.filter;if(!p.hidden)count++;});document.getElementById('filter-status').textContent=count+(count===1?' Projekt angezeigt':' Projekte angezeigt');}));
const box=document.getElementById('lightbox'),full=document.getElementById('full-image');let opener;
document.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{opener=b;full.src=b.dataset.zoom;full.alt=b.querySelector('img').alt;document.getElementById('image-caption').textContent=b.dataset.caption;box.showModal();}));
document.getElementById('close-lightbox').addEventListener('click',()=>box.close());box.addEventListener('click',e=>{if(e.target===box)box.close();});box.addEventListener('close',()=>opener?.focus());

// Project links also reveal a project hidden by the current filter.
document.querySelectorAll('.project-index a').forEach(a=>a.addEventListener('click',()=>document.querySelector('[data-filter="all"]').click()));
