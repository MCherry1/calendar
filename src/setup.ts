import { CALENDAR_SYSTEMS, CALENDAR_SYSTEM_ORDER, CONFIG_DEFAULTS, CONFIG_START_DATE } from './config.js';
import { COLOR_THEMES, SEASON_SETS, state_name } from './constants.js';
import { _invalidateSerialCache, toSerial } from './date-math.js';
import { mergeInNewDefaultEvents } from './events.js';
import { cleanWho, sendUiToAll, sendUiToGM, whisperUi } from './messaging.js';
import { Parse } from './parsing.js';
import { _getPlaneData, getPlanesState, resolveEberronPlanarInitialization, resolveFerniaRisiaLinkModeChoice } from './planes.js';
import { button, esc } from './rendering.js';
import { applyCalendarSystem, applySeasonSet, checkInstall, deepClone, defaults, ensureSettings, getCal, getManualSuppressedSources, getSetupState, setupIsComplete, titleCase } from './state.js';
import { _displayMonthDayParts, _menuBox, dateLabelFromSerial, nextForDayOnly, nextForMonthDay, sendCurrentDate, setDate } from './ui.js';
import { _normalizeWeatherLocation, _rememberRecentWeatherLocation, _weatherLocationLabel, getWeatherState, weatherEnsureForecast, weatherLocationWizardHtml } from './weather.js';
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

function _setupWeatherModeLabel(mode){
  if (mode === 'mechanics') return 'Narrative + mechanics';
  if (mode === 'narrative') return 'Narrative only';
  return 'Off';
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

var EBERRON_PLANAR_SETUP_ORDER = [
  { key: 'link', title: 'Fernia/Risia Link' },
  { key: 'climate', title: 'Fernia/Risia Climate' },
  { key: 'plane:Daanvi', title: 'Daanvi' },
  { key: 'plane:Dolurrh', title: 'Dolurrh' },
  { key: 'plane:Irian', title: 'Irian' },
  { key: 'plane:Shavarath', title: 'Shavarath' },
  { key: 'plane:Syrania', title: 'Syrania' },
  { key: 'plane:Thelanis', title: 'Thelanis' },
  { key: 'mabar', title: 'Mabar Remote' }
];

function _setupResetEberronPlanarInit(draft){
  delete draft.eberronPlanarInit;
}

function _setupShouldRunEberronPlanarInit(draft){
  return String(draft.calendarSystem || '').toLowerCase() === 'eberron' &&
    !!draft.date &&
    draft.planesEnabled !== undefined &&
    draft.planesEnabled !== false;
}

function _setupEberronPlanarInitState(draft){
  if (!draft.eberronPlanarInit || typeof draft.eberronPlanarInit !== 'object'){
    draft.eberronPlanarInit = {};
  }
  if (!draft.eberronPlanarInit.planeChoices || typeof draft.eberronPlanarInit.planeChoices !== 'object'){
    draft.eberronPlanarInit.planeChoices = {};
  }
  return draft.eberronPlanarInit;
}

function _setupEberronPlanarSelections(draft){
  var init = _setupEberronPlanarInitState(draft);
  return {
    linkModeChoice: String(init.linkModeChoice || 'roll').toLowerCase(),
    climateChoice: String(init.climateChoice || 'roll').toLowerCase(),
    planeChoices: deepClone(init.planeChoices || {}),
    mabarChoice: String(init.mabarChoice || 'roll').toLowerCase()
  };
}

function _setupEberronResolvedLinkMode(draft){
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  var selections = _setupEberronPlanarSelections(draft);
  return _withSetupCalendar(sysKey, variantKey, function(){
    return resolveFerniaRisiaLinkModeChoice(selections.linkModeChoice);
  });
}

function _setupNextEberronPlanarStep(draft){
  if (!_setupShouldRunEberronPlanarInit(draft)) return null;
  var init = _setupEberronPlanarInitState(draft);
  if (!init.linkModeChoice) return 'link';
  if (!init.climateChoice) return 'climate';
  var planeChoices = init.planeChoices || {};
  for (var i = 0; i < EBERRON_PLANAR_SETUP_ORDER.length; i++){
    var key = EBERRON_PLANAR_SETUP_ORDER[i].key;
    if (key.indexOf('plane:') === 0){
      var planeName = key.slice(6);
      if (!planeChoices[planeName]) return key;
    }
  }
  if (!init.mabarChoice) return 'mabar';
  return null;
}

function _setupEberronPlanarMeta(stepKey){
  for (var i = 0; i < EBERRON_PLANAR_SETUP_ORDER.length; i++){
    if (EBERRON_PLANAR_SETUP_ORDER[i].key === stepKey){
      return {
        index: i + 1,
        total: EBERRON_PLANAR_SETUP_ORDER.length,
        title: EBERRON_PLANAR_SETUP_ORDER[i].title
      };
    }
  }
  return { index: 1, total: EBERRON_PLANAR_SETUP_ORDER.length, title: 'Planar Initialization' };
}

function _setupMonthDayLabelForCalendar(sysKey, variantKey, monthIndex, day){
  return _withSetupCalendar(sysKey, variantKey, function(){
    return _displayMonthDayParts(monthIndex, day).label;
  });
}

function _setupEberronYearOneWindowLabel(draft){
  if (!_setupShouldRunEberronPlanarInit(draft)) return '';
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  return _withSetupCalendar(sysKey, variantKey, function(){
    var startSerial = toSerial(draft.date.year, draft.date.month, draft.date.day);
    var endSerial = startSerial + getCal().months.reduce(function(sum, month){ return sum + (month.days|0); }, 0) - 1;
    return dateLabelFromSerial(startSerial) + ' through ' + dateLabelFromSerial(endSerial);
  });
}

function _setupEberronPlanarResolution(draft){
  if (!_setupShouldRunEberronPlanarInit(draft)) return null;
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  var selections = _setupEberronPlanarSelections(draft);
  return _withSetupCalendar(sysKey, variantKey, function(){
    return resolveEberronPlanarInitialization(
      toSerial(draft.date.year, draft.date.month, draft.date.day),
      selections
    );
  });
}

function _setupEberronPlanarChoiceLabel(kind, choice, effectiveLinkMode?){
  choice = String(choice || 'roll').toLowerCase();
  if (kind === 'link'){
    if (choice === 'linked') return 'Linked';
    if (choice === 'independent') return 'Independent';
    return 'Roll for it';
  }
  if (kind === 'climate'){
    if (choice === 'fernia-coterminous') return 'Fernia coterminous in year one';
    if (choice === 'fernia-remote') return 'Fernia remote in year one';
    if (choice === 'risia-coterminous') return 'Risia coterminous in year one';
    if (choice === 'risia-remote') return 'Risia remote in year one';
    if (choice === 'neither') return 'Neither in year one';
    return 'Roll for it';
  }
  if (choice === 'coterminous') return 'Coterminous in year one';
  if (choice === 'remote') return 'Remote in year one';
  if (choice === 'neither') return 'Neither in year one';
  return 'Roll for it';
}

function _setupEberronPlanarPromptBody(draft, stepKey){
  var sysKey = String(draft.calendarSystem || '').toLowerCase();
  var variantKey = _setupVariantKey(sysKey, draft.calendarVariant);
  var windowLabel = _setupEberronYearOneWindowLabel(draft);
  var linkResolved = _setupEberronResolvedLinkMode(draft);
  var ferniaMonth = _setupMonthDayLabelForCalendar(sysKey, variantKey, 6, 1);
  var risiaMonth = _setupMonthDayLabelForCalendar(sysKey, variantKey, 0, 1);
  var irianCot = _setupMonthDayLabelForCalendar(sysKey, variantKey, 3, 1);
  var irianRem = _setupMonthDayLabelForCalendar(sysKey, variantKey, 9, 1);
  var syraniaDay = _setupMonthDayLabelForCalendar(sysKey, variantKey, 8, 9);
  var mabarRemote = _setupMonthDayLabelForCalendar(sysKey, variantKey, 5, 27);
  var intro = '<div style="margin-bottom:6px;">Year one runs from <b>' + esc(windowLabel) + '</b>.</div>';
  if (stepKey === 'link'){
    return intro +
      '<div style="margin-bottom:6px;">Fernia is coterminous for 28 days starting at ' + esc(ferniaMonth) + ' every 5 years. Risia is coterminous for 28 days starting at ' + esc(risiaMonth) + ' every 5 years.</div>' +
      '<div style="margin-bottom:6px;">Should those two planes stay linked as opposite halves of the same climate cycle, or roll independently for this campaign seed?</div>';
  }
  if (stepKey === 'climate'){
    var modeText = linkResolved.effectiveMode === 'linked'
      ? 'Linked mode is active for this setup. Fernia and Risia stay opposite on the same 5-year cycle.'
      : 'Independent mode is active for this setup. Fernia and Risia each keep their own seeded 5-year cycle.';
    return intro +
      '<div style="margin-bottom:6px;">' + esc(modeText) + '</div>' +
      '<div style="margin-bottom:6px;">Fernia uses ' + esc(ferniaMonth) + ' for coterminous years; Risia uses ' + esc(risiaMonth) + ' for coterminous years.</div>' +
      '<div style="margin-bottom:6px;">Which climate event, if any, should land during year one?</div>';
  }
  if (stepKey === 'plane:Daanvi'){
    return intro +
      '<div style="margin-bottom:6px;">Daanvi is coterminous for 100 years once every 400 years. Its remote century begins 100 years later.</div>' +
      '<div style="margin-bottom:6px;">Do you want one of those century-scale phases to intersect year one?</div>';
  }
  if (stepKey === 'plane:Dolurrh'){
    return intro +
      '<div style="margin-bottom:6px;">Dolurrh is coterminous for 1 year once every 100 years. Its remote year begins 50 years later.</div>' +
      '<div style="margin-bottom:6px;">Do you want either of those non-annual phases to intersect year one?</div>';
  }
  if (stepKey === 'plane:Irian'){
    return intro +
      '<div style="margin-bottom:6px;">Irian is coterminous for 10 days in ' + esc(irianCot) + ' once every 3 years, then remote for 10 days in ' + esc(irianRem) + ' 1.5 years later. The start day floats within the month.</div>' +
      '<div style="margin-bottom:6px;">Do you want one of those short Irian windows to land during year one?</div>';
  }
  if (stepKey === 'plane:Shavarath'){
    return intro +
      '<div style="margin-bottom:6px;">Shavarath is coterminous for 1 year once every 36 years. Its remote year begins 18 years later.</div>' +
      '<div style="margin-bottom:6px;">Do you want one of those long war-cycle phases to intersect year one?</div>';
  }
  if (stepKey === 'plane:Syrania'){
    return intro +
      '<div style="margin-bottom:6px;">Syrania is coterminous on ' + esc(syraniaDay) + ' once every 10 years. Its remote day is exactly 5 years later.</div>' +
      '<div style="margin-bottom:6px;">Do you want that Boldrei\'s Feast cycle to hit year one?</div>';
  }
  if (stepKey === 'plane:Thelanis'){
    return intro +
      '<div style="margin-bottom:6px;">Thelanis is coterminous for 7 years once every 225 years. Its remote span begins halfway through the cycle.</div>' +
      '<div style="margin-bottom:6px;">Do you want one of those major fairy-cycle phases to intersect year one?</div>';
  }
  if (stepKey === 'mabar'){
    return intro +
      '<div style="margin-bottom:6px;">Mabar\'s special non-annual remote phase lasts 5 days around ' + esc(mabarRemote) + ' every 5 years.</div>' +
      '<div style="margin-bottom:6px;">The annual Long Shadows coterminous phase is always handled separately. This prompt only controls the 5-year remote window.</div>';
  }
  return intro;
}

function _setupEberronPlanarOptions(draft, stepKey){
  var linkResolved = _setupEberronResolvedLinkMode(draft);
  if (stepKey === 'link'){
    return [
      { label: 'Roll for it', value: 'roll' },
      { label: 'Linked', value: 'linked' },
      { label: 'Independent', value: 'independent' }
    ];
  }
  if (stepKey === 'climate'){
    if (linkResolved.effectiveMode === 'linked'){
      return [
        { label: 'Roll for it', value: 'roll' },
        { label: 'Fernia coterminous in year one', value: 'fernia-coterminous' },
        { label: 'Risia coterminous in year one', value: 'risia-coterminous' },
        { label: 'Neither in year one', value: 'neither' }
      ];
    }
    return [
      { label: 'Roll for it', value: 'roll' },
      { label: 'Fernia coterminous in year one', value: 'fernia-coterminous' },
      { label: 'Fernia remote in year one', value: 'fernia-remote' },
      { label: 'Risia coterminous in year one', value: 'risia-coterminous' },
      { label: 'Risia remote in year one', value: 'risia-remote' },
      { label: 'Neither in year one', value: 'neither' }
    ];
  }
  if (stepKey === 'mabar'){
    return [
      { label: 'Roll for it', value: 'roll' },
      { label: 'Remote in year one', value: 'remote' },
      { label: 'Neither in year one', value: 'neither' }
    ];
  }
  return [
    { label: 'Roll for it', value: 'roll' },
    { label: 'Coterminous in year one', value: 'coterminous' },
    { label: 'Remote in year one', value: 'remote' },
    { label: 'Neither in year one', value: 'neither' }
  ];
}

function _setupEberronPlanarStepHtml(draft, stepKey){
  var meta = _setupEberronPlanarMeta(stepKey);
  var body = _setupEberronPlanarPromptBody(draft, stepKey);
  var rows = _setupEberronPlanarOptions(draft, stepKey).map(function(opt){
    var cmd = '';
    if (stepKey === 'link') cmd = 'setup planeinit link ' + opt.value;
    else if (stepKey === 'climate') cmd = 'setup planeinit climate ' + opt.value;
    else if (stepKey === 'mabar') cmd = 'setup planeinit mabar ' + opt.value;
    else if (stepKey.indexOf('plane:') === 0) cmd = 'setup planeinit plane ' + stepKey.slice(6) + ' ' + opt.value;
    return _setupPromptButton(opt.label, cmd, '');
  }).join('');
  return _menuBox(
    'Calendar Setup - Step 11: Planar Initialization (' + meta.index + '/' + meta.total + ')',
    '<div style="margin-bottom:6px;"><b>' + esc(meta.title) + '</b></div>' + body + rows
  );
}

function _setupEberronReviewRows(draft){
  var resolved = _setupEberronPlanarResolution(draft);
  if (!resolved) return '';
  var selections = _setupEberronPlanarSelections(draft);
  var rows = [];
  rows.push('<div><b>Fernia/Risia link mode:</b> ' + esc(_setupEberronPlanarChoiceLabel('link', selections.linkModeChoice, resolved.effectiveLinkMode)) + ' <span style="opacity:.72;">(' + esc(resolved.items.link.preview) + ')</span></div>');
  rows.push('<div><b>Fernia/Risia climate pair:</b> ' + esc(_setupEberronPlanarChoiceLabel('climate', selections.climateChoice, resolved.effectiveLinkMode)) + ' <span style="opacity:.72;">(' + esc(resolved.items.climate.preview) + ')</span></div>');
  ['Daanvi', 'Dolurrh', 'Irian', 'Shavarath', 'Syrania', 'Thelanis'].forEach(function(name){
    rows.push('<div><b>' + esc(name) + ':</b> ' + esc(_setupEberronPlanarChoiceLabel('plane', selections.planeChoices[name], resolved.effectiveLinkMode)) + ' <span style="opacity:.72;">(' + esc(resolved.items[name].preview) + ')</span></div>');
  });
  rows.push('<div><b>Mabar remote:</b> ' + esc(_setupEberronPlanarChoiceLabel('mabar', selections.mabarChoice, resolved.effectiveLinkMode)) + ' <span style="opacity:.72;">(' + esc(resolved.items.Mabar.preview) + ')</span></div>');
  return rows.join('');
}

function _setupEberronApplySummaryHtml(draft, resolved){
  if (!resolved) return '';
  var selections = _setupEberronPlanarSelections(draft);
  var rows = [];
  rows.push('<div style="margin-bottom:6px;">Year one: <b>' + esc(_setupEberronYearOneWindowLabel(draft)) + '</b></div>');
  rows.push(
    '<div style="margin-bottom:6px;"><b>Fernia/Risia link mode:</b> ' +
    esc(_setupEberronPlanarChoiceLabel('link', selections.linkModeChoice, resolved.effectiveLinkMode)) +
    ' <span style="opacity:.72;">(' + esc(resolved.items.link.preview) + ')</span><br>' +
    '<code>!cal planes link fernia-risia ' + esc(resolved.storedLinkMode) + '</code></div>'
  );
  [
    { label: 'Fernia/Risia climate pair', item: resolved.items.climate },
    { label: 'Daanvi', item: resolved.items.Daanvi },
    { label: 'Dolurrh', item: resolved.items.Dolurrh },
    { label: 'Irian', item: resolved.items.Irian },
    { label: 'Shavarath', item: resolved.items.Shavarath },
    { label: 'Syrania', item: resolved.items.Syrania },
    { label: 'Thelanis', item: resolved.items.Thelanis },
    { label: 'Mabar remote', item: resolved.items.Mabar }
  ].forEach(function(entry){
    var lines = '<div style="margin-bottom:6px;"><b>' + esc(entry.label) + ':</b> <span style="opacity:.72;">' + esc(entry.item.preview) + '</span>';
    var names = Object.keys(entry.item.resolvedYears || {});
    if (names.length){
      names.sort(function(a, b){ return String(a).localeCompare(String(b)); });
      names.forEach(function(name){
        var year = entry.item.resolvedYears[name];
        lines += '<br><code>!cal planes seed ' + esc(name) + ' ' + esc(String(year)) + '</code> &nbsp; <code>!cal planes seed ' + esc(name) + ' clear</code>';
      });
    }
    lines += '</div>';
    rows.push(lines);
  });
  return _menuBox('Planar Initialization Applied', rows.join(''));
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
  if (!draft.weatherMode) return 'weather';
  var _stepCaps = (getWorld(sysKey) || {}).capabilities;
  if (_stepCaps && _stepCaps.planes && draft.planesEnabled === undefined) return 'planes';
  if (draft.weatherMode !== 'off' && !draft.weatherLocation && !draft.weatherLocationLater) return 'weather-location';
  var eberronPlanarStep = _setupNextEberronPlanarStep(draft);
  if (eberronPlanarStep) return 'plane-init:' + eberronPlanarStep;
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
  bits.push('<div><b>Weather:</b> ' + esc(_setupWeatherModeLabel(draft.weatherMode)) + '</div>');
  var _sumCaps = (getWorld(sysKey) || {}).capabilities;
  if (_sumCaps && _sumCaps.planes){
    bits.push('<div><b>Planar tracking:</b> ' + esc(draft.planesEnabled === false ? 'Off' : 'On') + '</div>');
    if (_setupShouldRunEberronPlanarInit(draft)){
      bits.push('<div style="margin-top:6px;"><b>Year-one planar initialization:</b></div>');
      bits.push(_setupEberronReviewRows(draft));
    }
  }
  if (draft.weatherMode !== 'off'){
    bits.push('<div><b>Weather location:</b> ' + esc(draft.weatherLocation ? _weatherLocationLabel(draft.weatherLocation) : 'Set later') + '</div>');
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

function _setupWeatherStepHtml(){
  return _menuBox('Calendar Setup - Step 9: Weather',
    '<div style="margin-bottom:6px;">Choose how weather should behave.</div>' +
    _setupPromptButton('Off', 'setup weather off', '') +
    _setupPromptButton('Narrative only', 'setup weather narrative', '') +
    _setupPromptButton('Narrative + mechanics', 'setup weather mechanics', '')
  );
}

function _setupPlanesStepHtml(){
  return _menuBox('Calendar Setup - Step 10: Planar Tracking',
    '<div style="margin-bottom:6px;">Enable planar tracking for this Eberron campaign?</div>' +
    button('Planes On', 'setup planes on') + ' ' +
    button('Planes Off', 'setup planes off')
  );
}

function _setupWeatherLocationStepHtml(draft){
  var wizard = draft.weatherWizard || {};
  var step = 'start';
  if (wizard.geography) step = 'terrain';
  else if (wizard.climate) step = 'geography';
  return weatherLocationWizardHtml(step, wizard, {
    commandPrefix: 'setup weather',
    titlePrefix: 'Calendar Setup - Weather Location',
    laterCommand: 'setup weather later',
    allowSaveCurrent: false
  });
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
  else if (step === 'weather') body = _setupWeatherStepHtml();
  else if (step === 'planes') body = _setupPlanesStepHtml();
  else if (step === 'weather-location') body = _setupWeatherLocationStepHtml(draft);
  else if (step.indexOf('plane-init:') === 0) body = _setupEberronPlanarStepHtml(draft, step.slice(11));
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
    '<div style="margin-bottom:6px;">Welcome to Calendar! It looks like this is the first time Calendar has been used in this game. Would you like to initialize it?</div>' +
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
  st.weatherEnabled = draft.weatherMode !== 'off';
  st.weatherMechanicsEnabled = draft.weatherMode === 'mechanics';
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

  delete state[state_name].weather;
  delete state[state_name].moons;
  delete state[state_name].planes;

  if (st.weatherEnabled){
    var ws = getWeatherState();
    ws.location = draft.weatherLocation ? deepClone(draft.weatherLocation) : null;
    if (ws.location){
      _rememberRecentWeatherLocation(ws, ws.location);
      weatherEnsureForecast();
    }
  }

  var planarSummaryHtml = '';
  if (st.planesEnabled && sysKey === 'eberron' && draft.eberronPlanarInit){
    var planarResolved = resolveEberronPlanarInitialization(
      toSerial(draft.date.year, draft.date.month, draft.date.day),
      _setupEberronPlanarSelections(draft)
    );
    var psApply = getPlanesState();
    psApply.ferniaRisiaLinkMode = planarResolved.storedLinkMode;
    Object.keys(planarResolved.seedOverrides || {}).forEach(function(name){
      psApply.seedOverrides[name] = planarResolved.seedOverrides[name];
    });
    planarSummaryHtml = _setupEberronApplySummaryHtml(draft, planarResolved);
  }

  getSetupState().status = 'complete';
  getSetupState().draft = {};
  whisperUi(cleanWho(m.who), _menuBox('Calendar Setup', '<div>Setup applied. Calendar is ready.</div>'));
  if (planarSummaryHtml) whisperUi(cleanWho(m.who), planarSummaryHtml);
  if (sysKey === 'dragonlance' && String(draft.extra_nightOfTheEye || '') === 'manual'){
    whisperUi(cleanWho(m.who), _menuBox('Night of the Eye',
      '<div style="margin-bottom:6px;">Dragonlance is using the built-in Night of the Eye by default. Override it any time with:</div>' +
      '<code>!cal moon eye &lt;dateSpec&gt;</code>'
    ));
  }
  sendCurrentDate(cleanWho(m.who), false, { playerid: m.playerid, dashboard: true, includeButtons: true });
}

function _handleSetupWeatherStep(m, args){
  var draft = _setupDraft();
  var sub = String(args[0] || '').toLowerCase();
  if (!sub){
    return _showSetupWizard(m);
  }
  if (sub === 'later'){
    draft.weatherLocationLater = true;
    delete draft.weatherLocation;
    delete draft.weatherWizard;
    return _showSetupWizard(m, 'Weather location will be set later.');
  }
  if (sub === 'recent'){
    var idx = Math.max(1, parseInt(args[1], 10) || 1) - 1;
    var recent = (getWeatherState().recentLocations || [])[idx];
    if (!recent){
      return _showSetupWizard(m, 'That recent location is no longer available.');
    }
    draft.weatherLocation = deepClone(recent);
    delete draft.weatherLocationLater;
    delete draft.weatherWizard;
    return _showSetupWizard(m, 'Weather location ready: <b>' + esc(_weatherLocationLabel(recent)) + '</b>.');
  }
  if (sub === 'preset'){
    var presetIdx = Math.max(1, parseInt(args[1], 10) || 1) - 1;
    var preset = (getWeatherState().savedLocations || [])[presetIdx];
    if (!preset){
      return _showSetupWizard(m, 'That saved location is no longer available.');
    }
    draft.weatherLocation = deepClone(preset);
    delete draft.weatherLocationLater;
    delete draft.weatherWizard;
    return _showSetupWizard(m, 'Weather location ready: <b>' + esc(_weatherLocationLabel(preset)) + '</b>.');
  }

  if (!draft.weatherWizard || typeof draft.weatherWizard !== 'object') draft.weatherWizard = {};
  if (sub === 'climate'){
    draft.weatherWizard = { climate: String(args[1] || '').toLowerCase() };
    return _showSetupWizard(m);
  }
  if (sub === 'geography'){
    draft.weatherWizard.geography = String(args[1] || '').toLowerCase();
    whisperUi(cleanWho(m.who), weatherLocationWizardHtml('terrain', draft.weatherWizard, {
      commandPrefix: 'setup weather',
      titlePrefix: 'Calendar Setup - Weather Location',
      laterCommand: 'setup weather later',
      allowSaveCurrent: false
    }));
    return;
  }
  if (sub === 'terrain'){
    draft.weatherWizard.terrain = String(args[1] || '').toLowerCase();
    draft.weatherLocation = _normalizeWeatherLocation({
      climate: draft.weatherWizard.climate,
      geography: draft.weatherWizard.geography,
      terrain: draft.weatherWizard.terrain
    });
    delete draft.weatherLocationLater;
    delete draft.weatherWizard;
    return _showSetupWizard(m, 'Weather location ready: <b>' + esc(_weatherLocationLabel(draft.weatherLocation)) + '</b>.');
  }
  return _showSetupWizard(m);
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
      _setupResetEberronPlanarInit(setup.draft);
      if (setup.draft.calendarVariant){
        return _showSetupWizard(msg, _setupCalendarSelectionNotice(setup.draft.calendarSystem, setup.draft.calendarVariant)), true;
      }
      return _showSetupWizard(msg), true;
    }
    if (action === 'variant'){
      setup.status = 'in_progress';
      setup.draft.calendarVariant = _setupVariantKey(setup.draft.calendarSystem, args[3]);
      delete setup.draft.date;
      _setupResetEberronPlanarInit(setup.draft);
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
    if (action === 'weather'){
      setup.status = 'in_progress';
      var weatherArg = String(args[3] || '').toLowerCase();
      if (weatherArg === 'off' || weatherArg === 'narrative' || weatherArg === 'mechanics'){
        setup.draft.weatherMode = weatherArg;
        if (weatherArg === 'off'){
          delete setup.draft.weatherLocation;
          delete setup.draft.weatherLocationLater;
          delete setup.draft.weatherWizard;
        }
        return _showSetupWizard(msg), true;
      }
      return _handleSetupWeatherStep(msg, args.slice(3)), true;
    }
    if (action === 'planes'){
      setup.status = 'in_progress';
      setup.draft.planesEnabled = String(args[3] || '').toLowerCase() !== 'off';
      if (!setup.draft.planesEnabled) _setupResetEberronPlanarInit(setup.draft);
      return _showSetupWizard(msg), true;
    }
    if (action === 'planeinit'){
      setup.status = 'in_progress';
      if (!_setupShouldRunEberronPlanarInit(setup.draft)){
        return _showSetupWizard(msg), true;
      }
      var init = _setupEberronPlanarInitState(setup.draft);
      var initSub = String(args[3] || '').toLowerCase();
      var initVal = String(args[4] || '').toLowerCase();
      if (initSub === 'link'){
        if (!/^(roll|linked|independent)$/.test(initVal)) return _showSetupWizard(msg), true;
        init.linkModeChoice = initVal;
        delete init.climateChoice;
        return _showSetupWizard(msg), true;
      }
      if (initSub === 'climate'){
        var effectiveLinkMode = _setupEberronResolvedLinkMode(setup.draft).effectiveMode;
        var climateChoices = effectiveLinkMode === 'linked'
          ? ['roll', 'fernia-coterminous', 'risia-coterminous', 'neither']
          : ['roll', 'fernia-coterminous', 'fernia-remote', 'risia-coterminous', 'risia-remote', 'neither'];
        if (climateChoices.indexOf(initVal) < 0) return _showSetupWizard(msg), true;
        init.climateChoice = initVal;
        return _showSetupWizard(msg), true;
      }
      if (initSub === 'plane'){
        var planeName = String(args[4] || '');
        var planeChoice = String(args[5] || '').toLowerCase();
        var plane = _getPlaneData(planeName);
        if (!plane || ['Daanvi', 'Dolurrh', 'Irian', 'Shavarath', 'Syrania', 'Thelanis'].indexOf(plane.name) < 0) return _showSetupWizard(msg), true;
        if (!/^(roll|coterminous|remote|neither)$/.test(planeChoice)) return _showSetupWizard(msg), true;
        init.planeChoices[plane.name] = planeChoice;
        return _showSetupWizard(msg), true;
      }
      if (initSub === 'mabar'){
        if (!/^(roll|remote|neither)$/.test(initVal)) return _showSetupWizard(msg), true;
        init.mabarChoice = initVal;
        return _showSetupWizard(msg), true;
      }
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
