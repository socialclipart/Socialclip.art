'use strict';
/* SocialClip One App – beta. Existing real OpenStreetMap data, Live demo, community feedback.
   No private data is sent unless PUBLIC_BACKEND is configured. */
(() => {
 const CITIES = {erlangen:{name:'Erlangen',lat:49.5897,lon:11.0039},nuernberg:{name:'Nürnberg',lat:49.4521,lon:11.0775},fuerth:{name:'Fürth',lat:49.4771,lon:10.9886}};
 const GROUPS = {all:['Alle','✳'],food:['Essen','☕'],auto:['Auto & Rad','🚗'],beauty:['Beauty','✂'],health:['Gesundheit','✚'],handwork:['Handwerk','🔧'],shopping:['Shopping','🛍️'],other:['Weitere','⌖']};
 const $=id=>document.getElementById(id);
 const config=window.SOCIALCLIP_CONFIG || {};
 const connected=!!(config.supabaseUrl && config.supabaseAnonKey);
 const state={page:'start',city:'erlangen',group:'all',query:'',map:null,mapLoaded:false,places:[],origin:[11.0039,49.5897],selected:null,vote:null,remoteVotes:[],remoteComments:[]};
 const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=url=>{try{const u=new URL(url);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return''}};
 const distance=(a,b)=>{const d=Math.PI/180,x=(b[1]-a[1])*d,y=(b[0]-a[0])*d, v=Math.sin(x/2)**2+Math.cos(a[1]*d)*Math.cos(b[1]*d)*Math.sin(y/2)**2;return Math.round(6371*2*Math.asin(Math.sqrt(v))*10)/10;};
 const classify=t=>{if(['cafe','restaurant','fast_food','bar','pub','biergarten','ice_cream'].includes(t.amenity)||['bakery','butcher','supermarket','convenience','deli','confectionery'].includes(t.shop))return 'food';if(['car','car_repair','car_parts','tyres','bicycle','motorcycle'].includes(t.shop)||['car_wash','car_rental','fuel'].includes(t.amenity))return 'auto';if(['hairdresser','beauty','cosmetics','massage','tattoo','nails'].includes(t.shop))return 'beauty';if(['doctors','dentist','pharmacy','clinic','veterinary'].includes(t.amenity)||t.healthcare||['optician','hearing_aids'].includes(t.shop))return'health';if(t.craft||['hardware','doityourself','locksmith'].includes(t.shop))return'handwork';if(t.shop)return'shopping';return'other';};
 const iconFor=g=>(GROUPS[g]||GROUPS.other)[1];
 function route(){
  const p=location.hash.slice(1).split(/[/?]/)[0]||'start'; state.page=['start','entdecken','live','business','feedback'].includes(p)?p:'start';
  document.querySelectorAll('.page').forEach(e=>e.classList.toggle('active',e.id==='page-'+state.page));
  document.querySelectorAll('[data-nav]').forEach(e=>{const yes=e.dataset.nav===state.page;e.classList.toggle('on',yes);if(yes)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current')});
  if(state.page==='entdecken') initMap();
  if(state.page==='feedback') refresh();
  window.scrollTo({top:0,behavior:'instant'});
 }
 window.addEventListener('hashchange',route);
 function setStatus(s){$('mapstatus').textContent=s}
 async function loadPlaces(){
  try{
   const response=await fetch('/map/firmen.json',{cache:'force-cache'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const raw=await response.json();
   state.places=raw.filter(p=>p&&p.name&&Number.isFinite(+p.lon)&&Number.isFinite(+p.lat)).map(p=>({...p,id:String(p.id),group:classify(p.t||{})}));
   setStatus('Echte Einträge aus der vorhandenen SocialClip Map. Angaben ohne Gewähr.');
   renderPlaces();
  }catch(e){setStatus('Geschäftsdaten konnten nicht geladen werden. Bitte die App auf derselben Domain wie /map/firmen.json öffnen.');$('placelist').innerHTML='<p>Geschäftsdaten sind derzeit nicht erreichbar.</p>'}
 }
 function filtered(){
  let a=state.places.filter(p=>distance(state.origin,[+p.lon,+p.lat])<=8);
  if(state.group!=='all')a=a.filter(p=>p.group===state.group);
  if(state.query){const q=state.query.toLocaleLowerCase('de');a=a.filter(p=>[p.name,p.t?.description,p.t?.shop,p.t?.amenity,p.t?.craft].join(' ').toLocaleLowerCase('de').includes(q))}
  return a.sort((a,b)=>distance(state.origin,[+a.lon,+a.lat])-distance(state.origin,[+b.lon,+b.lat])).slice(0,80)
 }
 function showDetail(p){
  state.selected=p;const t=p.t||{},web=safeUrl(t.website||t['contact:website']);const url='https://www.openstreetmap.org/?mlat='+encodeURIComponent(p.lat)+'&mlon='+encodeURIComponent(p.lon)+'#map=17/'+encodeURIComponent(p.lat)+'/'+encodeURIComponent(p.lon);
  $('placedetail').hidden=false;
  $('placedetail').innerHTML='<b>'+escapeHTML(p.name)+'</b><p>'+escapeHTML([t['addr:street'],t['addr:housenumber'],t['addr:city']].filter(Boolean).join(' '))+'</p>'+(t.opening_hours?'<p>Öffnungszeiten (laut OSM): '+escapeHTML(t.opening_hours)+'</p>':'')+'<a href="'+url+'" target="_blank" rel="noopener noreferrer">Auf OpenStreetMap anzeigen ↗</a>'+(web?' · <a href="'+escapeHTML(web)+'" target="_blank" rel="noopener noreferrer">Website ↗</a>':'');
  state.map?.flyTo({center:[+p.lon,+p.lat],zoom:15,duration:700});
 }
 function renderPlaces(){
  const list=filtered();
  $('placecount').textContent=list.length>=80?'80+':String(list.length);
  const el=$('placelist');el.innerHTML='';
  if(!list.length)el.innerHTML='<p class="subtle">Hier wurden keine passenden Orte gefunden. Probiere eine andere Kategorie oder Stadt.</p>';
  list.slice(0,35).forEach(p=>{const btn=document.createElement('button');btn.type='button';btn.className='place';btn.innerHTML='<span class="emoji">'+iconFor(p.group)+'</span><span><span class="name">'+escapeHTML(p.name)+'</span><small>'+escapeHTML(GROUPS[p.group][0])+' · '+distance(state.origin,[p.lon,p.lat]).toLocaleString('de-DE')+' km entfernt</small></span>';btn.addEventListener('click',()=>showDetail(p));el.append(btn)});
  if(state.mapLoaded){
   const src=state.map.getSource('socialclip-businesses');
   if(src)src.setData({type:'FeatureCollection',features:list.map(p=>({type:'Feature',properties:{name:p.name,group:p.group,id:p.id},geometry:{type:'Point',coordinates:[+p.lon,+p.lat]}}))});
  }
 }
 function categories(){
  const parent=$('categories');parent.innerHTML='';
  Object.entries(GROUPS).forEach(([k,v])=>{const b=document.createElement('button');b.type='button';b.textContent=v[1]+' '+v[0];b.classList.toggle('selected',k===state.group);b.addEventListener('click',()=>{state.group=k;categories();renderPlaces()});parent.append(b)})
 }
 function initMap(){
  if(state.map){setTimeout(()=>state.map.resize(),100);return}
  if(!window.maplibregl){setStatus('Kartenmodul konnte nicht geladen werden.');return}
  try{
   state.map=new maplibregl.Map({container:'realmap',style:'https://tiles.openfreemap.org/styles/positron',center:state.origin,zoom:12,attributionControl:true});
   state.map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
   state.map.on('load',()=>{
    state.mapLoaded=true;
    state.map.addSource('socialclip-businesses',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
    state.map.addLayer({id:'business-dots',type:'circle',source:'socialclip-businesses',paint:{'circle-radius':['interpolate',['linear'],['zoom'],10,3,14,6,17,9],'circle-color':'#164d3c','circle-stroke-color':'#e9faad','circle-stroke-width':2}});
    state.map.on('click','business-dots',e=>{const id=e.features?.[0]?.properties?.id;const p=state.places.find(p=>p.id===id);if(p)showDetail(p)});
    state.map.on('mouseenter','business-dots',()=>state.map.getCanvas().style.cursor='pointer');
    state.map.on('mouseleave','business-dots',()=>state.map.getCanvas().style.cursor='');
    renderPlaces();
   });
  }catch(err){setStatus('Karte derzeit nicht verfügbar: '+err.message)}
 }
 function changeCity(k){const c=CITIES[k];if(!c)return;state.city=k;state.origin=[c.lon,c.lat];state.map?.flyTo({center:state.origin,zoom:12});$('placedetail').hidden=true;renderPlaces()}
 $('city').addEventListener('change',e=>changeCity(e.target.value));
 $('mapsearch').addEventListener('input',e=>{state.query=e.target.value.trim();renderPlaces()});
 $('random').addEventListener('click',()=>{const list=filtered();if(list.length)showDetail(list[Math.floor(Math.random()*list.length)])});
 $('geo').addEventListener('click',()=>{
  if(!navigator.geolocation){setStatus('Standortfunktion wird in diesem Browser nicht unterstützt.');return}
  setStatus('Standortabfrage läuft – die Freigabe liegt bei dir.');
  navigator.geolocation.getCurrentPosition(pos=>{
   state.origin=[pos.coords.longitude,pos.coords.latitude];state.map?.flyTo({center:state.origin,zoom:13});setStatus('Standort wurde nur im Browser für die Kartensuche verwendet.');renderPlaces()
  },()=>setStatus('Keine Standortfreigabe. Du kannst weiterhin eine Stadt auswählen.'),{timeout:9000,enableHighAccuracy:false});
 });
 $('requestform').addEventListener('submit',e=>{
  e.preventDefault();const data=new FormData(e.currentTarget),desc=String(data.get('description')).trim();if(desc.length<12)return;
  const box=$('requestresult');box.hidden=false;
  box.innerHTML='<h3>So könnte deine Live-Anfrage aussehen</h3><p><b>'+escapeHTML(data.get('category'))+'</b> · '+escapeHTML(data.get('location'))+'</p><p>'+escapeHTML(desc)+'</p><small>Wunschtermin: '+escapeHTML(data.get('when'))+'</small><div class="caution" style="margin-top:15px"><b>Demo – nicht versendet</b><p>Es wurde noch kein Unternehmen kontaktiert und kein Termin reserviert. Deine Angaben bleiben in dieser Browseransicht.</p></div>';
  box.scrollIntoView({behavior:'smooth',block:'nearest'});
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
 categories();loadPlaces();route();
})();