import { readFileSync } from 'node:fs';
import { buildSchedule } from '../src/parse.js';

const dir = process.argv[2];
const tabs = [
  { name: 'Tue 14/7', gid: '1827807072', file: 'tue.csv' },
  { name: 'Wed 15/7', gid: '925929911', file: 'wed.csv' },
  { name: 'Thu 16/7', gid: '930766156', file: 'thu.csv' },
  { name: 'Fri 17/7', gid: '1895701359', file: 'fri.csv' },
  { name: 'Sat 18/7', gid: '1621748034', file: 'sat.csv' },
  { name: 'Sun 19/7', gid: '1542967329', file: 'sun.csv' },
  { name: 'CODES', gid: '434437882', file: 'codes.csv' },
];

const sheets = tabs.map((t) => ({ ...t, csv: readFileSync(`${dir}/${t.file}`, 'utf8') }));
const data = buildSchedule(sheets);

if (process.argv[3] === 'json') {
  console.log(JSON.stringify(data, null, 1));
} else {
  console.log(`CODES: ${data.codes.map((c) => c.code).join(', ')}`);
  for (const day of data.days) {
    console.log(`\n=== ${day.tabName} | ${day.weekday} ${day.dateLabel} | theme: ${day.theme} | ${day.events.length} events`);
    for (const ev of day.events) {
      if (ev.banner) { console.log(`  ---- ${ev.title}`); continue; }
      const codes = ev.codes.length ? ` [${ev.codes.join(',')}]` : '';
      const fac = ev.facilitators.length ? ` — ${ev.facilitators.join(' / ')}` : '';
      const note = ev.note ? ` {note: ${ev.note}}` : '';
      console.log(`  ${ev.time.padEnd(12)} ${ev.venue.padEnd(18)} ${ev.title}${ev.subtitle ? ' · ' + ev.subtitle : ''}${codes}${fac}${note}`);
      if (!ev.desc) console.log(`      (no description)`);
    }
  }
}
