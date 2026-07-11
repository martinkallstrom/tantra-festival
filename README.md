# Ängsbacka Tantra Festival Schedule

A fast, mobile-first schedule for the [Ängsbacka](https://www.angsbacka.com) Tantra
Festival, July 14–19 2026 — built from the festival's own published Google Sheet and
served from a Cloudflare Worker at the edge.

**Live: https://tantra-festival.kindship-ai.workers.dev**

![Social preview](public/og.jpg)

## Why

The official schedule is a spreadsheet designed for a big screen: venues as columns,
days as tabs, sessions as blocks of merged cells. Lovely on a laptop, unusable in a
field. This app turns that same sheet into something you can actually use standing in
front of the Heart Tent: fast, filterable, linkable, and printable.

The sheet remains the single source of truth — organizers keep editing it as they
always have, and the app follows along automatically.

## Features

- **Six days, one tap** — day pills in the header, plus an *All* view for the whole
  festival at once. Opens on today's schedule during the festival.
- **Filter everything** — by venue, by workshop code (BEGINNERS, TOUCH, BOLD, …),
  and by free-text search across titles, descriptions and facilitators. Filters
  compose, so "all BOLD workshops in the Upper Barn, any day" is two taps.
- **Every view is a link** — day, venue, code, search, open workshop, and open
  leader are all reflected in the URL. Share exactly what you're looking at.
- **Workshop details** (`?w=wed-1260-desires`) — full description, time, venue,
  facilitators, and each workshop code with its plain-language meaning.
- **Leader profiles** (`?l=anders-lorentz`) — bio, portrait, their workshops
  cross-linked into the schedule, social links, and a link to their Ängsbacka
  teacher page. Only leaders identified with high confidence are shown.
- **Live "NOW" marker** — during the festival, sessions currently underway are
  highlighted.
- **Print mode** — a header switch flips the whole festival into a dense,
  black-on-white two-column digest: ~3 sheets of paper instead of 25. It also
  engages automatically when you hit ⌘P, and respects any active filters.
- **A backdrop worth the festival** — the mural artwork sits fixed behind the
  schedule, and the entire color system (venue ribbons, accents, text) is drawn
  from it.
- **Works offline** — a service worker caches the whole app, so it keeps working
  in a field with no signal; add it to your home screen from the browser menu
  and it behaves like a native app. A banner warns if the cached schedule is
  more than a day old.
- **Now & next** — the *Now* pill shows what's running and everything starting
  within 90 minutes, updating as time passes.
- **Personal schedule** — heart workshops to build your own program (stored on
  your device only), see overlap warnings between picks, and export them as an
  `.ics` file to your calendar.

## How it works

```
Google Sheet (pubhtml) ──┐
                         │  fetch CSV per tab, hourly cron
                         ▼
                   src/parse.js        grid → structured JSON
                         │
                         ▼
                    Workers KV         cached schedule
                         │
                         ▼
                   src/worker.js       fetch handler
                         │
                         ▼
                    src/page.js        one self-contained HTML page,
                                       data inlined, rendered client-side
```

- **`src/parse.js`** does the heavy lifting: it reconstructs events from the sheet's
  *visual* layout — venue columns, stacked time/title/description blocks, full-width
  meal and ceremony banners, location overrides, even second events embedded inside
  a single cell — using layout heuristics (time-range detection, code-line
  recognition, gap-based block splitting).
- **`src/worker.js`** serves everything from KV (no Google round-trip on page load),
  refreshes on a `0 * * * *` cron, discovers sheet tabs dynamically so renamed or
  added days keep working, and keeps the old cache if a fetch comes back broken.
- **`src/page.js`** renders one HTML response with all data and styling inlined —
  the whole app is a single cacheable request plus one background image.
- **`src/leaders.json`** is a curated export of a local research database
  (`data/`, not in the repo): bios, portraits and links for facilitators identified
  with high or medium confidence.

### Endpoints

| Path         | What it does                          |
|--------------|---------------------------------------|
| `/`          | The app                               |
| `/data.json` | Parsed schedule as JSON               |
| `/refresh`   | Force a re-fetch from the sheet       |

## Development

```sh
npx wrangler dev      # run locally
npx wrangler deploy   # deploy
npm test              # parser + render checks against test/fixtures

# check the parser against freshly downloaded CSVs
node test/parse-test.mjs <dir-with-csvs>

# regenerate the leader data from the local db
sqlite3 -json data/leaders.db \
  "SELECT ... FROM leaders WHERE identity_confidence IN ('high','medium');" \
  > src/leaders.json   # see git history for the full export command
```

Configuration lives in `wrangler.toml`: the KV namespace binding (`SCHEDULE`),
the hourly cron trigger, and the `public/` static assets directory.

CI runs `npm test` on every pull request (required to merge) and deploys to
Cloudflare on merge to `main` when the `CLOUDFLARE_API_TOKEN` repository
secret is set; without it, the deploy step is skipped with a warning and
deploys stay manual.

## Contributing

Contributions are welcome — `main` is protected, so all changes land through pull
requests.

1. Fork (or branch, if you have access) and make your change
2. Check the parser still behaves if you touched it: `node test/parse-test.mjs <dir-with-csvs>`
3. Open a PR with a short note on what and why

Good first territory: parser edge cases (the sheet's layout keeps evolving),
print-mode refinements, accessibility, and translations. **Schedule content
itself** is not editable here — it comes from the organizers' Google Sheet.
**Corrections to leader bios or links** are also welcome as PRs against
`src/leaders.json`, or just email martin@kindship.ai — the underlying research
database is maintained outside the repo.

## License & credits

Code is [MIT licensed](LICENSE). Schedule content and workshop data belong to
[Ängsbacka](https://www.angsbacka.com) and the festival's workshop leaders; leader
portraits and bios remain the property of their respective owners. Built by
Martin Källström (martin@kindship.ai) with
[Claude Code](https://claude.com/claude-code).
