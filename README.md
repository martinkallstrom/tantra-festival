# Tantra Festival Schedule

Mobile-friendly schedule for the Ängsbacka Tantra Festival (July 14–19, 2026), built from the
[published Google Sheet](https://docs.google.com/spreadsheets/d/e/2PACX-1vTbrtJeSyuzedXiLglt5h0R6UXqdZTqzFT85ONTJbQ0AhxxdEi2_JsRui59zv17o7V2aRg2xhTFhPZO/pubhtml).

**Live:** https://tantra-festival.kindship-ai.workers.dev

## How it works

A Cloudflare Worker fetches every tab of the published sheet as CSV, parses the visual
grid (venue columns, event blocks, meal/ceremony banner rows) into structured JSON, and
caches it in Workers KV. A cron trigger refreshes the cache every hour, on the hour.
Page loads are served entirely from KV — no Google round-trip.

- `/` — the app (all data inlined, renders client-side)
- `/data.json` — the parsed schedule as JSON
- `/refresh` — force a re-fetch from the sheet

The UI has day tabs, venue filters, search, workshop-code legend, a live "NOW" marker
during the festival, and a printer-friendly switch (also applied automatically when
printing).

## Development

```sh
npx wrangler dev      # local dev
npx wrangler deploy   # deploy
node test/parse-test.mjs <dir-with-csvs>   # parser check against downloaded CSVs
```

Files: `src/parse.js` (sheet → JSON), `src/page.js` (HTML app shell), `src/worker.js`
(fetch/scheduled handlers), `wrangler.toml` (KV binding + cron).
