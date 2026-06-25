# Haven Schedule — Agent Guide

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `layout [page]` | Show full page structure as ASCII diagram | `layout finance` |
| `layout [page]` | Diagrams: finance, schedule, activities, hub | `layout schedule` |

## Code Conventions

- **No comments** in code unless requested
- **No emojis** unless explicitly asked
- **No README/doc files** unless explicitly requested
- Prefer editing existing files over creating new ones

## Architecture

| File | Role |
|------|------|
| `shared.js` | Core state, storage (localStorage + IndexedDB), helpers, AI |
| `schedule.js` | Schedule page logic: grid, tasks, drag/drop, focus |
| `hub-visuals.js` | Bento canvas hub: bubbles, undo/redo, widgets |
| `schedule.html` | Schedule page DOM + CSS |
| `finance.html` | Finance page DOM + CSS |
| `activities.html` | Activities page DOM + CSS |
| `index.html` | Hub page DOM + CSS |

## Key Storage Keys

| Key | Format | Used By |
|-----|--------|---------|
| `haven-schedule-categories` | `[{id, label, color}]` | Custom schedule categories |
| `haven-schedule-tasks` | `[{...}]` | All schedule tasks |
| `haven-schedule-profile` | `{...}` | User profile + AI memory |
| `haven-subcategories` | `{tag: [...]}` | Subcategory presets per tag |
| `haven-hub-layout` | `[{x,y,w,h,t,id}]` | Bento canvas layout |
| `haven-image-*` / `hub-image-*` | Data URL | Image widget cache (IndexedDB primary) |
| `haven-custom-tags` | `[{id, name, color}]` | Custom tags for board/activities |
| `haven-card-colors` | `{tag: {light, dark}}` | Per-tag card color overrides |

## CSS Variables

| Variable | Purpose |
|----------|---------|
| `--accent` | Primary accent (used across all pages) |
| `--bg-primary` / `--bg-secondary` | Page / section backgrounds |
| `--border-color` / `--border-subtle` | Borders |
| `--text-primary` / `--text-secondary` / `--text-tertiary` | Text hierarchy |
| `--tag-{id}-text` / `--tag-{id}-bg` | Per-tag chip & task colors |
| `--chip-accent` | Dynamic per-chip CSS custom property |
| `--shadow-lg` / `--t-fast` | Shadows / transition speed |

## Important Constants

| Constant | Value | File |
|----------|-------|------|
| `TAG_ORDER` | `['deep-work','meeting','exercise','study','hobby']` + custom | `shared.js` |
| `BUILTIN_TAGS` | `['deep-work','meeting','exercise','study','hobby']` | `shared.js` |
| `START_HOUR` | `7` (grid start) | `shared.js` |
| `VISIBLE_HOURS` | `14` (grid span) | `shared.js` |
| `BENTO_UNDO_MAX` | `30` | `hub-visuals.js` |

## Critical Rules

1. **Undo/redo**: Always call `pushUndoState()` before any bento layout mutation
2. **Drag/resize**: Deep clone layout at start; `resolveBubbleCollisions()` only on mouseup (not during mousemove)
3. **Canvas guide**: z-index `1002` (must be > hub-popup-overlay at `1001`)
4. **Image widgets**: `setImage()` saves to IndexedDB + best-effort localStorage; `getImage()` reads localStorage first, merges from IndexedDB async
5. **Focus mode**: One-click toggle + toast only — no popup, no glow ring, no special CSS
6. **Screenshot**: Pure canvas render (no html2canvas) — uses `state.currentWeekStart`, `state.tasks`, `TAG_COLORS`, `START_HOUR`, `VISIBLE_HOURS`
7. **AI memory**: Facts stored in `state.userProfile.conversationMemory`, persisted under `haven-schedule-profile`
8. **Built-in categories**: `deep-work`, `meeting`, `exercise`, `study`, `hobby` — cannot be deleted

## Removed Features (do not reintroduce)

- html2canvas CDN (screenshot uses native canvas)
- Focus popup, glow ring, focus-progress CSS
- `hubFabChat` (AI chat removed from hub FAB)
- Finance Savings KPI card (renamed to Balance, then removed)
- Text widget type in bento canvas
- Rate stat in progress widget
