/* SocialClip KI-Chat. No keys, analytics events, or persistent conversation storage. */
(() => {
  'use strict';
  if (document.getElementById('sc-chat')) return;
  const config=window.SocialClipChatConfig||{};
  const preview=config.preview===true;
  if(config.enabled!==true&&!preview)return;
  const endpoint=typeof config.endpoint==='string'&&/^https:\/\//.test(config.endpoint)?config.endpoint:'';
  let consent=false,busy=false,messages=[],lastFocus=null,controller=null;
  const root=document.createElement('div');root.id='sc-chat';
  root.innerHTML=`<button class="sc-chat-launch" type="button" aria-controls="sc-chat-panel" aria-expanded="false"><span aria-hidden="true">✦</span> FRAG NOVA <span class="sc-chat-badge">KI</span></button>
  <section id="sc-chat-panel" class="sc-chat-panel" role="dialog" aria-modal="false" aria-labelledby="sc-chat-title" hidden>
    <header class="sc-chat-head"><div><span class="sc-chat-eyebrow">SOCIALCLIP / KI-BERATUNG</span><h2 id="sc-chat-title">Nova. Deine Idee beginnt hier.</h2></div><button class="sc-chat-close" type="button" aria-label="Chat schließen">×</button></header>
    <div class="sc-chat-preview" ${preview?'':'hidden'}>Vorschau · KI-Antworten sind noch nicht freigeschaltet.</div>
    <div class="sc-chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-label="Chatverlauf"><div class="sc-chat-message sc-chat-assistant"><span class="sc-chat-role">NOVA · KI</span><p>Hi! Ich helfe dir bei Websites, Design, Social Media und digitalen Lösungen. Was möchtest du für dein Unternehmen verändern?</p></div></div>
    <div class="sc-chat-consent"><p>Wenn du den KI-Chat startest, werden deine Nachrichten zur Beantwortung an Vercel und OpenAI übermittelt, möglicherweise auch in die USA. Bitte teile keine vertraulichen Daten. Antworten können Fehler enthalten.</p><a href="${preview?'/datenschutz.html':'/datenschutz.html#ki-chat'}">Datenschutz zum KI-Chat</a><button class="sc-chat-start" type="button">KI-CHAT STARTEN</button></div>
    <div class="sc-chat-suggestions" hidden><button type="button">Ich brauche eine Website</button><button type="button">Hilfe mit Social Media</button><button type="button">Was kostet ein Projekt?</button></div>
    <p class="sc-chat-status" role="status" aria-live="polite"></p>
    <form class="sc-chat-form" hidden><label class="sc-chat-sr" for="sc-chat-input">Deine Nachricht an Nova</label><textarea id="sc-chat-input" rows="1" maxlength="1500" placeholder="Erzähl kurz von deiner Idee …" required></textarea><button type="submit" aria-label="Nachricht an Nova senden">↑</button></form>
    <footer class="sc-chat-foot"><button class="sc-chat-prepare" type="button">ANFRAGE VORBEREITEN →</button><button class="sc-chat-reset" type="button">CHAT LÖSCHEN</button></footer>
  </section>`;
  document.body.append(root);
  const $=s=>root.querySelector(s),panel=$('.sc-chat-panel'),launch=$('.sc-chat-launch'),log=$('.sc-chat-log'),input=$('#sc-chat-input'),status=$('.sc-chat-status'),form=$('.sc-chat-form');
  const setStatus=t=>{status.textContent=t;};
  function open(){lastFocus=document.activeElement;panel.hidden=false;launch.setAttribute('aria-expanded','true');$('.sc-chat-close').focus();}
  function close(){panel.hidden=true;launch.setAttribute('aria-expanded','false');if(lastFocus?.isConnected)lastFocus.focus();}
  launch.addEventListener('click',()=>panel.hidden?open():close());$('.sc-chat-close').addEventListener('click',close);
  root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close();}});
  function add(role,text,links=[]){
    const box=document.createElement('div');box.className='sc-chat-message sc-chat-'+role;
    const label=document.createElement('span');label.className='sc-chat-role';label.textContent=role==='user'?'DU':'NOVA · KI';box.append(label);
    const p=document.createElement('p');p.textContent=text.replace(/\[([^\]]+)\]\(https:\/\/(?:www\.)?socialclip\.art\/[^\s)]+\)/g,'$1');box.append(p);
    if(role==='assistant'){
      const nav=document.createElement('div');nav.className='sc-chat-links';
      for(const item of links.slice(0,3)){
        try{const url=new URL(item.url);if(url.origin!=='https://socialclip.art')continue;const a=document.createElement('a');a.href=url.href;a.textContent=item.name+' ↗';nav.append(a);}catch{/* ignore invalid source */}
      }
      if(nav.childNodes.length)box.append(nav);
    }
    log.append(box);log.scrollTop=log.scrollHeight;return box;
  }
  async function start(){
    if(preview||!endpoint){setStatus('Diese Vorschau zeigt den fertigen Chat-Aufbau. Die KI-Verbindung wird nach der Freischaltung aktiviert. Es wurden keine Nachrichten versendet.');return;}
    consent=true;$('.sc-chat-consent').hidden=true;form.hidden=false;$('.sc-chat-suggestions').hidden=false;setStatus('KI-Antworten können Fehler enthalten. Verbindliche Angebote bestätigt Alin persönlich.');input.focus();
  }
  $('.sc-chat-start').addEventListener('click',start);
  async function send(text){
    text=text.trim();if(!text||busy||!consent)return;
    if(messages.length>=18||messages.reduce((n,m)=>n+m.content.length,0)+text.length>10500){setStatus('Der Chat ist voll. Bereite deine Anfrage vor oder starte einen neuen Chat.');return;}
    messages.push({role:'user',content:text});const userBox=add('user',text);input.value='';busy=true;form.querySelector('button').disabled=true;$('.sc-chat-suggestions').hidden=true;
    setStatus('Nova denkt über deine Idee nach …');controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),30000);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({consent:true,messages}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      const data=await response.json();if(!response.ok||typeof data.reply!=='string')throw new Error(data.message||'Nova ist gerade nicht erreichbar. Bitte versuche es später oder nutze das Kontaktformular.');
      const reply=data.reply.slice(0,6000);messages.push({role:'assistant',content:reply});add('assistant',reply,Array.isArray(data.services)?data.services:[]);setStatus('Entwurf und KI-Beratung sind unverbindlich.');
    }catch(error){messages.pop();userBox.remove();input.value=text;setStatus(error.name==='AbortError'?'Die Antwort dauert zu lange. Deine Nachricht ist wieder im Eingabefeld.':error.message);}
    finally{clearTimeout(timeout);controller=null;busy=false;form.querySelector('button').disabled=false;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();send(input.value);});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();send(input.value);}});
  $('.sc-chat-suggestions').addEventListener('click',e=>{const b=e.target.closest('button');if(b)send(b.textContent);});
  $('.sc-chat-reset').addEventListener('click',()=>{
    if(busy){setStatus('Bitte warte, bis die aktuelle Antwort abgeschlossen ist.');return;}
    messages=[];input.value='';consent=false;form.hidden=true;$('.sc-chat-suggestions').hidden=true;$('.sc-chat-consent').hidden=false;
    for(const item of [...log.children].slice(1))item.remove();setStatus('Chat gelöscht. Der Verlauf wurde aus dieser Seite entfernt.');
  });
  $('.sc-chat-prepare').addEventListener('click',()=>{
    if(!messages.some(m=>m.role==='user')){setStatus(preview?'In der Live-Version kannst du hier deinen Chat ins Kontaktformular übernehmen.':'Erzähl Nova zuerst von deinem Vorhaben oder nutze direkt unser Kontaktformular.');return;}
    if(busy){setStatus('Bitte warte auf die aktuelle Antwort.');return;}
    const draft='Anfrage aus der KI-Beratung (noch kein verbindliches Angebot):\n\n'+messages.map(m=>(m.role==='user'?'Meine Angaben: ':'KI-Vorschlag: ')+m.content).join('\n\n');
    const formField=document.querySelector('.contact-form textarea[name="message"]');
    if(formField){
      if(formField.value.trim()){setStatus('Dein Kontaktformular enthält bereits Text. Kopiere den Chat bei Bedarf dazu; vorhandene Angaben werden nicht überschrieben.');return;}
      formField.value=draft.slice(0,10000);formField.dispatchEvent(new Event('input',{bubbles:true}));close();formField.scrollIntoView({behavior:'smooth',block:'center'});formField.focus();
    }else{
      const box=document.createElement('textarea');box.className='sc-chat-draft';box.readOnly=true;box.value=draft.slice(0,10000);box.setAttribute('aria-label','Anfrageentwurf zum Kopieren');log.append(box);box.focus();box.select();setStatus('Kopiere diesen Entwurf in eine Nachricht an socialclip.art@gmail.com. Es wurde nichts abgeschickt.');
    }
  });
  window.SocialClipChat={open,close};
  if(config.open===true)open();
})();
