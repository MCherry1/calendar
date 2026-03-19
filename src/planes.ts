// Section 21: Planar System
import { state_name } from './constants.js';
import { ensureSettings, getCal, titleCase } from './state.js';
import { fromSerial, toSerial, todaySerial } from './date-math.js';
import { _monthRangeFromSerial, _renderSyntheticMiniCal, button, esc } from './rendering.js';
import { _displayModeLabel, _displayMonthDayParts, _legendLine, _menuBox, _nextDisplayMode, _normalizeDisplayMode, _serialToDateSpec, _shiftSerialByMonth, _subsystemIsVerbose, dateLabelFromSerial, parseDatePrefixForAdd } from './ui.js';
import { send, sendToAll, warnGM, whisper, whisperParts } from './commands.js';
import { PLANAR_GENERATED_EVENT_PROFILE, _dN, _generatedEventAt, _generatedPhase, _nextGeneratedForecast, _rangeLabel, getLongShadowsMoons, isGeneratedShift } from './moon.js';


/* ============================================================================
 * 21) PLANAR SYSTEM
 * ============================================================================
 * Each plane orbits the Material in a cycle: coterminous → neutral → remote →
 * neutral → coterminous. Planes snap between active states with no gradual
 * transition. The system calculates current phase from anchor dates and cycle
 * parameters, provides a public API for cross-system hooks, and offers
 * GM/player panels parallel to the moon system.
 * ==========================================================================*/

// ---------------------------------------------------------------------------
// 21a) Planar data — cycle definitions for Eberron's 13 planes
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
      seedAnchor: true,
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
      seedAnchor: true,
      associatedMoon: 'Aryth',
      note: 'Slow canonical cycle: coterminous for 1 year once per century; 50 years later, remote for 1 year. Shorter off-cycle shifts are tied to Aryth full/new moons through the moontied generator.',
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
      seedAnchor: true,
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
      seedAnchor: true,
      floatingStartDay: { min: 1, max: 19 },
      seasonHint: 'spring',
      associatedMoon: 'Barrakas',
      note: 'Coterminous for 10 days in Eyre and remote for 10 days in Sypheros, once every 3 years. The remote cycle comes 1.5 years after coterminous. The start day within the month varies between occurrences.',
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
      note: 'Coterminous for a week centered on the summer solstice (Nymm 24\u2013Lharvion 2) and remote for a week centered on the winter solstice (Vult 24\u2013Zarantyr 2). Both occur every year.',
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
      seedAnchor: true,
      seasonHint: 'winter solstice',
      associatedMoon: 'Sypheros',
      remoteOrbitYears: 5, remoteDaysSpecial: 5, remoteSeasonHint: 'summer solstice',
      note: 'Long Shadows: coterminous for 3 days around the winter solstice (Vult 26\u201328), every year. Remote for 5 days around the summer solstice (Nymm 25\u2013Lharvion 1), once every 5 years.',
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
      seedAnchor: true, linkedTo: 'Fernia',
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
      seedAnchor: true,
      associatedMoon: 'Vult',
      note: 'Traditional cycle: coterminous for 1 year every 36 years and remote for 1 year every 36 years. It also frequently has single-day coterminous spikes; remote periods suppress these spikes.',
      effects: {
        coterminous: 'People are quick to anger: trivial disputes can become brawls, and restless thought can lead to riots or revolution. War Magic and Unquenchable Fury spread worldwide; intense violence in Shavaran manifest zones can draw in whirling blades.',
        remote: 'Prevents the occasional single-day coterminous spikes; otherwise has no apparent effect on the Material Plane.'
      }
    },
    { name:'Syrania',   title:'The Azure Sky',
      color: '#64B5F6',
      type:'cyclic',
      orbitYears: 10,    coterminousDays: 1, remoteDays: 1,
      coterminousYears: null, remoteYears: null,
      anchorYear: 998, anchorPhase: 'coterminous', anchorMonth: 9, anchorDay: 9,
      seedAnchor: true,
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
      seedAnchor: true,
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
// 21b) State management
// ---------------------------------------------------------------------------

export function getPlanesState(){
  var root = state[state_name];
  var baselineHorizon = _planarYearDays();
  if (!root.planes) root.planes = {
    overrides: {},    // planeName -> { phase:'coterminous'|'remote'|'neutral', note:'' }
    anchors: {},      // planeName -> { year, month, day, phase } — GM-set anchor overrides
    revealTier: 'medium', // 'low' | 'medium' | 'high'
    revealHorizonDays: baselineHorizon   // player-known horizon window
  };
  var ps = root.planes;
  if (!ps.overrides) ps.overrides = {};
  if (!ps.anchors) ps.anchors = {};
  if (!ps.floatingDays) ps.floatingDays = {};  // planeName -> { phase, startDay, orbitNum }
  if (!ps.suppressedEvents) ps.suppressedEvents = {}; // planeName -> { serial: true }
  if (!ps.gmCustomEvents) ps.gmCustomEvents = {};     // planeName -> [ {serial, phase, durationDays, note} ]
  if (!ps.seedOverrides) ps.seedOverrides = {};       // planeName -> anchorYear
  if (!ps.revealTier) ps.revealTier = 'medium';
  ps.revealTier = String(ps.revealTier || '').toLowerCase();
  if (!PLANE_REVEAL_TIERS[ps.revealTier]) ps.revealTier = 'medium';
  ps.revealHorizonDays = parseInt(ps.revealHorizonDays, 10);
  if (!isFinite(ps.revealHorizonDays) || ps.revealHorizonDays < baselineHorizon) ps.revealHorizonDays = baselineHorizon;
  return ps;
}

// ---------------------------------------------------------------------------
// 21c) Phase calculation engine
// ---------------------------------------------------------------------------

// Get the plane definition by name (case-insensitive).
export function _getPlaneData(name){
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return null;
  var lc = name.toLowerCase();
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

export function _planeHasNonAnnualTraditionalCycle(plane){
  if (!plane || plane.type !== 'cyclic') return false;
  var orbitYears = parseInt(plane.orbitYears, 10) || 1;
  var remoteOrbitYears = parseInt(plane.remoteOrbitYears, 10) || 0;
  return (orbitYears > 1) || (remoteOrbitYears > 1);
}

export function _planeTraditionalAnchorMode(plane, ps){
  if (!_planeHasNonAnnualTraditionalCycle(plane)) return null;
  ps = ps || getPlanesState();
  var hasDirectAnchor = !!(ps.anchors && ps.anchors[plane.name]);
  var hasSeedAnchor = !!(plane.seedAnchor && ps.seedOverrides && ps.seedOverrides[plane.name] != null);
  return (hasDirectAnchor || hasSeedAnchor) ? 'gm-anchored' : 'random-seed';
}

// Calculate the current phase of a cyclic plane at a given serial day.
// opts.ignoreGenerated=true returns canonical cycle state without seeded flickers.
// Returns { phase, daysIntoPhase, daysUntilNextPhase, phaseDuration, nextPhase }
export function getPlanarState(planeName, serial, opts?){
  opts = opts || {};
  var ignoreGenerated = !!opts.ignoreGenerated;
  var plane = _getPlaneData(planeName);
  if (!plane) return null;

  // Check for GM override first
  var ps = getPlanesState();
  var override = ps.overrides[plane.name];
  if (override){
    if (override.durationDays && override.setOn != null){
      var today = todaySerial();
      if (today >= override.setOn + override.durationDays){
        delete ps.overrides[plane.name];
        override = null;
      }
    }
  }
  if (override){
    var overrideStart = (override.setOn != null) ? parseInt(override.setOn, 10) : todaySerial();
    var overrideEnd = (override.durationDays && override.setOn != null)
      ? (overrideStart + parseInt(override.durationDays, 10))
      : null;
    var overrideActive = serial >= overrideStart && (overrideEnd == null || serial < overrideEnd);
    if (overrideActive){
      return {
        plane: plane,
        phase: override.phase || 'neutral',
        daysIntoPhase: null,
        daysUntilNextPhase: overrideEnd != null
          ? Math.max(0, overrideEnd - serial)
          : null,
        phaseDuration: override.durationDays || null,
        nextPhase: null,
        overridden: true,
        sourceLabel: 'gm-defined',
        traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
      };
    }
  }
  // Fixed planes (Dal Quor, Xoriat, Kythri)
  if (plane.type === 'fixed'){
    var fixedPhase = plane.fixedPhase || 'remote';
    var fixedNote = plane.note || '';
    var fixedIsGenerated = false;

    // Check for off-cycle generated shift
    if (!ignoreGenerated && isGeneratedShift(plane.name, serial)){
      fixedIsGenerated = true;
      fixedPhase = _generatedPhase(plane.name, serial);
      fixedNote = 'Generated ' + fixedPhase + ' shift';
    }

    return {
      plane: plane,
      phase: fixedPhase,
      daysIntoPhase: null,
      daysUntilNextPhase: null,
      phaseDuration: null,
      nextPhase: null,
      overridden: false,
      note: fixedNote,
      sourceLabel: fixedIsGenerated ? 'generated' : 'traditional',
      traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
    };
  }

  // Cyclic planes — calculate from anchor
  var ypd = _planarYearDays();

  // Resolve durations in days
  var coterminousDays = plane.coterminousDays || ((plane.coterminousYears || 0) * ypd);
  var remoteDays      = plane.remoteDays      || ((plane.remoteYears || 0)      * ypd);
  var orbitDays       = (plane.orbitYears || 1) * ypd;
  var transitionDays  = (orbitDays - coterminousDays - remoteDays) / 2;
  if (transitionDays < 1) transitionDays = 1;

  // Phase order: coterminous → neutral → remote → neutral → (repeat)
  // No waxing/waning — planes snap between states.
  var phases = [
    { name:'coterminous', dur: coterminousDays },
    { name:'neutral',     dur: transitionDays },
    { name:'remote',      dur: remoteDays },
    { name:'neutral',     dur: transitionDays }
  ];

  // Anchor: use GM override anchor, then plane default, then seed-based offset
  var anchor = ps.anchors[plane.name];
  var anchorSerial;
  if (anchor){
    anchorSerial = toSerial(anchor.year, anchor.month || 0, anchor.day || 1);
  } else {
    var anchorMi = (plane.anchorMonth != null) ? (plane.anchorMonth - 1) : 0;
    var anchorDay = (plane.anchorDay != null) ? (plane.anchorDay | 0) : 1;
    if (anchorDay < 1) anchorDay = 1;
    anchorSerial = toSerial(plane.anchorYear || 998, anchorMi, anchorDay);
    // For planes flagged seedAnchor, offset the anchor by a seed-derived amount.
    // This gives each campaign different timing for long-cycle planes.
    // GM can override with !cal planes seed <name> <year> to pin a specific anchor year.
    // linkedTo: derive seed from the linked plane's name (keeps pairs in sync).
    // If anchorMonth is set (seasonal plane), offset by whole years to preserve season.
    if (plane.seedAnchor){
      try {
        var ps2 = getPlanesState();
        var seedOverride = (ps2.seedOverrides && ps2.seedOverrides[plane.name]);
        if (seedOverride != null){
          // GM-pinned anchor year: replace the base anchor year entirely
          anchorSerial = toSerial(seedOverride, anchorMi, anchorDay);
        } else {
          var epoch = ensureSettings().epochSeed || 0;
          var seedName = plane.linkedTo || plane.name;
          if (plane.anchorMonth != null){
            var yearOff = _dN(epoch, seedName + '_anchor_offset', plane.orbitYears || 1) - 1;
            anchorSerial += yearOff * ypd;
          } else {
            var seedOffset = _dN(epoch, seedName + '_anchor_offset', orbitDays);
            anchorSerial += seedOffset;
          }
        }
      } catch(e){}
    }

    // floatingStartDay planes: the start day within the month drifts between
    // occurrences. Handled after the standard phase walk — see below.
  }

  // Find which phase the anchor starts in
  var anchorPhaseIdx = 0;
  var anchorPhaseName = (anchor && anchor.phase) || plane.anchorPhase || 'coterminous';
  for (var p = 0; p < phases.length; p++){
    if (phases[p].name === anchorPhaseName){ anchorPhaseIdx = p; break; }
  }

  // Compute offset from anchor into the cycle
  var daysSinceAnchor = serial - anchorSerial;
  // Normalize into the cycle — handle negative offsets (dates before anchor)
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
      var cyclicNote = '';

      // Off-cycle generated shift: can override neutral to coterminous/remote
      // Only triggers during neutral phases (not when already coterminous/remote)
      if (!ignoreGenerated &&
          cyclicPhase === 'neutral' &&
          isGeneratedShift(plane.name, serial)){
        var genPhase = _generatedPhase(plane.name, serial);
        cyclicNote = 'Generated ' + genPhase + ' shift';
        cyclicPhase = genPhase;
      }

      // ── Mabar special case: annual cot + 5-year remote cycle ──
      // Mabar is coterminous every year (Long Shadows) but remote only once
      // every 5 years around the summer solstice. The standard cyclic calc gives
      // us the annual cot; we override neutral based on the remote cycle.
      if (plane.remoteOrbitYears && plane.remoteDaysSpecial){
        var remoteDur = plane.remoteDaysSpecial;
        // Summer solstice = Nymm 27 (month 6, day 27) — opposite winter solstice Vult 27
        var _solstice = 5 * 28 + 26; // month index 5 (Nymm), day 27 (0-based: 26)
        var _di = fromSerial(serial);
        var _yearStart = toSerial(_di.year, 0, 1);
        var _dayOfYear = serial - _yearStart;

        // Determine remote years using the same seed-based anchor offset
        var _remoteBaseYear = (plane.anchorYear || 998) + 1;
        if (plane.seedAnchor){
          try {
            var _seedOverrideYear = (ps.seedOverrides && ps.seedOverrides[plane.name]);
            if (_seedOverrideYear != null){
              _remoteBaseYear = (parseInt(_seedOverrideYear, 10) || (plane.anchorYear || 998)) + 1;
            } else {
              var _ep = ensureSettings().epochSeed || 0;
              var _sn = plane.linkedTo || plane.name;
              // Use the same seed as the primary anchor, but for the remote sub-cycle.
              // Offset by 0 to (remoteOrbitYears-1) whole years.
              var _rOff = _dN(_ep, _sn + '_remote_anchor_offset', plane.remoteOrbitYears) - 1;
              _remoteBaseYear += _rOff;
            }
          } catch(e2){}
        }
        var _remoteYearsSince = _di.year - _remoteBaseYear;
        var _isRemoteYear = (_remoteYearsSince >= 0 && (_remoteYearsSince % plane.remoteOrbitYears) === 0);
        var _remoteStart = _solstice - Math.floor(remoteDur / 2);
        var _remoteEnd   = _remoteStart + remoteDur - 1;

        // If currently in the remote window of a remote year, return remote phase
        if (cyclicPhase !== 'coterminous' && _isRemoteYear &&
            _dayOfYear >= _remoteStart && _dayOfYear <= _remoteEnd){
          return {
            plane: plane,
            phase: 'remote',
            daysIntoPhase: _dayOfYear - _remoteStart,
            daysUntilNextPhase: _remoteEnd - _dayOfYear + 1,
            phaseDuration: remoteDur,
            nextPhase: 'neutral',
            overridden: false,
            sourceLabel: 'traditional',
            traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
          };
        }

        // Neutral periods stay neutral (no waxing/waning distinction).
      }

      // ── Floating start day: drift within the month per occurrence ──
      // For planes like Irian where the start day shifts between occurrences.
      // We store the next phase's start day in ps.floatingDays[planeName].
      // The standard calc used anchorDay as the fixed start; we adjust here.
      if (plane.floatingStartDay && !anchor){
        var _fMin = plane.floatingStartDay.min || 1;
        var _fMax = plane.floatingStartDay.max || 19;
        var _fRange = _fMax - _fMin + 1;
        var _daysSinceAnch = serial - anchorSerial;
        var _orbitNum = Math.floor(_daysSinceAnch / orbitDays);
        if (_daysSinceAnch < 0) _orbitNum -= 1;

        // Determine stored start day for this orbit's coterminous
        // and for this orbit's remote (half-orbit later).
        // Use seed + orbit number to generate deterministically.
        var _fKey = plane.name;
        if (!ps.floatingDays[_fKey]) ps.floatingDays[_fKey] = {};
        var _fd = ps.floatingDays[_fKey];

        // Generate start days for this orbit if not yet stored
        var _cotKey = 'cot_' + _orbitNum;
        var _remKey = 'rem_' + _orbitNum;
        try {
          var _fEp = ensureSettings().epochSeed || 0;
          if (_fd[_cotKey] == null){
            // d20 reroll 20s: roll d20, if 20, roll again (effectively d19 + uniform)
            var _roll = _dN(_fEp, plane.name + '_float_cot_' + _orbitNum, 20);
            if (_roll >= 20) _roll = _dN(_fEp, plane.name + '_float_cot_' + _orbitNum + '_reroll', 19);
            _fd[_cotKey] = _fMin + ((_roll - 1) % _fRange);
          }
          if (_fd[_remKey] == null){
            var _rRoll = _dN(_fEp, plane.name + '_float_rem_' + _orbitNum, 20);
            if (_rRoll >= 20) _rRoll = _dN(_fEp, plane.name + '_float_rem_' + _orbitNum + '_reroll', 19);
            _fd[_remKey] = _fMin + ((_rRoll - 1) % _fRange);
          }
        } catch(e3){}

        // Compute drift: how many days the actual start shifts from the anchor day
        var _baseDay = (plane.anchorDay != null) ? plane.anchorDay : 1;
        var _cotDrift = ((_fd[_cotKey] || _baseDay) - _baseDay);
        var _remDrift = ((_fd[_remKey] || _baseDay) - _baseDay);

        // Which half of the orbit are we in?
        // First half = coterminous + neutral; second half = remote + neutral
        var _halfOrbit = orbitDays / 2;
        var _offsetInOrbit = _daysSinceAnch - (_orbitNum * orbitDays);
        if (_offsetInOrbit < 0) _offsetInOrbit += orbitDays;

        if (_offsetInOrbit < _halfOrbit){
          // First half: cot then neutral
          var _cotStart = _cotDrift; // offset within orbit where cot begins
          if (_cotStart < 0) _cotStart = 0;
          var _cotEnd = _cotStart + coterminousDays;
          if (_offsetInOrbit >= _cotStart && _offsetInOrbit < _cotEnd){
            cyclicPhase = 'coterminous';
            into = _offsetInOrbit - _cotStart;
          } else {
            cyclicPhase = 'neutral';
            into = _offsetInOrbit < _cotStart ? _offsetInOrbit : _offsetInOrbit - _cotEnd;
          }
        } else {
          // Second half: remote then neutral
          var _remStart = _halfOrbit + _remDrift;
          var _remEnd = _remStart + remoteDays;
          if (_offsetInOrbit >= _remStart && _offsetInOrbit < _remEnd){
            cyclicPhase = 'remote';
            into = _offsetInOrbit - _remStart;
          } else {
            cyclicPhase = 'neutral';
            into = _offsetInOrbit < _remStart ? _offsetInOrbit - _halfOrbit : _offsetInOrbit - _remEnd;
          }
        }
      }

      return {
        plane: plane,
        phase: cyclicPhase,
        daysIntoPhase: Math.floor(into),
        daysUntilNextPhase: Math.ceil(ph.dur - into),
        phaseDuration: Math.floor(ph.dur),
        nextPhase: phases[nextIdx].name,
        overridden: false,
        note: cyclicNote || '',
        sourceLabel: _isGeneratedNote(cyclicNote) ? 'generated' : 'traditional',
        traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
      };
    }
    accumulated += ph.dur;
  }

  // Shouldn't reach here, but fallback
  return {
    plane: plane,
    phase: 'neutral',
    daysIntoPhase: 0,
    daysUntilNextPhase: 0,
    phaseDuration: 0,
    nextPhase: 'neutral',
    overridden: false,
    note: '',
    sourceLabel: 'traditional',
    traditionalAnchorMode: _planeTraditionalAnchorMode(plane, ps)
  };
}

// Public API: Get all active planar effects for a given day.
// Returns array of { plane, phase, effect } for planes that are coterminous or remote.
export function getActivePlanarEffects(serial){
  var planes = _getAllPlaneData();
  var effects = [];
  for (var i = 0; i < planes.length; i++){
    var ps = getPlanarState(planes[i].name, serial);
    if (!ps) continue;
    if (ps.phase === 'coterminous' || ps.phase === 'remote'){
      var eff = (ps.plane.effects && ps.plane.effects[ps.phase]) || null;
      effects.push({
        plane: ps.plane.name,
        title: ps.plane.title,
        phase: ps.phase,
        effect: eff,
        state: ps
      });
    }
  }
  return effects;
}

// ---------------------------------------------------------------------------
// 21d) Notable planes for !cal default view
// ---------------------------------------------------------------------------

// Returns array of HTML strings for planes worth mentioning today.
// Criteria: currently coterminous/remote, or transitioning within 3 days.
// Excludes: fixed planes (always the same), and phases longer than 1 year (too routine to note daily).
export function _planarNotableToday(serial){
  var planes = _getAllPlaneData();
  var notes  = [];
  var ypd    = _planarYearDays();

  for (var i = 0; i < planes.length; i++){
    // Skip fixed planes — they never change, no point showing them daily
    if (planes[i].type === 'fixed') continue;

    var ps = getPlanarState(planes[i].name, serial);
    if (!ps) continue;

    // Skip phases longer than 1 year — they're too long to be "news"
    if (ps.phaseDuration != null && ps.phaseDuration > ypd) continue;

    var name = ps.plane.name;

    if (ps.phase === 'coterminous'){
      var remaining = ps.daysUntilNextPhase;
      var tag = (remaining != null && remaining <= 3)
        ? ' <span style="opacity:.6;">('+remaining+'d left)</span>'
        : '';
      notes.push('\uD83D\uDD34 <b>'+esc(name)+'</b> coterminous'+tag);
    }
    else if (ps.phase === 'remote'){
      var remRem = ps.daysUntilNextPhase;
      var remTag = (remRem != null && remRem <= 3)
        ? ' <span style="opacity:.6;">('+remRem+'d left)</span>'
        : '';
      notes.push('\uD83D\uDD35 <b>'+esc(name)+'</b> remote'+remTag);
    }
    // Neutral phases with imminent transition: hint at what's coming
    else if (ps.phase === 'neutral' && ps.daysUntilNextPhase != null && ps.daysUntilNextPhase <= 3 && ps.nextPhase){
      if (ps.nextPhase === 'coterminous')
        notes.push('\uD83D\uDD34 <b>'+esc(name)+'</b> coterminous in '+ps.daysUntilNextPhase+'d');
      else if (ps.nextPhase === 'remote')
        notes.push('\uD83D\uDD35 <b>'+esc(name)+'</b> remote in '+ps.daysUntilNextPhase+'d');
    }
  }

  return notes;
}

// ---------------------------------------------------------------------------
// 21e) Phase emoji and label helpers
// ---------------------------------------------------------------------------

export var PLANE_PHASE_EMOJI = {
  coterminous: '\uD83D\uDFE2',  // 🟢
  remote:      '\uD83D\uDD34',  // 🔴
  neutral:     '\u26AA'          // ⚪
};

export var PLANE_PHASE_LABELS = {
  coterminous: 'Coterminous',
  remote:      'Remote',
  neutral:     'Neutral'
};

export var PLANE_REVEAL_TIERS = { low:1, medium:2, high:3 };
export var PLANE_SOURCE_LABELS = {
  low:      'Common Knowledge',
  medium:   'Skilled Forecast',
  high:     'Expert Forecast'
};
export var PLANE_PREDICTION_LIMITS = {
  // Low: present day only for generated events. Fixed annual canon always known.
  lowDays: 0,
  // Medium: canon events for current year (336 days). Generated events by button.
  mediumCanonDays: 336,
  mediumMaxDays: 3360,   // up to 10 years for generated
  // High: full knowledge including generated events.
  highMaxDays: 3360,
  // Within this range, high-tier flicker predictions are exact.
  highExactDays: 336
};
export var PLANE_GENERATED_LOOKAHEAD = {
  gmDays: 1680   // 5 years at 336 days/year
};

// Medium presets now match the moon workflow: canon remains freely known for
// the current year, while generated events are revealed in month-scale chunks.
export var PLANE_MEDIUM_PRESETS = [
  { label:'1m',  days:28,  dc:'DC 10', token:'1m' },
  { label:'3m',  days:84,  dc:'DC 15', token:'3m' },
  { label:'6m',  days:168, dc:'DC 20', token:'6m' },
  { label:'10m', days:280, dc:'DC 25', token:'10m' }
];
// High presets: full knowledge (canon + generated) for N months.
export var PLANE_HIGH_PRESETS = [
  { label:'1m',  days:28,  dc:'DC 10', token:'1m' },
  { label:'3m',  days:84,  dc:'DC 15', token:'3m' },
  { label:'6m',  days:168, dc:'DC 20', token:'6m' },
  { label:'10m', days:280, dc:'DC 25', token:'10m' }
];

export var PLANE_REVEAL_RANGE_OPTIONS = {
  '1d': 1, '3d': 3, '6d': 6, '10d': 10,
  '1w': 7, '2w': 14, '4w': 28,
  '1m': 28, '3m': 84, '6m': 168, '10m': 280,
  // Legacy year-based options (converted to days)
  '1y': 336, '3y': 1008, '6y': 2016, '10y': 3360
};

export function _normalizePlaneRevealTier(tier){
  var t = String(tier || '').toLowerCase();
  if (PLANE_REVEAL_TIERS[t]) return t;
  return 'medium';
}

export function _parsePlaneRevealRange(token, tier){
  tier = _normalizePlaneRevealTier(tier);
  var maxAllowed = (tier === 'high') ? PLANE_PREDICTION_LIMITS.highMaxDays
    : PLANE_PREDICTION_LIMITS.mediumMaxDays;
  var t = String(token || '').toLowerCase().trim();

  // Default if no token given
  if (!t) return Math.min(maxAllowed, 28);  // 1 month default

  // Named range options (now in days)
  if (PLANE_REVEAL_RANGE_OPTIONS[t]) return Math.min(maxAllowed, PLANE_REVEAL_RANGE_OPTIONS[t]);

  // Day suffix: "28d"
  var dayMatch = t.match(/^(\d+)d$/);
  if (dayMatch) return Math.min(maxAllowed, parseInt(dayMatch[1], 10));

  // Week suffix: "4w"
  var weekMatch = t.match(/^(\d+)w$/);
  if (weekMatch) return Math.min(maxAllowed, parseInt(weekMatch[1], 10) * 7);

  // Plain number = days
  if (/^\d+$/.test(t)){
    var n = parseInt(t, 10);
    if (isFinite(n) && n >= 1) return Math.min(maxAllowed, n);
  }

  return null;
}

export function _planeRangeLabel(days){
  var ypd = Math.max(1, _planarYearDays());
  days = parseInt(days, 10) || 0;
  if (days === ypd) return '1 year';
  if (days === ypd * 3) return '3 years';
  if (days === ypd * 6) return '6 years';
  if (days === ypd * 10) return '10 years';
  if (days % ypd === 0) return (days / ypd) + ' years';
  return _rangeLabel(days);
}



export function _planePredictionWindowDays(plane, daysAhead, tier){
  tier = _normalizePlaneRevealTier(tier);
  daysAhead = Math.max(0, daysAhead | 0);

  var base = 0;
  if (plane && plane.type === 'fixed'){
    if (plane.name === 'Kythri') base += 24;
    else if (plane.name === 'Xoriat') base += 36;
    else base += 12;
  }

  var profile = PLANAR_GENERATED_EVENT_PROFILE[(plane && plane.name) || ''] || PLANAR_GENERATED_EVENT_PROFILE.__default || { triggerDie:100, confirmDie:20 };
  var dailyChance = 1 / ((profile.triggerDie || 100) * (profile.confirmDie || 20));
  base += Math.max(1, Math.ceil(dailyChance * 336 * 3));

  if (plane && /disrupted|generated|no one knows|unpredictable/i.test(String(plane.note || ''))){
    base += (tier === 'high') ? 3 : 8;
  }

  if (tier === 'high'){
    if (daysAhead <= PLANE_PREDICTION_LIMITS.highExactDays) return 0;
    return Math.max(1, base + Math.floor((daysAhead - PLANE_PREDICTION_LIMITS.highExactDays) / 336));
  }

  return Math.max(2, base + Math.floor(daysAhead / 168));
}

export function _nextCanonicalPhaseStart(planeName, serial, targetPhase, horizonDays){
  var cap = Math.max(1, horizonDays|0);
  var prev = getPlanarState(planeName, serial, { ignoreGenerated: true });
  if (!prev) return null;
  for (var s = serial + 1; s <= serial + cap; s++){
    var cur = getPlanarState(planeName, s, { ignoreGenerated: true });
    if (!cur){ prev = cur; continue; }
    if (cur.phase === targetPhase && prev.phase !== targetPhase){
      return { serial: s, daysUntil: s - serial, state: cur };
    }
    prev = cur;
  }
  return null;
}

export function _canonicalPhaseKnowledgeSummary(planeName, serial, horizonDays){
  var h = Math.max(1, horizonDays|0);
  var now = getPlanarState(planeName, serial, { ignoreGenerated: true });
  if (!now) return '';

  var c = _nextCanonicalPhaseStart(planeName, serial, 'coterminous', h);
  var r = _nextCanonicalPhaseStart(planeName, serial, 'remote', h);

  var cTxt = (now.phase === 'coterminous') ? 'now'
    : (c ? ('in ' + c.daysUntil + 'd') : ('beyond ' + _planeRangeLabel(h)));
  var rTxt = (now.phase === 'remote') ? 'now'
    : (r ? ('in ' + r.daysUntil + 'd') : ('beyond ' + _planeRangeLabel(h)));

  return 'Cycle: C ' + cTxt + ' \u00B7 R ' + rTxt;
}

export function _planesMiniCalEvents(startSerial, endSerial, generatedCutoffSerial?){
  var out = [];
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return out;

  var start = startSerial|0;
  var end = endSerial|0;
  if (end < start){ var t = start; start = end; end = t; }
  var prevCanon = {};
  var prevGen = {};

  for (var i = 0; i < planes.length; i++){
    var pname = planes[i].name;
    prevCanon[pname] = getPlanarState(pname, start - 1, { ignoreGenerated: true });
    if (generatedCutoffSerial != null && (start - 1) <= generatedCutoffSerial){
      var prevActual = getPlanarState(pname, start - 1);
      prevGen[pname] = prevActual ? { phase: prevActual.phase, gen: !!_isGeneratedNote(prevActual.note) } : null;
    }
  }

  for (var ser = start; ser <= end; ser++){
    // Collect per-day summaries: transition events, active coterminous/remote,
    // and generated shifts.  Then emit at most a few dot-only indicators per day
    // instead of one fill event per plane per day.
    var transitionNames = [];
    var cotNames = [];
    var remoteNames = [];
    var genNames = [];

    for (var j = 0; j < planes.length; j++){
      var name = planes[j].name;

      // Canonical phase
      var curCanon = getPlanarState(name, ser, { ignoreGenerated: true });
      var prvCanon = prevCanon[name];
      var isTransition = curCanon && prvCanon && curCanon.phase !== prvCanon.phase;
      if (isTransition){
        var emoji = PLANE_PHASE_EMOJI[curCanon.phase] || '\u26AA';
        var label = PLANE_PHASE_LABELS[curCanon.phase] || curCanon.phase;
        if (curCanon.phase === 'coterminous' || curCanon.phase === 'remote'){
          transitionNames.push(emoji + ' ' + name + ': ' + label + ' begins');
        } else {
          var endedPhase = PLANE_PHASE_LABELS[prvCanon.phase] || prvCanon.phase;
          transitionNames.push(emoji + ' ' + name + ': ' + endedPhase + ' ends');
        }
      } else if (curCanon && curCanon.phase === 'coterminous'){
        cotNames.push(name);
      } else if (curCanon && curCanon.phase === 'remote'){
        remoteNames.push(name);
      }
      prevCanon[name] = curCanon;

      // Generated (off-cycle) event spans
      if (generatedCutoffSerial != null && ser <= generatedCutoffSerial){
        var curActual = getPlanarState(name, ser);
        var curIsGen = !!(curActual && _isGeneratedNote(curActual.note));
        var prevEntry = prevGen[name] || { phase: null, gen: false };
        var prevWasGen = !!prevEntry.gen;

        if (curIsGen){
          var gPhase = curActual.phase || 'neutral';
          var gLabel = (PLANE_PHASE_LABELS[gPhase] || gPhase).toLowerCase();
          var startsHere = (!prevWasGen || prevEntry.phase !== gPhase);
          if (startsHere){
            genNames.push(name + ': ' + gLabel + ' begins');
          } else {
            genNames.push(name + ': ' + gLabel);
          }
        }
        prevGen[name] = { phase: curActual ? curActual.phase : null, gen: curIsGen };
      }
    }

    // Emit dot-only indicators: one per category so cells aren't flooded
    // with fill colours.  Transitions get their own teal dot; ongoing
    // coterminous/remote get lighter dots; generated shifts get purple.
    if (transitionNames.length){
      out.push({
        serial: ser,
        name: transitionNames.join(', '),
        color: '#80CBC4',
        dotOnly: true
      });
    }
    if (cotNames.length){
      out.push({
        serial: ser,
        name: 'Coterminous: ' + cotNames.join(', '),
        color: '#B2DFDB',
        dotOnly: true
      });
    }
    if (remoteNames.length){
      out.push({
        serial: ser,
        name: 'Remote: ' + remoteNames.join(', '),
        color: '#FFCDD2',
        dotOnly: true
      });
    }
    if (genNames.length){
      out.push({
        serial: ser,
        name: 'Generated: ' + genNames.join(', '),
        color: '#CE93D8',
        dotOnly: true
      });
    }
  }

  return out;
}

export function _planesTodaySummaryHtml(today, isGM, viewTier, viewHorizon){
  var planes = _getAllPlaneData();
  if (!planes || !planes.length) return '';
  var cot = 0, rem = 0, activeGen = 0;
  var next = null;
  // Low: canon only. Canon non-annual events (Fernia's 5-year cycle) are
  // recognized when happening — "oh right, this is the cycle" — because
  // they're canon. Generated events are never recognized at low.
  // Medium+: show generated within horizon. GM/High: show all.
  var ignGen = (!isGM && viewTier === 'low');

  for (var i = 0; i < planes.length; i++){
    var ps = getPlanarState(planes[i].name, today, ignGen ? { ignoreGenerated:true } : null);
    if (!ps) continue;
    if (ps.phase === 'coterminous') cot++;
    if (ps.phase === 'remote') rem++;
    if (_isGeneratedNote(ps.note)) activeGen++;
    if (ps.daysUntilNextPhase != null && ps.nextPhase){
      var d = Math.max(0, ps.daysUntilNextPhase|0);
      if (d <= viewHorizon && (!next || d < next.days)){
        next = { days:d, plane:ps.plane.name, phase:PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase };
      }
    }
  }

  var bits = ['Coterminous '+cot, 'Remote '+rem];
  if (activeGen) bits.push('Generated shifts ' + activeGen);
  if (next) bits.push('Next: ' + next.plane + ' ' + next.phase + ' in ' + next.days + 'd');
  return '<div style="font-size:.8em;opacity:.72;margin:2px 0 6px 0;">'+esc(bits.join(' · '))+'</div>';
}

// ---------------------------------------------------------------------------
// 21f) Panel HTML — GM and player views
// ---------------------------------------------------------------------------

// Returns an array of HTML parts to send as separate messages (avoids Roll20 size limits).
export function planesPanelHtml(isGM, revealTier?, serialOverride?, revealHorizonDays?, generatedHorizonDays?){
  var st = ensureSettings();
  if (st.planesEnabled === false){
    return [_menuBox('\uD83C\uDF00 Planes',
      '<div style="opacity:.7;">Planar system is disabled.</div>'+
      (isGM ? '<div style="margin-top:4px;font-size:.85em;">Enable: <code>!cal settings planes on</code></div>' : '')
    )];
  }

  var viewTier = isGM ? 'high' : _normalizePlaneRevealTier(revealTier || getPlanesState().revealTier || 'medium');
  var viewHorizon = parseInt(revealHorizonDays, 10);
  if (!isFinite(viewHorizon) || viewHorizon < 1){
    viewHorizon = parseInt(getPlanesState().revealHorizonDays, 10) || _planarYearDays();
  }
  // For medium tier: canon uses viewHorizon (336d), generated uses generatedHorizon (short).
  // For high/GM: generated uses full viewHorizon. For low: no generated.
  var genHorizon = 0;
  if (isGM) genHorizon = PLANE_GENERATED_LOOKAHEAD.gmDays;
  else if (viewTier === 'high') genHorizon = viewHorizon;
  else if (viewTier === 'medium') genHorizon = parseInt(generatedHorizonDays, 10) || parseInt(getPlanesState().generatedHorizonDays, 10) || 0;
  // low tier: genHorizon stays 0 (no generated events except present day)
  var srcLabel = isGM ? '' : (PLANE_SOURCE_LABELS[viewTier] || '');
  var planes = _getAllPlaneData();
  var today  = isFinite(serialOverride) ? (serialOverride|0) : todaySerial();
  var dateLabel = dateLabelFromSerial(today);
  var displayMode = _normalizeDisplayMode(st.planesDisplayMode);
  var verbose = _subsystemIsVerbose();
  var rows   = [];
  var pr = _monthRangeFromSerial(today);
  var generatedCutoff = null;
  if (isGM) generatedCutoff = pr.end;
  else if (genHorizon > 0) generatedCutoff = Math.min(pr.end, todaySerial() + genHorizon);
  var planesMiniEvents = _planesMiniCalEvents(pr.start, pr.end, generatedCutoff);
  var planesMiniCal = _renderSyntheticMiniCal('Planar Movement', pr.start, pr.end, planesMiniEvents);
  var prevSer = _shiftSerialByMonth(today, -1);
  var nextSer = _shiftSerialByMonth(today, 1);
  var navRow;
  if (isGM){
    navRow = '<div style="margin:3px 0 6px 0;">'+
      button('◀ Prev Month','planes on '+_serialToDateSpec(prevSer))+' '+
      button('Next Month ▶','planes on '+_serialToDateSpec(nextSer))+
      '</div>';
  } else {
    var knownStart = todaySerial();
    var knownEnd = knownStart + viewHorizon;
    function _pNavBtn(serial, label){
      if (serial < knownStart || serial > knownEnd) return '<span style="opacity:.35;">'+esc(label)+'</span>';
      return button(label, 'planes on '+_serialToDateSpec(serial));
    }
    navRow = '<div style="margin:3px 0 6px 0;">'+
      _pNavBtn(prevSer, '◀ Prev Month')+' '+
      _pNavBtn(nextSer, 'Next Month ▶')+
      '</div>';
  }

  for (var i = 0; i < planes.length; i++){
    // Low: canon only — generated never shown. Canon includes non-annual
    // cycles (Fernia 5-year), recognized when happening.
    // Medium: canon always + generated within genHorizon.
    // High/GM: everything.
    var pIgnGen = (!isGM && genHorizon <= 0);
    var ps = getPlanarState(planes[i].name, today, pIgnGen ? { ignoreGenerated: true } : null);
    if (!ps) continue;

    var emoji = PLANE_PHASE_EMOJI[ps.phase] || '\u26AA';
    var label = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
    var name  = ps.plane.name;
    var isNotable = (ps.phase === 'coterminous' || ps.phase === 'remote');
    var isFixed   = !!(ps.plane.sealed || ps.plane.fixed);

    // Override indicator
    var overrideTag = ps.overridden
      ? ' <span style="font-size:.75em;color:#E65100;">[override]</span>'
      : '';

    var anchorModeTag = '';
    if (isGM && ps.traditionalAnchorMode){
      anchorModeTag = ' <span style="font-size:.75em;opacity:.5;">[' +
        (ps.traditionalAnchorMode === 'gm-anchored' ? 'GM anchored' : 'random seed') + ']</span>';
    }

    // Generated shift detection
    var hasGenNow = _isGeneratedNote(ps.note);
    var generatedTag = '';
    if (hasGenNow){
      generatedTag = ' <span style="font-size:.75em;opacity:.55;font-style:italic;">(non-canonical)</span>';
    } else if (!ps.overridden && isGM){
      var lookahead = PLANE_GENERATED_LOOKAHEAD.gmDays;
      var ff = _nextGeneratedForecast(name, today, lookahead);
      if (ff){
        var ffLabel = PLANE_PHASE_LABELS[ff.phase] || ff.phase;
        var ffText = ff.activeNow ? (ffLabel + ' shift active')
          : ('Generated ' + ffLabel + ' in ' + ff.daysUntilStart + 'd');
        if (ff.durationDays > 1) ffText += ' (~' + ff.durationDays + 'd)';
        generatedTag = ' <span style="font-size:.75em;opacity:.45;font-style:italic;">'+esc(ffText)+'</span>';
      }
    } else if (!hasGenNow && !ps.overridden && !isGM && genHorizon > 0){
      var pLookahead = genHorizon;
      if (pLookahead > 0){
        var pff = _nextGeneratedForecast(name, today, pLookahead);
        if (pff){
          var pffLabel = PLANE_PHASE_LABELS[pff.phase] || pff.phase;
          var pffText;
          if (pff.activeNow){
            pffText = pffLabel + ' shift active';
          } else {
            var pffWin = _planePredictionWindowDays(ps.plane, pff.daysUntilStart, 'high');
            if (pffWin <= 0){
              pffText = 'Generated ' + pffLabel + ' in ' + pff.daysUntilStart + 'd';
            } else {
              var pffLo = Math.max(1, pff.daysUntilStart - pffWin);
              var pffHi = pff.daysUntilStart + pffWin;
              pffText = (pffLo === pffHi)
                ? ('Generated ' + pffLabel + ' in ~' + pffLo + 'd')
                : ('Generated ' + pffLabel + ' ~' + pffLo + '\u2013' + pffHi + 'd');
            }
          }
          if (pff.durationDays > 1) pffText += ' (~' + pff.durationDays + 'd)';
          generatedTag = ' <span style="font-size:.75em;opacity:.45;font-style:italic;">'+esc(pffText)+'</span>';
        }
      }
    }

    // Next transition (GM only, compact)
    var nextTag = '';
    if (isGM && ps.daysUntilNextPhase != null && ps.nextPhase){
      nextTag = ' <span style="opacity:.4;font-size:.8em;">' +
        esc(PLANE_PHASE_LABELS[ps.nextPhase] || ps.nextPhase) + ' in ' + ps.daysUntilNextPhase + 'd</span>';
    }

    // Fixed/sealed planes: skip when not notable
    if (isFixed && !isNotable && !hasGenNow) continue;

    // For neutral planes: one compact line
    if (!isNotable && !hasGenNow){
      rows.push(
        '<div style="margin:1px 0;line-height:1.3;font-size:.9em;opacity:.65;">'+
          emoji+' <span style="min-width:78px;display:inline-block;">'+esc(name)+'</span> '+
          esc(label) + overrideTag + anchorModeTag + nextTag + generatedTag +
        '</div>'
      );
      continue;
    }

    // Notable planes (coterminous/remote/active flicker): full detail
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

    // Player cycle summary
    var cycleSummaryHtml = '';
    if (!isGM){
      var cycTxt = _canonicalPhaseKnowledgeSummary(name, today, viewHorizon);
      if (cycTxt){
        cycleSummaryHtml = '<div style="font-size:.75em;opacity:.45;margin-left:14px;">'+esc(cycTxt)+'</div>';
      }
    }

    rows.push(
      '<div style="margin:3px 0;line-height:1.4;">'+
        emoji+' <b style="min-width:82px;display:inline-block;">'+esc(name)+'</b>'+
        '<span style="opacity:.85;">'+esc(label)+'</span>'+
        overrideTag + anchorModeTag + nextTag + generatedTag +
      '</div>'+
      effectHtml + cycleSummaryHtml + noteHtml
    );
  }

  // Long Shadows special: when Mabar is coterminous, show which moons are dark
  var longShadowsHtml = '';
  try {
    var mabarState = getPlanarState('Mabar', today, (!isGM && viewTier !== 'high') ? { ignoreGenerated: true } : null);
    if (mabarState && mabarState.phase === 'coterminous'){
      var c = getCal().current;
      var lsMoons = getLongShadowsMoons(c.year);
      if (lsMoons.length > 0){
        var moonNames = [];
        for (var lm = 0; lm < lsMoons.length; lm++) moonNames.push(lsMoons[lm].name);
        longShadowsHtml = '<div style="font-size:.82em;margin-top:4px;padding:4px;'+
          'background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">'+
          '\uD83C\uDF11 <b>Long Shadows</b> \u2014 Dark moons tonight: <b>'+esc(moonNames.join(', '))+'</b>'+
          '</div>';
      } else {
        longShadowsHtml = '<div style="font-size:.82em;margin-top:4px;padding:4px;'+
          'background:rgba(60,0,80,.15);border-radius:3px;border:1px solid rgba(100,50,120,.3);">'+
          '\uD83C\uDF11 <b>Long Shadows</b> \u2014 Mabar is coterminous. Darkness reigns.'+
          '</div>';
      }
    }
  } catch(e){}

  // GM-only controls — compact
  var gmControls = '';
  if (isGM){
    var pSendBtns = PLANE_MEDIUM_PRESETS.map(function(p){
      return button(p.label + ' (' + p.dc + ')', 'planes send medium ' + (p.token || (p.days + 'd')));
    }).join(' ');
    var pHighBtns = PLANE_HIGH_PRESETS.map(function(p){
      return button(p.label + ' (' + p.dc + ')', 'planes send high ' + (p.token || (p.days + 'd')));
    }).join(' ');

    var planeQueryOpts = planes.map(function(p){ return p.name; }).join('|');
    var planeDropdown = button('🌀 Show Specific Plane', 'planes view ?{Select Plane|' + planeQueryOpts + '}');

    // Send buttons
    gmControls =
      '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.1);padding-top:5px;">'+
        '<div style="font-size:.82em;margin-bottom:2px;">Send Medium: '+pSendBtns+'</div>'+
        '<div style="font-size:.82em;margin-bottom:2px;">Send High: '+pHighBtns+'</div>'+
      '</div>';

    // Send to Players
    gmControls += '<div style="margin:4px 0;">' +
      button('Send to Players','planes send medium ?{Horizon|1m|3m|6m|10m}') +
      '</div>';

    // Spacer
    gmControls += '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>';

    // Specific Planes dropdown
    gmControls += '<div style="margin:4px 0;">' + planeDropdown + '</div>';

    // Spacer
    gmControls += '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>';

    // Additional Ranges
    var plMonthCount = getCal().months.length;
    var plCurMi = getCal().current.month;
    var plRemaining = plMonthCount - plCurMi;
    gmControls += '<div style="margin:4px 0;">' +
      button('Additional Ranges','planes ranges ?{Range|Full Year,year|Upcoming ' + plRemaining + ' months,upcoming|Specific Month,specific ?\\{MM or MM YYYY\\}|Specific Year,year ?\\{YYYY\\}}') +
      '</div>';

    // Spacer
    gmControls += '<div style="border-top:1px solid rgba(0,0,0,.08);margin:6px 0 4px 0;"></div>';

    // Management dropdown
    gmControls += '<div style="margin:4px 0;">' +
      button('Management','planes manage ?{Action|Toggle Planes On/Off,settings planes toggle|Toggle Generated Events,settings generated toggle|Reseed Planes,planes reseed|Set Phase Override,planes override ?\\{Plane\\} ?\\{Phase cot/remote/off\\}|Clear Override,planes clearoverride ?\\{Plane\\}|Set Anchor,planes anchor ?\\{Plane\\} ?\\{Date\\}|Seed Override,planes seed ?\\{Seed word\\}}') +
      '</div>';

    // Utility buttons
    gmControls += '<div style="margin:4px 0;">'+
      button('View: '+_displayModeLabel(displayMode),'settings mode planes '+_nextDisplayMode(displayMode))+
      '</div>';

    gmControls += '<div style="font-size:.75em;opacity:.4;margin-top:3px;">'+
      'CLI: <code>!cal planes send [low|medium|high] [1m|3m|6m|10m|Nd|Nw]</code>'+
      '</div>';
  }

  var srcLine = srcLabel
    ? '<div style="font-size:.75em;opacity:.4;font-style:italic;margin-top:6px;">'+esc(srcLabel)+'</div>'
    : '';
  var horizonLine = (!isGM)
    ? '<div style="font-size:.72em;opacity:.35;font-style:italic;margin-top:4px;">Forecast horizon: '+esc(_planeRangeLabel(viewHorizon))+'</div>'
    : '';
  // Build parts array to send as separate messages (avoids Roll20 size limits)
  var parts = [];

  if (displayMode !== 'list'){
    var calBody = navRow +
      _planesTodaySummaryHtml(today, isGM, viewTier, viewHorizon) +
      planesMiniCal +
      _legendLine(['🔴 Coterminous', '🟠 Waning', '🔵 Remote', '🟡 Waxing', '◇ Generated shift']) +
      longShadowsHtml;
    parts.push(_menuBox('\uD83C\uDF00 Planes \u2014 ' + esc(dateLabel), calBody));
  }
  if (displayMode !== 'calendar'){
    var listBody = (displayMode === 'list' ? navRow +
      _planesTodaySummaryHtml(today, isGM, viewTier, viewHorizon) : '') +
      rows.join('') + longShadowsHtml + srcLine + horizonLine;
    parts.push(_menuBox(displayMode === 'list' ? '\uD83C\uDF00 Planes \u2014 ' + esc(dateLabel) : '\uD83C\uDF00 Planar Phases', listBody));
  }
  if (!parts.length){
    parts.push(_menuBox('\uD83C\uDF00 Planes', '<div style="opacity:.7;">No planar display mode selected.</div>'));
  }

  // GM controls as separate message
  if (gmControls){
    parts.push(_menuBox('\uD83C\uDF00 GM Controls',
      gmControls +
      '<div style="margin-top:7px;">'+ button('\u2B05\uFE0F Back','show') +'</div>'
    ));
  } else {
    // For players, append back button to last part
    var lastIdx = parts.length - 1;
    parts[lastIdx] = parts[lastIdx].replace(/<\/div>$/, '') +
      '<div style="margin-top:7px;">'+ button('\u2B05\uFE0F Back','show') +'</div></div>';
  }

  return parts;
}

// Legacy single-string wrapper
export function planesPanelHtmlSingle(isGM, revealTier?, serialOverride?, revealHorizonDays?, generatedHorizonDays?){
  return planesPanelHtml(isGM, revealTier, serialOverride, revealHorizonDays, generatedHorizonDays).join('');
}

function _planesBroadcastSummaryHtml(viewTier, revealHorizonDays, generatedHorizonDays, serialOverride?){
  var today = isFinite(serialOverride) ? (serialOverride|0) : todaySerial();
  var planes = _getAllPlaneData();
  var genHorizon = parseInt(generatedHorizonDays, 10) || 0;
  var rows = [];
  for (var i = 0; i < planes.length; i++){
    var ignoreGenerated = (viewTier === 'low' || genHorizon <= 0);
    var ps = getPlanarState(planes[i].name, today, ignoreGenerated ? { ignoreGenerated: true } : null);
    if (!ps) continue;
    var label = PLANE_PHASE_LABELS[ps.phase] || ps.phase;
    var generatedTag = _isGeneratedNote(ps.note) ? ' (generated)' : '';
    rows.push(
      '<div style="margin:2px 0;">' +
        (PLANE_PHASE_EMOJI[ps.phase] || '\u26AA') + ' <b>' + esc(ps.plane.name) + '</b> — ' + esc(label + generatedTag) +
      '</div>'
    );
  }
  return _menuBox('\uD83C\uDF00 Planar Almanac \u2014 ' + esc(dateLabelFromSerial(today)),
    _planesTodaySummaryHtml(today, false, viewTier, revealHorizonDays) +
    rows.join('') +
    '<div style="font-size:.75em;opacity:.45;margin-top:4px;">Forecast horizon: ' + esc(_planeRangeLabel(revealHorizonDays)) + '</div>'
  );
}

export function _isGeneratedNote(note){
  return /generated/i.test(String(note || ''));
}


// ---------------------------------------------------------------------------
// 21g) Command handler  (!cal planes ...)
// ---------------------------------------------------------------------------

export function handlePlanesCommand(m, args){
  // args[0]='planes', args[1]=subcommand
  var sub = String(args[1] || '').toLowerCase();
  var isGM = playerIsGM(m.playerid);

  var psView = getPlanesState();
  var playerTier = _normalizePlaneRevealTier(psView.revealTier || 'medium');
  var playerHorizon = parseInt(psView.revealHorizonDays, 10) || _planarYearDays();
  var playerGenHorizon = parseInt(psView.generatedHorizonDays, 10) || 0;

  if (!sub || sub === 'show'){
    return whisperParts(m.who, isGM ? planesPanelHtml(true) : planesPanelHtml(false, playerTier, null, playerHorizon, playerGenHorizon));
  }

  // Player self-query mode (read-only, knowledge-limited).
  if (!isGM){
    if (sub === 'on' || sub === 'date'){
      var pDateToks = args.slice(2).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
      var pPref = parseDatePrefixForAdd(pDateToks);
      if (!pPref){
        return whisper(m.who, 'Usage: <code>!cal planes on &lt;dateSpec&gt;</code>');
      }
      var pSerial = toSerial(pPref.year, pPref.mHuman - 1, pPref.day);
      var pToday = todaySerial();
      if (pSerial < pToday || pSerial > (pToday + playerHorizon)){
        return whisper(m.who, 'That date is beyond your planar knowledge.');
      }
      return whisperParts(m.who, planesPanelHtml(false, playerTier, pSerial, playerHorizon, playerGenHorizon));
    }

    return whisper(m.who,
      'Planes: <code>!cal planes</code> &nbsp;\u00B7&nbsp; '+
      '<code>!cal planes on &lt;dateSpec&gt;</code>'
    );
  }

  // !cal planes on <dateSpec>  — inspect planar states on a specific day
  if (sub === 'on' || sub === 'date'){
    var dateToksOn = args.slice(2).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
    var prefOn = parseDatePrefixForAdd(dateToksOn);
    if (!prefOn){
      return whisper(m.who, 'Usage: <code>!cal planes on &lt;dateSpec&gt;</code> (example: <code>!cal planes on Rhaan 14 998</code>)');
    }
    var serialOn = toSerial(prefOn.year, prefOn.mHuman - 1, prefOn.day);
    return whisperParts(m.who, planesPanelHtml(true, null, serialOn));
  }

  // !cal planes set <n> <phase> [days]  — force override a plane's phase
  if (sub === 'set'){
    var setName  = String(args[2] || '').trim();
    var setPhase = String(args[3] || '').toLowerCase();
    if (!setName || !PLANE_PHASE_LABELS[setPhase]){
      return whisper(m.who, 'Usage: <code>!cal planes set &lt;name&gt; (coterminous|remote|neutral) [days]</code>');
    }
    var plane = _getPlaneData(setName);
    if (!plane) return whisper(m.who, 'Unknown plane: <b>'+esc(setName)+'</b>');

    var durationDays = parseInt(args[4], 10) || 0; // 0 = indefinite
    var setToday = todaySerial();
    var ps = getPlanesState();
    var overrideObj: any = { phase: setPhase, note: 'GM override', setOn: setToday };
    if (durationDays > 0) overrideObj.durationDays = durationDays;
    ps.overrides[plane.name] = overrideObj;

    // Register this as a GM custom event so generated events near it
    // are automatically suppressed (treated like canon for suppression).
    if (!ps.gmCustomEvents) ps.gmCustomEvents = {};
    if (!ps.gmCustomEvents[plane.name]) ps.gmCustomEvents[plane.name] = [];
    ps.gmCustomEvents[plane.name].push({
      serial: setToday,
      phase: setPhase,
      durationDays: durationDays || 0,
      note: 'GM override'
    });

    var durMsg = durationDays > 0 ? ' for <b>'+durationDays+'</b> day'+(durationDays>1?'s':'') : ' (indefinite)';
    whisper(m.who, '<b>'+esc(plane.name)+'</b> forced to <b>'+esc(PLANE_PHASE_LABELS[setPhase])+'</b>'+durMsg+'.');
    return whisperParts(m.who, planesPanelHtml(true));
  }

  // !cal planes clear <name>  — remove override for a plane
  if (sub === 'clear'){
    var clearName = String(args[2] || '').trim();
    var psC = getPlanesState();
    if (!clearName){
      psC.overrides = {};
      psC.anchors = {};
      psC.gmCustomEvents = {};
      whisper(m.who, 'All planar overrides and anchor overrides cleared.');
      return whisperParts(m.who, planesPanelHtml(true));
    }
    var planeC = _getPlaneData(clearName);
    if (!planeC) return whisper(m.who, 'Unknown plane: <b>'+esc(clearName)+'</b>');
    delete psC.overrides[planeC.name];
    delete psC.anchors[planeC.name];
    delete psC.gmCustomEvents[planeC.name];
    whisper(m.who, 'Override cleared for <b>'+esc(planeC.name)+'</b>.');
    return whisperParts(m.who, planesPanelHtml(true));
  }

  // !cal planes anchor <name> <phase> <dateSpec>  — set anchor date for cycle calculation
  if (sub === 'anchor'){
    var ancName  = String(args[2] || '').trim();
    var ancPhase = String(args[3] || '').toLowerCase();
    if (!ancName || !PLANE_PHASE_LABELS[ancPhase]){
      return whisper(m.who,
        'Usage: <code>!cal planes anchor &lt;name&gt; (coterminous|remote|neutral) &lt;dateSpec&gt;</code><br>'+
        'Example: <code>!cal planes anchor Fernia coterminous Lharvion 1 996</code>'
      );
    }
    var planeA = _getPlaneData(ancName);
    if (!planeA) return whisper(m.who, 'Unknown plane: <b>'+esc(ancName)+'</b>');

    var dateToks = args.slice(4).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
    var pref = parseDatePrefixForAdd(dateToks);
    if (!pref){
      return whisper(m.who, 'Could not parse date. Try: <code>!cal planes anchor '+esc(planeA.name)+' '+ancPhase+' Lharvion 1 996</code>');
    }

    var psA = getPlanesState();
    psA.anchors[planeA.name] = {
      year: pref.year,
      month: pref.mHuman - 1,
      day: pref.day,
      phase: ancPhase
    };

    var cal2 = getCal();
    var monthName = _displayMonthDayParts(pref.mHuman - 1, pref.day).monthName;
    whisper(m.who,
      '<b>'+esc(planeA.name)+'</b> anchor set: <b>'+esc(PLANE_PHASE_LABELS[ancPhase])+'</b> on '+
      esc(String(pref.day))+' '+esc(monthName)+' '+esc(String(pref.year))+'.'
    );
    // Clear any phase override since we're now using calculated cycles
    delete psA.overrides[planeA.name];
    return whisperParts(m.who, planesPanelHtml(true));
  }

  // !cal planes send [low|medium|high] [1m|3m|6m|10m|Nd|Nw]
  // Without a tier, shows GM-only snapshot.
  // With a tier, broadcasts a player-facing planar forecast and upgrades stored tier.
  if (sub === 'send'){
    var tierRaw = String(args[2] || '').toLowerCase();
    if (!tierRaw){
      var planes = _getAllPlaneData();
      var today  = todaySerial();
      var sendRows = [];

      for (var si = 0; si < planes.length; si++){
        var sps = getPlanarState(planes[si].name, today);
        if (!sps) continue;
        var sEmoji = PLANE_PHASE_EMOJI[sps.phase] || '\u26AA';
        var sLabel = PLANE_PHASE_LABELS[sps.phase] || sps.phase;
        sendRows.push(
          '<div style="margin:2px 0;">'+
            sEmoji+' <b>'+esc(sps.plane.name)+'</b> \u2014 '+esc(sLabel)+
          '</div>'
        );
      }

      whisper(m.who, _menuBox(
        '\uD83C\uDF00 Planar Almanac \u2014 '+esc(dateLabelFromSerial(today)),
        sendRows.join('') +
        '<div style="opacity:.75;margin-top:4px;">GM-only view. No message was sent to players.</div>'+
        '<div style="margin-top:6px;">'+button('Back','planes')+'</div>'
      ));
      return;
    }

    var tier = PLANE_REVEAL_TIERS[tierRaw] ? tierRaw : null;
    if (!tier){
      return whisper(m.who, 'Usage: <code>!cal planes send [low|medium|high] [1m|3m|6m|10m|Nd|Nw]</code>');
    }
    var reqHorizon = _parsePlaneRevealRange(args[3], tier);
    if (!reqHorizon){
      return whisper(m.who, 'Usage: <code>!cal planes send [low|medium|high] [1m|3m|6m|10m|Nd|Nw]</code>');
    }

    var psSend = getPlanesState();
    var curTier = _normalizePlaneRevealTier(psSend.revealTier || 'medium');
    var curRank = PLANE_REVEAL_TIERS[curTier] || 1;
    var newRank = PLANE_REVEAL_TIERS[tier] || 1;
    if (newRank > curRank) psSend.revealTier = tier;
    var effectiveTier = _normalizePlaneRevealTier(psSend.revealTier || tier);

    // Medium: canon horizon is always 336d (one year). reqHorizon = generated window (short).
    // High: reqHorizon applies to everything (canon + generated).
    // Low: canon for fixed annual only, present-day generated.
    var canonHorizon, genHorizon;
    if (effectiveTier === 'high'){
      canonHorizon = reqHorizon;
      genHorizon = reqHorizon;
    } else if (effectiveTier === 'medium'){
      canonHorizon = PLANE_PREDICTION_LIMITS.mediumCanonDays;
      genHorizon = reqHorizon;
    } else {
      canonHorizon = PLANE_PREDICTION_LIMITS.mediumCanonDays; // annual canon always
      genHorizon = 0; // low: present day only (handled by getPlanarState)
    }

    // Upgrade-only: expand horizons, never shrink
    psSend.revealHorizonDays = Math.max(parseInt(psSend.revealHorizonDays,10)||0, canonHorizon);
    psSend.generatedHorizonDays = Math.max(parseInt(psSend.generatedHorizonDays,10)||0, genHorizon);

    var effectiveCanonHorizon = parseInt(psSend.revealHorizonDays,10) || canonHorizon;
    var effectiveGenHorizon = parseInt(psSend.generatedHorizonDays,10) || genHorizon;

    sendToAll(_planesBroadcastSummaryHtml(effectiveTier, effectiveCanonHorizon, effectiveGenHorizon));
    var rangeNote = (effectiveTier === 'medium')
      ? 'canon ' + _planeRangeLabel(effectiveCanonHorizon) + ', generated ' + effectiveGenHorizon + 'd'
      : _planeRangeLabel(effectiveCanonHorizon);
    warnGM('Sent '+titleCase(effectiveTier)+' planar forecast to players ('+rangeNote+').');
    whisperParts(m.who, planesPanelHtml(true));
    return;
  }

  // !cal planes view <PlaneName>  — single-plane detail view
  if (sub === 'view'){
    var viewNameRaw = String(args[2] || '').trim();
    var allPlanes = _getAllPlaneData();
    if (!viewNameRaw){
      // Show dropdown picker for plane selection
      var viewQueryOpts = allPlanes.map(function(p){ return p.name; }).join('|');
      return whisper(m.who, _menuBox('🌀 Plane Detail',
        '<div style="margin-bottom:4px;">'+button('🌀 Show Specific Plane', 'planes view ?{Select Plane|' + viewQueryOpts + '}')+'</div>' +
        '<div style="margin-top:6px;">'+button('⬅ Back','planes')+'</div>'
      ));
    }
    var viewPlane = _getPlaneData(viewNameRaw);
    if (!viewPlane) return whisper(m.who, 'Unknown plane: <b>'+esc(viewNameRaw)+'</b>. Try <code>!cal planes view</code> for a list.');

    var viewToday = todaySerial();
    var viewPs = getPlanarState(viewPlane.name, viewToday);
    var viewEmoji = PLANE_PHASE_EMOJI[viewPs.phase] || '⚪';
    var viewLabel = PLANE_PHASE_LABELS[viewPs.phase] || viewPs.phase;

    var viewHtml = '<div style="margin:4px 0;">';
    // Phase
    viewHtml += '<div style="margin:3px 0;font-size:1.05em;">'+viewEmoji+' Currently: <b>'+esc(viewLabel)+'</b></div>';
    // Next transition
    if (viewPs.daysUntilNextPhase != null && viewPs.nextPhase){
      viewHtml += '<div style="margin:2px 0;font-size:.88em;opacity:.7;">Next: '+
        esc(PLANE_PHASE_LABELS[viewPs.nextPhase] || viewPs.nextPhase)+' in '+viewPs.daysUntilNextPhase+'d</div>';
    }
    // Override indicator
    if (viewPs.overridden){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;color:#E65100;">[GM override active]</div>';
    }
    // Effects for current phase
    if (viewPlane.effects && viewPlane.effects[viewPs.phase]){
      viewHtml += '<div style="margin:4px 0;font-size:.85em;padding:3px 6px;background:rgba(255,255,255,.06);border-radius:3px;">'+
        '<b>Effects:</b> '+esc(viewPlane.effects[viewPs.phase])+'</div>';
    }
    // Title
    if (viewPlane.title){
      viewHtml += '<div style="margin:3px 0;font-size:.85em;opacity:.6;font-style:italic;">'+esc(viewPlane.title)+'</div>';
    }
    // Associated moon
    if (viewPlane.associatedMoon){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;opacity:.55;">Associated moon: <b>'+esc(viewPlane.associatedMoon)+'</b></div>';
    }
    // Cycle info
    if (viewPlane.type === 'cyclic' && viewPlane.orbitYears){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;opacity:.55;">Orbit: '+viewPlane.orbitYears+' years</div>';
    } else if (viewPlane.type === 'fixed'){
      viewHtml += '<div style="margin:2px 0;font-size:.82em;opacity:.55;">Fixed phase (no natural orbit)</div>';
    }
    // GM-only lore note
    if (isGM && viewPlane.note){
      viewHtml += '<div style="margin:4px 0;font-size:.78em;opacity:.45;font-style:italic;">'+esc(viewPlane.note)+'</div>';
    }
    viewHtml += '</div>';

    return whisper(m.who, _menuBox('🌀 '+esc(viewPlane.name),
      viewHtml +
      '<div style="margin-top:6px;">'+button('⬅ All Planes','planes')+'</div>'
    ));
  }

  // !cal planes suppress <name> [dateSpec]
  // Suppress a specific generated event. If no dateSpec, suppress whatever is active today.
  if (sub === 'suppress'){
    var suppName = String(args[2] || '');
    var suppPlane = _getPlaneData(suppName);
    if (!suppPlane){
      return whisper(m.who,
        'Usage: <code>!cal planes suppress &lt;name&gt; [dateSpec]</code><br>'+
        'Suppresses a specific generated event without disabling the whole system.');
    }
    var suppSerial = todaySerial();
    if (args.length > 3){
      var suppToks = args.slice(3).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
      var suppPref = parseDatePrefixForAdd(suppToks);
      if (suppPref){
        suppSerial = toSerial(suppPref.year, suppPref.mHuman - 1, suppPref.day);
      }
    }
    var suppEvt = _generatedEventAt(suppPlane.name, suppSerial);
    if (!suppEvt){
      return whisper(m.who, 'No generated event found for <b>'+esc(suppPlane.name)+'</b> on that date.');
    }
    var psSup = getPlanesState();
    if (!psSup.suppressedEvents[suppPlane.name]) psSup.suppressedEvents[suppPlane.name] = {};
    psSup.suppressedEvents[suppPlane.name][suppEvt.startSerial] = true;
    var suppDateLabel = dateLabelFromSerial(suppEvt.startSerial);
    whisper(m.who,
      'Suppressed <b>'+esc(suppPlane.name)+'</b> generated '+esc(suppEvt.phase)+
      ' event starting '+esc(suppDateLabel)+' ('+suppEvt.durationDays+'d).');
    return whisperParts(m.who, planesPanelHtml(true));
  }

  // !cal planes seed <name> <year>
  // Override the seed-derived anchor year for a specific plane.
  // This lets GMs pin when a plane's canonical cycle hits without affecting other planes.
  if (sub === 'seed'){
    var seedName = String(args[2] || '');
    var seedPlane = _getPlaneData(seedName);
    if (!seedPlane || !seedPlane.seedAnchor){
      return whisper(m.who,
        'Usage: <code>!cal planes seed &lt;name&gt; &lt;year&gt;</code><br>'+
        'Override the seed-based anchor year for a cyclic plane. Only works for seed-anchored planes.');
    }
    var seedYear = parseInt(args[3], 10);
    if (String(args[3] || '').toLowerCase() === 'clear'){
      var psSeedClear = getPlanesState();
      if (psSeedClear.seedOverrides) delete psSeedClear.seedOverrides[seedPlane.name];
      whisper(m.who, '<b>'+esc(seedPlane.name)+'</b> seed anchor override removed. Using epoch-derived anchor.');
      return whisperParts(m.who, planesPanelHtml(true));
    }
    if (!isFinite(seedYear)){
      return whisper(m.who, 'Please provide a year. Example: <code>!cal planes seed '+esc(seedPlane.name)+' 998</code>');
    }
    var psSeed = getPlanesState();
    if (!psSeed.seedOverrides) psSeed.seedOverrides = {};
    psSeed.seedOverrides[seedPlane.name] = seedYear;
    whisper(m.who,
      '<b>'+esc(seedPlane.name)+'</b> seed anchor overridden to year <b>'+seedYear+'</b>.<br>'+
      (seedPlane.linkedTo ? '<i>Note: linked plane '+esc(seedPlane.linkedTo)+' will derive from its own setting.</i><br>' : '')+
      'Use <code>!cal planes seed '+esc(seedPlane.name)+' clear</code> to remove.');
    return whisperParts(m.who, planesPanelHtml(true));
  }

  whisper(m.who,
    'Planes: <code>!cal planes</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes send [low|medium|high] [1m|3m|6m|10m|Nd|Nw]</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes on &lt;dateSpec&gt;</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes set &lt;name&gt; &lt;phase&gt;</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes anchor &lt;name&gt; &lt;phase&gt; &lt;dateSpec&gt;</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes seed &lt;name&gt; &lt;year&gt;</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes suppress &lt;name&gt; [dateSpec]</code> &nbsp;\u00B7&nbsp; '+
    '<code>!cal planes clear [&lt;name&gt;]</code>'
  );
}
