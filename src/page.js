// Renders the full app shell. All schedule data is inlined as JSON and the
// page is rendered client-side, so one cached HTML response is the whole app.

export function renderPage(data, origin = 'https://tantra-festival.kindship-ai.workers.dev') {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2a1019">
<meta name="description" content="Mobile-friendly schedule for the Ängsbacka Tantra Festival, July 14–19 2026.">
<title>Tantra Festival · Ängsbacka</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Ängsbacka Tantra Festival">
<meta property="og:title" content="Tantra Festival · Ängsbacka — July 14–19 2026">
<meta property="og:description" content="The full festival schedule: six days of workshops, ceremonies and celebration at Ängsbacka.">
<meta property="og:url" content="${origin}/">
<meta property="og:image" content="${origin}/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Colorful mural of dancing figures, lotus flowers and swirling flames">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Tantra Festival · Ängsbacka — July 14–19 2026">
<meta name="twitter:description" content="The full festival schedule: six days of workshops, ceremonies and celebration at Ängsbacka.">
<meta name="twitter:image" content="${origin}/og.jpg">
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌹</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,650;1,9..144,500&family=Karla:wght@400;500;700&family=Spline+Sans+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{
  /* palette drawn from the mural backdrop: crimson, magenta, saffron,
     indigo night sky and warm cream */
  --night:#2a1019; --dusk:#3b1a22; --dusk-2:#4a212c;
  --linen:#f9edd5; --smoke:#d4b29e; --faint:#97705f;
  --rose:#e5518d; --candle:#f2a93b; --line:#5c2d36;
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{
  background:var(--night);
  color:var(--linen);
  font:400 16px/1.45 Karla,system-ui,sans-serif;
  min-height:100vh;
}
/* fixed, centered, window-filling mural (position:fixed pseudo-element so it
   also stays put on iOS, where background-attachment:fixed is broken) */
body::before{
  content:"";position:fixed;inset:0;z-index:-1;
  background:
    linear-gradient(180deg,rgba(42,16,25,.78),rgba(42,16,25,.66) 40%,rgba(42,16,25,.84)),
    url(/bg.jpg) center/cover no-repeat;
}
button{font:inherit;color:inherit;background:none;border:none;cursor:pointer}
:focus-visible{outline:2px solid var(--candle);outline-offset:2px;border-radius:4px}

/* ---------- header (brand + day pills + print, one sticky block) ---------- */
header.top{
  position:sticky;top:0;z-index:30;
  background:rgba(42,16,25,.9);backdrop-filter:blur(10px);
  border-bottom:1px solid var(--line);
  padding:10px 14px 9px;
  display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;
}
.brand{order:1;cursor:pointer;-webkit-tap-highlight-color:transparent}
.printswitch{order:2;margin-left:auto}
header.top nav.days{
  order:3;flex-basis:100%;
  display:flex;flex-wrap:wrap;justify-content:center;gap:5px;
}
@media (min-width:860px){
  header.top nav.days{order:2;flex-basis:auto;flex:1}
  .printswitch{order:3;margin-left:0}
}
.brand .eyebrow{
  font-size:10.5px;font-weight:700;letter-spacing:.18em;color:var(--rose);
}
.brand h1{
  font-family:Fraunces,serif;font-weight:650;font-size:21px;line-height:1.1;
  letter-spacing:.01em;
}
.printswitch{
  display:flex;align-items:center;gap:7px;flex:none;
  font-size:11px;font-weight:700;letter-spacing:.08em;color:var(--smoke);
}
.printswitch .track{
  width:34px;height:20px;border-radius:10px;background:var(--line);
  position:relative;transition:background .2s;
}
.printswitch .track::after{
  content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;
  border-radius:50%;background:var(--linen);transition:transform .2s;
}
.printswitch[aria-pressed="true"] .track{background:var(--candle)}
.printswitch[aria-pressed="true"] .track::after{transform:translateX(14px)}

.daybtn{
  flex:none;padding:5px 11px;border-radius:999px;
  border:1px solid var(--line);color:var(--smoke);
  font-size:12.5px;font-weight:700;white-space:nowrap;
}
.daybtn[aria-pressed="true"]{
  background:var(--rose);border-color:var(--rose);color:#38101f;
}

/* ---------- filters ---------- */
.filters{padding:14px 16px 2px;max-width:720px;margin:0 auto}
.search{
  width:100%;padding:9px 14px;border-radius:12px;
  background:var(--dusk);border:1px solid var(--line);color:var(--linen);
  font:inherit;font-size:15px;
}
.search::placeholder{color:var(--faint)}
.venues{display:flex;flex-wrap:wrap;gap:6px;padding:10px 0 4px}
.vchip{
  flex:none;display:flex;align-items:center;gap:6px;
  padding:5px 11px;border-radius:999px;border:1px solid var(--line);
  font-size:11.5px;font-weight:700;letter-spacing:.06em;color:var(--smoke);
  white-space:nowrap;
}
.vchip .dot{width:8px;height:8px;border-radius:50%;background:var(--vc,var(--smoke))}
.vchip[aria-pressed="true"]{background:var(--dusk-2);border-color:var(--vc,var(--rose));color:var(--linen)}
details.legend{max-width:720px;margin:6px auto 0;padding:0 16px;color:var(--smoke);font-size:13px}
details.legend summary{cursor:pointer;font-weight:700;letter-spacing:.08em;font-size:11px;padding:6px 0;list-style:none}
details.legend summary::before{content:"◦ ";color:var(--candle)}
details.legend[open] summary::before{content:"• "}
.codefilters{display:flex;flex-wrap:wrap;gap:6px;padding:8px 0 2px}
details.legend dl{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;padding:4px 0 8px}
details.legend dt{font-weight:700;font-size:11px;letter-spacing:.06em}
details.legend dd{color:var(--smoke)}

/* ---------- day section ---------- */
main{max-width:720px;margin:0 auto;padding:4px 16px 40px}
section.day{display:none}
section.day.active{display:block}
.dayhead{padding:18px 0 6px}
.dayhead .date{font-size:12px;font-weight:700;letter-spacing:.14em;color:var(--smoke)}
.dayhead .theme{
  font-family:Fraunces,serif;font-style:italic;font-weight:500;
  font-size:34px;line-height:1.05;color:var(--linen);margin-top:2px;
}
.notice{
  margin:10px 0;padding:12px 14px;border-radius:12px;
  background:var(--dusk);border:1px solid var(--line);
  color:var(--smoke);font-size:13.5px;
}
.notice strong{color:var(--linen)}

/* ---------- event cards ---------- */
.ev{
  display:flex;gap:12px;margin:10px 0;padding:12px 14px 12px 12px;
  background:var(--dusk);border:1px solid var(--line);border-radius:14px;
  border-left:4px solid var(--vc,var(--faint));
  cursor:pointer;
}
.ev:hover{border-color:var(--faint);border-left-color:var(--vc,var(--faint))}
.ev h3 a{color:inherit;text-decoration:none}
.ev .time{
  flex:none;width:52px;
  font:500 13px/1.5 "Spline Sans Mono",monospace;color:var(--linen);
  display:flex;flex-direction:column;
}
.ev .time .end{color:var(--faint);font-size:11.5px}
.ev .time .live{
  color:var(--candle);font-size:9.5px;font-weight:700;letter-spacing:.1em;
  font-family:Karla,sans-serif;margin-top:4px;display:none;
}
.ev.live{border-left-color:var(--candle)}
.ev.live .time .live{display:block}
.ev .body{min-width:0;flex:1}
.ev h3{font-size:16.5px;font-weight:700;line-height:1.25}
.ev .sub{color:var(--smoke);font-size:13.5px;margin-top:1px}
.ev .meta{
  display:flex;flex-wrap:wrap;align-items:center;gap:5px 10px;margin-top:7px;
  font-size:11px;font-weight:700;letter-spacing:.07em;
}
.ev .venue{color:var(--vc,var(--smoke))}
.ev .fac{color:var(--smoke);letter-spacing:.02em;font-weight:500;font-size:12.5px}
.ev .loc{color:var(--candle);font-weight:700}
.codes{display:flex;flex-wrap:wrap;gap:4px;margin-top:7px}
.code{
  font-size:9.5px;font-weight:700;letter-spacing:.09em;
  padding:2.5px 7px;border-radius:5px;
  background:var(--night);border:1px solid var(--line);color:var(--smoke);
}
.code.warn{border-color:#9c4258;color:#f088b2}
.ev .desc{color:var(--smoke);font-size:13.5px;margin-top:8px}
.ev .desc:empty{display:none!important}

/* ---------- banners ---------- */
.banner{margin:16px 0;text-align:center}
.banner.meal{
  display:flex;align-items:center;gap:12px;
  color:var(--smoke);font-size:12px;font-weight:700;letter-spacing:.12em;
}
.banner.meal::before,.banner.meal::after{
  content:"";flex:1;height:1px;background:var(--line);
}
.banner.heart{
  padding:14px 16px;border-radius:14px;
  background:linear-gradient(120deg,rgba(242,169,59,.2),rgba(229,81,141,.16));
  border:1px solid rgba(242,169,59,.5);
  color:var(--candle);font-weight:700;font-size:13.5px;letter-spacing:.04em;
}
/* ---------- workshop detail overlay ---------- */
.detailwrap{
  position:fixed;inset:0;z-index:50;overflow-y:auto;
  background:rgba(24,8,15,.7);backdrop-filter:blur(5px);
  display:flex;align-items:flex-start;justify-content:center;
}
.detailwrap[hidden]{display:none}
.detail{
  background:var(--dusk);border:1px solid var(--line);border-radius:18px;
  border-top:4px solid var(--vc,var(--faint));
  max-width:560px;width:calc(100% - 28px);
  margin:7vh 14px 48px;padding:20px 22px 22px;
  position:relative;
}
.detail .close{
  position:absolute;top:10px;right:12px;
  font-size:22px;line-height:1;color:var(--smoke);padding:6px;
}
.detail .when{
  font:500 13px "Spline Sans Mono",monospace;color:var(--candle);
  letter-spacing:.04em;padding-right:32px;
}
.detail h2{
  font-family:Fraunces,serif;font-weight:650;font-size:27px;line-height:1.1;
  margin:6px 0 2px;
}
.detail .sub{
  font-family:Fraunces,serif;font-style:italic;font-size:16.5px;
  color:var(--smoke);margin-bottom:12px;
}
.detail .meta{
  display:flex;flex-wrap:wrap;gap:5px 12px;align-items:center;
  font-size:11.5px;font-weight:700;letter-spacing:.07em;margin:4px 0 2px;
}
.detail .venue{color:var(--vc,var(--smoke))}
.detail .loc{color:var(--candle)}
.detail .fac{color:var(--linen);font-weight:500;letter-spacing:.02em;font-size:14px}
.detail .desc{color:var(--linen);font-size:15px;line-height:1.55;margin:12px 0 4px}
.detail .codelist{margin:12px 0 4px;padding:0;list-style:none}
.detail .codelist li{
  font-size:12.5px;color:var(--smoke);padding:3px 0;
  display:flex;gap:8px;align-items:baseline;
}
.detail .codelist .code{flex:none}
.detail .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.detail .actions button,.detail .actions a{
  display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid var(--line);
  color:var(--smoke);font-size:12px;font-weight:700;letter-spacing:.06em;
  text-decoration:none;
}
.detail .actions button.primary{border-color:var(--rose);color:var(--rose)}
.detail .actions a.feature{
  background:var(--candle);border-color:var(--candle);color:#3a2306;font-weight:800;
}
.fac a.leaderlink{
  color:inherit;text-decoration:underline dotted;text-decoration-color:var(--faint);
  text-underline-offset:3px;
}
.detail .leadhead{display:flex;gap:16px;align-items:center;margin:6px 0 4px}
.detail .leadhead img{
  width:92px;height:92px;border-radius:50%;object-fit:cover;flex:none;
  border:2px solid var(--candle);
}
.detail .leadhead h2{margin:0 0 2px}
.detail .leadhead .sub{margin:0;font-size:14px}
.detail .listhead{
  font-size:10.5px;font-weight:700;letter-spacing:.14em;color:var(--faint);
  margin:16px 0 2px;
}
.detail .wslist{list-style:none;margin:0;padding:0}
.detail .wslist a{
  display:flex;gap:12px;align-items:baseline;padding:8px 0;
  border-bottom:1px solid var(--line);
  color:var(--linen);text-decoration:none;font-size:14px;
}
.detail .wslist li:last-child a{border-bottom:none}
.detail .wslist .t{
  flex:none;width:104px;
  font:500 11.5px "Spline Sans Mono",monospace;color:var(--candle);
}
html.print .detailwrap{display:none!important}
@media print{.detailwrap{display:none!important}}

footer{
  max-width:720px;margin:0 auto;padding:0 16px 48px;
  color:var(--faint);font-size:12px;line-height:1.7;text-align:center;
}
footer a{color:var(--smoke)}
.empty{display:none;color:var(--faint);text-align:center;padding:32px 0;font-style:italic;font-family:Fraunces,serif;font-size:17px}

@media (prefers-reduced-motion:reduce){*{transition:none!important}}

/* ---------- print mode (toggle + actual print) ----------
   A dense two-column digest: one compact row per event, no descriptions,
   days flowing continuously. Fits the whole festival on a few sheets. */
html.print body{background:#fff;color:#111;font-size:12px}
/* !important so it beats the inline scroll-lock set while a detail is open */
html.print body{overflow:auto!important}
html.print body::before{display:none}
html.print header.top{position:static;background:#fff;border-color:#ddd;backdrop-filter:none;padding:6px 16px}
html.print .brand h1{color:#111;font-size:17px}
html.print .brand .eyebrow{color:#a2325d;font-size:9px}
html.print .printswitch{color:#555}
html.print nav.days,html.print .filters,html.print details.legend.controls{display:none}
html.print main{max-width:none;padding:0 16px 12px}
html.print section.day{display:block;columns:2;column-gap:18px;column-rule:1px solid #eee;margin-bottom:6px}
html.print .dayhead{column-span:all;padding:8px 0 2px;border-bottom:1.5px solid #111;margin-bottom:3px;display:flex;align-items:baseline;gap:10px}
html.print .dayhead .date{color:#111;font-size:9.5px;letter-spacing:.1em}
html.print .dayhead .theme{color:#333;font-size:15px;margin:0}
html.print .notice{column-span:all;background:none;border:none;border-left:2px solid #ccc;border-radius:0;padding:1px 8px;margin:3px 0;color:#555;font-size:8.5px;line-height:1.35}
html.print .notice strong{color:#222}
html.print .ev{
  display:flex;gap:6px;background:#fff;border:none;border-bottom:1px solid #eee;
  border-left:2.5px solid var(--vc,#bbb);border-radius:0;
  margin:0;padding:2.5px 0 2.5px 6px;break-inside:avoid;cursor:default;
}
html.print .ev .time{width:38px;font-size:8px;line-height:1.25;color:#111;flex:none}
html.print .ev .time .end{font-size:8px;color:#999}
html.print .ev .time .live{display:none!important}
html.print .ev .body{line-height:1.3}
html.print .ev .body>*{display:inline;margin:0}
html.print .ev h3{font-size:9.5px;color:#111;font-weight:700}
html.print .ev .sub{font-size:8.5px;color:#555}
html.print .ev .sub::before{content:"— "}
html.print .ev .meta{font-size:7.5px;letter-spacing:.04em}
html.print .ev .meta::before{content:" · "}
html.print .ev .meta>*{display:inline}
html.print .ev .venue{color:#444}
html.print .ev .loc{color:#8a6320}
html.print .ev .fac::before{content:" · "}
html.print .ev .fac{color:#666;font-size:7.5px;font-weight:500}
html.print .codes{display:inline;margin:0}
html.print .codes::before{content:" · "}
html.print .code{
  display:inline;background:none;border:none;padding:0;
  font-size:7px;color:#777;letter-spacing:.05em;
}
html.print .code+.code::before{content:", "}
html.print .code.warn{color:#a2325d}
html.print .ev .desc,html.print .more{display:none!important}
html.print .banner{margin:3px 0;break-inside:avoid}
html.print .banner.heart{background:none;border:none;border-radius:0;padding:1px 0;color:#8a6320;font-size:8.5px;letter-spacing:.06em;display:flex;align-items:center;gap:8px}
html.print .banner.heart::before,html.print .banner.heart::after{content:"";flex:1;height:1px;background:#e6c98d}
html.print .banner.meal{color:#888;font-size:8px;margin:3px 0}
html.print .banner.meal::before,html.print .banner.meal::after{background:#e5e5e5}
html.print .empty{display:none!important}
html.print footer{color:#999;font-size:8px;padding-bottom:8px}
@media print{
  @page{margin:9mm}
  header.top .printswitch{display:none}
  .ev .live{display:none!important}
}
</style>
</head>
<body>
<header class="top">
  <div class="brand" id="brand" role="button" tabindex="0" title="Reset all filters" aria-label="Reset all filters">
    <div class="eyebrow">ÄNGSBACKA · JULY 14–19 2026</div>
    <h1>Tantra Festival</h1>
  </div>
  <button class="printswitch" id="printBtn" aria-pressed="false">
    PRINT <span class="track" aria-hidden="true"></span>
  </button>
  <nav class="days" id="days" aria-label="Festival days"></nav>
</header>
<div class="filters controls">
  <input class="search" id="search" type="search" placeholder="Search workshops, facilitators…" aria-label="Search the schedule">
  <div class="venues" id="venues" aria-label="Filter by venue"></div>
</div>
<details class="legend controls" id="legend"><summary>WORKSHOP CODES</summary><div class="codefilters" id="codefilters" aria-label="Filter by workshop code"></div><dl></dl></details>
<main id="main"></main>
<div class="detailwrap" id="detailwrap" hidden></div>
<footer id="foot"></footer>
<script>
const DATA = ${json};
(function(){
"use strict";
const VENUE_COLORS = {
  'BIG BARN':'#f2688c','UPPER BARN':'#8fb3e8','BIG ANNEX':'#5ec6a2',
  'HEART TENT':'#f28a52','SATSANG TENT':'#f2b544','STRAWBALE HOUSE':'#84c5e8',
  'GARDEN TENT':'#aac36a','DAKINI TEMPLE (CAFÉ ATTIC)':'#e08fd8','OTHER':'#c9ad96'
};
const WARN_CODES = new Set(['NUDITY','POSSIBLY NUDITY','BOLD']);
const state = { day:0, venue:'', q:'', code:'', w:'', l:'' };  // day: -1 = all days
let booted = false; // suppress URL writes while restoring initial state

// --- URL <-> state (every filter combination is linkable) ---
const dayKey = i => i===-1 ? 'all' : (DATA.days[i]?.weekday||'').slice(0,3).toLowerCase();
const dayFromKey = k => k==='all' ? -1 :
  DATA.days.findIndex(d=>d.weekday.slice(0,3).toLowerCase()===String(k).toLowerCase());
function buildURL(){
  const p = new URLSearchParams();
  p.set('day', dayKey(state.day));
  if (state.venue) p.set('venue', state.venue);
  if (state.code) p.set('code', state.code);
  if (state.q) p.set('q', state.q);
  if (state.w) p.set('w', state.w);
  if (state.l) p.set('l', state.l);
  return '?'+p.toString();
}
function updateURL(){
  if (!booted) return;
  history.replaceState(history.state,'',buildURL());
}

// --- stable per-workshop ids for deep links ---
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40) || 'x';
const detailIndex = new Map(); // id -> {ev, dayIdx}
DATA.days.forEach((day,i)=>{
  const key = (day.weekday||day.tabName).slice(0,3).toLowerCase();
  day.events.forEach(ev=>{
    if (ev.banner) return;
    let id = key+'-'+(ev.allDay?'allday':ev.start)+'-'+slug(ev.title);
    while (detailIndex.has(id)) id += '-2';
    ev._id = id;
    detailIndex.set(id, {ev, dayIdx:i});
  });
});

// --- leader lookup: exact facilitator-name keys and URL slugs ---
const leaderByName = DATA.leaders || {};
const leaderIndex = new Map(); // slug -> {key, info}
Object.keys(leaderByName).forEach(key=>{
  leaderIndex.set(slug(key), {key, info: leaderByName[key]});
});
const splitFacs = f => f.split(/[&,]/).map(s=>s.trim()).filter(Boolean);
const facSlug = name => leaderByName[name] ? slug(name) : null;

function h(tag, cls, text){
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}
const shortVenue = v => v.replace(' (CAFÉ ATTIC)','');
const locNote = ev => ev.note && ev.note.length <= 24 &&
  (ev.note === ev.note.toUpperCase() || /tent|stairs|reception|sauna|cafe|hub/i.test(ev.note));

// --- day strip ---
const daysNav = document.getElementById('days');
const allDaysBtn = h('button','daybtn','All');
allDaysBtn.dataset.day = '-1';
allDaysBtn.setAttribute('aria-pressed','false');
allDaysBtn.addEventListener('click',()=>setDay(-1));
daysNav.appendChild(allDaysBtn);
DATA.days.forEach((d,i)=>{
  const b = h('button','daybtn',d.tabName.replace('/7',''));
  b.dataset.day = String(i);
  b.setAttribute('aria-pressed', String(i===state.day));
  b.addEventListener('click',()=>{ setDay(i); });
  daysNav.appendChild(b);
});
function setDay(i){
  state.day = i;
  localStorage.setItem('tantra-day', i);
  [...daysNav.children].forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.day===i)));
  document.querySelectorAll('section.day').forEach((s,j)=>s.classList.toggle('active', i===-1 || j===i));
  applyFilters();
  updateURL();
  window.scrollTo({top:0});
}

// --- venue chips ---
const venuesEl = document.getElementById('venues');
const VENUE_ORDER = Object.keys(VENUE_COLORS);
const allVenues = [...new Set(DATA.days.flatMap(d=>d.events.filter(e=>!e.banner).map(e=>e.venue)))]
  .sort((a,b)=>{
    const ia = VENUE_ORDER.indexOf(a), ib = VENUE_ORDER.indexOf(b);
    return (ia<0?99:ia) - (ib<0?99:ib);
  });
const allChip = h('button','vchip','ALL VENUES');
allChip.setAttribute('aria-pressed','true');
allChip.addEventListener('click',()=>setVenue(''));
venuesEl.appendChild(allChip);
allVenues.forEach(v=>{
  const c = h('button','vchip');
  c.style.setProperty('--vc', VENUE_COLORS[v]||'#b7a8b3');
  c.appendChild(h('span','dot'));
  c.appendChild(document.createTextNode(shortVenue(v)));
  c.setAttribute('aria-pressed','false');
  c.dataset.venue = v;
  c.addEventListener('click',()=>setVenue(state.venue===v?'':v));
  venuesEl.appendChild(c);
});
function setVenue(v){
  state.venue = v;
  [...venuesEl.children].forEach(c=>
    c.setAttribute('aria-pressed', String((c.dataset.venue||'')===v)));
  applyFilters();
  updateURL();
}

// --- codes legend + code filter pills ---
const legend = document.getElementById('legend').querySelector('dl');
const codeFiltersEl = document.getElementById('codefilters');
DATA.codes.forEach(c=>{
  legend.appendChild(h('dt',null,c.code));
  legend.appendChild(h('dd',null,c.desc));
  const p = h('button','vchip',c.code);
  p.dataset.code = c.code;
  p.setAttribute('aria-pressed','false');
  p.title = c.desc;
  p.addEventListener('click',()=>setCode(state.code===c.code?'':c.code));
  codeFiltersEl.appendChild(p);
});
function setCode(c){
  state.code = c;
  [...codeFiltersEl.children].forEach(p=>
    p.setAttribute('aria-pressed', String(p.dataset.code===c)));
  applyFilters();
  updateURL();
}

// --- day sections ---
const main = document.getElementById('main');
DATA.days.forEach((day,i)=>{
  const sec = h('section','day'+(i===state.day?' active':''));
  const head = h('div','dayhead');
  head.appendChild(h('div','date',(day.weekday+' · '+day.dateLabel).toUpperCase()));
  if (day.theme) head.appendChild(h('div','theme',day.theme));
  sec.appendChild(head);
  (day.notices||[]).forEach(n=>{
    const el = h('div','notice');
    const parts = n.split(' · ');
    el.appendChild(h('strong',null,parts[0]));
    if (parts.length>1) el.appendChild(document.createTextNode(' — '+parts.slice(1).join(' ')));
    sec.appendChild(el);
  });
  day.events.forEach(ev=>sec.appendChild(ev.banner?renderBanner(ev):renderEvent(ev)));
  sec.appendChild(h('div','empty','Nothing matches here — soften your filters.'));
  main.appendChild(sec);
});

function renderBanner(ev){
  const big = /CEREMONY|GATHERING|❤️/u.test(ev.title);
  const el = h('div','banner '+(big?'heart':'meal'));
  el.textContent = ev.title.replace(/❤️/gu,'').replace(/\\s+/g,' ').trim() + (big?' ❤':'');
  el.dataset.start = ev.start; el.dataset.end = ev.end||'';
  return el;
}

function renderEvent(ev){
  const el = h('article','ev');
  el.style.setProperty('--vc', VENUE_COLORS[ev.venue]||'#b7a8b3');
  el.dataset.venue = ev.venue;
  el.dataset.codes = ev.codes.join('|');
  el.dataset.start = ev.start; el.dataset.end = ev.end||'';
  el.dataset.text = (ev.title+' '+(ev.subtitle||'')+' '+(ev.desc||'')+' '+ev.facilitators.join(' ')).toLowerCase();

  const t = h('div','time');
  if (ev.allDay){
    t.appendChild(h('span',null,'All'));
    t.appendChild(h('span','end','day'));
  } else {
    const [a,b] = ev.time.split('–');
    t.appendChild(h('span',null,a));
    t.appendChild(h('span','end',b));
  }
  t.appendChild(h('span','live','● NOW'));
  el.appendChild(t);

  const body = h('div','body');
  const h3 = h('h3');
  const titleLink = h('a',null,ev.title);
  titleLink.href = '?w='+ev._id;
  h3.appendChild(titleLink);
  body.appendChild(h3);
  if (ev.subtitle) body.appendChild(h('p','sub',ev.subtitle));

  const meta = h('div','meta');
  if (locNote(ev)) meta.appendChild(h('span','loc','📍 '+ev.note));
  else meta.appendChild(h('span','venue',shortVenue(ev.venue)));
  if (ev.facilitators.length) meta.appendChild(facNames(ev.facilitators));
  body.appendChild(meta);

  if (ev.codes.length){
    const codes = h('div','codes');
    ev.codes.forEach(c=>codes.appendChild(h('span','code'+(WARN_CODES.has(c)?' warn':''),c)));
    body.appendChild(codes);
  }
  if (ev.note && !locNote(ev)) body.appendChild(h('p','desc',ev.note));
  body.appendChild(h('p','desc',ev.desc||''));
  el.appendChild(body);
  el.addEventListener('click', e=>{
    if (document.documentElement.classList.contains('print')) return;
    e.preventDefault();
    openDetail(ev._id);
  });
  return el;
}

// Facilitator names as a span; names known in the leader db become links.
function facNames(facilitators, prefix){
  const wrap = h('span','fac', prefix||'');
  let first = true;
  facilitators.flatMap(splitFacs).forEach(name=>{
    if (!first) wrap.appendChild(document.createTextNode(' & '));
    first = false;
    const s = facSlug(name);
    if (s){
      const a = h('a','leaderlink',name);
      a.href = '?l='+s;
      a.addEventListener('click', e=>{
        e.preventDefault(); e.stopPropagation();
        openLeader(s);
      });
      wrap.appendChild(a);
    } else wrap.appendChild(document.createTextNode(name));
  });
  return wrap;
}

// --- workshop detail overlay ---
const detailWrap = document.getElementById('detailwrap');
function openDetail(id, push=true){
  const hit = detailIndex.get(id);
  if (!hit) return;
  const { ev, dayIdx } = hit;
  const day = DATA.days[dayIdx];
  state.w = id; state.l = '';
  detailWrap.textContent = '';
  const card = h('div','detail');
  card.style.setProperty('--vc', VENUE_COLORS[ev.venue]||'#c9ad96');

  const close = h('button','close','×');
  close.setAttribute('aria-label','Close');
  close.addEventListener('click', closeDetail);
  card.appendChild(close);

  card.appendChild(h('div','when',
    day.weekday+' '+day.dateLabel.replace(/, \\d{4}$/,'')+' · '+(ev.allDay?'All day':ev.time)));
  card.appendChild(h('h2',null,ev.title));
  if (ev.subtitle) card.appendChild(h('div','sub',ev.subtitle));

  const meta = h('div','meta');
  meta.appendChild(h('span','venue',shortVenue(ev.venue)));
  if (ev.note && locNote(ev)) meta.appendChild(h('span','loc','📍 '+ev.note));
  card.appendChild(meta);
  if (ev.facilitators.length){
    const facRow = h('div','fac');
    facRow.appendChild(document.createTextNode('With '));
    facRow.appendChild(facNames(ev.facilitators));
    card.appendChild(facRow);
  }

  if (ev.note && !locNote(ev)) card.appendChild(h('p','desc',ev.note));
  if (ev.desc) card.appendChild(h('p','desc',ev.desc));

  if (ev.codes.length){
    const ul = h('ul','codelist');
    ev.codes.forEach(c=>{
      const li = h('li');
      li.appendChild(h('span','code'+(WARN_CODES.has(c)?' warn':''),c));
      const def = DATA.codes.find(x=>x.code===c);
      li.appendChild(h('span',null,def?def.desc:''));
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }

  const actions = h('div','actions');
  const copy = h('button','primary','COPY LINK');
  copy.addEventListener('click',()=>{
    navigator.clipboard.writeText(location.origin+location.pathname+'?w='+id).then(()=>{
      copy.textContent = 'LINK COPIED ✓';
      setTimeout(()=>{ copy.textContent = 'COPY LINK'; }, 1600);
    });
  });
  actions.appendChild(copy);
  const back = h('button',null,'BACK TO SCHEDULE');
  back.addEventListener('click', closeDetail);
  actions.appendChild(back);
  card.appendChild(actions);

  showOverlay(card, push);
  close.focus();
}

function showOverlay(card, push){
  detailWrap.appendChild(card);
  detailWrap.hidden = false;
  document.body.style.overflow = 'hidden';
  if (push) history.pushState({o:1},'',buildURL());
}

// --- leader popup (styled and linked like the workshop detail) ---
function openLeader(id, push=true){
  const hit = leaderIndex.get(id);
  if (!hit) return;
  const { key, info } = hit;
  state.l = id;
  detailWrap.textContent = '';
  const card = h('div','detail');
  card.style.setProperty('--vc','var(--candle)');

  const close = h('button','close','×');
  close.setAttribute('aria-label','Close');
  close.addEventListener('click', closeDetail);
  card.appendChild(close);

  card.appendChild(h('div','when','WORKSHOP LEADER'));
  const head = h('div','leadhead');
  if (info.image_path){
    const img = h('img');
    img.src = info.image_path; img.alt = info.display_name||key;
    img.loading = 'lazy';
    head.appendChild(img);
  }
  const names = h('div');
  const title = h('h2',null,info.display_name||key);
  names.appendChild(title);
  if (info.location) names.appendChild(h('div','sub',info.location));
  head.appendChild(names);
  card.appendChild(head);

  card.appendChild(h('p','desc', info.bio || 'No bio available yet — see their workshops below.'));

  // their workshops, cross-linked to workshop details
  const theirs = [...detailIndex.entries()].filter(([,x])=>
    x.ev.facilitators.flatMap(splitFacs).includes(key));
  if (theirs.length){
    card.appendChild(h('div','listhead','WORKSHOPS AT THE FESTIVAL'));
    const ul = h('ul','wslist');
    theirs.forEach(([wid,{ev,dayIdx}])=>{
      const li = h('li');
      const a = h('a');
      a.href = '?w='+wid;
      a.addEventListener('click', e=>{ e.preventDefault(); openDetail(wid); });
      a.appendChild(h('span','t',
        DATA.days[dayIdx].weekday.slice(0,3)+' '+(ev.allDay?'all day':ev.time)));
      a.appendChild(h('span',null,ev.title));
      li.appendChild(a);
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }

  const actions = h('div','actions');
  if (info.angsbacka_teacher_url){
    const feat = h('a','feature','SEE ON ÄNGSBACKA ↗');
    feat.href = info.angsbacka_teacher_url;
    feat.target = '_blank'; feat.rel = 'noopener';
    actions.appendChild(feat);
  }
  [['website','WEBSITE'],['instagram','INSTAGRAM'],['facebook','FACEBOOK']].forEach(([k,label])=>{
    if (info[k]){
      const a = h('a',null,label);
      a.href = info[k]; a.target = '_blank'; a.rel = 'noopener';
      actions.appendChild(a);
    }
  });
  const copy = h('button',null,'COPY LINK');
  copy.addEventListener('click',()=>{
    navigator.clipboard.writeText(location.origin+location.pathname+'?l='+id).then(()=>{
      copy.textContent = 'LINK COPIED ✓';
      setTimeout(()=>{ copy.textContent = 'COPY LINK'; }, 1600);
    });
  });
  actions.appendChild(copy);
  card.appendChild(actions);

  showOverlay(card, push);
  close.focus();
}

function hideDetail(){
  state.w = ''; state.l = '';
  detailWrap.hidden = true;
  document.body.style.overflow = '';
}
function closeDetail(){
  if (history.state && history.state.o){ history.back(); return; }
  hideDetail();
  updateURL();
}
detailWrap.addEventListener('click', e=>{ if (e.target===detailWrap) closeDetail(); });
document.addEventListener('keydown', e=>{
  if (e.key==='Escape' && !detailWrap.hidden) closeDetail();
});
window.addEventListener('popstate',()=>{
  const p = new URLSearchParams(location.search);
  const l = p.get('l'), w = p.get('w');
  if (l && leaderIndex.has(l)) openLeader(l,false);
  else if (w && detailIndex.has(w)) openDetail(w,false);
  else hideDetail();
});

// --- filtering ---
const searchEl = document.getElementById('search');
searchEl.addEventListener('input',()=>{ state.q = searchEl.value.trim().toLowerCase(); applyFilters(); updateURL(); });
function applyFilters(){
  const filtering = state.venue || state.q || state.code;
  document.querySelectorAll('section.day').forEach(sec=>{
    let visible = 0;
    sec.querySelectorAll('.ev').forEach(ev=>{
      const okV = !state.venue || ev.dataset.venue===state.venue;
      const okQ = !state.q || ev.dataset.text.includes(state.q);
      const okC = !state.code || ev.dataset.codes.split('|').includes(state.code);
      const show = okV && okQ && okC;
      ev.style.display = show?'':'none';
      if (show) visible++;
    });
    sec.querySelectorAll('.banner').forEach(b=>b.style.display = filtering?'none':'');
    if (state.day===-1){
      // All-days view: drop empty days entirely instead of showing a message.
      sec.style.display = (filtering && !visible)?'none':'';
      sec.querySelector('.empty').style.display = 'none';
    } else {
      sec.style.display = '';
      sec.querySelector('.empty').style.display = (filtering && !visible)?'block':'none';
    }
  });
}

// --- live "now" marker ---
function tick(){
  const now = new Date();
  document.querySelectorAll('section.day').forEach((sec,i)=>{
    const day = DATA.days[i];
    const d = new Date(day.dateLabel);
    const sameDay = !isNaN(d) && d.toDateString()===now.toDateString();
    const mins = now.getHours()*60+now.getMinutes();
    sec.querySelectorAll('.ev').forEach(ev=>{
      const s = +ev.dataset.start, e = +(ev.dataset.end||0);
      ev.classList.toggle('live', sameDay && s>=0 && s<1440 &&
        mins>=s && mins < (e>s?e:e+1440));
    });
  });
}
tick(); setInterval(tick, 60000);

// --- initial state: URL params win, then today-if-during-festival, then last visit ---
(function(){
  const p = new URLSearchParams(location.search);
  const urlDay = p.get('day')!=null ? dayFromKey(p.get('day')) : null;
  if (urlDay!=null && (urlDay===-1 || DATA.days[urlDay])) setDay(urlDay);
  else {
    const saved = localStorage.getItem('tantra-day');
    const today = new Date().toDateString();
    const idx = DATA.days.findIndex(d=>{
      const t = new Date(d.dateLabel); return !isNaN(t)&&t.toDateString()===today;
    });
    if (idx>=0) setDay(idx);
    else if (saved!=null && (+saved===-1 || DATA.days[+saved])) setDay(+saved);
  }
  const v = p.get('venue');
  if (v){
    const match = allVenues.find(x=>x.toLowerCase()===v.toLowerCase());
    if (match) setVenue(match);
  }
  const c = p.get('code');
  if (c && DATA.codes.some(x=>x.code===c.toUpperCase())){
    setCode(c.toUpperCase());
    document.getElementById('legend').open = true;
  }
  const q = p.get('q');
  if (q){ searchEl.value = q; state.q = q.trim().toLowerCase(); applyFilters(); }
  const w = p.get('w');
  const l = p.get('l');
  if (l && leaderIndex.has(l)) openLeader(l,false);
  else if (w && detailIndex.has(w)) openDetail(w,false);
  booted = true;
})();

// --- logo resets everything ---
function resetAll(){
  searchEl.value=''; state.q='';
  setVenue('');
  setCode('');
  document.getElementById('legend').open = false;
  const today = new Date().toDateString();
  const idx = DATA.days.findIndex(d=>{
    const t = new Date(d.dateLabel); return !isNaN(t)&&t.toDateString()===today;
  });
  setDay(idx>=0?idx:0);
  history.replaceState(null,'',location.pathname);
}
const brand = document.getElementById('brand');
brand.addEventListener('click', resetAll);
brand.addEventListener('keydown', e=>{
  if (e.key==='Enter'||e.key===' '){ e.preventDefault(); resetAll(); }
});

// --- print mode ---
const printBtn = document.getElementById('printBtn');
let printOn = false;
function setPrint(on){
  printOn = on;
  document.documentElement.classList.toggle('print', on);
  printBtn.setAttribute('aria-pressed', String(on));
}
printBtn.addEventListener('click',()=>setPrint(!printOn));
window.addEventListener('beforeprint',()=>document.documentElement.classList.add('print'));
window.addEventListener('afterprint',()=>{ if(!printOn) document.documentElement.classList.remove('print'); });

// --- footer ---
const foot = document.getElementById('foot');
const upd = DATA.updatedAt ? new Date(DATA.updatedAt) : null;
foot.appendChild(h('div',null, upd?('Schedule updated '+upd.toLocaleString('sv-SE',{dateStyle:'medium',timeStyle:'short'})):''));
const contact = h('div');
contact.appendChild(document.createTextNode('Martin Källström · '));
const mail = h('a',null,'martin@kindship.ai');
mail.href = 'mailto:martin@kindship.ai';
contact.appendChild(mail);
contact.appendChild(document.createTextNode(' · '));
const tel = h('a',null,'0736-298463');
tel.href = 'tel:+46736298463';
contact.appendChild(tel);
foot.appendChild(contact);
const src = h('div');
const a = h('a',null,'Source spreadsheet');
a.href = ${JSON.stringify('https://docs.google.com/spreadsheets/d/e/2PACX-1vTbrtJeSyuzedXiLglt5h0R6UXqdZTqzFT85ONTJbQ0AhxxdEi2_JsRui59zv17o7V2aRg2xhTFhPZO/pubhtml')};
src.appendChild(a);
src.appendChild(document.createTextNode(' · refreshed hourly'));
foot.appendChild(src);
})();
</script>
</body>
</html>`;
}
