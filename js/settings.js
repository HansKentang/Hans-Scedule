/* ============================================
   Havën Schedule — Settings Manager
   JSON-based settings serialization & import
   ============================================ */

// ─── SETTINGS KEYS ─────────────────────────────────────────
const SETTINGS_EXPORT_KEYS = [
  'haven-schedule-settings',
  'haven-schedule-apikey',
  'haven-schedule-model',
  'haven-schedule-provider',
  'haven-card-colors',
  'haven-custom-tags',
  'haven-language',
  'haven-week-start',
  'haven-time-format',
  'haven-schedule-focus',
  'haven-subcategories',
  'haven-schedule-categories',
  'haven-hub-content',
  'haven-schedule-hub-layout',
  'haven-hub-visibility',
  'haven-schedule-routine',
  'haven-schedule-profile',
  'haven-chickbot-profile',
  'haven-ai-extra-instructions',
  'haven-schedule-ai-usage',
  'haven-schedule-sleep-targets',
  'haven-schedule-pomodoro',
];

// ─── SERIALIZE ─────────────────────────────────────────────
function serializeSettings() {
  var data = {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: {},
  };

  for (var i = 0; i < SETTINGS_EXPORT_KEYS.length; i++) {
    var key = SETTINGS_EXPORT_KEYS[i];
    try {
      var val = localStorage.getItem(key);
      if (val !== null) {
        // Try to parse as JSON for a cleaner object; fall back to raw string
        try { data.settings[key] = JSON.parse(val); }
        catch (e) { data.settings[key] = val; }
      }
    } catch (e) { /* skip inaccessible keys */ }
  }

  return JSON.stringify(data, null, 2);
}

// ─── PARSE / IMPORT ────────────────────────────────────────
function parseSettings(jsonStr) {
  var data;
  try {
    data = JSON.parse(jsonStr);
  } catch (e) {
    return { success: false, error: 'Invalid JSON: ' + e.message };
  }

  if (!data || !data.version) {
    return { success: false, error: 'Invalid settings file: missing version field.' };
  }

  if (!data.settings || typeof data.settings !== 'object') {
    return { success: false, error: 'Invalid settings file: missing settings object.' };
  }

  var applied = 0;
  var skipped = 0;
  var errors = [];

  for (var key in data.settings) {
    if (SETTINGS_EXPORT_KEYS.indexOf(key) === -1) {
      skipped++;
      continue;
    }
    try {
      var val = data.settings[key];
      var strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
      localStorage.setItem(key, strVal);
      applied++;
    } catch (e) {
      errors.push(key + ': ' + e.message);
      skipped++;
    }
  }

  // Apply critical settings to the running state if available
  if (typeof state !== 'undefined') {
    try {
      var settingsRaw = localStorage.getItem('haven-schedule-settings');
      if (settingsRaw) {
        var parsed = JSON.parse(settingsRaw);
        if (parsed.accentColor !== undefined) state.accentColor = parsed.accentColor;
        if (parsed.darkMode !== undefined) state.darkMode = parsed.darkMode;
        if (parsed.accentCustomColors) state.accentCustomColors = parsed.accentCustomColors;
        if (parsed.accentRemovedPresets) state.accentRemovedPresets = parsed.accentRemovedPresets;
      }
    } catch (e) { /* ignore */ }

    try {
      var apiKey = localStorage.getItem('haven-schedule-apikey');
      if (apiKey !== null) state.apiKey = apiKey;
      var model = localStorage.getItem('haven-schedule-model');
      if (model !== null) state.apiModel = model;
      var provider = localStorage.getItem('haven-schedule-provider');
      if (provider !== null) state.apiProvider = provider;
    } catch (e) { /* ignore */ }
  }

  // Re-apply appearance
  if (typeof applyTheme === 'function') applyTheme();
  if (typeof applyAccentColor === 'function') applyAccentColor();
  if (typeof loadCardColors === 'function') loadCardColors();
  if (typeof applyLanguage === 'function') applyLanguage();

  return {
    success: true,
    applied: applied,
    skipped: skipped,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// ─── EXPORT UI (download file) ─────────────────────────────
function exportAllData() {
  var json = serializeSettings();
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'haven-settings-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (typeof showToast === 'function') showToast('Settings exported', 'success', 2000);
}

// ─── IMPORT UI (file picker) ───────────────────────────────
function importAllData(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function (ev) {
    var result = parseSettings(ev.target.result);
    if (result.success) {
      var msg = 'Settings imported: ' + result.applied + ' keys applied';
      if (result.skipped > 0) msg += ', ' + result.skipped + ' skipped';
      if (typeof showToast === 'function') showToast(msg, 'success', 4000);
      // Reload to fully apply all settings
      setTimeout(function () { location.reload(); }, 1500);
    } else {
      if (typeof showToast === 'function') showToast('Import failed: ' + result.error, 'error', 5000);
    }
  };
  reader.readAsText(file);
}

// ─── EXPOSE ────────────────────────────────────────────────
window.serializeSettings = serializeSettings;
window.parseSettings = parseSettings;
window.exportAllData = exportAllData;
window.importAllData = importAllData;
