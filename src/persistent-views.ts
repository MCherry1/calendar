import { script_name, state_name } from './constants.js';
import { fromSerial, todaySerial } from './date-math.js';
import { _moonPhaseLabel, _getMoonSys, getMoonState, moonEnsureSequences, moonHandoutHtml, moonPhaseAt } from './moon.js';
import { planesHandoutHtml } from './planes.js';
import { esc } from './rendering.js';
import { ensureSettings, getCal } from './state.js';
import { eventsHandoutHtml } from './today.js';
import { weatherHandoutHtml } from './weather.js';

var MOON_PAGE_DEFAULT_NAME = 'Moon Phase';
var MOON_PAGE_MARKER = '[Calendar Moon Page]';

var HANDOUT_SPECS = {
  events: { name: 'Calendar - Events', render: function(){ return eventsHandoutHtml(); } },
  moons: { name: 'Calendar - Moons', render: function(){ return moonHandoutHtml(); } },
  weather: { name: 'Calendar - Weather', render: function(){ return weatherHandoutHtml(); } },
  planes: { name: 'Calendar - Planes', render: function(){ return planesHandoutHtml(); } }
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
  if (!Array.isArray(pv.moonPage.ownedObjectIds)){
    pv.moonPage.ownedObjectIds = [];
  }
  if (!pv.moonPage.pageName){
    pv.moonPage.pageName = MOON_PAGE_DEFAULT_NAME;
  }
  return pv;
}

export function getPersistentViewsState(){
  return _rootState();
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

function _ensureHandout(kind){
  var spec = HANDOUT_SPECS[kind];
  if (!spec) return null;

  var handoutState = _rootState().handouts;
  var idKey = kind + 'Id';
  var handout = handoutState[idKey] ? getObj('handout', String(handoutState[idKey])) : null;
  if (!handout){
    handout = _findByName('handout', spec.name);
  }
  if (!handout){
    handout = createObj('handout', {
      name: spec.name,
      inplayerjournals: 'all',
      archived: false
    });
  }
  if (!handout) return null;
  handoutState[idKey] = _idOf(handout);
  handout.set({
    name: spec.name,
    inplayerjournals: 'all',
    archived: false
  });
  return handout;
}

export function refreshHandout(kind){
  var spec = HANDOUT_SPECS[kind];
  if (!spec){
    return { ok:false, reason:'unknown', message:'Unknown handout kind: ' + esc(String(kind || '')) + '.' };
  }
  var handout = _ensureHandout(kind);
  if (!handout){
    return { ok:false, reason:'missing', message:'Could not create or find handout <b>' + esc(spec.name) + '</b>.' };
  }
  handout.set('notes', spec.render());
  return { ok:true, handoutId:_idOf(handout), handoutName:spec.name };
}

export function refreshHandouts(kinds?){
  var list = Array.isArray(kinds) && kinds.length ? kinds : Object.keys(HANDOUT_SPECS);
  var out = {};
  for (var i = 0; i < list.length; i++){
    out[list[i]] = refreshHandout(list[i]);
  }
  return out;
}

export function refreshAllPersistentViews(opts?){
  opts = opts || {};
  var out = {
    moonPage: refreshMoonPage({ autoBind: opts.autoBind !== false }),
    handouts: refreshHandouts(opts.handoutKinds)
  };
  return out;
}

export function persistentViewsReadyMessage(){
  return '<div style="opacity:.72;">' + esc(script_name) + ' persistent views refreshed.</div>';
}
