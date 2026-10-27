'use strict';
/* SocialClip ONE App. Die Map wird NICHT dupliziert, sondern aus /map/ eingebunden.
   Live bleibt eine klar gekennzeichnete Testvorschau; Community benötigt ein Backend. */
(() => {
 const $=id=>document.getElementById(id);
 const config=window.SOCIALCLIP_CONFIG || {};
 const connected=!!(config.supabaseUrl && config.supabaseAnonKey);
 const state={page:'start',vote:null};
 const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function route(){
  if(location.hash==='#main'){$('main').focus();return}
  const p=location.hash.slice(1).split(/[/?]/)[0]||'start';
  state.page=['start','entdecken','live','business','feedback'].includes(p)?p:'start';
  document.body.classList.toggle('map-section-active',state.page==='entdecken');
  document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+state.page));
  document.querySelectorAll('[data-nav]').forEach(e=>{
   const yes=e.dataset.nav===state.page;
   e.classList.toggle('on',yes);
   if(yes)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');
  });
  if(state.page==='entdecken'){
   // Load once, then preserve the real Map state when switching to Live or Feedback.
   const frame=$('socialclip-map-frame');
   if(frame && !frame.hasAttribute('src'))frame.src=frame.dataset.src;
  }
  if(state.page==='feedback')refresh();
  window.scrollTo(0,0);
 }
 window.addEventListener('hashchange',route);
 // Only the existing same-origin Map frame may request a ONE section change.
 // Keep its document alive, including current search, selection and camera position.
 window.addEventListener('message',event=>{
  const frame=$('socialclip-map-frame'),data=event.data;
  if(event.origin!==location.origin || !frame || event.source!==frame.contentWindow)return;
  if(!data || data.type!=='sc-one:navigate' || !['live','feedback','business'].includes(data.page))return;
  location.hash=data.page;
 });
 $('requestform').addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(e.currentTarget),desc=String(data.get('description')||'').trim();
  const description=e.currentTarget.elements.description;
  description.setCustomValidity(desc.length<12?'Bitte beschreibe dein Anliegen mit mindestens 12 Zeichen.':'');
  if(!e.currentTarget.reportValidity())return;
  const box=$('requestresult');box.hidden=false;
  box.innerHTML='<h3>So könnte deine Live-Anfrage aussehen</h3><p><b>'+escapeHTML(data.get('category'))+'</b> · '+escapeHTML(data.get('location'))+'</p><p>'+escapeHTML(desc)+'</p><small>Wunschtermin: '+escapeHTML(data.get('when'))+'</small><div class="caution" style="margin-top:15px"><b>Demo – nicht versendet</b><p>Es wurde noch kein Unternehmen kontaktiert und kein Termin reserviert. Deine Angaben bleiben in dieser Browseransicht.</p></div>';
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
 });
 $('requestform').elements.description.addEventListener('input',e=>e.currentTarget.setCustomValidity(''));
 $('clearrequest').addEventListener('click',()=>{
  $('requestform').reset();$('requestform').elements.description.setCustomValidity('');
  $('requestresult').replaceChildren();$('requestresult').hidden=true;
  $('requestform').elements.category.focus();
 });
 const BASE=(config.supabaseUrl||'').replace(/\/+$/,'');
 async function db(path,options={}){
  if(!connected)throw Error('Öffentliche Datenbank noch nicht verbunden');
  const headers={'apikey':config.supabaseAnonKey,'Authorization':'Bearer '+config.supabaseAnonKey,'Content-Type':'application/json',...(options.headers||{})};
  const response=await fetch(BASE+'/rest/v1/'+path,{...options,headers});
  if(!response.ok)throw Error('Datenbankfehler '+response.status);
  if(response.status===204)return null;
  const txt=await response.text();return txt?JSON.parse(txt):null;
 }
 const browserKey='socialclip-beta-voter-1';
 function deviceId(){let id=localStorage.getItem(browserKey);if(!id){id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);localStorage.setItem(browserKey,id)}return id}
 function getDemoVote(){try{return localStorage.getItem('sc-one-demo-vote')}catch{return null}}
 function setDemoVote(x){try{localStorage.setItem('sc-one-demo-vote',x)}catch{}}
 function results(votes){
  const counts={map:0,live:0,both:0};votes.forEach(v=>{if(counts[v.choice]!=null)counts[v.choice]++});
  const total=votes.length;const labels={map:'Map',live:'Live',both:'Beides'};
  $('bars').innerHTML=Object.keys(labels).map(k=>'<div class="barrow"><div class="barhead"><span>'+labels[k]+'</span><span>'+Math.round(total?counts[k]/total*100:0)+' %</span></div><div class="barbg"><div class="barfill" style="width:'+Math.round(total?counts[k]/total*100:0)+'%"></div></div></div>').join('');
  $('totalvotes').textContent=connected?total+' abgegebene Stimmen':'Demo-Modus: nur deine eigene Auswahl auf diesem Gerät; keine gemeinsamen Abstimmungsergebnisse.';
 }
 function renderComments(rows){
  const el=$('comments');el.innerHTML='';
  if(!rows.length){el.innerHTML='<p class="subtle">Noch keine veröffentlichten Kommentare.</p>';return}
  rows.forEach(r=>{const article=document.createElement('article');article.className='comment';const name=document.createElement('b');name.textContent=r.display_name||'Anonym';const q=document.createElement('blockquote');q.textContent=r.body;article.append(name,q);if(r.created_at){const date=document.createElement('small');date.textContent=new Date(r.created_at).toLocaleDateString('de-DE');article.append(date)}el.append(article)});
 }
 async function refresh(){
  $('backendstatus').textContent=connected?'Gemeinschaftsmodus aktiv: Stimmen werden öffentlich angezeigt; Kommentare erst nach Freigabe.':'VORSCHAU-MODUS: Abstimmung und Kommentare sind noch nicht öffentlich freigeschaltet. Zum Sammeln und Anzeigen echter Community-Rückmeldungen muss die gemeinsame Datenbank verbunden werden.';
  $('backendstatus').classList.toggle('live',connected);
  if(!connected){results(getDemoVote()?[{choice:getDemoVote()}]:[]);renderComments([]);return}
  try{
   const [votes,comments]=await Promise.all([db('sc_votes?select=choice'),db('sc_comments?select=display_name,body,created_at&status=eq.approved&order=created_at.desc&limit=60')]);
   results(votes||[]);renderComments(comments||[]);
  }catch(err){$('backendstatus').textContent='Gemeinsame Ergebnisse konnten nicht geladen werden: '+err.message}
 }
 document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>{state.vote=b.dataset.vote;document.querySelectorAll('[data-vote]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('sendvote').disabled=false}));
 $('sendvote').addEventListener('click',async()=>{
  if(!state.vote)return;
  const btn=$('sendvote');btn.disabled=true;
  try{
   if(connected){await db('rpc/sc_cast_vote',{method:'POST',body:JSON.stringify({p_device_id:deviceId(),p_choice:state.vote})});$('votestatus').textContent='Danke! Deine Stimme wurde gespeichert.'}
   else{setDemoVote(state.vote);$('votestatus').textContent='Demo-Stimme nur auf diesem Gerät gespeichert – nicht öffentlich gezählt.'}
   await refresh()
  }catch(err){$('votestatus').textContent='Speichern fehlgeschlagen: '+err.message}
  finally{btn.disabled=false}
 });
 $('commentform').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.currentTarget,data=new FormData(form),body=String(data.get('body')||'').trim(),name=String(data.get('display_name')||'').trim().slice(0,40);
  if(!data.get('consent')){$('commentstatus').textContent='Bitte bestätige die öffentliche Anzeige.';return}
  if(body.length<6)return;
  if(!connected){$('commentstatus').textContent='Demo-Modus: Feedback kann noch nicht gemeinsam gespeichert werden. Bitte veröffentliche den Kommentar vorerst unter dem SocialClip-Beitrag in deiner Gruppe.';return}
  const button=form.querySelector('button[type="submit"]');button.disabled=true;
  try{
   await db('rpc/sc_submit_comment',{method:'POST',body:JSON.stringify({p_device_id:deviceId(),p_name:name||null,p_body:body})});
   form.reset();$('commentstatus').textContent='Danke! Dein Kommentar wurde übermittelt und erscheint nach Freigabe.';await refresh()
  }catch(err){$('commentstatus').textContent='Feedback konnte nicht gespeichert werden: '+err.message}
  finally{button.disabled=false}
 });
 $('refresh').addEventListener('click',refresh);
 route();
})();
