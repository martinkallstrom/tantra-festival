// Parses the published Google Sheet (Ängsbacka Tantra Festival schedule) into
// structured JSON. The sheet is a visual grid: venues in every other column,
// event blocks stacked vertically with time / title / subtitle / description /
// codes / facilitator lines, interleaved with full-width banner rows (meals,
// ceremonies) — so extraction is heuristic by design.

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const KNOWN_CODES = new Set([
  'ALL', 'BEGINNERS', 'PHILOSOPHY', 'FIXED PAIRS', 'TOUCH', 'NUDITY',
  'POSSIBLY NUDITY', 'BOLD', 'FEMALE', 'MALE',
]);

const JUNK = new Set(['title', 'subtitle', 'description', 'level', 'wsl', '<', '_:: m.', 'cv', 'blocked for check in']);

const BANNER_RE = /(BREAKFAST|LUNCH|DINNER|MORNING GATHERING|OPENING CEREMONY|CLOSING CEREMONY|CEREMONY|SHARING|CHECK[- ]IN|SILENCE ON SITE)/;

const TIME_RANGE_RE = /(\d{1,2})[:.](\d{1,2})\s*[-–—]\s*(\d{1,2})[:.](\d{1,2})/;
const TIME_START_RE = /^\W*\d{1,2}[:.]\d{1,2}\s*[-–—]\s*\d{1,2}[:.]\d{1,2}\s*$/;

function isJunk(line) {
  const t = line.trim();
  if (!t) return true;
  if (JUNK.has(t.toLowerCase())) return true;
  if (/^[\W_]+$/u.test(t) && !/\p{Emoji_Presentation}/u.test(t)) return true;
  return false;
}

function isBanner(text) {
  if (!BANNER_RE.test(text.toUpperCase())) return false;
  // Real banners are shouted or carry a time range; regular event titles that
  // merely contain a keyword ("Ceremony of Unity") are not banners.
  return TIME_RANGE_RE.test(text) || text === text.toUpperCase();
}

function isCodesLine(line) {
  const parts = line.split(',').map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return false;
  return parts.every((p) => KNOWN_CODES.has(p.toUpperCase()));
}

function parseCodes(line) {
  return line.split(',').map((s) => s.trim()).filter(Boolean)
    .map((s) => s.toUpperCase());
}

function normTime(str) {
  const m = str.match(TIME_RANGE_RE);
  if (!m) return null;
  const [, h1, m1, h2, m2] = m;
  const pad = (s) => s.padStart(2, '0');
  return {
    label: `${+h1}:${pad(m1)}–${+h2}:${pad(m2)}`,
    start: +h1 * 60 + +m1,
    end: +h2 * 60 + +m2,
  };
}

function looksLikeLocation(line) {
  const t = line.trim();
  return /^[A-ZÅÄÖÉ0-9\s'´’&().:-]+$/.test(t) || /\b(tent|stairs|reception|sauna|sanctuary|hub|temple|barn|annex|house)\b/i.test(t);
}

// Parse one event's worth of lines (time already stripped) into fields.
// Returns [event, leftoverLines] — leftover appears when a second event is
// embedded in the same cell run (recognised by a second codes line).
function assignFields(lines) {
  const ev = { title: '', subtitle: '', desc: '', codes: [], facilitators: [] };
  let i = 0;
  const codesIdx = lines.findIndex(isCodesLine);
  const contentEnd = codesIdx === -1 ? lines.length : codesIdx;
  const content = lines.slice(0, contentEnd);
  if (content.length) ev.title = content[0];
  let descLines = [];
  if (content.length > 1) {
    if (content[1].length <= 60) {
      ev.subtitle = content[1];
      descLines = content.slice(2);
    } else {
      descLines = content.slice(1);
    }
  }
  ev.desc = descLines.join(' ').trim();
  let leftover = [];
  if (codesIdx !== -1) {
    ev.codes = parseCodes(lines[codesIdx]);
    const after = lines.slice(codesIdx + 1);
    const nextCodes = after.findIndex(isCodesLine);
    if (nextCodes > 1) {
      // A second, time-less event is embedded right after the facilitator.
      ev.facilitators = after.slice(0, 1);
      leftover = after.slice(1);
    } else {
      ev.facilitators = after;
    }
  } else if (content.length > 2) {
    // No codes line: a short, non-sentence last line is likely the facilitator.
    const last = content[content.length - 1];
    if (last.length <= 40 && !/[.!?]$/.test(last)) {
      ev.facilitators = [last];
      ev.desc = content.slice(ev.subtitle ? 2 : 1, -1).join(' ').trim();
    }
  }
  return [ev, leftover];
}

function parseDaySheet(rows, tabName) {
  const day = { tabName, weekday: '', dateLabel: '', theme: '', events: [], notices: [] };
  const titleCell = (rows[0] && rows[0][0]) || '';
  const tm = titleCell.match(/^([A-ZÅÄÖ]+)\s*-\s*(.+?\d{4})\s*(?:-\s*(.*))?$/);
  if (tm) {
    day.weekday = tm[1].charAt(0) + tm[1].slice(1).toLowerCase();
    day.dateLabel = tm[2].trim();
    day.theme = (tm[3] || '').trim();
  }

  const headerIdx = rows.findIndex((r) => r.some((c) => /BIG BARN/i.test(c || '')));
  if (headerIdx === -1) return day;
  const header = rows[headerIdx];
  const venues = [];
  for (let c = 0; c < header.length; c++) {
    const name = (header[c] || '').replace(/\s+/g, ' ').trim();
    if (name) venues.push({ col: c, name });
  }
  const capRow = rows[headerIdx - 1] || [];

  const seenBanners = new Set();

  for (const { col, name: venueName } of venues) {
    const venueNote = (capRow[col] || '').trim();
    // Flatten this column into a line stream (cells may hold many lines).
    const stream = []; // {row, text}
    for (let r = headerIdx + 1; r < rows.length; r++) {
      const cell = (rows[r] && rows[r][col]) || '';
      for (const raw of cell.split('\n')) {
        const line = raw.replace(/\s+/g, ' ').trim();
        if (!line || isJunk(line)) continue;
        stream.push({ row: r, text: line });
      }
    }

    let orphans = [];
    let current = null; // {timeLine, allDay, lines: [{row,text}], note, lastRow}
    const noteFromOrphans = () => {
      const text = orphans.map((o) => o.text).join(' · ');
      orphans = [];
      if (!text) return '';
      if (text.length > 120) {
        // Long free-standing text blocks are day-level notices, not event notes.
        if (!day.notices.includes(text)) day.notices.push(text);
        return '';
      }
      return text;
    };
    const flush = () => {
      if (!current) return;
      const time = current.allDay ? null : normTime(current.timeLine);
      let lines = current.lines.map((l) => l.text);
      while (lines.length) {
        const [ev, leftover] = assignFields(lines);
        if (ev.title) {
          day.events.push({
            ...ev,
            venue: venueName,
            venueNote,
            note: current.note || '',
            allDay: !!current.allDay,
            time: time ? time.label : (current.allDay ? 'All day' : ''),
            start: time ? time.start : (current.allDay ? -1 : 9999),
            end: time ? time.end : null,
          });
        }
        lines = leftover;
        if (leftover.length) current.note = '';
      }
      current = null;
    };

    for (const item of stream) {
      const { text, row } = item;
      // A large vertical gap separates blocks: flush a finished event (one
      // that already has its codes line) after >=3 blank rows, or any event
      // after >=5 blank rows, so later stray lines don't glom onto it.
      if (current) {
        const gap = row - current.lastRow;
        const hasCodes = current.lines.some((l) => isCodesLine(l.text));
        // An all-caps location header ("HEART TENT", "MEET BY CAFE STAIRS")
        // always starts the next block, even after a small gap.
        const locHeader = current.lines.length >= 2 && !isCodesLine(text) &&
          text === text.toUpperCase() && looksLikeLocation(text);
        if ((gap >= 4 && hasCodes) || gap >= 6 || locHeader) flush();
      }
      if (isBanner(text)) {
        flush();
        orphans = [];
        const key = text.toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
        if (!seenBanners.has(key)) {
          seenBanners.add(key);
          const time = normTime(text);
          day.events.push({
            banner: true,
            title: text.replace(/\s+/g, ' ').trim(),
            venue: '', codes: [], facilitators: [], desc: '', subtitle: '',
            time: time ? time.label : '',
            start: time ? time.start : 9999,
            end: time ? time.end : null,
          });
        }
        continue;
      }
      if (TIME_START_RE.test(text) || /^all day$/i.test(text)) {
        flush();
        current = {
          timeLine: text,
          allDay: /^all day$/i.test(text),
          lines: [],
          note: noteFromOrphans(),
          lastRow: row,
        };
        continue;
      }
      if (current) { current.lines.push(item); current.lastRow = row; }
      else {
        // Orphan runs separated by a big gap belong to different blocks.
        if (orphans.length && row - orphans[orphans.length - 1].row >= 4) noteFromOrphans();
        orphans.push(item);
      }
    }
    flush();
    noteFromOrphans();
  }

  day.events.sort((a, b) => (a.start - b.start) || (a.banner ? -1 : 1));
  return day;
}

function parseCodesSheet(rows) {
  const codes = [];
  for (const r of rows) {
    const code = (r[0] || '').trim();
    const desc = (r[2] || '').trim();
    if (code && desc && code !== 'WORKSHOP CODES') codes.push({ code: code.toUpperCase(), desc });
  }
  return codes;
}

// sheets: [{name, gid, csv}] in tab order; CODES tab detected by name.
export function buildSchedule(sheets) {
  const out = { days: [], codes: [] };
  for (const sheet of sheets) {
    const rows = parseCSV(sheet.csv);
    if (/codes/i.test(sheet.name)) {
      out.codes = parseCodesSheet(rows);
    } else {
      const day = parseDaySheet(rows, sheet.name);
      day.gid = sheet.gid;
      out.days.push(day);
    }
  }
  return out;
}

export function looksLikeLocationNote(note) {
  return note && looksLikeLocation(note);
}
