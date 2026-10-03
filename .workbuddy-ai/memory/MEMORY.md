# Havën Schedule — Project Memory

Curated long-term notes. Daily logs live in this folder as `YYYY-MM-DD.md`.

## Testing this app in a browser — read this first

**Every app page except `rhythm.html` redirects to `landing.html` when there is no session.**
`index.html`, `schedule.html` etc. all load `js/gsi.js`, which bounces an unauthenticated
visitor away. So a headless `--dump-dom` or `--screenshot` of `index.html` silently returns
`landing.html` (176 KB, identifiable by `id="line1"`), and anything you injected is lost on
navigation. This wasted a lot of time on 2026-09-21 before I spotted it.

Consequences:
- To preview a logged-in page, either sign in for real, or build a harness that strips
  `js/gsi.js` and the Supabase scripts.
- If a dumped DOM is ~176 KB or contains `id="line1"`, you are looking at `landing.html`,
  not the page you asked for.
- Chrome's `--virtual-time-budget` stalls while external CDNs are pending. Use
  `--proxy-bypass-list=127.0.0.1;localhost;<-loopback>` so localhost bypasses the system
  proxy while the CDNs still load. Plain `--no-proxy-server` breaks the CDN requests.
- Always use a **fresh** `--user-data-dir`; the service worker precaches `index.html` and
  will otherwise serve you a stale copy.

`agent-browser` is not installed on this machine and wants ~500 MB of Chromium. Chrome and
Edge are already present, so `chrome --headless=new --screenshot` is the cheaper route.

## Rhythm removed (2026-09-24)

- The setup wizard, `?rhythm=1` / `?redo=1` entry points, `needsSetup` routing, Settings
  "Rhythm setup", and `markRhythmDone` are all gone. `rhythm.html` is a redirect stub to
  `login.html?stay=1`. `js/rhythm.js` is orphaned (not loaded by any page).
- Schedule pills default to none: `TAG_ORDER = []` in `js/shared.js`. Builtins are no longer
  pre-seeded; users add categories via the pill manager (`addCustomCategory`).
- Auth always finishes to `index.html`. `createLocalProfile(name)` no longer takes opts.

## Do not trust AGENTS.md

`AGENTS.md` at the project root is **out of date**. Verified wrong on 2026-09-19:

- It lists `TAG_ORDER` as `['deep-work','meeting','exercise','study','hobby']`. **Actual** (`js/shared.js:520`): `['daily','math','physics','bio','chem','eng','mandarin']`.
- It describes the app as a general life-OS. In practice it is currently a **school-subject tracker** — six subjects plus "Daily".

Always verify category/tag claims against `js/shared.js` (`TAG_ORDER`, `TAG_LABELS`, `TAG_COLORS`, `getDefaultSubcategories`) rather than AGENTS.md. Worth offering to regenerate AGENTS.md.

## Real current configuration

- Categories: `daily` (Daily), `math` (Math), `physics` (Physics), `bio` (Bio), `chem` (Chem.), `eng` (Eng), `mandarin` (Mandarin)
- Subcategories live in `haven-subcategories` as `{tag: [names]}`, defaults from `getDefaultSubcategories()` (`js/shared.js:577`)
- Custom categories live in `haven-schedule-categories` as `[{id, label, color}]`
- Subcategories are **two levels only** (category → name). There is no third level, so subject → topic → subtopic is not currently expressible.

## Storage keys that matter

| Key | Contents |
|---|---|
| `haven-schedule-tasks` | All schedule tasks (the main data) |
| `haven-schedule-profile` | User profile + AI conversation memory |
| `haven-subcategories` | Subcategory presets per tag |
| `haven-schedule-categories` | Custom categories |
| `haven-activities-completions` | Activity completion log (note: plural "activities") |
| `haven-schedule-goals` / `haven-schedule-finance` / `haven-piggybank` / `haven-wallet` | Goals, money |
| `haven-gallery-layout` | Gallery layout |

## Backup situation (as of 2026-09-19)

`exportData()` in `js/shared.js` is the real data backup. It previously saved **only tasks and sleep** — goals, finance, piggybank, wallet, activity completions and gallery layout were all missing. Fixed. `exportAllData()` in `js/settings.js` is a separate, settings-only export; its name is misleading.

## Deployment

- Repo: `github.com/HansKentang/Hans-Scedule`, deployed to GitHub Pages via `.github/workflows/deploy.yml`
- Served from a **subpath**: `hanskentang.github.io/Hans-Scedule/`
- **Consequence:** any root-absolute path (`/index.html`) breaks. The service worker and manifest had this bug and the PWA never installed when deployed. Fixed 2026-09-19 — keep all PWA paths relative.
- The service worker is **network-first**, so during local development edits appear immediately. No cache-busting needed.

## Verification habits that work here

- `node --check` on every JS file after edits
- Validate `manifest.json` and `package.json` as JSON
- Serve locally and `curl` every service-worker precache path for HTTP 200
- Static scan for broken script/link refs and duplicate element IDs (one known false positive: `authToggleBtn` in `login.html` is replaced dynamically)

## localStorage is account-scoped by a monkey-patch

`js/shared.js:1870-1900` wraps `localStorage.getItem/setItem/removeItem`. Every key is passed through `_p(key)`, which prefixes it with `getStoragePrefix()` (the active account id) — **unless** the key starts with `haven-gsi-`, `firestore_`, or `firebase_`.

Consequences:
- Any new key you invent is automatically per-account. No extra work needed.
- Always read and write through the plain `localStorage` API so you get the prefix. Reading via `__origLS` bypasses it and will miss the data.
- `getStoragePrefix()` returns empty when there is no active account, so keys stay unprefixed in guest/legacy mode.
- The wrapper **swallows `QuotaExceededError` silently** (`shared.js:1889-1898`). Any write can fail with no error and no return value. Use `safeSetItem()` (which verifies and retries) when the write matters.

## Concurrent editing warning

On 2026-09-19 an unexplained, high-quality edit landed in `js/gsi.js` mid-session (account-switch retry logic, `_leaveGuestSession`, guarded `migrateExistingData`), plus a `.freebuff/` directory appeared. Not made by me. If more than one agent/tool is editing this repo at once, changes will eventually collide — worth confirming only one writer is active.

## Architecture moved on (observed 2026-09-20)

The project changed materially since the 2026-09-19 session — not by me:

- **Supabase has replaced Firestore.** `index.html` now loads `@supabase/supabase-js` + `js/supabase.js` + `js/supabase-sync.js`, and no longer loads `firestore-sync.js`. New files: `js/supabase.js`, `js/supabase-sync.js`.
- **A premium tier was added**: `premium.html`, `js/premium.js`, `js/premium-config.js`.
- All new files are correctly listed in the service-worker precache, and every page (including `rhythm.html`) loads the full script set. Whoever did this was thorough.
- `js/supabase-sync.js` defines `CLOUD_EXCLUDED_KEYS`, which now excludes `haven-schedule-apikey` and `haven-admin-password` from cloud sync — this closes finding H10 from the 2026-09-19 audit.
- Several diff/log scratch files appeared in the root: `backup_diff.txt`, `chrome_err.txt`, `gsi_diff_out.txt`, `gsi_head_diff.txt`, `shared_diff.txt`, `style_diff.txt`, `__dom-dump.html`, `__spotify-test.html`. These look like debugging leftovers and are worth cleaning up.

**Still true:** two backends have now existed in this repo's history. Before assuming anything about sync, read `js/supabase-sync.js` rather than the older `firestore-sync.js`.

## Pending decisions from Hans

- Narrow fix for `toTimeStr` (no `% 1440`, persists `"28:45"`). The global fix is unsafe — three AI prompt strings depend on the grid reading `"05:00 – 29:00"`.
- Whether to apply the behaviour-changing fixes: streak math, day-by-day table, period filter, work-hours positioning.
- Whether to re-enable the hub on mobile (currently `HUB_MOBILE_DISABLED = true`).
- Check Firestore security rules in the Firebase Console — not in the repo, so unverifiable from source.
- Change the admin password before the hardcoded default (`MjcwODEw`) is removed.
