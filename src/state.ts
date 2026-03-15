// Sections 2-3: Default State Factory + State & Settings
import { CALENDAR_SYSTEMS, CONFIG_DEFAULTS, CONFIG_MONTH_LENGTHS, CONFIG_START_DATE } from './config.js';
import { CALENDAR_STRUCTURE_SETS, COLOR_THEMES, DEFAULT_EVENTS, DEFAULT_EVENT_SOURCE_CALENDARS, SEASON_SETS, script_name, state_name } from './constants.js';
import { colorsAPI, resolveColor } from './color.js';
import { _invalidateSerialCache } from './date-math.js';
import { DaySpec, Parse } from './parsing.js';
import { compareEvents, currentDefaultKeySet, defaultKeyFor, mergeInNewDefaultEvents } from './events.js';
import { clamp } from './rendering.js';
import { _defaultDetailsForKey, _getSeasonLabel, _weatherViewDays, sendCurrentDate } from './ui.js';


/* ============================================================================
 * 2) DEFAULT STATE FACTORY
 * ==========================================================================*/

export function _flattenSources(map){
  var out = [];
  Object.keys(map).forEach(function(src){
    (map[src]||[]).forEach(function(e){
      out.push({
        name: String(e.name||''),
        month: e.month,
        day: e.day,
        color: e.color,
        source: src
      });
    });
  });
  return out;
}

export function _sourceAllowedForCalendar(sourceKey, calendarSystem){
  var src = String(sourceKey || '').toLowerCase();
  var sys = String(calendarSystem || '').toLowerCase();
  var allow = DEFAULT_EVENT_SOURCE_CALENDARS[src];
  if (!allow || !allow.length) return true;
  for (var i = 0; i < allow.length; i++){
    if (String(allow[i] || '').toLowerCase() === sys) return true;
  }
  return false;
}

export var defaults = {
  current: {
    month:              CONFIG_START_DATE.month,
    day_of_the_month:   CONFIG_START_DATE.day_of_the_month,
    day_of_the_week:    CONFIG_START_DATE.day_of_the_week,
    year:               CONFIG_START_DATE.year
  },
  months: CONFIG_MONTH_LENGTHS.slice(),
  events: _flattenSources(DEFAULT_EVENTS)
};

/* ============================================================================
 * 3) STATE & SETTINGS
 * ==========================================================================*/

export function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

export function ensureSettings(){
  var root = state[state_name];
  if (!root.settings){
    root.settings = {
      calendarSystem:      CONFIG_DEFAULTS.calendarSystem,
      calendarVariant:     CONFIG_DEFAULTS.calendarVariant,
      seasonVariant:       CONFIG_DEFAULTS.seasonVariant,
      colorTheme:          CONFIG_DEFAULTS.colorTheme,
      groupEventsBySource: false,
      showSourceLabels:    false,
      uiDensity:           CONFIG_DEFAULTS.uiDensity,
      autoButtons:         CONFIG_DEFAULTS.autoButtons,
      eventsEnabled:       CONFIG_DEFAULTS.eventsEnabled,
      moonDisplayMode:     CONFIG_DEFAULTS.moonDisplayMode,
      weatherDisplayMode:  CONFIG_DEFAULTS.weatherDisplayMode,
      planesDisplayMode:   CONFIG_DEFAULTS.planesDisplayMode,
      subsystemVerbosity:  CONFIG_DEFAULTS.subsystemVerbosity,
      weatherForecastViewDays: CONFIG_DEFAULTS.weatherForecastViewDays,
      eventSourcePriority: []
    };
  }
  var s = root.settings;
  // Migration: old format used monthSet/weekdaySet/etc. Convert to new system.
  if (!s.calendarSystem && (s.monthSet || s.weekdaySet)){
    var oldSet = (s.monthSet || '').toLowerCase();
    var sysMap = { druidic:'eberron', halfling:'eberron', dwarven:'eberron',
                   faerunian:'faerunian', gregorian:'gregorian' };
    var varMap = { druidic:'druidic', halfling:'halfling', dwarven:'dwarven',
                   faerunian:'standard', gregorian:'standard' };
    s.calendarSystem  = sysMap[oldSet]  || 'eberron';
    s.calendarVariant = varMap[oldSet]  || 'standard';
    s.seasonVariant   = s.seasonSet || CONFIG_DEFAULTS.seasonVariant;
    if (!s.colorTheme) s.colorTheme = null;
    // Remove old fields to avoid confusion.
    delete s.monthSet; delete s.weekdaySet; delete s.seasonSet;
    delete s.monthLengthSet; delete s.structureSet;
  }
  // Migrate renamed season variants.
  var _svMig = s.seasonVariant;
  if (_svMig === 'northern'){
    s.seasonVariant = (s.calendarSystem === 'gregorian') ? 'gregorian'
                    : (s.calendarSystem === 'faerunian') ? 'faerun'
                    : 'eberron';
  } else if (_svMig === 'southern'){
    s.seasonVariant = (s.calendarSystem === 'gregorian') ? 'gregorian' : 'faerun';
    s.hemisphere = 'south';
  } else if (_svMig === 'tropic' || _svMig === 'tropical_monsoon'){
    s.seasonVariant = 'tropical';
  }
  // Backfill for any missing fields.
  if (!s.calendarSystem)      s.calendarSystem      = CONFIG_DEFAULTS.calendarSystem;
  if (!s.calendarVariant)     s.calendarVariant     = CONFIG_DEFAULTS.calendarVariant;
  if (!s.seasonVariant)       s.seasonVariant       = CONFIG_DEFAULTS.seasonVariant;
  if (!s.hemisphere)          s.hemisphere          = CONFIG_DEFAULTS.hemisphere;
  if (!s.eventSourcePriority) s.eventSourcePriority = [];
  if (s.uiDensity !== 'compact' && s.uiDensity !== 'normal') s.uiDensity = CONFIG_DEFAULTS.uiDensity;
  if (s.autoButtons   === undefined) s.autoButtons   = CONFIG_DEFAULTS.autoButtons;
  if (s.eventsEnabled  === undefined) s.eventsEnabled  = CONFIG_DEFAULTS.eventsEnabled;
  if (s.moonsEnabled   === undefined) s.moonsEnabled   = CONFIG_DEFAULTS.moonsEnabled;
  if (s.weatherEnabled === undefined) s.weatherEnabled = CONFIG_DEFAULTS.weatherEnabled;
  if (s.weatherMechanicsEnabled === undefined) s.weatherMechanicsEnabled = CONFIG_DEFAULTS.weatherMechanicsEnabled;
  if (s.planesEnabled  === undefined) s.planesEnabled  = CONFIG_DEFAULTS.planesEnabled;
  if (s.offCyclePlanes === undefined) s.offCyclePlanes = CONFIG_DEFAULTS.offCyclePlanes;

  // Auto-toggle: Eberron-specific subsystems default to on for Galifar,
  // off for non-Eberron calendars. The GM can always override manually.
  // Only apply auto-toggle when the setting has never been explicitly touched.
  if (s._planesAutoToggle !== false){
    var isEberronCal = (s.calendarSystem === 'eberron');
    if (s.planesEnabled === undefined || s._planesAutoToggle === undefined){
      s.planesEnabled = isEberronCal;
      s._planesAutoToggle = true; // mark as auto-set so manual overrides stick
    }
  }
  if (s._moonsAutoToggle !== false){
    var isEberronCal2 = (s.calendarSystem === 'eberron');
    if (s.moonsEnabled === undefined || s._moonsAutoToggle === undefined){
      s.moonsEnabled = isEberronCal2;
      s._moonsAutoToggle = true;
    }
  }
  if (!/^(calendar|list|both)$/.test(String(s.moonDisplayMode || '').toLowerCase()))
    s.moonDisplayMode = CONFIG_DEFAULTS.moonDisplayMode;
  if (!/^(calendar|list|both)$/.test(String(s.weatherDisplayMode || '').toLowerCase()))
    s.weatherDisplayMode = CONFIG_DEFAULTS.weatherDisplayMode;
  if (!/^(calendar|list|both)$/.test(String(s.planesDisplayMode || '').toLowerCase()))
    s.planesDisplayMode = CONFIG_DEFAULTS.planesDisplayMode;
  s.subsystemVerbosity = String(s.subsystemVerbosity || CONFIG_DEFAULTS.subsystemVerbosity).toLowerCase();
  if (s.subsystemVerbosity !== 'minimal' && s.subsystemVerbosity !== 'normal')
    s.subsystemVerbosity = CONFIG_DEFAULTS.subsystemVerbosity;
  s.weatherForecastViewDays = _weatherViewDays(s.weatherForecastViewDays);
  return s;
}

export function getCal(){ return state[state_name].calendar; }

export function titleCase(s){
  return String(s||'')
    .split(/\s+/).map(function(w){ return w ? w.charAt(0).toUpperCase() + w.slice(1) : w; })
    .join(' ');
}

export function weekLength(){
  var cal = getCal();
  var n = (cal && cal.weekdays && cal.weekdays.length) | 0;
  return n > 0 ? n : 7;
}

export function colorForMonth(mi){
  var st  = ensureSettings();
  var cal = getCal();
  var pal = COLOR_THEMES[effectiveColorTheme()];

  // For intercalary months, find the nearest preceding regular month for theming.
  // This keeps festival days visually anchored to their adjacent month.
  var themeIdx = mi;
  if (cal.months[mi] && cal.months[mi].isIntercalary){
    for (var k = mi - 1; k >= 0; k--){
      if (!cal.months[k].isIntercalary){ themeIdx = k; break; }
    }
  }
  // Use regularIndex to look up the theme color so themes stay consistent
  // regardless of how many intercalary slots exist before this month.
  var m = cal.months[themeIdx];
  var palIdx = (m && typeof m.regularIndex === 'number') ? m.regularIndex : themeIdx;
  var themeCol = pal && pal[palIdx] ? pal[palIdx] : null;
  var monthCol = (cal.months[mi] && cal.months[mi].color) || null;
  return resolveColor(themeCol || monthCol) || '#EEE';
}

// Rebuild the months array from a CALENDAR_STRUCTURE_SETS template,
// populating regular slots with names/lengths from current settings.
// Intercalary slots keep their own names and days.
// Internal helpers — called by applyCalendarSystem and the seasons command.
// These operate directly on cal.months and cal.weekdays.

export function _seasonNames(setName){
  // Returns the names array for a season set key, or null if not found.
  var entry = SEASON_SETS[String(setName||'').toLowerCase()];
  if (!entry) return null;
  return Array.isArray(entry) ? entry : (entry.names || null);
}

export function applySeasonSet(setName){
  var cal   = getCal();
  var entry = SEASON_SETS[String(setName||'').toLowerCase()];
  if (!entry) return false;
  var names = Array.isArray(entry) ? entry : (entry.names || null);
  if (!names) return false;
  var regular = cal.months.filter(function(m){ return !m.isIntercalary; });
  if (names.length !== regular.length) return false;

  // Hemisphere-aware sets (faerun) shift season names by 6 for southern campaigns.
  // Transition-based sets (gregorian) don't need name shifting — _getSeasonLabel
  // picks the right transition array at display time.
  var hem = ensureSettings().hemisphere || CONFIG_DEFAULTS.hemisphere;
  var shift = (entry.hemisphereAware && !entry.transitions && hem === 'south') ? 6 : 0;

  var ri = 0;
  for (var i = 0; i < cal.months.length; i++){
    if (!cal.months[i].isIntercalary){
      cal.months[i].season = names[(ri + shift) % names.length];
      ri++;
    } else if (i > 0){
      cal.months[i].season = cal.months[i-1].season || null;
    }
  }
  return true;
}

export function applyStructureSet(setName){
  if (!setName) return false;
  var template = CALENDAR_STRUCTURE_SETS[String(setName).toLowerCase()];
  if (!template) return false;
  var cal = getCal();
  var st = ensureSettings();
  // Build a baseline lengths array for regular months.
  var sys2 = CALENDAR_SYSTEMS[st.calendarSystem] || {};
  var lengthSet = sys2.monthDays ? sys2.monthDays.slice() : CONFIG_MONTH_LENGTHS.slice();
  // Collect existing regular month names so we can re-apply names after rebuild.
  // (The name set will be re-applied afterward via applyMonthSet.)
  cal.months = template.map(function(slot){
    if (slot.isIntercalary){
      return { name: slot.name, days: slot.days|0, isIntercalary: true,
               leapEvery: slot.leapEvery || null, season: null };
    }
    var ri = slot.regularIndex|0;
    return { name: '', days: (ri < lengthSet.length ? lengthSet[ri] : 28),
             regularIndex: ri, season: null };
  });
  _invalidateSerialCache();
  return true;
}

// Suppress or restore a named default event source without going through the
// !cal source command. Used by applyCalendarSystem for calendar-paired sources.
export function _autoToggleCalendarSource(sourceKey, enable){
  var root = state[state_name];
  if (!root.suppressedSources) root.suppressedSources = {};
  var suppressedSources = root.suppressedSources;
  var sup = root.suppressedDefaults || (root.suppressedDefaults = {});

  if (enable){
    delete suppressedSources[sourceKey];
    // Lift per-event suppression keys belonging to this source.
    Object.keys(sup).forEach(function(k){
      var info = _defaultDetailsForKey(k);
      if (info && String(info.source||'').toLowerCase() === sourceKey) delete sup[k];
    });
    mergeInNewDefaultEvents(getCal());
  } else {
    suppressedSources[sourceKey] = 1;
    var cal = getCal(), defaultsSet = currentDefaultKeySet(cal);
    cal.events = cal.events.filter(function(e){
      var src = (e.source != null) ? String(e.source).toLowerCase() : null;
      if (src !== sourceKey) return true;
      var mobj = cal.months[e.month - 1];
      var maxD = mobj ? (mobj.days|0) : 28;
      var norm = DaySpec.canonicalForKey(e.day, maxD);
      var k    = defaultKeyFor(e.month, norm, e.name);
      return !defaultsSet[k];
    });
  }
}

// Apply a complete calendar system (and variant) in one call.
// This is the single public entry point for switching calendars.
// Season and color-theme can be overridden afterward by the user.
export function applyCalendarSystem(sysKey, varKey?){
  var sys = CALENDAR_SYSTEMS[String(sysKey||'').toLowerCase()];
  if (!sys) return false;

  var vk = String(varKey || sys.defaultVariant || 'standard').toLowerCase();
  var variant = sys.variants && sys.variants[vk];
  if (!variant){
    // Fall back to the first variant if the requested one doesn't exist.
    var first = sys.variants && Object.keys(sys.variants)[0];
    variant = first ? sys.variants[first] : null;
    vk = first || 'standard';
  }
  if (!variant) return false;

  var st = ensureSettings();
  var cal = getCal();

  // --- Structure (intercalary days) -----------------------------------------
  if (sys.structure){
    st.structureSet = sys.structure;
    applyStructureSet(sys.structure);
  } else {
    st.structureSet = null;
    cal.months = sys.monthDays.map(function(d, i){ return { days: d, regularIndex: i }; });
  }

  // --- Month lengths ---------------------------------------------------------
  // Apply directly from system definition (no named set lookup needed).
  var ri = 0;
  for (var i = 0; i < cal.months.length; i++){
    var mo = cal.months[i];
    if (!mo.isIntercalary){
      var idx = (typeof mo.regularIndex === 'number') ? mo.regularIndex : ri;
      if (idx < sys.monthDays.length) mo.days = sys.monthDays[idx];
      ri++;
    }
  }

  // --- Month names ----------------------------------------------------------
  var names = variant.monthNames;
  ri = 0;
  for (var j = 0; j < cal.months.length; j++){
    if (!cal.months[j].isIntercalary) cal.months[j].name = names[ri++] || ('Month '+(ri));
  }

  // --- Weekdays -------------------------------------------------------------
  cal.weekdays = sys.weekdays.slice();

  // --- Seasons --------------------------------------------------------------
  // If the user has never explicitly set a season variant, or is switching to a new
  // calendar family, adopt the new calendar's default season set.
  var _prevSeason = st.seasonVariant;
  var _prevSys2   = st.calendarSystem || '';
  var _isNewSys   = _prevSys2 !== sysKey;
  if (!_prevSeason || _isNewSys){
    st.seasonVariant = sys.defaultSeason || CONFIG_DEFAULTS.seasonVariant;
  }
  var seasonKey = st.seasonVariant;
  applySeasonSet(seasonKey);

  // --- Color theme ----------------------------------------------------------
  // colorForMonth() calls effectiveColorTheme() which reads st.colorTheme
  // (manual override) or falls back to variant.colorTheme automatically.
  // Nothing to do here — just reset the colorsAPI cache so it recomputes.
  colorsAPI.reset();

  // Record in settings before event-source reconciliation.
  var _prevSys = st.calendarSystem || '';
  st.calendarSystem  = sysKey;
  st.calendarVariant = vk;

  // Auto-toggle Eberron-specific subsystems when switching calendar systems.
  // Only auto-toggle if the previous toggle was also automatic (not manual).
  var isEberron = (sysKey === 'eberron');
  if (st._planesAutoToggle !== false){
    st.planesEnabled = isEberron;
    st._planesAutoToggle = true;
  }
  if (st._moonsAutoToggle !== false){
    st.moonsEnabled = isEberron;
    st._moonsAutoToggle = true;
  }

  // Enforce source calendar scopes so calendar-specific defaults only appear
  // on their matching calendar systems.
  Object.keys(DEFAULT_EVENT_SOURCE_CALENDARS).forEach(function(srcKey){
    if (!_sourceAllowedForCalendar(srcKey, sysKey)){
      _autoToggleCalendarSource(srcKey, false);
    }
  });

  // Auto-suppress/restore calendar-paired event sources.
  // gregorian_seasons belongs to the Gregorian calendar; suppress it for other systems.
  var _paired  = { gregorian: 'gregorian_seasons' };
  // Restore sources for the calendar we're entering.
  if (_paired[sysKey] && sysKey !== _prevSys){
    _autoToggleCalendarSource(_paired[sysKey], true);
  }

  _invalidateSerialCache();
  return true;
}

// Returns the effective color theme key for the current calendar state.
// If the user has manually set a theme (st.colorTheme non-null), that wins.
// Otherwise falls back to the variant default.
export function effectiveColorTheme(){
  var st = ensureSettings();
  if (st.colorTheme && COLOR_THEMES[st.colorTheme]) return st.colorTheme;
  var sys = CALENDAR_SYSTEMS[st.calendarSystem];
  var variant = sys && sys.variants && sys.variants[st.calendarVariant];
  return (variant && variant.colorTheme) || 'lunar';
}

export function checkInstall(){
  if(!state[state_name]) state[state_name] = {};
  ensureSettings();

  if(!state[state_name].calendar ||
     !Array.isArray(state[state_name].calendar.weekdays) ||
     !Array.isArray(state[state_name].calendar.months)){
    state[state_name].calendar = deepClone(defaults);
  }

  if (!state[state_name].suppressedDefaults) state[state_name].suppressedDefaults = {};
  if (!state[state_name].suppressedSources)  state[state_name].suppressedSources  = {};

  var cal = state[state_name].calendar;

  if (!Array.isArray(cal.weekdays) || !cal.weekdays.length){
    var st = ensureSettings();
    var sys3 = CALENDAR_SYSTEMS[st.calendarSystem || CONFIG_DEFAULTS.calendarSystem] || CALENDAR_SYSTEMS.eberron;
    cal.weekdays = (sys3.weekdays || []).slice();
  }

  if (!cal.current) cal.current = deepClone(defaults.current);

  if(!Array.isArray(cal.events)){
    var lim = Math.max(1, cal.months.length);
    var out = [];
    deepClone(defaults.events).forEach(function(e){
      var monthsList;
      if (String(e.month).toLowerCase() === 'all') {
        monthsList = []; for (var i=1;i<=lim;i++) monthsList.push(i);
      } else {
        var m = clamp(parseInt(e.month,10)||1, 1, lim);
        monthsList = [m];
      }
      monthsList.forEach(function(m){
        out.push({
          name: String(e.name||''),
          month: m,
          day: e.day,
          year: null,
          color: resolveColor(e.color) || null,
          source: (e.source != null) ? String(e.source) : null
        });
      });
    });
    cal.events = out;
  } else {
    cal.events = cal.events.map(function(e){
      var lim = Math.max(1, cal.months.length);
      var m = clamp(parseInt(e.month,10)||1, 1, lim);
      var yr = (isFinite(parseInt(e.year,10)) ? (parseInt(e.year,10)|0) : null);
      return {
        name: String(e.name||''),
        month: m,
        day: e.day,
        year: yr,
        color: resolveColor(e.color) || null,
        source: (e.source != null) ? String(e.source) : null
      };
    });

    // backfill colors from defaults if missing
    var defColorByKey = {};
    var lim2 = Math.max(1, cal.months.length);
    defaults.events.forEach(function(de){
      var col = resolveColor(de.color) || null;
      if (String(de.month).toLowerCase() === 'all') {
        for (var i=1; i<=lim2; i++) defColorByKey[i + '|' + String(de.day)] = col;
      } else {
        var m = clamp(parseInt(de.month,10)||1, 1, lim2);
        defColorByKey[m + '|' + String(de.day)] = col;
      }
    });
    cal.events.forEach(function(e){
      if (!e.color){
        var key = e.month + '|' + String(e.day);
        var col = defColorByKey[key];
        if (col) e.color = col;
      }
    });
  }

  // normalize months (support numbers = days-only) and stamp regularIndex
  for (var i = 0; i < cal.months.length; i++){
    var m = cal.months[i];
    if (typeof m === 'number'){
      cal.months[i] = { days: (m|0) || 28 };
    } else {
      cal.months[i] = cal.months[i] || {};
      if (!cal.months[i].days) cal.months[i].days = 28;
    }
    // Backfill regularIndex for non-intercalary months so length sets work.
    if (!cal.months[i].isIntercalary && typeof cal.months[i].regularIndex !== 'number'){
      cal.months[i].regularIndex = i;
    }
  }

  // Apply the active calendar system (rebuilds months, weekdays, seasons, names).
  var s = ensureSettings();
  applyCalendarSystem(s.calendarSystem || CONFIG_DEFAULTS.calendarSystem,
                      s.calendarVariant || CONFIG_DEFAULTS.calendarVariant);

  mergeInNewDefaultEvents(cal);
  _invalidateSerialCache();

  // clamp current date within the month it landed on
  var mdays = cal.months[cal.current.month].days;
  if (cal.current.day_of_the_month > mdays){
    cal.current.day_of_the_month = mdays;
  }

  // ── CONFIG sanity checks ───────────────────────────────────────────
  // Warn if user-editable arrays have mismatched lengths.
  (function(){
    var warnings = [];
    var sys = CALENDAR_SYSTEMS[s.calendarSystem || CONFIG_DEFAULTS.calendarSystem];
    if (sys){
      var vk = s.calendarVariant || sys.defaultVariant || 'standard';
      var variant = sys.variants && sys.variants[vk];
      if (variant && variant.monthNames && sys.monthDays &&
          variant.monthNames.length !== sys.monthDays.length){
        warnings.push('Month names ('+variant.monthNames.length+') vs month days ('+sys.monthDays.length+') mismatch in calendar system "'+
          (s.calendarSystem||CONFIG_DEFAULTS.calendarSystem)+'" variant "'+vk+'".');
      }
    }
    if (CONFIG_MONTH_LENGTHS.length !== cal.months.length){
      warnings.push('CONFIG_MONTH_LENGTHS ('+CONFIG_MONTH_LENGTHS.length+') does not match active calendar month count ('+cal.months.length+').');
    }
    for (var w=0; w<warnings.length; w++){
      log('[Galifar Calendar] ⚠ CONFIG WARNING: '+warnings[w]);
    }
  }());
}

export function refreshCalendarState(silent){
  checkInstall();
  var cal = getCal();

  cal.events = (cal.events || []).map(function(e){
    var m = clamp(e.month, 1, cal.months.length);
    var ow = Parse.ordinalWeekday.fromSpec(e.day);
    var daySpec = ow
      ? String(e.day).toLowerCase().trim()
      : (DaySpec.normalize(e.day, cal.months[m-1].days) || String(DaySpec.first(e.day)));
    var yr = (e.year==null) ? null : (parseInt(e.year,10)|0);
    return {
      name: String(e.name||''),
      month: m,
      day: daySpec,
      year: yr,
      color: resolveColor(e.color) || null,
      source: (e.source != null) ? String(e.source) : null
    };
  });

  // deduplicate
  var seen = {};
  cal.events = cal.events.filter(function(e){
    var y = (e.year==null) ? 'ALL' : (e.year|0);
    var k = e.month+'|'+e.day+'|'+y+'|'+String(e.name||'').trim().toLowerCase();
    if (seen[k]) return false; seen[k]=true; return true;
  });

  cal.events.sort(compareEvents);

  if (!silent) sendChat(script_name, '/w gm Calendar state refreshed ('+cal.events.length+' events).');
}

export function refreshAndSend(){ refreshCalendarState(true); sendCurrentDate(null, true); }

export function resetToDefaults(){
  delete state[state_name];
  state[state_name] = { calendar: deepClone(defaults) };
  checkInstall();
  sendChat(script_name, '/w gm Calendar state wiped and reset to defaults.');
  sendCurrentDate(null, true);
}



