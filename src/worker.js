import { buildSchedule, assignIds, slugify } from './parse.js';
import { renderPage } from './page.js';
import leaders from './leaders.json';

const PUB_BASE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbrtJeSyuzedXiLglt5h0R6UXqdZTqzFT85ONTJbQ0AhxxdEi2_JsRui59zv17o7V2aRg2xhTFhPZO/pub';
const KV_KEY = 'schedule-v1';

// Fallback tab list in case tab discovery from pubhtml ever breaks.
const FALLBACK_TABS = [
  { name: 'Tue 14/7', gid: '1827807072' },
  { name: 'Wed 15/7', gid: '925929911' },
  { name: 'Thu 16/7', gid: '930766156' },
  { name: 'Fri 17/7', gid: '1895701359' },
  { name: 'Sat 18/7', gid: '1621748034' },
  { name: 'Sun 19/7', gid: '1542967329' },
  { name: 'CODES', gid: '434437882' },
];

async function discoverTabs() {
  try {
    const res = await fetch(`${PUB_BASE}html`, { headers: { accept: 'text/html' } });
    if (!res.ok) return FALLBACK_TABS;
    const html = await res.text();
    const tabs = [];
    for (const m of html.matchAll(/items\.push\(\{name: "((?:[^"\\]|\\.)*)", pageUrl: "((?:[^"\\]|\\.)*)"/g)) {
      const name = m[1].replace(/\\\//g, '/').replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const gid = (m[2].match(/gid(?:=|\\x3d)(\d+)/) || [])[1];
      if (gid) tabs.push({ name, gid });
    }
    return tabs.length ? tabs : FALLBACK_TABS;
  } catch {
    return FALLBACK_TABS;
  }
}

async function fetchSchedule() {
  const tabs = await discoverTabs();
  const sheets = await Promise.all(tabs.map(async (t) => {
    const res = await fetch(`${PUB_BASE}?gid=${t.gid}&single=true&output=csv`);
    if (!res.ok) throw new Error(`csv fetch failed for ${t.name}: ${res.status}`);
    return { ...t, csv: await res.text() };
  }));
  const data = buildSchedule(sheets);
  const eventCount = data.days.reduce((n, d) => n + d.events.length, 0);
  if (!data.days.length || eventCount < 20) {
    throw new Error(`parsed schedule looks broken (${data.days.length} days, ${eventCount} events)`);
  }
  data.updatedAt = new Date().toISOString();
  return data;
}

async function refresh(env) {
  const data = await fetchSchedule();
  await env.SCHEDULE.put(KV_KEY, JSON.stringify(data));
  return data;
}

async function getData(env) {
  const cached = await env.SCHEDULE.get(KV_KEY, 'json');
  if (cached) return assignIds(cached); // backfill ids on pre-id cache entries
  return refresh(env);
}

function eventIndex(data) {
  const map = new Map();
  data.days.forEach((day) => day.events.forEach((ev) => {
    if (!ev.banner && ev.id) map.set(ev.id, { ev, day });
  }));
  return map;
}

// Unofficial, unlinked leaderboard of hearted sessions, filterable by day
// and rankable by workshop or facilitator. Data is inlined; pills filter
// client-side like the main app.
function renderTop(data, rows, leaderMap) {
  const idx = eventIndex(data);
  const splitFacs = (f) => f.split(/[&,]/).map((s) => s.trim()).filter(Boolean);
  const items = rows
    .filter((r) => idx.has(r.id))
    .map((r) => {
      const { ev, day } = idx.get(r.id);
      return {
        id: r.id, n: r.n, title: ev.title,
        day: (day.weekday || '').slice(0, 3).toLowerCase(),
        time: day.weekday.slice(0, 3) + ' ' + (ev.allDay ? 'all day' : ev.time),
        venue: ev.venue.replace(' (CAFÉ ATTIC)', ''),
        fac: ev.facilitators.flatMap(splitFacs),
      };
    });
  const days = data.days.map((d) => ({
    key: (d.weekday || '').slice(0, 3).toLowerCase(),
    label: d.tabName.replace('/7', ''),
  }));
  const leaderSlugs = {};
  Object.keys(leaderMap || {}).forEach((k) => { leaderSlugs[k] = slugify(k); });
  const json = JSON.stringify({ items, days, leaderSlugs }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#2a1019">
<title>Top picks · Tantra Festival</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#2a1019;color:#f9edd5;font:400 16px/1.5 Karla,system-ui,sans-serif;padding:28px 16px 60px}
button{font:inherit;color:inherit;background:none;border:none;cursor:pointer}
.wrap{max-width:640px;margin:0 auto}
h1{font-size:24px;color:#f2a93b}
.sub{color:#d4b29e;font-size:13px;margin:4px 0 16px}
.pills{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 10px}
.pill{
  flex:none;padding:5px 11px;border-radius:999px;
  border:1px solid #5c2d36;color:#d4b29e;
  font-size:12.5px;font-weight:700;white-space:nowrap;
}
.pill[aria-pressed="true"]{background:#e5518d;border-color:#e5518d;color:#38101f}
.pills.views .pill[aria-pressed="true"]{background:#f2a93b;border-color:#f2a93b;color:#3a2306}
ol{list-style:none;margin-top:14px}
li{display:flex;gap:14px;align-items:baseline;padding:11px 0;border-bottom:1px solid #5c2d36}
.rank{flex:none;width:28px;text-align:right;font-weight:700;color:#97705f}
li:nth-child(-n+3) .rank{color:#f2a93b}
.what{flex:1;min-width:0}
.what a{color:#f9edd5;text-decoration:none;font-weight:700}
.what span.t{color:#f9edd5;font-weight:700}
.what small{display:block;color:#d4b29e;font-size:12.5px}
.n{flex:none;font-weight:700;color:#e5518d}
.empty{color:#d4b29e;padding:40px 0;text-align:center;font-style:italic}
</style></head><body><div class="wrap">
<h1>Unofficial top picks</h1>
<p class="sub">Live count of ♥ marks from attendees' devices. Anonymous, unscientific, lovingly unofficial.</p>
<div class="pills views" id="views"></div>
<div class="pills" id="days"></div>
<ol id="list"></ol>
<p class="empty" id="empty" hidden>No hearts counted here yet.</p>
<script>
const TOP = ${json};
(function(){
"use strict";
const state = { day:'', view:'workshop' };
const p0 = new URLSearchParams(location.search);
if (p0.get('view')==='facilitator') state.view = 'facilitator';
if (TOP.days.some(d=>d.key===p0.get('day'))) state.day = p0.get('day');

function h(tag, cls, text){
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}
const viewsEl = document.getElementById('views');
const daysEl = document.getElementById('days');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');

[['workshop','Workshops'],['facilitator','Facilitators']].forEach(([key,label])=>{
  const b = h('button','pill',label);
  b.dataset.view = key;
  b.addEventListener('click',()=>{ state.view = key; render(); });
  viewsEl.appendChild(b);
});
const allBtn = h('button','pill','All days');
allBtn.dataset.day = '';
allBtn.addEventListener('click',()=>{ state.day=''; render(); });
daysEl.appendChild(allBtn);
TOP.days.forEach(d=>{
  const b = h('button','pill',d.label);
  b.dataset.day = d.key;
  b.addEventListener('click',()=>{ state.day = state.day===d.key ? '' : d.key; render(); });
  daysEl.appendChild(b);
});

function render(){
  [...viewsEl.children].forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.view===state.view)));
  [...daysEl.children].forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.day===state.day)));
  const params = new URLSearchParams();
  if (state.view!=='workshop') params.set('view', state.view);
  if (state.day) params.set('day', state.day);
  history.replaceState(null,'', params.toString() ? '?'+params.toString() : location.pathname);

  listEl.textContent = '';
  const items = TOP.items.filter(i=>!state.day || i.day===state.day);
  let rows;
  if (state.view==='workshop'){
    rows = items.slice().sort((a,b)=>(b.n-a.n) || a.title.localeCompare(b.title))
      .map(i=>({ n:i.n, href:'/?w='+i.id, label:i.title,
        sub:i.time+' · '+i.venue+(i.fac.length?' · '+i.fac.join(' & '):'') }));
  } else {
    const agg = new Map();
    items.forEach(i=>i.fac.forEach(name=>{
      const e = agg.get(name)||{n:0,c:0};
      e.n += i.n; e.c++;
      agg.set(name, e);
    }));
    rows = [...agg.entries()].sort((a,b)=>(b[1].n-a[1].n) || a[0].localeCompare(b[0]))
      .map(([name,e])=>({ n:e.n,
        href: TOP.leaderSlugs[name] ? '/?l='+TOP.leaderSlugs[name] : null,
        label:name,
        sub:e.c+(e.c===1?' hearted workshop':' hearted workshops') }));
  }
  rows = rows.slice(0,50);
  emptyEl.hidden = rows.length > 0;
  rows.forEach((r,i)=>{
    const li = h('li');
    li.appendChild(h('span','rank',String(i+1)));
    const what = h('span','what');
    if (r.href){
      const a = h('a',null,r.label); a.href = r.href;
      what.appendChild(a);
    } else what.appendChild(h('span','t',r.label));
    what.appendChild(h('small',null,r.sub));
    li.appendChild(what);
    li.appendChild(h('span','n','♥ '+r.n));
    listEl.appendChild(li);
  });
}
render();
})();
</script>
</div></body></html>`;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/data.json') {
        return Response.json(await getData(env), {
          headers: { 'cache-control': 'public, max-age=300' },
        });
      }
      if (url.pathname === '/refresh') {
        const data = await refresh(env);
        return Response.json({ ok: true, updatedAt: data.updatedAt,
          events: data.days.reduce((n, d) => n + d.events.length, 0) });
      }
      if (url.pathname === '/vote' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch { body = null; }
        const id = body && typeof body.id === 'string' && body.id.length <= 80 ? body.id : null;
        if (!id) return new Response('Bad request', { status: 400 });
        const data = await getData(env);
        if (!eventIndex(data).has(id)) return new Response('Unknown workshop', { status: 400 });
        const delta = body.on ? 1 : -1;
        await env.VOTES.prepare(
          'INSERT INTO votes (id, n) VALUES (?1, MAX(0, ?2)) ' +
          'ON CONFLICT(id) DO UPDATE SET n = MAX(0, n + ?2)'
        ).bind(id, delta).run();
        return new Response(null, { status: 204 });
      }
      if (url.pathname === '/top') {
        const [data, res] = await Promise.all([
          getData(env),
          env.VOTES.prepare('SELECT id, n FROM votes WHERE n > 0').all(),
        ]);
        return new Response(renderTop(data, res.results || [], leaders), {
          headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'no-store' },
        });
      }
      if (url.pathname !== '/') return new Response('Not found', { status: 404 });
      const data = await getData(env);
      return new Response(renderPage({ ...data, leaders }, url.origin), {
        headers: {
          'content-type': 'text/html;charset=utf-8',
          'cache-control': 'public, max-age=300',
        },
      });
    } catch (err) {
      return new Response(`Schedule temporarily unavailable: ${err.message}`, { status: 503 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(refresh(env));
  },
};
