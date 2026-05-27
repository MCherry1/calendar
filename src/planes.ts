// Section 21: Planar System (canon-only, read-only Roll20 surface)
//
// This is a thin Roll20 wrapper around the Eberron planar canon data.
// Per CLAUDE.md / DESIGN.md / ENGINE_CONTRACT.md §5.4, the wrapper surfaces
// planar phase information for display only — no GM overrides, no seeded
// generation, no anchor wizardry, no knowledge tiers. Players and GMs see
// the same canon-derived state.
import { state_name } from './constants.js';
import { ensureSettings, getCal, titleCase } from './state.js';
import { fromSerial, toSerial, todaySerial } from './date-math.js';
import { _monthRangeFromSerial, _renderSyntheticMiniCal, button, esc, handoutWrap, rollingMonthWindow } from './rendering.js';
import { _deliverAdditionalCalendarRange, _deliverTopLevelCalendarRange, buildAdditionalRangesCommand } from './events.js';
import { _displayModeLabel, _legendLine, _menuBox, _normalizeDisplayMode, _serialToDateSpec, _shiftSerialByMonth, dateLabelFromSerial, formalDateLabelFromSerial, parseDatePrefixForAdd } from './ui.js';
import { sendToAll, warnGM, whisper, whisperParts } from './commands.js';
import { handoutButton, refreshHandout } from './persistent-views.js';
import { getLongShadowsMoons } from './moon.js';

/* ============================================================================
 * 21) PLANAR SYSTEM — canon-only
 * ============================================================================
 * Each Eberron plane orbits the Material in a cycle: coterminous → neutral →
 * remote → neutral → coterminous. Planes snap between active states with no
 * gradual transition. This module computes current phase from canonical
 * anchor dates and cycle parameters and renders read-only displays.
 * ==========================================================================*/

// ---------------------------------------------------------------------------
// 21a) Planar data — canon cycle definitions for Eberron's 13 planes
// ---------------------------------------------------------------------------

// Phase durations in days. Full orbit = coterminous + neutral + remote + neutral.
// Neutral gaps are computed as (orbit - coterminous - remote) / 2.
// Special planes have 'fixed' type instead of 'cyclic'.

export var PLANE_DATA = {
  eberron: [
    { name:'Daanvi',    title:'The Perfect Order',
      color: '#C9A227',
      type:'cyclic',
      orbitYears: 400,   coterminousDays: null, remoteDays: null,
      coterminousYears: 100, remoteYears: 100,
      anchorYear: 800, anchorPhase: 'coterminous',
      associatedMoon: 'Nymm',
      note: 'Traditional cycle: coterminous for a century, then remote for a century one hundred years later.',
      effects: {
        coterminous: 'No obvious effects. Some sages link rise of civilizations to Daanvi coterminous periods. May impact eldritch machine rituals.',
        remote: 'No obvious effects. Century-long remote period.'
      }
    },
    { name:'Dal Quor',  title:'The Region of Dreams',
      color: '#7B68AE',
      type:'fixed', fixedPhase:'remote',
      associatedMoon: 'Crya',
      note: 'Knocked off orbit ~40,000 years ago during the Quori invasion of Xen\'drik. Permanently remote. Crya (the 13th moon) believed destroyed.',
      effects: { remote: 'Only reachable via dreaming. Plane shift cannot reach Dal Quor. No manifest zones exist naturally.' }
    },
    { name:'Dolurrh',   title:'The Realm of the Dead',
      color: '#808080',
      type:'cyclic',
      orbitYears: 100,   coterminousDays: null, remoteDays: null,
      coterminousYears: 1, remoteYears: 1,
      anchorYear: 950, anchorPhase: 'coterminous',
      associatedMoon: 'Aryth',
      note: 'Slow canonical cycle: coterminous for 1 year once per century; 50 years later, remote for 1 year.',
      effects: {
        coterminous: 'Ghosts more easily slip into the Material Plane, especially near Dolurrhi manifest zones. Raise-dead effects can draw unwanted spirits (Dolurrhi mishaps).',
        remote: 'Traditional resurrection magic cannot pull spirits back from Dolurrh. Recovering the dead requires retrieving the shade in Dolurrh; deaths with intense emotion or unfinished business more often leave ghosts behind.'
      }
    },
    { name:'Fernia',    title:'The Sea of Fire',
      color: '#FF5722',
      type:'cyclic',
      orbitYears: 5,     coterminousDays: 28, remoteDays: 28,
      coterminousYears: null, remoteYears: null,
      anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 7,
      seasonHint: 'midsummer',
      associatedMoon: 'Eyre',
      note: 'Traditional cycle: coterminous during Lharvion once every five years; remote during Zarantyr once every five years, exactly 2.5 years later.',
      effects: {
        coterminous: 'Temperatures rise sharply. Safer warm regions can become extremely hot, taking on Deadly Heat, Empowered Fire, and Burning Bright traits. Rarely, creatures caught in exceptionally intense flame are pulled into Fernia.',
        remote: 'Intense heat loses some of its bite. Creatures have advantage on saves against extreme heat and on saves against spells that deal fire damage.'
      }
    },
    { name:'Irian',     title:'The Eternal Dawn',
      color: '#F0F0F0',
      type:'cyclic',
      orbitYears: 3,     coterminousDays: 10, remoteDays: 10,
      coterminousYears: null, remoteYears: null,
      anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 4, anchorDay: 1,
      seasonHint: 'spring',
      associatedMoon: 'Barrakas',
      note: 'Coterminous for 10 days in Eyre and remote for 10 days in Sypheros, once every 3 years. The remote cycle comes 1.5 years after coterminous.',
      effects: {
        coterminous: 'Life blossoms. Health and fertility are enhanced, positive energy flows freely, and Radiant Power applies across Eberron. All creatures have advantage on saves against disease, poison, and fear.',
        remote: 'Colors seem to fade and psychic numbness pervades the world. All creatures have disadvantage on saves against fear and resistance to radiant damage. Hit point restoration is halved, except long rests still restore full hit points.'
      }
    },
    { name:'Kythri',    title:'The Churning Chaos',
      color: '#2E8B8B',
      type:'fixed', fixedPhase:'neutral',
      associatedMoon: 'Zarantyr',
      note: 'Kythri\'s coterminous and remote phases are completely unpredictable, lasting from days to centuries. Proximity has no discernible global effects on the Material Plane.',
      effects: {
        coterminous: 'No discernible global effects on the Material Plane.',
        remote: 'No discernible global effects on the Material Plane.'
      }
    },
    { name:'Lamannia',  title:'The Twilight Forest',
      color: '#228B22',
      type:'cyclic',
      orbitYears: 1,     coterminousDays: 7, remoteDays: 7,
      coterminousYears: null, remoteYears: null,
      anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 6, anchorDay: 24,
      seasonHint: 'summer solstice',
      associatedMoon: 'Olarune',
      note: 'Coterminous for a week centered on the summer solstice (Nymm 24–Lharvion 2) and remote for a week centered on the winter solstice (Vult 24–Zarantyr 2). Both occur every year.',
      effects: {
        coterminous: 'Lamannian manifest zone effects are enhanced. In unspoiled nature, fertility of plants and animals rises and beasts conceived in this period are often exceptionally strong and healthy. Spells targeting beasts or elementals with duration 1 minute or longer are doubled; durations of 24 hours or longer are unaffected.',
        remote: 'Fertility rates drop and beasts born in this period are often weak or sickly; animals are uneasy. Spells affecting beasts or elementals have their duration halved, to a minimum of 1 round.'
      }
    },
    { name:'Mabar',     title:'The Endless Night',
      color: '#111111',
      type:'cyclic',
      orbitYears: 1,     coterminousDays: 3, remoteDays: 0,
      coterminousYears: null, remoteYears: null,
      anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 12, anchorDay: 26,
      seasonHint: 'winter solstice',
      associatedMoon: 'Sypheros',
      remoteOrbitYears: 5, remoteDaysSpecial: 5, remoteSeasonHint: 'summer solstice',
      note: 'Long Shadows: coterminous for 3 days around the winter solstice (Vult 26–28), every year. Remote for 5 days around the summer solstice (Nymm 25–Lharvion 1), once every 5 years.',
      effects: {
        coterminous: 'Necrotic Power encompasses the world and all light source radii are halved. In regions steeped in despair or misery, deep darkness can open gateways to Mabar, releasing shadows and other horrors. This manifests only at night and ends at dawn.',
        remote: 'All creatures gain resistance to necrotic damage. Undead have disadvantage on saves vs being turned or frightened.'
      }
    },
    { name:'Risia',     title:'The Plain of Ice',
      color: '#00ACC1',
      type:'cyclic',
      orbitYears: 5,     coterminousDays: 28, remoteDays: 28,
      coterminousYears: null, remoteYears: null,
      anchorYear: 996, anchorPhase: 'coterminous', anchorMonth: 1,
      linkedTo: 'Fernia',
      seasonHint: 'midwinter',
      associatedMoon: 'Dravago',
      note: 'Exactly opposite Fernia on the same 5-year cycle. Coterminous in midwinter (Zarantyr), remote in midsummer (Lharvion). Risia is coterminous when Fernia is remote and vice versa.',
      effects: {
        coterminous: 'Temperatures drop sharply. Areas that are normally merely chilly can take on Lethal Cold, Empowered Ice, and Stillness of Flesh properties. Rarely, creatures caught in exceptionally intense cold can be transported to Risia.',
        remote: 'Intense cold loses some of its bite. Creatures have advantage on saves against extreme cold and on saves against spells that deal cold damage.'
      }
    },
    { name:'Shavarath', title:'The Eternal Battleground',
      color: '#8B0000',
      type:'cyclic',
      orbitYears: 36,    coterminousDays: null, remoteDays: null,
      coterminousYears: 1, remoteYears: 1,
      anchorYear: 990, anchorPhase: 'coterminous',
      associatedMoon: 'Vult',
      note: 'Traditional cycle: coterminous for 1 year every 36 years and remote for 1 year every 36 years.',
      effects: {
        coterminous: 'People are quick to anger: trivial disputes can become brawls, and restless thought can lead to riots or revolution. War Magic and Unquenchable Fury spread worldwide; intense violence in Shavaran manifest zones can draw in whirling blades.',
        remote: 'No apparent effect on the Material Plane.'
      }
    },
    { name:'Syrania',   title:'The Azure Sky',
      color: '#64B5F6',
      type:'cyclic',
      orbitYears: 10,    coterminousDays: 1, remoteDays: 1,
      coterminousYears: null, remoteYears: null,
      anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 9, anchorDay: 9,
      associatedMoon: 'Therendor',
      note: 'Traditionally coterminous on 9 Rhaan once every 10 years and remote on the same day 5 years later. This is celebrated as Boldrei\'s Feast, with especially grand celebrations on coterminous years.',
      effects: {
        coterminous: 'Goodwill spreads worldwide. Absolute Peace and Gentle Thoughts apply across Eberron; creatures harmed (or witnessing allies harmed) ignore Absolute Peace for 1 minute. Skies are clear and weather calm.',
        remote: 'Skies are gray and the sun is hidden. People feel quarrelsome: creatures have disadvantage on Charisma (Persuasion) checks and advantage on Charisma (Intimidation) checks. Outside Syranian manifest zones, flying speeds are reduced by 10 feet (minimum 5 feet).'
      }
    },
    { name:'Thelanis',  title:'The Faerie Court',
      color: '#50C878',
      type:'cyclic',
      orbitYears: 225,   coterminousDays: null, remoteDays: null,
      coterminousYears: 7, remoteYears: 7,
      anchorYear: 800, anchorPhase: 'coterminous',
      associatedMoon: 'Rhaan',
      note: 'Traditional cycle: coterminous for 7 years every 225 years, remote for 7 years halfway between. Evidence suggests this cycle has been disrupted (possibly by the Mourning), and no one knows when Thelanis will next become coterminous or how long it will last.',
      effects: {
        coterminous: 'New gateway zones spring up, and mischievous or cruel fey may cross over. It is easier for careless travelers to cross into Thelanis, but usually only after breaking a superstition or taboo; warnings are often present.',
        remote: 'Effects of Thelanian manifest zones are suppressed. Fey creatures, even ones that usually dwell on Eberron, may be temporarily drawn back to Thelanis. The world feels less magical.'
      }
    },
    { name:'Xoriat',    title:'The Realm of Madness',
      color: '#9ACD32',
      type:'fixed', fixedPhase:'remote',
      associatedMoon: 'Lharvion',
      note: 'The Gatekeeper seals that bind the daelkyr in Khyber also keep Xoriat from becoming coterminous. Remote phases are unpredictable and usually much slower than Kythri\'s. No citizens of the Five Nations are known to have visited Xoriat.',
      effects: { remote: 'Xoriat\'s remote phases have no known global effect on the Material Plane.' }
    }
  ]
};

// ---------------------------------------------------------------------------
// 21b) State management — minimal (subsystem toggle only)
// ---------------------------------------------------------------------------

export function getPlanesState(){
  var root = state[state_name];
  if (!root.planes) root.planes = {};
  var ps = root.planes;
  // Defensive empty containers so legacy callers (e.g. moon.ts off-cycle
  // suppression checks) can still safely look up keys.
  if (!ps.overrides) ps.overrides = {};
  if (!ps.anchors) ps.anchors = {};
  if (!ps.suppressedEvents) ps.suppressedEvents = {};
  if (!ps.gmCustomEvents) ps.gmCustomEvents = {};
  return ps;
}

// ---------------------------------------------------------------------------
// 21c) Plane data lookups
// ---------------------------------------------------------------------------

// Get the plane definition by name (case-insensitive).
export function _getPlaneData(name){
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return null;
  var lc = String(name || '').toLowerCase();
  for (var i = 0; i < planes.length; i++){
    if (planes[i].name.toLowerCase() === lc) return planes[i];
  }
  return null;
}

// Get all plane definitions for the current calendar system.
// Returns empty array for worlds without planar data.
export function _getAllPlaneData(){
  var st = ensureSettings();
  return PLANE_DATA[st.calendarSystem] || [];
}

// Convert years to days using the calendar's year length.
export function _planarYearDays(){
  return getCal().months.reduce(function(s, m){ return s + (m.days|0); }, 0);
}

// ---------------------------------------------------------------------------
// 21d) Phase calculation — canon-only
// ---------------------------------------------------------------------------

function _planeCycleMetrics(plane){
  var ypd = _planarYearDays();
  var coterminousDays = plane.coterminousDays || ((plane.coterminousYears || 0) * ypd);
  var remoteDays      = plane.remoteDays      || ((plane.remoteYears || 0)      * ypd);
  var orbitDays       = (plane.orbitYears || 1) * ypd;
  var transitionDays  = (orbitDays - coterminousDays - remoteDays) / 2;
  if (transitionDays < 1) transitionDays = 1;

  // Phase order: coterminous → neutral → remote → neutral → (repeat)
  var phases = [
    { name:'coterminous', dur: coterminousDays },
    { name:'neutral',     dur: transitionDays },
    { name:'remote',      dur: remoteDays },
    { name:'neutral',     dur: transitionDays }
  ];
  return {
    ypd: ypd,
    coterminousDays: coterminousDays,
    remoteDays: remoteDays,
    orbitDays: orbitDays,
    transitionDays: transitionDays,
    phases: phases
  };
}

// Calculate the current phase of a plane at a given serial day.
// Returns { plane, phase, daysIntoPhase, daysUntilNextPhase, phaseDuration,
//          nextPhase, note, sourceLabel } or null if the plane is unknown.
// opts.ignoreGenerated is accepted but has no effect — no generated events
// exist in the canon-only surface.
export function getPlanarState(planeName, serial, opts?){
  var plane = _getPlaneData(planeName);
  if (!plane) return null;

  // Fixed planes (Dal Quor, Xoriat, Kythri)
  if (plane.type === 'fixed'){
    return {
      plane: plane,
      phase: plane.fixedPhase || 'remote',
      phaseIndex: null,
      daysIntoPhase: null,
      daysUntilNextPhase: null,
      phaseDuration: null,
      nextPhase: null,
      overridden: false,
      note: plane.note || '',
      sourceLabel: 'traditional'
    };
  }

  // Cyclic planes — calculate from canonical anchor
  var cycle = _planeCycleMetrics(plane);
  var coterminousDays = cycle.coterminousDays;
  var remoteDays = cycle.remoteDays;
  var phases = cycle.phases;
  var orbitDays = cycle.orbitDays;

  var anchorMi = (plane.anchorMonth != null) ? (plane.anchorMonth - 1) : 0;
  var anchorDay = (plane.anchorDay != null) ? (plane.anchorDay | 0) : 1;
  if (anchorDay < 1) anchorDay = 1;
  var anchorSerial = toSerial(plane.anchorYear || 998, anchorMi, anchorDay);

  // Find which phase the anchor starts in
  var anchorPhaseIdx = 0;
  var anchorPhaseName = plane.anchorPhase || 'coterminous';
  for (var p = 0; p < phases.length; p++){
    if (phases[p].name === anchorPhaseName){ anchorPhaseIdx = p; break; }
  }

  // Compute offset from anchor into the cycle
  var daysSinceAnchor = serial - anchorSerial;
  var totalCycle = orbitDays;
  var offset = daysSinceAnchor % totalCycle;
  if (offset < 0) offset += totalCycle;

  // Walk through phases starting from the anchor phase
  var accumulated = 0;
  for (var pi = 0; pi < phases.length; pi++){
    var idx = (anchorPhaseIdx + pi) % phases.length;
    var ph  = phases[idx];
    if (offset < accumulated + ph.dur){
      var into = offset - accumulated;
      var nextIdx = (idx + 1) % phases.length;
      var cyclicPhase = ph.name;
      var cyclicPhaseIdx = idx;
      var resolvedDaysInto = Math.floor(into);
      var resolvedDaysUntilNext = Math.ceil(ph.dur - into);
      var resolvedPhaseDuration = Math.floor(ph.dur);
      var resolvedNextPhase = phases[nextIdx].name;

      // Mabar special case: annual coterminous + 5-year remote sub-cycle.
      // The standard cyclic calc gives us the annual cot; we override
      // neutral to remote during the rare 5-year summer-solstice window.
      if (plane.remoteOrbitYears && plane.remoteDaysSpecial){
        var remoteDur = plane.remoteDaysSpecial;
        var _solstice = 5 * 28 + 26;
        var _di = fromSerial(serial);
        var _yearStart = toSerial(_di.year, 0, 1);
        var _dayOfYear = serial - _yearStart;
        var _remoteBaseYear = (plane.anchorYear || 998) + 1;
        var _remoteYearsSince = _di.year - _remoteBaseYear;
        var _isRemoteYear = (_remoteYearsSince >= 0 && (_remoteYearsSince % plane.remoteOrbitYears) === 0);
        var _remoteStart = _solstice - Math.floor(remoteDur / 2);
        var _remoteEnd   = _remoteStart + remoteDur - 1;
        if (cyclicPhase !== 'coterminous' && _isRemoteYear &&
            _dayOfYear >= _remoteStart && _dayOfYear <= _remoteEnd){
          return {
            plane: plane,
            phase: 'remote',
            phaseIndex: 2,
            daysIntoPhase: _dayOfYear - _remoteStart,
            daysUntilNextPhase: _remoteEnd - _dayOfYear + 1,
            phaseDuration: remoteDur,
            nextPhase: 'neutral',
            overridden: false,
            note: '',
            sourceLabel: 'traditional'
          };
        }
      }

      return {
        plane: plane,
        phase: cyclicPhase,
        phaseIndex: cyclicPhaseIdx,
        daysIntoPhase: Math.max(0, resolvedDaysInto),
        daysUntilNextPhase: Math.max(0, resolvedDaysUntilNext),
        phaseDuration: Math.max(0, resolvedPhaseDuration),
        nextPhase: resolvedNextPhase,
        overridden: false,
        note: '',
        sourceLabel: 'traditional'
      };
    }
    accumulated += ph.dur;
  }

  // Shouldn't reach here, but fallback to a safe value.
  return {
    plane: plane,
    phase: 'neutral',
    phaseIndex: null,
    daysIntoPhase: 0,
    daysUntilNextPhase: 0,
    phaseDuration: 0,
    nextPhase: 'neutral',
    overridden: false,
    note: '',
    sourceLabel: 'traditional'
  };
}

// ---------------------------------------------------------------------------
// 21e) Phase emoji and label helpers
// ---------------------------------------------------------------------------

export var PLANE_PHASE_EMOJI = {
  coterminous: '🟢',  // 🟢
  remote:      '🔴',  // 🔴
  neutral:     '⚪'          // ⚪
};

export var PLANE_PHASE_LABELS = {
  coterminous: 'Coterminous',
  remote:      'Remote',
  neutral:     'Neutral'
};

// Legacy stub: there are no longer multiple knowledge tiers. Callers that
// still ask are normalized to the lone canon-only mode.
export function _normalizePlaneRevealTier(_tier){
  return 'canon';
}

// Legacy stub: no generated events in the canon-only surface.
export function _isGeneratedNote(_note){
  return false;
}

// ---------------------------------------------------------------------------
// 21f) Notable planes for !cal default view
// ---------------------------------------------------------------------------

function _planarDaySpanTag(ps){
  if (!ps || ps.phaseDuration == null || ps.daysIntoPhase == null || ps.phaseDuration <= 1) return '';
  return ' <span style="opacity:.72;">(Day ' + (ps.daysIntoPhase + 1) + ' of ' + ps.phaseDuration + ')</span>';
}

function _planarInDaysLabel(days){
  var d = Math.max(0, days|0);
  if (d === 1) return 'tomorrow';
  return 'in ' + d + ' days';
}

// Returns array of HTML strings for planes worth mentioning today.
// Criteria: currently coterminous/remote, or transitioning within 2 days.
// Excludes: fixed planes. Active phases over 1 year are skipped (avoids
// noise from century-scale neutral spans), but upcoming transitions
// always surface regardless of current phase duration.
export function _planarNotableToday(serial){
  var planes = _getAllPlaneData();
  var notes  = [];
  var ypd    = _planarYearDays();

  for (var i = 0; i < planes.length; i++){
    if (planes[i].type === 'fixed') continue;
    var ps = getPlanarState(planes[i].name, serial);
    if (!ps) continue;

    var name = ps.plane.name;
    if (ps.phase === 'coterminous'){
      if (ps.phaseDuration != null && ps.phaseDuration > ypd) continue;
      notes.push((PLANE_PHASE_EMOJI.coterminous || '🟢') + ' <b>'+esc(name)+'</b> is ' + esc(PLANE_PHASE_LABELS.coterminous) + _planarDaySpanTag(ps));
    } else if (ps.phase === 'remote'){
      if (ps.phaseDuration != null && ps.phaseDuration > ypd) continue;
      notes.push((PLANE_PHASE_EMOJI.remote || '🔴') + ' <b>'+esc(name)+'</b> is ' + esc(PLANE_PHASE_LABELS.remote) + _planarDaySpanTag(ps));
    } else if (ps.phase === 'neutral' && ps.daysUntilNextPhase != null && ps.daysUntilNextPhase > 0 && ps.daysUntilNextPhase <= 2 && ps.nextPhase){
      if (ps.nextPhase === 'coterminous'){
        notes.push((PLANE_PHASE_EMOJI.coterminous || '🟢') + ' <b>'+esc(name)+'</b> ' + esc(PLANE_PHASE_LABELS.coterminous) + ' ' + _planarInDaysLabel(ps.daysUntilNextPhase));
      } else if (ps.nextPhase === 'remote'){
        notes.push((PLANE_PHASE_EMOJI.remote || '🔴') + ' <b>'+esc(name)+'</b> ' + esc(PLANE_PHASE_LABELS.remote) + ' ' + _planarInDaysLabel(ps.daysUntilNextPhase));
      }
    }
  }
  return notes;
}

// ---------------------------------------------------------------------------
// 21g) Mini-calendar event overlays
// ---------------------------------------------------------------------------

// Threshold for "short" vs "long" planar events.
// Events ≤ this many days get cell fills; longer events get header bars.
var PLANE_SHORT_EVENT_THRESHOLD = 28;

// generatedCutoffSerial parameter is retained for call-site compatibility but
// has no effect — there are no generated events to clip.
export function _planesMiniCalEvents(startSerial, endSerial, _generatedCutoffSerial?){
  var out = [];
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return out;

  var start = startSerial|0;
  var end = endSerial|0;
  if (end < start){ var t = start; start = end; end = t; }

  for (var ser = start; ser <= end; ser++){
    var fills = [];
    var tipCot = [];
    var tipRem = [];

    for (var j = 0; j < planes.length; j++){
      var plane = planes[j];
      var name = plane.name;
      var planeColor = plane.color || '#607D8B';
      var canon = getPlanarState(name, ser);
      if (canon && (canon.phase === 'coterminous' || canon.phase === 'remote')){
        var dur = canon.phaseDuration || 999;
        if (dur <= PLANE_SHORT_EVENT_THRESHOLD){
          fills.push({
            planeName: name,
            color: planeColor,
            phase: canon.phase,
            duration: dur
          });
        }
        if (canon.phase === 'coterminous') tipCot.push(name);
        else tipRem.push(name);
      }
    }

    fills.sort(function(a, b){ return a.duration - b.duration; });

    var tipParts = [];
    if (tipCot.length) tipParts.push('Coterminous:\n  • ' + tipCot.join('\n  • '));
    if (tipRem.length) tipParts.push('Remote:\n  • ' + tipRem.join('\n  • '));
    var tooltip = tipParts.join('\n');

    if (fills.length === 1){
      out.push({
        serial: ser,
        name: tooltip || (fills[0].planeName + ' ' + fills[0].phase),
        color: fills[0].color,
        isRemote: fills[0].phase === 'remote',
        planeFill: true
      });
    } else if (fills.length >= 2){
      out.push({
        serial: ser,
        name: tooltip || (fills[0].planeName + ' / ' + fills[1].planeName),
        color: fills[0].color,
        planeFill: true,
        isRemote: fills[0].phase === 'remote',
        splitColor: fills[1].color,
        splitIsRemote: fills[1].phase === 'remote'
      });
    }
  }

  return out;
}

// Compute header bars for long canonical planar events active during a month
// range. Returns array of { planeName, color, phase, tooltip }.
export function _planesHeaderBars(startSerial, endSerial){
  var bars = [];
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return bars;

  var mid = Math.floor((startSerial + endSerial) / 2);
  var seen = {};

  for (var j = 0; j < planes.length; j++){
    var plane = planes[j];
    var canon = getPlanarState(plane.name, mid);
    if (!canon) continue;
    if (canon.phase !== 'coterminous' && canon.phase !== 'remote') continue;
    var dur = canon.phaseDuration || 0;
    if (dur <= PLANE_SHORT_EVENT_THRESHOLD) continue;

    var key = plane.name + ':' + canon.phase;
    if (seen[key]) continue;
    seen[key] = true;

    var phaseLabel = (PLANE_PHASE_LABELS[canon.phase] || canon.phase).toLowerCase();
    var daysInto = canon.daysIntoPhase || 0;
    var daysLeft = canon.daysUntilNextPhase || 0;
    var totalDays = dur;
    var tipParts = [plane.name + ' ' + phaseLabel];

    var yearDays = _planarYearDays() || 336;
    if (totalDays > yearDays * 2){
      tipParts.push('~' + Math.round(totalDays / yearDays) + ' years total');
    } else if (totalDays > 56){
      tipParts.push('~' + Math.round(totalDays / 28) + ' months total');
    } else {
      tipParts.push(totalDays + ' days total');
    }
    if (daysInto > yearDays){
      tipParts.push('began ~' + Math.round(daysInto / yearDays) + ' years ago');
    } else if (daysInto > 56){
      tipParts.push('began ~' + Math.round(daysInto / 28) + ' months ago');
    } else {
      tipParts.push('began ' + daysInto + ' days ago');
    }
    if (daysLeft > yearDays){
      tipParts.push('ending in ~' + Math.round(daysLeft / yearDays) + ' years');
    } else if (daysLeft > 56){
      tipParts.push('ending in ~' + Math.round(daysLeft / 28) + ' months');
    } else {
      tipParts.push('ending in ' + daysLeft + ' days');
    }

    bars.push({
      planeName: plane.name,
      color: plane.color || '#607D8B',
      phase: canon.phase,
      label: plane.name + ' ' + titleCase(phaseLabel),
      tooltip: tipParts.join(', ')
    });
  }

  return bars;
}

// ---------------------------------------------------------------------------
// 21h) Today summary (compact one-liner for dashboards)
// ---------------------------------------------------------------------------

// _isGM and _viewHorizon are kept in the signature for back-compat with the
// caller in commands.ts. They no longer drive behaviour.
export function _planesTodaySummaryHtml(today, _isGM?, _viewTier?, _viewHorizon?){
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return '';
  var cot = 0, rem = 0;
  var next = null;
  for (var i = 0; i < planes.length; i++){
    var ps = getPlanarState(planes[i].name, today);
    if (!ps) continue;
    if (ps.phase === 'coterminous') cot++;
    if (ps.phase === 'remote') rem++;
    if (ps.daysUntilNextPhase != null && ps.nextPhase){
      var d = Math.max(0, ps.daysUntilNextPhase|0);
      if (!next || d < next.days){
        next = { days:d, plane:ps.plane.name, phase:PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase };
      }
    }
  }
  var bits = ['Coterminous '+cot, 'Remote '+rem];
  if (next) bits.push('Next: ' + next.plane + ' ' + next.phase + ' in ' + next.days + 'd');
  return '<div style="font-size:.8em;opacity:.72;margin:2px 0 6px 0;">'+esc(bits.join(' · '))+'</div>';
}

function _planarSummaryLines(today){
  var planes = _getAllPlaneData();
  var notes = [];
  for (var i = 0; i < planes.length; i++){
    if (planes[i].type === 'fixed') continue;
    var ps = getPlanarState(planes[i].name, today);
    if (!ps) continue;
    if (ps.phase === 'coterminous'){
      notes.push((PLANE_PHASE_EMOJI.coterminous || '🟢') + ' <b>' + esc(ps.plane.name) + '</b> is ' + esc(PLANE_PHASE_LABELS.coterminous) + _planarDaySpanTag(ps));
    } else if (ps.phase === 'remote'){
      notes.push((PLANE_PHASE_EMOJI.remote || '🔴') + ' <b>' + esc(ps.plane.name) + '</b> is ' + esc(PLANE_PHASE_LABELS.remote) + _planarDaySpanTag(ps));
    } else if (ps.phase === 'neutral' && ps.daysUntilNextPhase != null && ps.daysUntilNextPhase <= 2 && ps.nextPhase){
      if (ps.nextPhase === 'coterminous'){
        notes.push((PLANE_PHASE_EMOJI.coterminous || '🟢') + ' <b>' + esc(ps.plane.name) + '</b> ' + esc(PLANE_PHASE_LABELS.coterminous) + ' ' + _planarInDaysLabel(ps.daysUntilNextPhase));
      } else if (ps.nextPhase === 'remote'){
        notes.push((PLANE_PHASE_EMOJI.remote || '🔴') + ' <b>' + esc(ps.plane.name) + '</b> ' + esc(PLANE_PHASE_LABELS.remote) + ' ' + _planarInDaysLabel(ps.daysUntilNextPhase));
      }
    }
  }
  return notes;
}

export function planesSummaryHtml(_isGM?, serialOverride?){
  var st = ensureSettings();
  if (st.planesEnabled === false){
    return _menuBox('🌀 Planar Summary',
      '<div style="opacity:.7;">Planar system is disabled.</div>'
    );
  }

  var today = isFinite(serialOverride) ? (serialOverride|0) : todaySerial();
  var lines = _planarSummaryLines(today);
  var planeQueryOpts = _getAllPlaneData().map(function(p){ return p.name; }).join('|');
  var body = '<div style="font-weight:bold;margin:0 0 4px 0;">' + esc(formalDateLabelFromSerial(today)) + '</div>';
  body += _planesTodaySummaryHtml(today);
  if (lines.length){
    body += '<div style="font-size:.85em;line-height:1.6;">' + lines.join('<br>') + '</div>';
  } else {
    body += '<div style="font-size:.82em;opacity:.55;">No active planar phases today.</div>';
  }
  body += '<div style="margin-top:6px;">' +
    button('Full View', 'planes') + ' ' +
    button('Specific Plane', 'planes view ?{Select Plane|' + planeQueryOpts + '}') +
  '</div>';
  return _menuBox('🌀 Planar Summary — ' + esc(formalDateLabelFromSerial(today)), body);
}

// ---------------------------------------------------------------------------
// 21i) Panel HTML
// ---------------------------------------------------------------------------

// Returns an array of HTML parts to send as separate messages.
export function planesPanelHtml(isGM, _revealTier?, serialOverride?){
  var st = ensureSettings();
  if (st.planesEnabled === false){
    return [_menuBox('🌀 Planes',
      '<div style="opacity:.7;">Planar system is disabled.</div>'+
      (isGM ? '<div style="margin-top:4px;font-size:.85em;">Enable: <code>!cal settings planes on</code></div>' : '')
    )];
  }

  var planes = _getAllPlaneData();
  var today  = isFinite(serialOverride) ? (serialOverride|0) : todaySerial();
  var dateLabel = dateLabelFromSerial(today);
  var displayMode = _normalizeDisplayMode(st.planesDisplayMode);
  var rows = [];
  var pr = _monthRangeFromSerial(today);
  var planesMiniEvents = _planesMiniCalEvents(pr.start, pr.end);
  var headerBars = _planesHeaderBars(pr.start, pr.end);
  var planesMiniCal = _renderSyntheticMiniCal('Planar Movement', pr.start, pr.end, planesMiniEvents, headerBars);
  var prevSer = _shiftSerialByMonth(today, -1);
  var nextSer = _shiftSerialByMonth(today, 1);
  var navRow = '<div style="margin:3px 0 6px 0;">'+
    button('Show Previous','planes on '+_serialToDateSpec(prevSer))+' '+
    button('Show Next','planes on '+_serialToDateSpec(nextSer))+
    '</div>';

  for (var i = 0; i < planes.length; i++){
    var ps = getPlanarState(planes[i].name, today);
    if (!ps) continue;

    var emoji = PLANE_PHASE_EMOJI[ps.phase] || '⚪';
    var label = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
    var name  = ps.plane.name;
    var isNotable = (ps.phase === 'coterminous' || ps.phase === 'remote');
    var isFixed   = ps.plane.type === 'fixed';

    // Next transition (GM only, compact)
    var nextTag = '';
    if (isGM && ps.daysUntilNextPhase != null && ps.nextPhase){
      nextTag = ' <span style="opacity:.4;font-size:.8em;">' +
        esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + ' in ' + ps.daysUntilNextPhase + 'd</span>';
    }

    // Fixed planes that aren't notable get skipped — nothing to say.
    if (isFixed && !isNotable) continue;

    // Compact line for neutral planes
    if (!isNotable){
      rows.push(
        '<div style="margin:1px 0;line-height:1.3;font-size:.9em;opacity:.65;">'+
          emoji+' <span style="min-width:78px;display:inline-block;">'+esc(name)+'</span> '+
          esc(label) + nextTag +
        '</div>'
      );
      continue;
    }

    // Notable planes — fuller line
    var durationTag = '';
    if (isNotable){
      var yearDays = _planarYearDays() || 336;
      var dParts = [];
      var dInto = ps.daysIntoPhase || 0;
      var dLeft = ps.daysUntilNextPhase || 0;
      if (dInto > 0){
        if (dInto > yearDays * 2) dParts.push(label.toLowerCase() + ' ~' + Math.round(dInto / yearDays) + ' years ago');
        else if (dInto > 56) dParts.push(label.toLowerCase() + ' ~' + Math.round(dInto / 28) + ' months ago');
        else dParts.push(label.toLowerCase() + ' ' + dInto + ' days ago');
      }
      if (dLeft > 0){
        if (dLeft > yearDays * 2) dParts.push('ending in ~' + Math.round(dLeft / yearDays) + ' years');
        else if (dLeft > 56) dParts.push('ending in ~' + Math.round(dLeft / 28) + ' months');
        else dParts.push('ending in ' + dLeft + ' days');
      }
      if (dParts.length){
        durationTag = ' <span style="font-size:.8em;opacity:.6;">(' + esc(dParts.join(', ')) + ')</span>';
      }
    }

    var effectHtml = '';
    if (ps.phase === 'coterminous' || ps.phase === 'remote'){
      var eff = (ps.plane.effects && ps.plane.effects[ps.phase]) || '';
      if (eff){
        effectHtml = '<div style="font-size:.78em;opacity:.55;margin-left:14px;margin-top:1px;">'+esc(eff)+'</div>';
      }
    }

    var noteHtml = '';
    if (ps.note && isGM){
      noteHtml = '<div style="font-size:.75em;opacity:.45;margin-left:14px;font-style:italic;">'+esc(ps.note)+'</div>';
    }

    rows.push(
      '<div style="margin:3px 0;line-height:1.4;">'+
        emoji+' <b style="min-width:82px;display:inline-block;">'+esc(name)+'</b>'+
        '<span style="opacity:.85;">'+esc(label)+'</span>'+
        durationTag + nextTag +
      '</div>'+
      effectHtml + noteHtml
    );
  }

  // Long Shadows special: when Mabar is coterminous, show which moons are dark
  var longShadowsHtml = '';
  try {
    var mabarState = getPlanarState('Mabar', today);
    if (mabarState && mabarState.phase === 'coterminous'){
      var c = getCal().current;
      var lsMoons = getLongShadowsMoons(c.year);
      if (lsMoons.length > 0){
        var moonNames = [];
        for (var lm = 0; lm < lsMoons.length; lm++) moonNames.push(lsMoons[lm].name);
        longShadowsHtml = '<div style="font-size:.82em;margin-top:4px;padding:4px;'+
          'background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">'+
          '🌑 <b>Long Shadows</b> — Dark moons tonight: <b>'+esc(moonNames.join(', '))+'</b>'+
          '</div>';
      } else {
        longShadowsHtml = '<div style="font-size:.82em;margin-top:4px;padding:4px;'+
          'background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">'+
          '🌑 <b>Long Shadows</b> — Mabar is coterminous. Darkness reigns.'+
          '</div>';
      }
    }
  } catch(e){}

  // GM controls — read-only display only, plus Send-to-Players + plane picker.
  var gmControls = '';
  if (isGM){
    var planeQueryOpts = planes.map(function(p){ return p.name; }).join('|');
    gmControls = '<div style="margin:4px 0;">' +
      button('Send to Players','planes send') +
      '</div>' +
      '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      '<div style="margin:4px 0;">' +
      button('Show Specific Plane', 'planes view ?{Select Plane|' + planeQueryOpts + '}') +
      '</div>' +
      '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      '<div style="margin:4px 0;">' +
      button('Additional Ranges', buildAdditionalRangesCommand('planes ranges', today)) +
      '</div>' +
      '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      '<div style="margin:4px 0;">' +
      button('Toggle Planar System','planes toggle') + ' ' +
      button('📋 Summary','planes summary') +
      '</div>';
    var gmHandoutLinks = [
      handoutButton('Open Planar Handout', 'planar'),
      handoutButton('Planar Mechanics', 'planar:mechanics')
    ].filter(Boolean).join(' ');
    if (gmHandoutLinks){
      gmControls += '<div style="margin:4px 0;">' + gmHandoutLinks + '</div>';
    }
  }

  // Build parts array
  var parts = [];
  if (displayMode !== 'list'){
    var calBody = navRow +
      _planesTodaySummaryHtml(today) +
      planesMiniCal +
      _legendLine(['Cell fill = short event', 'Hatched = remote']) +
      longShadowsHtml;
    parts.push(_menuBox('🌀 Planes — ' + esc(dateLabel), calBody));
  }
  if (displayMode !== 'calendar'){
    var listBody = (displayMode === 'list' ? navRow + _planesTodaySummaryHtml(today) : '') +
      rows.join('') + longShadowsHtml;
    parts.push(_menuBox(displayMode === 'list' ? '🌀 Planes — ' + esc(dateLabel) : '🌀 Planar Phases', listBody));
  }
  if (!parts.length){
    parts.push(_menuBox('🌀 Planes', '<div style="opacity:.7;">No planar display mode selected.</div>'));
  }

  if (gmControls){
    parts.push(_menuBox('🌀 GM Controls',
      gmControls +
      '<div style="margin-top:7px;">'+ button('⬅️ Back','show') +'</div>'
    ));
  } else {
    // Player-facing back-link
    var playerPlaneQueryOpts = planes.map(function(p){ return p.name; }).join('|');
    var playerHandoutLinks = [
      handoutButton('Open Planar Handout', 'planar'),
      handoutButton('Planar Mechanics', 'planar:mechanics')
    ].filter(Boolean).join(' ');
    var playerControls = '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>' +
      '<div style="margin:4px 0;">' + button('Show Specific Plane', 'planes view ?{Select Plane|' + playerPlaneQueryOpts + '}') + '</div>' +
      (playerHandoutLinks ? '<div style="margin:4px 0;">' + playerHandoutLinks + '</div>' : '') +
      '<div style="margin-top:7px;">'+ button('⬅️ Back','show') +'</div>';
    var lastIdx = parts.length - 1;
    parts[lastIdx] = parts[lastIdx].replace(/<\/div>$/, '') + playerControls + '</div>';
  }

  return parts;
}

function _planesRangeHtml(spec, _isGM){
  var months = spec.months || [];
  var calParts = [];

  for (var i = 0; i < months.length; i++){
    var wm = months[i];
    var month = getCal().months[wm.mi] || {};
    var start = toSerial(wm.y, wm.mi, 1);
    var end = toSerial(wm.y, wm.mi, month.days|0);
    var events = _planesMiniCalEvents(start, end);
    var bars = _planesHeaderBars(start, end);
    var miniCal = _renderSyntheticMiniCal(null, start, end, events, bars);
    calParts.push('<div style="display:inline-block;vertical-align:top;margin:4px;overflow:visible;">' + miniCal + '</div>');
  }

  var body = handoutWrap(calParts.join('')) +
    _legendLine(['Cell fill = short event', 'Hatched = remote']);

  return _menuBox('🌀 Planes — ' + esc(spec.title || 'Range'), body);
}

// ---------------------------------------------------------------------------
// 21j) Handout rendering — used by persistent-views.ts
// ---------------------------------------------------------------------------

export function planesHandoutHtml(){
  var st = ensureSettings();
  if (st.planesEnabled === false){
    return _menuBox('🌀 Planes', '<div style="opacity:.7;">Planar tracking is not active.</div>');
  }
  var today = todaySerial();
  var dateLabel = dateLabelFromSerial(today);
  var pr = _monthRangeFromSerial(today);
  var planesMiniEvents = _planesMiniCalEvents(pr.start, pr.end);
  var headerBarsHandout = _planesHeaderBars(pr.start, pr.end);
  var planesMiniCal = _renderSyntheticMiniCal('Planar Movement', pr.start, pr.end, planesMiniEvents, headerBarsHandout);
  var parts = [];
  parts.push(_planesTodaySummaryHtml(today));
  parts.push(planesMiniCal);
  parts.push(_legendLine(['Cell fill = short event', 'Hatched = remote']));
  return _menuBox('🌀 Planes — ' + esc(dateLabel), parts.join(''));
}

function _planeRangeDurationLabel(days){
  var total = Math.max(0, parseInt(days, 10) || 0);
  var yearDays = _planarYearDays() || 336;
  if (total >= yearDays * 2) return Math.round(total / yearDays) + ' years';
  if (total >= 56) return Math.round(total / 28) + ' months';
  return total + ' days';
}

function _planeIndividualMiniCalEvents(planeName, startSerial, endSerial){
  var plane = _getPlaneData(planeName);
  if (!plane) return [];
  var out = [];
  var start = startSerial|0;
  var end = endSerial|0;
  if (end < start){ var tmp = start; start = end; end = tmp; }

  for (var ser = start; ser <= end; ser++){
    var canon = getPlanarState(planeName, ser);
    if (canon && (canon.phase === 'coterminous' || canon.phase === 'remote')){
      out.push({
        serial: ser,
        name: plane.name + ' ' + (PLANE_PHASE_LABELS[canon.phase] || canon.phase),
        color: plane.color || '#607D8B',
        planeFill: true,
        isRemote: canon.phase === 'remote'
      });
    }
  }
  return out;
}

function _planeIndividualHeaderBars(planeName, startSerial, endSerial){
  var plane = _getPlaneData(planeName);
  if (!plane) return [];
  var mid = Math.floor(((startSerial|0) + (endSerial|0)) / 2);
  var canon = getPlanarState(planeName, mid);
  if (!canon || (canon.phase !== 'coterminous' && canon.phase !== 'remote')) return [];
  if ((canon.phaseDuration || 0) <= PLANE_SHORT_EVENT_THRESHOLD) return [];
  return [{
    label: plane.name + ' ' + (PLANE_PHASE_LABELS[canon.phase] || canon.phase),
    color: plane.color || '#607D8B',
    phase: canon.phase,
    tooltip: plane.name + ' ' + (PLANE_PHASE_LABELS[canon.phase] || canon.phase) + ' — ' + _planeRangeDurationLabel(canon.phaseDuration)
  }];
}

export function planeIndividualHandoutHtml(planeName, serialOverride?){
  var st = ensureSettings();
  if (st.planesEnabled === false){
    return _menuBox('🌀 ' + esc(planeName), '<div style="opacity:.7;">Planar tracking is not active.</div>');
  }

  var plane = _getPlaneData(planeName);
  if (!plane){
    return _menuBox('🌀 ' + esc(planeName), '<div style="opacity:.7;">Unknown plane.</div>');
  }

  var today = isFinite(serialOverride) ? (serialOverride|0) : todaySerial();
  var ps = getPlanarState(plane.name, today);
  var phaseLabel = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
  var phaseEmoji = PLANE_PHASE_EMOJI[ps.phase] || '⚪';
  var totalMonths = getCal().months.filter(function(m){ return !m.leapEvery; }).length;
  var followCount = Math.max(0, totalMonths - 2);
  var months = rollingMonthWindow(today, 1, followCount);
  var calParts = [];

  for (var i = 0; i < months.length; i++){
    var wm = months[i];
    var events = _planeIndividualMiniCalEvents(plane.name, wm.start, wm.end);
    var bars = _planeIndividualHeaderBars(plane.name, wm.start, wm.end);
    var miniCal = _renderSyntheticMiniCal(null, wm.start, wm.end, events, bars);
    calParts.push('<div style="display:inline-block;vertical-align:top;margin:4px;overflow:visible;">' + miniCal + '</div>');
  }

  var body = '' +
    '<div style="font-weight:bold;margin:0 0 4px 0;">' + phaseEmoji + ' ' + esc(plane.name) + ' — ' + esc(phaseLabel) + '</div>' +
    '<div style="font-size:.84em;line-height:1.6;margin-bottom:8px;">' +
      (plane.title ? '<b>Title:</b> ' + esc(plane.title) + '<br>' : '') +
      '<b>Current phase:</b> ' + esc(phaseLabel) + '<br>' +
      (ps.daysIntoPhase != null ? '<b>Days into phase:</b> ' + ps.daysIntoPhase + '<br>' : '') +
      (ps.daysUntilNextPhase != null && ps.nextPhase ? '<b>Next transition:</b> ' + esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + ' in ' + ps.daysUntilNextPhase + 'd<br>' : '') +
      (plane.associatedMoon ? '<b>Associated moon:</b> ' + esc(plane.associatedMoon) + '<br>' : '') +
      (plane.orbitYears ? '<b>Orbit:</b> ' + plane.orbitYears + ' years<br>' : '<b>Orbit:</b> Fixed phase<br>') +
      (plane.effects && plane.effects[ps.phase] ? '<b>Effects now:</b> ' + esc(plane.effects[ps.phase]) + '<br>' : '') +
      (plane.note ? '<b>Notes:</b> ' + esc(plane.note) : '') +
    '</div>';

  body += handoutWrap(calParts.join(''));
  body += _legendLine(['Cell fill = canonical active phase', 'Hatched = remote']);

  return _menuBox('🌀 ' + esc(plane.name) + ' — ' + esc(dateLabelFromSerial(today)), body);
}

export function planesMechanicsHandoutHtml(){
  var planes = _getAllPlaneData();
  if (!planes || !planes.length){
    return _menuBox('🌀 Planar Mechanics', '<div style="opacity:.7;">No planar data for this calendar system.</div>');
  }

  var rows = [];
  for (var i = 0; i < planes.length; i++){
    var plane = planes[i];
    rows.push(
      '<tr>' +
        '<td style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;"><b>' + esc(plane.name) + '</b><br><span style="opacity:.65;">' + esc(plane.title || '') + '</span></td>' +
        '<td style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;text-align:center;">' + esc(plane.type === 'fixed' ? 'Fixed' : String(plane.orbitYears || '—')) + '</td>' +
        '<td style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;text-align:center;">' + esc(plane.associatedMoon || '—') + '</td>' +
        '<td style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;">' + esc(plane.note || '') + '</td>' +
      '</tr>'
    );
  }

  var body = '' +
    '<div style="margin-bottom:6px;">This handout summarizes the canonical planar cycle data.</div>' +
    '<table style="width:100%;border-collapse:collapse;font-size:.84em;">' +
      '<tr>' +
        '<th style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;">Plane</th>' +
        '<th style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;">Orbit</th>' +
        '<th style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;">Moon</th>' +
        '<th style="border:1px solid rgba(0,0,0,.12);padding:4px 6px;">Notes</th>' +
      '</tr>' +
      rows.join('') +
    '</table>';
  return _menuBox('🌀 Planar Mechanics', body);
}

function _planesBroadcastSummaryHtml(serialOverride?){
  var today = isFinite(serialOverride) ? (serialOverride|0) : todaySerial();
  var planes = _getAllPlaneData();
  var rows = [];
  for (var i = 0; i < planes.length; i++){
    var ps = getPlanarState(planes[i].name, today);
    if (!ps) continue;
    var label = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
    rows.push(
      '<div style="margin:2px 0;">' +
        (PLANE_PHASE_EMOJI[ps.phase] || '⚪') + ' <b>' + esc(ps.plane.name) + '</b> — ' + esc(label) +
      '</div>'
    );
  }
  return _menuBox('🌀 Planar Almanac — ' + esc(dateLabelFromSerial(today)),
    _planesTodaySummaryHtml(today) +
    rows.join('')
  );
}

function _refreshPlanesHandout(){
  refreshHandout('planes');
}

// ---------------------------------------------------------------------------
// 21k) Command handler (!cal planes ...) — read-only commands
// ---------------------------------------------------------------------------

export function handlePlanesCommand(m, args){
  // args[0]='planes', args[1]=subcommand
  var sub = String(args[1] || '').toLowerCase();
  var isGM = playerIsGM(m.playerid);

  // Temporary compatibility alias.
  if (sub === 'phases') sub = 'summary';

  if (sub === 'summary'){
    return whisper(m.who, planesSummaryHtml(isGM));
  }

  if (!sub || sub === 'show'){
    return whisperParts(m.who, planesPanelHtml(isGM));
  }

  // !cal planes on <dateSpec>  — inspect planar states on a specific day
  if (sub === 'on' || sub === 'date'){
    var dateToks = args.slice(2).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
    var pref = parseDatePrefixForAdd(dateToks);
    if (!pref){
      return whisper(m.who, 'Usage: <code>!cal planes on &lt;dateSpec&gt;</code>');
    }
    var serialOn = toSerial(pref.year, pref.mHuman - 1, pref.day);
    return whisperParts(m.who, planesPanelHtml(isGM, null, serialOn));
  }

  // !cal planes view <PlaneName> — single-plane detail (player- and GM-safe)
  if (sub === 'view'){
    var viewNameRaw = String(args[2] || '').trim();
    var allPlanes = _getAllPlaneData();
    if (!viewNameRaw){
      var viewQueryOpts = allPlanes.map(function(p){ return p.name; }).join('|');
      return whisper(m.who, _menuBox('🌀 Plane Detail',
        '<div style="margin-bottom:4px;">'+button('Show Specific Plane', 'planes view ?{Select Plane|' + viewQueryOpts + '}')+'</div>'
      ));
    }
    var viewPlane = _getPlaneData(viewNameRaw);
    if (!viewPlane) return whisper(m.who, 'Unknown plane: <b>'+esc(viewNameRaw)+'</b>. Try <code>!cal planes view</code> for a list.');

    var viewToday = todaySerial();
    var viewPs = getPlanarState(viewPlane.name, viewToday);
    var viewEmoji = PLANE_PHASE_EMOJI[viewPs.phase] || '⚪';
    var viewLabel = PLANE_PHASE_LABELS[viewPs.phase] || viewPs.phase;

    var viewHtml = '<div style="margin:4px 0;">';
    viewHtml += '<div style="margin:3px 0;font-size:1.05em;">'+viewEmoji+' Currently: <b>'+esc(viewLabel)+'</b></div>';
    if (viewPs.daysUntilNextPhase != null && viewPs.nextPhase){
      viewHtml += '<div style="margin:2px 0;font-size:.88em;opacity:.7;">Next: '+
        esc(PLANE_PHASE_LABELS[viewPs.nextPhase] || viewPs.nextPhase)+' in '+viewPs.daysUntilNextPhase+'d</div>';
    }
    if (viewPlane.effects && viewPlane.effects[viewPs.phase]){
      viewHtml += '<div style="margin:4px 0;font-size:.85em;padding:3px 6px;background:rgba(255,255,255,.06);border-radius:3px;">'+
        '<b>Effects:</b> '+esc(viewPlane.effects[viewPs.phase])+'</div>';
    }
    if (viewPlane.title){
      viewHtml += '<div style="margin:3px 0;font-size:.85em;opacity:.6;font-style:italic;">'+esc(viewPlane.title)+'</div>';
    }
    if (viewPlane.associatedMoon){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;opacity:.55;">Associated moon: <b>'+esc(viewPlane.associatedMoon)+'</b></div>';
    }
    if (viewPlane.type === 'cyclic' && viewPlane.orbitYears){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;opacity:.55;">Orbit: '+viewPlane.orbitYears+' years</div>';
    } else if (viewPlane.type === 'fixed'){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;opacity:.55;">Fixed phase (no natural orbit)</div>';
    }
    if (isGM && viewPlane.note){
      viewHtml += '<div style="margin:4px 0;font-size:.78em;opacity:.45;font-style:italic;">'+esc(viewPlane.note)+'</div>';
    }
    viewHtml += '</div>';

    return whisper(m.who, _menuBox('🌀 '+esc(viewPlane.name), viewHtml));
  }

  // Player commands stop here. The remaining subcommands are GM-only.
  if (!isGM){
    return whisper(m.who,
      'Planes: <code>!cal planes</code> &nbsp;·&nbsp; '+
      '<code>!cal planes on &lt;dateSpec&gt;</code>'
    );
  }

  if (sub === 'toggle'){
    var st = ensureSettings();
    st.planesEnabled = (st.planesEnabled === false);
    st._planesAutoToggle = false;
    _refreshPlanesHandout();
    return whisperParts(m.who, planesPanelHtml(true));
  }

  // !cal planes send — broadcast a non-interactive almanac to players
  if (sub === 'send'){
    sendToAll(_planesBroadcastSummaryHtml());
    _refreshPlanesHandout();
    warnGM('Sent planar almanac to players.');
    return whisperParts(m.who, planesPanelHtml(true));
  }

  // !cal planes ranges <rangeArgs>  — Additional Ranges
  if (sub === 'ranges'){
    var rangeArgs = args.slice(2);
    return _deliverAdditionalCalendarRange({
      who: m.who,
      args: rangeArgs,
      dest: 'whisper',
      render: function(spec){ return _planesRangeHtml(spec, true); }
    });
  }

  // !cal planes reveal <rangeSpec>  — Reveal Custom Range
  if (sub === 'reveal'){
    var revealArgs = args.slice(2);
    return _deliverTopLevelCalendarRange({ who: m.who, args: revealArgs, dest: 'whisper' });
  }

  whisper(m.who,
    'Planes: <code>!cal planes</code> &nbsp;·&nbsp; '+
    '<code>!cal planes summary</code> &nbsp;·&nbsp; '+
    '<code>!cal planes view &lt;name&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal planes on &lt;dateSpec&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal planes ranges &lt;rangeSpec&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal planes send</code> &nbsp;·&nbsp; '+
    '<code>!cal planes toggle</code>'
  );
}
