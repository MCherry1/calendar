import { WORLD_ORDER, WORLDS } from '../src/worlds/index.js';
import { buildCalendarPreview } from '../src/showcase/calendar-preview.js';
import { buildSkyScene } from '../src/showcase/sky-scene.js';
import { clampDayForSlot, formatWorldDate, fromWorldSerial, getWorldCalendarSlots, regularMonthIndexToSlotIndex, toWorldSerial } from '../src/showcase/world-calendar.js';

type ShowcaseState = {
  worldId: string;
  serial: number;
  timeFrac: number;
  playing: boolean;
  speedHoursPerSecond: number;
};

var DETAIL_SYNC_INTERVAL_MS = 160;
var URL_SYNC_INTERVAL_MS = 800;

var state: ShowcaseState = _initialState();
var lastFrame = performance.now();
var lastDetailSync = 0;
var lastUrlSync = 0;
var lastMoonListHtml = '';

var worldSelect = _must<HTMLSelectElement>('hero-world');
var yearInput = _must<HTMLInputElement>('hero-year');
var slotSelect = _must<HTMLSelectElement>('hero-slot');
var dayInput = _must<HTMLInputElement>('hero-day');
var timeInput = _must<HTMLInputElement>('hero-time');
var timeLabel = _must<HTMLOutputElement>('hero-time-label');
var playToggle = _must<HTMLButtonElement>('play-toggle');
var speedSelect = _must<HTMLSelectElement>('hero-speed');
var worldLabel = _must<HTMLElement>('hero-world-label');
var sceneDateLabel = _must<HTMLElement>('scene-date-label');
var sceneSubtitle = _must<HTMLElement>('scene-subtitle');
var moonList = _must<HTMLElement>('moon-list');
var heroStats = _must<HTMLElement>('hero-stats');
var calendarGallery = _must<HTMLElement>('calendar-gallery');
var copyLinkButton = _must<HTMLButtonElement>('copy-link');
var canvas = _must<HTMLCanvasElement>('sky-canvas');
var ctx = canvas.getContext('2d');

if (!ctx) throw new Error('Canvas context not available.');

_renderWorldOptions();
_renderCalendarGallery();
_syncControlsFromState();
_bindEvents();
_render(true, true, performance.now());
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
    playing: false,
    speedHoursPerSecond: 12
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
    _render(true, true, performance.now());
  });

  yearInput.addEventListener('change', _updateStateFromControls);
  slotSelect.addEventListener('change', _updateStateFromControls);
  dayInput.addEventListener('change', _updateStateFromControls);
  timeInput.addEventListener('input', function(){
    state.timeFrac = (parseInt(timeInput.value, 10) || 0) / 1440;
    _syncControlsFromState();
    _render(true, true, performance.now());
  });

  playToggle.addEventListener('click', function(){
    state.playing = !state.playing;
    if (state.playing) {
      lastDetailSync = 0;
      lastUrlSync = 0;
    }
    playToggle.textContent = state.playing ? 'Pause' : 'Play';
    _render(true, true, performance.now());
  });

  speedSelect.addEventListener('change', function(){
    state.speedHoursPerSecond = parseFloat(speedSelect.value) || 12;
    _syncControlsFromState();
    _render(true, true, performance.now());
  });

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
}

function _updateStateFromControls(){
  var year = parseInt(yearInput.value, 10) || WORLDS[state.worldId].defaultDate.year;
  var slotIndex = Math.max(0, Math.min(getWorldCalendarSlots(state.worldId).length - 1, parseInt(slotSelect.value, 10) || 0));
  var day = clampDayForSlot(state.worldId, slotIndex, parseInt(dayInput.value, 10) || 1);
  state.serial = toWorldSerial(state.worldId, year, slotIndex, day);
  _syncControlsFromState();
  _render(true, true, performance.now());
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
  timeInput.value = String(totalMinutes < 0 ? totalMinutes + 1440 : totalMinutes);
  timeLabel.textContent = _formatClock(totalMinutes);
  speedSelect.value = String(state.speedHoursPerSecond);
  playToggle.textContent = state.playing ? 'Pause' : 'Play';
  sceneDateLabel.textContent = formatWorldDate(state.worldId, state.serial);
  sceneSubtitle.textContent = world.description;
  if (heroStats.dataset.worldId !== state.worldId) {
    heroStats.innerHTML = _buildHeroStats(state.worldId);
    heroStats.dataset.worldId = state.worldId;
  }
}

function _render(forceDetails: boolean, forceUrl: boolean, now: number){
  var scene = buildSkyScene({
    worldId: state.worldId,
    serial: state.serial,
    timeFrac: state.timeFrac
  });
  sceneDateLabel.textContent = formatWorldDate(state.worldId, state.serial);
  timeLabel.textContent = _formatClock(Math.round(state.timeFrac * 1440));
  _drawScene(scene);
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
  calendarGallery.innerHTML = WORLD_ORDER.map(function(worldId){
    var world = WORLDS[worldId];
    var preview = buildCalendarPreview({
      worldId: worldId,
      year: world.defaultDate.year,
      monthIndex: world.defaultDate.month
    });
    var weekdayCount = preview.weekdayLabels.length;
    var cardBasis = _calendarCardBasis(weekdayCount);
    return (
      '<article class="calendar-card" style="--calendar-card-basis:' + cardBasis + ';">' +
        '<div class="calendar-card-header">' +
          '<div>' +
            '<small>' + _esc(world.calendar.label) + '</small>' +
            '<h4>' + _esc(world.label) + '</h4>' +
          '</div>' +
          '<span class="meta-chip">' + _esc(preview.daysInMonth + ' days') + '</span>' +
        '</div>' +
        '<div class="calendar-card-meta">' +
          '<span class="meta-chip">' + _esc(preview.monthName) + '</span>' +
          '<span class="meta-chip">' + _esc(String(preview.year) + ' ' + world.eraLabel) + '</span>' +
          '<span class="meta-chip">' + _esc(String(preview.moonCount) + ' moon' + (preview.moonCount === 1 ? '' : 's')) + '</span>' +
        '</div>' +
        '<p>' + _esc(preview.description) + '</p>' +
        '<div class="mini-calendar" style="--weekday-count:' + weekdayCount + ';">' +
          '<div class="mini-weekdays">' +
            preview.weekdayLabels.map(function(label){
              return '<span>' + _esc(label) + '</span>';
            }).join('') +
          '</div>' +
          '<div class="mini-cells">' +
            preview.cells.map(function(cell){
              if (cell.kind === 'empty') return '<span class="mini-cell empty">.</span>';
              return '<span class="mini-cell">' + _esc(String(cell.day)) + '</span>';
            }).join('') +
          '</div>' +
        '</div>' +
        _festivalRail(preview.intercalaryBefore.concat(preview.intercalaryAfter)) +
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

function _calendarCardBasis(weekdayCount: number){
  var safeCount = Math.max(1, weekdayCount | 0);
  if (safeCount <= 7) return '270px';
  return 'calc(270px * ' + safeCount + ' / 7)';
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
  if (nextHtml !== lastMoonListHtml) {
    moonList.innerHTML = nextHtml;
    lastMoonListHtml = nextHtml;
  }
}

function _drawScene(scene: ReturnType<typeof buildSkyScene>){
  if (!ctx) return;
  var width = canvas.width;
  var height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  var gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f2741');
  gradient.addColorStop(0.45, '#142138');
  gradient.addColorStop(1, '#080c14');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  _drawStars(width, height, state.timeFrac);

  var cx = width / 2;
  var cy = height / 2 - 8;
  var radius = Math.min(width, height) * 0.34;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 15, 24, 0.28)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(247, 242, 232, 0.18)';
  ctx.stroke();

  _drawCompass(cx, cy, radius);

  var labeled = 0;
  for (var i = 0; i < scene.moons.length; i++){
    var moon = scene.moons[i];
    if (moon.category === 'below') continue;
    var position = _scenePoint(cx, cy, radius, moon.azimuth, Math.max(0, moon.altitudeExact));
    var moonRadius = Math.max(6, Math.min(26, moon.angularDiameterDeg * 5.5));
    _drawMoonDisk(position.x, position.y, moonRadius, moon.color || '#d8dee7', moon.phase);
    if (labeled < 5 && moon.altitudeExact >= 4){
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
  for (var i = 0; i < 160; i++){
    var seed = _hash(i + ':' + state.worldId);
    var x = (seed * 9301 % 1000) / 1000 * width;
    var y = (_hash('y:' + i + ':' + state.worldId) * 8117 % 1000) / 1000 * height * 0.9;
    var size = 0.5 + ((_hash('s:' + i + ':' + state.worldId) * 3571) % 1000) / 1000 * 2.1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 247, 225, ' + (0.18 + ((_hash('a:' + i + ':' + state.worldId) % 1000) / 1000) * twinkle) + ')';
    ctx.fill();
  }
}

function _drawCompass(cx: number, cy: number, radius: number){
  if (!ctx) return;
  var labels = [
    { text: 'N', x: cx, y: cy - radius - 18 },
    { text: 'E', x: cx + radius + 18, y: cy + 5 },
    { text: 'S', x: cx, y: cy + radius + 30 },
    { text: 'W', x: cx - radius - 18, y: cy + 5 }
  ];
  ctx.fillStyle = 'rgba(247, 242, 232, 0.66)';
  ctx.font = '14px "Trebuchet MS", "Gill Sans", sans-serif';
  ctx.textAlign = 'center';
  labels.forEach(function(label){
    ctx.fillText(label.text, label.x, label.y);
  });
}

function _scenePoint(cx: number, cy: number, radius: number, azimuthDeg: number, altitudeDeg: number){
  var altitude = Math.max(0, Math.min(90, altitudeDeg));
  var radial = radius * (1 - altitude / 90);
  var azimuth = azimuthDeg * Math.PI / 180;
  return {
    x: cx + Math.sin(azimuth) * radial,
    y: cy - Math.cos(azimuth) * radial
  };
}

function _drawMoonDisk(x: number, y: number, radius: number, color: string, phase: { illum: number; waxing: boolean }){
  if (!ctx) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 1.2;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = 'rgba(5, 10, 18, 0.92)';
  var shift = (1 - (2 * Math.max(0, Math.min(1, phase.illum)))) * radius * (phase.waxing ? -1 : 1);
  ctx.beginPath();
  ctx.arc(x + shift, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
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

function _tick(now: number){
  var dtSeconds = Math.min(0.05, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;
  if (state.playing){
    var totalDays = state.serial + state.timeFrac + ((dtSeconds * state.speedHoursPerSecond) / 24);
    state.serial = Math.floor(totalDays);
    state.timeFrac = totalDays - state.serial;
    _syncControlsFromState();
    _render(false, false, now);
  }
  requestAnimationFrame(_tick);
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
