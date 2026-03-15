// Today — Combined detail from all subsystems
import { CALENDAR_SYSTEMS, CONFIG_DEFAULTS, CONFIG_WEATHER_FORECAST_DAYS } from './config.js';
import { COLOR_THEMES, SEASON_SETS, STYLES, script_name, state_name } from './constants.js';
import { applyCalendarSystem, applySeasonSet, defaults, ensureSettings, getCal, refreshAndSend, resetToDefaults, titleCase } from './state.js';
import { colorsAPI } from './color.js';
import { _invalidateSerialCache, _isLeapMonth, todaySerial } from './date-math.js';
import { DaySpec, Parse } from './parsing.js';
import { _deliverTopLevelCalendarRange, currentDefaultKeySet, defaultKeyFor, eventDisplayName, mergeInNewDefaultEvents, occurrencesInRange } from './events.js';
import { button, clamp, esc, listAllEventsTableHtml, removeListHtml, removeMatchesListHtml, restoreDefaultEvents, suppressedDefaultsListHtml } from './rendering.js';
import { activateTimeOfDay, bucketLabel, clearTimeOfDay, currentTimeBucket, isTimeOfDayActive, nextTimeBucket, normalizeTimeBucketKey, TIME_OF_DAY_BUCKETS } from './time-of-day.js';
import { _activePlanarWeatherShiftLines, _defaultDetailsForKey, _displayMonthDayParts, _menuBox, _subsystemIsVerbose, _timeOfDayStatusHtml, _weatherInfluenceHtml, _weatherViewDays, activeEffectsPanelHtml, addEventSmart, addMonthlySmart, addYearlySmart, calendarSystemListHtml, currentDateLabel, currentTimeOfDayLabel, helpCalendarSystemMenu, helpEventColorsMenu, helpRootMenu, helpSeasonsMenu, helpThemesMenu, nextForDayOnly, removeEvent, seasonSetListHtml, sendCurrentDate, setDate, stepDays, themeListHtml } from './ui.js';
import { _normalizePackedWords, _playerTodayHtml, _showDefaultCalView, runEventsShortcut, send, whisper } from './commands.js';
import { WEATHER_DAY_PERIODS, WEATHER_PRIMARY_PERIOD, _conditionsMechHtml, _conditionsNarrative, _deriveConditions, _evaluateExtremeEvents, _forecastRecord, _weatherPeriodIcon, _weatherPeriodLabel, _weatherPrimaryFog, _weatherPrimaryValues, _weatherRecordForDisplay, handleWeatherCommand, weatherEnsureForecast } from './weather.js';
import { MOON_SYSTEMS, _eclipseNotableToday, _moonPhaseEmoji, _moonPhaseLabel, currentLightSnapshot, handleMoonCommand, moonEnsureSequences, moonPhaseAt, nighttimeLightHtml } from './moon.js';
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
  whisper(who,
    '<div><b>Current time: ' + esc(currentTimeOfDayLabel()) + '</b><br>' +
    esc(currentDateLabel()) + '</div>'
  );
}

export function _todayAllHtml(){
  var st = ensureSettings();
  var today = todaySerial();
  var cal = getCal(), c = cal.current;
  var verbose = _subsystemIsVerbose();
  var sections = [];

  sections.push('<div style="font-weight:bold;margin-bottom:4px;">' +
    esc(currentDateLabel()) + '</div>');
  if (isTimeOfDayActive()) sections.push(_timeOfDayStatusHtml('font-size:.82em;opacity:.72;margin:-2px 0 4px 0;'));

  // Events
  try {
    var occ = occurrencesInRange(today, today);
    if (occ.length){
      var names = [];
      var seen = {};
      for (var oi = 0; oi < occ.length; oi++){
        var nm = eventDisplayName(occ[oi].e);
        if (!seen[nm.toLowerCase()]){ seen[nm.toLowerCase()]=1; names.push(nm); }
      }
      sections.push('<div style="margin:3px 0;">🎉 <b>Events:</b> ' +
        names.map(esc).join(', ') + '</div>');
    }
  } catch(e){}

  // Weather
  if (st.weatherEnabled !== false){
    try {
      weatherEnsureForecast();
      var wxRec = _weatherRecordForDisplay(_forecastRecord(today));
      if (wxRec && wxRec.final){
        var wxHtml = '<div style="margin:4px 0;"><b>☁ Weather:</b> ' +
          button('Detail', 'weather') + '</div>';
        wxHtml += _weatherInfluenceHtml(wxRec);

        if (verbose) {
          // Normal mode — full period breakdown
          var periods = WEATHER_DAY_PERIODS;
          for (var pi = 0; pi < periods.length; pi++){
            var pname = periods[pi];
            var fogP = wxRec.fog && wxRec.fog[pname];
            var periodVals = (wxRec.periods && wxRec.periods[pname]) || wxRec.final;
            var cond = _deriveConditions(periodVals, wxRec.location||{}, pname,
              wxRec.snowAccumulated, fogP);
            var narr = _conditionsNarrative(periodVals, cond, pname);
            var mech = _conditionsMechHtml(cond);
            wxHtml += '<div style="font-size:.88em;margin:1px 0 1px 8px;">' +
              _weatherPeriodIcon(pname) + ' <b>' + esc(_weatherPeriodLabel(pname)) + ':</b> ' + esc(narr) +
              (mech ? '<div style="margin-left:12px;">'+mech+'</div>' : '') +
              '</div>';
          }
        } else {
          // Minimal mode — summary
          if (_todayWeatherIsStable(wxRec)){
            // Stable day: single line from afternoon
            var stableVals = _weatherPrimaryValues(wxRec) || wxRec.final;
            var stableFog = _weatherPrimaryFog(wxRec);
            var stableCond = _deriveConditions(stableVals, wxRec.location||{},
              WEATHER_PRIMARY_PERIOD, wxRec.snowAccumulated, stableFog);
            var stableNarr = _conditionsNarrative(stableVals, stableCond, WEATHER_PRIMARY_PERIOD);
            wxHtml += '<div style="font-size:.88em;margin:1px 0 1px 8px;">' +
              esc(stableNarr) + ' <span style="opacity:.5;">all day</span></div>';
          } else {
            // Divergent day: show periods that differ significantly from afternoon baseline
            var mPeriods = WEATHER_DAY_PERIODS;
            var mBase = (wxRec.periods && wxRec.periods[WEATHER_PRIMARY_PERIOD]) || wxRec.final;
            for (var mpi = 0; mpi < mPeriods.length; mpi++){
              var mpname = mPeriods[mpi];
              var mpv = (wxRec.periods && wxRec.periods[mpname]) || wxRec.final;
              var differs = Math.abs((mpv.temp||0) - (mBase.temp||0)) >= 2 ||
                Math.abs((mpv.wind||0) - (mBase.wind||0)) >= 2 ||
                Math.abs((mpv.precip||0) - (mBase.precip||0)) >= 2;
              if (mpname === WEATHER_PRIMARY_PERIOD || differs){
                var mfog = wxRec.fog && wxRec.fog[mpname];
                var mcond = _deriveConditions(mpv, wxRec.location||{}, mpname,
                  wxRec.snowAccumulated, mfog);
                var mnarr = _conditionsNarrative(mpv, mcond, mpname);
                wxHtml += '<div style="font-size:.88em;margin:1px 0 1px 8px;">' +
                  _weatherPeriodIcon(mpname) + ' <b>' + esc(_weatherPeriodLabel(mpname)) + ':</b> ' + esc(mnarr) +
                  '</div>';
              }
            }
          }
        }

        // Extreme events — always shown
        var extremes = _evaluateExtremeEvents(wxRec);
        if (extremes.length){
          wxHtml += '<div style="margin:3px 0 0 8px;font-size:.88em;color:#B71C1C;">';
          for (var ei = 0; ei < extremes.length; ei++){
            wxHtml += '⚡ <b>'+esc(extremes[ei].event.name)+'</b>';
            if (extremes[ei].event.mechanics) wxHtml += ' — '+esc(extremes[ei].event.mechanics);
            wxHtml += '<br>';
          }
          wxHtml += '</div>';
        }
        sections.push(wxHtml);
      }
    } catch(e){}
  }

  // Moons
  if (st.moonsEnabled !== false){
    try {
      moonEnsureSequences();
      var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      if (sys && sys.moons){
        var moonHtml = '<div style="margin:4px 0;"><b>🌙 Moons:</b> ' +
          button('Detail', 'moon') + '</div>';
        var moonLines = [];
        var suppressedCount = 0;
        for (var mi = 0; mi < sys.moons.length; mi++){
          var moon = sys.moons[mi];
          var ph = moonPhaseAt(moon.name, today);
          if (!ph) continue;
          var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
          var pLabel = _moonPhaseLabel(ph.illum, ph.waxing);
          var pct = Math.round(ph.illum * 100);
          var extra = '';
          var isNotable = false;
          if (ph.illum >= 0.97){ extra = ' <b style="color:#FFD700;">FULL</b>'; isNotable = true; }
          else if (ph.illum <= 0.03){ extra = ' <b>' + (ph.longShadows ? 'NEW (Long Shadows)' : 'NEW') + '</b>'; isNotable = true; }
          // Near-peak: within 1 day of full or new (check next/prev day)
          if (!isNotable && !verbose){
            var phPrev = moonPhaseAt(moon.name, today - 1);
            var phNext = moonPhaseAt(moon.name, today + 1);
            if ((phPrev && (phPrev.illum >= 0.97 || phPrev.illum <= 0.03)) ||
                (phNext && (phNext.illum >= 0.97 || phNext.illum <= 0.03))){
              isNotable = true;
            }
          }
          if (!verbose && !isNotable){
            suppressedCount++;
            continue;
          }
          moonLines.push(emoji + ' ' + esc(moon.name) +
            ' <span style="opacity:.5;">(' + pct + '% ' + esc(pLabel) + ')</span>' + extra);
        }
        if (moonLines.length){
          moonHtml += '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' +
            moonLines.join('<br>') + '</div>';
        }
        if (!verbose && suppressedCount > 0){
          if (moonLines.length === 0){
            moonHtml += '<div style="font-size:.85em;margin-left:8px;opacity:.5;">No notable lunar activity. (' + suppressedCount + ' moons unremarkable)</div>';
          } else {
            moonHtml += '<div style="font-size:.82em;margin-left:8px;opacity:.5;">(+' + suppressedCount + ' moons unremarkable)</div>';
          }
        }

        // Eclipses — always shown
        try {
          var eclNotes = _eclipseNotableToday(today);
          if (eclNotes.length){
            moonHtml += '<div style="font-size:.85em;margin:3px 0 0 8px;color:#FFE082;">' +
              eclNotes.join(' · ') + '</div>';
          }
        } catch(e3){}

        // Current lighting -- inline in minimal mode, separate section in normal mode
        if (!verbose){
          try {
            var precipStg = 0;
            var ltRec = _forecastRecord(today);
            if (ltRec && ltRec.final) precipStg = ltRec.final.precip || 0;
            var lightSnap = currentLightSnapshot(today, precipStg);
            var cloudNote = '';
            var lightLead = '';
            if (precipStg >= 3) cloudNote = ' — heavy cloud';
            else if (precipStg === 2) cloudNote = ' — overcast';
            else if (precipStg === 1) cloudNote = ' — partly cloudy';
            if (lightSnap.mode === 'day'){
              lightLead = lightSnap.emoji ? esc(lightSnap.emoji) + ' ' : '';
              moonHtml += '<div style="font-size:.85em;margin:3px 0 0 8px;">' +
                lightLead + 'Current light: <b>' + esc(lightSnap.label) + '</b></div>';
            } else {
              lightLead = lightSnap.cond.emoji ? lightSnap.cond.emoji + ' ' : '';
              moonHtml += '<div style="font-size:.85em;margin:3px 0 0 8px;">' +
                lightLead + 'Current light: <b>' + esc(lightSnap.label) + '</b>' +
                ' <span style="opacity:.5;">(' + lightSnap.result.total + ' lux)</span>' + esc(cloudNote) + '</div>';
            }
          } catch(e4){}
        }

        sections.push(moonHtml);
      }
    } catch(e){}
  }

  // Current lighting -- separate section in normal mode
  if (verbose && st.moonsEnabled !== false){
    try {
      var lightHtml = nighttimeLightHtml(today);
      if (lightHtml){
        sections.push('<div style="margin:4px 0;"><b>Current Lighting:</b></div>' +
          '<div style="margin-left:8px;">' + lightHtml + '</div>');
      }
    } catch(e){}
  }

  // Planar effects
  if (st.planesEnabled !== false){
    try {
      var plNotes = _planarNotableToday(today);
      var shifts = _activePlanarWeatherShiftLines(today);

      if (verbose) {
        // Normal mode — separate sections
        if (plNotes.length){
          sections.push('<div style="margin:4px 0;"><b>🌀 Planar:</b> ' +
            button('Detail', 'planes') + '</div>' +
            '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' +
            plNotes.join('<br>') + '</div>');
        }
        if (shifts.length){
          sections.push('<div style="font-size:.82em;opacity:.7;margin-left:8px;">' +
            shifts.map(esc).join('<br>') + '</div>');
        }
      } else {
        // Minimal mode — merge shifts inline with phase notes, suppress if empty
        if (plNotes.length || shifts.length){
          var shiftMap = {};
          for (var si = 0; si < shifts.length; si++){
            var shiftText = shifts[si];
            // Extract plane name from shift text (format: "PlaneName phase: effect")
            var shiftMatch = String(shiftText).match(/^(\w+)\s/);
            if (shiftMatch) shiftMap[shiftMatch[1].toLowerCase()] = shiftText.replace(/^[^:]+:\s*/, '');
          }
          var mergedLines = [];
          var usedShiftPlanes = {};
          for (var pni = 0; pni < plNotes.length; pni++){
            var noteHtml = plNotes[pni];
            // Try to find a matching shift to append
            var planeMatch = noteHtml.match(/<b>([^<]+)<\/b>/);
            if (planeMatch){
              var planeLower = planeMatch[1].toLowerCase();
              if (shiftMap[planeLower]){
                noteHtml += ' <span style="opacity:.6;font-size:.9em;">— ' + esc(shiftMap[planeLower]) + '</span>';
                usedShiftPlanes[planeLower] = true;
              }
            }
            mergedLines.push(noteHtml);
          }
          // Any shifts without a corresponding phase note
          for (var sj = 0; sj < shifts.length; sj++){
            var sm2 = String(shifts[sj]).match(/^(\w+)\s/);
            if (sm2 && !usedShiftPlanes[sm2[1].toLowerCase()]){
              mergedLines.push('<span style="opacity:.7;">' + esc(shifts[sj]) + '</span>');
            }
          }
          sections.push('<div style="margin:4px 0;"><b>🌀 Planar:</b> ' +
            button('Detail', 'planes') + '</div>' +
            '<div style="font-size:.85em;margin-left:8px;line-height:1.5;">' +
            mergedLines.join('<br>') + '</div>');
        }
      }
    } catch(e){}
  }

  sections.push('<div style="margin-top:6px;">' +
    button('⬅ Calendar', '') +
    '</div>');

  return _menuBox('📋 Today — ' + esc(_displayMonthDayParts(c.month, c.day_of_the_month).label),
    sections.join(''));
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
    whisper(m.who, activeEffectsPanelHtml());
  }},

  time: { gm:true, run:function(m, a){
    var sub = String(a[2] || '').toLowerCase();
    var bucketArg = normalizeTimeBucketKey(sub);
    if (!sub){
      return whisper(m.who, _timeOfDayMenuHtml());
    }
    if (sub === 'clear' || sub === 'off' || sub === 'stop' || sub === 'disable'){
      clearTimeOfDay();
      return whisper(m.who, 'Time of day cleared for this date.');
    }
    if (sub === 'next' || sub === 'advance' || sub === 'step'){
      var current = currentTimeBucket();
      if (!current){
        return whisper(m.who, _timeOfDayMenuHtml());
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
      if (!picked) return whisper(m.who, _timeOfDayMenuHtml());
      activateTimeOfDay(picked);
      return _sendTimeOfDayStatus(m.who);
    }
    if (bucketArg){
      activateTimeOfDay(bucketArg);
      return _sendTimeOfDayStatus(m.who);
    }
    whisper(m.who, _timeOfDayMenuHtml());
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
      return whisper(m.who,
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
        return whisper(m.who,'Usage: <code>!cal settings density (compact|normal)</code>');
      }
      st.uiDensity = val;
      refreshAndSend();
      return whisper(m.who,'UI density set to <b>'+esc(val)+'</b>.');
    }
    if (key === 'verbosity'){
      if (!/^(normal|minimal)$/.test(val)){
        return whisper(m.who,'Usage: <code>!cal settings verbosity (normal|minimal)</code>');
      }
      st.subsystemVerbosity = val;
      refreshAndSend();
      return whisper(m.who,'Subsystem detail set to <b>'+esc(titleCase(val))+'</b>.');
    }
    if (key === 'weatherdays' || key === 'wxdays'){
      var weatherDays = parseInt(val, 10);
      if (!/^\d+$/.test(val) || weatherDays < 1 || weatherDays > CONFIG_WEATHER_FORECAST_DAYS){
        return whisper(m.who,'Usage: <code>!cal settings weatherdays (1-'+CONFIG_WEATHER_FORECAST_DAYS+')</code>');
      }
      st.weatherForecastViewDays = _weatherViewDays(weatherDays);
      refreshAndSend();
      return whisper(m.who,'Weather forecast span set to <b>'+st.weatherForecastViewDays+' days</b>.');
    }
    if (key === 'mode'){
      var sysTok = String(a[3] || '').toLowerCase();
      var modeTok = String(a[4] || '').toLowerCase();
      if (!/^(moon|lunar|weather|planes|plane|planar)$/.test(sysTok) || !/^(calendar|list|both)$/.test(modeTok)){
        return whisper(m.who,'Usage: <code>!cal settings mode (moon|weather|planes) (calendar|list|both)</code>');
      }
      if (sysTok === 'moon' || sysTok === 'lunar') st.moonDisplayMode = modeTok;
      if (sysTok === 'weather') st.weatherDisplayMode = modeTok;
      if (sysTok === 'planes' || sysTok === 'plane' || sysTok === 'planar') st.planesDisplayMode = modeTok;
      refreshAndSend();
      return whisper(m.who,'Display mode updated: <b>'+esc(titleCase(sysTok))+'</b> → <b>'+esc(titleCase(modeTok))+'</b>.');
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
    whisper(m.who,'Setting updated.');
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
    var msg = 'Calendar: <b>'+esc(sys.label||titleCase(sysKey))+'</b>';
    if (Object.keys(sys.variants||{}).length > 1) msg += ' — '+esc(variant.label||titleCase(vk));
    whisper(m.who, msg+'.');
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
    var suppressedSources = state[state_name].suppressedSources || (state[state_name].suppressedSources = {});

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
        var disabled = !!suppressedSources[k];
        var upBtn    = i > 0
          ? button('↑', 'source up '   + label, {icon:''})
          : '<span style="opacity:.25;">↑</span>';
        var downBtn  = i < keys.length - 1
          ? button('↓', 'source down ' + label, {icon:''})
          : '<span style="opacity:.25;">↓</span>';
        var togBtn   = disabled
          ? button('Enable',  'source enable '  + label)
          : button('Disable', 'source disable ' + label);
        return '<tr>'+
          '<td style="'+STYLES.td+';text-align:center;">'+rankCell+'</td>'+
          '<td style="'+STYLES.td+'">'+esc(label)+'</td>'+
          '<td style="'+STYLES.td+';text-align:center;">'+(disabled?'Off':'On')+'</td>'+
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
      suppressedSources[key] = 1;
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
      delete suppressedSources[key];
      var sup = state[state_name].suppressedDefaults || {};
      Object.keys(sup).forEach(function(k){
        var info = _defaultDetailsForKey(k);
        var src = (info.source != null) ? String(info.source).toLowerCase() : null;
        if (src === key) delete sup[k];
      });
      mergeInNewDefaultEvents(getCal());
      refreshAndSend();
      sendChat(script_name, '/w gm Enabled source "'+esc(name)+'" and restored its default events.');
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



