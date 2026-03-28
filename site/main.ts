import { WORLD_ORDER, WORLDS } from '../src/worlds/index.js';
import { COLOR_THEMES } from '../src/constants.js';
import { buildCalendarPreview } from '../src/showcase/calendar-preview.js';
import { buildSkyScene } from '../src/showcase/sky-scene.js';
import { clampDayForSlot, formatWorldDate, fromWorldSerial, getWorldCalendarSlots, regularMonthIndexToSlotIndex, toWorldSerial } from '../src/showcase/world-calendar.js';
import { renderPureMonthTable, PureCell } from '../src/shared/render-month-table.js';
import { getAllShowcasePlanarPhases, PlanarPhaseResult } from '../src/showcase/planar-phase.js';

type ShowcaseState = {
  worldId: string;
  serial: number;
  timeFrac: number;
  lunarSizeMode: 'enhanced' | 'realistic';
  skyPlaying: boolean;
  speedHoursPerSecond: number;
  skyScrubHoursPerSecond: number;
  skyScrubActive: boolean;
  planarSerial: number;
  planarPlaying: boolean;
  planarDaysPerSecond: number;
  planarScrubDaysPerSecond: number;
  planarScrubActive: boolean;
};

var DETAIL_SYNC_INTERVAL_MS = 160;
var URL_SYNC_INTERVAL_MS = 800;

var state: ShowcaseState = _initialState();
var lastFrame = performance.now();
var lastDetailSync = 0;
var lastUrlSync = 0;
var lastMoonListHtml = '';
var lastRenderError = '';

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
var worldLabel = _must<HTMLElement>('hero-world-label');
var sceneDateLabel = _must<HTMLElement>('scene-date-label');
var sceneSubtitle = _must<HTMLElement>('scene-subtitle');
var sceneViewNote = _must<HTMLElement>('scene-view-note');
var moonList = _must<HTMLElement>('moon-list');
var heroStats = _must<HTMLElement>('hero-stats');
var calendarGallery = _must<HTMLElement>('calendar-gallery');
var gallerySourceSelect = _must<HTMLSelectElement>('gallery-source');
var galleryYearInput = _must<HTMLInputElement>('gallery-year');
var galleryVariantSelect = _must<HTMLSelectElement>('gallery-variant');
var galleryVariantLabel = _must<HTMLElement>('gallery-variant-label');
var gallerySeedInput = _must<HTMLInputElement>('gallery-seed');
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
    planarDaysPerSecond: 28,
    planarScrubDaysPerSecond: 0,
    planarScrubActive: false
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
    _syncControlsFromState();
    _attemptRender(true, true, performance.now());
    _renderGallerySourceOptions(next, 'all');
    _renderGalleryVariantOptions(next);
    galleryYearInput.value = String(world.defaultDate.year);
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
      state.planarDaysPerSecond = parseFloat(planarSpeedSelect.value) || 28;
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

  gallerySourceSelect.addEventListener('change', _renderCalendarGallery);
  galleryYearInput.addEventListener('change', _renderCalendarGallery);
  galleryVariantSelect.addEventListener('change', _renderCalendarGallery);
  gallerySeedInput.addEventListener('input', _renderCalendarGallery);
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
  worldLabel.textContent = world.label;
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
    planarTimeJoystickSpeed.textContent = 'Hold to scrub planar time (±1mo/6mo/1yr/5yr/10yr per sec)';
  }
  speedSelect.value = String(state.speedHoursPerSecond);
  lunarSizeSelect.value = state.lunarSizeMode;
  if (planarSpeedSelect) planarSpeedSelect.value = String(state.planarDaysPerSecond);
  playToggle.textContent = state.skyPlaying ? 'Pause' : 'Play';
  if (planarPlayToggle) planarPlayToggle.textContent = state.planarPlaying ? 'Pause' : 'Play';
  sceneDateLabel.textContent = formatWorldDate(state.worldId, state.serial);
  sceneSubtitle.textContent = world.description;
  if (heroStats.dataset.worldId !== state.worldId) {
    heroStats.innerHTML = _buildHeroStats(state.worldId);
    heroStats.dataset.worldId = state.worldId;
  }
  if (planarCard) planarCard.hidden = state.worldId !== 'eberron';
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
  var lunarSizeLabel = state.lunarSizeMode === 'realistic' ? 'Realistic lunar scale' : 'Enhanced lunar scale';
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
  var sourceKey = String(gallerySourceSelect.value || 'all').toLowerCase();
  var months = getWorldCalendarSlots(worldId).filter(function(slot){
    return slot.isIntercalary !== true;
  });
  var eventRows = _eventRowsForSource(worldId, sourceKey, year);
  var eventsBySlotDay = _indexEventsBySlotDay(worldId, eventRows, year);

  var seedWord = gallerySeedInput.value.trim() || null;

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
        isToday: false,
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
        '<div class="calendar-card-meta">' +
          '<span class="meta-chip">' + _esc(world.label) + '</span>' +
          '<span class="meta-chip">' + _esc(String(preview.moonCount) + ' moon' + (preview.moonCount === 1 ? '' : 's')) + '</span>' +
          '<span class="meta-chip">' + _esc(sourceKey === 'all' ? 'All sources' : _sourceLabel(worldId, sourceKey)) + '</span>' +
          (seedWord ? '<span class="meta-chip seed-chip">Seed: ' + _esc(seedWord) + '</span>' : '') +
        '</div>' +
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

var PANO_AZ_MIN = 80;
var PANO_AZ_MAX = 280;
var PANO_ALT_MAX = 75;
var PANO_TOP_MARGIN = 70;
var PANO_BOTTOM_MARGIN = 32;
var SCENE_OBSERVER_LATITUDE = 37.7749;

function _panoramicPoint(width: number, height: number, azimuthDeg: number, altitudeDeg: number){
  var usableHeight = height - PANO_TOP_MARGIN - PANO_BOTTOM_MARGIN;
  var x = (azimuthDeg - PANO_AZ_MIN) / (PANO_AZ_MAX - PANO_AZ_MIN) * width;
  var y = PANO_TOP_MARGIN + (1 - Math.max(0, Math.min(PANO_ALT_MAX, altitudeDeg)) / PANO_ALT_MAX) * usableHeight;
  return { x: x, y: y };
}

function _panoramicMoonPoint(width: number, height: number, azimuthDeg: number, altitudeDeg: number){
  var usableHeight = height - PANO_TOP_MARGIN - PANO_BOTTOM_MARGIN;
  var x = (azimuthDeg - PANO_AZ_MIN) / (PANO_AZ_MAX - PANO_AZ_MIN) * width;
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
  gradient.addColorStop(0, '#0a1e35');
  gradient.addColorStop(0.6, '#122030');
  gradient.addColorStop(1, '#1c1712');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, PANO_TOP_MARGIN, width, skyBottom - PANO_TOP_MARGIN);
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 0, width, PANO_TOP_MARGIN);

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

  var drawMoons = scene.moons.slice().sort(function(a, b){
    return Number(b.orbitalDistance || 0) - Number(a.orbitalDistance || 0);
  });
  var labeled = 0;
  for (var i = 0; i < drawMoons.length; i++){
    var moon = drawMoons[i];
    if (moon.category === 'below') continue;
    var az = moon.azimuth;
    if (az < PANO_AZ_MIN - 5 || az > PANO_AZ_MAX + 5) continue;
    var position = _panoramicMoonPoint(width, height, az, moon.altitudeExact);
    var moonRadius = _moonRadiusPx(moon.angularDiameterDeg, state.lunarSizeMode);
    _drawMoonDisk(position.x, position.y, moonRadius, moon.color || '#d8dee7', moon.phase, !!moon.retrograde, Number(moon.albedo || 0.12));
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
  var twinkle = 0.76 + Math.sin(timeFrac * Math.PI * 2) * 0.08;
  var skyBottom = height - PANO_BOTTOM_MARGIN;
  var skyHeight = skyBottom - PANO_TOP_MARGIN;
  for (var i = 0; i < 160; i++){
    var seed = _hash(i + ':' + state.worldId);
    var x = (seed * 9301 % 1000) / 1000 * width;
    var y = PANO_TOP_MARGIN + (_hash('y:' + i + ':' + state.worldId) * 8117 % 1000) / 1000 * skyHeight;
    var size = 0.5 + ((_hash('s:' + i + ':' + state.worldId) * 3571) % 1000) / 1000 * 2.1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 247, 225, ' + (0.18 + ((_hash('a:' + i + ':' + state.worldId) % 1000) / 1000) * twinkle) + ')';
    ctx.fill();
  }
}

function _drawCompass(width: number, height: number){
  if (!ctx) return;
  var compassLabels = [
    { text: 'E', az: 90 }, { text: 'SE', az: 135 }, { text: 'S', az: 180 },
    { text: 'SW', az: 225 }, { text: 'W', az: 270 }
  ];
  ctx.fillStyle = 'rgba(247, 242, 232, 0.66)';
  ctx.font = '14px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'center';
  var labelY = height - 8;
  compassLabels.forEach(function(label){
    var pt = _panoramicPoint(width, height, label.az, 0);
    ctx.fillText(label.text, pt.x, labelY);
  });
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(127, 196, 216, 0.5)';
  ctx.font = '12px "Trebuchet MS", "Gill Sans", sans-serif';
  var pt30 = _panoramicPoint(width, height, PANO_AZ_MIN, 30);
  var pt60 = _panoramicPoint(width, height, PANO_AZ_MIN, 60);
  ctx.fillText('30°', 6, pt30.y + 4);
  ctx.fillText('60°', 6, pt60.y + 4);
}

function _scenePoint(cx: number, cy: number, radius: number, azimuthDeg: number, altitudeDeg: number){
  return _panoramicPoint(canvas.width, canvas.height, azimuthDeg, altitudeDeg);
}

function _sceneFacingDirection(){
  var centerAz = ((PANO_AZ_MIN + PANO_AZ_MAX) / 2 + 360) % 360;
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

function _drawMoonDisk(x: number, y: number, radius: number, color: string, phase: { illum: number; waxing: boolean }, retrograde: boolean, albedo: number){
  if (!ctx) return;
  var albedoScale = Math.max(0.25, Math.min(2.2, albedo / 0.12));
  var glowAlpha = Math.max(0.18, Math.min(0.8, 0.22 + albedoScale * 0.23));
  var edgeAlpha = Math.max(0.28, Math.min(0.92, 0.4 + albedoScale * 0.2));
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * (0.7 + albedoScale * 0.7);
  ctx.globalAlpha = glowAlpha;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(5, 10, 18, 0.92)';
  var waxing = retrograde ? !phase.waxing : phase.waxing;
  var shift = (1 - (2 * Math.max(0, Math.min(1, phase.illum)))) * radius * (waxing ? -1 : 1);
  ctx.beginPath();
  ctx.arc(x + shift, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, ' + edgeAlpha + ')';
  ctx.stroke();
}

function _buildHeroStats(worldId: string){
  var world = WORLDS[worldId];
  var moonCount = world.moons && world.moons.bodies ? world.moons.bodies.length : 0;
  var monthCount = getWorldCalendarSlots(worldId).length;
  return [
    '<span class="stat-pill">' + _esc(world.calendar.label) + '</span>',
    '<span class="stat-pill">' + _esc(String(moonCount) + ' moons') + '</span>',
    '<span class="stat-pill">' + _esc(String(monthCount) + ' slots') + '</span>'
  ].join('');
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
    var H = (-90 + 180 * i / steps) * Math.PI / 180;
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

  ctx.beginPath();
  ctx.moveTo(outerPts[0].x, outerPts[0].y);
  for (var j = 1; j < outerPts.length; j++) ctx.lineTo(outerPts[j].x, outerPts[j].y);
  for (var k = innerPts.length - 1; k >= 0; k--) ctx.lineTo(innerPts[k].x, innerPts[k].y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(232, 203, 118, 0.2)';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(centerPts[0].x, centerPts[0].y);
  for (var m = 1; m < centerPts.length; m++) ctx.lineTo(centerPts[m].x, centerPts[m].y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(248, 216, 129, 0.62)';
  ctx.shadowColor = 'rgba(244, 207, 104, 0.8)';
  ctx.shadowBlur = 16;
  ctx.stroke();

  var sparkleCount = Math.max(36, Math.round(centerPts.length * 0.9));
  for (var s = 0; s < sparkleCount; s++){
    var t = (s + 0.5) / sparkleCount;
    var idx = Math.min(centerPts.length - 1, Math.floor((centerPts.length - 1) * t));
    var outer = outerPts[idx];
    var inner = innerPts[idx];
    var bandMix = ((_hash('siberys:' + s + ':' + state.serial) % 1000) / 1000);
    var pt = {
      x: inner.x + (outer.x - inner.x) * bandMix,
      y: inner.y + (outer.y - inner.y) * bandMix
    };
    var pulse = 0.45 + 0.55 * Math.sin((state.timeFrac * Math.PI * 2 * 7) + (s * 1.37));
    var r = 0.8 + pulse * 1.9;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 237, 178, ' + (0.25 + pulse * 0.55) + ')';
    ctx.fill();
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
    var speeds = [28, 168, 336, 1680, 3360];
    var labels = ['1 month', '6 months', '1 year', '5 years', '10 years'];
    var idx = Math.min(speeds.length - 1, Math.floor(mag * speeds.length));
    var base = mag < 0.06 ? 0 : speeds[idx];
    state.planarScrubDaysPerSecond = base * sign;
    var dir = sign >= 0 ? 'forward' : 'backward';
    planarTimeJoystickSpeed!.textContent = base
      ? ('Scrubbing ' + dir + ' at ' + labels[idx] + '/s')
      : 'Hold to scrub planar time (±1mo/6mo/1yr/5yr/10yr per sec)';
  };
  var stop = function(){
    if (!active) return;
    active = false;
    state.planarScrubDaysPerSecond = 0;
    state.planarScrubActive = false;
    planarTimeJoystickSpeed!.textContent = 'Hold to scrub planar time (±1mo/6mo/1yr/5yr/10yr per sec)';
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

var PLANAR_TILT = Math.sin(75 * Math.PI / 180); // More top-down view (~75°)
var PLANAR_CX = 250;
var PLANAR_CY = 250;
var PLANAR_R_COT = 70;      // coterminous outer border radius (x)
var PLANAR_R_NEU = 140;     // neutral outer border radius (2x)
var PLANAR_R_REM = 210;     // remote outer border radius (3x)
var PLANAR_R_DAL = 246;     // Dal Quor outer orbit radius
var PLANAR_DISC_R = 10;     // base disc radius

function _planarProject(angleDeg: number, radius: number): { x: number; y: number } {
  var rad = angleDeg * Math.PI / 180;
  return {
    x: PLANAR_CX + Math.cos(rad) * radius,
    y: PLANAR_CY + Math.sin(rad) * radius * PLANAR_TILT
  };
}

function _planarRadiusForPosition(pos: number): number {
  // 0.0 = center, 1/3 = coterminous outer border, 2/3 = neutral outer border, 1.0 = remote outer border
  var t = Math.max(0, Math.min(1, pos));
  if (t <= (1 / 3)) return PLANAR_R_COT * (t / (1 / 3));
  if (t <= (2 / 3)) return PLANAR_R_COT + (PLANAR_R_NEU - PLANAR_R_COT) * ((t - (1 / 3)) / (1 / 3));
  return PLANAR_R_NEU + (PLANAR_R_REM - PLANAR_R_NEU) * ((t - (2 / 3)) / (1 / 3));
}

function _drawPlanarDiagram(phases: PlanarPhaseResult[]) {
  if (!planarCtx || !planarCanvas) return;
  var pCtx = planarCtx;
  var w = planarCanvas.width;
  var h = planarCanvas.height;
  pCtx.clearRect(0, 0, w, h);

  // Background
  var bg = pCtx.createRadialGradient(PLANAR_CX, PLANAR_CY, 20, PLANAR_CX, PLANAR_CY, 260);
  bg.addColorStop(0, 'rgba(12, 18, 30, 0.95)');
  bg.addColorStop(1, 'rgba(5, 10, 18, 0.98)');
  pCtx.fillStyle = bg;
  pCtx.fillRect(0, 0, w, h);

  // Draw concentric band ellipses
  var bandRadii = [PLANAR_R_COT, PLANAR_R_NEU, PLANAR_R_REM];
  var bandLabels = [
    { name: 'Coterminous', radius: PLANAR_R_COT * 0.5 },
    { name: 'Neutral', radius: (PLANAR_R_COT + PLANAR_R_NEU) / 2 },
    { name: 'Remote', radius: (PLANAR_R_NEU + PLANAR_R_REM) / 2 }
  ];
  for (var b = 0; b < bandRadii.length; b++) {
    pCtx.beginPath();
    pCtx.ellipse(PLANAR_CX, PLANAR_CY, bandRadii[b], bandRadii[b] * PLANAR_TILT, 0, 0, Math.PI * 2);
    pCtx.lineWidth = 1;
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    pCtx.stroke();
  }

  // Dal Quor orbit ring (dashed)
  pCtx.save();
  pCtx.setLineDash([4, 6]);
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY, PLANAR_R_DAL, PLANAR_R_DAL * PLANAR_TILT, 0, 0, Math.PI * 2);
  pCtx.lineWidth = 0.8;
  pCtx.strokeStyle = 'rgba(123, 104, 174, 0.2)';
  pCtx.stroke();
  pCtx.restore();

  // Draw 12 axis lines (faint, as elliptical arcs through center)
  var globalSpinDeg = ((state.planarSerial / (12 * 336)) * 360) % 360;
  for (var a = 0; a < 12; a++) {
    var angleDeg = a * 15;
    var p1 = _planarProject(angleDeg + globalSpinDeg, PLANAR_R_REM);
    var p2 = _planarProject(angleDeg + 180 + globalSpinDeg, PLANAR_R_REM);
    pCtx.beginPath();
    pCtx.moveTo(p1.x, p1.y);
    pCtx.lineTo(p2.x, p2.y);
    pCtx.lineWidth = 0.6;
    pCtx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    pCtx.stroke();
  }

  // Band labels inside each band
  pCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  pCtx.font = '10px "Trebuchet MS", sans-serif';
  pCtx.textAlign = 'center';
  for (var bl = 0; bl < bandLabels.length; bl++) {
    var labelPos = _planarProject(-24 + globalSpinDeg, bandLabels[bl].radius);
    pCtx.fillText(bandLabels[bl].name, labelPos.x, labelPos.y + 4);
  }

  // Compute plane positions and sort back-to-front by Y for depth ordering
  type PlaneDrawItem = {
    phase: PlanarPhaseResult;
    x: number;
    y: number;
    depth: number; // sin(angle) for depth ordering: negative = back, positive = front
    discR: number;
    alpha: number;
  };

  var items: PlaneDrawItem[] = [];
  for (var pi = 0; pi < phases.length; pi++) {
    var ph = phases[pi];
    var effectiveAngle: number;
    var radius: number;

    if (ph.isDalQuor) {
      effectiveAngle = (ph.dalQuorOrbitAngle || 0) + globalSpinDeg;
      radius = PLANAR_R_DAL;
    } else {
      effectiveAngle = (ph.onPrimarySide ? ph.axisAngle : (ph.axisAngle + 180)) + globalSpinDeg;
      radius = _planarRadiusForPosition(ph.position);
    }

    var pos = _planarProject(effectiveAngle, radius);
    var depthVal = Math.sin(effectiveAngle * Math.PI / 180);
    // Depth-based sizing and brightness: back is smaller/dimmer, front is larger/brighter
    var depthScale = 0.85 + depthVal * 0.15; // 0.7 to 1.0
    var discR = PLANAR_DISC_R * depthScale;
    var alpha = 0.7 + depthVal * 0.3; // 0.4 to 1.0

    items.push({ phase: ph, x: pos.x, y: pos.y, depth: depthVal, discR: discR, alpha: alpha });
  }

  // Sort: back (negative depth / top of ellipse) first, front (positive / bottom) last
  items.sort(function(a, b) { return a.depth - b.depth; });

  // Draw items: back planes first, then center marker, then front planes
  var centerDrawn = false;
  for (var di = 0; di < items.length; di++) {
    // Draw center "Eberron" marker before drawing front-hemisphere planes
    if (!centerDrawn && items[di].depth >= 0) {
      _drawEberronCenter(pCtx);
      centerDrawn = true;
    }
    _drawPlaneDisc(pCtx, items[di]);
  }
  // If all planes are behind (unlikely), draw center last
  if (!centerDrawn) _drawEberronCenter(pCtx);
}

function _drawEberronCenter(pCtx: CanvasRenderingContext2D) {
  // Eberron: ocean planet with continents
  pCtx.save();
  pCtx.beginPath();
  pCtx.arc(PLANAR_CX, PLANAR_CY, 12, 0, Math.PI * 2);
  pCtx.fillStyle = '#2f75b7';
  pCtx.shadowColor = 'rgba(70, 135, 200, 0.55)';
  pCtx.shadowBlur = 14;
  pCtx.fill();
  pCtx.restore();

  pCtx.save();
  pCtx.fillStyle = '#4ab06d';
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX - 3, PLANAR_CY - 1, 4, 2.2, 0.3, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX + 4, PLANAR_CY + 2, 3.4, 1.8, -0.2, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.beginPath();
  pCtx.ellipse(PLANAR_CX, PLANAR_CY - 5, 2.6, 1.5, 0.7, 0, Math.PI * 2);
  pCtx.fill();
  pCtx.restore();

  pCtx.save();
  pCtx.beginPath();
  pCtx.arc(PLANAR_CX, PLANAR_CY, 15, 0, Math.PI * 2);
  pCtx.fillStyle = 'rgba(180, 200, 220, 0.08)';
  pCtx.shadowColor = 'rgba(180, 200, 220, 0.35)';
  pCtx.shadowBlur = 12;
  pCtx.fill();
  pCtx.restore();

  pCtx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  pCtx.font = '10px "Trebuchet MS", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText('Eberron', PLANAR_CX, PLANAR_CY + 20);
}

function _drawPlaneDisc(pCtx: CanvasRenderingContext2D, item: { phase: PlanarPhaseResult; x: number; y: number; discR: number; alpha: number }) {
  var ph = item.phase;
  var color = ph.color;
  var r = item.discR;

  // For very dark colors (Mabar), use a lighter outline
  var isDark = color === '#111111' || color === '#000000';
  var fillColor = isDark ? '#333333' : color;

  pCtx.save();
  pCtx.globalAlpha = item.alpha;

  // Glow
  pCtx.beginPath();
  pCtx.arc(item.x, item.y, r, 0, Math.PI * 2);
  pCtx.fillStyle = fillColor;
  pCtx.shadowColor = fillColor;
  pCtx.shadowBlur = r * 1.5;
  pCtx.fill();
  pCtx.restore();

  // Outline
  pCtx.beginPath();
  pCtx.arc(item.x, item.y, r, 0, Math.PI * 2);
  pCtx.lineWidth = isDark ? 1.2 : 0.8;
  pCtx.strokeStyle = isDark ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.4)';
  pCtx.stroke();

  // Label
  pCtx.fillStyle = 'rgba(255, 255, 255, ' + (item.alpha * 0.85) + ')';
  pCtx.font = (item.discR > 9 ? '11' : '9') + 'px "Trebuchet MS", sans-serif';
  pCtx.textAlign = 'center';
  pCtx.fillText(ph.name, item.x, item.y + r + 14);
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
  if (ph.isDalQuor) return 'remote (severed), 13-year orbit';
  if (ph.isFixed) return ph.phase + ' (fixed)';
  if (ph.phase !== 'neutral') return ph.phase;
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
  _renderGallerySourceOptions(worldId, 'all');
  _renderGalleryVariantOptions(worldId);
  galleryYearInput.value = String(WORLDS[worldId].defaultDate.year);
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

function _renderGallerySourceOptions(worldId: string, preferred: string){
  var world = WORLDS[worldId];
  var packs = (world.eventPacks || []).map(function(pack){
    return '<option value="' + _esc(pack.key.toLowerCase()) + '">' + _esc(pack.label) + '</option>';
  });
  gallerySourceSelect.innerHTML = '<option value="all">All default events</option>' + packs.join('');
  gallerySourceSelect.value = preferred;
}

type PreviewEventRow = {
  name: string;
  source?: string;
  color?: string;
  slotIndex: number;
  day: number;
};

function _eventRowsForSource(worldId: string, sourceKey: string, year: number): PreviewEventRow[] {
  var world = WORLDS[worldId];
  var packs = (world.eventPacks || []).filter(function(pack){
    if (sourceKey === 'all') return true;
    return String(pack.key || '').toLowerCase() === sourceKey;
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

function _parseLunarSizeParam(raw: string | null): 'enhanced' | 'realistic' {
  return _normalizeLunarSizeMode(raw || 'enhanced');
}

function _normalizeLunarSizeMode(raw: string): 'enhanced' | 'realistic' {
  return String(raw || '').toLowerCase() === 'realistic' ? 'realistic' : 'enhanced';
}

function _moonRadiusPx(angularDiameterDeg: number, mode: 'enhanced' | 'realistic'){
  if (mode === 'realistic') return Math.max(4, Math.min(14, angularDiameterDeg * 5.5));
  return Math.max(14, Math.min(38, angularDiameterDeg * 22));
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
