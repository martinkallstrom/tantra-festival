// Festival registry: everything festival-specific lives here. Adding a
// festival = one entry + assets in public/ + (optionally) leader rows.

export const FESTIVALS = {
  tantra: {
    slug: 'tantra',
    name: 'Tantra Festival',
    shortName: 'Tantra',
    siteName: 'Ängsbacka Tantra Festival',
    title: 'Tantra Festival · Ängsbacka',
    eyebrow: 'ÄNGSBACKA · JULY 14–19 2026',
    metaDescription: 'Mobile-friendly schedule for the Ängsbacka Tantra Festival, July 14–19 2026.',
    ogTitle: 'Tantra Festival · Ängsbacka — July 14–19 2026',
    ogDescription: 'The full festival schedule: six days of workshops, ceremonies and celebration at Ängsbacka.',
    ogImageAlt: 'Colorful mural of dancing figures, lotus flowers and swirling flames',
    nownote: 'The festival has not started yet — the Now view lights up July 14–19.',
    start: '2026-07-14',
    end: '2026-07-19',
    utcOffsetMin: 120, // CEST
    minEvents: 20,
    icsProdId: '-//angsbacka//tantra//EN',
    sheet: {
      pubBase: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTbrtJeSyuzedXiLglt5h0R6UXqdZTqzFT85ONTJbQ0AhxxdEi2_JsRui59zv17o7V2aRg2xhTFhPZO/pub',
      fallbackTabs: [
        { name: 'Tue 14/7', gid: '1827807072' },
        { name: 'Wed 15/7', gid: '925929911' },
        { name: 'Thu 16/7', gid: '930766156' },
        { name: 'Fri 17/7', gid: '1895701359' },
        { name: 'Sat 18/7', gid: '1621748034' },
        { name: 'Sun 19/7', gid: '1542967329' },
        { name: 'CODES', gid: '434437882' },
      ],
    },
    codes: {
      kind: 'list',
      known: ['ALL', 'BEGINNERS', 'PHILOSOPHY', 'FIXED PAIRS', 'TOUCH', 'NUDITY',
        'POSSIBLY NUDITY', 'BOLD', 'FEMALE', 'MALE'],
      warn: ['NUDITY', 'POSSIBLY NUDITY', 'BOLD'],
      legend: null, // from the sheet's CODES tab
    },
    parse: { extraJunk: [] },
    assets: {
      bg: '/bg-tantra.jpg',
      og: '/og-tantra.jpg',
      icon180: '/icon-180-tantra.png',
      icon192: '/icon-192-tantra.png',
      icon512: '/icon-512-tantra.png',
      manifest: '/manifest-tantra.webmanifest',
      favicon: '🌹',
    },
    theme: {
      mode: 'dark',
      fontsHref: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,650;1,9..144,500&family=Karla:wght@400;500;700&family=Spline+Sans+Mono:wght@500&display=swap',
      fontDisplay: 'Fraunces,serif',
      fontBody: 'Karla,system-ui,sans-serif',
      fontMono: '"Spline Sans Mono",monospace',
      tokens: {
        bg: '#2a1019', surface: '#3b1a22', 'surface-2': '#4a212c',
        text: '#f9edd5', muted: '#d4b29e', faint: '#97705f',
        accent: '#e5518d', 'accent-2': '#f2a93b', line: '#5c2d36',
        'on-accent': '#38101f', 'on-accent-2': '#3a2306',
        'header-bg': 'rgba(42,16,25,.95)',
        'overlay-veil': 'rgba(24,8,15,.7)',
        'shadow-card': '0 4px 18px rgba(20,6,12,.4)',
        'shadow-plate': '0 6px 24px rgba(20,6,12,.45)',
        'shadow-pill': '0 4px 14px rgba(20,6,12,.4)',
        'hairline': 'rgba(59,26,34,.75)',
        'footer-plate': 'rgba(59,26,34,.92)',
        'banner-grad': 'linear-gradient(120deg,rgba(242,169,59,.2),rgba(229,81,141,.16))',
        'banner-border': 'rgba(242,169,59,.5)',
        'warn-border': '#9c4258', 'warn-text': '#f088b2',
        'venue-fallback': '#c9ad96',
        'bg-fixed-veil': 'none',
      },
      venueColors: {
        'BIG BARN': '#f2688c', 'UPPER BARN': '#8fb3e8', 'BIG ANNEX': '#5ec6a2',
        'HEART TENT': '#f28a52', 'SATSANG TENT': '#f2b544', 'STRAWBALE HOUSE': '#84c5e8',
        'GARDEN TENT': '#aac36a', 'DAKINI TEMPLE (CAFÉ ATTIC)': '#e08fd8', 'OTHER': '#c9ad96',
      },
    },
  },

  sexsibility: {
    slug: 'sexsibility',
    name: 'Sexsibility Festival',
    shortName: 'Sexsibility',
    siteName: 'Ängsbacka Sexsibility Festival',
    title: 'Sexsibility Festival · Ängsbacka',
    eyebrow: 'ÄNGSBACKA · AUGUST 4–9 2026',
    metaDescription: 'Mobile-friendly schedule for the Ängsbacka Sexsibility Festival, August 4–9 2026.',
    ogTitle: 'Sexsibility Festival · Ängsbacka — August 4–9 2026',
    ogDescription: 'The full festival schedule: six days of workshops, ceremonies and celebration at Ängsbacka.',
    ogImageAlt: 'Soft pastel artwork in sand, sage and raspberry tones',
    nownote: 'The festival has not started yet — the Now view lights up August 4–9.',
    start: '2026-08-04',
    end: '2026-08-09',
    utcOffsetMin: 120, // CEST
    minEvents: 15,
    icsProdId: '-//angsbacka//sexsibility//EN',
    sheet: {
      pubBase: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzG34ciEYTE7PEOVytCSRiEs1LV0JhTTuMGSbnt8a5uZ8XBYlN6R-QjPxi9bltppfu81U3ZNbbnGqf/pub',
      fallbackTabs: [
        { name: 'Tue 4/8', gid: '358299888' },
        { name: 'Wed 5/8', gid: '1809356609' },
        { name: 'Thu 6/8', gid: '1992000692' },
        { name: 'Fri 7/8', gid: '709741581' },
        { name: 'Sat 8/8', gid: '1461469779' },
        { name: 'Sun 9/8', gid: '755894913' },
      ],
    },
    codes: {
      kind: 'chili',
      warn: ['2 CHILIS', '3 CHILIS'],
      legend: [
        { code: '0 CHILI', desc: 'Soft and gentle — everyone welcome' },
        { code: '1 CHILI', desc: 'Mild — a little edge, fully guided' },
        { code: '2 CHILIS', desc: 'Spicy — expect intensity or intimacy' },
        { code: '3 CHILIS', desc: 'Very spicy — bold and challenging' },
      ],
    },
    parse: { extraJunk: ['chili'] }, // bare "CHILI" is the template placeholder
    assets: {
      bg: '/bg-sexsibility.jpg',
      og: '/og-sexsibility.jpg',
      icon180: '/icon-180-sexsibility.png',
      icon192: '/icon-192-sexsibility.png',
      icon512: '/icon-512-sexsibility.png',
      manifest: '/manifest-sexsibility.webmanifest',
      favicon: '🌶',
    },
    theme: {
      mode: 'light',
      fontsHref: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Karla:wght@400;500;700&family=Spline+Sans+Mono:wght@500&display=swap',
      fontDisplay: '"Cormorant Garamond",serif',
      fontBody: 'Karla,system-ui,sans-serif',
      fontMono: '"Spline Sans Mono",monospace',
      tokens: {
        bg: '#f7f2e8', surface: '#ffffff', 'surface-2': '#f1e9d8',
        text: '#33414b', muted: '#6d7f89', faint: '#9aa7ad',
        accent: '#b11e54', 'accent-2': '#336498', line: '#e0d6c2',
        'on-accent': '#ffffff', 'on-accent-2': '#ffffff',
        'header-bg': 'rgba(251,248,241,.95)',
        'overlay-veil': 'rgba(51,65,75,.4)',
        'shadow-card': '0 4px 18px rgba(72,88,98,.14)',
        'shadow-plate': '0 6px 24px rgba(72,88,98,.16)',
        'shadow-pill': '0 4px 14px rgba(72,88,98,.14)',
        'hairline': 'rgba(131,173,164,.6)',
        'footer-plate': 'rgba(255,255,255,.92)',
        'banner-grad': 'linear-gradient(120deg,rgba(131,173,164,.28),rgba(220,221,180,.35))',
        'banner-border': 'rgba(131,173,164,.8)',
        'warn-border': '#d8a0b6', 'warn-text': '#b11e54',
        'venue-fallback': '#9a8c76',
        'bg-fixed-veil': 'none',
      },
      venueColors: {
        'BIG BARN': '#b11e54', 'UPPER BARN': '#336498', 'BIG ANNEX': '#4e8f80',
        'HEART TENT': '#c4703d', 'SATSANG TENT': '#a08b2c', 'GARDEN TENT': '#6a9a44',
        'SMALL ANNEX': '#7a68b5', 'MORE': '#8a7a66', 'EVEN MORE': '#5e7a8a',
        'OTHER': '#9a8c76',
      },
    },
  },
};

export const FESTIVAL_LIST = Object.values(FESTIVALS);

// Ongoing festival, else the next upcoming, else null (dates are inclusive;
// festival days run past midnight, so `end` extends to 06:00 the day after).
export function pickFestival(now = new Date()) {
  const t = now.getTime();
  const ongoing = FESTIVAL_LIST.find((f) => {
    const s = new Date(f.start + 'T00:00:00+02:00').getTime();
    const e = new Date(f.end + 'T00:00:00+02:00').getTime() + 30 * 3600 * 1000;
    return t >= s && t <= e;
  });
  if (ongoing) return ongoing;
  const upcoming = FESTIVAL_LIST
    .filter((f) => new Date(f.start + 'T00:00:00+02:00').getTime() > t)
    .sort((a, b) => a.start.localeCompare(b.start));
  return upcoming[0] || null;
}
