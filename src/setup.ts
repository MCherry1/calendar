import { CALENDAR_SYSTEMS, CALENDAR_SYSTEM_ORDER, CONFIG_DEFAULTS, CONFIG_START_DATE } from './config.js';
import { COLOR_THEMES, SEASON_SETS, state_name } from './constants.js';
import { _invalidateSerialCache, toSerial } from './date-math.js';
import { mergeInNewDefaultEvents } from './events.js';
import { cleanWho, sendUiToAll, sendUiToGM, whisperUi } from './messaging.js';
import { Parse } from './parsing.js';
import { button, esc } from './rendering.js';
import { applyCalendarSystem, applySeasonSet, checkInstall, deepClone, defaults, ensureSettings, getCal, getManualSuppressedSources, getSetupState, setupIsComplete, titleCase } from './state.js';
import { _displayMonthDayParts, _menuBox, dateLabelFromSerial, nextForDayOnly, nextForMonthDay, sendCurrentDate, setDate } from './ui.js';
import { getWorld, WORLD_ORDER, WORLDS } from './worlds/index.js';

function _setupDraft(){
  return getSetupState().draft;
}

function _setupSystem(sysKey){
  return CALENDAR_SYSTEMS[String(sysKey || '').toLowerCase()] || null;
}

function _setupVariantKey(sysKey, variantKey){
  var sys = _setupSystem(sysKey);
  if (!sys) return null;
  var variants = sys.variants || {};
  var requested = String(variantKey || '').toLowerCase();
  if (requested && variants[requested]) return requested;
  return String(sys.defaultVariant || Object.keys(variants)[0] || 'standard').toLowerCase();
}

function _setupNeedsVariant(sysKey){
  var sys = _setupSystem(sysKey);
  return !!(sys && Object.keys(sys.variants || {}).length > 1);
}

function _seasonOptionsForSystem(sysKey){
  var world = getWorld(String(sysKey || '').toLowerCase());
  var defaultKey = world ? world.defaultSeasonKey : 'eberron';
  // Eberron seasons are fixed by planar movements — no user choice needed.
  if (defaultKey === 'eberron') return ['eberron'];
  // World's own season set first, then generic geographic options.
  var opts = [defaultKey];
  if (opts.indexOf('faerun') < 0) opts.push('faerun');
  opts.push('tropical');
  return opts;
}

function _seasonSetLabel(key){
  var set = SEASON_SETS[key];
  if (set && set.label) return set.label;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function _setupThemeLabel(themeKey){
  if (!themeKey || themeKey === 'default') return 'Use calendar default';
  return String(themeKey).charAt(0).toUpperCase() + String(themeKey).slice(1);
}

function _clearObjectKeys(obj){
  Object.keys(obj || {}).forEach(function(key){ delete obj[key]; });
}

function _withSetupCalendar(sysKey, variantKey, fn){
  var origState = state[state_name];
  var origSetup = origState ? origState.setup : undefined;
  try {
    state[state_name] = deepClone(origState || {});
    if (!state[state_name]) state[state_name] = {};
    if (!state[state_name].setup) state[state_name].setup = deepClone(origSetup || { status: 'in_progress', draft: {} });
    ensureSettings();
    state[state_name].calendar = deepClone(defaults);
    applyCalendarSystem(sysKey, variantKey);
    getCal().current = deepClone(defaults.current);
    return fn();
  } finally {
    state[state_name] = origState || {};
    if (origSetup) state[state_name].setup = origSetup;
    _invalidateSerialCache();
  }
}

function _parseSetupDate(raw, sysKey, variantKey){
  var text = String(raw || '').trim();
  if (!text) return null;
  return _withSetupCalendar(sysKey, variantKey, function(){
    var toks = text.split(/\s+/).filter(Boolean);
    var parsed = Parse.looseMDY(toks);
    if (!parsed) return null;
    var cal = getCal();
    var cur = cal.current;
    var months = cal.months;
    if (parsed.kind === 'dayOnly'){
      var next = nextForDayOnly(cur, parsed.day, months.length);
      return {
        month: next.month,
        day: Math.max(1, Math.min(parsed.day, months[next.month].days|0)),
        year: next.year
      };
    }
    var year = (parsed.year != null) ? parsed.year : nextForMonthDay(cur, parsed.mi, parsed.day).year;
    var mobj = months[parsed.mi];
    if (mobj && mobj.leapEvery && !(year % mobj.leapEvery === 0)){
      return null;
    }
    return {
      month: parsed.mi,
      day: Math.max(1, Math.min(parsed.day, months[parsed.mi].days|0)),
      year: year
    };
  });
}

function _setupDateLabel(dateParts, sysKey, variantKey){
  if (!dateParts) return 'Not set';
  return _withSetupCalendar(sysKey, variantKey, function(){
    var label = _displayMonthDayParts(dateParts.month, dateParts.day).label;
    return label + ' ' + dateParts.year;
  });
}

function _setupDefaultDate(sysKey, variantKey){
  return _withSetupCalendar(sysKey, variantKey, function(){
    return {
      month: CONFIG_START_DATE.month,
      day: CONFIG_START_DATE.day_of_the_month,
      year: CONFIG_START_DATE.year,
      label: _displayMonthDayParts(CONFIG_START_DATE.month, CONFIG_START_DATE.day_of_the_month).label + ' ' + CONFIG_START_DATE.year
    };
  });
}

function _setupCurrentStep(draft){
  var sysKey = _setupVariantKey(draft.calendarSystem, draft.calendarVariant) ? String(draft.calendarSystem || '').toLowerCase() : '';
  var sys = _setupSystem(sysKey);
  if (!sys) return 'calendar';
  if (Object.keys(sys.variants || {}).length > 1 && !draft.calendarVariant) return 'variant';
  if (!draft.date) return 'date';
  if (!draft.seasonVariant){
    // Eberron seasons are fixed — auto-assign and skip the step.
    var _seasonOpts = _seasonOptionsForSystem(sysKey);
    if (_seasonOpts.length === 1){ draft.seasonVariant = _seasonOpts[0]; }
    else return 'season';
  }
  var seasonEntry = SEASON_SETS[String(draft.seasonVariant || '').toLowerCase()] || {};
  if (seasonEntry.hemisphereAware && !draft.hemisphere) return 'hemisphere';
  if (draft.colorTheme === undefined) return 'theme';
  if (draft.defaultEventsEnabled === undefined) return 'defaults';
  if (draft.moonsEnabled === undefined) return 'moons';
  var _stepCaps = (getWorld(sysKey) || {}).capabilities;
  if (_stepCaps && _stepCaps.planes && draft.planesEnabled === undefined) return 'planes';
  // World-defined extra steps (e.g. Dragonlance conjunction anchor)
  var world = getWorld(sysKey);
  var extras = (world && world.setup && world.setup.extraSteps) || [];
  for (var xi = 0; xi < extras.length; xi++){
    if (draft['extra_' + extras[xi].key] === undefined) return 'extra:' + extras[xi].key;
  }
  return 'review';
}

function _setupSummaryHtml(draft){
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var sys = _setupSystem(sysKey) || {};
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  var variant = sys.variants && sys.variants[variantKey] ? sys.variants[variantKey] : {};
  var dateLabel = draft.date ? _setupDateLabel(draft.date, sysKey, variantKey) : 'Not set';
  var bits = [];
  bits.push('<div><b>Setting:</b> ' + esc(sys.label || sysKey || 'Not set') + '</div>');
  if (variantKey){
    bits.push('<div><b>Calendar:</b> ' + esc(variant.label || variantKey) + '</div>');
  }
  bits.push('<div><b>Date:</b> ' + esc(dateLabel) + '</div>');
  bits.push('<div><b>Season model:</b> ' + esc(String(draft.seasonVariant || 'Not set')) + '</div>');
  if (draft.hemisphere) bits.push('<div><b>Hemisphere:</b> ' + esc(draft.hemisphere) + '</div>');
  bits.push('<div><b>Theme:</b> ' + esc(_setupThemeLabel(draft.colorTheme)) + '</div>');
  bits.push('<div><b>Built-in default events:</b> ' + esc(draft.defaultEventsEnabled === false ? 'Disabled' : 'Enabled') + '</div>');
  bits.push('<div><b>Lunar tracking:</b> ' + esc(draft.moonsEnabled === false ? 'Off' : 'On') + '</div>');
  var _sumCaps = (getWorld(sysKey) || {}).capabilities;
  if (_sumCaps && _sumCaps.planes){
    bits.push('<div><b>Planar tracking:</b> ' + esc(draft.planesEnabled === false ? 'Off' : 'On') + '</div>');
  }
  return bits.join('');
}

function _setupPromptButton(label, cmd, hint){
  return '<div style="margin:3px 0;">' + button(label, cmd) +
    (hint ? ' <span style="opacity:.68;font-size:.82em;">' + esc(hint) + '</span>' : '') +
    '</div>';
}

function _setupCalendarSelectionNotice(sysKey, variantKey){
  var sys = _setupSystem(sysKey) || {};
  var variant = (sys.variants && sys.variants[variantKey]) || {};
  var calendarLabel = variant.label || titleCase(variantKey || sys.defaultVariant || 'standard');
  var settingLabel = sys.label || titleCase(sysKey || '');
  var worldLabel = sys.worldLabel || '';
  var continentLabel = sys.continentLabel || '';
  var hierarchy = '';
  if (continentLabel && worldLabel && settingLabel){
    hierarchy = ' The default calendar of ' + esc(continentLabel) + ', on ' + esc(worldLabel) + ', set in the ' + esc(settingLabel) + '.';
  } else if (worldLabel && settingLabel){
    hierarchy = ' The default calendar of ' + esc(worldLabel) + ' (' + esc(settingLabel) + ').';
  }
  var detail = variant.description || '';
  return '<b>' + esc(calendarLabel) + '</b> selected.' +
    hierarchy +
    (detail ? ' ' + esc(detail) : '') +
    ' Use <code>!cal setup restart</code> to choose a different setting.';
}

function _setupCalendarStepHtml(draft){
  var rows = WORLD_ORDER.map(function(sysKey){
    var world = WORLDS[sysKey];
    var label = world ? world.label : sysKey;
    var desc = world ? world.description : '';
    return _setupPromptButton(label, 'setup calendar ' + sysKey, desc);
  }).join('');
  return _menuBox('Calendar Setup - Step 1: Setting',
    '<div style="margin-bottom:6px;">Choose the campaign setting first. If that setting only has one calendar, Calendar selects it automatically.</div>' + rows
  );
}

function _setupVariantStepHtml(draft){
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var sys = _setupSystem(sysKey);
  var rows = Object.keys((sys && sys.variants) || {}).map(function(variantKey){
    var variant = sys.variants[variantKey];
    return _setupPromptButton(
      variant.label || variantKey,
      'setup variant ' + variantKey,
      variant.description || (variant.monthNames || []).slice(0, 4).join(', ')
    );
  }).join('');
  return _menuBox('Calendar Setup - Step 2: Calendar',
    '<div style="margin-bottom:6px;">Choose the calendar used in ' + esc(sys.label || sysKey) + '.</div>' + rows
  );
}

function _setupDateStepHtml(draft){
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  var defaultDate = _setupDefaultDate(sysKey, variantKey);
  var mm = String(defaultDate.month + 1);
  var dd = String(defaultDate.day);
  var yyyy = String(defaultDate.year);
  var promptDefault = mm + ' ' + dd + ' ' + yyyy;
  return _menuBox('Calendar Setup - Step 3: Current In-Game Date',
    '<div style="margin-bottom:6px;">Enter a starting date as <code>MM DD YYYY</code>.</div>' +
    '<div style="margin-bottom:6px;">Default start: <b>' + esc(defaultDate.label) + '</b> (' + esc(promptDefault) + ')</div>' +
    '<div>' +
      button('Use Default Start', 'setup date default') + ' ' +
      button('Enter Date (MM DD YYYY)', 'setup date use ?{MM DD YYYY|' + promptDefault + '}') +
    '</div>'
  );
}

function _setupSeasonStepHtml(draft){
  var options = _seasonOptionsForSystem(draft.calendarSystem);
  var rows = options.map(function(key){
    return _setupPromptButton(_seasonSetLabel(key), 'setup season ' + key, '');
  }).join('');
  return _menuBox('Calendar Setup - Step 4: Season Model',
    '<div style="margin-bottom:6px;">Choose the season model that best matches the campaign world.</div>' + rows
  );
}

function _setupHemisphereStepHtml(){
  return _menuBox('Calendar Setup - Step 5: Hemisphere',
    '<div style="margin-bottom:6px;">This season model is hemisphere-aware. Which hemisphere should it use?</div>' +
    button('North', 'setup hemisphere north') + ' ' +
    button('South', 'setup hemisphere south')
  );
}

function _setupThemeStepHtml(){
  var rows = [
    _setupPromptButton('Use calendar default', 'setup theme default', '')
  ];
  Object.keys(COLOR_THEMES).forEach(function(themeKey){
    rows.push(_setupPromptButton(themeKey, 'setup theme ' + themeKey, ''));
  });
  return _menuBox('Calendar Setup - Step 6: Color Theme',
    '<div style="margin-bottom:6px;">Pick a theme now, or keep the calendar default.</div>' + rows.join('')
  );
}

function _setupDefaultsStepHtml(){
  return _menuBox('Calendar Setup - Step 7: Built-In Default Events',
    '<div style="margin-bottom:6px;">Should Calendar load its built-in default event packs?</div>' +
    button('Enable Default Events', 'setup defaults on') + ' ' +
    button('Keep Event System but Disable Defaults', 'setup defaults off')
  );
}

function _setupMoonsStepHtml(){
  return _menuBox('Calendar Setup - Step 8: Lunar Tracking',
    '<div style="margin-bottom:6px;">Enable lunar tracking for this campaign?</div>' +
    button('Moons On', 'setup moons on') + ' ' +
    button('Moons Off', 'setup moons off')
  );
}

function _setupPlanesStepHtml(){
  return _menuBox('Calendar Setup - Step 9: Planar Tracking',
    '<div style="margin-bottom:6px;">Enable planar tracking for this Eberron campaign?</div>' +
    button('Planes On', 'setup planes on') + ' ' +
    button('Planes Off', 'setup planes off')
  );
}

function _setupReviewStepHtml(draft){
  return _menuBox('Calendar Setup - Review',
    '<div style="margin-bottom:6px;">Review the setup choices before Calendar mutates live campaign state.</div>' +
    _setupSummaryHtml(draft) +
    '<div style="margin-top:8px;">' +
      button('Apply Setup', 'setup apply') + ' ' +
      button('Start Over', 'setup restart') +
    '</div>'
  );
}

function _setupExtraStepHtml(draft, stepKey){
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var world = getWorld(sysKey);
  var extras = (world && world.setup && world.setup.extraSteps) || [];
  var stepDef = null;
  for (var i = 0; i < extras.length; i++){
    if (extras[i].key === stepKey){ stepDef = extras[i]; break; }
  }
  if (!stepDef) return _menuBox('Calendar Setup', '<div>Unknown step.</div>');
  var rows = '';
  if (stepDef.type === 'choice' && stepDef.options){
    rows = stepDef.options.map(function(opt){
      return _setupPromptButton(opt.label, 'setup extra ' + stepKey + ' ' + opt.key, '');
    }).join('');
  } else if (stepDef.type === 'toggle'){
    rows = button('Yes', 'setup extra ' + stepKey + ' yes') + ' ' +
           button('No', 'setup extra ' + stepKey + ' no');
  } else if (stepDef.type === 'query'){
    rows = button('Enter', 'setup extra ' + stepKey + ' ?{' + (stepDef.label || stepKey) + '|' + (stepDef.default || '') + '}');
  }
  return _menuBox('Calendar Setup - ' + (stepDef.label || stepKey), rows);
}

function _renderSetupWizard(draft, notice){
  var step = _setupCurrentStep(draft);
  var body = '';
  if (step === 'calendar') body = _setupCalendarStepHtml(draft);
  else if (step === 'variant') body = _setupVariantStepHtml(draft);
  else if (step === 'date') body = _setupDateStepHtml(draft);
  else if (step === 'season') body = _setupSeasonStepHtml(draft);
  else if (step === 'hemisphere') body = _setupHemisphereStepHtml();
  else if (step === 'theme') body = _setupThemeStepHtml();
  else if (step === 'defaults') body = _setupDefaultsStepHtml();
  else if (step === 'moons') body = _setupMoonsStepHtml();
  else if (step === 'planes') body = _setupPlanesStepHtml();
  else if (step.indexOf('extra:') === 0) body = _setupExtraStepHtml(draft, step.slice(6));
  else body = _setupReviewStepHtml(draft);
  if (!notice) return body;
  return _menuBox('Calendar Setup', '<div style="margin-bottom:6px;">' + notice + '</div>') + body;
}

function _showSetupWizard(m, notice?){
  whisperUi(cleanWho(m.who), _renderSetupWizard(_setupDraft(), notice));
}

function _setupWaitingHtml(){
  return _menuBox('Calendar Setup',
    '<div style="opacity:.78;">Calendar is waiting for the GM to finish setup. Please check back in once initialization is complete.</div>'
  );
}

function _setupWelcomeHtml(){
  return _menuBox('Calendar Setup',
    '<div style="margin-bottom:6px;">Welcome to Party Buff\'s Calendar! It looks like this is the first time the calendar has been used in this game. Would you like to initialize it?</div>' +
    button('Yes', 'setup start') + ' ' + button('No', 'setup dismiss')
  );
}

function _setupResumeHtml(draft){
  var step = _setupCurrentStep(draft).replace(/-/g, ' ');
  return _menuBox('Calendar Setup',
    '<div style="margin-bottom:6px;">Calendar setup is already in progress. Resume at <b>' + esc(step) + '</b>?</div>' +
    button('Resume', 'setup start') + ' ' + button('Start Over', 'setup restart') + ' ' + button('Not Now', 'setup dismiss')
  );
}

function _beginSetup(m, restart){
  var setup = getSetupState();
  if (restart){
    setup.draft = {};
  }
  setup.status = 'in_progress';
  var draft = setup.draft;
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  if (sysKey && !_setupNeedsVariant(sysKey)){
    draft.calendarVariant = _setupVariantKey(sysKey, draft.calendarVariant);
  }
  _showSetupWizard(m);
}

function _applySetupDraft(m){
  var setup = getSetupState();
  var draft = deepClone(setup.draft || {});
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  if (_setupCurrentStep(draft) !== 'review'){
    _showSetupWizard(m, 'Setup is still missing a few answers.');
    return;
  }

  delete state[state_name];
  state[state_name] = {
    setup: {
      status: 'complete',
      draft: {}
    }
  };
  ensureSettings();
  checkInstall();

  var st = ensureSettings();
  applyCalendarSystem(sysKey, variantKey);
  st.calendarSystem = sysKey;
  st.calendarVariant = variantKey;
  st.seasonVariant = String(draft.seasonVariant || (CALENDAR_SYSTEMS[sysKey] || {}).defaultSeason || CONFIG_DEFAULTS.seasonVariant).toLowerCase();
  st.hemisphere = String(draft.hemisphere || CONFIG_DEFAULTS.hemisphere).toLowerCase();
  st.colorTheme = (!draft.colorTheme || draft.colorTheme === 'default') ? null : String(draft.colorTheme).toLowerCase();
  st.eventsEnabled = true;
  st.moonsEnabled = draft.moonsEnabled !== false;
  st._moonsAutoToggle = false;
  var _applyCaps = (getWorld(sysKey) || {}).capabilities;
  st.planesEnabled = (_applyCaps && _applyCaps.planes) ? (draft.planesEnabled !== false) : false;
  st._planesAutoToggle = false;

  applySeasonSet(st.seasonVariant);

  var manualSuppressedSources = getManualSuppressedSources();
  _clearObjectKeys(manualSuppressedSources);

  var cal = getCal();
  cal.events = [];
  if (draft.defaultEventsEnabled === false){
    var seenSources = {};
    defaults.events.forEach(function(evt){
      if (!evt.source) return;
      seenSources[String(evt.source).toLowerCase()] = 1;
    });
    Object.keys(seenSources).forEach(function(sourceKey){
      manualSuppressedSources[sourceKey] = 1;
    });
  }
  mergeInNewDefaultEvents(cal);

  setDate((draft.date.month|0) + 1, draft.date.day, draft.date.year, { announce: false });

  delete state[state_name].moons;
  delete state[state_name].planes;

  getSetupState().status = 'complete';
  getSetupState().draft = {};
  whisperUi(cleanWho(m.who), _menuBox('Calendar Setup', '<div>Setup applied. Calendar is ready.</div>'));
  if (sysKey === 'dragonlance' && String(draft.extra_nightOfTheEye || '') === 'manual'){
    whisperUi(cleanWho(m.who), _menuBox('Night of the Eye',
      '<div style="margin-bottom:6px;">Dragonlance is using the built-in Night of the Eye by default. Override it any time with:</div>' +
      '<code>!cal moon eye &lt;dateSpec&gt;</code>'
    ));
  }
  sendCurrentDate(cleanWho(m.who), false, { playerid: m.playerid, dashboard: true, includeButtons: true });
}

export function notifySetupStatusOnReady(){
  if (setupIsComplete()){
    var st = ensureSettings();
    var sys = CALENDAR_SYSTEMS[st.calendarSystem] || {};
    var variant = ((sys.variants || {})[st.calendarVariant]) || {};
    var calLabel = String(variant.label || sys.label || 'Calendar');
    sendUiToAll(_bootSummaryHtml(calLabel));
    return;
  }
  var setup = getSetupState();
  if (setup.status === 'dismissed') return;
  if (setup.status === 'in_progress'){
    sendUiToGM(_setupResumeHtml(setup.draft));
    return;
  }
  sendUiToGM(_setupWelcomeHtml());
}

function _bootSummaryHtml(calLabel){
  var cal = getCal();
  var cur = cal.current;
  var dateLine = dateLabelFromSerial(toSerial(cur.year, cur.month, cur.day_of_the_month));
  return '<div style="border:1px solid #555;border-radius:4px;padding:6px;margin:6px 0;">' +
    '<div style="font-style:italic;margin-bottom:4px;">' + esc(calLabel) + ' Initialized</div>' +
    '<div style="opacity:.85;">Current date: <b>' + esc(dateLine) + '</b></div>' +
    '<div style="margin-top:6px;">Use <code>!cal</code> to start. Use <code>!cal help</code> for the command list.</div>' +
  '</div>';
}

export function maybeHandleSetupGate(msg, args){
  if (setupIsComplete()) return false;
  if (!playerIsGM(msg.playerid)){
    whisperUi(cleanWho(msg.who), _setupWaitingHtml());
    return true;
  }

  var sub = String(args[1] || '').toLowerCase();
  if (sub === 'setup'){
    var setup = getSetupState();
    var action = String(args[2] || '').toLowerCase();
    if (!action || action === 'start' || action === 'resume'){
      _beginSetup(msg, false);
      return true;
    }
    if (action === 'restart'){
      _beginSetup(msg, true);
      return true;
    }
    if (action === 'dismiss' || action === 'later'){
      setup.status = 'dismissed';
      whisperUi(cleanWho(msg.who), 'No problem! Just call !cal at any time to begin the process.');
      return true;
    }
    if (action === 'calendar'){
      setup.status = 'in_progress';
      setup.draft.calendarSystem = String(args[3] || '').toLowerCase();
      setup.draft.calendarVariant = _setupNeedsVariant(setup.draft.calendarSystem)
        ? ''
        : _setupVariantKey(setup.draft.calendarSystem, null);
      delete setup.draft.date;
      delete setup.draft.seasonVariant;
      delete setup.draft.hemisphere;
      delete setup.draft.planesEnabled;
      if (setup.draft.calendarVariant){
        return _showSetupWizard(msg, _setupCalendarSelectionNotice(setup.draft.calendarSystem, setup.draft.calendarVariant)), true;
      }
      return _showSetupWizard(msg), true;
    }
    if (action === 'variant'){
      setup.status = 'in_progress';
      setup.draft.calendarVariant = _setupVariantKey(setup.draft.calendarSystem, args[3]);
      delete setup.draft.date;
      return _showSetupWizard(msg), true;
    }
    if (action === 'date'){
      setup.status = 'in_progress';
      var sysKey = String(setup.draft.calendarSystem || '').toLowerCase();
      var variantKey = _setupVariantKey(sysKey, setup.draft.calendarVariant);
      if (String(args[3] || '').toLowerCase() === 'default'){
        var defaultDate = _setupDefaultDate(sysKey, variantKey);
        setup.draft.date = {
          month: defaultDate.month,
          day: defaultDate.day,
          year: defaultDate.year
        };
        return _showSetupWizard(msg), true;
      }
      var parsed = _parseSetupDate(args.slice(4).join(' '), sysKey, variantKey);
      if (!parsed){
        _showSetupWizard(msg, 'Could not parse that date. Try the same formats accepted by <code>!cal set</code>.');
        return true;
      }
      setup.draft.date = parsed;
      return _showSetupWizard(msg), true;
    }
    if (action === 'season'){
      setup.status = 'in_progress';
      setup.draft.seasonVariant = String(args[3] || '').toLowerCase();
      var seasonEntry = SEASON_SETS[setup.draft.seasonVariant] || {};
      if (!seasonEntry.hemisphereAware) delete setup.draft.hemisphere;
      return _showSetupWizard(msg), true;
    }
    if (action === 'hemisphere'){
      setup.status = 'in_progress';
      setup.draft.hemisphere = String(args[3] || '').toLowerCase();
      return _showSetupWizard(msg), true;
    }
    if (action === 'theme'){
      setup.status = 'in_progress';
      setup.draft.colorTheme = String(args[3] || '').toLowerCase();
      return _showSetupWizard(msg), true;
    }
    if (action === 'defaults'){
      setup.status = 'in_progress';
      setup.draft.defaultEventsEnabled = String(args[3] || '').toLowerCase() !== 'off';
      return _showSetupWizard(msg), true;
    }
    if (action === 'moons'){
      setup.status = 'in_progress';
      setup.draft.moonsEnabled = String(args[3] || '').toLowerCase() !== 'off';
      return _showSetupWizard(msg), true;
    }
    if (action === 'planes'){
      setup.status = 'in_progress';
      setup.draft.planesEnabled = String(args[3] || '').toLowerCase() !== 'off';
      return _showSetupWizard(msg), true;
    }
    if (action === 'review'){
      setup.status = 'in_progress';
      return _showSetupWizard(msg), true;
    }
    if (action === 'apply'){
      _applySetupDraft(msg);
      return true;
    }
    if (action === 'extra'){
      setup.status = 'in_progress';
      var extraKey = String(args[3] || '');
      var extraVal = String(args[4] || '');
      if (extraKey && extraVal){
        setup.draft['extra_' + extraKey] = extraVal;
      }
      return _showSetupWizard(msg), true;
    }
    _beginSetup(msg, false);
    return true;
  }

  _beginSetup(msg, false);
  return true;
}
