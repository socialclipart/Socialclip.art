#!/usr/bin/env python3
"""Individuelle Vorschau-Designs für die sieben Autovermietungen.

Jede Vermietung bekommt ein eigenes Layout-Konzept. Daten aus
vorschau_generator.BUSINESSES, Bausteine aus vorschau_designs.
Die früheren Fassungen von MAP Rent und Lösch liegen als v1.html daneben.
Aufruf:  python3 tools/vorschau_designs_miet.py
"""
import json
import os

import vorschau_generator as gen
from vorschau_generator import esc, ico
from vorschau_designs import (FORM_JS, NOTE, OK_CSS, agency_links, banner, faq_html, head, hours_rows, img, maps,
                              render, tel)

OUT = gen.OUT
B = {b["slug"]: b for b in gen.BUSINESSES}


def price_txt(v, unit="Tag"):
    return f'ab {v["price"]} €' if v.get("price") else "auf Anfrage"


def veh_options(b):
    return "".join(f'<option value="{i}" data-p="{v.get("price") or 0}">{esc(v["name"])} · {esc(v["cat"])}</option>'
                   for i, v in enumerate(b["fleet"]))


# Mietformular: Fahrzeug + Zeitraum + Preisschätzung (wenn Preis bekannt)
RENT_JS = """
<script>
document.querySelectorAll('form[data-rent]').forEach(function(f){
  var v=f.querySelector('[name=v]'),a=f.querySelector('[name=d1]'),b=f.querySelector('[name=d2]'),o=f.querySelector('[data-out]');
  function iso(d){return d.toISOString().slice(0,10)}
  var t=new Date();t.setDate(t.getDate()+1);var u=new Date(t);u.setDate(u.getDate()+1);
  if(a&&!a.value){a.value=iso(t)} if(b&&!b.value){b.value=iso(u)}
  function calc(){if(!o)return;if(b.value<a.value)b.value=a.value;var n=Math.max(1,Math.round((new Date(b.value)-new Date(a.value))/864e5)||1);
    var p=+v.options[v.selectedIndex].dataset.p;o.textContent=p?('ca. '+(p*n).toLocaleString('de-DE')+' € für '+n+(n==1?' Tag':' Tage')):(n+(n==1?' Tag':' Tage')+' · Preis auf Anfrage')}
  [v,a,b].forEach(function(e){e&&e.addEventListener('change',calc)});calc();
});
document.querySelectorAll('[data-pick]').forEach(function(x){x.addEventListener('click',function(){var s=document.querySelector('form[data-rent] [name=v]');if(s){s.value=x.dataset.pick;s.dispatchEvent(new Event('change'))}})});
</script>
"""


def rent_fields(b, lab_cls="", wrap_cls="row"):
    return (f'<div class="{wrap_cls}"><div><label class="{lab_cls}" for="rv">Fahrzeug</label><select id="rv" name="v">{veh_options(b)}</select></div></div>'
            f'<div class="{wrap_cls}"><div><label class="{lab_cls}" for="r1">Abholung</label><input id="r1" name="d1" type="date"></div>'
            f'<div><label class="{lab_cls}" for="r2">Rückgabe</label><input id="r2" name="d2" type="date"></div></div>'
            f'<div class="{wrap_cls}"><div><label class="{lab_cls}" for="r3">Name</label><input id="r3" required placeholder="Ihr Name"></div>'
            f'<div><label class="{lab_cls}" for="r4">Telefon</label><input id="r4" type="tel" required placeholder="Für die Rückmeldung"></div></div>')


def done(b, cls="", btn_cls=""):
    return (f'<div class="done {cls}"><h3>✓ Anfrage angekommen</h3><p>Vorschau-Demo: In der Live-Version landet Ihre Anfrage sofort bei {esc(b["name"])}.</p>'
            f'<button class="{btn_cls}" type="button" data-again>Neue Anfrage</button></div>')


def foot(b, cls=""):
    return f'<footer class="{cls}"><div class="w"><span>Entwurf für {esc(b["legal"])}</span><span>{agency_links()}</span></div></footer>'


BASE = """*{box-sizing:border-box}html{scroll-behavior:smooth}a{color:inherit}img{display:block;max-width:100%}
.w{width:min(1160px,100% - 32px);margin:0 auto}footer{padding:30px 0 100px;font-size:.82rem}footer .w{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
input,select,textarea{font:inherit}.note{font-size:.8rem;opacity:.75}"""


# ==========================================================================
# MAP Rent – Nacht-Garage: schwarz/amber, Live-Öffnungsstatus, Chat-Buchung
# ==========================================================================
def d_map(b):
    css = BASE + """
:root{--bg:#09090b;--s:#141418;--s2:#1d1d23;--t:#f4f2ea;--m:#9a9aa5;--a:#ffb000;--line:#2a2a32;--wa:#25d366}
body{margin:0;background:var(--bg);color:var(--t);font-family:'Avenir Next Condensed','Arial Narrow','Roboto Condensed',system-ui,sans-serif;font-size:17px;line-height:1.55}
.cond{font-stretch:condensed;text-transform:uppercase;letter-spacing:.02em}
header .w{display:flex;justify-content:space-between;align-items:center;height:76px}
.lg{font-weight:900;font-size:1.7rem;text-decoration:none;letter-spacing:.04em}.lg span{color:var(--a)}
.live{display:inline-flex;align-items:center;gap:10px;background:var(--s);border:1px solid var(--line);padding:9px 16px;border-radius:999px;font-size:.9rem}
.live i{width:10px;height:10px;border-radius:50%;background:#555}.live.on i{background:#22c55e;box-shadow:0 0 0 6px rgba(34,197,94,.18)}
.hero{display:grid;grid-template-columns:1.2fr .8fr;gap:40px;padding:40px 0 70px;align-items:center}
.hero h1{font-size:clamp(3.4rem,10vw,8rem);line-height:.86;margin:0;font-weight:900;text-transform:uppercase}
.hero h1 span{color:var(--a);display:block}
.hero p{color:var(--m);font-size:1.15rem;max-width:44ch;margin:24px 0}
.b{display:inline-flex;align-items:center;gap:10px;padding:16px 24px;border-radius:12px;font-weight:800;text-decoration:none;border:0;cursor:pointer;font-family:inherit;font-size:1rem;text-transform:uppercase;letter-spacing:.04em}
.ba{background:var(--a);color:#111}.bw{background:var(--wa);color:#062}.bg{background:var(--s2);color:var(--t);border:1px solid var(--line)}
.b svg{width:20px;height:20px}
.clock{background:var(--s);border:1px solid var(--line);border-radius:28px;padding:30px}
.clock .big{font-size:5.5rem;font-weight:900;line-height:1;color:var(--a)}
.clock table{width:100%;border-collapse:collapse;margin-top:16px}.clock td{padding:10px 0;border-top:1px solid var(--line)}.clock td+td{text-align:right;font-weight:700}
.clock tr.today td{color:var(--a)}
.strip{border-block:1px solid var(--line);overflow:hidden;white-space:nowrap}
.strip div{display:inline-block;padding:16px 0;animation:mv 26s linear infinite;font-weight:900;text-transform:uppercase;font-size:1.3rem}
.strip span{margin:0 28px;color:var(--m)}.strip b{color:var(--a)}
@keyframes mv{to{transform:translateX(-50%)}}@media(prefers-reduced-motion:reduce){.strip div{animation:none}}
section{padding:80px 0}
h2{font-size:clamp(2.4rem,6vw,4.4rem);line-height:.92;margin:0 0 30px;text-transform:uppercase;font-weight:900}
h2 span{color:var(--a)}
.rail{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(280px,1fr);gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:12px}
.car{scroll-snap-align:start;background:var(--s);border:1px solid var(--line);border-radius:22px;overflow:hidden;display:flex;flex-direction:column}
.car img{aspect-ratio:16/10;object-fit:cover;width:100%}
.car .in{padding:22px;display:flex;flex-direction:column;flex:1}
.car .c{color:var(--a);font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em}
.car h3{margin:4px 0 10px;font-size:1.6rem;text-transform:uppercase}
.car ul{list-style:none;padding:0;margin:0 0 18px;color:var(--m);font-size:.95rem}.car li::before{content:"— "}
.car .p{margin-top:auto;display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--line);padding-top:16px}
.car .p b{font-size:1.7rem}
.perks{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:22px;overflow:hidden}
.perks div{background:var(--bg);padding:30px}.perks svg{width:30px;height:30px;color:var(--a)}
.perks h3{margin:14px 0 6px;text-transform:uppercase}.perks p{margin:0;color:var(--m)}
.chat{max-width:620px;margin:0 auto;background:#0b141a;border-radius:28px;overflow:hidden;border:1px solid var(--line)}
.chat .top{background:#1f2c34;padding:16px 20px;display:flex;align-items:center;gap:12px}
.chat .av{width:42px;height:42px;border-radius:50%;background:var(--a);color:#111;display:grid;place-items:center;font-weight:900}
.chat .body{padding:22px;background:repeating-linear-gradient(45deg,#0b141a 0 12px,#0d171d 12px 24px)}
.msg{background:#202c33;border-radius:0 14px 14px 14px;padding:12px 14px;margin-bottom:12px;max-width:85%}
.msg.me{background:#005c4b;margin-left:auto;border-radius:14px 0 14px 14px}
.chat label{display:block;font-size:.75rem;color:#8fa3ad;margin:8px 0 4px}
.chat input,.chat select{width:100%;background:#2a3942;border:0;color:#e9edef;border-radius:10px;padding:12px}
.chat .row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.chat .row>div:only-child{grid-column:1/-1}
.est{color:var(--a);font-weight:800;margin:12px 0 0}
.chat .send{display:flex;justify-content:flex-end;margin-top:16px}
.done{padding:30px;text-align:center}
details.faq{border-bottom:1px solid var(--line)}details.faq summary{cursor:pointer;padding:20px 0;font-weight:800;text-transform:uppercase;list-style:none}
details.faq summary::before{content:"+ ";color:var(--a)}details.faq p{margin:0 0 20px;color:var(--m)}
.addr{display:grid;grid-template-columns:1fr 1fr;gap:20px}.box{background:var(--s);border:1px solid var(--line);border-radius:22px;padding:30px}
.box a.big{font-size:2rem;font-weight:900;color:var(--a);text-decoration:none;display:block;margin:8px 0}
footer{border-top:1px solid var(--line);color:var(--m)}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:1fr 1fr;z-index:50}
.mbar a{padding:16px;text-align:center;font-weight:900;text-decoration:none;text-transform:uppercase}
@media(max-width:860px){.hero,.addr{grid-template-columns:1fr}.perks{grid-template-columns:1fr}}
@media(max-width:600px){.mbar{display:grid}header .live{display:none}section{padding:56px 0}.chat .row{grid-template-columns:1fr}}
""" + OK_CSS
    fleet = [dict(v) for v in b["fleet"]]
    pics = {"Mercedes Sprinter": "van1", "VW Crafter Maxi": "van2", "Mercedes C 200": "mb2", "BMW 530e": "bmw1"}
    cars = "".join(
        f'<article class="car"><img src="{img(pics.get(v["name"], "van1"))}" alt="{esc(v["name"])} – Symbolbild" loading="lazy"><div class="in">'
        f'<span class="c">{esc(v["cat"])}</span><h3>{esc(v["name"])}</h3><ul>{"".join(f"<li>{esc(s)}</li>" for s in v["specs"])}</ul>'
        f'<div class="p"><b>{price_txt(v)}</b><a class="b bg" href="#buchen" data-pick="{i}">Anfragen</a></div></div></article>'
        for i, v in enumerate(fleet))
    perks = "".join(f'<div>{ico(i)}<h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for i, h, p in b["usps"])
    wa = gen.intl(b["mobile"])
    hours = json.dumps([[1, 5, "07:30", "21:00"], [6, 6, "08:00", "22:00"], [0, 0, "09:00", "21:00"]])
    body = render("""
{{banner}}
<header><div class="w"><a class="lg cond" href="#top">MAP<span>RENT</span></a><span class="live" id="live"><i></i><span>Öffnungszeiten werden geladen …</span></span>
  <a class="b ba" href="{{tel}}">{{pi}}{{phone}}</a></div></header>
<main id="top">
<section class="w hero" style="padding-top:30px">
  <div><span style="color:var(--m);text-transform:uppercase;letter-spacing:.15em;font-size:.85rem">Pkw & Transporter · Nürnberg-Südstadt</span>
    <h1>Heute mieten.<span>Heute los.</span></h1>
    <p>Sprinter, Crafter Maxi oder BMW 530e – vollgetankt, mit Spanngurten und Umzugsdecken. Anfragen per WhatsApp, auch am Sonntag.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="b ba" href="#buchen">Fahrzeug anfragen →</a><a class="b bw" href="https://wa.me/{{wa}}">{{wai}}WhatsApp</a></div></div>
  <div class="clock"><span style="color:var(--m);text-transform:uppercase;letter-spacing:.15em;font-size:.8rem">Für Sie da</span><div class="big">7/7</div><div>Tage die Woche geöffnet</div>
    <table id="hrs"><tr data-d="1-5"><td>Mo – Fr</td><td>07:30 – 21:00</td></tr><tr data-d="6"><td>Samstag</td><td>08:00 – 22:00</td></tr><tr data-d="0"><td>Sonntag</td><td>09:00 – 21:00</td></tr></table></div>
</section>
<div class="strip"><div>{{strip}}{{strip}}</div></div>
<section id="flotte"><div class="w"><h2>Die <span>Flotte.</span></h2><div class="rail">{{cars}}</div>
  <p class="note" style="color:var(--m)">Sprinter Mo–Fr 79 €/Tag inkl. 100 km · Wochenende 99 €/Tag · 3 Stunden ab 60 € · jeder weitere km 0,25 € · Kaution 100 €*</p></div></section>
<section style="padding-top:0"><div class="w"><h2>Warum <span>MAP?</span></h2><div class="perks">{{perks}}</div></div></section>
<section id="buchen"><div class="w"><h2 style="text-align:center">Schreib <span>uns.</span></h2>
  <div class="chat" data-box><div class="top"><div class="av">M</div><div><b>MAP Rent</b><div style="font-size:.8rem;color:#8fa3ad">antwortet meist in wenigen Minuten</div></div></div>
    <div class="body"><div class="msg">Hallo! 👋 Welches Fahrzeug brauchst du und wann?</div>
      <form data-demo data-rent novalidate><div class="msg me" style="max-width:100%">{{fields}}<div class="est" data-out></div></div>
        <div class="send"><button class="b ba" type="submit">Senden ➤</button></div></form>
      {{done}}</div></div></div></section>
<section id="faq" style="padding-top:0"><div class="w"><h2>Fragen<span>?</span></h2>{{faq}}</div></section>
<section style="padding-top:0"><div class="w addr">
  <div class="box"><span style="color:var(--m);text-transform:uppercase;letter-spacing:.12em;font-size:.8rem">Abholung</span><h3 style="font-size:1.8rem;margin:8px 0;text-transform:uppercase">{{street}}</h3><div>{{zip}} {{city}}-Südstadt</div>
    <p><a class="b bg" href="{{maps}}" target="_blank" rel="noopener">Route planen</a></p></div>
  <div class="box"><span style="color:var(--m);text-transform:uppercase;letter-spacing:.12em;font-size:.8rem">Direkt</span><a class="big" href="{{tel}}">{{phone}}</a><a class="b bw" href="https://wa.me/{{wa}}">{{wai}}WhatsApp-Chat</a></div>
</div><div class="w"><p class="note" style="color:var(--m)">* {{note}}</p></div></section>
</main>
{{foot}}
<nav class="mbar"><a href="{{tel}}" style="background:var(--a);color:#111">Anrufen</a><a href="https://wa.me/{{wa}}" style="background:var(--wa);color:#062">WhatsApp</a></nav>
<script>
(function(){var H={{hours}},n=new Date(),d=n.getDay(),m=n.getHours()*60+n.getMinutes(),el=document.getElementById('live');
function mm(s){var p=s.split(':');return +p[0]*60+ +p[1]}
var h=H.filter(function(x){return d>=x[0]&&d<=x[1]})[0];
document.querySelectorAll('#hrs tr').forEach(function(r){var p=r.dataset.d.split('-');if(d>=+p[0]&&d<=+(p[1]||p[0]))r.classList.add('today')});
if(h&&m>=mm(h[2])&&m<mm(h[3])){el.classList.add('on');el.lastChild.textContent='Jetzt geöffnet · bis '+h[3]+' Uhr'}else{el.lastChild.textContent='Gerade geschlossen · heute '+(h?h[2]+'–'+h[3]:'')}})();
</script>
""", banner=banner(b, "#000", "#fff", "#ffb000"), tel=tel(b), phone=esc(b["phone"]), pi=ico("phone"), wa=wa, wai=ico("wa"),
        strip="".join(f'<span>{t}</span><b>✦</b>' for t in ["Sprinter", "Crafter Maxi", "BMW 530e", "Mercedes C 200", "7 Tage geöffnet", "WhatsApp-Buchung", "Umzugsdecken gratis"]),
        cars=cars, perks=perks, fields=rent_fields(b), done=done(b, btn_cls="b bg"), faq=faq_html(b), street=esc(b["street"]),
        zip=b["zip"], city=b["city"], maps=maps(b), note=NOTE, foot=foot(b), hours=hours)
    return head(b, "MAP Rent – Pkw & Transporter mieten in Nürnberg", "#09090b", css) + body + FORM_JS + RENT_JS + "</body></html>"


# ==========================================================================
# Lösch – Tradition seit 1932: Emblem, Zeitleiste, Preisliste wie ein Kontobuch
# ==========================================================================
def d_loesch(b):
    css = BASE + """
:root{--g:#1d4732;--g2:#14331f;--cr:#f5efe2;--cr2:#ebe1cc;--gold:#b88a2e;--ink:#1d2a22;--m:#5f6b62;--line:#d9ccb2}
body{margin:0;background:var(--cr);color:var(--ink);font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;font-size:18px;line-height:1.6}
.sans{font-family:'Avenir Next','Segoe UI',system-ui,sans-serif}
.top{background:var(--g2);color:var(--cr);font-size:.85rem}.top .w{display:flex;justify-content:space-between;padding:8px 0;flex-wrap:wrap;gap:8px}
header{background:var(--g);color:var(--cr)}header .w{display:flex;align-items:center;justify-content:space-between;padding:16px 0;gap:16px}
.em{display:flex;align-items:center;gap:14px;text-decoration:none}
.seal{width:64px;height:64px;border-radius:50%;border:2px solid var(--gold);display:grid;place-items:center;text-align:center;font-size:.6rem;letter-spacing:.12em;line-height:1.1;color:var(--gold)}
.seal b{display:block;font-size:1.05rem;letter-spacing:0;color:var(--cr)}
.em .n{font-size:1.6rem}.em small{display:block;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;opacity:.75}
header nav{display:flex;gap:26px}header nav a{text-decoration:none;opacity:.85}
.btn{display:inline-block;padding:14px 24px;border-radius:4px;text-decoration:none;font-weight:600;border:2px solid var(--g);cursor:pointer;font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:.95rem}
.bg{background:var(--g);color:var(--cr)}.bo{background:transparent;color:var(--g)}.bgold{background:var(--gold);border-color:var(--gold);color:#1a1205}
.hero{position:relative;background:var(--g);color:var(--cr);overflow:hidden}
.hero .w{display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center;padding:70px 0 90px}
.hero h1{font-size:clamp(2.6rem,6vw,4.6rem);line-height:1.02;margin:16px 0;font-weight:400}
.hero h1 i{color:var(--gold)}
.hero p{opacity:.85;font-size:1.15rem;max-width:42ch}
.frame{border:10px solid var(--cr);outline:1px solid var(--gold);outline-offset:6px;transform:rotate(1.5deg);box-shadow:0 30px 60px -30px #000}
.frame img{aspect-ratio:4/3;object-fit:cover;width:100%}
.stamp{position:absolute;right:6%;bottom:30px;width:150px;height:150px;border-radius:50%;background:var(--gold);color:#1a1205;display:grid;place-items:center;text-align:center;transform:rotate(-12deg);font-family:'Avenir Next',sans-serif;font-weight:800;line-height:1.1;box-shadow:0 10px 30px -10px #000}
.stamp b{display:block;font-size:2.4rem}
section{padding:80px 0}
.ey{font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:.78rem;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);font-weight:700}
h2{font-size:clamp(2rem,4.4vw,3.2rem);font-weight:400;margin:8px 0 30px;line-height:1.08}
.ledger{background:#fffdf7;border:1px solid var(--line);box-shadow:0 20px 40px -30px rgba(0,0,0,.4)}
.lr{display:grid;grid-template-columns:150px 1fr auto auto;gap:24px;align-items:center;padding:18px 26px;border-bottom:1px solid var(--line)}
.lr:last-child{border-bottom:0}.lr img{height:70px;width:150px;object-fit:contain}
.lr h3{margin:0;font-size:1.35rem;font-weight:400}.lr small{color:var(--m);font-family:'Avenir Next',sans-serif}
.lr .p{font-size:1.5rem;color:var(--g);white-space:nowrap}.lr .p small{font-size:.75rem;display:block;text-align:right}
.lhead{background:var(--g);color:var(--cr);font-family:'Avenir Next',sans-serif;font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;padding:12px 26px;display:flex;justify-content:space-between}
.coupon{margin-top:30px;border:2px dashed var(--gold);background:#fff8e6;padding:26px 30px;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.coupon b{font-size:1.8rem;color:var(--g)}
.tl{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:30px;margin-top:20px}
.tl::before{content:"";position:absolute;left:0;right:0;top:12px;height:2px;background:var(--gold)}
.tl div{position:relative;padding-top:40px}.tl div::before{content:"";position:absolute;top:4px;left:0;width:18px;height:18px;border-radius:50%;background:var(--cr);border:3px solid var(--g)}
.tl b{font-size:1.8rem;color:var(--g);display:block;font-weight:400}.tl p{margin:0;color:var(--m)}
.house{background:var(--g2);color:var(--cr)}
.icons{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;text-align:center}
.icons div{border:1px solid rgba(255,255,255,.2);padding:26px 10px}.icons svg{width:34px;height:34px;color:var(--gold)}
.icons b{display:block;margin-top:10px;font-family:'Avenir Next',sans-serif;font-size:.9rem}
.form{display:grid;grid-template-columns:1.1fr .9fr;gap:40px}
.card{background:#fffdf7;border:1px solid var(--line);padding:34px}
.card label{display:block;font-family:'Avenir Next',sans-serif;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--m);margin:14px 0 6px}
.card input,.card select{width:100%;padding:12px;border:1px solid var(--line);background:var(--cr);border-radius:4px}
.card .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card .row>div:only-child{grid-column:1/-1}
.est{margin:18px 0;padding:14px;background:var(--cr2);font-family:'Avenir Next',sans-serif;font-weight:600}
.side{background:var(--g);color:var(--cr);padding:34px}.side table{width:100%;border-collapse:collapse;margin:14px 0}.side td{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.15)}.side td+td{text-align:right}
.rate{font-size:4rem;color:var(--gold);line-height:1}
details.faq{border-bottom:1px solid var(--line)}details.faq summary{cursor:pointer;padding:18px 0;font-size:1.2rem;list-style:none}details.faq summary::before{content:"§ ";color:var(--gold)}details.faq p{margin:0 0 18px;color:var(--m)}
.done{padding:20px}footer{background:var(--g2);color:#c7d1c9}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:1fr 1fr;z-index:50}.mbar a{padding:16px;text-align:center;text-decoration:none;font-family:'Avenir Next',sans-serif;font-weight:700}
@media(max-width:900px){.hero .w,.form{grid-template-columns:1fr}.icons{grid-template-columns:repeat(3,1fr)}.tl{grid-template-columns:1fr 1fr}.tl::before{display:none}header nav{display:none}.stamp{width:110px;height:110px;right:16px}.stamp b{font-size:1.7rem}}
@media(max-width:600px){.icons{grid-template-columns:1fr 1fr}.icons b{font-size:.85rem;overflow-wrap:anywhere}.tl{grid-template-columns:1fr}.tl b{font-size:1.5rem}.lr{grid-template-columns:90px 1fr;gap:12px;padding:16px}.lr img{width:90px;height:50px}.lr .p,.lr .btn{grid-column:2}.mbar{display:grid}.card .row{grid-template-columns:1fr}section{padding:56px 0}.top .w span:last-child{display:none}}
""" + OK_CSS
    rows = "".join(
        f'<div class="lr"><img src="{img(v["img"])}" alt="{esc(v["name"])}" loading="lazy"><div><h3>{esc(v["name"])}</h3><small>{esc(v["cat"])} · {esc(", ".join(v["specs"]))}</small></div>'
        f'<div class="p">ab {v["price"]} €<small class="sans">pro Tag</small></div><a class="btn bo" href="#anfrage" data-pick="{i}">Anfragen</a></div>'
        for i, v in enumerate(b["fleet"]))
    icons = "".join(f'<div>{ico(i)}<b>{t}</b></div>' for i, t in [("truck", "Vermietung"), ("wrench", "Werkstatt"), ("sparkle", "Fahrzeugpflege"),
                                                                     ("route", "Waschstraße"), ("shield", "Reifenservice"), ("briefcase", "Autohandel")])
    body = render("""
{{banner}}
<div class="top sans"><div class="w"><span>Familienunternehmen in Nürnberg-Mögeldorf · Mobil seit 1932</span><span>☎ <a href="{{tel}}">{{phone}}</a> · Mo–Fr 7–18 · Sa 8–13</span></div></div>
<header><div class="w"><a class="em" href="#top"><span class="seal sans">SEIT<b>1932</b>NBG</span><span><span class="n">Lösch</span><small class="sans">Autovermietung · Mögeldorf</small></span></a>
  <nav class="sans"><a href="#preise">Preise</a><a href="#geschichte">Geschichte</a><a href="#haus">Service</a><a href="#anfrage">Anfrage</a></nav><a class="btn bgold" href="#anfrage">Fahrzeug anfragen</a></div></header>
<main id="top">
<section class="hero" style="padding:0"><div class="w">
  <div><span class="ey">Familienbetrieb · Laufamholzstraße 118</span><h1>Seit 1932 in Mögeldorf.<br><i>Bereit für Ihre Fahrt.</i></h1>
    <p>Vom Kleinwagen bis zum 7,5-Tonner, vom 9-Sitzer bis zum Anhänger – gewartet in unserer eigenen Werkstatt.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:26px"><a class="btn bgold" href="#anfrage">Jetzt anfragen</a><a class="btn" style="border-color:var(--cr);color:var(--cr)" href="#preise">Preise ansehen</a></div></div>
  <div class="frame"><img src="{{hero}}" alt="Lösch-Transporter vor der Halle"></div></div>
  <div class="stamp sans"><div><b>4,8 ★</b>147 Google-<br>Bewertungen</div></div></section>

<section id="preise"><div class="w"><span class="ey">Preisliste</span><h2>Klare Preise, seit Generationen.</h2>
  <div class="ledger"><div class="lhead"><span>Fahrzeugklasse</span><span>Tagespreis</span></div>{{rows}}</div>
  <div class="coupon"><div><span class="ey">Wochenendtarif · online buchbar</span><div><b>ab 89 €</b> &nbsp;Freitag 17 Uhr bis Montag 7 Uhr · inklusive 500 km</div></div><a class="btn bg" href="#anfrage">Wochenende sichern</a></div>
  <p class="note sans">Ab dem 7. Tag günstigerer Tagespreis · 4-Stunden- und Nachttarif auf Anfrage.</p></div></section>

<section id="geschichte" style="background:var(--cr2)"><div class="w"><span class="ey">Unsere Geschichte</span><h2>Über 90 Jahre mobil.</h2>
  <div class="tl"><div><b>1932</b><p>Gründung als Familienbetrieb in Nürnberg-Mögeldorf.</p></div><div><b>Generationen</b><p>Vermietung, Werkstatt und Service wachsen zusammen.</p></div>
  <div><b>Heute</b><p>Pkw bis 7,5 t, Anhänger, Waschstraße und Reifenservice an einem Ort.</p></div><div><b>Morgen</b><p>Online anfragen, persönlich abholen – wie immer bei Lösch.</p></div></div></div></section>

<section id="haus" class="house"><div class="w"><span class="ey">Alles aus einer Hand</span><h2 style="color:var(--cr)">Ein Hof, sechs Leistungen.</h2><div class="icons">{{icons}}</div></div></section>

<section id="anfrage"><div class="w form">
  <div class="card" data-box><span class="ey">Anfrage</span><h2 style="margin-bottom:6px">Fahrzeug reservieren</h2>
    <form data-demo data-rent novalidate>{{fields}}<div class="est" data-out></div><button class="btn bg" type="submit">Anfrage senden</button></form>{{done}}</div>
  <div class="side"><span class="ey">Lösch Autovermietung GmbH</span><p style="font-size:1.2rem;margin:10px 0">{{street}}<br>{{zip}} {{city}}-Mögeldorf</p>
    <p><a href="{{tel}}" style="font-size:1.6rem;text-decoration:none">{{phone}}</a><br><a href="mailto:{{mail}}">{{mail}}</a></p><table>{{hours}}</table>
    <div class="rate">4,8 ★</div><div class="sans">147 Google-Bewertungen</div><p style="margin-top:20px"><a class="btn bgold" href="{{maps}}" target="_blank" rel="noopener">Anfahrt</a></p></div>
</div></section>
<section id="faq" style="padding-top:0"><div class="w">{{faq}}<p class="note sans">{{note}}</p></div></section>
</main>
{{foot}}
<nav class="mbar"><a href="{{tel}}" style="background:var(--gold);color:#1a1205">Anrufen</a><a href="#anfrage" style="background:var(--g);color:var(--cr)">Anfragen</a></nav>
""", banner=banner(b, "#14331f", "#f5efe2", "#b88a2e"), tel=tel(b), phone=esc(b["phone"]), hero=img("loesch-hof"), rows=rows, icons=icons,
        fields=rent_fields(b), done=done(b, btn_cls="btn bo"), street=esc(b["street"]), zip=b["zip"], city=b["city"], mail=esc(b["mail"]),
        hours=hours_rows(b), maps=maps(b), faq=faq_html(b), note=NOTE, foot=foot(b))
    return head(b, "Lösch Autovermietung – seit 1932 in Nürnberg-Mögeldorf", "#1d4732", css) + body + FORM_JS + RENT_JS + "</body></html>"


# ==========================================================================
# ES Autovermietung – Corporate: Umschalter Privat / Firmenkunden, Unfallersatz-Guide
# ==========================================================================
def d_es(b):
    css = BASE + """
:root{--n:#0a2d6b;--n2:#071f4a;--r:#d7263d;--bg:#ffffff;--s:#f3f6fb;--t:#0b1a33;--m:#56637a;--line:#dfe6f0}
body{margin:0;background:var(--bg);color:var(--t);font-family:'Segoe UI','Helvetica Neue',system-ui,sans-serif;font-size:17px;line-height:1.6}
header{border-bottom:1px solid var(--line);background:#fff;position:sticky;top:0;z-index:40}header .w{display:flex;align-items:center;justify-content:space-between;height:74px;gap:16px}
.lg{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:800;font-size:1.2rem}.lg i{width:44px;height:44px;border-radius:10px;background:var(--n);color:#fff;display:grid;place-items:center;font-style:normal;position:relative}
.lg i::after{content:"";position:absolute;right:-4px;bottom:-4px;width:14px;height:14px;background:var(--r);border-radius:3px}
.lg small{display:block;font-weight:500;color:var(--m);font-size:.75rem}
.sw{display:inline-flex;background:var(--s);border-radius:999px;padding:5px;border:1px solid var(--line)}
.sw button{border:0;background:none;padding:10px 18px;border-radius:999px;font:inherit;font-weight:700;cursor:pointer;color:var(--m)}
.sw button.on{background:var(--n);color:#fff}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 22px;border-radius:8px;font-weight:700;text-decoration:none;border:2px solid transparent;cursor:pointer;font:inherit;font-weight:700}
.bn{background:var(--n);color:#fff}.br{background:var(--r);color:#fff}.bo{border-color:var(--line);background:#fff;color:var(--t)}.btn svg{width:18px;height:18px}
.hero{background:linear-gradient(120deg,var(--n2),var(--n));color:#fff;overflow:hidden}
.hero .w{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;padding:60px 0}
.hero h1{font-size:clamp(2.4rem,5.4vw,4rem);line-height:1.05;margin:14px 0}
.hero p{opacity:.85;font-size:1.12rem;max-width:46ch}
.hero .kp{display:flex;gap:26px;margin-top:30px;flex-wrap:wrap}.hero .kp b{display:block;font-size:2rem}.hero .kp span{opacity:.75;font-size:.9rem}
.hero img{border-radius:16px;aspect-ratio:4/3;object-fit:cover;width:100%;box-shadow:0 30px 60px -30px #000}
[data-aud]{display:none}[data-aud].on{display:block}
section{padding:80px 0}
.ey{color:var(--r);font-weight:800;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase}
h2{font-size:clamp(2rem,4vw,2.9rem);line-height:1.1;margin:8px 0 26px}
.cls{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.cl{border:1px solid var(--line);border-radius:14px;padding:22px;background:#fff;transition:box-shadow .2s}.cl:hover{box-shadow:0 20px 40px -26px rgba(10,45,107,.5)}
.cl img{height:110px;width:100%;object-fit:contain;margin-bottom:12px}
.cl h3{margin:0}.cl small{color:var(--m)}.cl ul{padding-left:18px;color:var(--m);font-size:.92rem}
.guide{background:var(--s)}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;counter-reset:s}
.steps div{padding:26px;border-left:3px solid var(--line);position:relative}
.steps div::before{counter-increment:s;content:counter(s);display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--r);color:#fff;font-weight:800;margin-bottom:14px}
.steps h3{margin:0 0 6px}.steps p{margin:0;color:var(--m)}
.code{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;border-radius:16px;background:var(--n);color:#fff;padding:30px 34px}
.code .c{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.6rem;letter-spacing:.12em;background:rgba(255,255,255,.12);padding:10px 18px;border-radius:8px;border:1px dashed rgba(255,255,255,.5)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:30px}
.form{border:1px solid var(--line);border-radius:16px;padding:30px}
.form label{display:block;font-size:.8rem;font-weight:700;color:var(--m);margin:12px 0 6px}
.form input,.form select{width:100%;padding:12px;border:1px solid var(--line);border-radius:8px}
.form .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form .row>div:only-child{grid-column:1/-1}
.est{margin:16px 0;color:var(--n);font-weight:700}
.trust{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.trust div{background:var(--s);border-radius:14px;padding:22px}.trust b{font-size:1.8rem;color:var(--n);display:block}
details.faq{border:1px solid var(--line);border-radius:12px;padding:0 20px;margin-bottom:10px}details.faq summary{cursor:pointer;padding:16px 0;font-weight:700;list-style:none}details.faq p{margin:0 0 16px;color:var(--m)}
.done{padding:20px}footer{background:var(--n2);color:#b9c6dc}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:1fr 1fr;z-index:50}.mbar a{padding:16px;text-align:center;font-weight:700;text-decoration:none}
@media(max-width:900px){.hero .w,.two{grid-template-columns:1fr}.cls,.steps{grid-template-columns:1fr 1fr}.trust{grid-template-columns:1fr}header .sw{display:none}}
@media(max-width:600px){.cls,.steps{grid-template-columns:1fr}.mbar{display:grid}header .hb{display:none}.form .row{grid-template-columns:1fr}section{padding:56px 0}}
""" + OK_CSS
    cls = "".join(f'<div class="cl"><img src="{img(v["img"])}" alt="{esc(v["name"])}" loading="lazy"><h3>{esc(v["name"])}</h3><small>{esc(v["cat"])}</small>'
                  f'<ul>{"".join(f"<li>{esc(s)}</li>" for s in v["specs"])}</ul><a class="btn bo" href="#anfrage" data-pick="{i}">Anfragen</a></div>' for i, v in enumerate(b["fleet"]))
    body = render("""
{{banner}}
<header><div class="w"><a class="lg" href="#top"><i>ES</i><span>ES Autovermietung<small>Nürnberg · seit 1958</small></span></a>
  <div class="sw" id="sw"><button class="on" data-a="p" type="button">Privatkunden</button><button data-a="f" type="button">Firmenkunden</button></div>
  <a class="btn bn hb" href="{{tel}}">{{pi}}{{phone}}</a></div></header>
<main id="top">
<section class="hero" style="padding:0"><div class="w">
  <div><span class="ey" style="color:#ff8a98">Nürnbergs älteste Autovermietung · seit 1958</span>
    <div data-aud="p" class="on"><h1>Persönlich vermietet.<br>Seit 1958.</h1><p>Pkw, 9-Sitzer und Transporter in jeder Größe – kurzfristig verfügbar, mit echtem Ansprechpartner statt Callcenter.</p></div>
    <div data-aud="f"><h1>Ihr Mobilitätspartner<br>für das Unternehmen.</h1><p>Fuhrpark-Ergänzung, Projektfahrzeuge und Unfallersatz – mit festen Ansprechpartnern und flexiblen Laufzeiten.</p></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:26px"><a class="btn br" href="#anfrage">Fahrzeug anfragen</a><a class="btn bo" href="#unfall">Unfallersatz</a></div>
    <div class="kp"><div><b>1958</b><span>gegründet</span></div><div><b>4,8 ★</b><span>121 Google-Bewertungen</span></div><div><b>−10 %</b><span>auf die Erstmiete</span></div></div></div>
  <img src="{{hero}}" alt="Firmenkunde mit Mietwagen"></div></section>

<section id="flotte"><div class="w"><span class="ey">Fahrzeuge</span><h2>Für jeden Zweck das richtige Fahrzeug.</h2><div class="cls">{{cls}}</div></div></section>

<section id="unfall" class="guide"><div class="w"><span class="ey">Unfallersatz</span><h2>Unfall gehabt? So bleiben Sie mobil.</h2>
  <div class="steps"><div><h3>Anrufen</h3><p>Melden Sie sich unter {{phone}} – wir klären das Wichtigste sofort.</p></div><div><h3>Ersatzwagen</h3><p>Sie erhalten kurzfristig ein passendes Ersatzfahrzeug.</p></div>
  <div><h3>Abwicklung</h3><p>Wir unterstützen Sie bei der Abwicklung mit der Versicherung.</p></div><div><h3>Weiterfahren</h3><p>Sie bleiben mobil, bis Ihr Auto zurück ist.</p></div></div></div></section>

<section><div class="w"><div class="code"><div><span class="ey" style="color:#ff8a98">Neukunden-Vorteil</span><h3 style="margin:6px 0 0;font-size:1.6rem">10 % auf Ihre erste Miete</h3></div>
  <span class="c" id="code">WILLKOMMEN10</span><button class="btn br" type="button" id="cp">Code kopieren</button></div></div></section>

<section id="anfrage" style="padding-top:0"><div class="w two">
  <div class="form" data-box><span class="ey">Anfrage</span><h2 style="margin-bottom:4px">Verfügbarkeit prüfen</h2>
    <form data-demo data-rent novalidate>{{fields}}<div class="est" data-out></div><button class="btn br" type="submit">Anfrage senden</button></form>{{done}}</div>
  <div><div class="trust"><div><b>1958</b>gegründet in der Fürther Straße</div><div><b>4,8 ★</b>121 Google-Bewertungen</div><div><b>1:1</b>persönlicher Ansprechpartner</div></div>
    <div style="margin-top:20px;border:1px solid var(--line);border-radius:16px;padding:26px"><b>{{legal}}</b><br>{{street}}, {{zip}} {{city}}<br><a href="{{tel}}">{{phone}}</a> · <a href="mailto:{{mail}}">{{mail}}</a>
      <p style="margin-bottom:0"><a class="btn bo" href="{{maps}}" target="_blank" rel="noopener">Route planen</a></p></div></div>
</div></section>
<section id="faq" style="padding-top:0"><div class="w">{{faq}}<p class="note">{{note}}</p></div></section>
</main>
{{foot}}
<nav class="mbar"><a href="{{tel}}" style="background:var(--n);color:#fff">Anrufen</a><a href="#anfrage" style="background:var(--r);color:#fff">Anfragen</a></nav>
<script>
document.querySelectorAll('#sw button').forEach(function(x){x.addEventListener('click',function(){document.querySelectorAll('#sw button').forEach(function(y){y.classList.toggle('on',y===x)});
document.querySelectorAll('[data-aud]').forEach(function(d){d.classList.toggle('on',d.dataset.aud===x.dataset.a)})})});
document.getElementById('cp').addEventListener('click',function(){var t='WILLKOMMEN10',me=this;try{navigator.clipboard.writeText(t).then(function(){me.textContent='Kopiert ✓'},function(){me.textContent='Code: '+t})}catch(e){me.textContent='Code: '+t}});
</script>
""", banner=banner(b, "#071f4a", "#fff", "#ff8a98"), tel=tel(b), phone=esc(b["phone"]), pi=ico("phone"), hero=img("es-firmenkunden"), cls=cls,
        fields=rent_fields(b), done=done(b, btn_cls="btn bo"), legal=esc(b["legal"]), street=esc(b["street"]), zip=b["zip"], city=b["city"],
        mail=esc(b["mail"]), maps=maps(b), faq=faq_html(b), note=NOTE, foot=foot(b))
    return head(b, "ES Autovermietung – persönlich vermietet seit 1958", "#0a2d6b", css) + body + FORM_JS + RENT_JS + "</body></html>"


# ==========================================================================
# myonecar – App / Fintech: 0 € Kaution, Schlüssel-Code-Animation, Preis-Slider, Vergleich
# ==========================================================================
def d_myonecar(b):
    css = BASE + """
:root{--v:#5b3df5;--v2:#3d22d1;--l:#c6f432;--ink:#15122b;--m:#625f7c;--bg:#fbfaff;--s:#f1eefe;--line:#e4e0f7}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:17px;line-height:1.6}
header .w{display:flex;align-items:center;justify-content:space-between;height:72px}
.lg{font-weight:900;font-size:1.5rem;text-decoration:none;letter-spacing:-.03em}.lg b{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:var(--v);color:var(--l);margin-right:6px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:15px 26px;border-radius:999px;font-weight:800;text-decoration:none;border:0;cursor:pointer;font:inherit;font-weight:800}
.bv{background:var(--v);color:#fff}.bl{background:var(--l);color:var(--ink)}.bo{background:#fff;border:2px solid var(--line);color:var(--ink)}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;padding:40px 0 80px}
.hero .tag{display:inline-block;background:var(--l);padding:6px 14px;border-radius:999px;font-weight:800;font-size:.85rem}
.hero h1{font-size:clamp(3rem,8vw,6.2rem);line-height:.92;letter-spacing:-.05em;margin:18px 0}
.hero h1 span{color:var(--v)}
.hero p{color:var(--m);font-size:1.15rem;max-width:42ch}
.phone{width:300px;margin:0 auto;background:var(--ink);border-radius:46px;padding:14px;box-shadow:0 50px 80px -40px rgba(61,34,209,.7)}
.scr{background:linear-gradient(160deg,var(--v),var(--v2));border-radius:34px;min-height:540px;color:#fff;padding:30px 22px;display:flex;flex-direction:column}
.scr small{opacity:.75}.scr .code{display:flex;gap:10px;justify-content:center;margin:34px 0 20px}
.scr .code span{width:48px;height:62px;border-radius:14px;background:rgba(255,255,255,.14);display:grid;place-items:center;font-size:1.8rem;font-weight:900;animation:pop 4s infinite}
.scr .code span:nth-child(2){animation-delay:.3s}.scr .code span:nth-child(3){animation-delay:.6s}.scr .code span:nth-child(4){animation-delay:.9s}
@keyframes pop{0%,10%{background:rgba(255,255,255,.14)}20%,80%{background:var(--l);color:var(--ink)}100%{background:rgba(255,255,255,.14)}}
@media(prefers-reduced-motion:reduce){.scr .code span{animation:none;background:var(--l);color:var(--ink)}}
.scr .card{background:#fff;color:var(--ink);border-radius:20px;padding:16px;margin-top:auto}
.scr .card img{height:90px;width:100%;object-fit:contain}
.scr .ok{background:var(--l);color:var(--ink);border-radius:14px;padding:12px;text-align:center;font-weight:900;margin-top:12px}
.zero{background:var(--ink);color:#fff;border-radius:36px;padding:60px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.zero b{display:block;font-size:clamp(2.4rem,5vw,3.8rem);color:var(--l);line-height:1;letter-spacing:-.04em}.zero span{opacity:.8}
section{padding:80px 0}
h2{font-size:clamp(2.2rem,5vw,3.6rem);letter-spacing:-.04em;line-height:1;margin:0 0 30px}
.cars{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.car{background:#fff;border:2px solid var(--line);border-radius:30px;padding:24px;text-align:center}
.car img{height:150px;width:100%;object-fit:contain}.car h3{margin:10px 0 0;font-size:1.4rem}.car .c{color:var(--m)}
.car .p{font-size:2.4rem;font-weight:900;letter-spacing:-.04em;margin:10px 0}.car .p small{font-size:1rem;color:var(--m);font-weight:600}
.calc{background:var(--s);border-radius:36px;padding:44px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.calc input[type=range]{width:100%;accent-color:var(--v)}
.calc .tot{font-size:clamp(3rem,7vw,5rem);font-weight:900;letter-spacing:-.05em;color:var(--v);line-height:1}
.calc .seg{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 24px}.calc .seg label input{display:none}.calc .seg label span{display:inline-block;padding:10px 16px;border-radius:999px;background:#fff;border:2px solid var(--line);font-weight:800;cursor:pointer}
.calc .seg input:checked+span{background:var(--v);color:#fff;border-color:var(--v)}
table.cmp{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:2px solid var(--line);border-radius:26px;overflow:hidden}
.cmp th,.cmp td{padding:18px 22px;text-align:left;border-bottom:1px solid var(--line)}.cmp tr:last-child td{border-bottom:0}
.cmp th{background:var(--s)}.cmp td:nth-child(2){font-weight:800;color:var(--v)}.cmp td:nth-child(3){color:var(--m)}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.steps div{background:#fff;border:2px solid var(--line);border-radius:30px;padding:30px}.steps b{font-size:3.2rem;color:var(--v);letter-spacing:-.04em;display:block;line-height:1}
.form{background:#fff;border:2px solid var(--line);border-radius:36px;padding:36px;max-width:760px;margin:0 auto}
.form label{display:block;font-weight:800;font-size:.85rem;margin:12px 0 6px}.form input,.form select{width:100%;padding:14px 16px;border-radius:16px;border:2px solid var(--line);background:var(--bg)}
.form .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form .row>div:only-child{grid-column:1/-1}
.est{margin:16px 0;font-weight:900;color:var(--v);font-size:1.2rem}
details.faq{background:#fff;border:2px solid var(--line);border-radius:22px;padding:0 22px;margin-bottom:10px}details.faq summary{cursor:pointer;padding:18px 0;font-weight:800;list-style:none}details.faq p{margin:0 0 18px;color:var(--m)}
.done{text-align:center;padding:20px}footer{color:var(--m);border-top:1px solid var(--line)}
.fab{position:fixed;right:16px;bottom:16px;z-index:50;display:none}
@media(max-width:900px){.hero,.calc{grid-template-columns:1fr}.zero{grid-template-columns:1fr 1fr;padding:36px}.cars,.steps{grid-template-columns:1fr}}
@media(max-width:600px){.fab{display:inline-flex}.form .row{grid-template-columns:1fr}section{padding:56px 0}.cmp th,.cmp td{padding:12px;font-size:.9rem}.calc{padding:26px}}
""" + OK_CSS
    cars = "".join(f'<div class="car"><img src="{img(v["img"])}" alt="{esc(v["name"])}" loading="lazy"><h3>{esc(v["name"])}</h3><div class="c">{esc(v["cat"])}</div>'
                   f'<div class="p">{v["price"]} €<small> / Tag</small></div><a class="btn bo" href="#buchen" data-pick="{i}">Auswählen</a></div>' for i, v in enumerate(b["fleet"]))
    seg = "".join(f'<label><input type="radio" name="cc" value="{v["price"]}"{" checked" if i == 0 else ""}><span>{esc(v["name"])}</span></label>' for i, v in enumerate(b["fleet"]))
    body = render("""
{{banner}}
<header><div class="w"><a class="lg" href="#top"><b>1</b>myonecar</a><a class="btn bv" href="#buchen">Jetzt buchen</a></div></header>
<main id="top">
<section class="w hero"><div><span class="tag">ein auto. ein preis. einfach.</span><h1>0 € Kaution.<br><span>24/7</span> losfahren.</h1>
  <p>Online buchen, Code aufs Handy, Schlüssel aus der Keybox – in der Zeppelinstraße am Dutzendteich. 250 Freikilometer pro Tag inklusive.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:24px"><a class="btn bv" href="#buchen">Auto buchen →</a><a class="btn bo" href="#preis">Preis berechnen</a></div></div>
  <div class="phone"><div class="scr"><small>Deine Buchung · Nürnberg</small><b style="font-size:1.4rem">Keybox-Code</b>
    <div class="code"><span>4</span><span>8</span><span>1</span><span>7</span></div><small style="text-align:center">Beispiel – dein Code kommt nach der Buchung</small>
    <div class="card"><img src="{{car}}" alt="Dacia Sandero"><b>Dacia Sandero</b><div style="color:var(--m);font-size:.9rem">Zeppelinstraße · bereit</div><div class="ok">🔓 Auto ist entsperrt</div></div></div></div>
</section>
<div class="w"><div class="zero"><div><b>0 €</b><span>Kaution*</span></div><div><b>24/7</b><span>Abholung & Rückgabe</span></div><div><b>250 km</b><span>frei pro Tag</span></div><div><b>4,9 ★</b><span>150 Google-Bewertungen</span></div></div></div>
<section id="autos"><div class="w"><h2>Drei Autos.<br>Ein fester Preis.</h2><div class="cars">{{cars}}</div></div></section>
<section id="preis" style="padding-top:0"><div class="w"><div class="calc">
  <div><h2 style="margin-bottom:10px">Was kostet’s?</h2><div class="seg" id="seg">{{seg}}</div>
    <label for="days" style="font-weight:800">Mietdauer: <span id="dl">3 Tage</span></label><input id="days" type="range" min="1" max="14" value="3"></div>
  <div><div class="tot" id="tot">–</div><p style="color:var(--m);margin:10px 0 0" id="km">inkl. 750 Freikilometer · keine Kaution</p></div></div></div></section>
<section style="padding-top:0"><div class="w"><h2>Anders als die anderen.</h2>
  <table class="cmp"><tr><th></th><th>myonecar</th><th>klassische Vermietung</th></tr>
  <tr><td>Kaution</td><td>0 €*</td><td>häufig Kaution per Kreditkarte</td></tr><tr><td>Abholung</td><td>24/7 kontaktlos</td><td>nur zu Öffnungszeiten</td></tr>
  <tr><td>Junge Fahrer / Zusatzfahrer</td><td>ohne Aufpreis</td><td>oft mit Aufpreis</td></tr><tr><td>Preis</td><td>ein fester Preis</td><td>saisonabhängig</td></tr></table></div></section>
<section style="padding-top:0"><div class="w"><h2>So geht’s.</h2><div class="steps"><div><b>01</b><h3>Online buchen</h3><p>Auto und Zeitraum wählen, Mietpreis vorab zahlen.</p></div><div><b>02</b><h3>Code erhalten</h3><p>Der Keybox-Code kommt aufs Handy.</p></div><div><b>03</b><h3>Losfahren</h3><p>Schlüssel nehmen – das Auto steht in der Zeppelinstraße.</p></div></div></div></section>
<section id="buchen" style="padding-top:0"><div class="w"><div class="form" data-box><h2 style="margin-bottom:6px">Auto anfragen</h2>
  <form data-demo data-rent novalidate>{{fields}}<div class="est" data-out></div><button class="btn bv" type="submit">Anfrage senden →</button></form>{{done}}</div></div></section>
<section id="faq" style="padding-top:0"><div class="w">{{faq}}<p class="note">{{note}} Kaution entfällt bei Wohnsitz in Deutschland.</p>
  <p>Kontakt: <a href="{{tel}}">{{phone}}</a> · <a href="mailto:{{mail}}">{{mail}}</a> · {{street}}, Nürnberg</p></div></section>
</main>
{{foot}}
<a class="fab btn bv" href="#buchen">Jetzt buchen →</a>
<script>
(function(){var d=document.getElementById('days'),dl=document.getElementById('dl'),t=document.getElementById('tot'),k=document.getElementById('km');
function c(){var p=+document.querySelector('input[name=cc]:checked').value,n=+d.value;dl.textContent=n+(n==1?' Tag':' Tage');t.textContent=(p*n).toLocaleString('de-DE')+' €';k.textContent='inkl. '+(250*n).toLocaleString('de-DE')+' Freikilometer · keine Kaution*'}
d.addEventListener('input',c);document.querySelectorAll('input[name=cc]').forEach(function(r){r.addEventListener('change',c)});c();})();
</script>
""", banner=banner(b, "#15122b", "#fff", "#c6f432"), car=img("cut-myonecar-sandero"), cars=cars, seg=seg, fields=rent_fields(b),
        done=done(b, btn_cls="btn bo"), faq=faq_html(b), note=NOTE, tel=tel(b), phone=esc(b["phone"]), mail=esc(b["mail"]),
        street=esc(b["street"]), foot=foot(b))
    return head(b, "myonecar – Auto mieten ohne Kaution in Nürnberg", "#5b3df5", css) + body + FORM_JS + RENT_JS + "</body></html>"


# ==========================================================================
# Tesla Car Rent – Tech-minimal: Modell-Umschalter mit animierten Kennzahlen
# ==========================================================================
def d_tesla(b):
    css = BASE + """
:root{--t:#111;--m:#5c5e62;--bg:#fff;--s:#f4f4f4;--line:#e6e6e6;--blue:#3e6ae1}
body{margin:0;background:var(--bg);color:var(--t);font-family:'Helvetica Neue','Segoe UI',system-ui,sans-serif;font-size:17px;line-height:1.55;font-weight:400}
header{position:absolute;left:0;right:0;z-index:20}header .w{display:flex;justify-content:space-between;align-items:center;height:70px}
.lg{font-weight:600;letter-spacing:.32em;text-transform:uppercase;text-decoration:none;font-size:.95rem}
header nav{display:flex;gap:6px}header nav a{padding:8px 14px;border-radius:6px;text-decoration:none;font-size:.9rem;font-weight:500}header nav a:hover{background:rgba(0,0,0,.06)}
.hero{position:relative;min-height:94vh;display:flex;flex-direction:column;align-items:center;text-align:center;background:linear-gradient(#e9ecef,#fff 60%);overflow:hidden}
.hero .tx{padding-top:120px;position:relative;z-index:2}
.hero h1{font-size:clamp(2.6rem,6vw,4.4rem);font-weight:500;margin:0;letter-spacing:-.01em}
.hero p{color:var(--m);margin:8px 0 0}
.hero img{position:absolute;inset:auto 0 0 0;width:100%;height:68%;object-fit:cover;object-position:center 60%}
.hero .cta{position:absolute;bottom:56px;left:0;right:0;z-index:2;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:0 16px}
.btn{display:inline-flex;justify-content:center;min-width:240px;padding:12px 24px;border-radius:6px;font-weight:500;text-decoration:none;border:0;cursor:pointer;font:inherit;font-weight:500}
.bd{background:rgba(23,26,32,.85);color:#fff}.bw{background:rgba(244,244,244,.85);color:#111}.bb{background:var(--blue);color:#fff}
section{padding:90px 0}
h2{font-size:clamp(2rem,4.4vw,3rem);font-weight:500;margin:0 0 10px;letter-spacing:-.01em}
.sub{color:var(--m);margin:0 0 40px}
.mod{display:inline-flex;background:var(--s);border-radius:8px;padding:4px;margin-bottom:30px}
.mod button{border:0;background:none;padding:10px 22px;border-radius:6px;font:inherit;font-weight:500;cursor:pointer;color:var(--m)}.mod button.on{background:#fff;color:#111;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.vars{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.var{border:1px solid var(--line);border-radius:12px;overflow:hidden;cursor:pointer;transition:border-color .2s;background:#fff}
.var.on{border-color:#111;box-shadow:0 0 0 1px #111}
.var img{aspect-ratio:16/10;object-fit:cover;width:100%}.var .in{padding:18px}
.var h3{margin:0;font-weight:500;font-size:1.1rem}.var .p{color:var(--m)}
.specs{display:grid;grid-template-columns:repeat(4,1fr);text-align:center;margin:40px 0 0;border-top:1px solid var(--line);padding-top:30px}
.specs b{display:block;font-size:2.6rem;font-weight:500;letter-spacing:-.02em}.specs span{color:var(--m);font-size:.9rem}
.dark{background:#171a20;color:#fff}
.feat{display:grid;grid-template-columns:repeat(4,1fr);gap:30px}
.feat svg{width:30px;height:30px}.feat h3{font-weight:500;margin:14px 0 6px}.feat p{margin:0;color:#a8abb2}
.split{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.split img{border-radius:12px;aspect-ratio:4/3;object-fit:cover;width:100%}
.form{max-width:640px;margin:0 auto}.form label{display:block;font-size:.85rem;color:var(--m);margin:14px 0 6px}
.form input,.form select{width:100%;padding:13px 14px;border:1px solid var(--line);border-radius:6px;background:var(--s)}
.form .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.form .row>div:only-child{grid-column:1/-1}
.est{margin:18px 0;font-size:1.2rem}
.rt{display:flex;align-items:center;justify-content:center;gap:30px;flex-wrap:wrap;text-align:center}.rt b{font-size:4rem;font-weight:500}
details.faq{border-bottom:1px solid var(--line)}details.faq summary{cursor:pointer;padding:20px 0;list-style:none;font-weight:500}details.faq p{margin:0 0 20px;color:var(--m)}
.done{text-align:center;padding:20px}footer{color:var(--m);border-top:1px solid var(--line)}
.mbar{position:fixed;left:16px;right:16px;bottom:16px;display:none;z-index:50}
@media(max-width:900px){.vars,.feat{grid-template-columns:1fr 1fr}.split{grid-template-columns:1fr}header nav{display:none}}
@media(max-width:600px){.hero{min-height:86vh}.hero .tx{padding-top:96px;padding-inline:16px}.hero img{height:46%}.vars,.feat{grid-template-columns:1fr}.specs{grid-template-columns:1fr 1fr;gap:20px}.form .row{grid-template-columns:1fr}.mbar{display:flex}.mbar .btn{flex:1;min-width:0}section{padding:60px 0}.btn{min-width:0;flex:1}.hero .cta{bottom:30px}}
""" + OK_CSS
    specs = {"Model 3 Standard Range+": ("520", "6,1", "283"), "Model 3 Long Range AWD": ("660", "4,4", "497"), "Model 3 Performance": ("571", "3,1", "626"),
             "Model Y Long Range RWD": ("622", "5,6", "300"), "Model Y Long Range AWD": ("600", "4,8", "513"), "Model Y Performance": ("600", "3,5", "626")}
    vars_ = []
    for i, v in enumerate(b["fleet"]):
        r, a, ps = specs[v["name"]]
        m = "3" if "Model 3" in v["name"] else "Y"
        vars_.append(f'<div class="var" data-m="{m}" data-i="{i}" data-r="{r}" data-a="{a}" data-ps="{ps}" data-p="{v["price"]}"><img src="{img(v["img"])}" alt="{esc(v["name"])} – Symbolbild" loading="lazy">'
                     f'<div class="in"><h3>{esc(v["name"])}</h3><div class="p">ab {v["price"]} € / Tag</div></div></div>')
    feat = "".join(f'<div>{ico(i)}<h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for i, h, p in b["usps"][:4])
    body = render("""
{{banner}}
<div style="position:relative">
<header><div class="w"><a class="lg" href="#top">Tesla Car Rent</a><nav><a href="#modelle">Modelle</a><a href="#vorteile">Vorteile</a><a href="#buchen">Buchen</a><a href="{{tel}}">{{phone}}</a></nav></div></header>
<section class="hero" id="top" style="padding:0"><div class="tx"><h1>Tesla mieten in Erlangen</h1><p>Model 3 und Model Y · ab 45 € am Tag · 0 € Selbstbeteiligung</p></div>
  <img src="{{hero}}" alt="Tesla Model 3 – Symbolbild"><div class="cta"><a class="btn bd" href="#buchen">Jetzt anfragen</a><a class="btn bw" href="#modelle">Modelle ansehen</a></div></section>
</div>
<section id="modelle"><div class="w" style="text-align:center"><h2>Wählen Sie Ihr Modell</h2><p class="sub">Nur neueste Modelle – Model 3 Highland und Model Y Juniper.</p>
  <div class="mod" id="mod"><button class="on" data-m="3" type="button">Model 3</button><button data-m="Y" type="button">Model Y</button></div>
  <div class="vars" id="vars" style="text-align:left">{{vars}}</div>
  <div class="specs"><div><b id="sr">520</b><span>km Reichweite</span></div><div><b id="sa">6,1</b><span>s 0–100 km/h</span></div><div><b id="sp">283</b><span>PS</span></div><div><b id="spr">45 €</b><span>ab pro Tag</span></div></div></div></section>
<section id="vorteile" class="dark"><div class="w"><h2>Einfach elektrisch.</h2><p class="sub" style="color:#a8abb2">Was bei uns inklusive ist.</p><div class="feat">{{feat}}</div></div></section>
<section><div class="w split"><img src="{{img2}}" alt="Tesla an der Ladesäule – Symbolbild" loading="lazy">
  <div><h2>Persönliche Übergabe.</h2><p class="sub">Keine Keybox, kein Schalter: Sie bekommen den Tesla in der Hindenburgstraße persönlich übergeben – mit Einweisung in Bedienung, Laden und Reichweite.</p>
  <div class="rt" style="justify-content:flex-start"><div><b>4,9</b><div style="color:var(--m)">★★★★★ · 84 Bewertungen auf Trustpilot</div></div></div></div></div></section>
<section id="buchen" style="background:var(--s)"><div class="w"><div class="form" data-box><h2 style="text-align:center">Anfrage</h2><p class="sub" style="text-align:center">Unverbindlich – wir melden uns mit Verfügbarkeit.</p>
  <form data-demo data-rent novalidate>{{fields}}<div class="est" data-out></div><button class="btn bb" type="submit" style="width:100%">Anfrage senden</button></form>{{done}}</div></div></section>
<section id="faq"><div class="w" style="max-width:820px">{{faq}}<p style="margin-top:30px">{{legal}} · {{street}}, {{zip}} {{city}} · <a href="{{tel}}">{{phone}}</a> · <a href="mailto:{{mail}}">{{mail}}</a> · <a href="{{maps}}" target="_blank" rel="noopener">Route</a></p><p class="note">{{note}}</p></div></section>
{{foot}}
<div class="mbar"><a class="btn bb" href="#buchen">Tesla anfragen</a></div>
<script>
(function(){var vs=[].slice.call(document.querySelectorAll('.var'));
function anim(el,to){var dec=to.indexOf(',')>-1,t=parseFloat(to.replace(',','.')),f=parseFloat((el.textContent||'0').replace(',','.'))||0,s=null;
 function st(ts){if(!s)s=ts;var k=Math.min(1,(ts-s)/500),v=f+(t-f)*k;el.textContent=dec?v.toFixed(1).replace('.',','):Math.round(v);if(k<1)requestAnimationFrame(st)}requestAnimationFrame(st)}
function pick(v){vs.forEach(function(x){x.classList.toggle('on',x===v)});anim(document.getElementById('sr'),v.dataset.r);anim(document.getElementById('sa'),v.dataset.a);anim(document.getElementById('sp'),v.dataset.ps);
 document.getElementById('spr').textContent=v.dataset.p+' €';var s=document.querySelector('form[data-rent] [name=v]');if(s){s.value=v.dataset.i;s.dispatchEvent(new Event('change'))}}
function show(m){vs.forEach(function(x){x.style.display=x.dataset.m===m?'':'none'});pick(vs.filter(function(x){return x.dataset.m===m})[0])}
document.querySelectorAll('#mod button').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('#mod button').forEach(function(y){y.classList.toggle('on',y===btn)});show(btn.dataset.m)})});
vs.forEach(function(v){v.addEventListener('click',function(){pick(v)})});show('3');})();
</script>
""", banner=banner(b, "#171a20", "#fff", "#3e6ae1"), tel=tel(b), phone=esc(b["phone"]), hero=img("tes3"), vars="".join(vars_), feat=feat,
        img2=img("tes2"), fields=rent_fields(b), done=done(b, btn_cls="btn bw"), faq=faq_html(b), legal=esc(b["legal"]), street=esc(b["street"]),
        zip=b["zip"], city=b["city"], mail=esc(b["mail"]), maps=maps(b), note=NOTE, foot=foot(b))
    return head(b, "Tesla Car Rent – Tesla mieten in Erlangen", "#171a20", css) + body + FORM_JS + RENT_JS + "</body></html>"


# ==========================================================================
# Geomobil Graupner – Nachbarschaft: Lage-Karte, „Nachbar statt Konzern“, großer Telefon-Knopf
# ==========================================================================
def d_graupner(b):
    css = BASE + """
:root{--o:#ea580c;--o2:#c2410c;--sl:#1f2a33;--bg:#fffaf5;--s:#fff1e6;--t:#1f2a33;--m:#5e6a74;--line:#f1dcc9}
body{margin:0;background:var(--bg);color:var(--t);font-family:'Trebuchet MS','Segoe UI',system-ui,sans-serif;font-size:17px;line-height:1.6}
header .w{display:flex;align-items:center;justify-content:space-between;height:74px}
.lg{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:1.25rem}.lg i{width:42px;height:42px;border-radius:50% 50% 50% 0;background:var(--o);color:#fff;display:grid;place-items:center;font-style:normal;transform:rotate(-45deg)}
.lg i span{transform:rotate(45deg)}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 24px;border-radius:14px;font-weight:800;text-decoration:none;border:0;cursor:pointer;font:inherit;font-weight:800}
.bo{background:var(--o);color:#fff}.bs{background:var(--sl);color:#fff}.bl{background:#fff;color:var(--t);border:2px solid var(--line)}.btn svg{width:20px;height:20px}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:40px 0 70px}
.hero h1{font-size:clamp(2.6rem,6vw,4.6rem);line-height:1;margin:0 0 18px;letter-spacing:-.02em}
.hero h1 span{color:var(--o)}
.hero p{color:var(--m);font-size:1.15rem}
.map{position:relative;aspect-ratio:1;border-radius:32px;background:
 linear-gradient(90deg,transparent 48%,#fff 48%,#fff 52%,transparent 52%),
 linear-gradient(0deg,transparent 30%,#fff 30%,#fff 34%,transparent 34%),
 linear-gradient(35deg,transparent 60%,#ffd9bf 60%,#ffd9bf 66%,transparent 66%),
 repeating-linear-gradient(0deg,#ffe8d6 0 38px,#ffedde 38px 76px);border:2px solid var(--line);overflow:hidden}
.map .pin{position:absolute;left:50%;top:42%;transform:translate(-50%,-100%);text-align:center}
.map .pin i{display:block;width:54px;height:54px;margin:0 auto;border-radius:50% 50% 50% 0;background:var(--o);transform:rotate(-45deg);box-shadow:0 10px 20px -6px var(--o2)}
.map .pin b{display:inline-block;background:#fff;padding:8px 14px;border-radius:12px;margin-top:10px;box-shadow:0 10px 30px -14px rgba(0,0,0,.4)}
.map .tag{position:absolute;background:var(--sl);color:#fff;font-size:.8rem;font-weight:800;padding:6px 10px;border-radius:8px}
.big{display:flex;align-items:center;gap:16px;background:var(--sl);color:#fff;border-radius:22px;padding:22px 26px;text-decoration:none;margin-top:26px;max-width:460px}
.big i{width:56px;height:56px;border-radius:50%;background:var(--o);display:grid;place-items:center;font-style:normal}.big i svg{width:28px;height:28px}
.big small{display:block;opacity:.7}.big b{font-size:1.7rem}
section{padding:80px 0}
h2{font-size:clamp(2rem,4.4vw,3rem);line-height:1.05;margin:0 0 30px;letter-spacing:-.02em}
.vs{display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:28px;overflow:hidden;border:2px solid var(--line)}
.vs div{padding:34px}.vs .a{background:var(--o);color:#fff}.vs .b{background:#fff}
.vs h3{margin:0 0 14px;font-size:1.4rem}.vs li{margin:8px 0}.vs ul{padding-left:20px;margin:0}
.cars{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.car{background:#fff;border-radius:26px;overflow:hidden;border:2px solid var(--line)}
.car img{aspect-ratio:4/3;object-fit:cover;width:100%}.car .in{padding:22px}.car h3{margin:0}.car p{color:var(--m);margin:6px 0 16px}
.near{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.near div{background:var(--s);border-radius:20px;padding:22px}.near b{display:block;font-size:1.3rem;color:var(--o2)}
.form{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:start}
.card{background:#fff;border:2px solid var(--line);border-radius:28px;padding:30px}
.card label{display:block;font-weight:800;font-size:.85rem;margin:12px 0 6px}.card input,.card select{width:100%;padding:13px;border-radius:12px;border:2px solid var(--line);background:var(--bg)}
.card .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card .row>div:only-child{grid-column:1/-1}
.est{margin:16px 0;font-weight:800;color:var(--o2)}
details.faq{border-bottom:2px solid var(--line)}details.faq summary{cursor:pointer;padding:18px 0;font-weight:800;list-style:none}details.faq p{margin:0 0 18px;color:var(--m)}
.done{padding:20px}footer{color:var(--m);border-top:2px solid var(--line)}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;z-index:50;background:var(--o);color:#fff;text-align:center;padding:16px;font-weight:800;text-decoration:none}
@media(max-width:900px){.hero,.form,.vs{grid-template-columns:1fr}.cars{grid-template-columns:1fr}.near{grid-template-columns:1fr 1fr}.map{max-width:420px;margin:0 auto;width:100%}}
@media(max-width:600px){.mbar{display:block}header .btn{display:none}.card .row{grid-template-columns:1fr}section{padding:56px 0}}
""" + OK_CSS
    cars = "".join(f'<div class="car"><img src="{img(v["img"])}" alt="{esc(v["name"])} – Symbolbild" loading="lazy"><div class="in"><h3>{esc(v["name"])}</h3>'
                   f'<p>{esc(v["cat"])} · {esc(", ".join(v["specs"]))}</p><a class="btn bl" href="#anfrage" data-pick="{i}">Anfragen</a></div></div>' for i, v in enumerate(b["fleet"]))
    body = render("""
{{banner}}
<header><div class="w"><a class="lg" href="#top"><i><span>G</span></i>Geomobil Graupner</a><a class="btn bo" href="{{tel}}">{{pi}}{{phone}}</a></div></header>
<main id="top">
<section class="w hero"><div><span style="color:var(--o2);font-weight:800">Ihre Autovermietung in Erlangen-Bruck</span><h1>Mieten beim <span>Nachbarn.</span><br>Nicht beim Konzern.</h1>
  <p>Pkw und Transporter direkt in der Äußeren Tennenloher Straße – persönlich beraten, kurze Wege, faire Konditionen.</p>
  <a class="big" href="{{tel}}"><i>{{pi}}</i><span><small>Einfach anrufen</small><b>{{phone}}</b></span></a></div>
  <div class="map" aria-hidden="true"><span class="tag" style="left:8%;top:12%">A73</span><span class="tag" style="right:10%;bottom:16%">Bahnhof Bruck</span><span class="tag" style="left:12%;bottom:22%">Siemens</span>
    <div class="pin"><i></i><b>Äußere Tennenloher Str. 13</b></div></div>
</section>
<section style="padding-top:0"><div class="w"><h2>Nachbar statt Konzern.</h2><div class="vs">
  <div class="a"><h3>Bei Geomobil Graupner</h3><ul><li>Fester Ansprechpartner vor Ort</li><li>Kurze Wege in Erlangen-Bruck</li><li>Schnelle, persönliche Zusage</li><li>Faire, transparente Konditionen</li></ul></div>
  <div class="b"><h3>Bei großen Ketten</h3><ul><li>Oft Hotline statt Ansprechpartner</li><li>Wechselnde Gesichter am Schalter</li><li>Standardprozesse</li><li>Entscheidungen aus der Zentrale</li></ul></div></div></div></section>
<section id="fahrzeuge" style="padding-top:0"><div class="w"><h2>Unsere Fahrzeuge</h2><div class="cars">{{cars}}</div></div></section>
<section style="padding-top:0"><div class="w"><h2>Gleich um die Ecke.</h2><div class="near"><div><b>A73</b>in wenigen Minuten</div><div><b>Bahnhof Bruck</b>gut erreichbar</div><div><b>Siemens</b>Standorte in der Nähe</div><div><b>Uni-Klinikum</b>schnell in der Innenstadt</div></div></div></section>
<section id="anfrage" style="padding-top:0"><div class="w form">
  <div class="card" data-box><h2 style="margin-bottom:6px">Fahrzeug anfragen</h2><form data-demo data-rent novalidate>{{fields}}<div class="est" data-out></div><button class="btn bo" type="submit">Anfrage senden</button></form>{{done}}</div>
  <div class="card" style="background:var(--sl);color:#fff;border-color:var(--sl)"><h3 style="margin-top:0">{{legal}}</h3><p>{{street}}<br>{{zip}} {{city}}-Bruck</p>
    <p><a href="{{tel}}" style="font-size:1.6rem;font-weight:800;text-decoration:none">{{phone}}</a></p><table style="width:100%;border-collapse:collapse">{{hours}}</table>
    <p><a class="btn bo" href="{{maps}}" target="_blank" rel="noopener">Route planen</a></p></div>
</div></section>
<section id="faq" style="padding-top:0"><div class="w">{{faq}}<p class="note">* {{note}} Fahrzeuge, Preise und Öffnungszeiten sind Platzhalter.</p></div></section>
</main>
{{foot}}
<a class="mbar" href="{{tel}}">📞 {{phone}} anrufen</a>
""", banner=banner(b, "#1f2a33", "#fff", "#fb923c"), tel=tel(b), phone=esc(b["phone"]), pi=ico("phone"), cars=cars, fields=rent_fields(b),
        done=done(b, btn_cls="btn bl"), legal=esc(b["legal"]), street=esc(b["street"]), zip=b["zip"], city=b["city"], hours=hours_rows(b),
        maps=maps(b), faq=faq_html(b), note=NOTE, foot=foot(b))
    return head(b, "Geomobil Graupner – Autovermietung in Erlangen-Bruck", "#ea580c", css) + body + FORM_JS + RENT_JS + "</body></html>"


# ==========================================================================
# MS Car – Transporter / Bau-Look: Warnband, Stempel „Ohne Kaution“, Umzugs-Berater
# ==========================================================================
def d_mscar(b):
    css = BASE + """
:root{--d:#0b1f2a;--d2:#102a38;--tq:#2ec4b6;--y:#ffd23f;--t:#eef6f7;--m:#9cb4bd;--line:#1f4352}
body{margin:0;background:var(--d);color:var(--t);font-family:'Arial Black','Segoe UI Black','Helvetica Neue',system-ui,sans-serif;font-size:16px;line-height:1.55}
.reg{font-family:'Segoe UI','Helvetica Neue',system-ui,sans-serif;font-weight:400}
.tape{height:18px;background:repeating-linear-gradient(-45deg,var(--y) 0 18px,#111 18px 36px)}
header .w{display:flex;align-items:center;justify-content:space-between;height:76px}
.lg{text-decoration:none;font-size:1.4rem;letter-spacing:.02em}.lg span{color:var(--tq)}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 24px;font-weight:900;text-decoration:none;border:0;cursor:pointer;font:inherit;text-transform:uppercase;letter-spacing:.03em;border-radius:6px}
.bt{background:var(--tq);color:#062027}.by{background:var(--y);color:#111}.bo{background:transparent;color:var(--t);border:2px solid var(--line)}.btn svg{width:20px;height:20px}
.hero{position:relative;overflow:hidden}
.hero .w{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center;padding:50px 0 80px}
.hero h1{font-size:clamp(3rem,8vw,6.4rem);line-height:.9;margin:0;text-transform:uppercase}
.hero h1 span{color:var(--y)}
.hero p{color:var(--m);font-size:1.15rem;max-width:44ch}
.hero .ph{position:relative}.hero .ph img{border-radius:10px;aspect-ratio:4/3;object-fit:cover;width:100%}
.stamp{position:absolute;left:-26px;top:-26px;width:150px;height:150px;border-radius:50%;border:5px solid var(--y);color:var(--y);display:grid;place-items:center;text-align:center;transform:rotate(-14deg);background:rgba(11,31,42,.85);font-size:1.15rem;line-height:1.05;text-transform:uppercase}
.stamp b{display:block;font-size:2.4rem}
section{padding:80px 0}
h2{font-size:clamp(2.2rem,5vw,3.6rem);line-height:.95;margin:0 0 30px;text-transform:uppercase}h2 span{color:var(--tq)}
.adv{background:var(--y);color:#111}
.adv h2 span{color:#111;background:#fff;padding:0 8px}
.wiz{background:var(--d2);border:2px solid var(--line);border-radius:14px;padding:34px;display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.opts button{background:var(--d);border:2px solid var(--line);color:var(--t);padding:16px;border-radius:10px;font:inherit;cursor:pointer;text-align:left}
.opts button.on{border-color:var(--tq);background:#0f3640}
.opts small{display:block;color:var(--m);font-family:'Segoe UI',sans-serif;font-weight:400}
.res{background:var(--d);border-radius:12px;padding:26px;border:2px dashed var(--tq)}
.res b{display:block;font-size:2rem;color:var(--tq);text-transform:uppercase;line-height:1}
.res .vol{height:16px;background:var(--line);border-radius:8px;margin:16px 0;overflow:hidden}.res .vol i{display:block;height:100%;background:var(--y);transition:width .4s}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.cd{background:var(--d2);border:2px solid var(--line);border-radius:12px;overflow:hidden}.cd img{aspect-ratio:16/10;object-fit:cover;width:100%}
.cd .in{padding:20px}.cd h3{margin:0;text-transform:uppercase}.cd .c{color:var(--tq);font-size:.85rem}.cd ul{color:var(--m);padding-left:18px}
.lt{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:2px solid #111}.lt div{padding:30px;border-right:2px solid #111}.lt div:last-child{border-right:0}
.lt b{display:block;font-size:1.6rem;text-transform:uppercase}
.form{display:grid;grid-template-columns:1.1fr .9fr;gap:30px}
.card{background:var(--d2);border:2px solid var(--line);border-radius:12px;padding:30px}
.card label{display:block;font-size:.75rem;text-transform:uppercase;letter-spacing:.1em;color:var(--m);margin:12px 0 6px}
.card input,.card select{width:100%;padding:13px;border-radius:8px;border:2px solid var(--line);background:var(--d);color:var(--t)}
.card .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card .row>div:only-child{grid-column:1/-1}
.est{margin:16px 0;color:var(--y)}
details.faq{border-bottom:2px solid var(--line)}details.faq summary{cursor:pointer;padding:18px 0;list-style:none;text-transform:uppercase}details.faq p{margin:0 0 18px;color:var(--m)}
.done{padding:20px}footer{color:var(--m);border-top:2px solid var(--line)}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:1fr 1fr;z-index:50}.mbar a{padding:16px;text-align:center;text-decoration:none;text-transform:uppercase}
@media(max-width:900px){.hero .w,.wiz,.form{grid-template-columns:1fr}.cards,.lt{grid-template-columns:1fr}.lt div{border-right:0;border-bottom:2px solid #111}.stamp{left:10px;top:10px;width:110px;height:110px;font-size:.9rem}.stamp b{font-size:1.7rem}}
@media(max-width:600px){.mbar{display:grid}header .btn{display:none}.card .row,.opts{grid-template-columns:1fr}section{padding:56px 0}}
""" + OK_CSS
    cards = "".join(f'<div class="cd"><img src="{img(v["img"])}" alt="{esc(v["name"])} – Symbolbild" loading="lazy"><div class="in"><h3>{esc(v["name"])}</h3><div class="c">{esc(v["cat"])}</div>'
                    f'<ul class="reg">{"".join(f"<li>{esc(s)}</li>" for s in v["specs"])}</ul><a class="btn bo" href="#anfrage" data-pick="{i}">Anfragen</a></div></div>' for i, v in enumerate(b["fleet"]))
    body = render("""
{{banner}}
<div class="tape"></div>
<header><div class="w"><a class="lg" href="#top">MS<span>CAR</span> <span class="reg" style="color:var(--m);font-size:.85rem">Autovermietung Erlangen</span></a><a class="btn bt" href="{{tel}}">{{pi}}{{phone}}</a></div></header>
<main id="top">
<section class="hero" style="padding:0"><div class="w"><div><span class="reg" style="color:var(--tq);font-weight:700;text-transform:uppercase;letter-spacing:.12em">Transporter mieten in Erlangen</span>
  <h1>Ohne Kaution.<br><span>Ohne Stress.</span></h1><p class="reg">Für den Umzug am Samstag oder das Projekt über drei Monate – Transporter direkt in der Möhrendorfer Straße 51.</p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:26px"><a class="btn by" href="#berater">Welcher Transporter passt?</a><a class="btn bo" href="#anfrage">Direkt anfragen</a></div></div>
  <div class="ph"><img src="{{hero}}" alt="Transporter – Symbolbild"><div class="stamp"><div><b>0 €</b>Kaution</div></div></div></div></section>
<div class="tape"></div>
<section id="berater"><div class="w"><h2>Umzugs-<span>Berater</span></h2><div class="wiz">
  <div><p class="reg" style="color:var(--m);margin-top:0">Was wollen Sie transportieren?</p><div class="opts" id="opts">
    <button type="button" data-v="0" data-w="25" data-r="Kastenwagen">WG-Zimmer<small>einige Kartons, kleine Möbel</small></button>
    <button type="button" data-v="1" data-w="55" data-r="Transporter">1–2 Zimmer<small>Bett, Schrank, Waschmaschine</small></button>
    <button type="button" data-v="2" data-w="90" data-r="Transporter (groß)">3 Zimmer+<small>komplette Wohnung</small></button>
    <button type="button" data-v="3" data-w="70" data-r="Langzeitmiete">Gewerbe / Projekt<small>über Wochen oder Monate</small></button></div></div>
  <div class="res"><span class="reg" style="color:var(--m)">Unsere Empfehlung</span><b id="rec">Bitte wählen</b><div class="vol"><i id="vol" style="width:0"></i></div>
    <p class="reg" id="rtx" style="color:var(--m);margin:0 0 16px">Klicken Sie links auf Ihr Vorhaben.</p><a class="btn bt" href="#anfrage">Dafür anfragen →</a></div></div></div></section>
<section class="adv"><div class="w"><h2>Drei Gründe <span>für MS Car</span></h2><div class="lt">
  <div><b>Keine Kaution</b><span class="reg">Kein geblockter Betrag, keine Kreditkarte nötig.</span></div><div><b>Tag oder Monate</b><span class="reg">Tagesmiete und Langzeitmiete ohne Leasingvertrag.</span></div><div><b>Mitten in Erlangen</b><span class="reg">Schnell erreichbar aus Innenstadt, Büchenbach und Möhrendorf.</span></div></div></div></section>
<section id="fahrzeuge"><div class="w"><h2>Die <span>Fahrzeuge</span></h2><div class="cards">{{cards}}</div></div></section>
<section id="anfrage" style="padding-top:0"><div class="w form">
  <div class="card" data-box><h2 style="font-size:2rem;margin-bottom:6px">Anfrage</h2><form data-demo data-rent novalidate class="reg">{{fields}}<div class="est" data-out></div><button class="btn bt" type="submit">Anfrage senden</button></form>{{done}}</div>
  <div class="card"><h3 style="margin-top:0;text-transform:uppercase">{{legal}}</h3><p class="reg">{{street}}<br>{{zip}} {{city}}</p><p><a href="{{tel}}" style="color:var(--y);font-size:1.6rem;text-decoration:none">{{phone}}</a></p>
    <table class="reg" style="width:100%;border-collapse:collapse">{{hours}}</table><p><a class="btn bo" href="{{maps}}" target="_blank" rel="noopener">Route planen</a></p></div>
</div></section>
<section id="faq" style="padding-top:0"><div class="w reg">{{faq}}<p class="note">* {{note}}</p></div></section>
</main>
{{foot}}
<nav class="mbar"><a href="{{tel}}" style="background:var(--y);color:#111">Anrufen</a><a href="#anfrage" style="background:var(--tq);color:#062027">Anfragen</a></nav>
<script>
document.querySelectorAll('#opts button').forEach(function(x){x.addEventListener('click',function(){document.querySelectorAll('#opts button').forEach(function(y){y.classList.toggle('on',y===x)});
document.getElementById('rec').textContent=x.dataset.r;document.getElementById('vol').style.width=x.dataset.w+'%';
document.getElementById('rtx').textContent=x.dataset.v==='3'?'Fester Monatspreis, ohne Kaution – ideal für Handwerk und Projekte.':'Mit Führerschein Klasse B fahrbar (bis 3,5 t) – ohne Kaution.';
var s=document.querySelector('form[data-rent] [name=v]');if(s){s.value={0:2,1:0,2:0,3:1}[x.dataset.v];s.dispatchEvent(new Event('change'))}})});
</script>
""", banner=banner(b, "#06141b", "#fff", "#ffd23f"), tel=tel(b), phone=esc(b["phone"]), pi=ico("phone"), hero=img("van1"), cards=cards,
        fields=rent_fields(b), done=done(b, btn_cls="btn bo"), legal=esc(b["legal"]), street=esc(b["street"]), zip=b["zip"], city=b["city"],
        hours=hours_rows(b), maps=maps(b), faq=faq_html(b), note=NOTE, foot=foot(b))
    return head(b, "MS Car – Transporter mieten in Erlangen ohne Kaution", "#0b1f2a", css) + body + FORM_JS + RENT_JS + "</body></html>"


DESIGNS = {
    "map-rent-nuernberg": d_map,
    "loesch-autovermietung-nuernberg": d_loesch,
    "es-autovermietung-nuernberg": d_es,
    "myonecar-nuernberg": d_myonecar,
    "tesla-car-rent-erlangen": d_tesla,
    "geomobil-graupner-erlangen": d_graupner,
    "ms-car-erlangen": d_mscar,
}


def main():
    for inline in (False, True):
        gen.INLINE = inline
        for slug, fn in DESIGNS.items():
            html_ = fn(B[slug])
            if inline:
                html_ = html_.replace(' loading="lazy"', "")
                path = os.path.join(OUT, "einzeldateien", slug + ".html")
            else:
                path = os.path.join(OUT, slug, "index.html")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(html_)
    print(f"{len(DESIGNS)} individuelle Vermieter-Designs erzeugt")


if __name__ == "__main__":
    main()
