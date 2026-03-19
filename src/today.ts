// Today — Combined detail from all subsystems
import { CALENDAR_SYSTEMS, CONFIG_DEFAULTS, CONFIG_WEATHER_FORECAST_DAYS } from './config.js';
import { COLOR_THEMES, SEASON_SETS, STYLES, script_name, state_name } from './constants.js';
import { applyCalendarSystem, applySeasonSet, defaults, ensureSettings, getAutoSuppressedSources, getCal, getManualSuppressedSources, refreshAndSend, resetToDefaults, sourceSuppressionState, titleCase } from './state.js';
import { colorsAPI } from './color.js';
import { _invalidateSerialCache, _isLeapMonth, fromSerial, toSerial, todaySerial } from './date-math.js';
import { DaySpec, Parse } from './parsing.js';
import { _deliverTopLevelCalendarRange, buildCalendarsHtmlForSpec, currentDefaultKeySet, defaultKeyFor, eventDisplayName, mergeInNewDefaultEvents, occurrencesInRange } from './events.js';
import { button, clamp, esc, listAllEventsTableHtml, removeListHtml, removeMatchesListHtml, restoreDefaultEvents, suppressedDefaultsListHtml } from './rendering.js';
import { activateTimeOfDay, bucketLabel, clearTimeOfDay, currentTimeBucket, isTimeOfDayActive, nextTimeBucket, normalizeTimeBucketKey, TIME_OF_DAY_BUCKETS } from './time-of-day.js';
import { _activePlanarWeatherShiftLines, _defaultDetailsForKey, _displayMonthDayParts, _menuBox, _serialToDateSpec, _shiftSerialByMonth, _timeOfDayStatusHtml, _weatherInfluenceHtml, _weatherViewDays, activeEffectsPanelHtml, addEventSmart, addMonthlySmart, addYearlySmart, calendarSystemListHtml, currentDateLabel, currentTimeOfDayLabel, helpCalendarSystemMenu, helpEventColorsMenu, helpRootMenu, helpSeasonsMenu, helpThemesMenu, nextForDayOnly, removeEvent, seasonSetListHtml, sendCurrentDate, setDate, stepDays, taskCardHtml, themeListHtml } from './ui.js';
import { _normalizePackedWords, _playerTodayHtml, _showDefaultCalView, runEventsShortcut, send, whisper, whisperUi } from './commands.js';
import { WEATHER_DAY_PERIODS, WEATHER_PRIMARY_PERIOD, _conditionsMechHtml, _conditionsNarrative, _deriveConditions, _evaluateExtremeEvents, _forecastRecord, _weatherLocationLabel, _weatherPeriodIcon, _weatherPeriodLabel, _weatherPrimaryFog, _weatherPrimaryValues, _weatherRecordForDisplay, getWeatherState, handleWeatherCommand, weatherEnsureForecast } from './weather.js';
import { MOON_SYSTEMS, _eclipseNotableToday, _getMoonSys, _isFullMoonIllum, _isNewMoonIllum, _moonPhaseEmoji, _moonPhaseLabel, currentLightSnapshot, handleMoonCommand, moonEnsureSequences, moonPhaseAt, nighttimeLightHtml } from './moon.js';
import { _planarNotableToday, getPlanarState, _getAllPlaneData, handlePlanesCommand } from './planes.js';


// ── Today — Combined detail from all subsystems ────────────────────────
export function _todayWeatherIsStable(wxRec){
  if (!wxRec || !wxRec.periods) return true;
  var periods = WEATHER_DAY_PERIODS;
  var base = wxRec.periods[WEATHER_PRIMARY_PERIOD] || wxRec.final;
  if (!base) return true;
  for (var i = 0; i < periods.length; i++){
    var pv = wxRec.periods[periods[i]];
    if (!pv) continue;
    if (Math.abs((pv.temp||0) - (base.temp||0)) >= 2) return false;
    if (Math.abs((pv.wind||0) - (base.wind||0)) >= 2) return false;
    if (Math.abs((pv.precip||0) - (base.precip||0)) >= 2) return false;
  }
  return true;
}

function _timeOfDayMenuHtml(){
  var bucket = currentTimeBucket();
  if (!bucket){
    var startButtons = [];
    for (var i = 0; i < TIME_OF_DAY_BUCKETS.length; i++){
      startButtons.push(button(TIME_OF_DAY_BUCKETS[i].shortLabel, 'time start ' + TIME_OF_DAY_BUCKETS[i].key));
    }
    return _menuBox('Time of Day',
      '<div style="opacity:.8;margin-bottom:5px;">Time of day is inactive for this date.</div>' +
      '<div style="margin-bottom:4px;"><b>' + esc(currentDateLabel()) + '</b></div>' +
      '<div style="font-size:.82em;opacity:.7;margin-bottom:4px;">Choose a starting bucket:</div>' +
      startButtons.join(' ')
    );
  }

  return _menuBox('Time of Day',
    '<div style="font-weight:bold;">Current time: ' + esc(bucketLabel(bucket)) + '</div>' +
    '<div style="opacity:.75;margin-top:2px;">' + esc(currentDateLabel()) + '</div>' +
    '<div style="margin-top:6px;">' +
      button('Advance Time', 'time next') + ' ' +
      button('Clear Time', 'time clear') +
    '</div>'
  );
}

function _sendTimeOfDayStatus(who){
  whisperUi(who,
    '<div><b>Current time: ' + esc(currentTimeOfDayLabel()) + '</b><br>' +
    esc(currentDateLabel()) + '</div>'
  );
}

export function _todayAllHtml(){
  var st = ensureSettings();
  var today = todaySerial();
  var cal = getCal(), c = cal.current;
  var lines = [];
  var sp = '<div style="height:6px;"></div>';

  // ── Text Info ──────────────────────────────────────────────────────────
  // Current Date
  lines.push('<div style="font-weight:bold;margin:3px 0;">' + esc(currentDateLabel()) + '</div>');

  // Time of Day (if active)
  if (isTimeOfDayActive()){
    lines.push(_timeOfDayStatusHtml('font-size:.85em;opacity:.72;margin:0 0 2px 0;'));
  }

  // Current Location (if weather active and location set)
  if (st.weatherEnabled !== false){
    try {
      var ws = getWeatherState();
      if (ws.location){
        lines.push('<div style="font-size:.82em;opacity:.7;margin:1px 0;">📍 ' + esc(_weatherLocationLabel(ws.location)) + '</div>');
      }
    } catch(e0){}
  }

  // Current Weather
  if (st.weatherEnabled !== false){
    try {
      weatherEnsureForecast();
      var wxCard = _weatherRecordForDisplay(_forecastRecord(today));
      if (wxCard && wxCard.final){
        var wxVals = _weatherPrimaryValues(wxCard) || wxCard.final;
        var wxCond = _deriveConditions(wxVals, wxCard.location || {}, WEATHER_PRIMARY_PERIOD, wxCard.snowAccumulated, _weatherPrimaryFog(wxCard));
        lines.push('<div style="font-size:.82em;opacity:.7;margin:1px 0;">☁️ ' + esc(_conditionsNarrative(wxVals, wxCond, WEATHER_PRIMARY_PERIOD)) + '</div>');
      }
    } catch(e1){}
  }

  // Current Lighting (if time of day is active)
  if (isTimeOfDayActive()){
    try {
      var lightSnap = currentLightSnapshot(today);
      if (lightSnap){
        var lightLabel = lightSnap.label || 'Unknown';
        if (lightSnap.mode !== 'day'){
          lines.push('<div style="font-size:.82em;opacity:.7;margin:1px 0;">💡 ' + esc(lightLabel) + (lightSnap.note ? ' — ' + esc(lightSnap.note) : '') + '</div>');
        }
      }
    } catch(e2){}
  }

  lines.push(sp);

  // Events/Holidays
  var occNow = [];
  try { occNow = occurrencesInRange(today, today); } catch(e3){}
  var eventNames = [];
  var eventSeen = {};
  for (var oi = 0; oi < occNow.length; oi++){
    var nm = eventDisplayName(occNow[oi].e);
    var key = String(nm || '').toLowerCase();
    if (!eventSeen[key]){ eventSeen[key] = 1; eventNames.push(nm); }
  }
  if (eventNames.length){
    lines.push('<div style="font-size:.85em;margin:1px 0;">🎉 ' + eventNames.map(esc).join(', ') + '</div>');
  }

  lines.push(sp);

  // Moons: Ascendant, New, Full
  if (st.moonsEnabled !== false){
    try {
      moonEnsureSequences();
      var moonSys = _getMoonSys();
      if (moonSys && moonSys.moons){
        var newMoons = [], fullMoons = [];
        moonSys.moons.forEach(function(moon){
          var ph = moonPhaseAt(moon.name, today);
          if (!ph) return;
          if (_isFullMoonIllum(ph.illum)) fullMoons.push(moon.name);
          else if (_isNewMoonIllum(ph.illum)) newMoons.push(moon.name);
        });
        var moonLines = [];
        if (newMoons.length) moonLines.push('\uD83C\uDF11 <b>New:</b> ' + newMoons.map(esc).join(', '));
        if (fullMoons.length) moonLines.push('\uD83C\uDF15 <b>Full:</b> ' + fullMoons.map(esc).join(', '));
        if (moonLines.length){
          lines.push('<div style="font-size:.82em;opacity:.8;line-height:1.5;">' + moonLines.join('<br>') + '</div>');
        }
      }
    } catch(e5){}
  }

  lines.push(sp);

  // Planes: Coterminous, Remote
  if (st.planesEnabled !== false){
    try {
      var allPlanes = _getAllPlaneData();
      var ypd = 336; // typical year days
      var coterminous = [], remote = [];
      for (var pi = 0; pi < allPlanes.length; pi++){
        if (allPlanes[pi].type === 'fixed') continue;
        var ps2 = getPlanarState(allPlanes[pi].name, today);
        if (!ps2) continue;
        if (ps2.phaseDuration != null && ps2.phaseDuration > ypd) continue;
        if (ps2.phase === 'coterminous') coterminous.push(ps2.plane.name);
        else if (ps2.phase === 'remote') remote.push(ps2.plane.name);
      }
      var planeLines = [];
      if (coterminous.length) planeLines.push('🔴 <b>Coterminous:</b> ' + coterminous.map(esc).join(', '));
      if (remote.length) planeLines.push('🔵 <b>Remote:</b> ' + remote.map(esc).join(', '));
      if (planeLines.length){
        lines.push('<div style="font-size:.82em;opacity:.8;line-height:1.5;">' + planeLines.join('<br>') + '</div>');
      }
    } catch(e6){}
  }

  // ── Buttons ────────────────────────────────────────────────────────────
  var btns = [];
  btns.push('<div style="margin-top:6px;">');

  // Time of Day: advance if active, enable if weather is active
  if (isTimeOfDayActive()){
    btns.push(button('⏩ Time of Day ⏩','time next'));
  } else if (st.weatherEnabled !== false){
    btns.push(button('Enable Time of Day','time start middle_of_night'));
  }
  btns.push('</div>');

  // Date step arrows
  btns.push('<div style="margin:3px 0;">' + button('Back','retreat 1') + ' ' + button('Forward','advance 1') + '</div>');

  // Send Today View to Players
  btns.push('<div style="margin:3px 0;">' + button('Send Today View to Players','send') + '</div>');

  // Additional Options dropdown
  var adminMenu = '|Enable/Disable Moons,moon toggle' +
    '|Enable/Disable Weather,weather toggle' +
    '|Enable/Disable Planes,planes toggle' +
    '|Theme,help themes' +
    '|Calendar System,help calendarsystems' +
    '|Hemisphere,help hemisphere' +
    '|Season Set,help seasons' +
    '|Reset Calendar,help resetconfirm';
  btns.push('<div style="margin:3px 0;">' +
    button('Additional Options', 'today options ?{Option|Events,events|Moons,moon|Weather,weather|Planes,planes|Admin,help root}') +
    '</div>');

  btns.push('');

  return _menuBox('Today — ' + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label),
    lines.join('') + btns.join(''));
}

export var USAGE = {
  'events.add':     'Usage: !cal add [MM DD [YYYY] | <MonthName> DD [YYYY] | DD] NAME [#COLOR|color] (DD may be an ordinal like 1st or fourteenth)',
  'events.remove':  'Usage: !cal remove [list | key <KEY> | series <KEY> | <name fragment>]',
  'events.restore': 'Usage: !cal restore [all] [exact] <name...> | restore key <KEY>',
  'date.set':       'Usage: !cal set [MM] DD [YYYY] or !cal set <MonthName> DD [YYYY] (DD may be an ordinal like 1st or fourteenth)'
};

export function usage(key, m){ whisper(m.who, USAGE[key]); }

export function invokeEventSub(m, sub, args){
  var cfg = EVENT_SUB[sub];
  if (!cfg) return whisper(m.who, 'Unknown events subcommand. Try: add | addmonthly | addyearly | remove | restore | list');
  if (cfg.usage && (!args || args.length === 0)) return usage(cfg.usage, m);
  return cfg.run(m, args || []);
}

export var EVENT_SUB = {
  add: {
    usage: 'events.add',
    run: function(m, args){ addEventSmart(args); }
  },
  addmonthly: {
    usage: null,
    run: function(m, args){ addMonthlySmart(args); }
  },
  addyearly: {
    usage: null,
    run: function(m, args){ addYearlySmart(args); }
  },
  remove: {
    usage: 'events.remove',
    run: function(m, args){
      if (!args || !args.length) { whisper(m.who, removeListHtml()); return; }
      var sub = String(args[0]||'').toLowerCase();
      if (sub === 'list') {
        if (args.length === 1) { whisper(m.who, removeListHtml()); return; }
        return usage('events.remove', m);
      }
      if (sub === 'key' || sub === 'series') { removeEvent(args.join(' ')); return; }
      whisper(m.who, removeMatchesListHtml(args.join(' ')));
    }
  },
  restore: {
    usage: 'events.restore',
    run: function(m, args){
      if ((args[0] || '').toLowerCase() === 'list'){
        whisper(m.who, suppressedDefaultsListHtml());
        return;
      }
      restoreDefaultEvents(args.join(' '));
    }
  },
  list: {
    usage: null,
    run: function(m){ whisper(m.who, listAllEventsTableHtml()); }
  },
  source: {
    usage: null,
    run: function(m){ return commands.source.run(m, ['!cal', 'source', 'list']); }
  },
  removeflow: {
    usage: null,
    run: function(m){ whisper(m.who, _eventsRemoveRestoreHtml()); }
  },
  panel: {
    usage: null,
    run: function(m, args){
      whisper(m.who, _eventsPanelHtml(args[0] || null));
    }
  },
  ranges: {
    usage: null,
    run: function(m, args){
      // Route to deliverTopLevelCalendarRange for Additional Ranges
      _deliverTopLevelCalendarRange({ who: m.who, args: args, dest: 'whisper' });
    }
  },
  manage: {
    usage: null,
    run: function(m, args){
      // Route management sub-actions
      var action = (args[0] || '').toLowerCase();
      if (!action) return whisper(m.who, 'Management: use the dropdown to select an action.');
      // The dropdown routes to existing commands, so this is a fallback
      return invokeEventSub(m, action, args.slice(1));
    }
  }
};

// ── Events Panel ──────────────────────────────────────────────────────────
function _eventsPanelHtml(serialArg){
  var cal = getCal(), c = cal.current;
  var today = todaySerial();

  // Determine which month to display
  var displaySerial = today;
  if (serialArg){
    var parsed = parseInt(serialArg, 10);
    if (isFinite(parsed)) displaySerial = parsed;
  }
  var dd = fromSerial(displaySerial);
  var mobj = cal.months[dd.mi];
  if (!mobj) return '';

  var monthStart = toSerial(dd.year, dd.mi, 1);
  var monthEnd = toSerial(dd.year, dd.mi, mobj.days | 0);

  // Minical
  var spec = {
    start: monthStart,
    end: monthEnd,
    months: [{ y: dd.year, mi: dd.mi }],
    title: mobj.name + ' ' + dd.year
  };
  var calHtml = buildCalendarsHtmlForSpec(spec);

  // Text Info
  var lines = [];
  lines.push('<div style="font-weight:bold;margin:3px 0;">' + esc(currentDateLabel()) + '</div>');

  // Bulleted events only if displayed month is the current month
  if (dd.year === c.year && dd.mi === c.month){
    try {
      var occ = occurrencesInRange(today, today);
      if (occ.length){
        var seen = {};
        var evList = [];
        for (var i = 0; i < occ.length; i++){
          var nm = eventDisplayName(occ[i].e);
          var k = String(nm || '').toLowerCase();
          if (!seen[k]){ seen[k] = 1; evList.push(nm); }
        }
        lines.push('<ul style="margin:4px 0;padding-left:18px;">');
        for (var j = 0; j < evList.length; j++){
          lines.push('<li style="font-size:.85em;">' + esc(evList[j]) + '</li>');
        }
        lines.push('</ul>');
      }
    } catch(e0){}
  }

  // Buttons
  var prevSer = _shiftSerialByMonth(displaySerial, -1);
  var nextSer = _shiftSerialByMonth(displaySerial, 1);

  var btns = [];
  btns.push('<div style="margin:6px 0 3px 0;">');
  btns.push(button('Previous','events panel ' + prevSer) + ' ');
  btns.push(button('Next','events panel ' + nextSer));
  btns.push('</div>');
  btns.push('<div style="margin:3px 0;">' + button('Send to Players','send ' + mobj.name + ' ' + dd.year) + '</div>');

  // Additional Ranges
  var monthCount = cal.months.length;
  var remaining = monthCount - dd.mi;
  btns.push('<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>');
  btns.push('<div style="margin:3px 0;">' +
    button('Additional Ranges','events ranges ?{Range|Full Year,year|Upcoming ' + remaining + ' months,upcoming|Specific Month,month ?\\{MM or MM YYYY\\}|Specific Year,year ?\\{YYYY\\}}') +
    '</div>');

  // Management (GM only)
  btns.push('<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>');
  btns.push('<div style="margin:3px 0;">' +
    button('Management','events manage ?{Action|Add Single Event,add ?\\{Date DD or MM DD or MM DD YYYY\\} ?\\{Event Name\\} ?\\{Color|#50C878\\}|Add Monthly Event,addmonthly ?\\{Day DD\\} ?\\{Event Name\\} ?\\{Color|#50C878\\}|Add Yearly Event,addyearly ?\\{Month MM\\} ?\\{Day DD\\} ?\\{Event Name\\} ?\\{Color|#50C878\\}|Source Controls,source|Remove/Restore,removeflow}') +
    '</div>');

  return _menuBox('Events — ' + esc(mobj.name + ' ' + dd.year),
    calHtml + lines.join('') + btns.join(''));
}

function _eventsRemoveRestoreHtml(){
  return _menuBox('Remove / Restore Events',
    '<div style="opacity:.8;margin-bottom:6px;">Open the matching workflow for custom-event removal or suppressed-default restoration.</div>' +
    '<div style="margin-bottom:6px;">' +
      button('Remove Custom Events', 'events remove list') + ' ' +
      button('Restore Default Events', 'events restore list') +
    '</div>' +
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
    removeListHtml() +
    '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
    suppressedDefaultsListHtml()
  );
}

export var commands = {

  // ── Public ────────────────────────────────────────────────────────────────

  '': function(m, a){
    var restTokens = _normalizePackedWords(a.slice(1).join(' ')).split(/\s+/).filter(Boolean);
    if (!restTokens.length){
      _showDefaultCalView(m);
      return;
    }
    _deliverTopLevelCalendarRange({ who:m.who, args:restTokens, dest:'whisper' });
  },

  show: function(m, a){
    var restTokens = _normalizePackedWords(a.slice(2).join(' ')).split(/\s+/).filter(Boolean);
    if (!restTokens.length){
      _showDefaultCalView(m);
      return;
    }
    _deliverTopLevelCalendarRange({ who:m.who, args:restTokens, dest:'whisper' });
  },

  now: function(m){
    sendCurrentDate(m.who, false, { playerid:m.playerid, compact:true, includeButtons:false });
  },

  today: function(m, a){
    var sub = (a[2] || '').toLowerCase();
    // !cal today options <choice> — redirect from Additional Options dropdown
    if (sub === 'options'){
      var choice = (a[3] || '').toLowerCase();
      if (choice === 'events') return invokeEventSub(m, 'panel', []);
      if (choice === 'moon')   return handleMoonCommand(m, ['moon']);
      if (choice === 'weather')return handleWeatherCommand(m, ['weather']);
      if (choice === 'planes') return handlePlanesCommand(m, ['planes']);
      // default: fall through to admin root
      return whisper(m.who, helpRootMenu(m));
    }
    // Both GMs and players get the consolidated Today view.
    // sendCurrentDate handles audience-appropriate output internally.
    _showDefaultCalView(m);
  },

  // FIX: top-level !cal list now works
  list: function(m){ whisper(m.who, listAllEventsTableHtml()); },

  // Player shortcut: !cal forecast shows their revealed weather forecast
  forecast: function(m){
    handleWeatherCommand(m, ['weather','forecast']);
  },

  effects: { gm:true, run:function(m){
    whisperUi(m.who, activeEffectsPanelHtml());
  }},

  time: { gm:true, run:function(m, a){
    var sub = String(a[2] || '').toLowerCase();
    var bucketArg = normalizeTimeBucketKey(sub);
    if (!sub){
      return whisperUi(m.who, _timeOfDayMenuHtml());
    }
    if (sub === 'clear' || sub === 'off' || sub === 'stop' || sub === 'disable'){
      clearTimeOfDay();
      return whisperUi(m.who, 'Time of day cleared for this date.');
    }
    if (sub === 'next' || sub === 'advance' || sub === 'step'){
      var current = currentTimeBucket();
      if (!current){
        return whisperUi(m.who, _timeOfDayMenuHtml());
      }
      if (current === 'nighttime'){
        stepDays(1, { preserveTimeOfDay:true, announce:false });
        activateTimeOfDay('middle_of_night');
      } else {
        activateTimeOfDay(nextTimeBucket(current));
      }
      return _sendTimeOfDayStatus(m.who);
    }
    if (sub === 'start' || sub === 'set'){
      var picked = normalizeTimeBucketKey(a.slice(3).join(' '));
      if (!picked) return whisperUi(m.who, _timeOfDayMenuHtml());
      activateTimeOfDay(picked);
      return _sendTimeOfDayStatus(m.who);
    }
    if (bucketArg){
      activateTimeOfDay(bucketArg);
      return _sendTimeOfDayStatus(m.who);
    }
    whisperUi(m.who, _timeOfDayMenuHtml());
  }},

  help: function(m, a){
    var page = String(a[2]||'').toLowerCase();
    switch(page){
      case 'eventcolors': return helpEventColorsMenu(m);
      case 'calendar':    return helpCalendarSystemMenu(m);
      case 'themes':      return helpThemesMenu(m);
      case 'seasons':     return helpSeasonsMenu(m);
      case 'root':
      default:            return helpRootMenu(m);
    }
  },

  // ── GM Only ───────────────────────────────────────────────────────────────

  settings: { gm:true, run:function(m,a){
    var key = String(a[2]||'').toLowerCase();
    var val = String(a[3]||'').toLowerCase();
    var st = ensureSettings();
    function _settingsUsage(){
      return whisperUi(m.who,
        'Usage: <code>!cal settings (group|labels|events|moons|weather|weathermechanics|wxmechanics|hazards|weatherhazards|wxhazards|planes|offcycle|buttons) (on|off)</code><br>'+
        '<code>!cal settings density (compact|normal)</code> &nbsp;·&nbsp; '+
        '<code>!cal settings mode (moon|weather|planes) (calendar|list|both)</code><br>'+
        '<code>!cal settings verbosity (normal|minimal)</code> &nbsp;·&nbsp; '+
        '<code>!cal settings weatherdays (1-20)</code>'
      );
    }
    if (!key){
      return _settingsUsage();
    }
    if (key === 'density'){
      if (!/^(compact|normal)$/.test(val)){
        return whisperUi(m.who,'Usage: <code>!cal settings density (compact|normal)</code>');
      }
      st.uiDensity = val;
      refreshAndSend();
      return whisperUi(m.who,'UI density set to <b>'+esc(val)+'</b>.');
    }
    if (key === 'verbosity'){
      if (!/^(normal|minimal)$/.test(val)){
        return whisperUi(m.who,'Usage: <code>!cal settings verbosity (normal|minimal)</code>');
      }
      st.subsystemVerbosity = val;
      refreshAndSend();
      return whisperUi(m.who,'Subsystem detail set to <b>'+esc(titleCase(val))+'</b>.');
    }
    if (key === 'weatherdays' || key === 'wxdays'){
      var weatherDays = parseInt(val, 10);
      if (!/^\d+$/.test(val) || weatherDays < 1 || weatherDays > CONFIG_WEATHER_FORECAST_DAYS){
        return whisperUi(m.who,'Usage: <code>!cal settings weatherdays (1-'+CONFIG_WEATHER_FORECAST_DAYS+')</code>');
      }
      st.weatherForecastViewDays = _weatherViewDays(weatherDays);
      refreshAndSend();
      return whisperUi(m.who,'Weather forecast span set to <b>'+st.weatherForecastViewDays+' days</b>.');
    }
    if (key === 'mode'){
      var sysTok = String(a[3] || '').toLowerCase();
      var modeTok = String(a[4] || '').toLowerCase();
      if (!/^(moon|lunar|weather|planes|plane|planar)$/.test(sysTok) || !/^(calendar|list|both)$/.test(modeTok)){
        return whisperUi(m.who,'Usage: <code>!cal settings mode (moon|weather|planes) (calendar|list|both)</code>');
      }
      if (sysTok === 'moon' || sysTok === 'lunar') st.moonDisplayMode = modeTok;
      if (sysTok === 'weather') st.weatherDisplayMode = modeTok;
      if (sysTok === 'planes' || sysTok === 'plane' || sysTok === 'planar') st.planesDisplayMode = modeTok;
      refreshAndSend();
      return whisperUi(m.who,'Display mode updated: <b>'+esc(titleCase(sysTok))+'</b> → <b>'+esc(titleCase(modeTok))+'</b>.');
    }
    if (!/^(group|labels|events|moons|weather|weathermechanics|wxmechanics|hazards|weatherhazards|wxhazards|extremehazards|planes|offcycle|buttons)$/.test(key) || !/^(on|off)$/.test(val)){
      return _settingsUsage();
    }
    if (key==='group')    st.groupEventsBySource = (val==='on');
    if (key==='labels')   st.showSourceLabels    = (val==='on');
    if (key==='events')   st.eventsEnabled       = (val==='on');
    if (key==='moons'){    st.moonsEnabled  = (val==='on'); st._moonsAutoToggle = false; }
    if (key==='weather')  st.weatherEnabled      = (val==='on');
    if (key==='weathermechanics' || key==='wxmechanics') st.weatherMechanicsEnabled = (val==='on');
    if (key==='hazards' || key==='weatherhazards' || key==='wxhazards' || key==='extremehazards') st.weatherHazardsEnabled = (val==='on');
    if (key==='planes'){  st.planesEnabled = (val==='on'); st._planesAutoToggle = false; }
    if (key==='offcycle') st.offCyclePlanes      = (val==='on');
    if (key==='buttons')  st.autoButtons         = (val==='on');
    refreshAndSend();
    whisperUi(m.who,'Setting updated.');
  }},

  events: { gm:true, run:function(m, a){
    var args = a.slice(2);
    var sub  = (args.shift() || 'panel').toLowerCase();
    return invokeEventSub(m, sub, args);
  }},

  add:     { gm:true, run:function(m,a){ runEventsShortcut(m, a, 'add'); } },
  remove:  { gm:true, run:function(m,a){
    var args = a.slice(2);
    if (!args.length) { whisper(m.who, removeListHtml()); return; }
    return invokeEventSub(m,'remove', args);
  }},
  restore: { gm:true, run:function(m,a){ runEventsShortcut(m, a, 'restore'); } },

  addmonthly: { gm:true, run:function(m,a){ addMonthlySmart(a.slice(2)); } },
  addyearly:  { gm:true, run:function(m,a){ addYearlySmart(a.slice(2)); } },
  addannual:  { gm:true, run:function(m,a){ addYearlySmart(a.slice(2)); } },

  send: { gm:true, run:function(m, a){
    var restTokens = _normalizePackedWords(a.slice(2).join(' ')).split(/\s+/).filter(Boolean);
    if (!restTokens.length){ sendCurrentDate(null, false, { playerid:m.playerid, includeButtons:false }); return; }
    _deliverTopLevelCalendarRange({ who:m.who, args:restTokens, dest:'broadcast' });
  }},

  advance: { gm:true, run:function(m,a){ stepDays( parseInt(a[2],10) || 1); } },
  retreat: { gm:true, run:function(m,a){ stepDays(-(parseInt(a[2],10) || 1)); } },

  set: { gm:true, run:function(m,a){
    var r = Parse.looseMDY(a.slice(2));
    if (!r){ return whisper(m.who, USAGE['date.set']); }
    var cal = getCal(), cur = cal.current, months = cal.months;
    if (r.kind === 'dayOnly'){
      var next = nextForDayOnly(cur, r.day, months.length);
      var d = clamp(r.day, 1, months[next.month].days|0);
      setDate(next.month+1, d, next.year);
      return;
    }
    var y  = (r.year != null) ? r.year : cur.year;
    // Guard: block setting the date to an inactive leap month.
    if (months[r.mi] && months[r.mi].leapEvery && !_isLeapMonth(months[r.mi], y)){
      return whisper(m.who,
        '<b>'+esc(months[r.mi].name)+'</b> only exists in leap years (every '+
        months[r.mi].leapEvery+' years). Year '+y+' is not a leap year.');
    }
    var d2 = clamp(r.day, 1, months[r.mi].days|0);
    setDate(r.mi+1, d2, y);
  }},

  theme: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){ return whisper(m.who, themeListHtml()); }
    if (sub === 'reset' || sub === 'default'){
      ensureSettings().colorTheme = null;
      colorsAPI.reset();
      refreshAndSend();
      return whisper(m.who, 'Color theme reset to calendar default.');
    }
    if (!COLOR_THEMES[sub]) return whisper(m.who, 'Unknown theme. Try <code>!cal theme list</code>.');
    ensureSettings().colorTheme = sub;
    colorsAPI.reset();
    refreshAndSend();
    whisper(m.who, 'Color theme set to <b>'+esc(sub)+'</b>. Use <code>!cal theme reset</code> to return to calendar default.');
  }},

  calendar: { gm:true, run: function(m, a){
    var sysKey = (a[2]||'').toLowerCase();
    var varKey = (a[3]||'').toLowerCase();
    if (!sysKey || !CALENDAR_SYSTEMS[sysKey]){
      return whisper(m.who, calendarSystemListHtml());
    }
    var sys = CALENDAR_SYSTEMS[sysKey];
    if (varKey && !(sys.variants && sys.variants[varKey])){
      return whisper(m.who,
        'Unknown variant <b>'+esc(varKey)+'</b> for '+esc(sys.label||sysKey)+'. '+
        'Available: '+Object.keys(sys.variants||{}).join(', ')+'.');
    }
    var vk = varKey || sys.defaultVariant || 'standard';
    var variant = sys.variants && sys.variants[vk];
    // Reset manual theme override so variant default takes effect.
    ensureSettings().colorTheme = null;
    applyCalendarSystem(sysKey, vk);
    _invalidateSerialCache();
    refreshAndSend();
    var msg = 'Setting: <b>'+esc(sys.label||titleCase(sysKey))+'</b>';
    if (variant && (variant.label || '').trim()) msg += ' — '+esc(variant.label||titleCase(vk));
    if (variant && variant.description){
      msg += '.<br><span style="opacity:.78;">'+esc(variant.description)+'</span>';
    } else {
      msg += '.';
    }
    whisper(m.who, msg);
  }},

  seasons: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (!sub || sub==='list'){ return whisper(m.who, seasonSetListHtml()); }
    if (!SEASON_SETS[sub]) return whisper(m.who, 'Unknown variant. Options: '+Object.keys(SEASON_SETS).join(', ')+'.');
    if (!applySeasonSet(sub)){ return whisper(m.who, 'That season set doesn’t fit this calendar.'); }
    ensureSettings().seasonVariant = sub;
    refreshAndSend();
    whisper(m.who, 'Season variant: <b>'+esc(sub)+'</b>.');
  }},

  hemisphere: { gm:true, run:function(m, a){
    var sub = String(a[2]||'').toLowerCase();
    if (sub !== 'north' && sub !== 'south'){
      var st3 = ensureSettings();
      var cur = st3.hemisphere || CONFIG_DEFAULTS.hemisphere;
      var sv3 = st3.seasonVariant || CONFIG_DEFAULTS.seasonVariant;
      var entry3 = SEASON_SETS[sv3] || {};
      var aware = entry3.hemisphereAware ? 'yes' : 'no (current season set is not hemisphere-aware)';
      return whisper(m.who,
        'Current hemisphere: <b>'+esc(cur)+'</b>. Hemisphere-aware: '+aware+'.<br>'+
        button('North','hemisphere north')+' '+button('South','hemisphere south')
      );
    }
    var st4 = ensureSettings();
    st4.hemisphere = sub;
    // Re-apply the current season set so name arrays are shifted correctly.
    applySeasonSet(st4.seasonVariant || CONFIG_DEFAULTS.seasonVariant);
    refreshAndSend();
    whisper(m.who, 'Hemisphere: <b>'+esc(sub)+'</b>.');
  }},

  source: { gm:true, run: function(m, a){
    var args = a.slice(2).map(function(x){ return String(x).trim(); }).filter(Boolean);
    var sub = (args[0]||'').toLowerCase();
    var manualSuppressedSources = getManualSuppressedSources();
    var autoSuppressedSources = getAutoSuppressedSources();

    // Collect all known source keys → canonical display names.
    function allSources(){
      var cal = getCal(), seen = {};
      defaults.events.forEach(function(de){ if (de.source) seen[String(de.source).toLowerCase()] = String(de.source); });
      cal.events.forEach(function(e){ if (e.source) seen[String(e.source).toLowerCase()] = String(e.source); });
      return seen;
    }

    function listSources(){
      var seen  = allSources();
      var keys  = Object.keys(seen);
      if (!keys.length){ return whisper(m.who, '<div><b>Sources</b></div><div style="opacity:.7;">No sources found.</div>'); }

      var pList = ensureSettings().eventSourcePriority;

      // Build display rows sorted by current priority rank, then alphabetically.
      function pRank(k){ var i=pList.indexOf(k); return i>=0 ? i : pList.length; }
      keys.sort(function(a,b){
        var rd = pRank(a) - pRank(b);
        return rd !== 0 ? rd : a.localeCompare(b);
      });

      var head = '<tr>'+
        '<th style="'+STYLES.th+'">Priority</th>'+
        '<th style="'+STYLES.th+'">Source</th>'+
        '<th style="'+STYLES.th+'">Status</th>'+
        '<th style="'+STYLES.th+'">Move</th>'+
        '<th style="'+STYLES.th+'">Enable/Disable</th>'+
        '</tr>';

      var rows = keys.map(function(k, i){
        var label    = seen[k];
        var rank     = pList.indexOf(k);
        var rankCell = rank >= 0
          ? String(rank + 1)
          : '<span style="opacity:.5;">—</span>';
        var suppression = sourceSuppressionState(k);
        var upBtn    = i > 0
          ? button('↑', 'source up '   + label, {icon:''})
          : '<span style="opacity:.25;">↑</span>';
        var downBtn  = i < keys.length - 1
          ? button('↓', 'source down ' + label, {icon:''})
          : '<span style="opacity:.25;">↓</span>';
        var statusLabel = suppression.manual && suppression.auto
          ? 'Off (manual + calendar)'
          : suppression.manual
            ? 'Off (manual)'
            : suppression.auto
              ? 'Off (calendar)'
              : 'On';
        var togBtn = '';
        if (suppression.manual && suppression.auto){
          togBtn = button('Enable Manual', 'source enable ' + label) +
            '<div style="font-size:.72em;opacity:.55;margin-top:2px;">Calendar still hides it.</div>';
        } else if (suppression.manual){
          togBtn = button('Enable', 'source enable ' + label);
        } else if (suppression.auto){
          togBtn = '<span style="opacity:.5;">Calendar-managed</span>';
        } else {
          togBtn = button('Disable', 'source disable ' + label);
        }
        return '<tr>'+
          '<td style="'+STYLES.td+';text-align:center;">'+rankCell+'</td>'+
          '<td style="'+STYLES.td+'">'+esc(label)+'</td>'+
          '<td style="'+STYLES.td+';text-align:center;">'+esc(statusLabel)+'</td>'+
          '<td style="'+STYLES.td+';text-align:center;">'+upBtn+' '+downBtn+'</td>'+
          '<td style="'+STYLES.td+';text-align:center;">'+togBtn+'</td>'+
          '</tr>';
      }).join('');

      whisper(m.who,
        '<div style="margin:4px 0;"><b>Sources &amp; Priority</b></div>'+
        '<table style="'+STYLES.table+'">'+head+rows+'</table>'+
        '<div style="font-size:.8em;opacity:.7;margin-top:4px;">'+
        'Priority 1 = primary event (sets cell color). Unranked sources (—) are tied last.<br>'+
        'User-added events always rank first regardless of source.'+
        '</div>'
      );
    }

    function movePriority(name, dir){
      var key  = String(name||'').toLowerCase();
      var seen = allSources();
      if (!key || !seen[key]){ whisper(m.who, 'Source not found: '+esc(name)); return; }
      var st   = ensureSettings();
      var pList= st.eventSourcePriority;
      var idx  = pList.indexOf(key);

      if (idx < 0){
        // Not yet ranked: add it. 'up' puts it at front; 'down' appends.
        if (dir === 'up')   pList.unshift(key);
        else                pList.push(key);
      } else {
        var swap = dir === 'up' ? idx - 1 : idx + 1;
        if (swap < 0 || swap >= pList.length){ listSources(); return; }
        var tmp = pList[swap]; pList[swap] = pList[idx]; pList[idx] = tmp;
      }

      // Prune keys that no longer exist as sources.
      var knownKeys = Object.keys(seen);
      st.eventSourcePriority = pList.filter(function(k){ return knownKeys.indexOf(k) >= 0; });
      listSources();
    }

    function disableSource(name){
      var key = String(name||'').toLowerCase();
      if (!key){ whisper(m.who, 'Usage: <code>!cal source disable &lt;name&gt;</code>'); return; }
      manualSuppressedSources[key] = 1;
      var cal = getCal(), defaultsSet = currentDefaultKeySet(cal);
      cal.events = cal.events.filter(function(e){
        var src = (e.source != null) ? String(e.source).toLowerCase() : null;
        if (src !== key) return true;
        var maxD = cal.months[e.month-1].days|0;
        var norm = DaySpec.canonicalForKey(e.day, maxD);
        var k = defaultKeyFor(e.month, norm, e.name);
        return !defaultsSet[k];
      });
      refreshAndSend();
      sendChat(script_name, '/w gm Disabled source "'+esc(name)+'" and removed its default events.');
    }

    function enableSource(name){
      var key = String(name||'').toLowerCase();
      if (!key){ whisper(m.who, 'Usage: <code>!cal source enable &lt;name&gt;</code>'); return; }
      delete manualSuppressedSources[key];
      var sup = state[state_name].suppressedDefaults || {};
      Object.keys(sup).forEach(function(k){
        var info = _defaultDetailsForKey(k);
        var src = (info.source != null) ? String(info.source).toLowerCase() : null;
        if (src === key) delete sup[k];
      });
      mergeInNewDefaultEvents(getCal());
      refreshAndSend();
      if (autoSuppressedSources[key]){
        sendChat(script_name, '/w gm Manual suppression cleared for "'+esc(name)+'", but the current calendar still auto-suppresses that source.');
      } else {
        sendChat(script_name, '/w gm Enabled source "'+esc(name)+'" and restored its default events.');
      }
    }

    if (!sub || sub==='list') return listSources();
    if (sub==='up')   { return movePriority(args.slice(1).join(' '), 'up'); }
    if (sub==='down') { return movePriority(args.slice(1).join(' '), 'down'); }
    if (sub==='disable'){ if (!args[1]) return whisper(m.who,'Usage: <code>!cal source disable &lt;name&gt;</code>'); return disableSource(args.slice(1).join(' ')); }
    if (sub==='enable'){  if (!args[1]) return whisper(m.who,'Usage: <code>!cal source enable &lt;name&gt;</code>');  return enableSource(args.slice(1).join(' ')); }
    whisper(m.who, 'Usage: <code>!cal source [list|up|down|disable|enable] [&lt;name&gt;]</code>');
  }},

  resetcalendar: { gm:true, run:function(){ resetToDefaults(); } },

  // Moon system
  lunar:  function(m, a){ handleMoonCommand(m, ['moon'].concat(a.slice(2))); }, // alias
  moon:    function(m, a){ handleMoonCommand(m, a.slice(1)); },   // mixed: players=view, GM=edit

  // Weather — GM full access, players get today's conditions only
  weather:  function(m, a){   // mixed: players=today+forecast, GM=full access
    // a[0]='!cal', a[1]='weather', a[2]=subcommand, a[3+]=params
    // Pass a slice starting at 'weather' so handler sees args[0]='weather', args[1]=sub
    handleWeatherCommand(m, a.slice(1));
  },

  // Weather mechanics quick reference
  mechanics: function(m){ handleWeatherCommand(m, ['weather','mechanics']); }, // alias
  mech:      function(m){ handleWeatherCommand(m, ['weather','mechanics']); }, // alias

  // Planar system — parallel to moons/weather
  planar: function(m, a){ handlePlanesCommand(m, ['planes'].concat(a.slice(2))); }, // alias
  planes:  function(m, a){ handlePlanesCommand(m, a.slice(1)); }
};
