import { _stableHash } from './color.js';
import { script_name, state_name } from './constants.js';
import { fromSerial, todaySerial } from './date-math.js';
import { _moonPhaseLabel, _getMoonSys, getMoonState, moonEnsureSequences, moonHandoutHtml, moonIndividualHandoutHtml, moonMechanicsHandoutHtml, moonPhaseAt } from './moon.js';
import { _getAllPlaneData, getPlanesState, planeIndividualHandoutHtml, planesHandoutHtml, planesMechanicsHandoutHtml } from './planes.js';
import { button, esc } from './rendering.js';
import { ensureSettings, getCal } from './state.js';
import { eventsHandoutHtml, eventsMechanicsHandoutHtml } from './today.js';
import { _forecastRecord, _locSig, getWeatherState, weatherHandoutHtml, weatherMechanicsHandoutHtml } from './weather.js';

var MOON_PAGE_DEFAULT_NAME = 'Moon Phase';
var MOON_PAGE_MARKER = '[Calendar Moon Page]';
var HANDOUT_OPEN_BASE = 'http://journal.roll20.net/handout/';
var HANDOUT_SUBSYSTEM_ALIASES = {
  moon: 'lunar',
  moons: 'lunar',
  lunar: 'lunar',
  plane: 'planar',
  planes: 'planar',
  planar: 'planar',
  weather: 'weather',
  events: 'events',
  handouts: 'all',
  all: 'all'
};
var PRIMARY_HANDOUT_KEYS = {
  events: 'events:unified',
  weather: 'weather:unified',
  lunar: 'lunar:unified',
  planar: 'planar:unified'
};

function _rootState(){
  if (!state[state_name]) state[state_name] = {};
  var root = state[state_name];
  if (!root.persistentViews || typeof root.persistentViews !== 'object'){
    root.persistentViews = {};
  }
  var pv = root.persistentViews;
  if (!pv.moonPage || typeof pv.moonPage !== 'object'){
    pv.moonPage = {};
  }
  if (!pv.handouts || typeof pv.handouts !== 'object'){
    pv.handouts = {};
  }
  if (!pv.handouts.entries || typeof pv.handouts.entries !== 'object'){
    pv.handouts.entries = {};
  }
  if (!pv.handouts.entities || typeof pv.handouts.entities !== 'object'){
    pv.handouts.entities = {};
  }
  if (!Array.isArray(pv.moonPage.ownedObjectIds)){
    pv.moonPage.ownedObjectIds = [];
  }
  if (!pv.moonPage.pageName){
    pv.moonPage.pageName = MOON_PAGE_DEFAULT_NAME;
  }
  if (typeof pv.setupComplete !== 'boolean'){
    pv.setupComplete = false;
  }
  if (typeof pv.folderInstructionsDismissed !== 'boolean'){
    pv.folderInstructionsDismissed = false;
  }
  if (!pv.folderInstructionsShownFor){
    pv.folderInstructionsShownFor = '';
  }
  if (!pv.handoutLayoutStamp){
    pv.handoutLayoutStamp = '';
  }
  return pv;
}

export function getPersistentViewsState(){
  return _rootState();
}

function _calendarSetupIsComplete(){
  var root = state[state_name] || {};
  return !!(root.setup && root.setup.status === 'complete');
}

function _handoutState(){
  return _rootState().handouts;
}

function _slugKey(text){
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function _hashJson(value){
  var raw = '';
  try {
    raw = JSON.stringify(value == null ? null : value);
  } catch(e){
    raw = String(value || '');
  }
  return String(_stableHash(raw));
}

function _currentEventListSignature(){
  var cal = getCal();
  return _hashJson((cal.events || []).map(function(evt){
    return [evt.name, evt.month, evt.day, evt.year, evt.color, evt.source];
  }));
}

function _currentMoonStateSignature(){
  var ms = getMoonState();
  var sys = _getMoonSys();
  return _hashJson({
    calendarSystem: ensureSettings().calendarSystem || '',
    systemSeed: ms.systemSeed || '',
    modelRevision: ms.modelRevision || 0,
    revealTier: ms.revealTier || '',
    revealHorizonDays: ms.revealHorizonDays || 0,
    moonCount: sys && sys.moons ? sys.moons.length : 0
  });
}

function _currentPlaneStateSignature(){
  var ps = getPlanesState();
  return _hashJson({
    calendarSystem: ensureSettings().calendarSystem || '',
    revealTier: ps.revealTier || '',
    revealHorizonDays: ps.revealHorizonDays || 0,
    generatedHorizonDays: ps.generatedHorizonDays || 0,
    overrides: ps.overrides || {},
    anchors: ps.anchors || {},
    seedOverrides: ps.seedOverrides || {}
  });
}

function _currentWeatherWindowSignature(){
  var ws = getWeatherState();
  var today = todaySerial();
  var rows = [];
  for (var serial = today - 10; serial <= today + 10; serial++){
    var rec = _forecastRecord(serial);
    rows.push(rec ? [
      serial,
      rec.final && rec.final.temp,
      rec.final && rec.final.wind,
      rec.final && rec.final.precip,
      rec.location ? _locSig(rec.location) : '',
      rec.snowAccumulated || 0,
      rec.stale ? 1 : 0
    ].join(':') : String(serial));
  }
  return _hashJson({
    calendarSystem: ensureSettings().calendarSystem || '',
    location: ws.location ? _locSig(ws.location) : '',
    rows: rows
  });
}

function _isEntityHandoutKey(key){
  key = String(key || '');
  return key.indexOf('lunar:moon:') === 0 || key.indexOf('planar:plane:') === 0;
}

function _handoutRecordStore(key){
  var hs = _handoutState();
  return _isEntityHandoutKey(key) ? hs.entities : hs.entries;
}

function _handoutRecord(key){
  var store = _handoutRecordStore(key);
  if (!store[key] || typeof store[key] !== 'object'){
    store[key] = {};
  }
  var rec = store[key];
  if (!rec.id) rec.id = '';
  if (!rec.name) rec.name = '';
  if (!rec.renderStamp) rec.renderStamp = '';
  rec.lastRefreshSerial = isFinite(rec.lastRefreshSerial) ? (rec.lastRefreshSerial|0) : null;
  return rec;
}

function _dropHandoutRecord(key){
  var store = _handoutRecordStore(key);
  delete store[key];
}

function _buildHandoutSpecs(){
  var st = ensureSettings();
  var today = todaySerial();
  var eventSig = _currentEventListSignature();
  var moonSig = _currentMoonStateSignature();
  var planeSig = _currentPlaneStateSignature();
  var weatherSig = _currentWeatherWindowSignature();
  var moonSys = _getMoonSys();
  var planes = _getAllPlaneData();
  var specs = [
    {
      key: 'events:unified',
      subsystem: 'events',
      name: 'Calendar - Events',
      legacyIdKeys: ['eventsId'],
      renderStamp: 'events:' + today + ':' + eventSig,
      render: function(){ return eventsHandoutHtml(today); }
    },
    {
      key: 'events:mechanics',
      subsystem: 'events',
      name: 'Calendar - Events - Mechanics',
      renderStamp: 'events-mechanics:' + eventSig,
      render: function(){ return eventsMechanicsHandoutHtml(); }
    },
    {
      key: 'lunar:unified',
      subsystem: 'lunar',
      name: 'Calendar - Lunar - 0 Unified',
      legacyIdKeys: ['moonsId'],
      legacyNames: ['Calendar - Moons'],
      renderStamp: 'lunar-unified:' + today + ':' + moonSig,
      render: function(){ return moonHandoutHtml(today); }
    },
    {
      key: 'lunar:mechanics',
      subsystem: 'lunar',
      name: 'Calendar - Lunar - Mechanics',
      renderStamp: 'lunar-mechanics:' + (st.calendarSystem || '') + ':' + moonSig,
      render: function(){ return moonMechanicsHandoutHtml(); }
    },
    {
      key: 'planar:unified',
      subsystem: 'planar',
      name: 'Calendar - Planar - 0 Unified',
      legacyIdKeys: ['planesId'],
      legacyNames: ['Calendar - Planes'],
      renderStamp: 'planar-unified:' + today + ':' + planeSig,
      render: function(){ return planesHandoutHtml(); }
    },
    {
      key: 'planar:mechanics',
      subsystem: 'planar',
      name: 'Calendar - Planar - Mechanics',
      renderStamp: 'planar-mechanics:' + (st.calendarSystem || '') + ':' + planeSig,
      render: function(){ return planesMechanicsHandoutHtml(); }
    },
    {
      key: 'weather:unified',
      subsystem: 'weather',
      name: 'Calendar - Weather',
      legacyIdKeys: ['weatherId'],
      renderStamp: 'weather-unified:' + today + ':' + weatherSig,
      render: function(){ return weatherHandoutHtml(); }
    },
    {
      key: 'weather:mechanics',
      subsystem: 'weather',
      name: 'Calendar - Weather - Mechanics',
      renderStamp: 'weather-mechanics:' + (st.calendarSystem || '') + ':' + _hashJson({ location: getWeatherState().location || null }),
      render: function(){ return weatherMechanicsHandoutHtml(); }
    }
  ];

  if (moonSys && moonSys.moons && moonSys.moons.length){
    for (var i = 0; i < moonSys.moons.length; i++){
      (function(moon){
        specs.push({
          key: 'lunar:moon:' + _slugKey(moon.name),
          subsystem: 'lunar',
          name: 'Calendar - Lunar - ' + moon.name,
          renderStamp: 'lunar-moon:' + today + ':' + moon.name + ':' + moonSig,
          render: function(){ return moonIndividualHandoutHtml(moon.name, today); }
        });
      })(moonSys.moons[i]);
    }
  }

  if (planes && planes.length){
    for (var j = 0; j < planes.length; j++){
      (function(plane){
        specs.push({
          key: 'planar:plane:' + _slugKey(plane.name),
          subsystem: 'planar',
          name: 'Calendar - Planar - ' + plane.name,
          renderStamp: 'planar-plane:' + today + ':' + plane.name + ':' + planeSig,
          render: function(){ return planeIndividualHandoutHtml(plane.name, today); }
        });
      })(planes[j]);
    }
  }

  return specs;
}

function _handoutLayoutSignature(specs){
  return (specs || []).map(function(spec){
    return spec.key + '=' + spec.name;
  }).join('|');
}

function _cleanupStaleHandouts(specs){
  var hs = _handoutState();
  var active = {};
  (specs || []).forEach(function(spec){ active[spec.key] = 1; });
  ['entries', 'entities'].forEach(function(storeName){
    var store = hs[storeName] || {};
    Object.keys(store).forEach(function(key){
      if (active[key]) return;
      var rec = store[key];
      var handout = rec && rec.id ? getObj('handout', String(rec.id)) : null;
      if (handout){
        try { handout.remove(); } catch(e){}
      }
      delete store[key];
    });
  });
}

function _syncHandoutLayout(specs){
  var pv = _rootState();
  var nextSig = _handoutLayoutSignature(specs);
  if (pv.handoutLayoutStamp && pv.handoutLayoutStamp !== nextSig){
    _cleanupStaleHandouts(specs);
    pv.setupComplete = false;
    pv.folderInstructionsDismissed = false;
    pv.folderInstructionsShownFor = '';
  }
  pv.handoutLayoutStamp = nextSig;
}

function _normalizeHandoutTarget(kind){
  var token = String(kind || '').trim().toLowerCase();
  if (!token) return '';
  return HANDOUT_SUBSYSTEM_ALIASES[token] || token;
}

function _resolveHandoutSpecs(kinds, specs){
  specs = specs || _buildHandoutSpecs();
  if (kinds == null || (Array.isArray(kinds) && !kinds.length)) return specs.slice();
  var requested = Array.isArray(kinds) ? kinds.slice() : [kinds];
  var out = [];
  var seen = {};

  function pushSpec(spec){
    if (!spec || seen[spec.key]) return;
    seen[spec.key] = 1;
    out.push(spec);
  }

  for (var i = 0; i < requested.length; i++){
    var raw = String(requested[i] || '').trim();
    if (!raw) continue;
    var norm = _normalizeHandoutTarget(raw);
    if (norm === 'all'){
      specs.forEach(pushSpec);
      continue;
    }
    if (PRIMARY_HANDOUT_KEYS[norm]){
      for (var si = 0; si < specs.length; si++){
        if (specs[si].subsystem === norm) pushSpec(specs[si]);
      }
      continue;
    }
    for (var sj = 0; sj < specs.length; sj++){
      var spec = specs[sj];
      if (spec.key === raw || spec.key === norm || String(spec.name || '').toLowerCase() === norm){
        pushSpec(spec);
      }
    }
  }
  return out;
}

function _primaryHandoutSpec(kind, specs){
  specs = specs || _buildHandoutSpecs();
  var raw = String(kind || '').trim();
  if (!raw) return null;
  var norm = _normalizeHandoutTarget(raw);
  var targetKey = PRIMARY_HANDOUT_KEYS[norm] || raw;
  for (var i = 0; i < specs.length; i++){
    if (specs[i].key === targetKey || specs[i].key === norm){
      return specs[i];
    }
  }
  return null;
}

function _idOf(obj){
  if (!obj) return '';
  return String(obj.id || obj.get('_id') || '');
}

function _pageIdOf(obj){
  if (!obj) return '';
  return String(obj.get('pageid') || obj.get('_pageid') || '');
}

function _findByName(type, name){
  var want = String(name || '').trim().toLowerCase();
  if (!want) return null;
  var all = findObjs({ _type: type }) || [];
  for (var i = 0; i < all.length; i++){
    if (String(all[i].get('name') || '').trim().toLowerCase() === want){
      return all[i];
    }
  }
  return null;
}

function _monthDayYearLabel(serial){
  var d = fromSerial(serial|0);
  var month = (getCal().months[d.mi] || {}).name || String(d.mi + 1);
  return month + ' ' + d.day + ', ' + d.year;
}

function _moonPageState(){
  return _rootState().moonPage;
}

function _resolveMoonPage(autoBind?){
  var mp = _moonPageState();
  var page = mp.pageId ? getObj('page', String(mp.pageId)) : null;
  if (!page && mp.pageName){
    page = _findByName('page', mp.pageName);
  }
  if (!page && autoBind !== false){
    page = _findByName('page', MOON_PAGE_DEFAULT_NAME);
  }
  if (page){
    mp.pageId = _idOf(page);
    mp.pageName = String(page.get('name') || mp.pageName || MOON_PAGE_DEFAULT_NAME);
  }
  return page;
}

function _moonPageOwnedObjects(pageId){
  var mp = _moonPageState();
  var found = [];
  var seen = {};
  var ids = Array.isArray(mp.ownedObjectIds) ? mp.ownedObjectIds.slice() : [];
  var types = ['path', 'text', 'graphic'];

  for (var i = 0; i < ids.length; i++){
    for (var t = 0; t < types.length; t++){
      var obj = getObj(types[t], String(ids[i]));
      if (!obj) continue;
      if (_pageIdOf(obj) !== String(pageId || '')) continue;
      if (!_isMoonPageOwned(obj)) continue;
      var oid = _idOf(obj);
      if (!seen[oid]){
        seen[oid] = 1;
        found.push(obj);
      }
    }
  }

  if (found.length) return found;

  var pageObjs = findObjs({ _pageid: pageId }) || [];
  for (var j = 0; j < pageObjs.length; j++){
    var pageObj = pageObjs[j];
    if (!_isMoonPageOwned(pageObj)) continue;
    var pid = _idOf(pageObj);
    if (!seen[pid]){
      seen[pid] = 1;
      found.push(pageObj);
    }
  }
  return found;
}

function _isMoonPageOwned(obj){
  return String(obj && obj.get('name') || '').indexOf(MOON_PAGE_MARKER) === 0;
}

function _clearMoonPage(pageId){
  var objs = _moonPageOwnedObjects(pageId);
  for (var i = 0; i < objs.length; i++){
    try { objs[i].remove(); } catch(e){}
  }
  _moonPageState().ownedObjectIds = [];
}

function _trackMoonPageObject(obj){
  if (!obj) return;
  var mp = _moonPageState();
  if (!Array.isArray(mp.ownedObjectIds)) mp.ownedObjectIds = [];
  mp.ownedObjectIds.push(_idOf(obj));
}

function _circlePath(size, segments?){
  var n = Math.max(12, parseInt(segments, 10) || 24);
  var r = size / 2;
  var cx = r;
  var cy = r;
  var pts = [];
  for (var i = 0; i < n; i++){
    var ang = (Math.PI * 2 * i / n) - (Math.PI / 2);
    var x = cx + Math.cos(ang) * r;
    var y = cy + Math.sin(ang) * r;
    pts.push([i === 0 ? 'M' : 'L', Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
  }
  pts.push(['L', Math.round((cx) * 1000) / 1000, Math.round((cy - r) * 1000) / 1000]);
  return JSON.stringify(pts);
}

function _rectPath(width, height){
  return JSON.stringify([
    ['M', 0, 0],
    ['L', width, 0],
    ['L', width, height],
    ['L', 0, height],
    ['L', 0, 0]
  ]);
}

function _moonPagePath(pageId, left, top, width, height, fill, stroke, strokeWidth, name){
  var obj = createObj('path', {
    pageid: pageId,
    layer: 'map',
    left: left + (width / 2),
    top: top + (height / 2),
    width: width,
    height: height,
    path: _rectPath(width, height),
    fill: fill,
    stroke: stroke,
    stroke_width: strokeWidth,
    name: name
  });
  _trackMoonPageObject(obj);
  return obj;
}

function _moonPageCircle(pageId, centerX, centerY, size, fill, stroke, strokeWidth, name){
  var obj = createObj('path', {
    pageid: pageId,
    layer: 'map',
    left: centerX,
    top: centerY,
    width: size,
    height: size,
    path: _circlePath(size),
    fill: fill,
    stroke: stroke,
    stroke_width: strokeWidth,
    name: name
  });
  _trackMoonPageObject(obj);
  return obj;
}

function _moonPageText(pageId, left, top, text, fontSize, color, name){
  var obj = createObj('text', {
    pageid: pageId,
    layer: 'map',
    left: left,
    top: top,
    text: text,
    font_size: fontSize,
    color: color,
    font_family: 'Arial',
    name: name
  });
  _trackMoonPageObject(obj);
  return obj;
}

function _moonCardLayout(page){
  var pageUnitsW = Math.max(10, parseInt(page.get('width'), 10) || 25);
  var pageUnitsH = Math.max(10, parseInt(page.get('height'), 10) || 25);
  var pageW = pageUnitsW * 70;
  var pageH = pageUnitsH * 70;
  return {
    pageW: pageW,
    pageH: pageH,
    margin: 70,
    gap: 18,
    headerH: 100
  };
}

function _moonPageSummaryText(serial){
  var sys = _getMoonSys();
  if (!sys || !sys.moons || !sys.moons.length) return 'No moon data is available for this calendar system.';
  var notes = [];
  for (var i = 0; i < sys.moons.length; i++){
    var ph = moonPhaseAt(sys.moons[i].name, serial);
    if (!ph) continue;
    var label = _moonPhaseLabel(ph.illum, ph.waxing);
    notes.push(sys.moons[i].name + ': ' + label);
    if (notes.length >= 4) break;
  }
  return notes.join(' · ');
}

function _renderMoonPageDisabled(pageId, serial, title){
  _moonPagePath(pageId, 70, 70, 980, 240, '#08111f', '#22334f', 2, MOON_PAGE_MARKER + ' backdrop');
  _moonPageText(pageId, 560, 110, title, 28, '#F2F5FF', MOON_PAGE_MARKER + ' title');
  _moonPageText(pageId, 560, 150, _monthDayYearLabel(serial), 18, '#C9D4EA', MOON_PAGE_MARKER + ' date');
  _moonPageText(pageId, 560, 215, 'Moon system is disabled or unavailable.', 22, '#D8DEE9', MOON_PAGE_MARKER + ' status');
}

function _renderMoonCard(pageId, moon, ph, layout, idx, count, minDiameter, maxDiameter){
  var cols = count <= 2 ? count : (count <= 6 ? 3 : 4);
  var rows = Math.max(1, Math.ceil(count / cols));
  var usableW = layout.pageW - (layout.margin * 2);
  var usableH = layout.pageH - layout.headerH - layout.margin;
  var cellW = Math.max(190, Math.floor((usableW - ((cols - 1) * layout.gap)) / cols));
  var cellH = Math.max(180, Math.floor((usableH - ((rows - 1) * layout.gap)) / rows));
  var col = idx % cols;
  var row = Math.floor(idx / cols);
  var left = layout.margin + (col * (cellW + layout.gap));
  var top = layout.headerH + (row * (cellH + layout.gap));
  var cardName = MOON_PAGE_MARKER + ' card ' + moon.name;
  var ratio = (maxDiameter > minDiameter)
    ? ((parseFloat(moon.diameter) || minDiameter) - minDiameter) / (maxDiameter - minDiameter)
    : 0.5;
  var diskSize = Math.max(44, Math.min(88, Math.round(44 + (ratio * 44))));
  var diskCenterX = left + Math.round(cellW / 2);
  var diskCenterY = top + Math.round(cellH / 2) - 12;
  var illum = Math.max(0, Math.min(1, ph && isFinite(ph.illum) ? ph.illum : 0));
  var shadowShift = Math.round(diskSize * illum * (ph && ph.waxing ? -1 : 1));
  var pct = Math.round(illum * 100);
  var phaseLabel = ph ? _moonPhaseLabel(ph.illum, ph.waxing) : 'Unknown';

  _moonPagePath(pageId, left, top, cellW, cellH, '#0A1022', '#23314D', 2, cardName + ' backdrop');
  _moonPageText(pageId, left + Math.round(cellW / 2), top + 20, moon.name, 18, '#F4F6FB', cardName + ' name');
  _moonPageText(pageId, left + Math.round(cellW / 2), top + 42, String(moon.title || ''), 12, '#AAB7CF', cardName + ' title');
  _moonPageCircle(pageId, diskCenterX, diskCenterY, diskSize, moon.color || '#CCCCCC', '#E8ECF6', 2, cardName + ' disk');
  _moonPageCircle(pageId, diskCenterX + shadowShift, diskCenterY, diskSize, '#02040A', '#02040A', 0, cardName + ' shadow');
  _moonPageText(pageId, left + Math.round(cellW / 2), top + cellH - 38, phaseLabel, 14, '#D7DDED', cardName + ' phase');
  _moonPageText(pageId, left + Math.round(cellW / 2), top + cellH - 18, pct + '% illuminated · ' + (moon.diameter || '?') + ' mi', 11, '#94A0B8', cardName + ' detail');
}

export function bindMoonPageByName(pageName){
  var wanted = String(pageName || '').trim() || MOON_PAGE_DEFAULT_NAME;
  var page = _findByName('page', wanted);
  if (!page){
    return {
      ok: false,
      reason: 'missing',
      message: 'No Roll20 page named <b>' + esc(wanted) + '</b> was found. Create it first, then run <code>!cal moon page bind ' + esc(wanted) + '</code>.'
    };
  }
  var mp = _moonPageState();
  mp.pageId = _idOf(page);
  mp.pageName = String(page.get('name') || wanted);
  return {
    ok: true,
    pageId: mp.pageId,
    pageName: mp.pageName,
    message: 'Moon page bound to <b>' + esc(mp.pageName) + '</b>.'
  };
}

export function refreshMoonPage(opts?){
  opts = opts || {};
  var page = _resolveMoonPage(opts.autoBind);
  if (!page){
    return {
      ok: false,
      reason: 'missing',
      message: 'No Moon Phase page is bound. Create a Roll20 page named <b>' + esc(MOON_PAGE_DEFAULT_NAME) + '</b> or run <code>!cal moon page bind &lt;page name&gt;</code>.'
    };
  }

  var pageId = _idOf(page);
  var mp = _moonPageState();
  mp.pageId = pageId;
  mp.pageName = String(page.get('name') || mp.pageName || MOON_PAGE_DEFAULT_NAME);
  _clearMoonPage(pageId);

  var serial = todaySerial();
  var title = 'Moon Phases';
  _moonPagePath(pageId, 50, 50, Math.min(_moonCardLayout(page).pageW - 100, 1180), 70, '#08111f', '#22334f', 2, MOON_PAGE_MARKER + ' header');
  _moonPageText(pageId, 320, 85, title, 28, '#F2F5FF', MOON_PAGE_MARKER + ' header-title');
  _moonPageText(pageId, 860, 85, _monthDayYearLabel(serial), 18, '#C9D4EA', MOON_PAGE_MARKER + ' header-date');

  if (ensureSettings().moonsEnabled === false){
    _renderMoonPageDisabled(pageId, serial, title);
    mp.renderStamp = 'disabled:' + serial + ':' + String(getMoonState().systemSeed || '');
    return { ok: true, pageId: pageId, pageName: mp.pageName, message: 'Moon page refreshed.' };
  }

  var sys = _getMoonSys();
  if (!sys || !sys.moons || !sys.moons.length){
    _renderMoonPageDisabled(pageId, serial, title);
    mp.renderStamp = 'empty:' + serial + ':' + String(getMoonState().systemSeed || '');
    return { ok: true, pageId: pageId, pageName: mp.pageName, message: 'Moon page refreshed.' };
  }

  moonEnsureSequences(serial, 40);
  var layout = _moonCardLayout(page);
  var minDiameter = Infinity;
  var maxDiameter = 0;
  for (var i = 0; i < sys.moons.length; i++){
    var dia = parseFloat(sys.moons[i].diameter) || 1000;
    if (dia < minDiameter) minDiameter = dia;
    if (dia > maxDiameter) maxDiameter = dia;
  }
  if (!isFinite(minDiameter)) minDiameter = 1000;
  if (!maxDiameter) maxDiameter = minDiameter;

  for (var j = 0; j < sys.moons.length; j++){
    var moon = sys.moons[j];
    var ph = moonPhaseAt(moon.name, serial);
    _renderMoonCard(pageId, moon, ph, layout, j, sys.moons.length, minDiameter, maxDiameter);
  }

  _moonPageText(pageId, 590, layout.pageH - 32, _moonPageSummaryText(serial), 13, '#8E9BB2', MOON_PAGE_MARKER + ' footer');
  mp.renderStamp = String(serial) + ':' + String(sys.moons.length) + ':' + String(getMoonState().systemSeed || '');
  return {
    ok: true,
    pageId: pageId,
    pageName: mp.pageName,
    message: 'Moon page refreshed on <b>' + esc(mp.pageName) + '</b>.'
  };
}

export function showMoonPage(){
  var refreshed = refreshMoonPage({ autoBind: true });
  if (!refreshed.ok) return refreshed;
  Campaign().set('playerpageid', refreshed.pageId);
  return {
    ok: true,
    pageId: refreshed.pageId,
    pageName: refreshed.pageName,
    message: 'Players moved to <b>' + esc(refreshed.pageName || MOON_PAGE_DEFAULT_NAME) + '</b>.'
  };
}

function _ensureHandout(spec){
  if (!spec) return null;

  var hs = _handoutState();
  var rec = _handoutRecord(spec.key);
  var handout = rec.id ? getObj('handout', String(rec.id)) : null;

  if (!handout && Array.isArray(spec.legacyIdKeys)){
    for (var i = 0; i < spec.legacyIdKeys.length; i++){
      var legacyId = hs[spec.legacyIdKeys[i]];
      if (!legacyId) continue;
      handout = getObj('handout', String(legacyId));
      if (handout) break;
    }
  }
  if (!handout){
    handout = _findByName('handout', spec.name);
  }
  if (!handout && Array.isArray(spec.legacyNames)){
    for (var j = 0; j < spec.legacyNames.length; j++){
      handout = _findByName('handout', spec.legacyNames[j]);
      if (handout) break;
    }
  }
  if (!handout){
    handout = createObj('handout', {
      name: spec.name,
      inplayerjournals: 'all',
      archived: false
    });
  }
  if (!handout) return null;

  rec.id = _idOf(handout);
  rec.name = spec.name;
  if (Array.isArray(spec.legacyIdKeys)){
    for (var k = 0; k < spec.legacyIdKeys.length; k++){
      hs[spec.legacyIdKeys[k]] = rec.id;
    }
  }

  handout.set({
    name: spec.name,
    inplayerjournals: 'all',
    archived: false
  });
  return { handout: handout, record: rec };
}

function _refreshHandoutSpec(spec, opts){
  opts = opts || {};
  var ensured = _ensureHandout(spec);
  if (!ensured || !ensured.handout){
    return { ok:false, reason:'missing', message:'Could not create or find handout <b>' + esc(spec.name) + '</b>.' };
  }
  var handout = ensured.handout;
  var rec = ensured.record;
  var stamp = String(spec.renderStamp || '');

  if (opts.force !== true && rec.renderStamp === stamp){
    return {
      ok: true,
      skipped: true,
      handoutId: _idOf(handout),
      handoutName: spec.name,
      handoutKey: spec.key
    };
  }

  handout.set('notes', spec.render());
  rec.renderStamp = stamp;
  rec.lastRefreshSerial = todaySerial();
  rec.name = spec.name;
  return {
    ok: true,
    skipped: false,
    handoutId: _idOf(handout),
    handoutName: spec.name,
    handoutKey: spec.key
  };
}

function _folderInstructionsHtml(specs){
  var lunarCount = specs.filter(function(spec){ return spec.subsystem === 'lunar'; }).length;
  var planarCount = specs.filter(function(spec){ return spec.subsystem === 'planar'; }).length;
  var weatherCount = specs.filter(function(spec){ return spec.subsystem === 'weather'; }).length;
  var eventCount = specs.filter(function(spec){ return spec.subsystem === 'events'; }).length;
  return (
    '<div style="margin-bottom:6px;">I created <b>' + specs.length + '</b> calendar handouts at the Journal root. Roll20 cannot create folders via API, so create these folders manually and drag the matching handouts into them once.</div>' +
    '<div style="font-family:monospace;white-space:pre-line;opacity:.88;">' +
      'Calendar/\n' +
      '  Lunar/   \u2014 ' + lunarCount + ' handouts\n' +
      '  Planar/  \u2014 ' + planarCount + ' handouts\n' +
      '  Weather/ \u2014 ' + weatherCount + ' handouts\n' +
      '  Events/  \u2014 ' + eventCount + ' handouts' +
    '</div>' +
    '<div style="margin-top:6px;opacity:.8;">Unified handouts sort first as <code>0 Unified</code>. Mechanics handouts stay inside each subsystem folder.</div>' +
    '<div style="margin-top:8px;">' + button('Done — Dismiss This Message', 'setup dismiss') + '</div>'
  );
}

function _maybeNotifyFolderInstructions(specs){
  if (!_calendarSetupIsComplete()) return;
  var pv = _rootState();
  if (pv.folderInstructionsDismissed === true) return;
  var layoutSig = pv.handoutLayoutStamp || _handoutLayoutSignature(specs);
  if (pv.folderInstructionsShownFor === layoutSig) return;
  sendChat(script_name, '/w gm ' + _folderInstructionsHtml(specs), null, { noarchive: true });
  pv.setupComplete = true;
  pv.folderInstructionsShownFor = layoutSig;
}

export function dismissPersistentFolderInstructions(){
  var pv = _rootState();
  pv.folderInstructionsDismissed = true;
  return {
    ok: true,
    message: 'Calendar handout folder instructions dismissed.'
  };
}

export function getHandoutId(kind, opts?){
  opts = opts || {};
  var specs = _buildHandoutSpecs();
  _syncHandoutLayout(specs);
  var spec = _primaryHandoutSpec(kind, specs);
  if (!spec) return '';

  var rec = _handoutRecord(spec.key);
  var handout = rec.id ? getObj('handout', String(rec.id)) : null;
  if (!handout){
    handout = _findByName('handout', spec.name);
  }
  if (!handout && Array.isArray(spec.legacyNames)){
    for (var i = 0; i < spec.legacyNames.length; i++){
      handout = _findByName('handout', spec.legacyNames[i]);
      if (handout) break;
    }
  }
  if (!handout && opts.createIfMissing){
    var ensured = _ensureHandout(spec);
    handout = ensured && ensured.handout;
  }
  if (!handout) return '';
  rec.id = _idOf(handout);
  return rec.id;
}

export function handoutButton(label, kind, opts?){
  opts = opts || {};
  var id = getHandoutId(kind, { createIfMissing: opts.createIfMissing !== false });
  if (!id) return '';
  return '[' + esc(String(label || 'Open Handout')) + '](' + HANDOUT_OPEN_BASE + id + ')';
}

export function refreshHandout(kind, opts?){
  opts = opts || {};
  var specs = _buildHandoutSpecs();
  _syncHandoutLayout(specs);
  var matches = _resolveHandoutSpecs([kind], specs);
  if (!matches.length){
    return { ok:false, reason:'unknown', message:'Unknown handout kind: ' + esc(String(kind || '')) + '.' };
  }
  if (matches.length === 1 && matches[0].key === String(kind || '')){
    return _refreshHandoutSpec(matches[0], opts);
  }
  var out = {};
  for (var i = 0; i < matches.length; i++){
    out[matches[i].key] = _refreshHandoutSpec(matches[i], opts);
  }
  if (!opts.skipFolderNotice) _maybeNotifyFolderInstructions(specs);
  return { ok:true, handouts:out };
}

export function refreshHandouts(kinds?, opts?){
  opts = opts || {};
  var specs = _buildHandoutSpecs();
  _syncHandoutLayout(specs);
  var list = _resolveHandoutSpecs(kinds, specs);
  var out = {};
  for (var i = 0; i < list.length; i++){
    out[list[i].key] = _refreshHandoutSpec(list[i], opts);
  }
  if (!opts.skipFolderNotice) _maybeNotifyFolderInstructions(specs);
  return out;
}

export function refreshHandoutsBatched(kinds?, opts?){
  opts = opts || {};
  var specs = _buildHandoutSpecs();
  _syncHandoutLayout(specs);
  var list = _resolveHandoutSpecs(kinds, specs);
  var queue = list.slice();
  var delayMs = Math.max(0, parseInt(opts.delayMs, 10) || 50);

  function next(){
    if (!queue.length) return;
    _refreshHandoutSpec(queue.shift(), { force: opts.force === true, skipFolderNotice: true });
    if (queue.length) setTimeout(next, delayMs);
  }

  if (queue.length) next();
  if (!opts.skipFolderNotice) _maybeNotifyFolderInstructions(specs);
  return { ok:true, queued:list.length };
}

export function refreshAllPersistentViews(opts?){
  opts = opts || {};
  var specs = _buildHandoutSpecs();
  _syncHandoutLayout(specs);
  var out = {
    moonPage: refreshMoonPage({ autoBind: opts.autoBind !== false }),
    handouts: opts.batched
      ? refreshHandoutsBatched(opts.handoutKinds, { delayMs: opts.batchDelayMs, force: opts.force === true, skipFolderNotice: true })
      : refreshHandouts(opts.handoutKinds, { force: opts.force === true, skipFolderNotice: true })
  };
  if (!opts.skipFolderNotice) _maybeNotifyFolderInstructions(specs);
  return out;
}

export function persistentViewsReadyMessage(){
  return '<div style="opacity:.72;">' + esc(script_name) + ' persistent views refreshed.</div>';
}
