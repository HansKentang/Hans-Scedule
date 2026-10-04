/* ============================================
   Havën Schedule — Hub Visuals (bento canvas,
   edit mode, ADD/HIDE popups, drag & resize)
   Shared across all pages
   ============================================ */

/* ─── Snap helper (20px grid) ─────────────── */
function snap(v) { return Math.round(v / 20) * 20; }

/* ─── Spotify height snap (115, 190, 400, then free) ─── */
function snapSpotifyHeight(v) {
  v = Math.max(108.5, v);
  if (v < 147) return 108.5;
  if (v < 295) return 187.5;
  if (v < 400) return 400;
  return snap(v);
}

/* ─── Storage keys ─────────────────────────── */
const HUB_LAYOUT_KEY = 'haven-schedule-hub-layout';
const HUB_BENTO_KEY = 'haven-hub-bento';
const HUB_EDIT_KEY = 'haven-hub-edit';
const CLOCK_STYLES_KEY = 'haven-clock-styles';
const CLOCK_STYLE_LIST = ['digital','analog','minimal','flip','split'];
let _clockStyles = {};
try { _clockStyles = JSON.parse(localStorage.getItem(CLOCK_STYLES_KEY) || '{}'); } catch(e) {}
function _getClockStyle(uid) { return _clockStyles[uid] || 'digital'; }
function _setClockStyle(uid, style) { _clockStyles[uid] = style; try { localStorage.setItem(CLOCK_STYLES_KEY, JSON.stringify(_clockStyles)); } catch(e) {} }

const WEATHER_STYLES_KEY = 'haven-weather-styles';
const WEATHER_STYLE_LIST = ['compact','hero','minimal','forecast','card'];
let _weatherStyles = {};
try { _weatherStyles = JSON.parse(localStorage.getItem(WEATHER_STYLES_KEY) || '{}'); } catch(e) {}
function _getWeatherStyle(uid) { return _weatherStyles[uid] || 'compact'; }
function _setWeatherStyle(uid, style) { _weatherStyles[uid] = style; try { localStorage.setItem(WEATHER_STYLES_KEY, JSON.stringify(_weatherStyles)); } catch(e) {} }

const SLEEP_STYLES_KEY = 'haven-sleep-styles';
const SLEEP_STYLE_LIST = ['default','detailed','minimal','timeline'];
let _sleepStyles = {};
try { _sleepStyles = JSON.parse(localStorage.getItem(SLEEP_STYLES_KEY) || '{}'); } catch(e) {}
function _getSleepStyle(uid) { return _sleepStyles[uid] || 'default'; }
function _setSleepStyle(uid, style) { _sleepStyles[uid] = style; try { localStorage.setItem(SLEEP_STYLES_KEY, JSON.stringify(_sleepStyles)); } catch(e) {} }


const HEADLINES_STYLES_KEY = 'haven-headlines-styles';
const HEADLINES_STYLE_LIST = ['default','compact','full'];
let _headlinesStyles = {};
try { _headlinesStyles = JSON.parse(localStorage.getItem(HEADLINES_STYLES_KEY) || '{}'); } catch(e) {}
function _getHeadlinesStyle(uid) { return _headlinesStyles[uid] || 'default'; }
function _setHeadlinesStyle(uid, style) { _headlinesStyles[uid] = style; try { localStorage.setItem(HEADLINES_STYLES_KEY, JSON.stringify(_headlinesStyles)); } catch(e) {} }

const CAL_STYLES_KEY = 'haven-cal-styles';
const CAL_STYLE_LIST = ['default','compact','list'];
let _calStyles = {};
try { _calStyles = JSON.parse(localStorage.getItem(CAL_STYLES_KEY) || '{}'); } catch(e) {}
function _getCalStyle(uid) { return _calStyles[uid] || 'default'; }
function _setCalStyle(uid, style) { _calStyles[uid] = style; try { localStorage.setItem(CAL_STYLES_KEY, JSON.stringify(_calStyles)); } catch(e) {} }

const TODOS_STYLES_KEY = 'haven-todos-styles';
const TODOS_STYLE_LIST = ['default','compact','progress'];
let _todosStyles = {};
try { _todosStyles = JSON.parse(localStorage.getItem(TODOS_STYLES_KEY) || '{}'); } catch(e) {}
function _getTodosStyle(uid) { return _todosStyles[uid] || 'default'; }
function _setTodosStyle(uid, style) { _todosStyles[uid] = style; try { localStorage.setItem(TODOS_STYLES_KEY, JSON.stringify(_todosStyles)); } catch(e) {} }

const HABITS_STYLES_KEY = 'haven-habits-styles';
const HABITS_STYLE_LIST = ['default','list','minimal'];
let _habitsStyles = {};
try { _habitsStyles = JSON.parse(localStorage.getItem(HABITS_STYLES_KEY) || '{}'); } catch(e) {}
function _getHabitsStyle(uid) { return _habitsStyles[uid] || 'default'; }
function _setHabitsStyle(uid, style) { _habitsStyles[uid] = style; try { localStorage.setItem(HABITS_STYLES_KEY, JSON.stringify(_habitsStyles)); } catch(e) {} }

const MOOD_STYLES_KEY = 'haven-mood-styles';
const MOOD_STYLE_LIST = ['default','minimal','chart'];
let _moodStyles = {};
try { _moodStyles = JSON.parse(localStorage.getItem(MOOD_STYLES_KEY) || '{}'); } catch(e) {}
function _getMoodStyle(uid) { return _moodStyles[uid] || 'default'; }
function _setMoodStyle(uid, style) { _moodStyles[uid] = style; try { localStorage.setItem(MOOD_STYLES_KEY, JSON.stringify(_moodStyles)); } catch(e) {} }

const WATER_STYLES_KEY = 'haven-water-styles';
const WATER_STYLE_LIST = ['default','minimal','detailed'];
let _waterStyles = {};
try { _waterStyles = JSON.parse(localStorage.getItem(WATER_STYLES_KEY) || '{}'); } catch(e) {}
function _getWaterStyle(uid) { return _waterStyles[uid] || 'default'; }
function _setWaterStyle(uid, style) { _waterStyles[uid] = style; try { localStorage.setItem(WATER_STYLES_KEY, JSON.stringify(_waterStyles)); } catch(e) {} }

const TIMER_STYLES_KEY = 'haven-timer-styles';
const TIMER_STYLE_LIST = ['default','digital','bar'];
let _timerStyles = {};
try { _timerStyles = JSON.parse(localStorage.getItem(TIMER_STYLES_KEY) || '{}'); } catch(e) {}
function _getTimerStyle(uid) { return _timerStyles[uid] || 'default'; }
function _setTimerStyle(uid, style) { _timerStyles[uid] = style; try { localStorage.setItem(TIMER_STYLES_KEY, JSON.stringify(_timerStyles)); } catch(e) {} }

const POMO_STYLES_KEY = 'haven-pomo-styles';
const POMO_STYLE_LIST = ['default','minimal','classic'];
let _pomoStyles = {};
try { _pomoStyles = JSON.parse(localStorage.getItem(POMO_STYLES_KEY) || '{}'); } catch(e) {}
function _getPomoStyle(uid) { return _pomoStyles[uid] || 'default'; }
function _setPomoStyle(uid, style) { _pomoStyles[uid] = style; try { localStorage.setItem(POMO_STYLES_KEY, JSON.stringify(_pomoStyles)); } catch(e) {} }

const NOTES_STYLES_KEY = 'haven-notes-styles';
const NOTES_STYLE_LIST = ['default','lined','minimal'];
let _notesStyles = {};
try { _notesStyles = JSON.parse(localStorage.getItem(NOTES_STYLES_KEY) || '{}'); } catch(e) {}
function _getNotesStyle(uid) { return _notesStyles[uid] || 'default'; }
function _setNotesStyle(uid, style) { _notesStyles[uid] = style; try { localStorage.setItem(NOTES_STYLES_KEY, JSON.stringify(_notesStyles)); } catch(e) {} }

const LINKS_STYLES_KEY = 'haven-links-styles';
const LINKS_STYLE_LIST = ['default','compact','grid'];
let _linksStyles = {};
try { _linksStyles = JSON.parse(localStorage.getItem(LINKS_STYLES_KEY) || '{}'); } catch(e) {}
function _getLinksStyle(uid) { return _linksStyles[uid] || 'default'; }
function _setLinksStyle(uid, style) { _linksStyles[uid] = style; try { localStorage.setItem(LINKS_STYLES_KEY, JSON.stringify(_linksStyles)); } catch(e) {} }

const QUOTE_STYLES_KEY = 'haven-quote-styles';
const QUOTE_STYLE_LIST = ['default','boxed','minimal'];
let _quoteStyles = {};
try { _quoteStyles = JSON.parse(localStorage.getItem(QUOTE_STYLES_KEY) || '{}'); } catch(e) {}
function _getQuoteStyle(uid) { return _quoteStyles[uid] || 'default'; }
function _setQuoteStyle(uid, style) { _quoteStyles[uid] = style; try { localStorage.setItem(QUOTE_STYLES_KEY, JSON.stringify(_quoteStyles)); } catch(e) {} }

const CD_STYLES_KEY = 'haven-cd-styles';
const CD_STYLE_LIST = ['default','cards','minimal'];
let _cdStyles = {};
try { _cdStyles = JSON.parse(localStorage.getItem(CD_STYLES_KEY) || '{}'); } catch(e) {}
function _getCdStyle(uid) { return _cdStyles[uid] || 'default'; }
function _setCdStyle(uid, style) { _cdStyles[uid] = style; try { localStorage.setItem(CD_STYLES_KEY, JSON.stringify(_cdStyles)); } catch(e) {} }

const PRI_STYLES_KEY = 'haven-pri-styles';
const PRI_STYLE_LIST = ['default','compact','numbered'];
let _priStyles = {};
try { _priStyles = JSON.parse(localStorage.getItem(PRI_STYLES_KEY) || '{}'); } catch(e) {}
function _getPriStyle(uid) { return _priStyles[uid] || 'default'; }
function _setPriStyle(uid, style) { _priStyles[uid] = style; try { localStorage.setItem(PRI_STYLES_KEY, JSON.stringify(_priStyles)); } catch(e) {} }

const PROG_STYLES_KEY = 'haven-prog-styles';
const PROG_STYLE_LIST = ['default','stats','minimal'];
let _progStyles = {};
try { _progStyles = JSON.parse(localStorage.getItem(PROG_STYLES_KEY) || '{}'); } catch(e) {}
function _getProgStyle(uid) { return _progStyles[uid] || 'default'; }
function _setProgStyle(uid, style) { _progStyles[uid] = style; try { localStorage.setItem(PROG_STYLES_KEY, JSON.stringify(_progStyles)); } catch(e) {} }

const GOALS_STYLES_KEY = 'haven-goals-styles';
const GOALS_STYLE_LIST = ['default','compact','numbered'];
let _goalsStyles = {};
try { _goalsStyles = JSON.parse(localStorage.getItem(GOALS_STYLES_KEY) || '{}'); } catch(e) {}
function _getGoalsStyle(uid) { return _goalsStyles[uid] || 'default'; }
function _setGoalsStyle(uid, style) { _goalsStyles[uid] = style; try { localStorage.setItem(GOALS_STYLES_KEY, JSON.stringify(_goalsStyles)); } catch(e) {} }

const IMG_STYLES_KEY = 'haven-img-styles';
const IMG_STYLE_LIST = ['default','rounded','minimal'];
let _imgStyles = {};
try { _imgStyles = JSON.parse(localStorage.getItem(IMG_STYLES_KEY) || '{}'); } catch(e) {}
function _getImgStyle(uid) { return _imgStyles[uid] || 'default'; }
function _setImgStyle(uid, style) { _imgStyles[uid] = style; try { localStorage.setItem(IMG_STYLES_KEY, JSON.stringify(_imgStyles)); } catch(e) {} }

const HW_STYLES_KEY = 'haven-hw-styles';
const HW_STYLE_LIST = ['default','compact','kanban'];
let _hwStyles = {};
try { _hwStyles = JSON.parse(localStorage.getItem(HW_STYLES_KEY) || '{}'); } catch(e) {}
function _getHwStyle(uid) { return _hwStyles[uid] || 'default'; }
function _setHwStyle(uid, style) { _hwStyles[uid] = style; try { localStorage.setItem(HW_STYLES_KEY, JSON.stringify(_hwStyles)); } catch(e) {} }

const ALARM_STYLES_KEY = 'haven-alarm-styles';
const ALARM_STYLE_LIST = ['digital','compact','card'];
let _alarmStyles = {};
try { _alarmStyles = JSON.parse(localStorage.getItem(ALARM_STYLES_KEY) || '{}'); } catch(e) {}
function _getAlarmStyle(uid) { return _alarmStyles[uid] || 'digital'; }
function _setAlarmStyle(uid, style) { _alarmStyles[uid] = style; try { localStorage.setItem(ALARM_STYLES_KEY, JSON.stringify(_alarmStyles)); } catch(e) {} }

const TODAY_STYLES_KEY = 'haven-today-styles';
const TODAY_STYLE_LIST = ['default','compact','progress'];
let _todayStyles = {};
try { _todayStyles = JSON.parse(localStorage.getItem(TODAY_STYLES_KEY) || '{}'); } catch(e) {}
function _getTodayStyle(uid) { return _todayStyles[uid] || 'default'; }
function _setTodayStyle(uid, style) { _todayStyles[uid] = style; try { localStorage.setItem(TODAY_STYLES_KEY, JSON.stringify(_todayStyles)); } catch(e) {} }

const UPCOMING_STYLES_KEY = 'haven-upcoming-styles';
const UPCOMING_STYLE_LIST = ['default','compact','agenda'];
let _upcomingStyles = {};
try { _upcomingStyles = JSON.parse(localStorage.getItem(UPCOMING_STYLES_KEY) || '{}'); } catch(e) {}
function _getUpcomingStyle(uid) { return _upcomingStyles[uid] || 'default'; }
function _setUpcomingStyle(uid, style) { _upcomingStyles[uid] = style; try { localStorage.setItem(UPCOMING_STYLES_KEY, JSON.stringify(_upcomingStyles)); } catch(e) {} }

const STREAK_STYLES_KEY = 'haven-streak-styles';
const STREAK_STYLE_LIST = ['default','compact','heatmap'];
let _streakStyles = {};
try { _streakStyles = JSON.parse(localStorage.getItem(STREAK_STYLES_KEY) || '{}'); } catch(e) {}
function _getStreakStyle(uid) { return _streakStyles[uid] || 'default'; }
function _setStreakStyle(uid, style) { _streakStyles[uid] = style; try { localStorage.setItem(STREAK_STYLES_KEY, JSON.stringify(_streakStyles)); } catch(e) {} }

const BUDGET_STYLES_KEY = 'haven-budget-styles';
const BUDGET_STYLE_LIST = ['default','breakdown','minimal'];
let _budgetStyles = {};
try { _budgetStyles = JSON.parse(localStorage.getItem(BUDGET_STYLES_KEY) || '{}'); } catch(e) {}
function _getBudgetStyle(uid) { return _budgetStyles[uid] || 'default'; }
function _setBudgetStyle(uid, style) { _budgetStyles[uid] = style; try { localStorage.setItem(BUDGET_STYLES_KEY, JSON.stringify(_budgetStyles)); } catch(e) {} }

const AQ_STYLES_KEY = 'haven-aq-styles';
const AQ_STYLE_LIST = ['default','minimal','grid'];
let _aqStyles = {};
try { _aqStyles = JSON.parse(localStorage.getItem(AQ_STYLES_KEY) || '{}'); } catch(e) {}
function _getAqStyle(uid) { return _aqStyles[uid] || 'default'; }
function _setAqStyle(uid, style) { _aqStyles[uid] = style; try { localStorage.setItem(AQ_STYLES_KEY, JSON.stringify(_aqStyles)); } catch(e) {} }

const WC_STYLES_KEY = 'haven-worldclock-styles';
const WC_STYLE_LIST = ['default','cards','minimal'];
let _wcStyles = {};
try { _wcStyles = JSON.parse(localStorage.getItem(WC_STYLES_KEY) || '{}'); } catch(e) {}
function _getWcStyle(uid) { return _wcStyles[uid] || 'default'; }
function _setWcStyle(uid, style) { _wcStyles[uid] = style; try { localStorage.setItem(WC_STYLES_KEY, JSON.stringify(_wcStyles)); } catch(e) {} }

const SAVINGS_STYLES_KEY = 'haven-savings-styles';
const SAVINGS_STYLE_LIST = ['default','bar','minimal'];
let _savingsStyles = {};
try { _savingsStyles = JSON.parse(localStorage.getItem(SAVINGS_STYLES_KEY) || '{}'); } catch(e) {}
function _getSavingsStyle(uid) { return _savingsStyles[uid] || 'default'; }
function _setSavingsStyle(uid, style) { _savingsStyles[uid] = style; try { localStorage.setItem(SAVINGS_STYLES_KEY, JSON.stringify(_savingsStyles)); } catch(e) {} }

const FOCUS_STYLES_KEY = 'haven-focus-styles';
const FOCUS_STYLE_LIST = ['default','compact','bars'];
let _focusStyles = {};
try { _focusStyles = JSON.parse(localStorage.getItem(FOCUS_STYLES_KEY) || '{}'); } catch(e) {}
function _getFocusStyle(uid) { return _focusStyles[uid] || 'default'; }
function _setFocusStyle(uid, style) { _focusStyles[uid] = style; try { localStorage.setItem(FOCUS_STYLES_KEY, JSON.stringify(_focusStyles)); } catch(e) {} }


const CURRENCY_STYLES_KEY = 'haven-currency-styles';
const CURRENCY_STYLE_LIST = ['default','minimal','rates'];
let _currencyStyles = {};
try { _currencyStyles = JSON.parse(localStorage.getItem(CURRENCY_STYLES_KEY) || '{}'); } catch(e) {}
function _getCurrencyStyle(uid) { return _currencyStyles[uid] || 'default'; }
function _setCurrencyStyle(uid, style) { _currencyStyles[uid] = style; try { localStorage.setItem(CURRENCY_STYLES_KEY, JSON.stringify(_currencyStyles)); } catch(e) {} }

const CALC_STYLES_KEY = 'haven-calc-styles';
const CALC_STYLE_LIST = ['default','compact','history'];
let _calcStyles = {};
try { _calcStyles = JSON.parse(localStorage.getItem(CALC_STYLES_KEY) || '{}'); } catch(e) {}
function _getCalcStyle(uid) { return _calcStyles[uid] || 'default'; }
function _setCalcStyle(uid, style) { _calcStyles[uid] = style; try { localStorage.setItem(CALC_STYLES_KEY, JSON.stringify(_calcStyles)); } catch(e) {} }

const BREATH_STYLES_KEY = 'haven-breath-styles';
const BREATH_STYLE_LIST = ['default','minimal','compact'];
let _breathStyles = {};
try { _breathStyles = JSON.parse(localStorage.getItem(BREATH_STYLES_KEY) || '{}'); } catch(e) {}
function _getBreathStyle(uid) { return _breathStyles[uid] || 'default'; }
function _setBreathStyle(uid, style) { _breathStyles[uid] = style; try { localStorage.setItem(BREATH_STYLES_KEY, JSON.stringify(_breathStyles)); } catch(e) {} }


const READ_STYLES_KEY = 'haven-reading-styles';
const READ_STYLE_LIST = ['default','compact','progress'];
let _readStyles = {};
try { _readStyles = JSON.parse(localStorage.getItem(READ_STYLES_KEY) || '{}'); } catch(e) {}
function _getReadStyle(uid) { return _readStyles[uid] || 'default'; }
function _setReadStyle(uid, style) { _readStyles[uid] = style; try { localStorage.setItem(READ_STYLES_KEY, JSON.stringify(_readStyles)); } catch(e) {} }

const DOODLE_STYLES_KEY = 'haven-doodle-styles';
const DOODLE_STYLE_LIST = ['default','dark','paper'];
let _doodleStyles = {};
try { _doodleStyles = JSON.parse(localStorage.getItem(DOODLE_STYLES_KEY) || '{}'); } catch(e) {}
function _getDoodleStyle(uid) { return _doodleStyles[uid] || 'default'; }
function _setDoodleStyle(uid, style) { _doodleStyles[uid] = style; try { localStorage.setItem(DOODLE_STYLES_KEY, JSON.stringify(_doodleStyles)); } catch(e) {} }

const GH_STYLES_KEY = 'haven-github-styles';
const GH_STYLE_LIST = ['default','compact','repos'];
let _ghStyles = {};
try { _ghStyles = JSON.parse(localStorage.getItem(GH_STYLES_KEY) || '{}'); } catch(e) {}
function _getGhStyle(uid) { return _ghStyles[uid] || 'default'; }
function _setGhStyle(uid, style) { _ghStyles[uid] = style; try { localStorage.setItem(GH_STYLES_KEY, JSON.stringify(_ghStyles)); } catch(e) {} }

function _studyUid(p) { return (p || 'st') + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
function _normalizeStudy(list) {
  if (!Array.isArray(list)) return [];
  return list.map(function(s) {
    var subj = (s && typeof s === 'object') ? s : { name: String(s || '') };
    var chapters = Array.isArray(subj.chapters) ? subj.chapters.map(function(c) {
      var chap = (c && typeof c === 'object') ? c : { name: String(c || '') };
      var items = Array.isArray(chap.items) ? chap.items.map(function(it) {
        if (it && typeof it === 'object') return { id: it.id || _studyUid('si'), text: it.text || it.name || '', done: !!it.done };
        return { id: _studyUid('si'), text: String(it || ''), done: false };
      }) : [];
      return { id: chap.id || _studyUid('ch'), name: chap.name || 'Chapter', collapsed: !!chap.collapsed, items: items };
    }) : [];
    return { id: subj.id || _studyUid('sj'), name: subj.name || 'Subject', color: subj.color || '', collapsed: !!subj.collapsed, chapters: chapters };
  });
}
function _ensureStudy() {
  if (!hubContent) return [];
  if (!Array.isArray(hubContent.study)) hubContent.study = [];
  hubContent.study.forEach(function(s, i) {
    if (!s || typeof s !== 'object') hubContent.study[i] = s = { name: String(s || '') };
    if (!s.id) s.id = _studyUid('sj');
    if (!s.name) s.name = 'Subject';
    if (typeof s.collapsed !== 'boolean') s.collapsed = !!s.collapsed;
    if (typeof s.color !== 'string') s.color = s.color || '';
    if (!Array.isArray(s.chapters)) s.chapters = [];
    s.chapters.forEach(function(c, j) {
      if (!c || typeof c !== 'object') s.chapters[j] = c = { name: String(c || '') };
      if (!c.id) c.id = _studyUid('ch');
      if (!c.name) c.name = 'Chapter';
      if (typeof c.collapsed !== 'boolean') c.collapsed = !!c.collapsed;
      if (!Array.isArray(c.items)) c.items = [];
      c.items.forEach(function(it, k) {
        if (!it || typeof it !== 'object') c.items[k] = it = { text: String(it || '') };
        if (!it.id) it.id = _studyUid('si');
        if (typeof it.text !== 'string') it.text = it.text || it.name || '';
        it.done = !!it.done;
      });
    });
  });
  return hubContent.study;
}
function _findStudy(sid, cid, iid) {
  var subs = (typeof hubContent !== 'undefined' && hubContent && Array.isArray(hubContent.study)) ? hubContent.study : [];
  var sj = null, ch = null, it = null;
  for (var i = 0; i < subs.length; i++) {
    if (subs[i].id === sid) { sj = subs[i]; break; }
  }
  if (!sj) return {};
  if (cid === undefined || cid === null) return { sj: sj };
  for (var j = 0; j < sj.chapters.length; j++) {
    if (sj.chapters[j].id === cid) { ch = sj.chapters[j]; break; }
  }
  if (!ch) return { sj: sj };
  if (iid === undefined || iid === null) return { sj: sj, ch: ch };
  for (var k = 0; k < ch.items.length; k++) {
    if (ch.items[k].id === iid) { it = ch.items[k]; break; }
  }
  return { sj: sj, ch: ch, it: it };
}
function _studyCounts(items) {
  var total = items.length;
  var done = 0;
  for (var i = 0; i < items.length; i++) if (items[i].done) done++;
  return { done: done, total: total, pct: total ? Math.round((done / total) * 100) : 0 };
}
function _studySubjectItems(sj) {
  var out = [];
  (sj.chapters || []).forEach(function(c) { (c.items || []).forEach(function(it) { out.push(it); }); });
  return out;
}
function _moveStudyItem(dragId, leafId, zoneId, before) {
  _ensureStudy();
  var sp = String(dragId || '').split('|');
  var src = _findStudy(sp[0], sp[1], sp[2]);
  if (!src.ch || !src.it) return false;
  if (leafId && leafId === dragId) return false;
  var moving = src.it;
  src.ch.items.splice(src.ch.items.indexOf(moving), 1);
  if (leafId) {
    var tp = String(leafId).split('|');
    var tgt = _findStudy(tp[0], tp[1], tp[2]);
    if (tgt.ch && tgt.it) {
      var ti = tgt.ch.items.indexOf(tgt.it);
      tgt.ch.items.splice(before ? ti : ti + 1, 0, moving);
      tgt.sj.collapsed = false;
      tgt.ch.collapsed = false;
      return true;
    }
  }
  if (zoneId) {
    var zp = String(zoneId).split('|');
    var dst = _findStudy(zp[0], zp[1]);
    if (dst.ch) {
      dst.ch.items.push(moving);
      dst.sj.collapsed = false;
      dst.ch.collapsed = false;
      return true;
    }
  }
  src.ch.items.push(moving);
  return true;
}
function _closeStudyColorPopup() {
  if (typeof closeColorPopup === 'function') closeColorPopup();
  var p = document.querySelector('.w-st-color-pop');
  if (p) p.remove();
}
function _openStudyColorPopup(sid, anchor) {
  var found = _findStudy(sid);
  if (!found.sj) return;
  var sj = found.sj;
  if (typeof openColorPopup === 'function') {
    openColorPopup(anchor, { title: sj.name || 'Subject', value: sj.color || '', onPick: function(hex) {
      var f = _findStudy(sid);
      if (!f.sj) return;
      f.sj.color = hex;
      saveHubContent();
      renderHubBento();
    } });
  }
}

const TEXT_STYLES_KEY = 'haven-text-styles';
const TEXT_STYLE_LIST = ['sans','serif','mono','georgia','arial','times','courier','verdana','consolas'];
let _textStyles = {};
try { _textStyles = JSON.parse(localStorage.getItem(TEXT_STYLES_KEY) || '{}'); } catch(e) {}
function _getTextStyle(uid) { return _textStyles[uid] || 'sans'; }
function _setTextStyle(uid, style) { _textStyles[uid] = style; try { localStorage.setItem(TEXT_STYLES_KEY, JSON.stringify(_textStyles)); } catch(e) {} }
function _loadStyleMap(key) {
  try {
    var raw = localStorage.getItem(key);
    var parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
  } catch(e) { return {}; }
}
function _reloadAllWidgetStyles() {
  _clockStyles = _loadStyleMap(CLOCK_STYLES_KEY);
  _weatherStyles = _loadStyleMap(WEATHER_STYLES_KEY);
  _sleepStyles = _loadStyleMap(SLEEP_STYLES_KEY);
  _headlinesStyles = _loadStyleMap(HEADLINES_STYLES_KEY);
  _calStyles = _loadStyleMap(CAL_STYLES_KEY);
  _todosStyles = _loadStyleMap(TODOS_STYLES_KEY);
  _habitsStyles = _loadStyleMap(HABITS_STYLES_KEY);
  _moodStyles = _loadStyleMap(MOOD_STYLES_KEY);
  _waterStyles = _loadStyleMap(WATER_STYLES_KEY);
  _timerStyles = _loadStyleMap(TIMER_STYLES_KEY);
  _pomoStyles = _loadStyleMap(POMO_STYLES_KEY);
  _notesStyles = _loadStyleMap(NOTES_STYLES_KEY);
  _linksStyles = _loadStyleMap(LINKS_STYLES_KEY);
  _quoteStyles = _loadStyleMap(QUOTE_STYLES_KEY);
  _cdStyles = _loadStyleMap(CD_STYLES_KEY);
  _priStyles = _loadStyleMap(PRI_STYLES_KEY);
  _progStyles = _loadStyleMap(PROG_STYLES_KEY);
  _goalsStyles = _loadStyleMap(GOALS_STYLES_KEY);
  _imgStyles = _loadStyleMap(IMG_STYLES_KEY);
  _hwStyles = _loadStyleMap(HW_STYLES_KEY);
  _textStyles = _loadStyleMap(TEXT_STYLES_KEY);
  _alarmStyles = _loadStyleMap(ALARM_STYLES_KEY);
  _todayStyles = _loadStyleMap(TODAY_STYLES_KEY);
  _upcomingStyles = _loadStyleMap(UPCOMING_STYLES_KEY);
  _streakStyles = _loadStyleMap(STREAK_STYLES_KEY);
  _budgetStyles = _loadStyleMap(BUDGET_STYLES_KEY);
  _aqStyles = _loadStyleMap(AQ_STYLES_KEY);
  _wcStyles = _loadStyleMap(WC_STYLES_KEY);
  _savingsStyles = _loadStyleMap(SAVINGS_STYLES_KEY);
  _focusStyles = _loadStyleMap(FOCUS_STYLES_KEY);
  _currencyStyles = _loadStyleMap(CURRENCY_STYLES_KEY);
  _calcStyles = _loadStyleMap(CALC_STYLES_KEY);
  _breathStyles = _loadStyleMap(BREATH_STYLES_KEY);
  _readStyles = _loadStyleMap(READ_STYLES_KEY);
  _doodleStyles = _loadStyleMap(DOODLE_STYLES_KEY);
  _ghStyles = _loadStyleMap(GH_STYLES_KEY);
}
function _persistStyleMap(map, key) {
  try { localStorage.setItem(key, JSON.stringify(map)); } catch(e) {}
}
function _copyWidgetStyle(srcUid, dstUid) {
  if (!srcUid || !dstUid || srcUid === dstUid) return;
  var pairs = [
    [_clockStyles, CLOCK_STYLES_KEY], [_weatherStyles, WEATHER_STYLES_KEY],
    [_sleepStyles, SLEEP_STYLES_KEY],
    [_headlinesStyles, HEADLINES_STYLES_KEY], [_calStyles, CAL_STYLES_KEY],
    [_todosStyles, TODOS_STYLES_KEY], [_habitsStyles, HABITS_STYLES_KEY],
    [_moodStyles, MOOD_STYLES_KEY], [_waterStyles, WATER_STYLES_KEY],
    [_timerStyles, TIMER_STYLES_KEY], [_pomoStyles, POMO_STYLES_KEY],
    [_notesStyles, NOTES_STYLES_KEY], [_linksStyles, LINKS_STYLES_KEY],
    [_quoteStyles, QUOTE_STYLES_KEY], [_cdStyles, CD_STYLES_KEY],
    [_priStyles, PRI_STYLES_KEY], [_progStyles, PROG_STYLES_KEY],
    [_goalsStyles, GOALS_STYLES_KEY], [_imgStyles, IMG_STYLES_KEY],
    [_hwStyles, HW_STYLES_KEY], [_textStyles, TEXT_STYLES_KEY],
    [_alarmStyles, ALARM_STYLES_KEY], [_todayStyles, TODAY_STYLES_KEY],
    [_upcomingStyles, UPCOMING_STYLES_KEY], [_streakStyles, STREAK_STYLES_KEY],
    [_budgetStyles, BUDGET_STYLES_KEY], [_aqStyles, AQ_STYLES_KEY],
    [_wcStyles, WC_STYLES_KEY], [_savingsStyles, SAVINGS_STYLES_KEY],
    [_focusStyles, FOCUS_STYLES_KEY],
    [_currencyStyles, CURRENCY_STYLES_KEY], [_calcStyles, CALC_STYLES_KEY],
    [_breathStyles, BREATH_STYLES_KEY],
    [_readStyles, READ_STYLES_KEY], [_doodleStyles, DOODLE_STYLES_KEY],
    [_ghStyles, GH_STYLES_KEY]
  ];
  for (var i = 0; i < pairs.length; i++) {
    var map = pairs[i][0];
    var key = pairs[i][1];
    if (map && Object.prototype.hasOwnProperty.call(map, srcUid)) {
      map[dstUid] = map[srcUid];
      _persistStyleMap(map, key);
    }
  }
}

const HUB_VIS_KEY = 'haven-hub-visibility';
const HUB_CONTENT_KEY = 'haven-hub-content';
/* Hub canvas below 768px.
   Set true to fall back to the "Coming soon on mobile" placeholder.
   When false, the canvas renders on phones and the mobile CSS at
   css/style.css ("BENTO CANVAS MOBILE", max-width 640px) reflows each
   bubble into a full-width stacked card in document order. Edit mode
   stays absolutely positioned so drag/resize still work. */
const HUB_MOBILE_DISABLED = false;
const TIMER_STATE_KEY = 'hub-timer-state';
const GUEST_TEMPLATE_KEY = 'haven-guest-default-template';

const MAX_CANVAS_HEIGHT = 10000;
let hubEditMode = false;
try { localStorage.setItem(HUB_EDIT_KEY, 'false'); } catch (e) { /* ignore */ }
let hubMode = 'desktop';
function _contentKey() { return HUB_CONTENT_KEY; }
function _bentoKey() { return HUB_BENTO_KEY; }
function _visKey() { return HUB_VIS_KEY; }
function _layoutKey() { return HUB_LAYOUT_KEY; }

let _bentoUidCounter = 0;
let _clockInterval = null;
let _timerIntervals = {};
let _pomodoroState = {};
let _calView = { year: 0, month: -1 }; // tracks displayed month/year for refresh
let _weatherFetched = false;
let _weatherLastData = null;
let _undoStack = [];
let _redoStack = [];
const BENTO_UNDO_MAX = 30;
function _nextUid() { return 'b' + (++_bentoUidCounter) + '_' + Date.now(); }
function pushUndoState() {
  _undoStack.push(JSON.stringify(hubContent.bentoLayout));
  if (_undoStack.length > BENTO_UNDO_MAX) _undoStack.shift();
  _redoStack = [];
}
function undoCanvas() {
  if (!_undoStack.length) return;
  _redoStack.push(JSON.stringify(hubContent.bentoLayout));
  hubContent.bentoLayout = normalizeBentoLayout(JSON.parse(_undoStack.pop()), hubContent);
  saveHubContent();
  renderHubBento();
}
function redoCanvas() {
  if (!_redoStack.length) return;
  _undoStack.push(JSON.stringify(hubContent.bentoLayout));
  hubContent.bentoLayout = normalizeBentoLayout(JSON.parse(_redoStack.pop()), hubContent);
  saveHubContent();
  renderHubBento();
}
function updateUndoButtons() {
  var ub = document.getElementById('bentoEditUndo');
  var rb = document.getElementById('bentoEditRedo');
  if (ub) ub.disabled = !_undoStack.length;
  if (rb) rb.disabled = !_redoStack.length;
}

/* ─── Section drag/drop reordering ─────────── */

// ─── Touch section drag state (mobile alternative to HTML5 DnD) ───
let _touchSectionDrag = null;

function _onSectionTouchStart(e) {
  const handle = e.target.closest('.hub-section-drag-handle');
  if (!handle) return;
  if (e.touches.length !== 1) return;
  const wrap = handle.closest('.hub-section-wrap');
  if (!wrap) return;
  _touchSectionDrag = {
    wrap: wrap,
    startX: e.touches[0].clientX,
    startY: e.touches[0].clientY,
    moved: false
  };
}

function _onSectionTouchMove(e) {
  if (!_touchSectionDrag) return;
  if (e.touches.length !== 1) return;
  e.preventDefault();
  const touch = e.touches[0];
  const dx = touch.clientX - _touchSectionDrag.startX;
  const dy = touch.clientY - _touchSectionDrag.startY;
  if (!_touchSectionDrag.moved && dx * dx + dy * dy < 25) return;
  _touchSectionDrag.moved = true;
  
  // Find which section we're over
  const wrap = _touchSectionDrag.wrap;
  const container = wrap.parentElement;
  if (!container) return;
  const wraps = container.querySelectorAll('.hub-section-wrap');
  let targetWrap = null;
  wraps.forEach(function(w) {
    if (w === wrap) return;
    const r = w.getBoundingClientRect();
    if (touch.clientX >= r.left && touch.clientX <= r.right &&
        touch.clientY >= r.top && touch.clientY <= r.bottom) {
      targetWrap = w;
    }
  });
  
  // Remove previous drag-over
  wraps.forEach(function(w) { w.classList.remove('hub-section-drag-over'); });
  if (targetWrap) targetWrap.classList.add('hub-section-drag-over');
  _touchSectionDrag.targetWrap = targetWrap;
}

function _onSectionTouchEnd(e) {
  if (!_touchSectionDrag) return;
  const wrap = _touchSectionDrag.wrap;
  const targetWrap = _touchSectionDrag.targetWrap;
  wrap.classList.remove('hub-section-dragging');
  document.querySelectorAll('.hub-section-drag-over').forEach(function(el) {
    el.classList.remove('hub-section-drag-over');
  });
  
  if (_touchSectionDrag.moved && targetWrap && wrap !== targetWrap) {
    const container = wrap.parentElement;
    if (container) {
      container.insertBefore(wrap, targetWrap);
      const order = [];
      container.querySelectorAll('.hub-section-wrap').forEach(function(w) {
        order.push(w.dataset.hubSection);
      });
      saveHubLayout(order);
    }
  }
  _touchSectionDrag = null;
}


function initHubLayout() {
  const container = document.querySelector('.hub-main') || document.querySelector('.hub-layout');
  if (!container) return;
  if (container._initHubLayoutWired) return;
  container._initHubLayoutWired = true;

  const savedOrder = loadHubLayout();
  if (savedOrder && savedOrder.length) {
    const wraps = container.querySelectorAll('.hub-section-wrap');
    const wrapMap = {};
    wraps.forEach(w => { wrapMap[w.dataset.hubSection] = w; });
    savedOrder.forEach(id => {
      const w = wrapMap[id];
      if (w) container.appendChild(w);
    });
  }

  container.querySelectorAll('.hub-section-drag-handle').forEach(handle => {
    handle.addEventListener('dragstart', onDragStart);
    handle.addEventListener('dragend', onDragEnd);
    handle.addEventListener('touchstart', _onSectionTouchStart, { passive: true });
    handle.addEventListener('touchend', _onSectionTouchEnd);
  });

  container.querySelectorAll('.hub-section-wrap').forEach(wrap => {
    wrap.addEventListener('dragover', onDragOver);
    wrap.addEventListener('dragenter', onDragEnter);
    wrap.addEventListener('dragleave', onDragLeave);
    wrap.addEventListener('drop', onDrop);
  });
  
  // Touchmove on container for section reorder
  container.addEventListener('touchmove', _onSectionTouchMove, { passive: false });

  updateSectionHandles();
}

function loadHubLayout() {
  try {
    const raw = localStorage.getItem(_layoutKey());
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHubLayout(order) {
  localStorage.setItem(_layoutKey(), JSON.stringify(order));
}

let dragSrcWrap = null;

function onDragStart(e) {
  dragSrcWrap = e.target.closest('.hub-section-wrap');
  if (!dragSrcWrap) return;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcWrap.dataset.hubSection);
  dragSrcWrap.classList.add('hub-section-dragging');
}

function onDragEnd(e) {
  e.target.closest('.hub-section-wrap')?.classList.remove('hub-section-dragging');
  document.querySelectorAll('.hub-section-drag-over').forEach(el => el.classList.remove('hub-section-drag-over'));
  dragSrcWrap = null;
}

function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function onDragEnter(e) {
  e.preventDefault();
  const wrap = e.target.closest('.hub-section-wrap');
  if (wrap && wrap !== dragSrcWrap) wrap.classList.add('hub-section-drag-over');
}

function onDragLeave(e) {
  const wrap = e.target.closest('.hub-section-wrap');
  if (wrap && wrap !== dragSrcWrap) wrap.classList.remove('hub-section-drag-over');
}

function onDrop(e) {
  e.preventDefault();
  const targetWrap = e.target.closest('.hub-section-wrap');
  if (!targetWrap || !dragSrcWrap || targetWrap === dragSrcWrap) return;
  targetWrap.classList.remove('hub-section-drag-over');

  const container = dragSrcWrap.parentElement;
  if (!container) return;

  container.insertBefore(dragSrcWrap, targetWrap);

  const order = [];
  container.querySelectorAll('.hub-section-wrap').forEach(w => order.push(w.dataset.hubSection));
  saveHubLayout(order);
}

/* ─── Bento layout normalization ───────────── */
function normalizeBentoLayout(layout, parent) {
  var REMOVED_WIDGET_TYPES = ['gratitude','hijri','sunrise','rain','weakspot','expense'];
  if (Array.isArray(layout)) layout = layout.filter(function(it) { return it && REMOVED_WIDGET_TYPES.indexOf(it.t) === -1; });

  const result = [];
  (layout || []).forEach(item => {
    const norm = typeof item === 'string' ? {t: item} : {...item};
    if (!norm.uid) norm.uid = _nextUid();
    if (norm.w === undefined || norm.h === undefined) {
      const defaultSize = 280;
      norm.w = snap(defaultSize);
      norm.h = snap(defaultSize);
    }
    if (norm.hidden === undefined) norm.hidden = false;
    result.push(norm);
  });
  // Migrate old imageAspect/imageAspects to per-item
  if (parent && parent.imageAspects) {
    result.forEach(function(n) {
      if (n.t === 'images' && !n.imageId) n.imageId = 'hub-tulips';
    });
  }
  // Phase 1: place new items below the lowest placed item
  const placed = result.filter(i => i.x !== undefined && i.y !== undefined);
  const unplaced = result.filter(i => i.x === undefined || i.y === undefined);
  let maxY = 24;
  placed.forEach(i => { maxY = Math.max(maxY, i.y + i.h); });
  unplaced.forEach(item => {
    item.x = snap(24);
    item.y = snap(maxY + 24);
    maxY = item.y + item.h;
  });
  // Phase 2: only resolve collisions for unplaced (new) items, not existing ones
  const combined = [...placed, ...unplaced];
  if (unplaced.length > 0) resolveBubbleCollisions(combined);
  return combined;
}

/* ─── Bubble collision push ────────────────── */
function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolveBubbleCollisions(layout, canvasWidth, canvasHeight, excludeUid) {
  if (canvasWidth === undefined) {
    var _gc = document.querySelector('.bento-grid');
    var _gr = _gc ? _gc.getBoundingClientRect() : null;
    canvasWidth = _gr ? _gr.width : 1800;
  }
  if (canvasHeight === undefined) canvasHeight = MAX_CANVAS_HEIGHT;
  function clamp(item) {
    if (item.uid === excludeUid) return;
    item.x = Math.max(0, Math.min(item.x, canvasWidth - item.w));
    item.y = Math.max(0, Math.min(item.y, canvasHeight - item.h));
  }
  let dirty = true;
  let maxIter = 40;
  while (dirty && maxIter-- > 0) {
    dirty = false;
    layout.sort((a, b) => a.y - b.y || a.x - b.x);
    for (let i = 0; i < layout.length; i++) {
      if (layout[i].hidden) continue;
      for (let j = i + 1; j < layout.length; j++) {
        if (layout[j].hidden) continue;
        if (!rectsOverlap(layout[i], layout[j])) continue;
        const pushX = snap(layout[i].x + layout[i].w + 24);
        if (pushX > layout[j].x && pushX - layout[j].x < (layout[i].y + layout[i].h + 24 - layout[j].y || 999)) {
          layout[j].x = pushX;
          dirty = true;
        } else {
          const pushY = snap(layout[i].y + layout[i].h + 24);
          if (pushY > layout[j].y) {
            layout[j].y = pushY;
            dirty = true;
          }
        }
        clamp(layout[j]);
      }
    }
  }
  layout.forEach(clamp);
  return layout;
}

/* ─── Quote of the week bank ────────────────── */
const QUOTE_BANK = [
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
  { text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
  { text: 'The only person you are destined to become is the person you decide to be.', author: 'Ralph Waldo Emerson' },
  { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
  { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
  { text: 'Your time is limited, don\'t waste it living someone else\'s life.', author: 'Steve Jobs' },
  { text: 'The journey of a thousand miles begins with a single step.', author: 'Lao Tzu' },
  { text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
  { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
  { text: 'Act as if what you do makes a difference. It does.', author: 'William James' },
  { text: 'Do not wait to strike till the iron is hot; but make it hot by striking.', author: 'William Butler Yeats' },
  { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford' },
  { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
  { text: 'The best revenge is massive success.', author: 'Frank Sinatra' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
  { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C.S. Lewis' },
  { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
  { text: 'Don\'t judge each day by the harvest you reap but by the seeds that you plant.', author: 'Robert Louis Stevenson' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
  { text: 'I have not failed. I\'ve just found 10,000 ways that won\'t work.', author: 'Thomas Edison' },
  { text: 'A person who never made a mistake never tried anything new.', author: 'Albert Einstein' },
  { text: 'The only limit to our realization of tomorrow will be our doubts of today.', author: 'Franklin D. Roosevelt' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Be yourself; everyone else is already taken.', author: 'Oscar Wilde' },
  { text: 'Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.', author: 'Robert Frost' },
  { text: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
  { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
  { text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon' },
  { text: 'Get busy living or get busy dying.', author: 'Stephen King' },
  { text: 'In three words I can sum up everything I\'ve learned about life: it goes on.', author: 'Robert Frost' },
  { text: 'If you want to live a happy life, tie it to a goal, not to people or things.', author: 'Albert Einstein' },
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
  { text: 'The only wealth which you will keep forever is the wealth you have given away.', author: 'Marcus Aurelius' },
  { text: 'First, have a definite, clear practical ideal; a goal, an objective. Second, have the necessary means to achieve your ends; wisdom, money, and methods. Third, adjust all your means to that end.', author: 'Aristotle' },
  { text: 'The greatest glory in living lies not in never falling, but in rising every time we fall.', author: 'Nelson Mandela' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { text: 'Your time is limited, so don\'t waste it living someone else\'s life. Don\'t be trapped by dogma.', author: 'Steve Jobs' },
  { text: 'If you look at what you have in life, you\'ll always have more. If you look at what you don\'t have in life, you\'ll never have enough.', author: 'Oprah Winfrey' },
  { text: 'If you set your goals ridiculously high and it\'s a failure, you will fail above everyone else\'s success.', author: 'James Cameron' },
  { text: 'Life is either a daring adventure or nothing at all.', author: 'Helen Keller' },
  { text: 'Many of life\'s failures are people who did not realize how close they were to success when they gave up.', author: 'Thomas Edison' },
  { text: 'The scariest moment is always just before you start.', author: 'Stephen King' },
  { text: 'There is nothing impossible to they who will try.', author: 'Alexander the Great' },
  { text: 'The only way to discover the limits of the possible is to go beyond them into the impossible.', author: 'Arthur C. Clarke' },
  { text: 'Try not to become a man of success, but rather try to become a man of value.', author: 'Albert Einstein' },
  { text: 'Great minds discuss ideas; average minds discuss events; small minds discuss people.', author: 'Eleanor Roosevelt' },
  { text: 'If you cannot do great things, do small things in a great way.', author: 'Napoleon Hill' },
];

/* ─── Get current ISO week number ──────────── */
function getCurrentWeekNumber() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/* ─── Get quote of the week ────────────────── */
function getQuoteOfTheWeek() {
  const weekNum = getCurrentWeekNumber();
  const idx = (weekNum - 1) % QUOTE_BANK.length;
  return { ...QUOTE_BANK[idx], weekNumber: weekNum };
}

/* ─── Default hub content ──────────────────── */
const HUB_DEFAULTS = {
  greeting: '',
  goals: [],
  priorities: [],
  quote: getQuoteOfTheWeek(),
  todos: [],
  todayTodos: { date: '', items: [] },
  habits: [],
  upcoming: { days: 14 },
  budget: { monthly: 1000 },
  worldClock: ['Europe/London', 'America/New_York', 'Asia/Tokyo'],
  savings: { name: 'Savings Goal', target: 5000, saved: 0 },
  focusLog: {},
  focusCfg: { sessionMinutes: 25 },
  currency: { from: 'USD', to: 'EUR', amount: 1 },
  calcStates: {},
  breathing: { pattern: 'box', cycles: 0, date: '' },
  reading: [],
  doodles: {},
  github: { username: '' },

  notes: '',
  links: [],
  water: { goal: 8, logged: 0, date: new Date().toISOString().slice(0,10) },
  mood: { today: null, history: {} },
  countdown: [],
  homework: [],
  study: [],
  gallery: [
    { label: 'Schedule', desc: 'Time-blocking grid with drag & drop, AI scheduling, and week/month/agenda views.', href: 'schedule.html', icon: 'calendar', color: 'var(--tag-daily-text)', bg: 'var(--tag-daily-bg)' },
    { label: 'Progress', desc: 'Board, timeline, log, and charts tracking what you do and how you are doing.', href: 'progress.html', icon: 'chart', color: 'var(--tag-mandarin-text)', bg: 'var(--tag-mandarin-bg)' },
    { label: 'Goals', desc: 'Track goals with progress bars, sub-tasks, and vision board.', href: 'goals.html', icon: 'star', color: 'var(--tag-daily-text)', bg: 'var(--tag-daily-bg)' }
  ],
  bentoLayout: []
};

let hubContent = null;

function _hubTodayKey(d) {
  var t = d || new Date();
  var m = String(t.getMonth() + 1).padStart(2, '0');
  var day = String(t.getDate()).padStart(2, '0');
  return t.getFullYear() + '-' + m + '-' + day;
}

function _todayTodosStore() {
  if (!hubContent) return { date: _hubTodayKey(), items: [] };
  var t = hubContent.todayTodos;
  if (!t || typeof t !== 'object' || !Array.isArray(t.items)) {
    t = { date: _hubTodayKey(), items: [] };
    hubContent.todayTodos = t;
  }
  var today = _hubTodayKey();
  if (t.date !== today) {
    t.date = today;
    t.items = [];
    try { saveHubContent(); } catch(e) {}
  }
  return t;
}

function _todayTodosItems() {
  return _todayTodosStore().items;
}

function _todayResetText() {
  var now = new Date();
  var end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  var s = Math.max(0, Math.floor((end - now) / 1000));
  var h = String(Math.floor(s / 3600)).padStart(2, '0');
  var m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  var sec = String(s % 60).padStart(2, '0');
  return h + ':' + m + ':' + sec;
}

var _todayResetTick = null;
function _startTodayResetTick() {
  if (_todayResetTick) return;
  _todayResetTick = setInterval(function() {
    var txt = _todayResetText();
    document.querySelectorAll('[data-today-reset]').forEach(function(el) { el.textContent = txt; });
    if (hubContent && hubContent.todayTodos && hubContent.todayTodos.date !== _hubTodayKey()) {
      _todayTodosStore();
      if (typeof renderHubBento === 'function') renderHubBento();
    }
  }, 1000);
}


function loadHubContent() {
  const defaults = HUB_DEFAULTS;
  const ck = _contentKey();
  try {
    const raw = localStorage.getItem(ck);
    if (raw) {
      const hc = JSON.parse(raw);
      hc.bentoLayout = normalizeBentoLayout(hc.bentoLayout, hc);
      try { localStorage.removeItem(_bentoKey()); } catch(e) {}
if (!hc.goals) hc.goals = [...defaults.goals];
      if (!hc.priorities) hc.priorities = [...defaults.priorities];
      if (!hc.quote) hc.quote = getQuoteOfTheWeek();
      else {
        // Auto-rotate quote of the week
        const currentWeek = getCurrentWeekNumber();
        if (!hc.quote.weekNumber || hc.quote.weekNumber !== currentWeek) {
          const weekly = getQuoteOfTheWeek();
          hc.quote.text = weekly.text;
          hc.quote.author = weekly.author;
          hc.quote.weekNumber = weekly.weekNumber;
        }
      }
      if (!hc.todos) hc.todos = defaults.todos.map(t => ({...t}));
      if (!hc.todayTodos || typeof hc.todayTodos !== 'object' || !Array.isArray(hc.todayTodos.items)) hc.todayTodos = { date: _hubTodayKey(), items: [] };
      else if (hc.todayTodos.date !== _hubTodayKey()) { hc.todayTodos.date = _hubTodayKey(); hc.todayTodos.items = []; }
      if (!hc.habits) hc.habits = [...defaults.habits];
      if (!hc.habitData) hc.habitData = {};
      if (!hc.upcoming || typeof hc.upcoming.days !== 'number') hc.upcoming = { days: 14 };
      if (!hc.budget) hc.budget = { monthly: 1000 };
      if (!Array.isArray(hc.worldClock)) hc.worldClock = defaults.worldClock.slice();
      if (!hc.savings) hc.savings = { name: 'Savings Goal', target: 5000, saved: 0 };
      if (!hc.focusLog || typeof hc.focusLog !== 'object') hc.focusLog = {};
      if (!hc.focusCfg || typeof hc.focusCfg.sessionMinutes !== 'number') hc.focusCfg = { sessionMinutes: 25 };
      if (!hc.currency) hc.currency = { from: 'USD', to: 'EUR', amount: 1 };
      if (!hc.calcStates || typeof hc.calcStates !== 'object') hc.calcStates = {};
      if (!hc.breathing || typeof hc.breathing !== 'object') hc.breathing = { pattern: 'box', cycles: 0, date: '' };
      if (!Array.isArray(hc.reading)) hc.reading = [];
      if (!hc.doodles || typeof hc.doodles !== 'object') hc.doodles = {};
      if (!hc.github || typeof hc.github !== 'object') hc.github = { username: '' };
      if (hc.notes === undefined) hc.notes = '';
      if (!hc.links) hc.links = defaults.links.map(l => ({...l}));
      if (!hc.homework) hc.homework = defaults.homework.map(h => ({...h}));
      if (!hc.study) hc.study = [];
      else hc.study = _normalizeStudy(hc.study);
      return hc;
    }
  } catch(e) { console.warn('[img] loadHubContent: error:', e); }
  try {
    var _orig = typeof __origLS !== 'undefined' ? __origLS : localStorage;
    var _tmpl = _orig.getItem(GUEST_TEMPLATE_KEY);
    if (_tmpl) {
      var tc = JSON.parse(_tmpl);
      // Apply same backfill/rotation as main path
      if (!tc.goals) tc.goals = [...defaults.goals];
      if (!tc.priorities) tc.priorities = [...defaults.priorities];
      if (!tc.quote) tc.quote = getQuoteOfTheWeek();
      else {
        var _cw = getCurrentWeekNumber();
        if (!tc.quote.weekNumber || tc.quote.weekNumber !== _cw) {
          var _wk = getQuoteOfTheWeek();
          tc.quote.text = _wk.text; tc.quote.author = _wk.author; tc.quote.weekNumber = _wk.weekNumber;
        }
      }
      if (!tc.todos) tc.todos = defaults.todos.map(function(t) { return {text:t.text,done:t.done}; });
      if (!tc.todayTodos || typeof tc.todayTodos !== 'object' || !Array.isArray(tc.todayTodos.items)) tc.todayTodos = { date: _hubTodayKey(), items: [] };
      else if (tc.todayTodos.date !== _hubTodayKey()) { tc.todayTodos.date = _hubTodayKey(); tc.todayTodos.items = []; }
      if (!tc.habits) tc.habits = [...defaults.habits];
      if (!tc.habitData) tc.habitData = {};
      if (!tc.upcoming || typeof tc.upcoming.days !== 'number') tc.upcoming = { days: 14 };
      if (!tc.budget) tc.budget = { monthly: 1000 };
      if (!Array.isArray(tc.worldClock)) tc.worldClock = defaults.worldClock.slice();
      if (!tc.savings) tc.savings = { name: 'Savings Goal', target: 5000, saved: 0 };
      if (!tc.focusLog || typeof tc.focusLog !== 'object') tc.focusLog = {};
      if (!tc.focusCfg || typeof tc.focusCfg.sessionMinutes !== 'number') tc.focusCfg = { sessionMinutes: 25 };
      if (!tc.currency) tc.currency = { from: 'USD', to: 'EUR', amount: 1 };
      if (!tc.calcStates || typeof tc.calcStates !== 'object') tc.calcStates = {};
      if (!tc.breathing || typeof tc.breathing !== 'object') tc.breathing = { pattern: 'box', cycles: 0, date: '' };
      if (!Array.isArray(tc.reading)) tc.reading = [];
      if (!tc.doodles || typeof tc.doodles !== 'object') tc.doodles = {};
      if (!tc.github || typeof tc.github !== 'object') tc.github = { username: '' };
      if (tc.notes === undefined) tc.notes = '';
      if (!tc.links) tc.links = defaults.links.map(function(l) { return {label:l.label,url:l.url}; });
      if (!tc.homework) tc.homework = defaults.homework.map(function(h) { return {text:h.text,subject:h.subject,due:h.due,priority:h.priority,done:h.done}; });
      if (!tc.study) tc.study = [];
      else tc.study = _normalizeStudy(tc.study);
      return tc;
    }
  } catch(e) {}
  return JSON.parse(JSON.stringify(HUB_DEFAULTS));
}

function saveHubContent() {
  if (!hubContent) return;
  var _hadImages = hubContent._images;
  delete hubContent._images;
  const ck = _contentKey();
  try {
    var ok = safeSetItem(ck, JSON.stringify(hubContent));
    if (!ok) {
      console.warn('[img] saveHubContent: SAVE FAILED (quota)');
      if (typeof showToast === 'function') showToast('Could not save layout: storage is full. Try removing some images.', 'error', 4000);
    }
  } catch(e) {
    console.warn('[img] saveHubContent failed:', e);
    if (typeof showToast === 'function') showToast('Failed to save layout. Storage may be full.', 'error', 4000);
  }
  if (_hadImages !== undefined) hubContent._images = _hadImages;
}

var ADMIN_PASS = 'MjcwODEw';

function saveAsGuestDefault() {
  if (!hubContent) { showToast('Nothing to save', 'error', 1500); return; }
  var orig = typeof __origLS !== 'undefined' ? __origLS : localStorage;
  var stored = null;
  try { stored = orig.getItem('haven-admin-password'); } catch(e) {}
  if (!stored) {
    try { orig.setItem('haven-admin-password', ADMIN_PASS); stored = ADMIN_PASS; } catch(e) {}
  }
  var entered = prompt('Enter admin password to save default layout:');
  if (!entered) return;
  try { if (btoa(entered) !== stored) { showToast('Incorrect password', 'error', 2000); return; } } catch(e) { showToast('Error verifying password', 'error', 2000); return; }
  var _hadImages = hubContent._images;
  delete hubContent._images;
  try {
    orig.setItem(GUEST_TEMPLATE_KEY, JSON.stringify(hubContent));
    showToast('Saved as default for new guests', 'success', 2000);
  } catch(e) { showToast('Failed to save default', 'error', 2000); }
  if (_hadImages !== undefined) hubContent._images = _hadImages;
}

function loadHubVisibility() {
  try {
    const raw = localStorage.getItem(_visKey());
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveHubVisibility(vis) {
  try { safeSetItem(_visKey(), JSON.stringify(vis)); } catch {}
}

/* ─── Edit mode ────────────────────────────── */
function toggleHubEdit(on) {
  // Blur any focused editable field to trigger save before we exit
  if (document.activeElement && document.activeElement.closest('[contenteditable],[data-edit],[data-save]')) {
    document.activeElement.blur();
  }
  // Sync live DOM bubble dimensions into the layout before saving
  if (hubEditMode) {
    document.querySelectorAll('.bento-bubble').forEach(function(el) {
      var uid = el.dataset.bubble;
      if (!uid) return;
      var w = el.offsetWidth;
      var h = el.offsetHeight;
      if (!w || !h) return;
      var item = hubContent.bentoLayout.find(function(i) { return i.uid === uid; });
      if (item) {
        item.w = Math.max(100, snap(w));
        item.h = Math.max(80, snap(h));
      }
    });
  }
  hubEditMode = on !== undefined ? on : !hubEditMode;
  localStorage.setItem(HUB_EDIT_KEY, hubEditMode);
  if (!hubEditMode) saveHubContent();
  // Clean up dock when exiting edit mode (renderHubBento handles showing it)
  if (!hubEditMode) {
    var d = document.querySelector('.bento-bubble-dock[data-bubble-dock]');
    if (d) d.remove();
  }
  // Sync with global state.editMode when exiting edit mode
  if (!hubEditMode && typeof state !== 'undefined' && state.editMode) {
    state.editMode = false;
    document.documentElement.classList.remove('edit-mode');
    var ind = document.getElementById('editModeIndicator');
    if (ind) { ind.classList.remove('active'); setTimeout(function() { ind.classList.add('hidden'); }, 300); }
    document.dispatchEvent(new CustomEvent('editModeChange'));
  }
  try { applyHubEditMode(); } catch (e) { console.error('applyHubEditMode error:', e); }
}

function applyHubEditMode() {
  const btn = document.getElementById('hubEditToggle');
  if (btn) btn.classList.toggle('active', hubEditMode);
  document.documentElement.classList.toggle('hub-edit', hubEditMode);
  document.querySelectorAll('.hub-section-header').forEach(h => {
    h.classList.toggle('visible', hubEditMode);
  });
  const greetEl = document.getElementById('hubGreeting');
  if (greetEl) greetEl.contentEditable = hubEditMode ? 'true' : 'false';
  if (hubEditMode) greetEl?.classList.add('hub-editable');
  else greetEl?.classList.remove('hub-editable');
  resetBentoInteractions();
  updateSectionHandles();
  // Undo/redo buttons inside bento section header
  var _headerBtns = document.getElementById('bentoEditHeaderBtns');
  if (hubEditMode) {
    if (!_headerBtns) {
      var _header = document.querySelector('.hub-section-wrap[data-hub-section="bento"] .hub-section-header');
      if (_header) {
        _headerBtns = document.createElement('div');
        _headerBtns.id = 'bentoEditHeaderBtns';
        _headerBtns.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:4px;';
        _headerBtns.innerHTML =
          '<button class="bento-bar-btn bento-bar-undo" id="bentoEditUndo" title="Undo (Ctrl+Z)">' +
            '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 14 2 10 6 6"/><path d="M2 10h10a4 4 0 0 1 0 8"/></svg>' +
            '<span>Undo</span>' +
          '</button>' +
          '<button class="bento-bar-btn bento-bar-redo" id="bentoEditRedo" title="Redo (Ctrl+Shift+Z)">' +
            '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14 6 18 10 14 14"/><path d="M18 10H8a4 4 0 0 0 0 8"/></svg>' +
            '<span>Redo</span>' +
          '</button>';
        _header.appendChild(_headerBtns);
        document.getElementById('bentoEditUndo')?.addEventListener('click', undoCanvas);
        document.getElementById('bentoEditRedo')?.addEventListener('click', redoCanvas);
      }
    }
    updateUndoButtons();
  }
  renderHubBento();
  applyHubVisibility();
}

function applyHubVisibility() {
  const vis = loadHubVisibility();
  document.querySelectorAll('.hub-section-wrap').forEach(wrap => {
    const id = wrap.dataset.hubSection;
    if (id === 'bento' || id === 'sleep') return; // always show canvas and sleep
    const hidden = vis[id] === false;
    wrap.classList.toggle('hidden-section', hidden);
    const toggle = wrap.querySelector('.hub-section-vis-toggle');
    if (toggle) toggle.textContent = hidden ? '\u25CB' : '\u25C9';
  });
}

function toggleSectionVis(id) {
  if (id === 'bento' || id === 'sleep') return; // canvas and sleep can't be hidden
  const vis = loadHubVisibility();
  vis[id] = vis[id] === false ? true : false;
  saveHubVisibility(vis);
  applyHubVisibility();
}

function resetSectionVisibility() {
  localStorage.removeItem(_visKey());
  applyHubVisibility();
  if (typeof showToast === 'function') showToast('Section visibility reset to defaults', 'success', 2000);
}

function renderHubGreeting() {
  const el = document.getElementById('hubGreeting');
  if (!el) return;
  if (hubContent.greeting) {
    el.textContent = hubContent.greeting;
  } else {
    const h = new Date().getHours();
    el.textContent = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
}

/* ─── Bento render ─────────────────────────── */
function _fitTextWidgets() {
  document.querySelectorAll('.bento-bubble[data-bubble]').forEach(function(bubble) {
    var uid = bubble.getAttribute('data-bubble');
    var item = (hubContent && hubContent.bentoLayout) ? hubContent.bentoLayout.find(function(i) { return i.uid === uid; }) : null;
    if (!item || item.t !== 'text') return;
    var content = bubble.querySelector('.w-text-content');
    if (!content) return;
    var wrap = bubble.querySelector('.w-text-wrap');
    if (!wrap) return;
    content.style.fontSize = '';
    var ww = wrap.clientWidth;
    var wh = wrap.clientHeight;
    if (ww < 10 || wh < 10) return;
    var txt = (content.textContent || '').trim();
    if (!txt) return;
    var lines = txt.split(/\n/);
    var numLines = lines.length;
    var maxLineLen = 0;
    lines.forEach(function(l) { if (l.length > maxLineLen) maxLineLen = l.length; });
    var test = document.createElement('span');
    test.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font-family:inherit;font-weight:inherit;letter-spacing:inherit';
    wrap.appendChild(test);
    var lo = 8, hi = Math.max(ww, wh);
    while (hi - lo > 1) {
      var mid = (lo + hi) / 2;
      test.style.fontSize = mid + 'px';
      if (test.offsetWidth <= ww * 0.98) lo = mid; else hi = mid;
    }
    var fsW = lo;
    lo = 8; hi = wh;
    var lineH = 1.1;
    while (hi - lo > 1) {
      var mid = (lo + hi) / 2;
      if (mid * lineH * numLines <= wh * 0.98) lo = mid; else hi = mid;
    }
    var fsH = lo;
    test.remove();
    var fs = Math.min(fsW, fsH);
    fs = Math.max(8, Math.min(fs, wh * 0.95));
    content.style.fontSize = fs + 'px';
    content.style.lineHeight = '1.1';
  });
}
function renderHubBento() {
  try { if (typeof _reloadAllWidgetStyles === 'function') _reloadAllWidgetStyles(); } catch(e) {}
  if (typeof state !== 'undefined' && !state.images && typeof loadImages === 'function') loadImages();
  _loadTimerStates();
  _loadPomoStates();
  const grid = document.querySelector('.bento-grid');
  if (!grid) {
    console.warn('[hub] .bento-grid not found, skipping render');
    return;
  }
  if (typeof _paintHubSkin === 'function') _paintHubSkin(grid);
  // Defensive: ensure hubContent exists and has all required fields
  if (!hubContent) {
    console.warn('[hub] hubContent is null/undefined, loading defaults');
    hubContent = typeof loadHubContent === 'function' ? loadHubContent() : JSON.parse(JSON.stringify(HUB_DEFAULTS));
  }
  // Backfill any missing fields from HUB_DEFAULTS
  const defaults = HUB_DEFAULTS;
  if (!hubContent.bentoLayout) hubContent.bentoLayout = defaults.bentoLayout.map(i => ({...i}));
  if (!hubContent.goals) hubContent.goals = [...defaults.goals];
  if (!hubContent.priorities) hubContent.priorities = [...defaults.priorities];
  if (!hubContent.quote) hubContent.quote = getQuoteOfTheWeek();
  if (!hubContent.todos) hubContent.todos = defaults.todos.map(t => ({...t}));
  if (!hubContent.todayTodos || typeof hubContent.todayTodos !== 'object' || !Array.isArray(hubContent.todayTodos.items)) hubContent.todayTodos = { date: _hubTodayKey(), items: [] };
  else if (hubContent.todayTodos.date !== _hubTodayKey()) { hubContent.todayTodos.date = _hubTodayKey(); hubContent.todayTodos.items = []; try { saveHubContent(); } catch(e) {} }
  if (typeof _startTodayResetTick === 'function') _startTodayResetTick();
  if (!hubContent.habits) hubContent.habits = [...defaults.habits];
  if (!hubContent.habitData) hubContent.habitData = {};
  if (hubContent.notes === undefined) hubContent.notes = '';
  if (!hubContent.links) hubContent.links = defaults.links.map(l => ({...l}));
  if (!hubContent.water) hubContent.water = {...defaults.water};
  if (!hubContent.mood) hubContent.mood = { today:null, history:{} };
  if (!hubContent.countdown) hubContent.countdown = defaults.countdown.map(c => ({...c}));
  if (!hubContent.homework) hubContent.homework = defaults.homework.map(h => ({...h}));
  if (!hubContent.study) hubContent.study = [];
  else hubContent.study = _normalizeStudy(hubContent.study);

  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  const isEdit = hubEditMode;

  var _prevSpIframes = [];
  try {
    var _prevIfr = grid.querySelectorAll('.spotify-widget iframe');
    Array.prototype.forEach.call(_prevIfr, function(f) { if ((f.getAttribute('src') || '').indexOf('open.spotify.com') !== -1) _prevSpIframes.push(f); });
  } catch(e) {}

  // Release Leaflet maps and their polling intervals BEFORE the grid is wiped,
  // otherwise these nodes are detached and can never be cleaned up again.
  grid.querySelectorAll('.fr24-widget').forEach(function(el) {
    if (el._flightInterval) clearInterval(el._flightInterval);
    if (el._leafletMap) { el._leafletMap.remove(); el._leafletMap = null; }
  });

  grid.innerHTML = '';

  function bubbleHtml(item) {
    const {t: type, x, y, w, h, uid} = item;
    const e = (s) => escapeHtml(s);
    const resizeHandle = isEdit
      ? `<div class="bento-resize-edge" data-resize-axis="e" data-resize-bubble="${uid}"></div><div class="bento-resize-edge" data-resize-axis="s" data-resize-bubble="${uid}"></div><div class="bento-resize-handle" data-resize-axis="se" data-resize-bubble="${uid}"></div>`
      : '';
    const STYLE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.26-.29-.43-.68-.43-1.12A1.68 1.68 0 0 1 14.46 16h2.08A5.46 5.46 0 0 0 22 10.48C21.94 5.34 17.2 2 12 2z"/></svg>';
    const TRASH_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const GRIP_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';
    const COPY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
    const _styleBtn = function(attrs, currentName) {
      var lbl = currentName ? 'Style: ' + currentName : 'Style';
      return '<button class="bento-tool-btn bento-tool-style" ' + attrs + ' title="Change style (' + lbl + ')">' + STYLE_SVG + '<span class="btool-label">' + escapeHtml(lbl) + '</span></button>';
    };
    const editUI = isEdit
      ? `<div class="bento-toolbar">
           <button class="bento-tool-btn bento-tool-move" data-move-bubble="${uid}" title="Drag to move this widget">${GRIP_SVG}<span class="btool-label">Drag</span></button>
           <button class="bento-tool-btn" data-duplicate-bubble="${uid}" title="Copy this widget">${COPY_SVG}<span class="btool-label">Copy</span></button>
         </div>
         <div class="bento-toolbar-remove">
          <button class="bento-tool-btn bento-tool-delete bento-tool-icon-only" data-remove-bubble="${uid}" title="Remove this widget" aria-label="Remove this widget">${TRASH_SVG}</button></div>
          ${ (type === 'clock' || type === 'weather' || type === 'sleep-score' || type === 'headlines' || type === 'calendar' || type === 'todos' || type === 'today' || type === 'habits' || type === 'mood' || type === 'water' || type === 'timer' || type === 'alarm' || type === 'pomodoro' || type === 'notes' || type === 'links' || type === 'quote' || type === 'countdown' || type === 'priorities' || type === 'progress' || type === 'goals' || type === 'images' || type === 'text' || type === 'homework' || type === 'upcoming' || type === 'streak' || type === 'budget' || type === 'airquality' || type === 'worldclock' || type === 'savings' || type === 'focuslog' || type === 'currency' || type === 'calculator' || type === 'breathing' || type === 'reading' || type === 'doodle' || type === 'github') ? `<div class="bento-toolbar-style">`
          + (type === 'clock' ? _styleBtn('data-clock-style-toggle="' + uid + '"', _getClockStyle(uid)) : '')
          + (type === 'weather' ? _styleBtn('data-weather-style-toggle="' + uid + '"', _getWeatherStyle(uid)) : '')
          + (type === 'sleep-score' ? _styleBtn('data-sleep-style-toggle="' + uid + '"', _getSleepStyle(uid)) : '')
                    + (type === 'headlines' ? '<select class="bento-tool-btn bento-tool-style bento-headlines-select" data-headlines-source="' + uid + '" title="News source">' + Object.keys(_HL_SOURCES).map(function(sk) { return '<option value="' + sk + '"' + (sk === _getHeadlineSource() ? ' selected' : '') + '>' + _HL_SOURCES[sk].name + '</option>'; }).join('') + '</select>' : '')
          + (type === 'calendar' ? _styleBtn('data-cal-style-toggle="' + uid + '"', _getCalStyle(uid)) : '')
          + (type === 'todos' ? _styleBtn('data-todos-style-toggle="' + uid + '"', _getTodosStyle(uid)) : '')
          + (type === 'today' ? _styleBtn('data-today-style-toggle="' + uid + '"', _getTodayStyle(uid)) : '')
          + (type === 'habits' ? _styleBtn('data-habits-style-toggle="' + uid + '"', _getHabitsStyle(uid)) : '')
          + (type === 'mood' ? _styleBtn('data-mood-style-toggle="' + uid + '"', _getMoodStyle(uid)) : '')
          + (type === 'water' ? _styleBtn('data-water-style-toggle="' + uid + '"', _getWaterStyle(uid)) : '')
          + (type === 'timer' ? _styleBtn('data-timer-style-toggle="' + uid + '"', _getTimerStyle(uid)) : '')
          + (type === 'alarm' ? _styleBtn('data-alarm-style-toggle="' + uid + '"', _getAlarmStyle(uid)) : '')
          + (type === 'pomodoro' ? _styleBtn('data-pomo-style-toggle="' + uid + '"', _getPomoStyle(uid)) : '')
          + (type === 'notes' ? _styleBtn('data-notes-style-toggle="' + uid + '"', _getNotesStyle(uid)) : '')
          + (type === 'links' ? _styleBtn('data-links-style-toggle="' + uid + '"', _getLinksStyle(uid)) : '')
          + (type === 'quote' ? _styleBtn('data-quote-style-toggle="' + uid + '"', _getQuoteStyle(uid)) : '')
          + (type === 'countdown' ? _styleBtn('data-cd-style-toggle="' + uid + '"', _getCdStyle(uid)) : '')
          + (type === 'priorities' ? _styleBtn('data-pri-style-toggle="' + uid + '"', _getPriStyle(uid)) : '')
          + (type === 'progress' ? _styleBtn('data-prog-style-toggle="' + uid + '"', _getProgStyle(uid)) : '')
          + (type === 'goals' ? _styleBtn('data-goals-style-toggle="' + uid + '"', _getGoalsStyle(uid)) : '')
          + (type === 'images' ? _styleBtn('data-img-style-toggle="' + uid + '"', _getImgStyle(uid)) : '')
          + (type === 'text' ? '<select class="bento-tool-btn bento-tool-style bento-text-font-select" data-text-font-select="' + uid + '" title="Change font">' + TEXT_STYLE_LIST.map(function(f) { return '<option value="' + f + '"' + (f === _getTextStyle(uid) ? ' selected' : '') + '>' + f.charAt(0).toUpperCase() + f.slice(1) + '</option>'; }).join('') + '</select>' : '')
          + (type === 'homework' ? _styleBtn('data-hw-style-toggle="' + uid + '"', _getHwStyle(uid)) : '')
          + (type === 'upcoming' ? _styleBtn('data-upcoming-style-toggle="' + uid + '"', _getUpcomingStyle(uid)) : '')
          + (type === 'streak' ? _styleBtn('data-streak-style-toggle="' + uid + '"', _getStreakStyle(uid)) : '')
          + (type === 'budget' ? _styleBtn('data-budget-style-toggle="' + uid + '"', _getBudgetStyle(uid)) : '')
          + (type === 'airquality' ? _styleBtn('data-aq-style-toggle="' + uid + '"', _getAqStyle(uid)) : '')
          + (type === 'worldclock' ? _styleBtn('data-wc-style-toggle="' + uid + '"', _getWcStyle(uid)) : '')
          + (type === 'savings' ? _styleBtn('data-savings-style-toggle="' + uid + '"', _getSavingsStyle(uid)) : '')
          + (type === 'focuslog' ? _styleBtn('data-focus-style-toggle="' + uid + '"', _getFocusStyle(uid)) : '')
                    + (type === 'currency' ? _styleBtn('data-currency-style-toggle="' + uid + '"', _getCurrencyStyle(uid)) : '')
          + (type === 'calculator' ? _styleBtn('data-calc-style-toggle="' + uid + '"', _getCalcStyle(uid)) : '')
          + (type === 'breathing' ? _styleBtn('data-breath-style-toggle="' + uid + '"', _getBreathStyle(uid)) : '')
                    + (type === 'reading' ? _styleBtn('data-read-style-toggle="' + uid + '"', _getReadStyle(uid)) : '')
          + (type === 'doodle' ? _styleBtn('data-doodle-style-toggle="' + uid + '"', _getDoodleStyle(uid)) : '')
          + (type === 'github' ? _styleBtn('data-gh-style-toggle="' + uid + '"', _getGhStyle(uid)) : '')
          + `</div>` : ''}${resizeHandle}`
      : '';
    const clampY = Math.max(0, Math.min(y, MAX_CANVAS_HEIGHT - h));
    const clampH = Math.min(h, MAX_CANVAS_HEIGHT - clampY);
    const dimStyle = `left:${x}px;top:${clampY}px;width:${w}px;height:${clampH}px;overflow:hidden`;

    switch (type) {
      case 'goals': {
        var _goalsStyle = _getGoalsStyle(uid);
        var _goalsList = '';
        if (_goalsStyle === 'compact') {
          _goalsList = '<div class="w-list w-list-compact">' + hubContent.goals.map(function(g, i) {
            return '<div class="w-item w-item-compact" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-todo-drag="' + i + '">\u283F</span>' : '') + '<span class="w-item-num w-item-num-sm">' + (i+1) + '</span><span class="w-item-text ' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a goal…" data-edit="goals" data-idx="' + i + '">' + e(g) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="goals" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="goals"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add goal</button></div>';
        } else if (_goalsStyle === 'numbered') {
          _goalsList = '<div class="w-list w-list-numbered">' + hubContent.goals.map(function(g, i) {
            var pct = Math.min(100, Math.round(((i + 1) / hubContent.goals.length) * 100));
            return '<div class="w-item w-item-numbered" data-idx="' + i + '"><span class="w-goal-num-bg">' + (i+1) + '</span><span class="w-item-text ' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a goal…" data-edit="goals" data-idx="' + i + '">' + e(g) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="goals" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="goals"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add goal</button></div>';
        } else {
          _goalsList = '<div class="w-list">' + hubContent.goals.map(function(g, i) {
            return '<div class="w-item" data-idx="' + i + '"><span class="w-item-num">' + (i+1) + '</span><span class="w-item-text' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a goal…" data-edit="goals" data-idx="' + i + '">' + e(g) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="goals" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="goals"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add goal</button></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>Goals</span></div>
          ${_goalsList}
        </div>`;
      }
      case 'images': {
        const imgId = item.imageId || 'hub-tulips';
        const imgUrl = getImage(imgId);
        const imgFit = 'cover';
        const hasImg = !!imgUrl;
        const isVid = (typeof isVideoUrl === 'function') && isVideoUrl(imgUrl);
        var _imgStyle = _getImgStyle(uid);
        var _imgRadius = '0px';
        var _imgOverlay = '';
        if (_imgStyle === 'rounded') { _imgRadius = '16px'; }
        if (_imgStyle === 'minimal') { _imgOverlay = '<div class="bento-img-overlay-minimal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>'; }
        var _mediaHtml = isVid
          ? '<video data-image-id="' + imgId + '" src="' + e(imgUrl) + '" autoplay muted loop playsinline preload="metadata" style="width:100%;height:100%;object-fit:' + imgFit + ';display:block;border-radius:' + _imgRadius + ';background:#000"></video>'
          : '<img data-image-id="' + imgId + '" src="' + e(imgUrl || '') + '" alt="" style="width:100%;height:100%;object-fit:' + imgFit + ';display:' + (hasImg ? 'block' : 'none') + ';border-radius:' + _imgRadius + '">';
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};padding:var(--gutter);border:1px solid var(--border-color);background:var(--surface-container);border-radius:${_imgRadius}">
          ${editUI}
          <div class="bento-img-wrap" style="width:100%;height:100%;border-radius:${_imgRadius}" data-img-picker="${imgId}">
            ${_mediaHtml}
            <div class="bento-img-placeholder" style="display:${hasImg ? 'none' : 'flex'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Use visual to add image</span>
            </div>
            ${_imgOverlay}
          </div>
        </div>`;
      }
      case 'priorities': {
        const priColors = ['#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6'];
        var _priStyle = _getPriStyle(uid);
        var _priList = '';
        if (_priStyle === 'compact') {
          _priList = '<div class="w-list w-list-compact">' + hubContent.priorities.map(function(p, i) {
            return '<div class="w-item w-item-compact" data-idx="' + i + '"><span class="w-pri-dot" style="background:' + priColors[i % priColors.length] + '"></span><span class="w-item-text ' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a priority…" data-edit="priorities" data-idx="' + i + '">' + e(p) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="priorities" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="priorities"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add priority</button></div>';
        } else if (_priStyle === 'numbered') {
          _priList = '<div class="w-list">' + hubContent.priorities.map(function(p, i) {
            return '<div class="w-item w-item-card" data-idx="' + i + '"><span class="w-pri-badge" style="background:' + priColors[i % priColors.length] + '">' + (i+1) + '</span><span class="w-item-text ' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a priority…" data-edit="priorities" data-idx="' + i + '">' + e(p) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="priorities" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="priorities"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add priority</button></div>';
        } else {
          _priList = '<div class="w-list">' + hubContent.priorities.map(function(p, i) {
            return '<div class="w-item w-item-card" data-idx="' + i + '"><span class="w-pri-dot" style="background:' + priColors[i % priColors.length] + '"></span><span class="w-item-text' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a priority…" data-edit="priorities" data-idx="' + i + '">' + e(p) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="priorities" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="priorities"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add priority</button></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Priorities</span></div>
          ${_priList}
        </div>`;
      }
      case 'quote': {
        const q = hubContent.quote;
        var _quoteStyle = _getQuoteStyle(uid);
        var _quoteBg = 'var(--surface-container-lowest)';
        var _quoteClass = 'w-quote-content';
        var _quoteBar = '<div class="w-quote-bar"></div>';
        if (_quoteStyle === 'boxed') { _quoteBg = 'var(--surface-container)'; _quoteClass = 'w-quote-content w-quote-boxed'; _quoteBar = ''; }
        if (_quoteStyle === 'minimal') { _quoteClass = 'w-quote-content w-quote-minimal'; _quoteBar = '<div class="w-quote-bar w-quote-bar-min"></div>'; }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:${_quoteBg};padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg><span>Quote</span><button class="w-shuffle-btn" data-quote-shuffle title="Random quote"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg></button></div>
          <div class="${_quoteClass}">
            ${_quoteStyle !== 'minimal' ? '<span class="w-quote-mark">\u201C</span>' : ''}
            <div class="w-quote-text${isEdit ? ' hub-editable' : ''}" contenteditable="${isEdit}">${e(q.text)}</div>
          </div>
          ${q.author ? '<div class="w-quote-attribution">&mdash; ' + e(q.author) + '</div>' : ''}
          ${_quoteBar}
        </div>`;
      }
      case 'todos': {
        var _todosStyle = _getTodosStyle(uid);
        var _todosDone = hubContent.todos.filter(function(t) { return t.done; }).length;
        var _todosTotal = hubContent.todos.length;
        var _todosItems = '';
        if (_todosStyle === 'progress') {
          var _progPct = _todosTotal ? Math.round((_todosDone / _todosTotal) * 100) : 0;
          _todosItems = '<div class="w-todos-progress"><div class="w-todos-prog-bar"><div class="w-todos-prog-fill" style="width:' + _progPct + '%"></div></div><span class="w-todos-prog-text">' + _todosDone + '/' + _todosTotal + ' done (' + _progPct + '%)</span></div>' + hubContent.todos.map(function(t, i) {
            return '<div class="w-item' + (t.done ? ' w-item-done' : '') + '" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-todo-drag="' + i + '">\u283F</span>' : '') + '<span class="w-todo-box ' + (t.done ? 'w-todo-checked' : '') + '">' + (t.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span><span class="w-item-text ' + (t.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a task…" data-edit="todos" data-idx="' + i + '">' + e(t.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="todos" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('');
        } else if (_todosStyle === 'compact') {
          _todosItems = hubContent.todos.map(function(t, i) {
            return '<div class="w-item w-item-compact" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-todo-drag="' + i + '">\u283F</span>' : '') + '<span class="w-todo-box w-todo-box-sm ' + (t.done ? 'w-todo-checked' : '') + '">' + (t.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span><span class="w-item-text ' + (t.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a task…" data-edit="todos" data-idx="' + i + '">' + e(t.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="todos" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('');
        } else {
          _todosItems = hubContent.todos.map(function(t, i) {
            return '<div class="w-item" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-todo-drag="' + i + '">\u283F</span>' : '') + '<span class="w-todo-box ' + (t.done ? 'w-todo-checked' : '') + '">' + (t.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span><span class="w-item-text ' + (t.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a task…" data-edit="todos" data-idx="' + i + '">' + e(t.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="todos" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('');
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><span>To Do's</span></div>
          <div class="w-list">${_todosItems}<button class="w-add-btn" data-add="todos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add to-do</button></div>
        </div>`;
      }
      case 'today': {
        var _ttList = _todayTodosItems();
        var _tdDone = _ttList.filter(function(t) { return t.done; }).length;
        var _tdTotal = _ttList.length;
        var _tdStyle = _getTodayStyle(uid);
        var _tdReset = (typeof _todayResetText === 'function') ? _todayResetText() : '';
        var _tdCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        var _tdItems = '';
        if (_tdStyle === 'progress') {
          var _tdPct = _tdTotal ? Math.round((_tdDone / _tdTotal) * 100) : 0;
          _tdItems = '<div class="w-todos-progress"><div class="w-todos-prog-bar"><div class="w-todos-prog-fill" style="width:' + _tdPct + '%"></div></div><span class="w-todos-prog-text">' + _tdDone + '/' + _tdTotal + ' done (' + _tdPct + '%)</span></div>' + _ttList.map(function(t, i) {
            return '<div class="w-item' + (t.done ? ' w-item-done' : '') + '" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-tt-drag="' + i + '">⠿</span>' : '') + '<span class="w-todo-box ' + (t.done ? 'w-todo-checked' : '') + '" data-tt-toggle="' + i + '">' + (t.done ? _tdCheck : '') + '</span><span class="w-item-text ' + (t.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a task…" data-edit="todayTodos" data-idx="' + i + '">' + e(t.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="todayTodos" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('');
        } else if (_tdStyle === 'compact') {
          _tdItems = _ttList.map(function(t, i) {
            return '<div class="w-item w-item-compact" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-tt-drag="' + i + '">⠿</span>' : '') + '<span class="w-todo-box w-todo-box-sm ' + (t.done ? 'w-todo-checked' : '') + '" data-tt-toggle="' + i + '">' + (t.done ? _tdCheck : '') + '</span><span class="w-item-text ' + (t.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a task…" data-edit="todayTodos" data-idx="' + i + '">' + e(t.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="todayTodos" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('');
        } else {
          _tdItems = _ttList.map(function(t, i) {
            return '<div class="w-item" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-tt-drag="' + i + '">⠿</span>' : '') + '<span class="w-todo-box ' + (t.done ? 'w-todo-checked' : '') + '" data-tt-toggle="' + i + '">' + (t.done ? _tdCheck : '') + '</span><span class="w-item-text ' + (t.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a task…" data-edit="todayTodos" data-idx="' + i + '">' + e(t.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="todayTodos" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('');
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><span>Today</span><span class="w-today-count">${_tdDone}/${_tdTotal}</span><span class="w-today-reset" data-today-reset title="Resets at midnight">${_tdReset}</span></div>
          <div class="w-list">${_tdItems}<button class="w-add-btn" data-add="todayTodos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add to-do</button></div>
        </div>`;
      }
      case 'habits': {
        const todayKey = _hubTodayKey();
        const habitDone = hubContent.habitData?.[todayKey] || {};
        var _habitsStyle = _getHabitsStyle(uid);
        var _habitsBody = '';
        if (_habitsStyle === 'list') {
          _habitsBody = '<div class="w-habit-list">' + hubContent.habits.map(function(h, i) {
            var checked = habitDone[i] ? ' w-habit-checked' : '';
            return '<div class="w-habit-row" data-idx="' + i + '"><span class="w-habit-check' + checked + '" data-habit-toggle="' + i + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><span class="w-habit-name' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a habit…" data-edit="habits" data-idx="' + i + '">' + e(h) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="habits" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('') + '</div>';
        } else if (_habitsStyle === 'minimal') {
          _habitsBody = '<div class="w-habit-minimal">' + hubContent.habits.map(function(h, i) {
            var checked = habitDone[i] ? ' w-habit-checked' : '';
            return '<div class="w-habit-min-item' + checked + '" data-habit-toggle="' + i + '" title="' + e(h) + '">' + e(h.slice(0, 3)) + '</div>';
          }).join('') + '</div>';
        } else {
          _habitsBody = '<div class="w-habit-grid">' + hubContent.habits.map(function(h, i) {
            var checked = habitDone[i] ? ' w-habit-checked' : '';
            return '<div class="w-habit-chip" data-idx="' + i + '"><span class="w-habit-check' + checked + '" data-habit-toggle="' + i + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span><span class="' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type a habit…" data-edit="habits" data-idx="' + i + '">' + e(h) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="habits" data-idx="' + i + '">×</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="habits"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add habit</button></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Habits</span></div>
          ${_habitsBody}
        </div>`;
      }
      case 'notes': {
        var _notesStyle = _getNotesStyle(uid);
        var _notesClass = 'w-notes-wrap';
        if (_notesStyle === 'lined') _notesClass = 'w-notes-wrap w-notes-lined';
        if (_notesStyle === 'minimal') _notesClass = 'w-notes-wrap w-notes-minimal';
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Notes</span></div>
          <div class="${_notesClass}">
            <div class="${isEdit ? 'hub-editable' : ''}" contenteditable="${isEdit}" data-save="notes">${e(hubContent.notes || '')}</div>
          </div>
        </div>`;
      }
      case 'links': {
        var _linksStyle = _getLinksStyle(uid);
        var _linksList = '';
        if (_linksStyle === 'compact') {
          _linksList = '<div class="w-list w-list-compact">' + hubContent.links.map(function(l, i) {
            return '<div class="w-item w-item-compact" data-idx="' + i + '"><span class="w-link-icon-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></span><span class="w-item-text ' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Link name…" data-edit="links-label" data-idx="' + i + '">' + e(l.label) + '</span><a href="' + e(l.url) + '" target="_blank" rel="noopener" style="flex-shrink:0;color:var(--text-tertiary);display:flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="links" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="links"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add link</button></div>';
        } else if (_linksStyle === 'grid') {
          _linksList = '<div class="w-links-grid">' + hubContent.links.map(function(l, i) {
            return '<div class="w-link-card-grid" data-idx="' + i + '"><div class="w-link-icon-grid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div><span class="w-link-label-grid ' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Link name…" data-edit="links-label" data-idx="' + i + '">' + e(l.label) + '</span><a href="' + e(l.url) + '" target="_blank" rel="noopener" class="w-link-url-grid">' + e(l.url.slice(0, 30)) + '</a>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="links" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '</div><button class="w-add-btn" data-add="links"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add link</button>';
        } else {
          _linksList = '<div class="w-list">' + hubContent.links.map(function(l, i) {
            return '<div class="w-link-card" data-idx="' + i + '"><div class="w-link-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span class="' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Link name…" data-edit="links-label" data-idx="' + i + '" style="font-size:0.78rem;font-weight:500;color:var(--text-primary)">' + e(l.label) + '</span><span style="display:flex;align-items:center;gap:4px"><span class="' + (isEdit ? 'hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="https://…" data-edit="links-url" data-idx="' + i + '" style="font-size:0.65rem;color:var(--text-tertiary);flex:1">' + e(l.url) + '</span><a href="' + e(l.url) + '" target="_blank" rel="noopener" style="flex-shrink:0;color:var(--text-tertiary);display:flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:10px;height:10px"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a></span></div>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="links" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="links"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add link</button></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg><span>Links</span></div>
          ${_linksList}
        </div>`;
      }
      case 'progress': {
        const _now_ = new Date();
        const progData = generateProgressData();
        const maxVal = Math.max(...progData.daily.map(d => d.done), 1);
        const todayCol = _now_.getDay() === 0 ? 6 : _now_.getDay() - 1;
        const dayLabels = ['M','T','W','T','F','S','S'];
        var _progStyle = _getProgStyle(uid);
        var _progBody = '';
        if (_progStyle === 'stats') {
          _progBody = '<div class="prog-stats-only"><div class="prog-stat-row"><span class="prog-stat-val">' + progData.total + '</span><span class="prog-stat-lbl">completed this week</span></div><div class="prog-stat-row"><span class="prog-stat-val">' + progData.streak + '</span><span class="prog-stat-lbl">day streak</span></div><div class="prog-stat-row"><span class="prog-stat-val">' + progData.todayRemaining + '</span><span class="prog-stat-lbl">remaining today</span></div></div>';
        } else if (_progStyle === 'minimal') {
          var _todayPct = progData.todayTotal > 0 ? Math.round((progData.todayDone / progData.todayTotal) * 100) : 0;
          _progBody = '<div class="prog-minimal"><div class="prog-mini-bar"><div class="prog-mini-fill" style="width:' + _todayPct + '%"></div></div><span class="prog-mini-text">' + progData.todayDone + ' / ' + progData.todayTotal + ' today (' + _todayPct + '%)</span></div>';
        } else {
          var chartBars = progData.daily.map(function(d, i) {
            var pct = Math.max(4, (d.done / maxVal) * 100);
            var todayClass = i === todayCol ? ' today' : '';
            return '<div class="prog-bar-col' + todayClass + '"><span class="prog-bar-count">' + d.done + '<span style="opacity:0.4">/' + d.total + '</span></span><div class="prog-bar" style="height:' + pct + '%"></div><span class="prog-bar-label">' + dayLabels[i] + '</span></div>';
          }).join('');
          _progBody = '<div class="prog-stats-row"><div class="prog-stat"><span class="prog-stat-val">' + progData.total + '</span><span class="prog-stat-lbl">completed</span></div><div class="prog-stat"><span class="prog-stat-val">' + progData.streak + '</span><span class="prog-stat-lbl">day streak</span></div><div class="prog-stat"><span class="prog-stat-val">' + progData.todayRemaining + '</span><span class="prog-stat-lbl">remaining today</span></div></div><div class="prog-chart">' + chartBars + '</div>';
        }
        return `<div class="bento-bubble prog-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head" style="color:var(--primary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg><span>Progress</span></div>
          ${_progBody}
        </div>`;
      }
      case 'clock':
        const now = new Date();
        const hh = String(now.getHours()).padStart(2,'0');
        const mm = String(now.getMinutes()).padStart(2,'0');
        const ss = String(now.getSeconds()).padStart(2,'0');
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dateStr = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
        const clockStyle = _getClockStyle(uid);
        const hourNum = now.getHours();
        const minNum = now.getMinutes();
        const secNum = now.getSeconds();
        let clockFaceHTML = '';
        if (clockStyle === 'analog') {
          const hourDeg = (hourNum % 12) * 30 + minNum * 0.5;
          const minDeg = minNum * 6;
          const secDeg = secNum * 6;
          clockFaceHTML = `<div class="clock-face clock-analog" data-clock-uid="${uid}" data-clock-style="analog">
            <svg class="clock-analog-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="47" fill="none" stroke="var(--border-color)" stroke-width="0.8"/>
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-subtle)" stroke-width="0.3"/>
              ${[0,30,60,90,120,150,180,210,240,270,300,330].map(function(d){var r=44;var x=50+r*Math.sin(d*Math.PI/180);var y=50-r*Math.cos(d*Math.PI/180);return '<line x1="'+(50+40*Math.sin(d*Math.PI/180))+'" y1="'+(50-40*Math.cos(d*Math.PI/180))+'" x2="'+x+'" y2="'+y+'" stroke="var(--text-tertiary)" stroke-width="'+(d%90===0?'1.2':'0.5')+'" stroke-linecap="round"/>'}).join('')}
              <line x1="50" y1="50" x2="50" y2="22" stroke="var(--text-primary)" stroke-width="2.5" stroke-linecap="round" class="clock-hour-hand" style="transform:rotate(${hourDeg}deg);transform-origin:50px 50px"/>
              <line x1="50" y1="50" x2="50" y2="14" stroke="var(--text-primary)" stroke-width="1.5" stroke-linecap="round" class="clock-min-hand" style="transform:rotate(${minDeg}deg);transform-origin:50px 50px"/>
              <line x1="50" y1="58" x2="50" y2="10" stroke="var(--accent)" stroke-width="0.7" stroke-linecap="round" class="clock-sec-hand" style="transform:rotate(${secDeg}deg);transform-origin:50px 50px"/>
              <circle cx="50" cy="50" r="3" fill="var(--accent)"/>
              <circle cx="50" cy="50" r="1.2" fill="var(--bg-primary)"/>
            </svg>
            <span class="clock-date">${dateStr}</span>
          </div>`;
        } else if (clockStyle === 'minimal') {
          clockFaceHTML = `<div class="clock-face clock-minimal" data-clock-uid="${uid}" data-clock-style="minimal">
            <div class="clock-minimal-time"><span class="clock-minimal-h">${hh}</span><span class="clock-minimal-col">:</span><span class="clock-minimal-m">${mm}</span></div>
            <span class="clock-date">${dateStr}</span>
          </div>`;
        } else if (clockStyle === 'flip') {
          clockFaceHTML = `<div class="clock-face clock-flip" data-clock-uid="${uid}" data-clock-style="flip">
            <div class="clock-flip-row">
              <div class="clock-flip-card"><div class="clock-flip-inner"><span class="clock-flip-val">${hh}</span></div></div>
              <span class="clock-flip-colon">:</span>
              <div class="clock-flip-card"><div class="clock-flip-inner"><span class="clock-flip-val">${mm}</span></div></div>
              <span class="clock-flip-sep"></span>
              <div class="clock-flip-card clock-flip-sm"><div class="clock-flip-inner"><span class="clock-flip-val">${ss}</span></div></div>
            </div>
            <span class="clock-date">${dateStr}</span>
          </div>`;
        } else if (clockStyle === 'split') {
          clockFaceHTML = `<div class="clock-face clock-split" data-clock-uid="${uid}" data-clock-style="split">
            <div class="clock-split-row">
              <div class="clock-split-block"><span class="clock-split-num">${hh}</span><span class="clock-split-lbl">HRS</span></div>
              <span class="clock-split-dots">:</span>
              <div class="clock-split-block"><span class="clock-split-num">${mm}</span><span class="clock-split-lbl">MIN</span></div>
              <span class="clock-split-dots">:</span>
              <div class="clock-split-block"><span class="clock-split-num clock-split-sec-num">${ss}</span><span class="clock-split-lbl">SEC</span></div>
            </div>
            <span class="clock-date">${dateStr}</span>
          </div>`;
        } else {
          clockFaceHTML = `<div class="clock-face clock-digital" data-clock-uid="${uid}" data-clock-style="digital">
            <div class="clock-row"><span class="clock-time">${hh}:${mm}</span><span class="clock-seconds">${ss}</span></div>
            <span class="clock-date">${dateStr}</span>
          </div>`;
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Clock</span></div>
          ${clockFaceHTML}
        </div>`;
      case 'weather':
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 116.71-9h1.79a4.5 4.5 0 110 9z"/></svg><span>Weather</span></div>
          <div class="weather-widget" data-weather-uid="${uid}">
            <div class="weather-loading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>Fetching weather...</span>
            </div>
          </div>
        </div>`;
      case 'calendar':
        const calBase = new Date();
        const calOff = typeof item.calOffset === 'number' ? item.calOffset : 0;
        const calDate = new Date(calBase.getFullYear(), calBase.getMonth() + calOff, 1);
        const calYear = calDate.getFullYear();
        const calMonth = calDate.getMonth();
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const isCurrentMonth = calOff === 0;
        const today = calBase.getDate();
        const dayHeaders = ['S','M','T','W','T','F','S'];
        const allTasks = typeof loadTasks === 'function' ? loadTasks() : [];
        const daysWithTasks = {};
        allTasks.forEach(function(t) {
          if (t.date && t.date.startsWith(calYear + '-' + String(calMonth + 1).padStart(2, '0'))) {
            daysWithTasks[parseInt(t.date.slice(8))] = true;
          }
        });
        var _calStyle = _getCalStyle(uid);
        let cells = '';
        for (let i = 0; i < firstDay; i++) { cells += '<span class="cal-cell cal-empty"></span>'; }
        for (let d = 1; d <= daysInMonth; d++) {
          var cls = 'cal-cell';
          if (isCurrentMonth && d === today) cls += ' cal-today';
          if (daysWithTasks[d]) cls += ' cal-has-tasks';
          var dot = daysWithTasks[d] ? '<span class="cal-dot"></span>' : '';
          cells += `<span class="${cls}" data-cal-day="${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}">${d}${dot}</span>`;
        }
        var _calNav = '<div class="cal-header"><button class="cal-nav" data-cal-nav="-1" title="Previous month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="15 18 9 12 15 6"/></svg></button><span><span class="cal-month">' + monthNames[calMonth] + '</span> <span class="cal-year">' + calYear + '</span></span><button class="cal-nav" data-cal-nav="1" title="Next month"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px"><polyline points="9 18 15 12 9 6"/></svg></button></div>';
        var _calBody = '';
        if (_calStyle === 'compact') {
          _calBody = _calNav + '<div class="cal-grid cal-grid-compact">' + dayHeaders.map(function(d) { return '<span class="cal-day-header">' + d + '</span>'; }).join('') + cells + '</div>';
        } else if (_calStyle === 'list') {
          var _todayStr = calYear + '-' + String(calMonth + 1).padStart(2, '0') + '-' + String(today).padStart(2, '0');
          var _upcoming = allTasks.filter(function(t) { return t.date && t.date >= _todayStr; }).slice(0, 6);
          var _taskList = _upcoming.map(function(t) {
            return '<div class="cal-list-item"><span class="cal-list-date">' + t.date.slice(5) + '</span><span class="cal-list-title">' + escapeHtml(t.title) + '</span></div>';
          }).join('');
          _calBody = _calNav + '<div class="cal-list">' + (_taskList || '<div class="cal-list-empty">No upcoming tasks</div>') + '</div>';
        } else {
          _calBody = _calNav + '<div class="cal-grid">' + dayHeaders.map(function(d) { return '<span class="cal-day-header">' + d + '</span>'; }).join('') + cells + '</div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Calendar</span></div>
          <div class="cal-widget">${_calBody}</div>
        </div>`;
      case 'timer': {
        var ts = _timerState(uid);
        var tDisplay = ts.mode === 'countdown' ? _fmtTime(Math.max(0, ts.target - ts.elapsed)) : _fmtTime(ts.elapsed);
        var tStatus = ts.running ? 'running' : (ts.target > 0 && ts.elapsed > 0 ? 'paused' : (ts.target > 0 ? 'ready' : 'idle'));
        var presetsHtml = (tStatus === 'idle' || tStatus === 'ready') ? '<div class="timer-presets"><button class="timer-preset" data-timer-preset="60" data-timer-uid="' + uid + '">1m</button><button class="timer-preset" data-timer-preset="300" data-timer-uid="' + uid + '">5m</button><button class="timer-preset" data-timer-preset="900" data-timer-uid="' + uid + '">15m</button><button class="timer-preset" data-timer-preset="1800" data-timer-uid="' + uid + '">30m</button><button class="timer-preset" data-timer-preset="3600" data-timer-uid="' + uid + '">1h</button></div>' : '';
        var modeLabel = ts.mode === 'countdown' ? 'SW' : 'TD';
        var tFrac = (ts.mode === 'countdown' && ts.target > 0) ? Math.max(0, Math.min(1, ts.elapsed / ts.target)) : 0;
        var tOffset = 326.73 - 326.73 * tFrac;
        var _timerStyle = _getTimerStyle(uid);
        var _timerBody = '';
        if (_timerStyle === 'digital') {
          _timerBody = '<div class="timer-widget timer-widget-digital" data-timer-uid="' + uid + '">' + presetsHtml + '<div class="timer-digital-display"><span class="timer-digital-time">' + tDisplay + '</span><span class="timer-digital-label">' + (ts.mode === 'countdown' ? (ts.target > 0 ? 'countdown' : 'set a preset') : 'stopwatch') + '</span></div><div class="timer-controls"><button class="timer-btn ' + (ts.running ? 'timer-btn-active' : '') + '" data-timer-action="toggle" data-timer-uid="' + uid + '">' + (ts.running ? 'Pause' : 'Start') + '</button><button class="timer-btn timer-btn-mode" data-timer-action="mode" data-timer-uid="' + uid + '">' + modeLabel + '</button><button class="timer-btn timer-btn-reset" data-timer-action="reset" data-timer-uid="' + uid + '">Reset</button></div></div>';
        } else if (_timerStyle === 'bar') {
          var _barPct = Math.round(tFrac * 100);
          _timerBody = '<div class="timer-widget timer-widget-bar" data-timer-uid="' + uid + '">' + presetsHtml + '<div class="timer-bar-wrap"><div class="timer-bar-track"><div class="timer-bar-fill" style="width:' + _barPct + '%"></div></div><span class="timer-bar-time">' + tDisplay + '</span></div><div class="timer-controls"><button class="timer-btn ' + (ts.running ? 'timer-btn-active' : '') + '" data-timer-action="toggle" data-timer-uid="' + uid + '">' + (ts.running ? 'Pause' : 'Start') + '</button><button class="timer-btn timer-btn-mode" data-timer-action="mode" data-timer-uid="' + uid + '">' + modeLabel + '</button><button class="timer-btn timer-btn-reset" data-timer-action="reset" data-timer-uid="' + uid + '">Reset</button></div></div>';
        } else {
          _timerBody = '<div class="timer-widget" data-timer-uid="' + uid + '">' + presetsHtml + '<div class="timer-ring"><svg viewBox="0 0 120 120"><circle class="timer-ring-bg" cx="60" cy="60" r="52"/><circle class="timer-ring-fg" cx="60" cy="60" r="52" stroke-dasharray="326.73" stroke-dashoffset="' + tOffset + '"/></svg><div class="timer-ring-text"><span class="timer-display">' + tDisplay + '</span><span class="timer-mode-label">' + (ts.mode === 'countdown' ? (ts.target > 0 ? 'countdown' : 'set a preset') : 'stopwatch') + '</span></div></div><div class="timer-controls"><button class="timer-btn ' + (ts.running ? 'timer-btn-active' : '') + '" data-timer-action="toggle" data-timer-uid="' + uid + '">' + (ts.running ? 'Pause' : 'Start') + '</button><button class="timer-btn timer-btn-mode" data-timer-action="mode" data-timer-uid="' + uid + '">' + modeLabel + '</button><button class="timer-btn timer-btn-reset" data-timer-action="reset" data-timer-uid="' + uid + '">Reset</button></div></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Timer</span></div>
          ${_timerBody}
        </div>`;
      }
      case 'pomodoro': {
        var ps = _pomoState(uid);
        var pDisplay = _fmtTime(ps.remaining);
        var phaseLabels = { focus:'Focus', short:'Short Break', long:'Long Break' };
        var pct = ps.total > 0 ? ((ps.total - ps.remaining) / ps.total) * 100 : 0;
        var pPhase = phaseLabels[ps.phase] || 'Focus';
        var pCycles = ps.cycle + 1;
        var pRunning = ps.running;
        var pDone = (ps.phase !== 'focus' && ps.cycle % 4 === 0 && ps.cycle > 0) ? 4 : ps.cycle % 4;
        var pDots = '';
        for (var pdi = 0; pdi < 4; pdi++) pDots += '<span class="pomo-dot' + (pdi < pDone ? ' pomo-dot-on' : '') + '"></span>';
        var pOffset = 326.73 - (326.73 * pct / 100);
        var _pomoStyle = _getPomoStyle(uid);
        var _pomoBody = '';
        if (_pomoStyle === 'minimal') {
          _pomoBody = '<div class="pomo-widget pomo-widget-minimal" data-pomo-uid="' + uid + '"><div class="pomo-header"><span class="pomo-phase">' + pPhase + '</span><span class="pomo-dots">' + pDots + '</span></div><span class="pomo-time pomo-time-large">' + pDisplay + '</span><div class="pomo-controls"><button class="timer-btn ' + (pRunning ? 'timer-btn-active' : '') + '" data-pomo-action="toggle" data-pomo-uid="' + uid + '">' + (pRunning ? 'Pause' : 'Start') + '</button><button class="timer-btn timer-btn-reset" data-pomo-action="reset" data-pomo-uid="' + uid + '">Reset</button><button class="timer-btn timer-btn-reset" data-pomo-action="skip" data-pomo-uid="' + uid + '">Skip</button></div></div>';
        } else if (_pomoStyle === 'classic') {
          var _pBar = '<div class="pomo-classic-bar"><div class="pomo-classic-fill" style="width:' + pct + '%"></div></div>';
          _pomoBody = '<div class="pomo-widget pomo-widget-classic" data-pomo-uid="' + uid + '"><div class="pomo-header"><span class="pomo-phase">' + pPhase + '</span><span class="pomo-dots">' + pDots + '</span></div>' + _pBar + '<span class="pomo-time">' + pDisplay + '</span><div class="pomo-controls"><button class="timer-btn ' + (pRunning ? 'timer-btn-active' : '') + '" data-pomo-action="toggle" data-pomo-uid="' + uid + '">' + (pRunning ? 'Pause' : 'Start') + '</button><button class="timer-btn timer-btn-reset" data-pomo-action="reset" data-pomo-uid="' + uid + '">Reset</button><button class="timer-btn timer-btn-reset" data-pomo-action="skip" data-pomo-uid="' + uid + '">Skip</button></div></div>';
        } else {
          _pomoBody = '<div class="pomo-widget" data-pomo-uid="' + uid + '"><div class="pomo-header"><span class="pomo-phase">' + pPhase + '</span><span class="pomo-dots">' + pDots + '</span></div><div class="pomo-ring pomo-ring-' + ps.phase + '"><svg viewBox="0 0 120 120"><circle class="pomo-ring-bg" cx="60" cy="60" r="52"/><circle class="pomo-ring-fg" cx="60" cy="60" r="52" stroke-dasharray="326.73" stroke-dashoffset="' + pOffset + '"/></svg><span class="pomo-time">' + pDisplay + '</span></div><div class="pomo-controls"><button class="timer-btn ' + (pRunning ? 'timer-btn-active' : '') + '" data-pomo-action="toggle" data-pomo-uid="' + uid + '">' + (pRunning ? 'Pause' : 'Start') + '</button><button class="timer-btn timer-btn-reset" data-pomo-action="reset" data-pomo-uid="' + uid + '">Reset</button><button class="timer-btn timer-btn-reset" data-pomo-action="skip" data-pomo-uid="' + uid + '">Skip</button></div></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Pomodoro</span></div>
          ${_pomoBody}
        </div>`;
      }
      case 'alarm': {
        var _alist = _alarmList(item);
        var _alStyle = _getAlarmStyle(uid);
        var _alHead = '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span>Alarms</span><span class="w-today-count">' + _alist.filter(function(a) { return a.enabled !== false; }).length + '/' + _alist.length + '</span></div>';
        var _alRows = _alist.map(function(a) {
          var _ring = !!a.ringing;
          var _rep = '<select class="w-alarm-mini-select" data-alarm-repeat title="Repeat"><option value="once"' + (a.repeat !== 'daily' ? ' selected' : '') + '>Once</option><option value="daily"' + (a.repeat === 'daily' ? ' selected' : '') + '>Daily</option></select>';
          var _snd = '<select class="w-alarm-mini-select" data-alarm-sound title="Sound">' + _alarmSoundOptions(a.sound) + '</select>';
          var _ringHtml = _ring ? '<div class="w-alarm-ringing"><span>Ringing…</span><button class="w-alarm-snooze" data-alarm-snooze>Snooze 5m</button><button class="w-alarm-snooze w-alarm-dismiss" data-alarm-dismiss>Dismiss</button></div>' : '';
          return '<div class="w-alarm-item' + (_ring ? ' ringing' : '') + '" data-alarm-id="' + e(a.id) + '">'
            + '<div class="w-alarm-row"><input type="time" class="w-alarm-time-input" data-alarm-time value="' + e(a.time || '') + '"><button class="w-alarm-toggle' + (a.enabled !== false ? ' on' : '') + '" data-alarm-toggle>' + (a.enabled !== false ? 'On' : 'Off') + '</button><button class="w-alarm-del" data-alarm-del title="Delete alarm">×</button></div>'
            + '<input type="text" class="w-alarm-label-input w-alarm-label-row" data-alarm-label value="' + e(a.label || '') + '" placeholder="Label" maxlength="40" autocomplete="off">'
            + '<div class="w-alarm-row w-alarm-opts">' + _rep + _snd + '<button class="w-alarm-preview" data-alarm-preview title="Preview sound">Test</button><button class="w-alarm-preview" data-alarm-browse title="Browse Freesound">Find</button><input type="range" class="w-alarm-vol" data-alarm-vol min="0" max="100" value="' + a.volume + '" title="Volume"></div>'
            + _ringHtml + '</div>';
        }).join('');
        if (!_alist.length) _alRows = '<div class="w-today-empty">No alarms yet</div>';
        var _alStatus = '<div class="w-alarm-status">' + e(_alarmsStatusText(_alist)) + '</div>';
        var _alBody = '';
        if (_alStyle === 'compact') {
          _alBody = '<div class="w-alarm-wrap w-alarm-compact" data-alarm-uid="' + uid + '">' + _alStatus + '<div class="w-alarm-list">' + _alRows + '</div></div>';
        } else if (_alStyle === 'card') {
          _alBody = '<div class="w-alarm-wrap w-alarm-card" data-alarm-uid="' + uid + '">' + _alStatus + '<div class="w-alarm-list">' + _alRows + '</div></div>';
        } else {
          _alBody = '<div class="w-alarm-wrap" data-alarm-uid="' + uid + '">' + _alStatus + '<div class="w-alarm-list">' + _alRows + '</div></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          ${_alHead}
          ${_alBody}
          <div class="w-list"><button class="w-add-btn" data-alarm-add="${uid}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Alarm</button></div>
        </div>`;
      }
      case 'spotify':
        var _spActiveId = (typeof spActiveId !== 'undefined') ? spActiveId : null;
        var _spPlaylists = (typeof spPlaylists !== 'undefined') ? spPlaylists : [];
        if (typeof spCleanId === 'function' && _spActiveId) _spActiveId = spCleanId(_spActiveId);
        if (!_spActiveId && _spPlaylists.length === 0) {
          try { _spActiveId = localStorage.getItem('haven-spotify-active') || null; } catch(e) {}
          try { _spPlaylists = JSON.parse(localStorage.getItem('haven-spotify-playlists') || '[]'); } catch(e) {}
          if (!Array.isArray(_spPlaylists)) _spPlaylists = [];
          if (typeof spCleanId === 'function') {
            _spActiveId = spCleanId(_spActiveId);
            _spPlaylists = _spPlaylists.filter(function(p) { return p && spCleanId(p.id); });
            _spPlaylists.forEach(function(p) { p.id = spCleanId(p.id); });
          }
        }
        if (_spActiveId && _spPlaylists.length && !_spPlaylists.some(function(p) { return p.id === _spActiveId; })) _spActiveId = _spPlaylists[0].id;
        var _spActivePlaylist = (_spPlaylists || []).find(function(p) { return p.id === _spActiveId; });
        if (_spActivePlaylist) {
          var spotUrl = (typeof spEmbedUrl === 'function') ? spEmbedUrl(_spActivePlaylist) : ('https://open.spotify.com/embed/playlist/' + _spActivePlaylist.id);
          var _iframeSrc = e(spotUrl);
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:0;border:1px solid var(--border-color);overflow:hidden">
            ${editUI}
            <div class="spotify-widget">
              <div class="spotify-header">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:12px;height:12px;flex-shrink:0"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.2-1.26 9.6-.6 13.32 1.68.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>
                <span>${escapeHtml(_spActivePlaylist.name)}</span>
              </div>
              <iframe src="${_iframeSrc}" frameborder="0" allowtransparency="true" allow="encrypted-media; autoplay" referrerpolicy="no-referrer" style="display:block;width:100%;border:none"></iframe>
            </div>
          </div>`;
        } else {
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:var(--gutter);border:1px solid var(--border-color)">
            ${editUI}
            <div class="spotify-widget spotify-empty">
              <svg viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;opacity:0.25"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.3c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.48.66.3 1.02zm1.44-3.3c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.94-1.38-.48.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14 4.2-1.26 9.6-.6 13.32 1.68.36.18.54.78.24 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.72 1.62.54.3.72 1.02.42 1.56-.3.42-1.02.6-1.56.3z"/></svg>
              <span style="font-size:0.75rem">No playlist linked</span>
              <span class="spotify-hint">Add playlists via sidebar</span>
            </div>
          </div>`;
        }
      case 'strava':
        var _stravaId = null;
        try { _stravaId = localStorage.getItem('haven-strava-' + uid) || ''; } catch(e) {}
        if (_stravaId) {
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:0;border:1px solid var(--border-color);overflow:hidden">
            ${editUI}
            <div class="strava-widget">
              <iframe src="${e('https://www.strava.com/activities/' + _stravaId + '/embed/')}" frameborder="0" allowtransparency="true" loading="lazy" style="display:block;width:100%;height:100%;border:none"></iframe>
            </div>
          </div>`;
        } else {
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px dashed var(--border-color)">
            ${editUI}
            <div class="embed-empty" data-embed-type="strava" data-embed-uid="${uid}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;opacity:0.3"><path d="M15.5 2L21 12l-5.5 0L10 2z"/><path d="M10.5 12L6 2l-5.5 0L6 12z"/></svg>
              <span>Paste a Strava activity URL</span>
              <button class="embed-setup-btn" data-embed-setup="strava" data-embed-uid="${uid}">Configure</button>
            </div>
          </div>`;
        }
      case 'flightradar':
        var _fr24Coords = null;
        try { _fr24Coords = localStorage.getItem('haven-fr24-' + uid) || ''; } catch(e) {}
        if (_fr24Coords) {
          var parts = _fr24Coords.split(',');
          var fLat = parseFloat(parts[0]) || 51.5;
          var fLon = parseFloat(parts[1]) || -0.12;
          var mapId = 'fr24-map-' + uid;
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container-low);padding:0;border:1px solid var(--border-color);overflow:hidden">
            ${editUI}
            <div class="fr24-widget" id="${mapId}" data-fr24-lat="${fLat}" data-fr24-lon="${fLon}">
              <div class="fr24-status"><span class="fr24-status-dot"></span><span class="fr24-status-text">Connecting...</span></div>
            </div>
          </div>`;
        } else {
          return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px dashed var(--border-color)">
            ${editUI}
            <div class="embed-empty" data-embed-type="flightradar" data-embed-uid="${uid}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;opacity:0.3"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
              <span>Flight Tracker</span>
              <button class="embed-setup-btn" data-embed-setup="flightradar" data-embed-uid="${uid}">Set Location</button>
            </div>
          </div>`;
        }
      case 'sleep-score': {
        var _sleepLogs = []; try { _sleepLogs = JSON.parse(localStorage.getItem('haven-schedule-sleep') || '[]'); } catch(e) {}
        var _sleepTargets = {targetDuration:480}; try { _sleepTargets = JSON.parse(localStorage.getItem('haven-schedule-sleep-targets') || '{}'); } catch(e) {}
        var _weekLogs = _sleepWeekLogs();
        var _loggedWeek = _weekLogs.filter(function(w) { return w.log; });
        var _lastEntry = _loggedWeek.length ? _loggedWeek[_loggedWeek.length - 1].log : (_sleepLogs.length ? _sleepLogs[_sleepLogs.length - 1] : null);
        var _lastDur = _lastEntry ? (function(){ var b=_lastEntry.bedtime.split(':').map(Number), w=_lastEntry.wakeTime.split(':').map(Number); var bm=b[0]*60+b[1], wm=w[0]*60+w[1]; return wm <= bm ? wm+1440-bm : wm-bm; })() : 0;
        var _lastQual = _lastEntry ? _lastEntry.quality : 0;
        var _durArr = _loggedWeek.map(function(w) { var l=w.log; var b=l.bedtime.split(':').map(Number), w2=l.wakeTime.split(':').map(Number); var bm=b[0]*60+b[1], wm=w2[0]*60+w2[1]; return wm <= bm ? wm+1440-bm : wm-bm; });
        var _avgDur = _durArr.length ? Math.round(_durArr.reduce(function(s,d){ return s+d; },0) / _durArr.length) : 0;
        var _avgQual = _loggedWeek.length ? (_loggedWeek.reduce(function(s,w){return s+(w.log.quality||0);},0) / _loggedWeek.length).toFixed(1) : '—';
        var _target = _sleepTargets.targetDuration || 480;
        var _score = _sleepScoreCalc(_sleepLogs, _weekLogs, _target);
        var _consist = (typeof getSleepConsistencyScore === 'function') ? getSleepConsistencyScore(_sleepLogs) : null;
        var _consistTxt = _consist ? (_consist.score >= 80 ? 'very consistent' : _consist.score >= 60 ? 'good rhythm' : _consist.score >= 40 ? 'some variation' : 'irregular') : '';
        var _circ = 2 * Math.PI * 15.5;
        var _pct = _score != null ? _score : 0;
        var _offset = _circ - (_pct / 100) * _circ;
        var _durStr = _lastDur ? (_lastDur >= 60 ? Math.floor(_lastDur/60)+'h '+_lastDur%60+'m' : _lastDur+'m') : '—';
        var _scoreColor = _score == null ? 'var(--border-color)' : _score >= 80 ? '#10b981' : _score >= 60 ? '#3b82f6' : _score >= 40 ? '#f59e0b' : '#ef4444';
        var _scoreGlow = _score == null ? 'none' : _score >= 80 ? '0 0 12px #10b98166' : _score >= 60 ? '0 0 12px #3b82f666' : _score >= 40 ? '0 0 12px #f59e0b66' : '0 0 12px #ef444466';
        var _bars = _weekLogs.map(function(w) {
          var pct = w.log && w.log.duration ? Math.min(1, w.log.duration / (w.log.duration > 0 ? Math.max(_target, 1) : 480)) : 0;
          var fill = pct * 34;
          var cls = 'ss-bar' + (w.log && w.log.duration >= _target ? ' ss-bar-hit' : '') + (w.ds === formatDate(new Date()) ? ' ss-bar-today' : '');
          return '<div class="' + cls + '"><svg viewBox="0 0 6 36"><rect class="bg" x="0.5" y="1" width="5" height="34" rx="2.5"/><rect class="fill" x="0.5" y="' + (35 - fill) + '" width="5" height="' + fill + '" rx="2.5"/></svg><span>' + w.dow + '</span></div>';
        }).join('');
        var _ssStyle = _getSleepStyle(uid);
        var _ssRingHtml = '<div class="ss-ring"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15.5" fill="none" stroke="var(--border-color)" stroke-width="2.5"></circle><circle class="fill" cx="18" cy="18" r="15.5" fill="none" stroke="' + _scoreColor + '" stroke-width="2.5" stroke-dasharray="' + _circ + '" stroke-dashoffset="' + _offset + '" stroke-linecap="round" transform="rotate(-90 18 18)" style="filter:drop-shadow(' + _scoreGlow + ')"></circle></svg><div class="ss-ring-val">' + (_score != null ? _score : '—') + '</div></div>';
        var _ssBody = '';
        if (_ssStyle === 'minimal') {
          var _minPct = _lastDur ? Math.min(100, Math.round((_lastDur / _target) * 100)) : 0;
          _ssBody = '<div class="ss-minimal"><div class="ss-min-row">' + _ssRingHtml + '<div class="ss-min-info"><span class="ss-min-score">' + (_score != null ? _score : '—') + '</span><span class="ss-min-label">sleep score</span>' + (_consistTxt ? '<span class="ss-consist-pill">' + _consistTxt + '</span>' : '') + '</div></div><div class="ss-min-bar"><div class="ss-min-bar-fill" style="width:' + _minPct + '%;background:' + _scoreColor + '"></div></div><span class="ss-min-dur">' + _durStr + ' last night</span><button class="ss-log-btn" data-ss-log title="Log sleep">Log</button></div>';
        } else if (_ssStyle === 'detailed') {
          var _qualityStars = '';
          if (_lastQual) { for (var si = 0; si < 5; si++) _qualityStars += '<span class="ss-star' + (si < _lastQual ? ' ss-star-on' : '') + '">\u2605</span>'; }
          var _targetPct = _target > 0 ? Math.min(100, Math.round((_lastDur / _target) * 100)) : 0;
          _ssBody = '<div class="ss-detailed"><div class="ss-det-header">' + _ssRingHtml + '<div class="ss-det-meta"><span class="ss-det-title">Sleep Score</span><span class="ss-det-sub">' + (_score == null ? 'Log 3+ nights this week' : _durStr + ' last night') + (_consistTxt ? ' \u00B7 ' + _consistTxt : '') + '</span></div></div><div class="ss-det-stats"><div class="ss-det-stat"><span class="ss-det-stat-val" style="color:' + _scoreColor + '">' + (_avgDur >= 60 ? Math.floor(_avgDur/60)+'h '+_avgDur%60+'m' : _avgDur+'m') + '</span><span class="ss-det-stat-lbl">avg sleep</span></div><div class="ss-det-stat"><span class="ss-det-stat-val">' + _avgQual + '<span class="ss-det-stat-unit">/5</span></span><span class="ss-det-stat-lbl">quality</span></div><div class="ss-det-stat"><span class="ss-det-stat-val">' + _targetPct + '<span class="ss-det-stat-unit">%</span></span><span class="ss-det-stat-lbl">of target</span></div><div class="ss-det-stat"><span class="ss-det-stat-val">' + _loggedWeek.length + '<span class="ss-det-stat-unit">/7</span></span><span class="ss-det-stat-lbl">nights</span></div></div><div class="ss-det-week">' + _bars + '</div><button class="ss-log-btn ss-log-btn-full" data-ss-log title="Log sleep">Log Sleep</button></div>';
        } else if (_ssStyle === 'timeline') {
          var _timelineItems = _loggedWeek.slice(-7).map(function(w) {
            var l = w.log;
            var bParts = l.bedtime.split(':').map(Number);
            var wParts = l.wakeTime.split(':').map(Number);
            var bMin = bParts[0]*60+bParts[1];
            var wMin = wParts[0]*60+wParts[1];
            if (wMin <= bMin) wMin += 1440;
            var dur = wMin - bMin;
            var durStr = Math.floor(dur/60) + 'h' + (dur%60 > 0 ? ' ' + dur%60 + 'm' : '');
            var hitTarget = dur >= _target;
            return '<div class="ss-tl-item' + (hitTarget ? ' ss-tl-hit' : '') + '"><span class="ss-tl-day">' + w.dow + '</span><div class="ss-tl-bar-wrap"><div class="ss-tl-bar" style="width:' + Math.min(100, Math.round((dur / Math.max(_target, 1)) * 100)) + '%"></div></div><span class="ss-tl-dur">' + durStr + '</span></div>';
          }).join('');
          _ssBody = '<div class="ss-timeline"><div class="ss-tl-header">' + _ssRingHtml + '<div class="ss-tl-meta"><span class="ss-tl-score">' + (_score != null ? _score : '—') + '</span><span class="ss-tl-label">sleep score</span>' + (_consistTxt ? '<span class="ss-consist-pill">' + _consistTxt + '</span>' : '') + '</div></div><div class="ss-tl-list">' + (_timelineItems || '<span class="ss-tl-empty">No sleep logged yet</span>') + '</div><button class="ss-log-btn" data-ss-log title="Log sleep">Log</button></div>';
        } else {
          _ssBody = '<div class="ss-top">' + _ssRingHtml + '<div class="ss-top-meta"><span class="ss-ring-label">sleep score</span><span class="ss-score-note">' + (_score == null ? 'log 3+ nights this week' : (_durStr + ' last night')) + (_consistTxt ? ' \u00B7 ' + _consistTxt : '') + '</span></div></div><div class="ss-bars">' + _bars + '</div><div class="ss-foot"><span class="ss-foot-item"><b>' + (_avgDur >= 60 ? Math.floor(_avgDur/60)+'h '+_avgDur%60+'m' : _avgDur+'m') + '</b> avg</span><span class="ss-foot-item"><b>' + _avgQual + '</b> /5 quality</span><button class="ss-log-btn" data-ss-log title="Log sleep">Log</button></div>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI + '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg><span>Sleep</span></div><div class="ss-widget" data-ss-open="1" title="Log sleep">' + _ssBody + '</div></div>';
      }
      case 'headlines': {
        const hlSource = _getHeadlineSource();
        const hlItems = _hlCache && _hlCache.source === hlSource ? _hlCache.items : null;
        const hlStyle = _getHeadlinesStyle(uid);
        const hlList = hlItems ? hlItems.slice(0, hlStyle === 'compact' ? 6 : 5).map(function(hl, i) {
          return '<a class="hl-item" href="' + escapeHtml(_hlSafeLink(hl.link, hlSource)) + '" target="_blank" rel="noopener"><span class="hl-item-title">' + escapeHtml(hl.title) + '</span>' + (hlStyle === 'full' ? '<span class="hl-item-src">' + _hlSourceName(hlSource) + '</span>' : '') + '</a>';
        }).join('') : '';
        var _hlRefreshBtn = '<button class="weather-refresh" data-headlines-refresh title="Refresh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>';
        var _hlStamp = _hlFresh() ? '<span class="hl-stamp">' + new Date(_hlCache.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) + '</span>' : '';
        var _hlBody = '';
        if (hlStyle === 'compact') {
          _hlBody = hlList ? '<div class="hl-compact">' + hlList + '</div>' + _hlRefreshBtn : '<div class="hl-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Fetching...</span></div>';
        } else if (hlStyle === 'full') {
          _hlBody = hlList ? '<div class="hl-source-line"><span class="hl-source-name">' + _hlSourceName(hlSource) + '</span>' + _hlStamp + _hlRefreshBtn + '</div><div class="hl-list hl-list-full">' + hlList + '</div>' : '<div class="hl-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Fetching headlines...</span></div>';
        } else {
          _hlBody = hlList ? '<div class="hl-source-line"><span class="hl-source-name">' + _hlSourceName(hlSource) + '</span>' + _hlStamp + _hlRefreshBtn + '</div><div class="hl-list">' + hlList + '</div>' : '<div class="hl-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Fetching headlines...</span></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg><span>Headlines</span></div>
          <div class="headlines-widget" data-headlines-uid="${uid}">${_hlBody}</div>
        </div>`;
      }
      case 'water': {
        var _wd = hubContent.water || { goal:8, logged:0, date:'' };
        var _today = new Date().toISOString().slice(0,10);
        if (_wd.date !== _today) { _wd.logged = 0; _wd.date = _today; hubContent.water = _wd; }
        var _pct = Math.min(100, Math.round((_wd.logged / _wd.goal) * 100));
        var _waterStyle = _getWaterStyle(uid);
        var _wGlasses = '';
        var _wBody = '';
        if (_waterStyle === 'minimal') {
          _wBody = '<div class="w-water-minimal"><div class="w-water-minimal-row"><span class="w-water-count-big">' + _wd.logged + '</span><span class="w-water-count-of">/ ' + _wd.goal + '</span></div><div class="w-water-bar"><div class="w-water-fill" style="width:' + _pct + '%"></div></div>' + (_pct >= 100 ? '<span class="w-water-goal-hit">Goal reached!</span>' : '') + '</div>';
        } else {
          var _glasses = [];
          for (var i = 0; i < _wd.goal; i++) {
            var _filled = i < _wd.logged;
            _glasses.push('<div class="w-water-glass' + (_filled ? ' filled' : '') + '" data-water-toggle="' + i + '"><svg viewBox="0 0 24 24" fill="' + (_filled ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg></div>');
          }
          if (_waterStyle === 'detailed') {
            _wBody = '<div class="w-water-grid">' + _glasses.join('') + '</div><div class="w-water-bar"><div class="w-water-fill" style="width:' + _pct + '%"></div></div><div class="w-water-detail"><span>' + _wd.logged + ' / ' + _wd.goal + ' glasses</span><span>' + _pct + '%</span></div>' + (_pct >= 100 ? '<span class="w-water-goal-hit">Goal reached!</span>' : '');
          } else {
            _wBody = '<div class="w-water-grid">' + _glasses.join('') + '</div><div class="w-water-bar"><div class="w-water-fill" style="width:' + _pct + '%"></div></div><div class="w-water-count">' + _wd.logged + ' / ' + _wd.goal + ' glasses' + (_pct >= 100 ? ' — Goal reached!' : '') + '</div>';
          }
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg><span>Water</span></div>
          ${_wBody}
        </div>`;
      }
      case 'mood': {
        var _moods = ['&#x1F621;','&#x1F61E;','&#x1F610;','&#x1F60A;','&#x1F60D;'];
        var _moodLabels = ['Angry','Sad','Meh','Good','Great'];
        var _md = hubContent.mood || { today:null, history:{} };
        var _mToday = new Date().toISOString().slice(0,10);
        var _selected = _md.history?.[_mToday]?.mood ?? null;
        var _note = _md.history?.[_mToday]?.note || '';
        var _mBtns = _moods.map(function(em, idx) {
          return '<div class="w-mood-btn' + (_selected === idx ? ' selected' : '') + '" data-mood-pick="' + idx + '" title="' + _moodLabels[idx] + '">' + em + '</div>';
        }).join('');
        var _recent = Object.keys(_md.history || {}).slice(-5).reverse().map(function(dk) {
          var v = _md.history[dk];
          var mood = v?.mood ?? v;
          var note = v?.note || '';
          return '<div class="w-mood-day"><span class="w-mood-day-label">' + dk.slice(5) + '</span><span>' + (mood != null ? _moods[mood] : '—') + '</span>' + (note ? '<span class="w-mood-note-preview" title="' + e(note) + '">' + e(note.slice(0,12)) + '</span>' : '') + '</div>';
        }).join('');
        var _moodStyle = _getMoodStyle(uid);
        var _moodBody = '';
        if (_moodStyle === 'minimal') {
          _moodBody = '<div class="w-mood-row">' + _mBtns + '</div>';
        } else if (_moodStyle === 'chart') {
          var _chartBars = Object.keys(_md.history || {}).slice(-7).map(function(dk) {
            var v = _md.history[dk];
            var mood = v?.mood ?? v;
            var h = mood != null ? ((mood + 1) / 5) * 100 : 0;
            return '<div class="w-mood-chart-bar" style="height:' + Math.max(4, h) + '%"><span class="w-mood-chart-label">' + dk.slice(5, 7) + '/' + dk.slice(8, 10) + '</span></div>';
          }).join('');
          _moodBody = '<div class="w-mood-row">' + _mBtns + '</div><div class="w-mood-chart">' + _chartBars + '</div>';
        } else {
          _moodBody = '<div class="w-mood-row">' + _mBtns + '</div><input class="w-mood-note" data-mood-note placeholder="How are you feeling?" value="' + e(_note) + '"><div class="w-mood-history">' + (_recent || '<span style="color:var(--text-tertiary);font-size:0.65rem">No entries yet</span>') + '</div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg><span>Mood</span></div>
          ${_moodBody}
        </div>`;
      }
      case 'countdown': {
        var _cds = hubContent.countdown || [];
        var _cdStyle = _getCdStyle(uid);
        var _cdItems = _cds.map(function(c, i) {
          var _target = new Date(c.date + 'T00:00:00');
          var _now = new Date();
          var _diff = Math.ceil((_target - _now) / (1000*60*60*24));
          var _cls = _diff <= 0 ? ' passed' : _diff <= 7 ? ' soon' : '';
          var _labelHtml = isEdit
            ? '<input class="w-cd-label-input" data-cd-label="' + i + '" value="' + e(c.label) + '" placeholder="Event name">'
            : '<span class="w-cd-label">' + e(c.label) + '</span>';
          var _dateHtml = isEdit
            ? '<input type="date" class="w-cd-date-input" data-cd-date="' + i + '" value="' + e(c.date) + '">'
            : '<span class="w-cd-days">' + (_diff <= 0 ? 'Today!' : _diff + ' days') + '</span>';
          return '<div class="w-cd-item' + _cls + '">' + _labelHtml + _dateHtml + (isEdit ? '<button class="hub-edit-item-btn del" data-del="countdown" data-idx="' + i + '">\u00D7</button>' : '') + '</div>';
        }).join('');
        var _cdBody = '';
        if (_cdStyle === 'cards') {
          _cdBody = '<div class="w-cd-cards">' + _cds.map(function(c, i) {
            var _target = new Date(c.date + 'T00:00:00');
            var _diff = Math.ceil((_target - new Date()) / (1000*60*60*24));
            var _cls = _diff <= 0 ? ' w-cd-card-passed' : _diff <= 7 ? ' w-cd-card-soon' : '';
            return '<div class="w-cd-card' + _cls + '"><span class="w-cd-card-num">' + (_diff <= 0 ? '0' : _diff) + '</span><span class="w-cd-card-label">' + e(c.label) + '</span></div>';
          }).join('') + '</div>';
        } else if (_cdStyle === 'minimal') {
          _cdBody = '<div class="w-list w-list-compact">' + _cds.map(function(c, i) {
            var _target = new Date(c.date + 'T00:00:00');
            var _diff = Math.ceil((_target - new Date()) / (1000*60*60*24));
            var _cls = _diff <= 0 ? ' w-item-done' : '';
            return '<div class="w-item w-item-compact' + _cls + '"><span class="w-cd-mini-label">' + e(c.label) + '</span><span class="w-cd-mini-days">' + (_diff <= 0 ? 'Today' : _diff + 'd') + '</span></div>';
          }).join('') + '</div>';
        } else {
          _cdBody = '<div class="w-list">' + (_cdItems || '<div style="color:var(--text-tertiary);font-size:0.65rem;text-align:center;padding:8px 0">No events yet</div>') + '</div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 10"/></svg><span>Countdown</span></div>
          ${_cdBody}
          <button class="w-add-btn" data-add="countdown"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add event</button>
        </div>`;
      }
      case 'upcoming': {
        var _upCfg = hubContent.upcoming || { days: 14 };
        var _upDays = parseInt(_upCfg.days, 10) || 14;
        var _upAll = _upcomingData(_upDays);
        var _upShown = _upAll.slice(0, 8);
        var _upStyle = _getUpcomingStyle(uid);
        var _upRowHtml = function(t, compact) {
          var _tc = (typeof TAG_COLORS !== 'undefined' && TAG_COLORS[t.tag]) ? TAG_COLORS[t.tag].text : 'var(--text-tertiary)';
          var _tt = t.startTime || '';
          return '<div class="w-upcoming-row' + (compact ? ' w-upcoming-compact' : '') + '">' +
            '<span class="w-upcoming-day">' + e(_upcomingDayLabel(t.date)) + '</span>' +
            '<div class="w-upcoming-main"><span class="w-upcoming-dot" style="background:' + e(_tc) + '"></span>' +
              '<span class="w-upcoming-title">' + e(t.title || 'Untitled') + '</span>' +
              (_tt ? '<span class="w-upcoming-time">' + e(_tt) + '</span>' : '') +
            '</div></div>';
        };
        var _upBody = '';
        if (!_upShown.length) {
          _upBody = '<div class="w-upcoming-empty">Nothing upcoming' + (isEdit ? '' : ' in the next ' + _upDays + ' days') + '</div>';
        } else if (_upStyle === 'compact') {
          _upBody = '<div class="w-upcoming-list w-upcoming-list-compact">' + _upShown.map(function(t) { return _upRowHtml(t, true); }).join('') + '</div>';
        } else if (_upStyle === 'agenda') {
          var _upGroups = [];
          _upShown.forEach(function(t) {
            var g = _upGroups[_upGroups.length - 1];
            if (!g || g.date !== t.date) { g = { date: t.date, items: [] }; _upGroups.push(g); }
            g.items.push(t);
          });
          _upBody = '<div class="w-upcoming-agenda">' + _upGroups.map(function(g) {
            return '<div class="w-upcoming-group"><span class="w-upcoming-group-head">' + e(_upcomingDayLabel(g.date)) + '</span><div class="w-upcoming-group-items">' + g.items.map(function(t) { return _upRowHtml(t, true); }).join('') + '</div></div>';
          }).join('') + '</div>';
        } else {
          _upBody = '<div class="w-upcoming-list">' + _upShown.map(function(t) { return _upRowHtml(t, false); }).join('') + '</div>';
        }
        var _upHorizonCtl = isEdit ? '<div class="w-upcoming-horizon"><span class="w-upcoming-horizon-label">Show</span>' + [7,14,30,90].map(function(d) {
          return '<button class="w-upcoming-hz-btn' + (d === _upDays ? ' active' : '') + '" data-upcoming-days="' + d + '">' + d + 'd</button>';
        }).join('') + '</div>' : '';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M12 14v3l2 1"/></svg><span>Upcoming</span><span class="w-upcoming-count">' + _upAll.length + '</span></div>' +
          '<div class="w-upcoming-wrap">' + _upHorizonCtl + _upBody + '</div>' +
        '</div>';
      }
      case 'streak': {
        var _stk = _streakData();
        var _stkStyle = _getStreakStyle(uid);
        var _stkFlame = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>';
        var _stkStrip = [];
        var _stkWeeks = 12;
        var _stkPadStart = new Date();
        _stkPadStart.setDate(_stkPadStart.getDate() - (_stkWeeks * 7 - 1));
        for (var _stkSi = 0; _stkSi < _stkWeeks * 7; _stkSi++) {
          var _stkD = new Date(_stkPadStart); _stkD.setDate(_stkPadStart.getDate() + _stkSi);
          var _stkK = formatDate(_stkD);
          var _stkC = _stk.days[_stkK] || 0;
          var _stkLvl = _stkC === 0 ? 0 : _stkC <= 1 ? 1 : _stkC <= 3 ? 2 : _stkC <= 5 ? 3 : 4;
          _stkStrip.push('<span class="w-stk-cell lvl' + _stkLvl + '" title="' + e(_stkK + ' · ' + _stkC + ' completed') + '"></span>');
        }
        var _stkLast14 = [];
        for (var _stkS2 = 13; _stkS2 >= 0; _stkS2--) {
          var _stkD2 = new Date(); _stkD2.setDate(_stkD2.getDate() - _stkS2);
          var _stkK2 = formatDate(_stkD2);
          var _stkHas = (_stk.days[_stkK2] || 0) > 0;
          _stkLast14.push('<span class="w-stk-day' + (_stkHas ? ' done' : '') + (_stkS2 === 0 ? ' today' : '') + '" title="' + e(_stkK2) + '"></span>');
        }
        var _stkBody = '';
        if (_stkStyle === 'compact') {
          _stkBody = '<div class="w-stk-compact">' + _stkFlame + '<span class="w-stk-compact-num">' + _stk.current + '</span><span class="w-stk-compact-lbl">day streak</span><span class="w-stk-compact-sep"></span><span class="w-stk-compact-best">best ' + _stk.best + '</span></div>';
        } else if (_stkStyle === 'heatmap') {
          _stkBody = '<div class="w-stk-heat-top"><span class="w-stk-heat-num">' + _stk.current + '</span><span class="w-stk-heat-lbl">day streak</span></div><div class="w-stk-heat">' + _stkStrip.join('') + '</div><div class="w-stk-heat-foot"><span>' + _stk.total + ' total</span><span>best ' + _stk.best + '</span></div>';
        } else {
          _stkBody = '<div class="w-stk-hero"><div class="w-stk-hero-num">' + _stk.current + '</div><div class="w-stk-hero-meta"><span class="w-stk-hero-lbl">day streak</span><span class="w-stk-hero-sub">' + (_stk.current > 0 ? 'Keep it going' : 'Complete a task to start') + '</span></div></div><div class="w-stk-days">' + _stkLast14.join('') + '</div><div class="w-stk-stats"><div class="w-stk-stat"><span class="w-stk-stat-val">' + _stk.best + '</span><span class="w-stk-stat-lbl">best</span></div><div class="w-stk-stat"><span class="w-stk-stat-val">' + _stk.total + '</span><span class="w-stk-stat-lbl">completed</span></div></div>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg><span>Streak</span></div>' +
          _stkBody +
        '</div>';
      }
      case 'budget': {
        var _bg = _budgetData();
        var _bgStyle = _getBudgetStyle(uid);
        var _bgMoney = function(n) { var v = Math.abs(n); var s = v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : (v % 1 === 0 ? String(v) : v.toFixed(2)); return (n < 0 ? '-$' : '$') + s; };
        var _bgColor = _bg.monthly <= 0 ? 'var(--text-tertiary)' : _bg.pct >= 100 ? '#ef4444' : _bg.pct >= 80 ? '#f59e0b' : '#10b981';
        var _bgArc = 2 * Math.PI * 15.5;
        var _bgRing = '<div class="w-bg-ring"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15.5" fill="none" stroke="var(--border-color)" stroke-width="2.5"></circle><circle class="fill" cx="18" cy="18" r="15.5" fill="none" stroke="' + _bgColor + '" stroke-width="2.5" stroke-dasharray="' + _bgArc + '" stroke-dashoffset="' + (_bgArc - (Math.min(100, _bg.pct) / 100) * _bgArc) + '" stroke-linecap="round" transform="rotate(-90 18 18)"></circle></svg><div class="w-bg-ring-val">' + (_bg.monthly > 0 ? _bg.pct + '%' : '—') + '</div></div>';
        var _bgBody = '';
        if (_bg.monthly <= 0) {
          _bgBody = '<div class="w-bg-empty">' + (isEdit ? 'Set a monthly budget below' : 'Set a monthly budget') + '</div>';
        } else if (_bgStyle === 'breakdown') {
          var _bgCats = Object.keys(_bg.cats).map(function(k) { return { name: k, val: _bg.cats[k] }; }).sort(function(a, b) { return b.val - a.val; }).slice(0, 5);
          var _bgMax = Math.max.apply(null, _bgCats.map(function(c) { return c.val; }).concat([1]));
          var _bgCatHtml = _bgCats.map(function(c) {
            var w = Math.max(5, Math.round((c.val / _bgMax) * 100));
            var share = _bg.spend > 0 ? Math.round((c.val / _bg.spend) * 100) : 0;
            return '<div class="w-bg-cat"><span class="w-bg-cat-name">' + e(c.name) + '</span><span class="w-bg-cat-amt">' + _bgMoney(c.val) + '</span><div class="w-bg-cat-track"><div class="w-bg-cat-fill" style="width:' + w + '%"></div></div><span class="w-bg-cat-pct">' + share + '%</span></div>';
          }).join('');
          _bgBody = '<div class="w-bg-head"><span class="w-bg-spent">' + _bgMoney(_bg.spend) + '</span><span class="w-bg-of">of ' + _bgMoney(_bg.monthly) + '</span></div><div class="w-bg-track"><div class="w-bg-fill" style="width:' + Math.min(100, _bg.pct) + '%;background:' + _bgColor + '"></div></div><div class="w-bg-cats">' + (_bgCatHtml || '<span class="w-bg-empty">No spending this month</span>') + '</div>';
        } else if (_bgStyle === 'minimal') {
          _bgBody = '<div class="w-bg-min"><div class="w-bg-min-row"><span class="w-bg-min-left">' + _bgMoney(_bg.remaining) + '</span><span class="w-bg-min-lbl">left</span></div><div class="w-bg-track"><div class="w-bg-fill" style="width:' + Math.min(100, _bg.pct) + '%;background:' + _bgColor + '"></div></div><span class="w-bg-min-sub">' + _bgMoney(_bg.spend) + ' of ' + _bgMoney(_bg.monthly) + '</span></div>';
        } else {
          _bgBody = '<div class="w-bg-hero">' + _bgRing + '<div class="w-bg-hero-meta"><span class="w-bg-hero-spent">' + _bgMoney(_bg.spend) + '</span><span class="w-bg-hero-lbl">spent this month</span></div></div><div class="w-bg-stats"><div class="w-bg-stat"><span class="w-bg-stat-val" style="color:' + _bgColor + '">' + _bgMoney(_bg.remaining) + '</span><span class="w-bg-stat-lbl">remaining</span></div><div class="w-bg-stat"><span class="w-bg-stat-val">' + _bgMoney(_bg.monthly) + '</span><span class="w-bg-stat-lbl">budget</span></div><div class="w-bg-stat"><span class="w-bg-stat-val">' + _bg.daysLeft + '</span><span class="w-bg-stat-lbl">days left</span></div></div>';
        }
        var _bgCtl = isEdit ? '<div class="w-bg-setting"><span class="w-bg-setting-lbl">Monthly budget</span><input type="number" min="0" step="50" class="w-bg-input" data-budget-input value="' + (_bg.monthly || 0) + '"></div>' : '';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4z"/></svg><span>Budget</span></div>' +
          _bgBody + _bgCtl +
        '</div>';
      }
      case 'airquality': {
        var _aqStyle = _getAqStyle(uid);
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1111 8H2"/><path d="M12.59 19.41A2 2 0 1014 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1119.5 12H2"/></svg><span>Air Quality</span></div>' +
          '<div class="aq-widget" data-aq-uid="' + uid + '" data-aq-style="' + _aqStyle + '"><div class="aq-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Loading air quality...</span></div></div>' +
        '</div>';
      }
      case 'worldclock': {
        var _wcList = Array.isArray(hubContent.worldClock) ? hubContent.worldClock : [];
        var _wcStyle = _getWcStyle(uid);
        var _wcRow = function(tz, i) {
          var c = _wclCity(tz);
          var off = _wclOffset(tz);
          var offStr = off === 0 ? '' : (off > 0 ? '+' + off + 'd' : off + 'd');
          var parts = _wclParts(tz);
          var dateStr = parts ? (parts.weekday + ' ' + parts.day + ' ' + parts.month) : '';
          var del = isEdit ? '<button class="hub-edit-item-btn del" data-wc-del="' + i + '">\u00D7</button>' : '';
          return '<div class="w-wc-row" data-wc-tz="' + e(tz) + '"><div class="w-wc-info"><span class="w-wc-label">' + e(c.label) + '</span><span class="w-wc-date">' + e(dateStr) + '</span></div><span class="w-wc-time" data-wc-time="' + e(tz) + '">' + _wclTime(tz) + '</span>' + (offStr ? '<span class="w-wc-off">' + offStr + '</span>' : '') + del + '</div>';
        };
        var _wcBody = '';
        if (!_wcList.length) {
          _wcBody = '<div class="w-wc-empty">No cities added</div>';
        } else if (_wcStyle === 'cards') {
          _wcBody = '<div class="w-wc-cards">' + _wcList.map(function(tz, i) {
            var c = _wclCity(tz);
            var off = _wclOffset(tz);
            var offStr = off === 0 ? '' : (off > 0 ? '+' + off + 'd' : off + 'd');
            return '<div class="w-wc-card" data-wc-tz="' + e(tz) + '"><span class="w-wc-card-label">' + e(c.label) + '</span><span class="w-wc-card-time" data-wc-time="' + e(tz) + '">' + _wclTime(tz) + '</span>' + (offStr ? '<span class="w-wc-card-off">' + offStr + '</span>' : '') + (isEdit ? '<button class="hub-edit-item-btn del" data-wc-del="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '</div>';
        } else if (_wcStyle === 'minimal') {
          _wcBody = '<div class="w-wc-min">' + _wcList.map(function(tz, i) {
            var c = _wclCity(tz);
            return '<div class="w-wc-min-row" data-wc-tz="' + e(tz) + '"><span class="w-wc-min-label">' + e(c.label) + '</span><span class="w-wc-time" data-wc-time="' + e(tz) + '">' + _wclTime(tz) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-wc-del="' + i + '">\u00D7</button>' : '') + '</div>';
          }).join('') + '</div>';
        } else {
          _wcBody = '<div class="w-wc-list">' + _wcList.map(function(tz, i) { return _wcRow(tz, i); }).join('') + '</div>';
        }
        var _wcAdd = '';
        if (isEdit) {
          var _wcAvail = _WCL_CITIES.filter(function(c) { return _wcList.indexOf(c.tz) === -1; });
          _wcAdd = '<div class="w-wc-add"><select class="w-wc-add-select" data-wc-add-select>' + _wcAvail.map(function(c) { return '<option value="' + e(c.tz) + '">' + e(c.label) + '</option>'; }).join('') + '</select><button class="w-add-btn" data-wc-add-btn><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add</button></div>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>World Clock</span></div>' +
          '<div class="w-wc-wrap">' + _wcBody + _wcAdd + '</div>' +
        '</div>';
      }
      case 'savings': {
        var _sv = _savingsData();
        var _svStyle = _getSavingsStyle(uid);
        var _svArc = 2 * Math.PI * 15.5;
        var _svColor = _sv.pct >= 100 ? '#10b981' : 'var(--accent)';
        var _svMoney = function(n) { var v = Math.abs(n); var s = v >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : (v % 1 === 0 ? String(v) : v.toFixed(2)); return (n < 0 ? '-$' : '$') + s; };
        var _svRing = '<div class="w-sv-ring"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15.5" fill="none" stroke="var(--border-color)" stroke-width="2.5"></circle><circle class="fill" cx="18" cy="18" r="15.5" fill="none" stroke="' + _svColor + '" stroke-width="2.5" stroke-dasharray="' + _svArc + '" stroke-dashoffset="' + (_svArc - (_sv.pct / 100) * _svArc) + '" stroke-linecap="round" transform="rotate(-90 18 18)"></circle></svg><div class="w-sv-ring-val">' + _sv.pct + '%</div></div>';
        var _svBody = '';
        if (_svStyle === 'bar') {
          _svBody = '<div class="w-sv-bar-name">' + e(_sv.name) + '</div><div class="w-sv-bar-row"><span class="w-sv-bar-saved">' + _svMoney(_sv.saved) + '</span><span class="w-sv-bar-unit">of ' + _svMoney(_sv.target) + '</span></div><div class="w-bg-track"><div class="w-bg-fill" style="width:' + _sv.pct + '%;background:' + _svColor + '"></div></div><div class="w-sv-bar-foot"><span>' + _sv.pct + '% saved</span><span>' + _svMoney(_sv.remaining) + ' to go</span></div>';
        } else if (_svStyle === 'minimal') {
          _svBody = '<div class="w-sv-min"><div class="w-sv-min-row"><span class="w-sv-min-val">' + _svMoney(_sv.saved) + '</span><span class="w-sv-min-of">/ ' + _svMoney(_sv.target) + '</span></div><div class="w-bg-track"><div class="w-bg-fill" style="width:' + _sv.pct + '%;background:' + _svColor + '"></div></div><span class="w-sv-min-sub">' + e(_sv.name) + ' · ' + _sv.pct + '%</span></div>';
        } else {
          _svBody = '<div class="w-sv-hero">' + _svRing + '<div class="w-sv-hero-meta"><span class="w-sv-hero-saved">' + _svMoney(_sv.saved) + '</span><span class="w-sv-hero-lbl">of ' + _svMoney(_sv.target) + '</span><span class="w-sv-hero-name">' + e(_sv.name) + '</span></div></div><div class="w-bg-stats"><div class="w-bg-stat"><span class="w-bg-stat-val">' + _svMoney(_sv.remaining) + '</span><span class="w-bg-stat-lbl">to go</span></div><div class="w-bg-stat"><span class="w-bg-stat-val">' + _sv.pct + '%</span><span class="w-bg-stat-lbl">saved</span></div></div>';
        }
        var _svCtl = isEdit ? '<div class="w-sv-setting"><input class="w-sv-input w-sv-input-name" data-savings-name value="' + e(_sv.name) + '" placeholder="Goal name" maxlength="40"><div class="w-sv-setting-row"><input type="number" min="0" step="100" class="w-sv-input" data-savings-target value="' + _sv.target + '" placeholder="Target"><input type="number" min="0" step="50" class="w-sv-input" data-savings-saved value="' + _sv.saved + '" placeholder="Saved"></div></div>' : '';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg><span>Savings Goal</span></div>' +
          _svBody + _svCtl +
        '</div>';
      }
      case 'focuslog': {
        var _fo = _focusData();
        var _foStyle = _getFocusStyle(uid);
        var _foMin = _focusCfg().sessionMinutes;
        var _foFmt = function(m) { m = m || 0; return m >= 60 ? (Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + (m % 60) + 'm' : '')) : (m + 'm'); };
        var _foMax = Math.max.apply(null, _fo.days.map(function(d) { return d.minutes; }).concat([1]));
        var _foBars = _fo.days.map(function(d, i) {
          var h = d.minutes > 0 ? Math.max(6, Math.round((d.minutes / _foMax) * 100)) : 2;
          var today = i === _fo.days.length - 1;
          return '<div class="w-fo-bar-col' + (today ? ' today' : '') + '" title="' + d.minutes + ' min"><div class="w-fo-bar-track"><div class="w-fo-bar" style="height:' + h + '%"></div></div><span class="w-fo-bar-lbl">' + d.dow + '</span></div>';
        }).join('');
        var _foSess = _fo.today.sessions || 0;
        var _foBody = '';
        if (_foStyle === 'compact') {
          _foBody = '<div class="w-fo-compact"><span class="w-fo-compact-time">' + _foFmt(_fo.today.minutes) + '</span><span class="w-fo-compact-lbl">focused today</span><span class="w-fo-compact-sessions">' + _foSess + ' session' + (_foSess === 1 ? '' : 's') + '</span></div>';
        } else if (_foStyle === 'bars') {
          _foBody = '<div class="w-fo-days">' + _foBars + '</div><div class="w-fo-foot"><span>' + _foFmt(_fo.weekMinutes) + ' this week</span><span>' + _foSess + ' today</span></div>';
        } else {
          _foBody = '<div class="w-fo-hero"><span class="w-fo-hero-time">' + _foFmt(_fo.today.minutes) + '</span><span class="w-fo-hero-lbl">focused today</span></div><div class="w-fo-days">' + _foBars + '</div><div class="w-fo-foot"><span>' + _foSess + ' session' + (_foSess === 1 ? '' : 's') + '</span><span>' + _foFmt(_fo.weekMinutes) + ' this week</span></div>';
        }
        var _foCtl = '<div class="w-fo-ctl">' +
          (isEdit ? '<input type="number" min="1" max="240" class="w-fo-min" data-focus-minutes value="' + _foMin + '"><span class="w-fo-min-lbl">min</span>' : '') +
          '<button class="w-add-btn" data-focus-add="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Log session</button>' +
          (isEdit ? '<button class="w-fo-reset" data-focus-reset="' + uid + '" title="Clear today">Reset</button>' : '') +
        '</div>';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><span>Focus Log</span></div>' +
          _foBody + _foCtl +
        '</div>';
      }
      case 'currency': {
        var _curCfg = hubContent.currency || { from: 'USD', to: 'EUR', amount: 1 };
        var _curStyle = _getCurrencyStyle(uid);
        var _curOpts = function(sel) { return _CURRENCIES.map(function(c) { return '<option value="' + c + '"' + (c === sel ? ' selected' : '') + '>' + c + '</option>'; }).join(''); };
        var _curBody = '';
        if (_curStyle === 'minimal') {
          _curBody = '<div class="cur-row cur-row-min"><input type="number" class="cur-amount" data-cur-amount="' + uid + '" value="' + _curCfg.amount + '"><select class="cur-select" data-cur-from="' + uid + '">' + _curOpts(_curCfg.from) + '</select><span class="cur-arrow">→</span><select class="cur-select" data-cur-to="' + uid + '">' + _curOpts(_curCfg.to) + '</select></div><div class="cur-result cur-result-min" data-cur-result="' + uid + '">…</div>';
        } else if (_curStyle === 'rates') {
          _curBody = '<div class="cur-row"><input type="number" class="cur-amount" data-cur-amount="' + uid + '" value="' + _curCfg.amount + '"><select class="cur-select" data-cur-from="' + uid + '">' + _curOpts(_curCfg.from) + '</select></div><div class="cur-rates" data-cur-rates="' + uid + '"><span class="cur-loading">Loading rates...</span></div>';
        } else {
          _curBody = '<div class="cur-row"><input type="number" class="cur-amount" data-cur-amount="' + uid + '" value="' + _curCfg.amount + '"><select class="cur-select" data-cur-from="' + uid + '">' + _curOpts(_curCfg.from) + '</select></div><div class="cur-row"><button class="cur-swap" data-cur-swap="' + uid + '" title="Swap currencies"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg></button><select class="cur-select" data-cur-to="' + uid + '">' + _curOpts(_curCfg.to) + '</select><span class="cur-result" data-cur-result="' + uid + '">…</span></div>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="12" y1="2" x2="12" y2="6"/></svg><span>Currency</span></div>' +
          '<div class="cur-widget" data-cur-uid="' + uid + '" data-cur-style="' + _curStyle + '">' + _curBody + '</div>' +
        '</div>';
      }
      case 'calculator': {
        var _cs = _calcState(uid);
        var _calcStyle = _getCalcStyle(uid);
        var _calcKeys = [
          { k: 'C', cls: 'fn' }, { k: '(', cls: 'fn' }, { k: ')', cls: 'fn' }, { k: '\u2190', cls: 'fn' },
          { k: '7' }, { k: '8' }, { k: '9' }, { k: '\u00F7', cls: 'op' },
          { k: '4' }, { k: '5' }, { k: '6' }, { k: '\u00D7', cls: 'op' },
          { k: '1' }, { k: '2' }, { k: '3' }, { k: '\u2212', cls: 'op' },
          { k: '0' }, { k: '.' }, { k: '\u221A', cls: 'fn' }, { k: '+', cls: 'op' },
          { k: '%', cls: 'fn' }, { k: '=', cls: 'eq' }
        ];
        var _calcPad = _calcKeys.map(function(k) {
          return '<button class="w-calc-key ' + (k.cls || '') + '" data-calc-key="' + e(k.k) + '" data-calc-uid="' + uid + '">' + e(k.k) + '</button>';
        }).join('');
        var _calcHist = '';
        if (_calcStyle === 'history') {
          _calcHist = '<div class="w-calc-hist">' + ((_cs.hist || []).slice(0, 5).map(function(h) {
            return '<button class="w-calc-hist-item" data-calc-hist="' + uid + '" data-calc-hist-expr="' + e(h.expr) + '"><span class="w-calc-hist-expr">' + e(h.expr) + '</span><span class="w-calc-hist-res">= ' + e(h.result) + '</span></button>';
          }).join('') || '<span class="w-calc-hist-empty">No history yet</span>') + '</div>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-calc w-calc-' + _calcStyle + '" data-calc-uid="' + uid + '">' +
            '<div class="w-calc-screen"><span class="w-calc-expr">' + e(_cs.expr || '0') + '</span><span class="w-calc-result">' + (_cs.result ? e('= ' + _cs.result) : '') + '</span></div>' +
            '<div class="w-calc-pad">' + _calcPad + '</div>' +
            _calcHist +
          '</div>' +
        '</div>';
      }
      case 'breathing': {
        var _brCfg = _breathCfg();
        var _brStyle = _getBreathStyle(uid);
        var _brPhases = _breathPattern(_brCfg.pattern);
        var _brTotal = _brPhases.reduce(function(s, x) { return s + x.sec; }, 0);
        var _brOpts = _BREATH_PATTERNS.map(function(p) { return '<option value="' + p.id + '"' + (p.id === _brCfg.pattern ? ' selected' : '') + '>' + e(p.name) + '</option>'; }).join('');
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.081 20c-.669-.88-.981-2.159-.981-3.5 0-3.5 2-9.5 2-9.5s2 6 2 9.5c0 1.341-.312 2.62-.981 3.5"/><path d="M17.919 20c.669-.88.981-2.159.981-3.5 0-3.5-2-9.5-2-9.5s-2 6-2 9.5c0 1.341.312 2.62.981 3.5"/><path d="M12 2v18"/></svg><span>Breathing</span></div>' +
          '<div class="w-breath w-breath-' + _brStyle + '" data-breath-uid="' + uid + '">' +
            '<div class="w-breath-stage"><div class="w-breath-ring"></div><div class="w-breath-circle"></div><div class="w-breath-center"><span class="w-breath-phase">Ready</span><span class="w-breath-count"></span></div></div>' +
            '<div class="w-breath-actions"><button class="w-breath-toggle" data-breath-toggle="' + uid + '">Start</button>' +
              '<button class="w-breath-reset" data-breath-reset="' + uid + '">Reset</button>' +
              (isEdit ? '<select class="w-breath-select" data-breath-pattern="' + uid + '">' + _brOpts + '</select>' : '') +
            '</div>' +
            '<div class="w-breath-meta"><span class="w-breath-cycles">' + (_brCfg.cycles || 0) + '</span> cycles today · ' + _brPhases.length + ' phases · ' + _brTotal + 's</div>' +
          '</div>' +
        '</div>';
      }
      case 'reading': {
        var _rdItems = Array.isArray(hubContent.reading) ? hubContent.reading : [];
        var _rdStyle = _getReadStyle(uid);
        var _rdDone = _rdItems.filter(function(b) { return b && b.done; }).length;
        var _rdTotal = _rdItems.length;
        var _rdPct = _rdTotal ? Math.round((_rdDone / _rdTotal) * 100) : 0;
        var _rdRow = function(b, i, compact) {
          return '<div class="w-rd-row' + (b.done ? ' w-rd-done' : '') + (compact ? ' w-rd-compact' : '') + '" data-idx="' + i + '">' +
            '<span class="w-rd-check' + (b.done ? ' w-rd-checked' : '') + '" data-read-toggle="' + i + '">' + (b.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span>' +
            '<span class="w-rd-main"><span class="w-rd-title' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Book title..." data-edit="reading-title" data-idx="' + i + '">' + e(b.title || '') + '</span>' +
              (!compact ? '<span class="w-rd-author' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Author..." data-edit="reading-author" data-idx="' + i + '">' + e(b.author || '') + '</span>' : '') +
            '</span>' +
            (isEdit ? '<button class="hub-edit-item-btn del" data-del="reading" data-idx="' + i + '">\u00D7</button>' : '') +
          '</div>';
        };
        var _rdBody = '';
        if (!_rdItems.length) {
          _rdBody = '<div class="w-rd-empty">No books yet' + (isEdit ? ' — add one below' : '') + '</div>';
        } else if (_rdStyle === 'compact') {
          _rdBody = '<div class="w-rd-list">' + _rdItems.map(function(b, i) { return _rdRow(b, i, true); }).join('') + '</div>';
        } else if (_rdStyle === 'progress') {
          var _rdPending = [];
          _rdItems.forEach(function(b, i) { if (!b.done && _rdPending.length < 4) _rdPending.push({ b: b, i: i }); });
          _rdBody = '<div class="w-rd-prog"><div class="w-rd-prog-head"><span>' + _rdDone + ' / ' + _rdTotal + ' read</span><span>' + _rdPct + '%</span></div><div class="w-bg-track"><div class="w-bg-fill" style="width:' + _rdPct + '%"></div></div></div><div class="w-rd-list">' + (_rdPending.length ? _rdPending.map(function(x) { return _rdRow(x.b, x.i, true); }).join('') : '<span class="w-rd-empty">All caught up</span>') + '</div>';
        } else {
          _rdBody = '<div class="w-rd-list">' + _rdItems.map(function(b, i) { return _rdRow(b, i, false); }).join('') + '</div>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>Reading</span><span class="w-rd-count">' + _rdDone + '/' + _rdTotal + '</span></div>' +
          _rdBody +
          (isEdit ? '<button class="w-add-btn" data-add="reading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add book</button>' : '') +
        '</div>';
      }
      case 'doodle': {
        var _ddStyle = _getDoodleStyle(uid);
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color);display:flex;flex-direction:column">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg><span>Doodle</span><div class="w-dd-tools">' +
            '<button class="w-dd-color" data-doodle-color="' + uid + '" data-color="#1c1b1b" style="background:#1c1b1b"></button>' +
            '<button class="w-dd-color" data-doodle-color="' + uid + '" data-color="#ef4444" style="background:#ef4444"></button>' +
            '<button class="w-dd-color" data-doodle-color="' + uid + '" data-color="#3b82f6" style="background:#3b82f6"></button>' +
            '<button class="w-dd-color" data-doodle-color="' + uid + '" data-color="#10b981" style="background:#10b981"></button>' +
            '<button class="w-dd-clear" data-doodle-clear="' + uid + '" title="Clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div></div>' +
          '<div class="w-dd-wrap w-dd-' + _ddStyle + '"><canvas class="w-doodle-canvas" data-doodle-uid="' + uid + '"></canvas><div class="w-dd-empty">Draw here</div></div>' +
        '</div>';
      }
      case 'github': {
        var _ghStyle = _getGhStyle(uid);
        var _ghUser = (hubContent.github && hubContent.github.username) || '';
        var _ghBody = _ghUser
          ? '<div class="gh-loading"><span>Loading GitHub...</span></div>'
          : '<div class="gh-empty">' + (isEdit ? 'Enter a GitHub username' : 'No username set') + '</div>';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' +
          editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg><span>GitHub</span></div>' +
          (isEdit ? '<div class="w-gh-set"><input class="w-gh-input" data-gh-user="' + uid + '" value="' + e(_ghUser) + '" placeholder="GitHub username"><button class="w-gh-go" data-gh-refresh="' + uid + '">Load</button></div>' : '') +
          '<div class="gh-widget" data-gh-uid="' + uid + '" data-gh-style="' + _ghStyle + '">' + _ghBody + '</div>' +
        '</div>';
      }
      case 'text': {
        var _textStyle = _getTextStyle(uid);
        var _item = layout.find(function(i) { return i.uid === uid; });
        var _text = (_item && _item.text) ? _item.text : 'Your text here';
        var _fontClass = 'w-text-font-' + _textStyle.replace(/\s+/g, '-');
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI + '<div class="w-text-wrap"><div class="w-text-content ' + _fontClass + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-save="text" data-text-uid="' + uid + '">' + e(_text) + '</div></div></div>';
      }
      case 'crypto': {
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI + '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 8h4.5a2 2 0 0 1 0 4H9V8z"/><path d="M9 12h5a2 2 0 0 1 0 4H9v-4z"/><line x1="10" y1="6" x2="10" y2="8"/><line x1="14" y1="6" x2="14" y2="8"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="14" y1="16" x2="14" y2="18"/></svg><span>Crypto</span></div><div class="crypto-widget" data-crypto-uid="' + uid + '"><div class="crypto-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M9 8h4.5a2 2 0 0 1 0 4H9V8z"/><path d="M9 12h5a2 2 0 0 1 0 4H9v-4z"/></svg><span>Loading prices...</span></div></div></div>';
      }
      case 'homework': {
        var _hwStyle = _getHwStyle(uid);
        var _hwItems = hubContent.homework || [];
        var _hwDone = _hwItems.filter(function(h) { return h.done; }).length;
        var _hwTotal = _hwItems.length;
        var _hwPct = _hwTotal ? Math.round((_hwDone / _hwTotal) * 100) : 0;
        var _today = new Date().toISOString().slice(0, 10);
        var _subjectColors = { Math:'#4a90d9', Science:'#27ae60', English:'#8e44ad', History:'#f39c12', Art:'#e74c8b', Music:'#16a085', PE:'#e67e22', Programming:'#2980b9' };
        var _colorIdx = 0;
        var _colorPalette = ['#4a90d9','#27ae60','#8e44ad','#f39c12','#e74c8b','#16a085','#e67e22','#2980b9','#c0392b','#1abc9c'];
        function _hwSubColor(subj) {
          if (!subj) return _colorPalette[0];
          if (_subjectColors[subj]) return _subjectColors[subj];
          var hash = 0;
          for (var ci = 0; ci < subj.length; ci++) hash = subj.charCodeAt(ci) + ((hash << 5) - hash);
          return _colorPalette[Math.abs(hash) % _colorPalette.length];
        }
        function _hwDueClass(due) {
          if (!due) return '';
          if (due < _today) return ' w-hw-overdue';
          if (due === _today) return ' w-hw-due-today';
          return '';
        }
        function _hwPriorityDot(p) {
          var cls = p === 'high' ? 'w-pri-high' : p === 'medium' ? 'w-pri-med' : 'w-pri-low';
          return '<span class="w-hw-pri-dot ' + cls + '" title="' + (p || 'low') + ' priority"></span>';
        }
        function _hwDueChip(due) {
          if (!due) return '';
          var parts = due.split('-');
          var label = parseInt(parts[1]) + '/' + parseInt(parts[2]);
          return '<span class="w-hw-due-chip' + _hwDueClass(due) + '">' + label + '</span>';
        }
        function _hwSubjectBadge(subj) {
          if (!subj) return '';
          return '<span class="w-hw-subject" style="background:' + _hwSubColor(subj) + '20;color:' + _hwSubColor(subj) + '">' + e(subj) + '</span>';
        }
        var _hwBody = '';
        if (_hwStyle === 'kanban') {
          var _pending = _hwItems.map(function(h,i){return Object.assign({},h,{_idx:i});}).filter(function(h){return !h.done;});
          var _done = _hwItems.map(function(h,i){return Object.assign({},h,{_idx:i});}).filter(function(h){return h.done;});
          function _kanbanCard(h) {
            return '<div class="w-hw-kcard' + _hwDueClass(h.due) + '" data-idx="' + h._idx + '">' + _hwPriorityDot(h.priority) + '<span class="w-hw-ktext' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type assignment…" data-edit="homework" data-idx="' + h._idx + '">' + e(h.text) + '</span>' + _hwSubjectBadge(h.subject) + _hwDueChip(h.due) + (isEdit ? '<button class="hub-edit-item-btn del" data-del="homework" data-idx="' + h._idx + '">\u00d7</button>' : '') + '</div>';
          }
          _hwBody = '<div class="w-hw-kanban"><div class="w-hw-kcol"><div class="w-hw-kcol-head">Pending</div><div class="w-hw-kcol-body">' + _pending.map(_kanbanCard).join('') + '</div></div><div class="w-hw-kcol"><div class="w-hw-kcol-head">Done</div><div class="w-hw-kcol-body">' + _done.map(_kanbanCard).join('') + '</div></div></div>';
        } else if (_hwStyle === 'compact') {
          _hwBody = '<div class="w-hw-progress"><div class="w-hw-prog-bar"><div class="w-hw-prog-fill" style="width:' + _hwPct + '%"></div></div><span class="w-hw-prog-text">' + _hwDone + '/' + _hwTotal + ' done (' + _hwPct + '%)</span></div><div class="w-list w-hw-list">' + _hwItems.map(function(h, i) {
            return '<div class="w-item w-item-compact w-hw-item' + (h.done ? ' w-item-done' : '') + _hwDueClass(h.due) + '" data-idx="' + i + '">' + _hwPriorityDot(h.priority) + '<span class="w-todo-box w-todo-box-sm ' + (h.done ? 'w-todo-checked' : '') + '">' + (h.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span><span class="w-item-text ' + (h.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type assignment…" data-edit="homework" data-idx="' + i + '">' + e(h.text) + '</span>' + _hwDueChip(h.due) + (isEdit ? '<button class="hub-edit-item-btn del" data-del="homework" data-idx="' + i + '">\u00d7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="homework"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add homework</button></div>';
        } else {
          _hwBody = '<div class="w-hw-progress"><div class="w-hw-prog-bar"><div class="w-hw-prog-fill" style="width:' + _hwPct + '%"></div></div><span class="w-hw-prog-text">' + _hwDone + '/' + _hwTotal + ' done (' + _hwPct + '%)</span></div><div class="w-list w-hw-list">' + _hwItems.map(function(h, i) {
            return '<div class="w-item w-hw-item' + (h.done ? ' w-item-done' : '') + _hwDueClass(h.due) + '" data-idx="' + i + '">' + (isEdit ? '<span class="w-todo-drag-handle" draggable="true" data-hw-drag="' + i + '">\u283F</span>' : '') + '<span class="w-todo-box ' + (h.done ? 'w-todo-checked' : '') + '">' + (h.done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span><div class="w-hw-details"><span class="w-item-text ' + (h.done ? 'w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type assignment…" data-edit="homework" data-idx="' + i + '">' + e(h.text) + '</span><div class="w-hw-meta">' + _hwSubjectBadge(h.subject) + _hwPriorityDot(h.priority) + '<span class="w-hw-due-chip' + _hwDueClass(h.due) + '" data-hw-due="' + i + '">' + (h.due ? h.due.split('-').slice(1).join('/') : 'No due date') + '</span></div></div>' + (isEdit ? '<button class="hub-edit-item-btn del" data-del="homework" data-idx="' + i + '">\u00d7</button>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-add="homework"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add homework</button></div>';
        }
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">
          ${editUI}
          <div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg><span>Homework</span></div>
          ${_hwBody}
        </div>`;
      }
      case 'study': {
        var _stSubs = _ensureStudy();
        var _stPalette = ['#4a90d9','#27ae60','#8e44ad','#f39c12','#e74c8b','#16a085','#e67e22','#2980b9','#c0392b','#1abc9c'];
        function _stColor(name) {
          if (!name) return _stPalette[0];
          var hash = 0;
          for (var ci = 0; ci < name.length; ci++) hash = name.charCodeAt(ci) + ((hash << 5) - hash);
          return _stPalette[Math.abs(hash) % _stPalette.length];
        }
        var _stAll = [];
        _stSubs.forEach(function(sj) { _studySubjectItems(sj).forEach(function(it) { _stAll.push(it); }); });
        var _stCounts = _studyCounts(_stAll);
        function _stCheckSvg() {
          return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        }
        var _stBody = '';
        if (!_stSubs.length) {
          _stBody = '<div class="w-st-empty">No subjects yet. Add your first subject to start tracking chapters.</div><button class="w-add-btn" data-st-add-subject><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add subject</button>';
        } else {
          _stBody = _stSubs.map(function(sj) {
            var _sjItems = _studySubjectItems(sj);
            var _sjC = _studyCounts(_sjItems);
            var _sjColor = sj.color || _stColor(sj.name);
            var _sjChN = (sj.chapters || []).length;
            var _sjStats = _sjChN + ' chapter' + (_sjChN === 1 ? '' : 's') + ' · ' + _sjC.total + ' subchapter' + (_sjC.total === 1 ? '' : 's');
            var _chaps = (sj.chapters || []).map(function(ch) {
              var _chC = _studyCounts(ch.items || []);
              var _items = (ch.items || []).map(function(it) {
                return '<div class="w-st-leaf' + (it.done ? ' w-st-done' : '') + '" data-st-leaf="' + sj.id + '|' + ch.id + '|' + it.id + '">' + (isEdit ? '<span class="w-st-drag" draggable="true" data-st-drag="' + sj.id + '|' + ch.id + '|' + it.id + '" title="Drag to reorder">⠿</span>' : '') + '<span class="w-todo-box w-todo-box-sm' + (it.done ? ' w-todo-checked' : '') + '" data-st-toggle-item="' + sj.id + '|' + ch.id + '|' + it.id + '">' + (it.done ? _stCheckSvg() : '') + '</span><span class="w-item-text' + (it.done ? ' w-todo-done' : '') + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Type subchapter…" data-edit="study-item" data-sid="' + sj.id + '" data-cid="' + ch.id + '" data-iid="' + it.id + '">' + e(it.text) + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-st-del-item="' + sj.id + '|' + ch.id + '|' + it.id + '">×</button>' : '') + '</div>';
              }).join('');
              var _chapOpen = !ch.collapsed;
              return '<div class="w-st-chap"><div class="w-st-chap-head" data-st-toggle-chap="' + sj.id + '|' + ch.id + '"><span class="w-st-caret' + (_chapOpen ? ' open' : '') + '">▸</span><span class="w-st-chap-name' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Chapter name…" data-edit="study-chapter" data-sid="' + sj.id + '" data-cid="' + ch.id + '">' + e(ch.name) + '</span><span class="w-st-count">' + _chC.done + '/' + _chC.total + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-st-del-chapter="' + sj.id + '|' + ch.id + '">×</button>' : '') + '</div>' + (_chapOpen ? '<div class="w-st-leaves" data-st-drop-chap="' + sj.id + '|' + ch.id + '">' + _items + '<button class="w-st-add-inline" data-st-add-item="' + sj.id + '|' + ch.id + '">+ Subchapter</button></div>' : '') + '</div>';
            }).join('');
            var _subjOpen = !sj.collapsed;
            return '<div class="w-st-subj"><div class="w-st-subj-head" data-st-toggle-subj="' + sj.id + '"><span class="w-st-caret' + (_subjOpen ? ' open' : '') + '">▸</span><span class="w-st-dot" style="background:' + _sjColor + '" data-st-color="' + sj.id + '" title="Change color"></span><span class="w-st-subj-name' + (isEdit ? ' hub-editable' : '') + '" contenteditable="' + isEdit + '" data-ph="Subject name…" data-edit="study-subject" data-sid="' + sj.id + '">' + e(sj.name) + '</span><span class="w-st-subj-stats">' + _sjStats + '</span><span class="w-st-count">' + _sjC.done + '/' + _sjC.total + '</span>' + (isEdit ? '<button class="hub-edit-item-btn del" data-st-del-subject="' + sj.id + '">×</button>' : '') + '</div>' + (_subjOpen ? '<div class="w-st-subj-bar"><div class="w-st-subj-fill" style="width:' + _sjC.pct + '%;background:' + _sjColor + '"></div></div><div class="w-st-chaps">' + _chaps + '<button class="w-st-add-inline" data-st-add-chapter="' + sj.id + '">+ Chapter</button></div>' : '') + '</div>';
          }).join('') + '<button class="w-add-btn" data-st-add-subject><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Add subject</button>';
        }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI + '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg><span>Study</span></div><div class="w-hw-progress"><div class="w-hw-prog-bar"><div class="w-hw-prog-fill" style="width:' + _stCounts.pct + '%"></div></div><span class="w-hw-prog-text">' + _stCounts.done + '/' + _stCounts.total + ' done (' + _stCounts.pct + '%)</span></div><div class="w-list w-st-list">' + _stBody + '</div></div>';
      }
      case 'prayertime': {
        var _ptCached = _ptGetCache();
        var _ptBody = (_ptCached && _ptCached.timings)
          ? _prayerRender(_ptCached)
          : '<div class="wf-loading"><span class="wf-spin"></span><span>Loading prayer times…</span></div>';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/><path d="M18.5 17.5a5.5 5.5 0 01-6-6"/></svg><span>Prayer Times</span><button class="wf-refresh" data-pt-refresh="1" title="Refresh">&#x21BB;</button></div>' +
          '<div class="pt-widget" data-pt-uid="' + uid + '">' + _ptBody + '</div>' +
        '</div>';
      }
      case 'bmkgquake': {
        var _qkCached = _qkGetCache();
        var _qkBody = _qkCached
          ? _qkRender(_qkCached)
          : '<div class="wf-loading"><span class="wf-spin"></span><span>Loading seismic data…</span></div>';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h3l2.5-7 3 14 3-10 2.5 6 2-3H22"/></svg><span>Earthquake</span><span class="wf-src">BMKG</span><button class="wf-refresh" data-qk-refresh="1" title="Refresh">&#x21BB;</button></div>' +
          '<div class="qk-widget" data-qk-uid="' + uid + '">' + _qkBody + '</div>' +
        '</div>';
      }
      case 'moneyflow': {
        var _mf = _moneyFlowData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><polyline points="15 8 20 8 20 13"/></svg><span>Money Flow</span></div>' +
          '<div class="mf-widget">' + _moneyFlowRender(_mf) + '</div>' +
          (isEdit ? '<div class="mf-ctl"><span class="mf-ctl-lbl">Payday</span><input type="number" min="1" max="28" class="mf-ctl-input" data-mf-payday value="' + _mf.payday + '"></div>' : '') +
        '</div>';
      }
      case 'assistant': {
        var _as = _assistantPlan();
        var _asRows = _as.items.map(function(it, i) {
          return '<a class="as-row as-' + it.tone + '" href="' + it.href + '">' +
            '<span class="as-rank">' + (i + 1) + '</span>' +
            '<span class="as-main"><span class="as-title">' + e(it.title) + '</span><span class="as-why">' + e(it.why) + '</span></span>' +
          '</a>';
        }).join('');
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/></svg><span>Assistant</span><span class="wf-src">' + e(_as.greeting) + '</span></div>' +
          '<div class="as-widget">' +
            '<div class="as-head"><span class="as-head-val">' + _as.total + '</span><span class="as-head-lbl">thing' + (_as.total === 1 ? '' : 's') + ' worth your attention</span></div>' +
            '<div class="as-rows">' + _asRows + '</div>' +
          '</div>' +
        '</div>';
      }
      case 'friends-live': {
        var _fr = _friendsLiveData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg><span>Friends</span><button class="wf-refresh" data-fr-refresh="1" title="Refresh">&#x21BB;</button></div>' +
          '<div class="fr-widget" data-fr-host="' + uid + '">' + _friendsLiveRender(_fr) + '</div>' +
        '</div>';
      }
      case 'grades': {
        var _gr = _gradesData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.2 13.6L7 22l5-3 5 3-1.2-8.4"/></svg><span>Grades</span></div>' +
          '<div class="wp-widget">' + _gradesRender(_gr, isEdit) + '</div>' +
          (isEdit ? _gradesEditor(_gr) : '') +
        '</div>';
      }
      case 'attendance': {
        var _at = _attendanceData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v3H9z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><polyline points="9 14 11 16 15 11"/></svg><span>Attendance</span></div>' +
          '<div class="wp-widget">' + _attendanceRender(_at, isEdit) + '</div>' +
          (isEdit ? '<div class="wp-edit"><span class="wp-muted">Max absence</span><input type="number" min="0" max="50" class="wp-input wp-input-sm" data-att-allowed value="' + _at.allowedPct + '"><span class="wp-muted">%</span></div>' : '') +
        '</div>';
      }
      case 'exams': {
        var _ex = _examsData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg><span>Exams</span></div>' +
          '<div class="wp-widget">' + _examsRender(_ex) + '</div>' +
          (isEdit ? _examsEditor() : '') +
        '</div>';
      }
      case 'holidays': {
        var _hd = _holidaysData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg><span>Tanggal Merah</span></div>' +
          '<div class="wp-widget">' + _holidaysRender(_hd) + '</div>' +
        '</div>';
      }
      case 'birthdays': {
        var _bd = _birthdaysData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg><span>Birthdays</span></div>' +
          '<div class="wp-widget">' + _birthdaysRender(_bd) + '</div>' +
          (isEdit ? _birthdaysEditor() : '') +
        '</div>';
      }
      case 'flashcards': {
        var _fc = _flashcardsData();
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Flashcards</span></div>' +
          '<div class="wp-widget">' + _flashcardsRender(_fc) + '</div>' +
          (isEdit ? _flashcardsEditor() : '') +
        '</div>';
      }
      case 'sleepdebt': {
        var _sd = _sleepDebtData();
        var _sdFmt = function(m) { m = Math.max(0, Math.round(m)); if (!m) return '0h'; var h = Math.floor(m / 60), mm = m % 60; return h + 'h' + (mm ? ' ' + mm + 'm' : ''); };
        var _sdDebt = _sd.debt > 0;
        var _sdHero = _sd.logged === 0 ? '\u2014' : _sdFmt(_sdDebt ? _sd.debt : _sd.credit);
        var _sdLbl = _sd.logged === 0 ? 'no sleep logged' : (_sdDebt ? 'debt this week' : 'ahead this week');
        var _sdCol = _sd.logged === 0 ? 'var(--text-tertiary)' : (_sdDebt ? (_sd.debt >= 300 ? '#ef4444' : '#f59e0b') : '#10b981');
        var _sdBars = _sd.days.map(function(d) {
          var pct = d.has && _sd.target > 0 ? Math.min(100, Math.round((d.dur / _sd.target) * 100)) : 0;
          var cls = 'sd-bar' + (d.has ? (d.dur >= _sd.target ? ' sd-hit' : ' sd-miss') : ' sd-none') + (d.today ? ' sd-today' : '');
          return '<div class="' + cls + '" title="' + (d.has ? _sdFmt(d.dur) + ' of ' + _sdFmt(_sd.target) : 'not logged') + '">'
            + '<div class="sd-bar-track"><div class="sd-bar-fill" style="height:' + pct + '%"></div></div>'
            + '<span class="sd-bar-dow">' + d.dow + '</span></div>';
        }).join('');
        var _sdFoot = _sd.logged === 0
          ? 'Log sleep to start tracking'
          : (_sdDebt ? 'Sleep ' + _sdFmt(_sd.tonight) + ' tonight to clear it' : 'Target ' + _sdFmt(_sd.target) + ' a night');
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg><span>Sleep Debt</span></div>' +
          '<div class="sd-wrap">' +
            '<div class="sd-hero"><span class="sd-val" style="color:' + _sdCol + '">' + _sdHero + '</span><span class="sd-lbl">' + _sdLbl + '</span></div>' +
            '<div class="sd-bars">' + _sdBars + '</div>' +
            '<div class="sd-foot">' + _sdFoot + '</div>' +
          '</div>' +
        '</div>';
      }
      case 'ytfeed': {
        var _yf = _ytFeedData();
        var _yfItems = _yf.items || [];
        var _yfGrid = _yfItems.length
          ? _yfItems.map(function(it, i) {
              var meta = _videoMeta(it.url) || { kind:'link', url:it.url, thumb:'' };
              var thumb = meta.thumb
                ? '<img class="ytf-thumb" src="' + e(meta.thumb) + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">'
                : '<span class="ytf-thumb ytf-thumb-none">' + (meta.kind === 'tt' ? 'TikTok' : 'Link') + '</span>';
              var badge = meta.kind === 'yt' ? 'YT' : meta.kind === 'tt' ? 'TT' : '\u00B7';
              return '<div class="ytf-card">'
                + '<a class="ytf-link" href="' + e(meta.url) + '" target="_blank" rel="noopener noreferrer" title="' + e(it.title || meta.url) + '">'
                + thumb
                + '<span class="ytf-badge' + (meta.kind === 'link' ? '' : ' ytf-badge-' + meta.kind) + '">' + badge + '</span>'
                + '<span class="ytf-title">' + e(it.title || 'Untitled') + '</span></a>'
                + (isEdit ? '<button class="ytf-del" data-ytf-del="' + i + '" title="Remove" aria-label="Remove">\u00D7</button>' : '')
                + '</div>';
            }).join('')
          : '<div class="ytf-empty">No videos saved yet</div>';
        var _yfAdd = isEdit
          ? '<div class="ytf-add"><input class="ytf-input" data-ytf-input placeholder="Paste a YouTube or TikTok link" maxlength="300"><button class="wf-btn" data-ytf-add>Add</button></div>'
          : '';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9"/></svg><span>Video Feed</span></div>' +
          '<div class="ytf-wrap"><div class="ytf-grid">' + _yfGrid + '</div>' + _yfAdd + '</div>' +
        '</div>';
      }
      case 'watchlist': {
        var _wl = _watchlistData();
        var _wlItems = _wl.items || [];
        var _wlList = _wlItems.length
          ? _wlItems.map(function(it, i) {
              var st = it.status || 'plan';
              var stLbl = st === 'watching' ? 'Watching' : st === 'done' ? 'Done' : 'Plan to watch';
              var isSeries = it.kind === 'series';
              var pct = st === 'done' ? 100 : (isSeries && it.totalEpisodes > 0 ? Math.min(100, Math.round(((it.episode || 0) / it.totalEpisodes) * 100)) : 0);
              var prog = (isSeries && it.totalEpisodes > 0)
                ? '<span class="wl-prog"><span class="wl-prog-track"><span class="wl-prog-fill" style="width:' + pct + '%"></span></span><span class="wl-prog-txt">E' + (it.episode || 0) + '/' + it.totalEpisodes + '</span></span>'
                : '';
              var step = (isSeries && st !== 'plan')
                ? '<button class="wl-step" data-wl-step="' + i + '" title="Next episode">+1</button>'
                : '';
              return '<div class="wl-row wl-' + st + '">'
                + '<button class="wl-main" data-wl-cycle="' + i + '" title="Change status">'
                + '<span class="wl-dot"></span>'
                + '<span class="wl-body"><span class="wl-title">' + e(it.title || 'Untitled') + '</span>'
                + '<span class="wl-meta">' + (isSeries ? 'Series' : 'Film') + ' \u00B7 ' + stLbl + '</span>' + prog + '</span>'
                + '</button>'
                + step
                + (isEdit ? '<button class="wl-del" data-wl-del="' + i + '" title="Remove" aria-label="Remove">\u00D7</button>' : '')
                + '</div>';
            }).join('')
          : '<div class="wl-empty">Nothing on your list</div>';
        var _wlAdd = isEdit
          ? '<div class="wl-add"><input class="wl-input" data-wl-input placeholder="Title" maxlength="80">'
            + '<select class="wl-sel" data-wl-kind><option value="film">Film</option><option value="series">Series</option></select>'
            + '<input class="wl-input wl-input-ep" type="number" min="0" max="9999" data-wl-eps placeholder="Eps">'
            + '<button class="wf-btn" data-wl-add>Add</button></div>'
          : '';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5"/></svg><span>Watchlist</span></div>' +
          '<div class="wl-wrap"><div class="wl-list">' + _wlList + '</div>' + _wlAdd + '</div>' +
        '</div>';
      }
      case 'musicviz': {
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="14" x2="4" y2="20"/><line x1="9" y1="8" x2="9" y2="20"/><line x1="14" y1="4" x2="14" y2="20"/><line x1="19" y1="11" x2="19" y2="20"/></svg><span>Visualiser</span></div>' +
          '<div class="mv-wrap" data-mv-uid="' + uid + '">' +
            '<canvas class="mv-canvas" data-mv-canvas aria-label="Audio visualiser"></canvas>' +
            '<div class="mv-foot"><button class="wf-btn mv-btn" data-mv-toggle>Use mic</button><span class="mv-hint">React to sound</span></div>' +
          '</div>' +
        '</div>';
      }
      case 'pet': {
        var _ptS = _funStats();
        var _ptStage = _petStage(_ptS.level);
        var _ptFed = _ptS.doneToday > 0;
        var _ptSvg = _petSvg(_ptS.level, _ptFed);
        var _ptNext = _ptS.span - _ptS.into;
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg><span>Pet</span></div>' +
          '<div class="pet-wrap">' +
            '<div class="pet-stage' + (_ptFed ? ' pet-fed' : '') + '">' + _ptSvg + '</div>' +
            '<div class="pet-name">' + e(_ptStage.name) + '</div>' +
            '<div class="pet-blurb">' + e(_ptStage.blurb) + '</div>' +
            '<div class="pet-bar"><div class="pet-bar-track"><div class="pet-bar-fill" style="width:' + _ptS.pct + '%"></div></div><span class="pet-bar-txt">' + _ptNext + ' XP to level ' + (_ptS.level + 1) + '</span></div>' +
            '<div class="pet-status">' + (_ptFed ? 'Fed today \u00B7 ' + _ptS.doneToday + ' done' : 'Not fed yet today') + '</div>' +
          '</div>' +
        '</div>';
      }
      case 'garden': {
        var _gdS = _funStats();
        var _gdCells = [];
        for (var _gi = 20; _gi >= 0; _gi--) {
          var _gd = new Date(); _gd.setDate(_gd.getDate() - _gi);
          var _gk = formatDate(_gd);
          var _gn = (_gdS.days && _gdS.days[_gk]) || 0;
          var _gLvl = _gn === 0 ? 0 : _gn <= 2 ? 1 : _gn <= 5 ? 2 : 3;
          var _gDow = ['S','M','T','W','T','F','S'][_gd.getDay()];
          var _gToday = _gi === 0;
          _gdCells.push('<div class="gd-cell gd-l' + _gLvl + (_gToday ? ' gd-today' : '') + '" title="' + _gk + ': ' + _gn + ' done">' + _plantSvg(_gLvl) + '<span class="gd-dow">' + _gDow + '</span></div>');
        }
        var _gdBloom = 0;
        for (var _gb in _gdS.days) { if (_gdS.days[_gb] >= 6) _gdBloom++; }
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg><span>Streak Garden</span></div>' +
          '<div class="gd-wrap">' +
            '<div class="gd-grid">' + _gdCells.join('') + '</div>' +
            '<div class="gd-foot"><span class="gd-stat"><b>' + _gdS.current + '</b> current</span><span class="gd-stat"><b>' + _gdS.best + '</b> best</span><span class="gd-stat"><b>' + _gdBloom + '</b> bloomed</span></div>' +
          '</div>' +
        '</div>';
      }
      case 'xp': {
        var _xpS = _funStats();
        var _xpLeft = _xpS.span - _xpS.into;
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="21 7 21 12 16 12"/></svg><span>Level</span></div>' +
          '<div class="xp-wrap">' +
            '<div class="xp-top">' +
              '<div class="xp-lvl"><span class="xp-lvl-num">' + _xpS.level + '</span><span class="xp-lvl-lbl">level</span></div>' +
              '<div class="xp-meta"><span class="xp-total">' + _xpS.xp.toLocaleString('en-US') + ' XP</span><span class="xp-next">' + _xpLeft + ' to level ' + (_xpS.level + 1) + '</span></div>' +
            '</div>' +
            '<div class="xp-track"><div class="xp-fill" style="width:' + _xpS.pct + '%"></div></div>' +
            '<div class="xp-stats">' +
              '<div class="xp-stat"><span class="xp-stat-val">' + _xpS.total + '</span><span class="xp-stat-lbl">done</span></div>' +
              '<div class="xp-stat"><span class="xp-stat-val">' + _xpS.current + '</span><span class="xp-stat-lbl">streak</span></div>' +
              '<div class="xp-stat"><span class="xp-stat-val">' + _xpS.best + '</span><span class="xp-stat-lbl">best</span></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      }
      case 'badges': {
        var _bdS = _funStats();
        var _bdList = _funBadges(_bdS);
        var _bdEarned = _bdList.filter(function(b) { return b.earned; }).length;
        var _bdGrid = _bdList.map(function(b) {
          return '<div class="bdg-chip bdg-' + b.tier + (b.earned ? ' bdg-on' : '') + '" title="' + e(b.name + ' \u2014 ' + b.desc) + '">'
            + '<span class="bdg-mark">' + (b.earned ? '\u2605' : '\u2606') + '</span>'
            + '<span class="bdg-name">' + e(b.name) + '</span>'
            + '</div>';
        }).join('');
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg><span>Badges</span></div>' +
          '<div class="bdg-wrap">' +
            '<div class="bdg-head"><span class="bdg-count">' + _bdEarned + ' / ' + _bdList.length + '</span><span class="bdg-sub">earned</span></div>' +
            '<div class="bdg-grid">' + _bdGrid + '</div>' +
          '</div>' +
        '</div>';
      }
      case 'money': {
        var _mo = _moneyData();
        var _moFmt = function(n) {
          var v = Math.abs(Number(n) || 0);
          var neg = (Number(n) || 0) < 0;
          var s;
          if (v >= 1000000) s = (v / 1000000).toFixed(v >= 10000000 ? 0 : 1) + 'jt';
          else if (v >= 1000) s = (v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'rb';
          else s = String(Math.round(v));
          return (neg ? '-' : '') + 'Rp ' + s;
        };
        var _moTot = _mo.piggy + _mo.wallet;
        var _moPiggyPct = _moTot > 0 ? Math.round((_mo.piggy / _moTot) * 100) : 50;
        var _moDelta = _mo.totalDelta;
        var _moDeltaTxt = (_moDelta > 0 ? '+' : _moDelta < 0 ? '-' : '\u00B1') + _moFmt(Math.abs(_moDelta)) + ' this week';
        var _moDeltaCls = _moDelta > 0 ? ' mon-up' : _moDelta < 0 ? ' mon-down' : '';
        return '<div class="bento-bubble" data-bubble="' + uid + '" style="' + dimStyle + ';background:var(--surface-container);padding:var(--gutter);border:1px solid var(--border-color)">' + editUI +
          '<div class="w-head"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg><span>Money</span></div>' +
          '<div class="mon-wrap">' +
            '<div class="mon-hero"><span class="mon-total">' + _moFmt(_moTot) + '</span><span class="mon-lbl">piggy + wallet</span></div>' +
            '<div class="mon-split"><div class="mon-split-piggy" style="width:' + _moPiggyPct + '%"></div></div>' +
            '<div class="mon-rows">' +
              '<div class="mon-row"><span class="mon-dot mon-dot-piggy"></span><span class="mon-name">Piggy Bank</span><span class="mon-amt">' + _moFmt(_mo.piggy) + '</span></div>' +
              '<div class="mon-row"><span class="mon-dot mon-dot-wallet"></span><span class="mon-name">Wallet</span><span class="mon-amt">' + _moFmt(_mo.wallet) + '</span></div>' +
            '</div>' +
            '<div class="mon-foot' + _moDeltaCls + '">' + _moDeltaTxt + '</div>' +
          '</div>' +
        '</div>';
      }
      default:
        return `<div class="bento-bubble" data-bubble="${uid}" style="${dimStyle};padding:24px;background:var(--surface-container);border:1px dashed var(--border-color)">
          ${editUI}
          <div style="text-align:center;color:var(--text-tertiary);font-size:0.75rem">Unknown bubble</div>
        </div>`;
    }
  }

  const visible = layout.filter(i => !i.hidden);
  visible.forEach((item, idx) => {
    try {
      var html = bubbleHtml(item);
      var accent = hubContent.bubbleColors && hubContent.bubbleColors[item.uid];
      if (accent) {
        html = html.replace(/style="(left:[^"]+)"/, function(m, p1) { return 'style="' + p1 + ';--bubble-accent:' + accent + ';animation-delay:' + (idx * 60) + 'ms"'; });
      } else {
        html = html.replace(/style="(left:[^"]+)"/, function(m, p1) { return 'style="' + p1 + ';animation-delay:' + (idx * 60) + 'ms"'; });
      }
      var _tb = document.createElement('div');
      _tb.innerHTML = html;
      var _bub = _tb.firstElementChild;
      if (_bub) {
        if (item.t === 'clock' || item.t === 'calendar') _bub.classList.add('bento-noscroll');
        var _scroll = document.createElement('div');
        _scroll.className = 'bento-scroll';
        Array.prototype.slice.call(_bub.children).forEach(function(_ch) {
          if (_ch.classList.contains('bento-toolbar') || _ch.classList.contains('bento-toolbar-remove') || _ch.classList.contains('bento-toolbar-style') || _ch.classList.contains('bento-resize-edge') || _ch.classList.contains('bento-resize-handle')) return;
          _scroll.appendChild(_ch);
        });
        _bub.appendChild(_scroll);
        grid.appendChild(_bub);
      }
    } catch (e) {
      console.warn('Bento bubble render error:', item.t, e);
    }
  });

  if (_prevSpIframes.length) {
    grid.querySelectorAll('.spotify-widget iframe').forEach(function(iframe) {
      var want = iframe.getAttribute('src');
      for (var i = 0; i < _prevSpIframes.length; i++) {
        if (_prevSpIframes[i].getAttribute('src') === want) {
          iframe.replaceWith(_prevSpIframes[i]);
          _prevSpIframes.splice(i, 1);
          break;
        }
      }
    });
  }
  if (grid.querySelector('.spotify-widget iframe') && typeof spScheduleEmbedCheck === 'function') spScheduleEmbedCheck(6000);

  // Initialize Leaflet flight radar maps
  if (typeof L !== 'undefined') {
    var _fr24Proxies = [
      function(u) { return 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u); },
      function(u) { return 'https://corsproxy.io/?' + encodeURIComponent(u); },
      function(u) { return 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u); }
    ];
    grid.querySelectorAll('.fr24-widget[data-fr24-lat]').forEach(function(el) {
      if (el._leafletMap) return;
      var lat = parseFloat(el.dataset.fr24Lat) || 51.5;
      var lon = parseFloat(el.dataset.fr24Lon) || -0.12;
      var frKey = '';
      try { frKey = localStorage.getItem('haven-fr24-key-' + el.id.replace('fr24-map-', '')) || ''; } catch(e) {}
      var map = L.map(el, { zoomControl: false, attributionControl: false, maxZoom: 12, minZoom: 3 }).setView([lat, lon], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12 }).addTo(map);
      el._leafletMap = map;
      el._flightMarkers = [];
      el._flightMarkerLayer = L.layerGroup().addTo(map);
      el._fr24ProxyIdx = 0;
      el._fr24ConsecutiveFails = 0;
      el._fr24Key = frKey;
      var statusEl = el.querySelector('.fr24-status-text');
      var statusDot = el.querySelector('.fr24-status-dot');
      var airportIcon = L.divIcon({ className: 'fr24-airport-icon', html: '<div style="width:8px;height:8px;background:#fff;border-radius:50%;border:2px solid rgba(255,255,255,0.2);box-shadow:0 0 12px rgba(255,255,255,0.6),0 0 24px rgba(255,255,255,0.2)"></div>', iconSize: [8, 8], iconAnchor: [4, 4] });
      L.marker([lat, lon], { icon: airportIcon }).addTo(map);
      function setStatus(text, state) {
        if (statusEl) statusEl.textContent = text;
        if (statusDot) statusDot.className = 'fr24-status-dot fr24-status-' + state;
      }
      function fetchFlights() {
        if (!map) return;
        var bounds = map.getBounds();
        var pad = 1;
        var url = 'https://opensky-network.org/api/states/all?lamin=' + (bounds.getSouth() - pad) + '&lamax=' + (bounds.getNorth() + pad) + '&lomin=' + (bounds.getWest() - pad) + '&lomax=' + (bounds.getEast() + pad);
        var proxyFn = _fr24Proxies[el._fr24ProxyIdx % _fr24Proxies.length];
        var opts = { signal: AbortSignal.timeout(8000) };
        if (el._fr24Key) opts.headers = { Authorization: 'Bearer ' + el._fr24Key };
        function tryFetch(targetUrl, useProxy) {
          var fetchUrl = useProxy ? proxyFn(targetUrl) : targetUrl;
          return fetch(fetchUrl, opts).then(function(r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
          });
        }
        function attempt() {
          // With a key, try direct first (proxies strip headers)
          var firstTryDirect = !!el._fr24Key;
          tryFetch(url, !firstTryDirect)
            .then(function(data) {
              if (!data || !data.states) { setStatus('No data', 'warn'); return; }
              el._fr24ConsecutiveFails = 0;
              el._flightMarkerLayer.clearLayers();
              el._flightMarkers = [];
              data.states.forEach(function(s) {
                var nlat = s[6], nlon = s[5], callsign = (s[1] || '').trim();
                if (nlat == null || nlon == null) return;
                var heading = s[10] || 0;
                var alt = s[13] ? Math.round(s[13] * 3.28084) : 0;
                var spd = s[12] ? Math.round(s[12] * 3.6) : 0;
                var trail = alt > 30000 ? '#fff' : alt > 15000 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)';
                var icon = L.divIcon({ className: 'fr24-plane-icon', html: '<svg viewBox="0 0 24 24" fill="' + trail + '" style="width:12px;height:12px;transform:rotate(' + heading + 'deg);filter:drop-shadow(0 0 3px ' + trail + ')"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>', iconSize: [12, 12], iconAnchor: [6, 6] });
                var marker = L.marker([nlat, nlon], { icon: icon }).addTo(el._flightMarkerLayer);
                var tip = callsign || 'UNK';
                if (alt) tip += ' · ' + alt.toLocaleString() + ' ft';
                if (spd) tip += ' · ' + spd + ' km/h';
                marker.bindTooltip(tip, { direction: 'top', offset: [0, -6], className: 'fr24-tooltip' });
                el._flightMarkers.push(marker);
              });
              var count = el._flightMarkers.length;
              setStatus(count + ' plane' + (count !== 1 ? 's' : ''), 'ok');
            })
            .catch(function(err) {
              if (firstTryDirect) {
                // Direct request with key failed (likely CORS) — fall back to proxy without auth
                tryFetch(url, true)
                  .then(function(data) {
                    if (!data || !data.states) { setStatus('No data', 'warn'); return; }
                    el._fr24ConsecutiveFails = 0;
                    el._flightMarkerLayer.clearLayers();
                    el._flightMarkers = [];
                    data.states.forEach(function(s) {
                      var nlat = s[6], nlon = s[5], callsign = (s[1] || '').trim();
                      if (nlat == null || nlon == null) return;
                      var heading = s[10] || 0;
                      var alt = s[13] ? Math.round(s[13] * 3.28084) : 0;
                      var spd = s[12] ? Math.round(s[12] * 3.6) : 0;
                      var trail = alt > 30000 ? '#fff' : alt > 15000 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)';
                      var icon = L.divIcon({ className: 'fr24-plane-icon', html: '<svg viewBox="0 0 24 24" fill="' + trail + '" style="width:12px;height:12px;transform:rotate(' + heading + 'deg);filter:drop-shadow(0 0 3px ' + trail + ')"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>', iconSize: [12, 12], iconAnchor: [6, 6] });
                      var marker = L.marker([nlat, nlon], { icon: icon }).addTo(el._flightMarkerLayer);
                      var tip = callsign || 'UNK';
                      if (alt) tip += ' · ' + alt.toLocaleString() + ' ft';
                      if (spd) tip += ' · ' + spd + ' km/h';
                      marker.bindTooltip(tip, { direction: 'top', offset: [0, -6], className: 'fr24-tooltip' });
                      el._flightMarkers.push(marker);
                    });
                    setStatus(el._flightMarkers.length + ' plane' + (el._flightMarkers.length !== 1 ? 's' : ''), 'ok');
                  })
                  .catch(function() {
                    el._fr24ConsecutiveFails++;
                    if (el._fr24ConsecutiveFails >= 2) {
                      el._fr24ProxyIdx = (el._fr24ProxyIdx + 1) % _fr24Proxies.length;
                      el._fr24ConsecutiveFails = 0;
                    }
                    setStatus('Offline', 'err');
                  });
                return;
              }
              el._fr24ConsecutiveFails++;
              if (el._fr24ConsecutiveFails >= 2) {
                el._fr24ProxyIdx = (el._fr24ProxyIdx + 1) % _fr24Proxies.length;
                el._fr24ConsecutiveFails = 0;
              }
              setStatus('Offline', 'err');
            });
        }
        attempt();
      }
      setStatus('Loading...', 'loading');
      fetchFlights();
      el._flightInterval = setInterval(fetchFlights, 15000);
      map.on('moveend', fetchFlights);
      map.on('zoomend', fetchFlights);
      setTimeout(function() { map.invalidateSize(); fetchFlights(); }, 300);
    });
  }

  // Wire remove-bubble buttons directly (fires in target phase, not bubbled)
  grid.querySelectorAll('[data-remove-bubble]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.removeBubble;
      var layout2 = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var idx = layout2.findIndex(function(it) { return it.uid === uid; });
      if (idx !== -1) { pushUndoState(); layout2.splice(idx, 1); }
      hubContent.bentoLayout = layout2;
      saveHubContent();
      renderHubBento();
    });
  });

  // Wire duplicate-bubble buttons
  grid.querySelectorAll('[data-duplicate-bubble]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.duplicateBubble;
      var layout2 = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var src = layout2.find(function(it) { return it.uid === uid; });
      if (!src) return;
      pushUndoState();
      var copy = JSON.parse(JSON.stringify(src));
      copy.uid = 'bubble-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      copy.x = src.x + 24;
      copy.y = src.y + 24;
      try { if (typeof _copyWidgetStyle === 'function') _copyWidgetStyle(uid, copy.uid); } catch(e) {}
      if (copy.imageId) {
        var newId = copy.imageId;
        while (layout2.find(function(it) { return it.imageId === newId; }) || (hubContent.images && hubContent.images[newId])) {
          var parts = newId.split('-');
          var num = parseInt(parts[parts.length - 1]) || 1;
          parts[parts.length - 1] = String(num + 1);
          newId = parts.join('-');
        }
        copy.imageId = newId;
      }
      layout2.push(copy);
      resolveBubbleCollisions(layout2);
      hubContent.bentoLayout = layout2;
      saveHubContent();
      renderHubBento();
    });
  });

  // Wire clock style toggle buttons
  grid.querySelectorAll('[data-clock-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.clockStyleToggle;
      var cur = _getClockStyle(uid);
      var idx = CLOCK_STYLE_LIST.indexOf(cur);
      var next = CLOCK_STYLE_LIST[(idx + 1) % CLOCK_STYLE_LIST.length];
      _setClockStyle(uid, next);
      renderHubBento();
    });
  });

  // Wire weather style toggle buttons
  grid.querySelectorAll('[data-weather-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.weatherStyleToggle;
      var cur = _getWeatherStyle(uid);
      var idx = WEATHER_STYLE_LIST.indexOf(cur);
      var next = WEATHER_STYLE_LIST[(idx + 1) % WEATHER_STYLE_LIST.length];
      _setWeatherStyle(uid, next);
      renderHubBento();
    });
  });

  // Wire sleep style toggle buttons
  grid.querySelectorAll('[data-sleep-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.sleepStyleToggle;
      var cur = _getSleepStyle(uid);
      var idx = SLEEP_STYLE_LIST.indexOf(cur);
      var next = SLEEP_STYLE_LIST[(idx + 1) % SLEEP_STYLE_LIST.length];
      _setSleepStyle(uid, next);
      renderHubBento();
    });
  });


  // Wire calendar style toggle buttons
  grid.querySelectorAll('[data-cal-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.calStyleToggle;
      var cur = _getCalStyle(uid);
      var idx = CAL_STYLE_LIST.indexOf(cur);
      var next = CAL_STYLE_LIST[(idx + 1) % CAL_STYLE_LIST.length];
      _setCalStyle(uid, next);
      renderHubBento();
    });
  });

  // Wire todos style toggle buttons
  grid.querySelectorAll('[data-todos-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.todosStyleToggle;
      var cur = _getTodosStyle(uid);
      var idx = TODOS_STYLE_LIST.indexOf(cur);
      var next = TODOS_STYLE_LIST[(idx + 1) % TODOS_STYLE_LIST.length];
      _setTodosStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-today-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.todayStyleToggle;
      var cur = _getTodayStyle(uid);
      var idx = TODAY_STYLE_LIST.indexOf(cur);
      var next = TODAY_STYLE_LIST[(idx + 1) % TODAY_STYLE_LIST.length];
      _setTodayStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-alarm-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.alarmStyleToggle;
      var cur = _getAlarmStyle(uid);
      var idx = ALARM_STYLE_LIST.indexOf(cur);
      var next = ALARM_STYLE_LIST[(idx + 1) % ALARM_STYLE_LIST.length];
      _setAlarmStyle(uid, next);
      renderHubBento();
    });
  });

  // Wire habits style toggle buttons
  grid.querySelectorAll('[data-habits-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.habitsStyleToggle;
      var cur = _getHabitsStyle(uid);
      var idx = HABITS_STYLE_LIST.indexOf(cur);
      var next = HABITS_STYLE_LIST[(idx + 1) % HABITS_STYLE_LIST.length];
      _setHabitsStyle(uid, next);
      renderHubBento();
    });
  });

  // Wire mood style toggle buttons
  grid.querySelectorAll('[data-mood-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.moodStyleToggle;
      var cur = _getMoodStyle(uid);
      var idx = MOOD_STYLE_LIST.indexOf(cur);
      var next = MOOD_STYLE_LIST[(idx + 1) % MOOD_STYLE_LIST.length];
      _setMoodStyle(uid, next);
      renderHubBento();
    });
  });

  // Wire water style toggle buttons
  grid.querySelectorAll('[data-water-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.waterStyleToggle;
      var cur = _getWaterStyle(uid);
      var idx = WATER_STYLE_LIST.indexOf(cur);
      var next = WATER_STYLE_LIST[(idx + 1) % WATER_STYLE_LIST.length];
      _setWaterStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-timer-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.timerStyleToggle;
      var cur = _getTimerStyle(uid);
      var idx = TIMER_STYLE_LIST.indexOf(cur);
      var next = TIMER_STYLE_LIST[(idx + 1) % TIMER_STYLE_LIST.length];
      _setTimerStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-pomo-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.pomoStyleToggle;
      var cur = _getPomoStyle(uid);
      var idx = POMO_STYLE_LIST.indexOf(cur);
      var next = POMO_STYLE_LIST[(idx + 1) % POMO_STYLE_LIST.length];
      _setPomoStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-notes-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.notesStyleToggle;
      var cur = _getNotesStyle(uid);
      var idx = NOTES_STYLE_LIST.indexOf(cur);
      var next = NOTES_STYLE_LIST[(idx + 1) % NOTES_STYLE_LIST.length];
      _setNotesStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-links-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.linksStyleToggle;
      var cur = _getLinksStyle(uid);
      var idx = LINKS_STYLE_LIST.indexOf(cur);
      var next = LINKS_STYLE_LIST[(idx + 1) % LINKS_STYLE_LIST.length];
      _setLinksStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-quote-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.quoteStyleToggle;
      var cur = _getQuoteStyle(uid);
      var idx = QUOTE_STYLE_LIST.indexOf(cur);
      var next = QUOTE_STYLE_LIST[(idx + 1) % QUOTE_STYLE_LIST.length];
      _setQuoteStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-cd-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.cdStyleToggle;
      var cur = _getCdStyle(uid);
      var idx = CD_STYLE_LIST.indexOf(cur);
      var next = CD_STYLE_LIST[(idx + 1) % CD_STYLE_LIST.length];
      _setCdStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-pri-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.priStyleToggle;
      var cur = _getPriStyle(uid);
      var idx = PRI_STYLE_LIST.indexOf(cur);
      var next = PRI_STYLE_LIST[(idx + 1) % PRI_STYLE_LIST.length];
      _setPriStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-prog-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.progStyleToggle;
      var cur = _getProgStyle(uid);
      var idx = PROG_STYLE_LIST.indexOf(cur);
      var next = PROG_STYLE_LIST[(idx + 1) % PROG_STYLE_LIST.length];
      _setProgStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-goals-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.goalsStyleToggle;
      var cur = _getGoalsStyle(uid);
      var idx = GOALS_STYLE_LIST.indexOf(cur);
      var next = GOALS_STYLE_LIST[(idx + 1) % GOALS_STYLE_LIST.length];
      _setGoalsStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-img-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.imgStyleToggle;
      var cur = _getImgStyle(uid);
      var idx = IMG_STYLE_LIST.indexOf(cur);
      var next = IMG_STYLE_LIST[(idx + 1) % IMG_STYLE_LIST.length];
      _setImgStyle(uid, next);
      renderHubBento();
    });
  });

  grid.querySelectorAll('[data-hw-style-toggle]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var uid = this.dataset.hwStyleToggle;
      var cur = _getHwStyle(uid);
      var idx = HW_STYLE_LIST.indexOf(cur);
      var next = HW_STYLE_LIST[(idx + 1) % HW_STYLE_LIST.length];
      _setHwStyle(uid, next);
      renderHubBento();
    });
  });

  [['[data-upcoming-style-toggle]','upcomingStyleToggle',UPCOMING_STYLE_LIST,_getUpcomingStyle,_setUpcomingStyle],
   ['[data-streak-style-toggle]','streakStyleToggle',STREAK_STYLE_LIST,_getStreakStyle,_setStreakStyle],
   ['[data-budget-style-toggle]','budgetStyleToggle',BUDGET_STYLE_LIST,_getBudgetStyle,_setBudgetStyle],
   ['[data-aq-style-toggle]','aqStyleToggle',AQ_STYLE_LIST,_getAqStyle,_setAqStyle],
   ['[data-wc-style-toggle]','wcStyleToggle',WC_STYLE_LIST,_getWcStyle,_setWcStyle],
   ['[data-savings-style-toggle]','savingsStyleToggle',SAVINGS_STYLE_LIST,_getSavingsStyle,_setSavingsStyle],
   ['[data-focus-style-toggle]','focusStyleToggle',FOCUS_STYLE_LIST,_getFocusStyle,_setFocusStyle],
   ['[data-currency-style-toggle]','currencyStyleToggle',CURRENCY_STYLE_LIST,_getCurrencyStyle,_setCurrencyStyle],
   ['[data-calc-style-toggle]','calcStyleToggle',CALC_STYLE_LIST,_getCalcStyle,_setCalcStyle],
   ['[data-breath-style-toggle]','breathStyleToggle',BREATH_STYLE_LIST,_getBreathStyle,_setBreathStyle],
   ['[data-read-style-toggle]','readStyleToggle',READ_STYLE_LIST,_getReadStyle,_setReadStyle],
   ['[data-doodle-style-toggle]','doodleStyleToggle',DOODLE_STYLE_LIST,_getDoodleStyle,_setDoodleStyle],
   ['[data-gh-style-toggle]','ghStyleToggle',GH_STYLE_LIST,_getGhStyle,_setGhStyle]
  ].forEach(function(cfg) {
    grid.querySelectorAll(cfg[0]).forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var uid = this.dataset[cfg[1]];
        var cur = cfg[3](uid);
        var idx = cfg[2].indexOf(cur);
        cfg[4](uid, cfg[2][(idx + 1) % cfg[2].length]);
        renderHubBento();
      });
    });
  });

  grid.querySelectorAll('[data-text-font-select]').forEach(function(sel) {
    sel.addEventListener('change', function(e) {
      e.stopPropagation();
      var uid = this.dataset.textFontSelect;
      _setTextStyle(uid, this.value);
      renderHubBento();
    });
    sel.addEventListener('click', function(e) { e.stopPropagation(); });
  });

  if (isEdit) {
    // Done Editing button (fixed bottom)
    var doneBtn = document.createElement('button');
    doneBtn.className = 'bento-edit-done-btn';
    doneBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Done Editing';
    grid.appendChild(doneBtn);
    doneBtn.addEventListener('click', function() { toggleHubEdit(); });
    updateUndoButtons();

    // Register grid-level event listeners only once (guard via _hubEventsWired)
    if (!grid._hubEventsWired) {
      grid._hubEventsWired = true;

      // Right-click paste support for contenteditable fields only
      grid.addEventListener('contextmenu', function(e) {
        var editable = e.target.closest('[contenteditable]');
        if (editable) return; // allow default paste context menu on contenteditable
        e.preventDefault();
      });

      // Selection click handler — click a bubble to select, click elsewhere to deselect
      grid.addEventListener('click', function(e) {
        if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
        if (!hubEditMode) return;
        var bubble = e.target.closest('.bento-bubble');
        if (!bubble) { grid.querySelectorAll('.bento-bubble.selected').forEach(function(b) { b.classList.remove('selected'); }); return; }
        // Don't select when clicking interactive elements inside the bubble
        if (e.target.closest('button, a, input, select, textarea, iframe, [contenteditable], [data-remove-bubble], [data-duplicate-bubble], [data-clock-style-toggle], [data-weather-style-toggle], [data-sleep-style-toggle], [data-expense-style-toggle], [data-cal-style-toggle], [data-todos-style-toggle], [data-habits-style-toggle], [data-mood-style-toggle], [data-water-style-toggle], [data-timer-style-toggle], [data-pomo-style-toggle], [data-notes-style-toggle], [data-links-style-toggle], [data-quote-style-toggle], [data-cd-style-toggle], [data-pri-style-toggle], [data-prog-style-toggle], [data-goals-style-toggle], [data-img-style-toggle], [data-hw-style-toggle], [data-alarm-style-toggle], [data-today-style-toggle], [data-upcoming-style-toggle], [data-streak-style-toggle], [data-budget-style-toggle], [data-aq-style-toggle], [data-wc-style-toggle], [data-upcoming-days], [data-budget-input], [data-aq-refresh], [data-wc-del], [data-wc-add-select], [data-wc-add-btn], [data-text-font-select], [data-headlines-source], [data-habit-toggle], [data-timer-action], [data-timer-preset], [data-pomo-action], [data-ss-log], [data-cal-nav], [data-quote-shuffle], [data-water-toggle], [data-mood-pick], [data-expense-amt], [data-expense-cat], [data-expense-type], [data-expense-add], [data-cd-date], [data-cd-label], [data-crypto-refresh], [data-crypto-edit], [data-hw-due], [data-accent-popup], [data-st-toggle-subj], [data-st-toggle-chap], [data-st-toggle-item], [data-st-add-subject], [data-st-add-chapter], [data-st-add-item], [data-st-del-subject], [data-st-del-chapter], [data-st-del-item], [data-st-color], [data-breath-style-toggle], [data-grat-style-toggle], [data-read-style-toggle], [data-doodle-style-toggle], [data-gh-style-toggle], [data-breath-toggle], [data-breath-reset], [data-breath-pattern], [data-doodle-color], [data-doodle-clear], [data-read-toggle], [data-gratitude], [data-gh-refresh], [data-gh-user], .w-doodle-canvas, .mv-canvas, .cpop, .bento-toolbar, .bento-toolbar-remove, .bento-toolbar-style, .bento-tool-btn, .bento-resize-handle, .bento-resize-edge, .w-add-btn, .hub-edit-item-btn, .w-st-add-inline')) return;
        var wasSelected = bubble.classList.contains('selected');
        grid.querySelectorAll('.bento-bubble.selected').forEach(function(b) { b.classList.remove('selected'); });
        if (!wasSelected) bubble.classList.add('selected');
      });

      // Bubble context menu (right-click)
      grid.addEventListener('contextmenu', function(e) {
      var editable = e.target.closest('[contenteditable]');
      if (editable) return; // allow default paste menu
      // Handles/buttons area -> snap preset menu handles this, skip bubble menu
        if (e.target.closest('.bento-toolbar, .bento-toolbar-remove, .bento-toolbar-style, .bento-tool-btn')) return;
      var bubble = e.target.closest('.bento-bubble');
      if (!bubble) { e.preventDefault(); return; }
      e.preventDefault();
      // Remove existing context menus
      var old = grid.querySelector('.bento-context-menu');
      if (old) old.remove();
      var uid = bubble.dataset.bubble;
      var gridRect = grid.getBoundingClientRect();
      var menu = document.createElement('div');
      menu.className = 'bento-context-menu';
      var mw = 170, mh = 200;
      var ml = Math.min(Math.max(e.clientX - gridRect.left, 4), gridRect.width - mw - 4);
      var mt = Math.min(Math.max(e.clientY - gridRect.top, 4), gridRect.height - mh - 4);
      menu.style.left = ml + 'px';
      menu.style.top = mt + 'px';
      menu.innerHTML =
        '<button data-action="duplicate" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Duplicate</button>' +
        '<button data-action="remove" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>Remove</button>' +
        '<button data-action="reset-size" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Reset Size</button>' +
        '<button data-action="move-front" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="18 15 12 9 6 15"/></svg>Bring Forward</button>' +
        '<button data-action="move-back" data-uid="' + uid + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="6 9 12 15 18 9"/></svg>Send Backward</button>';
      grid.appendChild(menu);

      // Close menu on click anywhere else
      var closeMenu = function(ev) {
        if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', closeMenu); }
      };
      setTimeout(function() { document.addEventListener('mousedown', closeMenu); }, 0);

      // Handle menu actions
      menu.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function(ev) {
          ev.stopPropagation();
          var action = this.dataset.action;
          var uid = this.dataset.uid;
          menu.remove();
          if (action === 'duplicate') {
            var dupBtn = grid.querySelector('[data-duplicate-bubble="' + uid + '"]');
            if (dupBtn) dupBtn.click();
          } else if (action === 'remove') {
            var rmBtn = grid.querySelector('[data-remove-bubble="' + uid + '"]');
            if (rmBtn) rmBtn.click();
          } else if (action === 'reset-size') {
            var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
            var item = layout.find(function(i) { return i.uid === uid; });
            if (item) {
              item.w = snap(280);
    item.h = item.t === 'spotify' ? snap(420) : item.t === 'strava' || item.t === 'flightradar' ? snap(420) : item.t === 'images' ? snap(280 / 1.333) : snap(280);
              item.x = snap(24);
              item.y = snap(24);
              resolveBubbleCollisions(layout);
              hubContent.bentoLayout = layout;
              saveHubContent();
              renderHubBento();
            }
          } else if (action === 'move-front') {
            var el = grid.querySelector('[data-bubble="' + uid + '"]');
            if (el) {
              var maxZ = 0;
              grid.querySelectorAll('.bento-bubble').forEach(function(b) {
                var z = parseInt(b.style.zIndex) || 0;
                if (z > maxZ) maxZ = z;
              });
              el.style.zIndex = maxZ + 1;
            }
          } else if (action === 'move-back') {
            var el = grid.querySelector('[data-bubble="' + uid + '"]');
            if (el) {
              var minZ = 0;
              grid.querySelectorAll('.bento-bubble').forEach(function(b) {
                var z = parseInt(b.style.zIndex) || 0;
                if (z < minZ) minZ = z;
              });
              el.style.zIndex = minZ - 1;
            }
          }
        });
      });
    });
    }
  }

  if (visible.length > 0) {
    var lowest = visible.reduce(function(max, i) { return Math.max(max, i.y + (i.h || 240)); }, 0);
    var trailing = isEdit ? 480 : 24;
    var floor = isEdit ? 800 : 0;
    grid.style.minHeight = Math.min(Math.max(floor, lowest + trailing), MAX_CANVAS_HEIGHT) + 'px';
  } else if (!isEdit) {
    grid.style.minHeight = '400px';
    grid.insertAdjacentHTML('beforeend', '<div class="bento-empty-state"><div class="bento-empty-icon"><svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="32" height="32" rx="4"/><line x1="24" y1="18" x2="24" y2="30"/><line x1="18" y1="24" x2="30" y2="24"/></svg></div><div class="bento-empty-title">Canvas is empty</div><div class="bento-empty-desc">Toggle edit mode and click <strong>Add Bubble</strong> to populate your canvas</div></div>');
  }

  // SAFETY: Ensure grid has content; if somehow empty, force default render
  if (!grid.children.length && hubContent.bentoLayout && hubContent.bentoLayout.length) {
    console.warn('[hub] renderHubBento produced empty grid, forcing default layout');
    hubContent.bentoLayout = defaults.bentoLayout.map(i => ({...i}));
    // Re-render once with defaults
    setTimeout(() => { if (typeof renderHubBento === 'function') renderHubBento(); }, 0);
    return;
  }

  document.querySelectorAll('img[data-image-id]').forEach(el => {
    if (el.dataset.imageId && el.dataset.imageId.indexOf('sidebar-') === 0) return;
    var _url = getImage(el.dataset.imageId);
    if (_url) { el.src = _url; el.style.display = 'block'; }
  });


  // Bottom padding for fixed Done button in edit mode
  grid.style.paddingBottom = isEdit ? '64px' : '';
  // Show dock in edit mode, clean up otherwise
  if (isEdit) {
    syncBubbleDock(grid);
  } else {
    _dockManuallyClosed = false;
    var d = document.querySelector('.bento-bubble-dock[data-bubble-dock]');
    if (d) d.remove();
  }

  // ─── Timer / Pomodoro wiring ──────────────────
  if (!grid._timerWired) {
    grid._timerWired = true;
    grid.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      var inp = (e.target && e.target.closest) ? e.target.closest('.weather-loc-input') : null;
      if (!inp) return;
      e.preventDefault();
      var ww = inp.closest('.weather-widget');
      if (ww) _weatherSearchAndRender(ww, inp.value);
    });
    grid.addEventListener('click', function(e) {
      var shuffleBtn = e.target.closest('[data-quote-shuffle]');
      if (shuffleBtn) {
        var randQ = QUOTE_BANK[Math.floor(Math.random() * QUOTE_BANK.length)];
        hubContent.quote = { text: randQ.text, author: randQ.author, weekNumber: getCurrentWeekNumber() };
        saveHubContent();
        renderHubBento();
        return;
      }
      var weatherRefreshBtn = e.target.closest('[data-weather-refresh]');
      if (weatherRefreshBtn) {
        refreshWeather();
        return;
      }
      var weatherPickBtn = e.target.closest('[data-weather-pick]');
      if (weatherPickBtn) {
        var parts = (weatherPickBtn.getAttribute('data-weather-pick') || '').split(',');
        var plat = parseFloat(parts[0]);
        var plon = parseFloat(parts[1]);
        var pname = weatherPickBtn.getAttribute('data-weather-name') || '';
        if (isFinite(plat) && isFinite(plon)) {
          _setSavedWeatherLoc(plat, plon, pname);
          _weatherFetched = false;
          _weatherLastData = null;
          var pGrid = document.querySelector('.bento-grid');
          if (pGrid) {
            var pWidgets = pGrid.querySelectorAll('.weather-widget[data-weather-uid]');
            pWidgets.forEach(function(w) {
              w.innerHTML = '<div class="weather-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Fetching weather...</span></div>';
            });
            _weatherFetched = true;
            _loadWeatherForCoords(plat, plon, pname, pWidgets);
          }
        }
        return;
      }
      var weatherGoBtn = e.target.closest('[data-weather-loc-go]');
      if (weatherGoBtn) {
        var goWidget = weatherGoBtn.closest('.weather-widget');
        if (goWidget) {
          var goInput = goWidget.querySelector('.weather-loc-input');
          _weatherSearchAndRender(goWidget, goInput ? goInput.value : '');
        }
        return;
      }
      var weatherCancelBtn = e.target.closest('[data-weather-cancel]');
      if (weatherCancelBtn) {
        refreshWeather();
        return;
      }
      var weatherApproxBtn = e.target.closest('[data-weather-approx]');
      if (weatherApproxBtn) {
        var aGrid = document.querySelector('.bento-grid');
        if (aGrid) _fetchWeatherByIP(aGrid.querySelectorAll('.weather-widget[data-weather-uid]'));
        return;
      }
      var weatherEditBtn = e.target.closest('[data-weather-edit]');
      if (weatherEditBtn) {
        var eWidget = weatherEditBtn.closest('.weather-widget');
        _weatherShowLocForm(eWidget);
        return;
      }
      var headlinesRefreshBtn = e.target.closest('[data-headlines-refresh]');
      if (headlinesRefreshBtn) {
        refreshHeadlines();
        return;
      }
      var cryptoRefreshBtn = e.target.closest('[data-crypto-refresh]');
      if (cryptoRefreshBtn) {
        _cryptoLastData = null;
        try { localStorage.removeItem(_cryptoCacheKey); } catch(e) {}
        _cryptoFetched = false;
        var cg = document.querySelector('.bento-grid');
        if (cg) {
          cg.querySelectorAll('.crypto-widget').forEach(function(w) {
            w.innerHTML = '<div class="crypto-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Loading prices...</span></div>';
          });
          _fetchCrypto(cg);
        }
        return;
      }
      var cryptoEditBtn = e.target.closest('[data-crypto-edit]');
      if (cryptoEditBtn) {
        _openCryptoEditor(cryptoEditBtn.dataset.cryptoEdit);
        return;
      }
      var embedSetup = e.target.closest('[data-embed-setup]');
      if (embedSetup) {
        openEmbedSetup(embedSetup.dataset.embedSetup, embedSetup.dataset.embedUid);
        return;
      }
      var presetBtn = e.target.closest('[data-timer-preset]');
      if (presetBtn) {
        var puid = presetBtn.dataset.timerUid;
        if (!puid) return;
        var ps = _timerState(puid);
        var presetSecs = parseInt(presetBtn.dataset.timerPreset);
        ps.target = presetSecs;
        ps.mode = 'countdown';
        ps.elapsed = 0;
        ps.running = false;
        ps.startTs = null;
        _renderTimer(puid);
        _saveTimerStates();
        return;
      }
      var toggleBtn = e.target.closest('[data-timer-action="toggle"]');
      if (toggleBtn) {
        var uid = toggleBtn.dataset.timerUid;
        var s = _timerIntervals[uid];
        if (!s) return;
        if (s.running) {
          s.elapsed = s.elapsed + (Date.now() - s.startTs) / 1000;
          s.startTs = null;
          s.running = false;
          _timerClearTickIfIdle();
        } else {
          if (s.mode === 'countdown' && s.elapsed >= s.target) {
            s.elapsed = 0;
          }
          s.startTs = Date.now();
          s.running = true;
          _startTimerTick();
        }
        _renderTimer(uid);
        _saveTimerStates();
        return;
      }
      var resetBtn = e.target.closest('[data-timer-action="reset"]');
      if (resetBtn) {
        var uid2 = resetBtn.dataset.timerUid;
        var s2 = _timerIntervals[uid2];
        if (s2) { s2.elapsed = 0; s2.running = false; s2.startTs = null; }
        _renderTimer(uid2);
        _saveTimerStates();
        return;
      }
      var pomoToggle = e.target.closest('[data-pomo-action="toggle"]');
      if (pomoToggle) {
        var puid = pomoToggle.dataset.pomoUid;
        var ps = _pomodoroState[puid];
        if (!ps) return;
        if (ps.running) {
          var elapsed = (Date.now() - ps.startTs) / 1000;
          ps.remaining = Math.max(0, ps.remaining - elapsed);
          ps.startTs = null;
          ps.running = false;
          _pomoClearTickIfIdle();
        } else {
          if (ps.remaining <= 0) {
            ps.remaining = ps.total;
          }
          ps.startTs = Date.now();
          ps.running = true;
          if (!_pomodoroState._tick) {
            _pomodoroState._tick = setInterval(function() {
              Object.keys(_pomodoroState).forEach(function(k) {
                if (k === '_tick') return;
                var ps2 = _pomodoroState[k];
                if (!ps2.running || !ps2.startTs) return;
                var now = Date.now();
                var elapsed = now - ps2.startTs;
                ps2.startTs = now;
                ps2.remaining = Math.max(0, ps2.remaining - elapsed / 1000);
                if (ps2.remaining <= 0) {
                  ps2.running = false;
                  ps2.startTs = null;
                  ps2.remaining = 0;                  _playPomoAlert('focus');
                  _advancePomoPhase(k);
                }
                _renderPomo(k);
              });
              _savePomoStates();
            }, 200);
          }
        }
        _renderPomo(puid);
        return;
      }
      var pomoReset = e.target.closest('[data-pomo-action="reset"]');
      if (pomoReset) {
        var puidR = pomoReset.dataset.pomoUid;
        var psR = _pomodoroState[puidR];
        if (psR) {
          psR.running = false;
          psR.startTs = null;
          psR.phase = 'focus';
          psR.total = 1500;
          psR.remaining = 1500;
          psR.cycle = 0;
        }
        _pomoClearTickIfIdle();
        _renderPomo(puidR);
        _savePomoStates();
        return;
      }
      var pomoSkip = e.target.closest('[data-pomo-action="skip"]');
      if (pomoSkip) {
        var puid2 = pomoSkip.dataset.pomoUid;
        var ps2 = _pomodoroState[puid2];
        if (ps2) {
          ps2.running = false;
          ps2.startTs = null;
          _advancePomoPhase(puid2);
        }
        _pomoClearTickIfIdle();
        _renderPomo(puid2);
        _savePomoStates();
        return;
      }
      var ssLogBtn = e.target.closest('[data-ss-log]');
      if (ssLogBtn) {
        if (typeof openSleepLogModal === 'function') openSleepLogModal();
        return;
      }
      var ssWidget = e.target.closest('.ss-widget[data-ss-open]');
      if (ssWidget && !hubEditMode && !e.target.closest('[data-ss-log]')) {
        if (typeof openSleepLogModal === 'function') openSleepLogModal();
        return;
      }
      var modeBtn = e.target.closest('[data-timer-action="mode"]');
      if (modeBtn) {
        var muid = modeBtn.dataset.timerUid;
        var ms = _timerState(muid);
        if (!ms) return;
        ms.mode = ms.mode === 'countdown' ? 'countup' : 'countdown';
        ms.target = ms.mode === 'countdown' ? ms.target : 0;
        ms.elapsed = 0;
        ms.running = false;
        ms.startTs = null;
        _renderTimer(muid);
        _saveTimerStates();
        return;
      }
    });
  }

  // ─── Clock updater ────────────────────────────
  const clockFaces = grid.querySelectorAll('.clock-face[data-clock-uid]');
  if (clockFaces.length > 0) {
    if (_clockInterval) {
    } else {
      var _calMonthCheck = -1;
      _clockInterval = setInterval(function() {
      const n = new Date();
      const hh = String(n.getHours()).padStart(2,'0');
      const mm = String(n.getMinutes()).padStart(2,'0');
      const ss = String(n.getSeconds()).padStart(2,'0');
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dateStr = days[n.getDay()] + ', ' + months[n.getMonth()] + ' ' + n.getDate();
      document.querySelectorAll('.clock-face[data-clock-uid]').forEach(function(el) {
        var style = el.dataset.clockStyle || 'digital';
        if (style === 'analog') {
          var h = n.getHours(), m = n.getMinutes(), s = n.getSeconds();
          var hourDeg = (h % 12) * 30 + m * 0.5;
          var minDeg = m * 6;
          var secDeg = s * 6;
          var hh2 = el.querySelector('.clock-hour-hand');
          var mm2 = el.querySelector('.clock-min-hand');
          var ss2 = el.querySelector('.clock-sec-hand');
          if (hh2) hh2.style.transform = 'rotate(' + hourDeg + 'deg)';
          if (mm2) mm2.style.transform = 'rotate(' + minDeg + 'deg)';
          if (ss2) ss2.style.transform = 'rotate(' + secDeg + 'deg)';
          var dateEl = el.querySelector('.clock-date');
          if (dateEl) dateEl.textContent = dateStr;
        } else if (style === 'minimal') {
          var hEl = el.querySelector('.clock-minimal-h');
          var mEl = el.querySelector('.clock-minimal-m');
          if (hEl) hEl.textContent = hh;
          if (mEl) mEl.textContent = mm;
          var dateEl = el.querySelector('.clock-date');
          if (dateEl) dateEl.textContent = dateStr;
        } else if (style === 'flip') {
          el.querySelectorAll('.clock-flip-val').forEach(function(span, i) {
            span.textContent = i === 0 ? hh : i === 1 ? mm : ss;
          });
          var dateEl = el.querySelector('.clock-date');
          if (dateEl) dateEl.textContent = dateStr;
        } else if (style === 'split') {
          var nums = el.querySelectorAll('.clock-split-num');
          if (nums[0]) nums[0].textContent = hh;
          if (nums[1]) nums[1].textContent = mm;
          if (nums[2]) nums[2].textContent = ss;
          var dateEl = el.querySelector('.clock-date');
          if (dateEl) dateEl.textContent = dateStr;
        } else {
          var timeEl = el.querySelector('.clock-time');
          var secEl = el.querySelector('.clock-seconds');
          var dateEl = el.querySelector('.clock-date');
          if (timeEl) timeEl.textContent = hh + ':' + mm;
          if (secEl) secEl.textContent = ss;
          if (dateEl) dateEl.textContent = dateStr;
        }
      });
      var cm = n.getMonth() + n.getFullYear() * 12;
      if (_calMonthCheck >= 0 && _calMonthCheck !== cm && grid.querySelector('.cal-nav')) {
        renderHubBento();
      }
      _calMonthCheck = cm;
    }, 1000);
    }
  } else if (_clockInterval) {
    // No clock widget left on the canvas — stop the 1s tick.
    clearInterval(_clockInterval);
    _clockInterval = null;
  }

  // ─── Weather fetcher (runs at most once) ──────
  _fetchWeather(grid);

  // ─── Headlines fetcher ────────────────────────
  _fetchHeadlines(grid);

  // ─── Crypto fetcher ────────────────────────
  _fetchCrypto(grid);

  // ─── Air quality fetcher ────────────────────
  _fetchAirQuality(grid);


  // ─── Currency rates fetcher ─────────────────
  _fetchCurrency(grid);

  // ─── Doodle canvases ────────────────────────
  _initDoodles(grid);

  // ─── GitHub profile fetcher ─────────────────
  _fetchGithub(grid);

  // ─── Widget pack fetchers ───────────────────
  _ptFetch(grid);
  _ptStartTicker();
  _qkFetch(grid);
  _friendsLiveFetch(grid);

  // ─── Widget pack 2 fetchers ─────────────────

  // ─── Music visualiser canvases ──────────────
  _initMusicViz(grid);

  // ─── World clock tick ───────────────────────
  if (grid.querySelector('.w-wc-wrap')) {
    if (!_wclInterval) {
      _wclInterval = setInterval(function() {
        document.querySelectorAll('[data-wc-time]').forEach(function(el) {
          el.textContent = _wclTime(el.dataset.wcTime);
        });
      }, 1000);
    }
  } else if (_wclInterval) {
    clearInterval(_wclInterval);
    _wclInterval = null;
  }

  // Wire headlines source selects (edit mode only, re-created each render)
  grid.querySelectorAll('[data-headlines-source]').forEach(function(sel) {
    sel.addEventListener('click', function(e) { e.stopPropagation(); });
    sel.addEventListener('change', function() {
      _setHeadlineSource(sel.value);
      renderHubBento();
    });
  });

  // Budget monthly input (edit mode, re-created each render)
  grid.querySelectorAll('[data-budget-input]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('change', function() {
      var v = Math.max(0, parseFloat(inp.value) || 0);
      if (!hubContent.budget) hubContent.budget = { monthly: 0 };
      hubContent.budget.monthly = v;
      saveHubContent();
      renderHubBento();
    });
  });

  // World clock add-select (edit mode)
  grid.querySelectorAll('[data-wc-add-select]').forEach(function(sel) {
    sel.addEventListener('click', function(e) { e.stopPropagation(); });
  });

  // Money flow payday input (edit mode, re-created each render)
  grid.querySelectorAll('[data-mf-payday]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('change', function() {
      var v = parseInt(inp.value, 10);
      if (!(v >= 1 && v <= 28)) v = 25;
      if (!hubContent.moneyflow) hubContent.moneyflow = {};
      hubContent.moneyflow.payday = v;
      saveHubContent();
      renderHubBento();
    });
  });

  // ─── Widget pack 2: grades target (edit mode) ───
  grid.querySelectorAll('[data-gr-target]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('change', function() {
      var v = parseFloat(inp.value);
      if (!hubContent.grades) hubContent.grades = { target: 85, subjects: {} };
      hubContent.grades.target = isFinite(v) ? Math.max(0, Math.min(100, v)) : 85;
      saveHubContent();
      renderHubBento();
    });
  });

  // ─── Widget pack 2: attendance allowed absence percent (edit mode) ───
  grid.querySelectorAll('[data-att-allowed]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('change', function() {
      var v = parseFloat(inp.value);
      if (!hubContent.attendance) hubContent.attendance = { allowedPct: 20, subjects: {} };
      hubContent.attendance.allowedPct = isFinite(v) ? Math.max(0, Math.min(50, v)) : 20;
      saveHubContent();
      renderHubBento();
    });
  });

  // ─── Widget pack 2: keep edit inputs from starting a bubble drag ───
  grid.querySelectorAll('.wp-edit input, .wp-edit select, .wp-fc-btns button, .wp-att-btns button').forEach(function(el) {
    el.addEventListener('click', function(e) { e.stopPropagation(); });
  });

  // Savings goal inputs (edit mode)
  grid.querySelectorAll('[data-savings-name], [data-savings-target], [data-savings-saved]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('change', function() {
      if (!hubContent.savings) hubContent.savings = { name: 'Savings Goal', target: 5000, saved: 0 };
      if (inp.hasAttribute('data-savings-name')) hubContent.savings.name = (inp.value || '').slice(0, 40) || 'Savings Goal';
      else if (inp.hasAttribute('data-savings-target')) hubContent.savings.target = Math.max(0, parseFloat(inp.value) || 0);
      else hubContent.savings.saved = Math.max(0, parseFloat(inp.value) || 0);
      saveHubContent();
      renderHubBento();
    });
  });

  // Focus session minutes (edit mode)
  grid.querySelectorAll('[data-focus-minutes]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('change', function() {
      var v = parseInt(inp.value, 10);
      if (!isNaN(v) && v > 0) { if (!hubContent.focusCfg) hubContent.focusCfg = { sessionMinutes: 25 }; hubContent.focusCfg.sessionMinutes = Math.min(240, v); }
      saveHubContent();
      renderHubBento();
    });
  });

  // Breathing pattern select (edit mode)
  grid.querySelectorAll('[data-breath-pattern]').forEach(function(sel) {
    sel.addEventListener('click', function(e) { e.stopPropagation(); });
    sel.addEventListener('change', function() {
      var cfg = _breathCfg();
      cfg.pattern = sel.value;
      saveHubContent();
      renderHubBento();
    });
  });


  // GitHub username (edit mode)
  grid.querySelectorAll('[data-gh-user]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
    inp.addEventListener('change', function() {
      if (!hubContent.github) hubContent.github = { username: '' };
      hubContent.github.username = (inp.value || '').trim().slice(0, 39);
      saveHubContent();
      renderHubBento();
    });
  });

  // Currency controls
  grid.querySelectorAll('[data-cur-from]').forEach(function(sel) {
    sel.addEventListener('click', function(e) { e.stopPropagation(); });
    sel.addEventListener('change', function() {
      if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 };
      hubContent.currency.from = sel.value;
      saveHubContent();
      renderHubBento();
    });
  });
  grid.querySelectorAll('[data-cur-to]').forEach(function(sel) {
    sel.addEventListener('click', function(e) { e.stopPropagation(); });
    sel.addEventListener('change', function() {
      if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 };
      hubContent.currency.to = sel.value;
      saveHubContent();
      renderHubBento();
    });
  });
  grid.querySelectorAll('[data-cur-amount]').forEach(function(inp) {
    inp.addEventListener('click', function(e) { e.stopPropagation(); });
    inp.addEventListener('input', function() {
      if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 };
      hubContent.currency.amount = Math.max(0, parseFloat(inp.value) || 0);
      saveHubContent();
      var w = inp.closest('.cur-widget');
      if (w) updateCurrencyWidget(w, hubContent.currency.from, _curRates[hubContent.currency.from] || {});
    });
  });

  // ─── Progress auto-refresh ─────────────────────
  if (grid.querySelector('.prog-chart')) {
    if (!_progressRefreshInterval) {
      _progressRefreshInterval = setInterval(function() {
        if (_bubbleDragData || _bubbleResizeData) return;
        refreshProgressWidget();
      }, 15000);
    }
  } else if (_progressRefreshInterval) {
    clearInterval(_progressRefreshInterval);
    _progressRefreshInterval = null;
  }

  var _needsLive = !!(grid.querySelector('.w-alarm-wrap') || grid.querySelector('.w-today-wrap') || grid.querySelector('.w-upcoming-wrap'));
  if (_needsLive && !_hubLiveTick) {
    _hubLiveDay = _hubTodayKey();
    _hubLiveTick = setInterval(function() {
      if (_bubbleDragData || _bubbleResizeData) return;
      var ae = document.activeElement;
      var typing = ae && ae !== document.body && (ae.isContentEditable || (ae.tagName && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)));
      if (typing) { _checkAlarms(true); return; }
      if (_hubTodayKey() !== _hubLiveDay) { _hubLiveDay = _hubTodayKey(); renderHubBento(); return; }
      _checkAlarms(false);
    }, 30000);
  } else if (!_needsLive && _hubLiveTick) {
    clearInterval(_hubLiveTick);
    _hubLiveTick = null;
  }

  if (grid && !grid._alarmWired) {
    grid._alarmWired = true;
    grid.addEventListener('change', function(ev) {
      var _tgt = ev.target && ev.target.closest ? ev.target : null;
      if (!_tgt) return;
      var _arow = _tgt.closest ? _tgt.closest('[data-alarm-id]') : null;
      var _abub = _tgt.closest ? _tgt.closest('.bento-bubble') : null;
      var _auid2 = _abub ? _abub.dataset.bubble : null;
      var _aid2 = _arow ? _arow.dataset.alarmId : null;
      var _at = _tgt.closest ? _tgt.closest('[data-alarm-time]') : null;
      if (_at && _auid2 && _aid2) {
        var _ap2 = _alarmItem(_auid2);
        var _al2 = _alarmList(_ap2);
        for (var _k = 0; _k < _al2.length; _k++) {
          if (_al2[_k].id === _aid2) {
            _al2[_k].time = /^\d{2}:\d{2}$/.test(_at.value) ? _at.value : '';
            if (_al2[_k].enabled === false && _al2[_k].time) _al2[_k].enabled = true;
            _al2[_k].lastFired = '';
            _al2[_k].ringing = 0;
            _al2[_k].snoozeUntil = 0;
          }
        }
        _alarmPersist(_auid2, _al2);
        renderHubBento();
        return;
      }
      var _albl = _tgt.closest ? _tgt.closest('[data-alarm-label]') : null;
      if (_albl && _auid2 && _aid2) {
        var _ap3 = _alarmItem(_auid2);
        var _al3 = _alarmList(_ap3);
        for (var _k2 = 0; _k2 < _al3.length; _k2++) {
          if (_al3[_k2].id === _aid2) _al3[_k2].label = String(_albl.value || '').slice(0, 40);
        }
        _alarmPersist(_auid2, _al3);
        return;
      }
      var _arep = _tgt.closest ? _tgt.closest('[data-alarm-repeat]') : null;
      if (_arep && _auid2 && _aid2) {
        var _ap4 = _alarmItem(_auid2);
        var _al4 = _alarmList(_ap4);
        for (var _k3 = 0; _k3 < _al4.length; _k3++) {
          if (_al4[_k3].id === _aid2) {
            _al4[_k3].repeat = _arep.value === 'daily' ? 'daily' : 'once';
            _al4[_k3].lastFired = '';
            _al4[_k3].ringing = 0;
            _al4[_k3].snoozeUntil = 0;
          }
        }
        _alarmPersist(_auid2, _al4);
        renderHubBento();
        return;
      }
      var _asnd = _tgt.closest ? _tgt.closest('[data-alarm-sound]') : null;
      if (_asnd && _auid2 && _aid2) {
        var _ap5 = _alarmItem(_auid2);
        var _al5 = _alarmList(_ap5);
        for (var _k4 = 0; _k4 < _al5.length; _k4++) {
          if (_al5[_k4].id === _aid2) _al5[_k4].sound = String(_asnd.value || '');
        }
        _alarmPersist(_auid2, _al5);
        return;
      }
      var _avol = _tgt.closest ? _tgt.closest('[data-alarm-vol]') : null;
      if (_avol && _auid2 && _aid2) {
        var _ap6 = _alarmItem(_auid2);
        var _al6 = _alarmList(_ap6);
        for (var _k5 = 0; _k5 < _al6.length; _k5++) {
          if (_al6[_k5].id === _aid2) _al6[_k5].volume = Math.max(0, Math.min(100, parseInt(_avol.value, 10) || 0));
        }
        _alarmPersist(_auid2, _al6);
        return;
      }
    });
    grid.addEventListener('keydown', function(ev) {
      if (ev.key !== 'Enter') return;
      var _tin = ev.target && ev.target.closest ? ev.target.closest('[data-today-add]') : null;
      if (!_tin) return;
      ev.preventDefault();
      _todayQuickAdd(_tin.value);
    });
  }

  setupBubbleDragDrop();
  setupBubbleResize();

  // Global keyboard shortcuts for edit mode
  if (isEdit && !grid._editKeysWired) {
    grid._editKeysWired = true;
    document.addEventListener('keydown', function(e) {
      if (!hubEditMode) return;
      // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y: undo/redo layout changes
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redoCanvas(); else undoCanvas(); return; }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redoCanvas(); return; }
      // Ctrl+D: duplicate selected bubble
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        var sel = grid.querySelector('.bento-bubble.selected');
        if (!sel) return;
        var uid = sel.dataset.bubble;
        var dupBtn = grid.querySelector('[data-duplicate-bubble="' + uid + '"]');
        if (dupBtn) dupBtn.click();
        return;
      }
      // Escape: deselect + close shortcuts panel
      if (e.key === 'Escape') {
        grid.querySelectorAll('.bento-bubble.selected').forEach(function(b) { b.classList.remove('selected'); });
        var sp = document.getElementById('bentoShortcutsPanel');
        if (sp) sp.remove();
        return;
      }
      // Arrow keys: nudge selected bubble
      var arrowMap = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      var dir = arrowMap[e.key];
      if (!dir) return;
      var sel = grid.querySelector('.bento-bubble.selected');
      if (!sel) return;
      e.preventDefault();
      var step = e.shiftKey ? 1 : 20;
      var dx = dir[0] * step;
      var dy = dir[1] * step;
      var x = parseInt(sel.style.left) || 0;
      var y = parseInt(sel.style.top) || 0;
      var w = sel.offsetWidth || parseInt(sel.style.width) || 320;
      var h = sel.offsetHeight || parseInt(sel.style.height) || 240;
      var gridRect = grid.getBoundingClientRect();
      x = Math.max(0, Math.min(x + dx, gridRect.width - w));
      y = Math.max(0, Math.min(y + dy, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - h));
      sel.style.left = x + 'px';
      sel.style.top = y + 'px';
      // Save to layout
      var uid = sel.dataset.bubble;
      var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var item = layout.find(function(i) { return i.uid === uid; });
      if (item) {
        item.x = x;
        item.y = y;
        resolveBubbleCollisions(layout);
        hubContent.bentoLayout = layout;
        // Update pushed bubbles' DOM positions
        layout.forEach(function(it) {
          if (it.uid === uid) return;
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
        });
        saveHubContent();
        updateUndoButtons();
      }
    });
  }
  _fitTextWidgets();
}

/* ─── Canvas Guide popup ──────────────────── */
function showCanvasGuide() {
  var existing = document.getElementById('canvasGuidePanel');
  if (existing) { existing.remove(); return; }

  var overlay = document.createElement('div');
  overlay.className = 'hub-popup-overlay';
  overlay.addEventListener('click', function() { overlay.remove(); var p = document.getElementById('canvasGuidePanel'); if (p) p.remove(); });
  document.body.appendChild(overlay);

  var panel = document.createElement('div');
  panel.className = 'canvas-guide-panel';
  panel.id = 'canvasGuidePanel';
  panel.innerHTML =
    '<div class="canvas-guide-header">' +
      '<span>Canvas Guide</span>' +
      '<button class="canvas-guide-close" id="canvasGuideClose">×</button>' +
    '</div>' +
    '<div class="canvas-guide-body">' +
      '<div class="canvas-guide-section">' +
        '<div class="canvas-guide-section-title">Keyboard Shortcuts</div>' +
        '<div class="bento-shortcut-row"><kbd>Ctrl+Z</kbd><span>Undo layout change</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Ctrl+Shift+Z</kbd><span>Redo layout change</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Ctrl+D</kbd><span>Duplicate selected bubble</span></div>' +
        '<div class="bento-shortcut-row"><kbd>↑ ↓ ← →</kbd><span>Nudge by 20px</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Shift+↑ ↓ ← →</kbd><span>Nudge by 1px</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Escape</kbd><span>Deselect / Cancel drag</span></div>' +
        '<div class="bento-shortcut-row"><kbd>Double-click</kbd><span>Cancel drag / resize</span></div>' +
      '</div>' +
      '<div class="canvas-guide-section">' +
        '<div class="canvas-guide-section-title">Edit Mode</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">1.</span> Click the <strong>Edit</strong> button (✎) in the FAB to toggle edit mode</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">2.</span> <strong>Drag</strong> any widget by its <kbd>⠿</kbd> handle to reposition</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">3.</span> <strong>Resize</strong> by dragging the bottom or corner edges of a widget</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">4.</span> <strong>Edit content</strong> — click text directly in edit mode to type</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">5.</span> Click <strong>Add</strong> (+) in the FAB to add new widgets to the canvas</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">6.</span> Click <strong>Hide</strong> (eye) in the FAB to toggle widget visibility</div>' +
        '<div class="canvas-guide-item"><span class="canvas-guide-bullet">7.</span> Press <kbd>Escape</kbd> or click the Edit button again to exit edit mode</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(panel);

  document.getElementById('canvasGuideClose')?.addEventListener('click', function() { panel.remove(); overlay.remove(); });
}

/* ─── Hub skin (widget style) system ───────────────────────
   A skin is a set of CSS custom properties (--skin-*) defined on the
   [data-hub-skin="<id>"] root. style.css reads those tokens for both the live
   .bento-bubble and the .skin-mini preview, so a skin is declared once.
   The attribute lives on .bento-grid (never on <html>) so a skin cannot leak
   into the sidebar, hero or other pages. Skins that force a dark surface also
   redefine the text and surface tokens on that same root, which keeps the forced
   palette scoped to widgets only. */

var HUB_SKIN_KEY = 'haven-hub-skin';
var _hubSkinId = null;

var HUB_SKINS = [
  { id: 'default',  name: 'Default',  blurb: 'The original card' },
  { id: 'plain',    name: 'Plain',    blurb: 'No chrome, plain label' },
  { id: 'hairline', name: 'Hairline', blurb: 'Ruled ledger, small caps' },
  { id: 'glass',    name: 'Frosted',  blurb: 'Translucent blur' },
  { id: 'paper',    name: 'Paper',    blurb: 'Warm cream, serif' },
  { id: 'clay',     name: 'Clay',     blurb: 'Moulded pastel, lit rim' },
  { id: 'outline',  name: 'Outline',  blurb: 'Dashed wireframe' },
  { id: 'framed',   name: 'Framed',   blurb: 'Plate inside a frame' },
  { id: 'aurora',   name: 'Aurora',   blurb: 'Soft gradient wash' },
  { id: 'halo',     name: 'Halo',     blurb: 'Glow from one corner' },
  { id: 'spine',    name: 'Spine',    blurb: 'Accent bar on the edge' },
  { id: 'inset',    name: 'Inset',    blurb: 'Pressed into the page' },
  { id: 'notch',    name: 'Notch',    blurb: 'Cut top corner' },
  { id: 'pill',     name: 'Pill',     blurb: 'Fully rounded' }
];

function _hubSkinById(id) {
  for (var i = 0; i < HUB_SKINS.length; i++) { if (HUB_SKINS[i].id === id) return HUB_SKINS[i]; }
  return HUB_SKINS[0];
}

function _readHubSkin() {
  var id = HUB_SKINS[0].id;
  try { var v = localStorage.getItem(HUB_SKIN_KEY); if (v) id = _hubSkinById(v).id; } catch (e) {}
  return id;
}

function _paintHubSkin(grid) {
  if (_hubSkinId === null) _hubSkinId = _readHubSkin();
  var g = grid || document.querySelector('.bento-grid');
  if (!g) return;
  if (_hubSkinId === 'default') g.removeAttribute('data-hub-skin');
  else g.setAttribute('data-hub-skin', _hubSkinId);
}

function _markActiveSkin(id) {
  var cards = document.querySelectorAll('.skin-preview');
  for (var i = 0; i < cards.length; i++) {
    if (cards[i].getAttribute('data-skin-id') === id) cards[i].classList.add('is-active');
    else cards[i].classList.remove('is-active');
  }
}

function applyHubSkin(id, silent) {
  var skin = _hubSkinById(id);
  _hubSkinId = skin.id;
  _paintHubSkin();
  _markActiveSkin(skin.id);
  if (!silent) {
    try { safeSetItem(HUB_SKIN_KEY, skin.id); } catch (e) {}
    if (typeof showToast === 'function') showToast('Style: ' + skin.name, 'success', 1400);
  }
}

function _skinPreviewHtml(id) {
  var s = _hubSkinById(id);
  return '<button type="button" class="skin-preview" data-skin-id="' + s.id + '">' +
      '<span class="skin-mini-wrap" data-hub-skin="' + s.id + '">' +
        '<span class="skin-mini">' +
          '<span class="skin-mini-head"><i class="skin-mini-dot"></i><i class="skin-mini-line"></i></span>' +
          '<span class="skin-mini-num">42</span>' +
          '<span class="skin-mini-track"><i></i></span>' +
        '</span>' +
      '</span>' +
      '<span class="skin-preview-name">' + escapeHtml(s.name) + '</span>' +
      '<span class="skin-preview-blurb">' + escapeHtml(s.blurb) + '</span>' +
    '</button>';
}

function showStylePanel() {
  var existing = document.getElementById('hubStylePanel');
  if (existing) {
    existing.remove();
    var prev = document.getElementById('hubStyleOverlay');
    if (prev) prev.remove();
    return;
  }

  var overlay = document.createElement('div');
  overlay.className = 'hub-popup-overlay';
  overlay.id = 'hubStyleOverlay';
  document.body.appendChild(overlay);

  var cards = '';
  for (var i = 0; i < HUB_SKINS.length; i++) cards += _skinPreviewHtml(HUB_SKINS[i].id);

  var panel = document.createElement('div');
  panel.className = 'canvas-guide-panel skin-panel';
  panel.id = 'hubStylePanel';
  panel.innerHTML =
    '<div class="canvas-guide-header">' +
      '<span>Widget style</span>' +
      '<button class="canvas-guide-close" id="hubStyleClose">\u00D7</button>' +
    '</div>' +
    '<div class="canvas-guide-body">' +
      '<div class="skin-grid">' + cards + '</div>' +
    '</div>';
  document.body.appendChild(panel);

  var close = function() { panel.remove(); overlay.remove(); };
  overlay.addEventListener('click', close);
  document.getElementById('hubStyleClose').addEventListener('click', close);

  panel.addEventListener('click', function(ev) {
    var card = ev.target && ev.target.closest ? ev.target.closest('.skin-preview') : null;
    if (!card) return;
    applyHubSkin(card.getAttribute('data-skin-id'));
  });

  _paintHubSkin();
  _markActiveSkin(_hubSkinId);
}

/* ─── Helper: keep add button below lowest widget ── */
function updateAddBtnPosition() {
  // Dock replaces the old add button - keep grid padded for dock visibility
  var g = document.querySelector('.bento-grid');
  if (!g) return;
  var lowest = 0;
  g.querySelectorAll('.bento-bubble').forEach(function(b) {
    var btm = b.offsetTop + b.offsetHeight;
    if (btm > lowest) lowest = btm;
  });
  // Ensure grid is tall enough that dock has room below
  var dockHeight = 80;
  var needed = lowest + dockHeight + 24;
  var currentMin = parseInt(g.style.minHeight) || 0;
  if (needed > currentMin) {
    g.style.minHeight = Math.min(needed, MAX_CANVAS_HEIGHT) + 'px';
  }
}

/* ─── Bubble drag/resize ───────────────────── */
let _bubbleDragData = null;
let _bubbleDragInitialized = false;
let _bubbleResizeData = null;
let _bubbleResizeInitialized = false;
let _dockDragGlobalWired = false;
let _dockGhost = null;
let _dockDragData = null;
let _dockDropPreview = null;
let _dockGrid = null;
let _handleLastClickTime = 0;
let _dragTooltip = null;

function _dockAtPoint(x, y) {
  var dock = document.querySelector('.bento-bubble-dock[data-bubble-dock]');
  if (!dock || !dock.isConnected) return null;
  var r = dock.getBoundingClientRect();
  if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return dock;
  return null;
}

function _setDockRemoveHover(dock, on) {
  document.querySelectorAll('.bento-bubble-dock.dock-remove-hover').forEach(function(d) {
    if (d !== dock) d.classList.remove('dock-remove-hover');
  });
  if (dock) dock.classList.toggle('dock-remove-hover', !!on);
}

function _removeBubbleByUid(uid) {
  var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  var found = layout.some(function(i) { return i.uid === uid; });
  if (!found) return false;
  pushUndoState();
  hubContent.bentoLayout = layout.filter(function(i) { return i.uid !== uid; });
  saveHubContent();
  renderHubBento();
  var grid2 = document.querySelector('.bento-grid');
  if (grid2) syncBubbleDock(grid2);
  updateUndoButtons();
  if (typeof showToast === 'function') showToast('Widget removed — Undo to bring it back', 'success', 2500);
  return true;
}

let _holdPending = null;
let _holdWired = false;
const HOLD_MS = 450;
const HOLD_MOVE_PX = 9;

function _holdExcluded(target) {
  if (!target || !target.closest) return true;
  return !!target.closest('button, a, input, select, textarea, iframe, [contenteditable], .bento-toolbar, .bento-toolbar-remove, .bento-toolbar-style, .bento-tool-btn, .bento-resize-handle, .bento-resize-edge, .w-add-btn, .hub-edit-item-btn, .cpop, .bento-context-menu, .snap-preset-menu, .w-doodle-canvas');
}

function _clearHoldPending() {
  if (_holdPending && _holdPending.timer) clearTimeout(_holdPending.timer);
  _holdPending = null;
}

function _beginHoldDrag(bubble, clientX, clientY) {
  if (_bubbleDragData || !bubble || !bubble.isConnected) return;
  if (typeof hubEditMode !== 'undefined' && !hubEditMode) return;
  var gridEl = document.querySelector('.bento-grid');
  if (!gridEl) return;
  var gr = gridEl.getBoundingClientRect();
  var br = bubble.getBoundingClientRect();
  _bubbleDragData = {
    bubble: bubble,
    offsetX: clientX - br.left,
    offsetY: clientY - br.top,
    gridLeft: gr.left,
    gridTop: gr.top,
    startMouseX: clientX,
    startMouseY: clientY,
    originalX: parseInt(bubble.style.left) || 0,
    originalY: parseInt(bubble.style.top) || 0,
    active: true,
    cancelled: false,
    held: true,
    dragLayout: JSON.parse(JSON.stringify(hubContent.bentoLayout))
  };
  bubble.classList.add('dragging');
  bubble.classList.add('held-drag');
  var _originGhost = document.createElement('div');
  _originGhost.className = 'bento-drag-origin';
  _originGhost.style.left = (bubble.offsetLeft || 0) + 'px';
  _originGhost.style.top = (bubble.offsetTop || 0) + 'px';
  _originGhost.style.width = bubble.offsetWidth + 'px';
  _originGhost.style.height = bubble.offsetHeight + 'px';
  gridEl.appendChild(_originGhost);
  bubble.style.zIndex = '9999';
  bubble.parentNode.appendChild(bubble);
  if (!_dragTooltip) {
    _dragTooltip = document.getElementById('bentoDragTooltip') || document.createElement('div');
    if (!_dragTooltip.id) {
      _dragTooltip.className = 'bento-drag-tooltip';
      _dragTooltip.id = 'bentoDragTooltip';
      document.body.appendChild(_dragTooltip);
    }
  }
  if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer);
  _dragTooltip.textContent = 'Drag out to remove';
  _dragTooltip.style.opacity = '1';
  _dragTooltip.style.display = 'block';
  _dragTooltip.style.left = (clientX + 16) + 'px';
  _dragTooltip.style.top = (clientY - 12) + 'px';
  if (navigator.vibrate) { try { navigator.vibrate(12); } catch (e) {} }
}

function setupBubbleHoldToDrag(grid) {
  if (_holdWired) return;
  _holdWired = true;
  if (!grid) grid = document.querySelector('.bento-grid');
  if (!grid) return;

  grid.addEventListener('mousedown', function(e) {
    if (typeof hubEditMode !== 'undefined' && !hubEditMode) return;
    if (e.button !== 0 || _bubbleDragData || _holdPending) return;
    if (e.target.closest('.bento-tool-move')) return;
    var bubble = e.target.closest('.bento-bubble');
    if (!bubble || _holdExcluded(e.target)) return;
    _holdPending = { bubble: bubble, x: e.clientX, y: e.clientY, kind: 'mouse', timer: null };
    _holdPending.timer = setTimeout(function() {
      var p = _holdPending;
      _holdPending = null;
      if (!p || _bubbleDragData) return;
      if (!p.bubble.isConnected) return;
      _beginHoldDrag(p.bubble, p.x, p.y);
    }, HOLD_MS);
  });

  grid.addEventListener('touchstart', function(e) {
    if (typeof hubEditMode !== 'undefined' && !hubEditMode) return;
    if (e.touches.length !== 1 || _bubbleDragData || _holdPending) return;
    if (e.target.closest('.bento-tool-move')) return;
    var bubble = e.target.closest('.bento-bubble');
    if (!bubble || _holdExcluded(e.target)) return;
    var t = e.touches[0];
    _holdPending = { bubble: bubble, x: t.clientX, y: t.clientY, kind: 'touch', timer: null };
    _holdPending.timer = setTimeout(function() {
      var p = _holdPending;
      _holdPending = null;
      if (!p || _bubbleDragData) return;
      if (!p.bubble.isConnected) return;
      _beginHoldDrag(p.bubble, p.x, p.y);
    }, HOLD_MS);
  }, { passive: true });

  document.addEventListener('mousemove', function(e) {
    if (!_holdPending || _holdPending.kind !== 'mouse') return;
    var dx = e.clientX - _holdPending.x;
    var dy = e.clientY - _holdPending.y;
    if (dx * dx + dy * dy > HOLD_MOVE_PX * HOLD_MOVE_PX) _clearHoldPending();
  });

  document.addEventListener('touchmove', function(e) {
    if (!_holdPending || _holdPending.kind !== 'touch') return;
    if (e.touches.length !== 1) { _clearHoldPending(); return; }
    var t = e.touches[0];
    var dx = t.clientX - _holdPending.x;
    var dy = t.clientY - _holdPending.y;
    if (dx * dx + dy * dy > 144) _clearHoldPending();
  }, { passive: true });

  document.addEventListener('mouseup', _clearHoldPending);
  document.addEventListener('touchend', _clearHoldPending);
  document.addEventListener('touchcancel', _clearHoldPending);
}

function resetBentoInteractions() {
  // Only clear active state — NEVER reset initialization flags,
  // otherwise event listeners get duplicated on each edit toggle.
  _bubbleDragData = null;
  _bubbleResizeData = null;
  if (_dockGhost && _dockGhost.parentNode) _dockGhost.parentNode.removeChild(_dockGhost);
  if (_dockDropPreview && _dockDropPreview.parentNode) _dockDropPreview.parentNode.removeChild(_dockDropPreview);
  _dockGhost = null; _dockDropPreview = null; _dockDragData = null;
  // Clean up dragging and selected classes from any stuck bubbles
  document.querySelectorAll('.bento-bubble.dragging').forEach(function(el) { el.style.zIndex = ''; el.classList.remove('dragging'); el.classList.remove('held-drag'); el.classList.remove('drag-outside'); });
  document.querySelectorAll('.bento-bubble.selected').forEach(function(el) { el.classList.remove('selected'); });
  _setDockRemoveHover(null, false);
  _clearHoldPending();
}

function setupBubbleDragDrop() {
  if (!hubEditMode) return;
  if (_bubbleDragInitialized) return;
  _bubbleDragInitialized = true;

  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  setupBubbleHoldToDrag(grid);

  grid.addEventListener('mousedown', function(e) {
    // Drag can only be initiated from the 6-dots handle
    if (isTouchEvent(e)) return;
    var dragZone = e.target.closest('.bento-tool-move');
    if (!dragZone) return;
    e.preventDefault();
    // Check if touch or mouse drag
    // Double-click on handle cancels any pending/active drag and un-holds the widget
    var now = Date.now();
    if (now - _handleLastClickTime < 400) {
      _handleLastClickTime = 0;
      cancelDrag();
      return;
    }
    _handleLastClickTime = now;
    // Don't start drag if clicking interactive elements inside the zone (but allow the move button itself)
    if (!dragZone.contains(e.target.closest('button, a, input, select, textarea, iframe, [contenteditable], .w-add-btn, .hub-edit-item-btn'))) return;
    const bubble = dragZone.closest('.bento-bubble');
    if (!bubble) return;
    var gr = grid.getBoundingClientRect();
    _bubbleDragData = {
      bubble,
      offsetX: e.clientX - bubble.getBoundingClientRect().left,
      offsetY: e.clientY - bubble.getBoundingClientRect().top,
      gridLeft: gr.left,
      gridTop: gr.top,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      originalX: parseInt(bubble.style.left) || 0,
      originalY: parseInt(bubble.style.top) || 0,
      active: false,
      cancelled: false
    };
  });

  // Cancel helper — restores original position/size
  function cancelDrag() {
    if (_bubbleDragData) {
      if (_bubbleDragData.active) {
        _bubbleDragData.bubble.style.left = _bubbleDragData.originalX + 'px';
        _bubbleDragData.bubble.style.top = _bubbleDragData.originalY + 'px';
        _bubbleDragData.bubble.classList.remove('dragging');
        _bubbleDragData.bubble.classList.remove('held-drag');
        _bubbleDragData.bubble.classList.remove('drag-outside');
        _bubbleDragData.bubble.style.zIndex = '';
        // Remove origin ghost
        var _og = document.querySelector('.bento-drag-origin');
        if (_og) _og.remove();
        // Remove tooltip
        if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
      }
      _bubbleDragData.cancelled = true;
      _bubbleDragData = null;
    }
    _setDockRemoveHover(null, false);
    _clearHoldPending();
    if (_bubbleResizeData) {
      _bubbleResizeData.bubble.style.width = _bubbleResizeData.originalW + 'px';
      _bubbleResizeData.bubble.style.height = _bubbleResizeData.originalH + 'px';
      _bubbleResizeData.cancelled = true;
      _bubbleResizeData.bubble.classList.remove('dragging');
      _bubbleResizeData.bubble.style.zIndex = '';
      var tip = document.querySelector('.bento-resize-tooltip');
      if (tip) tip.style.display = 'none';
      _bubbleResizeData = null;
    }
    updateAddBtnPosition();
  }

  // Double-click on the grid cancels any held drag/resize
  grid.addEventListener('dblclick', function(e) {
    cancelDrag();
  });

  // Touch drag start on handle
  grid.addEventListener('touchstart', function(e) {
    var dragZone = e.target.closest('.bento-tool-move');
    if (!dragZone) return;
    // Only block drag from other interactive elements, not the move button itself
    if (!dragZone.contains(e.target.closest('button, a, input, select, textarea, iframe, [contenteditable], .w-add-btn, .hub-edit-item-btn'))) return;
    const bubble = dragZone.closest('.bento-bubble');
    if (!bubble) return;
    e.preventDefault();
    var gr = grid.getBoundingClientRect();
    var pos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    _bubbleDragData = {
      bubble,
      offsetX: pos.x - bubble.getBoundingClientRect().left,
      offsetY: pos.y - bubble.getBoundingClientRect().top,
      gridLeft: gr.left,
      gridTop: gr.top,
      startMouseX: pos.x,
      startMouseY: pos.y,
      originalX: parseInt(bubble.style.left) || 0,
      originalY: parseInt(bubble.style.top) || 0,
      active: false,
      cancelled: false
    };
  }, { passive: false });

  // Escape cancels drag/resize
  document.addEventListener('keydown', function _escCancel(e) {
    if (e.key === 'Escape' && (_bubbleDragData || _bubbleResizeData)) {
      cancelDrag();
    }
  });

  // Window blur cancels drag/resize (mouseup lost when clicking outside browser)
  window.addEventListener('blur', cancelDrag);

  document.addEventListener('touchmove', function(e) {
    if (!_bubbleDragData || _bubbleDragData.cancelled) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    var t = e.touches[0];
    // Lazily activate drag on first meaningful movement
    if (!_bubbleDragData.active) {
      var dx = t.clientX - _bubbleDragData.startMouseX;
      var dy = t.clientY - _bubbleDragData.startMouseY;
      if (dx * dx + dy * dy < 25) return;
      _bubbleDragData.active = true;
      _bubbleDragData.dragLayout = JSON.parse(JSON.stringify(hubContent.bentoLayout));
      _bubbleDragData.bubble.classList.add('dragging');
      var _originGhost = document.createElement('div');
      _originGhost.className = 'bento-drag-origin';
      _originGhost.style.left = (_bubbleDragData.bubble.offsetLeft || 0) + 'px';
      _originGhost.style.top = (_bubbleDragData.bubble.offsetTop || 0) + 'px';
      _originGhost.style.width = _bubbleDragData.bubble.offsetWidth + 'px';
      _originGhost.style.height = _bubbleDragData.bubble.offsetHeight + 'px';
      _bubbleDragData._originGhost = _originGhost;
      grid.appendChild(_originGhost);
      _bubbleDragData.bubble.style.zIndex = '9999';
      _bubbleDragData.bubble.parentNode.appendChild(_bubbleDragData.bubble);
    }
    var gr = grid.getBoundingClientRect();
    let newX = snap(t.clientX - _bubbleDragData.offsetX - gr.left);
    let newY = Math.max(0, snap(t.clientY - _bubbleDragData.offsetY - gr.top));
    _bubbleDragData.bubble.style.left = newX + 'px';
    _bubbleDragData.bubble.style.top = newY + 'px';
    if (!_dragTooltip) {
      _dragTooltip = document.getElementById('bentoDragTooltip') || document.createElement('div');
      if (!_dragTooltip.id) {
        _dragTooltip.className = 'bento-drag-tooltip';
        _dragTooltip.id = 'bentoDragTooltip';
        document.body.appendChild(_dragTooltip);
      }
    }
    _dragTooltip.textContent = _bubbleDragData.bubble.offsetWidth + ' \u00D7 ' + _bubbleDragData.bubble.offsetHeight;
    if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
    _dragTooltip.style.opacity = '1';
    _dragTooltip.style.display = 'block';
    _dragTooltip.style.left = (t.clientX + 16) + 'px';
    _dragTooltip.style.top = (t.clientY - 12) + 'px';
    const dragLayout = _bubbleDragData.dragLayout;
    const dragItem = dragLayout.find(i => i.uid === _bubbleDragData.bubble.dataset.bubble);
    if (dragItem) {
      dragItem.x = newX;
      dragItem.y = newY;
      updateAddBtnPosition();
    }
    var _overDockT = _dockAtPoint(t.clientX, t.clientY);
    _bubbleDragData.overDock = !!_overDockT;
    _setDockRemoveHover(_overDockT, !!_overDockT);
    if (_dragTooltip && _overDockT) _dragTooltip.textContent = 'Drop to remove';
    var _outT = _bubbleDragData.held && (t.clientX < gr.left - 24 || t.clientX > gr.right + 24 || t.clientY < gr.top - 24 || t.clientY > gr.bottom + 24);
    _bubbleDragData.outsideDelete = !!_outT;
    _bubbleDragData.bubble.classList.toggle('drag-outside', !!_outT);
    if (_dragTooltip && _outT && !_overDockT) _dragTooltip.textContent = 'Release to remove';
  }, { passive: false });

  // Touch end handler for bubble drag
  document.addEventListener('touchend', function(e) {
    if (!_bubbleDragData) { _setDockRemoveHover(null, false); return; }
    if (!_bubbleDragData.active || _bubbleDragData.cancelled) {
      _bubbleDragData = null;
      _setDockRemoveHover(null, false);
      return;
    }
    var _og = document.querySelector('.bento-drag-origin');
    if (_og) _og.remove();
    if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
    _bubbleDragData.bubble.classList.remove('dragging');
    _bubbleDragData.bubble.style.zIndex = '';
    const bubble = _bubbleDragData.bubble;
    var _te = (e.changedTouches && e.changedTouches[0]) || null;
    var _dropDockT = (_te ? _dockAtPoint(_te.clientX, _te.clientY) : null) || (_bubbleDragData.overDock ? document.querySelector('.bento-bubble-dock[data-bubble-dock]') : null);
    _setDockRemoveHover(null, false);
    if (_dropDockT) {
      const uid = bubble.dataset.bubble;
      _bubbleDragData = null;
      _removeBubbleByUid(uid);
      return;
    }
    if (_bubbleDragData.held) {
      var _gxT = grid.getBoundingClientRect();
      var _pxT = _te ? _te.clientX : null;
      var _pyT = _te ? _te.clientY : null;
      var _wasOut = _bubbleDragData.outsideDelete;
      if ((_pxT !== null && (_pxT < _gxT.left - 24 || _pxT > _gxT.right + 24 || _pyT < _gxT.top - 24 || _pyT > _gxT.bottom + 24)) || (_pxT === null && _wasOut)) {
        const uid = bubble.dataset.bubble;
        _bubbleDragData = null;
        _removeBubbleByUid(uid);
        return;
      }
    }
    const gridRect = grid.getBoundingClientRect();
    let x = parseInt(bubble.style.left) || 0;
    let y = parseInt(bubble.style.top) || 0;
    x = Math.max(0, Math.min(snap(x), gridRect.width - (bubble.offsetWidth || parseInt(bubble.style.width) || 280)));
    y = Math.max(0, Math.min(snap(y), Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - (bubble.offsetHeight || parseInt(bubble.style.height) || 240)));
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    const uid = bubble.dataset.bubble;
    const dragLayout = _bubbleDragData.dragLayout;
    const item = dragLayout.find(i => i.uid === uid);
    if (item) {
      item.x = Math.max(0, x);
      item.y = Math.max(0, y);
      resolveBubbleCollisions(dragLayout);
      pushUndoState();
      hubContent.bentoLayout = dragLayout;
      saveHubContent();
      bubble.classList.add('drop-bounce');
      setTimeout(function() { bubble.classList.remove('drop-bounce'); }, 500);
      if (grid) {
        dragLayout.forEach(function(it) {
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
        });
      }
    }
    updateAddBtnPosition();
    updateUndoButtons();
    refreshProgressWidget();
    _bubbleDragData = null;
    bubble.classList.remove('held-drag');
    bubble.classList.remove('drag-outside');
    bubble.classList.remove('selected');
    bubble.setAttribute('data-suppress-click', '1');
    setTimeout(function() { bubble.removeAttribute('data-suppress-click'); }, 50);
  }, { passive: false });

  document.addEventListener('mousemove', function(e) {
    if (!_bubbleDragData || _bubbleDragData.cancelled) return;
    // Lazily activate drag on first meaningful movement (5px threshold)
    if (!_bubbleDragData.active) {
      var dx = e.clientX - _bubbleDragData.startMouseX;
      var dy = e.clientY - _bubbleDragData.startMouseY;
      if (dx * dx + dy * dy < 25) return;
      _bubbleDragData.active = true;
      _bubbleDragData.dragLayout = JSON.parse(JSON.stringify(hubContent.bentoLayout));
      _bubbleDragData.bubble.classList.add('dragging');
      // Create origin ghost marker
      var _originGhost = document.createElement('div');
      _originGhost.className = 'bento-drag-origin';
      var _origRect = _bubbleDragData.bubble.getBoundingClientRect();
      var _gridRect = grid.getBoundingClientRect();
      _originGhost.style.left = (_bubbleDragData.bubble.offsetLeft || 0) + 'px';
      _originGhost.style.top = (_bubbleDragData.bubble.offsetTop || 0) + 'px';
      _originGhost.style.width = _bubbleDragData.bubble.offsetWidth + 'px';
      _originGhost.style.height = _bubbleDragData.bubble.offsetHeight + 'px';
      _bubbleDragData._originGhost = _originGhost;
      grid.appendChild(_originGhost);
      _bubbleDragData.bubble.style.zIndex = '9999';
      _bubbleDragData.bubble.parentNode.appendChild(_bubbleDragData.bubble);
    }
    var gr = grid.getBoundingClientRect();
    let newX = snap(e.clientX - _bubbleDragData.offsetX - gr.left);
    let newY = Math.max(0, snap(e.clientY - _bubbleDragData.offsetY - gr.top));
    _bubbleDragData.bubble.style.left = newX + 'px';
    _bubbleDragData.bubble.style.top = newY + 'px';
    // Update drag tooltip
    if (!_dragTooltip) {
      _dragTooltip = document.getElementById('bentoDragTooltip') || document.createElement('div');
      if (!_dragTooltip.id) {
        _dragTooltip.className = 'bento-drag-tooltip';
        _dragTooltip.id = 'bentoDragTooltip';
        document.body.appendChild(_dragTooltip);
      }
    }
    _dragTooltip.textContent = _bubbleDragData.bubble.offsetWidth + ' \u00D7 ' + _bubbleDragData.bubble.offsetHeight;
        if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
    _dragTooltip.style.opacity = '1';
    _dragTooltip.style.display = 'block';
    _dragTooltip.style.left = (e.clientX + 16) + 'px';
    _dragTooltip.style.top = (e.clientY - 12) + 'px';
    // Update layout for final collision on drop, but don't push other bubbles in real-time
    const dragLayout = _bubbleDragData.dragLayout;
    const dragItem = dragLayout.find(i => i.uid === _bubbleDragData.bubble.dataset.bubble);
    if (dragItem) {
      dragItem.x = newX;
      dragItem.y = newY;
      updateAddBtnPosition();
    }
    var _overDock = _dockAtPoint(e.clientX, e.clientY);
    _bubbleDragData.overDock = !!_overDock;
    _setDockRemoveHover(_overDock, !!_overDock);
    if (_dragTooltip && _overDock) _dragTooltip.textContent = 'Drop to remove';
    var _outM = _bubbleDragData.held && (e.clientX < gr.left - 24 || e.clientX > gr.right + 24 || e.clientY < gr.top - 24 || e.clientY > gr.bottom + 24);
    _bubbleDragData.outsideDelete = !!_outM;
    _bubbleDragData.bubble.classList.toggle('drag-outside', !!_outM);
    if (_dragTooltip && _outM && !_overDock) _dragTooltip.textContent = 'Release to remove';
  });

  document.addEventListener('mouseup', function(e) {
    if (!_bubbleDragData) { _setDockRemoveHover(null, false); return; }
    // If drag was never activated, it was a click — let it pass through
    if (!_bubbleDragData.active || _bubbleDragData.cancelled) {
      _bubbleDragData = null;
      return;
    }
    
        // Remove origin ghost
        var _og = document.querySelector('.bento-drag-origin');
        if (_og) _og.remove();
        // Remove tooltip
        if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
    _bubbleDragData.bubble.classList.remove('dragging');
    _bubbleDragData.bubble.style.zIndex = '';
    const bubble = _bubbleDragData.bubble;
    const dropDock = _dockAtPoint(e.clientX, e.clientY) || (_bubbleDragData.overDock ? document.querySelector('.bento-bubble-dock[data-bubble-dock]') : null);
    _setDockRemoveHover(null, false);
    if (dropDock) {
      const uid = bubble.dataset.bubble;
      var _og2 = document.querySelector('.bento-drag-origin');
      if (_og2) _og2.remove();
      if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
      _bubbleDragData = null;
      _removeBubbleByUid(uid);
      return;
    }
    if (_bubbleDragData.held) {
      var _gxM = grid.getBoundingClientRect();
      if (e.clientX < _gxM.left - 24 || e.clientX > _gxM.right + 24 || e.clientY < _gxM.top - 24 || e.clientY > _gxM.bottom + 24) {
        const uid = bubble.dataset.bubble;
        var _og3 = document.querySelector('.bento-drag-origin');
        if (_og3) _og3.remove();
        if (_dragTooltip) { if (_dragTooltip._hideTimer) clearTimeout(_dragTooltip._hideTimer); _dragTooltip.style.opacity = '0'; _dragTooltip._hideTimer = setTimeout(function() { if (_dragTooltip) { _dragTooltip.style.display = 'none'; _dragTooltip._hideTimer = null; } }, 150); }
        _bubbleDragData = null;
        _removeBubbleByUid(uid);
        return;
      }
    }
    const gridRect = grid.getBoundingClientRect();
    const bRect = bubble.getBoundingClientRect();
    const bw = bRect.width, bh = bRect.height;
    let x = parseInt(bubble.style.left) || 0;
    let y = parseInt(bubble.style.top) || 0;
    x = Math.max(0, Math.min(snap(x), gridRect.width - bw));
    y = Math.max(0, Math.min(snap(y), Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - bh));
    bubble.style.left = x + 'px';
    bubble.style.top = y + 'px';
    const uid = bubble.dataset.bubble;
    // Use the live dragLayout (accumulated from real-time pushes) instead of a fresh copy
    const dragLayout = _bubbleDragData.dragLayout;
    const item = dragLayout.find(i => i.uid === uid);
    if (item) {
      item.x = Math.max(0, x);
      item.y = Math.max(0, y);
      resolveBubbleCollisions(dragLayout);
      pushUndoState();
      hubContent.bentoLayout = dragLayout;
      saveHubContent();
      // Trigger drop-bounce animation
      bubble.classList.add('drop-bounce');
      setTimeout(function() {
        bubble.classList.remove('drop-bounce');
      }, 500);
      // Update all bubbles' DOM positions without full re-render
      if (grid) {
        dragLayout.forEach(function(it) {
          var el = grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) {
            el.style.left = it.x + 'px';
            el.style.top = it.y + 'px';
          }
        });
      }
    }
    updateAddBtnPosition();
    updateUndoButtons();
    refreshProgressWidget();
    _bubbleDragData = null;
    bubble.classList.remove('held-drag');
    bubble.classList.remove('drag-outside');
    bubble.classList.remove('selected');
    bubble.setAttribute('data-suppress-click', '1');
    setTimeout(function() { bubble.removeAttribute('data-suppress-click'); }, 50);
  });
}

function setupBubbleResize() {
  if (!hubEditMode) return;
  if (_bubbleResizeInitialized) return;
  _bubbleResizeInitialized = true;

  const grid = document.querySelector('.bento-grid');
  if (!grid) return;

  // Create resize tooltip
  var resizeTip = document.createElement('div');
  resizeTip.className = 'bento-resize-tooltip';
  document.body.appendChild(resizeTip);

  grid.addEventListener('mousedown', function(e) {
    if (isTouchEvent(e)) return;
    const handle = e.target.closest('[data-resize-bubble]');
    if (!handle) return;
    e.preventDefault();
    e.stopPropagation();
    const bubble = handle.closest('.bento-bubble');
    if (!bubble) return;
    const rect = bubble.getBoundingClientRect();
    var axis = (handle.dataset.resizeAxis || 'se');
    _bubbleResizeData = {
      bubble,
      axis: axis,
      startW: rect.width,
      startH: rect.height,
      originalW: rect.width,
      originalH: rect.height,
      startX: e.clientX,
      startY: e.clientY,
      cancelled: false,
      resizeLayout: JSON.parse(JSON.stringify(normalizeBentoLayout(hubContent.bentoLayout, hubContent))),
      isSpotify: !!bubble.querySelector('.spotify-widget')
    };
    bubble.classList.add('dragging');
    bubble.style.zIndex = '9999';
    bubble.parentNode.appendChild(bubble);
    resizeTip.style.display = 'block';
    resizeTip.textContent = Math.round(rect.width) + ' × ' + Math.round(rect.height);
    resizeTip.style.left = (e.clientX + 12) + 'px';
    resizeTip.style.top = (e.clientY - 32) + 'px';
  });

    // Touch move for resize
  document.addEventListener('touchmove', function(e) {
    if (!_bubbleResizeData) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    const bubble = _bubbleResizeData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const left = parseInt(bubble.style.left) || 0;
    const top = parseInt(bubble.style.top) || 0;
    const dx = t.clientX - _bubbleResizeData.startX;
    const dy = t.clientY - _bubbleResizeData.startY;
    var axis = _bubbleResizeData.axis;
    var curW = _bubbleResizeData.bubble.offsetWidth || parseInt(bubble.style.width) || 320;
    var curH = _bubbleResizeData.bubble.offsetHeight || parseInt(bubble.style.height) || 240;
    if (axis === 'e' || axis === 'se') {
      let newW = snap(Math.max(100, _bubbleResizeData.startW + dx));
      newW = Math.min(newW, gridRect.width - left);
      _bubbleResizeData.bubble.style.width = newW + 'px';
    }
    if (axis === 's' || axis === 'se') {
      var _snapH = _bubbleResizeData.isSpotify ? snapSpotifyHeight : snap;
      var _minH = _bubbleResizeData.isSpotify ? 115 : 80;
      let newH = _snapH(Math.max(_minH, _bubbleResizeData.startH + dy));
      newH = Math.min(newH, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - top);
      _bubbleResizeData.bubble.style.height = newH + 'px';
    }
    var finalW = parseInt(bubble.style.width) || curW;
    var finalH = parseInt(bubble.style.height) || curH;
    var resizeTip = document.querySelector('.bento-resize-tooltip');
    if (resizeTip) {
      resizeTip.textContent = Math.round(finalW) + ' \u00D7 ' + Math.round(finalH);
      resizeTip.style.left = (t.clientX + 12) + 'px';
      resizeTip.style.top = (t.clientY - 32) + 'px';
    }
    var resizeLayout = _bubbleResizeData.resizeLayout;
    var resizeUid = bubble.dataset.bubble;
    var resizeItem = resizeLayout.find(function(i) { return i.uid === resizeUid; });
    if (resizeItem) {
      if (axis === 'e' || axis === 'se') resizeItem.w = finalW;
      if (axis === 's' || axis === 'se') resizeItem.h = finalH;
      updateAddBtnPosition();
    }
  }, { passive: false });

  // Touch end for resize
  document.addEventListener('touchend', function() {
    if (!_bubbleResizeData) return;
    var cancelled = _bubbleResizeData.cancelled;
    _bubbleResizeData.bubble.classList.remove('dragging');
    _bubbleResizeData.bubble.style.zIndex = '';
    if (cancelled) { 
      var tip = document.querySelector('.bento-resize-tooltip');
      if (tip) tip.style.display = 'none'; 
      _bubbleResizeData = null; 
      return; 
    }
    const bubble = _bubbleResizeData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const left = parseInt(bubble.style.left) || 0;
    const top = parseInt(bubble.style.top) || 0;
    var axis = _bubbleResizeData.axis;
    let w = parseInt(bubble.style.width) || 320;
    let h = parseInt(bubble.style.height) || 240;
    w = Math.min(w, gridRect.width - left);
    h = Math.min(h, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - top);
    const uid = bubble.dataset.bubble;
    const layout = JSON.parse(JSON.stringify(hubContent.bentoLayout));
    const item = layout.find(i => i.uid === uid);
    if (item) {
      if (axis === 'e' || axis === 'se') item.w = Math.max(100, snap(w));
      if (axis === 's' || axis === 'se') item.h = item.t === 'spotify' ? Math.max(108.5, snapSpotifyHeight(h)) : Math.max(80, snap(h));
      resolveBubbleCollisions(layout);
      pushUndoState();
      hubContent.bentoLayout = layout;
      saveHubContent();
      var _grid = document.querySelector('.bento-grid');
      if (_grid) {
        layout.forEach(function(it) {
          var el = _grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) { el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; }
        });
      }
    }
    updateAddBtnPosition();
    updateUndoButtons();
    refreshProgressWidget();
    var tip = document.querySelector('.bento-resize-tooltip');
    if (tip) tip.style.display = 'none';
    _bubbleResizeData = null;
    bubble.classList.remove('held-drag');
    bubble.classList.remove('drag-outside');
    bubble.classList.remove('selected');
    bubble.setAttribute('data-suppress-click', '1');
    setTimeout(function() { bubble.removeAttribute('data-suppress-click'); }, 50);
  }, { passive: false });

  document.addEventListener('mousemove', function(e) {
    if (!_bubbleResizeData) return;
    const bubble = _bubbleResizeData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const left = parseInt(bubble.style.left) || 0;
    const top = parseInt(bubble.style.top) || 0;
    const dx = e.clientX - _bubbleResizeData.startX;
    const dy = e.clientY - _bubbleResizeData.startY;
    var axis = _bubbleResizeData.axis;
    var curW = _bubbleResizeData.bubble.offsetWidth || parseInt(bubble.style.width) || 320;
    var curH = _bubbleResizeData.bubble.offsetHeight || parseInt(bubble.style.height) || 240;
    if (axis === 'e' || axis === 'se') {
      let newW = snap(Math.max(100, _bubbleResizeData.startW + dx));
      newW = Math.min(newW, gridRect.width - left);
      _bubbleResizeData.bubble.style.width = newW + 'px';
    }
    if (axis === 's' || axis === 'se') {
      var _snapH = _bubbleResizeData.isSpotify ? snapSpotifyHeight : snap;
      var _minH = _bubbleResizeData.isSpotify ? 115 : 80;
      let newH = _snapH(Math.max(_minH, _bubbleResizeData.startH + dy));
      newH = Math.min(newH, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - top);
      _bubbleResizeData.bubble.style.height = newH + 'px';
    }
    var finalW = parseInt(bubble.style.width) || curW;
    var finalH = parseInt(bubble.style.height) || curH;
    resizeTip.textContent = Math.round(finalW) + ' × ' + Math.round(finalH);
    resizeTip.style.left = (e.clientX + 12) + 'px';
    resizeTip.style.top = (e.clientY - 32) + 'px';
    // Update layout for final collision on drop, but don't push other bubbles in real-time
    var resizeLayout = _bubbleResizeData.resizeLayout;
    var resizeUid = bubble.dataset.bubble;
    var resizeItem = resizeLayout.find(function(i) { return i.uid === resizeUid; });
    if (resizeItem) {
      if (axis === 'e' || axis === 'se') resizeItem.w = finalW;
      if (axis === 's' || axis === 'se') resizeItem.h = finalH;
      updateAddBtnPosition();
    }
  });

  document.addEventListener('mouseup', function() {
    if (!_bubbleResizeData) return;
    var cancelled = _bubbleResizeData.cancelled;
    _bubbleResizeData.bubble.classList.remove('dragging');
    _bubbleResizeData.bubble.style.zIndex = '';
    if (cancelled) { resizeTip.style.display = 'none'; _bubbleResizeData = null; return; }
    const bubble = _bubbleResizeData.bubble;
    const gridRect = grid.getBoundingClientRect();
    const left = parseInt(bubble.style.left) || 0;
    const top = parseInt(bubble.style.top) || 0;
    var axis = _bubbleResizeData.axis;
    let w = parseInt(bubble.style.width) || 320;
    let h = parseInt(bubble.style.height) || 240;
    w = Math.min(w, gridRect.width - left);
    h = Math.min(h, Math.min(gridRect.height, MAX_CANVAS_HEIGHT) - top);
    const uid = bubble.dataset.bubble;
    const layout = JSON.parse(JSON.stringify(hubContent.bentoLayout));
    const item = layout.find(i => i.uid === uid);
    if (item) {
      if (axis === 'e' || axis === 'se') item.w = Math.max(100, snap(w));
      if (axis === 's' || axis === 'se') item.h = item.t === 'spotify' ? Math.max(108.5, snapSpotifyHeight(h)) : Math.max(80, snap(h));
      resolveBubbleCollisions(layout);
      pushUndoState();
      hubContent.bentoLayout = layout;
      saveHubContent();
      // Update pushed bubbles' DOM positions without full re-render
      var _grid = document.querySelector('.bento-grid');
      if (_grid) {
        layout.forEach(function(it) {
          var el = _grid.querySelector('[data-bubble="' + it.uid + '"]');
          if (el) {
            el.style.left = it.x + 'px';
            el.style.top = it.y + 'px';
          }
        });
      }
    }
    updateAddBtnPosition();
    updateUndoButtons();
    refreshProgressWidget();
    _fitTextWidgets();
    resizeTip.style.display = 'none';
    _bubbleResizeData = null;
    bubble.classList.remove('held-drag');
    bubble.classList.remove('drag-outside');
    bubble.classList.remove('selected');
    bubble.setAttribute('data-suppress-click', '1');
    setTimeout(function() { bubble.removeAttribute('data-suppress-click'); }, 50);
  });
}

/* ─── Bubble type icons ────────────────────── */
/* ══════════════════════════════════════════════════════════════════
   WIDGET PACK 2 — grades, attendance, exams, holidays, birthdays,
   flashcards. Local-data only.
   ══════════════════════════════════════════════════════════════════ */

var WP_WINDOW_DAYS = 28;

function _wpTagLabel(id) {
  try { if (typeof TAG_LABELS !== 'undefined' && TAG_LABELS && TAG_LABELS[id]) return TAG_LABELS[id]; } catch (err) {}
  return id;
}

function _wpTagList() {
  var out = [], seen = {};
  function push(id) {
    if (!id || seen[id]) return;
    seen[id] = true;
    out.push({ id: id, label: _wpTagLabel(id) });
  }
  try { if (typeof TAG_ORDER !== 'undefined' && TAG_ORDER && TAG_ORDER.length) TAG_ORDER.forEach(push); } catch (err) {}
  try { if (typeof TAG_LABELS !== 'undefined' && TAG_LABELS) Object.keys(TAG_LABELS).forEach(push); } catch (err) {}
  return out;
}

function _wpNum(v, fallback) {
  var n = parseFloat(v);
  return isFinite(n) ? n : (fallback || 0);
}

function _wpEscape(s) {
  if (typeof escapeHtml === 'function') return escapeHtml(String(s == null ? '' : s));
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function _wpEmpty(msg) {
  return '<div class="wp-empty">' + _wpEscape(msg) + '</div>';
}

function _wpDaysBetween(fromKey, toKey) {
  var a = new Date(String(fromKey) + 'T00:00:00');
  var b = new Date(String(toKey) + 'T00:00:00');
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return NaN;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function _wpPct(n, d) {
  if (!d) return 0;
  return (n / d) * 100;
}

/* ═══════════════════════════ GRADES ═══════════════════════════ */

function _gradesData() {
  var cfg = hubContent.grades || {};
  var subs = cfg.subjects || {};
  var target = Math.max(0, Math.min(100, _wpNum(cfg.target, 85)));
  var rows = [], totalW = 0, totalS = 0;

  _wpTagList().forEach(function(t) {
    var arr = Array.isArray(subs[t.id]) ? subs[t.id] : [];
    var w = 0, s = 0, n = 0;
    arr.forEach(function(g) {
      var v = parseFloat(g && g.v);
      if (!isFinite(v)) return;
      var gw = Math.max(0.1, _wpNum(g.w, 1));
      w += gw; s += v * gw; n += 1;
    });
    var avg = w > 0 ? s / w : null;
    if (avg !== null) { totalW += w; totalS += s; }
    rows.push({ id: t.id, label: t.label, avg: avg, n: n, w: w, sum: s });
  });

  var overall = totalW > 0 ? totalS / totalW : null;

  rows.forEach(function(r) {
    if (r.avg === null) { r.need = null; return; }
    var nw = r.n > 0 ? Math.max(1, r.w / r.n) : 1;
    r.need = (target * (r.w + nw) - r.sum) / nw;
  });

  rows.sort(function(a, b) {
    if (a.avg === null && b.avg === null) return a.label.localeCompare(b.label);
    if (a.avg === null) return 1;
    if (b.avg === null) return -1;
    return a.avg - b.avg;
  });

  return {
    target: target,
    rows: rows,
    overall: overall,
    graded: rows.filter(function(r) { return r.avg !== null; }).length
  };
}

function _gradesRender(d, showAll) {
  if (!d.rows.length) return _wpEmpty('No subjects yet. Add categories on the Schedule page first.');

  var head = '<div class="wp-hero">' +
    '<span class="wp-hero-val">' + (d.overall === null ? '—' : d.overall.toFixed(1)) + '</span>' +
    '<span class="wp-hero-lbl">weighted average · target ' + d.target + '</span>' +
    '</div>';

  var visible = d.rows.filter(function(r) { return r.avg !== null || showAll; });
  if (!visible.length) return head + _wpEmpty('No grades yet — add one in edit mode.');

  var rows = visible.map(function(r) {
    if (r.avg === null) {
      return '<div class="wp-row wp-row-empty">' +
        '<span class="wp-row-name">' + _wpEscape(r.label) + '</span>' +
        '<span class="wp-row-val wp-muted">no grades</span></div>';
    }
    var tone = r.avg >= d.target ? 'ok' : (r.avg >= d.target - 5 ? 'warn' : 'bad');
    var need = '';
    if (r.need !== null) {
      if (r.need > 100) need = '<span class="wp-need wp-tone-bad">needs ' + r.need.toFixed(0) + ' — out of reach</span>';
      else if (r.need <= 0) need = '<span class="wp-need wp-tone-ok">target secured</span>';
      else need = '<span class="wp-need">needs ' + r.need.toFixed(0) + ' next</span>';
    }
    return '<div class="wp-row">' +
        '<span class="wp-row-name">' + _wpEscape(r.label) + '</span>' +
        '<span class="wp-bar"><span class="wp-bar-fill wp-tone-' + tone + '" style="width:' +
          Math.max(0, Math.min(100, r.avg)).toFixed(1) + '%"></span></span>' +
        '<span class="wp-row-val">' + r.avg.toFixed(1) + '</span>' +
      '</div>' +
      '<div class="wp-sub">' + need +
        '<span class="wp-muted">' + r.n + ' grade' + (r.n === 1 ? '' : 's') + '</span></div>';
  }).join('');

  return head + '<div class="wp-rows">' + rows + '</div>';
}

function _gradesEditor(d) {
  var tags = _wpTagList();
  if (!tags.length) return '';
  var opts = tags.map(function(t) {
    return '<option value="' + _wpEscape(t.id) + '">' + _wpEscape(t.label) + '</option>';
  }).join('');
  return '<div class="wp-edit">' +
      '<select class="wp-input" data-gr-subject>' + opts + '</select>' +
      '<input type="number" min="0" max="100" step="0.1" class="wp-input wp-input-sm" data-gr-score placeholder="Score">' +
      '<input type="number" min="0.5" max="10" step="0.5" class="wp-input wp-input-sm" data-gr-weight placeholder="Wt" value="1">' +
      '<button class="wp-btn" data-gr-add="1">Add</button>' +
    '</div>' +
    '<div class="wp-edit">' +
      '<span class="wp-muted">Target</span>' +
      '<input type="number" min="0" max="100" step="1" class="wp-input wp-input-sm" data-gr-target value="' + d.target + '">' +
      '<button class="wp-btn" data-gr-undo="1">Remove last</button>' +
    '</div>';
}

/* ═════════════════════════ ATTENDANCE ═════════════════════════ */

function _attendanceData() {
  var cfg = hubContent.attendance || {};
  var subs = cfg.subjects || {};
  var allowedPct = Math.max(0, Math.min(50, _wpNum(cfg.allowedPct, 20)));
  var rows = [];
  var tp = 0, tl = 0, ta = 0;

  _wpTagList().forEach(function(t) {
    var s = subs[t.id] || {};
    var p = Math.max(0, parseInt(s.p, 10) || 0);
    var l = Math.max(0, parseInt(s.l, 10) || 0);
    var a = Math.max(0, parseInt(s.a, 10) || 0);
    var total = p + l + a;
    var pct = total > 0 ? _wpPct(p + l, total) : null;
    var allowed = Math.floor(total * allowedPct / 100);
    var left = total > 0 ? Math.max(0, allowed - a) : null;
    tp += p; tl += l; ta += a;
    rows.push({ id: t.id, label: t.label, p: p, l: l, a: a, total: total, pct: pct, left: left });
  });

  var tTotal = tp + tl + ta;

  rows.sort(function(a, b) {
    if (a.pct === null && b.pct === null) return a.label.localeCompare(b.label);
    if (a.pct === null) return 1;
    if (b.pct === null) return -1;
    return a.pct - b.pct;
  });

  return {
    rows: rows,
    allowedPct: allowedPct,
    overall: tTotal > 0 ? _wpPct(tp + tl, tTotal) : null,
    total: tTotal,
    absent: ta
  };
}

function _attendanceRender(d, showAll) {
  if (!d.rows.length) return _wpEmpty('No subjects yet. Add categories on the Schedule page first.');

  var head = '<div class="wp-hero">' +
    '<span class="wp-hero-val">' + (d.overall === null ? '—' : d.overall.toFixed(0) + '%') + '</span>' +
    '<span class="wp-hero-lbl">attended · ' + d.absent + ' absence' + (d.absent === 1 ? '' : 's') + ' logged</span>' +
    '</div>';

  var visible = d.rows.filter(function(r) { return r.total > 0 || showAll; });
  if (!visible.length) return head + _wpEmpty('No classes logged yet — mark one below.');

  var rows = visible.map(function(r) {
    var danger = r.pct !== null && r.pct < (100 - d.allowedPct);
    var tone = r.pct === null ? '' : (danger ? 'bad' : (r.pct < (100 - d.allowedPct / 2) ? 'warn' : 'ok'));
    var meta = '';
    if (r.pct === null) {
      meta = '<span class="wp-muted">not started</span>';
    } else if (r.left === 0) {
      meta = '<span class="wp-need wp-tone-bad">no absences left</span>';
    } else {
      meta = '<span class="wp-need">can miss ' + r.left + ' more</span>';
    }
    return '<div class="wp-row">' +
        '<span class="wp-row-name">' + _wpEscape(r.label) + '</span>' +
        '<span class="wp-bar"><span class="wp-bar-fill wp-tone-' + (tone || 'ok') + '" style="width:' +
          (r.pct === null ? 0 : Math.max(0, Math.min(100, r.pct)).toFixed(1)) + '%"></span></span>' +
        '<span class="wp-row-val">' + (r.pct === null ? '—' : r.pct.toFixed(0) + '%') + '</span>' +
      '</div>' +
      '<div class="wp-sub">' + meta +
        '<span class="wp-muted">' + r.p + ' present · ' + r.l + ' late · ' + r.a + ' absent</span></div>' +
      '<div class="wp-att-btns">' +
        '<button class="wp-chip wp-chip-ok" data-att-mark="p" data-att-subject="' + _wpEscape(r.id) + '">Present</button>' +
        '<button class="wp-chip wp-chip-warn" data-att-mark="l" data-att-subject="' + _wpEscape(r.id) + '">Late</button>' +
        '<button class="wp-chip wp-chip-bad" data-att-mark="a" data-att-subject="' + _wpEscape(r.id) + '">Absent</button>' +
        '<button class="wp-chip wp-chip-ghost" data-att-mark="u" data-att-subject="' + _wpEscape(r.id) + '" title="Undo last">&#x21A9;</button>' +
      '</div>';
  }).join('');

  return head + '<div class="wp-rows">' + rows + '</div>';
}

/* ═══════════════════════ WEAK-SUBJECT DETECTOR ═══════════════════════ */



/* ══════════════════════════ EXAMS ══════════════════════════ */

function _examsData() {
  var list = Array.isArray(hubContent.exams) ? hubContent.exams : [];
  var today = _hubTodayKey();
  var items = [];

  list.forEach(function(x) {
    if (!x || !x.date) return;
    var days = _wpDaysBetween(today, x.date);
    if (!isFinite(days) || days < 0) return;
    var topics = Array.isArray(x.topics) ? x.topics.filter(function(t) { return t && t.t; }) : [];
    var doneN = topics.filter(function(t) { return t.done; }).length;
    items.push({
      id: x.id || x.date, title: x.title || 'Exam', date: x.date,
      days: days, topics: topics, doneN: doneN, total: topics.length,
      label: _wpTagLabel(x.tag || '')
    });
  });

  items.sort(function(a, b) { return a.days - b.days; });

  return { items: items, count: list.length };
}

function _examsRender(d) {
  if (!d.items.length) return _wpEmpty('No upcoming exams. Add one in edit mode.');

  var next = d.items[0];
  var head = '<div class="wp-hero">' +
    '<span class="wp-hero-val">' + next.days + '</span>' +
    '<span class="wp-hero-lbl">day' + (next.days === 1 ? '' : 's') + ' until ' + _wpEscape(next.title) + '</span>' +
    '</div>';

  var rows = d.items.slice(0, 6).map(function(x) {
    var pct = x.total > 0 ? _wpPct(x.doneN, x.total) : 0;
    var tone = x.days <= 3 ? 'bad' : (x.days <= 7 ? 'warn' : 'ok');
    var syllabus = x.total > 0
      ? '<span class="wp-bar"><span class="wp-bar-fill wp-tone-' + tone + '" style="width:' + pct.toFixed(1) + '%"></span></span>'
      : '';
    var meta = x.total > 0
      ? x.doneN + '/' + x.total + ' topics ready'
      : 'no syllabus yet';
    return '<div class="wp-exam">' +
        '<div class="wp-row">' +
          '<span class="wp-row-name">' + _wpEscape(x.title) + '</span>' +
          syllabus +
          '<span class="wp-row-val wp-tone-' + tone + '">' + x.days + 'd</span>' +
        '</div>' +
        '<div class="wp-sub"><span class="wp-muted">' + _wpEscape(x.date) + ' · ' + _wpEscape(meta) + '</span></div>' +
        (x.topics.length ? '<div class="wp-topics">' + x.topics.map(function(t, ti) {
          return '<button class="wp-topic' + (t.done ? ' done' : '') + '" data-exam-topic="' + _wpEscape(x.id) + '" data-exam-idx="' + ti + '">' +
            _wpEscape(t.t) + '</button>';
        }).join('') + '</div>' : '') +
      '</div>';
  }).join('');

  return head + '<div class="wp-rows">' + rows + '</div>';
}

function _examsEditor() {
  return '<div class="wp-edit">' +
      '<input class="wp-input" data-ex-title placeholder="Exam name">' +
      '<input type="date" class="wp-input wp-input-sm" data-ex-date>' +
      '<button class="wp-btn" data-ex-add="1">Add</button>' +
    '</div>' +
    '<div class="wp-edit">' +
      '<input class="wp-input" data-ex-topics placeholder="Topics, comma separated">' +
      '<button class="wp-btn" data-ex-topic-add="1">Add topics to next</button>' +
    '</div>' +
    '<div class="wp-edit">' +
      '<button class="wp-btn" data-ex-clear="1">Remove all exams</button>' +
    '</div>';
}

/* ═══════════════════════ INDONESIAN HOLIDAYS ═══════════════════════ */
/* Source: SKB 3 Menteri (No. 1497/2025, No. 2/2025, No. 5/2025) for 2026.
   National holidays only carry legal weight; cuti bersama is set annually.
   This list must be refreshed when the next SKB is published. */

var WP_HOLIDAYS = [
  ['2026-01-01', 'Tahun Baru Masehi 2026', 'national'],
  ['2026-01-16', 'Isra Mikraj Nabi Muhammad SAW', 'national'],
  ['2026-02-16', 'Cuti Tahun Baru Imlek 2577', 'cuti'],
  ['2026-02-17', 'Tahun Baru Imlek 2577', 'national'],
  ['2026-03-18', 'Cuti Hari Suci Nyepi', 'cuti'],
  ['2026-03-19', 'Hari Suci Nyepi 1948', 'national'],
  ['2026-03-20', 'Cuti Idulfitri 1447 H', 'cuti'],
  ['2026-03-21', 'Hari Raya Idulfitri 1447 H', 'national'],
  ['2026-03-22', 'Hari Raya Idulfitri 1447 H', 'national'],
  ['2026-03-23', 'Cuti Idulfitri 1447 H', 'cuti'],
  ['2026-03-24', 'Cuti Idulfitri 1447 H', 'cuti'],
  ['2026-04-03', 'Wafat Yesus Kristus', 'national'],
  ['2026-04-05', 'Hari Paskah', 'national'],
  ['2026-05-01', 'Hari Buruh Internasional', 'national'],
  ['2026-05-14', 'Kenaikan Yesus Kristus', 'national'],
  ['2026-05-15', 'Cuti Kenaikan Yesus Kristus', 'cuti'],
  ['2026-05-27', 'Hari Raya Iduladha 1447 H', 'national'],
  ['2026-05-28', 'Cuti Hari Raya Iduladha', 'cuti'],
  ['2026-05-31', 'Hari Raya Waisak 2570', 'national'],
  ['2026-06-01', 'Hari Lahir Pancasila', 'national'],
  ['2026-06-16', 'Tahun Baru Islam 1448 H', 'national'],
  ['2026-08-17', 'Hari Kemerdekaan RI', 'national'],
  ['2026-08-25', 'Maulid Nabi Muhammad SAW', 'national'],
  ['2026-12-24', 'Cuti Hari Raya Natal', 'cuti'],
  ['2026-12-25', 'Hari Raya Natal', 'national']
];

function _holidaysData() {
  var today = _hubTodayKey();
  var all = WP_HOLIDAYS.map(function(h) {
    return { date: h[0], name: h[1], kind: h[2], days: _wpDaysBetween(today, h[0]) };
  });
  var upcoming = all.filter(function(h) { return isFinite(h.days) && h.days >= 0; })
    .sort(function(a, b) { return a.days - b.days; });
  var yr = String(today).slice(0, 4);
  var inYear = all.filter(function(h) { return h.date.slice(0, 4) === yr; });
  return {
    next: upcoming.slice(0, 4),
    year: yr,
    yearTotal: inYear.length,
    yearNational: inYear.filter(function(h) { return h.kind === 'national'; }).length,
    listed: all.length
  };
}

function _holidaysRender(d) {
  if (!d.next.length) {
    return _wpEmpty('No holidays left on record for ' + d.year + '. The list needs updating.');
  }
  var n = d.next[0];
  var head = '<div class="wp-hero">' +
    '<span class="wp-hero-val">' + (n.days === 0 ? 'Today' : n.days) + '</span>' +
    '<span class="wp-hero-lbl">' + (n.days === 0 ? _wpEscape(n.name) : 'day' + (n.days === 1 ? '' : 's') + ' until ' + _wpEscape(n.name)) + '</span>' +
    '</div>';

  var rows = d.next.map(function(h, i) {
    var tone = i === 0 ? 'bad' : 'ok';
    return '<div class="wp-row">' +
        '<span class="wp-row-name">' + _wpEscape(h.name) + '</span>' +
        '<span class="wp-chip-mini wp-' + (h.kind === 'national' ? 'kind-national' : 'kind-cuti') + '">' +
          (h.kind === 'national' ? 'libur' : 'cuti') + '</span>' +
        '<span class="wp-row-val wp-tone-' + tone + '">' + (h.days === 0 ? '—' : h.days + 'd') + '</span>' +
      '</div>' +
      '<div class="wp-sub"><span class="wp-muted">' + _wpEscape(h.date) + '</span></div>';
  }).join('');

  return head + '<div class="wp-rows">' + rows + '</div>' +
    '<div class="wp-foot">' + d.yearTotal + ' tanggal merah in ' + d.year +
    ' · ' + d.yearNational + ' libur nasional</div>';
}






/* ════════════════════════ BIRTHDAYS ════════════════════════ */

function _birthdaysData() {
  var list = Array.isArray(hubContent.birthdays) ? hubContent.birthdays : [];
  var today = _hubTodayKey();
  var ty = parseInt(String(today).slice(0, 4), 10);
  var rows = [];

  list.forEach(function(b) {
    if (!b || !b.date) return;
    var md = String(b.date);
    var mm = parseInt(md.slice(0, 2), 10);
    var dd = parseInt(md.slice(3, 5), 10);
    if (!isFinite(mm) || !isFinite(dd) || mm < 1 || mm > 12 || dd < 1 || dd > 31) return;
    var pad = ('0' + mm).slice(-2) + '-' + ('0' + dd).slice(-2);
    var days = _wpDaysBetween(today, ty + '-' + pad);
    if (!isFinite(days)) return;
    if (days < 0) days = _wpDaysBetween(today, (ty + 1) + '-' + pad);
    if (!isFinite(days)) return;
    rows.push({ id: b.id || pad + '|' + (b.name || ''), name: b.name || 'Someone', date: pad, days: days });
  });

  rows.sort(function(a, b) { return a.days - b.days; });

  return {
    rows: rows,
    soon: rows.filter(function(r) { return r.days <= 7; }).length,
    todayCount: rows.filter(function(r) { return r.days === 0; }).length
  };
}

function _birthdaysRender(d) {
  if (!d.rows.length) return _wpEmpty('No birthdays yet. Add one in edit mode.');

  var n = d.rows[0];
  var head = '<div class="wp-hero">' +
    '<span class="wp-hero-val">' + (n.days === 0 ? 'Today' : n.days) + '</span>' +
    '<span class="wp-hero-lbl">' + (n.days === 0 ? _wpEscape(n.name) + "'s birthday" : 'day' + (n.days === 1 ? '' : 's') + ' until ' + _wpEscape(n.name)) + '</span>' +
    '</div>';

  var rows = d.rows.slice(0, 6).map(function(r) {
    var tone = r.days === 0 ? 'bad' : (r.days <= 7 ? 'warn' : 'ok');
    return '<div class="wp-row">' +
        '<span class="wp-row-name">' + _wpEscape(r.name) + '</span>' +
        '<span class="wp-row-val wp-tone-' + tone + '">' + (r.days === 0 ? 'today' : r.days + 'd') + '</span>' +
      '</div>' +
      '<div class="wp-sub"><span class="wp-muted">' + _wpEscape(r.date) + '</span></div>';
  }).join('');

  return head + '<div class="wp-rows">' + rows + '</div>' +
    (d.soon > 0 ? '<div class="wp-foot">' + d.soon + ' within the next week</div>' : '');
}

function _birthdaysEditor() {
  return '<div class="wp-edit">' +
      '<input class="wp-input" data-bd-name placeholder="Name">' +
      '<input type="date" class="wp-input wp-input-sm" data-bd-date>' +
      '<button class="wp-btn" data-bd-add="1">Add</button>' +
    '</div>' +
    '<div class="wp-edit"><button class="wp-btn" data-bd-clear="1">Remove all</button></div>';
}

/* ════════════════════════ FLASHCARDS ════════════════════════ */

var FC_BOX_DAYS = [1, 2, 4, 8, 16];

function _fcReviewedToday() {
  var cfg = hubContent.flashcards || {};
  var r = cfg.reviewed || {};
  return parseInt(r[_hubTodayKey()], 10) || 0;
}

function _flashcardsData() {
  var cfg = hubContent.flashcards || {};
  var decks = cfg.decks || {};
  var today = _hubTodayKey();
  var out = [];

  Object.keys(decks).forEach(function(k) {
    var cards = Array.isArray(decks[k]) ? decks[k].filter(function(c) { return c && c.front; }) : [];
    if (!cards.length) return;
    var due = 0, fresh = 0;
    cards.forEach(function(c) {
      if (!c.due) { due += 1; fresh += 1; return; }
      if (String(c.due) <= today) due += 1;
    });
    out.push({ id: k, label: _wpTagLabel(k), total: cards.length, due: due, fresh: fresh, cards: cards });
  });

  out.sort(function(a, b) { return b.due - a.due; });

  var active = null;
  for (var i = 0; i < out.length; i++) {
    if (out[i].due > 0) { active = out[i]; break; }
  }
  if (!active && out.length) active = out[0];

  var current = null;
  if (active) {
    for (var j = 0; j < active.cards.length; j++) {
      var c = active.cards[j];
      if (!c.due || String(c.due) <= today) { current = c; break; }
    }
  }

  var totalDue = 0;
  out.forEach(function(d) { totalDue += d.due; });

  return {
    decks: out,
    active: active,
    current: current,
    totalDue: totalDue,
    reviewed: _fcReviewedToday(),
    showBack: !!(cfg.showBack)
  };
}

function _flashcardsRender(d) {
  if (!d.decks.length) return _wpEmpty('No decks yet. Add a card in edit mode.');

  if (!d.current) {
    var lines = d.decks.map(function(dk) {
      return '<div class="wp-row">' +
          '<span class="wp-row-name">' + _wpEscape(dk.label) + '</span>' +
          '<span class="wp-row-val wp-muted">' + dk.total + ' card' + (dk.total === 1 ? '' : 's') + '</span>' +
        '</div>';
    }).join('');
    return '<div class="wp-hero">' +
        '<span class="wp-hero-val wp-tone-ok">0</span>' +
        '<span class="wp-hero-lbl">due now · ' + d.reviewed + ' reviewed today</span>' +
      '</div>' +
      '<div class="wp-rows">' + lines + '</div>' +
      '<div class="wp-foot">All caught up. Come back tomorrow.</div>';
  }

  var card = d.current;
  var box = Math.max(1, Math.min(5, parseInt(card.box, 10) || 1));

  var head = '<div class="wp-hero">' +
    '<span class="wp-hero-val">' + d.totalDue + '</span>' +
    '<span class="wp-hero-lbl">due · ' + _wpEscape(d.active.label) + ' · box ' + box + '/5</span>' +
    '</div>';

  var face = '<div class="wp-fc-face">' + _wpEscape(card.front) + '</div>';
  if (d.showBack) {
    face += '<div class="wp-fc-back">' + _wpEscape(card.back || '') + '</div>';
  }

  var controls = d.showBack
    ? '<div class="wp-fc-btns">' +
        '<button class="wp-chip wp-chip-bad" data-fc-again="1">Again</button>' +
        '<button class="wp-chip wp-chip-ok" data-fc-good="1">Good</button>' +
      '</div>'
    : '<div class="wp-fc-btns">' +
        '<button class="wp-chip wp-chip-ghost" data-fc-show="1">Show answer</button>' +
      '</div>';

  return head + face + controls +
    '<div class="wp-foot">' + d.reviewed + ' reviewed today · ' + d.decks.length + ' deck' + (d.decks.length === 1 ? '' : 's') + '</div>';
}

function _flashcardsEditor() {
  var tags = _wpTagList();
  var opts = tags.map(function(t) {
    return '<option value="' + _wpEscape(t.id) + '">' + _wpEscape(t.label) + '</option>';
  }).join('');
  return '<div class="wp-edit">' +
      (tags.length ? '<select class="wp-input" data-fc-deck>' + opts + '</select>' : '<input class="wp-input" data-fc-deck placeholder="Deck">') +
      '<input class="wp-input" data-fc-front placeholder="Front">' +
      '<input class="wp-input" data-fc-back placeholder="Back">' +
      '<button class="wp-btn" data-fc-add="1">Add card</button>' +
    '</div>' +
    '<div class="wp-edit"><button class="wp-btn" data-fc-reset="1">Reset review state</button></div>';
}


function bubbleTypeIcon(t) {
  const icons = {
    goals: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    images: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    priorities: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>',
    todos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>',
    today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>',
    habits: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    notes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    links: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
    progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    weather: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    timer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><line x1="22" y1="2" x2="18" y2="6"/></svg>',
    alarm: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    pomodoro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>',
    spotify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="7"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="2" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22" y2="12"/></svg>',
    strava: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 2L21 12l-5.5 0L10 2z"/><path d="M10.5 12L6 2l-5.5 0L6 12z"/></svg>',
    flightradar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20z"/><circle cx="12" cy="12" r="3"/><path d="M2 12h20"/></svg>',
    'sleep-score': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a9 9 0 1 0-9-9 9 9 0 0 0 9 9z"/><path d="M4 12a8 8 0 0 1 8-8"/><path d="M17 14.5a6.5 6.5 0 0 1-6-6.5"/></svg>',
    headlines: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>',
    water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    mood: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    countdown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 10"/></svg>',

    crypto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 8h4.5a2 2 0 0 1 0 4H9V8z"/><path d="M9 12h5a2 2 0 0 1 0 4H9v-4z"/><line x1="10" y1="6" x2="10" y2="8"/><line x1="14" y1="6" x2="14" y2="8"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="14" y1="16" x2="14" y2="18"/></svg>',
    text: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    homework: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/></svg>',
    prayertime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/><path d="M18.5 17.5a5.5 5.5 0 01-6-6"/></svg>',
    bmkgquake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h3l2.5-7 3 14 3-10 2.5 6 2-3H22"/></svg>',
    moneyflow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l5-5 4 4 8-8"/><polyline points="15 8 20 8 20 13"/></svg>',
    assistant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/></svg>',
    'friends-live': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
    grades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M8.2 13.6L7 22l5-3 5 3-1.2-8.4"/></svg>',
    attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2h6v3H9z"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><polyline points="9 14 11 16 15 11"/></svg>',
    exams: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>',
    holidays: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
    birthdays: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>',
    flashcards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    sleepdebt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>',
    ytfeed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9"/></svg>',
    watchlist: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h5M2 16h5M17 8h5M17 16h5"/></svg>',
    musicviz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="14" x2="4" y2="20"/><line x1="9" y1="8" x2="9" y2="20"/><line x1="14" y1="4" x2="14" y2="20"/><line x1="19" y1="11" x2="19" y2="20"/></svg>',
    pet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><circle cx="5" cy="9" r="2.2"/><circle cx="19" cy="9" r="2.2"/><circle cx="9" cy="5" r="2.2"/><circle cx="15" cy="5" r="2.2"/></svg>',
    garden: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
    xp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="21 7 21 12 16 12"/></svg>',
    badges: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>'

  };
  return icons[t] || '';
}

function _wmoKind(code) {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}
function _wIconSmall(kind, isDay) {
  var a = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"';
  if (kind === 'clear') return isDay
    ? '<svg ' + a + '><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/></svg>'
    : '<svg ' + a + '><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';
  if (kind === 'partly') return '<svg ' + a + '><circle cx="7" cy="7" r="2.5"/><path d="M7 2v1.5M2 7h1.5M3.5 3.5l1 1"/><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';
  if (kind === 'fog') return '<svg ' + a + '><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>';
  if (kind === 'drizzle') return '<svg ' + a + '><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="16" x2="8" y2="17.5"/><line x1="12" y1="16" x2="12" y2="17.5"/><line x1="16" y1="16" x2="16" y2="17.5"/></svg>';
  if (kind === 'rain') return '<svg ' + a + '><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="16" x2="8" y2="19"/><line x1="12" y1="16" x2="12" y2="19"/><line x1="16" y1="16" x2="16" y2="19"/></svg>';
  if (kind === 'snow') return '<svg ' + a + '><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="8" y1="16" x2="8" y2="17"/><line x1="12" y1="17" x2="12" y2="18"/><line x1="16" y1="16" x2="16" y2="17"/></svg>';
  if (kind === 'storm') return '<svg ' + a + '><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="13 11 10 15 13 15 11 19"/></svg>';
  return '<svg ' + a + '><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>';
}
function _sleepWeekLogs() {
  var logs = (typeof loadSleepLogs === 'function') ? loadSleepLogs() : [];
  var now = new Date();
  var dow = (now.getDay() + 6) % 7;
  var week = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + i);
    var ds = formatDate(d);
    week.push({ ds: ds, dow: ['S','M','T','W','T','F','S'][d.getDay()], log: logs.find(function(l) { return l.date === ds; }) || null });
  }
  return week;
}
function _sleepScoreCalc(allLogs, week, targetDur) {
  if (!allLogs || allLogs.length < 3) return null;
  var active = week.filter(function(w) { return w.log; }).map(function(w) { return w.log; });
  if (active.length === 0) return null;
  var durData = active.filter(function(l) { return l.duration; });
  var durScore = 0;
  if (durData.length > 0) {
    var avg = durData.reduce(function(s, l) { return s + l.duration; }, 0) / durData.length;
    durScore = Math.max(0, 40 - Math.abs(avg - targetDur) * 0.15);
  }
  var qData = active.filter(function(l) { return l.quality; });
  var qScore = 0;
  if (qData.length > 0) qScore = (qData.reduce(function(s, l) { return s + l.quality; }, 0) / qData.length / 5) * 30;
  var cScore = 0;
  if (typeof getSleepConsistencyScore === 'function') {
    var c = getSleepConsistencyScore(allLogs);
    if (c) cScore = (c.score / 100) * 30;
  }
  return Math.round(durScore + qScore + cScore);
}

/* ─── Weather widget updater ────────────────── */
function updateWeatherWidget(widget, data) {
  var uid = widget.dataset.weatherUid || '';
  var wStyle = (typeof _getWeatherStyle === 'function') ? _getWeatherStyle(uid) : 'compact';
  var codes = {
    0:'Clear',1:'Clear',2:'Cloudy',3:'Overcast',
    45:'Foggy',48:'Foggy',
    51:'Drizzle',53:'Drizzle',55:'Drizzle',
    61:'Rain',63:'Rain',65:'Rain',
    71:'Snow',73:'Snow',75:'Snow',
    80:'Showers',81:'Showers',82:'Showers',
    95:'Storm',96:'Storm',99:'Storm'
  };
  var icons = {
    'Clear':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'Cloudy':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'Overcast':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'Foggy':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="21" y2="6"/></svg>',
    'Drizzle':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="16" x2="8" y2="18"/><line x1="12" y1="16" x2="12" y2="18"/><line x1="16" y1="16" x2="16" y2="18"/></svg>',
    'Rain':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="16" y1="16" x2="16" y2="20"/></svg>',
    'Snow':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
    'Showers':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="14" y1="16" x2="14" y2="18"/></svg>',
    'Storm':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="13 7 9 13 13 13 11 19"/></svg>'
  };
  var iconsLg = {
    'Clear':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    'Cloudy':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'Overcast':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'Foggy':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="21" y2="6"/></svg>',
    'Drizzle':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="16" x2="8" y2="18"/><line x1="12" y1="16" x2="12" y2="18"/><line x1="16" y1="16" x2="16" y2="18"/></svg>',
    'Rain':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/><line x1="16" y1="16" x2="16" y2="20"/></svg>',
    'Snow':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="16" y1="19" x2="16" y2="21"/></svg>',
    'Showers':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="14" y1="16" x2="14" y2="18"/></svg>',
    'Storm':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="width:48px;height:48px"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><polyline points="13 7 9 13 13 13 11 19"/></svg>'
  };
  if (!data || data.temp == null) {
    widget.innerHTML = '<div class="weather-error"><span>Weather unavailable</span></div>';
    return;
  }
  var cond = codes[data.code] || 'Clear';
  var icon = icons[cond] || icons['Clear'];
  var iconLg = iconsLg[cond] || iconsLg['Clear'];
  var feelsHtml = typeof data.feels === 'number' ? '<span class="weather-feels">feels ' + Math.round(data.feels) + '&deg;</span>' : '';
  var hiloHtml = (typeof data.hi === 'number' && typeof data.lo === 'number') ? '<span class="weather-hilo"><b>H</b> ' + Math.round(data.hi) + '&deg; <b>L</b> ' + Math.round(data.lo) + '&deg;</span>' : '';
  var windHtml = data.wind ? '<span class="weather-wind">' + Math.round(data.wind) + ' km/h</span>' : '';
  var refreshBtn = '<button class="weather-refresh" data-weather-refresh title="Refresh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>';
  var strip = '';
  if (data.hourly && data.hourly.length) {
    strip = '<div class="weather-hours">' + data.hourly.map(function(h, i) {
      var hd = new Date(h.t);
      var hr = hd.getHours();
      var lbl = i === 0 ? 'Now' : (hr === 0 ? '12a' : hr === 12 ? '12p' : hr < 12 ? hr + 'a' : (hr - 12) + 'p');
      return '<div class="weather-hour"><span class="wh-t">' + lbl + '</span>' + _wIconSmall(_wmoKind(h.code), h.day) + '<span class="wh-v">' + Math.round(h.temp) + '&deg;</span></div>';
    }).join('') + '</div>';
  }

  var rawLoc = data.locName || data.name || '';
  var safeLoc = String(rawLoc).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  var locLabel = safeLoc || 'Set location';
  var locLine = '<button class="weather-loc" data-weather-edit title="Change location"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:11px;height:11px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>' + locLabel + '</span></button>';
  if (wStyle === 'hero') {
    widget.innerHTML = '<div class="wh-hero">' + locLine + iconLg + '<span class="wh-hero-temp">' + Math.round(data.temp) + '&deg;</span><span class="wh-hero-cond">' + cond + '</span>' + feelsHtml + '<div class="wh-hero-meta">' + hiloHtml + windHtml + refreshBtn + '</div></div>';
  } else if (wStyle === 'minimal') {
    widget.innerHTML = '<div class="wh-minimal">' + locLine + '<span class="wh-min-temp">' + Math.round(data.temp) + '&deg;</span><span class="wh-min-cond">' + cond + '</span>' + feelsHtml + refreshBtn + '</div>';
  } else if (wStyle === 'forecast') {
    widget.innerHTML = '<div class="wh-forecast-head"><span class="wh-forecast-temp">' + Math.round(data.temp) + '&deg;</span><span class="wh-forecast-cond">' + cond + '</span>' + hiloHtml + refreshBtn + '</div>' + strip + locLine;
  } else if (wStyle === 'card') {
    widget.innerHTML = '<div class="wh-card">' + icon + '<div class="wh-card-info"><span class="wh-card-temp">' + Math.round(data.temp) + '&deg;</span><span class="wh-card-cond">' + cond + '</span>' + feelsHtml + '</div><div class="wh-card-hilo">' + hiloHtml + windHtml + '</div>' + refreshBtn + '</div>' + strip + locLine;
  } else {
    widget.innerHTML = '<div class="weather-main">' + icon + '<span class="weather-temp">' + Math.round(data.temp) + '&deg;</span></div>'
      + '<div class="weather-cond">' + cond + feelsHtml + '</div>'
      + '<div class="weather-meta">' + hiloHtml + windHtml + refreshBtn + '</div>'
      + strip + locLine;
  }
}

var WEATHER_LOC_KEY = 'haven-weather-location';
function _getSavedWeatherLoc() {
  try {
    var raw = localStorage.getItem(WEATHER_LOC_KEY);
    if (!raw) return null;
    var o = JSON.parse(raw);
    if (!o || typeof o.lat !== 'number' || typeof o.lon !== 'number') return null;
    if (!isFinite(o.lat) || !isFinite(o.lon)) return null;
    return { lat: o.lat, lon: o.lon, name: o.name || '' };
  } catch(e) { return null; }
}
function _setSavedWeatherLoc(lat, lon, name) {
  try { localStorage.setItem(WEATHER_LOC_KEY, JSON.stringify({ lat: lat, lon: lon, name: name || '' })); } catch(e) {}
}
function _weatherEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function _weatherErrHtml(msg) {
  return '<div class="weather-error"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><span>'
    + _weatherEsc(msg)
    + '</span><div class="weather-err-actions"><button class="weather-err-btn" data-weather-approx>Use approximate location</button><button class="weather-err-btn weather-err-ghost" data-weather-edit>Set location</button></div></div>';
}
function _weatherLocFormHtml() {
  return '<div class="weather-loc-form"><input class="weather-loc-input" type="text" placeholder="City name..." autocomplete="off" /><div class="weather-loc-row"><button class="weather-err-btn" data-weather-loc-go>Search</button><button class="weather-err-btn weather-err-ghost" data-weather-cancel>Cancel</button></div><div class="weather-loc-results"></div></div>';
}
function _weatherShowLocForm(widget) {
  if (!widget) return;
  widget.innerHTML = _weatherLocFormHtml();
  var input = widget.querySelector('.weather-loc-input');
  if (input) { try { input.focus(); } catch(e) {} }
}
function _weatherSearchAndRender(widget, q) {
  if (!widget) return;
  var list = widget.querySelector('.weather-loc-results');
  if (!list) return;
  q = String(q || '').trim();
  if (q.length < 2) {
    list.innerHTML = '<div class="weather-loc-status">Type at least 2 letters.</div>';
    return;
  }
  list.innerHTML = '<div class="weather-loc-status">Searching...</div>';
  fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(q) + '&count=5&language=en&format=json').then(function(r) { return r.json(); }).then(function(data) {
    var res = (data && data.results) || [];
    if (!res.length) {
      list.innerHTML = '<div class="weather-loc-status">No matches found.</div>';
      return;
    }
    list.innerHTML = res.map(function(g) {
      var label = _weatherEsc([g.name, g.admin1, g.country].filter(Boolean).join(', '));
      return '<button class="weather-loc-item" data-weather-pick="' + _weatherEsc(g.latitude) + ',' + _weatherEsc(g.longitude) + '" data-weather-name="' + label + '"><span>' + label + '</span></button>';
    }).join('');
  }).catch(function() {
    list.innerHTML = '<div class="weather-loc-status">Search failed. Check connection.</div>';
  });
}
function _loadWeatherForCoords(lat, lon, locName, widgets) {
  var list = Array.prototype.slice.call(widgets || []);
  if (!list.length) return;
  var cacheKey = 'hub-weather-' + Math.round(lat * 10) + '-' + Math.round(lon * 10);
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch(e) {}
  if (cached && Date.now() - cached.ts < 600000 && cached.data && cached.data.temp != null) {
    _weatherLastData = cached.data;
    if (locName && !_weatherLastData.locName) _weatherLastData.locName = locName;
    list.forEach(function(w) { updateWeatherWidget(w, _weatherLastData); });
    return;
  }
  var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current_weather=true&current=temperature_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2';
  fetch(url).then(function(r) { return r.json(); }).then(function(data) {
    if (!data || (!data.current && !data.current_weather)) throw new Error('bad');
    var cur = data.current || {};
    var legacy = data.current_weather || {};
    var wd = {
      temp: cur.temperature_2m != null ? cur.temperature_2m : legacy.temperature,
      code: cur.weather_code != null ? cur.weather_code : legacy.weathercode,
      wind: cur.wind_speed_10m != null ? cur.wind_speed_10m : legacy.windspeed,
      feels: cur.apparent_temperature,
      isDay: cur.is_day === undefined ? true : cur.is_day === 1,
      locName: locName || ''
    };
    if (wd.temp == null && wd.code == null) throw new Error('bad');
    if (data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_max.length) {
      wd.hi = data.daily.temperature_2m_max[0];
      wd.lo = data.daily.temperature_2m_min[0];
    }
    if (data.hourly && data.hourly.time && data.hourly.temperature_2m) {
      var pad = function(x) { return String(x).padStart(2, '0'); };
      var n = new Date();
      var stamp = n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()) + 'T' + pad(n.getHours()) + ':00';
      var idx = data.hourly.time.indexOf(stamp);
      if (idx === -1) {
        for (var ti = 0; ti < data.hourly.time.length; ti++) {
          if (new Date(data.hourly.time[ti]) >= n) { idx = ti; break; }
        }
      }
      if (idx !== -1) {
        var wcodes = data.hourly.weather_code || data.hourly.weathercode || [];
        wd.hourly = [];
        for (var k = idx; k < Math.min(idx + 7, data.hourly.time.length); k++) {
          var hd = new Date(data.hourly.time[k]);
          wd.hourly.push({ t: data.hourly.time[k], temp: data.hourly.temperature_2m[k], code: wcodes[k], day: hd.getHours() >= 6 && hd.getHours() < 20 });
        }
      }
    }
    if (wd.locName) _setSavedWeatherLoc(lat, lon, wd.locName);
    else {
      var prev = _getSavedWeatherLoc();
      if (prev && Math.abs(prev.lat - lat) < 0.06 && Math.abs(prev.lon - lon) < 0.06 && prev.name) wd.locName = prev.name;
      else _setSavedWeatherLoc(lat, lon, '');
    }
    _weatherLastData = wd;
    try { localStorage.setItem(cacheKey, JSON.stringify({ts: Date.now(), data: wd})); } catch(e) {}
    list.forEach(function(w) { updateWeatherWidget(w, wd); });
  }).catch(function() {
    list.forEach(function(w) { w.innerHTML = _weatherErrHtml('Could not load weather'); });
  });
}
function _fetchWeatherByIP(widgets) {
  var list = Array.prototype.slice.call(widgets || []);
  if (!list.length) return;
  list.forEach(function(w) {
    w.innerHTML = '<div class="weather-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Detecting location...</span></div>';
  });
  fetch('https://ipapi.co/json/').then(function(r) { return r.json(); }).then(function(d) {
    var lat = d ? parseFloat(d.latitude != null ? d.latitude : d.lat) : NaN;
    var lon = d ? parseFloat(d.longitude != null ? d.longitude : d.lon) : NaN;
    if (!isFinite(lat) || !isFinite(lon)) throw new Error('no-coords');
    var name = [d.city, d.country_name || d.country].filter(Boolean).join(', ');
    _loadWeatherForCoords(lat, lon, name, list);
  }).catch(function() {
    fetch('https://ip-api.com/json/?fields=status,message,lat,lon,city,country').then(function(r) { return r.json(); }).then(function(d2) {
      if (!d2 || d2.status !== 'success' || !isFinite(d2.lat) || !isFinite(d2.lon)) throw new Error('no-coords');
      var name2 = [d2.city, d2.country].filter(Boolean).join(', ');
      _loadWeatherForCoords(d2.lat, d2.lon, name2, list);
    }).catch(function() {
      list.forEach(function(w) { w.innerHTML = _weatherErrHtml('Could not detect location'); });
    });
  });
}
function _fetchWeather(grid) {
  var weatherWidgets = grid.querySelectorAll('.weather-widget[data-weather-uid]');
  if (weatherWidgets.length === 0) return;
  if (_weatherLastData) {
    weatherWidgets.forEach(function(w) { updateWeatherWidget(w, _weatherLastData); });
    return;
  }
  if (_weatherFetched) return;
  _weatherFetched = true;
  var saved = _getSavedWeatherLoc();
  if (saved) {
    _loadWeatherForCoords(saved.lat, saved.lon, saved.name, weatherWidgets);
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    try {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lon = pos.coords.longitude;
        var prev = _getSavedWeatherLoc();
        _loadWeatherForCoords(lat, lon, prev ? prev.name : 'Current location', weatherWidgets);
      }, function() {
        _fetchWeatherByIP(weatherWidgets);
      }, {timeout: 8000, enableHighAccuracy: false});
    } catch(e) {
      _fetchWeatherByIP(weatherWidgets);
    }
  } else {
    _fetchWeatherByIP(weatherWidgets);
  }
}

function refreshWeather() {
  _weatherFetched = false;
  _weatherLastData = null;
  try {
    var keys = [];
    var pre = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
    var store = (typeof __origLS !== 'undefined' && __origLS && __origLS.length !== undefined) ? __origLS : localStorage;
    for (var i = store.length - 1; i >= 0; i--) {
      var k = store.key(i);
      if (!k) continue;
      var short = pre && k.indexOf(pre) === 0 ? k.slice(pre.length) : k;
      if (short.indexOf('hub-weather-') === 0) keys.push(k);
    }
    keys.forEach(function(k) { try { store.removeItem(k); } catch(e) {} });
  } catch(e) {}
  var grid = document.querySelector('.bento-grid');
  if (grid) {
    grid.querySelectorAll('.weather-widget').forEach(function(w) {
      w.innerHTML = '<div class="weather-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Fetching weather...</span></div>';
    });
    _fetchWeather(grid);
  }
}

/* ─── Headlines widget ─────────────────────── */
const _HL_SOURCES = {
  bbc: { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  nytimes: { name: 'NY Times', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  theguardian: { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
  npr: { name: 'NPR News', url: 'https://feeds.npr.org/1001/rss.xml' },
  aljazeera: { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
};
let _hlCache = null;
let _hlFetching = false;

function _hlSourceName(key) { return (_HL_SOURCES[key] && _HL_SOURCES[key].name) || 'News'; }
function _hlFresh() { return !!(_hlCache && Date.now() - _hlCache.ts < 900000); }
function _getHeadlineSource() {
  try { return localStorage.getItem('haven-headlines-source') || 'bbc'; } catch(e) { return 'bbc'; }
}
function _setHeadlineSource(key) {
  try { localStorage.setItem('haven-headlines-source', key); } catch(e) {}
  _hlCache = null;
}
function _headlinesCacheKey() { return 'hub-headlines-' + _getHeadlineSource(); }
function _stripCdata(s) { return String(s || '').replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim(); }
function _hlSafeLink(link, sourceKey) {
  var lk = String(link || '').replace(/"/g, '').replace(/<[^>]*>/g, '').trim();
  if (!/^https?:\/\//i.test(lk)) lk = (_HL_SOURCES[sourceKey] && _HL_SOURCES[sourceKey].url) || '#';
  return lk;
}

function _parseRssHeadlines(xmlText, sourceKey) {
  var doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.querySelector('parsererror')) return null;
  var nodes = Array.from(doc.querySelectorAll('item > title'));
  if (!nodes.length) nodes = Array.from(doc.querySelectorAll('entry > title'));
  var linkNodes = Array.from(doc.querySelectorAll('item > link'));
  if (!linkNodes.length) linkNodes = Array.from(doc.querySelectorAll('entry > link'));
  var out = [];
  for (var i = 0; i < nodes.length && out.length < 5; i++) {
    var title = _stripCdata(nodes[i].textContent).replace(/\s+/g, ' ');
    if (!title) continue;
    var link = '';
    if (linkNodes[i]) {
      link = _stripCdata(linkNodes[i].textContent || '');
      if (!link) { var href = linkNodes[i].getAttribute && linkNodes[i].getAttribute('href'); if (href) link = href; }
    }
    if (!link) link = (_HL_SOURCES[sourceKey] && _HL_SOURCES[sourceKey].url) || '#';
    out.push({ title: title, link: link });
  }
  return out.length ? out : null;
}

function updateHeadlinesWidget(widget, items, sourceKey) {
  if (!widget) return;
  if (!items || !items.length) {
    widget.innerHTML = '<div class="hl-error"><span>No headlines available</span></div>';
    return;
  }
  var stamp = _hlCache ? new Date(_hlCache.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  var refreshSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  var b = '<div class="hl-source-line"><span class="hl-source-name">' + _hlSourceName(sourceKey) + '</span><span class="hl-stamp">' + stamp + '</span><button class="weather-refresh" data-headlines-refresh title="Refresh">' + refreshSvg + '</button></div><div class="hl-list">';
  items.slice(0, 5).forEach(function(hl) {
    var t = String(hl.title || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (t.length > 90) t = t.slice(0, 88) + '...';
    b += '<a class="hl-item" href="' + escapeHtml(_hlSafeLink(hl.link, sourceKey)) + '" target="_blank" rel="noopener"><span class="hl-item-title">' + escapeHtml(t) + '</span></a>';
  });
  b += '</div>';
  widget.innerHTML = b;
}

function _fetchHeadlines(grid) {
  var widgets = grid.querySelectorAll('.headlines-widget[data-headlines-uid]');
  if (widgets.length === 0) return;
  var source = _getHeadlineSource();
  if (_hlCache && _hlCache.source === source && _hlFresh()) {
    widgets.forEach(function(w) { updateHeadlinesWidget(w, _hlCache.items, source); });
    return;
  }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(_headlinesCacheKey())); } catch(e) {}
  if (cached && cached.ts && Date.now() - cached.ts < 900000 && cached.items && cached.items.length) {
    _hlCache = cached;
    widgets.forEach(function(w) { updateHeadlinesWidget(w, cached.items, source); });
    return;
  }
  if (_hlFetching) return;
  _hlFetching = true;
  var cfg = _HL_SOURCES[source] || _HL_SOURCES.bbc;
  var apply = function(items) {
    if (_getHeadlineSource() !== source) return;
    _hlCache = { ts: Date.now(), source: source, items: items };
    try { localStorage.setItem(_headlinesCacheKey(), JSON.stringify(_hlCache)); } catch(e) {}
    _hlFetching = false;
    var g2 = document.querySelector('.bento-grid');
    if (g2) g2.querySelectorAll('.headlines-widget[data-headlines-uid]').forEach(function(w) { updateHeadlinesWidget(w, items, source); });
  };
  var fail = function() {
    _hlFetching = false;
    var g3 = document.querySelector('.bento-grid');
    if (g3) g3.querySelectorAll('.headlines-widget[data-headlines-uid]').forEach(function(w) {
      w.innerHTML = '<div class="hl-error"><span>Could not load headlines</span></div>';
    });
  };
  var jsonUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(cfg.url);
  fetch(jsonUrl, { signal: AbortSignal.timeout(12000) })
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data) {
      if (!data || data.status !== 'ok' || !data.items || !data.items.length) throw new Error('empty');
      var items = data.items.slice(0, 5).map(function(it) {
        return { title: _stripCdata(it.title).replace(/\s+/g, ' '), link: _hlSafeLink(it.link, source) };
      }).filter(function(it) { return it.title; });
      if (!items.length) throw new Error('empty');
      apply(items);
    })
    .catch(function() {
      var xmlUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(cfg.url);
      fetch(xmlUrl, { signal: AbortSignal.timeout(12000) })
        .then(function(r) { if (!r.ok) throw new Error(r.status); return r.text(); })
        .then(function(xmlText) {
          var items = _parseRssHeadlines(xmlText, source);
          if (!items) throw new Error('parse');
          apply(items);
        })
        .catch(fail);
    });
}

function refreshHeadlines() {
  _hlCache = null;
  try {
    var keys = [];
    var pre = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
    for (var i = __origLS.length - 1; i >= 0; i--) {
      var k = __origLS.key(i);
      if (!k) continue;
      var short = pre && k.indexOf(pre) === 0 ? k.slice(pre.length) : k;
      if (short.indexOf('hub-headlines-') === 0) keys.push(k);
    }
    keys.forEach(function(k) { try { __origLS.removeItem(k); } catch(e) {} });
  } catch(e) {}
  var grid = document.querySelector('.bento-grid');
  if (grid) {
    grid.querySelectorAll('.headlines-widget').forEach(function(w) {
      w.innerHTML = '<div class="hl-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Fetching headlines...</span></div>';
    });
    _fetchHeadlines(grid);
  }
}

/* ─── Upcoming widget helpers ───────────────── */
function _upcomingDayLabel(ds) {
  var today = formatDate(new Date());
  if (ds === today) return 'Today';
  var tmr = new Date(); tmr.setDate(tmr.getDate() + 1);
  if (ds === formatDate(tmr)) return 'Tomorrow';
  var d = new Date(ds + 'T00:00:00');
  if (isNaN(d.getTime())) return ds;
  var dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  return dn + ' ' + (d.getMonth() + 1) + '/' + d.getDate();
}
function _upcomingData(days) {
  var today = formatDate(new Date());
  var horizon = new Date(); horizon.setDate(horizon.getDate() + (days || 14));
  var horizonStr = formatDate(horizon);
  var all = (typeof state !== 'undefined' && state && Array.isArray(state.tasks)) ? state.tasks : [];
  var list = all.filter(function(t) {
    return t && t.date && !isWhiteboardTask(t) && !t.completed && t.date >= today && t.date <= horizonStr;
  });
  list.sort(function(a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    var at = a.startTime ? parseTime(a.startTime) : Infinity;
    var bt = b.startTime ? parseTime(b.startTime) : Infinity;
    return at - bt;
  });
  return list;
}

/* ─── Progression helpers (XP, badges, pet, garden) ─── */
function _funCompletions() {
  var raw = [];
  try { raw = JSON.parse(localStorage.getItem('haven-activities-completions') || '[]'); } catch(e) {}
  return Array.isArray(raw) ? raw : [];
}

function _funStats() {
  var raw = _funCompletions();
  var st = _streakData();
  var best = st.best || 0;
  var current = st.current || 0;
  var total = 0, early = 0, late = 0;
  raw.forEach(function(en) {
    if (!en || !en.completedAt) return;
    var d = new Date(en.completedAt);
    if (isNaN(d.getTime())) return;
    total++;
    var h = d.getHours();
    if (h < 7) early++;
    if (h >= 22) late++;
  });
  var xp = total * 10 + best * 25;
  var level = Math.floor(Math.sqrt(xp / 100)) + 1;
  var base = 100 * Math.pow(level - 1, 2);
  var next = 100 * Math.pow(level, 2);
  var span = Math.max(1, next - base);
  var into = xp - base;
  return {
    xp: xp, level: level, into: into, span: span,
    pct: Math.max(0, Math.min(100, Math.round((into / span) * 100))),
    total: total, current: current, best: best,
    early: early, late: late,
    days: st.days || {},
    doneToday: (st.days || {})[_hubTodayKey()] || 0
  };
}

var _BADGE_DEFS = [
  { id:'first',   name:'First Step',     desc:'Complete one activity',       tier:'bronze', test:function(s){ return s.total >= 1; } },
  { id:'ten',     name:'Getting Going',  desc:'10 completions',              tier:'bronze', test:function(s){ return s.total >= 10; } },
  { id:'fifty',   name:'Committed',      desc:'50 completions',              tier:'silver', test:function(s){ return s.total >= 50; } },
  { id:'hundred', name:'Century',        desc:'100 completions',             tier:'silver', test:function(s){ return s.total >= 100; } },
  { id:'fiveh',   name:'Unstoppable',    desc:'500 completions',             tier:'gold',   test:function(s){ return s.total >= 500; } },
  { id:'spark',   name:'Spark',          desc:'3-day streak',                tier:'bronze', test:function(s){ return s.best >= 3; } },
  { id:'week',    name:'Week Warrior',   desc:'7-day streak',                tier:'silver', test:function(s){ return s.best >= 7; } },
  { id:'fort',    name:'Fortnight',      desc:'14-day streak',               tier:'silver', test:function(s){ return s.best >= 14; } },
  { id:'month',   name:'Monthly Master', desc:'30-day streak',               tier:'gold',   test:function(s){ return s.best >= 30; } },
  { id:'cent',    name:'Centurion',      desc:'100-day streak',              tier:'gold',   test:function(s){ return s.best >= 100; } },
  { id:'lvl5',    name:'Rising',         desc:'Reach level 5',               tier:'silver', test:function(s){ return s.level >= 5; } },
  { id:'lvl10',   name:'Veteran',        desc:'Reach level 10',              tier:'gold',   test:function(s){ return s.level >= 10; } },
  { id:'early',   name:'Early Bird',     desc:'Finish something before 7am', tier:'bronze', test:function(s){ return s.early > 0; } },
  { id:'night',   name:'Night Owl',      desc:'Finish something after 10pm', tier:'bronze', test:function(s){ return s.late > 0; } }
];

function _funBadges(s) {
  return _BADGE_DEFS.map(function(b) {
    var earned = false;
    try { earned = !!b.test(s); } catch(e) { earned = false; }
    return { id:b.id, name:b.name, desc:b.desc, tier:b.tier, earned:earned };
  });
}

var _PET_STAGES = [
  { min:1,  name:'Egg',       blurb:'Complete activities to hatch it' },
  { min:3,  name:'Hatchling', blurb:'Small but growing' },
  { min:5,  name:'Rookie',    blurb:'Finding its feet' },
  { min:8,  name:'Companion', blurb:'Reliable and steady' },
  { min:12, name:'Champion',  blurb:'Fully grown' }
];
function _petStage(level) {
  var out = _PET_STAGES[0];
  _PET_STAGES.forEach(function(s) { if (level >= s.min) out = s; });
  return out;
}

function _petSvg(level, fed) {
  var stage = _petStage(level);
  var s = '<svg viewBox="0 0 120 120" class="pet-svg" aria-hidden="true">';
  if (stage.name === 'Egg') {
    s += '<ellipse cx="60" cy="72" rx="30" ry="38" fill="var(--accent)"/>'
      + '<circle cx="50" cy="58" r="4.5" fill="rgba(255,255,255,.45)"/>'
      + '<circle cx="70" cy="78" r="3.5" fill="rgba(255,255,255,.35)"/>'
      + '<circle cx="57" cy="93" r="2.8" fill="rgba(255,255,255,.3)"/>';
  } else {
    s += '<ellipse cx="46" cy="102" rx="10" ry="6" fill="var(--accent)"/>'
      + '<ellipse cx="74" cy="102" rx="10" ry="6" fill="var(--accent)"/>'
      + '<ellipse cx="60" cy="76" rx="32" ry="28" fill="var(--accent)"/>';
    if (stage.name !== 'Hatchling') {
      s += '<path d="M36 58 L42 28 L60 48 Z" fill="var(--accent)"/>'
        + '<path d="M84 58 L78 28 L60 48 Z" fill="var(--accent)"/>';
    }
    if (stage.name === 'Companion' || stage.name === 'Champion') {
      s += '<path d="M90 80 q22 4 14 22" stroke="var(--accent)" stroke-width="7" fill="none" stroke-linecap="round"/>';
    }
    s += '<circle cx="49" cy="70" r="5.5" fill="var(--surface-container)"/>'
      + '<circle cx="71" cy="70" r="5.5" fill="var(--surface-container)"/>'
      + '<circle cx="49" cy="70" r="2.6" fill="var(--text-primary)"/>'
      + '<circle cx="71" cy="70" r="2.6" fill="var(--text-primary)"/>'
      + (fed
        ? '<path d="M52 84 q8 8 16 0" stroke="var(--surface-container)" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
        : '<path d="M52 86 q8 -6 16 0" stroke="var(--surface-container)" stroke-width="2.5" fill="none" stroke-linecap="round"/>');
    if (stage.name === 'Champion') {
      s += '<path d="M40 33 L46 18 L60 29 L74 18 L80 33 Z" fill="#f59e0b"/>';
    }
  }
  return s + '</svg>';
}

function _plantSvg(lvl) {
  var topY = lvl === 0 ? 26 : lvl === 1 ? 20 : lvl === 2 ? 14 : 9;
  var s = '<svg viewBox="0 0 24 32" class="gd-svg" aria-hidden="true">';
  s += '<line x1="12" y1="31" x2="12" y2="' + topY + '" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>';
  if (lvl === 0) {
    s += '<circle cx="12" cy="27" r="2.2" fill="#a16207"/>';
  } else {
    var ly = lvl === 1 ? 21 : lvl === 2 ? 16 : 12;
    s += '<path d="M12 ' + ly + ' q-8 -3 -9 -9 q8 1 9 9 z" fill="#10b981"/>';
    s += '<path d="M12 ' + (ly + 4) + ' q8 -3 9 -9 q-8 1 -9 9 z" fill="#34d399"/>';
    if (lvl >= 2) s += '<path d="M12 ' + (ly - 4) + ' q-7 -3 -8 -8 q7 1 8 8 z" fill="#10b981"/>';
    if (lvl === 3) {
      s += '<circle cx="12" cy="8" r="3.4" fill="#f59e0b"/>'
        + '<circle cx="12" cy="8" r="1.4" fill="#fbbf24"/>';
    }
  }
  return s + '</svg>';
}

/* ─── Sleep debt helpers ────────────────────── */
function _sleepDebtData() {
  var logs = [];
  try { logs = JSON.parse(localStorage.getItem('haven-schedule-sleep') || '[]'); } catch(e) {}
  if (!Array.isArray(logs)) logs = [];
  var target = 480;
  try {
    var t = JSON.parse(localStorage.getItem('haven-schedule-sleep-targets') || '{}');
    if (t && t.targetDuration) target = t.targetDuration;
  } catch(e) {}
  var now = new Date();
  var days = [], slept = 0, logged = 0;
  for (var i = 6; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    var ds = formatDate(d);
    var log = null;
    for (var j = 0; j < logs.length; j++) { if (logs[j] && logs[j].date === ds) { log = logs[j]; break; } }
    var dur = 0;
    if (log) {
      if (log.duration) dur = log.duration;
      else if (log.bedtime && log.wakeTime) {
        var bp = String(log.bedtime).split(':').map(Number);
        var wp = String(log.wakeTime).split(':').map(Number);
        var bm = bp[0] * 60 + bp[1], wm = wp[0] * 60 + wp[1];
        if (!isNaN(bm) && !isNaN(wm)) dur = wm <= bm ? wm + 1440 - bm : wm - bm;
      }
    }
    if (log) { slept += dur; logged++; }
    days.push({ ds:ds, dow:['S','M','T','W','T','F','S'][d.getDay()], dur:dur, has:!!log, today:i === 0 });
  }
  var owed = target * logged;
  var balance = slept - owed;
  var debt = Math.max(0, -balance);
  var credit = Math.max(0, balance);
  return {
    target:target, days:days, slept:slept, logged:logged,
    debt:debt, credit:credit, balance:balance,
    tonight: debt > 0 ? target + debt : target
  };
}

/* ─── Money (piggy bank + wallet) helpers ───── */
function _moneyData() {
  function read(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return { balance:0, history:[] };
      var p = JSON.parse(raw);
      if (typeof p === 'number') return { balance:p, history:[] };
      if (p && typeof p === 'object') return { balance: parseFloat(p.balance) || 0, history: Array.isArray(p.history) ? p.history : [] };
    } catch(e) {}
    return { balance:0, history:[] };
  }
  function delta7(hist, bal) {
    if (!hist || !hist.length) return 0;
    var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    var cut = formatDate(cutoff);
    var past = null;
    hist.forEach(function(h) { if (h && h.d && h.d <= cut) past = h; });
    if (!past) past = hist[0];
    if (!past) return 0;
    return bal - (parseFloat(past.b) || 0);
  }
  var piggy = read('haven-piggybank');
  var wallet = read('haven-wallet');
  var pd = delta7(piggy.history, piggy.balance);
  var wd = delta7(wallet.history, wallet.balance);
  return {
    piggy: piggy.balance, wallet: wallet.balance,
    total: piggy.balance + wallet.balance,
    piggyDelta: pd, walletDelta: wd, totalDelta: pd + wd
  };
}

/* ─── Video feed helpers ────────────────────── */
function _videoMeta(url) {
  var u = String(url || '').trim();
  if (!u) return null;
  var yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return { kind:'yt', id:yt[1], url:u, thumb:'https://img.youtube.com/vi/' + yt[1] + '/mqdefault.jpg' };
  if (/tiktok\.com/.test(u)) {
    var tk = u.match(/\/video\/(\d+)/);
    return { kind:'tt', id: tk ? tk[1] : u, url:u, thumb:'' };
  }
  return { kind:'link', id:u, url:u, thumb:'' };
}
function _ytFeedData() {
  if (!hubContent.ytFeed || !Array.isArray(hubContent.ytFeed.items)) hubContent.ytFeed = { items: [] };
  return hubContent.ytFeed;
}

/* ─── Watchlist helpers ─────────────────────── */
function _watchlistData() {
  if (!hubContent.watchlist || !Array.isArray(hubContent.watchlist.items)) hubContent.watchlist = { items: [] };
  return hubContent.watchlist;
}

/* ─── Music visualiser ──────────────────────── */
var _mvStream = null, _mvAudioCtx = null, _mvAnalyser = null, _mvData = null, _mvLive = [];

function _mvAccent() {
  try {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (v) return v;
  } catch(e) {}
  return '#6366f1';
}

function _mvRelease() {
  if (_mvStream) {
    try { _mvStream.getTracks().forEach(function(t) { t.stop(); }); } catch(e) {}
    _mvStream = null;
  }
  if (_mvAudioCtx) {
    try { _mvAudioCtx.close(); } catch(e) {}
    _mvAudioCtx = null;
  }
  _mvAnalyser = null;
  _mvData = null;
}

function _mvStopStale() {
  _mvLive = _mvLive.filter(function(c) {
    if (!c || !c.isConnected) {
      if (c && c._mvRaf) { cancelAnimationFrame(c._mvRaf); c._mvRaf = null; }
      return false;
    }
    return true;
  });
}

function _mvAnimate(canvas, useMic) {
  if (!canvas) return;
  if (canvas._mvRaf) { cancelAnimationFrame(canvas._mvRaf); canvas._mvRaf = null; }
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var accent = _mvAccent();
  var bars = 28;
  function frame(ts) {
    if (!canvas.isConnected) { canvas._mvRaf = null; return; }
    var w = canvas.width, h = canvas.height;
    if (!w || !h) { canvas._mvRaf = requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, w, h);
    var bw = w / bars, t = ts / 1000;
    for (var i = 0; i < bars; i++) {
      var v;
      if (useMic && _mvAnalyser && _mvData) {
        _mvAnalyser.getByteFrequencyData(_mvData);
        var idx = Math.min(_mvData.length - 1, Math.floor((i / bars) * _mvData.length * 0.7));
        v = Math.max(0.05, _mvData[idx] / 255);
      } else {
        v = Math.max(0.08, (Math.sin(t * 1.8 + i * 0.55) * 0.5 + 0.5) * (0.4 + 0.35 * Math.sin(t * 0.6 + i * 0.18)));
      }
      var bh = Math.max(3, v * (h - 8));
      var x = i * bw + 1.5, bwid = Math.max(1.5, bw - 3), y = h - bh - 2;
      ctx.globalAlpha = 0.35 + 0.65 * v;
      ctx.fillStyle = accent;
      ctx.beginPath();
      if (ctx.roundRect) { ctx.roundRect(x, y, bwid, bh, 2); ctx.fill(); }
      else { ctx.fillRect(x, y, bwid, bh); }
    }
    ctx.globalAlpha = 1;
    canvas._mvRaf = requestAnimationFrame(frame);
  }
  canvas._mvRaf = requestAnimationFrame(frame);
}

function _initMusicViz(grid) {
  if (!grid) return;
  _mvStopStale();
  grid.querySelectorAll('[data-mv-canvas]').forEach(function(c) {
    var wrap = c.closest('.mv-wrap');
    var w = c.clientWidth || (wrap ? wrap.clientWidth : 0) || 240;
    var h = c.clientHeight || 96;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    if (c._mvInit && c._mvRaf) return;
    c._mvInit = true;
    _mvLive.push(c);
    _mvAnimate(c, !!(wrap && wrap.dataset.mvMic === '1'));
  });
}

function _mvToggle(btn) {
  var wrap = btn.closest('.mv-wrap');
  if (!wrap) return;
  var canvas = wrap.querySelector('[data-mv-canvas]');
  var hint = wrap.querySelector('.mv-hint');
  if (wrap.dataset.mvMic === '1') {
    wrap.dataset.mvMic = '0';
    _mvRelease();
    btn.textContent = 'Use mic';
    if (hint) hint.textContent = 'React to sound';
    _mvAnimate(canvas, false);
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (hint) hint.textContent = 'Mic unavailable here';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Starting';
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    _mvRelease();
    _mvStream = stream;
    var AC = window.AudioContext || window.webkitAudioContext;
    _mvAudioCtx = new AC();
    var src = _mvAudioCtx.createMediaStreamSource(stream);
    _mvAnalyser = _mvAudioCtx.createAnalyser();
    _mvAnalyser.fftSize = 128;
    _mvData = new Uint8Array(_mvAnalyser.frequencyBinCount);
    src.connect(_mvAnalyser);
    wrap.dataset.mvMic = '1';
    btn.disabled = false;
    btn.textContent = 'Mic on';
    if (hint) hint.textContent = 'Listening';
    _mvAnimate(canvas, true);
  }).catch(function() {
    btn.disabled = false;
    btn.textContent = 'Use mic';
    if (hint) hint.textContent = 'Mic permission denied';
  });
}

/* ─── Streak widget helpers ─────────────────── */
function _streakData() {
  var raw = [];
  try { raw = JSON.parse(localStorage.getItem('haven-activities-completions') || '[]'); } catch(e) {}
  if (!Array.isArray(raw)) raw = [];
  var days = {};
  raw.forEach(function(en) {
    if (!en || !en.completedAt) return;
    var d = new Date(en.completedAt);
    if (isNaN(d.getTime())) return;
    var k = formatDate(d);
    days[k] = (days[k] || 0) + 1;
  });
  var current = 0;
  var cursor = new Date();
  if (!days[formatDate(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (days[formatDate(cursor)]) { current++; cursor.setDate(cursor.getDate() - 1); }
  var keys = Object.keys(days).sort();
  var best = 0, run = 0, prevTs = null;
  keys.forEach(function(k) {
    var ts = new Date(k + 'T00:00:00').getTime();
    if (prevTs != null && ts - prevTs === 86400000) run++; else run = 1;
    if (run > best) best = run;
    prevTs = ts;
  });
  return { days: days, current: current, best: best, total: raw.length };
}

/* ─── Budget widget helpers ─────────────────── */
function _budgetData() {
  var cfg = hubContent.budget || { monthly: 0 };
  var monthly = Math.max(0, parseFloat(cfg.monthly) || 0);
  var exp = hubContent.expense || { entries: [] };
  var now = new Date();
  var prefix = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var spend = 0, cats = {};
  (exp.entries || []).forEach(function(en) {
    if (!en || en.type === 'income') return;
    var d = String(en.date || '');
    if (d.slice(0, 7) !== prefix) return;
    var amt = parseFloat(en.amount) || 0;
    spend += amt;
    var c = en.category || 'General';
    cats[c] = (cats[c] || 0) + amt;
  });
  var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  var daysLeft = daysInMonth - now.getDate();
  var pct = monthly > 0 ? Math.round((spend / monthly) * 100) : 0;
  return { monthly: monthly, spend: spend, remaining: monthly - spend, pct: pct, cats: cats, daysLeft: daysLeft, daysInMonth: daysInMonth };
}

/* ─── Air quality widget helpers ────────────── */
var _AQ_LEVELS = [
  { max: 50, label: 'Good', color: '#10b981', note: 'Air quality is satisfactory' },
  { max: 100, label: 'Moderate', color: '#eab308', note: 'Acceptable for most people' },
  { max: 150, label: 'Sensitive', color: '#f97316', note: 'Sensitive groups take care' },
  { max: 200, label: 'Unhealthy', color: '#ef4444', note: 'Everyone may feel effects' },
  { max: 300, label: 'Very Unhealthy', color: '#a855f7', note: 'Health alert' },
  { max: Infinity, label: 'Hazardous', color: '#7f1d1d', note: 'Emergency conditions' }
];
function _aqLevel(aqi) {
  if (aqi == null || isNaN(aqi)) return { label: '—', color: 'var(--text-tertiary)', note: '' };
  for (var i = 0; i < _AQ_LEVELS.length; i++) { if (aqi <= _AQ_LEVELS[i].max) return _AQ_LEVELS[i]; }
  return _AQ_LEVELS[_AQ_LEVELS.length - 1];
}
function _uvLevel(uv) {
  if (uv == null || isNaN(uv)) return { label: '—', color: 'var(--text-tertiary)' };
  if (uv < 3) return { label: 'Low', color: '#10b981' };
  if (uv < 6) return { label: 'Moderate', color: '#eab308' };
  if (uv < 8) return { label: 'High', color: '#f97316' };
  if (uv < 11) return { label: 'Very High', color: '#ef4444' };
  return { label: 'Extreme', color: '#a855f7' };
}
var _aqLastData = null;
var _aqFetched = false;
var _AQ_CACHE_KEY = 'hub-air-quality';

function _aqCacheKeyFor(lat, lon) { return 'hub-air-' + Math.round(lat * 10) + '-' + Math.round(lon * 10); }
function _aqErrHtml(msg) { return '<div class="aq-error"><span>' + escapeHtml(msg) + '</span></div>'; }

function updateAqWidget(widget, data) {
  if (!widget) return;
  if (!data || data.aqi == null) { widget.innerHTML = _aqErrHtml('Air quality unavailable'); return; }
  var style = widget.dataset.aqStyle || 'default';
  var aqi = data.aqi;
  var lvl = _aqLevel(aqi);
  var uv = data.uv;
  var uvl = _uvLevel(uv);
  var loc = data.locName ? '<span class="aq-loc">' + escapeHtml(data.locName) + '</span>' : '';
  var poll = [
    { k: 'PM2.5', v: data.pm25, unit: 'µg/m³' },
    { k: 'PM10', v: data.pm10, unit: 'µg/m³' },
    { k: 'O₃', v: data.ozone, unit: 'µg/m³' },
    { k: 'NO₂', v: data.no2, unit: 'µg/m³' }
  ];
  var fmtV = function(v) { return (v == null || isNaN(v)) ? '—' : (Math.round(v * 10) / 10); };
  var refreshBtn = '<button class="aq-refresh" data-aq-refresh title="Refresh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>';
  var body = '';
  if (style === 'minimal') {
    body = '<div class="aq-min"><span class="aq-min-dot" style="background:' + lvl.color + '"></span><span class="aq-min-val">' + Math.round(aqi) + '</span><span class="aq-min-lbl">' + lvl.label + '</span>' + refreshBtn + '</div><div class="aq-min-sub">UV ' + fmtV(uv) + ' · ' + uvl.label + loc + '</div>';
  } else if (style === 'grid') {
    body = '<div class="aq-head"><span class="aq-badge" style="background:' + lvl.color + '22;color:' + lvl.color + '">' + lvl.label + '</span>' + loc + refreshBtn + '</div><div class="aq-grid">' + poll.map(function(p) { return '<div class="aq-cell"><span class="aq-cell-k">' + p.k + '</span><span class="aq-cell-v">' + fmtV(p.v) + '</span><span class="aq-cell-u">' + p.unit + '</span></div>'; }).join('') + '<div class="aq-cell"><span class="aq-cell-k">UV</span><span class="aq-cell-v" style="color:' + uvl.color + '">' + fmtV(uv) + '</span><span class="aq-cell-u">' + uvl.label + '</span></div></div>';
  } else {
    body = '<div class="aq-hero"><div class="aq-hero-score"><span class="aq-hero-num" style="color:' + lvl.color + '">' + Math.round(aqi) + '</span><span class="aq-hero-unit">US AQI</span></div><div class="aq-hero-meta"><span class="aq-hero-label" style="color:' + lvl.color + '">' + lvl.label + '</span><span class="aq-hero-note">' + lvl.note + '</span>' + loc + '</div>' + refreshBtn + '</div><div class="aq-poll">' + poll.map(function(p) { return '<div class="aq-poll-item"><span class="aq-poll-k">' + p.k + '</span><span class="aq-poll-v">' + fmtV(p.v) + '</span></div>'; }).join('') + '<div class="aq-poll-item"><span class="aq-poll-k">UV</span><span class="aq-poll-v" style="color:' + uvl.color + '">' + fmtV(uv) + ' ' + uvl.label + '</span></div></div>';
  }
  widget.innerHTML = body;
}

function _loadAqForCoords(lat, lon, locName, widgets) {
  var list = Array.prototype.slice.call(widgets || []);
  if (!list.length) return;
  var cacheKey = _aqCacheKeyFor(lat, lon);
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(cacheKey)); } catch(e) {}
  if (cached && Date.now() - cached.ts < 1800000 && cached.data && cached.data.aqi != null) {
    _aqLastData = cached.data;
    if (locName && !_aqLastData.locName) _aqLastData.locName = locName;
    list.forEach(function(w) { updateAqWidget(w, _aqLastData); });
    return;
  }
  var url = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon + '&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,uv_index&timezone=auto';
  fetch(url, { signal: AbortSignal.timeout(12000) }).then(function(r) { return r.json(); }).then(function(data) {
    var cur = data && data.current;
    if (!cur || cur.us_aqi == null) throw new Error('bad');
    var wd = {
      aqi: cur.us_aqi,
      pm25: cur.pm2_5,
      pm10: cur.pm10,
      ozone: cur.ozone,
      no2: cur.nitrogen_dioxide,
      uv: cur.uv_index,
      locName: locName || ''
    };
    if (!wd.locName) {
      var prev = _getSavedWeatherLoc();
      if (prev && Math.abs(prev.lat - lat) < 0.06 && Math.abs(prev.lon - lon) < 0.06 && prev.name) wd.locName = prev.name;
    }
    _aqLastData = wd;
    try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: wd })); } catch(e) {}
    list.forEach(function(w) { updateAqWidget(w, wd); });
  }).catch(function() {
    list.forEach(function(w) { w.innerHTML = _aqErrHtml('Could not load air quality'); });
  });
}

function _fetchAirQuality(grid) {
  var widgets = grid.querySelectorAll('.aq-widget[data-aq-uid]');
  if (widgets.length === 0) return;
  if (_aqLastData) { widgets.forEach(function(w) { updateAqWidget(w, _aqLastData); }); return; }
  if (_aqFetched) return;
  _aqFetched = true;
  var saved = _getSavedWeatherLoc();
  if (saved) { _loadAqForCoords(saved.lat, saved.lon, saved.name, widgets); return; }
  if (typeof navigator !== 'undefined' && navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    try {
      navigator.geolocation.getCurrentPosition(function(pos) {
        _loadAqForCoords(pos.coords.latitude, pos.coords.longitude, 'Current location', widgets);
      }, function() {
        fetch('https://ipapi.co/json/').then(function(r) { return r.json(); }).then(function(d) {
          var lat = parseFloat(d && (d.latitude != null ? d.latitude : d.lat));
          var lon = parseFloat(d && (d.longitude != null ? d.longitude : d.lon));
          if (!isFinite(lat) || !isFinite(lon)) throw new Error('no-coords');
          _loadAqForCoords(lat, lon, [d.city, d.country_name || d.country].filter(Boolean).join(', '), widgets);
        }).catch(function() {
          widgets.forEach(function(w) { w.innerHTML = _aqErrHtml('Could not detect location'); });
        });
      }, { timeout: 8000, enableHighAccuracy: false });
    } catch(e) {
      widgets.forEach(function(w) { w.innerHTML = _aqErrHtml('Could not detect location'); });
    }
  } else {
    _fetchAirQualityByIP(widgets);
  }
}

function _fetchAirQualityByIP(widgets) {
  var list = Array.prototype.slice.call(widgets || []);
  if (!list.length) return;
  fetch('https://ipapi.co/json/').then(function(r) { return r.json(); }).then(function(d) {
    var lat = parseFloat(d && (d.latitude != null ? d.latitude : d.lat));
    var lon = parseFloat(d && (d.longitude != null ? d.longitude : d.lon));
    if (!isFinite(lat) || !isFinite(lon)) throw new Error('no-coords');
    _loadAqForCoords(lat, lon, [d.city, d.country_name || d.country].filter(Boolean).join(', '), list);
  }).catch(function() {
    list.forEach(function(w) { w.innerHTML = _aqErrHtml('Could not detect location'); });
  });
}

function refreshAirQuality() {
  _aqLastData = null;
  _aqFetched = false;
  try {
    var keys = [];
    var pre = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
    var store = (typeof __origLS !== 'undefined' && __origLS && __origLS.length !== undefined) ? __origLS : localStorage;
    for (var i = store.length - 1; i >= 0; i--) {
      var k = store.key(i);
      if (!k) continue;
      var short = pre && k.indexOf(pre) === 0 ? k.slice(pre.length) : k;
      if (short.indexOf('hub-air-') === 0) keys.push(k);
    }
    keys.forEach(function(k) { try { store.removeItem(k); } catch(e) {} });
  } catch(e) {}
  var grid = document.querySelector('.bento-grid');
  if (!grid) return;
  grid.querySelectorAll('.aq-widget').forEach(function(w) {
    w.innerHTML = '<div class="aq-loading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>Loading air quality...</span></div>';
  });
  _fetchAirQuality(grid);
}

/* ─── World clock widget helpers ────────────── */
var _WCL_CITIES = [
  { tz: 'Pacific/Honolulu', label: 'Honolulu' },
  { tz: 'America/Los_Angeles', label: 'Los Angeles' },
  { tz: 'America/Denver', label: 'Denver' },
  { tz: 'America/Chicago', label: 'Chicago' },
  { tz: 'America/New_York', label: 'New York' },
  { tz: 'America/Toronto', label: 'Toronto' },
  { tz: 'America/Mexico_City', label: 'Mexico City' },
  { tz: 'America/Sao_Paulo', label: 'São Paulo' },
  { tz: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires' },
  { tz: 'Europe/London', label: 'London' },
  { tz: 'Europe/Dublin', label: 'Dublin' },
  { tz: 'Europe/Paris', label: 'Paris' },
  { tz: 'Europe/Berlin', label: 'Berlin' },
  { tz: 'Europe/Madrid', label: 'Madrid' },
  { tz: 'Europe/Rome', label: 'Rome' },
  { tz: 'Europe/Amsterdam', label: 'Amsterdam' },
  { tz: 'Europe/Lisbon', label: 'Lisbon' },
  { tz: 'Europe/Moscow', label: 'Moscow' },
  { tz: 'Europe/Istanbul', label: 'Istanbul' },
  { tz: 'Africa/Cairo', label: 'Cairo' },
  { tz: 'Africa/Lagos', label: 'Lagos' },
  { tz: 'Africa/Johannesburg', label: 'Johannesburg' },
  { tz: 'Africa/Nairobi', label: 'Nairobi' },
  { tz: 'Asia/Dubai', label: 'Dubai' },
  { tz: 'Asia/Karachi', label: 'Karachi' },
  { tz: 'Asia/Kolkata', label: 'Mumbai' },
  { tz: 'Asia/Dhaka', label: 'Dhaka' },
  { tz: 'Asia/Bangkok', label: 'Bangkok' },
  { tz: 'Asia/Jakarta', label: 'Jakarta' },
  { tz: 'Asia/Shanghai', label: 'Shanghai' },
  { tz: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { tz: 'Asia/Singapore', label: 'Singapore' },
  { tz: 'Asia/Tokyo', label: 'Tokyo' },
  { tz: 'Asia/Seoul', label: 'Seoul' },
  { tz: 'Australia/Perth', label: 'Perth' },
  { tz: 'Australia/Sydney', label: 'Sydney' },
  { tz: 'Pacific/Auckland', label: 'Auckland' },
  { tz: 'UTC', label: 'UTC' }
];
function _wclCity(tz) {
  for (var i = 0; i < _WCL_CITIES.length; i++) { if (_WCL_CITIES[i].tz === tz) return _WCL_CITIES[i]; }
  return { tz: tz, label: String(tz || '').split('/').pop().replace(/_/g, ' ') };
}
function _wclParts(tz, d) {
  d = d || new Date();
  try {
    var parts = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, weekday: 'short', day: 'numeric', month: 'short' })
      .formatToParts(d).forEach(function(p) { parts[p.type] = p.value; });
    return parts;
  } catch(e) { return null; }
}
function _wclOffset(tz, d) {
  d = d || new Date();
  try {
    var localKey = formatDate(d);
    var tzKey = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    return Math.round((new Date(tzKey + 'T00:00:00') - new Date(localKey + 'T00:00:00')) / 86400000);
  } catch(e) { return 0; }
}
function _wclTime(tz, d) {
  var p = _wclParts(tz, d);
  return p ? (p.hour + ':' + p.minute) : '--:--';
}
var _wclInterval = null;

/* ─── Generic geolocation resolver ──────────── */
function _geoByIP(cb) {
  fetch('https://ipapi.co/json/').then(function(r) { return r.json(); }).then(function(d) {
    var lat = parseFloat(d && (d.latitude != null ? d.latitude : d.lat));
    var lon = parseFloat(d && (d.longitude != null ? d.longitude : d.lon));
    if (!isFinite(lat) || !isFinite(lon)) throw new Error('no-coords');
    cb(lat, lon, [d.city, d.country_name || d.country].filter(Boolean).join(', '));
  }).catch(function() { cb(NaN, NaN, ''); });
}
function _resolveGeo(cb) {
  var saved = _getSavedWeatherLoc();
  if (saved) { cb(saved.lat, saved.lon, saved.name); return; }
  if (typeof navigator !== 'undefined' && navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    try {
      navigator.geolocation.getCurrentPosition(function(pos) { cb(pos.coords.latitude, pos.coords.longitude, 'Current location'); },
        function() { _geoByIP(cb); }, { timeout: 8000, enableHighAccuracy: false });
      return;
    } catch(e) {}
  }
  _geoByIP(cb);
}

/* ─── Savings goal helpers ──────────────────── */
function _savingsData() {
  var s = hubContent.savings || {};
  var target = Math.max(0, parseFloat(s.target) || 0);
  var saved = Math.max(0, parseFloat(s.saved) || 0);
  var pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  return { name: s.name || 'Savings Goal', target: target, saved: saved, remaining: Math.max(0, target - saved), pct: pct };
}

/* ─── Focus log helpers ─────────────────────── */
function _focusCfg() {
  if (!hubContent.focusCfg || typeof hubContent.focusCfg.sessionMinutes !== 'number') hubContent.focusCfg = { sessionMinutes: 25 };
  return hubContent.focusCfg;
}
function _focusData() {
  var log = hubContent.focusLog || {};
  var todayKey = formatDate(new Date());
  var today = log[todayKey] || { sessions: 0, minutes: 0 };
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(); d.setDate(d.getDate() - i);
    var k = formatDate(d);
    var e = log[k] || { sessions: 0, minutes: 0 };
    days.push({ key: k, dow: ['S','M','T','W','T','F','S'][d.getDay()], minutes: e.minutes || 0, sessions: e.sessions || 0 });
  }
  var weekMinutes = days.reduce(function(s, x) { return s + x.minutes; }, 0);
  return { today: { sessions: today.sessions || 0, minutes: today.minutes || 0 }, days: days, weekMinutes: weekMinutes };
}
function _pruneFocusLog() {
  if (!hubContent.focusLog) return;
  var cut = formatDate(new Date(Date.now() - 90 * 86400000));
  Object.keys(hubContent.focusLog).forEach(function(k) { if (k < cut) delete hubContent.focusLog[k]; });
}


/* ─── Currency converter helpers ─────────────── */
var _CURRENCIES = ['USD','EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR','BRL','MXN','KRW','SGD','HKD','SEK','NOK','NZD','ZAR','TRY','PLN','THB','CZK'];
var _curRates = {};
var _curFetchedBase = null;
var _curFetched = false;
function _curFormat(n) {
  if (n == null || isNaN(n)) return '—';
  var dec = Math.abs(n) >= 1 ? 2 : 4;
  try { return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: dec }).format(n); } catch(e) { return n.toFixed(dec); }
}
function updateCurrencyWidget(widget, base, rates) {
  if (!widget || !rates) return;
  var style = widget.dataset.curStyle || 'default';
  var cfg = hubContent.currency || {};
  var amt = parseFloat(cfg.amount); if (isNaN(amt)) amt = 0;
  if (style === 'rates') {
    var targets = ['EUR','GBP','JPY','CAD','AUD','CHF','CNY','INR'];
    var rows = targets.filter(function(t) { return t !== base; }).map(function(t) {
      var r = rates[t];
      return '<div class="cur-rate-row"><span class="cur-rate-code">' + t + '</span><span class="cur-rate-val">' + (r != null ? _curFormat(amt * r) + ' ' + t : '—') + '</span></div>';
    }).join('');
    var box = widget.querySelector('[data-cur-rates]');
    if (box) box.innerHTML = rows || '<span class="cur-loading">No rates</span>';
    return;
  }
  var to = cfg.to || 'EUR';
  var el = widget.querySelector('[data-cur-result]');
  if (el) { var r2 = rates[to]; el.textContent = (r2 != null) ? (_curFormat(amt * r2) + ' ' + to) : '—'; }
}
function _fetchCurrency(grid) {
  var widgets = grid.querySelectorAll('.cur-widget[data-cur-uid]');
  if (widgets.length === 0) return;
  var cfg = hubContent.currency || { from: 'USD', to: 'EUR', amount: 1 };
  var base = cfg.from || 'USD';
  if (_curRates[base]) widgets.forEach(function(w) { updateCurrencyWidget(w, base, _curRates[base]); });
  if (_curFetchedBase === base && _curRates[base]) return;
  if (_curFetched) return;
  _curFetched = true;
  var cacheKey = 'hub-currency-' + base;
  if (!_curRates[base]) {
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.ts < 1800000 && cached.rates) {
        _curRates[base] = cached.rates; _curFetchedBase = base; _curFetched = false;
        var g0 = document.querySelector('.bento-grid');
        if (g0) g0.querySelectorAll('.cur-widget[data-cur-uid]').forEach(function(w) { updateCurrencyWidget(w, base, cached.rates); });
        return;
      }
    } catch(e) {}
  }
  fetch('https://api.frankfurter.app/latest?from=' + encodeURIComponent(base), { signal: AbortSignal.timeout(12000) })
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data) {
      if (!data || !data.rates) throw new Error('empty');
      _curRates[base] = data.rates; _curFetchedBase = base; _curFetched = false;
      try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), rates: data.rates })); } catch(e) {}
      var g = document.querySelector('.bento-grid');
      if (g) g.querySelectorAll('.cur-widget[data-cur-uid]').forEach(function(w) { updateCurrencyWidget(w, base, data.rates); });
    })
    .catch(function() {
      _curFetched = false;
      var g3 = document.querySelector('.bento-grid');
      if (g3) g3.querySelectorAll('.cur-widget[data-cur-uid]').forEach(function(w) {
        var el = w.querySelector('[data-cur-result]'); if (el) el.textContent = '—';
        var box = w.querySelector('[data-cur-rates]'); if (box) box.innerHTML = '<span class="cur-loading">Could not load rates</span>';
      });
    });
}
function refreshCurrency() {
  _curRates = {}; _curFetchedBase = null; _curFetched = false;
  try {
    var keys = []; var pre = (typeof getStoragePrefix === 'function') ? getStoragePrefix() : '';
    var store = (typeof __origLS !== 'undefined' && __origLS && __origLS.length !== undefined) ? __origLS : localStorage;
    for (var i = store.length - 1; i >= 0; i--) { var k = store.key(i); if (!k) continue; var short = pre && k.indexOf(pre) === 0 ? k.slice(pre.length) : k; if (short.indexOf('hub-currency-') === 0) keys.push(k); }
    keys.forEach(function(k) { try { store.removeItem(k); } catch(e) {} });
  } catch(e) {}
  var grid = document.querySelector('.bento-grid');
  if (grid) _fetchCurrency(grid);
}

/* ─── Calculator helpers ─────────────────────── */
function _calcState(uid) {
  if (!hubContent.calcStates || typeof hubContent.calcStates !== 'object') hubContent.calcStates = {};
  var st = hubContent.calcStates[uid];
  if (!st || typeof st !== 'object') { st = { expr: '', result: '', hist: [] }; hubContent.calcStates[uid] = st; }
  if (typeof st.expr !== 'string') st.expr = '';
  if (typeof st.result !== 'string') st.result = '';
  if (!Array.isArray(st.hist)) st.hist = [];
  return st;
}
function _calcFmt(v) {
  if (v == null || !isFinite(v)) return '';
  var r = Math.round(v * 1e10) / 1e10;
  return Number.isInteger(r) ? String(r) : String(parseFloat(r.toFixed(8)));
}
function _calcEval(input) {
  var s = String(input || '').replace(/\u00D7/g, '*').replace(/\u00F7/g, '/').replace(/\u2212/g, '-').replace(/\s+/g, '');
  if (!s) return null;
  var i = 0;
  function peek() { return s[i]; }
  function parseExpr() {
    var v = parseTerm();
    while (peek() === '+' || peek() === '-') { var op = s[i++]; var r = parseTerm(); v = op === '+' ? v + r : v - r; }
    return v;
  }
  function parseTerm() {
    var v = parseFactor();
    while (peek() === '*' || peek() === '/') { var op = s[i++]; var r = parseFactor(); if (op === '*') v *= r; else { if (r === 0) throw new Error('div0'); v /= r; } }
    return v;
  }
  function parseFactor() {
    var v = parseUnary();
    if (peek() === '^') { i++; var r = parseFactor(); v = Math.pow(v, r); }
    return v;
  }
  function parseUnary() {
    if (peek() === '-') { i++; return -parseUnary(); }
    if (peek() === '+') { i++; return parseUnary(); }
    return parsePostfix();
  }
  function parsePostfix() {
    var v = parsePrimary();
    while (peek() === '%') { i++; v = v / 100; }
    return v;
  }
  function parsePrimary() {
    if (peek() === '(') { i++; var v = parseExpr(); if (peek() !== ')') throw new Error('paren'); i++; return v; }
    if (peek() === '\u221A') { i++; return Math.sqrt(parseUnary()); }
    var start = i;
    while (i < s.length && /[0-9.]/.test(s[i])) i++;
    if (i === start) throw new Error('syntax');
    var tok = s.slice(start, i);
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(tok)) throw new Error('syntax');
    var n = parseFloat(tok);
    if (isNaN(n)) throw new Error('syntax');
    return n;
  }
  var val = parseExpr();
  if (i !== s.length) throw new Error('syntax');
  if (!isFinite(val)) throw new Error('num');
  return val;
}
function _calcRefreshDom(uid) {
  var st = _calcState(uid);
  document.querySelectorAll('.w-calc[data-calc-uid="' + uid + '"]').forEach(function(root) {
    var ex = root.querySelector('.w-calc-expr'); if (ex) ex.textContent = st.expr || '0';
    var rs = root.querySelector('.w-calc-result'); if (rs) rs.textContent = st.result ? ('= ' + st.result) : '';
  });
}
function _calcApplyKey(uid, key) {
  var st = _calcState(uid);
  if (key === 'C') { st.expr = ''; st.result = ''; }
  else if (key === '\u2190') { st.expr = st.expr.slice(0, -1); st.result = ''; }
  else if (key === '=') {
    try {
      var val = _calcEval(st.expr);
      if (val == null) { st.result = ''; }
      else {
        var out = _calcFmt(val);
        st.result = out;
        if (st.expr) st.hist = [{ expr: st.expr, result: out }].concat(st.hist).slice(0, 12);
      }
    } catch(e) { st.result = 'Error'; }
  } else { st.expr = (st.expr || '') + key; st.result = ''; }
  saveHubContent();
  var root = document.querySelector('.w-calc[data-calc-uid="' + uid + '"]');
  if (root && root.classList.contains('w-calc-history')) renderHubBento();
  else _calcRefreshDom(uid);
}

/* ─── Breathing helpers ─────────────────────── */
var _BREATH_PATTERNS = [
  { id: 'box', name: 'Box 4-4-4-4', phases: [{ label: 'Breathe in', dir: 'in', sec: 4 }, { label: 'Hold', dir: 'hold', sec: 4 }, { label: 'Breathe out', dir: 'out', sec: 4 }, { label: 'Hold', dir: 'hold', sec: 4 }] },
  { id: '478', name: 'Relax 4-7-8', phases: [{ label: 'Breathe in', dir: 'in', sec: 4 }, { label: 'Hold', dir: 'hold', sec: 7 }, { label: 'Breathe out', dir: 'out', sec: 8 }] },
  { id: 'calm', name: 'Calm 4-6', phases: [{ label: 'Breathe in', dir: 'in', sec: 4 }, { label: 'Breathe out', dir: 'out', sec: 6 }] },
  { id: 'equal', name: 'Equal 5-5', phases: [{ label: 'Breathe in', dir: 'in', sec: 5 }, { label: 'Breathe out', dir: 'out', sec: 5 }] }
];
function _breathPattern(id) {
  for (var i = 0; i < _BREATH_PATTERNS.length; i++) { if (_BREATH_PATTERNS[i].id === id) return _BREATH_PATTERNS[i].phases; }
  return _BREATH_PATTERNS[0].phases;
}
function _breathCfg() {
  if (!hubContent.breathing || typeof hubContent.breathing !== 'object') hubContent.breathing = { pattern: 'box', cycles: 0, date: '' };
  var today = formatDate(new Date());
  if (hubContent.breathing.date !== today) { hubContent.breathing.date = today; hubContent.breathing.cycles = 0; }
  if (!hubContent.breathing.pattern) hubContent.breathing.pattern = 'box';
  return hubContent.breathing;
}
var _breathStates = {};
var _breathInterval = null;
function _breathState(uid) {
  if (!_breathStates[uid]) _breathStates[uid] = { running: false, cycleStart: 0, scale: 0.6, cycles: 0 };
  return _breathStates[uid];
}
function _breathRefreshDom(uid) {
  var st = _breathState(uid);
  var p = _breathPattern(_breathCfg().pattern);
  var total = p.reduce(function(s, x) { return s + x.sec; }, 0);
  var now = Date.now();
  var t = st.running ? (((now - st.cycleStart) / 1000) % total) : 0;
  var acc = 0, ph = p[0], idx = 0;
  for (var i = 0; i < p.length; i++) { if (t < acc + p[i].sec) { ph = p[i]; idx = i; break; } acc += p[i].sec; }
  var targetScale = ph.dir === 'in' ? 1 : ph.dir === 'out' ? 0.45 : st.scale;
  document.querySelectorAll('.w-breath[data-breath-uid="' + uid + '"]').forEach(function(root) {
    var circle = root.querySelector('.w-breath-circle');
    if (circle) {
      if (st.running) { circle.style.transitionDuration = ph.sec + 's'; circle.style.transform = 'scale(' + targetScale + ')'; }
      else { circle.style.transitionDuration = '600ms'; circle.style.transform = 'scale(0.6)'; }
    }
    var phEl = root.querySelector('.w-breath-phase'); if (phEl) phEl.textContent = st.running ? ph.label : 'Ready';
    var ctEl = root.querySelector('.w-breath-count'); if (ctEl) ctEl.textContent = st.running ? String(Math.max(1, Math.ceil(ph.sec - (t - acc)))) : '';
    var tg = root.querySelector('[data-breath-toggle]'); if (tg) tg.textContent = st.running ? 'Stop' : 'Start';
    root.classList.toggle('w-breath-running', !!st.running);
  });
  if (ph.dir === 'in') st.scale = 1; else if (ph.dir === 'out') st.scale = 0.45;
}
function _breathTickAll() {
  var now = Date.now();
  var anyRunning = false;
  document.querySelectorAll('.w-breath[data-breath-uid]').forEach(function(root) {
    var uid = root.dataset.breathUid;
    var st = _breathState(uid);
    if (!st.running) return;
    anyRunning = true;
    var p = _breathPattern(_breathCfg().pattern);
    var total = p.reduce(function(s, x) { return s + x.sec; }, 0);
    var cycles = Math.floor((now - st.cycleStart) / 1000 / total);
    if (cycles !== st.cycles) {
      var delta = cycles - st.cycles;
      st.cycles = cycles;
      var cfg = _breathCfg();
      cfg.cycles = (cfg.cycles || 0) + delta;
      saveHubContent();
      var meta = root.querySelector('.w-breath-cycles'); if (meta) meta.textContent = cfg.cycles;
    }
    _breathRefreshDom(uid);
  });
  if (!anyRunning && _breathInterval) { clearInterval(_breathInterval); _breathInterval = null; }
}
function _breathToggle(uid) {
  var st = _breathState(uid);
  if (st.running) {
    st.running = false;
    if (_breathInterval) { clearInterval(_breathInterval); _breathInterval = null; }
  } else {
    st.running = true; st.cycleStart = Date.now(); st.cycles = 0; st.scale = 0.6;
    if (!_breathInterval) _breathInterval = setInterval(_breathTickAll, 250);
  }
  _breathRefreshDom(uid);
}
function _breathReset(uid) {
  var st = _breathState(uid);
  st.running = false; st.cycles = 0; st.scale = 0.6; st.cycleStart = 0;
  if (_breathInterval) { clearInterval(_breathInterval); _breathInterval = null; }
  _breathRefreshDom(uid);
}


/* ─── Doodle helpers ────────────────────────── */
function _doodleSaved(uid) { return (hubContent.doodles && hubContent.doodles[uid]) || ''; }
function _doodleSave(uid, data) {
  if (!hubContent.doodles) hubContent.doodles = {};
  hubContent.doodles[uid] = data;
  saveHubContent();
}
function _initDoodles(grid) {
  if (!grid) return;
  grid.querySelectorAll('.w-doodle-canvas[data-doodle-uid]').forEach(function(canvas) {
    var uid = canvas.dataset.doodleUid;
    var wrap = canvas.closest('.w-dd-wrap');
    var style = 'default';
    if (wrap) { var m = wrap.className.match(/w-dd-(\w+)/); if (m) style = m[1]; }
    var cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    if (!cssW || cssW < 20) cssW = 240;
    if (!cssH || cssH < 20) cssH = 150;
    canvas.width = Math.round(cssW);
    canvas.height = Math.round(cssH);
    var ctx = canvas.getContext('2d');
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    canvas._ddColor = style === 'dark' ? '#e5e2e1' : '#1c1b1b';
    var saved = _doodleSaved(uid);
    if (saved) {
      var img = new Image();
      img.onload = function() { try { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); } catch(e) {} };
      img.src = saved;
      if (wrap) wrap.classList.add('has-ink');
    }
    var drawing = false, lastX = 0, lastY = 0;
    function pos(ev) {
      var r = canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left) * (canvas.width / r.width), y: (ev.clientY - r.top) * (canvas.height / r.height) };
    }
    function down(ev) {
      drawing = true;
      var p = pos(ev); lastX = p.x; lastY = p.y;
      ctx.strokeStyle = canvas._ddColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 0.01, p.y + 0.01); ctx.stroke();
      if (wrap) wrap.classList.add('has-ink');
      try { canvas.setPointerCapture(ev.pointerId); } catch(e) {}
      ev.preventDefault();
    }
    function move(ev) {
      if (!drawing) return;
      var p = pos(ev);
      ctx.strokeStyle = canvas._ddColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke();
      lastX = p.x; lastY = p.y;
      ev.preventDefault();
    }
    function up() { if (!drawing) return; drawing = false; _doodleSave(uid, canvas.toDataURL('image/png')); }
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    canvas.addEventListener('pointercancel', up);
  });
}
function _doodleSetColor(uid, color) {
  document.querySelectorAll('.w-doodle-canvas[data-doodle-uid="' + uid + '"]').forEach(function(c) { c._ddColor = color; });
  document.querySelectorAll('.w-dd-color[data-doodle-color="' + uid + '"]').forEach(function(b) { b.classList.toggle('active', b.dataset.color === color); });
}
function _doodleClear(uid) {
  document.querySelectorAll('.w-doodle-canvas[data-doodle-uid="' + uid + '"]').forEach(function(c) {
    var ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    var w = c.closest('.w-dd-wrap'); if (w) w.classList.remove('has-ink');
  });
  if (hubContent.doodles) delete hubContent.doodles[uid];
  saveHubContent();
}

/* ─── GitHub helpers ────────────────────────── */
var _ghCache = {};
var _ghFetchedUser = null;
function _ghFmtNum(n) { if (n == null) return '—'; return n >= 1000 ? (Math.round(n / 100) / 10).toFixed(1).replace(/\.0$/, '') + 'k' : String(n); }
function updateGithubWidget(widget, data) {
  if (!widget) return;
  if (!data || !data.user) { widget.innerHTML = '<div class="gh-error"><span>User not found</span></div>'; return; }
  var style = widget.dataset.ghStyle || 'default';
  var u = data.user;
  var repos = Array.isArray(data.repos) ? data.repos : [];
  var stars = repos.reduce(function(s, r) { return s + (r.stargazers_count || 0); }, 0);
  var avatar = u.avatar_url ? '<img class="gh-avatar" src="' + escapeHtml(u.avatar_url) + '" alt="" loading="lazy">' : '';
  if (style === 'compact') {
    widget.innerHTML = '<div class="gh-compact">' + avatar + '<div class="gh-compact-info"><span class="gh-name">' + escapeHtml(u.name || u.login) + '</span><span class="gh-login">@' + escapeHtml(u.login) + '</span><span class="gh-compact-stats">' + _ghFmtNum(u.public_repos) + ' repos · ' + _ghFmtNum(u.followers) + ' followers · ' + _ghFmtNum(stars) + ' stars</span></div></div>';
  } else if (style === 'repos') {
    var top = repos.slice().sort(function(a, b) { return (b.stargazers_count || 0) - (a.stargazers_count || 0); }).slice(0, 5);
    var starSvg = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none" style="width:10px;height:10px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    widget.innerHTML = '<div class="gh-repos">' + (top.length ? top.map(function(r) {
      return '<a class="gh-repo" href="' + escapeHtml(r.html_url || '#') + '" target="_blank" rel="noopener"><span class="gh-repo-name">' + escapeHtml(r.name || '') + '</span><span class="gh-repo-stars">' + starSvg + ' ' + (r.stargazers_count || 0) + '</span></a>';
    }).join('') : '<span class="gh-empty">No public repos</span>') + '</div>';
  } else {
    widget.innerHTML = '<div class="gh-hero">' + avatar + '<div class="gh-hero-info"><span class="gh-name">' + escapeHtml(u.name || u.login) + '</span><span class="gh-login">@' + escapeHtml(u.login) + '</span>' + (u.bio ? '<span class="gh-bio">' + escapeHtml(String(u.bio).slice(0, 72)) + '</span>' : '') + '</div></div><div class="gh-stats"><div class="gh-stat"><span class="gh-stat-val">' + _ghFmtNum(u.public_repos) + '</span><span class="gh-stat-lbl">repos</span></div><div class="gh-stat"><span class="gh-stat-val">' + _ghFmtNum(u.followers) + '</span><span class="gh-stat-lbl">followers</span></div><div class="gh-stat"><span class="gh-stat-val">' + _ghFmtNum(stars) + '</span><span class="gh-stat-lbl">stars</span></div></div>';
  }
}
function _fetchGithub(grid) {
  var widgets = grid.querySelectorAll('.gh-widget[data-gh-uid]');
  if (widgets.length === 0) return;
  var user = (hubContent.github && hubContent.github.username) || '';
  if (!user) { widgets.forEach(function(w) { if (!w.querySelector('.gh-empty')) w.innerHTML = '<div class="gh-empty">No username set</div>'; }); return; }
  if (_ghCache[user]) { widgets.forEach(function(w) { updateGithubWidget(w, _ghCache[user]); }); return; }
  var key = 'hub-github-' + user.toLowerCase();
  try {
    var cached = JSON.parse(localStorage.getItem(key) || 'null');
    if (cached && Date.now() - cached.ts < 1800000 && cached.data) {
      _ghCache[user] = cached.data;
      widgets.forEach(function(w) { updateGithubWidget(w, cached.data); });
      return;
    }
  } catch(e) {}
  if (_ghFetchedUser === user) return;
  _ghFetchedUser = user;
  widgets.forEach(function(w) { w.innerHTML = '<div class="gh-loading"><span>Loading GitHub...</span></div>'; });
  var base = 'https://api.github.com/users/' + encodeURIComponent(user);
  var hdrs = { headers: { 'Accept': 'application/vnd.github+json' } };
  Promise.all([
    fetch(base, Object.assign({ signal: AbortSignal.timeout(12000) }, hdrs)).then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); }),
    fetch(base + '/repos?per_page=100&sort=updated', Object.assign({ signal: AbortSignal.timeout(12000) }, hdrs)).then(function(r) { return r.ok ? r.json() : []; }).catch(function() { return []; })
  ]).then(function(res) {
    var data = { user: res[0], repos: Array.isArray(res[1]) ? res[1] : [] };
    _ghCache[user] = data; _ghFetchedUser = null;
    try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data })); } catch(e) {}
    var g = document.querySelector('.bento-grid');
    if (g) g.querySelectorAll('.gh-widget[data-gh-uid]').forEach(function(w) { updateGithubWidget(w, data); });
  }).catch(function() {
    _ghFetchedUser = null;
    var g2 = document.querySelector('.bento-grid');
    if (g2) g2.querySelectorAll('.gh-widget[data-gh-uid]').forEach(function(w) { w.innerHTML = '<div class="gh-error"><span>Could not load GitHub profile</span></div>'; });
  });
}

/* ─── Crypto widget ─────────────────────────── */
var _cryptoLastData = null;
var _cryptoFetched = false;
var _cryptoCacheKey = 'hub-crypto-prices';

var _CRYPTO_COINS = [
  { id:'bitcoin', symbol:'BTC', name:'Bitcoin' },
  { id:'ethereum', symbol:'ETH', name:'Ethereum' },
  { id:'solana', symbol:'SOL', name:'Solana' },
  { id:'dogecoin', symbol:'DOGE', name:'Dogecoin' },
  { id:'cardano', symbol:'ADA', name:'Cardano' },
  { id:'ripple', symbol:'XRP', name:'XRP' },
  { id:'polkadot', symbol:'DOT', name:'Polkadot' },
  { id:'avalanche-2', symbol:'AVAX', name:'Avalanche' }
];

function _getCryptoCoins() {
  try { return JSON.parse(localStorage.getItem('haven-crypto-coins')) || ['bitcoin','ethereum','solana']; }
  catch(e) { return ['bitcoin','ethereum','solana']; }
}
function _setCryptoCoins(ids) {
  try { localStorage.setItem('haven-crypto-coins', JSON.stringify(ids)); } catch(e) {}
}

function _makeSparkline(prices, isUp) {
  if (!prices || prices.length < 2) return '';
  var min = Math.min.apply(null, prices);
  var max = Math.max.apply(null, prices);
  var range = max - min || 1;
  var w = 80, h = 24;
  var pts = prices.map(function(p, i) {
    var x = (i / (prices.length - 1)) * w;
    var y = h - ((p - min) / range) * h;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  var color = isUp ? '#22c55e' : '#ef4444';
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="crypto-sparkline" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function updateCryptoWidget(widget, data) {
  if (!widget || !data) return;
  var coins = _getCryptoCoins();
  var rows = coins.map(function(id) {
    var coin = _CRYPTO_COINS.find(function(c) { return c.id === id; });
    var d = data[id];
    if (!coin || !d) return '';
    var price = d.usd;
    var change = d.usd_24h_change;
    var isUp = change >= 0;
    var changeClass = isUp ? 'crypto-up' : 'crypto-down';
    var changeStr = (isUp ? '+' : '') + change.toFixed(1) + '%';
    var sparkline = d.sparkline ? _makeSparkline(d.sparkline, isUp) : '';
    var priceStr = price >= 1000 ? '$' + price.toLocaleString('en-US', {maximumFractionDigits:0}) : price >= 1 ? '$' + price.toFixed(2) : '$' + price.toFixed(4);
    return '<div class="crypto-row" data-crypto-id="' + id + '"><div class="crypto-info"><span class="crypto-symbol">' + coin.symbol + '</span><span class="crypto-name">' + coin.name + '</span></div><div class="crypto-right"><span class="crypto-price">' + priceStr + '</span>' + sparkline + '<span class="crypto-change ' + changeClass + '">' + changeStr + '</span></div></div>';
  }).join('');
  var refreshBtn = '<button class="crypto-refresh" data-crypto-refresh title="Refresh"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></button>';
  var editBtn = '<button class="crypto-edit" data-crypto-edit="' + widget.dataset.cryptoUid + '" title="Select coins"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button>';
  widget.innerHTML = '<div class="crypto-header">' + refreshBtn + editBtn + '</div>' + rows;
}

function _fetchCrypto(grid) {
  var widgets = grid.querySelectorAll('.crypto-widget[data-crypto-uid]');
  if (widgets.length === 0) return;
  if (_cryptoLastData) {
    widgets.forEach(function(w) { updateCryptoWidget(w, _cryptoLastData); });
    return;
  }
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(_cryptoCacheKey)); } catch(e) {}
  if (cached && Date.now() - cached.ts < 120000) {
    _cryptoLastData = cached.data;
    widgets.forEach(function(w) { updateCryptoWidget(w, cached.data); });
    return;
  }
  if (_cryptoFetched) return;
  _cryptoFetched = true;
  var coins = _getCryptoCoins();
  var ids = coins.join(',');
  var url = 'https://api.coingecko.com/api/v3/simple/price?ids=' + ids + '&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true';
  var sparkUrl = 'https://api.coingecko.com/api/v3/coins/' + coins[0] + '/market_chart?vs_currency=usd&days=1&interval=daily';
  fetch(url, { signal: AbortSignal.timeout(10000) })
    .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function(data) {
      if (!data || typeof data !== 'object') throw new Error('empty');
      var result = {};
      coins.forEach(function(id) {
        if (data[id]) {
          result[id] = { usd: data[id].usd || 0, usd_24h_change: data[id].usd_24h_change || 0 };
        }
      });
      // Fetch sparkline for each coin sequentially to avoid rate limits
      var coinQueue = coins.slice();
      function fetchNextSparkline() {
        if (coinQueue.length === 0) {
          _cryptoLastData = result;
          try { localStorage.setItem(_cryptoCacheKey, JSON.stringify({ ts: Date.now(), data: result })); } catch(e) {}
          _cryptoFetched = false;
          var g = document.querySelector('.bento-grid');
          if (g) g.querySelectorAll('.crypto-widget[data-crypto-uid]').forEach(function(w) { updateCryptoWidget(w, result); });
          return;
        }
        var coinId = coinQueue.shift();
        fetch('https://api.coingecko.com/api/v3/coins/' + coinId + '/market_chart?vs_currency=usd&days=1&interval=daily', { signal: AbortSignal.timeout(8000) })
          .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
          .then(function(cd) {
            if (cd && cd.prices && cd.prices.length && result[coinId]) {
              result[coinId].sparkline = cd.prices.map(function(p) { return p[1]; });
            }
          })
          .catch(function() {})
          .then(function() { setTimeout(fetchNextSparkline, 300); });
      }
      fetchNextSparkline();
    })
    .catch(function() {
      _cryptoFetched = false;
      var g2 = document.querySelector('.bento-grid');
      if (g2) g2.querySelectorAll('.crypto-widget[data-crypto-uid]').forEach(function(w) {
        w.innerHTML = '<div class="crypto-error"><span>Could not load prices</span></div>';
      });
    });
}

function _openCryptoEditor(uid) {
  var existing = document.querySelector('.crypto-editor-overlay');
  if (existing) existing.remove();
  var coins = _getCryptoCoins();
  var overlay = document.createElement('div');
  overlay.className = 'crypto-editor-overlay';
  var options = _CRYPTO_COINS.map(function(c) {
    var checked = coins.indexOf(c.id) !== -1 ? 'checked' : '';
    return '<label class="crypto-option"><input type="checkbox" value="' + c.id + '" ' + checked + '><span class="crypto-opt-symbol">' + c.symbol + '</span><span class="crypto-opt-name">' + c.name + '</span></label>';
  }).join('');
  overlay.innerHTML = '<div class="crypto-editor-modal"><div class="crypto-editor-header"><span>Select Coins</span><button class="crypto-editor-close" data-crypto-editor-close>&times;</button></div><div class="crypto-editor-body">' + options + '</div><div class="crypto-editor-footer"><button class="crypto-editor-save" data-crypto-editor-save="' + uid + '">Save</button></div></div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(ev) {
    if (ev.target === overlay || ev.target.closest('[data-crypto-editor-close]')) overlay.remove();
    if (ev.target.closest('[data-crypto-editor-save]')) {
      var selected = [];
      overlay.querySelectorAll('input[type=checkbox]:checked').forEach(function(cb) { selected.push(cb.value); });
      if (selected.length === 0) selected = ['bitcoin'];
      _setCryptoCoins(selected);
      _cryptoLastData = null;
      try { localStorage.removeItem(_cryptoCacheKey); } catch(e) {}
      overlay.remove();
      renderHubBento();
    }
  });
}

function openEmbedSetup(type, uid) {
  var existing = document.querySelector('.embed-settings-overlay');
  if (existing) existing.remove();
  var overlay = document.createElement('div');
  overlay.className = 'embed-settings-overlay';
  var frKey = '';
  try { frKey = localStorage.getItem('haven-fr24-key-' + uid) || ''; } catch(e) {}
  overlay.innerHTML = '<div class="embed-settings-modal">' +
    '<div class="embed-settings-header">' +
      '<span class="embed-settings-title">' + (type === 'strava' ? 'Strava Activity' : 'FlightRadar24') + '</span>' +
      '<button class="embed-settings-close" data-embed-close><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:14px;height:14px"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
    '</div>' +
    '<div class="embed-settings-body">' +
      (type === 'strava'
        ? '<div class="embed-settings-field"><label>Paste a Strava activity URL</label><input class="embed-settings-input" id="embedStravaInput" placeholder="https://www.strava.com/activities/123456789"></div><p class="embed-settings-hint">Only public activities can be embedded.</p>'
        : '<div class="fr24-settings-row">' +
          '<div class="embed-settings-field"><label>Location</label><select class="embed-settings-input" id="embedFr24Preset"><option value="51.5,-0.12">London (LHR)</option><option value="40.6413,-73.7781">New York (JFK)</option><option value="33.9425,-118.408">Los Angeles (LAX)</option><option value="35.5494,139.7798">Tokyo (NRT)</option><option value="25.2532,55.3657">Dubai (DXB)</option><option value="48.3538,11.7861">Munich (MUC)</option><option value="1.3644,103.9915">Singapore (SIN)</option><option value="52.5597,13.2877">Berlin (BER)</option><option value="-33.9461,151.177">Sydney (SYD)</option><option value="custom">Custom coordinates...</option></select></div>' +
          '<div class="embed-settings-field" id="embedFr24CustomFields" style="display:none"><label>Latitude</label><input class="embed-settings-input" id="embedFr24Lat" placeholder="51.5"><label>Longitude</label><input class="embed-settings-input" id="embedFr24Lon" placeholder="-0.12"></div>' +
          '<div class="embed-settings-field"><label>OpenSky API key (optional)</label><div class="fr24-key-row"><input type="text" class="embed-settings-input" id="embedFr24Key" placeholder="opensky-xxxx" value="' + escapeHtml(frKey) + '"><button type="button" class="ghost" id="embedFr24ClearKey">Clear</button></div><div class="fr24-key-hint">Free at opensky-network.org — removes rate limits and proxy failures.</div></div>' +
          '<p class="embed-settings-hint">Choose an airport or enter custom coordinates.</p>' +
        '</div>') +
    '</div>' +
    '<div class="embed-settings-footer"><button class="embed-settings-save" data-embed-save="' + type + '" data-embed-uid="' + uid + '">Save</button></div>' +
  '</div>';
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(ev) {
    if (ev.target.closest('[data-embed-close]') || ev.target === overlay) overlay.remove();
    var saveBtn = ev.target.closest('[data-embed-save]');
    if (saveBtn) saveEmbedSettings(saveBtn.dataset.embedSave, saveBtn.dataset.embedUid);
  });
  overlay.addEventListener('keydown', function(ev) {
    if (ev.key === 'Enter') {
      var saveBtn = overlay.querySelector('[data-embed-save]');
      if (saveBtn) saveEmbedSettings(saveBtn.dataset.embedSave, saveBtn.dataset.embedUid);
    }
  });
  setTimeout(function() { overlay.querySelector('.embed-settings-input')?.focus(); }, 100);
  var presetSelect = overlay.querySelector('#embedFr24Preset');
  var customFields = overlay.querySelector('#embedFr24CustomFields');
  if (presetSelect && customFields) {
    presetSelect.addEventListener('change', function() {
      customFields.style.display = this.value === 'custom' ? 'flex' : 'none';
    });
  }
  var clearKeyBtn = overlay.querySelector('#embedFr24ClearKey');
  if (clearKeyBtn) {
    clearKeyBtn.addEventListener('click', function() {
      var keyInput = overlay.querySelector('#embedFr24Key');
      if (keyInput) keyInput.value = '';
    });
  }
}

function saveEmbedSettings(type, uid) {
  if (type === 'strava') {
    var input = document.getElementById('embedStravaInput');
    if (!input) return;
    var url = input.value.trim();
    var match = url.match(/strava\.com\/activities\/(\d+)/);
    if (!match) { showToast('Could not find activity ID in URL', 'error', 2500); return; }
    try { localStorage.setItem('haven-strava-' + uid, match[1]); } catch(e) {}
  } else if (type === 'flightradar') {
    var presetSelect = document.getElementById('embedFr24Preset');
    var latVal, lonVal;
    if (presetSelect && presetSelect.value !== 'custom') {
      var coords = presetSelect.value.split(',');
      latVal = parseFloat(coords[0]);
      lonVal = parseFloat(coords[1]);
    } else {
      var lat = document.getElementById('embedFr24Lat');
      var lon = document.getElementById('embedFr24Lon');
      if (!lat || !lon) return;
      latVal = parseFloat(lat.value.trim());
      lonVal = parseFloat(lon.value.trim());
    }
    if (isNaN(latVal) || isNaN(lonVal) || latVal < -90 || latVal > 90 || lonVal < -180 || lonVal > 180) {
      showToast('Enter valid coordinates', 'error', 2500); return;
    }
    try { localStorage.setItem('haven-fr24-' + uid, latVal + ',' + lonVal); } catch(e) {}
    var keyInput = document.getElementById('embedFr24Key');
    var key = keyInput ? keyInput.value.trim() : '';
    try {
      if (key) localStorage.setItem('haven-fr24-key-' + uid, key);
      else localStorage.removeItem('haven-fr24-key-' + uid);
    } catch(e) {}
  }
  var overlay = document.querySelector('.embed-settings-overlay');
  if (overlay) overlay.remove();
  renderHubBento();
}

/* ─── Progress chart data generator ─────────── */
function generateProgressData() {
  const allT = typeof loadTasks === 'function' ? loadTasks() : [];
  const now = new Date();
  const ws = new Date(now);
  ws.setDate(ws.getDate() - ((ws.getDay() + 6) % 7));
  ws.setHours(0,0,0,0);
  const daily = [];
  let totalDone = 0, totalAll = 0;
  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0,10);
    const dayTasks = allT.filter(t => t.date === dateStr);
    const done = dayTasks.filter(t => t.completed).length;
    daily.push({ done, total: dayTasks.length });
    totalDone += done;
    totalAll += dayTasks.length;
  }
  for (let i = 6; i >= 0; i--) {
    if (daily[i].done > 0) streak++;
    else break;
  }
  // Last week's total for trend
  const lws = new Date(ws);
  lws.setDate(lws.getDate() - 7);
  let lastWeekDone = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(lws);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0,10);
    lastWeekDone += allT.filter(t => t.date === dateStr).filter(t => t.completed).length;
  }
  const todayStr = now.toISOString().slice(0,10);
  const todayTasks = allT.filter(t => t.date === todayStr);
  const todayDone = todayTasks.filter(t => t.completed).length;
  const rate = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;
  return { daily, total: totalDone, streak, rate, count: totalAll, trend: totalDone - lastWeekDone, todayRemaining: todayTasks.length - todayDone, todayTotal: todayTasks.length };
}

/* ─── Progress widget live refresh ─────────── */
function refreshProgressWidget() {
  const el = document.querySelector('.bento-bubble .prog-chart');
  if (!el) return;
  const progBubble = el.closest('.bento-bubble');
  if (!progBubble) return;
  const data = generateProgressData();
  const now = new Date();
  const todayCol = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const maxVal = Math.max(...data.daily.map(d => d.done), 1);
  const dayLabels = ['M','T','W','T','F','S','S'];
  const statVals = progBubble.querySelectorAll('.prog-stat-val');
  if (statVals.length >= 3) {
    statVals[0].textContent = data.total;
    statVals[1].textContent = data.streak;
    statVals[2].textContent = data.todayRemaining;
  }
  const chart = progBubble.querySelector('.prog-chart');
  if (chart) {
    const cols = chart.querySelectorAll('.prog-bar-col');
    cols.forEach(function(col, i) {
      if (!data.daily[i]) return;
      var pct = Math.max(4, (data.daily[i].done / maxVal) * 100);
      var bar = col.querySelector('.prog-bar');
      var cnt = col.querySelector('.prog-bar-count');
      if (bar) bar.style.height = pct + '%';
      if (cnt) cnt.innerHTML = data.daily[i].done + '<span style="opacity:0.4">/' + data.daily[i].total + '</span>';
      col.classList.toggle('today', i === todayCol);
    });
  }
}
let _progressRefreshInterval = null;

/* ─── Add bubble types ─────────────────────── */
function addBubbleTypes(types, dropPos) {
  if (typeof hasAccess === 'function' && !hasAccess('unlimited_tags')) {
    const widgetLimit = typeof premiumLimit === 'function' ? premiumLimit('widgetsPerCanvas') : 8;
    const currentLayout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
    if (currentLayout.length >= widgetLimit) {
      requirePremium('unlimited_tags', { reason: 'The Free plan fits ' + widgetLimit + ' widgets on one canvas' });
      return;
    }
  }
  // Start from fresh normalized layout
  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  // Get grid width for gap-finding
  var gridEl = document.querySelector('.bento-grid');
  var gridWidth = gridEl ? gridEl.clientWidth : 800;
  pushUndoState();
  types.forEach(t => {
    const item = {t, uid: _nextUid()};
    if (t === 'images') {
      let maxNum = 0;
      layout.filter(i => i.t === 'images').forEach(i => {
        const m = parseInt((i.imageId || '').replace('hub-image-', ''), 10);
        if (!isNaN(m) && m > maxNum) maxNum = m;
      });
      if (typeof state !== 'undefined' && state.images) {
        for (const k of Object.keys(state.images)) {
          const m = parseInt(k.replace('hub-image-', ''), 10);
          if (!isNaN(m) && m > maxNum) maxNum = m;
        }
      }
      item.imageId = 'hub-image-' + (maxNum + 1);
    } else if (t === 'text') {
      item.text = 'Your text here';
    } else {
      if (layout.find(i => i.t === t)) return;
    }
    item.w = snap(280);
    item.h = (function() {
      var sizes = {spotify:420,strava:420,flightradar:420,images:210,clock:160,calendar:300,timer:180,alarm:220,pomodoro:180,weather:260,headlines:260,'sleep-score':280,water:180,mood:200,countdown:280,notes:240,links:240,quote:220,priorities:320,todos:320,today:320,habits:240,progress:240,goals:420,text:160,crypto:300,homework:320,study:420,upcoming:320,streak:260,budget:300,airquality:300,worldclock:280,savings:300,focuslog:300,currency:320,calculator:440,breathing:280,reading:320,doodle:320,github:300};
      return snap(sizes[item.t] || 280);
    })();
    // If a drop position is provided, use it; otherwise find a gap
    if (dropPos && typeof dropPos.x === 'number' && typeof dropPos.y === 'number') {
      item.x = snap(dropPos.x);
      item.y = snap(dropPos.y);
    } else {
      var pos = findBentoGap(layout, item.w, item.h, gridWidth);
      item.x = pos.x;
      item.y = pos.y;
    }
    layout.push(item);
  });
  // Force all collisions to be resolved — this will push the new item down if needed
  resolveBubbleCollisions(layout);
  hubContent.bentoLayout = layout;
  saveHubContent();
  renderHubBento();
}

function findBentoGap(layout, bubbleW, bubbleH, gridWidth) {
  var items = layout.filter(function(i) { return !i.hidden; });
  if (items.length === 0) return { x: snap(24), y: snap(24) };
  // Collect unique start Y positions, sorted top to bottom
  var rows = {};
  items.forEach(function(i) {
    var rowKey = i.y;
    if (!rows[rowKey]) rows[rowKey] = [];
    rows[rowKey].push(i);
  });
  var sortedYs = Object.keys(rows).map(Number).sort(function(a, b) { return a - b; });
  // For each existing row, try to find a gap
  for (var yi = 0; yi < sortedYs.length; yi++) {
    var rowY = sortedYs[yi];
    var rowItems = rows[rowY].sort(function(a, b) { return a.x - b.x; });
    // Compute the effective bottom of this row (tallest item)
    var rowBottom = rowY;
    rowItems.forEach(function(i) { rowBottom = Math.max(rowBottom, i.y + i.h); });
    // Scan for gaps within the row
    var cursor = snap(24);
    for (var ri = 0; ri < rowItems.length; ri++) {
      // Check gap before this item
      if (cursor + bubbleW + 24 <= rowItems[ri].x) {
        // Also check that the item fits vertically in this row
        if (rowBottom - rowY >= bubbleH || rowY + bubbleH <= rowBottom + 48) {
          return { x: snap(cursor), y: snap(rowY) };
        }
      }
      cursor = Math.max(cursor, rowItems[ri].x + rowItems[ri].w + 24);
    }
    // Check gap after last item in this row
    if (cursor + bubbleW + 24 <= gridWidth) {
      if (rowBottom - rowY >= bubbleH || rowY + bubbleH <= rowBottom + 48) {
        return { x: snap(cursor), y: snap(rowY) };
      }
    }
    // Also try placing at the next row's Y if this row's height can't fit the bubble
    if (rowBottom - rowY < bubbleH && yi + 1 < sortedYs.length) {
      var nextRowY = sortedYs[yi + 1];
      // Can we fit between this row's bottom and the next row's top?
      if (nextRowY - rowBottom >= bubbleH) {
        var c2 = snap(24);
        for (var ri2 = 0; ri2 < rowItems.length; ri2++) {
          if (c2 + bubbleW + 24 <= rowItems[ri2].x) {
            return { x: snap(c2), y: snap(rowBottom + 24) };
          }
          c2 = Math.max(c2, rowItems[ri2].x + rowItems[ri2].w + 24);
        }
        if (c2 + bubbleW + 24 <= gridWidth) {
          return { x: snap(c2), y: snap(rowBottom + 24) };
        }
      }
    }
  }
  // Fallback: place below the lowest item
  var lowest = items.reduce(function(m, i) { return Math.max(m, i.y + i.h); }, 0);
  return { x: snap(24), y: snap(lowest + 30) };
}

/* ─── Timer / Pomodoro helpers ────────────────── */
var _hubLiveTick = null;
var _hubLiveDay = '';
function _alarmItem(uid) {
  if (!hubContent || !Array.isArray(hubContent.bentoLayout)) return null;
  return hubContent.bentoLayout.find(function(i) { return i && i.uid === uid && i.t === 'alarm'; }) || null;
}
function _alarmNewId() {
  return 'a' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}
function _alarmNorm(a) {
  var d = { id: _alarmNewId(), time: '', label: '', enabled: true, repeat: 'once', sound: '', volume: 80, lastFired: '', ringing: 0, snoozeUntil: 0 };
  if (a && typeof a === 'object') {
    if (typeof a.id === 'string' && a.id) d.id = a.id;
    if (typeof a.time === 'string') d.time = a.time;
    if (typeof a.label === 'string') d.label = a.label.slice(0, 40);
    if (a.enabled === false) d.enabled = false;
    if (a.repeat === 'daily') d.repeat = 'daily';
    if (typeof a.sound === 'string') d.sound = a.sound;
    if (isFinite(a.volume)) d.volume = Math.max(0, Math.min(100, Math.round(a.volume)));
    if (typeof a.lastFired === 'string') d.lastFired = a.lastFired;
    if (isFinite(a.ringing)) d.ringing = a.ringing;
    if (isFinite(a.snoozeUntil)) d.snoozeUntil = a.snoozeUntil;
  }
  return d;
}
function _alarmList(pitem) {
  if (!pitem) return [];
  if (Array.isArray(pitem.alarms)) return pitem.alarms.map(_alarmNorm);
  if (pitem.alarm && typeof pitem.alarm === 'object') return [_alarmNorm(pitem.alarm)];
  return [];
}
function _alarmGet(pitem, id) {
  var list = _alarmList(pitem);
  for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
  return null;
}
function _alarmPersist(uid, list) {
  var pitem = _alarmItem(uid);
  if (!pitem) return null;
  delete pitem.alarm;
  pitem.alarms = list;
  saveHubContent();
  return pitem;
}
var ONLINE_ALARM_SOUNDS = [];
function _getFreesoundToken() {
  try { return (localStorage.getItem('haven-freesound-token') || '').trim(); } catch(e) { return ''; }
}
function _setFreesoundToken(t) {
  try { localStorage.setItem('haven-freesound-token', String(t || '').trim()); } catch(e) {}
}
function _getCustomAlarmSounds() {
  try {
    var arr = JSON.parse(localStorage.getItem('haven-custom-alarm-sounds') || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch(e) { return []; }
}
function _setCustomAlarmSounds(arr) {
  try { localStorage.setItem('haven-custom-alarm-sounds', JSON.stringify(arr)); } catch(e) {}
  if (typeof cloudPushNow === 'function') { try { cloudPushNow(); } catch(e) {} }
}
function _customAlarmUrl(key) {
  if (!key || key.indexOf('fs:') !== 0) return '';
  var list = _getCustomAlarmSounds();
  for (var i = 0; i < list.length; i++) {
    if (list[i].key === key) return list[i].url;
  }
  return '';
}
function _onlineAlarmUrl(key) {
  return '';
}
function _alarmSoundFile(key) {
  var custom = _customAlarmUrl(key);
  if (custom) return custom;
  if (key && typeof CHIME_SOUNDS !== 'undefined' && CHIME_SOUNDS[key]) return CHIME_SOUNDS[key].file;
  if (typeof getChimeFile === 'function') return getChimeFile();
  return 'sounds/chime-success.mp3';
}
function _playAlarmSound(key, vol) {
  if (typeof state !== 'undefined' && state.soundEnabled === false) return;
  try {
    var a = new Audio(_alarmSoundFile(key));
    var v = isFinite(vol) ? vol : 80;
    a.volume = Math.max(0, Math.min(1, v / 100));
    a.onerror = function() {
      try {
        var fb = new Audio(typeof getChimeFile === 'function' ? getChimeFile() : 'sounds/chime-success.mp3');
        fb.volume = a.volume;
        var pr2 = fb.play();
        if (pr2 && pr2.catch) pr2.catch(function() {});
      } catch(e) {}
    };
    var pr = a.play();
    if (pr && pr.catch) pr.catch(function() {});
  } catch(e) {}
}
function _alarmSoundOptions(sel) {
  var out = '<option value="">Default chime</option>';
  if (typeof CHIME_SOUNDS !== 'undefined') {
    Object.keys(CHIME_SOUNDS).forEach(function(k) {
      out += '<option value="' + k + '"' + (sel === k ? ' selected' : '') + '>' + CHIME_SOUNDS[k].label + '</option>';
    });
  }
  var saved = _getCustomAlarmSounds();
  if (saved.length) {
    out += '<optgroup label="My sounds">';
    saved.forEach(function(s) {
      out += '<option value="' + s.key + '"' + (sel === s.key ? ' selected' : '') + '>' + String(s.name || s.key).slice(0, 32) + '</option>';
    });
    out += '</optgroup>';
  }
  return out;
}
var _fsBrowserCtx = null;
var _fsPreviewAudio = null;
function _stopFsPreview() {
  try { if (_fsPreviewAudio) { _fsPreviewAudio.pause(); _fsPreviewAudio = null; } } catch(e) {}
}
function _openSoundBrowser(uid, alarmId) {
  _fsBrowserCtx = { uid: uid, alarmId: alarmId };
  _stopFsPreview();
  var old = document.getElementById('fsSoundBrowser');
  if (old) old.remove();
  var ov = document.createElement('div');
  ov.id = 'fsSoundBrowser';
  ov.style.cssText = 'position:fixed;inset:0;z-index:1200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.55);padding:16px';
  var token = _getFreesoundToken();
  var saved = _getCustomAlarmSounds();
  var savedHtml = saved.length ? saved.map(function(s) {
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-subtle)">'
      + '<span style="flex:1;min-width:0;font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + String(s.name || '').replace(/</g, '&lt;') + '</span>'
      + '<button data-fs-use="' + s.key + '" style="font-size:.65rem;padding:4px 8px;border-radius:8px;border:1px solid var(--accent);background:none;color:var(--accent);cursor:pointer">Use</button>'
      + '<button data-fs-play-saved="' + s.key + '" style="font-size:.65rem;padding:4px 8px;border-radius:8px;border:1px solid var(--border-color);background:none;color:var(--text-secondary);cursor:pointer">Play</button>'
      + '<button data-fs-del="' + s.key + '" style="font-size:.65rem;padding:4px 8px;border-radius:8px;border:1px solid var(--border-color);background:none;color:var(--text-tertiary);cursor:pointer">x</button></div>';
  }).join('') : '<div style="font-size:.72rem;color:var(--text-tertiary)">No saved sounds yet. Search below and hit Save.</div>';
  ov.innerHTML = '<div style="width:min(520px,100%);max-height:86vh;overflow:auto;background:var(--surface-container);border:1px solid var(--border-color);border-radius:16px;padding:16px">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><strong style="flex:1">Browse sounds</strong><button data-fs-close style="border:none;background:none;font-size:1.1rem;cursor:pointer;color:var(--text-tertiary)">×</button></div>'
    + '<div style="font-size:.7rem;color:var(--text-tertiary);margin-bottom:8px">Powered by Freesound. <a href="https://freesound.org/apiv2/apply" target="_blank" rel="noopener" style="color:var(--accent)">Get a free key</a>, paste it once, then search anything.</div>'
    + '<input data-fs-token placeholder="Freesound API key" value="' + String(token).replace(/"/g, '&quot;') + '" style="width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--border-color);background:var(--surface-container-high);color:var(--text-primary);font-size:.75rem;margin-bottom:8px" />'
    + '<div style="display:flex;gap:8px;margin-bottom:10px"><input data-fs-q placeholder="Try: alarm, bell, birds, rain…" value="alarm" style="flex:1;padding:8px 10px;border-radius:10px;border:1px solid var(--border-color);background:var(--surface-container-high);color:var(--text-primary);font-size:.78rem" /><button data-fs-search style="padding:8px 14px;border-radius:10px;border:none;background:var(--accent);color:#fff;font-weight:700;font-size:.75rem;cursor:pointer">Search</button></div>'
    + '<div data-fs-results style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"><div style="font-size:.72rem;color:var(--text-tertiary)">Hit Search to load sounds.</div></div>'
    + '<div style="font-size:.72rem;font-weight:700;margin-bottom:4px">My saved sounds (' + saved.length + ')</div>'
    + '<div data-fs-saved>' + savedHtml + '</div></div>';
  document.body.appendChild(ov);
  var q = ov.querySelector('[data-fs-q]');
  if (q) { q.focus(); q.select(); }
}
function _closeSoundBrowser() {
  _stopFsPreview();
  var ov = document.getElementById('fsSoundBrowser');
  if (ov) ov.remove();
  _fsBrowserCtx = null;
}
function _renderFsResults(list) {
  var ov = document.getElementById('fsSoundBrowser');
  if (!ov) return;
  var box = ov.querySelector('[data-fs-results]');
  if (!box) return;
  if (!list || !list.length) { box.innerHTML = '<div style="font-size:.72rem;color:var(--text-tertiary)">No results. Try another word.</div>'; return; }
  box.innerHTML = list.map(function(s) {
    var prev = (s.previews && (s.previews['preview-lq-mp3'] || s.previews['preview-hq-mp3'])) || '';
    var nm = String(s.name || ('Sound ' + s.id)).replace(/</g, '&lt;');
    var meta = Math.round(s.duration || 0) + 's · ' + String(s.username || '') + ' · ' + String(s.license || '').replace('http://creativecommons.org/licenses/', 'CC ').slice(0, 24);
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--border-subtle);border-radius:10px">'
      + '<div style="flex:1;min-width:0"><div style="font-size:.75rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + nm + '</div>'
      + '<div style="font-size:.62rem;color:var(--text-tertiary)">' + String(meta).replace(/</g, '&lt;') + '</div></div>'
      + '<button data-fs-play="' + prev.replace(/"/g, '&quot;') + '" style="font-size:.65rem;padding:5px 10px;border-radius:8px;border:1px solid var(--border-color);background:none;color:var(--text-secondary);cursor:pointer">Play</button>'
      + '<button data-fs-save="' + s.id + '" data-fs-name="' + nm.replace(/"/g, '&quot;') + '" data-fs-url="' + prev.replace(/"/g, '&quot;') + '" style="font-size:.65rem;font-weight:700;padding:5px 10px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer">Save</button></div>';
  }).join('');
}
function _fsDoSearch() {
  var ov = document.getElementById('fsSoundBrowser');
  if (!ov) return;
  var tokenEl = ov.querySelector('[data-fs-token]');
  var qEl = ov.querySelector('[data-fs-q]');
  var box = ov.querySelector('[data-fs-results]');
  var token = tokenEl ? tokenEl.value.trim() : '';
  var q = qEl ? qEl.value.trim() : '';
  if (token) _setFreesoundToken(token); else token = _getFreesoundToken();
  if (!token) { if (box) box.innerHTML = '<div style="font-size:.72rem;color:#c00">Paste your free Freesound API key first.</div>'; return; }
  if (!q) q = 'alarm';
  if (box) box.innerHTML = '<div style="font-size:.72rem;color:var(--text-tertiary)">Searching…</div>';
  fetch('https://freesound.org/apiv2/search/?query=' + encodeURIComponent(q) + '&filter=duration:[0 TO 30]&fields=id,name,previews,duration,username,license&sort=downloads_desc&page_size=12&token=' + encodeURIComponent(token))
    .then(function(r) { return r.json(); })
    .then(function(d) { _renderFsResults(d && d.results); })
    .catch(function() { if (box) box.innerHTML = '<div style="font-size:.72rem;color:#c00">Search failed. Check key / connection.</div>'; });
}
function _fsSaveSound(id, name, url) {
  if (!url) return;
  var key = 'fs:' + id;
  var list = _getCustomAlarmSounds();
  if (!list.some(function(s) { return s.key === key; })) {
    list.push({ key: key, name: name || ('Sound ' + id), url: url });
    _setCustomAlarmSounds(list);
  }
  if (_fsBrowserCtx && _fsBrowserCtx.uid && _fsBrowserCtx.alarmId) {
    var pitem = _alarmItem(_fsBrowserCtx.uid);
    if (pitem) {
      var alist = _alarmList(pitem);
      for (var i = 0; i < alist.length; i++) {
        if (alist[i].id === _fsBrowserCtx.alarmId) alist[i].sound = key;
      }
      _alarmPersist(_fsBrowserCtx.uid, alist);
    }
  }
  if (typeof showToast === 'function') { try { showToast('Sound saved', 'success', 2500); } catch(e) {} }
  _closeSoundBrowser();
  if (typeof renderHubBento === 'function') { try { renderHubBento(); } catch(e) {} }
}
document.addEventListener('click', function(e) {
  var t = e.target;
  if (!t || !t.closest) return;
  if (t.closest('[data-fs-close]')) { _closeSoundBrowser(); return; }
  if (t.closest('[data-fs-search]')) { _fsDoSearch(); return; }
  var play = t.closest('[data-fs-play]');
  if (play) {
    _stopFsPreview();
    try {
      _fsPreviewAudio = new Audio(play.getAttribute('data-fs-play'));
      var pr = _fsPreviewAudio.play();
      if (pr && pr.catch) pr.catch(function() {});
    } catch(err) {}
    return;
  }
  var save = t.closest('[data-fs-save]');
  if (save) { _fsSaveSound(save.getAttribute('data-fs-save'), save.getAttribute('data-fs-name'), save.getAttribute('data-fs-url')); return; }
  var use = t.closest('[data-fs-use]');
  if (use) {
    var ukey = use.getAttribute('data-fs-use');
    if (_fsBrowserCtx && _fsBrowserCtx.uid && _fsBrowserCtx.alarmId) {
      var upitem = null;
      try { upitem = _alarmItem(_fsBrowserCtx.uid); } catch(err2) {}
      if (upitem) {
        var ulist = _alarmList(upitem);
        for (var ui = 0; ui < ulist.length; ui++) {
          if (ulist[ui].id === _fsBrowserCtx.alarmId) ulist[ui].sound = ukey;
        }
        _alarmPersist(_fsBrowserCtx.uid, ulist);
      }
    }
    _closeSoundBrowser();
    if (typeof renderHubBento === 'function') { try { renderHubBento(); } catch(err3) {} }
    return;
  }
  var playSaved = t.closest('[data-fs-play-saved]');
  if (playSaved) {
    _stopFsPreview();
    try {
      _fsPreviewAudio = new Audio(_customAlarmUrl(playSaved.getAttribute('data-fs-play-saved')));
      var pr2 = _fsPreviewAudio.play();
      if (pr2 && pr2.catch) pr2.catch(function() {});
    } catch(err4) {}
    return;
  }
  var del = t.closest('[data-fs-del]');
  if (del) {
    var dkey = del.getAttribute('data-fs-del');
    _setCustomAlarmSounds(_getCustomAlarmSounds().filter(function(s) { return s.key !== dkey; }));
    var ctx = _fsBrowserCtx;
    _closeSoundBrowser();
    if (ctx) _openSoundBrowser(ctx.uid, ctx.alarmId);
    if (typeof renderHubBento === 'function') { try { renderHubBento(); } catch(err5) {} }
    return;
  }
  var ov = document.getElementById('fsSoundBrowser');
  if (ov && t === ov) _closeSoundBrowser();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') _closeSoundBrowser();
  if (e.key === 'Enter' && document.getElementById('fsSoundBrowser') && (document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-fs-q'))) _fsDoSearch();
});
function _alarmsStatusText(list) {
  var now = new Date();
  var cur = now.getHours() * 60 + now.getMinutes();
  var todayKey = _hubTodayKey();
  var armed = (list || []).filter(function(a) {
    if (!a || a.enabled === false) return false;
    if (!/^\d{2}:\d{2}$/.test(a.time || '')) return false;
    if (a.lastFired === todayKey) return false;
    return true;
  });
  if (!armed.length) return (list && list.length) ? 'All done for today' : 'Add an alarm below';
  var upcoming = null;
  armed.forEach(function(a) {
    var at = parseInt(a.time.slice(0, 2), 10) * 60 + parseInt(a.time.slice(3), 10);
    if (at > cur && (upcoming === null || at < upcoming)) upcoming = at;
  });
  if (upcoming !== null) {
    var diff = upcoming - cur;
    var h = Math.floor(diff / 60);
    var m = diff % 60;
    var hh = String(Math.floor(upcoming / 60)).padStart(2, '0');
    var mm2 = String(upcoming % 60).padStart(2, '0');
    return 'Next ' + hh + ':' + mm2 + ' in ' + (h ? h + 'h ' : '') + m + 'm';
  }
  var earliest = null;
  armed.forEach(function(a) {
    var at = parseInt(a.time.slice(0, 2), 10) * 60 + parseInt(a.time.slice(3), 10);
    if (earliest === null || at < earliest) earliest = at;
  });
  var eh = String(Math.floor(earliest / 60)).padStart(2, '0');
  var em = String(earliest % 60).padStart(2, '0');
  var anyDaily = armed.some(function(a) { return a.repeat === 'daily'; });
  return anyDaily ? 'Next ' + eh + ':' + em + ' tomorrow' : 'Done for today';
}
function _fireAlarm(a) {
  var lbl = a.label || 'Alarm';
  _playAlarmSound(a.sound, a.volume);
  if (typeof showToast === 'function') { try { showToast(lbl + ' — ' + a.time, 'success', 8000); } catch(_e1) {} }
  if (typeof _sendNotification === 'function') { try { _sendNotification(lbl, 'Alarm · ' + a.time, { tag: 'alarm-' + a.id + '-' + _hubTodayKey() }); } catch(_e2) {} }
}
function _todayQuickAdd(title) {
  if (!hubEditMode) return;
  title = String(title || '').trim();
  if (!title) return;
  if (typeof createTask !== 'function' || typeof formatDate !== 'function') return;
  createTask({ title: title, date: formatDate(new Date()) });
  renderHubBento();
  if (typeof updateHub === 'function') { try { updateHub(); } catch(_err) {} }
}
function _checkAlarms(quiet) {
  if (!hubContent || !Array.isArray(hubContent.bentoLayout)) return;
  var now = new Date();
  var nowMins = now.getHours() * 60 + now.getMinutes();
  var nowTs = Date.now();
  var todayKey = _hubTodayKey();
  var saved = false;
  var fired = false;
  hubContent.bentoLayout.forEach(function(it) {
    if (!it || it.t !== 'alarm') return;
    var list = _alarmList(it);
    var touched = false;
    list.forEach(function(a) {
      if (a.ringing && !a.snoozeUntil && nowTs - a.ringing > 10 * 60 * 1000) { a.ringing = 0; touched = true; }
      if (a.enabled === false) return;
      if (!/^\d{2}:\d{2}$/.test(a.time || '')) return;
      if (a.snoozeUntil && nowTs >= a.snoozeUntil) {
        a.snoozeUntil = 0;
        a.ringing = nowTs;
        touched = true;
        fired = true;
        _fireAlarm(a);
        return;
      }
      if (a.lastFired === todayKey) return;
      var at = parseInt(a.time.slice(0, 2), 10) * 60 + parseInt(a.time.slice(3), 10);
      if (nowMins < at) return;
      var late = nowMins - at;
      a.lastFired = todayKey;
      a.ringing = nowTs;
      a.snoozeUntil = 0;
      touched = true;
      if (a.repeat !== 'daily') a.enabled = false;
      if (late > 30) return;
      fired = true;
      _fireAlarm(a);
    });
    if (touched) { it.alarms = list; delete it.alarm; saved = true; }
  });
  if (saved) saveHubContent();
  if (fired && !quiet) renderHubBento();
}
function _timerState(uid) {
  if (!_timerIntervals[uid]) _timerIntervals[uid] = { elapsed: 0, running: false, startTs: null, target: 0, mode: 'countdown' };
  return _timerIntervals[uid];
}
function _pomoState(uid) {
  if (!_pomodoroState[uid]) _pomodoroState[uid] = { phase:'focus', remaining:1500, total:1500, running:false, startTs:null, cycle:0 };
  return _pomodoroState[uid];
}
function _playPomoAlert(phase) {
  if (typeof playCompletionChime === 'function') { playCompletionChime(phase || 'focus'); return; }
  if (typeof playChime === 'function') { playChime(); return; }
  if (typeof state !== 'undefined' && state.soundEnabled === false) return;
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}
function _playTimerAlert(phase) {
  if (typeof playCompletionChime === 'function') { playCompletionChime(phase || 'focus'); return; }
  if (typeof playChime === 'function') { playChime(); return; }
  if (typeof state !== 'undefined' && state.soundEnabled === false) return;
  try {
    var ctx = new (window.AudioContext || window.webkitAudioContext)();
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}
function _advancePomoPhase(uid) {
  var s = _pomodoroState[uid];
  if (!s) return;
  if (s.phase === 'focus') {
    s.cycle++;
    if (s.cycle % 4 === 0) {
      s.phase = 'long';
      s.total = 900; // 15 min
    } else {
      s.phase = 'short';
      s.total = 300; // 5 min
    }
  } else {
    s.phase = 'focus';
    s.total = 1500; // 25 min
  }
  s.remaining = s.total;
  s.startTs = null;
}
function _fmtTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  var sec = seconds % 60;
  if (h > 0) return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}
function _renderPomo(uid) {
  var el = document.querySelector('.pomo-widget[data-pomo-uid="' + uid + '"]');
  if (!el) return;
  var s = _pomodoroState[uid];
  if (!s) return;
  var phaseLabels = { focus:'Focus', short:'Short Break', long:'Long Break' };
  var pct = s.total > 0 ? ((s.total - s.remaining) / s.total) * 100 : 0;
  var pRunning = s.running;
  el.querySelector('.pomo-time').textContent = _fmtTime(s.remaining);
  el.querySelector('.pomo-phase').textContent = phaseLabels[s.phase] || 'Focus';
  var ring = el.querySelector('.pomo-ring');
  if (ring) {
    ring.classList.remove('pomo-ring-focus', 'pomo-ring-short', 'pomo-ring-long');
    ring.classList.add('pomo-ring-' + s.phase);
  }
  var pDone = (s.phase !== 'focus' && s.cycle % 4 === 0 && s.cycle > 0) ? 4 : s.cycle % 4;
  el.querySelectorAll('.pomo-dot').forEach(function(d, i) { d.classList.toggle('pomo-dot-on', i < pDone); });
  var fg = el.querySelector('.pomo-ring-fg');
  if (fg) fg.style.strokeDashoffset = 326.73 - (326.73 * pct / 100);
  var btn = el.querySelector('[data-pomo-action="toggle"]');
  if (btn) {
    btn.textContent = pRunning ? 'Pause' : 'Start';
    btn.classList.toggle('timer-btn-active', pRunning);
  }
}
function _renderTimer(uid) {
  var el = document.querySelector('.timer-widget[data-timer-uid="' + uid + '"]');
  if (!el) return;
  var s = _timerIntervals[uid];
  if (!s) return;
  var displaySecs = s.mode === 'countdown' ? Math.max(0, s.target - s.elapsed) : s.elapsed;
  el.querySelector('.timer-display').textContent = _fmtTime(displaySecs);
  var ring = el.querySelector('.timer-ring');
  if (ring) ring.classList.toggle('timer-done', s.mode === 'countdown' && s.target > 0 && s.elapsed >= s.target && !s.running);
  var modeLabel = el.querySelector('.timer-mode-label');
  if (modeLabel) modeLabel.textContent = s.mode === 'countdown' ? (s.target > 0 ? (s.running ? 'running' : s.elapsed > 0 ? 'paused' : 'countdown') : 'set a preset') : 'stopwatch';
  var fg = el.querySelector('.timer-ring-fg');
  if (fg) {
    var frac = (s.mode === 'countdown' && s.target > 0) ? Math.max(0, Math.min(1, s.elapsed / s.target)) : 0;
    fg.style.strokeDashoffset = 326.73 - 326.73 * frac;
  }
  var btn = el.querySelector('[data-timer-action="toggle"]');
  if (btn) {
    btn.textContent = s.running ? 'Pause' : 'Start';
    btn.classList.toggle('timer-btn-active', s.running);
  }
  var modeBtn = el.querySelector('[data-timer-action="mode"]');
  if (modeBtn) modeBtn.textContent = s.mode === 'countdown' ? 'SW' : 'TD';
  var presetsEl = el.querySelector('.timer-presets');
  if (presetsEl) presetsEl.style.display = (!s.running && s.elapsed === 0) ? 'flex' : 'none';
}

function _saveTimerStates() {
  try {
    var data = {};
    for (var k in _timerIntervals) {
      if (k === '_tick') continue;
      var ts = _timerIntervals[k];
      data[k] = { elapsed: ts.elapsed, running: ts.running, startTs: ts.startTs, target: ts.target, mode: ts.mode };
    }
    localStorage.setItem(TIMER_STATE_KEY, JSON.stringify(data));
  } catch(e) {}
}

function _loadTimerStates() {
  try {
    var data = JSON.parse(localStorage.getItem(TIMER_STATE_KEY));
    if (data) {
      for (var k in data) {
        if (_timerIntervals[k]) continue;
        var d = data[k];
        _timerIntervals[k] = { elapsed: d.elapsed, running: d.running, startTs: d.startTs, target: d.target || 0, mode: d.mode || 'countdown' };
        if (_timerIntervals[k].running && _timerIntervals[k].startTs) {
          _timerIntervals[k].elapsed += (Date.now() - _timerIntervals[k].startTs) / 1000;
          _timerIntervals[k].startTs = Date.now();
        }
      }
      // Only tick when a timer is actually running — an idle tick rewrites
      // localStorage five times per second, forever, on every page load.
      for (var rk in _timerIntervals) {
        if (rk !== '_tick' && _timerIntervals[rk].running) { _startTimerTick(); break; }
      }
    }
  } catch(e) {}
}

function _timerClearTickIfIdle() {
  var anyRunning = false;
  for (var k in _timerIntervals) {
    if (k !== '_tick' && _timerIntervals[k].running) { anyRunning = true; break; }
  }
  if (!anyRunning && _timerIntervals._tick) {
    clearInterval(_timerIntervals._tick);
    delete _timerIntervals._tick;
  }
}
function _startTimerTick() {
  if (_timerIntervals._tick) return;
  _timerIntervals._tick = setInterval(function() {
    Object.keys(_timerIntervals).forEach(function(k) {
      if (k === '_tick') return;
      var ts = _timerIntervals[k];
      if (ts.running && ts.startTs) {
        ts.elapsed = ts.elapsed + (Date.now() - ts.startTs) / 1000;
        ts.startTs = Date.now();
        if (ts.mode === 'countdown' && ts.elapsed >= ts.target) {
          ts.elapsed = ts.target;
          ts.running = false;
          ts.startTs = null;              _playTimerAlert('focus');
          _renderTimer(k);
          _timerClearTickIfIdle();
          return;
        }
        _renderTimer(k);
      }
    });
    _saveTimerStates();
  }, 200);
}
function _pomoClearTickIfIdle() {
  var anyRunning = false;
  for (var k in _pomodoroState) {
    if (k !== '_tick' && _pomodoroState[k].running) { anyRunning = true; break; }
  }
  if (!anyRunning && _pomodoroState._tick) {
    clearInterval(_pomodoroState._tick);
    delete _pomodoroState._tick;
  }
}
function _savePomoStates() {
  try {
    var data = {};
    for (var k in _pomodoroState) {
      if (k === '_tick') continue;
      var s = _pomodoroState[k];
      data[k] = { phase: s.phase, remaining: s.remaining, total: s.total, running: s.running, startTs: s.startTs, cycle: s.cycle };
    }
    localStorage.setItem('hub-pomo-state', JSON.stringify(data));
  } catch(e) {}
}
function _loadPomoStates() {
  try {
    var data = JSON.parse(localStorage.getItem('hub-pomo-state'));
    if (data) {
      for (var k in data) {
        if (_pomodoroState[k]) continue;
        var d = data[k];
        _pomodoroState[k] = { phase: d.phase, remaining: d.remaining, total: d.total, running: d.running, startTs: d.startTs, cycle: d.cycle };
        if (_pomodoroState[k].running && _pomodoroState[k].startTs) {
          var elapsed = (Date.now() - _pomodoroState[k].startTs) / 1000;
          _pomodoroState[k].remaining = Math.max(0, _pomodoroState[k].remaining - elapsed);
          _pomodoroState[k].startTs = Date.now();
        }
      }
      var anyRunning = false;
      for (var k in _pomodoroState) {
        if (k !== '_tick' && _pomodoroState[k].running) { anyRunning = true; break; }
      }      if (anyRunning && !_pomodoroState._tick) {
        _pomodoroState._tick = setInterval(function() {
          Object.keys(_pomodoroState).forEach(function(k) {
            if (k === '_tick') return;
            var ps = _pomodoroState[k];
            if (!ps.running || !ps.startTs) return;
            var now = Date.now();
            var elapsed = now - ps.startTs;
            ps.startTs = now;
            ps.remaining = Math.max(0, ps.remaining - elapsed / 1000);
            if (ps.remaining <= 0) {
              ps.running = false;
              ps.startTs = null;
              ps.remaining = 0;
              _playPomoAlert();
              _advancePomoPhase(k);
            }
            _renderPomo(k);
          });
          _savePomoStates();
        }, 200);
}
    }
  } catch(e) {}
}

/* ─── ADD popup (hide-popup style) ──────────── */




/* ══════════════════════════════════════════════════════════════
   WIDGET PACK — added 2026-10-03
   prayertime · bmkgquake · moneyflow · assistant · friends-live
   ══════════════════════════════════════════════════════════════ */

/* ─── Shared helpers for the widget pack ────── */
function _wfNum(n) {
  var v = Math.abs(parseFloat(n) || 0);
  var s;
  if (v >= 1000) s = v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  else if (v % 1 === 0) s = String(v);
  else s = String(Math.round(v * 100) / 100);
  return (parseFloat(n) < 0 ? '-' : '') + s;
}
function _wfRel(ts) {
  if (!ts) return '';
  var diff = Date.now() - ts;
  if (!isFinite(diff) || diff < 0) diff = 0;
  var m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  var h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
function _wfReadJSON(key) {
  try {
    var raw = localStorage.getItem(key);
    if (!raw) return null;
    var o = JSON.parse(raw);
    return (o && typeof o === 'object') ? o : null;
  } catch (err) { return null; }
}
function _wfWriteJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (err) {}
}

/* ─── Prayer times · Aladhan API, method 20 = Kemenag RI ───── */
var PT_KEY = 'haven-prayer-cache';
var PT_FALLBACK = { lat: -6.9667, lon: 110.4167, name: 'Semarang' };
var PT_NAMES = [
  { key: 'Fajr',    label: 'Subuh' },
  { key: 'Sunrise', label: 'Terbit' },
  { key: 'Dhuhr',   label: 'Dzuhur' },
  { key: 'Asr',     label: 'Ashar' },
  { key: 'Maghrib', label: 'Maghrib' },
  { key: 'Isha',    label: 'Isya' }
];
function _ptGetCache() {
  var o = _wfReadJSON(PT_KEY);
  if (!o || !o.timings) return null;
  if (o.day !== _hubTodayKey()) return null;
  return o;
}
function _ptMins(hhmm) {
  var m = /^(\d{1,2}):(\d{2})/.exec(String(hhmm || ''));
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
}
function _ptFmt(mins) {
  if (mins == null || !isFinite(mins)) return '--:--';
  var h = Math.floor(mins / 60) % 24, m = mins % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}
function _ptNext(cache) {
  var now = new Date();
  var cur = now.getHours() * 60 + now.getMinutes();
  var list = PT_NAMES.filter(function(p) { return p.key !== 'Sunrise'; });
  for (var i = 0; i < list.length; i++) {
    var t = _ptMins(cache.timings[list[i].key]);
    if (t != null && t > cur) return { name: list[i], at: t, mins: t - cur, tomorrow: false };
  }
  var f = _ptMins(cache.timings.Fajr);
  return { name: list[0], at: f, mins: f != null ? (f + 1440) - cur : null, tomorrow: true };
}
function _prayerRender(cache) {
  if (!cache || !cache.timings) return '';
  var cur = new Date().getHours() * 60 + new Date().getMinutes();
  var next = _ptNext(cache);
  var rows = PT_NAMES.map(function(p) {
    var t = _ptMins(cache.timings[p.key]);
    var isNext = !next.tomorrow && next.name.key === p.key;
    var past = t != null && !isNext && t <= cur;
    return '<div class="pt-row' + (isNext ? ' pt-row-next' : '') + (past ? ' pt-row-past' : '') + '">' +
      '<span class="pt-row-lbl">' + p.label + '</span>' +
      '<span class="pt-row-time">' + _ptFmt(t) + '</span>' +
      (isNext ? '<span class="pt-row-badge">next</span>' : '') +
    '</div>';
  }).join('');
  var cd = '';
  if (next.mins != null) {
    var h = Math.floor(next.mins / 60), m = next.mins % 60;
    cd = (h > 0 ? h + 'h ' : '') + m + 'm';
  }
  var meta = [];
  if (cache.hijri) meta.push('<span>' + escapeHtml(cache.hijri) + '</span>');
  if (cache.place) meta.push('<span>' + escapeHtml(cache.place) + '</span>');
  return '<div class="pt-next">' +
      '<div class="pt-next-row"><span class="pt-next-lbl">' + next.name.label + (next.tomorrow ? ' · besok' : '') + '</span><span class="pt-next-cd">' + cd + '</span></div>' +
      '<div class="pt-next-at">' + _ptFmt(next.at) + '</div>' +
      (meta.length ? '<div class="pt-meta">' + meta.join('') + '</div>' : '') +
    '</div>' +
    '<div class="pt-rows">' + rows + '</div>';
}
function _ptFetch(grid) {
  var hosts = (grid || document).querySelectorAll('[data-pt-uid]');
  if (!hosts.length) return;
  var setAll = function(html) { hosts.forEach(function(h) { h.innerHTML = html; }); };
  var cached = _ptGetCache();
  if (cached) { setAll(_prayerRender(cached)); return; }
  setAll('<div class="wf-loading"><span class="wf-spin"></span><span>Loading prayer times…</span></div>');
  var load = function(lat, lon, name) {
    var d = new Date();
    var ds = ('0' + d.getDate()).slice(-2) + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + d.getFullYear();
    fetch('https://api.aladhan.com/v1/timings/' + ds + '?latitude=' + lat + '&longitude=' + lon + '&method=20')
      .then(function(r) { return r.json(); })
      .then(function(j) {
        if (!j || Number(j.code) !== 200 || !j.data || !j.data.timings) throw new Error('bad-response');
        var hij = j.data.date && j.data.date.hijri;
        var cache = {
          day: _hubTodayKey(),
          place: name || '',
          timings: j.data.timings,
          hijri: hij ? (hij.day + ' ' + ((hij.month && hij.month.en) || '') + ' ' + hij.year + ' H') : ''
        };
        _wfWriteJSON(PT_KEY, cache);
        setAll(_prayerRender(cache));
      })
      .catch(function() {
        setAll('<div class="wf-error"><span>Could not load prayer times</span><button class="wf-btn" data-pt-refresh="1">Retry</button></div>');
      });
  };
  try {
    _resolveGeo(function(lat, lon, name) {
      if (!isFinite(lat) || !isFinite(lon)) load(PT_FALLBACK.lat, PT_FALLBACK.lon, PT_FALLBACK.name);
      else load(lat, lon, name);
    });
  } catch (err) {
    load(PT_FALLBACK.lat, PT_FALLBACK.lon, PT_FALLBACK.name);
  }
}
var _ptTick = null;
function _ptStartTicker() {
  if (_ptTick) return;
  _ptTick = setInterval(function() {
    var hosts = document.querySelectorAll('[data-pt-uid]');
    if (!hosts.length) { clearInterval(_ptTick); _ptTick = null; return; }
    var c = _ptGetCache();
    if (!c) return;
    hosts.forEach(function(h) { h.innerHTML = _prayerRender(c); });
  }, 60000);
}

/* ─── Latest earthquake · BMKG open data ────── */
var QK_KEY = 'haven-quake-cache';
function _qkGetCache() { return _wfReadJSON(QK_KEY); }
function _qkMagClass(m) {
  var v = parseFloat(m) || 0;
  if (v >= 6) return 'qk-mag-xl';
  if (v >= 5) return 'qk-mag-lg';
  if (v >= 4) return 'qk-mag-md';
  return 'qk-mag-sm';
}
function _qkRender(c) {
  if (!c) return '';
  var ts = c.ts ? new Date(c.ts).getTime() : null;
  var ago = ts ? _wfRel(ts) : '';
  var potensi = String(c.potensi || '');
  var tsunami = /tsunami/i.test(potensi) && !/tidak/i.test(potensi);
  return '<div class="qk-top">' +
      '<div class="qk-mag ' + _qkMagClass(c.mag) + '"><span class="qk-mag-val">' + escapeHtml(String(c.mag || '—')) + '</span><span class="qk-mag-lbl">SR</span></div>' +
      '<div class="qk-top-meta">' +
        '<span class="qk-when">' + escapeHtml(c.tanggal || '') + '</span>' +
        '<span class="qk-clock">' + escapeHtml(c.jam || '') + (ago ? ' · ' + escapeHtml(ago) : '') + '</span>' +
      '</div>' +
    '</div>' +
    '<div class="qk-region">' + escapeHtml(c.wilayah || 'Unknown region') + '</div>' +
    '<div class="qk-facts">' +
      '<div class="qk-fact"><span class="qk-fact-val">' + escapeHtml(String(c.kedalaman || '—')) + '</span><span class="qk-fact-lbl">depth</span></div>' +
      '<div class="qk-fact"><span class="qk-fact-val">' + escapeHtml(String(c.koordinat || '—')) + '</span><span class="qk-fact-lbl">coords</span></div>' +
    '</div>' +
    (c.dirasakan ? '<div class="qk-felt"><span class="qk-felt-lbl">Felt</span><span>' + escapeHtml(c.dirasakan) + '</span></div>' : '') +
    '<div class="qk-pot' + (tsunami ? ' qk-pot-warn' : '') + '">' + escapeHtml(potensi || 'No tsunami potential reported') + '</div>';
}
function _qkFetch(grid) {
  var hosts = (grid || document).querySelectorAll('[data-qk-uid]');
  if (!hosts.length) return;
  var cached = _qkGetCache();
  if (cached) hosts.forEach(function(h) { h.innerHTML = _qkRender(cached); });
  if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) < 600000) return;
  if (!cached) hosts.forEach(function(h) { h.innerHTML = '<div class="wf-loading"><span class="wf-spin"></span><span>Loading seismic data…</span></div>'; });
  fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')
    .then(function(r) { return r.json(); })
    .then(function(j) {
      var g = j && j.Infogempa && j.Infogempa.gempa;
      if (!g) throw new Error('bad-response');
      var cache = {
        mag: g.Magnitude, kedalaman: g.Kedalaman, wilayah: g.Wilayah,
        potensi: g.Potensi, dirasakan: g.Dirasakan,
        tanggal: g.Tanggal, jam: g.Jam, koordinat: g.Coordinates,
        ts: g.DateTime || null, fetchedAt: Date.now()
      };
      _wfWriteJSON(QK_KEY, cache);
      hosts.forEach(function(h) { h.innerHTML = _qkRender(cache); });
    })
    .catch(function() {
      if (!cached) hosts.forEach(function(h) { h.innerHTML = '<div class="wf-error"><span>Could not reach BMKG</span><button class="wf-btn" data-qk-refresh="1">Retry</button></div>'; });
    });
}

/* ─── Money flow · auto-categorise, subscriptions, payday ──── */
function _mfSubs() {
  var entries = (((hubContent.expense || {}).entries) || []).filter(function(en) { return en && en.type !== 'income'; });
  var groups = {};
  entries.forEach(function(en) {
    var key = String(en.category || 'General').toLowerCase() + '|' + Math.round(parseFloat(en.amount) || 0);
    if (!groups[key]) groups[key] = [];
    groups[key].push(en);
  });
  var subs = [];
  Object.keys(groups).forEach(function(k) {
    var list = groups[k];
    var byMonth = {};
    list.forEach(function(en) {
      var d = String(en.date || '');
      if (d.length < 10) return;
      var m = d.slice(0, 7);
      var dom = parseInt(d.slice(8, 10), 10);
      if (!isFinite(dom)) return;
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(dom);
    });
    var months = Object.keys(byMonth);
    if (months.length < 2) return;
    // A real subscription lands on roughly the same day each month.
    // Two unrelated purchases of the same size usually do not.
    var doms = months.map(function(m) { return byMonth[m][0]; });
    if (Math.max.apply(null, doms) - Math.min.apply(null, doms) > 5) return;
    subs.push({ category: list[0].category || 'General', amount: parseFloat(list[0].amount) || 0, months: months.length });
  });
  return subs.sort(function(a, b) { return b.amount - a.amount; }).slice(0, 4);
}
function _moneyFlowData() {
  var b = _budgetData();
  var exp = hubContent.expense || { entries: [], balance: 0 };
  var now = new Date();
  var cats = Object.keys(b.cats).map(function(k) { return { name: k, val: b.cats[k] }; })
    .sort(function(a, c) { return c.val - a.val; });
  var dayOfMonth = now.getDate();
  var pace = dayOfMonth > 0 ? b.spend / dayOfMonth : 0;
  var projected = pace * b.daysInMonth;
  var subs = _mfSubs();
  var payday = parseInt((hubContent.moneyflow || {}).payday, 10);
  if (!(payday >= 1 && payday <= 28)) payday = 25;
  var daysToPayday = payday >= dayOfMonth ? payday - dayOfMonth : (b.daysInMonth - dayOfMonth) + payday;
  return {
    spend: b.spend, monthly: b.monthly, remaining: b.remaining, pct: b.pct,
    cats: cats.slice(0, 4), catCount: cats.length, topCat: cats[0] || null,
    pace: pace, projected: projected, overPace: b.monthly > 0 && projected > b.monthly,
    daysLeft: b.daysLeft, dayOfMonth: dayOfMonth, daysInMonth: b.daysInMonth,
    subs: subs, subsTotal: subs.reduce(function(s, x) { return s + x.amount; }, 0),
    payday: payday, daysToPayday: daysToPayday,
    balance: parseFloat(exp.balance) || 0, entryCount: (exp.entries || []).length
  };
}
function _moneyFlowRender(d) {
  if (!d.entryCount) {
    return '<div class="mf-empty"><span class="mf-empty-t">No transactions yet</span>' +
      '<span class="mf-empty-s">Log spending in the Budget widget and this fills itself in automatically.</span></div>';
  }
  var pctCls = d.pct >= 100 ? 'mf-bad' : d.pct >= 80 ? 'mf-warn' : 'mf-good';
  var maxCat = d.cats[0] ? d.cats[0].val : 1;
  var bars = d.cats.map(function(c) {
    var share = d.spend > 0 ? Math.round((c.val / d.spend) * 100) : 0;
    var w = Math.max(6, Math.round((c.val / maxCat) * 100));
    return '<div class="mf-cat">' +
      '<span class="mf-cat-name">' + escapeHtml(c.name) + '</span>' +
      '<div class="mf-cat-track"><div class="mf-cat-fill" style="width:' + w + '%"></div></div>' +
      '<span class="mf-cat-pct">' + share + '%</span>' +
      '<span class="mf-cat-amt">' + _wfNum(c.val) + '</span>' +
    '</div>';
  }).join('');
  var subs = d.subs.length
    ? d.subs.map(function(s) {
        return '<div class="mf-sub">' +
          '<span class="mf-sub-name">' + escapeHtml(s.category) + '</span>' +
          '<span class="mf-sub-meta">' + s.months + ' months</span>' +
          '<span class="mf-sub-amt">' + _wfNum(s.amount) + '</span>' +
        '</div>';
      }).join('')
    : '<div class="mf-sub-empty">No recurring charges detected yet</div>';
  return '<div class="mf-hero">' +
      '<div class="mf-hero-main"><span class="mf-hero-val">' + _wfNum(d.spend) + '</span>' +
        '<span class="mf-hero-lbl">spent · day ' + d.dayOfMonth + ' of ' + d.daysInMonth + '</span></div>' +
      '<div class="mf-hero-side"><span class="mf-hero-side-val ' + pctCls + '">' + (d.monthly > 0 ? d.pct + '%' : '—') + '</span>' +
        '<span class="mf-hero-side-lbl">of budget</span></div>' +
    '</div>' +
    (d.monthly > 0 ? '<div class="mf-track"><div class="mf-fill ' + pctCls + '" style="width:' + Math.min(100, d.pct) + '%"></div></div>' : '') +
    '<div class="mf-tiles">' +
      '<div class="mf-tile"><span class="mf-tile-val">' + _wfNum(Math.round(d.pace)) + '</span><span class="mf-tile-lbl">per day</span></div>' +
      '<div class="mf-tile"><span class="mf-tile-val' + (d.overPace ? ' mf-bad' : '') + '">' + _wfNum(Math.round(d.projected)) + '</span><span class="mf-tile-lbl">projected</span></div>' +
      '<div class="mf-tile"><span class="mf-tile-val">' + d.daysToPayday + '</span><span class="mf-tile-lbl">to payday</span></div>' +
    '</div>' +
    '<div class="mf-sec"><span class="mf-sec-lbl">Where it went</span>' + bars + '</div>' +
    '<div class="mf-sec"><span class="mf-sec-lbl">Recurring<span class="mf-sec-note">' + _wfNum(Math.round(d.subsTotal)) + '/mo</span></span>' + subs + '</div>';
}

/* ─── Assistant · local rule-based next-action planner ────── */
function _assistantPlan() {
  var hour = new Date().getHours();
  var items = [];
  var priorities = (hubContent.priorities || []).filter(function(p) { return p && String(p).trim(); });
  var todos = (hubContent.todos || []).filter(function(t) { return t && !t.done; });
  var habits = hubContent.habits || [];
  var habitToday = (hubContent.habitData || {})[_hubTodayKey()] || {};
  var habitsLeft = habits.filter(function(h, i) { return !habitToday[i]; }).length;
  var water = hubContent.water || { goal: 8, logged: 0 };
  var waterLeft = Math.max(0, (water.goal || 8) - (water.logged || 0));
  var moodToday = (((hubContent.mood || {}).history) || {})[_hubTodayKey()];
  var b = _budgetData();
  var focus = _focusData();

  if (priorities.length) {
    items.push({
      tone: 'now',
      title: String(priorities[0]),
      why: priorities.length > 1 ? 'Top of ' + priorities.length + ' priorities today' : 'Your only priority today',
      href: 'index.html'
    });
  }
  if (todos.length) {
    items.push({
      tone: 'next',
      title: todos.length + ' task' + (todos.length === 1 ? '' : 's') + ' still open',
      why: 'First one: ' + String((todos[0] && todos[0].text) || 'untitled'),
      href: 'index.html'
    });
  }
  if (waterLeft > 0 && hour >= 14) {
    items.push({
      tone: waterLeft > 4 ? 'warn' : 'next',
      title: 'Drink ' + waterLeft + ' more glass' + (waterLeft === 1 ? '' : 'es') + ' of water',
      why: (water.logged || 0) + ' of ' + (water.goal || 8) + ' logged and it is already ' + hour + ':00',
      href: 'index.html'
    });
  }
  if (habits.length && habitsLeft > 0 && hour >= 19) {
    items.push({
      tone: habitsLeft > habits.length / 2 ? 'warn' : 'next',
      title: habitsLeft + ' habit' + (habitsLeft === 1 ? '' : 's') + ' still unchecked',
      why: 'The evening check-in window is open',
      href: 'index.html'
    });
  }
  if (b.monthly > 0 && b.pct >= 85) {
    items.push({
      tone: b.pct >= 100 ? 'warn' : 'next',
      title: 'Budget is at ' + b.pct + '%',
      why: _wfNum(Math.round(b.remaining)) + ' left for ' + b.daysLeft + ' day' + (b.daysLeft === 1 ? '' : 's'),
      href: 'finance.html'
    });
  }
  if (focus.today.minutes === 0 && hour >= 9 && hour <= 21) {
    items.push({
      tone: 'next',
      title: 'No focus time logged today',
      why: 'One ' + ((hubContent.focusCfg && hubContent.focusCfg.sessionMinutes) || 25) + '-minute block is enough to start',
      href: 'progress.html'
    });
  }
  var readingNow = (hubContent.reading || []).filter(function(r) { return r && r.title && !r.done; });
  if (readingNow.length && hour >= 19) {
    items.push({ tone: 'soft', title: 'Read ' + readingNow[0].title, why: 'Still in progress', href: 'index.html' });
  }
  if (hour >= 20 && !moodToday) {
    items.push({ tone: 'soft', title: 'Log how today felt', why: 'No mood entry for today yet', href: 'index.html' });
  }
  if (!items.length) {
    items.push({
      tone: 'good',
      title: 'Nothing urgent right now',
      why: 'Priorities, tasks, habits and water are all clear',
      href: 'goals.html'
    });
  }
  return {
    greeting: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
    items: items.slice(0, 5),
    total: items.length
  };
}

/* ─── Friends live · Supabase social snapshot ─────────────── */
var _frCache = null;
var _frBusy = false;
function _friendsLiveData() {
  if (_frCache) return _frCache;
  return { state: 'loading', friends: [], online: 0, pending: 0, unread: 0, signedOut: false };
}
function _friendsLiveRender(d) {
  if (!d || d.state === 'loading') {
    return '<div class="wf-loading"><span class="wf-spin"></span><span>Checking your circle…</span></div>';
  }
  if (d.state === 'signedout') {
    return '<div class="fr-empty"><span class="fr-empty-t">Not signed in</span>' +
      '<span class="fr-empty-s">Sign in to see who is around. The hub still works offline.</span>' +
      '<a class="fr-cta" href="login.html">Sign in</a></div>';
  }
  if (d.state === 'error') {
    return '<div class="wf-error"><span>Could not reach friends</span><button class="wf-btn" data-fr-refresh="1">Retry</button></div>';
  }
  if (!d.friends.length) {
    return '<div class="fr-empty"><span class="fr-empty-t">No friends yet</span>' +
      '<span class="fr-empty-s">Add someone with your friend code and they show up here.</span>' +
      '<a class="fr-cta" href="friends.html">Add a friend</a></div>';
  }
  var rows = d.friends.slice(0, 5).map(function(f) {
    var color = f.avatarColor || '#b4ccbc';
    var initial = String(f.displayName || '?').trim().charAt(0).toUpperCase() || '?';
    var on = f.status === 'online';
    return '<a class="fr-row" href="friends.html">' +
      '<span class="fr-av" style="background:' + escapeHtml(color) + '">' + escapeHtml(initial) +
        '<span class="fr-dot' + (on ? ' fr-dot-on' : '') + '"></span></span>' +
      '<span class="fr-main"><span class="fr-name">' + escapeHtml(f.displayName || 'Unknown') + '</span>' +
        '<span class="fr-status">' + escapeHtml(f.statusMessage || (on ? 'online' : 'offline')) + '</span></span>' +
      '<span class="fr-when">' + escapeHtml(f.lastSeen ? _wfRel(f.lastSeen) : '') + '</span>' +
    '</a>';
  }).join('');
  return '<div class="fr-stats">' +
      '<div class="fr-stat"><span class="fr-stat-val fr-on">' + d.online + '</span><span class="fr-stat-lbl">online</span></div>' +
      '<div class="fr-stat"><span class="fr-stat-val">' + d.friends.length + '</span><span class="fr-stat-lbl">friends</span></div>' +
      '<div class="fr-stat"><span class="fr-stat-val' + (d.pending ? ' fr-pend' : '') + '">' + d.pending + '</span><span class="fr-stat-lbl">requests</span></div>' +
    '</div>' +
    '<div class="fr-rows">' + rows + '</div>' +
    (d.pending ? '<a class="fr-banner" href="friends.html">' + d.pending + ' friend request' + (d.pending === 1 ? '' : 's') + ' waiting</a>' : '');
}
function _friendsLiveFetch(grid) {
  var hosts = (grid || document).querySelectorAll('[data-fr-host]');
  if (!hosts.length) return;
  if (_frCache) {
    hosts.forEach(function(h) { h.innerHTML = _friendsLiveRender(_frCache); });
    return;
  }
  if (_frBusy) return;
  var sb = (typeof getSupabaseDb === 'function') ? getSupabaseDb() : null;
  var me = (typeof getActiveUserId === 'function') ? getActiveUserId() : null;
  var setAll = function(d) {
    _frCache = d;
    hosts.forEach(function(h) { h.innerHTML = _friendsLiveRender(d); });
  };
  if (!sb || !me) { setAll({ state: 'signedout', friends: [], online: 0, pending: 0 }); return; }
  _frBusy = true;
  sb.from('friends').select('*').contains('users', [me]).then(function(res) {
    if (res.error) throw res.error;
    var rows = res.data || [];
    var ids = [];
    var pending = 0;
    rows.forEach(function(r) {
      if (r.status === 'pending') pending++;
      var other = (r.users || []).filter(function(u) { return u && u !== me; })[0];
      if (other) ids.push(other);
    });
    ids = ids.filter(function(v, i, a) { return a.indexOf(v) === i; });
    if (!ids.length) {
      _frBusy = false;
      setAll({ state: 'ok', friends: [], online: 0, pending: pending });
      return;
    }
    return sb.from('profiles_public').select('*').in('id', ids).then(function(pres) {
      if (pres.error) throw pres.error;
      var friends = (pres.data || []).map(function(p) {
        var m = (typeof mapProfileRow === 'function') ? mapProfileRow(p) : null;
        return m || { id: p.id, displayName: p.display_name || 'Unknown', status: 'offline' };
      }).sort(function(a, b) {
        if ((a.status === 'online') !== (b.status === 'online')) return a.status === 'online' ? -1 : 1;
        return String(a.displayName || '').localeCompare(String(b.displayName || ''));
      });
      _frBusy = false;
      setAll({
        state: 'ok',
        friends: friends,
        online: friends.filter(function(f) { return f.status === 'online'; }).length,
        pending: pending
      });
    });
  }).catch(function() {
    _frBusy = false;
    setAll({ state: 'error', friends: [], online: 0, pending: 0 });
  });
}

/* ─── BUBBLE DOCK (draggable add panel below canvas) ─── */
function renderBubbleDock(grid) {
  if (!grid) grid = document.querySelector('.bento-grid');
  if (!grid) return;
  var existing = document.querySelector('.bento-bubble-dock');
  if (existing) existing.remove();
  var dock = document.createElement('div');
  dock.className = 'bento-bubble-dock';
  dock.setAttribute('data-bubble-dock', '');
  var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  var has = function(t) { return layout.some(function(i) { return i.t === t; }); };
  var labels = { goals:'Goals', images:'Images', priorities:'Priorities', quote:'Quote', todos:'To-Dos', today:'Today', habits:'Habits', notes:'Notes', links:'Links', progress:'Progress', clock:'Clock', weather:'Weather', calendar:'Calendar', timer:'Timer', alarm:'Alarm', pomodoro:'Pomodoro', spotify:'Spotify', strava:'Strava', flightradar:'FlightRadar24', 'sleep-score':'Sleep Score', headlines:'Headlines', water:'Water', mood:'Mood', countdown:'Countdown', crypto:'Crypto', homework:'Homework', study:'Study', upcoming:'Upcoming', streak:'Streak', budget:'Budget', airquality:'Air Quality', worldclock:'World Clock', savings:'Savings Goal', focuslog:'Focus Log', currency:'Currency', calculator:'Calculator', breathing:'Breathing', reading:'Reading', doodle:'Doodle', github:'GitHub', prayertime:'Prayer Times', bmkgquake:'Earthquake', moneyflow:'Money Flow', assistant:'Assistant', 'friends-live':'Friends', grades:'Grades', attendance:'Attendance', exams:'Exams', holidays:'Tanggal Merah', birthdays:'Birthdays', flashcards:'Flashcards', sleepdebt:'Sleep Debt', ytfeed:'Video Feed', watchlist:'Watchlist', musicviz:'Visualiser', pet:'Pet', garden:'Streak Garden', xp:'Level', badges:'Badges', money:'Money' };
  var blurbs = { goals:'Track goals with progress', priorities:'Top focus for today', todos:'Checklist for tasks', today:'Tasks due today', habits:'Daily streaks', progress:'Week completion chart', homework:'Assignments + due dates', study:'Subjects + chapters', water:'Daily water intake', mood:'How you feel today', spotify:'Music playlist', strava:'Activity embed', flightradar:'Live flights map', images:'Photo widget', crypto:'Coin prices', clock:'Time + date', weather:'Temp + forecast', calendar:'Month mini calendar', timer:'Countdown / stopwatch', alarm:'Alarms with sound + snooze', pomodoro:'Focus sessions', 'sleep-score':'Last night score', headlines:'Top world news', countdown:'Days to event', quote:'Weekly inspiration', notes:'Quick notes', links:'Favorite links', upcoming:'Next tasks on your schedule', streak:'Consecutive activity days', budget:'Monthly spend vs budget', airquality:'AQI, pollutants + UV', worldclock:'Times around the world', savings:'Progress toward a savings target', focuslog:'Track focused minutes per day', currency:'Live exchange rates', calculator:'Quick math with a keypad', breathing:'Guided breathing exercise', reading:'Books you are reading', doodle:'Quick sketch pad', github:'GitHub profile + repo stats', prayertime:'Subuh to Isya, next prayer countdown', bmkgquake:'Latest quake from BMKG live feed', moneyflow:'Auto-categorised spend, subscriptions + payday', assistant:'What to do next, from your own data', 'friends-live':'Who is online in your circle', grades:'Subject averages + what you need next', attendance:'Present, late, absent + absences left', exams:'Countdown + syllabus checklist', holidays:'Indonesian tanggal merah + cuti bersama', birthdays:'Upcoming birthdays you track', flashcards:'Spaced-repetition vocab cards', sleepdebt:'How much sleep you owe this week', ytfeed:'Saved YouTube and TikTok links', watchlist:'Films and series you are watching', musicviz:'Bars that react to sound', pet:'A creature that grows with your habits', garden:'A plant for every day you complete something', xp:'Your level and experience points', badges:'Achievements you have unlocked', money:'Piggy bank and wallet in one' };
  var categories = [
    { name:'Productivity', short:'Productivity', types:['goals','priorities','todos','today','upcoming','habits','streak','focuslog','progress','assistant'] },
    { name:'Study', short:'Study', types:['homework','study','grades','attendance','exams','flashcards'] },
    { name:'Wellness', short:'Wellness', types:['water','mood','sleep-score','sleepdebt','airquality','breathing','strava'] },
    { name:'Finance', short:'Finance', types:['crypto','budget','savings','currency','moneyflow','money'] },
    { name:'Utilities', short:'Utilities', types:['clock','worldclock','weather','calendar','timer','alarm','pomodoro','countdown','calculator'] },
    { name:'Media', short:'Media', types:['spotify','flightradar','images','headlines','ytfeed','watchlist','musicviz'] },
    { name:'Content', short:'Content', types:['quote','notes','links','reading'] },
    { name:'Local', short:'Local', types:['prayertime','bmkgquake','holidays'] },
    { name:'Social', short:'Social', types:['friends-live','birthdays','github'] },
    { name:'Fun', short:'Fun', types:['pet','garden','xp','badges','doodle'] }
  ];
  var _ciHead = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var catIcons = {
    all: _ciHead + '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    Productivity: _ciHead + '<rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="8 12 11 15 16 9"/></svg>',
    Wellness: _ciHead + '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    Media: _ciHead + '<circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
    Finance: _ciHead + '<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M14.8 9.2c-.6-.9-1.6-1.4-2.8-1.4-1.6 0-2.8.9-2.8 2.3 0 3.2 5.6 1.6 5.6 4.9 0 1.4-1.2 2.3-2.8 2.3-1.2 0-2.2-.5-2.8-1.4"/></svg>',
    Utilities: _ciHead + '<line x1="4" y1="7" x2="20" y2="7"/><circle cx="15" cy="7" r="2"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="17" r="2"/></svg>',
    Content: _ciHead + '<path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
    Local: _ciHead + '<path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    Social: _ciHead + '<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    Study: _ciHead + '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/></svg>',
    Fun: _ciHead + '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8L16.5 19.5l1.8-.7z"/></svg>'
  };
  function dockItemMatches(t, q) {
    if (!q) return true;
    var lbl = (labels[t] || t).toLowerCase();
    return lbl.indexOf(q) !== -1 || t.toLowerCase().indexOf(q) !== -1 || (blurbs[t] || '').toLowerCase().indexOf(q) !== -1;
  }
  function applyFilters() {
    var rawQ = (dock.querySelector('.bds-input') || {}).value || '';
    var q = String(rawQ).toLowerCase().trim();
    if (!dock._dockCat) {
      var anyBox = false;
      var allHits = [];
      categories.forEach(function(cat) {
        cat.types.forEach(function(t) { if (dockItemMatches(t, q)) allHits.push(t); });
      });
      catsEl.querySelectorAll('[data-dock-catbox]').forEach(function(box) {
        if (box.dataset.dockCatbox === 'all') {
          var showAll = !q || 'all'.indexOf(q) !== -1 || allHits.length > 0;
          box.style.display = showAll ? '' : 'none';
          if (showAll) anyBox = true;
          var cntAll = box.querySelector('.bdc-count');
          if (cntAll) cntAll.textContent = q ? allHits.length + ' found' : totalTypes + ' widgets';
          return;
        }
        var cat = null;
        for (var ci = 0; ci < categories.length; ci++) {
          if (categories[ci].name === box.dataset.dockCatbox) cat = categories[ci];
        }
        if (!cat) return;
        var hits = cat.types.filter(function(t) { return dockItemMatches(t, q); });
        var show = !q || cat.name.toLowerCase().indexOf(q) !== -1 || hits.length > 0;
        box.style.display = show ? '' : 'none';
        if (show) anyBox = true;
        var cnt = box.querySelector('.bdc-count');
        if (cnt) cnt.textContent = q ? hits.length + ' found' : cat.types.length + ' widgets';
      });
      var catsEmpty = catsEl.querySelector('[data-cats-empty]');
      if (catsEmpty) catsEmpty.style.display = anyBox ? 'none' : '';
    } else {
      var anyTile = false;
      dock.querySelectorAll('[data-dock-section]').forEach(function(sec) {
        if (sec.dataset.dockSection !== dock._dockCat) { sec.style.display = 'none'; return; }
        var secVis = false;
        sec.querySelectorAll('[data-dock-item-type]').forEach(function(it) {
          var show = dockItemMatches(it.dataset.dockItemType, q);
          it.style.display = show ? '' : 'none';
          if (show) secVis = true;
        });
        sec.style.display = secVis ? '' : 'none';
        if (secVis) anyTile = true;
      });
      var gridEmpty = widgetGrid.querySelector('[data-dock-empty]');
      if (gridEmpty) gridEmpty.style.display = anyTile ? 'none' : '';
    }
  }
  function dockRestoreTiles() {
    widgetGrid.querySelectorAll('[data-dock-item-type]').forEach(function(it) {
      if (it._homeSec && it.parentNode !== it._homeSec) it._homeSec.appendChild(it);
    });
  }
  function dockCollectAll() {
    dockRestoreTiles();
    var all = null;
    widgetGrid.querySelectorAll('[data-dock-section]').forEach(function(s) {
      if (s.dataset.dockSection === 'all') all = s;
    });
    if (!all) return;
    categories.forEach(function(cat) {
      var sec = null;
      widgetGrid.querySelectorAll('[data-dock-section]').forEach(function(s) {
        if (s.dataset.dockSection === cat.name) sec = s;
      });
      if (!sec) return;
      sec.querySelectorAll('[data-dock-item-type]').forEach(function(it) {
        all.appendChild(it);
      });
    });
  }
  function dockShowCats() {
    dock._dockCat = null;
    dockRestoreTiles();
    catsEl.style.display = '';
    subhead.style.display = 'none';
    widgetGrid.style.display = 'none';
    applyFilters();
  }
  function dockShowCat(name) {
    dock._dockCat = name;
    if (name === 'all') dockCollectAll(); else dockRestoreTiles();
    catsEl.style.display = 'none';
    subhead.style.display = '';
    widgetGrid.style.display = '';
    var t = subhead.querySelector('[data-subhead-title]');
    if (t) t.textContent = name === 'all' ? 'All widgets' : name;
    applyFilters();
  }

  function isPlacedType(t) { return t === 'images' ? false : has(t); }

  // Keeps the "already added" state in sync without rebuilding the dock
  // (rebuilding would drop the search text, the active filter and the animation)
  function updatePlacedStates() {
    if (!widgetGrid) return;
    var live = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
    widgetGrid.querySelectorAll('[data-dock-item-type]').forEach(function(it) {
      var t = it.dataset.dockItemType;
      var on = t === 'images' ? false : live.some(function(i) { return i.t === t; });
      it.classList.toggle('placed', on);
      it.title = on ? labels[t] + ' — already on canvas' : 'Click to add ' + labels[t] + ' • or drag onto canvas';
      var badge = it.querySelector('.bdi-added');
      if (badge) badge.style.display = on ? '' : 'none';
    });
  }
  dock._dockSync = updatePlacedStates;

  // Top bar: search + filter pills + close
  var topbar = document.createElement('div');
  topbar.className = 'bubble-dock-topbar';

  var searchWrap = document.createElement('div');
  searchWrap.className = 'bubble-dock-search';
  var searchIcon = document.createElement('span');
  searchIcon.className = 'bds-icon';
  searchIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var searchInput = document.createElement('input');
  searchInput.className = 'bds-input';
  searchInput.placeholder = 'Search widgets…';
  searchInput.type = 'text';
  searchInput.setAttribute('data-dock-search', '');
  searchWrap.appendChild(searchIcon);
  searchWrap.appendChild(searchInput);
  topbar.appendChild(searchWrap);

  dock.title = 'Click to add • Drag to place • Drop here to remove';
  var body = document.createElement('div');
  body.className = 'bubble-dock-body';

  var catsEl = document.createElement('div');
  catsEl.className = 'bubble-dock-cats';
  var totalTypes = 0;
  categories.forEach(function(cat) { totalTypes += cat.types.length; });
  var allBox = document.createElement('button');
  allBox.type = 'button';
  allBox.className = 'bdc-box';
  allBox.dataset.dockCatbox = 'all';
  allBox.title = 'All widgets';
  allBox.innerHTML = '<span class="bdc-ico">' + catIcons.all + '</span><span class="bdc-name">All</span><span class="bdc-count">' + totalTypes + ' widgets</span>';
  allBox.addEventListener('click', function() { dockShowCat('all'); });
  catsEl.appendChild(allBox);
  categories.forEach(function(cat) {
    var box = document.createElement('button');
    box.type = 'button';
    box.className = 'bdc-box';
    box.dataset.dockCatbox = cat.name;
    box.title = cat.name;
    box.innerHTML = '<span class="bdc-ico">' + (catIcons[cat.name] || '') + '</span><span class="bdc-name">' + cat.short + '</span><span class="bdc-count">' + cat.types.length + ' widgets</span>';
    box.addEventListener('click', function() { dockShowCat(cat.name); });
    catsEl.appendChild(box);
  });
  var catsEmpty = document.createElement('div');
  catsEmpty.className = 'bubble-dock-empty';
  catsEmpty.setAttribute('data-cats-empty', '');
  catsEmpty.textContent = 'No categories match your search.';
  catsEmpty.style.display = 'none';
  catsEl.appendChild(catsEmpty);
  body.appendChild(catsEl);

  var subhead = document.createElement('div');
  subhead.className = 'bubble-dock-subhead';
  subhead.style.display = 'none';
  subhead.innerHTML = '<button type="button" class="bds-back"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg><span>Categories</span></button><span class="bds-sub-title" data-subhead-title></span>';
  subhead.querySelector('.bds-back').addEventListener('click', dockShowCats);
  body.appendChild(subhead);

  var closeBtn = document.createElement('button');
  closeBtn.className = 'bubble-dock-close';
  closeBtn.innerHTML = '\u00d7';
  closeBtn.title = 'Close dock';
  closeBtn.addEventListener('click', function() { _dockManuallyClosed = true; dock.remove(); });

  var doneBtn = document.createElement('button');
  doneBtn.type = 'button';
  doneBtn.className = 'bubble-dock-done';
  doneBtn.title = 'Done editing';
  doneBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span>Done</span>';
  doneBtn.addEventListener('click', function() { toggleHubEdit(false); });
  topbar.appendChild(doneBtn);
  topbar.appendChild(closeBtn);

  dock.appendChild(topbar);

  var widgetGrid = document.createElement('div');
  widgetGrid.className = 'bubble-dock-grid';
  widgetGrid.setAttribute('data-dock-items', '');
  widgetGrid.style.display = 'none';

  categories.forEach(function(cat) {
    var section = document.createElement('div');
    section.className = 'bubble-dock-section';
    section.dataset.dockSection = cat.name;
    section.style.display = 'none';
    cat.types.forEach(function(t) {
      var placed = isPlacedType(t);
      var item = document.createElement('div');
      item.className = 'bubble-dock-item' + (placed ? ' placed' : '');
      item.dataset.bubbleDockType = t;
      item.dataset.dockItemType = t;
      item.dataset.dockCategory = cat.name;
      item.dataset.dockLabel = labels[t];
      item.title = placed ? labels[t] + ' — already on canvas' : 'Click to add ' + labels[t] + ' • or drag onto canvas';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', placed ? '-1' : '0');
      var icon = document.createElement('span');
      icon.className = 'bdi-icon';
      icon.innerHTML = bubbleTypeIcon(t);
      var label = document.createElement('span');
      label.className = 'bdi-label';
      label.textContent = labels[t];
      var badge = document.createElement('span');
      badge.className = 'bdi-added';
      badge.textContent = '✓ Added';
      badge.style.display = placed ? '' : 'none';
      item.appendChild(icon);
      item.appendChild(label);
      item.appendChild(badge);
      item.addEventListener('click', function(ev) {
        if (item.classList.contains('placed')) return;
        if (ev.target.closest('input,select,textarea')) return;
        addBubbleTypes([t]);
      });
      item.addEventListener('keydown', function(ev) {
        if ((ev.key === 'Enter' || ev.key === ' ') && !item.classList.contains('placed')) {
          ev.preventDefault();
          addBubbleTypes([t]);
        }
      });
      item._homeSec = section;
      section.appendChild(item);
    });
    widgetGrid.appendChild(section);
  });

  var allSection = document.createElement('div');
  allSection.className = 'bubble-dock-section';
  allSection.dataset.dockSection = 'all';
  allSection.style.display = 'none';
  widgetGrid.appendChild(allSection);

  var gridEmpty = document.createElement('div');
  gridEmpty.className = 'bubble-dock-empty';
  gridEmpty.setAttribute('data-dock-empty', '');
  gridEmpty.textContent = 'No widgets match your search.';
  gridEmpty.style.display = 'none';
  widgetGrid.appendChild(gridEmpty);

  body.appendChild(widgetGrid);
  dock.appendChild(body);

  dock._dockCat = null;

  searchInput.addEventListener('input', applyFilters);

  grid.parentNode.insertBefore(dock, grid.nextSibling);
  initBubbleDockDrag(dock);
}

var _dockManuallyClosed = false;

// Refreshes the widget dock in place (or builds it if missing).
// The dock is the only "add widget" entry point, so it must stay accurate
// after deletes, duplicates, undo/redo and any other canvas mutation.
function syncBubbleDock(grid) {
  if (!grid) grid = document.querySelector('.bento-grid');
  var dock = document.querySelector('.bento-bubble-dock[data-bubble-dock]');
  if (!dock) {
    if (_dockManuallyClosed || !grid) return;
    renderBubbleDock(grid);
    return;
  }
  if (typeof dock._dockSync === 'function') dock._dockSync();
}

function initBubbleDockDrag(dock) {
  if (!dock) dock = document.querySelector('.bento-bubble-dock[data-bubble-dock]');
  if (!dock || dock._dockDragWired) return;
  dock._dockDragWired = true;
  _dockGrid = document.querySelector('.bento-grid');

  dock.addEventListener('mousedown', function(e) {
    var item = e.target.closest('.bubble-dock-item');
    if (!item || item.classList.contains('placed') || e.button !== 0) return;
    e.preventDefault();
    _startDockDrag(e, item);
  });
  dock.addEventListener('touchstart', function(e) {
    var item = e.target.closest('.bubble-dock-item');
    if (!item || item.classList.contains('placed') || e.touches.length !== 1) return;
    e.preventDefault();
    _startDockDrag(e, item, true);
  });

  function _defWidgetSize(type) {
    var defSizes = {
      goals:{w:280,h:420},priorities:{w:280,h:320},todos:{w:280,h:320},today:{w:280,h:320},
      habits:{w:280,h:240},progress:{w:280,h:240},clock:{w:280,h:160},
      weather:{w:280,h:260},calendar:{w:280,h:300},timer:{w:280,h:180},
      pomodoro:{w:280,h:180},spotify:{w:280,h:420},strava:{w:280,h:420},
      flightradar:{w:280,h:420},quote:{w:280,h:220},notes:{w:280,h:240},
      links:{w:280,h:240},images:{w:280,h:210},'sleep-score':{w:280,h:280},headlines:{w:280,h:260},
      water:{w:280,h:180},mood:{w:280,h:200},countdown:{w:280,h:280},
      text:{w:280,h:160},crypto:{w:280,h:300},homework:{w:280,h:320},study:{w:280,h:420},
      prayertime:{w:280,h:340},bmkgquake:{w:280,h:300},moneyflow:{w:280,h:420},assistant:{w:280,h:360},'friends-live':{w:280,h:320},
      grades:{w:280,h:340},attendance:{w:280,h:380},exams:{w:280,h:380},
      holidays:{w:280,h:300},birthdays:{w:280,h:300},flashcards:{w:280,h:300},
      sleepdebt:{w:280,h:280},ytfeed:{w:280,h:320},watchlist:{w:280,h:320},musicviz:{w:280,h:200},
      pet:{w:280,h:340},garden:{w:280,h:300},xp:{w:280,h:220},badges:{w:280,h:300},money:{w:280,h:240}
    };
    return defSizes[type] || {w:280,h:280};
  }

  function _getGhostSize(type) {
    var d = _defWidgetSize(type);
    var maxGW = 140, maxGH = 150;
    var scale = Math.min(maxGW / d.w, maxGH / d.h, 1);
    return { w:Math.round(d.w * scale), h:Math.round(d.h * scale) };
  }

  function _startDockDrag(e, item, isTouch) {
    var pos = isTouch ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    var type = item.dataset.bubbleDockType;
    var rect = item.getBoundingClientRect();
    var defSize = _defWidgetSize(type);
    var itemW = defSize.w;
    var itemH = defSize.h;
    var ghostSize = _getGhostSize(type);
    _dockGhost = document.createElement('div');
    _dockGhost.className = 'bubble-dock-ghost';
    _dockGhost.style.width = ghostSize.w + 'px';
    _dockGhost.style.height = ghostSize.h + 'px';
    _dockGhost.innerHTML = '<div class="bdg-icon">' + bubbleTypeIcon(type) + '</div><span class="bdg-label">' + (item.dataset.dockLabel || type) + '</span><span class="bdg-dim">' + itemW + ' \u00D7 ' + itemH + '</span>';
    var offX = pos.x - rect.left;
    var offY = pos.y - rect.top;
    _dockGhost.style.left = (pos.x - offX - ghostSize.w / 2 + rect.width / 2) + 'px';
    _dockGhost.style.top = (pos.y - offY - ghostSize.h / 2 + rect.height / 2) + 'px';
    document.body.appendChild(_dockGhost);
    _dockDropPreview = document.createElement('div');
    _dockDropPreview.className = 'bubble-drop-preview';
    _dockDropPreview.style.display = 'none';
    if (_dockGrid) _dockGrid.appendChild(_dockDropPreview);
    _dockDragData = { type: type, offsetX: offX, offsetY: offY, itemWidth: itemW, itemHeight: itemH };
  }

  if (!_dockDragGlobalWired) {
    _dockDragGlobalWired = true;
    function _dockMove(pos, gridRect) {
      if (!_dockDragData || !_dockGhost || !_dockDropPreview || !_dockGrid) return;
      _dockGhost.style.left = (pos.x - _dockDragData.offsetX) + 'px';
      _dockGhost.style.top = (pos.y - _dockDragData.offsetY) + 'px';
      var isOverGrid = pos.x >= gridRect.left && pos.x <= gridRect.right && pos.y >= gridRect.top && pos.y <= gridRect.bottom;
      if (isOverGrid) {
        var relX = pos.x - gridRect.left - _dockDragData.itemWidth / 2;
        var relY = pos.y - gridRect.top - _dockDragData.itemHeight / 2;
        var snappedX = Math.max(0, Math.min(snap(relX), gridRect.width - _dockDragData.itemWidth));
        var snappedY = Math.max(0, Math.min(snap(relY), gridRect.height - _dockDragData.itemHeight));
        _dockDropPreview.style.display = 'block';
        _dockDropPreview.style.left = snappedX + 'px';
        _dockDropPreview.style.top = snappedY + 'px';
        _dockDropPreview.style.width = _dockDragData.itemWidth + 'px';
        _dockDropPreview.style.height = _dockDragData.itemHeight + 'px';
        _dockGhost.classList.add('bdg-over-grid');
      } else {
        _dockDropPreview.style.display = 'none';
        _dockGhost.classList.remove('bdg-over-grid');
      }
    }
    function _dockEnd() {
      if (!_dockDragData || !_dockGhost) return;
      var placed = false;
      if (_dockGrid && _dockDropPreview && _dockDropPreview.style.display !== 'none') {
        var x = parseInt(_dockDropPreview.style.left) || 0;
        var y = parseInt(_dockDropPreview.style.top) || 0;
        addBubbleTypes([_dockDragData.type], { x: x, y: y });
        placed = true;
      }
      if (_dockGhost && _dockGhost.parentNode) _dockGhost.parentNode.removeChild(_dockGhost);
      if (_dockDropPreview && _dockDropPreview.parentNode) _dockDropPreview.parentNode.removeChild(_dockDropPreview);
      _dockGhost = null; _dockDropPreview = null; _dockDragData = null;
      if (placed) {
        var grid2 = document.querySelector('.bento-grid');
        if (grid2) syncBubbleDock(grid2);
      }
    }

    document.addEventListener('mousemove', function(e) {
      var gridRect = _dockGrid ? _dockGrid.getBoundingClientRect() : null;
      if (!gridRect) return;
      _dockMove({ x: e.clientX, y: e.clientY }, gridRect);
    });
    document.addEventListener('touchmove', function(e) {
      if (!_dockDragData || e.touches.length !== 1) return;
      e.preventDefault();
      var gridRect = _dockGrid ? _dockGrid.getBoundingClientRect() : null;
      if (!gridRect) return;
      _dockMove({ x: e.touches[0].clientX, y: e.touches[0].clientY }, gridRect);
    }, { passive: false });

    document.addEventListener('mouseup', _dockEnd);
    document.addEventListener('touchend', _dockEnd);
  }
}
/* ─── HIDE popup ───────────────────────────── */
/* ─── Gallery ──────────────────────────────── */let _galleryPopupOpen = false;

function showGalleryPopup(idx, anchor) {
  if (_galleryPopupOpen) { document.querySelector('.hub-edit-popup')?.remove(); _galleryPopupOpen = false; return; }
  const card = hubContent.gallery[idx];
  const popup = document.createElement('div');
  popup.className = 'hub-edit-popup';
  popup.innerHTML = `
    <input type="text" id="gpLabel" value="${escapeHtml(card.label)}" placeholder="Label">
    <input type="text" id="gpDesc" value="${escapeHtml(card.desc)}" placeholder="Description">
    <input type="text" id="gpHref" value="${escapeHtml(card.href)}" placeholder="Link URL">
    <input type="text" id="gpColor" value="${escapeHtml(card.color)}" placeholder="Accent color (CSS var)">
    <div class="hub-edit-popup-actions">
      <button class="cancel" id="gpCancel">Cancel</button>
      <button class="primary" id="gpSave">Save</button>
    </div>
  `;
  document.body.appendChild(popup);
  _galleryPopupOpen = true;
  const rect = anchor.getBoundingClientRect();
  popup.style.top = Math.min(rect.bottom + 4, window.innerHeight - 260) + 'px';
  popup.style.right = '24px';

  document.getElementById('gpCancel')?.addEventListener('click', () => { popup.remove(); _galleryPopupOpen = false; });
  document.getElementById('gpSave')?.addEventListener('click', () => {
    hubContent.gallery[idx] = {
      label: document.getElementById('gpLabel')?.value || card.label,
      desc: document.getElementById('gpDesc')?.value || card.desc,
      href: document.getElementById('gpHref')?.value || card.href,
      icon: card.icon,
      color: document.getElementById('gpColor')?.value || card.color,
      bg: card.bg
    };
    saveHubContent();
    popup.remove();
    _galleryPopupOpen = false;
  });
}

/* ─── Event wiring ─────────────────────────── */
var _hubEditEventsWired = false;
function setupHubEditEvents() {
  if (_hubEditEventsWired) return;
  _hubEditEventsWired = true;
  document.getElementById('hubEditToggle')?.addEventListener('click', toggleHubEdit);


  // Hub FAB speed-dial
  const _fabMain = document.getElementById('hubAccessMain');
  if (_fabMain && !_fabMain.dataset._fabWired) {
    _fabMain.dataset._fabWired = '1';
    _fabMain.addEventListener('click', toggleHubAccess);
    document.getElementById('hubFabCustomize')?.addEventListener('click', function() { toggleHubAccess(); toggleHubEdit(); });
    document.getElementById('hubFabSnapshot')?.addEventListener('click', function() { toggleHubAccess(); setTimeout(captureHubSnapshot, 200); });
    document.getElementById('hubFabGuide')?.addEventListener('click', function() { toggleHubAccess(); showCanvasGuide(); });
    document.getElementById('hubFabStyle')?.addEventListener('click', function() { toggleHubAccess(); showStylePanel(); });
  }
  document.addEventListener('click', function(e) {
    const hub = document.getElementById('hubAccessHub');
    if (hub && !hub.contains(e.target)) {
      document.getElementById('hubAccessItems')?.classList.remove('open');
      document.getElementById('hubAccessMain')?.classList.remove('open');
    }
  });

  document.addEventListener('blur', function(e) {
    const span = e.target.closest('[data-edit]');
    if (!span) return;
    if (!hubEditMode) return;
    if (!span.textContent.trim()) span.innerHTML = '';
    const field = span.dataset.edit;
    const idx = parseInt(span.dataset.idx);
    if (field === 'goals' && !isNaN(idx)) {
      hubContent.goals[idx] = span.textContent.trim();
      saveHubContent();
    } else if (field === 'priorities' && !isNaN(idx)) {
      hubContent.priorities[idx] = span.textContent.trim();
      saveHubContent();
    } else if (field === 'todos' && !isNaN(idx)) {
      hubContent.todos[idx].text = span.textContent.trim();
      saveHubContent();
    } else if (field === 'todayTodos' && !isNaN(idx)) {
      var _ttl = _todayTodosItems();
      if (_ttl[idx]) { _ttl[idx].text = span.textContent.trim(); saveHubContent(); }
    } else if (field === 'today') {
      var _ett = span.dataset.tid;
      if (_ett && typeof getTask === 'function' && typeof updateTask === 'function' && getTask(_ett)) updateTask(_ett, { title: span.textContent.trim() });
    } else if (field === 'habits' && !isNaN(idx)) {
      hubContent.habits[idx] = span.textContent.trim();
      saveHubContent();
    } else if (field === 'links-label' && !isNaN(idx)) {
      hubContent.links[idx].label = span.textContent.trim();
      saveHubContent();
    } else if (field === 'links-url' && !isNaN(idx)) {
      hubContent.links[idx].url = span.textContent.trim();
      saveHubContent();
    } else if (field === 'homework' && !isNaN(idx)) {
      hubContent.homework[idx].text = span.textContent.trim();
      saveHubContent();
    } else if (field === 'study-subject') {
      var _ss = _findStudy(span.dataset.sid);
      if (_ss.sj) { _ss.sj.name = span.textContent.trim(); saveHubContent(); }
    } else if (field === 'study-chapter') {
      var _sc = _findStudy(span.dataset.sid, span.dataset.cid);
      if (_sc.ch) { _sc.ch.name = span.textContent.trim(); saveHubContent(); }
    } else if (field === 'study-item') {
      var _si = _findStudy(span.dataset.sid, span.dataset.cid, span.dataset.iid);
      if (_si.it) { _si.it.text = span.textContent.trim(); saveHubContent(); }
    } else if (field === 'reading-title' && !isNaN(idx)) {
      if (!hubContent.reading[idx]) hubContent.reading[idx] = { title: '', author: '', done: false };
      hubContent.reading[idx].title = span.textContent.trim();
      saveHubContent();
    } else if (field === 'reading-author' && !isNaN(idx)) {
      if (!hubContent.reading[idx]) hubContent.reading[idx] = { title: '', author: '', done: false };
      hubContent.reading[idx].author = span.textContent.trim();
      saveHubContent();
    }
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('blur', function(e) {
    const q = e.target.closest('.w-quote-text');
    if (!q || !hubEditMode) return;
    hubContent.quote.text = q.textContent.trim().replace(/^["\u201C]|["\u201D]$/g, '');
    saveHubContent();
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('blur', function(e) {
    const el = e.target.closest('[data-save]');
    if (!el || !hubEditMode) return;
    const field = el.dataset.save;
    if (field === 'notes') {
      hubContent.notes = el.textContent.trim();
      saveHubContent();
    } else if (field === 'text') {
      var textUid = el.dataset.textUid;
      if (textUid) {
        var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
        var item = layout.find(function(i) { return i.uid === textUid; });
        if (item) {
          item.text = el.textContent.trim();
          hubContent.bentoLayout = layout;
          saveHubContent();
        }
      }
    }
  }, true);

  document.getElementById('hubGreeting')?.addEventListener('blur', function() {
    if (!hubEditMode) return;
    hubContent.greeting = this.textContent.trim();
    hubContent.greeting = hubContent.greeting === 'Good morning' || hubContent.greeting === 'Good afternoon' || hubContent.greeting === 'Good evening' ? '' : hubContent.greeting;
    saveHubContent();
  });

  var _todoDragIdx = null;
  var _ttDragIdx = null;
  document.querySelector('.bento-grid')?.addEventListener('dragstart', function(e) {
    var tth = e.target.closest('[data-tt-drag]');
    if (tth) {
      _ttDragIdx = parseInt(tth.dataset.ttDrag);
      _todoDragIdx = null;
      e.dataTransfer.effectAllowed = 'move';
      return;
    }
    var handle = e.target.closest('[data-todo-drag]');
    if (!handle) return;
    _todoDragIdx = parseInt(handle.dataset.todoDrag);
    _ttDragIdx = null;
    e.dataTransfer.effectAllowed = 'move';
  });
  document.querySelector('.bento-grid')?.addEventListener('dragover', function(e) {
    var item = e.target.closest('.w-item[data-idx]');
    if (item && !item.querySelector('[data-edit="todayTodos"]') && item.querySelector('[data-tt-toggle]')) { /* today row */ }
    if ((_todoDragIdx === null && _ttDragIdx === null) || !item) return;
    if (_ttDragIdx !== null && !item.querySelector('[data-edit="todayTodos"]')) return;
    if (_todoDragIdx !== null && item.querySelector('[data-edit="todayTodos"]')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    item.classList.add('drag-over');
  });
  document.querySelector('.bento-grid')?.addEventListener('drop', function(e) {
    var item = e.target.closest('.w-item[data-idx]');
    if (!item) { _todoDragIdx = null; _ttDragIdx = null; return; }
    if (_ttDragIdx !== null) {
      if (!item.querySelector('[data-edit="todayTodos"]')) { _ttDragIdx = null; return; }
      e.preventDefault();
      var toTt = parseInt(item.dataset.idx);
      if (toTt !== _ttDragIdx) {
        var tarr = _todayTodosItems();
        var tmoved = tarr.splice(_ttDragIdx, 1)[0];
        tarr.splice(toTt, 0, tmoved);
        saveHubContent();
        renderHubBento();
      }
      _ttDragIdx = null;
      document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
      return;
    }
    if (_todoDragIdx === null) return;
    if (item.querySelector('[data-edit="todayTodos"]')) { _todoDragIdx = null; return; }
    e.preventDefault();
    var toIdx = parseInt(item.dataset.idx);
    if (toIdx !== _todoDragIdx) {
      var arr = hubContent.todos;
      var moved = arr.splice(_todoDragIdx, 1)[0];
      arr.splice(toIdx, 0, moved);
      saveHubContent();
      renderHubBento();
    }
    _todoDragIdx = null;
    document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
  });
  document.querySelector('.bento-grid')?.addEventListener('dragend', function(e) {
    if (_todoDragIdx !== null || _ttDragIdx !== null) {
      _todoDragIdx = null;
      _ttDragIdx = null;
      document.querySelectorAll('.w-item.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    }
  });

  var _stDragId = null;
  function _stClearDropMarks() {
    document.querySelectorAll('.w-st-drop-before,.w-st-drop-after,.w-st-dragging').forEach(function(el) { el.classList.remove('w-st-drop-before'); el.classList.remove('w-st-drop-after'); el.classList.remove('w-st-dragging'); });
  }
  document.querySelector('.bento-grid')?.addEventListener('dragstart', function(e) {
    var handle = e.target.closest('[data-st-drag]');
    if (!handle) return;
    _stDragId = handle.dataset.stDrag;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', _stDragId); } catch (err) {}
    var leaf = handle.closest('.w-st-leaf');
    if (leaf) leaf.classList.add('w-st-dragging');
  });
  document.querySelector('.bento-grid')?.addEventListener('dragover', function(e) {
    if (!_stDragId) return;
    var leaf = e.target.closest('.w-st-leaf[data-st-leaf]');
    var zone = e.target.closest('[data-st-drop-chap]');
    if (!leaf && !zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    _stClearDropMarks();
    if (leaf && leaf.dataset.stLeaf !== _stDragId) {
      var r = leaf.getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) leaf.classList.add('w-st-drop-before');
      else leaf.classList.add('w-st-drop-after');
    }
  });
  document.querySelector('.bento-grid')?.addEventListener('drop', function(e) {
    if (!_stDragId) return;
    var leaf = e.target.closest('.w-st-leaf[data-st-leaf]');
    var zone = e.target.closest('[data-st-drop-chap]');
    if (!leaf && !zone) { _stDragId = null; _stClearDropMarks(); return; }
    var leafId = leaf ? leaf.dataset.stLeaf : null;
    var zoneId = zone ? zone.dataset.stDropChap : null;
    if (leafId && leafId === _stDragId) { _stDragId = null; _stClearDropMarks(); return; }
    e.preventDefault();
    var before = false;
    if (leaf && leafId) {
      var r = leaf.getBoundingClientRect();
      before = e.clientY < r.top + r.height / 2;
    }
    if (_moveStudyItem(_stDragId, leafId, zoneId, before)) {
      saveHubContent();
      renderHubBento();
    }
    _stDragId = null;
    _stClearDropMarks();
  });
  document.querySelector('.bento-grid')?.addEventListener('dragend', function(e) {
    if (_stDragId !== null) {
      _stDragId = null;
      _stClearDropMarks();
    }
  });

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
    const alarmToggle = e.target.closest('[data-alarm-toggle]');
    if (alarmToggle) {
      var _arow = alarmToggle.closest('[data-alarm-id]');
      var _abub = alarmToggle.closest('.bento-bubble');
      var _auid = _abub ? _abub.dataset.bubble : null;
      var _aid = _arow ? _arow.dataset.alarmId : null;
      var _apitem = _auid ? _alarmItem(_auid) : null;
      var _alist = _alarmList(_apitem);
      var _a = null;
      for (var _ai3 = 0; _ai3 < _alist.length; _ai3++) { if (_alist[_ai3].id === _aid) _a = _alist[_ai3]; }
      if (_a) {
        _a.enabled = _a.enabled === false ? true : false;
        if (_a.enabled !== false && _a.lastFired === _hubTodayKey()) _a.lastFired = '';
        _alarmPersist(_auid, _alist);
        renderHubBento();
      }
      return;
    }
    const alarmDel = e.target.closest('[data-alarm-del]');
    if (alarmDel) {
      var _drow = alarmDel.closest('[data-alarm-id]');
      var _dbub = alarmDel.closest('.bento-bubble');
      var _duid = _dbub ? _dbub.dataset.bubble : null;
      var _did = _drow ? _drow.dataset.alarmId : null;
      var _dpitem = _duid ? _alarmItem(_duid) : null;
      var _dlist = _alarmList(_dpitem).filter(function(x) { return x.id !== _did; });
      _alarmPersist(_duid, _dlist);
      renderHubBento();
      return;
    }
    const alarmAdd = e.target.closest('[data-alarm-add]');
    if (alarmAdd) {
      if (!hubEditMode) return;
      var _nuid = alarmAdd.dataset.alarmAdd;
      var _npitem = _alarmItem(_nuid);
      var _nlist = _alarmList(_npitem);
      if (_nlist.length >= 5) {
        if (typeof showToast === 'function') showToast('Max 5 alarms per widget', 'info', 2500);
        return;
      }
      _nlist.push(_alarmNorm({ time: '', label: '', enabled: true }));
      _alarmPersist(_nuid, _nlist);
      renderHubBento();
      return;
    }
    const alarmSnooze = e.target.closest('[data-alarm-snooze]');
    if (alarmSnooze) {
      var _srow = alarmSnooze.closest('[data-alarm-id]');
      var _sbub = alarmSnooze.closest('.bento-bubble');
      var _suid = _sbub ? _sbub.dataset.bubble : null;
      var _sid = _srow ? _srow.dataset.alarmId : null;
      var _spitem = _suid ? _alarmItem(_suid) : null;
      var _slist = _alarmList(_spitem);
      for (var _si = 0; _si < _slist.length; _si++) {
        if (_slist[_si].id === _sid) { _slist[_si].snoozeUntil = Date.now() + 5 * 60 * 1000; }
      }
      _alarmPersist(_suid, _slist);
      if (typeof showToast === 'function') showToast('Snoozed 5 minutes', 'info', 2500);
      renderHubBento();
      return;
    }
    const alarmDismiss = e.target.closest('[data-alarm-dismiss]');
    if (alarmDismiss) {
      var _xrow = alarmDismiss.closest('[data-alarm-id]');
      var _xbub = alarmDismiss.closest('.bento-bubble');
      var _xuid = _xbub ? _xbub.dataset.bubble : null;
      var _xid = _xrow ? _xrow.dataset.alarmId : null;
      var _xpitem = _xuid ? _alarmItem(_xuid) : null;
      var _xlist = _alarmList(_xpitem);
      for (var _xi = 0; _xi < _xlist.length; _xi++) {
        if (_xlist[_xi].id === _xid) { _xlist[_xi].ringing = 0; _xlist[_xi].snoozeUntil = 0; }
      }
      _alarmPersist(_xuid, _xlist);
      renderHubBento();
      return;
    }
    const alarmPreview = e.target.closest('[data-alarm-preview]');
    if (alarmPreview) {
      var _prow = alarmPreview.closest('[data-alarm-id]');
      var _psel = _prow ? _prow.querySelector('[data-alarm-sound]') : null;
      var _pvol = _prow ? _prow.querySelector('[data-alarm-vol]') : null;
      _playAlarmSound(_psel ? _psel.value : '', _pvol ? parseInt(_pvol.value, 10) : 80);
      return;
    }
    const alarmBrowse = e.target.closest('[data-alarm-browse]');
    if (alarmBrowse) {
      var _brow = alarmBrowse.closest('[data-alarm-id]');
      var _bub = alarmBrowse.closest('.bento-bubble');
      _openSoundBrowser(_bub ? _bub.dataset.bubble : null, _brow ? _brow.dataset.alarmId : null);
      return;
    }
    const todayToggle = e.target.closest('[data-today-toggle]');
    if (todayToggle) {
      var _tid = todayToggle.dataset.todayToggle;
      if (_tid && typeof toggleComplete === 'function') {
        toggleComplete(_tid);
        renderHubBento();
        if (typeof updateHub === 'function') { try { updateHub(); } catch(_err) {} }
      }
      return;
    }
    const todayAddBtn = e.target.closest('[data-today-add-btn]');
    if (todayAddBtn) {
      if (!hubEditMode) return;
      var _tbubble = todayAddBtn.closest('.bento-bubble');
      var _tinput = _tbubble ? _tbubble.querySelector('[data-today-add]') : null;
      _todayQuickAdd(_tinput ? _tinput.value : '');
      return;
    }
    const todayDel = e.target.closest('[data-today-del]');
    if (todayDel) {
      if (!hubEditMode) return;
      var _dtid = todayDel.dataset.todayDel;
      if (_dtid && typeof deleteTask === 'function') {
        deleteTask(_dtid);
        renderHubBento();
        if (typeof updateHub === 'function') { try { updateHub(); } catch(_err) {} }
      }
      return;
    }
    const delBtn = e.target.closest('[data-del]');
    if (!delBtn || !hubEditMode) return;
    const field = delBtn.dataset.del;
    const idx = parseInt(delBtn.dataset.idx);
    if (isNaN(idx)) return;
    if (field === 'goals') { hubContent.goals.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'priorities') { hubContent.priorities.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'todos') { hubContent.todos.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'todayTodos') { var _ttd = _todayTodosItems(); if (_ttd[idx]) { _ttd.splice(idx, 1); saveHubContent(); renderHubBento(); } }
    else if (field === 'habits') { hubContent.habits.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'links') { hubContent.links.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'countdown') { hubContent.countdown.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'homework') { hubContent.homework.splice(idx, 1); saveHubContent(); renderHubBento(); }
    else if (field === 'reading') { hubContent.reading.splice(idx, 1); saveHubContent(); renderHubBento(); }
  });

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
    const addBtn = e.target.closest('[data-add]');
    if (!addBtn) return;
    if (!hubEditMode) return;
    const field = addBtn.dataset.add;
    if (field === 'goals') { hubContent.goals.push(''); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="goals"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'priorities') { hubContent.priorities.push(''); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="priorities"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'todos') { hubContent.todos.push({ text: '', done: false }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="todos"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'todayTodos') { _todayTodosItems().push({ text: '', done: false }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="todayTodos"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'habits') { hubContent.habits.push(''); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.hub-editable[data-edit="habits"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'links') { hubContent.links.push({ label: '', url: '' }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.hub-editable[data-edit="links-label"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'countdown') { hubContent.countdown.push({ label: '', date: new Date().toISOString().slice(0,10) }); saveHubContent(); renderHubBento(); }
    else if (field === 'homework') { hubContent.homework.push({ text: '', subject: '', due: '', priority: 'medium', done: false }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-item-text[data-edit="homework"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
    else if (field === 'reading') { hubContent.reading.push({ title: '', author: '', done: false }); saveHubContent(); renderHubBento(); setTimeout(() => { const els = document.querySelectorAll('.w-rd-title[data-edit="reading-title"]'); const last = els[els.length - 1]; if (last) { last.focus(); } }, 50); }
  });

  document.querySelector('.hub-layout')?.addEventListener('click', function(e) {
    const toggle = e.target.closest('.hub-section-vis-toggle');
    if (!toggle || !hubEditMode) return;
    const wrap = toggle.closest('.hub-section-wrap');
    if (wrap) toggleSectionVis(wrap.dataset.hubSection);
  });

  document.querySelector('.hub-gallery')?.addEventListener('click', function(e) {
    const editBtn = e.target.closest('[data-edit-gallery]');
    if (!editBtn || !hubEditMode) return;
    const idx = parseInt(editBtn.dataset.editGallery);
    if (isNaN(idx)) return;
    showGalleryPopup(idx, editBtn);
  });

  document.querySelector('.hub-gallery')?.addEventListener('click', function(e) {
    const addBtn = e.target.closest('[data-add="gallery"]');
    if (!addBtn || !hubEditMode) return;
    hubContent.gallery.push({ label: 'New View', desc: 'Description', href: '#', icon: 'chart', color: 'var(--text-secondary)', bg: 'var(--surface-container)' });
    saveHubContent();
  });

  // Snap-presets submenu on right-click of bubble handle/button area in edit mode
  document.querySelector('.bento-grid')?.addEventListener('contextmenu', function(e) {
    var handle = e.target.closest('.bento-toolbar, .bento-toolbar-remove, .bento-toolbar-style, .bento-tool-btn');
    if (!handle || !hubEditMode) return;
    e.preventDefault();
    var bubble = handle.closest('.bento-bubble');
    if (!bubble) return;
    var uid = bubble.dataset.bubble;

    // Remove any existing snap menu
    var old = document.querySelector('.snap-preset-menu');
    if (old) old.remove();

    var menu = document.createElement('div');
    menu.className = 'snap-preset-menu';
    var itemColor = hubContent.bubbleColors && hubContent.bubbleColors[uid];
    menu.innerHTML =
      '<div class="snap-preset-head">Resize</div>' +
      '<div class="snap-preset-item" data-snap-preset="' + uid + '" data-snap-size="small">Small (160×100)</div>' +
      '<div class="snap-preset-item" data-snap-preset="' + uid + '" data-snap-size="medium">Medium (240×160)</div>' +
      '<div class="snap-preset-item" data-snap-preset="' + uid + '" data-snap-size="large">Large (340×240)</div>' +
      '<div class="snap-preset-head" style="margin-top:4px">Accent Color</div>' +
      '<div class="snap-preset-colors"><button class="cpop-trigger" data-accent-popup="' + uid + '" style="margin:2px 8px 8px"><span class="cpop-trigger-dot" style="background:' + (itemColor || 'var(--text-primary)') + '"></span><span class="cpop-trigger-hex">' + (itemColor || 'default') + '</span></button></div>';
    var menuW = 180, menuH = 250;
    menu.style.left = Math.min(e.pageX, window.innerWidth - menuW - 8) + 'px';
    menu.style.top = Math.min(e.pageY, window.innerHeight - menuH - 8) + 'px';
    document.body.appendChild(menu);
    setTimeout(function() { menu.addEventListener('wheel', function(we) { we.stopPropagation(); }); }, 0);
  });
  document.addEventListener('click', function(e) {
    var snapItem = e.target.closest('[data-snap-preset]');
    if (snapItem) {
      e.preventDefault();
      var uid = snapItem.dataset.snapPreset;
      var layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      var item = layout.find(function(i) { return i.uid === uid; });
      if (item) {
        var presets = {small:{w:snap(160),h:snap(100)}, medium:{w:snap(240),h:snap(160)}, large:{w:snap(340),h:snap(240)}};
        var p = presets[snapItem.dataset.snapSize] || presets.medium;
        item.w = p.w; item.h = p.h;
        hubContent.bentoLayout = layout;
        saveHubContent();
        renderHubBento();
      }
      var menu = document.querySelector('.snap-preset-menu');
      if (menu) menu.remove();
      return;
    }
    var accentBtn = e.target.closest('[data-accent-popup]');
    if (accentBtn) {
      e.stopPropagation();
      var auid = accentBtn.dataset.accentPopup;
      var cur = (hubContent.bubbleColors && hubContent.bubbleColors[auid]) || '';
      if (typeof openColorPopup === 'function') {
        openColorPopup(accentBtn, { title: 'Bubble accent', value: cur, allowAuto: true, autoLabel: 'Default', autoValue: '', onPick: function(hex) {
          hubContent.bubbleColors = hubContent.bubbleColors || {};
          hubContent.bubbleColors[auid] = hex;
          saveHubContent();
          renderHubBento();
        } });
      }
      var smenu = document.querySelector('.snap-preset-menu');
      if (smenu) smenu.remove();
      return;
    }
    if (!e.target.closest('.snap-preset-menu')) {
      var menu = document.querySelector('.snap-preset-menu');
      if (menu) menu.remove();
    }
  }, true);

  document.querySelector('.bento-grid')?.addEventListener('click', function(e) {
    if (e.target.closest('.bento-bubble[data-suppress-click]')) return;
    const ttBox = e.target.closest('[data-tt-toggle]');
    if (ttBox) {
      const ttIdx = parseInt(ttBox.dataset.ttToggle);
      var _ttl = _todayTodosItems();
      if (!isNaN(ttIdx) && _ttl[ttIdx]) {
        _ttl[ttIdx].done = !_ttl[ttIdx].done;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    const todoBox = e.target.closest('.w-todo-box');
    if (todoBox && !todoBox.closest('.w-hw-item') && !todoBox.closest('.w-st-leaf') && !todoBox.hasAttribute('data-st-toggle-item')) {
      const item = todoBox.closest('.w-item');
      if (!item) return;
      const idx = parseInt(item.dataset.idx);
      if (isNaN(idx) || !hubContent.todos[idx]) return;
      hubContent.todos[idx].done = !hubContent.todos[idx].done;
      saveHubContent();
      renderHubBento();
      return;
    }
    const hwBox = e.target.closest('.w-hw-item .w-todo-box');
    if (hwBox) {
      const hwItem = hwBox.closest('.w-hw-item');
      if (!hwItem) return;
      const idx = parseInt(hwItem.dataset.idx);
      if (isNaN(idx) || !hubContent.homework || !hubContent.homework[idx]) return;
      hubContent.homework[idx].done = !hubContent.homework[idx].done;
      saveHubContent();
      renderHubBento();
      return;
    }
    const calNav = e.target.closest('[data-cal-nav]');
    if (calNav) {
      e.preventDefault();
      const bubble = calNav.closest('.bento-bubble');
      if (!bubble) return;
      const uid = bubble.dataset.bubble;
  const layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
  hubContent.bentoLayout = layout;
      const item = layout.find(i => i.uid === uid);
      if (item) {
        item.calOffset = (item.calOffset || 0) + parseInt(calNav.dataset.calNav);
        hubContent.bentoLayout = layout;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    const hwDue = e.target.closest('[data-hw-due]');
    if (hwDue) {
      e.stopPropagation();
      var idx = parseInt(hwDue.dataset.hwDue);
      if (isNaN(idx) || !hubContent.homework || !hubContent.homework[idx]) return;
      var input = document.createElement('input');
      input.type = 'date';
      input.value = hubContent.homework[idx].due || '';
      input.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;padding:8px 12px;border-radius:8px;border:1px solid var(--border-color);background:var(--surface-container-high);color:var(--text-primary);font-size:0.85rem;';
      function closePicker() {
        if (input.value !== hubContent.homework[idx].due) {
          hubContent.homework[idx].due = input.value;
          saveHubContent();
          renderHubBento();
        }
        input.remove();
      }
      input.addEventListener('blur', closePicker);
      input.addEventListener('change', closePicker);
      document.body.appendChild(input);
      input.focus();
      input.showPicker && input.showPicker();
      return;
    }
    const stDelSubj = e.target.closest('[data-st-del-subject]');
    if (stDelSubj) {
      if (!hubEditMode) return;
      e.stopPropagation();
      var _dss = _ensureStudy();
      var _dsi = -1;
      for (var _di = 0; _di < _dss.length; _di++) if (_dss[_di].id === stDelSubj.dataset.stDelSubject) { _dsi = _di; break; }
      if (_dsi !== -1) { _dss.splice(_dsi, 1); saveHubContent(); renderHubBento(); }
      return;
    }
    const stDelChap = e.target.closest('[data-st-del-chapter]');
    if (stDelChap) {
      if (!hubEditMode) return;
      e.stopPropagation();
      var _dcp = (stDelChap.dataset.stDelChapter || '').split('|');
      var _dc = _findStudy(_dcp[0], _dcp[1]);
      if (_dc.sj && _dc.ch) {
        var _dci = _dc.sj.chapters.indexOf(_dc.ch);
        if (_dci !== -1) { _dc.sj.chapters.splice(_dci, 1); saveHubContent(); renderHubBento(); }
      }
      return;
    }
    const stDelItem = e.target.closest('[data-st-del-item]');
    if (stDelItem) {
      if (!hubEditMode) return;
      e.stopPropagation();
      var _dip = (stDelItem.dataset.stDelItem || '').split('|');
      var _dit = _findStudy(_dip[0], _dip[1], _dip[2]);
      if (_dit.ch && _dit.it) {
        var _dii = _dit.ch.items.indexOf(_dit.it);
        if (_dii !== -1) { _dit.ch.items.splice(_dii, 1); saveHubContent(); renderHubBento(); }
      }
      return;
    }
    const stTogItem = e.target.closest('[data-st-toggle-item]');
    if (stTogItem) {
      var _tip = (stTogItem.dataset.stToggleItem || '').split('|');
      var _tit = _findStudy(_tip[0], _tip[1], _tip[2]);
      if (_tit.it) { _tit.it.done = !_tit.it.done; saveHubContent(); renderHubBento(); }
      return;
    }
    const stAddSubj = e.target.closest('[data-st-add-subject]');
    if (stAddSubj) {
      if (!hubEditMode) return;
      var _nss = _ensureStudy();
      var _nsj = { id: _studyUid('sj'), name: 'New subject', collapsed: false, chapters: [{ id: _studyUid('ch'), name: 'Chapter 1', collapsed: false, items: [] }] };
      _nss.push(_nsj);
      saveHubContent();
      renderHubBento();
      setTimeout(function() { var el = document.querySelector('.w-st-subj-name[data-sid="' + _nsj.id + '"]'); if (el) el.focus(); }, 50);
      return;
    }
    const stAddChap = e.target.closest('[data-st-add-chapter]');
    if (stAddChap) {
      if (!hubEditMode) return;
      var _acs = _findStudy(stAddChap.dataset.stAddChapter);
      if (_acs.sj) {
        var _nch = { id: _studyUid('ch'), name: 'Chapter ' + (_acs.sj.chapters.length + 1), collapsed: false, items: [] };
        _acs.sj.chapters.push(_nch);
        _acs.sj.collapsed = false;
        saveHubContent();
        renderHubBento();
        setTimeout(function() { var el = document.querySelector('.w-st-chap-name[data-cid="' + _nch.id + '"]'); if (el) el.focus(); }, 50);
      }
      return;
    }
    const stAddItem = e.target.closest('[data-st-add-item]');
    if (stAddItem) {
      if (!hubEditMode) return;
      var _aip = (stAddItem.dataset.stAddItem || '').split('|');
      var _ait = _findStudy(_aip[0], _aip[1]);
      if (_ait.ch) {
        var _nit = { id: _studyUid('si'), text: '', done: false };
        _ait.ch.items.push(_nit);
        _ait.sj.collapsed = false;
        _ait.ch.collapsed = false;
        saveHubContent();
        renderHubBento();
        setTimeout(function() { var els = document.querySelectorAll('.w-item-text[data-edit="study-item"][data-iid="' + _nit.id + '"]'); var last = els[els.length - 1]; if (last) last.focus(); }, 50);
      }
      return;
    }
    const stColorDot = e.target.closest('[data-st-color]');
    if (stColorDot) {
      e.stopPropagation();
      _openStudyColorPopup(stColorDot.dataset.stColor, stColorDot);
      return;
    }
    const stTogChap = e.target.closest('[data-st-toggle-chap]');
    if (stTogChap) {
      if (e.target.closest('[contenteditable],button,.w-todo-box,[data-st-toggle-item],[data-st-add-item]')) return;
      var _tcp = (stTogChap.dataset.stToggleChap || '').split('|');
      var _tct = _findStudy(_tcp[0], _tcp[1]);
      if (_tct.ch) { _tct.ch.collapsed = !_tct.ch.collapsed; saveHubContent(); renderHubBento(); }
      return;
    }
    const stTogSubj = e.target.closest('[data-st-toggle-subj]');
    if (stTogSubj) {
      if (e.target.closest('[contenteditable],button,.w-todo-box,[data-st-toggle-item],[data-st-add-item],[data-st-add-chapter],[data-st-color]')) return;
      var _tst = _findStudy(stTogSubj.dataset.stToggleSubj);
      if (_tst.sj) { _tst.sj.collapsed = !_tst.sj.collapsed; saveHubContent(); renderHubBento(); }
      return;
    }
    const calDay = e.target.closest('[data-cal-day]');
    if (calDay) {
      var oldTip = document.querySelector('.cal-tooltip');
      if (oldTip) oldTip.remove();
      var dateStr = calDay.dataset.calDay;
      var tasks = (typeof loadTasks === 'function' ? loadTasks() : []).filter(function(t) { return t.date === dateStr; });
      if (tasks.length === 0) return;
      var tip = document.createElement('div');
      tip.className = 'cal-tooltip';
      tip.innerHTML = '<div class="cal-tooltip-head">' + dateStr + ' — ' + tasks.length + ' task' + (tasks.length !== 1 ? 's' : '') + '</div><div class="cal-tooltip-body">' + tasks.slice(0, 5).map(function(t) { return '<div class="cal-tooltip-item' + (t.completed ? ' cal-done' : '') + '">' + escapeHtml(t.title) + '</div>'; }).join('') + (tasks.length > 5 ? '<div class="cal-tooltip-more">+' + (tasks.length - 5) + ' more</div>' : '') + '</div>';
      document.body.appendChild(tip);
      var r = calDay.getBoundingClientRect();
      tip.style.left = Math.min(r.left + r.width / 2 - tip.offsetWidth / 2, window.innerWidth - tip.offsetWidth - 8) + 'px';
      tip.style.top = (r.bottom + 6) + 'px';
      function closeTip(e2) { if (!e2.target.closest('.cal-tooltip')) { tip.remove(); document.removeEventListener('mousedown', closeTip); } }
      setTimeout(function() { document.addEventListener('mousedown', closeTip); }, 0);
      return;
    }
    const habitToggle = e.target.closest('[data-habit-toggle]');
    if (habitToggle) {
      const idx = parseInt(habitToggle.dataset.habitToggle);
      if (!isNaN(idx)) {
        const todayKey = _hubTodayKey();
        if (!hubContent.habitData) hubContent.habitData = {};
        if (!hubContent.habitData[todayKey]) hubContent.habitData[todayKey] = {};
        hubContent.habitData[todayKey][idx] = !hubContent.habitData[todayKey][idx];
        var _cut = _hubTodayKey(new Date(Date.now() - 60 * 86400000));
        for (var _k in hubContent.habitData) {
          if (Object.prototype.hasOwnProperty.call(hubContent.habitData, _k) && _k < _cut) delete hubContent.habitData[_k];
        }
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Video feed: add
    var _ytfAddBtn = e.target.closest('[data-ytf-add]');
    if (_ytfAddBtn) {
      var _ytfWrap = _ytfAddBtn.closest('.ytf-wrap');
      var _ytfInp = _ytfWrap ? _ytfWrap.querySelector('[data-ytf-input]') : null;
      var _ytfVal = _ytfInp ? String(_ytfInp.value || '').trim() : '';
      var _ytfMeta = _ytfVal ? _videoMeta(_ytfVal) : null;
      if (_ytfMeta) {
        var _ytfStore = _ytFeedData();
        var _ytfTitle = _ytfMeta.kind === 'yt' ? 'YouTube video' : (_ytfMeta.kind === 'tt' ? 'TikTok video' : _ytfVal);
        _ytfStore.items.unshift({ url: _ytfMeta.url, title: _ytfTitle, kind: _ytfMeta.kind, added: Date.now() });
        if (_ytfStore.items.length > 24) _ytfStore.items = _ytfStore.items.slice(0, 24);
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Video feed: remove
    var _ytfDel = e.target.closest('[data-ytf-del]');
    if (_ytfDel) {
      var _ytfIdx = parseInt(_ytfDel.dataset.ytfDel, 10);
      var _ytfS2 = _ytFeedData();
      if (!isNaN(_ytfIdx) && _ytfIdx >= 0 && _ytfIdx < _ytfS2.items.length) {
        _ytfS2.items.splice(_ytfIdx, 1);
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Watchlist: cycle status
    var _wlCycle = e.target.closest('[data-wl-cycle]');
    if (_wlCycle) {
      var _wlI = parseInt(_wlCycle.dataset.wlCycle, 10);
      var _wlS = _watchlistData();
      if (!isNaN(_wlI) && _wlS.items[_wlI]) {
        var _wlIt0 = _wlS.items[_wlI];
        var _wlCur = _wlIt0.status || 'plan';
        var _wlNext = _wlCur === 'plan' ? 'watching' : (_wlCur === 'watching' ? 'done' : 'plan');
        _wlIt0.status = _wlNext;
        var _wlTot0 = parseInt(_wlIt0.totalEpisodes, 10) || 0;
        if (_wlNext === 'done' && _wlTot0 > 0) _wlIt0.episode = _wlTot0;
        if (_wlNext === 'plan') _wlIt0.episode = 0;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Watchlist: next episode
    var _wlStep = e.target.closest('[data-wl-step]');
    if (_wlStep) {
      var _wlJ = parseInt(_wlStep.dataset.wlStep, 10);
      var _wlS2 = _watchlistData();
      if (!isNaN(_wlJ) && _wlS2.items[_wlJ]) {
        var _wlIt = _wlS2.items[_wlJ];
        var _wlTot = parseInt(_wlIt.totalEpisodes, 10) || 0;
        var _wlEp = (parseInt(_wlIt.episode, 10) || 0) + 1;
        if (_wlTot > 0 && _wlEp > _wlTot) _wlEp = _wlTot;
        _wlIt.episode = _wlEp;
        if (_wlTot > 0 && _wlEp >= _wlTot) _wlIt.status = 'done';
        else if (_wlIt.status === 'plan') _wlIt.status = 'watching';
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Watchlist: add
    var _wlAdd = e.target.closest('[data-wl-add]');
    if (_wlAdd) {
      var _wlWrap = _wlAdd.closest('.wl-add');
      var _wlTitleEl = _wlWrap ? _wlWrap.querySelector('[data-wl-input]') : null;
      var _wlKindEl = _wlWrap ? _wlWrap.querySelector('[data-wl-kind]') : null;
      var _wlEpsEl = _wlWrap ? _wlWrap.querySelector('[data-wl-eps]') : null;
      var _wlTitle = _wlTitleEl ? String(_wlTitleEl.value || '').trim() : '';
      if (_wlTitle) {
        var _wlStore = _watchlistData();
        _wlStore.items.unshift({
          title: _wlTitle,
          kind: _wlKindEl ? _wlKindEl.value : 'film',
          status: 'plan',
          episode: 0,
          totalEpisodes: _wlEpsEl ? (parseInt(_wlEpsEl.value, 10) || 0) : 0,
          added: Date.now()
        });
        if (_wlStore.items.length > 30) _wlStore.items = _wlStore.items.slice(0, 30);
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Watchlist: remove
    var _wlDel = e.target.closest('[data-wl-del]');
    if (_wlDel) {
      var _wlK = parseInt(_wlDel.dataset.wlDel, 10);
      var _wlS3 = _watchlistData();
      if (!isNaN(_wlK) && _wlK >= 0 && _wlK < _wlS3.items.length) {
        _wlS3.items.splice(_wlK, 1);
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Music visualiser mic toggle
    var _mvBtn = e.target.closest('[data-mv-toggle]');
    if (_mvBtn) {
      _mvToggle(_mvBtn);
      return;
    }
    // Water toggle
    const waterToggle = e.target.closest('[data-water-toggle]');
    if (waterToggle) {
      const idx = parseInt(waterToggle.dataset.waterToggle);
      if (!isNaN(idx)) {
        if (!hubContent.water) hubContent.water = { goal:8, logged:0, date:'' };
        var _today = new Date().toISOString().slice(0,10);
        if (hubContent.water.date !== _today) { hubContent.water.logged = 0; hubContent.water.date = _today; }
        if (idx < hubContent.water.logged) {
          hubContent.water.logged = idx;
        } else {
          hubContent.water.logged = idx + 1;
        }
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Mood picker
    const moodPick = e.target.closest('[data-mood-pick]');
    if (moodPick) {
      const idx = parseInt(moodPick.dataset.moodPick);
      if (!isNaN(idx)) {
        if (!hubContent.mood) hubContent.mood = { today:null, history:{} };
        var _today = new Date().toISOString().slice(0,10);
        if (!hubContent.mood.history[_today]) hubContent.mood.history[_today] = {};
        hubContent.mood.history[_today].mood = idx;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Upcoming horizon
    var upDayBtn = e.target.closest('[data-upcoming-days]');
    if (upDayBtn) {
      var _ud = parseInt(upDayBtn.dataset.upcomingDays, 10);
      if (!isNaN(_ud)) {
        if (!hubContent.upcoming) hubContent.upcoming = { days: 14 };
        hubContent.upcoming.days = _ud;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Air quality refresh
    var aqRef = e.target.closest('[data-aq-refresh]');
    if (aqRef) { refreshAirQuality(); return; }
    // Widget pack: prayer times refresh
    var ptRef = e.target.closest('[data-pt-refresh]');
    if (ptRef) {
      try { localStorage.removeItem(PT_KEY); } catch (err) {}
      var _ptG = document.querySelector('.bento-grid');
      if (_ptG) _ptFetch(_ptG);
      return;
    }
    // Widget pack: earthquake refresh
    var qkRef = e.target.closest('[data-qk-refresh]');
    if (qkRef) {
      try { localStorage.removeItem(QK_KEY); } catch (err) {}
      var _qkG = document.querySelector('.bento-grid');
      if (_qkG) _qkFetch(_qkG);
      return;
    }
    // Widget pack: friends refresh
    var frRef = e.target.closest('[data-fr-refresh]');
    if (frRef) {
      _frCache = null;
      var _frG = document.querySelector('.bento-grid');
      if (_frG) _friendsLiveFetch(_frG);
      return;
    }
    // ─── Widget pack 2: attendance marking ───
    var attMark = e.target.closest('[data-att-mark]');
    if (attMark) {
      var _attTag = attMark.dataset.attSubject;
      var _attKind = attMark.dataset.attMark;
      if (_attTag && _attKind) {
        if (!hubContent.attendance) hubContent.attendance = { allowedPct: 20, subjects: {} };
        if (!hubContent.attendance.subjects) hubContent.attendance.subjects = {};
        if (!hubContent.attendance.subjects[_attTag]) hubContent.attendance.subjects[_attTag] = { p: 0, l: 0, a: 0 };
        var _attS = hubContent.attendance.subjects[_attTag];
        if (_attKind === 'u') {
          if ((_attS.a || 0) > 0) _attS.a -= 1;
          else if ((_attS.l || 0) > 0) _attS.l -= 1;
          else if ((_attS.p || 0) > 0) _attS.p -= 1;
        } else {
          _attS[_attKind] = (_attS[_attKind] || 0) + 1;
        }
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: add a grade ───
    var grAdd = e.target.closest('[data-gr-add]');
    if (grAdd) {
      var _grBub = grAdd.closest('.bento-bubble');
      var _grSel = _grBub ? _grBub.querySelector('[data-gr-subject]') : null;
      var _grScoreIn = _grBub ? _grBub.querySelector('[data-gr-score]') : null;
      var _grWeightIn = _grBub ? _grBub.querySelector('[data-gr-weight]') : null;
      var _grSub = _grSel ? _grSel.value : '';
      var _grVal = _grScoreIn ? parseFloat(_grScoreIn.value) : NaN;
      var _grWt = _grWeightIn ? parseFloat(_grWeightIn.value) : 1;
      if (_grSub && isFinite(_grVal)) {
        if (!hubContent.grades) hubContent.grades = { target: 85, subjects: {} };
        if (!hubContent.grades.subjects) hubContent.grades.subjects = {};
        if (!Array.isArray(hubContent.grades.subjects[_grSub])) hubContent.grades.subjects[_grSub] = [];
        hubContent.grades.subjects[_grSub].push({
          v: Math.max(0, Math.min(100, _grVal)),
          w: Math.max(0.1, isFinite(_grWt) ? _grWt : 1),
          d: _hubTodayKey()
        });
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: remove the last grade for the selected subject ───
    var grUndo = e.target.closest('[data-gr-undo]');
    if (grUndo) {
      var _grBub2 = grUndo.closest('.bento-bubble');
      var _grSel2 = _grBub2 ? _grBub2.querySelector('[data-gr-subject]') : null;
      var _grSub2 = _grSel2 ? _grSel2.value : '';
      var _grArr = (hubContent.grades && hubContent.grades.subjects && hubContent.grades.subjects[_grSub2]) || null;
      if (Array.isArray(_grArr) && _grArr.length) {
        _grArr.pop();
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: add an exam ───
    var exAdd = e.target.closest('[data-ex-add]');
    if (exAdd) {
      var _exBub = exAdd.closest('.bento-bubble');
      var _exTitleIn = _exBub ? _exBub.querySelector('[data-ex-title]') : null;
      var _exDateIn = _exBub ? _exBub.querySelector('[data-ex-date]') : null;
      var _exTitle = _exTitleIn ? String(_exTitleIn.value || '').trim() : '';
      var _exDate = _exDateIn ? String(_exDateIn.value || '').trim() : '';
      if (_exTitle && /^\d{4}-\d{2}-\d{2}$/.test(_exDate)) {
        if (!Array.isArray(hubContent.exams)) hubContent.exams = [];
        hubContent.exams.push({
          id: 'ex' + Date.now() + Math.floor(Math.random() * 1000),
          title: _exTitle.slice(0, 60),
          date: _exDate,
          topics: []
        });
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: add topics to the soonest exam ───
    var exTopicAdd = e.target.closest('[data-ex-topic-add]');
    if (exTopicAdd) {
      var _exBub3 = exTopicAdd.closest('.bento-bubble');
      var _exTopicIn = _exBub3 ? _exBub3.querySelector('[data-ex-topics]') : null;
      var _exRaw = _exTopicIn ? String(_exTopicIn.value || '') : '';
      var _exParts = _exRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      if (_exParts.length) {
        var _exData = _examsData();
        var _exTarget = _exData.items.length ? _exData.items[0] : null;
        if (_exTarget && Array.isArray(hubContent.exams)) {
          for (var _ei = 0; _ei < hubContent.exams.length; _ei++) {
            if (hubContent.exams[_ei].id === _exTarget.id) {
              if (!Array.isArray(hubContent.exams[_ei].topics)) hubContent.exams[_ei].topics = [];
              _exParts.slice(0, 20).forEach(function(p) {
                hubContent.exams[_ei].topics.push({ t: p.slice(0, 60), done: false });
              });
              break;
            }
          }
          saveHubContent();
          renderHubBento();
        }
      }
      return;
    }
    // ─── Widget pack 2: toggle an exam topic ───
    var exTopic = e.target.closest('[data-exam-topic]');
    if (exTopic) {
      var _etId = exTopic.dataset.examTopic;
      var _etIdx = parseInt(exTopic.dataset.examIdx, 10);
      if (_etId && !isNaN(_etIdx) && Array.isArray(hubContent.exams)) {
        for (var _ej = 0; _ej < hubContent.exams.length; _ej++) {
          var _exm = hubContent.exams[_ej];
          if (_exm && _exm.id === _etId && Array.isArray(_exm.topics) && _exm.topics[_etIdx]) {
            _exm.topics[_etIdx].done = !_exm.topics[_etIdx].done;
            saveHubContent();
            renderHubBento();
            break;
          }
        }
      }
      return;
    }
    // ─── Widget pack 2: clear exams ───
    var exClear = e.target.closest('[data-ex-clear]');
    if (exClear) {
      hubContent.exams = [];
      saveHubContent();
      renderHubBento();
      return;
    }
    // ─── Widget pack 2: add a birthday ───
    var bdAdd = e.target.closest('[data-bd-add]');
    if (bdAdd) {
      var _bdBub = bdAdd.closest('.bento-bubble');
      var _bdNameIn = _bdBub ? _bdBub.querySelector('[data-bd-name]') : null;
      var _bdDateIn = _bdBub ? _bdBub.querySelector('[data-bd-date]') : null;
      var _bdName = _bdNameIn ? String(_bdNameIn.value || '').trim() : '';
      var _bdDate = _bdDateIn ? String(_bdDateIn.value || '').trim() : '';
      if (_bdName && /^\d{4}-\d{2}-\d{2}$/.test(_bdDate)) {
        if (!Array.isArray(hubContent.birthdays)) hubContent.birthdays = [];
        hubContent.birthdays.push({
          id: 'bd' + Date.now() + Math.floor(Math.random() * 1000),
          name: _bdName.slice(0, 40),
          date: _bdDate.slice(5)
        });
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: clear birthdays ───
    var bdClear = e.target.closest('[data-bd-clear]');
    if (bdClear) {
      hubContent.birthdays = [];
      saveHubContent();
      renderHubBento();
      return;
    }
    // ─── Widget pack 2: flashcard reveal ───
    var fcShow = e.target.closest('[data-fc-show]');
    if (fcShow) {
      if (!hubContent.flashcards) hubContent.flashcards = { decks: {}, reviewed: {} };
      hubContent.flashcards.showBack = true;
      saveHubContent();
      renderHubBento();
      return;
    }
    // ─── Widget pack 2: flashcard grade ───
    var fcAgain = e.target.closest('[data-fc-again]');
    var fcGood = e.target.closest('[data-fc-good]');
    if (fcAgain || fcGood) {
      var _fcData = _flashcardsData();
      var _fcActive = _fcData.active;
      var _fcCard = _fcData.current;
      if (_fcActive && _fcCard && hubContent.flashcards && hubContent.flashcards.decks && hubContent.flashcards.decks[_fcActive.id]) {
        var _fcList = hubContent.flashcards.decks[_fcActive.id];
        for (var _fk = 0; _fk < _fcList.length; _fk++) {
          if (_fcList[_fk] === _fcCard || (_fcCard.id && _fcList[_fk].id === _fcCard.id)) {
            var _fcBox = Math.max(1, Math.min(5, parseInt(_fcList[_fk].box, 10) || 1));
            if (fcAgain) {
              _fcList[_fk].box = 1;
            } else {
              _fcBox = Math.min(5, _fcBox + 1);
              _fcList[_fk].box = _fcBox;
            }
            var _fcGap = FC_BOX_DAYS[Math.max(0, Math.min(4, _fcList[_fk].box - 1))] || 1;
            _fcList[_fk].due = _hubTodayKey(new Date(Date.now() + _fcGap * 86400000));
            break;
          }
        }
        if (!hubContent.flashcards.reviewed) hubContent.flashcards.reviewed = {};
        var _fcToday = _hubTodayKey();
        hubContent.flashcards.reviewed[_fcToday] = (parseInt(hubContent.flashcards.reviewed[_fcToday], 10) || 0) + 1;
        hubContent.flashcards.showBack = false;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: add a flashcard ───
    var fcAdd = e.target.closest('[data-fc-add]');
    if (fcAdd) {
      var _fcBub = fcAdd.closest('.bento-bubble');
      var _fcDeckIn = _fcBub ? _fcBub.querySelector('[data-fc-deck]') : null;
      var _fcFrontIn = _fcBub ? _fcBub.querySelector('[data-fc-front]') : null;
      var _fcBackIn = _fcBub ? _fcBub.querySelector('[data-fc-back]') : null;
      var _fcDeck = _fcDeckIn ? String(_fcDeckIn.value || '').trim() : '';
      var _fcFront = _fcFrontIn ? String(_fcFrontIn.value || '').trim() : '';
      var _fcBack = _fcBackIn ? String(_fcBackIn.value || '').trim() : '';
      if (_fcDeck && _fcFront) {
        if (!hubContent.flashcards) hubContent.flashcards = { decks: {}, reviewed: {} };
        if (!hubContent.flashcards.decks) hubContent.flashcards.decks = {};
        if (!Array.isArray(hubContent.flashcards.decks[_fcDeck])) hubContent.flashcards.decks[_fcDeck] = [];
        hubContent.flashcards.decks[_fcDeck].push({
          id: 'fc' + Date.now() + Math.floor(Math.random() * 1000),
          front: _fcFront.slice(0, 200),
          back: _fcBack.slice(0, 200),
          box: 1,
          due: _hubTodayKey()
        });
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // ─── Widget pack 2: reset flashcard review state ───
    var fcReset = e.target.closest('[data-fc-reset]');
    if (fcReset) {
      if (hubContent.flashcards && hubContent.flashcards.decks) {
        var _fcTodayKey = _hubTodayKey();
        Object.keys(hubContent.flashcards.decks).forEach(function(k) {
          (hubContent.flashcards.decks[k] || []).forEach(function(c) {
            if (!c) return;
            c.box = 1;
            c.due = _fcTodayKey;
          });
        });
        hubContent.flashcards.reviewed = {};
        hubContent.flashcards.showBack = false;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // World clock remove
    var wcDel = e.target.closest('[data-wc-del]');
    if (wcDel) {
      var _wi = parseInt(wcDel.dataset.wcDel, 10);
      if (!isNaN(_wi) && Array.isArray(hubContent.worldClock)) {
        hubContent.worldClock.splice(_wi, 1);
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // World clock add
    var wcAdd = e.target.closest('[data-wc-add-btn]');
    if (wcAdd) {
      if (!hubEditMode) return;
      var _wsel = wcAdd.closest('.w-wc-add') ? wcAdd.closest('.w-wc-add').querySelector('[data-wc-add-select]') : null;
      var _wtv = _wsel ? _wsel.value : '';
      if (_wtv) {
        if (!Array.isArray(hubContent.worldClock)) hubContent.worldClock = [];
        if (hubContent.worldClock.indexOf(_wtv) === -1) hubContent.worldClock.push(_wtv);
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // Focus log session
    var focusAdd = e.target.closest('[data-focus-add]');
    if (focusAdd) {
      var _fmins = _focusCfg().sessionMinutes;
      var _fkey = formatDate(new Date());
      if (!hubContent.focusLog) hubContent.focusLog = {};
      var _fday = hubContent.focusLog[_fkey] || { sessions: 0, minutes: 0 };
      _fday.sessions = (_fday.sessions || 0) + 1;
      _fday.minutes = (_fday.minutes || 0) + _fmins;
      hubContent.focusLog[_fkey] = _fday;
      _pruneFocusLog();
      saveHubContent();
      renderHubBento();
      return;
    }
    var focusReset = e.target.closest('[data-focus-reset]');
    if (focusReset) {
      var _frk = formatDate(new Date());
      if (hubContent.focusLog) delete hubContent.focusLog[_frk];
      saveHubContent();
      renderHubBento();
      return;
    }
    // Currency swap
    var curSwap = e.target.closest('[data-cur-swap]');
    if (curSwap) {
      if (!hubContent.currency) hubContent.currency = { from: 'USD', to: 'EUR', amount: 1 };
      var _cf = hubContent.currency.from;
      hubContent.currency.from = hubContent.currency.to;
      hubContent.currency.to = _cf;
      saveHubContent();
      renderHubBento();
      return;
    }
    // Calculator keys
    var calcKey = e.target.closest('[data-calc-key]');
    if (calcKey) { _calcApplyKey(calcKey.dataset.calcUid, calcKey.dataset.calcKey); return; }
    var calcHist = e.target.closest('[data-calc-hist]');
    if (calcHist) {
      var _hu = calcHist.dataset.calcHist;
      var _hst = _calcState(_hu);
      _hst.expr = calcHist.dataset.calcHistExpr || '';
      _hst.result = '';
      saveHubContent();
      _calcRefreshDom(_hu);
      return;
    }
    // Breathing start/stop
    const breathToggle = e.target.closest('[data-breath-toggle]');
    if (breathToggle) { _breathToggle(breathToggle.dataset.breathToggle); return; }
    const breathReset = e.target.closest('[data-breath-reset]');
    if (breathReset) { _breathReset(breathReset.dataset.breathReset); return; }
    // Doodle color
    const ddColor = e.target.closest('[data-doodle-color]');
    if (ddColor) { _doodleSetColor(ddColor.dataset.doodleColor, ddColor.dataset.color); return; }
    // Doodle clear
    const ddClear = e.target.closest('[data-doodle-clear]');
    if (ddClear) { _doodleClear(ddClear.dataset.doodleClear); return; }
    // Reading item done toggle
    const rdToggle = e.target.closest('[data-read-toggle]');
    if (rdToggle) {
      const _rdIdx = parseInt(rdToggle.dataset.readToggle, 10);
      if (!isNaN(_rdIdx) && Array.isArray(hubContent.reading) && hubContent.reading[_rdIdx]) {
        hubContent.reading[_rdIdx].done = !hubContent.reading[_rdIdx].done;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    // GitHub refresh
    const ghRefresh = e.target.closest('[data-gh-refresh]');
    if (ghRefresh) {
      const _ghUser = (hubContent.github && hubContent.github.username) || '';
      if (_ghUser) {
        delete _ghCache[_ghUser];
        try { localStorage.removeItem('hub-github-' + _ghUser.toLowerCase()); } catch(err) {}
      }
      _ghFetchedUser = null;
      var _ghGrid = document.querySelector('.bento-grid');
      if (_ghGrid) _fetchGithub(_ghGrid);
      return;
    }
    // Countdown date/label change
    const cdDate = e.target.closest('[data-cd-date]');
    if (cdDate) {
      const idx = parseInt(cdDate.dataset.cdDate);
      if (!isNaN(idx) && hubContent.countdown?.[idx] !== undefined) {
        hubContent.countdown[idx].date = cdDate.value;
        saveHubContent();
        renderHubBento();
      }
      return;
    }
    const cdLabel = e.target.closest('[data-cd-label]');
    if (cdLabel) {
      const idx = parseInt(cdLabel.dataset.cdLabel);
      if (!isNaN(idx) && hubContent.countdown?.[idx] !== undefined) {
        hubContent.countdown[idx].label = cdLabel.value;
        saveHubContent();
      }
      return;
    }
    const wrap = e.target.closest('[data-img-picker]');
    if (!wrap) return;
    if (!hubEditMode) return;
    var _pickerBubble = wrap.closest('.bento-bubble');
    window._onImageSaved = function(_imgId, _url) {
      var _uid = _pickerBubble ? _pickerBubble.dataset.bubble : null;
      if (!_uid) return;
      var _layout = normalizeBentoLayout(hubContent.bentoLayout, hubContent);
      hubContent.bentoLayout = _layout;
      saveHubContent();
    };
    openImagePicker(wrap.dataset.imgPicker);
  });
  document.querySelector('.bento-grid')?.addEventListener('error', function(e) {
    var vEl = e.target && e.target.closest ? e.target.closest('video[data-image-id]') : null;
    if (!vEl || !vEl.closest('.bento-img-wrap')) return;
    vEl.style.display = 'none';
    var w = vEl.closest('.bento-img-wrap');
    var ph = w && w.querySelector('.bento-img-placeholder');
    if (ph) ph.style.display = 'flex';
  }, true);

  // Gallery card images — clickable in hub edit mode only
  document.addEventListener('click', function(e) {
    if (!hubEditMode) return;
    var cover = e.target.closest('.hub-gallery-cover');
    if (!cover) return;
    var galImg = cover.querySelector('img[data-image-id], video[data-image-id]');
    if (!galImg) return;
    var id = galImg.dataset.imageId;
    if (e.target.closest('a')) e.preventDefault();
    window._onImageSaved = function(imgId, url) {
      if (imgId !== id) return;
      var cur = cover.querySelector('img[data-image-id="' + id + '"], video[data-image-id="' + id + '"]');
      if (!cur) return;
      if (typeof setMediaSrc === 'function') setMediaSrc(cur, id, url);
      else { cur.src = url; cur.style.display = url ? 'block' : 'none'; }
    };
    openImagePicker(id);
  });
}

/* ─── Hub FAB (speed-dial) ──────────────────── */
function positionHubFAB() {
  const hub = document.getElementById('hubAccessHub');
  if (!hub) return;
  const allItems = hub.querySelectorAll('.access-item');
  const btn = document.getElementById('hubAccessMain');
  if (!btn || !allItems.length) return;
  const items = Array.from(allItems).filter(el => el.style.display !== 'none');
  if (!items.length) return;

  const S = 40;
  const N = items.length;
  const br = btn.getBoundingClientRect();
  const cx = br.left + br.width / 2;
  const cy = br.top + br.height / 2;

  const maxL = cx - S / 2;
  const maxT = cy - S / 2;

  const startAngle = Math.PI;
  const arcSpan = Math.PI / 2;
  const step = N > 1 ? arcSpan / (N - 1) : 0;
  let maxR = Infinity;
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    const dx = Math.cos(a), dy = Math.sin(a);
    let r = Infinity;
    if (dx < -0.001) r = Math.min(r, maxL / -dx);
    if (dy < -0.001) r = Math.min(r, maxT / -dy);
    maxR = Math.min(maxR, r);
  }

  const R = Math.round(Math.max(48, Math.min(100, maxR)));

  const hr = hub.getBoundingClientRect();
  const ox = hr.right - 26;
  const oy = hr.bottom - 26;

  allItems.forEach(el => {
    if (el.style.display === 'none') {
      el.style.setProperty('--x', '0px');
      el.style.setProperty('--y', '0px');
    }
  });
  for (let i = 0; i < N; i++) {
    const a = startAngle + i * step;
    items[i].style.setProperty('--x', Math.round(cx + Math.cos(a) * R + S / 2 - ox) + 'px');
    items[i].style.setProperty('--y', Math.round(cy + Math.sin(a) * R + S / 2 - oy) + 'px');
    items[i].style.setProperty('--dl-open', (0.02 + i * 0.035).toFixed(3) + 's');
    items[i].style.setProperty('--dl', ((N - 1 - i) * 0.035 + 0.02).toFixed(3) + 's');
  }
}

function toggleHubAccess() {
  const items = document.getElementById('hubAccessItems');
  const btn = document.getElementById('hubAccessMain');
  if (items && btn) {
    const opening = !items.classList.contains('open');
    if (opening) positionHubFAB();
    items.classList.toggle('open');
    btn.classList.toggle('open');
  }
}
function initHubEditMode() {
  // Ensure canvas is always visible
  document.querySelectorAll('.hub-section-wrap[data-hub-section="bento"]').forEach(w => w.classList.remove('hidden-section'));
  document.querySelectorAll('.hub-section-wrap').forEach(wrap => {
    const header = wrap.querySelector('.hub-section-header');
    if (header && !header.querySelector('.hub-section-vis-toggle')) {
      const toggle = document.createElement('button');
      toggle.className = 'hub-section-vis-toggle';
      toggle.title = 'Toggle section visibility';
      header.appendChild(toggle);
    }
  });
  setupHubEditEvents();
  renderHubGreeting();
  applyHubEditMode();
  if (typeof _paintHubSkin === 'function') _paintHubSkin();

  // (No longer syncing hubEditMode from state.editMode — they are independent)
}

/* ─── Admin: Ctrl+Shift+D to save preset, Ctrl+Shift+A to open admin panel ─── */
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey) {
    if (e.key === 'D' || e.key === 'd') {
      e.preventDefault();
      var name = prompt('Name this preset:');
      if (name && typeof savePreset === 'function') savePreset(name.trim());
    } else if (e.key === 'A' || e.key === 'a') {
      e.preventDefault();
      var target = 'admin.html';
      if (location.pathname.indexOf(target) !== -1) return;
      location.href = target;
    }
  }
});

/* ─── Initialize hub FAB positioning ────────── */
if (document.getElementById('hubAccessHub')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', positionHubFAB);
  } else {
    positionHubFAB();
  }
  window.addEventListener('resize', positionHubFAB);
  window.addEventListener('resize', function() { if (typeof _fitTextWidgets === 'function') _fitTextWidgets(); });

  // Directly wire the FAB toggle + outside-close (skip if already wired by setupHubEditEvents)
  const _wireHubFab = () => {
    const main = document.getElementById('hubAccessMain');
    const items = document.getElementById('hubAccessItems');
    if (main && items && !main.dataset._fabWired) {
      main.dataset._fabWired = '1';
      main.addEventListener('click', function(e) {
        const opening = !items.classList.contains('open');
        if (opening) positionHubFAB();
        items.classList.toggle('open');
        main.classList.toggle('open');
      });
      document.addEventListener('click', function(e) {
        const hub = document.getElementById('hubAccessHub');
        if (hub && !hub.contains(e.target)) {
          items.classList.remove('open');
          main.classList.remove('open');
        }
      });
      document.getElementById('hubFabCustomize')?.addEventListener('click', function() { try { toggleHubAccess(); toggleHubEdit(); } catch(e) { console.error('Edit error:', e); } });
      document.getElementById('hubFabSnapshot')?.addEventListener('click', function() { toggleHubAccess(); setTimeout(captureHubSnapshot, 200); });
      document.getElementById('hubFabGuide')?.addEventListener('click', function() { toggleHubAccess(); showCanvasGuide(); });
      document.getElementById('hubFabStyle')?.addEventListener('click', function() { toggleHubAccess(); showStylePanel(); });
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _wireHubFab);
  } else {
    _wireHubFab();
  }
}

function _roundedRect(ctx, x, y, w, h, r) {
  var corners = Array.isArray(r) ? r : [r, r, r, r];
  var tl = corners[0]||0, tr = corners[1]||0, br = corners[2]||0, bl = corners[3]||0;
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

/* ─── Hub snapshot (canvas render + share/download) ─── */
function _snapshotBubblePreview(el, type) {
  if (!el || !type) return { title: type || '', lines: [] };
  var title = type.charAt(0).toUpperCase() + type.slice(1);
  var lines = [];
  try {
    if (type === 'clock') {
      var t = el.querySelector('.clock-time') || el.querySelector('.clock-flip-val') || el.querySelector('.clock-minimal-h');
      var d = el.querySelector('.clock-date');
      var s = el.querySelector('.clock-split-num');
      if (t) lines.push(t.textContent.trim().replace(/\s+/g,' '));
      else if (s) lines.push(s.textContent.trim() + ':' + (el.querySelectorAll('.clock-split-num')[1]?.textContent || ''));
      if (d) lines.push(d.textContent.trim().replace(/\s+/g,' '));
    } else if (type === 'weather') {
      var tmp = el.querySelector('.w-temp'); var cd = el.querySelector('.w-cond'); var lc = el.querySelector('.w-loc');
      if (tmp) lines.push(tmp.textContent.trim().replace(/\s+/g,' '));
      if (cd) lines.push(cd.textContent.trim().replace(/\s+/g,' '));
      if (lc) lines.push(lc.textContent.trim().replace(/\s+/g,' '));
    } else if (type === 'timer' || type === 'pomodoro') {
      var tv = el.querySelector('[class*="display"], [class*="time"]');
      if (tv) lines.push(tv.textContent.trim().replace(/\s+/g,' '));
      var st = el.querySelector('[class*="status"], [class*="phase"]');
      if (st) lines.push(st.textContent.trim().replace(/\s+/g,' '));
    } else if (type === 'spotify') {
      var sn = el.querySelector('.sp-track-name'); var sa = el.querySelector('.sp-artist');
      if (sn) lines.push(sn.textContent.trim().replace(/\s+/g,' '));
      if (sa) lines.push(sa.textContent.trim().replace(/\s+/g,' '));
      if (!lines.length) lines.push('Not playing');
    } else if (type === 'goals' || type === 'todos' || type === 'habits' || type === 'priorities' || type === 'study' || type === 'homework') {
      var items = el.querySelectorAll('.w-item-text');
      items.forEach(function(it) { var t = it.textContent.trim().replace(/\s+/g,' '); if (t) lines.push(t); });
    } else if (type === 'notes') {
      var nt = el.querySelector('[contenteditable]');
      if (nt) { var nt2 = nt.textContent.trim().replace(/\s+/g,' '); if (nt2) lines.push(nt2.substring(0,80)); }
    } else if (type === 'links') {
      var lks = el.querySelectorAll('.w-item-text');
      lks.forEach(function(lk) { var t = lk.textContent.trim().replace(/\s+/g,' '); if (t) lines.push(t); });
    } else if (type === 'quote') {
      var q = el.querySelector('[class*="text"], [contenteditable]');
      if (q) lines.push(q.textContent.trim().replace(/\s+/g,' ').substring(0,80));
    } else if (type === 'calendar') {
      var calTxt = el.textContent.trim().replace(/\s+/g,' ').substring(0,60);
      if (calTxt) lines.push(calTxt);
    } else if (type === 'progress') {
      var pr = el.querySelector('[class*="pct"], [class*="num"]');
      if (pr) lines.push(pr.textContent.trim().replace(/\s+/g,' '));
    } else if (type === 'sleep-score') {
      var rv = el.querySelector('.ss-ring-val');
      var sn = el.querySelector('.ss-score-note');
      if (rv) lines.push('Score: ' + rv.textContent.trim().replace(/\s+/g,' '));
      if (sn) lines.push(sn.textContent.trim().replace(/\s+/g,' '));
    } else if (type === 'headlines') {
      var hlTitles = el.querySelectorAll('.hl-item-title');
      hlTitles.forEach(function(ht) { var txt = ht.textContent.trim().replace(/\s+/g,' '); if (txt) lines.push(txt); });
      if (!lines.length) lines.push('No headlines');
    } else if (type === 'strava' || type === 'flightradar') {
      lines.push('Embedded content');
    } else if (type === 'images') {
      lines.push('Image widget');
    }
  } catch(e) {}
  return { title: title, lines: lines.slice(0,4) };
}

var _snapshotColors = {
  goals:'#bdbdbd', priorities:'#b0b0b0', todos:'#a3a3a3', habits:'#979797',
  progress:'#8a8a8a', clock:'#bdbdbd', weather:'#b0b0b0', calendar:'#a3a3a3',timer:'#979797', pomodoro:'#8a8a8a', spotify:'#c7c7c7', strava:'#9a9a9a',
      flightradar:'#8d8d8d', 'sleep-score':'#b5b5b5', quote:'#a8a8a8', notes:'#9c9c9c', headlines:'#ababab',
       links:'#909090', images:'#c2c2c2', crypto:'#f7931a', homework:'#9a9a9a', study:'#8e44ad'
};

window.captureHubSnapshot = function() {
  var layout = [];
  try { layout = JSON.parse(JSON.stringify(state && state.hubLayout ? state.hubLayout : [])); } catch(e) {}
  if (!layout || !layout.length) { if (typeof showToast === 'function') showToast('No bubbles to capture', 'error', 1500); return; }

  var grid = document.getElementById('bentoGrid');
  var MARGIN = 20, PAD = 24, HEADER_H = 60, CORNER = 12;
  var minX = Infinity, minY = Infinity, maxR = 0, maxB = 0;
  layout.forEach(function(it) {
    if (it.x < minX) minX = it.x; if (it.y < minY) minY = it.y;
    var r = it.x + it.w, b = it.y + it.h;
    if (r > maxR) maxR = r; if (b > maxB) maxB = b;
  });
  if (minX === Infinity) { minX = 0; minY = 0; }
  var innerW = maxR - minX + MARGIN * 2;
  var innerH = HEADER_H + (maxB - minY) + MARGIN * 2;
  var outerW = innerW + PAD * 2;
  var outerH = innerH + PAD * 2;

  var isDark = document.documentElement.classList.contains('dark') ||
    (!document.documentElement.classList.contains('light') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  var bg1 = isDark ? '#0a0a0a' : '#f9f8f4';
  var bg2 = isDark ? '#111111' : '#f0ece6';
  var text1 = isDark ? '#e5e2e1' : '#1c1b1b';
  var text2 = isDark ? '#8c928d' : '#7a7670';
  var text3 = isDark ? '#6b6b6b' : '#a09c96';
  var border = isDark ? '#2a2a2a' : '#d7d2ca';
  var borderLight = isDark ? '#1a1a1a' : '#e2ddd6';
  var accent = isDark ? '#ffffff' : '#1c1b1b';

  var scale = 2, c = document.createElement('canvas');
  c.width = outerW * scale; c.height = outerH * scale;
  var ctx = c.getContext('2d');
  ctx.scale(scale, scale);

  ctx.shadowColor = 'rgba(0,0,0,' + (isDark ? '0.5' : '0.12') + ')';
  ctx.shadowBlur = 40; ctx.shadowOffsetY = 8;
  ctx.beginPath(); _roundedRect(ctx, PAD, PAD, innerW, innerH, CORNER);
  ctx.fillStyle = bg1; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.save();
  ctx.beginPath(); _roundedRect(ctx, PAD, PAD, innerW, innerH, CORNER); ctx.clip();

  var ox = PAD, oy = PAD;

  var hdrGrad = ctx.createLinearGradient(0, oy, 0, oy + HEADER_H);
  hdrGrad.addColorStop(0, isDark ? '#111111' : '#ffffff');
  hdrGrad.addColorStop(1, isDark ? '#0a0a0a' : '#f5f2ed');
  ctx.fillStyle = hdrGrad; ctx.fillRect(ox, oy, innerW, HEADER_H);
  ctx.fillStyle = border; ctx.fillRect(ox, oy + HEADER_H - 1, innerW, 1);

  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = text1; ctx.fillText('Hav\u00ebn Hub', ox + 16, oy + HEADER_H / 2 - 9);
  ctx.font = '400 10px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = text2;
  var now = new Date(); var dateStr = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  ctx.fillText(dateStr, ox + 16, oy + HEADER_H / 2 + 11);

  ctx.textAlign = 'right';
  var cnt = layout.length; ctx.font = '600 12px sans-serif';
  ctx.fillStyle = text2; ctx.fillText(cnt + ' widget' + (cnt !== 1 ? 's' : ''), ox + innerW - 16, oy + HEADER_H / 2 + 2);

  ctx.textAlign = 'left';
  layout.forEach(function(item) {
    var bx = ox + MARGIN + (item.x - minX), by = oy + HEADER_H + MARGIN + (item.y - minY);
    var bw = item.w, bh = item.h;
    var col = _snapshotColors[item.t] || accent;
    var prev = _snapshotBubblePreview(grid ? grid.querySelector('[data-bubble="' + item.uid + '"]') : null, item.t);

    ctx.fillStyle = isDark ? '#161616' : '#ffffff';
    ctx.beginPath(); _roundedRect(ctx, bx, by, bw, bh, 8); ctx.fill();
    ctx.strokeStyle = borderLight; ctx.lineWidth = 1;
    ctx.beginPath(); _roundedRect(ctx, bx, by, bw, bh, 8); ctx.stroke();

    var stripH = 26;
    ctx.fillStyle = col;
    ctx.beginPath(); _roundedRect(ctx, bx, by, bw, stripH, [8,8,0,0]); ctx.fill();
    ctx.textBaseline = 'middle';
    ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#fff'; ctx.fillText(prev.title, bx + 10, by + stripH / 2);

    ctx.fillStyle = text1;
    ctx.font = '400 9px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    var lineY = by + stripH + 8;
    var maxLines = Math.max(0, Math.floor((bh - stripH - 8) / 15));
    prev.lines.slice(0, maxLines).forEach(function(line) {
      var tw = ctx.measureText(line).width;
      if (tw > bw - 16) {
        while (line.length > 1 && ctx.measureText(line + '\u2026').width > bw - 16) line = line.slice(0, -1);
        line += '\u2026';
      }
      ctx.fillStyle = text1; ctx.fillText(line, bx + 10, lineY + 7);
      lineY += 15;
    });
  });

  ctx.restore();
  var blob = null;
  try {
    c.toBlob(function(b) {
      blob = b;
      if (!blob) { if (typeof showToast === 'function') showToast('Failed to capture snapshot', 'error', 2000); return; }
      var file = new File([blob], 'haven-hub-snapshot.png', { type: 'image/png' });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Hav\u00ebn Hub' }).catch(function(){});
      } else {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = 'haven-hub-snapshot.png';
        document.body.appendChild(a); a.click();
        setTimeout(function() { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 1000);
      }
    }, 'image/png');
  } catch(e) { if (typeof showToast === 'function') showToast('Snapshot failed', 'error', 2000); }
};

/* ─── Auto-save canvas on page unload ─────────── */
(function initCanvasAutoSave() {
  window.addEventListener('beforeunload', function() {
    if (typeof HAVEN_UNLOAD_BLOCKED !== 'undefined' && HAVEN_UNLOAD_BLOCKED) return;
    if (typeof saveHubContent === 'function') {
      try { saveHubContent(); } catch(e) {}
    }
  });
})();

/* ─── Spotify sidebar sync ──────────────────── */
(function initSpotifySync() {
  var _origNav = window.spSideNav;
  if (typeof _origNav === 'function') {
    window.spSideNav = function(dir) {
      _origNav(dir);
      _updateSpotifyBubbles();
    };
  }
  // Also patch spAddPlaylist / spRemovePlaylist
  var _origAdd = window.spAddPlaylist;
  if (typeof _origAdd === 'function') {
    window.spAddPlaylist = function() {
      _origAdd();
      _updateSpotifyBubbles();
    };
  }
  var _origDel = window.spDeletePlaylist;
  if (typeof _origDel === 'function') {
    window.spDeletePlaylist = function(id) {
      _origDel(id);
      _updateSpotifyBubbles();
    };
  }
  var _origPlay = window.spPlayPlaylist;
  if (typeof _origPlay === 'function') {
    window.spPlayPlaylist = function(id) {
      _origPlay(id);
      _updateSpotifyBubbles();
    };
  }
  function _updateSpotifyBubbles() {
    var _id = null, _playlists = [];
    try { _id = localStorage.getItem('haven-spotify-active') || null; } catch(e) {}
    try { _playlists = JSON.parse(localStorage.getItem('haven-spotify-playlists') || '[]'); } catch(e) {}
    if (!Array.isArray(_playlists)) _playlists = [];
    if (typeof spCleanId === 'function') {
      _id = spCleanId(_id);
      _playlists = _playlists.filter(function(p) { return p && spCleanId(p.id); });
      _playlists.forEach(function(p) { p.id = spCleanId(p.id); });
    }
    if (_id && _playlists.length && !_playlists.some(function(p) { return p.id === _id; })) _id = _playlists[0].id;
    var _active = _playlists.find(function(p) { return p.id === _id; });
    document.querySelectorAll('.spotify-widget').forEach(function(w) {
      var ifr = w.querySelector('iframe');
      var header = w.querySelector('.spotify-header span');
      if (ifr && _active) {
        var _targetSrc = 'https://open.spotify.com/embed/playlist/' + _active.id + '?utm_source=generator';
        if (ifr.src !== _targetSrc) ifr.src = _targetSrc;
        if (header) header.textContent = _active.name;
      } else if (w.classList.contains('spotify-empty') && _active) {
        // Had empty state, now has playlist — re-render to get the iframe
        renderHubBento();
      } else if (ifr && !_active) {
        // Had playlist, now empty — re-render to show empty state
        renderHubBento();
      }
    });
  }
  window._updateSpotifyBubbles = _updateSpotifyBubbles;
})();

/* ─── Patch updateSectionHandles ────────────── */
const _origUpdateHandles = typeof updateSectionHandles === 'function' ? updateSectionHandles : function() {};
updateSectionHandles = function() {
  if (typeof _origUpdateHandles === 'function') _origUpdateHandles();
  if (hubEditMode) {
    document.querySelectorAll('.hub-section-header').forEach(h => h.classList.add('visible'));
    document.querySelectorAll('.hub-section-drag-handle').forEach(h => h.classList.add('hub-section-drag-handle-visible'));
  }
};

// ─── Hub Plus Bubble ──────────────────────────────────────
(function initHubPlusBubble() {
  var KEY = 'haven-plus-bubble-hub';
  var DEFAULTS = [
    { id: 'add-widget', label: 'Add Widget', icon: '+', color: 'var(--accent)' },
    { id: 'guide', label: 'Show Guide', icon: '?', color: 'var(--text-primary)' },
    { id: 'edit', label: 'Toggle Edit', icon: '✎', color: 'var(--text-primary)' },
    { id: 'today', label: 'Today Overview', icon: '◎', color: 'var(--text-primary)' },
  ];

  function loadCfg() {
    try { return JSON.parse(localStorage.getItem(KEY)) || DEFAULTS; }
    catch { return DEFAULTS; }
  }
  function saveCfg(cfg) { localStorage.setItem(KEY, JSON.stringify(cfg)); }

  function renderPopup() {
    var list = document.getElementById('menuPlusList');
    if (!list) return;
    var cfg = loadCfg();
    list.innerHTML = '';
    cfg.forEach(function(a) {
      if (a.visible === false) return;
      var btn = document.createElement('button');
      btn.className = 'plus-action-item';
      btn.innerHTML = '<span style="width:18px;text-align:center;flex-shrink:0;color:' + (a.color || 'var(--text-primary)') + '">' + a.icon + '</span>' + a.label;
      btn.addEventListener('click', function() { closeHubMenu(); handleAction(a.id); });
      list.appendChild(btn);
    });
  }

  function renderEditMode() {
    var list = document.getElementById('menuPlusList');
    if (!list) return;
    var cfg = loadCfg();
    list.innerHTML = '';
    cfg.forEach(function(a, i) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 8px;border-radius:6px;margin-bottom:2px';
      row.innerHTML =
        '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1;font-size:0.8rem">' +
          '<input type="checkbox" data-plus-idx="' + i + '" ' + (a.visible !== false ? 'checked' : '') + ' style="margin:0">' +
          '<span>' + a.label + '</span>' +
        '</label>';
      row.querySelector('input')?.addEventListener('change', function() {
        var idx = parseInt(this.dataset.plusIdx);
        var c = loadCfg();
        c[idx].visible = this.checked;
        saveCfg(c);
      });
      list.appendChild(row);
    });
  }

  function handleAction(id) {
    switch (id) {
      case 'add-widget':
        var fabAdd = document.getElementById('hubFabCustomize');
        if (fabAdd) fabAdd.click();
        break;
      case 'guide':
        if (typeof showCanvasGuide === 'function') showCanvasGuide();
        break;
      case 'edit':
        var fabEdit = document.getElementById('hubFabCustomize');
        if (fabEdit) fabEdit.click();
        break;
      case 'today':
        var todaySec = document.querySelector('[data-hub-section="today"]');
        if (todaySec) todaySec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
    }
  }

  var menuPlus = document.getElementById('menuPlus');
  var menuPlusPopup = document.getElementById('menuPlusPopup');
  var plusEditing = false;
  if (menuPlus && menuPlusPopup) {
    menuPlus.addEventListener('click', function(e) {
      e.stopPropagation();
      plusEditing = false;
      var clbl = document.getElementById('menuPlusCustLabel');
      if (clbl) clbl.textContent = 'Customize';
      var cust = document.getElementById('menuPlusCustomize');
      if (cust) cust.style.opacity = '0.6';
      renderPopup();
      menuPlusPopup.classList.toggle('hidden');
    });
    document.getElementById('menuPlusCustomize')?.addEventListener('click', function(e) {
      e.stopPropagation();
      plusEditing = !plusEditing;
      var lbl = document.getElementById('menuPlusCustLabel');
      if (plusEditing) {
        if (lbl) lbl.textContent = 'Done';
        this.style.opacity = '1';
        renderEditMode();
      } else {
        if (lbl) lbl.textContent = 'Customize';
        this.style.opacity = '0.6';
        renderPopup();
      }
    });
    document.addEventListener('click', function(e) {
      if (!menuPlus.contains(e.target) && !menuPlusPopup.contains(e.target)) {
        menuPlusPopup.classList.add('hidden');
        plusEditing = false;
        var clbl = document.getElementById('menuPlusCustLabel');
        if (clbl) clbl.textContent = 'Customize';
        var cust = document.getElementById('menuPlusCustomize');
        if (cust) cust.style.opacity = '0.6';
      }
    });
  }
})();
