# Haven Schedule — Agent Guide

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `layout [page]` | Show structured page diagram with sections, controls, and modals | `layout analytics` |
| `layout all` | Show all 7 pages at a glance (hub, schedule, activities, analytics, goals, finance, gallery) | `layout all` |

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
| `haven-activity-completions` | `[{taskId,tag,title,completedAt}]` | Activity completion log |
| `haven-routine` | `string` | User's daily routine description |
| `haven-chickbot-profile` | `{name,pronouns,occupation,goals,routines,preferences}` | AI profile settings |
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

## Page Layouts

All pages share a common shell: `.hub-layout` (flex row) → `.hub-sidebar` (220px, nav + Spotify + footer) + `.hub-main` (flex column, scrollable).

### `layout all` — 7 Pages at a Glance

```
hub        │ hero(220px) → bento canvas → sleep → gallery cards → footer
schedule   │ hero(180px) → header+pills → time grid → FAB → pomodoro → footer
activities │ hero → board(columns) / timeline ↔ chart + activity log
analytics  │ hero → KPIs(4) → completion+streak → pie+bar charts → trend → sleep → table
goals      │ hero → goal cards(grid) → vision board(3 imgs) → related tasks → footer
finance    │ hero → income/expense KPIs → piggy+wallet → charts → table+form → intelligence
gallery    │ hero → image grid → footer
```

---

### `layout hub`

```
┌────────────────────────────────────────────────────┐
│ Sidebar (220px)         │ Main (.hub-main)          │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën     ☰ ≡  │  │ │ Hero (220px, flex-     │ │
│ │────────────────────│  │ │ shrink:0)              │ │
│ │ ● Hub              │  │ │ ┌─┬─┬─┬─┬─┬─┐         │ │
│ │ ○ Schedule         │  │ │ img│ovly│title│       │ │
│ │ ○ Activities       │  │ │ │ ceramic │greeting   │ │
│ │ ○ Analytics        │  │ │ │ Today  │ Week  │   │ │
│ │ ○ Goals            │  │ │ └─┴─┴─┴─┴─┴─┘         │ │
│ │ ○ Finance          │  │ ├───────────────────────┤ │
│ │ ○ Gallery          │  │ │ FAB (#hubAccessHub)   │ │
│ │────────────────────│  │ │ [Edit] [Add] [Guide]  │ │
│ │ [Spotify embed]    │  │ ├───────────────────────┤ │
│ │ [Prev] ▶ ⏸ [Next] │  │ │ Bento Canvas            │ │
│ │────────────────────│  │ │ (widget grid, dy-      │ │
│ │ Theme │ AI │       │  │ │ namic bubbles)          │ │
│ │ Visuals │ Settings │  │ ├───────────────────────┤ │
│ └────────────────────┘  │ │ Sleep Section           │ │
│                         │ │ [Log Sleep] tab1 tab2  │ │
│                         │ │ score ring │ metrics   │ │
│                         │ │ timeline │ routine     │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Gallery Cards           │ │
│                         │ │ [Schedule] [Activities] │ │
│                         │ │ [Tags] [Analytics]     │ │
│                         │ │ [Goals]                │ │
│                         │ ├───────────────────────┤ │
│                         │ │ footer: export/import  │ │
│                         │ └───────────────────────┘ │
│                         │                           │
│ Modals: AI Chat │ Sleep Log │ Image Picker │        │
│         Settings Bubble │ Spotify Settings          │
└────────────────────────────────────────────────────┘
```

**Key IDs:** `#hubGreeting`, `#hubDateLine`, `#statTodayBlock`, `#statWeek`, `#hubAccessHub`, `#hubFabEdit`, `#hubFabAdd`, `#hubFabGuide`, `#bentoGrid`, `#hubWeekTasks`, `#hubTotalTasks`, `#hubTagCount`, `#hubAnalyticsHint`, `#hubGoalCount`

---

### `layout schedule`

```
┌────────────────────────────────────────────────────┐
│ Sidebar                  │ Main                     │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën     +    │  │ │ Hero                  │ │
│ │────────────────────│  │ │ img → "Schedule"      │ │
│ │ ○ Hub              │  │ ├───────────────────────┤ │
│ │ ● Schedule         │  │ │ Header                │ │
│ │ ○ Activities       │  │ │ ☰→SidePanel│Today│◀Jun▶│ │
│ │ ○ Analytics        │  │ │ Wk│Mo│Ag   │badges   │ │
│ │ ○ Goals            │  │ ├───────────────────────┤ │
│ │ ○ Finance          │  │ │ Pills + subcategory   │ │
│ │ ○ Gallery          │  │ ├───────────────────────┤ │
│ │────────────────────│  │ │ Calendar Grid 7am-9pm │ │
│ │ Mini Week          │  │ ├───────────────────────┤ │
│ │────────────────────│  │ │ Timezone info bar     │ │
│ │ Spotify player     │  │ ├───────────────────────┤ │
│ │────────────────────│  │ │ Access Hub (FAB)      │ │
│ │ Theme│Settings     │  │ │ Focus│AI│SS│CopyWeek │ │
│ │ Visuals│Help       │  │ ├───────────────────────┤ │
│ └────────────────────┘  │ │ Command FAB (Ctrl+K)  │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Pomodoro Timer (float) │ │
│                         │ └───────────────────────┘ │
│ Modals: Cmd Palette │ Task │ Help │ Settings Bubble │
│         AI Chat │ Image Picker │ Spotify │Undo Toast│
└────────────────────────────────────────────────────┘
```

**Parts**

| # | Part | Description |
|---|------|-------------|
| 1 | **Sidebar** | Nav links, mini week, Spotify, footer (Theme/Settings/Visuals/Help) |
| 2 | **Hero** | Background image + "Schedule" title + week label |
| 3 | **Header** | Hamburger side panel (profile + Pages + Actions + Settings + Help), Today/prev/next, view toggles (Week/Month/Agenda), API badge, task count, holiday toggle |
| 4 | **Pill Manager** | Category chips + add button + add-popup |
| 5 | **Subcategory Bar** | Per-tag subcategory pills (drag/drop, inline edit/delete) |
| 6 | **Calendar Grid** | Mon–Sun, 7am–9pm, task blocks (drag reschedule, click edit) |
| 7 | **Timezone Info** | Local + UTC offset display |
| 8 | **Access Hub** | Floating FAB with Focus, AI, Screenshot, Copy Week bubbles |
| 9 | **Command FAB** | Ctrl+K command palette trigger |
| 10 | **Pomodoro Timer** | Floating card: ring, time, presets (5/10/25/50), start/reset |
| 11 | **Modals** | Command Palette, Task Modal, Help, Settings Bubble, AI Chat Panel, Image Picker, Spotify Settings |
| 12 | **Undo Toast** | Brief undo notification |

**Key IDs:** `#schHamburger`, `#hubMenuPanel`, `#hubMenuOverlay`, `#menuProfile`, `#menuToday`, `#menuNewTask`, `#menuTheme`, `#menuSettings`, `#menuHelp`, `#todayBtn`, `#prevWeek`, `#nextWeek`, `#weekLabel`, `#holidayToggle`, `#pmChips`, `#catAddBtn`, `#calendarGrid`, `#tzTooltip`, `#localTz`, `#utcTz`, `#accessHub`, `#accessFocusMode`, `#accessAIChat`, `#accessScreenshot`, `#accessCopyWeek`, `#cmdBtn`, `#pomodoroCard`, `#taskModal`, `#cmdPalette`, `#helpModal`, `#aiChatPanel`, `#imagePickerOverlay`, `#spOverlay`, `#undoToast`

---

### `layout activities`

```
┌────────────────────────────────────────────────────┐
│ Sidebar                  │ Main                     │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën          │  │ │ Hero (180px)           │ │
│ │────────────────────│  │ │ img │ "Activities"    │ │
│ │ ○ Hub              │  │ │ N tasks               │ │
│ │ ○ Schedule         │  │ ├───────────────────────┤ │
│ │ ● Activities       │  │ │ View: [Board] [Timeline]│ │
│ │ ○ Analytics        │  │ ├───────────────────────┤ │
│ │ ○ Goals            │  │ │ Board View (tag cols)   │ │
│ │ ○ Finance          │  │ │ ┌─────┬─────┬─────┐   │ │
│ │ ○ Gallery          │  │ │ │Deep │Meet │Exer │   │ │
│ │────────────────────│  │ │ │Work │ing  │cise │   │ │
│ │ [Spotify]          │  │ │ │ N   │ N   │ N   │   │ │
│ │────────────────────│  │ │ │ 2h  │ 30m │ 1h  │   │ │
│ │ Theme│AI│Visuals│  │  │ │ [···] [···] [···] │   │ │
│ │ Settings           │  │ │ │+Add │+Add │+Add  │   │ │
│ └────────────────────┘  │ │ └─────┴─────┴─────┘   │ │
│                         │ │ [+ Category]           │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Chart — This Week      │ │
│                         │ │ ┌───┬───┬───┬───┬───┐ │ │
│                         │ │ │   │   │   │   │   │ │ │
│                         │ │ │   │   │   │   │   │ │ │
│                         │ │ └───┴───┴───┴───┴───┘ │ │
│                         │ │ Mon Tue Wed Thu Fri    │ │
│                         │ │ total · avg/day        │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Activity Log           │ │
│                         │ │ (filtered by week)     │ │
│                         │ │ ○ Run 5k . . . Exer   │ │
│                         │ │ ○ Study . . . . Study │ │
│                         │ └───────────────────────┘ │
│ Modals: Settings │ AI Chat │ Image Picker │ Help     │
│         Spotify Settings                             │
└────────────────────────────────────────────────────┘
```

**Key IDs:** `#boardView`, `#timelineView`, `#activityChart`, `#actWeekLabel`, `#actWeekPrev`, `#actWeekNext`, `#actChartTotal`, `#actLogList`, `#actLogCount`, `#addCategoryCol`

---

### `layout analytics`

```
┌────────────────────────────────────────────────────┐
│ Sidebar                  │ Main                     │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën          │  │ │ Hero (180px)           │ │
│ │────────────────────│  │ │ img │ "Analytics"     │ │
│ │ ○ Hub              │  │ │ title + subtitle       │ │
│ │ ○ Schedule         │  │ ├───────────────────────┤ │
│ │ ○ Activities       │  │ │ Filter: [Week][Month][All]│
│ │ ● Analytics        │  │ ├───────────────────────┤ │
│ │ ○ Goals            │  │ │ KPI Row (4 cards)      │ │
│ │ ○ Finance          │  │ │ ┌──────┬──────┬──────┐│ │
│ │ ○ Gallery          │  │ │ │Tasks │ Time │Deep  ││ │
│ │────────────────────│  │ │ │      │      │Work  ││ │
│ │ [Spotify]          │  │ │ │ 12   │ 24h  │ 8h   ││ │
│ │────────────────────│  │ │ └──────┴──────┴──────┘│ │
│ │ Theme│AI│Visuals│  │  │ ├───────────────────────┤ │
│ │ Settings           │  │ │ Completion + Streak    │ │
│ └────────────────────┘  │ │ ring │ bar │ dots     │ │
│                         │ │ done/total │ current/  │ │
│                         │ │ best streak            │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Charts (2-col)         │ │
│                         │ │ ┌─────────┬─────────┐ │ │
│                         │ │ │ Pie     │ Bar     │ │ │
│                         │ │ │(cat     │(daily   │ │ │
│                         │ │ │ dist)   │breakdown│ │ │
│                         │ │ └─────────┴─────────┘ │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Weekly Trend (line)    │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Sleep (2-col)          │ │
│                         │ │ ┌─────────┬─────────┐ │ │
│                         │ │ │Duration │Quality  │ │ │
│                         │ │ │+ chart  │+ score  │ │ │
│                         │ │ └─────────┴─────────┘ │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Day-by-Day Table       │ │
│                         │ └───────────────────────┘ │
│ Modals: Settings │ AI Chat │ Image Picker │ Help     │
└────────────────────────────────────────────────────┘
```

**Key IDs:** `#statTasks`, `#statTime`, `#statDeep`, `#statStudy`, `#compRing`, `#compRingPct`, `#streakDays`, `#streakCurrent`, `#streakBest`, `#pieChart`, `#barChart`, `#trendChart`, `#sleepAnalyticsDuration`, `#sleepAnalyticsQuality`, `#analyticsTableBody`, `#detailPeriodLabel`, `#analyticsPeriodPills`

---

### `layout goals`

```
┌────────────────────────────────────────────────────┐
│ Sidebar                  │ Main                     │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën          │  │ │ Hero (180px)           │ │
│ │────────────────────│  │ │ img │ "Goals"         │ │
│ │ ○ Hub              │  │ │ N goals │ subtitle    │ │
│ │ ○ Schedule         │  │ ├───────────────────────┤ │
│ │ ○ Activities       │  │ │ Goals Bento Grid       │ │
│ │ ○ Analytics        │  │ │ (.gl-bento, 12-col)   │ │
│ │ ● Goals            │  │ │ ┌───┬───┬───┬───┬───┐ │ │
│ │ ○ Finance          │  │ │ │Goal│Goal│Goal│   │ │ │
│ │ ○ Gallery          │  │ │ │1   │2   │3   │+  │ │ │
│ │────────────────────│  │ │ │prg │prg │prg │   │ │ │
│ │ [Spotify]          │  │ │ │sub │sub │sub │   │ │ │
│ │────────────────────│  │ │ └───┴───┴───┴───┴───┘ │ │
│ │ Theme│AI│Visuals│  │  │ ├───────────────────────┤ │
│ │ Settings           │  │ │ Vision Board           │ │
│ └────────────────────┘  │ │ ┌──────┬──────┬──────┐│ │
│                         │ │ │ img1 │ img2 │ img3 ││ │
│                         │ │ └──────┴──────┴──────┘│ │
│                         │ │ Monthly Manifesto      │ │
│                         │ │ (contenteditable)      │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Related Tasks          │ │
│                         │ │ (from schedule)        │ │
│                         │ ├───────────────────────┤ │
│                         │ │ footer: export/import  │ │
│                         │ └───────────────────────┘ │
│ Modals: Settings │ AI Chat │ Image Picker │ Help     │
└────────────────────────────────────────────────────┘
```

**Key IDs:** `#glBento`, `#glGoalCount`, `#glHeroSub`, `#glVisionGrid`, `#glManifestoText`, `#glDiveGrid`, `#glDiveCount`, `#glPageMeta`

---

### `layout finance`

```
┌────────────────────────────────────────────────────┐
│ Sidebar                  │ Main                     │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën          │  │ │ Hero (180px)           │ │
│ │────────────────────│  │ │ img │ "Finance"       │ │
│ │ ○ Hub              │  │ │ savings rate + avatar │ │
│ │ ○ Schedule         │  │ ├───────────────────────┤ │
│ │ ○ Activities       │  │ │ KPI Row (2-col)       │ │
│ │ ○ Analytics        │  │ │ ┌─────────┬─────────┐ │ │
│ │ ● Goals            │  │ │ │ Income  │ Expense │ │ │
│ │ ○ Finance          │  │ │ │ $2,400  │ $1,200  │ │ │
│ │ ● Gallery          │  │ │ └─────────┴─────────┘ │ │
│ │────────────────────│  │ ├───────────────────────┤ │
│ │ [Spotify]          │  │ │ Piggy + Wallet (2-col) │ │
│ │────────────────────│  │ │ ┌─────────┬─────────┐ │ │
│ │ Theme│AI│Visuals│  │  │ │ 🐷      │ 👛      │ │ │
│ │ Settings           │  │ │ $500    │ $200    │ │ │
│ └────────────────────┘  │ │ [+/-]   │ [+/-]   │ │ │
│                         │ └─────────┴─────────┘ │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Toolbar                │ │
│                         │ │ [7D][30D][Month][All]  │ │
│                         │ │ search │ export CSV    │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Panels (2-col)         │ │
│                         │ │ ┌─────────┬─────────┐ │ │
│                         │ │ │ Table   │ Form    │ │ │
│                         │ │ │ (scroll)│ Expense │ │ │
│                         │ │ │         │ Income  │ │ │
│                         │ │ │ date/cat │amt cat │ │ │
│                         │ │ │ amount  │date note│ │ │
│                         │ │ └─────────┴─────────┘ │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Charts (2-col)         │ │
│                         │ │ category bars │ daily │ │
│                         │ ├───────────────────────┤ │
│                         │ │ Spending Intelligence  │ │
│                         │ │ [Treemap][MoM][Heat]  │ │
│                         │ │ [Flow][Merchants]     │ │
│                         │ └───────────────────────┘ │
│ Modals: Settings │ AI Chat │ Image Picker │ Help     │
└────────────────────────────────────────────────────┘
```

**Key IDs:** `#finIncome`, `#finExpenses`, `#piggyBalance`, `#piggyInput`, `#piggyAddBtn`, `#piggySubBtn`, `#walletBalance`, `#walletInput`, `#walletAddBtn`, `#walletSubBtn`, `#piggyChart`, `#walletChart`, `#finTable`, `#finAmount`, `#finCategory`, `#finDate`, `#finNote`, `#finAddBtn`, `#finChart`, `#finCategoryBars`, `#finAdvTabs`, `#finAdvBody`

---

### `layout gallery`

```
┌────────────────────────────────────────────────────┐
│ Sidebar                  │ Main                     │
│ ┌────────────────────┐  │ ┌───────────────────────┐ │
│ │ H  Havën          │  │ │ Hero (180px)           │ │
│ │────────────────────│  │ │ img │ "Gallery"       │ │
│ │ ○ Hub              │  │ │ N images │ subtitle   │ │
│ │ ○ Schedule         │  │ │ avatar ceramic        │ │
│ │ ○ Activities       │  │ ├───────────────────────┤ │
│ │ ○ Analytics        │  │ │ Top Actions            │ │
│ │ ○ Goals            │  │ │ "Vision Board"  [Reset]│ │
│ │ ○ Finance          │  │ │                 [+ Add]│ │
│ │ ● Gallery          │  │ ├───────────────────────┤ │
│ │────────────────────│  │ │ Image Grid (#galGrid)  │ │
│ │ [Spotify]          │  │ │ ┌────┬────┬────┬────┐ │ │
│ │────────────────────│  │ │ │    │    │    │    │ │ │
│ │ Theme│AI│Visuals│  │  │ │ img │ img │ img │ img│ │ │
│ │ Settings           │  │ │ │    │    │    │    │ │ │
│ └────────────────────┘  │ │ ├────┼────┼────┼────┤ │ │
│                         │ │ │    │    │    │    │ │ │
│                         │ │ └────┴────┴────┴────┘ │ │
│                         │ ├───────────────────────┤ │
│                         │ │ footer: export/import  │ │
│                         │ └───────────────────────┘ │
│ Modals: Settings │ AI Chat │ Image Picker │ Help     │
│         Spotify Settings                             │
└────────────────────────────────────────────────────┘
```

**Key IDs:** `#galGrid`, `#galCount`, `#galImageCount`, `#galHeroSub`, `#galAddBtn`, `#galResetBtn`, `#galPageMeta`

---

## Removed Features (do not reintroduce)

- html2canvas CDN (screenshot uses native canvas)
- Focus popup, glow ring, focus-progress CSS
- `hubFabChat` (AI chat removed from hub FAB)
- Finance Savings KPI card (renamed to Balance, then removed)
- Text widget type in bento canvas
- Rate stat in progress widget
