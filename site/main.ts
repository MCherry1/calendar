import { WORLD_ORDER, WORLDS } from '../src/worlds/index.js';
import { COLOR_THEMES } from '../src/constants.js';
import { buildCalendarPreview } from '../src/showcase/calendar-preview.js';
import { buildSkyScene } from '../src/showcase/sky-scene.js';
import { clampDayForSlot, formatWorldDate, fromWorldSerial, getWorldCalendarSlots, regularMonthIndexToSlotIndex, toWorldSerial } from '../src/showcase/world-calendar.js';
import { renderPureMonthTable, PureCell } from '../src/shared/render-month-table.js';
import { getAllShowcasePlanarPhases, PlanarPhaseResult } from '../src/showcase/planar-phase.js';
import { getMoonTexture, clearTextureCache, generateStarField, generateMilkyWay, StarData, MilkyWayParticle } from './sky-textures.js';
import { getMoonOrbitalData } from '../src/showcase/solar-system-data.js';


type ShowcaseState = {
  worldId: string;
  serial: number;
  timeFrac: number;
  lunarSizeMode: 'useful' | 'true';
  skyPlaying: boolean;
  speedHoursPerSecond: number;
  skyScrubHoursPerSecond: number;
  skyScrubActive: boolean;
  planarSerial: number;
  planarPlaying: boolean;
  planarDaysPerSecond: number;
  planarScrubDaysPerSecond: number;
  planarScrubActive: boolean;
  viewCenterAz: number;
  viewFovDeg: number;
  planarTiltDeg: number;
  planarRotOffsetDeg: number;
};

var DETAIL_SYNC_INTERVAL_MS = 160;
var URL_SYNC_INTERVAL_MS = 800;

var state: ShowcaseState = _initialState();
var lastFrame = performance.now();
var lastDetailSync = 0;
var lastUrlSync = 0;
var lastMoonListHtml = '';
var lastRenderError = '';

var _starField: StarData[] | null = null;
var _milkyWay: MilkyWayParticle[] | null = null;
var _starWorldId = '';

var worldSelect = _must<HTMLSelectElement>('hero-world');
var yearInput = _must<HTMLInputElement>('hero-year');
var slotSelect = _must<HTMLSelectElement>('hero-slot');
var dayInput = _must<HTMLInputElement>('hero-day');
var timeJoystick = _must<HTMLButtonElement>('hero-time-joystick');
var timeJoystickSpeed = _must<HTMLElement>('hero-time-joystick-speed');
var timeLabel = _must<HTMLOutputElement>('hero-time-label');
var playToggle = _must<HTMLButtonElement>('play-toggle');
var speedSelect = _must<HTMLSelectElement>('hero-speed');
var lunarSizeSelect = _must<HTMLSelectElement>('hero-lunar-size');
var planarPlayToggle = document.getElementById('planar-play-toggle') as HTMLButtonElement | null;
var planarSpeedSelect = document.getElementById('planar-speed') as HTMLSelectElement | null;
var planarTimeJoystick = document.getElementById('planar-time-joystick') as HTMLButtonElement | null;
var planarTimeJoystickSpeed = document.getElementById('planar-time-joystick-speed') as HTMLElement | null;
var sceneDateLabel = _must<HTMLElement>('scene-date-label');
var sceneSubtitle = _must<HTMLElement>('scene-subtitle');
var sceneViewNote = _must<HTMLElement>('scene-view-note');
var moonList = _must<HTMLElement>('moon-list');
var worldSummary = _must<HTMLElement>('world-summary');
var calendarGallery = _must<HTMLElement>('calendar-gallery');
var gallerySourceToggle = _must<HTMLButtonElement>('gallery-source-toggle');
var gallerySourceDropdown = _must<HTMLElement>('gallery-source-dropdown');
var galleryYearInput = _must<HTMLInputElement>('gallery-year');
var galleryMonthSelect = _must<HTMLSelectElement>('gallery-month');
var galleryDayInput = _must<HTMLInputElement>('gallery-day');
var galleryVariantSelect = _must<HTMLSelectElement>('gallery-variant');
var galleryVariantLabel = _must<HTMLElement>('gallery-variant-label');
var gallerySeedInput = _must<HTMLInputElement>('gallery-seed');
var solarSystemCard = document.getElementById('solar-system-card');
var solarSystemCanvas = document.getElementById('solar-system-canvas') as HTMLCanvasElement | null;
var copyLinkButton = _must<HTMLButtonElement>('copy-link');
var canvas = _must<HTMLCanvasElement>('sky-canvas');
var ctx = canvas.getContext('2d');

if (!ctx) throw new Error('Canvas context not available.');


var planarCard = document.getElementById('planar-card');
var planarCanvas = document.getElementById('planar-canvas') as HTMLCanvasElement | null;
var planarCtx: CanvasRenderingContext2D | null = null;
var planarLegend = document.getElementById('planar-legend');
var lastPlanarLegendHtml = '';

function _ensurePlanarCtx(): CanvasRenderingContext2D | null {
  if (planarCtx) return planarCtx;
  if (!planarCanvas) return null;
  planarCtx = planarCanvas.getContext('2d');
  return planarCtx;
}

try {
  _renderWorldOptions();
  _syncGalleryControlsFromState();
  _renderCalendarGallery();
  _syncControlsFromState();
  _drawSolarSystem(state.worldId);
} catch (err) {
  console.error('Showcase init error:', err);
}
_bindEvents();
_attemptRender(true, true, performance.now());
requestAnimationFrame(_tick);

function _initialState(): ShowcaseState {
  var url = new URL(window.location.href);
  var requestedWorld = String(url.searchParams.get('world') || 'eberron').toLowerCase();
  var worldId = WORLDS[requestedWorld] ? requestedWorld : 'eberron';
  var world = WORLDS[worldId];
  var slotIndex = regularMonthIndexToSlotIndex(worldId, world.defaultDate.month);
  var dateBits = _parseDateParam(worldId, url.searchParams.get('date'));
  if (dateBits) {
    slotIndex = dateBits.slotIndex;
  }
  var year = dateBits ? dateBits.year : world.defaultDate.year;
  var day = dateBits ? dateBits.day : world.defaultDate.day;
  var serial = toWorldSerial(worldId, year, slotIndex, day);
  var viewAzRaw = parseFloat(url.searchParams.get('viewAz') || '');
  var viewFovRaw = parseFloat(url.searchParams.get('viewFov') || '');
  return {
    worldId: worldId,
    serial: serial,
    timeFrac: _parseTimeParam(url.searchParams.get('time')),
    lunarSizeMode: _parseLunarSizeParam(url.searchParams.get('lunarSize')),
    skyPlaying: false,
    speedHoursPerSecond: 12,
    skyScrubHoursPerSecond: 0,
    skyScrubActive: false,
    planarSerial: serial,
    planarPlaying: false,
    planarDaysPerSecond: 1,
    planarScrubDaysPerSecond: 0,
    planarScrubActive: false,
    viewCenterAz: isFinite(viewAzRaw) ? ((viewAzRaw % 360) + 360) % 360 : 180,
    viewFovDeg: isFinite(viewFovRaw) ? Math.max(40, Math.min(360, viewFovRaw)) : 200,
    planarTiltDeg: 75,
    planarRotOffsetDeg: 0
  };
}

function _bindEvents(){
  worldSelect.addEventListener('change', function(){
    var nextWorld = String(worldSelect.value || 'eberron').toLowerCase();
    var next = WORLDS[nextWorld] ? nextWorld : 'eberron';
    var world = WORLDS[next];
    state.worldId = next;
    state.serial = toWorldSerial(next, world.defaultDate.year, regularMonthIndexToSlotIndex(next, world.defaultDate.month), world.defaultDate.day);
    state.timeFrac = 22 / 24;
    clearTextureCache();
    _syncControlsFromState();
    _attemptRender(true, true, performance.now());
    _renderGallerySourceOptions(next);
    _renderGalleryVariantOptions(next);
    _renderGalleryMonthOptions(next);
    galleryYearInput.value = String(world.defaultDate.year);
    galleryDayInput.value = String(world.defaultDate.day);
    _drawSolarSystem(next);
    _renderCalendarGallery();
  });

  yearInput.addEventListener('change', _updateStateFromControls);
  slotSelect.addEventListener('change', _updateStateFromControls);
  dayInput.addEventListener('change', _updateStateFromControls);
  _bindSkyJoystick();
  _bindPlanarJoystick();

  playToggle.addEventListener('click', function(){
    state.skyPlaying = !state.skyPlaying;
    if (state.skyPlaying) {
      lastDetailSync = 0;
      lastUrlSync = 0;
    }
    playToggle.textContent = state.skyPlaying ? 'Pause' : 'Play';
    _attemptRender(true, true, performance.now());
  });

  speedSelect.addEventListener('change', function(){
    state.speedHoursPerSecond = parseFloat(speedSelect.value) || 12;
    _syncControlsFromState();
    _attemptRender(true, true, performance.now());
  });
  lunarSizeSelect.addEventListener('change', function(){
    state.lunarSizeMode = _normalizeLunarSizeMode(lunarSizeSelect.value);
    _syncControlsFromState();
    _attemptRender(true, true, performance.now());
  });
  if (planarSpeedSelect) {
    planarSpeedSelect.addEventListener('change', function(){
      state.planarDaysPerSecond = parseFloat(planarSpeedSelect.value) || 1;
      _syncControlsFromState();
      _attemptRender(true, true, performance.now());
    });
  }
  if (planarPlayToggle) {
    planarPlayToggle.addEventListener('click', function(){
      state.planarPlaying = !state.planarPlaying;
      planarPlayToggle!.textContent = state.planarPlaying ? 'Pause' : 'Play';
      _attemptRender(true, true, performance.now());
    });
  }

  copyLinkButton.addEventListener('click', async function(){
    var link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      copyLinkButton.textContent = 'Copied';
      window.setTimeout(function(){
        copyLinkButton.textContent = 'Copy Scene URL';
      }, 1200);
    } catch (err) {
      copyLinkButton.textContent = 'Copy Failed';
      window.setTimeout(function(){
        copyLinkButton.textContent = 'Copy Scene URL';
      }, 1200);
    }
  });

  // Gallery source multi-select
  gallerySourceToggle.addEventListener('click', function(){
    gallerySourceDropdown.hidden = !gallerySourceDropdown.hidden;
  });
  document.addEventListener('click', function(ev){
    if (!gallerySourceDropdown.hidden && !(ev.target as HTMLElement).closest('#gallery-source-wrap')) {
      gallerySourceDropdown.hidden = true;
    }
  });

  galleryYearInput.addEventListener('change', _renderCalendarGallery);
  galleryMonthSelect.addEventListener('change', _renderCalendarGallery);
  galleryDayInput.addEventListener('change', _renderCalendarGallery);
  galleryVariantSelect.addEventListener('change', _renderCalendarGallery);
  gallerySeedInput.addEventListener('input', _renderCalendarGallery);

  // ── Sky canvas: drag-to-pan ──
  canvas.style.cursor = 'grab';

  canvas.addEventListener('mousedown', function(e){
    if (e.button !== 0) return;
    _dragState = { active: true, startX: e.clientX, startAz: state.viewCenterAz, moved: false };
    canvas.style.cursor = 'grabbing';
    // Hide tooltip on interaction
    var tip = document.getElementById('sky-tooltip');
    if (tip) tip.hidden = true;
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e){
    if (_dragState && _dragState.active){
      var dx = e.clientX - _dragState.startX;
      // Convert pixel delta to degrees using the canvas display size
      var rect = canvas.getBoundingClientRect();
      var deltaAz = (dx / rect.width) * state.viewFovDeg;
      state.viewCenterAz = ((_dragState.startAz - deltaAz) % 360 + 360) % 360;
      if (Math.abs(dx) > 3) _dragState.moved = true;
      _attemptRender(false, false, performance.now());
    } else {
      // Hover cursor: check if over a moon
      _updateMoonHoverCursor(e);
    }
  });

  window.addEventListener('mouseup', function(e){
    if (_dragState && _dragState.active){
      var wasDrag = _dragState.moved;
      _dragState = null;
      canvas.style.cursor = 'grab';
      if (!wasDrag){
        // It was a click, not a drag — check for moon hit
        _handleMoonClick(e);
      }
      _attemptRender(true, true, performance.now());
    }
  });

  // ── Sky canvas: scroll-to-zoom ──
  canvas.addEventListener('wheel', function(e){
    e.preventDefault();
    var zoomFactor = e.deltaY > 0 ? 1.1 : (1 / 1.1);
    state.viewFovDeg = Math.max(VIEW_FOV_MIN, Math.min(VIEW_FOV_MAX, state.viewFovDeg * zoomFactor));
    _attemptRender(false, false, performance.now());
  }, { passive: false });

  // ── Sky canvas: touch support ──
  canvas.addEventListener('touchstart', function(e){
    if (e.touches.length !== 1) return;
    var t = e.touches[0];
    _dragState = { active: true, startX: t.clientX, startAz: state.viewCenterAz, moved: false };
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', function(e){
    if (!_dragState || !_dragState.active || e.touches.length !== 1) return;
    var t = e.touches[0];
    var dx = t.clientX - _dragState.startX;
    var rect = canvas.getBoundingClientRect();
    var deltaAz = (dx / rect.width) * state.viewFovDeg;
    state.viewCenterAz = ((_dragState.startAz - deltaAz) % 360 + 360) % 360;
    if (Math.abs(dx) > 3) _dragState.moved = true;
    _attemptRender(false, false, performance.now());
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', function(){
    if (_dragState){
      _dragState = null;
      _attemptRender(true, true, performance.now());
    }
  });

  // ── Planar canvas: 3D orbit drag ──
  if (planarCanvas) {
    planarCanvas.style.cursor = 'grab';
    planarCanvas.style.touchAction = 'none';

    planarCanvas.addEventListener('mousedown', function(e){
      if (e.button !== 0) return;
      _planarDragState = { active: true, startX: e.clientX, startY: e.clientY, startTilt: state.planarTiltDeg, startRot: state.planarRotOffsetDeg };
      planarCanvas!.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', function(e){
      if (!_planarDragState || !_planarDragState.active) return;
      var dx = e.clientX - _planarDragState.startX;
      var dy = e.clientY - _planarDragState.startY;
      state.planarRotOffsetDeg = _planarDragState.startRot + dx * 0.5;
      state.planarTiltDeg = Math.max(15, Math.min(89, _planarDragState.startTilt + dy * 0.3));
      _attemptRender(false, false, performance.now());
    });

    window.addEventListener('mouseup', function(){
      if (_planarDragState && _planarDragState.active) {
        _planarDragState = null;
        if (planarCanvas) planarCanvas.style.cursor = 'grab';
        _attemptRender(true, true, performance.now());
      }
    });

    planarCanvas.addEventListener('touchstart', function(e){
      if (e.touches.length !== 1) return;
      var t = e.touches[0];
      _planarDragState = { active: true, startX: t.clientX, startY: t.clientY, startTilt: state.planarTiltDeg, startRot: state.planarRotOffsetDeg };
      e.preventDefault();
    }, { passive: false });

    planarCanvas.addEventListener('touchmove', function(e){
      if (!_planarDragState || !_planarDragState.active || e.touches.length !== 1) return;
      var t = e.touches[0];
      var dx = t.clientX - _planarDragState.startX;
      var dy = t.clientY - _planarDragState.startY;
      state.planarRotOffsetDeg = _planarDragState.startRot + dx * 0.5;
      state.planarTiltDeg = Math.max(15, Math.min(89, _planarDragState.startTilt + dy * 0.3));
      _attemptRender(false, false, performance.now());
      e.preventDefault();
    }, { passive: false });

    planarCanvas.addEventListener('touchend', function(){
      _planarDragState = null;
    });

    // Suppress zoom on the planar canvas
    planarCanvas.addEventListener('wheel', function(e){ e.preventDefault(); }, { passive: false });
  }
}

function _canvasMouseCoords(e: MouseEvent): { cx: number; cy: number } | null {
  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  return { cx: (e.clientX - rect.left) * scaleX, cy: (e.clientY - rect.top) * scaleY };
}

function _hitTestMoon(cx: number, cy: number): typeof _drawnMoons[0] | null {
  for (var i = _drawnMoons.length - 1; i >= 0; i--){
    var m = _drawnMoons[i];
    var dx = cx - m.x, dy = cy - m.y;
    if (dx * dx + dy * dy <= (m.radius + 6) * (m.radius + 6)) return m;
  }
  return null;
}

function _updateMoonHoverCursor(e: MouseEvent){
  var coords = _canvasMouseCoords(e);
  if (!coords) return;
  var rect = canvas.getBoundingClientRect();
  // Only if mouse is over the canvas
  if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
  var hit = _hitTestMoon(coords.cx, coords.cy);
  canvas.style.cursor = hit ? 'pointer' : 'grab';
}

var skyTooltip: HTMLElement | null = null;

function _handleMoonClick(e: MouseEvent){
  var coords = _canvasMouseCoords(e);
  if (!coords) return;
  var hit = _hitTestMoon(coords.cx, coords.cy);
  if (!skyTooltip) skyTooltip = document.getElementById('sky-tooltip');
  if (!skyTooltip) return;
  if (!hit){
    skyTooltip.hidden = true;
    return;
  }
  var moon = hit.moon;
  var phasePct = Math.round(moon.pctFull);
  var phaseLabel = moon.phase.waxing
    ? (phasePct < 3 ? 'New' : phasePct < 47 ? 'Waxing Crescent' : phasePct < 53 ? 'First Quarter' : phasePct < 97 ? 'Waxing Gibbous' : 'Full')
    : (phasePct < 3 ? 'New' : phasePct < 47 ? 'Waning Crescent' : phasePct < 53 ? 'Last Quarter' : phasePct < 97 ? 'Waning Gibbous' : 'Full');
  skyTooltip.innerHTML =
    '<strong>' + _esc(moon.name) + '</strong>' +
    (moon.title ? '<br><em>' + _esc(moon.title) + '</em>' : '') +
    '<br>' + phaseLabel + ' (' + phasePct + '%)' +
    '<br>Altitude: ' + Math.round(moon.altitudeExact) + '°' +
    '<br>Direction: ' + _esc(moon.direction) +
    '<br>Angular size: ' + moon.angularDiameterDeg.toFixed(2) + '°';
  // Position tooltip near the click in the hero-scene container
  var rect = canvas.getBoundingClientRect();
  var heroScene = canvas.parentElement;
  if (!heroScene) return;
  var heroRect = heroScene.getBoundingClientRect();
  var left = e.clientX - heroRect.left + 12;
  var top = e.clientY - heroRect.top + 12;
  // Clamp to stay inside
  if (left + 180 > heroRect.width) left = left - 200;
  if (top + 120 > heroRect.height) top = top - 130;
  skyTooltip.style.left = Math.max(4, left) + 'px';
  skyTooltip.style.top = Math.max(4, top) + 'px';
  skyTooltip.hidden = false;
}

function _updateStateFromControls(){
  var year = parseInt(yearInput.value, 10) || WORLDS[state.worldId].defaultDate.year;
  var slotIndex = Math.max(0, Math.min(getWorldCalendarSlots(state.worldId).length - 1, parseInt(slotSelect.value, 10) || 0));
  var day = clampDayForSlot(state.worldId, slotIndex, parseInt(dayInput.value, 10) || 1);
  state.serial = toWorldSerial(state.worldId, year, slotIndex, day);
  _syncControlsFromState();
  _attemptRender(true, true, performance.now());
}

function _attemptRender(forceDetails: boolean, forceUrl: boolean, now: number){
  try {
    _render(forceDetails, forceUrl, now);
    if (lastRenderError) {
      sceneSubtitle.textContent = WORLDS[state.worldId].description;
      lastRenderError = '';
    }
  } catch (err) {
    var message = err instanceof Error ? err.message : String(err || 'Unknown render error');
    if (message !== lastRenderError) {
      console.error('Showcase render error:', err);
      sceneSubtitle.textContent = 'Render error: ' + message;
      lastRenderError = message;
    }
  }
}

function _renderWorldOptions(){
  worldSelect.innerHTML = WORLD_ORDER.map(function(worldId){
    var world = WORLDS[worldId];
    return '<option value="' + worldId + '">' + _esc(world.label) + '</option>';
  }).join('');
}

function _renderSlotOptions(worldId: string, activeSlotIndex: number){
  slotSelect.innerHTML = getWorldCalendarSlots(worldId).map(function(slot){
    var suffix = slot.isIntercalary ? ' (festival)' : '';
    var selected = slot.slotIndex === activeSlotIndex ? ' selected' : '';
    return '<option value="' + slot.slotIndex + '"' + selected + '>' + _esc(slot.name + suffix) + '</option>';
  }).join('');
}

function _syncControlsFromState(){
  var world = WORLDS[state.worldId];
  var date = fromWorldSerial(state.worldId, state.serial);
  worldSelect.value = state.worldId;
  yearInput.value = String(date.year);
  if (slotSelect.dataset.worldId !== state.worldId) {
    _renderSlotOptions(state.worldId, date.slotIndex);
    slotSelect.dataset.worldId = state.worldId;
  }
  slotSelect.value = String(date.slotIndex);
  dayInput.max = String(Math.max(1, getWorldCalendarSlots(state.worldId)[date.slotIndex].days | 0));
  dayInput.value = String(date.day);
  var totalMinutes = Math.round(state.timeFrac * 1440) % 1440;
  timeLabel.textContent = _formatClock(totalMinutes);
  if (!state.skyScrubHoursPerSecond) {
    timeJoystickSpeed.textContent = 'Hold to scrub time (±30m/hr/4hr/12hr/24hr)';
  }
  if (planarTimeJoystickSpeed && !state.planarScrubDaysPerSecond) {
    planarTimeJoystickSpeed.textContent = 'Hold to scrub planar time (±1d/1mo/6mo/1yr/5yr per sec)';
  }
  speedSelect.value = String(state.speedHoursPerSecond);
  lunarSizeSelect.value = state.lunarSizeMode;
  if (planarSpeedSelect) planarSpeedSelect.value = String(state.planarDaysPerSecond);
  playToggle.textContent = state.skyPlaying ? 'Pause' : 'Play';
  if (planarPlayToggle) planarPlayToggle.textContent = state.planarPlaying ? 'Pause' : 'Play';
  sceneDateLabel.textContent = formatWorldDate(state.worldId, state.serial);
  sceneSubtitle.textContent = world.description;
  if (worldSummary.dataset.worldId !== state.worldId) {
    worldSummary.innerHTML = _buildWorldSummary(state.worldId);
    worldSummary.dataset.worldId = state.worldId;
  }
  if (planarCard) planarCard.hidden = state.worldId !== 'eberron';
  if (solarSystemCard) solarSystemCard.hidden = !_hasOrbitalData(state.worldId);
}

function _render(forceDetails: boolean, forceUrl: boolean, now: number){
  var scene = buildSkyScene({
    worldId: state.worldId,
    serial: state.serial,
    timeFrac: state.timeFrac,
    observerLatitude: SCENE_OBSERVER_LATITUDE
  });
  sceneDateLabel.textContent = formatWorldDate(state.worldId, state.serial);
  timeLabel.textContent = _formatClock(Math.round(state.timeFrac * 1440));
  var lunarSizeLabel = state.lunarSizeMode === 'true' ? 'True Size lunar scale' : 'Visually Useful lunar scale';
  sceneViewNote.textContent = 'Sky When Viewed Looking ' + _sceneFacingDirection() + ' from ' + _formatLatitude(scene.observerLatitude) + '. Earth-sized planet. ' + lunarSizeLabel + '.';
  _drawScene(scene);
  var pCtxReady = state.worldId === 'eberron' ? _ensurePlanarCtx() : null;
  if (pCtxReady) {
    var planarPhases = getAllShowcasePlanarPhases(state.planarSerial);
    _drawPlanarDiagram(planarPhases);
    if (forceDetails || (now - lastDetailSync) >= DETAIL_SYNC_INTERVAL_MS) {
      _renderPlanarLegend(planarPhases);
    }
  }
  if (forceDetails || (now - lastDetailSync) >= DETAIL_SYNC_INTERVAL_MS) {
    _renderMoonList(scene);
    lastDetailSync = now;
  }
  if (forceUrl || (now - lastUrlSync) >= URL_SYNC_INTERVAL_MS) {
    _updateUrl();
    lastUrlSync = now;
  }
}

function _renderCalendarGallery(){
  try { _renderCalendarGalleryInner(); } catch (err) {
    console.error('Gallery render error:', err);
    calendarGallery.innerHTML = '<p style="color:#9a9590;padding:1rem;">Calendar gallery could not render.</p>';
  }
}

function _renderCalendarGalleryInner(){
  var worldId = String(state.worldId || 'eberron').toLowerCase();
  if (!WORLDS[worldId]) worldId = 'eberron';
  var world = WORLDS[worldId];
  var year = parseInt(galleryYearInput.value, 10);
  if (!isFinite(year)) year = world.defaultDate.year;
  galleryYearInput.value = String(year);
  var sourceKeys = _getSelectedSources();
  var months = getWorldCalendarSlots(worldId).filter(function(slot){
    return slot.isIntercalary !== true;
  });
  var eventRows = _eventRowsForSources(worldId, sourceKeys, year);
  var eventsBySlotDay = _indexEventsBySlotDay(worldId, eventRows, year);

  // Compute "today" from gallery date controls
  var todayMonthIndex = parseInt(galleryMonthSelect.value, 10) || 0;
  var todayDay = parseInt(galleryDayInput.value, 10) || 1;
  var todaySlotIndex = regularMonthIndexToSlotIndex(worldId, todayMonthIndex);

  calendarGallery.innerHTML = months.map(function(slot, monthIndex){
    var preview = buildCalendarPreview({
      worldId: worldId,
      year: year,
      monthIndex: monthIndex
    });
    var monthEvents = _monthEventRows(worldId, preview.slotIndex, eventRows, year);
    var mColor = _monthColor(worldId, monthIndex);
    var displayName = _overlayMonthName(worldId, monthIndex, preview.monthName);

    // Compute overflow cell day numbers for adjacent months
    var prevMonthDays = 0;
    if (monthIndex > 0){
      var prevPreview = buildCalendarPreview({ worldId: worldId, year: year, monthIndex: monthIndex - 1 });
      prevMonthDays = prevPreview.daysInMonth;
    }

    var isCurrentMonth = (preview.slotIndex === todaySlotIndex);

    // Build PureCell array from preview cells + events
    var pureCells: PureCell[] = preview.cells.map(function(cell, idx){
      if (cell.kind === 'empty'){
        var isLeading = idx < preview.leadingEmptyDays;
        var ovDay: number;
        if (isLeading){
          ovDay = prevMonthDays - (preview.leadingEmptyDays - 1 - idx);
        } else {
          ovDay = idx - (preview.leadingEmptyDays + preview.daysInMonth) + 1;
        }
        var ovColor = isLeading && monthIndex > 0
          ? _monthColor(worldId, monthIndex - 1)
          : (monthIndex < months.length - 1 ? _monthColor(worldId, monthIndex + 1) : mColor);
        return { kind: 'overflow' as const, day: ovDay, overflowColor: ovColor };
      }
      var events = eventsBySlotDay[String(preview.slotIndex) + ':' + String(cell.day)] || [];
      return {
        kind: 'day' as const,
        day: cell.day,
        isToday: isCurrentMonth && cell.day === todayDay,
        isPast: false,
        isFuture: false,
        events: events.map(function(e){ return { color: e.color || '#e6b85c' }; }),
        tooltip: events.length
          ? events.map(function(ev){ return ev.name + ' (' + _sourceLabel(worldId, ev.source || 'custom') + ')'; }).join(' \u2022 ')
          : ''
      };
    });

    // Use the exact same renderer as the Roll20 script
    var tableHtml = renderPureMonthTable({
      monthName: displayName,
      yearLabel: String(year) + ' ' + world.eraLabel,
      weekdayLabels: preview.weekdayLabels,
      monthColor: mColor,
      cells: pureCells
    });

    return (
      '<article class="calendar-card">' +
        '<div class="mini-calendar">' + tableHtml + '</div>' +
        _festivalRail(preview.intercalaryBefore.concat(preview.intercalaryAfter)) +
        _monthEventsList(monthEvents, worldId) +
      '</article>'
    );
  }).join('');
}

function _festivalRail(items: string[]){
  if (!items.length) return '';
  return (
    '<div class="festival-rail">' +
      items.map(function(item){
        return '<span class="festival-chip">' + _esc(item) + '</span>';
      }).join('') +
    '</div>'
  );
}

function _renderMoonList(scene: ReturnType<typeof buildSkyScene>){
  var nextHtml = scene.moons.map(function(row){
    return (
      '<div class="moon-row">' +
        '<span class="moon-chip" style="background:' + _esc(row.color || '#d9dee8') + ';"></span>' +
        '<div class="moon-main">' +
          '<strong>' + _esc(row.name) + '</strong>' +
          '<span>' + _esc(row.skyLabel) + '</span>' +
        '</div>' +
        '<div class="moon-meta">' + _esc(row.pctFull + '% · ' + row.direction) + '</div>' +
      '</div>'
    );
  }).join('');
  if (!nextHtml) {
    nextHtml = '<div class="moon-row"><div class="moon-main"><strong>No moon data</strong><span>This world has no configured moon display rows.</span></div></div>';
  }
  if (nextHtml !== lastMoonListHtml) {
    moonList.innerHTML = nextHtml;
    lastMoonListHtml = nextHtml;
  }
}

var PANO_DEFAULT_FOV = 200;
var PANO_ALT_MAX = 75;
var PANO_TOP_MARGIN = 70;
var PANO_BOTTOM_MARGIN = 32;
var SCENE_OBSERVER_LATITUDE = 37.7749;
var VIEW_FOV_MIN = 40;
var VIEW_FOV_MAX = 360;

// Drag-to-pan state
var _dragState: { active: boolean; startX: number; startAz: number; moved: boolean } | null = null;

// Hit-test cache for drawn moons (rebuilt each frame)
var _drawnMoons: { name: string; x: number; y: number; radius: number; moon: any }[] = [];

function _viewMin(){ return state.viewCenterAz - state.viewFovDeg / 2; }
function _viewMax(){ return state.viewCenterAz + state.viewFovDeg / 2; }

function _normalizeAzToView(azimuthDeg: number){
  // Normalize azimuth relative to the view window so wrapping works
  var vMin = _viewMin();
  var rel = ((azimuthDeg - vMin) % 360 + 360) % 360;
  return rel;
}

function _panoramicPoint(width: number, height: number, azimuthDeg: number, altitudeDeg: number){
  var usableHeight = height - PANO_TOP_MARGIN - PANO_BOTTOM_MARGIN;
  var rel = _normalizeAzToView(azimuthDeg);
  var x = (rel / state.viewFovDeg) * width;
  var y = PANO_TOP_MARGIN + (1 - Math.max(0, Math.min(PANO_ALT_MAX, altitudeDeg)) / PANO_ALT_MAX) * usableHeight;
  return { x: x, y: y };
}

function _panoramicMoonPoint(width: number, height: number, azimuthDeg: number, altitudeDeg: number){
  var usableHeight = height - PANO_TOP_MARGIN - PANO_BOTTOM_MARGIN;
  var rel = _normalizeAzToView(azimuthDeg);
  var x = (rel / state.viewFovDeg) * width;
  // Keep motion continuous through the horizon by allowing a small below-horizon
  // overscan for "peeking" moons instead of pinning them at 0° altitude.
  var altCapped = Math.max(-12, Math.min(PANO_ALT_MAX, altitudeDeg));
  var y = PANO_TOP_MARGIN + (1 - (altCapped / PANO_ALT_MAX)) * usableHeight;
  return { x: x, y: y };
}

function _drawScene(scene: ReturnType<typeof buildSkyScene>){
  if (!ctx) return;
  var width = canvas.width;
  var height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  var skyBottom = height - PANO_BOTTOM_MARGIN;
  var gradient = ctx.createLinearGradient(0, PANO_TOP_MARGIN, 0, skyBottom);
  gradient.addColorStop(0, '#060e1e');
  gradient.addColorStop(0.15, '#0a1a30');
  gradient.addColorStop(0.4, '#0c1e30');
  gradient.addColorStop(0.65, '#0e1f2f');
  gradient.addColorStop(0.85, '#1a1a20');
  gradient.addColorStop(1, '#1e1510');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, PANO_TOP_MARGIN, width, skyBottom - PANO_TOP_MARGIN);
  ctx.fillStyle = '#040810';
  ctx.fillRect(0, 0, width, PANO_TOP_MARGIN);
  // nebula washes
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  var neb1 = ctx.createRadialGradient(width * 0.3, PANO_TOP_MARGIN + (skyBottom - PANO_TOP_MARGIN) * 0.25, 0, width * 0.3, PANO_TOP_MARGIN + (skyBottom - PANO_TOP_MARGIN) * 0.25, width * 0.35);
  neb1.addColorStop(0, 'rgba(30,15,50,0.04)');
  neb1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = neb1;
  ctx.fillRect(0, PANO_TOP_MARGIN, width, skyBottom - PANO_TOP_MARGIN);
  var neb2 = ctx.createRadialGradient(width * 0.75, PANO_TOP_MARGIN + (skyBottom - PANO_TOP_MARGIN) * 0.4, 0, width * 0.75, PANO_TOP_MARGIN + (skyBottom - PANO_TOP_MARGIN) * 0.4, width * 0.3);
  neb2.addColorStop(0, 'rgba(10,30,40,0.03)');
  neb2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = neb2;
  ctx.fillRect(0, PANO_TOP_MARGIN, width, skyBottom - PANO_TOP_MARGIN);
  ctx.restore();
  // vignette
  var vig = ctx.createRadialGradient(width / 2, (PANO_TOP_MARGIN + skyBottom) / 2, Math.min(width, skyBottom - PANO_TOP_MARGIN) * 0.35, width / 2, (PANO_TOP_MARGIN + skyBottom) / 2, Math.max(width, skyBottom - PANO_TOP_MARGIN) * 0.7);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, PANO_TOP_MARGIN, width, skyBottom - PANO_TOP_MARGIN);

  _drawStars(width, height, state.timeFrac);

  var horizonY = height - PANO_BOTTOM_MARGIN;
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width, horizonY);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(127, 196, 216, 0.4)';
  ctx.stroke();

  var alt30 = _panoramicPoint(width, height, 180, 30);
  var alt60 = _panoramicPoint(width, height, 180, 60);
  ctx.setLineDash([4, 8]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(127, 196, 216, 0.15)';
  ctx.beginPath();
  ctx.moveTo(0, alt30.y);
  ctx.lineTo(width, alt30.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, alt60.y);
  ctx.lineTo(width, alt60.y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (scene.worldId === 'eberron') _drawSiberysRing(width, height, scene.observerLatitude);

  _drawCompass(width, height);

  _drawnMoons = [];
  var drawMoons = scene.moons.slice().sort(function(a, b){
    return Number(b.orbitalDistance || 0) - Number(a.orbitalDistance || 0);
  });
  var labeled = 0;
  for (var i = 0; i < drawMoons.length; i++){
    var moon = drawMoons[i];
    if (moon.category === 'below') continue;
    // Use hour-angle space for horizontal placement to avoid apparent
    // acceleration when azimuth curves sharply near the top of the arc.
    var panoAz = (isFinite(Number((moon as any).hourAngle)) ? (180 + Number((moon as any).hourAngle)) : moon.azimuth);
    var relAz = _normalizeAzToView(panoAz);
    if (relAz < -5 || relAz > state.viewFovDeg + 5) continue;
    var position = _panoramicMoonPoint(width, height, panoAz, moon.altitudeExact);
    var moonRadius = _moonRadiusPx(moon.angularDiameterDeg, state.lunarSizeMode);
    _drawMoonDisk(position.x, position.y, moonRadius, moon.color || '#d8dee7', moon.phase, !!moon.retrograde, Number(moon.albedo || 0.12), moon.name);
    _drawnMoons.push({ name: moon.name, x: position.x, y: position.y, radius: moonRadius, moon: moon });
    if (labeled < 5 && moon.altitudeExact >= 2){
      ctx.fillStyle = 'rgba(247, 242, 232, 0.92)';
      ctx.font = '15px "Trebuchet MS", "Gill Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(moon.name, position.x, position.y + moonRadius + 18);
      labeled++;
    }
  }

  ctx.fillStyle = 'rgba(247, 242, 232, 0.72)';
  ctx.font = '16px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(scene.worldLabel + ' sky', 28, 36);
  ctx.fillText(_formatClock(Math.round(scene.timeFrac * 1440)), 28, 58);
}

function _drawStars(width: number, height: number, timeFrac: number){
  if (!ctx) return;
  // lazily init / re-init star field when world changes
  if (!_starField || _starWorldId !== state.worldId){
    _starField = generateStarField(width, height, state.worldId, PANO_TOP_MARGIN, PANO_BOTTOM_MARGIN);
    _milkyWay = generateMilkyWay(width, height, state.worldId, PANO_TOP_MARGIN, PANO_BOTTOM_MARGIN);
    _starWorldId = state.worldId;
  }
  var zoomScale = PANO_DEFAULT_FOV / state.viewFovDeg;
  // draw milky-way particles
  if (_milkyWay){
    ctx.save();
    for (var mi = 0; mi < _milkyWay.length; mi++){
      var mp = _milkyWay[mi];
      var mRel = _normalizeAzToView(mp.az);
      if (mRel < -2 || mRel > state.viewFovDeg + 2) continue;
      var mPt = _panoramicPoint(width, height, mp.az, mp.alt);
      ctx.fillStyle = 'rgba(220,215,200,' + (mp.alpha * 0.15) + ')';
      ctx.fillRect(mPt.x, mPt.y, mp.size * zoomScale, mp.size * zoomScale);
    }
    ctx.restore();
  }
  // draw stars with independent twinkle
  var t2pi = timeFrac * Math.PI * 2;
  for (var i = 0; i < _starField.length; i++){
    var s = _starField[i];
    // skip stars outside the current view
    var sRel = _normalizeAzToView(s.az);
    if (sRel < -2 || sRel > state.viewFovDeg + 2) continue;
    var pt = _panoramicPoint(width, height, s.az, s.alt);
    var twinkle = Math.sin(t2pi * s.twinkleFreq + s.twinklePhase);
    var alpha = Math.max(0, s.baseAlpha + twinkle * (s.tier === 0 ? 0.25 : s.tier === 1 ? 0.15 : 0.08));
    if (alpha < 0.01) continue;
    var sz = s.size * zoomScale;
    if (s.tier === 2){
      ctx.fillStyle = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
      ctx.fillRect(pt.x, pt.y, sz * 2, sz * 2);
    } else if (s.tier === 1){
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, sz, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
      ctx.fill();
    } else {
      ctx.save();
      ctx.fillStyle = 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + alpha + ')';
      ctx.fillRect(pt.x - sz * 2.5, pt.y - 0.4, sz * 5, 0.8);
      ctx.fillRect(pt.x - 0.4, pt.y - sz * 2.5, 0.8, sz * 5);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, sz * 0.8, 0, Math.PI * 2);
      ctx.fill();
      var halo = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, sz * 4);
      halo.addColorStop(0, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',' + (alpha * 0.12) + ')');
      halo.addColorStop(1, 'rgba(' + s.r + ',' + s.g + ',' + s.b + ',0)');
      ctx.fillStyle = halo;
      ctx.fillRect(pt.x - sz * 4, pt.y - sz * 4, sz * 8, sz * 8);
      ctx.restore();
    }
  }
}

function _drawCompass(width: number, height: number){
  if (!ctx) return;
  var allDirections = [
    { text: 'N', az: 0 }, { text: 'NE', az: 45 }, { text: 'E', az: 90 },
    { text: 'SE', az: 135 }, { text: 'S', az: 180 }, { text: 'SW', az: 225 },
    { text: 'W', az: 270 }, { text: 'NW', az: 315 }
  ];
  ctx.fillStyle = 'rgba(247, 242, 232, 0.66)';
  ctx.font = '14px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'center';
  var labelY = height - 8;
  for (var d = 0; d < allDirections.length; d++){
    var label = allDirections[d];
    var rel = _normalizeAzToView(label.az);
    if (rel < 0 || rel > state.viewFovDeg) continue;
    var pt = _panoramicPoint(width, height, label.az, 0);
    ctx!.fillText(label.text, pt.x, labelY);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(127, 196, 216, 0.5)';
  ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
  var vMin = _viewMin();
  var pt30 = _panoramicPoint(width, height, vMin, 30);
  var pt60 = _panoramicPoint(width, height, vMin, 60);
  ctx.fillText('30°', 6, pt30.y + 4);
  ctx.fillText('60°', 6, pt60.y + 4);
}

function _scenePoint(cx: number, cy: number, radius: number, azimuthDeg: number, altitudeDeg: number){
  return _panoramicPoint(canvas.width, canvas.height, azimuthDeg, altitudeDeg);
}

function _sceneFacingDirection(){
  var centerAz = ((state.viewCenterAz) + 360) % 360;
  if (centerAz >= 45 && centerAz < 135) return 'East';
  if (centerAz >= 135 && centerAz < 225) return 'South';
  if (centerAz >= 225 && centerAz < 315) return 'West';
  return 'North';
}

function _formatLatitude(latitudeDeg: number){
  var abs = Math.abs(latitudeDeg);
  var hemisphere = latitudeDeg >= 0 ? 'N' : 'S';
  return abs.toFixed(2) + '° ' + hemisphere;
}

function _drawMoonDisk(x: number, y: number, radius: number, color: string, phase: { illum: number; waxing: boolean }, retrograde: boolean, albedo: number, moonName: string){
  if (!ctx) return;
  var albedoScale = Math.max(0.25, Math.min(2.2, albedo / 0.12));
  var isBarrakas = moonName === 'Barrakas';
  var glowRadius = radius * (1.5 + albedoScale * 0.5) * (isBarrakas ? 1.8 : 1);

  // atmospheric glow halo (drawn behind the disk)
  // Use a multi-stop radial gradient for a soft, natural feather with no hard edge
  var glowAlpha = Math.max(0.04, Math.min(0.18, 0.05 + albedoScale * 0.04)) * (isBarrakas ? 2.2 : 1);
  var glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
  glowGrad.addColorStop(0, color);
  glowGrad.addColorStop(0.3, color);
  glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
  ctx.fill();
  // second wider pass for very faint outer haze
  var outerGlow = ctx.createRadialGradient(x, y, glowRadius * 0.3, x, y, glowRadius * 1.6);
  outerGlow.addColorStop(0, color);
  outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = glowAlpha * 0.3;
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(x, y, glowRadius * 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // draw cached procedural texture
  var tex = getMoonTexture(moonName, color, radius);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(tex, x - radius, y - radius, radius * 2, radius * 2);

  // Zarantyr storm rotation effect
  if (moonName === 'Zarantyr'){
    ctx.globalAlpha = 0.15;
    ctx.translate(x, y);
    ctx.rotate(state.timeFrac * Math.PI * 0.3);
    ctx.drawImage(tex, -radius, -radius, radius * 2, radius * 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }

  // phase shadow — elliptical terminator
  var illum = Math.max(0, Math.min(1, phase.illum));
  var waxing = retrograde ? !phase.waxing : phase.waxing;
  ctx.fillStyle = 'rgba(3, 6, 12, 0.92)';
  if (illum < 0.995){
    ctx.beginPath();
    // draw shadow on the unlit side
    var terminatorX = Math.cos(illum * Math.PI) * radius;
    if (waxing){
      // shadow on the left (waxing: lit from right)
      ctx.arc(x, y, radius, Math.PI * 0.5, Math.PI * 1.5); // left semicircle
      ctx.ellipse(x, y, Math.abs(terminatorX), radius, 0, Math.PI * 1.5, Math.PI * 0.5, terminatorX > 0);
    } else {
      // shadow on the right (waning: lit from left)
      ctx.arc(x, y, radius, -Math.PI * 0.5, Math.PI * 0.5); // right semicircle
      ctx.ellipse(x, y, Math.abs(terminatorX), radius, 0, Math.PI * 0.5, -Math.PI * 0.5, terminatorX > 0);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // subtle edge highlight
  var edgeAlpha = Math.max(0.2, Math.min(0.7, 0.3 + albedoScale * 0.15));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = 'rgba(255, 255, 255, ' + edgeAlpha + ')';
  ctx.stroke();
}

function _buildWorldSummary(worldId: string){
  var world = WORLDS[worldId];
  var moonCount = world.moons && world.moons.bodies ? world.moons.bodies.length : 0;
  var items: string[] = [];
  items.push('<span class="world-summary-item">' + _esc(world.calendar.label) + '</span>');
  if (moonCount > 0) {
    var moonNames = world.moons.bodies.slice(0, 6).map(function(m: any){ return m.name; }).join(', ');
    if (moonCount > 6) moonNames += ' +' + (moonCount - 6);
    items.push('<span class="world-summary-item">' + _esc(String(moonCount) + ' moon' + (moonCount !== 1 ? 's' : '')) + '</span>');
    items.push('<span class="world-summary-item" title="' + _esc(moonNames) + '">' + _esc(moonNames) + '</span>');
  }
  if (worldId === 'eberron') {
    items.push('<span class="world-summary-item">13 Planes</span>');
  }
  return items.join('');
}

function _hasOrbitalData(worldId: string): boolean {
  return worldId === 'eberron';
}

var _lastSolarSystemWorld = '';
function _drawSolarSystem(worldId: string){
  if (!solarSystemCanvas || !solarSystemCard) return;
  if (worldId === _lastSolarSystemWorld) return;
  _lastSolarSystemWorld = worldId;
  var moonData = getMoonOrbitalData(worldId);
  if (!moonData.length) { solarSystemCard.hidden = true; return; }
  solarSystemCard.hidden = false;
  var ssCtx = solarSystemCanvas.getContext('2d');
  if (!ssCtx) return;
  var w = solarSystemCanvas.width;
  var h = solarSystemCanvas.height;
  ssCtx.clearRect(0, 0, w, h);

  // Background
  var bg = ssCtx.createLinearGradient(0, 0, w, 0);
  bg.addColorStop(0, 'rgba(18, 24, 48, 0.97)');
  bg.addColorStop(1, 'rgba(4, 8, 16, 0.99)');
  ssCtx.fillStyle = bg;
  ssCtx.fillRect(0, 0, w, h);

  var padLeft = 60;
  var padRight = 30;
  var usableW = w - padLeft - padRight;
  var cy = h * 0.45;

  // Sun
  var sunR = 14;
  var sunGrad = ssCtx.createRadialGradient(padLeft - 20, cy, 0, padLeft - 20, cy, sunR * 2);
  sunGrad.addColorStop(0, 'rgba(255, 230, 120, 0.4)');
  sunGrad.addColorStop(1, 'rgba(255, 230, 120, 0)');
  ssCtx.fillStyle = sunGrad;
  ssCtx.beginPath(); ssCtx.arc(padLeft - 20, cy, sunR * 2, 0, Math.PI * 2); ssCtx.fill();
  var sunBody = ssCtx.createRadialGradient(padLeft - 20, cy, 0, padLeft - 20, cy, sunR);
  sunBody.addColorStop(0, '#fff5c0');
  sunBody.addColorStop(1, '#e6b85c');
  ssCtx.fillStyle = sunBody;
  ssCtx.beginPath(); ssCtx.arc(padLeft - 20, cy, sunR, 0, Math.PI * 2); ssCtx.fill();
  ssCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ssCtx.font = '9px "Trebuchet MS", sans-serif';
  ssCtx.textAlign = 'center';
  ssCtx.fillText('Sun', padLeft - 20, cy + sunR + 12);

  // Eberron
  var eberronX = padLeft + 10;
  var eberronR = 6;
  var eGrad = ssCtx.createRadialGradient(eberronX, cy, 0, eberronX, cy, eberronR);
  eGrad.addColorStop(0, '#4a9fd4');
  eGrad.addColorStop(1, '#2060a0');
  ssCtx.fillStyle = eGrad;
  ssCtx.beginPath(); ssCtx.arc(eberronX, cy, eberronR, 0, Math.PI * 2); ssCtx.fill();
  ssCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ssCtx.font = '9px "Trebuchet MS", sans-serif';
  ssCtx.textAlign = 'center';
  ssCtx.fillText('Eberron', eberronX, cy + eberronR + 12);

  // Scale: map orbital distances linearly to remaining space
  var maxDist = moonData[moonData.length - 1].avgOrbitalDistance;
  var moonStartX = eberronX + 30;
  var moonEndX = w - padRight;
  var moonUsableW = moonEndX - moonStartX;

  for (var i = 0; i < moonData.length; i++){
    var m = moonData[i];
    var t = m.avgOrbitalDistance / maxDist;
    var mx = moonStartX + t * moonUsableW;
    // Size proportional to diameter, clamped
    var mr = Math.max(2.5, Math.min(6, (m.diameter / 2000) * 5));
    // Glow
    var mGlow = ssCtx.createRadialGradient(mx, cy, 0, mx, cy, mr * 2);
    mGlow.addColorStop(0, m.color.replace(')', ',0.15)').replace('rgb(', 'rgba(').replace('#', ''));
    // Simple approach: use color directly with alpha
    ssCtx.globalAlpha = 0.2;
    ssCtx.fillStyle = m.color;
    ssCtx.beginPath(); ssCtx.arc(mx, cy, mr * 2.5, 0, Math.PI * 2); ssCtx.fill();
    ssCtx.globalAlpha = 1;
    // Body
    var isDark = m.color === '#696969' || m.color === '#111111';
    ssCtx.fillStyle = isDark ? '#999' : m.color;
    ssCtx.beginPath(); ssCtx.arc(mx, cy, mr, 0, Math.PI * 2); ssCtx.fill();
    // Edge
    ssCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    ssCtx.lineWidth = 0.5;
    ssCtx.stroke();
    // Label (alternate above/below to avoid overlap)
    ssCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ssCtx.font = '8px "Trebuchet MS", sans-serif';
    ssCtx.textAlign = 'center';
    var labelY = (i % 2 === 0) ? cy - mr - 6 : cy + mr + 11;
    ssCtx.fillText(m.name, mx, labelY);
    // Distance label (tiny)
    ssCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ssCtx.font = '7px "Trebuchet MS", sans-serif';
    var distLabel = m.avgOrbitalDistance >= 1000 ? Math.round(m.avgOrbitalDistance / 1000) + 'k mi' : m.avgOrbitalDistance + ' mi';
    var distY = (i % 2 === 0) ? cy - mr - 15 : cy + mr + 19;
    ssCtx.fillText(distLabel, mx, distY);
  }

  // Scale bar along the bottom
  ssCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ssCtx.lineWidth = 1;
  ssCtx.beginPath();
  ssCtx.moveTo(moonStartX, h - 12);
  ssCtx.lineTo(moonEndX, h - 12);
  ssCtx.stroke();
  // Tick marks at 50k intervals
  ssCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ssCtx.font = '7px "Trebuchet MS", sans-serif';
  ssCtx.textAlign = 'center';
  for (var dist = 50000; dist <= maxDist; dist += 50000){
    var tx = moonStartX + (dist / maxDist) * moonUsableW;
    ssCtx.beginPath(); ssCtx.moveTo(tx, h - 15); ssCtx.lineTo(tx, h - 9); ssCtx.stroke();
    ssCtx.fillText(Math.round(dist / 1000) + 'k', tx, h - 2);
  }
}

function _drawSiberysRing(width: number, height: number, observerLatDeg: number){
  if (!ctx) return;
  var lat = observerLatDeg * Math.PI / 180;
  var steps = 120;
  var outerPts: {x: number; y: number}[] = [];
  var innerPts: {x: number; y: number}[] = [];
  var centerPts: {x: number; y: number}[] = [];
  var halfWidthDeg = 6;

  for (var i = 0; i <= steps; i++){
    var H = (-180 + 360 * i / steps) * Math.PI / 180;
    var sinAlt = Math.cos(lat) * Math.cos(H);
    var altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
    var altDeg = altRad * 180 / Math.PI;
    if (altDeg < 0) continue;

    var azRaw = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat));
    var azDeg = ((azRaw * 180 / Math.PI) + 180 + 360) % 360;

    centerPts.push(_panoramicPoint(width, height, azDeg, altDeg));
    outerPts.push(_panoramicPoint(width, height, azDeg, altDeg + halfWidthDeg));
    innerPts.push(_panoramicPoint(width, height, azDeg, Math.max(0, altDeg - halfWidthDeg)));
  }

  if (centerPts.length < 2) return;

  ctx.save();

  // helper: interpolate between inner and outer at fraction f (0=inner, 1=outer)
  function _bandPts(f: number): {x: number; y: number}[] {
    var pts: {x: number; y: number}[] = [];
    for (var i = 0; i < innerPts.length; i++){
      pts.push({
        x: innerPts[i].x + (outerPts[i].x - innerPts[i].x) * f,
        y: innerPts[i].y + (outerPts[i].y - innerPts[i].y) * f
      });
    }
    return pts;
  }

  // multi-band sub-layers
  var bandDefs = [
    { f0: 0.0,  f1: 0.2,  color: 'rgba(180,155,80,0.06)' },
    { f0: 0.2,  f1: 0.45, color: 'rgba(232,203,118,0.14)' },
    { f0: 0.38, f1: 0.62, color: 'rgba(248,220,140,0.22)' },
    { f0: 0.55, f1: 0.8,  color: 'rgba(232,203,118,0.14)' },
    { f0: 0.8,  f1: 1.0,  color: 'rgba(200,170,90,0.06)' }
  ];
  for (var bd of bandDefs){
    var lo = _bandPts(bd.f0);
    var hi = _bandPts(bd.f1);
    ctx.beginPath();
    ctx.moveTo(hi[0].x, hi[0].y);
    for (var j = 1; j < hi.length; j++) ctx.lineTo(hi[j].x, hi[j].y);
    for (var k = lo.length - 1; k >= 0; k--) ctx.lineTo(lo[k].x, lo[k].y);
    ctx.closePath();
    ctx.fillStyle = bd.color;
    ctx.fill();
  }

  // double-pass glow center line
  ctx.beginPath();
  ctx.moveTo(centerPts[0].x, centerPts[0].y);
  for (var m = 1; m < centerPts.length; m++) ctx.lineTo(centerPts[m].x, centerPts[m].y);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(248, 216, 129, 0.45)';
  ctx.shadowColor = 'rgba(244, 207, 104, 0.7)';
  ctx.shadowBlur = 24;
  ctx.stroke();
  // second wider bloom pass
  ctx.strokeStyle = 'rgba(248, 216, 129, 0.2)';
  ctx.shadowBlur = 48;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // edge softening
  var edgeInner = _bandPts(0.02);
  var edgeOuter = _bandPts(0.98);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(232,203,118,0.04)';
  ctx.shadowColor = 'rgba(232,203,118,0.15)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(edgeOuter[0].x, edgeOuter[0].y);
  for (var eo = 1; eo < edgeOuter.length; eo++) ctx.lineTo(edgeOuter[eo].x, edgeOuter[eo].y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(edgeInner[0].x, edgeInner[0].y);
  for (var ei = 1; ei < edgeInner.length; ei++) ctx.lineTo(edgeInner[ei].x, edgeInner[ei].y);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // ~120 particles with independent twinkle
  var sparkleCount = 120;
  var t2pi = state.timeFrac * Math.PI * 2;
  for (var s = 0; s < sparkleCount; s++){
    var t = (s + 0.5) / sparkleCount;
    var idx = Math.min(centerPts.length - 1, Math.floor((centerPts.length - 1) * t));
    var outer = outerPts[idx];
    var inner = innerPts[idx];
    var bandMix = _hash('sib:' + s + ':' + state.serial);
    var pt = {
      x: inner.x + (outer.x - inner.x) * bandMix,
      y: inner.y + (outer.y - inner.y) * bandMix
    };
    var particleFreq = 3 + _hash('sf:' + s) * 12;
    var particlePhase = _hash('sph:' + s) * Math.PI * 2;
    var pulse = 0.5 + 0.5 * Math.sin(t2pi * particleFreq + particlePhase);
    var alpha = 0.15 + pulse * 0.65;
    var r = 0.4 + pulse * 1.2;

    if (s < 8){
      // large "dragonshard" sparkles with additive bloom
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,237,178,' + (alpha * 0.7) + ')';
      ctx.fillRect(pt.x - r * 2, pt.y - 0.3, r * 4, 0.6);
      ctx.fillRect(pt.x - 0.3, pt.y - r * 2, 0.6, r * 4);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pulse > 0.65){
      // bright particles: cross spike + halo
      ctx.fillStyle = 'rgba(255,237,178,' + alpha + ')';
      ctx.fillRect(pt.x - r * 1.8, pt.y - 0.3, r * 3.6, 0.6);
      ctx.fillRect(pt.x - 0.3, pt.y - r * 1.8, 0.6, r * 3.6);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // normal particles: simple dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 237, 178, ' + alpha + ')';
      ctx.fill();
    }
  }

  var crest = centerPts[Math.floor(centerPts.length * 0.55)];
  if (crest) {
    ctx.fillStyle = 'rgba(255, 235, 191, 0.8)';
    ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Ring of Siberys', crest.x + 10, crest.y - 8);
  }
  ctx.restore();
}

function _bindSkyJoystick(){
  var active = false;
  var setFromClientX = function(clientX: number){
    var rect = timeJoystick.getBoundingClientRect();
    if (!rect.width) return;
    var normalized = ((clientX - rect.left) / rect.width) * 2 - 1;
    var mag = Math.max(0, Math.min(1, Math.abs(normalized)));
    var sign = normalized >= 0 ? 1 : -1;
    var speeds = [0.5, 1, 4, 12, 24];
    var idx = Math.min(speeds.length - 1, Math.floor(mag * speeds.length));
    var base = mag < 0.06 ? 0 : speeds[idx];
    state.skyScrubHoursPerSecond = base * sign;
    var dir = sign >= 0 ? 'forward' : 'backward';
    timeJoystickSpeed.textContent = base
      ? ('Scrubbing ' + dir + ' at ' + (base < 1 ? '30m' : (base + 'hr')) + '/s')
      : 'Hold to scrub time (±30m/hr/4hr/12hr/24hr)';
  };
  var stop = function(){
    if (!active) return;
    active = false;
    state.skyScrubHoursPerSecond = 0;
    state.skyScrubActive = false;
    state.skyPlaying = false;
    playToggle.textContent = 'Play';
    timeJoystickSpeed.textContent = 'Hold to scrub time (±30m/hr/4hr/12hr/24hr)';
  };

  timeJoystick.addEventListener('pointerdown', function(ev){
    active = true;
    state.skyScrubActive = true;
    timeJoystick.setPointerCapture(ev.pointerId);
    setFromClientX(ev.clientX);
  });
  timeJoystick.addEventListener('pointermove', function(ev){
    if (!active) return;
    setFromClientX(ev.clientX);
  });
  timeJoystick.addEventListener('pointerup', stop);
  timeJoystick.addEventListener('pointercancel', stop);
  timeJoystick.addEventListener('lostpointercapture', stop);
  window.addEventListener('blur', stop);
}

function _bindPlanarJoystick(){
  if (!planarTimeJoystick || !planarTimeJoystickSpeed) return;
  var active = false;
  var setFromClientX = function(clientX: number){
    if (!planarTimeJoystick) return;
    var rect = planarTimeJoystick.getBoundingClientRect();
    if (!rect.width) return;
    var normalized = ((clientX - rect.left) / rect.width) * 2 - 1;
    var mag = Math.max(0, Math.min(1, Math.abs(normalized)));
    var sign = normalized >= 0 ? 1 : -1;
    var speeds = [1, 28, 168, 336, 1680];
    var labels = ['1 day', '1 month', '6 months', '1 year', '5 years'];
    var idx = Math.min(speeds.length - 1, Math.floor(mag * speeds.length));
    var base = mag < 0.06 ? 0 : speeds[idx];
    state.planarScrubDaysPerSecond = base * sign;
    var dir = sign >= 0 ? 'forward' : 'backward';
    planarTimeJoystickSpeed!.textContent = base
      ? ('Scrubbing ' + dir + ' at ' + labels[idx] + '/s')
      : 'Hold to scrub planar time (±1d/1mo/6mo/1yr/5yr per sec)';
  };
  var stop = function(){
    if (!active) return;
    active = false;
    state.planarScrubDaysPerSecond = 0;
    state.planarScrubActive = false;
    state.planarPlaying = false;
    if (planarPlayToggle) planarPlayToggle.textContent = 'Play';
    planarTimeJoystickSpeed!.textContent = 'Hold to scrub planar time (±1d/1mo/6mo/1yr/5yr per sec)';
  };

  planarTimeJoystick.addEventListener('pointerdown', function(ev){
    active = true;
    state.planarScrubActive = true;
    planarTimeJoystick!.setPointerCapture(ev.pointerId);
    setFromClientX(ev.clientX);
  });
  planarTimeJoystick.addEventListener('pointermove', function(ev){
    if (!active) return;
    setFromClientX(ev.clientX);
  });
  planarTimeJoystick.addEventListener('pointerup', stop);
  planarTimeJoystick.addEventListener('pointercancel', stop);
  planarTimeJoystick.addEventListener('lostpointercapture', stop);
  window.addEventListener('blur', stop);
}

// ---------------------------------------------------------------------------
// Planar Orbital Diagram
// ---------------------------------------------------------------------------

var PLANAR_CX = 250;
var PLANAR_CY = 250;
var PLANAR_R_COT = 0;       // coterminous: at center (merged glow with Eberron)
var PLANAR_R_MID = 95;      // midpoint for half-bounce
var PLANAR_R_NEU = 180;     // neutral outer radius
var PLANAR_R_REM = 210;     // remote ring radius
var PLANAR_R_DAL = 246;     // Dal Quor orbit radius
var PLANAR_DISC_R = 10;

// Drag state for 3D orbit
var _planarDragState: { active: boolean; startX: number; startY: number; startTilt: number; startRot: number } | null = null;

function _planarTiltFactor(): number {
  return Math.sin(state.planarTiltDeg * Math.PI / 180);
}

function _planarProject(angleDeg: number, radius: number): { x: number; y: number } {
  var totalAngle = angleDeg + state.planarRotOffsetDeg;
  var rad = totalAngle * Math.PI / 180;
  var tilt = _planarTiltFactor();
  return {
    x: PLANAR_CX + Math.cos(rad) * radius,
    y: PLANAR_CY + Math.sin(rad) * radius * tilt
  };
}

function _planarRadiusForPhase(ph: PlanarPhaseResult): number {
  if (ph.phase === 'coterminous') return PLANAR_R_COT;
  if (ph.phase === 'remote') return PLANAR_R_REM;
  // Neutral phase: radial movement
  var t = Math.max(0, Math.min(1, ph.phaseProgress));
  if (ph.isHalfBounce) {
    // Triangle wave: go to midpoint and back
    var halfT = t < 0.5 ? t * 2 : (1 - t) * 2;
    if (ph.previousPhase === 'coterminous' || ph.nextPhase === 'coterminous') {
      return PLANAR_R_COT + halfT * PLANAR_R_MID;
    }
    // remote half-bounce (unlikely but handle generically)
    return PLANAR_R_REM - halfT * (PLANAR_R_REM - PLANAR_R_MID);
  }
  // Full traversal: lerp between coterminous and remote
  if (ph.previousPhase === 'coterminous') {
    return PLANAR_R_COT + t * (PLANAR_R_REM - PLANAR_R_COT);
  }
  // After remote, moving inward
  return PLANAR_R_REM - t * (PLANAR_R_REM - PLANAR_R_COT);
}

function _drawPlanarDiagram(phases: PlanarPhaseResult[]) {
  if (!planarCtx || !planarCanvas) return;
  var pCtx = planarCtx;
  var w = planarCanvas.width;
  var h = planarCanvas.height;
  pCtx.clearRect(0, 0, w, h);

  // Background
  var bg = pCtx.createRadialGradient(PLANAR_CX, PLANAR_CY, 0, PLANAR_CX, PLANAR_CY, 280);
  bg.addColorStop(0,   'rgba(18, 24, 48, 0.97)');
  bg.addColorStop(0.3, 'rgba(12, 18, 35, 0.97)');
  bg.addColorStop(0.6, 'rgba(8, 14, 28, 0.98)');
  bg.addColorStop(1.0, 'rgba(4, 8, 16, 0.99)');
  pCtx.fillStyle = bg;
  pCtx.fillRect(0, 0, w, h);

  // Nebula washes
  pCtx.save();
  pCtx.globalCompositeOperation = 'screen';
  var neb1 = pCtx.createRadialGradient(PLANAR_CX - 80, PLANAR_CY - 60, 0, PLANAR_CX - 80, PLANAR_CY - 60, 160);
  neb1.addColorStop(0, 'rgba(30, 15, 55, 0.05)');
  neb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  pCtx.fillStyle = neb1;
  pCtx.fillRect(0, 0, w, h);
  pCtx.restore();

  var tilt = _planarTiltFactor();

  // Scattered background stars
  pCtx.save();
  for (var si = 0; si < 60; si++){
    var sx = _hash('ps:x:' + si) * w;
    var sy = _hash('ps:y:' + si) * h;
    var salpha = 0.03 + _hash('ps:a:' + si) * 0.06;
    pCtx.fillStyle = 'rgba(220, 220, 240, ' + salpha + ')';
    pCtx.fillRect(sx, sy, 1, 1);
  }
  pCtx.restore();

  // Neutral zone fill with ethereal gradient
  pCtx.save();
  var neuGrad = pCtx.createRadialGradient(PLANAR_CX, PLANAR_CY, 20, PLANAR_CX, PLANAR_CY, PLANAR_R_NEU);
  neuGrad.addColorStop(0,   'rgba(80, 100, 160, 0.04)');
  neuGrad.addColorStop(0.4, 'rgba(100, 120, 180, 0.025)');
  neuGrad.addColorStop(0.7, 'rgba(80, 90, 140, 0.015)');
  neuGrad.addColorStop(1.0, 'rgba(60, 70, 120, 0.005)');
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY, PLANAR_R_NEU, PLANAR_R_NEU * tilt, 0, 0, Math.PI * 2);
  pCtx.fillStyle = neuGrad;
  pCtx.fill();
  pCtx.restore();

  // Midpoint subtle ring
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY, PLANAR_R_MID, PLANAR_R_MID * tilt, 0, 0, Math.PI * 2);
  pCtx.lineWidth = 0.5;
  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  pCtx.stroke();

  // Neutral boundary ellipse
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY, PLANAR_R_NEU, PLANAR_R_NEU * tilt, 0, 0, Math.PI * 2);
  pCtx.lineWidth = 0.8;
  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
  pCtx.stroke();

  // Remote ring (gradient dashed)
  pCtx.save();
  pCtx.setLineDash([6, 4]);
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY, PLANAR_R_REM, PLANAR_R_REM * tilt, 0, 0, Math.PI * 2);
  pCtx.lineWidth = 1.5;
  pCtx.strokeStyle = 'rgba(160, 80, 80, 0.30)';
  pCtx.stroke();
  pCtx.setLineDash([]);
  pCtx.restore();
  // Remote label
  pCtx.save();
  pCtx.font = '8px "Trebuchet MS", sans-serif';
  pCtx.fillStyle = 'rgba(160, 80, 80, 0.35)';
  pCtx.textAlign = 'center';
  pCtx.fillText('Remote', PLANAR_CX, PLANAR_CY - PLANAR_R_REM * tilt - 4);
  pCtx.restore();

  // Dal Quor orbit (dashed)
  pCtx.save();
  pCtx.setLineDash([4, 6]);
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY, PLANAR_R_DAL, PLANAR_R_DAL * tilt, 0, 0, Math.PI * 2);
  pCtx.lineWidth = 0.8;
  pCtx.strokeStyle = 'rgba(123, 104, 174, 0.25)';
  pCtx.stroke();
  pCtx.setLineDash([]);
  pCtx.restore();

  // Draw 12 axis lines
  var globalSpinDeg = ((state.planarSerial / (12 * 336)) * 360) % 360;
  for (var a = 0; a < 12; a++) {
    var angleDeg = a * 15;
    var p1 = _planarProject(angleDeg + globalSpinDeg, PLANAR_R_REM);
    var p2 = _planarProject(angleDeg + 180 + globalSpinDeg, PLANAR_R_REM);
    var axGrad = pCtx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
    axGrad.addColorStop(0,   'rgba(255, 255, 255, 0.02)');
    axGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.08)');
    axGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.10)');
    axGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
    axGrad.addColorStop(1,   'rgba(255, 255, 255, 0.02)');
    pCtx.beginPath();
    pCtx.moveTo(p1.x, p1.y);
    pCtx.lineTo(p2.x, p2.y);
    pCtx.lineWidth = 0.8;
    pCtx.strokeStyle = axGrad;
    pCtx.stroke();
  }

  // Categorize planes
  type PlaneDrawItem = {
    phase: PlanarPhaseResult;
    x: number; y: number; depth: number; discR: number; alpha: number;
  };
  var orbitingItems: PlaneDrawItem[] = [];
  var coterminousGlows: PlanarPhaseResult[] = [];
  var remotePlanes: PlanarPhaseResult[] = [];

  for (var pi = 0; pi < phases.length; pi++) {
    var ph = phases[pi];
    var effectiveAngle: number;
    var radius: number;

    if (ph.isDalQuor) {
      effectiveAngle = (ph.dalQuorOrbitAngle || 0) + globalSpinDeg;
      radius = PLANAR_R_DAL;
    } else if (!ph.isFixed && ph.phase === 'coterminous') {
      // Coterminous: merged glow on Eberron (drawn later)
      coterminousGlows.push(ph);
      continue;
    } else if (!ph.isFixed && ph.phase === 'remote') {
      effectiveAngle = (ph.onPrimarySide ? ph.axisAngle : (ph.axisAngle + 180)) + globalSpinDeg;
      radius = PLANAR_R_REM;
      remotePlanes.push(ph);
    } else {
      effectiveAngle = (ph.onPrimarySide ? ph.axisAngle : (ph.axisAngle + 180)) + globalSpinDeg;
      radius = ph.isFixed ? _planarRadiusForFixedPosition(ph) : _planarRadiusForPhase(ph);
    }

    var pos = _planarProject(effectiveAngle, radius);
    var totalAngle = effectiveAngle + state.planarRotOffsetDeg;
    var depthVal = Math.sin(totalAngle * Math.PI / 180);
    var depthScale = 0.85 + depthVal * 0.15;
    var discR = PLANAR_DISC_R * depthScale;
    var alpha = 0.7 + depthVal * 0.3;
    orbitingItems.push({ phase: ph, x: pos.x, y: pos.y, depth: depthVal, discR: discR, alpha: alpha });
  }

  orbitingItems.sort(function(a, b) { return a.depth - b.depth; });

  var centerDrawn = false;
  for (var di = 0; di < orbitingItems.length; di++) {
    if (!centerDrawn && orbitingItems[di].depth >= 0) {
      _drawEberronCenter(pCtx);
      _drawCoterminousGlows(pCtx, coterminousGlows);
      centerDrawn = true;
    }
    _drawPlaneDisc(pCtx, orbitingItems[di]);
  }
  if (!centerDrawn) {
    _drawEberronCenter(pCtx);
    _drawCoterminousGlows(pCtx, coterminousGlows);
  }

  // Draw remote status box (bottom-right)
  if (remotePlanes.length > 0) {
    _drawStatusBox(pCtx, remotePlanes, 'remote', w - 10, h - 10);
  }

  // Draw coterminous labels below Eberron
  if (coterminousGlows.length > 0) {
    _drawCoterminousLabels(pCtx, coterminousGlows);
  }
}

function _planarRadiusForFixedPosition(ph: PlanarPhaseResult): number {
  if (ph.phase === 'remote') return PLANAR_R_REM;
  if (ph.phase === 'neutral') return PLANAR_R_MID;
  return PLANAR_R_COT;
}

function _drawCoterminousGlows(pCtx: CanvasRenderingContext2D, planes: PlanarPhaseResult[]) {
  if (planes.length === 0) return;
  pCtx.save();
  pCtx.globalCompositeOperation = 'screen';
  for (var i = 0; i < planes.length; i++) {
    var ph = planes[i];
    var color = ph.color;
    var isDark = color === '#111111' || color === '#000000';
    var fillColor = isDark ? '#444466' : color;
    var cv = parseInt(fillColor.replace('#', ''), 16);
    var cr = (cv >> 16) & 255, cg = (cv >> 8) & 255, cb = cv & 255;

    // Pulsing glow merged with Eberron
    var glowR = 30 + i * 4;
    var glowGrad = pCtx.createRadialGradient(PLANAR_CX, PLANAR_CY, 4, PLANAR_CX, PLANAR_CY, glowR);
    glowGrad.addColorStop(0,   'rgba(' + cr + ',' + cg + ',' + cb + ',0.25)');
    glowGrad.addColorStop(0.3, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.15)');
    glowGrad.addColorStop(0.6, 'rgba(' + cr + ',' + cg + ',' + cb + ',0.06)');
    glowGrad.addColorStop(1,   'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
    pCtx.fillStyle = glowGrad;
    pCtx.beginPath();
    pCtx.arc(PLANAR_CX, PLANAR_CY, glowR, 0, Math.PI * 2);
    pCtx.fill();
  }
  pCtx.restore();
}

function _drawCoterminousLabels(pCtx: CanvasRenderingContext2D, planes: PlanarPhaseResult[]) {
  pCtx.save();
  pCtx.font = '9px "Trebuchet MS", sans-serif';
  pCtx.textAlign = 'center';
  var baseY = PLANAR_CY + 28;
  for (var i = 0; i < planes.length; i++) {
    var ph = planes[i];
    var remaining = Math.max(0, ph.phaseDurationDays - ph.phaseIntoDays);
    pCtx.fillStyle = ph.color === '#111111' ? 'rgba(180,180,200,0.6)' : ph.color;
    pCtx.globalAlpha = 0.8;
    pCtx.fillText(ph.name + ' · ' + _formatPlanarEta(remaining), PLANAR_CX, baseY + i * 13);
  }
  pCtx.restore();
}

function _drawStatusBox(pCtx: CanvasRenderingContext2D, planes: PlanarPhaseResult[], label: string, anchorX: number, anchorY: number) {
  var lineHeight = 14;
  var padding = 8;
  var boxHeight = padding * 2 + planes.length * lineHeight;
  var boxWidth = 170;
  var isRight = label === 'remote';
  var x = isRight ? anchorX - boxWidth : anchorX;
  var y = anchorY - boxHeight;

  pCtx.save();
  pCtx.fillStyle = 'rgba(5, 15, 27, 0.75)';
  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  pCtx.lineWidth = 1;
  pCtx.beginPath();
  _roundRect(pCtx, x, y, boxWidth, boxHeight, 8);
  pCtx.fill();
  pCtx.stroke();

  pCtx.font = '10px "Trebuchet MS", sans-serif';
  pCtx.textAlign = isRight ? 'right' : 'left';
  var textX = isRight ? x + boxWidth - padding : x + padding;

  for (var i = 0; i < planes.length; i++) {
    var ph = planes[i];
    var remaining = Math.max(0, ph.phaseDurationDays - ph.phaseIntoDays);
    var remLabel = _formatPlanarEta(remaining) + ' remaining';
    pCtx.fillStyle = ph.color;
    var dotY = y + padding + i * lineHeight + 5;
    pCtx.beginPath();
    pCtx.arc(isRight ? textX + 6 : textX - 6, dotY, 3, 0, Math.PI * 2);
    pCtx.fill();

    pCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    pCtx.fillText(ph.name + ' · ' + remLabel, textX, y + padding + i * lineHeight + 9);
  }
  pCtx.restore();
}

function _roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function _drawEberronCenter(pCtx: CanvasRenderingContext2D) {
  var R = 14;
  // Atmospheric glow ring
  var atmoGrad = pCtx.createRadialGradient(PLANAR_CX, PLANAR_CY, R * 0.6, PLANAR_CX, PLANAR_CY, 32);
  atmoGrad.addColorStop(0,   'rgba(70, 160, 220, 0.18)');
  atmoGrad.addColorStop(0.3, 'rgba(70, 140, 200, 0.10)');
  atmoGrad.addColorStop(0.6, 'rgba(70, 120, 180, 0.04)');
  atmoGrad.addColorStop(1,   'rgba(70, 100, 160, 0)');
  pCtx.fillStyle = atmoGrad;
  pCtx.beginPath();
  pCtx.arc(PLANAR_CX, PLANAR_CY, 32, 0, Math.PI * 2);
  pCtx.fill();

  // Ocean
  var oceanGrad = pCtx.createRadialGradient(PLANAR_CX - 2, PLANAR_CY - 2, 1, PLANAR_CX, PLANAR_CY, R);
  oceanGrad.addColorStop(0, '#5ab0e0');
  oceanGrad.addColorStop(0.6, '#3080c0');
  oceanGrad.addColorStop(1, '#1a5090');
  pCtx.beginPath();
  pCtx.arc(PLANAR_CX, PLANAR_CY, R, 0, Math.PI * 2);
  pCtx.fillStyle = oceanGrad;
  pCtx.fill();

  // Continents
  pCtx.save();
  var contGrad = pCtx.createRadialGradient(PLANAR_CX, PLANAR_CY, 0, PLANAR_CX, PLANAR_CY, R);
  contGrad.addColorStop(0, '#5ac47a');
  contGrad.addColorStop(1, '#388a50');
  pCtx.fillStyle = contGrad;
  pCtx.beginPath(); pCtx.ellipse(PLANAR_CX - 3, PLANAR_CY - 1, 5, 2.6, 0.3, 0, Math.PI * 2); pCtx.fill();
  pCtx.beginPath(); pCtx.ellipse(PLANAR_CX + 5, PLANAR_CY + 2, 4, 2.2, -0.2, 0, Math.PI * 2); pCtx.fill();
  pCtx.beginPath(); pCtx.ellipse(PLANAR_CX, PLANAR_CY - 6, 3, 1.8, 0.7, 0, Math.PI * 2); pCtx.fill();
  pCtx.restore();

  // Specular highlight (animated)
  var specAngle = (state.planarSerial / 200) % (Math.PI * 2);
  var specX = PLANAR_CX + Math.cos(specAngle) * 2 - 2;
  var specY = PLANAR_CY + Math.sin(specAngle) * 1 - 4;
  var specGrad = pCtx.createRadialGradient(specX, specY, 0, specX, specY, 7);
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  pCtx.fillStyle = specGrad;
  pCtx.beginPath();
  pCtx.arc(PLANAR_CX, PLANAR_CY, R, 0, Math.PI * 2);
  pCtx.fill();

  // Edge highlight
  pCtx.beginPath();
  pCtx.arc(PLANAR_CX, PLANAR_CY, R, 0, Math.PI * 2);
  pCtx.lineWidth = 0.5;
  pCtx.strokeStyle = 'rgba(150, 200, 255, 0.25)';
  pCtx.stroke();

  pCtx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  pCtx.font = '10px "Trebuchet MS", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText('Eberron', PLANAR_CX, PLANAR_CY + 24);
}

function _drawPlaneDisc(pCtx: CanvasRenderingContext2D, item: { phase: PlanarPhaseResult; x: number; y: number; discR: number; alpha: number }) {
  var ph = item.phase;
  var color = ph.color;
  var r = item.discR;
  var x = item.x, y = item.y;
  var isDark = color === '#111111' || color === '#000000';
  var fillColor = isDark ? '#444455' : color;
  var cv = parseInt(fillColor.replace('#', ''), 16);
  var cr = (cv >> 16) & 255, cg = (cv >> 8) & 255, cb = cv & 255;

  pCtx.save();
  pCtx.globalAlpha = item.alpha;

  // Shadow beneath
  pCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  pCtx.beginPath(); pCtx.arc(x + 1.5, y + 2, r * 0.9, 0, Math.PI * 2); pCtx.fill();

  // Outer glow
  var glowR = r * 3;
  var glowAlpha = 0.15;
  var glowGrad = pCtx.createRadialGradient(x, y, 0, x, y, glowR);
  glowGrad.addColorStop(0,   'rgba(' + cr + ',' + cg + ',' + cb + ',' + glowAlpha + ')');
  glowGrad.addColorStop(0.25,'rgba(' + cr + ',' + cg + ',' + cb + ',' + (glowAlpha * 0.5) + ')');
  glowGrad.addColorStop(1,   'rgba(' + cr + ',' + cg + ',' + cb + ',0)');
  pCtx.fillStyle = glowGrad;
  pCtx.beginPath(); pCtx.arc(x, y, glowR, 0, Math.PI * 2); pCtx.fill();

  // Disc body with gradient
  var lighterR = Math.min(255, cr + 50), lighterG = Math.min(255, cg + 50), lighterB = Math.min(255, cb + 50);
  var darkerR = Math.max(0, cr - 35), darkerG = Math.max(0, cg - 35), darkerB = Math.max(0, cb - 35);
  var discGrad = pCtx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.05, x, y, r);
  discGrad.addColorStop(0, 'rgb(' + lighterR + ',' + lighterG + ',' + lighterB + ')');
  discGrad.addColorStop(0.7, 'rgb(' + cr + ',' + cg + ',' + cb + ')');
  discGrad.addColorStop(1, 'rgb(' + darkerR + ',' + darkerG + ',' + darkerB + ')');
  pCtx.fillStyle = discGrad;
  pCtx.beginPath(); pCtx.arc(x, y, r, 0, Math.PI * 2); pCtx.fill();

  // Inner specular highlight
  var specGrad = pCtx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x - r * 0.2, y - r * 0.2, r * 0.6);
  specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.30)');
  specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  pCtx.fillStyle = specGrad;
  pCtx.beginPath(); pCtx.arc(x, y, r, 0, Math.PI * 2); pCtx.fill();

  pCtx.restore();

  // Edge
  pCtx.beginPath(); pCtx.arc(x, y, r, 0, Math.PI * 2);
  pCtx.lineWidth = isDark ? 0.8 : 0.5;
  pCtx.strokeStyle = isDark ? 'rgba(200, 200, 200, 0.30)' : 'rgba(255, 255, 255, 0.20)';
  pCtx.stroke();

  // Label
  pCtx.save();
  pCtx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  pCtx.shadowBlur = 3;
  pCtx.fillStyle = 'rgba(255, 255, 255, ' + (item.alpha * 0.88) + ')';
  pCtx.font = (item.discR > 9 ? '11' : '9') + 'px "Trebuchet MS", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText(ph.name, x, y + r + 14);
  pCtx.restore();
}

function _renderPlanarLegend(phases: PlanarPhaseResult[]) {
  if (!planarLegend) return;
  var html = '';
  for (var i = 0; i < phases.length; i++) {
    var ph = phases[i];
    var phaseName = _planarStatusText(ph);
    html += '<div class="planar-legend-row">' +
      '<span class="planar-legend-dot" style="background:' + _esc(ph.color) + ';"></span>' +
      '<span class="planar-legend-name">' + _esc(ph.name) + '</span>' +
      '<span class="planar-legend-phase">' + _esc(phaseName) + '</span>' +
      '</div>';
  }
  if (html !== lastPlanarLegendHtml) {
    planarLegend.innerHTML = html;
    lastPlanarLegendHtml = html;
  }
}

function _planarStatusText(ph: PlanarPhaseResult): string {
  if (ph.isDalQuor) return 'remote (severed)';
  if (ph.isFixed) return ph.phase + ' (fixed)';
  if (ph.phase === 'coterminous') {
    var cotRemaining = Math.max(0, ph.phaseDurationDays - ph.phaseIntoDays);
    return 'coterminous · ' + _formatPlanarEta(cotRemaining) + ' left';
  }
  if (ph.phase === 'remote') {
    var remRemaining = Math.max(0, ph.phaseDurationDays - ph.phaseIntoDays);
    return 'remote · ' + _formatPlanarEta(remRemaining) + ' left';
  }
  var toCot = (ph.toCoterminousDays == null) ? Number.POSITIVE_INFINITY : ph.toCoterminousDays;
  var toRem = (ph.toRemoteDays == null) ? Number.POSITIVE_INFINITY : ph.toRemoteDays;
  if (toCot <= toRem) return 'coterminous in ' + _formatPlanarEta(toCot);
  return 'remote in ' + _formatPlanarEta(toRem);
}

function _formatPlanarEta(days: number): string {
  var monthDays = 28;
  if (!isFinite(days) || days < 0) return 'unknown';
  if (days < monthDays) return Math.max(1, Math.round(days)) + ' d';
  var months = days / monthDays;
  if (months < 12) return Math.max(1, Math.round(months)) + ' mo';
  var years = months / 12;
  return years.toFixed(years >= 10 ? 0 : 1) + ' yr';
}

function _syncGalleryControlsFromState(){
  var worldId = state.worldId;
  var world = WORLDS[worldId];
  _renderGallerySourceOptions(worldId);
  _renderGalleryVariantOptions(worldId);
  _renderGalleryMonthOptions(worldId);
  galleryYearInput.value = String(world.defaultDate.year);
  galleryDayInput.value = String(world.defaultDate.day);
}

function _renderGalleryVariantOptions(worldId: string){
  var world = WORLDS[worldId];
  var overlays = world.calendar.namingOverlays || [];
  if (overlays.length <= 1) {
    galleryVariantLabel.hidden = true;
    return;
  }
  galleryVariantLabel.hidden = false;
  galleryVariantSelect.innerHTML = overlays.map(function(o){
    var selected = o.key === world.calendar.defaultOverlayKey ? ' selected' : '';
    return '<option value="' + _esc(o.key) + '"' + selected + '>' + _esc(o.label) + '</option>';
  }).join('');
}

function _renderGallerySourceOptions(worldId: string){
  var world = WORLDS[worldId];
  var packs = world.eventPacks || [];
  gallerySourceDropdown.innerHTML = packs.map(function(pack){
    return '<label><input type="checkbox" value="' + _esc(pack.key.toLowerCase()) + '" checked> ' + _esc(pack.label) + '</label>';
  }).join('');
  // Re-bind checkbox change events
  var checkboxes = gallerySourceDropdown.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(function(cb){
    cb.addEventListener('change', function(){
      _updateSourceToggleLabel();
      _renderCalendarGallery();
    });
  });
  _updateSourceToggleLabel();
}

function _updateSourceToggleLabel(){
  var checkboxes = gallerySourceDropdown.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
  var total = checkboxes.length;
  var checked = 0;
  checkboxes.forEach(function(cb){ if (cb.checked) checked++; });
  if (checked === 0 || checked === total) {
    gallerySourceToggle.textContent = 'All sources';
  } else {
    gallerySourceToggle.textContent = checked + ' of ' + total + ' sources';
  }
}

function _getSelectedSources(): string[] {
  var checkboxes = gallerySourceDropdown.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
  var selected: string[] = [];
  var allChecked = true;
  checkboxes.forEach(function(cb){
    if (cb.checked) selected.push(cb.value);
    else allChecked = false;
  });
  if (allChecked || selected.length === 0) return ['all'];
  return selected;
}

function _renderGalleryMonthOptions(worldId: string){
  var months = getWorldCalendarSlots(worldId).filter(function(slot){ return slot.isIntercalary !== true; });
  var world = WORLDS[worldId];
  galleryMonthSelect.innerHTML = months.map(function(slot, idx){
    var selected = idx === world.defaultDate.month ? ' selected' : '';
    return '<option value="' + idx + '"' + selected + '>' + _esc(slot.name) + '</option>';
  }).join('');
}

type PreviewEventRow = {
  name: string;
  source?: string;
  color?: string;
  slotIndex: number;
  day: number;
};

function _eventRowsForSources(worldId: string, sourceKeys: string[], year: number): PreviewEventRow[] {
  var world = WORLDS[worldId];
  var isAll = sourceKeys.indexOf('all') >= 0;
  var packs = (world.eventPacks || []).filter(function(pack){
    if (isAll) return true;
    return sourceKeys.indexOf(String(pack.key || '').toLowerCase()) >= 0;
  });
  var rows: PreviewEventRow[] = [];
  packs.forEach(function(pack){
    (pack.events || []).forEach(function(event){
      var eventMonths = event.month === 'all' ? _allRegularMonths(worldId) : [Math.max(1, parseInt(String(event.month), 10) || 1)];
      eventMonths.forEach(function(monthHuman){
        var slotIndex = regularMonthIndexToSlotIndex(worldId, monthHuman - 1);
        if (slotIndex < 0) return;
        var days = _resolveEventDays(worldId, year, slotIndex, event.day);
        days.forEach(function(day){
          rows.push({
            name: String(event.name || 'Event'),
            source: String(event.source || pack.key || 'custom'),
            color: String(event.color || ''),
            slotIndex: slotIndex,
            day: day
          });
        });
      });
    });
  });
  return rows;
}

function _allRegularMonths(worldId: string){
  return getWorldCalendarSlots(worldId).filter(function(slot){ return slot.isIntercalary !== true; }).map(function(slot){
    return (slot.regularMonthIndex || 0) + 1;
  });
}

function _resolveEventDays(worldId: string, year: number, slotIndex: number, daySpec: string | number){
  var slots = getWorldCalendarSlots(worldId);
  var slot = slots[slotIndex];
  if (!slot) return [];
  var maxDay = Math.max(1, slot.days | 0);
  if (typeof daySpec === 'number') return [Math.max(1, Math.min(maxDay, daySpec | 0))];
  var text = String(daySpec || '').trim().toLowerCase();
  if (!text) return [];
  if (/^\d+\s*-\s*\d+$/.test(text)){
    var parts = text.split('-');
    var start = Math.max(1, Math.min(maxDay, parseInt(parts[0], 10) || 1));
    var end = Math.max(start, Math.min(maxDay, parseInt(parts[1], 10) || start));
    var out: number[] = [];
    for (var d = start; d <= end; d++) out.push(d);
    return out;
  }
  if (/^\d+$/.test(text)) return [Math.max(1, Math.min(maxDay, parseInt(text, 10) || 1))];
  var ordMatch = text.match(/^(first|second|third|fourth|fifth|last|every|all)\s+([a-z]+)$/);
  if (!ordMatch) return [];
  var ordinal = ordMatch[1];
  var weekdayToken = ordMatch[2];
  var weekdayIndex = _worldWeekdayIndex(worldId, weekdayToken);
  if (weekdayIndex < 0) return [];
  var matches: number[] = [];
  for (var day = 1; day <= maxDay; day++){
    if (_weekdayIndexFor(worldId, year, slotIndex, day) === weekdayIndex) matches.push(day);
  }
  if (!matches.length) return [];
  if (ordinal === 'every' || ordinal === 'all') return matches;
  if (ordinal === 'last') return [matches[matches.length - 1]];
  var nth = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5 }[ordinal] || 1;
  return [matches[Math.min(matches.length - 1, nth - 1)]];
}

function _worldWeekdayIndex(worldId: string, token: string){
  var world = WORLDS[worldId];
  var matchToken = String(token || '').trim().toLowerCase();
  for (var i = 0; i < world.calendar.weekdays.length; i++){
    var full = String(world.calendar.weekdays[i] || '').toLowerCase();
    if (full === matchToken || full.slice(0, 3) === matchToken) return i;
    var abbr = String((world.calendar.weekdayAbbr || {})[world.calendar.weekdays[i]] || '').toLowerCase();
    if (abbr && abbr === matchToken) return i;
  }
  return -1;
}

function _weekdayIndexFor(worldId: string, year: number, slotIndex: number, day: number){
  var world = WORLDS[worldId];
  if (world.calendar.weekdayProgressionMode === 'month_reset') return (day - 1) % world.calendar.weekdays.length;
  var base = toWorldSerial(worldId, year, slotIndex, day);
  return ((base % world.calendar.weekdays.length) + world.calendar.weekdays.length) % world.calendar.weekdays.length;
}

function _indexEventsBySlotDay(worldId: string, rows: PreviewEventRow[], year: number){
  var out: Record<string, PreviewEventRow[]> = {};
  rows.forEach(function(row){
    if (!_slotActiveForYear(worldId, row.slotIndex, year)) return;
    var key = String(row.slotIndex) + ':' + String(row.day);
    if (!out[key]) out[key] = [];
    out[key].push(row);
  });
  return out;
}

function _monthEventRows(worldId: string, slotIndex: number, rows: PreviewEventRow[], year: number){
  return rows.filter(function(row){
    return row.slotIndex === slotIndex && _slotActiveForYear(worldId, slotIndex, year);
  });
}

function _slotActiveForYear(worldId: string, slotIndex: number, year: number){
  var slot = getWorldCalendarSlots(worldId)[slotIndex];
  if (!slot || !slot.leapEvery) return true;
  if (worldId === 'gregorian' && slot.name === 'Leap Day') {
    return (year % 4 === 0) && ((year % 100 !== 0) || (year % 400 === 0));
  }
  return year % slot.leapEvery === 0;
}

function _monthEventsList(events: PreviewEventRow[], worldId: string){
  if (!events.length) return '<p class="month-events empty">No configured events for this source.</p>';
  // Collapse recurring events (same name+source appearing many times) into a single summary line
  var grouped: Record<string, { name: string; source?: string; days: number[] }> = {};
  events.forEach(function(event){
    var key = (event.source || '') + '::' + event.name;
    if (!grouped[key]) grouped[key] = { name: event.name, source: event.source, days: [] };
    grouped[key].days.push(event.day);
  });
  // Sort each group's days and sort groups chronologically by first day
  var keys = Object.keys(grouped);
  keys.forEach(function(k){ grouped[k].days.sort(function(a, b){ return a - b; }); });
  keys.sort(function(a, b){
    return (grouped[a].days[0] || 0) - (grouped[b].days[0] || 0);
  });
  var lines: string[] = [];
  for (var i = 0; i < keys.length; i++){
    var g = grouped[keys[i]];
    var sourceLabel = _sourceLabel(worldId, g.source || 'custom');
    var dayLabel = _compactDayLabel(g.days);
    var label = g.name + ' · ' + dayLabel;
    var tip = sourceLabel + ' · ' + g.name + ' · ' + dayLabel;
    lines.push('<li title="' + _esc(tip) + '">' + _esc(label) + '</li>');
  }
  return '<ul class="month-events">' + lines.join('') + '</ul>';
}

function _compactDayLabel(days: number[]): string {
  if (!days.length) return '';
  if (days.length === 1) return 'Day ' + days[0];
  // Detect consecutive range
  var isConsecutive = true;
  for (var i = 1; i < days.length; i++){
    if (days[i] !== days[i - 1] + 1){ isConsecutive = false; break; }
  }
  if (isConsecutive) return 'Days ' + days[0] + '–' + days[days.length - 1];
  // Detect regular interval (e.g. every 7th day = weekly)
  if (days.length >= 3){
    var gap = days[1] - days[0];
    var isRegular = true;
    for (var j = 2; j < days.length; j++){
      if (days[j] - days[j - 1] !== gap){ isRegular = false; break; }
    }
    if (isRegular && gap === 7) return 'Every week (days ' + days.join(', ') + ')';
    if (isRegular) return 'Every ' + gap + ' days (days ' + days.join(', ') + ')';
  }
  return 'Days ' + days.join(', ');
}

function _activeOverlay(worldId: string) {
  var world = WORLDS[worldId];
  var overlays = world.calendar.namingOverlays || [];
  var variantKey = galleryVariantLabel.hidden ? '' : String(galleryVariantSelect.value || '');
  var overlay = variantKey ? overlays.find(function(o){ return o.key === variantKey; }) : null;
  return overlay || overlays.find(function(o){ return o.key === world.calendar.defaultOverlayKey; }) || overlays[0];
}

function _monthColor(worldId: string, monthIndex: number): string {
  var overlay = _activeOverlay(worldId);
  var themeKey = (overlay && overlay.colorTheme) || 'seasons';
  var palette = (COLOR_THEMES as Record<string, string[]>)[themeKey] || (COLOR_THEMES as Record<string, string[]>).seasons;
  if (!palette || !palette.length) return '#e6b85c';
  return palette[monthIndex % palette.length] || '#e6b85c';
}

function _overlayMonthName(worldId: string, monthIndex: number, fallback: string): string {
  var overlay = _activeOverlay(worldId);
  if (!overlay || !overlay.monthNames) return fallback;
  return overlay.monthNames[monthIndex] || fallback;
}




function _altMonthNames(worldId: string, monthIndex: number, activeName: string): string {
  var world = WORLDS[worldId];
  var overlays = world.calendar.namingOverlays || [];
  if (overlays.length <= 1) return '';
  var alts: string[] = [];
  for (var i = 0; i < overlays.length; i++){
    var o = overlays[i];
    var name = (o.monthNames && o.monthNames[monthIndex]) || '';
    if (!name || name === activeName) continue;
    var themeKey = o.colorTheme || 'seasons';
    var palette = (COLOR_THEMES as Record<string, string[]>)[themeKey] || (COLOR_THEMES as Record<string, string[]>).seasons;
    var color = (palette && palette[monthIndex % palette.length]) || '';
    var dot = color ? '<span class="alt-dot" style="background:' + _esc(color) + ';"></span>' : '';
    alts.push(dot + '<span title="' + _esc(o.label) + '">' + _esc(name) + '</span>');
  }
  if (!alts.length) return '';
  return alts.join(' · ');
}

function _sourceLabel(worldId: string, source: string){
  var world = WORLDS[worldId];
  var key = String(source || '').toLowerCase();
  var packs = world.eventPacks || [];
  for (var i = 0; i < packs.length; i++){
    if (String(packs[i].key || '').toLowerCase() === key) return packs[i].label;
  }
  return key ? (key.charAt(0).toUpperCase() + key.slice(1)) : 'Custom';
}

function _tick(now: number){
  try {
    var dtSeconds = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    var skyHoursPerSecond = state.skyScrubActive
      ? state.skyScrubHoursPerSecond
      : (state.skyPlaying ? state.speedHoursPerSecond : 0);
    var planarDaysPerSecond = state.planarScrubActive
      ? state.planarScrubDaysPerSecond
      : (state.planarPlaying ? state.planarDaysPerSecond : 0);
    if (skyHoursPerSecond || planarDaysPerSecond){
      if (skyHoursPerSecond) {
        var totalDays = state.serial + state.timeFrac + ((dtSeconds * skyHoursPerSecond) / 24);
        state.serial = Math.floor(totalDays);
        state.timeFrac = totalDays - state.serial;
      }
      if (planarDaysPerSecond) state.planarSerial += dtSeconds * planarDaysPerSecond;
      _syncControlsFromState();
      _attemptRender(false, false, now);
    }
  } finally {
    requestAnimationFrame(_tick);
  }
}

function _parseDateParam(worldId: string, raw: string | null){
  if (!raw) return null;
  var match = String(raw).trim().match(/^(-?\d+)-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  var year = parseInt(match[1], 10);
  var slotIndex = Math.max(0, Math.min(getWorldCalendarSlots(worldId).length - 1, (parseInt(match[2], 10) || 1) - 1));
  var day = clampDayForSlot(worldId, slotIndex, parseInt(match[3], 10) || 1);
  return { year: year, slotIndex: slotIndex, day: day };
}

function _parseTimeParam(raw: string | null){
  if (!raw) return 22 / 24;
  var match = String(raw).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 22 / 24;
  var hours = Math.max(0, Math.min(23, parseInt(match[1], 10) || 0));
  var minutes = Math.max(0, Math.min(59, parseInt(match[2], 10) || 0));
  return ((hours * 60) + minutes) / 1440;
}

function _parseLunarSizeParam(raw: string | null): 'useful' | 'true' {
  return _normalizeLunarSizeMode(raw || 'useful');
}

function _normalizeLunarSizeMode(raw: string): 'useful' | 'true' {
  var mode = String(raw || '').toLowerCase();
  if (mode === 'true' || mode === 'realsize' || mode === 'true_size' || mode === 'truesize' || mode === 'realistic') return 'true';
  return 'useful';
}

function _moonRadiusPx(angularDiameterDeg: number, mode: 'useful' | 'true'){
  var zoomScale = PANO_DEFAULT_FOV / state.viewFovDeg;
  if (mode === 'true') {
    var usableHeight = canvas.height - PANO_TOP_MARGIN - PANO_BOTTOM_MARGIN;
    var pxPerDegree = (usableHeight / PANO_ALT_MAX) * zoomScale;
    var trueRadiusPx = (Math.max(0, angularDiameterDeg) * pxPerDegree) / 2;
    return Math.max(0.5, trueRadiusPx);
  }
  var usefulDiameterPx = Math.max(25, Math.min(50, angularDiameterDeg * 22)) * zoomScale;
  return usefulDiameterPx / 2;
}

function _updateUrl(){
  var date = fromWorldSerial(state.worldId, state.serial);
  var dateParam = [
    date.year,
    String(date.slotIndex + 1).padStart(2, '0'),
    String(date.day).padStart(2, '0')
  ].join('-');
  var timeMinutes = Math.round(state.timeFrac * 1440) % 1440;
  var safeMinutes = timeMinutes < 0 ? timeMinutes + 1440 : timeMinutes;
  var hours = Math.floor(safeMinutes / 60);
  var minutes = safeMinutes % 60;
  var next = new URL(window.location.href);
  next.searchParams.set('world', state.worldId);
  next.searchParams.set('date', dateParam);
  next.searchParams.set('time', String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0'));
  next.searchParams.set('lunarSize', state.lunarSizeMode);
  if (Math.abs(state.viewCenterAz - 180) > 0.5) next.searchParams.set('viewAz', state.viewCenterAz.toFixed(1));
  else next.searchParams.delete('viewAz');
  if (Math.abs(state.viewFovDeg - 200) > 0.5) next.searchParams.set('viewFov', state.viewFovDeg.toFixed(1));
  else next.searchParams.delete('viewFov');
  history.replaceState(null, '', next.toString());
}

function _formatClock(totalMinutes: number){
  totalMinutes = totalMinutes % 1440;
  if (totalMinutes < 0) totalMinutes += 1440;
  var hours = Math.floor(totalMinutes / 60);
  var minutes = totalMinutes % 60;
  var suffix = hours >= 12 ? 'PM' : 'AM';
  var displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  return displayHour + ':' + String(minutes).padStart(2, '0') + ' ' + suffix;
}

function _hash(input: string | number){
  var text = String(input);
  var hash = 2166136261;
  for (var i = 0; i < text.length; i++){
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function _must<T extends HTMLElement>(id: string): T {
  var node = document.getElementById(id);
  if (!node) throw new Error('Missing element #' + id);
  return node as T;
}

function _esc(value: string){
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
