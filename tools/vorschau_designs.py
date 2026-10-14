#!/usr/bin/env python3
"""Individuelle Vorschau-Designs für die fünf Erlanger Betriebe.

Jeder Betrieb bekommt ein eigenes Layout-Konzept (keine gemeinsame Vorlage).
Inhalte kommen aus vorschau_lokal.BETRIEBE, Fotos aus vorschau/img (Unsplash).
Aufruf:  python3 tools/vorschau_designs.py
"""
import os
import re

import vorschau_generator as g
from vorschau_generator import AGENCY, esc, ico, intl
from vorschau_lokal import BETRIEBE

OUT = g.OUT
B = {b["slug"]: b for b in BETRIEBE}


def render(tpl, **kw):
    """Einfaches {{name}}-Templating, damit CSS-Klammern unangetastet bleiben."""
    def rep(m):
        return str(kw[m.group(1)])
    return re.sub(r"\{\{(\w+)\}\}", rep, tpl)


def img(name):
    return g.img_src(name)


def tel(b):
    return "tel:+" + intl(b["phone"])


def maps(b):
    return "https://www.google.com/maps/search/?api=1&query=" + re.sub(r"\s+", "+", f'{b["legal"]} {b["street"]} {b["zip"]} {b["city"]}')


def banner(b, bg="#111", fg="#fff", acc="#ffd166"):
    link = f'https://wa.me/{AGENCY["wa"]}?text=' + re.sub(" ", "%20", f'Hallo, ich habe die Website-Vorschau für {b["name"]} gesehen und möchte mehr wissen.')
    return (f'<div id="pv" style="background:{bg};color:{fg};font:14px/1.4 system-ui,sans-serif;position:relative;z-index:99">'
            f'<div style="max-width:1160px;margin:0 auto;padding:9px 16px;display:flex;gap:10px 16px;align-items:center;justify-content:space-between;flex-wrap:wrap">'
            f'<span><b style="color:{acc}">Vorschau</b> · Unverbindlicher Entwurf von {AGENCY["name"]} für {esc(b["name"])} – keine offizielle Website.</span>'
            f'<span style="display:flex;gap:8px;align-items:center"><a href="{link}" target="_blank" rel="noopener" style="background:{acc};color:#111;text-decoration:none;font-weight:700;padding:6px 12px;border-radius:999px">Jetzt übernehmen</a>'
            f'<button aria-label="Hinweis schließen" onclick="document.getElementById(\'pv\').remove()" style="background:none;border:0;color:{fg};font-size:20px;cursor:pointer;line-height:1">×</button></span></div></div>')


def head(b, title, theme_color, css):
    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="{theme_color}">
<title>{esc(title)}</title>
<meta name="description" content="{esc(b["lead"])}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='{theme_color.replace("#", "%23")}'/%3E%3C/svg%3E">
<style>{css}</style>
</head>
<body>
'''


NOTE = ("Angaben in dieser Vorschau stammen aus öffentlich verfügbaren Quellen (Stand 10/2026) und werden vor dem Livegang "
        "gemeinsam mit Ihnen geprüft und ergänzt. Fotos: Unsplash (Symbolbilder).")


def agency_links(color="inherit"):
    s = f'style="color:{color}"'
    return (f'Entwurf: <a {s} href="{AGENCY["url"]}" target="_blank" rel="noopener">{AGENCY["name"]}</a> · '
            f'<a {s} href="{AGENCY["url"]}/impressum.html" target="_blank" rel="noopener">Impressum</a> · '
            f'<a {s} href="{AGENCY["url"]}/datenschutz.html" target="_blank" rel="noopener">Datenschutz</a>')


FORM_JS = """
<script>
document.querySelectorAll('form[data-demo]').forEach(function(f){
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var bad=[].slice.call(f.querySelectorAll('[required]')).filter(function(i){return !i.value.trim()})[0];
    if(bad){bad.focus();return}
    f.closest('[data-box]').classList.add('sent');
  });
});
document.querySelectorAll('[data-again]').forEach(function(a){a.addEventListener('click',function(){a.closest('[data-box]').classList.remove('sent')})});
document.querySelectorAll('input[type=date]').forEach(function(d){d.min=new Date().toISOString().slice(0,10)});
</script>
"""

OK_CSS = "[data-box] .done{display:none}[data-box].sent form{display:none}[data-box].sent .done{display:block}"


def hours_rows(b, cls=""):
    return "".join(f'<tr><td>{esc(d)}</td><td class="{cls}">{esc(h)}</td></tr>' for d, h in b["hours"])


def faq_html(b, cls="faq"):
    return "".join(f'<details class="{cls}"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in b["faq"])


def options(b):
    return "".join(f'<option>{esc(v["name"])}</option>' for v in b["items"])


# ==========================================================================
# 1) Elektro Schröpf – technisch / industriell
# ==========================================================================
def d_schroepf(b):
    css = """
:root{--ink:#0a1324;--navy:#0f2747;--navy2:#16355e;--y:#ffc400;--steel:#eef1f5;--line:#d6dce5;--mut:#5a6578}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:Bahnschrift,'DIN Alternate','Roboto Condensed','Arial Narrow',system-ui,sans-serif;color:var(--ink);background:#fff;font-size:17px;line-height:1.55}
a{color:inherit}img{display:block;max-width:100%}
.w{width:min(1180px,100% - 32px);margin:0 auto}
.up{text-transform:uppercase;letter-spacing:.08em}
.alert{background:var(--y);color:#111;font-weight:700;font-size:.92rem}
.alert .w{display:flex;justify-content:space-between;gap:10px;padding:8px 0;flex-wrap:wrap}
.alert a{text-decoration:none}
header{background:var(--navy);color:#fff;position:sticky;top:0;z-index:40}
header .w{display:flex;align-items:center;justify-content:space-between;height:72px;gap:16px}
.logo{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:800;font-size:1.3rem;letter-spacing:.02em}
.logo i{width:42px;height:42px;background:var(--y);color:var(--navy);display:grid;place-items:center;clip-path:polygon(0 0,100% 0,100% 75%,75% 100%,0 100%)}
.logo i svg{width:24px;height:24px}
.logo small{display:block;font-size:.7rem;font-weight:500;opacity:.7;letter-spacing:.12em}
nav.m{display:flex;gap:28px;font-size:.92rem}nav.m a{text-decoration:none;opacity:.85}nav.m a:hover{opacity:1;color:var(--y)}
.btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;font-weight:800;text-decoration:none;border:2px solid transparent;cursor:pointer;font-family:inherit;font-size:1rem;letter-spacing:.04em;text-transform:uppercase}
.btn svg{width:20px;height:20px}
.by{background:var(--y);color:#111}.by:hover{background:#ffd54a}
.bo{border-color:rgba(255,255,255,.5);color:#fff}.bo:hover{border-color:#fff}
.bn{background:var(--navy);color:#fff}
.hero{position:relative;color:#fff;background:var(--ink)}
.hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.55}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,19,36,.95) 0%,rgba(10,19,36,.75) 45%,rgba(10,19,36,.15) 100%)}
.hero .w{position:relative;z-index:2;padding:110px 0 70px}
.tag{display:inline-block;border-left:4px solid var(--y);padding-left:12px;font-size:.85rem}
.hero h1{font-size:clamp(2.6rem,7vw,5.6rem);line-height:.95;margin:22px 0;text-transform:uppercase;letter-spacing:-.01em;max-width:12ch}
.hero h1 em{font-style:normal;color:var(--y)}
.hero p{max-width:52ch;font-size:1.15rem;opacity:.9}
.hero .cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}
.chips{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:70px;border:1px solid rgba(255,255,255,.2)}
.chips div{padding:18px;border-right:1px solid rgba(255,255,255,.2)}.chips div:last-child{border-right:0}
.chips b{display:block;color:var(--y);font-size:1.05rem}.chips span{font-size:.85rem;opacity:.8}
section{padding:90px 0}
.kicker{color:var(--navy2);font-weight:800;font-size:.85rem}
h2{font-size:clamp(2rem,4.5vw,3.2rem);line-height:1;margin:10px 0 0;text-transform:uppercase}
.sh{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap;margin-bottom:40px}
.sh p{max-width:44ch;color:var(--mut);margin:0}
.svc{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line)}
.svc article{background:#fff;padding:0 0 26px;position:relative;transition:background .2s}
.svc article:hover{background:var(--steel)}
.svc article::after{content:"";position:absolute;left:0;bottom:0;height:4px;width:0;background:var(--y);transition:width .3s}
.svc article:hover::after{width:100%}
.svc .ph{aspect-ratio:16/9;overflow:hidden}.svc .ph img{width:100%;height:100%;object-fit:cover;filter:saturate(.85)}
.svc .n{font-size:3rem;font-weight:800;color:var(--navy);opacity:.15;position:absolute;right:20px;top:calc(56.25% - 10px);line-height:1}
.svc h3{margin:20px 24px 4px;text-transform:uppercase;font-size:1.2rem}
.svc .c{margin:0 24px;color:var(--navy2);font-size:.8rem;font-weight:700}
.svc p{margin:10px 24px 0;color:var(--mut);font-size:.95rem}
.dark{background:var(--navy);color:#fff}
.help{display:grid;grid-template-columns:1fr 1.1fr;gap:60px;align-items:start}
.help h2{color:#fff}.help .kicker{color:var(--y)}
.help .lead{opacity:.85;max-width:40ch}
ol.chk{list-style:none;margin:0;padding:0;counter-reset:c}
ol.chk li{display:flex;gap:16px;align-items:flex-start;padding:18px 0;border-bottom:1px solid rgba(255,255,255,.15);cursor:pointer}
ol.chk li .bx{flex:none;width:30px;height:30px;border:2px solid var(--y);display:grid;place-items:center;color:var(--navy);font-weight:800}
ol.chk li.on .bx{background:var(--y)}ol.chk li.on .bx::after{content:"✓"}
ol.chk li.on span{opacity:.55;text-decoration:line-through}
.help .call{margin-top:26px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.show{display:grid;grid-template-columns:1.2fr 1fr;min-height:460px}
.show .ph img{width:100%;height:100%;object-fit:cover}
.show .tx{padding:70px 60px;background:var(--steel)}
.show ul{padding:0;list-style:none;margin:24px 0}.show li{padding:10px 0;border-bottom:1px solid var(--line);font-weight:700}
.show li::before{content:"▸ ";color:var(--navy2)}
.band{background:var(--y);padding:46px 0}
.band .w{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.band h3{font-size:clamp(1.5rem,3.4vw,2.4rem);margin:0;text-transform:uppercase;line-height:1.05}
.contact{display:grid;grid-template-columns:1.1fr .9fr;gap:50px}
form .row{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
label{display:block;font-size:.75rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;color:var(--navy2)}
input,select,textarea{width:100%;font:inherit;font-size:1rem;padding:13px;border:2px solid var(--line);background:#fff;border-radius:0;color:var(--ink)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--navy)}
textarea{min-height:110px;resize:vertical}
.info{background:var(--navy);color:#fff;padding:36px}
.info table{width:100%;border-collapse:collapse;margin:16px 0 26px}.info td{padding:10px 0;border-bottom:1px solid rgba(255,255,255,.15)}.info td+td{text-align:right;font-weight:700}
.info a.big{display:block;font-size:2rem;font-weight:800;color:var(--y);text-decoration:none;margin:6px 0}
details.faq{border-bottom:2px solid var(--line)}details.faq summary{cursor:pointer;padding:20px 0;font-weight:800;text-transform:uppercase;list-style:none;display:flex;justify-content:space-between}
details.faq summary::after{content:"+";color:var(--navy2);font-size:1.5rem;line-height:1}details[open].faq summary::after{content:"–"}
details.faq p{margin:0 0 20px;color:var(--mut);max-width:70ch}
.done{padding:40px;border:2px solid var(--y);background:#fffbea}
footer{background:var(--ink);color:#b8c1d0;padding:34px 0 110px;font-size:.85rem}
footer .w{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.note{font-size:.8rem;color:var(--mut);margin-top:30px}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:1fr 1fr;z-index:50}
.mbar a{padding:16px;text-align:center;font-weight:800;text-decoration:none;text-transform:uppercase;letter-spacing:.05em}
@media(max-width:900px){nav.m{display:none}.svc{grid-template-columns:1fr 1fr}.help,.show,.contact{grid-template-columns:1fr}.show .tx{padding:40px 24px}.chips{grid-template-columns:1fr 1fr}.chips div:nth-child(2){border-right:0}.chips div:nth-child(-n+2){border-bottom:1px solid rgba(255,255,255,.2)}}
@media(max-width:600px){.svc{grid-template-columns:1fr}section{padding:60px 0}.hero .w{padding:70px 0 40px}form .row{grid-template-columns:1fr}.mbar{display:grid}header .hb{display:none}.alert .w span:last-child{display:none}}
""" + OK_CSS
    svc = "".join(
        f'<article><div class="ph"><img src="{img(v["img"])}" alt="{esc(v["name"])} – Symbolbild" loading="lazy"></div>'
        f'<div class="n">{i + 1:02d}</div><h3>{esc(v["name"])}</h3><div class="c up">{esc(v["cat"])}</div><p>{esc(v["text"])}</p></article>'
        for i, v in enumerate(b["items"]))
    steps = ["Prüfen Sie, ob der FI-Schutzschalter ausgelöst hat.",
             "Schalten Sie alle Sicherungsautomaten aus (Hebel nach unten).",
             "Schalten Sie den FI-Schutzschalter wieder ein (Hebel nach oben).",
             "Schalten Sie die Automaten einzeln wieder ein. Fällt der FI erneut, lassen Sie diesen Automaten aus."]
    chk = "".join(f'<li><span class="bx"></span><span>{esc(s)}</span></li>' for s in steps)
    body = render("""
{{banner}}
<div class="alert"><div class="w"><span>⚡ Störung oder Stromausfall? Kundendienst: <a href="{{tel}}">{{phone}}</a></span><span>Mo – Fr 07:30 – 17:00 Uhr*</span></div></div>
<header><div class="w">
  <a class="logo" href="#top"><i>{{bolt}}</i><span>ELEKTRO SCHRÖPF<small>ERLANGEN-BRUCK</small></span></a>
  <nav class="m"><a href="#leistungen">Leistungen</a><a href="#hilfe">Soforthilfe</a><a href="#ausstellung">Ausstellung</a><a href="#kontakt">Kontakt</a></nav>
  <a class="btn by hb" href="{{tel}}">{{phoneico}}{{phone}}</a>
</div></header>
<main id="top">
<section class="hero" style="padding:0"><img src="{{hero}}" alt="Elektroinstallation – Symbolbild"><div class="w">
  <span class="tag up">Ihr Elektrobetrieb in Erlangen-Bruck</span>
  <h1>Vom Großprojekt bis zum <em>Notdienst.</em></h1>
  <p>Planung, Installation, Beleuchtung und Sicherheitstechnik aus einer Hand – und genauso gern die kleine Reparatur zwischendurch.</p>
  <div class="cta"><a class="btn by" href="#kontakt">Termin anfragen →</a><a class="btn bo" href="#hilfe">Stromausfall? Soforthilfe</a></div>
  <div class="chips"><div><b>Planung</b><span>bis zur fertigen Verteilung</span></div><div><b>Smart Home</b><span>Licht, Heizung, Rollläden</span></div><div><b>Sicherheit</b><span>Alarm & Videotürsprech</span></div><div><b>E-Check</b><span>Prüfung Ihrer Anlage</span></div></div>
</div></section>

<section id="leistungen"><div class="w">
  <div class="sh"><div><span class="kicker up">Leistungen</span><h2>Sechs Bereiche.<br>Ein Ansprechpartner.</h2></div><p>Neubau, Sanierung oder Kundendienst – wir sind für Privat und Gewerbe in Erlangen und Umgebung da.</p></div>
  <div class="svc">{{svc}}</div>
</div></section>

<section id="hilfe" class="dark"><div class="w help">
  <div><span class="kicker up">Soforthilfe</span><h2>Plötzlich kein Strom?</h2><p class="lead">Oft lässt sich das Problem in zwei Minuten selbst lösen. Haken Sie die Schritte einfach ab:</p>
    <div class="call"><a class="btn by" href="{{tel}}">{{phoneico}}Hat nicht geholfen? Anrufen</a></div></div>
  <ol class="chk" id="chk">{{chk}}</ol>
</div></section>

<section id="ausstellung" style="padding:0"><div class="show">
  <div class="ph"><img src="{{showimg}}" alt="Beleuchtung – Symbolbild" loading="lazy"></div>
  <div class="tx"><span class="kicker up">Ausstellung</span><h2>Anfassen statt<br>Katalog blättern.</h2>
    <p style="color:var(--mut)">In unseren Verkaufsräumen in der Leipziger Straße finden Sie Leuchten, Hausgeräte und Elektroartikel – mit ehrlicher Beratung.</p>
    <ul><li>Leuchten für innen und außen</li><li>Haushaltsgeräte</li><li>Großes Sortiment an Elektroartikeln</li><li>Virtueller Rundgang online</li></ul>
    <a class="btn bn" href="{{maps}}" target="_blank" rel="noopener">Route planen →</a></div>
</div></section>

<div class="band"><div class="w"><h3>Elektro-Prüfung fällig?<br>Wir messen Ihre Anlage.</h3><a class="btn bn" href="#kontakt">Prüftermin anfragen →</a></div></div>

<section id="faq"><div class="w"><div class="sh"><div><span class="kicker up">Häufige Fragen</span><h2>Kurz erklärt.</h2></div></div>{{faq}}</div></section>

<section id="kontakt" style="background:var(--steel)"><div class="w contact">
  <div data-box><span class="kicker up">Anfrage</span><h2 style="margin-bottom:26px">Termin anfragen.</h2>
    <form data-demo novalidate>
      <div class="row"><div><label for="a1">Leistung</label><select id="a1">{{opts}}</select></div><div><label for="a2">Wunschtermin</label><input id="a2" type="date"></div></div>
      <div class="row"><div><label for="a3">Name</label><input id="a3" required placeholder="Ihr Name"></div><div><label for="a4">Telefon</label><input id="a4" type="tel" required placeholder="Für den Rückruf"></div></div>
      <div style="margin-bottom:18px"><label for="a5">Worum geht es?</label><textarea id="a5" placeholder="z. B. Steckdose defekt, neue Beleuchtung, E-Check"></textarea></div>
      <button class="btn by" type="submit">Anfrage senden →</button>
    </form>
    <div class="done"><h3 class="up">✓ Anfrage angekommen</h3><p>Vorschau-Demo: In der Live-Version landet Ihre Anfrage sofort per E-Mail bei Elektro Schröpf.</p><button class="btn bn" type="button" data-again>Neue Anfrage</button></div>
  </div>
  <div class="info"><span class="kicker up" style="color:var(--y)">Direkter Draht</span><a class="big" href="{{tel}}">{{phone}}</a>
    <div>{{legal}}<br>{{street}}, {{zip}} {{city}}</div><table>{{hours}}</table>
    <a class="btn by" href="{{maps}}" target="_blank" rel="noopener">In Google Maps öffnen</a></div>
</div><div class="w"><p class="note">* {{note}}</p></div></section>
</main>
<footer><div class="w"><span>Entwurf für {{legal}} · {{street}}, {{zip}} {{city}}</span><span>{{agency}}</span></div></footer>
<nav class="mbar"><a href="{{tel}}" style="background:var(--y);color:#111">Anrufen</a><a href="#kontakt" style="background:var(--navy);color:#fff">Termin</a></nav>
<script>document.querySelectorAll('#chk li').forEach(function(l){l.addEventListener('click',function(){l.classList.toggle('on')})})</script>
""", banner=banner(b, "#000", "#fff", "#ffc400"), tel=tel(b), phone=esc(b["phone"]), bolt=ico("bolt"), phoneico=ico("phone"),
        hero=img("el4"), svc=svc, chk=chk, showimg=img("el5"), maps=maps(b), faq=faq_html(b), opts=options(b),
        legal=esc(b["legal"]), street=esc(b["street"]), zip=b["zip"], city=b["city"], hours=hours_rows(b), note=NOTE, agency=agency_links("#ffc400"))
    return head(b, "Elektro Schröpf – Elektriker in Erlangen", "#0f2747", css) + body + FORM_JS + "</body></html>"


# ==========================================================================
# 2) Schreinerei Stegmann – Editorial / Wohnmagazin
# ==========================================================================
def d_stegmann(b):
    css = """
:root{--paper:#f4efe6;--paper2:#ebe3d5;--ink:#231c15;--mut:#6f6356;--wood:#8a5a2b;--line:#d9cdb9}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif;font-size:18px;line-height:1.65}
a{color:inherit}img{display:block;max-width:100%}
.w{width:min(1120px,100% - 32px);margin:0 auto}
.sans{font-family:'Avenir Next','Segoe UI',system-ui,sans-serif}
header{text-align:center;padding:34px 0 0}
.word{font-size:clamp(1.9rem,5vw,3rem);letter-spacing:.32em;margin:0;text-decoration:none;display:inline-block;padding-left:.32em}
.sub{font-size:.75rem;letter-spacing:.28em;text-transform:uppercase;color:var(--mut)}
nav.m{display:flex;justify-content:center;gap:34px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);margin-top:24px;padding:14px 0;font-size:.82rem;letter-spacing:.18em;text-transform:uppercase;flex-wrap:wrap}
nav.m a{text-decoration:none}nav.m a:hover{color:var(--wood)}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;padding:70px 0 90px}
.hero h1{font-size:clamp(3rem,7.4vw,6rem);line-height:.98;font-weight:400;margin:0;letter-spacing:-.02em}
.hero h1 i{color:var(--wood)}
.hero p{font-size:1.2rem;color:var(--mut);max-width:34ch;margin:28px 0}
.ph{position:relative}
.ph img{width:100%;aspect-ratio:4/5;object-fit:cover}
.badge{position:absolute;left:-40px;bottom:40px;background:var(--paper);padding:22px 28px;border:1px solid var(--line)}
.badge b{display:block;font-size:3.4rem;font-weight:400;line-height:1;color:var(--wood)}
.badge span{font-size:.75rem;letter-spacing:.2em;text-transform:uppercase}
.btn{display:inline-block;font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;padding:16px 26px;border:1px solid var(--ink);cursor:pointer;background:none;color:var(--ink)}
.btn.f{background:var(--ink);color:var(--paper)}.btn:hover{background:var(--wood);border-color:var(--wood);color:var(--paper)}
.intro{border-top:1px solid var(--line);padding:80px 0;display:grid;grid-template-columns:1fr 2fr;gap:60px}
.intro .lbl{font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;color:var(--wood)}
.intro p{font-size:1.5rem;line-height:1.5;margin:0}
.intro p::first-letter{float:left;font-size:4.6rem;line-height:.8;padding:8px 10px 0 0;color:var(--wood)}
.zz{padding:20px 0 60px}
.zz article{display:grid;grid-template-columns:1.15fr 1fr;gap:70px;align-items:center;margin-bottom:90px}
.zz article:nth-child(even) .pic{order:2}
.zz .pic img{width:100%;aspect-ratio:5/4;object-fit:cover}
.zz .no{font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;color:var(--wood)}
.zz h2{font-size:clamp(2rem,4vw,3rem);font-weight:400;margin:10px 0 16px;line-height:1.05}
.zz p{color:var(--mut);max-width:38ch}
.more{background:var(--paper2);padding:80px 0}
.more h2{font-weight:400;font-size:clamp(1.8rem,3.5vw,2.6rem);margin:0 0 30px}
.more ul{list-style:none;margin:0;padding:0;columns:2;column-gap:60px}
.more li{break-inside:avoid;border-top:1px solid var(--line);padding:18px 0}
.more li b{display:block;font-weight:400;font-size:1.3rem}
.more li span{color:var(--mut);font-size:.95rem}
.proc{padding:90px 0}
.proc .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:50px;margin-top:40px}
.proc .r{font-size:4rem;line-height:1;color:var(--wood);font-weight:400}
.proc h3{font-weight:400;font-size:1.5rem;margin:12px 0 6px}
.proc p{color:var(--mut);margin:0}
.time{display:flex;align-items:center;gap:14px;font-size:.8rem;letter-spacing:.2em;text-transform:uppercase;color:var(--mut)}
.time i{flex:1;height:1px;background:var(--line)}
.quote{background:var(--ink);color:var(--paper);padding:100px 0;text-align:center}
.quote blockquote{font-size:clamp(1.6rem,3.6vw,2.6rem);line-height:1.3;margin:0 auto;max-width:24ch;font-style:italic}
.quote cite{display:block;margin-top:24px;font-style:normal;font-size:.75rem;letter-spacing:.25em;text-transform:uppercase;opacity:.7}
.letter{padding:90px 0;display:grid;grid-template-columns:1fr 1fr;gap:70px}
.letter h2{font-weight:400;font-size:clamp(2rem,4vw,3rem);margin:0 0 14px;line-height:1.05}
form label{display:block;font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);margin-top:22px}
form input,form select,form textarea{width:100%;border:0;border-bottom:1px solid var(--ink);background:transparent;font:inherit;font-size:1.1rem;padding:10px 0;color:var(--ink);border-radius:0}
form textarea{min-height:90px;resize:vertical}
form input:focus,form select:focus,form textarea:focus{outline:none;border-color:var(--wood)}
form .btn{margin-top:30px}
.addr table{width:100%;border-collapse:collapse;margin-top:16px}.addr td{border-top:1px solid var(--line);padding:12px 0}.addr td+td{text-align:right}
details.faq{border-top:1px solid var(--line)}details.faq summary{cursor:pointer;padding:20px 0;font-size:1.2rem;list-style:none}
details.faq summary::before{content:"— ";color:var(--wood)}details.faq p{margin:0 0 20px;color:var(--mut)}
.done{padding:30px 0}.done h3{font-weight:400;font-size:2rem;margin:0 0 10px}
footer{border-top:1px solid var(--line);padding:30px 0 100px;font-size:.8rem;color:var(--mut)}
footer .w{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.note{font-size:.8rem;color:var(--mut)}
.mbar{position:fixed;bottom:0;left:0;right:0;display:none;background:var(--ink);z-index:50}
.mbar a{flex:1;color:var(--paper);text-align:center;padding:16px;text-decoration:none;font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:.8rem;letter-spacing:.18em;text-transform:uppercase}
@media(max-width:860px){.hero,.intro,.zz article,.letter{grid-template-columns:1fr;gap:34px}.zz article:nth-child(even) .pic{order:0}.badge{left:16px;bottom:16px}.proc .grid{grid-template-columns:1fr}.more ul{columns:1}}
@media(max-width:600px){nav.m{gap:16px;font-size:.7rem}.hero{padding:40px 0 60px}.mbar{display:flex}}
""" + OK_CSS
    big = b["items"][:3]
    rest = b["items"][3:]
    zz = "".join(
        f'<article><div class="pic"><img src="{img(v["img"])}" alt="{esc(v["name"])} – Symbolbild" loading="lazy"></div>'
        f'<div><span class="no sans">Nº {i + 1:02d} · {esc(v["cat"])}</span><h2>{esc(v["name"])}</h2><p>{esc(v["text"])}</p>'
        f'<a class="btn" href="#anfrage">Projekt besprechen</a></div></article>' for i, v in enumerate(big))
    more = "".join(f'<li><b>{esc(v["name"])}</b><span>{esc(v["text"])}</span></li>' for v in rest)
    more += '<li><b>Entsorgung</b><span>Wir bauen Altes aus und entsorgen es für Sie – auch Altholz.</span></li><li><b>Auftragsfertigung</b><span>Wir fertigen nach Ihren Plänen für Betriebe und Handwerker.</span></li>'
    body = render("""
{{banner}}
<header><div class="w">
  <a class="word" href="#top">STEGMANN</a><div class="sub sans">Schreinerei für Innenausbau · Erlangen · seit 1963</div>
  <nav class="m sans"><a href="#arbeiten">Arbeiten</a><a href="#ablauf">Ablauf</a><a href="#faq">Fragen</a><a href="#anfrage">Anfrage</a><a href="{{tel}}">{{phone}}</a></nav>
</div></header>
<main id="top">
<section class="w hero">
  <div><div class="time sans"><span>1963</span><i></i><span>heute</span></div>
    <h1>Möbel,<br>die <i>bleiben.</i></h1>
    <p>Küchen, Wohnmöbel und Innenausbau nach Maß – geplant mit Ihnen, gefertigt in unserer Werkstatt in Erlangen.</p>
    <a class="btn f" href="#anfrage">Projekt anfragen</a> &nbsp; <a class="btn" href="#arbeiten">Arbeiten ansehen</a></div>
  <div class="ph"><img src="{{hero}}" alt="Schreiner bei der Arbeit – Symbolbild"><div class="badge"><b>63</b><span class="sans">Jahre Handwerk</span></div></div>
</section>
<section class="w intro"><div class="lbl sans">Über uns</div>
  <p>Seit 1963 sind wir im Holzhandwerk tätig. In dieser Zeit haben wir uns stetig weiterentwickelt – und uns einen Ruf für Qualität, Service und Zuverlässigkeit erarbeitet, in Erlangen ebenso wie bei Aufträgen im In- und Ausland.</p></section>
<section id="arbeiten" class="w zz">{{zz}}</section>
<section class="more"><div class="w"><h2>Außerdem aus unserer Werkstatt</h2><ul>{{more}}</ul></div></section>
<section id="ablauf" class="w proc"><div class="time sans"><span>Unser Ablauf</span><i></i></div>
  <div class="grid"><div><div class="r">I.</div><h3>Planung</h3><p>Wir planen Ihr Projekt gemeinsam mit Ihnen nach Ihren Wünschen.</p></div>
  <div><div class="r">II.</div><h3>Fertigung</h3><p>In unserer Werkstatt mit modernem Maschinenpark.</p></div>
  <div><div class="r">III.</div><h3>Montage</h3><p>Bei Ihnen vor Ort – auf Wunsch inklusive Entsorgung.</p></div></div></section>
<section class="quote"><blockquote>„Wir halten uns an unsere Termine und Zusagen.“</blockquote><cite class="sans">Stegmann GmbH · Erlangen</cite></section>
<section id="faq" class="w" style="padding:80px 0 0">{{faq}}</section>
<section id="anfrage" class="w letter">
  <div data-box><h2>Erzählen Sie uns<br>von Ihrem Projekt.</h2><p style="color:var(--mut)">Wir melden uns mit einem Terminvorschlag für die Beratung.</p>
    <form data-demo novalidate>
      <label for="s1">Projekt</label><select id="s1">{{opts}}<option>Entsorgung</option><option>Auftragsfertigung</option></select>
      <label for="s2">Name</label><input id="s2" required>
      <label for="s3">Telefon</label><input id="s3" type="tel" required>
      <label for="s4">Ihre Idee (Raum, Maße, Wünsche)</label><textarea id="s4"></textarea>
      <button class="btn f" type="submit">Anfrage senden</button>
    </form>
    <div class="done"><h3>Vielen Dank.</h3><p>Vorschau-Demo: In der Live-Version landet Ihre Anfrage direkt bei der Schreinerei Stegmann.</p><button class="btn" type="button" data-again>Neue Anfrage</button></div></div>
  <div class="addr"><h2>Werkstatt</h2><p>{{legal}}<br>{{street}}<br>{{zip}} {{city}}</p>
    <p><a href="{{tel}}">{{phone}}</a><br><a href="mailto:{{mail}}">{{mail}}</a></p>
    <table>{{hours}}</table><p style="margin-top:26px"><a class="btn" href="{{maps}}" target="_blank" rel="noopener">Anfahrt</a></p></div>
</section>
<div class="w"><p class="note sans">{{note}}</p></div>
</main>
<footer class="sans"><div class="w"><span>Entwurf für {{legal}}</span><span>{{agency}}</span></div></footer>
<nav class="mbar"><a href="{{tel}}">Anrufen</a><a href="#anfrage" style="background:var(--wood)">Anfrage</a></nav>
""", banner=banner(b, "#231c15", "#f4efe6", "#d9a66b"), tel=tel(b), phone=esc(b["phone"]), hero=img("sc4"), zz=zz, more=more,
        faq=faq_html(b), opts=options(b), legal=esc(b["legal"]), street=esc(b["street"]), zip=b["zip"], city=b["city"],
        mail=esc(b["mail"]), hours=hours_rows(b), maps=maps(b), note=NOTE, agency=agency_links())
    return head(b, "Schreinerei Stegmann – Innenausbau in Erlangen seit 1963", "#231c15", css) + body + FORM_JS + "</body></html>"


# ==========================================================================
# 3) Fahrschule Kreiner – verspielt / App-Stil mit Ampelfarben
# ==========================================================================
def d_kreiner(b):
    css = """
:root{--b:#1a56db;--r:#ef4444;--y:#f59e0b;--g:#10b981;--ink:#0f172a;--mut:#64748b;--bg:#f8fafc;--line:#e2e8f0}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:ui-rounded,'SF Pro Rounded','Nunito','Varela Round','Segoe UI',system-ui,sans-serif;color:var(--ink);background:#fff;font-size:17px;line-height:1.6}
a{color:inherit}img{display:block;max-width:100%}
.w{width:min(1120px,100% - 32px);margin:0 auto}
header{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
header .w{display:flex;align-items:center;justify-content:space-between;height:68px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:1.15rem}
.dots{display:flex;flex-direction:column;gap:3px;background:var(--ink);padding:5px;border-radius:10px}
.dots i{width:9px;height:9px;border-radius:50%;display:block}
.pill{display:inline-flex;align-items:center;gap:8px;border-radius:999px;padding:13px 24px;font-weight:800;text-decoration:none;border:0;cursor:pointer;font-family:inherit;font-size:1rem}
.tn{display:flex;gap:24px;font-weight:700;font-size:.95rem}.tn a{text-decoration:none}
.pill{white-space:normal;text-align:center;justify-content:center;max-width:100%}
.reg>*,.learn>*,.panel>*{min-width:0}
.pb{background:var(--b);color:#fff;box-shadow:0 10px 24px -10px var(--b)}.pb:hover{transform:translateY(-1px)}
.pw{background:#fff;color:var(--ink);border:2px solid var(--line)}
.hero{text-align:center;padding:70px 0 40px;background:radial-gradient(800px 400px at 50% 0,#e0eaff,transparent)}
.light{display:inline-flex;flex-direction:column;gap:10px;background:var(--ink);padding:14px;border-radius:22px;margin-bottom:24px}
.light i{width:30px;height:30px;border-radius:50%;opacity:.18;animation:amp 6s infinite}
.light i:nth-child(1){background:var(--r);animation-delay:0s}.light i:nth-child(2){background:var(--y);animation-delay:2s}.light i:nth-child(3){background:var(--g);animation-delay:4s}
@keyframes amp{0%,30%{opacity:1;box-shadow:0 0 18px currentColor}34%,100%{opacity:.18}}
@media(prefers-reduced-motion:reduce){.light i{animation:none}.light i:nth-child(3){opacity:1}}
.hero h1{font-size:clamp(2.5rem,7vw,4.8rem);line-height:1.02;margin:0;letter-spacing:-.03em}
.hero h1 span{color:var(--g)}
.hero p{font-size:1.2rem;color:var(--mut);max-width:44ch;margin:20px auto 28px}
.hero .cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.picker{max-width:760px;margin:46px auto 0;background:#fff;border:2px solid var(--line);border-radius:28px;padding:10px;box-shadow:0 30px 60px -40px rgba(15,23,42,.5)}
.tabs{display:flex;gap:6px;background:var(--bg);border-radius:20px;padding:6px}
.tabs button{flex:1;border:0;background:none;padding:12px;border-radius:16px;font:inherit;font-weight:800;cursor:pointer;color:var(--mut)}
.tabs button.on{background:#fff;color:var(--ink);box-shadow:0 4px 12px -6px rgba(0,0,0,.3)}
.panel{display:none;grid-template-columns:200px 1fr;gap:20px;align-items:center;padding:16px;text-align:left}
.panel.on{display:grid}
.panel img{border-radius:18px;aspect-ratio:4/3;object-fit:cover;width:100%}
.panel h3{margin:0 0 4px;font-size:1.4rem}.panel p{margin:0 0 12px;color:var(--mut)}
section{padding:80px 0}
.sec h2{font-size:clamp(2rem,4.5vw,3rem);margin:0 0 10px;letter-spacing:-.02em;line-height:1.05}
.sec .sub{color:var(--mut);margin:0 0 40px;max-width:52ch}
.road{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.road::before{content:"";position:absolute;left:5%;right:5%;top:34px;height:8px;background:repeating-linear-gradient(90deg,#fff 0 24px,transparent 24px 44px),var(--ink);border-radius:8px}
.stop{position:relative;text-align:center}
.stop .c{width:76px;height:76px;margin:0 auto 16px;border-radius:50%;display:grid;place-items:center;font-size:1.6rem;font-weight:800;color:#fff;border:6px solid #fff;box-shadow:0 8px 20px -8px rgba(0,0,0,.4)}
.stop h3{margin:0 0 4px}.stop p{margin:0;color:var(--mut);font-size:.95rem}
.bgsoft{background:var(--bg)}
.learn{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.phone{width:290px;margin:0 auto;background:var(--ink);border-radius:44px;padding:14px;box-shadow:0 40px 80px -40px rgba(15,23,42,.7)}
.screen{background:#fff;border-radius:32px;padding:26px 20px;min-height:480px}
.screen .q{font-size:.75rem;font-weight:800;color:var(--b)}
.screen h4{margin:6px 0 16px;font-size:1.05rem;line-height:1.35}
.ans{border:2px solid var(--line);border-radius:14px;padding:12px;margin-bottom:10px;font-size:.92rem;cursor:pointer}
.ans.ok{border-color:var(--g);background:#ecfdf5}.ans.no{border-color:var(--r);background:#fef2f2}
.bar{height:8px;background:var(--line);border-radius:8px;margin-top:20px;overflow:hidden}.bar i{display:block;height:100%;width:62%;background:var(--g)}
.feat{display:grid;gap:16px}
.feat div{background:#fff;border:2px solid var(--line);border-radius:22px;padding:22px}
.feat b{display:block;font-size:1.1rem}.feat span{color:var(--mut)}
.chat{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.bub{background:var(--bg);border-radius:24px 24px 24px 6px;padding:24px;position:relative}
.bub p{margin:0 0 14px}.bub b{font-size:.9rem}.bub small{color:var(--mut)}
.bub .st{color:var(--y);letter-spacing:2px}
.reg{display:grid;grid-template-columns:1.1fr .9fr;gap:30px}
.card{background:#fff;border:2px solid var(--line);border-radius:28px;padding:30px}
.radio{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 16px}
.radio label{cursor:pointer;position:relative}.radio input{position:absolute;opacity:0;left:0;top:0;width:1px;height:1px}
.radio span{display:inline-block;padding:10px 16px;border-radius:999px;border:2px solid var(--line);font-weight:800}
.radio input:checked+span{background:var(--b);border-color:var(--b);color:#fff}
.lb{display:block;font-weight:800;font-size:.85rem;margin:14px 0 6px}
.card input,.card textarea{width:100%;font:inherit;padding:14px 16px;border-radius:16px;border:2px solid var(--line);background:var(--bg)}
.card input:focus,.card textarea:focus{outline:none;border-color:var(--b);background:#fff}
.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.office{background:var(--ink);color:#fff;border-radius:28px;padding:30px}
.office .day{display:flex;gap:8px;margin:18px 0}
.office .day span{flex:1;text-align:center;padding:10px 0;border-radius:12px;background:rgba(255,255,255,.08);font-weight:800;font-size:.85rem;opacity:.45}
.office .day span.on{background:var(--g);opacity:1}
details.faq{background:#fff;border:2px solid var(--line);border-radius:20px;padding:4px 22px;margin-bottom:12px}
details.faq summary{cursor:pointer;padding:16px 0;font-weight:800;list-style:none}
details.faq summary::before{content:"💬 "}details.faq p{margin:0 0 16px;color:var(--mut)}
.done{text-align:center;padding:30px}.done .big{font-size:3rem}
footer{padding:30px 0 110px;color:var(--mut);font-size:.85rem;border-top:1px solid var(--line)}
footer .w{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.note{font-size:.8rem;color:var(--mut)}
.fab{position:fixed;right:16px;bottom:16px;z-index:50;display:none}
@media(max-width:860px){.learn,.reg{grid-template-columns:1fr}.chat{grid-template-columns:1fr}.road{grid-template-columns:1fr 1fr}.road::before{display:none}}
@media(max-width:600px){.tn{display:none}.panel{grid-template-columns:1fr}.two{grid-template-columns:1fr}.fab{display:block}section{padding:56px 0}.tabs button{padding:10px 4px;font-size:.9rem}}
""" + OK_CSS
    panels = []
    tabs = []
    for i, v in enumerate(b["items"]):
        on = " on" if i == 0 else ""
        tabs.append(f'<button class="{on.strip()}" data-t="{i}" type="button">{esc(v["name"].replace("Klasse ", ""))}</button>')
        panels.append(f'<div class="panel{on}" data-p="{i}"><img src="{img(v["img"])}" alt="{esc(v["cat"])} – Symbolbild" loading="lazy">'
                      f'<div><h3>{esc(v["name"])} · {esc(v["cat"])}</h3><p>{esc(v["text"])}</p><a class="pill pb" href="#anmelden" data-k="{i}">Für {esc(v["name"])} anmelden →</a></div></div>')
    radios = "".join(f'<label><input type="radio" name="kl" value="{i}"{" checked" if i == 0 else ""}><span>{esc(v["name"])}</span></label>' for i, v in enumerate(b["items"]))
    body = render("""
{{banner}}
<header><div class="w">
  <a class="logo" href="#top"><span class="dots"><i style="background:var(--r)"></i><i style="background:var(--y)"></i><i style="background:var(--g)"></i></span>Fahrschule Kreiner</a>
  <nav class="tn"><a style="text-decoration:none" href="#klassen">Klassen</a><a style="text-decoration:none" href="#weg">Ablauf</a><a style="text-decoration:none" href="#lernen">Lernen</a><a style="text-decoration:none" href="#anmelden">Anmelden</a></nav>
  <a class="pill pb" href="#anmelden" style="padding:10px 18px">Anmelden</a>
</div></header>
<main id="top">
<section class="hero"><div class="w">
  <div class="light" aria-hidden="true"><i></i><i></i><i></i></div>
  <h1>Grünes Licht<br>für deine <span>Prüfung.</span></h1>
  <p>Vom ersten Mal Schalten bis zum Führerschein in deiner Hand – Theorie und Praxis parallel, mitten in Erlangen.</p>
  <div class="cta"><a class="pill pb" href="#anmelden">Jetzt anmelden →</a><a class="pill pw" href="{{tel}}">📞 {{phone}}</a></div>
  <div class="picker" id="klassen"><div class="tabs">{{tabs}}</div>{{panels}}</div>
</div></section>

<section id="weg" class="sec"><div class="w"><h2>Dein Weg zum Führerschein</h2><p class="sub">Vier Stopps – und du fährst allein.</p>
  <div class="road">
    <div class="stop"><div class="c" style="background:var(--b)">1</div><h3>Anmelden</h3><p>Online oder im Büro, Di–Do 15:30–18:30</p></div>
    <div class="stop"><div class="c" style="background:var(--r)">2</div><h3>Theorie</h3><p>Im Unterricht und auf der Lernplattform</p></div>
    <div class="stop"><div class="c" style="background:var(--y)">3</div><h3>Fahrstunden</h3><p>Parallel zur Theorie – je nach Kapazität</p></div>
    <div class="stop"><div class="c" style="background:var(--g)">4</div><h3>Prüfung</h3><p>Gut vorbereitet mit Prüfungsmodus</p></div>
  </div></div></section>

<section id="lernen" class="sec bgsoft"><div class="w learn">
  <div class="phone"><div class="screen"><div class="q">ÜBUNGSFRAGE · BEISPIEL</div><h4>Die Ampel zeigt Gelb. Was gilt?</h4>
    <div class="ans" data-a="no">Schnell noch durchfahren</div><div class="ans" data-a="ok">Vor der Kreuzung anhalten, wenn das gefahrlos möglich ist</div><div class="ans" data-a="no">Hupen und weiterfahren</div>
    <div class="bar"><i></i></div><small style="color:var(--mut)">62 % der Fragen sicher beantwortet</small></div></div>
  <div><h2>Lernen, wann<br>es dir passt.</h2><p class="sub">Unsere Online-Lernplattform hat alle Prüfungsfragen – und hilft dir genau da, wo du noch unsicher bist.</p>
    <div class="feat"><div><b>📚 Alle Prüfungsfragen</b><span>Üben, so oft du willst.</span></div><div><b>🔁 Übung macht den Meister</b><span>Falsche Antworten kommen gezielt wieder.</span></div><div><b>🏁 Prüfungsmodus</b><span>Teste dich wie in der echten Prüfung.</span></div></div></div>
</div></section>

<section class="sec"><div class="w"><h2>Das sagen unsere Schüler:innen</h2><p class="sub">Aus unseren Google-Bewertungen (gekürzt).</p>
  <div class="chat">
    <div class="bub"><p>„Es gibt nichts, was ich an der Fahrschule Kreiner auszusetzen habe. Man lernt hier in sehr kurzer Zeit effektiv und sicher zu fahren …“</p><b>Taran König</b></div>
    <div class="bub"><p>„Es war sehr praktisch, dass man Theorie und Praxisstunden nebeneinander machen kann. Die Zuteilung zu einem Fahrlehrer ging sehr schnell …“</p><b>Annika Luschtinetz</b></div>
    <div class="bub"><p>„Man kann nach ein paar Theoriestunden parallel schon mit der Praxis anfangen …“</p><b>Lili F.</b></div>
  </div></div></section>

<section id="anmelden" class="sec bgsoft"><div class="w"><h2>Bereit? Melde dich an.</h2><p class="sub">Wir rufen dich zurück und besprechen deinen Start – auch wenn das Büro gerade zu hat.</p>
  <div class="reg">
    <div class="card" data-box><form data-demo novalidate>
      <span class="lb">Welcher Führerschein?</span><div class="radio">{{radios}}</div>
      <div class="two"><div><label class="lb" for="k1">Name</label><input id="k1" required placeholder="Vor- und Nachname"></div><div><label class="lb" for="k2">Telefon</label><input id="k2" type="tel" required placeholder="Für den Rückruf"></div></div>
      <label class="lb" for="k3">Gewünschter Start</label><input id="k3" type="date">
      <label class="lb" for="k4">Fragen?</label><textarea id="k4" rows="3" placeholder="z. B. Ferienkurs, Vorerfahrung"></textarea>
      <div style="height:16px"></div><button class="pill pb" type="submit">Anmeldung abschicken →</button></form>
      <div class="done"><div class="big">🟢</div><h3>Grünes Licht!</h3><p>Vorschau-Demo: In der Live-Version landet deine Anmeldung sofort bei der Fahrschule Kreiner.</p><button class="pill pw" type="button" data-again>Neue Anmeldung</button></div></div>
    <div class="office"><b style="font-size:1.2rem">Büro Hilpertstraße 19</b><div style="opacity:.7">{{zip}} {{city}}</div>
      <div class="day"><span>Mo</span><span class="on">Di</span><span class="on">Mi</span><span class="on">Do</span><span>Fr</span></div>
      <div>15:30 – 18:30 Uhr</div><p style="margin:20px 0 6px"><a href="{{tel}}" style="color:#fff;font-weight:800;font-size:1.4rem;text-decoration:none">📞 {{phone}}</a></p>
      <p style="margin:0"><a href="mailto:{{mail}}" style="color:#cbd5e1">{{mail}}</a></p>
      <p style="margin-top:22px"><a class="pill pw" href="{{maps}}" target="_blank" rel="noopener">📍 Route planen</a></p></div>
  </div></div></section>

<section id="faq" class="sec"><div class="w"><h2>Fragen? Klar.</h2><div style="height:20px"></div>{{faq}}<p class="note">{{note}}</p></div></section>
</main>
<footer><div class="w"><span>Entwurf für {{legal}} · {{street}}, {{zip}} {{city}}</span><span>{{agency}}</span></div></footer>
<a class="fab pill pb" href="#anmelden">Jetzt anmelden →</a>
<script>
document.querySelectorAll('.tabs button').forEach(function(t){t.addEventListener('click',function(){
  document.querySelectorAll('.tabs button').forEach(function(x){x.classList.remove('on')});t.classList.add('on');
  document.querySelectorAll('.panel').forEach(function(p){p.classList.toggle('on',p.dataset.p===t.dataset.t)});})});
document.querySelectorAll('[data-k]').forEach(function(a){a.addEventListener('click',function(){var r=document.querySelector('input[name=kl][value="'+a.dataset.k+'"]');if(r)r.checked=true})});
document.querySelectorAll('.ans').forEach(function(a){a.addEventListener('click',function(){a.classList.add(a.dataset.a)})});
</script>
""", banner=banner(b, "#0f172a", "#fff", "#10b981"), tel=tel(b), phone=esc(b["phone"]), tabs="".join(tabs), panels="".join(panels),
        radios=radios, zip=b["zip"], city=b["city"], mail=esc(b["mail"]), maps=maps(b), faq=faq_html(b), note=NOTE,
        legal=esc(b["legal"]), street=esc(b["street"]), agency=agency_links())
    return head(b, "Fahrschule Kreiner – Führerschein in Erlangen", "#1a56db", css) + body + FORM_JS + "</body></html>"


# ==========================================================================
# 4) Friseursalon Kern – Luxus / minimalistisch
# ==========================================================================
def d_kern(b):
    css = """
:root{--k:#0d0b0a;--iv:#f6f1ec;--bl:#ead8cc;--gd:#b08d57;--mut:#8a8079}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--iv);color:var(--k);font-family:'Avenir Next','Helvetica Neue','Segoe UI',system-ui,sans-serif;font-weight:300;font-size:17px;line-height:1.7}
a{color:inherit}img{display:block;max-width:100%}
.w{width:min(1180px,100% - 32px);margin:0 auto}
.serif{font-family:Didot,'Bodoni 72','Bodoni MT','Iowan Old Style',Georgia,serif;font-weight:400}
.cap{font-size:.7rem;letter-spacing:.32em;text-transform:uppercase}
.hero{position:relative;min-height:92vh;color:var(--iv);display:flex;flex-direction:column}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(13,11,10,.55),rgba(13,11,10,.15) 40%,rgba(13,11,10,.85))}
.top{position:relative;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:26px 0}
.top nav{display:flex;gap:28px}.top nav a{text-decoration:none}.top nav:last-child{justify-content:flex-end}
.mark{text-align:center;text-decoration:none}.mark b{display:block;font-size:2.4rem;letter-spacing:.4em;padding-left:.4em;line-height:1}
.hero .bot{position:relative;z-index:2;margin-top:auto;padding:0 0 70px;display:flex;justify-content:space-between;align-items:end;gap:40px;flex-wrap:wrap}
.hero h1{font-size:clamp(3rem,8.6vw,7.5rem);line-height:.92;margin:0;max-width:10ch}
.hero h1 i{color:var(--bl)}
.out{display:inline-block;border:1px solid currentColor;padding:16px 30px;text-decoration:none;cursor:pointer;background:none;color:inherit;font:inherit;font-size:.72rem;letter-spacing:.3em;text-transform:uppercase;transition:.2s}
.out:hover{background:var(--iv);color:var(--k)}
.dark .out:hover,.light .out:hover{background:var(--k);color:var(--iv)}
.rt{text-align:right}.rt b{display:block;font-size:3rem;line-height:1}.rt .st{color:var(--gd);letter-spacing:4px}
.mq{background:var(--k);color:var(--iv);overflow:hidden;white-space:nowrap;padding:18px 0}
.mq div{display:inline-block;animation:mq 30s linear infinite}
.mq span{margin:0 26px}.mq span::after{content:"✦";margin-left:52px;color:var(--gd)}
@keyframes mq{to{transform:translateX(-50%)}}
@media(prefers-reduced-motion:reduce){.mq div{animation:none}}
section{padding:110px 0}
.about{display:grid;grid-template-columns:.9fr 1.1fr;gap:80px;align-items:center}
.about img{aspect-ratio:3/4;object-fit:cover;width:100%}
.about blockquote{font-size:clamp(1.6rem,3vw,2.3rem);line-height:1.35;margin:24px 0;font-style:italic}
.about .sig{font-size:1.8rem;font-style:italic;color:var(--gd)}
.menu{background:#fff}
.menu h2,.gal h2{font-size:clamp(2.4rem,5vw,4rem);margin:12px 0 50px;line-height:1}
.mrow{display:flex;align-items:baseline;gap:14px;padding:22px 0;border-bottom:1px solid #eee4dc}
.mrow h3{margin:0;font-size:1.6rem}
.mrow .d{flex:1;border-bottom:1px dotted var(--mut);transform:translateY(-6px)}
.mrow .p{font-size:.72rem;letter-spacing:.25em;text-transform:uppercase;color:var(--mut)}
.mrow small{display:block;color:var(--mut);font-size:.9rem}
.menu .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 70px}
.rate{background:var(--bl);text-align:center}
.rate b{display:block;font-size:clamp(6rem,16vw,11rem);line-height:.9}
.rate .st{color:var(--k);font-size:1.6rem;letter-spacing:10px;margin:14px 0}
.gal .row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.gal img{aspect-ratio:1;object-fit:cover;width:100%;filter:grayscale(.25)}
.dark{background:var(--k);color:var(--iv)}
.book{display:grid;grid-template-columns:1fr 1fr;gap:80px}
.book h2{font-size:clamp(2.6rem,5vw,4.2rem);line-height:1;margin:14px 0 20px}
.book label{display:block;margin-top:22px;font-size:.66rem;letter-spacing:.3em;text-transform:uppercase;color:var(--mut)}
.book input,.book select,.book textarea{width:100%;background:transparent;border:0;border-bottom:1px solid #4a423d;color:var(--iv);font:inherit;padding:10px 0;border-radius:0}
.book select option{color:#111}
.book textarea{min-height:80px;resize:vertical}
.book input:focus,.book select:focus,.book textarea:focus{outline:none;border-color:var(--gd)}
.book .out{margin-top:30px}
.hrs td{padding:10px 0;border-bottom:1px solid #2a2522}.hrs td+td{text-align:right}.hrs{width:100%;border-collapse:collapse}
details.faq{border-bottom:1px solid #eee4dc}details.faq summary{cursor:pointer;padding:22px 0;list-style:none;font-size:1.3rem}
details.faq p{margin:0 0 22px;color:var(--mut)}
.done h3{font-size:2.4rem;margin:0}
footer{background:var(--k);color:var(--mut);padding:30px 0 100px;font-size:.8rem;border-top:1px solid #2a2522}
footer .w{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.note{font-size:.78rem;color:var(--mut)}
.mbar{position:fixed;bottom:0;left:0;right:0;z-index:50;display:none;background:var(--k);color:var(--iv);text-align:center;padding:16px;text-decoration:none;font-size:.75rem;letter-spacing:.3em;text-transform:uppercase;border-top:1px solid var(--gd)}
@media(max-width:860px){.top{grid-template-columns:1fr}.top nav{display:none}.about,.book,.menu .grid{grid-template-columns:1fr;gap:40px}.rt{text-align:left}}
@media(max-width:600px){section{padding:70px 0}.gal .row{grid-template-columns:1fr 1fr}.mbar{display:block}.hero{min-height:84vh}}
""" + OK_CSS
    menu = "".join(f'<div class="mrow"><div><h3 class="serif">{esc(v["name"])}</h3><small>{esc(v["cat"])}</small></div><span class="d"></span><span class="p">auf Anfrage</span></div>' for v in b["items"])
    mq = " ".join(f'<span class="cap">{t}</span>' for t in ["Schneiden", "Färben", "Balayage", "Strähnen", "Styling", "Dauerwelle", "Pflege", "Augenbrauen"]) * 2
    body = render("""
{{banner}}
<main id="top">
<section class="hero" style="padding:0"><img src="{{hero}}" alt="Friseurin beim Föhnen – Symbolbild">
  <div class="w top"><nav class="cap"><a href="#salon">Salon</a><a href="#leistungen">Leistungen</a></nav>
    <a class="mark serif" href="#top"><b>KERN</b><span class="cap" style="font-family:'Avenir Next',sans-serif">Friseursalon · Erlangen</span></a>
    <nav class="cap"><a href="#termin">Termin</a><a href="{{tel}}">{{phone}}</a></nav></div>
  <div class="w bot"><div><div class="cap" style="margin-bottom:20px">Seit über 60 Jahren in Alterlangen</div><h1 class="serif">Haare sind meine <i>Leidenschaft.</i></h1>
    <div style="margin-top:34px"><a class="out" href="#termin">Termin buchen</a></div></div>
    <div class="rt"><b class="serif">4,9</b><div class="st">★★★★★</div><div class="cap">582 Bewertungen auf Planity</div></div></div>
</section>
<div class="mq"><div>{{mq}}</div></div>

<section id="salon" class="w about light">
  <img src="{{about}}" alt="Haare stylen – Symbolbild" loading="lazy">
  <div><span class="cap" style="color:var(--gd)">Der Salon</span>
    <blockquote class="serif">„Friseurin zu sein bedeutet für mich nicht nur Haare schneiden und färben – es ist meine Leidenschaft, die ich ausübe und auslebe.“</blockquote>
    <p>Gegründet von der Familie Kern, heute geführt von Jennifer Weißmeier – mit italienischem Charme und einer ausführlichen Beratung zu Beginn jedes Termins.</p>
    <div class="sig serif">Jennifer Weißmeier</div></div>
</section>

<section id="leistungen" class="menu"><div class="w"><span class="cap" style="color:var(--gd)">Leistungen</span><h2 class="serif">Die Karte.</h2><div class="grid">{{menu}}</div>
  <p class="note" style="margin-top:30px">Preise nennen wir Ihnen gern bei der Terminbuchung.</p></div></section>

<section class="rate"><span class="cap">Was unsere Kundinnen sagen</span><b class="serif">4,9</b><div class="st">★★★★★</div><p class="cap">582 Bewertungen auf Planity</p></section>

<section class="gal"><div class="w"><span class="cap" style="color:var(--gd)">Eindrücke</span><h2 class="serif">Im Salon.</h2>
  <div class="row"><img src="{{g1}}" alt="Haare waschen – Symbolbild" loading="lazy"><img src="{{g2}}" alt="Werkzeug – Symbolbild" loading="lazy"><img src="{{g3}}" alt="Salon – Symbolbild" loading="lazy"></div></div></section>

<section id="faq" class="w" style="padding-top:0">{{faq}}</section>

<section id="termin" class="dark"><div class="w book">
  <div data-box><span class="cap" style="color:var(--gd)">Termin</span><h2 class="serif">Zeit für Sie.</h2><p style="color:var(--mut)">Online rund um die Uhr buchbar – oder schreiben Sie uns Ihren Wunsch.</p>
    <form data-demo novalidate>
      <label for="f1">Leistung</label><select id="f1">{{opts}}</select>
      <label for="f2">Wunschtag</label><input id="f2" type="date">
      <label for="f3">Name</label><input id="f3" required>
      <label for="f4">Telefon</label><input id="f4" type="tel" required>
      <label for="f5">Wünsche</label><textarea id="f5" placeholder="Länge, Farbe, Anlass …"></textarea>
      <button class="out" type="submit">Termin anfragen</button></form>
    <div class="done"><h3 class="serif">Danke.</h3><p style="color:var(--mut)">Vorschau-Demo: In der Live-Version landet Ihre Anfrage direkt im Salon – oder führt zur Online-Buchung.</p><button class="out" type="button" data-again>Neue Anfrage</button></div></div>
  <div><span class="cap" style="color:var(--gd)">Besuchen Sie uns</span><h2 class="serif" style="font-size:2.4rem">{{street}}<br>{{zip}} {{city}}</h2>
    <table class="hrs">{{hours}}</table>
    <p style="margin-top:26px"><a href="{{tel}}" style="text-decoration:none;font-size:1.3rem">{{phone}}</a></p>
    <a class="out" href="{{maps}}" target="_blank" rel="noopener">Route</a>
    <p class="note" style="margin-top:30px">* {{note}}</p></div>
</div></section>
</main>
<footer><div class="w"><span>Entwurf für {{legal}}</span><span>{{agency}}</span></div></footer>
<a class="mbar" href="#termin">Termin buchen</a>
""", banner=banner(b, "#0d0b0a", "#f6f1ec", "#ead8cc"), hero=img("hs6"), tel=tel(b), phone=esc(b["phone"]), mq=mq, about=img("hs2"),
        menu=menu, g1=img("hs1"), g2=img("hs3"), g3=img("hs8"), faq=faq_html(b), opts=options(b), street=esc(b["street"]),
        zip=b["zip"], city=b["city"], hours=hours_rows(b), maps=maps(b), note=NOTE, legal=esc(b["legal"]), agency=agency_links())
    return head(b, "Friseursalon Kern – Friseur in Erlangen-Alterlangen", "#0d0b0a", css) + body + FORM_JS + "</body></html>"


# ==========================================================================
# 5) Gasthof Güthlein – rustikal / fränkisches Wirtshaus
# ==========================================================================
def d_guethlein(b):
    css = """
:root{--bu:#7a1f2b;--bu2:#5e1520;--cr:#f6eedf;--cr2:#ecdfc6;--wd:#5b3a29;--ink:#2a1c16;--mut:#6d5b4f;--chalk:#26332b}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--cr);color:var(--ink);font-family:'Avenir Next','Segoe UI',system-ui,sans-serif;font-size:17px;line-height:1.6}
a{color:inherit}img{display:block;max-width:100%}
.w{width:min(1160px,100% - 32px);margin:0 auto}
.ser{font-family:'Palatino Linotype',Palatino,'Iowan Old Style',Georgia,serif}
header{background:var(--bu);color:var(--cr);text-align:center;padding:22px 0 0;position:relative}
.emb{display:inline-flex;flex-direction:column;align-items:center;text-decoration:none}
.emb .c{width:70px;height:70px;border-radius:50%;border:2px solid var(--cr);display:grid;place-items:center;font-size:2rem;margin-bottom:8px}
.emb b{font-size:1.9rem;letter-spacing:.05em}.emb small{letter-spacing:.3em;text-transform:uppercase;font-size:.68rem;opacity:.85}
.stars{color:#e8c26b;letter-spacing:4px}
header nav{display:flex;justify-content:center;gap:4px;margin-top:18px;flex-wrap:wrap;background:var(--bu2)}
header nav a{padding:14px 18px;text-decoration:none;font-size:.85rem;letter-spacing:.12em;text-transform:uppercase}
header nav a:hover{background:var(--bu)}
.hero{display:grid;grid-template-columns:1.2fr 1fr;min-height:560px}
.hero .ph img{width:100%;height:100%;object-fit:cover}
.hero .tx{padding:70px 56px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(var(--cr),var(--cr2))}
.orn{display:flex;align-items:center;gap:12px;color:var(--bu);font-size:.8rem;letter-spacing:.3em;text-transform:uppercase}
.orn::before,.orn::after{content:"";height:1px;flex:1;background:currentColor;opacity:.5}
.hero h1{font-size:clamp(2.4rem,5vw,3.9rem);line-height:1.05;margin:22px 0;color:var(--bu)}
.hero p{color:var(--mut);font-size:1.1rem;margin:0 0 28px}
.btn{display:inline-block;padding:15px 26px;border-radius:4px;font-weight:700;text-decoration:none;cursor:pointer;border:2px solid var(--bu);font:inherit;font-weight:700}
.bb{background:var(--bu);color:var(--cr)}.bb:hover{background:var(--bu2)}
.bl{background:transparent;color:var(--bu)}
.board{background:var(--wd);padding:14px;border-radius:10px;box-shadow:0 30px 50px -30px rgba(0,0,0,.6)}
.board .in{background:radial-gradient(circle at 30% 20%,#33443a,var(--chalk));color:#f2f0e6;border-radius:6px;padding:46px 40px;font-family:'Chalkboard SE','Comic Neue','Bradley Hand','Segoe Print',cursive}
.board h2{text-align:center;font-size:clamp(2rem,4.5vw,3rem);margin:0 0 6px;font-weight:400}
.board .sub{text-align:center;opacity:.75;margin-bottom:30px}
.board .two{display:grid;grid-template-columns:1fr 1fr;gap:40px}
.board h3{font-size:1.5rem;margin:0 0 6px;font-weight:400;color:#f6d77b}
.board .when{display:inline-block;border:1px dashed rgba(255,255,255,.5);padding:6px 12px;border-radius:6px;margin-top:10px;font-size:1.05rem}
section{padding:80px 0}
.h2{font-size:clamp(2rem,4vw,3rem);color:var(--bu);margin:10px 0 30px;line-height:1.1}
.tabs{display:flex;gap:6px;flex-wrap:wrap;border-bottom:3px solid var(--bu)}
.tabs button{border:0;background:var(--cr2);padding:14px 20px;font:inherit;font-weight:700;cursor:pointer;border-radius:8px 8px 0 0;color:var(--mut)}
.tabs button.on{background:var(--bu);color:var(--cr)}
.tp{display:none;grid-template-columns:1fr 1fr;gap:40px;background:#fffaf0;padding:36px;border:1px solid var(--cr2);border-top:0}
.tp.on{display:grid}.tp img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px}
.tp h3{font-size:2rem;color:var(--bu);margin:0 0 4px}.tp .c{color:var(--mut);font-style:italic;margin-bottom:14px}
.card{background:#fffaf0;border:1px solid var(--cr2);padding:50px;position:relative;max-width:760px;margin:0 auto;box-shadow:0 20px 40px -30px rgba(0,0,0,.4)}
.card::before{content:"";position:absolute;inset:10px;border:1px solid var(--bu);opacity:.35;pointer-events:none}
.card h2{text-align:center;color:var(--bu);font-size:2.4rem;margin:0}
.dish{display:flex;justify-content:space-between;gap:20px;padding:16px 0;border-bottom:1px dashed var(--cr2)}
.dish b{font-size:1.25rem}.dish small{display:block;color:var(--mut)}
.dish .t{font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;color:var(--bu);white-space:nowrap}
.togo{background:var(--bu);color:var(--cr);padding:50px 0}
.togo .w{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.togo h3{font-size:clamp(1.6rem,3vw,2.2rem);margin:0}
.res{display:grid;grid-template-columns:1.1fr .9fr;gap:30px}
.ticket{background:#fffaf0;border:1px solid var(--cr2);border-radius:12px;padding:34px;position:relative}
.ticket::after{content:"";position:absolute;right:-1px;top:20px;bottom:20px;border-right:3px dotted var(--cr)}
.ticket label{display:block;font-weight:700;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:var(--mut);margin:14px 0 6px}
.ticket input,.ticket select,.ticket textarea{width:100%;font:inherit;padding:12px 14px;border:1px solid var(--cr2);border-radius:6px;background:var(--cr)}
.ticket input:focus,.ticket select:focus,.ticket textarea:focus{outline:2px solid var(--bu)}
.ticket .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.adr{background:var(--chalk);color:#eef0ea;border-radius:12px;padding:34px}
.adr a.big{display:block;font-size:2rem;font-weight:700;color:#f6d77b;text-decoration:none;margin:8px 0}
.adr table{width:100%;border-collapse:collapse;margin:16px 0}.adr td{padding:9px 0;border-bottom:1px solid rgba(255,255,255,.15)}.adr td+td{text-align:right}
details.faq{border-bottom:1px solid var(--cr2)}details.faq summary{cursor:pointer;padding:18px 0;font-weight:700;list-style:none;color:var(--bu)}
details.faq summary::before{content:"❧ "}details.faq p{margin:0 0 18px;color:var(--mut)}
.done{text-align:center;padding:30px}
footer{background:var(--bu2);color:#e8d6c4;padding:30px 0 110px;font-size:.85rem}
footer .w{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.note{font-size:.8rem;color:var(--mut)}
.mbar{position:fixed;left:0;right:0;bottom:0;display:none;grid-template-columns:1fr 1fr;z-index:50}
.mbar a{padding:16px;text-align:center;font-weight:700;text-decoration:none}
@media(max-width:900px){.hero,.res,.tp{grid-template-columns:1fr}.hero .tx{padding:40px 24px}.hero .ph{height:300px}.board .two{grid-template-columns:1fr;gap:24px}}
@media(max-width:600px){header nav a{padding:10px 10px;font-size:.72rem}.card{padding:30px 20px}.tp{padding:20px}.ticket .two{grid-template-columns:1fr}.mbar{display:grid}section{padding:56px 0}.board .in{padding:30px 20px}}
""" + OK_CSS
    tabs, panes = [], []
    for i, v in enumerate(b["items"][:5]):
        on = " on" if i == 0 else ""
        tabs.append(f'<button class="{on.strip()}" data-t="{i}" type="button">{esc(v["name"].split(" ")[0])}</button>')
        panes.append(f'<div class="tp{on}" data-p="{i}"><img src="{img(v["img"])}" alt="{esc(v["name"])} – Symbolbild" loading="lazy">'
                     f'<div><h3 class="ser">{esc(v["name"])}</h3><div class="c ser">{esc(v["cat"])}</div><p>{esc(v["text"])}</p>'
                     f'<a class="btn bb" href="#reservieren">Anfragen</a></div></div>')
    dishes = [("Schäufele", "fränkischer Klassiker", "immer"), ("Steaks", "aus eigener Metzgerei", "immer"),
              ("Aischgründer Karpfen", "fränkische Spezialität", "Saison"), ("Frische Pfifferlinge", "solange es sie gibt", "Saison"),
              ("Güthlein’s Bratwurst", "aus der eigenen Metzgerei", "immer"), ("Braten & fränkische Klassiker", "wie bei Oma", "immer")]
    dish = "".join(f'<div class="dish"><div><b class="ser">{esc(n)}</b><small>{esc(s)}</small></div><span class="t">{esc(t)}</span></div>' for n, s, t in dishes)
    body = render("""
{{banner}}
<header><a class="emb" href="#top"><span class="c ser">G</span><b class="ser">Güthlein</b><span class="stars">★★★</span><small>Gasthof · Hotel · Metzgerei</small></a>
  <nav><a href="#klassiker">Klassikerzeit</a><a href="#haus">Unser Haus</a><a href="#karte">Küche</a><a href="#reservieren">Reservieren</a><a href="{{tel}}">☎ {{phone}}</a></nav></header>
<main id="top">
<section class="hero" style="padding:0"><div class="ph"><img src="{{hero}}" alt="Fränkischer Braten – Symbolbild"></div>
  <div class="tx"><div class="orn">Erlangen-Büchenbach</div><h1 class="ser">Schäufele, Steaks und fränkische Klassiker.</h1>
    <p>Täglich für Sie da – mit Küche aus eigener Metzgerei, Räumen für jede Feier und Zimmern für Ihre Gäste. Alles auch zum Mitnehmen.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn bb" href="#reservieren">Tisch reservieren</a><a class="btn bl" href="#togo">Speisen ToGo</a></div></div></section>

<section id="klassiker"><div class="w"><div class="board"><div class="in">
  <h2>~ Klassikerzeit ~</h2><div class="sub">Jeden Monat neu – merken Sie sich die Freitage</div>
  <div class="two">
    <div><h3>Jeden 1. Freitag</h3><div>Saftig-knusprige Spare Ribs mit Barbecue-Marinade &amp; Kartoffelspalten</div><div class="when">Nächster Termin: <span id="f1">…</span></div></div>
    <div><h3>Jeden 3. Freitag</h3><div>Geschmorte Ochsenbäckchen mit Burgundersauce, Semmelknödeln &amp; Speckbohnen</div><div class="when">Nächster Termin: <span id="f3">…</span></div></div>
  </div></div></div></div></section>

<section id="haus" style="padding-top:0"><div class="w"><div class="orn">Unser Haus</div><h2 class="h2 ser" style="text-align:center">Vier Häuser unter einem Dach.</h2>
  <div class="tabs">{{tabs}}</div>{{panes}}</div></section>

<section id="karte" style="background:var(--cr2)"><div class="w"><div class="card"><div class="orn">Aus unserer Küche</div><h2 class="ser">Was Sie erwartet</h2>
  <div style="height:16px"></div>{{dish}}<p class="note" style="text-align:center;margin-top:20px">Auszug – die aktuelle Speisekarte erhalten Sie im Gasthof.</p></div></div></section>

<div class="togo" id="togo"><div class="w"><div><h3 class="ser">Alle Speisen auch zum Mitnehmen.</h3><div>Einfach anrufen, gern eigene Gefäße mitbringen – und abholen.</div></div><a class="btn" style="background:var(--cr);color:var(--bu);border-color:var(--cr)" href="{{tel}}">☎ {{phone}}</a></div></div>

<section id="reservieren"><div class="w res">
  <div class="ticket" data-box><div class="orn" style="justify-content:flex-start">Reservierung</div><h2 class="h2 ser" style="margin:10px 0 6px">Tisch, Feier oder Zimmer?</h2>
    <form data-demo novalidate>
      <div class="two"><div><label for="g1">Anliegen</label><select id="g1"><option>Tisch im Restaurant</option><option>Feier / Tagung</option><option>Partyservice</option><option>Hotelzimmer</option><option>Speisen ToGo</option></select></div><div><label for="g2">Datum</label><input id="g2" type="date"></div></div>
      <div class="two"><div><label for="g3">Name</label><input id="g3" required></div><div><label for="g4">Telefon</label><input id="g4" type="tel" required></div></div>
      <label for="g5">Personen, Uhrzeit, Wünsche</label><textarea id="g5" rows="3"></textarea>
      <div style="height:16px"></div><button class="btn bb" type="submit">Anfrage senden</button></form>
    <div class="done"><h3 class="ser" style="font-size:2rem;color:var(--bu)">Vergelt’s Gott!</h3><p>Vorschau-Demo: In der Live-Version landet Ihre Anfrage sofort im Gasthof.</p><button class="btn bl" type="button" data-again>Neue Anfrage</button></div></div>
  <div class="adr"><div class="orn" style="color:#f6d77b">So finden Sie uns</div><a class="big" href="{{tel}}">☎ {{phone}}</a>
    <div>{{legal}}<br>{{street}}, {{zip}} {{city}}</div><div><a href="mailto:{{mail}}" style="color:#eef0ea">{{mail}}</a></div>
    <table>{{hours}}</table><a class="btn" style="background:#f6d77b;border-color:#f6d77b;color:var(--chalk)" href="{{maps}}" target="_blank" rel="noopener">Route planen</a></div>
</div></section>

<section id="faq" style="padding-top:0"><div class="w">{{faq}}<p class="note" style="margin-top:24px">{{note}}</p></div></section>
</main>
<footer><div class="w"><span>Entwurf für {{legal}}</span><span>{{agency}}</span></div></footer>
<nav class="mbar"><a href="{{tel}}" style="background:var(--chalk);color:#fff">☎ Anrufen</a><a href="#reservieren" style="background:var(--bu);color:var(--cr)">Reservieren</a></nav>
<script>
(function(){
  function nth(y,m,n){var d=new Date(y,m,1);var off=(5-d.getDay()+7)%7;return new Date(y,m,1+off+7*(n-1))}
  function next(n){var t=new Date();t.setHours(0,0,0,0);for(var i=0;i<3;i++){var d=nth(t.getFullYear(),t.getMonth()+i,n);if(d>=t)return d}}
  var o={weekday:'long',day:'numeric',month:'long'};
  document.getElementById('f1').textContent=next(1).toLocaleDateString('de-DE',o);
  document.getElementById('f3').textContent=next(3).toLocaleDateString('de-DE',o);
  document.querySelectorAll('.tabs button').forEach(function(t){t.addEventListener('click',function(){
    document.querySelectorAll('.tabs button').forEach(function(x){x.classList.remove('on')});t.classList.add('on');
    document.querySelectorAll('.tp').forEach(function(p){p.classList.toggle('on',p.dataset.p===t.dataset.t)});})});
})();
</script>
""", banner=banner(b, "#2a1c16", "#f6eedf", "#e8c26b"), tel=tel(b), phone=esc(b["phone"]), hero=img("gh8"), tabs="".join(tabs),
        panes="".join(panes), dish=dish, legal=esc(b["legal"]), street=esc(b["street"]), zip=b["zip"], city=b["city"],
        mail=esc(b["mail"]), hours=hours_rows(b), maps=maps(b), faq=faq_html(b), note=NOTE, agency=agency_links())
    return head(b, "Gasthof Güthlein – Gasthof, Hotel & Metzgerei in Erlangen", "#7a1f2b", css) + body + FORM_JS + "</body></html>"


DESIGNS = {
    "elektro-schroepf-erlangen": d_schroepf,
    "schreinerei-stegmann-erlangen": d_stegmann,
    "fahrschule-kreiner-erlangen": d_kreiner,
    "friseur-kern-erlangen": d_kern,
    "gasthof-guethlein-erlangen": d_guethlein,
}


def main():
    for inline in (False, True):
        g.INLINE = inline
        for slug, fn in DESIGNS.items():
            html_ = fn(B[slug])
            if inline:
                html_ = html_.replace(' loading="lazy"', "")
            if inline:
                path = os.path.join(OUT, "einzeldateien", slug + ".html")
            else:
                os.makedirs(os.path.join(OUT, slug), exist_ok=True)
                path = os.path.join(OUT, slug, "index.html")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(html_)
    print(f"{len(DESIGNS)} individuelle Designs erzeugt")


if __name__ == "__main__":
    main()
