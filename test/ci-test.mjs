// CI smoke test: parse every festival's committed sheet fixtures, render the
// page, and syntax-check the inline client script. No deps beyond node.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSchedule } from '../src/parse.js';
import { renderPage } from '../src/page.js';
import { FESTIVALS, pickFestival } from '../src/festivals.js';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

const CASES = {
  tantra: {
    tabs: [['Tue 14/7', 'tue'], ['Wed 15/7', 'wed'], ['Thu 16/7', 'thu'],
      ['Fri 17/7', 'fri'], ['Sat 18/7', 'sat'], ['Sun 19/7', 'sun'], ['CODES', 'codes']],
    minEvents: 140, minWorkshops: 110, codes: 9,
  },
  sexsibility: {
    tabs: [['Tue 4/8', 'tue'], ['Wed 5/8', 'wed'], ['Thu 6/8', 'thu'],
      ['Fri 7/8', 'fri'], ['Sat 8/8', 'sat'], ['Sun 9/8', 'sun']],
    minEvents: 120, minWorkshops: 90, codes: 4,
  },
};

let failures = 0;
function assert(name, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name);
  if (!cond) failures++;
}

const leaders = JSON.parse(
  readFileSync(join(fixturesDir, '..', '..', 'src', 'leaders.json'), 'utf8'));

for (const [slug, c] of Object.entries(CASES)) {
  const fest = FESTIVALS[slug];
  const sheets = c.tabs.map(([name, f]) => ({
    name, gid: f, csv: readFileSync(join(fixturesDir, slug, f + '.csv'), 'utf8'),
  }));
  const data = buildSchedule(sheets, { codes: fest.codes, extraJunk: fest.parse.extraJunk });
  const events = data.days.reduce((n, d) => n + d.events.length, 0);
  const workshops = data.days.reduce(
    (n, d) => n + d.events.filter((e) => !e.banner).length, 0);

  assert(`[${slug}] parses 6 days`, data.days.length === 6);
  assert(`[${slug}] codes legend has ${c.codes}`, data.codes.length === c.codes);
  assert(`[${slug}] events ${events} >= ${c.minEvents}`, events >= c.minEvents);
  assert(`[${slug}] workshops ${workshops} >= ${c.minWorkshops}`, workshops >= c.minWorkshops);
  assert(`[${slug}] every day has weekday and date`,
    data.days.every((d) => d.weekday && d.dateLabel));
  assert(`[${slug}] workshops have titles and venues`,
    data.days.every((d) => d.events.every((e) => e.banner || (e.title && e.venue))));

  data.updatedAt = '2026-08-01T00:00:00.000Z';
  data.leaders = leaders;
  const html = renderPage(data, 'https://example.com', fest);
  assert(`[${slug}] renders a substantial page (${Math.round(html.length / 1024)}KB)`,
    html.length > 60 * 1024);
  assert(`[${slug}] has the festival title`, html.includes('<title>' + fest.title));
  assert(`[${slug}] inlines the data`, html.includes('const DATA = {'));
  assert(`[${slug}] registers the service worker`, html.includes('serviceWorker'));
  assert(`[${slug}] links its manifest`, html.includes(fest.assets.manifest));

  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  let scriptOk = false;
  try { new Function(m[1]); scriptOk = true; } catch (err) {
    console.error(`[${slug}] inline script parse error:`, err.message);
  }
  assert(`[${slug}] inline client script parses`, scriptOk);
}

// festival picker
assert('pickFestival: mid-tantra → tantra',
  pickFestival(new Date('2026-07-16T12:00:00+02:00'))?.slug === 'tantra');
assert('pickFestival: between festivals → sexsibility (next)',
  pickFestival(new Date('2026-07-25T12:00:00+02:00'))?.slug === 'sexsibility');
assert('pickFestival: mid-sexsibility → sexsibility',
  pickFestival(new Date('2026-08-06T12:00:00+02:00'))?.slug === 'sexsibility');
assert('pickFestival: after all → null',
  pickFestival(new Date('2026-09-01T12:00:00+02:00')) === null);

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
