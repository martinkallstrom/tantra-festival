// CI smoke test: parse the committed sheet fixtures, render the page, and
// syntax-check the inline client script. No dependencies beyond node.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildSchedule } from '../src/parse.js';
import { renderPage } from '../src/page.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const tabs = [
  ['Tue 14/7', 'tue'], ['Wed 15/7', 'wed'], ['Thu 16/7', 'thu'],
  ['Fri 17/7', 'fri'], ['Sat 18/7', 'sat'], ['Sun 19/7', 'sun'],
  ['CODES', 'codes'],
];

let failures = 0;
function assert(name, cond) {
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name);
  if (!cond) failures++;
}

// --- parser ---
const sheets = tabs.map(([name, f]) => ({
  name, gid: f, csv: readFileSync(join(dir, f + '.csv'), 'utf8'),
}));
const data = buildSchedule(sheets);
const events = data.days.reduce((n, d) => n + d.events.length, 0);
const workshops = data.days.reduce(
  (n, d) => n + d.events.filter((e) => !e.banner).length, 0);

assert('parses 6 days', data.days.length === 6);
assert('parses 9 workshop codes', data.codes.length === 9);
assert(`finds a plausible number of events (${events} >= 140)`, events >= 140);
assert(`most events are workshops (${workshops} >= 110)`, workshops >= 110);
assert('every day has a weekday and date',
  data.days.every((d) => d.weekday && d.dateLabel));
assert('workshops have titles and venues',
  data.days.every((d) => d.events.every((e) => e.banner || (e.title && e.venue))));

// --- renderer ---
data.updatedAt = '2026-07-11T00:00:00.000Z';
data.leaders = JSON.parse(
  readFileSync(join(dir, '..', '..', 'src', 'leaders.json'), 'utf8'));
const html = renderPage(data);

assert(`renders a substantial page (${Math.round(html.length / 1024)}KB > 60KB)`,
  html.length > 60 * 1024);
assert('has the title', html.includes('<title>Tantra Festival'));
assert('inlines the data', html.includes('const DATA = {'));
assert('registers the service worker', html.includes("serviceWorker"));
assert('links the manifest', html.includes('manifest.webmanifest'));

// The inline script must parse; template-literal escaping bugs surface here.
const m = html.match(/<script>([\s\S]*?)<\/script>/);
let scriptOk = false;
try { new Function(m[1]); scriptOk = true; } catch (err) {
  console.error('inline script parse error:', err.message);
}
assert('inline client script parses', scriptOk);

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nall checks passed');
