import { buildSchedule } from './parse.js';
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
  if (cached) return cached;
  return refresh(env);
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
