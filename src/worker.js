import { buildSchedule, assignIds, slugify } from './parse.js';
import { renderPage } from './page.js';
import { FESTIVALS, FESTIVAL_LIST, pickFestival } from './festivals.js';
import leaders from './leaders.json';

const kvKey = (slug) => 'schedule-' + slug;
const LEGACY_KV_KEY = 'schedule-v1'; // pre-multi-festival tantra cache

async function discoverTabs(fest) {
  try {
    const res = await fetch(`${fest.sheet.pubBase}html`, { headers: { accept: 'text/html' } });
    if (!res.ok) return fest.sheet.fallbackTabs;
    const html = await res.text();
    const tabs = [];
    for (const m of html.matchAll(/items\.push\(\{name: "((?:[^"\\]|\\.)*)", pageUrl: "((?:[^"\\]|\\.)*)"/g)) {
      const name = m[1].replace(/\\\//g, '/').replace(/\\x([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
      const gid = (m[2].match(/gid(?:=|\\x3d)(\d+)/) || [])[1];
      if (gid) tabs.push({ name, gid });
    }
    return tabs.length ? tabs : fest.sheet.fallbackTabs;
  } catch {
    return fest.sheet.fallbackTabs;
  }
}

async function fetchSchedule(fest) {
  const tabs = await discoverTabs(fest);
  const sheets = await Promise.all(tabs.map(async (t) => {
    const res = await fetch(`${fest.sheet.pubBase}?gid=${t.gid}&single=true&output=csv`);
    if (!res.ok) throw new Error(`csv fetch failed for ${t.name}: ${res.status}`);
    return { ...t, csv: await res.text() };
  }));
  const data = buildSchedule(sheets, { codes: fest.codes, extraJunk: fest.parse.extraJunk });
  const eventCount = data.days.reduce((n, d) => n + d.events.length, 0);
  if (!data.days.length || eventCount < fest.minEvents) {
    throw new Error(`parsed schedule looks broken (${data.days.length} days, ${eventCount} events)`);
  }
  data.updatedAt = new Date().toISOString();
  return data;
}

async function refresh(env, fest) {
  const data = await fetchSchedule(fest);
  await env.SCHEDULE.put(kvKey(fest.slug), JSON.stringify(data));
  return data;
}

async function getData(env, fest) {
  const cached = await env.SCHEDULE.get(kvKey(fest.slug), 'json');
  if (cached) return assignIds(cached);
  if (fest.slug === 'tantra') {
    const legacy = await env.SCHEDULE.get(LEGACY_KV_KEY, 'json');
    if (legacy) return assignIds(legacy);
  }
  return refresh(env, fest);
}

function eventIndex(data) {
  const map = new Map();
  data.days.forEach((day) => day.events.forEach((ev) => {
    if (!ev.banner && ev.id) map.set(ev.id, { ev, day });
  }));
  return map;
}

const splitFacs = (f) => f.split(/[&,]/).map((s) => s.trim()).filter(Boolean);

// Only ship the leader bios whose names actually appear in this festival's
// schedule — the registry is shared across festivals.
function leadersFor(data) {
  const names = new Set(
    data.days.flatMap((d) => d.events.flatMap((e) => (e.facilitators || []).flatMap(splitFacs))));
  const out = {};
  for (const [k, v] of Object.entries(leaders)) if (names.has(k)) out[k] = v;
  return out;
}

const switcher = FESTIVAL_LIST.map((f) => ({ slug: f.slug, shortName: f.shortName }));

function cookieFestival(request) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)festival=([a-z-]+)/);
  return m && FESTIVALS[m[1]] ? FESTIVALS[m[1]] : null;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Themed chooser shown at / when no festival is ongoing or upcoming.
function renderSelector(origin) {
  const cards = FESTIVAL_LIST.map((f) => `
    <a class="card" href="/${f.slug}/" style="--a:${f.theme.tokens.accent};--s:${f.theme.tokens.surface};--t:${f.theme.tokens.text};--l:${f.theme.tokens.line}">
      <span class="dot"></span>
      <span class="name">${esc(f.name)}</span>
      <span class="dates">${esc(f.eyebrow)}</span>
    </a>`).join('\n');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#241a1f">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="Ängsbacka festival schedules">
<meta property="og:description" content="Mobile-friendly schedules for Ängsbacka festivals.">
<meta property="og:url" content="${origin}/">
<title>Ängsbacka festival schedules</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,500&family=Karla:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#241a1f;color:#f4ece1;font:400 16px/1.5 Karla,system-ui,sans-serif;
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
.wrap{max-width:460px;width:100%}
h1{font:italic 500 30px Fraunces,serif;margin-bottom:4px}
p{color:#b9a8a0;font-size:14px;margin-bottom:22px}
.card{display:block;background:var(--s);color:var(--t);border:1px solid var(--l);
  border-left:5px solid var(--a);border-radius:14px;padding:16px 18px;margin:10px 0;
  text-decoration:none}
.card .name{display:block;font-weight:700;font-size:18px}
.card .dates{display:block;font-size:11.5px;letter-spacing:.1em;color:var(--a);margin-top:3px}
</style></head><body><div class="wrap">
<h1>Ängsbacka festivals</h1>
<p>Pick a festival schedule.</p>
${cards}
</div></body></html>`;
}

// Unofficial leaderboard, per festival, themed from its config.
function renderTop(data, rows, leaderMap, fest) {
  const idx = eventIndex(data);
  const base = '/' + fest.slug + '/';
  const t = fest.theme.tokens;
  const items = rows
    .filter((r) => idx.has(r.id))
    .map((r) => {
      const { ev, day } = idx.get(r.id);
      return {
        id: r.id, n: r.n, title: ev.title,
        day: (day.weekday || '').slice(0, 3).toLowerCase(),
        time: day.weekday.slice(0, 3) + ' ' + (ev.allDay ? 'all day' : ev.time),
        venue: ev.venue.replace(/\s*\(.*\)$/, ''),
        fac: ev.facilitators.flatMap(splitFacs),
      };
    });
  const days = data.days.map((d) => ({
    key: (d.weekday || '').slice(0, 3).toLowerCase(),
    label: d.tabName.replace(/\/\d+$/, ''),
  }));
  const leaderSlugs = {};
  Object.keys(leaderMap || {}).forEach((k) => { leaderSlugs[k] = slugify(k); });
  const json = JSON.stringify({ items, days, leaderSlugs, base }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${t.bg}">
<title>Top picks · ${fest.name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Karla:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:${t.bg};color:${t.text};font:400 16px/1.5 Karla,system-ui,sans-serif;padding:28px 16px 60px}
button{font:inherit;color:inherit;background:none;border:none;cursor:pointer}
.wrap{max-width:640px;margin:0 auto}
h1{font-size:24px;color:${t['accent-2']}}
.sub{color:${t.muted};font-size:13px;margin:4px 0 16px}
.pills{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 10px}
.pill{
  flex:none;padding:5px 11px;border-radius:999px;
  border:1px solid ${t.line};color:${t.muted};background:${t.surface};
  font-size:12.5px;font-weight:700;white-space:nowrap;
}
.pill[aria-pressed="true"]{background:${t.accent};border-color:${t.accent};color:${t['on-accent']}}
.pills.views .pill[aria-pressed="true"]{background:${t['accent-2']};border-color:${t['accent-2']};color:${t['on-accent-2']}}
ol{list-style:none;margin-top:14px}
li{display:flex;gap:14px;align-items:baseline;padding:11px 0;border-bottom:1px solid ${t.line}}
.rank{flex:none;width:28px;text-align:right;font-weight:700;color:${t.faint}}
li:nth-child(-n+3) .rank{color:${t['accent-2']}}
.what{flex:1;min-width:0}
.what a{color:${t.text};text-decoration:none;font-weight:700}
.what span.t{color:${t.text};font-weight:700}
.what small{display:block;color:${t.muted};font-size:12.5px}
.n{flex:none;font-weight:700;color:${t.accent}}
.empty{color:${t.muted};padding:40px 0;text-align:center;font-style:italic}
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
      .map(i=>({ n:i.n, href:TOP.base+'?w='+i.id, label:i.title,
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
        href: TOP.leaderSlugs[name] ? TOP.base+'?l='+TOP.leaderSlugs[name] : null,
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
    const path = url.pathname;
    try {
      // Root: cookie choice, else date-based, else selector page.
      if (path === '/') {
        const fest = cookieFestival(request) || pickFestival();
        if (fest) {
          return new Response(null, {
            status: 302,
            headers: {
              location: '/' + fest.slug + '/' + url.search,
              'cache-control': 'no-store',
            },
          });
        }
        return new Response(renderSelector(url.origin), {
          headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'no-store' },
        });
      }

      // Legacy root-level routes from the single-festival era.
      const legacy = path.match(/^\/(data\.json|refresh|vote|top)$/);
      if (legacy) {
        const fest = cookieFestival(request) || pickFestival() || FESTIVALS.tantra;
        return new Response(null, {
          status: 302,
          headers: {
            location: '/' + fest.slug + '/' + legacy[1] + url.search,
            'cache-control': 'no-store',
          },
        });
      }

      const m = path.match(/^\/([a-z-]+)(\/.*)?$/);
      const fest = m && FESTIVALS[m[1]];
      if (!fest) return new Response('Not found', { status: 404 });
      if (m[2] == null) {
        return new Response(null, {
          status: 301,
          headers: { location: path + '/' + url.search },
        });
      }
      const sub = m[2];

      if (sub === '/data.json') {
        return Response.json(await getData(env, fest), {
          headers: { 'cache-control': 'public, max-age=300' },
        });
      }
      if (sub === '/refresh') {
        const data = await refresh(env, fest);
        return Response.json({ ok: true, festival: fest.slug, updatedAt: data.updatedAt,
          events: data.days.reduce((n, d) => n + d.events.length, 0) });
      }
      if (sub === '/vote' && request.method === 'POST') {
        let body;
        try { body = await request.json(); } catch { body = null; }
        const id = body && typeof body.id === 'string' && body.id.length <= 80 ? body.id : null;
        if (!id) return new Response('Bad request', { status: 400 });
        const data = await getData(env, fest);
        if (!eventIndex(data).has(id)) return new Response('Unknown workshop', { status: 400 });
        const delta = body.on ? 1 : -1;
        await env.VOTES.prepare(
          'INSERT INTO votes (festival, id, n) VALUES (?1, ?2, MAX(0, ?3)) ' +
          'ON CONFLICT(festival, id) DO UPDATE SET n = MAX(0, n + ?3)'
        ).bind(fest.slug, id, delta).run();
        return new Response(null, { status: 204 });
      }
      if (sub === '/top') {
        const [data, res] = await Promise.all([
          getData(env, fest),
          env.VOTES.prepare('SELECT id, n FROM votes WHERE festival = ?1 AND n > 0')
            .bind(fest.slug).all(),
        ]);
        return new Response(renderTop(data, res.results || [], leadersFor(data), fest), {
          headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'no-store' },
        });
      }
      if (sub === '/') {
        const data = await getData(env, fest);
        return new Response(
          renderPage({ ...data, leaders: leadersFor(data), switcher }, url.origin, fest), {
            headers: {
              'content-type': 'text/html;charset=utf-8',
              'cache-control': 'public, max-age=300',
              'x-robots-tag': 'noindex, nofollow',
            },
          });
      }
      return new Response('Not found', { status: 404 });
    } catch (err) {
      return new Response(`Schedule temporarily unavailable: ${err.message}`, { status: 503 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      Promise.allSettled(FESTIVAL_LIST.map((fest) => refresh(env, fest)))
    );
  },
};
