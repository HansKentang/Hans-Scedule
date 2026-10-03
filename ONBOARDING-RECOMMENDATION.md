# Recommendation — Onboarding Page + Category System

_Written 2026-09-19. Recommendation only — nothing in the app has been changed._

---

## Part 0 — A correction before anything else

Earlier in our conversation I described your categories as *Deep Work, Meeting, Exercise, Study, Hobby*. **That was wrong.** I took it from `AGENTS.md`, which is stale.

Your real categories, read from `js/shared.js:520` and `:1041`:

| Tag | Label | Current subcategories |
|---|---|---|
| `daily` | Daily | Chores, Errands, Meals, Routines, Exercise, Self-care, Shopping, Cleaning, Laundry, Cooking, Walking, Rest |
| `math` | Math | Algebra, Calculus, Geometry, Statistics, Trigonometry, Problem Set |
| `physics` | Physics | Mechanics, Thermodynamics, Electromagnetism, Optics, Quantum, Lab |
| `bio` | Bio | Cell Bio, Genetics, Ecology, Anatomy, Evolution, Lab |
| `chem` | Chem. | Organic, Inorganic, Physical Chem, Lab, Reactions, Equations |
| `eng` | Eng | Essay, Reading, Grammar, Vocabulary, Literature, Writing |
| `mandarin` | Mandarin | Vocabulary, Grammar, Reading, Writing, Speaking, HSK |

Two things follow from this:

1. **Your app is currently a school-subject tracker**, not a life-OS. Six subjects plus "Daily".
2. **Your existing subcategories are good.** Someone thought about them. Whatever we build should not throw them away.

This reframes the whole request. You asked to "replace entirely" — but you were replacing the categories I *described*, which weren't yours. **Read Part 4 before deciding.** You may want to keep more than you expected.

---

## Part 1 — The name

The page's job: learn who the user is, then generate their schedule presets.

**My recommendation: `Rhythm`**

Why this one:
- It describes the *output*, not the process. The page doesn't produce "settings", it produces your daily pattern.
- It's warm and human, which matches Havën's whole aesthetic.
- It works as a nav label, a page title, and a verb: *"Set your rhythm."*
- It's one word, memorable, and not jargon.

**Alternatives, with honest trade-offs:**

| Name | Feel | Trade-off |
|---|---|---|
| **Calibrate** | Precise, technical | More distinctive than Rhythm, but colder. Fits a tool, less a haven. |
| **Blueprint** | Structural | Good metaphor for a plan, but implies a fixed design rather than a living pattern. |
| **Compass** | Directional | Nice, but suggests goals and direction more than daily structure — overlaps your Goals page. |
| **Setup** | Plain | Zero confusion about what it does. Zero personality. Forgettable. |

**One caveat on `Rhythm`:** you already have a sleep section, and "rhythm" can read as *sleep* rhythm. If that bothers you, **Calibrate** is the strongest alternative and avoids the collision entirely.

---

## Part 2 — What the page asks

Six questions. Target: under 90 seconds. Every question must earn its place, because this is the first thing a new user sees.

### Q1 — Who are you right now?
_Single select. This is the main branch — everything else adjusts around it._

- Student
- Working full-time
- Working and studying
- Freelancing / self-employed
- Looking for work
- Taking a break / between things
- Retired

### Q2 — What matters most to you?
_Multi-select, 3–5. Determines which optional categories get created._

Health & body · Learning & skills · Work & career · People & relationships · Money · Creative work · Rest & recovery · Faith & community · Home & chores

### Q3 — When does your day run?
_Wake time and sleep time._

This is the highest-value question in the set. Your grid already spans 5am to 5am, and this is what lets the app place sensible blocks instead of leaving the user staring at an empty 24-hour grid.

### Q4 — Do you have fixed commitments?
_Multi-select._

Classes & lectures · Office hours / shifts · Regular meetings · Training or practice · Religious commitments · Nothing fixed — my time is flexible

This decides whether the app creates *recurring* blocks. A student with 8am classes needs a very different default week from a freelancer with no fixed hours.

### Q5 — How do you want your day to look?
_Single select._

- **Tightly planned** — most hours blocked out
- **A few anchors** — key blocks fixed, the rest flexible
- **Just the essentials** — only the things that can't move

This is the question most apps forget, and it's the one that decides whether a preset feels helpful or oppressive. A tightly-blocked week handed to someone who likes loose structure gets abandoned in three days.

### Q6 — Anything you're working toward?
_Optional free text._

> *"O-levels in November"* · *"Learning to draw"* · *"Getting fit again"*

Used to name their focus category and seed a first goal. One sentence from the user makes the whole app feel personal.

---

## Part 3 — How the presets get generated

The page writes to two keys your app already uses. **No new storage needed.**

| Key | Shape | Written by |
|---|---|---|
| `haven-schedule-categories` | `[{id, label, color}]` | The categories created |
| `haven-subcategories` | `{tag: [names]}` | The subcategory presets |

Generation logic, in order:

1. **Q1 → picks the Focus category.** Student gets *Study*, worker gets *Work*, freelancer gets *Client Work*, job-seeker gets *Job Search*. This is the category their time actually goes into.
2. **Q2 → adds optional modules.** Each selected area maps to a category. Selecting nothing gets sensible defaults so the app is never empty.
3. **Q3 → sets the grid bounds** and places the default blocks (morning routine, focus block, meals, wind-down).
4. **Q4 → creates recurring blocks** for fixed commitments.
5. **Q5 → decides how many categories and how much is prefilled.** "Just the essentials" creates five categories and almost no prefilled blocks. "Tightly planned" creates up to ten and fills the day.
6. **Q6 → names the Focus category** more specifically and creates one goal.

**Critical design rule:** the page must be re-runnable. A user's life changes — they finish school, start a job. There must be a way back in, and re-running it should *offer* to update presets rather than silently overwriting a schedule they've been building for months.

---

## Part 4 — The category system

### The architectural decision you need to make

This is the most important choice in this document, so let me lay it out plainly.

Your current system has **two levels**: category → subcategory.
- Math → Algebra, Calculus, Geometry

If we make *Study* the top-level category, your subjects become subcategories:
- Study → Math, Physics, Bio, Chem, Eng, Mandarin

…and then **Algebra and Calculus have nowhere to go.** You'd lose a level of detail you already have.

Three options:

| Option | Structure | Result |
|---|---|---|
| **A. Subjects stay top-level** | Math, Physics, Bio… remain categories alongside life categories | Keeps everything you have. But a student ends up with ~12 categories. |
| **B. Subjects become subcategories** | Study → Math, Physics, Bio… | Cleaner and more general. **Loses your topic detail.** |
| **C. Add a third level** | Study → Math → Algebra | Best structure by far. Requires changing how subcategories are stored. |

**My recommendation: Option A now, Option C when you're ready.**

Option A costs nothing, keeps your data, and is immediately better than what you have — you keep every subject *and* gain the life categories around them. Option C is the right long-term answer, but it's a storage-format change and shouldn't be bundled into this.

### The category set

**Core — created for everyone (5):**

1. **Focus** — renamed by user type
2. **Health**
3. **Daily**
4. **People**
5. **Rest**

**Modules — created from Q2 answers (up to 5):**

6. **Learning**
7. **Creative**
8. **Money**
9. **Faith**
10. **Home**

Five core plus up to five modules gives a range of 5–10 categories. That maps neatly onto Q5's answer: "just the essentials" takes the core five, "tightly planned" takes all ten.

### Full subcategory sets

Every category below has 10+ subcategories. You asked for detailed, so these are thorough — expect to delete a few.

**1. Focus — Student variant ("Study")**
Lectures · Lab / practical · Revision · Problem sets · Assignments · Exam prep · Past papers · Group project · Reading · Notes / summarising · Research · Final project

**1b. Focus — Worker variant ("Work")**
Deep work · Meetings · 1:1s · Email · Team chat · Planning / standup · Documentation · Reviews · Focus block · Reporting · Learning on the job · Commute

**1c. Focus — Freelancer variant ("Client Work")**
Client calls · Proposals · Billable work · Revisions · Invoicing · Contracts · Marketing / portfolio · Networking · Project planning · Admin · Skill building · Inbox

**1d. Focus — Job search variant ("Job Search")**
Applications · CV tailoring · Company research · Networking · Interview prep · Interviews · Follow-ups · Skill building · Portfolio · Recovery

**1e. Focus — Between things ("Growth")**
Learning · Reading · Exercise · Creative practice · Volunteering · Reflection · Planning · Health · Exploration

**2. Health**
Gym / strength · Cardio · Sport · Stretching / mobility · Walking · Meals · Cooking · Hydration · Sleep routine · Mental health · Medical appointment · Rest day

**3. Daily**
Chores · Errands · Groceries · Cleaning · Laundry · Cooking · Shopping · Routines · Self-care · Bills · Appointments · Repairs

**4. People**
Family · Friends · Partner · Calls & messages · Community / organisation · Events · Helping someone · Networking · Mentoring · Celebrations

**5. Rest**
Unwind · Entertainment · Games · Social media · Nap · Meditation · Music · Reading for fun · Walking · Buffer / catch-up

**6. Learning**
Online course · Language practice · Reading (non-fiction) · Skill practice · Tutorials · Notes / review · Practice project · Certification prep · Podcasts · Flash cards

**7. Creative**
Writing · Drawing / design · Music practice · Video / editing · Photography · Side project · Ideation · Publishing · Learning craft · Collaboration

**8. Money**
Budgeting · Expense tracking · Bill payments · Savings · Side income · Investing · Financial learning · Tax · Big purchase planning · Debt

**9. Faith**
Prayer / worship · Religious study · Service / volunteering · Community event · Reflection · Charity · Mentoring · Reading

**10. Home**
Deep clean · Tidying · Laundry · Groceries · Cooking · Repairs · Organising · Decorating · Garden · Pet care

### Where your subjects go (Option A)

Your six subjects stay exactly as they are — categories in their own right, with their current subcategories untouched:

**Math** (Algebra, Calculus, Geometry, Statistics, Trigonometry, Problem Set) — and consider adding *Linear Algebra*, *Vectors*, *Practice Papers*, *Formula Review*

**Physics** (Mechanics, Thermodynamics, Electromagnetism, Optics, Quantum, Lab) — consider *Waves*, *Circuits*, *Practice Papers*

**Bio** (Cell Bio, Genetics, Ecology, Anatomy, Evolution, Lab) — consider *Physiology*, *Plant Bio*, *Diagrams*

**Chem.** (Organic, Inorganic, Physical Chem, Lab, Reactions, Equations) — consider *Stoichiometry*, *Periodic Table*, *Practice Papers*

**Eng** (Essay, Reading, Grammar, Vocabulary, Literature, Writing) — consider *Comprehension*, *Listening*, *Speaking*

**Mandarin** (Vocabulary, Grammar, Reading, Writing, Speaking, HSK) — consider *Listening*, *Characters*, *Mock Tests*

And **Daily** stays as-is, though some of its entries (Exercise, Walking) could move under Health if you want cleaner separation.

---

## Part 5 — The user-type presets

| Type | Focus category | Modules added | Notes |
|---|---|---|---|
| **Student** | Study (+ subjects as categories) | Learning, People | Class blocks created from Q4 |
| **Working full-time** | Work | Money, Learning | Office hours shape the week |
| **Working and studying** | Work + Study | Money | Heaviest load. Needs an explicit buffer block — this person burns out otherwise. |
| **Freelancing** | Client Work | Money, Creative | Irregular by nature. Needs an admin block, or invoicing never happens. |
| **Looking for work** | Job Search | Learning, Money | Structure matters more than ever. Job hunting is exhausting — include Recovery. |
| **Between things** | Growth | Health, Creative | Gentle structure. Do not overfill — this is the preset most likely to feel like pressure. |
| **Retired** | Personal Projects | Home, Faith, People | Health and People weighted higher. |

Each preset should also set **default block times** for its type. A student's preset might place a focus block at 19:00 after school; a freelancer's at 09:00; a retiree's in the morning.

---

## Part 6 — What I'd build first

If you want this built, here's the order I'd suggest:

1. **`Rhythm` page shell** — the six questions, no generation logic. Just collect and store the answers. Testable on its own.
2. **Generation logic** — turn answers into categories and subcategories. Show a preview before applying, so the user sees what they're getting.
3. **Re-run protection** — detect existing categories and offer "update presets" rather than overwrite.
4. **Option C, later** — the third level (Study → Math → Algebra), once the rest is stable.

**One thing to decide before building:** what happens to a user's *existing* tasks if their categories change? Your tasks store a `tag` field. If a category disappears, its tasks become orphaned and will render with a missing colour and a blank label. Any preset change needs a migration step, or users lose their history. **This is the single most dangerous part of this feature** — worth designing before writing any code.

---

## Summary

| Question | Answer |
|---|---|
| Name | **Rhythm** (alternative: Calibrate, if the sleep-rhythm collision bothers you) |
| Questions | 6, under 90 seconds |
| Storage | Reuses `haven-schedule-categories` and `haven-subcategories` — no new keys |
| Architecture | 5 core categories + up to 5 optional modules |
| Your subjects | **Keep them** — Option A preserves all your existing data and detail |
| Biggest risk | Orphaned tasks when categories change |
