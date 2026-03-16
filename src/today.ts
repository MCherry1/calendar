// Today — Combined detail from all subsystems
import { CALENDAR_SYSTEMS, CONFIG_DEFAULTS, CONFIG_WEATHER_FORECAST_DAYS } from './config.js';
import { COLOR_THEMES, SEASON_SETS, STYLES, script_name, state_name } from './constants.js';
import { applyCalendarSystem, applySeasonSet, defaults, ensureSettings, getAutoSuppressedSources, getCal, getManualSuppressedSources, refreshAndSend, resetToDefaults, sourceSuppressionState, titleCase } from './state.js';
import { colorsAPI } from './color.js';
import { _invalidateSerialCache, _isLeapMonth, todaySerial } from './date-math.js';
import { DaySpec, Parse } from './parsing.js';
import { _deliverTopLevelCalendarRange, currentDefaultKeySet, defaultKeyFor, eventDisplayName, mergeInNewDefaultEvents, occurrencesInRange } from './events.js';
import { button, clamp, esc, listAllEventsTableHtml, removeListHtml, removeMatchesListHtml, restoreDefaultEvents, suppressedDefaultsListHtml } from './rendering.js';
import { activateTimeOfDay, bucketLabel, clearTimeOfDay, currentTimeBucket, isTimeOfDayActive, nextTimeBucket, normalizeTimeBucketKey, TIME_OF_DAY_BUCKETS } from './time-of-day.js';
import { _activePlanarWeatherShiftLines, _defaultDetailsForKey, _displayMonthDayParts, _menuBox, _timeOfDayStatusHtml, _weatherInfluenceHtml, _weatherViewDays, activeEffectsPanelHtml, addEventSmart, addMonthlySmart, addYearlySmart, calendarSystemListHtml, currentDateLabel, currentTimeOfDayLabel, helpCalendarSystemMenu, helpEventColorsMenu, helpRootMenu, helpSeasonsMenu, helpThemesMenu, nextForDayOnly, removeEvent, seasonSetListHtml, sendCurrentDate, setDate, stepDays, taskCardHtml, themeListHtml } from './ui.js';
import { _normalizePackedWords, _playerTodayHtml, _showDefaultCalView, runEventsShortcut, send, whisper, whisperUi } from './commands.js';
import { WEATHER_DAY_PERIODS, WEATHER_PRIMARY_PERIOD, _conditionsMechHtml, _conditionsNarrative, _deriveConditions, _evaluateExtremeEvents, _forecastRecord, _weatherPeriodIcon, _weatherPeriodLabel, _weatherPrimaryFog, _weatherPrimaryValues, _weatherRecordForDisplay, handleWeatherCommand, weatherEnsureForecast } from './weather.js';
import { MOON_SYSTEMS, _eclipseNotableToday, _isFullMoonIllum, _isNewMoonIllum, _moonPhaseEmoji, _moonPhaseLabel, currentLightSnapshot, handleMoonCommand, moonEnsureSequences, moonPhaseAt, nighttimeLightHtml } from './moon.js';
import { _planarNotableToday, handlePlanesCommand } from './planes.js';


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
  var sections = [];
  var promptDate = String(cal.months[c.month].name || '') + ' ' + c.day_of_the_month + ' ' + c.year;
  var occNow = [];
  try { occNow = occurrencesInRange(today, today); } catch(e0){}
  var eventNames = [];
  var eventSeen = {};
  for (var oi0 = 0; oi0 < occNow.length; oi0++){
    var nm0 = eventDisplayName(occNow[oi0].e);
    var key0 = String(nm0 || '').toLowerCase();
    if (!eventSeen[key0]){
      eventSeen[key0] = 1;
      eventNames.push(nm0);
    }
  }

  var dateSummary = '<b>' + esc(currentDateLabel()) + '</b>';
  if (isTimeOfDayActive()) dateSummary += '<div style="margin-top:3px;">' + _timeOfDayStatusHtml('font-size:.82em;opacity:.72;margin:0;') + '</div>';
  sections.push(taskCardHtml(
    'Date',
    dateSummary,
    [
      button('Calendar','show month'),
      button('Show Year','show year'),
      button('Prompt !cal set','set ?{Date|' + promptDate + '}')
    ],
    'Use <code>!cal show</code> for the month grid or <code>!cal set &lt;dateSpec&gt;</code> to move the campaign clock.'
  ));

  sections.push(taskCardHtml(
    'Events Today',
    eventNames.length
      ? 'Today includes <b>' + eventNames.slice(0, 3).map(esc).join(', ') + '</b>' + (eventNames.length > 3 ? ' <span style="opacity:.7;">+' + (eventNames.length - 3) + ' more</span>' : '') + '.'
      : 'No calendar events are scheduled for today.',
    [
      button('List','list'),
      button('Prompt !cal add','add ?{Date|' + promptDate + '} ?{Event name|New Event} ?{Color|#50C878}'),
      button('Prompt !cal addmonthly','addmonthly ?{Day spec|first Sul} ?{Event name|Monthly Event} ?{Color|#50C878}'),
      button('Prompt !cal addyearly','addyearly ?{Month|Zarantyr} ?{Day|1} ?{Event name|Annual Event} ?{Color|#50C878}'),
      button('Sources','source list')
    ],
    'Typed forms: <code>!cal add</code>, <code>!cal addmonthly</code>, <code>!cal addyearly</code>.'
  ));

  var weatherSummary = 'Weather is currently off.';
  if (st.weatherEnabled !== false){
    try {
      weatherEnsureForecast();
      var wxCard = _weatherRecordForDisplay(_forecastRecord(today));
      if (!wxCard || !wxCard.final){
        weatherSummary = 'No weather has been generated for today yet.';
      } else {
        var wxVals = _weatherPrimaryValues(wxCard) || wxCard.final;
        var wxCond = _deriveConditions(wxVals, wxCard.location || {}, WEATHER_PRIMARY_PERIOD, wxCard.snowAccumulated, _weatherPrimaryFog(wxCard));
        weatherSummary = esc(_conditionsNarrative(wxVals, wxCond, WEATHER_PRIMARY_PERIOD)) + '.';
      }
    } catch(e1){
      weatherSummary = 'Weather data is currently unavailable.';
    }
  }
  sections.push(taskCardHtml(
    'Weather',
    weatherSummary,
    [
      button('Detail','weather'),
      button('Forecast','weather forecast'),
      button('Mechanics','weather mechanics'),
      button('Set Location','weather location')
    ],
    st.weatherEnabled === false ? 'Enable weather from settings when you want narrative or mechanical forecasts.' : ''
  ));

  var moonSummary = 'Lunar tracking is currently off.';
  if (st.moonsEnabled !== false){
    try {
      moonEnsureSequences();
      var moonNow = [];
      var moonSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      (moonSys.moons || []).forEach(function(moon){
        var peak = moonPhaseAt(moon.name, today);
        if (!peak) return;
        var label = _moonPhaseLabel(peak.illum, peak.waxing);
        if (_isFullMoonIllum(peak.illum)) moonNow.push(moon.name + ' full');
        else if (_isNewMoonIllum(peak.illum)) moonNow.push(moon.name + ' new');
        else if (moonNow.length < 1) moonNow.push(moon.name + ' ' + label.toLowerCase());
      });
      moonSummary = moonNow.length ? esc(moonNow.slice(0, 2).join(' · ')) + '.' : 'No notable lunar peaks today.';
    } catch(e2){
      moonSummary = 'Moon data is currently unavailable.';
    }
  }
  sections.push(taskCardHtml(
    'Moons',
    moonSummary,
    [
      button('Detail','moon'),
      button('Sky','moon sky'),
      button('Lore','moon lore'),
      button('Prompt !cal moon on','moon on ?{Date|' + promptDate + '}')
    ],
    'Players can keep using <code>!cal moon</code> and <code>!cal moon on &lt;dateSpec&gt;</code>.'
  ));

  var planeSummary = 'Planar tracking is currently off.';
  if (st.planesEnabled !== false){
    try {
      var planeNotes = _planarNotableToday(today);
      planeSummary = planeNotes.length
        ? 'There are <b>' + planeNotes.length + '</b> notable planar effects today.'
        : 'No active planar extremes today.';
    } catch(e3){
      planeSummary = 'Planar data is currently unavailable.';
    }
  }
  sections.push(taskCardHtml(
    'Planes',
    planeSummary,
    [
      button('Detail','planes'),
      button('Effects','effects'),
      button('Prompt !cal planes on','planes on ?{Date|' + promptDate + '}')
    ],
    'Use <code>!cal planes</code> for the detailed almanac and <code>!cal effects</code> for the current mechanical snapshot.'
  ));

  sections.push(taskCardHtml(
    'GM Controls',
    'Advance or retreat the day, broadcast the current calendar, or open the task-focused admin menu.',
    [
      button('Advance','advance 1'),
      button('Retreat','retreat 1'),
      button('Send','send'),
      button('Prompt !cal send','send ?{Calendar range|this month}'),
      button('Admin','help root')
    ]
  ));

  return _menuBox('Today — ' + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label), sections.join(''));

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
  if (!cfg) return whisper(m.who, 'Unknown events subcommand. Try: add | remove | restore | list');
  if (cfg.usage && (!args || args.length === 0)) return usage(cfg.usage, m);
  return cfg.run(m, args || []);
}

export var EVENT_SUB = {
  add: {
    usage: 'events.add',
    run: function(m, args){ addEventSmart(args); }
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
  }
};

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

  today: function(m){
    if (playerIsGM(m.playerid)){
      weatherEnsureForecast();
      moonEnsureSequences();
      whisper(m.who, _todayAllHtml());
    } else {
      weatherEnsureForecast();
      moonEnsureSequences();
      whisper(m.who, _playerTodayHtml(m.playerid));
    }
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
        'Usage: <code>!cal settings (group|labels|events|moons|weather|weathermechanics|wxmechanics|planes|offcycle|buttons) (on|off)</code><br>'+
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
    if (!/^(group|labels|events|moons|weather|weathermechanics|wxmechanics|planes|offcycle|buttons)$/.test(key) || !/^(on|off)$/.test(val)){
      return _settingsUsage();
    }
    if (key==='group')    st.groupEventsBySource = (val==='on');
    if (key==='labels')   st.showSourceLabels    = (val==='on');
    if (key==='events')   st.eventsEnabled       = (val==='on');
    if (key==='moons'){    st.moonsEnabled  = (val==='on'); st._moonsAutoToggle = false; }
    if (key==='weather')  st.weatherEnabled      = (val==='on');
    if (key==='weathermechanics' || key==='wxmechanics') st.weatherMechanicsEnabled = (val==='on');
    if (key==='planes'){  st.planesEnabled = (val==='on'); st._planesAutoToggle = false; }
    if (key==='offcycle') st.offCyclePlanes      = (val==='on');
    if (key==='buttons')  st.autoButtons         = (val==='on');
    refreshAndSend();
    whisperUi(m.who,'Setting updated.');
  }},

  events: { gm:true, run:function(m, a){
    var args = a.slice(2);
    var sub  = (args.shift() || 'list').toLowerCase();
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

  // Planar system — parallel to moons/weather
  planar: function(m, a){ handlePlanesCommand(m, ['planes'].concat(a.slice(2))); }, // alias
  planes:  function(m, a){ handlePlanesCommand(m, a.slice(1)); }
};
