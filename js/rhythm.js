/* ============================================
   Havën Schedule — Rhythm
   Onboarding: learn who the user is, generate
   schedule categories + subcategory presets.
   ============================================ */

const RHYTHM_ANSWERS_KEY = 'haven-rhythm-answers';

/* ─── USER TYPES ──────────────────────────────────────────── */

const RHYTHM_TYPES = [
  { id: 'student',   label: 'Student',              hint: 'School, college, or university',       focus: 'study' },
  { id: 'working',   label: 'Working full-time',    hint: 'A job with regular hours',             focus: 'work' },
  { id: 'both',      label: 'Working and studying', hint: 'Job plus classes',                     focus: 'study_work' },
  { id: 'freelance', label: 'Freelancing',          hint: 'Self-employed, client work',           focus: 'client_work' },
  { id: 'seeking',   label: 'Looking for work',     hint: 'Between jobs, applying',               focus: 'job_search' },
  { id: 'break',     label: 'Taking a break',       hint: 'Between things, no fixed shape',       focus: 'growth' },
  { id: 'retired',   label: 'Retired',              hint: 'Time is yours',                        focus: 'personal_projects' },
];

/* ─── LIFE AREAS (optional modules) ───────────────────────── */

const RHYTHM_AREAS = [
  { id: 'health',   label: 'Health & body',        category: 'health' },
  { id: 'learning', label: 'Learning & skills',    category: 'learning' },
  { id: 'creative', label: 'Creative work',        category: 'creative' },
  { id: 'money',    label: 'Money',                category: 'money' },
  { id: 'people',   label: 'People & relationships', category: 'people' },
  { id: 'rest',     label: 'Rest & recovery',      category: 'rest' },
  { id: 'faith',    label: 'Faith & community',    category: 'faith' },
  { id: 'home',     label: 'Home & chores',        category: 'home' },
];

/* ─── FIXED COMMITMENTS ───────────────────────────────────── */

const RHYTHM_COMMITMENTS = [
  { id: 'classes',  label: 'Classes & lectures' },
  { id: 'shifts',   label: 'Office hours / shifts' },
  { id: 'meetings', label: 'Regular meetings' },
  { id: 'training', label: 'Training or practice' },
  { id: 'faith',    label: 'Religious commitments' },
  { id: 'none',     label: 'Nothing fixed — my time is flexible' },
];

/* ─── PLANNING STYLES ─────────────────────────────────────── */

const RHYTHM_STYLES = [
  { id: 'tight',    label: 'Tightly planned',   hint: 'Most hours blocked out',              modules: 5 },
  { id: 'anchors',  label: 'A few anchors',     hint: 'Key blocks fixed, the rest flexible', modules: 3 },
  { id: 'essentials', label: 'Just the essentials', hint: 'Only what cannot move',           modules: 1 },
];

/* ─── CATEGORY LIBRARY ────────────────────────────────────── */
/* builtinId is set when the slot maps onto one of the app's
   hardcoded starter categories, so we update rather than duplicate. */

const RHYTHM_LIBRARY = {
  study: { label: 'Study', color: '#3b82f6', subs: [
    'Lectures', 'Lab / practical', 'Revision', 'Problem sets', 'Assignments',
    'Exam prep', 'Past papers', 'Group project', 'Reading', 'Notes / summarising',
    'Research', 'Final project' ] },
  work: { label: 'Work', color: '#6366f1', subs: [
    'Deep work', 'Meetings', 'One-on-ones', 'Email', 'Team chat',
    'Planning / standup', 'Documentation', 'Reviews', 'Focus block', 'Reporting',
    'Learning on the job', 'Commute' ] },
  client_work: { label: 'Client Work', color: '#8b5cf6', subs: [
    'Client calls', 'Proposals', 'Billable work', 'Revisions', 'Invoicing',
    'Contracts', 'Marketing', 'Networking', 'Project planning', 'Admin',
    'Skill building', 'Inbox' ] },
  job_search: { label: 'Job Search', color: '#0891b2', subs: [
    'Applications', 'CV tailoring', 'Company research', 'Networking', 'Interview prep',
    'Interviews', 'Follow-ups', 'Skill building', 'Portfolio', 'Recovery' ] },
  growth: { label: 'Growth', color: '#10b981', subs: [
    'Learning', 'Reading', 'Exercise', 'Creative practice', 'Volunteering',
    'Reflection', 'Planning', 'Health', 'Exploration' ] },
  personal_projects: { label: 'Personal Projects', color: '#f59e0b', subs: [
    'Planning', 'Making', 'Learning', 'Sharing', 'Admin',
    'Collaboration', 'Review', 'Rest' ] },

  health: { label: 'Health', color: '#ef4444', subs: [
    'Gym / strength', 'Cardio', 'Sport', 'Stretching', 'Walking',
    'Meals', 'Cooking', 'Hydration', 'Sleep routine', 'Mental health',
    'Medical appointment', 'Rest day' ] },
  daily: { label: 'Daily', color: '#0ea5e9', builtinId: 'daily', subs: [
    'Chores', 'Errands', 'Groceries', 'Cleaning', 'Laundry',
    'Cooking', 'Shopping', 'Routines', 'Self-care', 'Bills',
    'Appointments', 'Repairs' ] },
  people: { label: 'People', color: '#ec4899', subs: [
    'Family', 'Friends', 'Partner', 'Calls & messages', 'Community',
    'Events', 'Helping someone', 'Networking', 'Mentoring', 'Celebrations' ] },
  rest: { label: 'Rest', color: '#a78bfa', subs: [
    'Unwind', 'Entertainment', 'Games', 'Social media', 'Nap',
    'Meditation', 'Music', 'Reading for fun', 'Walking', 'Buffer' ] },
  learning: { label: 'Learning', color: '#14b8a6', subs: [
    'Online course', 'Language practice', 'Reading', 'Skill practice', 'Tutorials',
    'Notes / review', 'Practice project', 'Certification prep', 'Podcasts', 'Flash cards' ] },
  creative: { label: 'Creative', color: '#f97316', subs: [
    'Writing', 'Drawing / design', 'Music practice', 'Video / editing', 'Photography',
    'Side project', 'Ideation', 'Publishing', 'Learning craft', 'Collaboration' ] },
  money: { label: 'Money', color: '#84cc16', subs: [
    'Budgeting', 'Expense tracking', 'Bill payments', 'Savings', 'Side income',
    'Investing', 'Financial learning', 'Tax', 'Big purchases', 'Debt' ] },
  faith: { label: 'Faith', color: '#eab308', subs: [
    'Prayer / worship', 'Religious study', 'Service', 'Community event', 'Reflection',
    'Charity', 'Mentoring', 'Reading' ] },
  home: { label: 'Home', color: '#78716c', subs: [
    'Deep clean', 'Tidying', 'Laundry', 'Groceries', 'Cooking',
    'Repairs', 'Organising', 'Decorating', 'Garden', 'Pet care' ] },
};

/* ─── SUBJECT ENRICHMENT ──────────────────────────────────── */
/* Extra subcategories for the app's starter school subjects.
   Existing subcategories are preserved and these are merged in. */

const RHYTHM_SUBJECT_EXTRAS = {
  math:      ['Linear Algebra', 'Vectors', 'Practice Papers', 'Formula Review'],
  physics:   ['Waves', 'Circuits', 'Practice Papers'],
  bio:       ['Physiology', 'Plant Bio', 'Diagrams'],
  chem:      ['Stoichiometry', 'Periodic Table', 'Practice Papers'],
  eng:       ['Comprehension', 'Listening', 'Speaking'],
  mandarin:  ['Listening', 'Characters', 'Mock Tests'],
};

const RHYTHM_STARTER_SUBJECTS = ['math', 'physics', 'bio', 'chem', 'eng', 'mandarin'];

/* ─── STEPS ───────────────────────────────────────────────── */
/* Five screens. Wake/sleep and commitments share one, and the
   goal line rides along with the planning style. */

const RHYTHM_STEPS = [
  { id: 'you',    name: 'You' },
  { id: 'focus',  name: 'Priorities' },
  { id: 'day',    name: 'Your day' },
  { id: 'plan',   name: 'Planning' },
  { id: 'review', name: 'Review' },
];

/* ─── STATE ───────────────────────────────────────────────── */

let _rhythmAnswers = {
  type: '',
  areas: [],
  wake: '06:00',
  sleep: '23:00',
  commitments: [],
  style: 'anchors',
  goal: '',
  keepSubjects: true,
};
let _rhythmStep = 0;

/* ─── LOAD / SAVE ─────────────────────────────────────────── */

function loadRhythmAnswers() {
  try {
    const raw = localStorage.getItem(RHYTHM_ANSWERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch (e) { return null; }
}

function saveRhythmAnswers(answers) {
  try { localStorage.setItem(RHYTHM_ANSWERS_KEY, JSON.stringify(answers)); } catch (e) {}
}

function loadCategoryPreset() {
  try {
    const raw = localStorage.getItem(CATEGORY_PRESET_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch (e) { return null; }
}

/* ─── PRESET GENERATION ───────────────────────────────────── */

function rhythmTypeById(id) {
  return RHYTHM_TYPES.find(t => t.id === id) || null;
}

function buildRhythmPreset(answers) {
  const type = rhythmTypeById(answers.type) || RHYTHM_TYPES[0];
  const style = RHYTHM_STYLES.find(s => s.id === answers.style) || RHYTHM_STYLES[1];
  const isStudent = answers.type === 'student' || answers.type === 'both';

  const categories = [];
  const seen = new Set();

  function push(slotKey) {
    const entry = RHYTHM_LIBRARY[slotKey];
    if (!entry || seen.has(slotKey)) return;
    seen.add(slotKey);
    categories.push({
      slot: slotKey,
      label: entry.label,
      color: entry.color,
      builtinId: entry.builtinId || null,
      subs: entry.subs.slice(),
    });
  }

  /* Focus category first — it is where the time actually goes. */
  if (type.focus === 'study_work') { push('study'); push('work'); }
  else { push(type.focus); }

  /* Core categories everyone gets. */
  push('health');
  push('daily');

  /* Optional modules, capped by the planning style. */
  const moduleBudget = style.modules;
  let modulesAdded = 0;
  for (const area of RHYTHM_AREAS) {
    if (modulesAdded >= moduleBudget) break;
    if (!answers.areas.includes(area.id)) continue;
    push(area.category);
    modulesAdded++;
  }

  /* People and Rest are core for anyone who named them, even over budget. */
  if (answers.areas.includes('people')) push('people');
  if (answers.areas.includes('rest')) push('rest');

  /* Student preset also keeps the school subjects. */
  const keepSubjects = isStudent && answers.keepSubjects !== false;

  return {
    type,
    style,
    isStudent,
    categories,
    keepSubjects,
    subjectExtras: keepSubjects ? RHYTHM_SUBJECT_EXTRAS : {},
    hideStarters: (!isStudent && answers.keepSubjects === false) ? RHYTHM_STARTER_SUBJECTS.slice() : [],
    answers,
  };
}

/* ─── APPLY ───────────────────────────────────────────────── */

function applyRhythmPreset() {
  saveRhythmAnswers(_rhythmAnswers);
  return { created: 0, reused: 0, hidden: 0, total: 0, preserved: 0 };
}

/* ─── RESET ───────────────────────────────────────────────── */

function clearRhythmPreset() {
  try { localStorage.removeItem(CATEGORY_PRESET_KEY); } catch (e) {}
  try { localStorage.removeItem(RHYTHM_ANSWERS_KEY); } catch (e) {}
}

/* ─── RENDERING ───────────────────────────────────────────── */

function rhythmStepCount() { return RHYTHM_STEPS.length; }

function renderRhythmProgress() {
  const el = document.getElementById('rhythmProgress');
  if (el) {
    let html = '';
    for (let i = 0; i < RHYTHM_STEPS.length; i++) {
      const state = i === _rhythmStep ? ' is-active' : (i < _rhythmStep ? ' is-done' : '');
      html += '<li class="rhythm-step' + state + '"'
        + (i === _rhythmStep ? ' aria-current="step"' : '') + '>'
        + '<span class="rhythm-step-bar"></span>'
        + '<span class="rhythm-step-name">' + escapeHtml(RHYTHM_STEPS[i].name) + '</span>'
        + '</li>';
    }
    el.innerHTML = html;
  }
  const label = document.getElementById('rhythmStepLabel');
  if (label) {
    label.textContent = _rhythmStep === rhythmStepCount() - 1
      ? 'Review'
      : 'Step ' + (_rhythmStep + 1) + ' of ' + rhythmStepCount();
  }
}

/* ─── DAY SUMMARY ─────────────────────────────────────────── */

function rhythmSpanLabel(wake, sleep) {
  const toMin = (v) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(v || ''));
    return m ? (parseInt(m[1], 10) % 24) * 60 + parseInt(m[2], 10) : null;
  };
  const a = toMin(wake);
  const b = toMin(sleep);
  if (a === null || b === null) return '';
  let span = b - a;
  if (span <= 0) span += 1440;
  const h = Math.floor(span / 60);
  const mm = span % 60;
  return h + 'h' + (mm ? ' ' + mm + 'm' : '');
}

function updateRhythmDaySummary() {
  const el = document.getElementById('rhythmDaySummary');
  if (!el) return;
  const a = _rhythmAnswers;
  const span = rhythmSpanLabel(a.wake, a.sleep);
  el.textContent = span
    ? 'Awake roughly ' + a.wake + ' \u2013 ' + a.sleep + '  \u00B7  ' + span
    : 'Set a wake and sleep time to continue.';
}

function rhythmOptionHtml(id, label, hint, selected, multi) {
  return '<button type="button" class="rhythm-option' + (selected ? ' selected' : '') + '"'
    + ' data-rhythm-id="' + escapeHtml(id) + '" data-rhythm-multi="' + (multi ? '1' : '0') + '"'
    + ' aria-pressed="' + (selected ? 'true' : 'false') + '">'
    + '<span class="rhythm-option-label">' + escapeHtml(label) + '</span>'
    + (hint ? '<span class="rhythm-option-hint">' + escapeHtml(hint) + '</span>' : '')
    + '<span class="rhythm-mark" aria-hidden="true"></span>'
    + '</button>';
}

function renderRhythmStep() {
  const host = document.getElementById('rhythmQuestion');
  const titleEl = document.getElementById('rhythmQTitle');
  const subEl = document.getElementById('rhythmQSub');
  const backBtn = document.getElementById('rhythmBack');
  const nextBtn = document.getElementById('rhythmNext');
  if (!host || !titleEl || !subEl) return;

  const a = _rhythmAnswers;
  const total = rhythmStepCount();
  const isLast = _rhythmStep === total - 1;
  let title = '';
  let sub = '';
  let body = '';

  if (_rhythmStep === 0) {
    title = 'Who are you right now?';
    sub = 'This shapes everything else. You can change it later.';
    body = '<div class="rhythm-grid">' + RHYTHM_TYPES.map(t =>
      rhythmOptionHtml(t.id, t.label, t.hint, a.type === t.id, false)).join('') + '</div>';
  } else if (_rhythmStep === 1) {
    title = 'What matters most to you?';
    sub = 'Pick three to five. These become your extra categories.'
      + (a.areas.length ? ' \u00B7 ' + a.areas.length + ' selected' : '');
    body = '<div class="rhythm-grid rhythm-grid-multi">' + RHYTHM_AREAS.map(t =>
      rhythmOptionHtml(t.id, t.label, '', a.areas.includes(t.id), true)).join('') + '</div>';
  } else if (_rhythmStep === 2) {
    title = 'How does your day run?';
    sub = 'Roughly is fine. This is where blocks land on your grid.';
    body = '<div class="rhythm-day">'
      + '<label class="rhythm-field"><span class="rhythm-field-label">I wake around</span>'
      + '<input type="time" id="rhythmWake" value="' + escapeHtml(a.wake) + '"></label>'
      + '<label class="rhythm-field"><span class="rhythm-field-label">I sleep around</span>'
      + '<input type="time" id="rhythmSleep" value="' + escapeHtml(a.sleep) + '"></label>'
      + '</div>'
      + '<div class="rhythm-day-summary" id="rhythmDaySummary"></div>'
      + '<span class="rhythm-sub-label">Anything at a set time every week?</span>'
      + '<div class="rhythm-grid rhythm-grid-multi">' + RHYTHM_COMMITMENTS.map(t =>
        rhythmOptionHtml(t.id, t.label, '', a.commitments.includes(t.id), true)).join('') + '</div>';
  } else if (_rhythmStep === 3) {
    title = 'How do you want your day to look?';
    sub = 'Be honest. A plan you abandon in three days helps nobody.';
    body = '<div class="rhythm-grid">' + RHYTHM_STYLES.map(t =>
      rhythmOptionHtml(t.id, t.label, t.hint, a.style === t.id, false)).join('') + '</div>'
      + '<div class="rhythm-field" style="margin-top:var(--space-6)">'
      + '<span class="rhythm-field-label">Working toward anything? (optional)</span>'
      + '<input type="text" id="rhythmGoal" maxlength="80"'
      + ' placeholder="e.g. exams in November" value="' + escapeHtml(a.goal) + '"></div>';
  } else {
    const preset = buildRhythmPreset(a);
    const isStudent = a.type === 'student' || a.type === 'both';
    title = 'Here is what we will set up';
    sub = 'Nothing is applied until you press the button.';
    body = '<div class="rhythm-preview">';
    body += '<div class="rhythm-preview-row"><span>Your type</span><strong>'
      + escapeHtml(preset.type.label) + '</strong></div>';
    body += '<div class="rhythm-preview-row"><span>Your day</span><strong>'
      + escapeHtml(a.wake + ' \u2013 ' + a.sleep) + '</strong></div>';
    body += '<div class="rhythm-preview-row"><span>Planning style</span><strong>'
      + escapeHtml(preset.style.label) + '</strong></div>';
    body += '<div class="rhythm-preview-row"><span>Starter subjects</span><strong>'
      + (preset.keepSubjects ? 'Kept' : (preset.hideStarters.length ? 'Hidden' : 'Kept')) + '</strong></div>';
    if (a.goal) {
      body += '<div class="rhythm-preview-row"><span>Working toward</span><strong>'
        + escapeHtml(a.goal) + '</strong></div>';
    }
    body += '<div class="rhythm-preview-row"><span>Categories</span><strong>'
      + preset.categories.length + ' \u00B7 '
      + preset.categories.reduce((n, c) => n + c.subs.length, 0) + ' subcategories</strong></div>';
    body += '</div><div class="rhythm-chips">';
    for (const cat of preset.categories) {
      body += '<span class="rhythm-chip" style="--rc:' + escapeHtml(cat.color) + '">'
        + escapeHtml(cat.label) + '<em>' + cat.subs.length + '</em></span>';
    }
    body += '</div>';
    body += '<label class="rhythm-toggle"><input type="checkbox" id="rhythmKeepSubjects"'
      + (a.keepSubjects !== false ? ' checked' : '') + '>'
      + '<span>' + (isStudent
        ? 'Keep my school subjects as categories'
        : 'Keep the starter school subjects') + '</span></label>';
    if (!isStudent) {
      body += '<p class="rhythm-note">The app ships with Math, Physics, Bio, Chem, Eng and Mandarin.'
        + ' If you are not studying, turn this off to hide them.</p>';
    }
    body += '<p class="rhythm-note">Existing tasks keep their categories. '
      + 'Nothing that holds a task is ever deleted.</p>';
  }

  titleEl.textContent = title;
  subEl.textContent = sub;
  host.innerHTML = body;

  /* Replay the entrance animation on every step change. */
  host.classList.remove('rhythm-anim');
  void host.offsetWidth;
  host.classList.add('rhythm-anim');

  if (backBtn) backBtn.style.display = _rhythmStep === 0 ? 'none' : '';
  if (nextBtn) nextBtn.textContent = isLast ? 'Apply preset' : 'Next';

  wireRhythmStep();
  renderRhythmProgress();
}

function wireRhythmStep() {
  const host = document.getElementById('rhythmQuestion');
  if (!host) return;

  host.querySelectorAll('[data-rhythm-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.rhythmId;
      const multi = btn.dataset.rhythmMulti === '1';
      const a = _rhythmAnswers;

      if (multi) {
        const isAreas = _rhythmStep === 1;
        const list = isAreas ? a.areas : a.commitments;
        const at = list.indexOf(id);
        if (at === -1) list.push(id); else list.splice(at, 1);

        /* "Nothing fixed" cannot sit next to real commitments. */
        if (!isAreas) {
          if (id === 'none') a.commitments = list.includes('none') ? ['none'] : [];
          else a.commitments = list.filter(x => x !== 'none');
        }
      } else if (_rhythmStep === 0) {
        a.type = id;
      } else if (_rhythmStep === 3) {
        a.style = id;
      }
      renderRhythmStep();
    });
  });

  const wake = document.getElementById('rhythmWake');
  const sleep = document.getElementById('rhythmSleep');
  if (wake) wake.addEventListener('change', () => { _rhythmAnswers.wake = wake.value; updateRhythmDaySummary(); });
  if (sleep) sleep.addEventListener('change', () => { _rhythmAnswers.sleep = sleep.value; updateRhythmDaySummary(); });
  if (wake || sleep) updateRhythmDaySummary();

  const goal = document.getElementById('rhythmGoal');
  if (goal) {
    goal.addEventListener('input', () => { _rhythmAnswers.goal = goal.value; });
    goal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); rhythmNext(); }
    });
  }

  const keep = document.getElementById('rhythmKeepSubjects');
  if (keep) keep.addEventListener('change', () => { _rhythmAnswers.keepSubjects = keep.checked; });
}

function rhythmNext() {
  if (_rhythmStep === rhythmStepCount() - 1) { confirmRhythmApply(); return; }
  if (_rhythmStep === 0 && !_rhythmAnswers.type) {
    if (typeof showToast === 'function') showToast('Pick one to continue', 'error', 2000);
    return;
  }
  _rhythmStep = Math.min(_rhythmStep + 1, rhythmStepCount() - 1);
  renderRhythmStep();
}

function rhythmBack() {
  _rhythmStep = Math.max(_rhythmStep - 1, 0);
  renderRhythmStep();
}

function showRhythmStep(index) {
  _rhythmStep = Math.max(0, Math.min(index, rhythmStepCount() - 1));
  renderRhythmStep();
}

function confirmRhythmApply() {
  saveRhythmAnswers(_rhythmAnswers);
  if (typeof showToast === 'function') {
    showToast('Setup saved', 'success', 2500);
  }
  setTimeout(() => { location.href = 'index.html'; }, 800);
}

/* ─── INIT ────────────────────────────────────────────────── */

function initRhythm() {
  const saved = loadRhythmAnswers();
  if (saved) {
    _rhythmAnswers = Object.assign(_rhythmAnswers, saved);
    _rhythmAnswers.areas = Array.isArray(_rhythmAnswers.areas) ? _rhythmAnswers.areas : [];
    _rhythmAnswers.commitments = Array.isArray(_rhythmAnswers.commitments) ? _rhythmAnswers.commitments : [];
    _rhythmStep = rhythmStepCount() - 1;
  }

  const next = document.getElementById('rhythmNext');
  const back = document.getElementById('rhythmBack');
  if (next) next.addEventListener('click', rhythmNext);
  if (back) back.addEventListener('click', rhythmBack);

  const reset = document.getElementById('rhythmReset');
  if (reset) {
    reset.addEventListener('click', () => {
      if (!window.confirm('Clear your saved answers? Your categories will not change.')) return;
      clearRhythmPreset();
      _rhythmAnswers = {
        type: '', areas: [], wake: '06:00', sleep: '23:00',
        commitments: [], style: 'anchors', goal: '', keepSubjects: true,
      };
      _rhythmStep = 0;
      renderRhythmStep();
    });
  }

  const skip = document.getElementById('rhythmSkip');
  if (skip) {
    skip.addEventListener('click', (e) => {
      e.preventDefault();
      location.href = 'index.html';
    });
  }

  renderRhythmStep();
}
