// Section 20: Moon System
import { CONTRAST_MIN_HEADER, state_name } from './constants.js';
import { defaults, ensureSettings, getCal, titleCase } from './state.js';
import { _contrast, _cullCacheIfLarge, applyBg } from './color.js';
import { fromSerial, toSerial, todaySerial } from './date-math.js';
import { _monthRangeFromSerial, _renderSyntheticMiniCal, _stripHtmlTags, button, esc } from './rendering.js';
import { bucketLabel, bucketMidpointTimeFrac, daylightStatusForSerial, effectiveTimeBucket, isTimeOfDayActive, normalizeTimeBucketKey, solarProfileForSerial } from './time-of-day.js';
import { _displayModeLabel, _displayMonthDayParts, _legendLine, _menuBox, _nextDisplayMode, _normalizeDisplayMode, _serialToDateSpec, _shiftSerialByMonth, _subsystemIsVerbose, currentDateLabel, dateLabelFromSerial, parseDatePrefixForAdd } from './ui.js';
import { send, sendToAll, warnGM, whisper } from './commands.js';
import { _forecastRecord, _weatherPeriodLabel } from './weather.js';
import { _getPlaneData, _planarYearDays, getActivePlanarEffects, getPlanarState, getPlanesState } from './planes.js';


/* ============================================================================
 * SECTION 20) MOON SYSTEM
 * ==========================================================================*/

// ---------------------------------------------------------------------------
// 20a) Moon data
// ---------------------------------------------------------------------------


// Historical candidate-selection notes are archived in README.md and
// DESIGN.md rather than runtime data.
/*
  {
    moon: 'Lharvion',
    currentReferenceMoon: 'Nereid (Neptune)',
    alternateSeenInOlderLore: 'Phoebe (Saturn)',
    reason: 'Current orbital parameters (eccentricity 0.7507, inclination 7.23°) match Nereid, but older lore text referenced Phoebe.'
  }
*/

// ---------------------------------------------------------------------------
// 20a-i) Eberron moon core data (campaign baseline)
// ---------------------------------------------------------------------------
// Canonical Eberron moon values used in this script.
// Fields centralized here for quick reference and to avoid drift:
//   color               -> display color for moon UI badges/chips
//   diameter            -> moon diameter in miles
//   avgOrbitalDistance  -> average orbital distance from Eberron in miles
// NOTE: This section intentionally excludes the longer moon-selection rationale;
// keep that in README.md / DESIGN.md instead of runtime data.
export var EBERRON_MOON_CORE_DATA = {
  Zarantyr:  { referenceMoon:'Luna (Earth)',      color:'#F5F5FA', diameter:1250, avgOrbitalDistance:14300 },
  Olarune:   { referenceMoon:'Titan (Saturn)',    color:'#FFC68A', diameter:1000, avgOrbitalDistance:18000 },
  Therendor: { referenceMoon:'Dione (Saturn)',     color:'#D3D3D3', diameter:1100, avgOrbitalDistance:39000 },
  Eyre:      { referenceMoon:'Mimas (Saturn)',     color:'#C0C0C0', diameter:1200, avgOrbitalDistance:52000 },
  Dravago:   { referenceMoon:'Triton (Neptune)',   color:'#E6E6FA', diameter:2000, avgOrbitalDistance:77500 },
  Nymm:      { referenceMoon:'Ganymede (Jupiter)',color:'#FFD96B', diameter:900,  avgOrbitalDistance:95000 },
  Lharvion:  { referenceMoon:'Hyperion (Saturn)', color:'#F5F5F5', diameter:1350, avgOrbitalDistance:125000 },
  Barrakas:  { referenceMoon:'Enceladus (Saturn)',color:'#F0F8FF', diameter:1500, avgOrbitalDistance:144000 },
  Rhaan:     { referenceMoon:'Miranda (Uranus)',  color:'#9AC0FF', diameter:800,  avgOrbitalDistance:168000 },
  Sypheros:  { referenceMoon:'Phobos (Mars)',     color:'#696969', diameter:1100, avgOrbitalDistance:183000 },
  Aryth:     { referenceMoon:'Iapetus (Saturn)',  color:'#FF4500', diameter:1300, avgOrbitalDistance:195000 },
  Vult:      { referenceMoon:'Oberon (Uranus)',   color:'#A9A9A9', diameter:1800, avgOrbitalDistance:252000 }
};

export function _eberronMoonCore(moonName){
  return EBERRON_MOON_CORE_DATA[moonName] || { referenceMoon:'Unknown', color:'#CCCCCC', diameter:1000, avgOrbitalDistance:100000 };
}

export var MOON_SYSTEMS = {
  eberron: {
    id: 'eberron',
    moons: [
      // ── ZARANTYR ── The Storm Moon ─────────────────────────────────
      // Analog: Luna (Earth's Moon). The reference moon — pearly white,
      // moderate eccentricity, wide inclination sweep. Closest and most
      // influential on tides. Kythri = chaos; storms rage when full.
      // Real Luna: ecc 0.0549, inc 5.145°, albedo 0.12.
      { name:'Zarantyr', referenceMoon:_eberronMoonCore('Zarantyr').referenceMoon,  title:'The Storm Moon',    color:_eberronMoonCore('Zarantyr').color, associatedMonth:1,  plane:'Kythri',   dragonmark:'Mark of Storm',
        synodicPeriod:27.32, diameter:_eberronMoonCore('Zarantyr').diameter, distance:_eberronMoonCore('Zarantyr').avgOrbitalDistance,
        inclination:5.145, eccentricity:0.0549, albedo:0.12,
        epochSeed:{ defaultSeed:'kythri', referenceDate:{year:998,month:1,day:1} } },

      // ── OLARUNE ── The Sentinel Moon ───────────────────────────────
      // Analog: Titan (Saturn). The most natural moon — thick atmosphere,
      // methane rain, seasons, lakes. Orange haze hides the surface from
      // view: the sentinel who watches unseen. Low inclination, steady.
      // Real Titan: ecc 0.0288, inc 0.33°, albedo 0.22.
      { name:'Olarune', referenceMoon:_eberronMoonCore('Olarune').referenceMoon,   title:'The Sentinel Moon', color:_eberronMoonCore('Olarune').color, associatedMonth:2,  plane:'Lamannia', dragonmark:'Mark of Sentinel',
        synodicPeriod:30.8052, diameter:_eberronMoonCore('Olarune').diameter, distance:_eberronMoonCore('Olarune').avgOrbitalDistance,
        inclination:0.33, eccentricity:0.0288, albedo:0.22,
        epochSeed:{ defaultSeed:'lamannia', referenceDate:{year:998,month:1,day:1} } },

      // ── THERENDOR ── The Healer's Moon ─────────────────────────────
      // Analog: Europa (Jupiter). Smooth ice shell over a warm subsurface
      // ocean — the healer's calm exterior with life-sustaining depth
      // beneath. Youngest surface of the Galileans: constantly renewed
      // (healing). In 1:2:4 resonance with Ganymede/Nymm → connected
      // to order. Bright reflective ice = gentle healing light.
      // Real Dione: ecc 0.0022, inc 0.03°, albedo 0.99.
      { name:'Therendor', referenceMoon:_eberronMoonCore('Therendor').referenceMoon, title:"The Healer's Moon", color:_eberronMoonCore('Therendor').color, associatedMonth:3,  plane:'Syrania',  dragonmark:'Mark of Healing',
        synodicPeriod:34.7350, diameter:_eberronMoonCore('Therendor').diameter, distance:_eberronMoonCore('Therendor').avgOrbitalDistance,
        inclination:0.03, eccentricity:0.0022, albedo:0.99,
        epochSeed:{ defaultSeed:'syrania', referenceDate:{year:998,month:1,day:1} } },

      // ── EYRE ── The Anvil ──────────────────────────────────────────
      // Analog: Mimas (Saturn). Heavily cratered "Death Star" moon with
      // the giant Herschel crater = a forge mark. Bright icy surface
      // (albedo 0.96) reflects Fernia's fire. In 4:3 resonance with
      // Titan/Olarune → nature feeds the forge.
      // Real Mimas: ecc 0.0196, inc 1.53°, albedo 0.96.
      { name:'Eyre', referenceMoon:_eberronMoonCore('Eyre').referenceMoon,      title:'The Anvil',         color:_eberronMoonCore('Eyre').color, associatedMonth:4,  plane:'Fernia',   dragonmark:'Mark of Making',
        synodicPeriod:39.1661, diameter:_eberronMoonCore('Eyre').diameter, distance:_eberronMoonCore('Eyre').avgOrbitalDistance,
        inclination:1.53, eccentricity:0.0196, albedo:0.96,
        epochSeed:{ defaultSeed:'fernia', referenceDate:{year:998,month:1,day:1} } },

      // ── DRAVAGO ── The Herder's Moon ───────────────────────────────
      // Analog: Triton (Neptune). Retrograde orbit (inc 156.8°) —
      // moves against every other moon, embodying Risia's opposition
      // to natural order. Near-zero eccentricity = frozen stasis.
      // Nitrogen ice surface, high albedo. The herder watches from
      // a crystalline vantage, circling in eternal counter-motion.
      // Largest moon by diameter. Lavender = planar tint over ice.
      // Real Triton: ecc 0.000016, inc 156.8°, albedo 0.76.
      { name:'Dravago', referenceMoon:_eberronMoonCore('Dravago').referenceMoon,   title:"The Herder's Moon", color:_eberronMoonCore('Dravago').color, associatedMonth:5,  plane:'Risia',    dragonmark:'Mark of Handling',
        synodicPeriod:44.1625, diameter:_eberronMoonCore('Dravago').diameter, distance:_eberronMoonCore('Dravago').avgOrbitalDistance,
        inclination:156.8, eccentricity:0.000016, albedo:0.76,
        epochSeed:{ defaultSeed:'risia', referenceDate:{year:998,month:1,day:1} } },

      // ── NYMM ── The Crown ──────────────────────────────────────────
      // Analog: Ganymede (Jupiter). LARGEST moon in the solar system —
      // a crown jewel. The ONLY moon with its own magnetic field:
      // sovereign authority, self-contained order. In perfect 1:2:4
      // Laplace resonance with Europa/Therendor and Io → mathematical
      // perfection = Daanvi. Near-circular orbit, near-equatorial.
      // Gold = Daanvi's planar influence, not geology.
      // Real Ganymede: ecc 0.0013, inc 0.20°, albedo 0.43.
      { name:'Nymm', referenceMoon:_eberronMoonCore('Nymm').referenceMoon,      title:'The Crown',         color:_eberronMoonCore('Nymm').color, associatedMonth:6,  plane:'Daanvi',   dragonmark:'Mark of Hospitality',
        synodicPeriod:49.7962, diameter:_eberronMoonCore('Nymm').diameter, distance:_eberronMoonCore('Nymm').avgOrbitalDistance,
        inclination:0.20, eccentricity:0.0013, albedo:0.43,
        epochSeed:{ defaultSeed:'daanvi', referenceDate:{year:998,month:1,day:1} },
        nodePrecession:{ period:336, navigable:true } },

      // ── LHARVION ── The Eye ────────────────────────────────────────
      // Analog: Hyperion (Saturn). The ONLY confirmed chaotic tumbler
      // in the solar system — never shows the same face twice. Sponge-
      // like surface pocked with deep craters. Unpredictable rotation
      // embodies Xoriat's madness. Moderate eccentricity (0.123) gives
      // noticeable brightness variation. Dark, low albedo.
      // Dull white with 750-mile black chasm → the Eye.
      // Real Hyperion: ecc 0.1230, inc 0.43°, albedo 0.30.
      { name:'Lharvion', referenceMoon:_eberronMoonCore('Lharvion').referenceMoon,  title:'The Eye',           color:_eberronMoonCore('Lharvion').color, associatedMonth:7,  plane:'Xoriat',   dragonmark:'Mark of Detection',
        synodicPeriod:56.1487, diameter:_eberronMoonCore('Lharvion').diameter, distance:_eberronMoonCore('Lharvion').avgOrbitalDistance,
        inclination:0.43, eccentricity:0.1230, albedo:0.30,
        epochSeed:{ defaultSeed:'xoriat', referenceDate:{year:998,month:1,day:1} } },

      // ── BARRAKAS ── The Lantern ────────────────────────────────────
      // Analog: Enceladus (Saturn). THE brightest body in the solar
      // system — geometric albedo 1.375 (backscattering from pure ice
      // exceeds a flat-disk model). Ice geysers feed Saturn's E-ring.
      // Near-equatorial orbit lights all latitudes equally. The Lantern
      // of Irian needs no magical amplification: real physics already
      // gives it supernatural brightness. Slight ecc for gentle pulsing.
      // Real Enceladus: ecc 0.0047, inc 0.02°, albedo 1.375.
      { name:'Barrakas', referenceMoon:_eberronMoonCore('Barrakas').referenceMoon,  title:'The Lantern',       color:_eberronMoonCore('Barrakas').color, associatedMonth:8,  plane:'Irian',    dragonmark:'Mark of Finding',
        synodicPeriod:63.3115, diameter:_eberronMoonCore('Barrakas').diameter, distance:_eberronMoonCore('Barrakas').avgOrbitalDistance,
        inclination:0.02, eccentricity:0.0047, albedo:1.375,
        epochSeed:{ defaultSeed:'irian', referenceDate:{year:998,month:1,day:1} } },

      // ── RHAAN ── The Book ──────────────────────────────────────────
      // Analog: Miranda (Uranus). The "Frankenstein moon" — shattered
      // and reassembled, its patchwork surface looks like pages from
      // different books stitched together. Three coronae with chevron
      // patterns. Verona Rupes = tallest cliff in the solar system.
      // Named after Shakespeare's Tempest character — the only HUMAN
      // among Uranus's fairy-named moons. Once tumbled chaotically
      // (like Hyperion) during a past 3:1 resonance with Umbriel, but
      // now calm: stories of violence written on a peaceful face.
      // Orbits a sideways planet → extreme seasonal illumination.
      // Smallest Eberron moon. Blue = Thelanis fey light through
      // ancient stone. The Book carries every story on its skin.
      // Real Miranda: ecc 0.0013, inc 4.34°, albedo 0.32.
      { name:'Rhaan', referenceMoon:_eberronMoonCore('Rhaan').referenceMoon,     title:'The Book',          color:_eberronMoonCore('Rhaan').color, associatedMonth:9,  plane:'Thelanis', dragonmark:'Mark of Scribing',
        synodicPeriod:71.3881, diameter:_eberronMoonCore('Rhaan').diameter, distance:_eberronMoonCore('Rhaan').avgOrbitalDistance,
        inclination:4.34, eccentricity:0.0013, albedo:0.32,
        epochSeed:{ defaultSeed:'thelanis', referenceDate:{year:998,month:1,day:1} } },

      // ── SYPHEROS ── The Shadow ─────────────────────────────────────
      // Analog: Phobos (Mars). The closest and fastest martian moon —
      // dark, small, and named for fear itself. Its tidally decaying
      // orbit suggests a body already being consumed, which fits Mabar's
      // entropy. Low-inclination prograde orbit, modest eccentricity,
      // and very dark albedo keep it ominous without making it backward.
      // Real Phobos: ecc 0.0151, inc 1.08°, albedo 0.071.
      { name:'Sypheros', referenceMoon:_eberronMoonCore('Sypheros').referenceMoon,  title:'The Shadow',        color:_eberronMoonCore('Sypheros').color, associatedMonth:10, plane:'Mabar',     dragonmark:'Mark of Shadow',
        synodicPeriod:80.4950, diameter:_eberronMoonCore('Sypheros').diameter, distance:_eberronMoonCore('Sypheros').avgOrbitalDistance,
        inclination:1.08, eccentricity:0.0151, albedo:0.071 },

      // ── ARYTH ── The Gateway ───────────────────────────────────────
      // Analog: Iapetus (Saturn). THE two-tone moon — leading hemisphere
      // coal-black (albedo 0.05), trailing hemisphere bright (0.50).
      // A literal gateway between light and dark, life and death.
      // 13km equatorial ridge = a threshold between realms. HIGHEST
      // inclination of any regular Saturnian moon (7.57°) → sees both
      // extremes of the sky. Walnut-shaped. Dark reddish-brown leading
      // side matches #FF4500 burnt orange-red. Coated in dark material
      // shed by Sypheros: the Shadow marks the Gateway.
      // Real Iapetus: ecc 0.0283, inc 7.57°, albedo 0.275 (averaged; not tidally locked, both faces visible).
      { name:'Aryth', referenceMoon:_eberronMoonCore('Aryth').referenceMoon,     title:'The Gateway',       color:_eberronMoonCore('Aryth').color, associatedMonth:11, plane:'Dolurrh',   dragonmark:'Mark of Passage',
        synodicPeriod:90.7637, diameter:_eberronMoonCore('Aryth').diameter, distance:_eberronMoonCore('Aryth').avgOrbitalDistance,
        inclination:7.57, eccentricity:0.0283, albedo:0.275,
        epochSeed:{ defaultSeed:'dolurrh', referenceDate:{year:998,month:1,day:1} } },

      // ── VULT ── The Warding Moon ───────────────────────────────────
      // Analog: Oberon (Uranus). Outermost major Uranian moon — the
      // outer ward. Heavily cratered from endless bombardment = scars
      // of eternal war (Shavarath). Dark deposits fill crater floors.
      // An 11km mountain = fortress on the frontier. Named for
      // Shakespeare's fairy king in A Midsummer Night's Dream: the
      // warrior-king who holds the line. Near-circular, near-equatorial
      // = disciplined, unwavering patrol. Gray with reddish tint.
      // Real Oberon: ecc 0.0014, inc 0.07°, albedo 0.23.
      { name:'Vult', referenceMoon:_eberronMoonCore('Vult').referenceMoon,      title:'The Warding Moon',  color:_eberronMoonCore('Vult').color, associatedMonth:12, plane:'Shavarath', dragonmark:'Mark of Warding',
        synodicPeriod:102.3424, diameter:_eberronMoonCore('Vult').diameter, distance:_eberronMoonCore('Vult').avgOrbitalDistance,
        inclination:0.07, eccentricity:0.0014, albedo:0.23,
        epochSeed:{ defaultSeed:'shavarath', referenceDate:{year:998,month:1,day:1} } }
    ]
  },

  // =========================================================================
  // FAERUNIAN — Selûne (single moon of Toril)
  // =========================================================================
  // Selûne: full at midnight Hammer 1, 1372 DR. 30.4375-day period.
  // 48 synodic cycles = 1461 days = exactly 4 Harptos years (incl. Shieldmeet).
  // Phase is perfectly self-resetting on the four-year leap cycle.
  // ~2000 miles diameter, ~183,000 miles distance. Similar apparent size to Earth's moon.
  // Bright enough to cast pale shadows. Associated with lycanthropy, navigation, tides.
  // Trailed by the Tears of Selûne (asteroid cluster, visible flavor).
  faerunian: {
    id: 'faerunian',
    name: 'Toril',
    description: "Selûne, the silver moon of Toril. 30.4375-day cycle aligned to the Harptos leap year.",
    moons: [
      { name:'Selûne', title:'The Moonmaiden', color:'#C8D8F0', associatedMonth:null,
        synodicPeriod:30.4375, diameter:2000, distance:183000,
        inclination:5.1, eccentricity:0.054, albedo:0.25,
        epochSeed:{ defaultSeed:'selune', referenceDate:{year:1372,month:1,day:1} },
        loreNote:'Full at midnight Hammer 1, 1372 DR. Trailed by the Tears of Selûne. Associated with lycanthropy, divination, navigation, and tides.',
        deity:'Selûne' }
    ]
  },

  // =========================================================================
  // GREGORIAN — Luna (Earth's moon)
  // =========================================================================
  // Standard astronomical reference. Synodic period 29.53059 days.
  // Anchor: full moon on January 28, 2021 (a known astronomical full moon).
  // Albedo 0.12, diameter 2159 miles, distance 238855 miles.
  gregorian: {
    id: 'gregorian',
    name: 'Earth',
    description: "Luna, Earth's moon. Standard synodic period 29.53059 days.",
    moons: [
      { name:'Luna', title:'The Moon', color:'#DCDCDC', associatedMonth:null,
        synodicPeriod:29.53059, diameter:2159, distance:238855,
        inclination:5.14, eccentricity:0.0549, albedo:0.12,
        epochSeed:{ defaultSeed:'luna', referenceDate:{year:2021,month:1,day:28} },
        loreNote:'Earth\'s natural satellite. Synodic period 29.53 days. Governs tides and has inspired mythology across all human cultures.' }
    ]
  }
};

// ---------------------------------------------------------------------------
// 20a-ii) Moon lore — short blurbs for player reference
// ---------------------------------------------------------------------------
// Derived from Keith Baker's Dragonshards article on the moons of Eberron.
// Accessible via !cal moon lore [name] — whispered to the querier.

export var MOON_LORE = {
  Zarantyr: {
    blurb: "The Storm Moon is the closest and largest moon in the sky. It appears to shift in color, and storms are said to be fiercer when Zarantyr is full. Associated with Kythri, the Churning Chaos, and the Mark of Storm borne by House Lyrandar.",
    orbit: "Closest moon. ~27-day cycle. Analog: Luna. Moderate eccentricity with wide inclination sweep — storms rage when Zarantyr is full."
  },
  Olarune: {
    blurb: "The Sentinel Moon glows with a warm amber light. Druids and rangers watch Olarune closely, as its phases are tied to the rhythms of the natural world. Associated with Lamannia, the Twilight Forest, and the Mark of Sentinel borne by House Deneith.",
    orbit: "Second closest. ~31-day cycle. Analog: Titan. Low inclination, steady orbit — the sentinel watches from behind an orange haze."
  },
  Therendor: {
    blurb: "The Healer's Moon shines with a soft silver light. Healers and midwives track its phases, and some hospitals time treatments to its cycle. Associated with Syrania, the Azure Sky, and the Mark of Healing borne by House Jorasco.",
    orbit: "Third orbit. ~35-day cycle. Analog: Europa. Gentle, bright, and reliable — the healer's calm exterior hides depth beneath."
  },
  Eyre: {
    blurb: "The Anvil gleams like heated steel. Artificers and smiths consider it auspicious to begin major works when Eyre is full. Its brightness visibly pulses as it speeds and slows in its eccentric orbit — like a forge breathing through bellows. Associated with Fernia, the Sea of Fire, and the Mark of Making borne by House Cannith.",
    orbit: "Fourth orbit. ~39-day cycle. Analog: Hyperion. Highest eccentricity of the regular moons — brightness swings ~56% from near to far. Chaotic tumbler: never shows the same face twice."
  },
  Dravago: {
    blurb: "The Herder's Moon is the largest moon by diameter, though its great distance makes it appear modest. Farmers and herders watch it for seasonal guidance. Its orbit is the most perfectly circular of all twelve moons — an unchanging, frozen path. Associated with Risia, the Plain of Ice, and the Mark of Handling borne by House Vadalis.",
    orbit: "Fifth orbit. ~44-day cycle. Analog: Tethys. The most circular orbit of any moon — near-zero eccentricity. Pure ice, extremely bright. Frozen stillness."
  },
  Nymm: {
    blurb: "The Crown shines with a golden light. It is considered the most auspicious moon for celebrations, feasts, and acts of hospitality. It is the only moon with its own sovereign authority — an invisible shield that answers to no other. Associated with Daanvi, the Perfect Order, and the Mark of Hospitality borne by House Ghallanda.",
    orbit: "Sixth orbit. Roughly 50-day cycle — steadier than most, but not perfectly fixed. Analog: Ganymede. Near-perfect circle, near-equatorial. In mathematical resonance with Therendor and Eyre."
  },
  Lharvion: {
    blurb: "The Eye is the most unsettling moon. It sometimes appears to move backward, and its phases do not follow any predictable pattern. Its orbit is the most extreme of any moon — swinging from terrifyingly close and bright to nearly vanishing at the edge of sight. Seers and inquisitives study it, but few claim to understand it. Associated with Xoriat, the Realm of Madness, and the Mark of Detection borne by House Medani.",
    orbit: "Seventh orbit. Nominally ~56-day cycle, but truly erratic. Analog: Nereid. Most eccentric orbit of any known moon — 7x distance swing. Backward motion, sudden jumps, and doubled phases have all been recorded."
  },
  Barrakas: {
    blurb: "The Lantern glows with a steady pale light brighter than any other moon — brighter, in fact, than physics should allow, reflecting more light than falls upon it. Travelers and explorers consider it a guide, and it is said that those who search by the light of Barrakas will find what they seek. Associated with Irian, the Eternal Dawn, and the Mark of Finding borne by House Tharashk.",
    orbit: "Eighth orbit. ~63-day cycle. Analog: Enceladus. Brightest body in the sky — geometric albedo exceeds 1.0. Near-equatorial orbit lights all latitudes equally."
  },
  Rhaan: {
    blurb: "The Book shines with a blue-white light. Scholars and scribes hold it sacred, and the greatest works of literature are said to have been composed under its light. Its surface is a patchwork of mismatched terrain — as if pages from different books were stitched together. A great cliff, the tallest in all the heavens, marks where one story ends and another begins. Associated with Thelanis, the Faerie Court, and the Mark of Scribing borne by House Sivis.",
    orbit: "Ninth orbit. ~71-day cycle. Analog: Miranda. Nearly circular now, but once tumbled chaotically — every story of that violent past is written on its scarred face. Named for a character in a play."
  },
  Sypheros: {
    blurb: "The Shadow is a dark, dim moon that is difficult to see even when full. It is associated with secrets, espionage, and hidden knowledge. It circles low and close, like a moon already being pulled toward ruin, and the dark material that stains the Gateway's face is shed by the Shadow. Associated with Mabar, the Endless Night, and the Mark of Shadow borne by House Phiarlan and House Thuranni.",
    orbit: "Tenth orbit. ~80-day cycle. Analog: Phobos. Low-inclination prograde orbit, modest eccentricity, coal-dark albedo. Source of darkness coating Aryth."
  },
  Aryth: {
    blurb: "The Gateway burns with a deep orange-red light. It is associated with death, transition, and passage between worlds. One face is coal-black, the other bright — a literal threshold between light and darkness. A great ridge circles its equator like a doorframe between realms. The Aereni elves track Aryth closely, and funeral rites are often timed to its phases. Associated with Dolurrh, the Realm of the Dead, and the Mark of Passage borne by House Orien.",
    orbit: "Eleventh orbit. ~91-day cycle. Analog: Iapetus. Two-tone surface (dark leading, bright trailing). Highest inclination of regular moons (7.57°) — sees both extremes."
  },
  Vult: {
    blurb: "The Warding Moon is the farthest and slowest of the twelve moons. It is associated with protection and defense, and its full moons are considered times of safety. Its surface bears the scars of endless bombardment — every crater a battle fought and survived. A great mountain rises from its surface like a fortress on the frontier. During Long Shadows, when Mabar is coterminous, even Vult's protective light may be swallowed by darkness. Associated with Shavarath, the Battleground, and the Mark of Warding borne by House Kundarak.",
    orbit: "Outermost orbit. ~102-day cycle. Analog: Oberon. Near-perfect circle, near-equatorial — disciplined, unwavering patrol. Named for a warrior-king. Its light is a ward against darkness."
  }
};

export function _moonLoreHtml(moonName){
  var lore = MOON_LORE[moonName];
  if (!lore) return null;
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  var moon = null;
  if (sys && sys.moons){
    for (var i = 0; i < sys.moons.length; i++){
      if (sys.moons[i].name === moonName){ moon = sys.moons[i]; break; }
    }
  }
  if (!moon) return null;

  var dot = '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;'+
    'background:'+esc(moon.color||'#aaa')+';border:1px solid rgba(0,0,0,.3);'+
    'vertical-align:middle;margin-right:5px;"></span>';

  var html = dot + '<b style="font-size:1.1em;">' + esc(moon.name) + '</b>' +
    '<br><br>' + esc(lore.blurb) +
    '<br><br><b>Orbit:</b> ' + esc(lore.orbit);

  if (moon.dragonmark){
    html += '<br><b>Dragonmark:</b> ' + esc(moon.dragonmark);
  }

  return _menuBox('🌙 ' + esc(moon.name), html);
}

// Ring of Siberys lore panel
export function _siberysLoreHtml(){
  var r = RING_OF_SIBERYS;
  var eberronRadiusKm = 6400;
  var innerHeightKm = Math.max(0, r.innerEdge_km - eberronRadiusKm);
  var outerHeightKm = Math.max(0, r.outerEdge_km - eberronRadiusKm);
  var html = '<b style="font-size:1.1em;">The Ring of Siberys</b>' +
    ' — <i>The Blood of the Dragon Above</i>' +
    '<br><br>An equatorial ring of siberys dragonshards encircling Eberron, ' +
    'believed by sages at Arcanix to be the source of all arcane magic. ' +
    'Siberys shards that fall from the Ring are the rarest and most valuable ' +
    'dragonshards, used for dragonmark focus items and legendary artifacts.' +
    '<br><br><b>Analog:</b> ' + esc(r.analog) +
    '<br><b>Width:</b> ' + r.width_km.toLocaleString() + ' km' +
    '<br><b>Thickness:</b> ' + r.thickness_m + ' meters' +
    '<br><b>Orbit:</b> ' + r.innerEdge_km.toLocaleString() + ' – ' +
      r.outerEdge_km.toLocaleString() + ' km (inside Zarantyr at 14,300 km)' +
    '<br><b>Inclination:</b> ' + r.inclination + '° (equatorial)' +
    '<br><b>Height Above Surface:</b> ' + innerHeightKm.toLocaleString() + ' – ' +
      outerHeightKm.toLocaleString() + ' km' +
    '<br><b>Albedo:</b> ' + r.albedo +
    '<br><b>Night-light Contribution:</b> ~0.008 lux from the ring alone (~0.010 lux ambient with starlight)' +
    '<br><br><b>Appearance:</b>' +
    '<br>&nbsp;&nbsp;Day: ' + esc(r.appearance.daylight) +
    '<br>&nbsp;&nbsp;Night: ' + esc(r.appearance.night) +
    '<br>&nbsp;&nbsp;Equator: ' + esc(r.appearance.equator) +
    '<br>&nbsp;&nbsp;Poles: ' + esc(r.appearance.poles) +
    '<br><br><b>Scale Notes:</b> inner edge sits above ISS-like orbital height; outer edge stretches well past the edge of a typical low-orbit band.';
  html += '<br><br>';
  for (var fi = 0; fi < r.facts.length; fi++){
    html += '<div style="font-size:.85em;opacity:.7;margin:2px 0;">• ' + esc(r.facts[fi]) + '</div>';
  }
  return _menuBox('💎 Ring of Siberys', html);
}

// ---------------------------------------------------------------------------
// 20b) State helpers
// ---------------------------------------------------------------------------

export function getMoonState(){
  var root = state[state_name];
  if (!root.moons) root.moons = {
    sequences: {},     // moonName -> array of { serial, type, retro }
    seeds: {},         // legacy moonName -> override seed string
    systemSeed: null,  // single global seed word for the entire lunar system
    gmAnchors: {},     // moonName -> [{ serial, type }]  GM-forced phase events
    generatedFrom: null,  // serial day from which sequences were generated
    generatedThru: 0,  // serial day up to which sequences have been generated
    revealTier: 'medium',  // 'low' | 'medium' | 'high'
    revealHorizonDays: 7    // player-known horizon window
  };
  var ms = root.moons;
  if (!ms.gmAnchors) ms.gmAnchors = {};
  if (ms.systemSeed === undefined) ms.systemSeed = null;
  if (!isFinite(ms.generatedFrom)) ms.generatedFrom = null;
  if (!ms.revealTier) ms.revealTier = 'medium';
  ms.revealTier = String(ms.revealTier || '').toLowerCase();
  if (!MOON_REVEAL_TIERS[ms.revealTier]) ms.revealTier = 'medium';
  ms.revealHorizonDays = parseInt(ms.revealHorizonDays, 10);
  if (!isFinite(ms.revealHorizonDays) || ms.revealHorizonDays < 7) ms.revealHorizonDays = 7;
  return ms;
}

export function _moonHashStr(str){
  // String -> deterministic float 0..1
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return h / 4294967296;
}

// Seeded dice roller — deterministic from serial + salt string.
// Returns 1..sides (inclusive). Recognizably D&D: d4, d6, d8, d10, d12, d20, d100.
export function _dN(serial, salt, sides){
  var h = 0x811c9dc5;
  var str = String(serial) + ':' + salt;
  for (var i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = (Math.imul(h, 0x01000193)) >>> 0;
  }
  return 1 + (h % sides);
}

// ---------------------------------------------------------------------------
// 20b-ii) Festival soft anchors — decouple events from specific moons
// ---------------------------------------------------------------------------
// Each festival has a target date and phase. If any moon naturally has a
// matching event within 1 day of that date, a d6 is rolled — on 6, the
// event shifts to land exactly on the festival day's noon. If nothing is within
// 1 day, nothing happens. No moon is favored over another.

export var FESTIVAL_SOFT_ANCHORS = [
  { event:'Crystalfall',       type:'full', month:2,  day:9,  salt:'crystalfall' },
  { event:"Sun's Blessing",    type:'full', month:3,  day:15, salt:'suns_blessing' },
  { event:"Onatar's Flame",    type:'full', month:1,  day:7,  salt:'onatars_flame' },
  { event:"Bounty's Blessing", type:'full', month:7,  day:14, salt:'bountys_blessing' },
  { event:'Brightblade',       type:'full', month:6,  day:12, salt:'brightblade' },
  { event:'The Hunt',          type:'full', month:8,  day:4,  salt:'the_hunt' },
  { event:"Aureon's Crown",    type:'full', month:5,  day:26, salt:'aureons_crown' },
  { event:"Boldrei's Feast",   type:'full', month:9,  day:9,  salt:'boldreis_feast' },
  { event:'Thronehold',        type:'full', month:11, day:11, salt:'thronehold' }
];

// ---------------------------------------------------------------------------
// 20c) Year / serial helpers
// ---------------------------------------------------------------------------

export var MOON_PRE_GENERATE_YEARS = 2;
export var MOON_PREDICTION_LIMITS = {
  // Low: only surface phases obvious in the immediate sky.
  lowDays: 2,
  // Medium: exact within the chosen horizon. Max reach = 10 months.
  mediumMaxDays: 280,
  // High: full knowledge. Max reach = 2 years (pre-generation window).
  highMaxDays: 672
};

// Preset reveal buttons: 1m, 3m, 6m, 10m (in 28-day months, inclusive of today)
// Each maps to days. DC hints for the GM.
export var MOON_REVEAL_PRESETS = [
  { label:'1m',  days:28,  dc:'DC 10' },
  { label:'3m',  days:84,  dc:'DC 15' },
  { label:'6m',  days:168, dc:'DC 20' },
  { label:'10m', days:280, dc:'DC 25' }
];

// Legacy range options (still parsed for CLI input)
export var MOON_REVEAL_RANGE_OPTIONS = {
  '1w': 7, '2w': 14, '4w': 28, '1m': 28,
  '3m': 84, '6m': 168, '10m': 280
};

export function _parseMoonRevealRange(token, tier){
  tier = _normalizeMoonRevealTier(tier);
  var maxAllowed = (tier === 'high') ? MOON_PREDICTION_LIMITS.highMaxDays
    : (tier === 'medium') ? MOON_PREDICTION_LIMITS.mediumMaxDays
    : MOON_PREDICTION_LIMITS.lowDays;
  var t = String(token || '').toLowerCase().trim();

  // Default if no token given
  if (!t){
    if (tier === 'low')    return MOON_PREDICTION_LIMITS.lowDays;
    if (tier === 'medium') return 28;  // 1 month default
    return 84;                          // high default: 3 months
  }

  // Named range options
  if (MOON_REVEAL_RANGE_OPTIONS[t]) return Math.min(maxAllowed, MOON_REVEAL_RANGE_OPTIONS[t]);

  // Day suffix: "28d" or "56d"
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

export function _rangeLabel(days){
  days = parseInt(days, 10) || 0;
  if (days === 7) return '1 week';
  if (days === 28) return '1 month';
  if (days === 84) return '3 months';
  if (days === 168) return '6 months';
  if (days === 280) return '10 months';
  if (days % 28 === 0) return (days / 28) + ' months';
  return days + ' days';
}

export function _moonYearDays(){
  return getCal().months.reduce(function(s, m){ return s + (m.days|0); }, 0);
}

// _moonAnchorBaseSerial and _nearestAnchorSerial removed — all moons now use
// epochSeed. GM hard anchors use gmAnchors path in moonEnsureSequences.

// ---------------------------------------------------------------------------
// 20d) Phase helper serials
// ---------------------------------------------------------------------------

export function _serialDayMidpoint(serial){
  return Math.floor(serial) + 0.5;
}

export function _solarTransitionSerial(serial, transition){
  var solar = solarProfileForSerial(serial);
  if (!solar) return Math.floor(serial);
  var hour = (transition === 'sunset') ? solar.sunset : solar.sunrise;
  return Math.floor(serial) + (hour / 24);
}

export function _edgeDayMidpointSerial(startSerial, endSerial, referenceSerial){
  var startMid = _serialDayMidpoint(startSerial);
  var endMid   = _serialDayMidpoint(endSerial);
  return (Math.abs(referenceSerial - startMid) <= Math.abs(referenceSerial - endMid))
    ? startMid
    : endMid;
}

export function _phaseWindowDistance(serial, windowStart, windowEndExclusive){
  if (serial < windowStart) return windowStart - serial;
  if (serial >= windowEndExclusive) return serial - windowEndExclusive;
  return 0;
}

export function _isFullMoonIllum(illum){
  return illum >= MOON_FULL_THRESHOLD;
}

export function _isNewMoonIllum(illum){
  return illum <= MOON_NEW_THRESHOLD;
}

// ---------------------------------------------------------------------------
// 20d-ii) Festival soft nudge application
// ---------------------------------------------------------------------------
// For each festival, checks if ANY moon naturally has its target event within
// 1 day of the festival's noon target. If so, rolls d6 — only on 6, shifts
// that moon's event to land exactly at midday. Simple, clean, no overreach.

export function _applyFestivalNudges(moons, ms, genFrom, genThru){
  var calStart = fromSerial(genFrom);
  var calEnd   = fromSerial(genThru);
  for (var yr = calStart.year; yr <= calEnd.year; yr++){
    for (var fi = 0; fi < FESTIVAL_SOFT_ANCHORS.length; fi++){
      var fest = FESTIVAL_SOFT_ANCHORS[fi];
      var festSerial = toSerial(yr, (fest.month|0) - 1, fest.day|0);
      var festTarget = _serialDayMidpoint(festSerial);
      if (festSerial < genFrom || festSerial > genThru) continue;

      // Roll d6: nudge only on 6 (16.7%)
      if (_dN(festSerial, fest.salt + '_nudge', 6) !== 6) continue;

      // Find any moon with a natural event within 1 day of the festival
      var bestMoon = null, bestIdx = -1, bestDist = Infinity;
      for (var mi = 0; mi < moons.length; mi++){
        var seq = ms.sequences[moons[mi].name];
        if (!seq) continue;
        for (var si = 0; si < seq.length; si++){
          if (seq[si].type !== fest.type) continue;
          if (seq[si].gmForced) continue;
          var dist = Math.abs(seq[si].serial - festTarget);
          if (dist <= 1 && dist < bestDist){
            bestDist = dist;
            bestMoon = moons[mi].name;
            bestIdx = si;
          }
        }
      }

      // Smooth to exact festival noon over prior cycles
      if (bestMoon && bestIdx >= 0){
        var bestSeq = ms.sequences[bestMoon];
        _smoothToTarget(bestSeq, bestIdx, festTarget, 7);
        bestSeq[bestIdx].festivalNudge = fest.event;
        bestSeq.sort(function(a, b){ return a.serial - b.serial; });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 20d-iii) Weak anti-phase coupling
// ---------------------------------------------------------------------------
// Soft statistical nudge between two moons: move moonB slightly toward a
// preferred opposite-phase angle with moonA. For the Therendor/Barrakas
// pairing, the lore-significant angle is "Therendor full while Barrakas is
// new". We model that as a weak restoring pull on Barrakas's cycle toward the
// nearest Therendor full, capped so it stays a tendency rather than a lock.

export var MOON_ANTI_PHASE_COUPLING_GAIN = 0.2;
export var MOON_ANTI_PHASE_COUPLING_MAX_SHIFT_DAYS = 1.0;

function _nearestPhaseEvent(seq, type, targetSerial){
  var best = null;
  var bestDist = Infinity;
  for (var i = 0; i < seq.length; i++){
    if (seq[i].type !== type) continue;
    var dist = Math.abs(seq[i].serial - targetSerial);
    if (dist < bestDist){
      best = seq[i];
      bestDist = dist;
    }
  }
  return best;
}

export function _applyAntiPhaseCoupling(ms, moonAName, moonBName, genFrom, genThru){
  var seqA = ms.sequences[moonAName];
  var seqB = ms.sequences[moonBName];
  if (!seqA || !seqB) return;

  for (var bi = 0; bi < seqB.length; bi++){
    var fullB = seqB[bi];
    if (fullB.type !== 'full') continue;

    var newIdx = null;
    for (var ni = bi + 1; ni < seqB.length; ni++){
      if (seqB[ni].type === 'new'){
        newIdx = ni;
        break;
      }
    }
    if (newIdx === null) continue;

    var newB = seqB[newIdx];
    if (fullB.gmForced || fullB.festivalNudge || newB.gmForced || newB.festivalNudge) continue;
    if ((fullB.serial < genFrom && newB.serial < genFrom) || (fullB.serial > genThru && newB.serial > genThru)) continue;

    var nearFullA = _nearestPhaseEvent(seqA, 'full', newB.serial);
    if (nearFullA){
      var phaseError = nearFullA.serial - newB.serial;
      var shift = phaseError * MOON_ANTI_PHASE_COUPLING_GAIN;
      if (shift > MOON_ANTI_PHASE_COUPLING_MAX_SHIFT_DAYS) shift = MOON_ANTI_PHASE_COUPLING_MAX_SHIFT_DAYS;
      if (shift < -MOON_ANTI_PHASE_COUPLING_MAX_SHIFT_DAYS) shift = -MOON_ANTI_PHASE_COUPLING_MAX_SHIFT_DAYS;
      if (Math.abs(shift) < 0.05) continue;

      // Shift the whole Barrakas cycle together so event labels and the
      // illumination curve keep telling the same phase story.
      fullB.serial += shift;
      newB.serial += shift;
      fullB.antiPhaseCoupled = true;
      newB.antiPhaseCoupled = true;
      bi = newIdx;
    }
  }

  seqB.sort(function(a, b){ return a.serial - b.serial; });
}

export function _collectPlanarPhaseWindows(planeName, phaseName, genFrom, genThru){
  var windows = [];
  var runStart = null;
  var scanFrom = Math.floor(genFrom);
  var scanThru = Math.ceil(genThru) + 1;

  for (var serial = scanFrom; serial <= scanThru; serial++){
    var state = getPlanarState(planeName, serial, { ignoreGenerated: true });
    var active = !!(state && state.phase === phaseName);
    if (active && runStart === null){
      runStart = serial;
    } else if (!active && runStart !== null){
      windows.push({ startSerial: runStart, endSerial: serial - 1 });
      runStart = null;
    }
  }

  if (runStart !== null){
    windows.push({ startSerial: runStart, endSerial: scanThru - 1 });
  }
  return windows;
}

function _windowHasExactPhase(seq, type, windowStart, windowEndExclusive){
  for (var i = 0; i < seq.length; i++){
    if (seq[i].type !== type) continue;
    if (seq[i].serial >= windowStart && seq[i].serial < windowEndExclusive) return true;
  }
  return false;
}

function _nearestMutablePhaseForWindow(seq, type, windowStart, windowEndExclusive){
  var bestIdx = null;
  var bestDist = Infinity;
  for (var i = 0; i < seq.length; i++){
    if (seq[i].type !== type) continue;
    if (seq[i].gmForced) continue;
    var dist = _phaseWindowDistance(seq[i].serial, windowStart, windowEndExclusive);
    if (dist < bestDist){
      bestIdx = i;
      bestDist = dist;
    }
  }
  return bestIdx;
}

export function _applyAssociatedPlanePhaseShifts(moons, ms, genFrom, genThru){
  var pulls = [
    { type:'full', phase:'coterminous' },
    { type:'new',  phase:'remote' }
  ];

  for (var mi = 0; mi < moons.length; mi++){
    var moon = moons[mi];
    if (!moon || !moon.plane) continue;
    var seq = ms.sequences[moon.name];
    if (!seq || !seq.length) continue;

    for (var pi = 0; pi < pulls.length; pi++){
      var pull = pulls[pi];
      var windows = _collectPlanarPhaseWindows(moon.plane, pull.phase, genFrom, genThru);
      for (var wi = 0; wi < windows.length; wi++){
        var window = windows[wi];
        var windowStart = window.startSerial;
        var windowEndExclusive = window.endSerial + 1;
        if (_windowHasExactPhase(seq, pull.type, windowStart, windowEndExclusive)) continue;

        var nearestIdx = _nearestMutablePhaseForWindow(seq, pull.type, windowStart, windowEndExclusive);
        if (nearestIdx === null) continue;

        var targetSerial = _edgeDayMidpointSerial(window.startSerial, window.endSerial, seq[nearestIdx].serial);
        _smoothToTarget(seq, nearestIdx, targetSerial, 7);
        seq[nearestIdx].planarPhaseShift = moon.plane + ':' + pull.phase;
      }
    }

    seq.sort(function(a, b){ return a.serial - b.serial; });
  }
}

// ---------------------------------------------------------------------------
// 20e) Standard sequence generation (all moons except Lharvion)
// ---------------------------------------------------------------------------

export function _generateStandardSequence(moon, startSerial, endSerial, seedOverride){
  var period = moon.synodicPeriod;
  var events = [];

  // Determine epoch: serial of a known full moon to start counting from.
  // All moons now use epochSeed for their starting point.
  var epochSerial;
  if (moon.epochSeed){
    var seedWord  = seedOverride || (moon.epochSeed.defaultSeed) || 'storm';
    var refD      = moon.epochSeed.referenceDate;
    var refSerial = toSerial(refD.year, refD.month - 1, refD.day);
    epochSerial   = refSerial - _moonHashStr(seedWord) * period;
  } else {
    // Fallback: use start of generation window
    epochSerial = startSerial;
  }

  // Rewind epochSerial backward to just before startSerial.
  var cur = epochSerial;

  if (cur > startSerial){
    var approxCyclesBack = Math.ceil((cur - startSerial) / period) + 2;
    cur -= approxCyclesBack * period;
  }

  var MAX_REWIND = 2000;
  while (cur + period < startSerial - period && MAX_REWIND-- > 0){
    cur += period;
  }

  var MAX_FWD = 800;
  while (cur <= endSerial && MAX_FWD-- > 0){
    var fullS = cur;
    var newS  = cur + period * 0.5;
    if (fullS >= startSerial && fullS <= endSerial)
      events.push({ serial:fullS, type:'full', retro:false });
    if (newS  >= startSerial && newS  <= endSerial)
      events.push({ serial:newS,  type:'new',  retro:false });
    cur += period;
  }

  return events;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// 20g-iii) Multi-cycle smoothing for forced moon events
// ---------------------------------------------------------------------------
// When a moon event needs to land on a specific serial (GM anchor, Long
// Shadows, festival nudge), we don't teleport it — we redistribute the
// offset across the preceding N events of the same type so the moon
// appears to drift naturally toward the target date.
//
// Algorithm: given the target event at index targetIdx in the sequence,
// and the desired serial targetSerial, compute the total offset
// (targetSerial - seq[targetIdx].serial). Distribute this across the
// prior smoothingCycles events using triangular weighting: the cycle
// closest to the target absorbs the most, the one furthest absorbs the
// least. Each event shifts by weight_i / sum(weights) * totalOffset.
// The target event itself lands exactly on targetSerial.

export function _smoothToTarget(seq, targetIdx, targetSerial, smoothingCycles){
  smoothingCycles = Math.max(1, smoothingCycles|0) || 7;
  var totalOffset = targetSerial - seq[targetIdx].serial;
  if (Math.abs(totalOffset) < 0.5){
    // Already close enough — just set it exactly
    seq[targetIdx].serial = targetSerial;
    return;
  }

  var targetType = seq[targetIdx].type;

  // Collect prior events of the same type
  var priorIndices = [];
  for (var i = targetIdx - 1; i >= 0 && priorIndices.length < smoothingCycles; i--){
    if (seq[i].type === targetType && !seq[i].gmForced) priorIndices.push(i);
  }

  // Build triangular weights: closest to target = highest weight
  // priorIndices[0] is the one just before target (gets most weight)
  var weights = [];
  var sumW = 0;
  for (var w = 0; w < priorIndices.length; w++){
    var weight = priorIndices.length - w; // N, N-1, ..., 1
    weights.push(weight);
    sumW += weight;
  }
  // The target itself also gets weight (N+1) — but we force it exactly,
  // so we only use the weights for the priors.
  // Total offset distributed: prior events get fraction of the shift,
  // the remainder goes to the target.
  var priorShare = sumW / (sumW + priorIndices.length + 1);
  var priorOffset = totalOffset * priorShare;

  // Apply shifts to prior events
  for (var p = 0; p < priorIndices.length; p++){
    var shift = Math.round(priorOffset * weights[p] / sumW);
    seq[priorIndices[p]].serial += shift;
  }

  // Set target exactly
  seq[targetIdx].serial = targetSerial;
  seq[targetIdx].type = targetType;
  seq[targetIdx].retro = false;
}

// ---------------------------------------------------------------------------
// 20g) Ensure sequences are generated / up to date
// ---------------------------------------------------------------------------

export function moonEnsureSequences(focusSerial?, horizonExtraDays?){
  var st = ensureSettings();
  if (st.moonsEnabled === false) return;

  var ms         = getMoonState();
  var cal        = getCal();
  var cur        = cal.current;
  var todayS     = toSerial(cur.year, cur.month, cur.day_of_the_month);
  var focusS     = isFinite(focusSerial) ? (focusSerial|0) : todayS;
  var extraDays  = isFinite(horizonExtraDays) ? Math.max(0, horizonExtraDays|0) : 0;
  var yearDays   = _moonYearDays();
  var needThru   = Math.max(todayS, focusS) + Math.max(MOON_PRE_GENERATE_YEARS * yearDays, extraDays);
  var wantFrom   = Math.min(todayS, focusS) - yearDays;

  var priorFrom = (isFinite(ms.generatedFrom) && ms.generatedFrom > 0) ? ms.generatedFrom : null;
  if (priorFrom != null && ms.generatedThru >= needThru && priorFrom <= wantFrom) return;

  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys) return;

  var genFrom = (priorFrom != null) ? Math.min(priorFrom, wantFrom) : wantFrom;
  var globalSeed = (ms.systemSeed != null && String(ms.systemSeed).trim() !== '')
    ? String(ms.systemSeed).trim()
    : null;
  sys.moons.forEach(function(moon){
    var moonSeedOverride = ms.seeds[moon.name] || null; // legacy compatibility
    var seed = moonSeedOverride || (globalSeed ? (globalSeed + '::' + moon.name) : null);
    var seq = _generateStandardSequence(moon, genFrom, needThru, seed);

    // Apply GM anchor overrides with multi-cycle smoothing so the exact peak
    // lands on the anchor while the lead-in cycles bend toward it.
    var gmList = ms.gmAnchors[moon.name] || [];
    gmList.forEach(function(anchor){
      if (anchor.serial < genFrom || anchor.serial > needThru) return;
      var halfWindow = (moon.synodicPeriod || 28) / 2;
      var nearest = null, nearestDist = Infinity;
      for (var k = 0; k < seq.length; k++){
        if (seq[k].type !== anchor.type) continue;
        var dist = Math.abs(seq[k].serial - anchor.serial);
        if (dist < nearestDist){ nearestDist = dist; nearest = k; }
      }
      if (nearest !== null && nearestDist <= halfWindow){
        _smoothToTarget(seq, nearest, anchor.serial, 7);
        seq[nearest].gmForced = true;
      } else {
        seq.push({ serial: anchor.serial, type: anchor.type, retro: false, gmForced: true });
      }
    });

    // Keep sequence sorted by serial
    seq.sort(function(a, b){ return a.serial - b.serial; });
    ms.sequences[moon.name] = seq;
  });

  // --- Festival soft nudges (applied across all moons post-generation) ---
  // Festival soft nudges: if any moon has a full/new within 1 day of a
  // published festival noon, d6=6 shifts it to that midday anchor.
  _applyFestivalNudges(sys.moons, ms, genFrom, needThru);

  // --- Therendor–Barrakas weak anti-phase coupling ---
  // Weak restoring pull toward the lore-significant angle:
  // Therendor full more often coincides with Barrakas new.
  _applyAntiPhaseCoupling(ms, 'Therendor', 'Barrakas', genFrom, needThru);

  // --- Associated plane phase pulls ---
  // If a moon's associated plane has a canonical coterminous/remote window
  // with no exact full/new peak inside it, pull the nearest exact peak onto
  // the closest edge-day noon of that window.
  _applyAssociatedPlanePhaseShifts(sys.moons, ms, genFrom, needThru);

  // Clear Long Shadows cache since moon data has changed
  _longShadowsCache = {};
  ms.generatedFrom = genFrom;
  ms.generatedThru = needThru;
}

// ---------------------------------------------------------------------------
// 20h) Phase interpolation & display helpers
// ---------------------------------------------------------------------------

// Raw phase computation — no Long Shadows override. Used internally to
// avoid recursion when computing which moons Long Shadows claims.
export function _moonPhaseAtRaw(moonName, serial){
  var seq = (getMoonState().sequences[moonName]) || [];
  if (!seq.length) return { illum:0.5, waxing:true };

  var prev = null, next = null;
  for (var i = 0; i < seq.length; i++){
    if (seq[i].type !== 'full') continue;
    if (seq[i].serial <= serial) prev = seq[i];
    else if (!next)              next = seq[i];
  }

  if (!prev && !next) return { illum:0.5, waxing:true };
  if (!prev) return { illum:0.0, waxing:true  };
  if (!next) return { illum:0.5, waxing:false };

  var span  = next.serial - prev.serial;
  var pos   = (serial - prev.serial) / span;
  var illum = 0.5 + 0.5 * Math.cos(pos * 2 * Math.PI);
  var waxing = pos > 0.5;
  return { illum: illum, waxing: waxing };
}

// Cache for Long Shadows claimed moons (one entry per year)
export var _longShadowsCache = {};

export function _longShadowsWindow(year){
  var startDay = toSerial(year, 11, 26);
  var endDay   = toSerial(year, 11, 28);
  var start    = _solarTransitionSerial(startDay, 'sunset');
  var end      = _solarTransitionSerial(endDay, 'sunrise');
  return {
    startSerial: start,
    endSerial: end,
    midpointSerial: (start + end) / 2,
    midpointDaySerial: _serialDayMidpoint(toSerial(year, 11, 27)),
    startDaySerial: startDay,
    endDaySerial: endDay
  };
}

// Compute which moons Long Shadows claims for a given year.
//
// Long Shadows is canonically both "the new moon closest to the winter
// solstice" AND "Vult 26-28." This system ensures there IS a real new
// moon during the window by smoothing the nearest new moon event into
// position across prior cycles. The event is genuinely moved in the
// sequence — not a display override.
//
// Tapered gobble zone for secondary moons:
//   1. Find the nearest new moon to the exact midpoint of Long Shadows.
//   2. That closest moon is always claimed and smoothed to that midpoint.
//   3. Based on the closest moon's natural distance from that midpoint:
//      - Distance 0: gobble radius = ±3 days
//      - Distance 1: gobble radius = ±2 days
//      - Distance ≥2: gobble radius = ±1 day
//   4. Secondary moons within the gobble radius are also claimed (but
//      not further smoothed — they just get the display override).

export function _longShadowsClaimedMoons(year){
  if (_longShadowsCache[year]) return _longShadowsCache[year];

  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons){ _longShadowsCache[year] = []; return []; }
  moonEnsureSequences();

  var window = _longShadowsWindow(year);
  var midpoint = window.midpointSerial;

  // For each moon, find its nearest new-type event to the exact midpoint.
  var candidates = [];
  for (var i = 0; i < sys.moons.length; i++){
    var moon = sys.moons[i];
    var seq = (getMoonState().sequences[moon.name]) || [];
    if (!seq.length) continue;

    for (var j = 0; j < seq.length; j++){
      if (seq[j].type !== 'new') continue;
      if (seq[j].gmForced) continue;
      var dist = seq[j].serial - midpoint;
      if (Math.abs(dist) <= 20){
        candidates.push({ name: moon.name, seqIdx: j, newSerial: seq[j].serial, signedDist: dist, absDist: Math.abs(dist) });
      }
    }
  }

  if (!candidates.length){ _longShadowsCache[year] = []; return []; }

  // Sort by absolute distance to the exact midpoint of Long Shadows.
  candidates.sort(function(a, b){ return a.absDist - b.absDist; });

  // The closest moon is always claimed — smooth its new moon to the midpoint.
  var primary = candidates[0];
  var claimed = [primary.name];

  // Smooth the primary moon's new event to the midpoint of Long Shadows.
  var primarySeq = getMoonState().sequences[primary.name];
  if (primarySeq && primary.seqIdx < primarySeq.length){
    _smoothToTarget(primarySeq, primary.seqIdx, midpoint, 7);
    primarySeq[primary.seqIdx].longShadowsClaimed = true;
    primarySeq.sort(function(a, b){ return a.serial - b.serial; });
  }

  var closestAbsDist = primary.absDist;

  // Determine gobble radius for secondary moons
  var gobbleRadius;
  if (closestAbsDist <= 0) gobbleRadius = 3;
  else if (closestAbsDist <= 1) gobbleRadius = 2;
  else gobbleRadius = 1;

  // Secondary moons within gobble radius are also claimed AND smoothed.
  for (var k = 1; k < candidates.length; k++){
    var c = candidates[k];
    var alreadyClaimed = false;
    for (var ac = 0; ac < claimed.length; ac++){
      if (claimed[ac] === c.name){ alreadyClaimed = true; break; }
    }
    if (alreadyClaimed) continue;
    if (c.absDist <= gobbleRadius){
      claimed.push(c.name);
      // Smooth this secondary moon's new event to the midpoint too.
      var secSeq = getMoonState().sequences[c.name];
      if (secSeq && c.seqIdx < secSeq.length){
        _smoothToTarget(secSeq, c.seqIdx, midpoint, 5);
        secSeq[c.seqIdx].longShadowsClaimed = true;
        secSeq.sort(function(a, b){ return a.serial - b.serial; });
      }
    }
  }

  _longShadowsCache[year] = claimed;
  return claimed;
}

// Check if a moon is in the Long Shadows window and claimed by Mabar
export function _isLongShadowsOverride(moonName, serial){
  var wholeDay = Math.floor(serial);
  var cal = fromSerial(wholeDay);
  if (cal.mi !== 11) return false; // not Vult
  if (cal.day < 26 || cal.day > 28) return false;

  var window = _longShadowsWindow(cal.year);
  if (serial < window.startSerial || serial >= window.endSerial) return false;

  // Check that Mabar is actually coterminous (respects GM overrides and anchors)
  try {
    var mabarState = getPlanarState('Mabar', wholeDay);
    if (!mabarState || mabarState.phase !== 'coterminous') return false;
  } catch(e){ return false; }

  var claimed = _longShadowsClaimedMoons(cal.year);
  for (var i = 0; i < claimed.length; i++){
    if (claimed[i] === moonName) return true;
  }
  return false;
}

// Public moonPhaseAt — applies Long Shadows override when active
export function moonPhaseAt(moonName, serial): any {
  // Long Shadows safety net: smoothing moves the new moon to the exact
  // midpoint of the event window, so interpolation should naturally give
  // ~0.0 illumination.
  // This override ensures exactly 0.0 and sets the longShadows flag for display.
  if (_isLongShadowsOverride(moonName, serial)){
    return { illum: 0.0, waxing: false, longShadows: true };
  }
  return _moonPhaseAtRaw(moonName, serial);
}

// Check if this serial is the peak day for a full or new event.
// Returns 'full', 'new', or null. Uses the sequence events directly,
// rounding fractional serials to the nearest integer day. This ensures
// exactly one "full" and one "new" report per synodic cycle.
// Returns 'full', 'new', or null for a given moon on a given day.
// Uses illumination thresholds so moons with
// longer synodic periods can be full or new for multiple consecutive days.
export function _moonPeakPhaseDay(moonName, serial){
  var ph = _moonPhaseAtRaw(moonName, serial);
  if (!ph) return null;
  if (_isFullMoonIllum(ph.illum)) return 'full';
  if (_isNewMoonIllum(ph.illum))  return 'new';
  return null;
}

export var MOON_TARGET_FULL_DAYS_PER_28 = 19;

export function _phaseThresholdForCoverage(targetDays, monthDays, moonCount){
  var desiredCoverage = targetDays / monthDays;
  var perMoonCoverage = 1 - Math.pow(1 - desiredCoverage, 1 / moonCount);
  return 0.5 * (1 + Math.cos(perMoonCoverage * Math.PI));
}

export var MOON_FULL_THRESHOLD = _phaseThresholdForCoverage(MOON_TARGET_FULL_DAYS_PER_28, 28, 12);
export var MOON_NEW_THRESHOLD = 1 - MOON_FULL_THRESHOLD;

export function _moonPhaseLabel(illum, waxing){
  if (_isFullMoonIllum(illum)) return 'Full';
  if (illum >= 0.55) return (waxing ? 'Waxing' : 'Waning') + ' Gibbous';
  if (illum >= 0.45) return (waxing ? 'First' : 'Last')    + ' Quarter';
  if (!_isNewMoonIllum(illum)) return (waxing ? 'Waxing' : 'Waning') + ' Crescent';
  return 'New';
}

export function _moonPhaseEmoji(illum, waxing){
  if (_isFullMoonIllum(illum)) return '\uD83C\uDF15';   // 🌕 Full
  if (illum >= 0.55) return waxing ? '\uD83C\uDF14' : '\uD83C\uDF16';  // 🌔 🌖 Gibbous
  if (illum >= 0.45) return waxing ? '\uD83C\uDF13' : '\uD83C\uDF17';  // 🌓 🌗 Quarter
  if (!_isNewMoonIllum(illum)) return waxing ? '\uD83C\uDF12' : '\uD83C\uDF18';  // 🌒 🌘 Crescent
  return '\uD83C\uDF11';  // 🌑 New
}

export function _moonNextEvent(moonName, serial, type){
  // Returns serial of next event of given type after serial, or null.
  // Uses binary search to find the starting region, then scans forward for matching type.
  var seq = (getMoonState().sequences[moonName]) || [];
  if (!seq.length) return null;

  // Binary search for first entry with serial > target
  var lo = 0, hi = seq.length;
  while (lo < hi){
    var mid = (lo + hi) >>> 1;
    if (seq[mid].serial <= serial) lo = mid + 1;
    else hi = mid;
  }

  // Scan forward from lo for the first matching type
  for (var i = lo; i < seq.length; i++){
    if (seq[i].type === type) return seq[i].serial;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 20i) Moon reveal tiers & forecast helpers
// ---------------------------------------------------------------------------

// Moon reveal tiers -- unified with weather and planes.
// low: common knowledge, medium: skilled forecast, high: expert forecast.
export var MOON_REVEAL_TIERS = { low:1, medium:2, high:3 };

export function _normalizeMoonRevealTier(tier){
  var t = String(tier || '').toLowerCase();
  if (MOON_REVEAL_TIERS[t]) return t;
  return 'medium';
}

// Source labels for player-facing attribution.
export var MOON_SOURCE_LABELS = {
  low:      'Common Knowledge',
  medium:   'Skilled Forecast',
  high:     'Expert Forecast'
};

// Format a "next event" string based on reveal tier.
export function _moonNextEventStr(moon, today, type, tier, horizonDays){
  tier = _normalizeMoonRevealTier(tier);
  var exact = _moonNextEvent(moon.name, today, type);
  if (exact === null) return null;
  var d = Math.ceil(exact - today);
  if (d <= 0) return null;

  var label = (type === 'full') ? 'Full' : 'New';
  var cap = (tier === 'high') ? MOON_PREDICTION_LIMITS.highMaxDays
    : (tier === 'medium') ? MOON_PREDICTION_LIMITS.mediumMaxDays
    : MOON_PREDICTION_LIMITS.lowDays;
  var horizon = parseInt(horizonDays, 10);
  if (!isFinite(horizon) || horizon < 1){
    if (tier === 'low') horizon = MOON_PREDICTION_LIMITS.lowDays;
    else if (tier === 'medium') horizon = 28;
    else horizon = 84;
  }
  horizon = Math.min(cap, horizon);
  function inDays(n){
    return (n === 1) ? 'in 1 day' : ('in ' + n + ' days');
  }
  if (d > horizon){
    return label + ': beyond prediction';
  }

  // Low: only surfaces very near events and keeps the wording approximate.
  if (tier === 'low'){
    return label + ' in about ' + d + ' day' + (d === 1 ? '' : 's');
  }

  // Medium and high both report the exact day inside the revealed horizon.
  if (tier === 'medium'){
    return label + ' ' + inDays(d);
  }

  // High: full exact knowledge within the horizon
  return label + ' ' + inDays(d);
}

// Render a single moon row at a given reveal tier.
export function _moonRowHtml(moon, today, tier, horizonDays){
  tier = _normalizeMoonRevealTier(tier);
  var ph       = moonPhaseAt(moon.name, today);
  var label    = _moonPhaseLabel(ph.illum, ph.waxing);
  var emoji    = _moonPhaseEmoji(ph.illum, ph.waxing);
  var pct      = Math.round(ph.illum * 100);

  // Long Shadows annotation
  var longShadowsTag = '';
  if (ph.longShadows){
    longShadowsTag = ' <span style="color:#9C27B0;font-size:.75em;" title="Mabar pulls this moon into darkness">\uD83C\uDF11 Long Shadows</span>';
  }

  // Find next event to display
  var nextFull = _moonNextEventStr(moon, today, 'full', tier, horizonDays);
  var nextNew  = _moonNextEventStr(moon, today, 'new', tier, horizonDays);
  var nextStr  = '';

  // Pick the closer event
  var dFull = _moonNextEvent(moon.name, today, 'full');
  var dNew  = _moonNextEvent(moon.name, today, 'new');
  if (dFull !== null && (dNew === null || dFull <= dNew))
    nextStr = nextFull || '';
  else if (dNew !== null)
    nextStr = nextNew || '';

  var dot = '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;'+
            'background:'+esc(moon.color||'#aaa')+';border:1px solid rgba(0,0,0,.3);'+
            'margin-right:3px;vertical-align:middle;"></span>';
  var nameStyle = '';

  // Moon ascendancy: brighter when associated plane is coterminous, dimmer when remote
  var ascendTag = '';
  if (moon.plane && ensureSettings().planesEnabled !== false){
    try {
      var _plSt = getPlanarState(moon.plane, today);
      if (_plSt && _plSt.phase === 'coterminous')
        ascendTag = ' <span style="' +
          applyBg('font-size:.75em;padding:0 3px;border-radius:3px;', '#FFE8A3', CONTRAST_MIN_HEADER) +
          '" title="'+esc(moon.plane)+' coterminous">\u2728 ascendant</span>';
      else if (_plSt && _plSt.phase === 'remote')
        ascendTag = ' <span style="opacity:.4;font-size:.75em;" title="'+esc(moon.plane)+' remote">\u25CC dim</span>';
    } catch(e){ /* planar system not ready */ }
  }
  // Also ascendant during its associated month
  if (!ascendTag && moon.associatedMonth){
    try {
      var _curCal = getCal().current;
      if (_curCal && (_curCal.month + 1) === moon.associatedMonth)
        ascendTag = ' <span style="' +
          applyBg('font-size:.75em;padding:0 3px;border-radius:3px;', '#FFE8A3', CONTRAST_MIN_HEADER) +
          '">\u2728 ascendant</span>';
    } catch(e){}
  }

  // Lower reveal tiers: phase + next event.
  // High reveal tier: phase + illumination + secondary event.
  var infoParts = [emoji + ' ' + esc(label)];
  if (tier === 'high') infoParts[0] += ' (' + pct + '%)';

  var result = '<div style="margin:3px 0;line-height:1.4;">'+
    dot+
    '<b style="min-width:82px;display:inline-block;'+nameStyle+'">'+esc(moon.name)+'</b>'+
    '<span style="opacity:.9;">'+infoParts.join('')+'</span>'+
    ascendTag+
    longShadowsTag;

  if (nextStr){
    result += '<span style="opacity:.45;font-size:.82em;margin-left:8px;">'+esc(nextStr)+'</span>';
  }

  // High tier: show the secondary event too.
  if (tier === 'high'){
    var secStr = '';
    if (dFull !== null && (dNew === null || dFull <= dNew))
      secStr = nextNew || '';
    else
      secStr = nextFull || '';
    if (secStr){
      result += '<span style="opacity:.35;font-size:.78em;margin-left:6px;">'+esc(secStr)+'</span>';
    }
  }

  result += '</div>';
  return result;
}

export function _moonMiniCalEvents(startSerial, endSerial, tier, baseHorizonDays?){
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  var out = [];
  if (!sys || !sys.moons || !sys.moons.length) return out;
  var start = startSerial|0;
  var end = endSerial|0;
  if (end < start){ var tmp = start; start = end; end = tmp; }
  var isHighTier = _normalizeMoonRevealTier(tier) === 'high';
  var today = todaySerial();

  for (var ser = start; ser <= end; ser++){
    var fullMoons = [];
    var newMoons = [];
    for (var i = 0; i < sys.moons.length; i++){
      var moon = sys.moons[i];
      // For player display: suppress events past the reveal horizon
      if (!isHighTier && isFinite(baseHorizonDays) && ser > today){
        if ((ser - today) > baseHorizonDays) continue;
      }
      var peakType = _moonPeakPhaseDay(moon.name, ser);
      if (peakType === 'full'){
        fullMoons.push(moon.name);
      } else if (peakType === 'new'){
        var ph = moonPhaseAt(moon.name, ser);
        var lsTag = (ph && ph.longShadows) ? ' (Long Shadows)' : '';
        newMoons.push(moon.name + lsTag);
      }
    }

    // Yellow dot if any moon is full
    if (fullMoons.length){
      out.push({
        serial: ser,
        name: fullMoons.map(function(n){ return '● ' + n + ' Full'; }).join('\n'),
        color: '#FFD700'
      });
    }
    // Black dot if any moon is new
    if (newMoons.length){
      out.push({
        serial: ser,
        name: newMoons.map(function(n){ return '● ' + n + ' New'; }).join('\n'),
        color: '#222222'
      });
    }

    if (isHighTier){
      var eNotes = _eclipseNotableToday(ser);
      for (var ei = 0; ei < eNotes.length; ei++){
        out.push({
          serial: ser,
          name: '🌘 ' + _stripHtmlTags(eNotes[ei]),
          color: '#9575CD'
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Single-moon mini-calendar — shows one moon's phases across a month.
// Cells are color-filled with the phase emoji; no dots needed.
// ---------------------------------------------------------------------------

// Phase-to-color mapping for single-moon cells.
export function _moonPhaseCellColor(illum){
  if (_isFullMoonIllum(illum)) return '#FFD700';  // gold for full
  if (illum >= 0.55)  return '#B0A060';  // warm grey-gold for gibbous
  if (illum >= 0.45)  return '#808080';  // grey for quarter
  if (!_isNewMoonIllum(illum)) return '#505050';  // dark grey for crescent
  return '#222222';                                     // near-black for new
}

export function _singleMoonMiniCalEvents(moonName, startSerial, endSerial){
  var out = [];
  for (var ser = startSerial; ser <= endSerial; ser++){
    var ph = moonPhaseAt(moonName, ser);
    if (!ph) continue;
    var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
    var label = _moonPhaseLabel(ph.illum, ph.waxing);
    var pct = Math.round(ph.illum * 100);
    out.push({
      serial: ser,
      name: emoji + ' ' + label + ' (' + pct + '%)',
      color: _moonPhaseCellColor(ph.illum)
    });
  }
  return out;
}

export function _singleMoonMiniCalHtml(moonName, serial){
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons) return '';
  var moonDef = null;
  for (var i = 0; i < sys.moons.length; i++){
    if (sys.moons[i].name === moonName){ moonDef = sys.moons[i]; break; }
  }
  if (!moonDef) return '';

  var mr = _monthRangeFromSerial(serial);
  moonEnsureSequences(mr.start, (mr.end - mr.start) + 60);
  var events = _singleMoonMiniCalEvents(moonName, mr.start, mr.end);
  var calHtml = _renderSyntheticMiniCal(moonDef.title || moonName, mr.start, mr.end, events);

  // Pre-header with moon name and color band
  var moonColor = moonDef.color || '#888';
  var preHeader = '<div style="background:'+moonColor+';color:'+
    (_contrast(moonColor, '#FFFFFF') > 3 ? '#FFFFFF' : '#000000')+
    ';text-align:center;font-weight:bold;padding:3px 6px;font-size:.9em;border-radius:4px 4px 0 0;margin-bottom:-1px;">'+
    esc(moonName)+' \u2014 '+esc(moonDef.title || '')+
    '</div>';

  return preHeader + calHtml;
}

function _singleMoonPlayerMiniCalHtml(moonName, serial, tier, horizonDays){
  tier = _normalizeMoonRevealTier(tier);
  if (tier === 'high'){
    return _singleMoonMiniCalHtml(moonName, serial);
  }

  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons) return '';
  var moonDef = null;
  for (var i = 0; i < sys.moons.length; i++){
    if (sys.moons[i].name === moonName){ moonDef = sys.moons[i]; break; }
  }
  if (!moonDef) return '';

  var mr = _monthRangeFromSerial(serial);
  var knownEnd = todaySerial() + (parseInt(horizonDays, 10) || 0);
  var events = [];
  for (var ser = mr.start; ser <= mr.end; ser++){
    if (ser < todaySerial() || ser > knownEnd) continue;
    var peakType = _moonPeakPhaseDay(moonName, ser);
    if (peakType === 'full'){
      events.push({ serial: ser, name: '🌕 ' + moonName + ' Full', color: '#FFD700' });
    } else if (peakType === 'new'){
      events.push({ serial: ser, name: '🌑 ' + moonName + ' New', color: '#222222' });
    }
  }
  var calHtml = _renderSyntheticMiniCal(moonDef.title || moonName, mr.start, mr.end, events);
  var moonColor = moonDef.color || '#888';
  var preHeader = '<div style="background:'+moonColor+';color:'+
    (_contrast(moonColor, '#FFFFFF') > 3 ? '#FFFFFF' : '#000000')+
    ';text-align:center;font-weight:bold;padding:3px 6px;font-size:.9em;border-radius:4px 4px 0 0;margin-bottom:-1px;">'+
    esc(moonName)+' — '+esc(moonDef.title || '')+
    '</div>';
  return preHeader + calHtml +
    '<div style="font-size:.78em;opacity:.6;margin-top:4px;">Player single-moon view marks only revealed full/new peaks.</div>';
}

export function _moonTodaySummaryHtml(today, tier, horizonDays){
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons || !sys.moons.length) return '';
  tier = _normalizeMoonRevealTier(tier);
  var horizon = parseInt(horizonDays, 10);
  if (!isFinite(horizon) || horizon < 1){
    if (tier === 'low') horizon = MOON_PREDICTION_LIMITS.lowDays;
    else if (tier === 'medium') horizon = 28;
    else horizon = 84;
  }
  var horizonEnd = today + horizon;

  var fullNow = [];
  var newNow = [];
  var best = null;

  for (var i = 0; i < sys.moons.length; i++){
    var moon = sys.moons[i];
    var ph = moonPhaseAt(moon.name, today);
    if (!ph) continue;
    var _pt = _moonPeakPhaseDay(moon.name, today);
    if (_pt === 'full') fullNow.push(moon.name);
    if (_pt === 'new') newNow.push(moon.name + (ph.longShadows ? ' (Long Shadows)' : ''));

    var fSer = _moonNextEvent(moon.name, today, 'full');
    var nSer = _moonNextEvent(moon.name, today, 'new');
    if (fSer != null && fSer > today && fSer <= horizonEnd && (!best || fSer < best.serial)){
      best = { serial:fSer, moon:moon.name, type:'full', str:_moonNextEventStr(moon, today, 'full', tier, horizon) };
    }
    if (nSer != null && nSer > today && nSer <= horizonEnd && (!best || nSer < best.serial)){
      best = { serial:nSer, moon:moon.name, type:'new', str:_moonNextEventStr(moon, today, 'new', tier, horizon) };
    }
  }

  var bits = [];
  if (fullNow.length) bits.push('🌕 Full now: ' + fullNow.join(', '));
  if (newNow.length) bits.push('🌑 New now: ' + newNow.join(', '));
  if (best){
    bits.push('Next: ' + (best.str || (best.moon + ' ' + titleCase(best.type))));
  } else if (tier !== 'high') {
    bits.push('Next: beyond prediction');
  }
  if (!bits.length) return '';
  return '<div style="font-size:.8em;opacity:.72;margin:2px 0 6px 0;">'+esc(bits.join(' · '))+'</div>';
}

// ---------------------------------------------------------------------------
// 20j) Moon panel HTML -- tiered
// ---------------------------------------------------------------------------

// GM panel -- always shows high-detail data
export function moonPanelHtml(serialOverride?){
  var st = ensureSettings();
  if (st.moonsEnabled === false){
    return _menuBox('\uD83C\uDF19 Moons',
      '<div style="opacity:.7;">Moon system is disabled.</div>'+
      '<div style="margin-top:4px;font-size:.85em;">Enable: <code>!cal settings moons on</code></div>'
    );
  }

  var ms  = getMoonState();
  var cal = getCal();
  var cur = cal.current;
  var today = isFinite(serialOverride) ? (serialOverride|0) : toSerial(cur.year, cur.month, cur.day_of_the_month);
  moonEnsureSequences(today, MOON_PREDICTION_LIMITS.highMaxDays);
  var dateLabel = dateLabelFromSerial(today);

  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys){
    return _menuBox('\uD83C\uDF19 Moons', '<div style="opacity:.7;">No moon data for this calendar system.</div>');
  }

  var rows = sys.moons.map(function(moon){
    return _moonRowHtml(moon, today, 'high', MOON_PREDICTION_LIMITS.highMaxDays);
  });
  var displayMode = _normalizeDisplayMode(st.moonDisplayMode);
  var verbose = _subsystemIsVerbose();
  var mr = _monthRangeFromSerial(today);
  var moonMiniEvents = _moonMiniCalEvents(mr.start, mr.end, 'high');
  var moonMiniCal = _renderSyntheticMiniCal('Lunar Calendar', mr.start, mr.end, moonMiniEvents);
  var prevSer = _shiftSerialByMonth(today, -1);
  var nextSer = _shiftSerialByMonth(today, 1);
  var navRow = '<div style="margin:3px 0 6px 0;">'+
    button('◀ Prev Month','moon on '+_serialToDateSpec(prevSer))+' '+
    button('Next Month ▶','moon on '+_serialToDateSpec(nextSer))+
    '</div>';
  var body = '';
  if (displayMode !== 'list'){
    body += moonMiniCal;
    body += _legendLine(['🌕 Full', '🌑 New', '🌘 Eclipse/Occultation']);
    if (verbose){
      body += '<div style="font-size:.78em;opacity:.6;margin:0 0 6px 0;">New/full phases are marked in moon colors. Hover days for details.</div>';
    }
  }
  if (displayMode !== 'calendar'){
    body += rows.join('');
  }
  if (!body){
    body = '<div style="opacity:.7;">No lunar display mode selected.</div>';
  }

  // Current player reveal tier
  var tierLabel = titleCase(_normalizeMoonRevealTier(ms.revealTier || 'medium'));
  var horizonLabel = _rangeLabel(ms.revealHorizonDays || 7);

  // Seed line for system-wide moon generation
  var seedLine = '';
  if (sys.moons && sys.moons.length){
    var activeSeed = (ms.systemSeed != null && String(ms.systemSeed).trim() !== '')
      ? String(ms.systemSeed)
      : 'default';
    seedLine = '<div style="font-size:.78em;opacity:.5;margin-top:7px;border-top:1px solid rgba(255,255,255,.1);padding-top:5px;">'+
      'System seed: <code>'+esc(activeSeed)+'</code>'+
      ' &nbsp;\u00B7&nbsp; <code>!cal moon seed &lt;word&gt;</code>'+
    '</div>';
  }

  // GM controls — send buttons with DC hints
  var sendBtns = MOON_REVEAL_PRESETS.map(function(p){
    return button(p.label + ' (' + p.dc + ')', 'moon send medium ' + p.days + 'd');
  }).join(' ');
  var highBtns = MOON_REVEAL_PRESETS.map(function(p){
    return button(p.label, 'moon send high ' + p.days + 'd');
  }).join(' ');

  var moonViewBtns = sys.moons.map(function(moon){
    return button(moon.name, 'moon view ' + moon.name);
  }).join(' ');

  var gmControls = '<div style="margin-top:6px;font-size:.82em;opacity:.7;">'+
    '<div style="margin-bottom:2px;">Send Medium: '+sendBtns+'</div>'+
    '<div style="margin-bottom:2px;">Send High: '+highBtns+'</div>'+
    '<div style="margin-bottom:4px;margin-top:4px;">Individual: '+moonViewBtns+'</div>'+
    '<div style="margin-bottom:4px;">'+button('Prompt !cal moon on','moon on ?{Date|'+_serialToDateSpec(today)+'}')+'</div>'+
    button('📖 Lore','moon lore')+' '+
    button('View: '+_displayModeLabel(displayMode),'settings mode moon '+_nextDisplayMode(displayMode))+
    '</div>'+
    '<div style="font-size:.75em;opacity:.45;margin-top:3px;">'+
    'Player tier: '+esc(tierLabel)+' · '+
    'CLI: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>'+
    '</div>';

  return _menuBox('\uD83C\uDF19 Moons \u2014 ' + esc(dateLabel),
    navRow +
    _moonTodaySummaryHtml(today, 'high', MOON_PREDICTION_LIMITS.highMaxDays) +
    body + seedLine + gmControls +
    '<div style="margin-top:7px;">'+ button('\u2B05\uFE0F Back','help root') +'</div>'
  );
}

// Player panel -- calendar grid is the primary view, minimal list
export function moonPlayerPanelHtml(serialOverride?){
  var st = ensureSettings();
  if (st.moonsEnabled === false){
    return _menuBox('\uD83C\uDF19 Moons', '<div style="opacity:.7;">Moon system is not active.</div>');
  }

  var ms  = getMoonState();
  var cal = getCal();
  var cur = cal.current;
  var tier = _normalizeMoonRevealTier(ms.revealTier || 'medium');
  var horizon = parseInt(ms.revealHorizonDays, 10) || 7;
  var today = isFinite(serialOverride) ? (serialOverride|0) : toSerial(cur.year, cur.month, cur.day_of_the_month);
  moonEnsureSequences(today, horizon + 30);
  var dateLabel = dateLabelFromSerial(today);

  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys){
    return _menuBox('\uD83C\uDF19 Moons', '<div style="opacity:.7;">No moon data for this calendar system.</div>');
  }

  // Calendar grid — always shown
  var pmr = _monthRangeFromSerial(today);
  var pMoonMiniEvents = _moonMiniCalEvents(pmr.start, pmr.end, tier, horizon);
  var pMoonMiniCal = _renderSyntheticMiniCal('Lunar Calendar', pmr.start, pmr.end, pMoonMiniEvents);

  // Navigation (within known horizon)
  var prevSer = _shiftSerialByMonth(today, -1);
  var nextSer = _shiftSerialByMonth(today, 1);
  var knownStart = todaySerial();
  var knownEnd = knownStart + horizon;
  function _navBtn(serial, label){
    if (serial < knownStart || serial > knownEnd){
      return '<span style="opacity:.35;">'+esc(label)+'</span>';
    }
    return button(label, 'moon on '+_serialToDateSpec(serial));
  }
  var navRow = '<div style="margin:3px 0 6px 0;">'+
    _navBtn(prevSer, '◀ Prev')+' '+
    _navBtn(nextSer, 'Next ▶')+
    '</div>';

  // Today summary + notable moons only (not all 12)
  var body = navRow;
  body += _moonTodaySummaryHtml(today, tier, horizon);
  body += pMoonMiniCal;
  body += _legendLine(['🌕 Full', '🌑 New']);

  // Compact notable list: only moons at full, new, or ascending right now
  // Each line includes the moon's title so players know what they're reading
  var notableLines = [];
  sys.moons.forEach(function(moon){
    var peakType = _moonPeakPhaseDay(moon.name, today);
    if (peakType === 'full'){
      notableLines.push('🌕 <b>' + esc(moon.name) + '</b> is Full');
    } else if (peakType === 'new'){
      var ph = moonPhaseAt(moon.name, today);
      var tag = (ph && ph.longShadows) ? ' — <span style="color:#9C27B0;">Long Shadows</span>' : '';
      notableLines.push('🌑 <b>' + esc(moon.name) + '</b> is New' + tag);
    }
  });
  if (notableLines.length){
    body += '<div style="font-size:.85em;margin-top:6px;line-height:1.6;">' +
      notableLines.join('<br>') + '</div>';
  } else {
    body += '<div style="font-size:.82em;opacity:.5;margin-top:6px;">No moons at full or new today.</div>';
  }
  if (tier === 'high' && _eclipseNotableToday(today).length){
    body += '<div style="font-size:.82em;margin-top:6px;line-height:1.6;">' +
      _eclipseNotableToday(today).join('<br>') + '</div>';
  }

  // Lore button
  body += '<div style="margin-top:6px;">' +
    button('📖 Moon Lore', 'moon lore') + ' ' +
    button('🌌 Sky Now', 'moon sky') + ' ' +
    button('Prompt !cal moon on', 'moon on ?{Date|'+_serialToDateSpec(today)+'}') +
    '</div>';

  var srcLabel = MOON_SOURCE_LABELS[tier] || '';
  if (srcLabel){
    body += '<div style="font-size:.72em;opacity:.35;font-style:italic;margin-top:5px;">'+esc(srcLabel)+'</div>';
  }

  return _menuBox('\uD83C\uDF19 Moons \u2014 ' + esc(dateLabel), body);
}

// ---------------------------------------------------------------------------
// 20j) Moon command handler  (!cal moon ...)
// ---------------------------------------------------------------------------

export function _moonParseMoonName(str, sys){
  // Case-insensitive match against moon names
  var s = str.toLowerCase();
  for (var i = 0; i < sys.moons.length; i++){
    if (sys.moons[i].name.toLowerCase() === s) return sys.moons[i].name;
  }
  return null;
}


// ---------------------------------------------------------------------------
// 20k) Eclipse engine — seeded orbital positions for moon-moon & moon-sun eclipses
// ---------------------------------------------------------------------------
// Each moon gets a sky longitude (0–360°) based on its synodic period, plus
// a seeded orbital inclination and ascending node. When two moons are within
// a threshold angular separation AND one is full (bright disk) while the
// other passes in front, we get a moon-moon eclipse. When a moon is new
// and near the sun's ecliptic longitude, we get a solar eclipse.
//
// This is simplified orbital mechanics — not real 3-body, but produces
// deterministic, interesting results that reward scholarly investigation.

// Canonical diameters and distances from Keith Baker's Dragonshards article.
// angularSizeVsSun: 1.0 = same apparent size as Arrah (the sun).
// albedo: real solar-system analog values. Geometric albedo can exceed 1.0
//   (Enceladus 1.375, Tethys 1.229) due to backscattering from pure ice.
//   Dravago/Triton retrograde inclination is handled in illumination calc.
export var MOON_ORBITAL_DATA = {
  Zarantyr:  { diameter:_eberronMoonCore('Zarantyr').diameter, distance:_eberronMoonCore('Zarantyr').avgOrbitalDistance,  angularSizeVsSun: 9.08, albedo: 0.12 },
  Olarune:   { diameter:_eberronMoonCore('Olarune').diameter, distance:_eberronMoonCore('Olarune').avgOrbitalDistance,  angularSizeVsSun: 5.73, albedo: 0.22 },
  Therendor: { diameter:_eberronMoonCore('Therendor').diameter, distance:_eberronMoonCore('Therendor').avgOrbitalDistance,  angularSizeVsSun: 2.91, albedo: 0.99 },
  Eyre:      { diameter:_eberronMoonCore('Eyre').diameter, distance:_eberronMoonCore('Eyre').avgOrbitalDistance,  angularSizeVsSun: 2.38, albedo: 0.96 },
  Dravago:   { diameter:_eberronMoonCore('Dravago').diameter, distance:_eberronMoonCore('Dravago').avgOrbitalDistance,  angularSizeVsSun: 2.66, albedo: 0.76 },
  Nymm:      { diameter:_eberronMoonCore('Nymm').diameter, distance:_eberronMoonCore('Nymm').avgOrbitalDistance, angularSizeVsSun: 0.98, albedo: 0.43 },
  Lharvion:  { diameter:_eberronMoonCore('Lharvion').diameter, distance:_eberronMoonCore('Lharvion').avgOrbitalDistance, angularSizeVsSun: 1.11, albedo: 0.30 },
  Barrakas:  { diameter:_eberronMoonCore('Barrakas').diameter, distance:_eberronMoonCore('Barrakas').avgOrbitalDistance, angularSizeVsSun: 1.07, albedo: 1.375 },
  Rhaan:     { diameter:_eberronMoonCore('Rhaan').diameter, distance:_eberronMoonCore('Rhaan').avgOrbitalDistance, angularSizeVsSun: 0.49, albedo: 0.32 },
  Sypheros:  { diameter:_eberronMoonCore('Sypheros').diameter, distance:_eberronMoonCore('Sypheros').avgOrbitalDistance, angularSizeVsSun: 0.62, albedo: 0.071 },
  Aryth:     { diameter:_eberronMoonCore('Aryth').diameter, distance:_eberronMoonCore('Aryth').avgOrbitalDistance, angularSizeVsSun: 0.69, albedo: 0.275 },
  Vult:      { diameter:_eberronMoonCore('Vult').diameter, distance:_eberronMoonCore('Vult').avgOrbitalDistance, angularSizeVsSun: 0.74, albedo: 0.23 }
};

// ---------------------------------------------------------------------------
// 20g-i-b) Ring of Siberys — analog: Saturn's rings
// ---------------------------------------------------------------------------
// The Ring of Siberys is the equatorial band of siberys dragonshards that
// encircles Eberron. Saturn's rings provide the physical template:
// 282,000 km wide but only ~10 meters thick — an aspect ratio like a
// DVD scaled up to 30 km across. Composed of dragonshard fragments
// ranging from dust to mountain-sized.
//
// The Ring is visible in daylight and dominates the night sky. Sages at
// Arcanix believe all arcane magic may draw on energy radiating from the
// Ring — the "Blood of Siberys." (Keith Baker, "Reaching For The Stars")

export var RING_OF_SIBERYS = {
  // A single equatorial ring of siberys dragonshards. Physical parameters
  // derived from Saturn's rings but scaled to fit inside Zarantyr's orbit
  // (14,300 km). Saturn's ring system spans ~1.1–2.3 planet radii; if
  // Eberron is ~6,400 km radius, the ring fits at ~1.1–1.9 Eberron radii.
  analog: "Saturn's rings",
  composition: 'Siberys dragonshards',
  innerEdge_km: 7000,          // just above atmosphere
  outerEdge_km: 12000,         // well inside Zarantyr at 14,300 km
  width_km: 5000,              // single visible band
  thickness_m: 10,             // Saturn-analog: incredibly thin
  albedo: 0.50,                // Saturn B-ring average
  inclination: 0,              // equatorial
  // Saturn's ring particle composition analog
  particleSizes: 'Dust to boulder-sized dragonshard fragments',
  appearance: {
    daylight: 'A brilliant equatorial arc of golden-white light, visible even in full sunlight.',
    night: 'A sweeping band of light across the sky. Casts faint but real shadows on clear nights.',
    equator: 'Seen edge-on as a thin bright line directly overhead.',
    poles: 'A wide luminous arch spanning the sky from horizon to horizon.'
  },
  facts: [
    'The Ring is 5,000 km wide but only ~10 meters thick.',
    'If scaled to a dinner plate, the Ring would be thousands of times thinner than a sheet of paper.',
    'Siberys shards that fall from the Ring are the rarest and most valuable dragonshards.',
    'Ring particles orbit at different speeds: inner fragments orbit faster than outer ones.'
  ]
};

// ---------------------------------------------------------------------------
// 20g-ii) Nighttime Illumination System
// ---------------------------------------------------------------------------
// Computes ambient light level in lux from overhead moons, starlight, and
// the Ring of Siberys. The result maps to D&D mechanical thresholds:
//
//   Lux     | Condition        | D&D Equivalent
//   --------|------------------|-----------------------
//   > 0.25  | Bright moonlight | Dim light (no penalty)
//   0.03–0.25 | Dim moonlight  | Dim light (disadvantage on Perception)
//   < 0.03  | Near darkness    | Darkness (effectively blind w/o darkvision)
//
// Reference: Earth's full moon ≈ 0.25 lux at zenith (albedo 0.12,
// angular diameter 0.5°). Our moons are much larger and closer, so
// even modest illumination fractions produce significant light.
//
// Formula per moon:
//   lux_moon = lux_reference × (angularArea / moonAngularArea) × (albedo / 0.12) × illum
// where lux_reference = 0.25 (Earth full moon), moonAngularArea is proportional
// to angularSizeVsSun² (since area scales as diameter²).
// Earth's moon angularSizeVsSun ≈ 1.0 and albedo ≈ 0.12.
//
// Simplified: lux_moon = 0.25 × angularSize² × (albedo / 0.12) × illum
//
// Ambient sources:
//   Starlight:          ~0.002 lux (clear night, no moon, Earth analog)
//   Ring of Siberys:    ~0.008 lux (diffuse golden glow from the dragon-shard ring)
//   Total ambient:      ~0.010 lux (always present on clear nights)
//   Overcast penalty:   ×0.15 for heavy cloud cover

export var NIGHTLIGHT_AMBIENT_LUX = 0.010;  // starlight + Ring of Siberys
export var NIGHTLIGHT_OVERCAST_MULT = 0.15;  // heavy cloud cover blocks ~85% of moonlight
export var NIGHTLIGHT_EARTH_MOON_LUX = 0.25; // reference: full Earth moon at zenith
export var NIGHTLIGHT_EARTH_ALBEDO = 0.12;

// Fraction of the night a moon is "overhead" — simplified to ~50% for all moons
// (real value depends on orbital inclination and time, but 50% is a fair average
// for 12 moons that aren't all on the same schedule).
export var NIGHTLIGHT_OVERHEAD_FRACTION = 0.50;

export function nighttimeLux(serial, precipStage){
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons || !sys.moons.length) return { total: NIGHTLIGHT_AMBIENT_LUX, moons: [], ambient: NIGHTLIGHT_AMBIENT_LUX };

  var moonContributions = [];
  var totalMoonLux = 0;

  for (var i = 0; i < sys.moons.length; i++){
    var moon = sys.moons[i];
    var ph = moonPhaseAt(moon.name, serial);
    if (!ph || ph.illum < 0.01) continue; // too dim to matter

    var orb = MOON_ORBITAL_DATA[moon.name];
    if (!orb) continue;

    var angSq = orb.angularSizeVsSun * orb.angularSizeVsSun;
    var alb = orb.albedo || 0.12;
    var rawLux = NIGHTLIGHT_EARTH_MOON_LUX * angSq * (alb / NIGHTLIGHT_EARTH_ALBEDO) * ph.illum;

    // Apply overhead fraction: not all moons are up all night
    var effectiveLux = rawLux * NIGHTLIGHT_OVERHEAD_FRACTION;

    if (effectiveLux >= 0.001){ // only track meaningful contributors
      moonContributions.push({
        name: moon.name,
        illum: ph.illum,
        lux: effectiveLux,
        angularSize: orb.angularSizeVsSun,
        albedo: alb
      });
      totalMoonLux += effectiveLux;
    }
  }

  // Cloud cover dims moonlight (but ambient starlight/Siberys also affected)
  var cloudMult = 1.0;
  if (typeof precipStage === 'number'){
    // precip 0=clear, 1=partly cloudy, 2=overcast, 3+=precipitation
    if (precipStage >= 3) cloudMult = NIGHTLIGHT_OVERCAST_MULT;
    else if (precipStage === 2) cloudMult = 0.35;
    else if (precipStage === 1) cloudMult = 0.70;
  }

  var totalLux = (NIGHTLIGHT_AMBIENT_LUX + totalMoonLux) * cloudMult;

  // Sort moons by contribution descending
  moonContributions.sort(function(a, b){ return b.lux - a.lux; });

  return {
    total: Math.round(totalLux * 1000) / 1000,  // 3 decimal places
    moons: moonContributions,
    ambient: Math.round(NIGHTLIGHT_AMBIENT_LUX * cloudMult * 1000) / 1000,
    cloudMult: cloudMult
  };
}

// D&D mechanical classification for the lux level.
export function nighttimeLightCondition(lux){
  // Eberron thresholds calibrated to D&D mechanics and real photometry.
  // 1 lux ≈ a candle at 1 meter. D&D candles produce 5 ft of bright light.
  // So 1 lux is the natural "bright light from moonlight" threshold.
  //
  // Shadow: scattered light under canopy/overhang is ~10% of open sky.
  var shadow = lux * 0.10;

  if (lux >= 1.0) return {
    condition: 'bright', label: 'Bright Moonlight', emoji: '🌕',
    note: 'Bright light. No vision restrictions.',
    shadow: (shadow >= 0.3) ? 'dim' : 'dark',
    shadowNote: (shadow >= 0.3)
      ? 'In shadow (trees, overhangs): dim light.'
      : 'In shadow: darkness. Darkvision or light source needed.'
  };
  if (lux >= 0.30) return {
    condition: 'dim', label: 'Dim Moonlight', emoji: '🌗',
    note: 'Dim light. Enough to fight by. Disadvantage on Perception.',
    shadow: 'dark',
    shadowNote: 'In shadow: darkness. Darkvision or light source needed.'
  };
  if (lux >= 0.03) return {
    condition: 'dim', label: 'Faint Moonlight', emoji: '🌘',
    note: 'Dim light (faint). Disadvantage on Perception. Hard to see detail.',
    shadow: 'dark',
    shadowNote: 'In shadow: darkness.'
  };
  return {
    condition: 'darkness', label: 'Near Darkness', emoji: '🌑',
    note: 'Darkness. Effectively blind without darkvision.',
    shadow: 'dark',
    shadowNote: 'Dark everywhere, open or covered.'
  };
}

function _formatSolarHour(hour){
  var whole = Math.floor(hour);
  var mins = Math.round((hour - whole) * 60);
  if (mins >= 60){ whole += 1; mins -= 60; }
  whole = ((whole % 24) + 24) % 24;
  var suffix = whole >= 12 ? 'PM' : 'AM';
  var displayHour = whole % 12;
  if (displayHour === 0) displayHour = 12;
  var minLabel = mins ? (':' + (mins < 10 ? '0' : '') + mins) : '';
  return displayHour + minLabel + ' ' + suffix;
}

export function currentLightSnapshot(serial, precipStage?){
  var daylight = daylightStatusForSerial(serial);
  if (isTimeOfDayActive() && daylight.daylit){
    return {
      mode: 'day',
      emoji: '',
      label: 'Daylight',
      note: 'Natural daylight. No vision restrictions.',
      bucketLabel: daylight.bucketLabel,
      solar: daylight.solar
    };
  }

  var result = nighttimeLux(serial, precipStage);
  var cond = nighttimeLightCondition(result.total);
  return {
    mode: 'night',
    emoji: cond.emoji,
    label: cond.label,
    note: cond.note,
    shadowNote: cond.shadowNote,
    result: result,
    cond: cond,
    solar: daylight.solar
  };
}
// Build the current lighting HTML block for the Today panel.
// Auto-pulls weather precip stage if available.
export function nighttimeLightHtml(serial){
  // Get precipitation stage from weather if available
  var precipStage = 0;
  var weatherNote = '';
  var rec = _forecastRecord(serial);
  if (rec && rec.final){
    precipStage = rec.final.precip || 0;
    if (precipStage >= 3) weatherNote = 'Heavy cloud/precipitation — moonlight severely reduced.';
    else if (precipStage === 2) weatherNote = 'Overcast sky — moonlight dimmed.';
    else if (precipStage === 1) weatherNote = 'Partly cloudy — moonlight slightly dimmed.';
  }

  var snap = currentLightSnapshot(serial, precipStage);
  if (snap.mode === 'day'){
    return '<div style="margin-bottom:4px;">' +
      '<b>' + (snap.emoji ? esc(snap.emoji) + ' ' : '') + esc(snap.label) + '</b>' +
      '</div>' +
      '<div style="font-size:.88em;margin:2px 0;">' + esc(snap.note) + '</div>' +
      '<div style="font-size:.82em;opacity:.55;margin-top:3px;">' +
      'Sunrise ~' + esc(_formatSolarHour(snap.solar.sunrise)) +
      ' • Sunset ~' + esc(_formatSolarHour(snap.solar.sunset)) +
      '</div>';
  }

  var result = snap.result;
  var cond = snap.cond;

  var html = '<div style="margin-bottom:4px;">' +
    '<b>' + cond.emoji + ' ' + esc(cond.label) + '</b>' +
    ' <span style="opacity:.6;">(' + result.total + ' lux)</span>' +
    '</div>';

  html += '<div style="font-size:.88em;margin:2px 0;">' + esc(cond.note) + '</div>';
  html += '<div style="font-size:.85em;opacity:.7;margin:2px 0;">🌲 ' + esc(cond.shadowNote) + '</div>';

  if (weatherNote){
    html += '<div style="font-size:.85em;opacity:.7;margin:2px 0;">☁ ' + esc(weatherNote) + '</div>';
  }

  // Top contributing moons
  if (result.moons.length > 0){
    var topMoons = result.moons.slice(0, 3);
    var moonBits = [];
    for (var i = 0; i < topMoons.length; i++){
      var m = topMoons[i];
      moonBits.push(esc(m.name) + ' ' + Math.round(m.illum * 100) + '%');
    }
    var moreCount = result.moons.length - 3;
    html += '<div style="font-size:.82em;opacity:.55;margin-top:3px;">Sources: ' +
      moonBits.join(', ') +
      (moreCount > 0 ? (', +' + moreCount + ' more') : '') +
      '</div>';
  }

  if (result.cloudMult < 1.0){
    html += '<div style="font-size:.82em;opacity:.55;">Cloud cover: ×' + result.cloudMult.toFixed(2) + '</div>';
  }

  return html;
}

// Movement tuning is intentionally mythic (not strict orbital physics):
// each moon has a characteristic swing/precession profile matching its lore.
// inclinationBase: real analog value. distanceSwingPct: ~2x real eccentricity.
// Ascending nodes and precession rates are lore-driven (not real).
export var MOON_MOTION_TUNING = {
  // Luna analog:        ecc 0.0549, inc 5.145°
  Zarantyr: { inclinationBase:5.145, inclinationAmp:1.5, inclinationPeriodDays:336, ascendingNode:120, nodePrecessionDegPerYear:12, distanceSwingPct:0.11, distancePeriodDays:336, apsisAngle:20,  apsisPrecessionDegPerYear:24 },
  // Titan analog:       ecc 0.0288, inc 0.33°
  Olarune:  { inclinationBase:0.33, inclinationAmp:0.15, inclinationPeriodDays:504, ascendingNode: 60, nodePrecessionDegPerYear: 8, distanceSwingPct:0.058, distancePeriodDays:448, apsisAngle:80,  apsisPrecessionDegPerYear:12 },
  // Dione analog:       ecc 0.0022, inc 0.03°
  Therendor:{ inclinationBase:0.03, inclinationAmp:0.01, inclinationPeriodDays:336, ascendingNode:210, nodePrecessionDegPerYear:10, distanceSwingPct:0.0044, distancePeriodDays:336, apsisAngle:140, apsisPrecessionDegPerYear:10 },
  // Mimas analog:       ecc 0.0196, inc 1.53°
  Eyre:     { inclinationBase:1.53, inclinationAmp:0.2, inclinationPeriodDays:336, ascendingNode: 25, nodePrecessionDegPerYear: 2, distanceSwingPct:0.0392, distancePeriodDays: 84, apsisAngle:10,  apsisPrecessionDegPerYear:120 },
  // Triton analog:      ecc 0.000016, inc 156.8° (retrograde)
  Dravago:  { inclinationBase:156.8, inclinationAmp:0.15, inclinationPeriodDays:672, ascendingNode:260, nodePrecessionDegPerYear: 6, distanceSwingPct:0, distancePeriodDays:672, apsisAngle:200, apsisPrecessionDegPerYear:18 },
  // Ganymede analog:    ecc 0.0013, inc 0.20°
  Nymm:     { inclinationBase:0.20, inclinationAmp:0.05, inclinationPeriodDays:336, ascendingNode:  0, nodePrecessionDegPerYear:360, distanceSwingPct:0.0026, distancePeriodDays:336, apsisAngle:  0, apsisPrecessionDegPerYear:0 },
  // Hyperion analog:    ecc 0.1230, inc 0.43°
  Lharvion: { inclinationBase:0.43, inclinationAmp:0.2, inclinationPeriodDays:420, ascendingNode: 40, nodePrecessionDegPerYear:10, distanceSwingPct:0.246, distancePeriodDays:560, apsisAngle:300, apsisPrecessionDegPerYear:80 },
  // Enceladus analog:   ecc 0.0047, inc 0.02°
  Barrakas: { inclinationBase:0.02, inclinationAmp:0.01, inclinationPeriodDays:168, ascendingNode:300, nodePrecessionDegPerYear:24, distanceSwingPct:0.0094, distancePeriodDays:224, apsisAngle:260, apsisPrecessionDegPerYear:48 },
  // Miranda analog:     ecc 0.0013, inc 4.34°
  Rhaan:    { inclinationBase:4.34, inclinationAmp:0.6, inclinationPeriodDays:441, ascendingNode: 45, nodePrecessionDegPerYear: 6, distanceSwingPct:0.0026, distancePeriodDays:504, apsisAngle: 90, apsisPrecessionDegPerYear:8 },
  // Phobos analog:      ecc 0.0151, inc 1.08°
  Sypheros: { inclinationBase:1.08, inclinationAmp:0.2, inclinationPeriodDays:560, ascendingNode:180, nodePrecessionDegPerYear: 4, distanceSwingPct:0.0302, distancePeriodDays:560, apsisAngle:150, apsisPrecessionDegPerYear:5 },
  // Iapetus analog:     ecc 0.0283, inc 7.57°
  Aryth:    { inclinationBase:7.57, inclinationAmp:0.4, inclinationPeriodDays:336, ascendingNode: 15, nodePrecessionDegPerYear:14, distanceSwingPct:0.0566, distancePeriodDays:336, apsisAngle:  0, apsisPrecessionDegPerYear:16 },
  // Oberon analog:      ecc 0.0014, inc 0.07°
  Vult:     { inclinationBase:0.07, inclinationAmp:0.03, inclinationPeriodDays:1008,ascendingNode:330, nodePrecessionDegPerYear: 2, distanceSwingPct:0.0028, distancePeriodDays:1008,apsisAngle:250, apsisPrecessionDegPerYear:2 }
};

export function _normDeg(n){
  n = n % 360;
  return (n < 0) ? (n + 360) : n;
}

export function _moonOrbitalParams(moonName, serial){
  serial = serial || 0;
  var canon = MOON_ORBITAL_DATA[moonName] || null;
  var tune  = MOON_MOTION_TUNING[moonName] || null;

  if (canon && tune){
    var ypd = _moonYearDays() || 336;
    var incPeriod = Math.max(1, tune.inclinationPeriodDays || ypd);
    var distPeriod = Math.max(1, tune.distancePeriodDays || ypd);

    var incl = (tune.inclinationBase || 0) +
      (tune.inclinationAmp || 0) * Math.sin((serial * 2 * Math.PI) / incPeriod);

    var node = _normDeg((tune.ascendingNode || 0) +
      serial * ((tune.nodePrecessionDegPerYear || 0) / ypd));

    var apsis = _normDeg((tune.apsisAngle || 0) +
      serial * ((tune.apsisPrecessionDegPerYear || 0) / ypd));

    var eccWave = Math.sin((serial * 2 * Math.PI) / distPeriod);
    var distFactor = 1 + (tune.distanceSwingPct || 0) * eccWave;
    var dist = canon.distance * distFactor;

    return {
      inclination: incl,
      ascendingNode: node,
      apsis: apsis,
      apparentSize: canon.angularSizeVsSun / Math.max(0.5, distFactor),
      diameter: canon.diameter,
      distance: dist
    };
  }

  // Fallback for unknown moons: deterministic seeded pseudo-orbit.
  var h = 0;
  for (var i = 0; i < moonName.length; i++){
    h = ((h << 5) - h + moonName.charCodeAt(i)) | 0;
  }
  var r = function(){ h = (h * 16807 + 0) % 2147483647; return (h & 0x7fffffff) / 2147483647; };
  r(); r(); // warm up
  var out: any = {
    inclination: 2 + r() * 6,
    ascendingNode: r() * 360,
    apparentSize: canon ? canon.angularSizeVsSun : (0.3 + r() * 0.7),
    diameter: canon ? canon.diameter : 1000,
    distance: canon ? canon.distance : 100000
  };
  out.apsis = r() * 360;
  return out;
}

export function _moonDistanceAt(moon, serial){
  var op = _moonOrbitalParams(moon.name, serial);
  if (op && isFinite(op.distance)) return op.distance;
  return moon.distance || 100000;
}

// Sky longitude of a moon at a given serial day.
// Based on synodic period: the moon completes one full 360° sky circuit per period.
// We use the same phase data but convert to angular position.
export function _moonSkyLong(moon, serial){
  var period = moon.synodicPeriod || 28;
  // Use phase to derive sky longitude: 0° = new (conjunction with sun), 180° = full (opposition)
  var ph = moonPhaseAt(moon.name, serial);
  // Illumination goes 0→1→0 over the cycle; we need continuous angle.
  // Waxing: 0→180°, Waning: 180→360°
  var angle;
  if (ph.waxing){
    angle = ph.illum * 180;       // 0% waxing = 0°, 100% waxing = 180°
  } else {
    angle = 180 + (1 - ph.illum) * 180; // 100% waning = 180°, 0% waning = 360°
  }
  return angle % 360;
}

// Sun's ecliptic longitude: advances ~1° per day in a 336-day year
export function _sunSkyLong(serial){
  var ypd = _planarYearDays();
  return ((serial % ypd) / ypd) * 360;
}

// Ecliptic latitude of a moon based on its orbital inclination and ascending node
export function _moonEclipticLat(moon, serial){
  var op = _moonOrbitalParams(moon.name, serial);
  var skyLong = _moonSkyLong(moon, serial);
  // Latitude oscillates with inclination as moon orbits
  var relLong = skyLong - op.ascendingNode;
  return op.inclination * Math.sin(relLong * Math.PI / 180);
}

export function _degSeparation(a, b){
  var d = Math.abs(a - b);
  return d > 180 ? 360 - d : d;
}

// ---------------------------------------------------------------------------
// 20k-0) Moon visibility — which moons are overhead right now?
// ---------------------------------------------------------------------------
// Computes altitude above/below the horizon for each moon at a given serial
// day and time-of-day fraction (0=midnight, 0.5=noon, 1=midnight again).
// Uses a consistent observer latitude (Sharn ≈ 30°N equivalent) and the
// moon's ecliptic longitude + latitude to derive altitude.
//
// Simplification: treats ecliptic ≈ celestial equator (axial tilt shifts
// everything, but for categorization into broad buckets this is fine).

export var OBSERVER_LATITUDE = 30;  // degrees N — Sharn equivalent

// Returns altitude in degrees (-90 to +90) for a moon at given time.
// Negative = below horizon.
export function _moonAltitude(moon, serial, timeFrac){
  if (!moon) return -90;
  var skyLong = _moonSkyLong(moon, serial);
  var eclLat  = _moonEclipticLat(moon, serial);
  var sunLong = _sunSkyLong(serial);
  // Hour angle: how far the moon is from the local meridian.
  // At midnight (timeFrac=0), the anti-sun point is overhead.
  // Moon's hour angle = (skyLong - sunLong - 180) + timeFrac*360
  var ha = (skyLong - sunLong - 180 + timeFrac * 360) % 360;
  if (ha < 0) ha += 360;
  if (ha > 180) ha = ha - 360;  // -180..180, 0=on meridian
  var haRad = ha * Math.PI / 180;
  var latRad = OBSERVER_LATITUDE * Math.PI / 180;
  var decRad = eclLat * Math.PI / 180;  // declination ≈ ecliptic latitude
  // Altitude formula: sin(alt) = sin(lat)sin(dec) + cos(lat)cos(dec)cos(ha)
  var sinAlt = Math.sin(latRad) * Math.sin(decRad) +
               Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * 180 / Math.PI;
}

// Visibility category from altitude.
export function _moonVisCategory(altDeg){
  if (altDeg > 60) return 'overhead';
  if (altDeg > 30) return 'high';
  if (altDeg > 10) return 'visible';
  if (altDeg > 0)  return 'horizon';
  return 'below';
}

// Labels and icons for visibility categories.
export var MOON_VIS_LABELS = {
  overhead: { label:'Overhead',    icon:'⬆', order:0, desc:'High in the sky, directly above.' },
  high:     { label:'High',        icon:'↗', order:1, desc:'Well above the horizon.' },
  visible:  { label:'Visible',     icon:'→', order:2, desc:'Above the horizon, in the sky.' },
  horizon:  { label:'On horizon',  icon:'↘', order:3, desc:'Low on the horizon.' },
  below:    { label:'Below horizon',icon:'↓', order:4, desc:'Not visible.' }
};

// Returns an array of { moon, altitude, category, vis } for all moons,
// sorted by altitude descending. `timeFrac` defaults to 0 (midnight).
export function _moonVisibilityAll(serial, timeFrac){
  if (timeFrac == null) timeFrac = 0;  // default midnight
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons) return [];
  var results = [];
  for (var i = 0; i < sys.moons.length; i++){
    var moon = sys.moons[i];
    var alt = _moonAltitude(moon, serial, timeFrac);
    var cat = _moonVisCategory(alt);
    var ph = moonPhaseAt(moon.name, serial);
    results.push({
      moon: moon,
      altitude: Math.round(alt),
      category: cat,
      vis: MOON_VIS_LABELS[cat],
      phase: ph
    });
  }
  results.sort(function(a, b){ return b.altitude - a.altitude; });
  return results;
}

// Build HTML panel for "which moons are visible now"
export function _moonVisibilityHtml(serial, timeFrac){
  var all = _moonVisibilityAll(serial, timeFrac);
  if (!all.length) return '';
  var groups = {};
  var catOrder = ['overhead','high','visible','horizon','below'];
  for (var ci = 0; ci < catOrder.length; ci++) groups[catOrder[ci]] = [];
  for (var i = 0; i < all.length; i++){
    var r = all[i];
    groups[r.category].push(r);
  }
  var html = '';
  for (var gi = 0; gi < catOrder.length; gi++){
    var cat = catOrder[gi];
    var g = groups[cat];
    if (!g.length) continue;
    var vis = MOON_VIS_LABELS[cat];
    html += '<div style="margin:3px 0;"><b>' + vis.icon + ' ' + esc(vis.label) + '</b>';
    var names = [];
    for (var mi = 0; mi < g.length; mi++){
      var r = g[mi];
      var ph = r.phase;
      var emoji = _moonPhaseEmoji(ph.illum, ph.waxing);
      var pct = Math.round(ph.illum * 100);
      names.push(emoji + ' ' + esc(r.moon.name) + ' <span style="opacity:.5;">(' + pct + '%)</span>');
    }
    html += '<div style="margin-left:12px;font-size:.88em;">' + names.join(', ') + '</div>';
    html += '</div>';
  }
  return html;
}

export function _clamp01(x){
  return x < 0 ? 0 : (x > 1 ? 1 : x);
}

// Approximate apparent solar diameter in degrees. Used to normalize angular
// separations into the same units as apparentSizeVsSun.
export var _SUN_ANGULAR_DIAM_DEG = 0.53;
export var _eclipseDayCache = Object.create(null);

export function _eclipseTimeBlock(frac){
  var h = ((frac % 1) + 1) % 1 * 24;
  if (h < 4)  return 'middle_of_night';
  if (h < 8)  return 'early_morning';
  if (h < 12) return 'morning';
  if (h < 16) return 'afternoon';
  if (h < 20) return 'evening';
  return 'nighttime';
}

export function _moonByName(sys, name){
  var moons = (sys && sys.moons) ? sys.moons : [];
  for (var i = 0; i < moons.length; i++){
    if (moons[i].name === name) return moons[i];
  }
  return null;
}

export function _diskOverlapFraction(rFront, rBack, sep){
  rFront = Math.max(0, rFront || 0);
  rBack  = Math.max(0, rBack  || 0);
  sep    = Math.max(0, sep    || 0);
  if (rFront <= 0 || rBack <= 0) return 0;
  if (sep >= rFront + rBack) return 0;

  // One disk fully inside the other.
  if (sep <= Math.abs(rFront - rBack)){
    var fullyCoveredArea = Math.PI * Math.min(rFront, rBack) * Math.min(rFront, rBack);
    return _clamp01(fullyCoveredArea / (Math.PI * rBack * rBack));
  }

  // Partial overlap area of two circles.
  var _c1 = (sep*sep + rFront*rFront - rBack*rBack) / (2 * sep * rFront);
  var _c2 = (sep*sep + rBack*rBack  - rFront*rFront) / (2 * sep * rBack);
  _c1 = Math.max(-1, Math.min(1, _c1));
  _c2 = Math.max(-1, Math.min(1, _c2));
  var a1 = Math.acos(_c1);
  var a2 = Math.acos(_c2);
  var area = rFront*rFront*a1 + rBack*rBack*a2 -
    0.5 * Math.sqrt(Math.max(0, (-sep + rFront + rBack) * (sep + rFront - rBack) * (sep - rFront + rBack) * (sep + rFront + rBack)));

  return _clamp01(area / (Math.PI * rBack * rBack));
}

export function _eclipseMetricsAt(sys, e, t){
  if (!e) return null;

  if (e.kind === 'solar'){
    var sm = _moonByName(sys, e.moon);
    if (!sm) return null;
    var op = _moonOrbitalParams(sm.name, t);
    var dLong = _degSeparation(_moonSkyLong(sm, t), _sunSkyLong(t));
    var dLat  = Math.abs(_moonEclipticLat(sm, t));
    var sepDeg = Math.sqrt(dLong*dLong + dLat*dLat);
    var sepSun = sepDeg / _SUN_ANGULAR_DIAM_DEG;
    var rMoon = (op.apparentSize || 0) / 2;
    var rSun  = 0.5;
    return {
      cover: _diskOverlapFraction(rMoon, rSun, sepSun),
      occulting: sm.name,
      occluded: 'Sun',
      occludingDiameter: op.apparentSize || 0,
      occludedDiameter: 1.0,
      skyMoon: sm.name
    };
  }

  if (e.kind === 'lunar'){
    var moonA = _moonByName(sys, e.a);
    var moonB = _moonByName(sys, e.b);
    if (!moonA || !moonB) return null;

    var distA = _moonDistanceAt(moonA, t);
    var distB = _moonDistanceAt(moonB, t);
    var front = (distA <= distB) ? moonA : moonB;
    var back  = (front === moonA) ? moonB : moonA;
    var fop = _moonOrbitalParams(front.name, t);
    var bop = _moonOrbitalParams(back.name, t);
    var dLong2 = _degSeparation(_moonSkyLong(front, t), _moonSkyLong(back, t));
    var dLat2  = Math.abs(_moonEclipticLat(front, t) - _moonEclipticLat(back, t));
    var sepDeg2 = Math.sqrt(dLong2*dLong2 + dLat2*dLat2);
    var sepSun2 = sepDeg2 / _SUN_ANGULAR_DIAM_DEG;
    return {
      cover: _diskOverlapFraction((fop.apparentSize || 0) / 2, (bop.apparentSize || 0) / 2, sepSun2),
      occulting: front.name,
      occluded: back.name,
      occludingDiameter: fop.apparentSize || 0,
      occludedDiameter: bop.apparentSize || 0,
      skyMoon: front.name
    };
  }

  return null;
}

export function _eclipsePeakSkyLabel(sys, moonName, t){
  var moon = _moonByName(sys, moonName);
  if (!moon) return null;
  var frac = ((t % 1) + 1) % 1;
  var alt = _moonAltitude(moon, t, frac);
  var cat = _moonVisCategory(alt);
  if (cat === 'below') return null;
  return (MOON_VIS_LABELS[cat] || {}).label || null;
}

export function _eclipseCacheKey(serial){
  var st = ensureSettings();
  var ms = getMoonState();
  return [
    st.calendarSystem || '',
    serial|0,
    ms.systemSeed || '',
    JSON.stringify(ms.gmAnchors || {}),
    ms.generatedFrom || '',
    ms.generatedThru || ''
  ].join('|');
}

export function _finalizeEclipseEvent(sys, startT, endT, peak){
  if (!peak || !peak.metrics) return null;
  var cover = _clamp01(peak.metrics.cover || 0);
  if (cover <= 0) return null;

  var peakSkyLabel = _eclipsePeakSkyLabel(sys, peak.metrics.skyMoon, peak.t);
  if (!peakSkyLabel) return null;

  var sizeRatio = (peak.metrics.occludingDiameter || 0) / Math.max(0.0001, peak.metrics.occludedDiameter || 0);
  var typeLabel = (cover > 0.98) ? 'Total Eclipse' : (sizeRatio > 0.75 ? 'Partial Eclipse' : 'Transit');

  return {
    id: [peak.metrics.occulting, peak.metrics.occluded, Math.round(peak.t * 96)].join('|'),
    occulting: peak.metrics.occulting,
    occluded: peak.metrics.occluded,
    typeLabel: typeLabel,
    startT: startT,
    peakT: peak.t,
    endT: endT,
    startDay: Math.floor(startT),
    peakDay: Math.floor(peak.t),
    endDay: Math.floor(endT),
    startBucket: _eclipseTimeBlock(startT),
    peakBucket: _eclipseTimeBlock(peak.t),
    endBucket: _eclipseTimeBlock(endT),
    peakCoverage: cover,
    peakCoveragePct: Math.max(1, Math.round(cover * 100)),
    sizeRatio: sizeRatio,
    sizePct: Math.max(1, Math.round(sizeRatio * 100)),
    peakSkyLabel: peakSkyLabel
  };
}

export function _eclipseTimingClause(kind, event, serial){
  var bucketLabel = _weatherPeriodLabel(event[kind + 'Bucket']);
  var day = event[kind + 'Day'];
  if (kind === 'start'){
    if (day < serial) return 'Began yesterday in the ' + bucketLabel;
    if (day > serial) return 'Beginning tomorrow in the ' + bucketLabel;
    return 'Beginning in the ' + bucketLabel;
  }
  if (kind === 'peak'){
    if (day < serial) return 'Peaked yesterday in the ' + bucketLabel + ' while ' + event.peakSkyLabel;
    if (day > serial) return 'Peaking tomorrow in the ' + bucketLabel + ' while ' + event.peakSkyLabel;
    return 'Peaking in the ' + bucketLabel + ' while ' + event.peakSkyLabel;
  }
  if (day < serial) return 'Ended yesterday in the ' + bucketLabel;
  if (day > serial) return 'Ending tomorrow in the ' + bucketLabel;
  return (event.startDay < serial ? 'Ending this ' : 'Ending in the ') + bucketLabel;
}

export function _eclipseLifecycleText(event, serial){
  return [
    _eclipseTimingClause('start', event, serial),
    _eclipseTimingClause('peak', event, serial),
    _eclipseTimingClause('end', event, serial)
  ].join(', ') + '.';
}

export function _eclipseSentenceType(typeLabel){
  return (typeLabel === 'Transit') ? 'Transit' : typeLabel.replace(' Eclipse', ' eclipse');
}

/* Legacy eclipse review path removed; see git history if older heuristics are needed.
// function _getEclipsesLegacy(serial){
  var st = ensureSettings();
  if (st.moonsEnabled === false) return [];

  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons) return [];

  serial = serial|0;
  moonEnsureSequences(serial, 3);

  var cacheKey = _eclipseCacheKey(serial);
  if (_eclipseDayCache[cacheKey]) return _eclipseDayCache[cacheKey];

  var moons = sys.moons;
  var eclipses = [];

  // Solar eclipses: moon near new phase AND ecliptic latitude near 0
  for (var i = 0; i < moons.length; i++){
    var ph = moonPhaseAt(moons[i].name, serial);
    if (ph.illum > 0.08) continue; // must be very near new

    var lat = _moonEclipticLat(moons[i], serial);
    if (Math.abs(lat) < 1.5){ // within 1.5° of ecliptic — solar eclipse
      var depth = 1 - (Math.abs(lat) / 1.5); // 0–1, 1 = perfect alignment
      var op = _moonOrbitalParams(moons[i].name, serial);
      // A moon can only produce a total eclipse if its apparent size >= the sun's (1.0)
      var type;
      if (op.apparentSize >= 1.0 && depth > 0.85)
        type = 'total solar';
      else if (op.apparentSize >= 0.7 && depth > 0.5)
        type = 'partial solar';
      else
        type = 'transit'; // small moon crossing the sun — visible but not dramatic
      eclipses.push({
        type: type,
        moon: moons[i].name,
        depth: depth,
        apparentSize: op.apparentSize,
        description: esc(moons[i].name) + ' ' + type + ' eclipse' +
          (type === 'total solar' ? ' \u2014 the sky darkens!' : '')
      });
    }
  }

  // Moon-moon eclipses: two moons at similar sky longitude AND similar ecliptic latitude
  for (var a = 0; a < moons.length; a++){
    for (var b = a + 1; b < moons.length; b++){
      var longA = _moonSkyLong(moons[a], serial);
      var longB = _moonSkyLong(moons[b], serial);
      var dLong = Math.abs(longA - longB);
      if (dLong > 180) dLong = 360 - dLong;
      if (dLong > 8) continue; // must be within 8° of each other

      var latA = _moonEclipticLat(moons[a], serial);
      var latB = _moonEclipticLat(moons[b], serial);
      var dLat = Math.abs(latA - latB);
      if (dLat > 3) continue; // must be within 3° ecliptic latitude

      // Which moon is in front? Use modeled orbital distance for this day.
      // In this setting, synodic cadence is magical and not a proxy for distance.
      var phA = moonPhaseAt(moons[a].name, serial);
      var phB = moonPhaseAt(moons[b].name, serial);
      var distA = _moonDistanceAt(moons[a], serial);
      var distB = _moonDistanceAt(moons[b], serial);
      var closer = (distA <= distB) ? moons[a] : moons[b];
      var farther = (closer === moons[a]) ? moons[b] : moons[a];
      var fartherPh = (closer === moons[a]) ? phB : phA;

      // Only visually notable if the farther moon is bright enough to see the occultation
      if (fartherPh.illum < 0.3) continue;

      var conjDepth = 1 - (Math.max(dLong, dLat) / 8);
      eclipses.push({
        type: 'lunar conjunction',
        moon: closer.name,
        occultedMoon: farther.name,
        depth: conjDepth,
        description: esc(closer.name) + ' occults ' + esc(farther.name) +
          (conjDepth > 0.7 ? ' — dramatic alignment!' : ' — close conjunction')
      });
    }
  }

  return eclipses;
}

// Legacy notable-text formatter retained for reference during review.
// function _eclipseNotableTodayLegacy(serial){
  var st = ensureSettings();
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  var ecl = _getEclipsesLegacy(serial);
  var notes = [];
  for (var i = 0; i < ecl.length; i++){
    var ti = _estimateEclipseTiming(serial, ecl[i], sys);
    var dur = ti ? (Math.round(ti.durationHours * 10) / 10) : null;
    var tInfo = ti
      ? ' <span style="opacity:.75;">(' + esc(ti.startBlock) + '→' + esc(ti.endBlock) +
        ', peaks ' + esc(ti.peakBlock) + ', ~' + dur + 'h, ~' + ti.peakCoveragePct + '% cover)</span>'
      : '';
    if (ecl[i].type === 'total solar')
      notes.push('\uD83C\uDF11\u2600\uFE0F <b>Total eclipse!</b> ' + ecl[i].description + tInfo);
    else if (ecl[i].type === 'partial solar')
      notes.push('\uD83C\uDF11 ' + ecl[i].description + tInfo);
    else if (ecl[i].type === 'lunar conjunction' && ecl[i].depth > 0.5)
      notes.push('\uD83C\uDF15 ' + ecl[i].description + tInfo);
  }
  return notes;
}

*/
// Replacement eclipse engine: groups physical overlap windows across midnight
// and reports only true disk overlaps that peak above the horizon.
export function getEclipses(serial){
  var st = ensureSettings();
  if (st.moonsEnabled === false) return [];

  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons) return [];

  serial = serial|0;
  moonEnsureSequences(serial, 3);

  var cacheKey = _eclipseCacheKey(serial);
  if (_eclipseDayCache[cacheKey]) return _eclipseDayCache[cacheKey];

  var descriptors = [];
  var moons = sys.moons;
  for (var i = 0; i < moons.length; i++){
    descriptors.push({ kind: 'solar', moon: moons[i].name });
  }
  for (var a = 0; a < moons.length; a++){
    for (var b = a + 1; b < moons.length; b++){
      descriptors.push({ kind: 'lunar', a: moons[a].name, b: moons[b].name });
    }
  }

  var eclipses = [];
  var windowStart = serial - 1;
  var windowEnd = serial + 2;
  var dt = 1 / 96;

  for (var di = 0; di < descriptors.length; di++){
    var active = false;
    var startT = 0;
    var endT = 0;
    var peak = null;

    for (var t = windowStart; t <= windowEnd + 1e-9; t += dt){
      var metrics = _eclipseMetricsAt(sys, descriptors[di], t);
      var cover = metrics ? metrics.cover : 0;
      if (cover > 0){
        if (!active){
          active = true;
          startT = t;
          peak = { t: t, metrics: metrics };
        }
        endT = t;
        if (!peak || cover > (peak.metrics.cover || 0)){
          peak = { t: t, metrics: metrics };
        }
      } else if (active){
        var finished = _finalizeEclipseEvent(sys, startT, endT, peak);
        if (finished && finished.startT < serial + 1 && finished.endT >= serial){
          eclipses.push(finished);
        }
        active = false;
        peak = null;
      }
    }

    if (active){
      var trailing = _finalizeEclipseEvent(sys, startT, endT, peak);
      if (trailing && trailing.startT < serial + 1 && trailing.endT >= serial){
        eclipses.push(trailing);
      }
    }
  }

  eclipses.sort(function(x, y){ return x.peakT - y.peakT; });
  _eclipseDayCache[cacheKey] = eclipses;
  _cullCacheIfLarge(_eclipseDayCache, 180);
  return eclipses;
}

export function _eclipseNotableToday(serial){
  var ecl = getEclipses(serial);
  var notes = [];
  for (var i = 0; i < ecl.length; i++){
    var ev = ecl[i];
    notes.push(
      '\uD83C\uDF18 <b>' + esc(_eclipseSentenceType(ev.typeLabel)) + '</b> of ' +
      esc(ev.occluded) + ' by ' + esc(ev.occulting) +
      ', covering ' + ev.peakCoveragePct + '% of ' + esc(ev.occluded) + '. ' +
      esc(ev.occulting) + ' appears ' + ev.sizePct + '% as wide as ' + esc(ev.occluded) + '. ' +
      esc(_eclipseLifecycleText(ev, serial))
    );
  }
  return notes;
}


// ---------------------------------------------------------------------------
// 20l) Tidal influence — Zarantyr only
// ---------------------------------------------------------------------------
// By campaign design, only Zarantyr's magical mass influences tides.
// Returns 0–10 scale: 0=neap, 10=extreme spring tide.

export function getTidalIndex(serial){
  var st = ensureSettings();
  if (st.moonsEnabled === false) return 5; // neutral
  var sys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
  if (!sys || !sys.moons) return 5;
  moonEnsureSequences();

  var moon = null;
  for (var i = 0; i < sys.moons.length; i++){
    if (String(sys.moons[i].name || '').toLowerCase() === 'zarantyr'){
      moon = sys.moons[i];
      break;
    }
  }
  if (!moon) return 5;

  // Phase alignment: strongest at full/new, weakest at quarter.
  var ph = moonPhaseAt(moon.name, serial);
  var alignment = Math.abs(Math.cos(ph.illum * Math.PI));
  var phaseScale = 0.2 + 0.8 * alignment;

  // Distance swing from movement tuning modulates tidal strength.
  var baseDist = moon.distance || 100000;
  var distNow = _moonDistanceAt(moon, serial);
  var distBoost = Math.pow(baseDist / Math.max(1, distNow), 3);
  var raw = phaseScale * distBoost;

  // Map expected range to 0..10 with clamping.
  var tune = MOON_MOTION_TUNING[moon.name] || {};
  var swing = Math.max(0, tune.distanceSwingPct || 0);
  var minRaw = 0.2 * Math.pow(1 / (1 + swing), 3);
  var maxRaw = 1.0 * Math.pow(1 / Math.max(0.01, (1 - swing)), 3);
  var scaled = (raw - minRaw) / Math.max(0.0001, (maxRaw - minRaw));
  return Math.max(0, Math.min(10, Math.round(scaled * 10)));
}

// Human-readable tidal description
export function tidalLabel(index){
  if (index <= 1) return 'Dead calm (neap)';
  if (index <= 3) return 'Low tides';
  if (index <= 5) return 'Normal tides';
  if (index <= 7) return 'High tides';
  if (index <= 8) return 'Spring tides';
  return 'Extreme tides \u2014 coastal flooding risk';
}


// ---------------------------------------------------------------------------
// 20m) Long Shadows — Mabar pulls the nearest moon(s) into darkness
// ---------------------------------------------------------------------------
// During Long Shadows, Mabar's coterminous period forces the nearest moon(s)
// to new phase. Uses a tapered gobble zone: the closer the nearest new moon
// is to the window midpoint, the wider the search for additional moons to claim.
// See _longShadowsClaimedMoons() for the full algorithm.
//
// Core logic lives above moonPhaseAt since it reads sequences directly
// (using _moonPhaseAtRaw would cause recursion with moonPhaseAt).

export function getLongShadowsMoons(year){
  // Public API: returns array of { name, distToNew } for claimed moons
  var claimed = _longShadowsClaimedMoons(year);
  var results = [];
  for (var i = 0; i < claimed.length; i++){
    results.push({ name: claimed[i] });
  }
  return results;
}


// ---------------------------------------------------------------------------
// 20n) Spontaneous planar episodes — seeded rare coterminous/remote flickers
// ---------------------------------------------------------------------------
// Canonical cycles remain the baseline. This layer adds sparse "unstructured"
// events without overwhelming regular lore-timed moments.
//
// Mechanics:
//   - One seeded trigger roll per plane per year (not per month)
//   - Plane-specific rarity profile (Mabar extremely rare, Kythri/Shavarath higher)
//   - Short durations by default (Kythri can run longer)
//   - GM overrides/anchors suppress flickering for that plane
//   - For cyclic planes, only applies while waning/waxing (preserves canon anchors)
//
// Weather effects still flow through getActivePlanarEffects naturally.

// Planes that never flicker
export var GENERATED_SEALED = { 'Dal Quor':true };

// ---------------------------------------------------------------------------
// 21d) Non-canonical planar shifts (generated off-cycle movements)
// ---------------------------------------------------------------------------
// Planes occasionally become coterminous or remote outside their canonical
// cycle windows. These are rare, deterministically seeded events checked
// per-day per-plane. They represent the inherent unpredictability of the
// planar cosmology — genuine (if unusual) shifts that scholars and mystics
// would track and study.
//
// GENERATION: For each day, each plane rolls two dice:
//   1) Trigger: 1 on a d(triggerDie) — "did something happen?"
//   2) Confirm: 1 on a d(confirmDie) — "did it actually manifest?"
// Both must hit for an event to start on that day.
//
// DURATION: d10 bell curve centered on short durations:
//   1-3: 1 day  (30%)     4-5: 2-3 days  (20%)
//   6-7: 4-5 days (20%)   8: 5-7 days    (10%)
//   9: 8-10 days  (10%)   10: add 10 + reroll (rare extended events)
//
// PHASE: d100 vs phaseBias determines coterminous or remote.
//
// STATE: Zero storage cost. Everything is deterministic from the global
// seed + plane name + serial day number.
// ---------------------------------------------------------------------------

// Per-plane rarity profiles. Combined chance per day = 1/(trigger × confirm).
// Expected frequency shown in comments assuming 336-day year.
//
// Each plane also has:
//   durationFn: optional function(serial) -> days. If absent, uses default d10 curve.
//   phaseBias:  1-100. ≤ value = coterminous, > value = remote.
//              50 = equal chance. Most planes use 50 (fair coin).
//   loreNote:  flavor text explaining why this plane behaves this way.
// ---------------------------------------------------------------------------
// 21a) Generated planar event profiles
// ---------------------------------------------------------------------------
// Each plane has a unique dice mechanic for triggering off-cycle events.
// Probabilities are derived from canonical activity densities.
// See design doc for full derivation of each plane's dice.
//
// Profile fields:
//   mechanism: 'standard' | 'linked' | 'moontied' | 'cooldown'
//   dice: array of { die, hit } — all must hit for event to fire
//         hit can be: number (exact), [lo,hi] (range), 'phase' (special)
//   duration: number | { die } | { options, weights }
//   phaseBias: number 0-100 (% coterminous) OR 'dice' (phase chosen by dice roll)
//   phaseRule: optional function(serial, diceResults) → 'coterminous'|'remote'|null
//   suppressDuringCanon: true (default) — skip generation when plane is already active
//   loreNote: flavor text for display
// ---------------------------------------------------------------------------

export var PLANAR_GENERATED_EVENT_PROFILE = {

  // SHAVARATH — The Eternal Battleground
  // "Frequently grows coterminous for a single day." d20 attack roll + d12 damage.
  // d20(14-20) × d12(12). P = 7/240 ≈ 1/34. ~9.8 events/yr. 1d only. 100% coterminous.
  // Suppressed during canonical remote year.
  'Shavarath': {
    expectedPerYear: 9.8,
    mechanism: 'standard',
    dice: [
      { die: 20, hit: [14, 20] },
      { die: 12, hit: 12 }
    ],
    duration: 1,
    phaseBias: 100,
    loreNote: 'Shavarath spills into the world in sudden violent bursts — single-day battle spikes that were critical for strategy during the Last War.'
  },

  // LAMANNIA — The Twilight Forest
  // LAMANNIA — The Twilight Forest
  // Baker: coterminous/remote "often tied to its associated moon Olarune's phases"
  // Hybrid mechanism: ~70% moon-tied (Olarune full/new), ~30% standard dice.
  // Moon-tied: on Olarune full days, d20 hit 18-20 (15%) → coterminous.
  //            on Olarune new days, d20 hit 1-3 (15%) → remote.
  //   ~10 full + ~10 new days/yr × 15% = ~3.0 moon-tied events/yr.
  // Standard fallback: d100 hit 1 (remote) or 100 (coterminous) → ~1.2/yr.
  // Total: ~4.2 events/yr. d3 duration.
  'Lamannia': {
    expectedPerYear: 4.2,
    mechanism: 'hybrid_moon',
    moonName: 'Olarune',
    moonDie: 20,
    moonFullHit: [18, 20],   // 18-20 on full → coterminous
    moonNewHit:  [1, 3],     // 1-3 on new → remote
    fallbackDice: [
      { die: 100, hit: 100, remoteHit: 1 }
    ],
    duration: { die: 3 },
    phaseBias: 'dice',
    loreNote: 'Lamannia pulses with the natural world — its surges often track the phases of Olarune, the Sentinel Moon. When the moon is full, primal energy floods in. When the moon is dark, the world feels distant from nature.'
  },

  // FERNIA — The Sea of Fire (linked with Risia)
  // Single d20: 20=Fernia, 1=Risia. Then d10: 1=remote, 10=coterminous.
  // Per-plane P = 1/100. ~3.36 events/yr each. d3 duration. 50/50 phase.
  // Only one of Fernia/Risia can fire per day (mutually exclusive).
  'Fernia': {
    expectedPerYear: 3.4,
    mechanism: 'linked',
    linkedWith: 'Risia',
    selectorDie: 20, selectorHit: 20, // Fernia fires on 20
    dice: [
      { die: 10, hit: 10, remoteHit: 1 }
    ],
    duration: { die: 3 },
    phaseBias: 'dice',
    loreNote: 'Fernia flares are sudden and intense — eruptions of heat between canonical cycles.'
  },

  // RISIA — The Plain of Ice (linked with Fernia)
  // Same d20 selector: 1=Risia. Then d10: 1=remote, 10=coterminous.
  'Risia': {
    expectedPerYear: 3.4,
    mechanism: 'linked',
    linkedWith: 'Fernia',
    selectorDie: 20, selectorHit: 1, // Risia fires on 1
    dice: [
      { die: 10, hit: 10, remoteHit: 1 }
    ],
    duration: { die: 3 },
    phaseBias: 'dice',
    loreNote: 'Risia creeps in slowly, like frost on a windowpane — cold surges between canonical cycles.'
  },

  // THELANIS — The Faerie Court
  // d20(20) × d12(1=remote, 12=coterminous). P = 2/240 = 1/120. ~2.8 events/yr.
  // Duration: 3d or 7d (coin flip). Story-number durations.
  'Thelanis': {
    expectedPerYear: 2.8,
    mechanism: 'standard',
    dice: [
      { die: 20, hit: 20 },
      { die: 12, hit: 12, remoteHit: 1 }
    ],
    duration: { options: [3, 7], weights: [50, 50] },
    phaseBias: 'dice',
    loreNote: 'Thelanis moves to the rhythm of stories — its generated events arrive in narrative beats of three or seven days.'
  },

  // IRIAN — The Eternal Dawn
  // d4(4) × d4(4) × d20(1=remote, 20=coterminous). P = 2/320 = 1/160. ~2.1 events/yr.
  // d3 duration. 50/50 phase.
  'Irian': {
    expectedPerYear: 2.1,
    mechanism: 'standard',
    dice: [
      { die: 4,  hit: 4 },
      { die: 4,  hit: 4 },
      { die: 20, hit: 20, remoteHit: 1 }
    ],
    duration: { die: 3 },
    phaseBias: 'dice',
    loreNote: 'Irian surges feel like unexpected dawn — warmth and light swelling gently.'
  },

  // MABAR — The Endless Night
  // d20(1) × d4(1), then d4(1-3=coterminous, 4=remote). P = 1/80. ~4.2 events/yr.
  // 1 night (coterminous) or 1 day (remote) only.
  // Coterminous events are night-only; remote events are day-only.
  'Mabar': {
    expectedPerYear: 4.2,
    mechanism: 'standard',
    dice: [
      { die: 20, hit: 1 },
      { die: 4,  hit: 1 }
    ],
    duration: 1,
    phaseBias: 75, // 3/4 coterminous, 1/4 remote — matches 15:5 canonical ratio
    phaseNote: { coterminous: '(night only — sundown to sunrise)', remote: '(day only — sunrise to sundown)' },
    loreNote: 'Non-canonical Mabar surges are deeply feared. Coterminous shifts bring darkness at night; remote brings respite during the day.'
  },

  // DOLURRH — The Realm of the Dead (moon-tied to Aryth)
  // No daily dice. On Aryth full moon: d20(11-20)=coterminous. On Aryth new moon: d20(11-20)=remote.
  // Aryth period: 90.8d = ~3.7 cycles/yr. ~1.85 cot + ~1.85 remote per year. 1d only.
  'Dolurrh': {
    expectedPerYear: 3.7,
    mechanism: 'moontied',
    moonName: 'Aryth',
    moonDie: 20,
    moonHitRange: [11, 20], // roll 11-20 = fires (50% on full/new day)
    fullMoonPhase: 'coterminous',
    newMoonPhase: 'remote',
    duration: 1,
    loreNote: 'Dolurrh shifts are tied to the movements of the moon Aryth — like a death saving throw at the gateway between worlds.'
  },

  // DAANVI — The Perfect Order (cooldown-based)
  // d20 daily (1 only = 5%), then d10: 1-5=remote, 6-10=coterminous (50/50).
  // ~16.8 events/year. 10-day events + 10-day cooldown.
  // Balancing Act mechanic:
  // For 10 days after an event ends, if a new event triggers, roll d10.
  // If d10 >= (11 - days_since_last_event_ended), force opposite phase.
  // Day 1: always forced opposite. Day 10: 10% chance. Day 11+: no forcing.
  'Daanvi': {
    expectedPerYear: 16.8,
    mechanism: 'cooldown',
    gateDie: 20, gateHitRange: [1, 1],  // 5% per day — about 16.8 events/year
    phaseDie: 10, // 1-5=remote, 6-10=coterminous (50/50)
    duration: 10,
    balancingAct: true, // Balancing Act — favors alternation (cot->rem->cot)
    loreNote: 'Daanvi follows orderly cycles: coterminous, nothing, remote, nothing. The 50/50 split with balancing act enforces alternation.'
  },

  // KYTHRI — The Churning Chaos
  // d100 (100=coterminous, 1=remote). P = 2/100 = 1/50. ~6.72 events/yr.
  // d12 duration (1-12 days). No mechanical effects.
  'Kythri': {
    expectedPerYear: 6.7,
    mechanism: 'standard',
    dice: [
      { die: 100, hit: 100, remoteHit: 1 }
    ],
    duration: { die: 12 },
    phaseBias: 'dice',
    loreNote: 'Kythri lurches erratically — generated shifts suit it better than any fixed rhythm. No discernable effects on the Material Plane.'
  },

  // XORIAT — The Realm of Madness
  // d100(1) × d4(1). P = 1/400. ~0.84 events/yr.
  // d20 duration (1-20 days). Remote only. Rarer than Kythri, longer.
  'Xoriat': {
    expectedPerYear: 0.84,
    mechanism: 'standard',
    dice: [
      { die: 100, hit: 1 },
      { die: 4,   hit: 1 }
    ],
    duration: { die: 20 },
    phaseBias: 0, // 100% remote
    loreNote: 'Xoriat shifts are slow and creeping — the Realm of Madness seeping through the Gatekeeper seals. Remote only.'
  },

  // SYRANIA — The Azure Sky
  // d100(100) × d4(4) × d8(1=remote, 8=coterminous). P = 2/3200 = 1/1600. ~0.21 events/yr.
  // 1d only. 50/50 phase. Coterminous forces clear/calm weather.
  'Syrania': {
    expectedPerYear: 0.21,
    mechanism: 'standard',
    dice: [
      { die: 100, hit: 100 },
      { die: 4,   hit: 4 },
      { die: 8,   hit: 8, remoteHit: 1 }
    ],
    duration: 1,
    phaseBias: 'dice',
    weatherOverride: { coterminous: { precip: 0, wind: 0 } },
    loreNote: 'Syrania generated events are moments of unexpected serenity — or the sudden absence of peace. Coterminous days bring clear skies.'
  },

  // DAL QUOR — The Region of Dreams (sealed — no generation)
  'Dal Quor': { mechanism: 'sealed' },

  __default: { mechanism: 'standard', dice: [{ die: 100, hit: 1 }, { die: 20, hit: 1 }], duration: { die: 3 }, phaseBias: 50 }
};

// Duration: resolve from new profile format.
export function _generatedEventDurationDays(planeName, serial){
  var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName] || PLANAR_GENERATED_EVENT_PROFILE.__default;
  var dur = profile.duration;
  if (typeof dur === 'number') return dur;
  if (dur && typeof dur.die === 'number'){
    return Math.max(1, _dN(serial, planeName + '_gen_dur', dur.die));
  }
  if (dur && dur.options && dur.weights){
    // Weighted pick from options array
    var r = _dN(serial, planeName + '_gen_dur_pick', 100);
    var cumul = 0;
    for (var i = 0; i < dur.options.length; i++){
      cumul += dur.weights[i];
      if (r <= cumul) return dur.options[i];
    }
    return dur.options[dur.options.length - 1];
  }
  // Fallback
  return Math.max(1, _dN(serial, planeName + '_gen_dur_fb', 3));
}

// Check whether a new generated event starts on a given serial for a given plane.
// Supports four mechanisms: standard, linked, moontied, cooldown.
export function _generatedEventStartsOnDay(planeName, serial){
  if (GENERATED_SEALED[planeName]) return null;
  var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName] || PLANAR_GENERATED_EVENT_PROFILE.__default;
  if (!profile || profile.mechanism === 'sealed') return null;

  var salt = planeName + '_gen_' + serial;

  // ── STANDARD mechanism: roll N dice, all must hit ──
  if (profile.mechanism === 'standard'){
    var diceArr = profile.dice || [];
    var phaseFromDice = null;
    for (var di = 0; di < diceArr.length; di++){
      var d = diceArr[di];
      var roll = _dN(serial, salt + '_d' + di, d.die);
      var hit = false;
      if (Array.isArray(d.hit)){
        hit = (roll >= d.hit[0] && roll <= d.hit[1]);
      } else {
        hit = (roll === d.hit);
      }
      // Check remoteHit too
      var remoteHit = false;
      if (d.remoteHit != null){
        if (Array.isArray(d.remoteHit)){
          remoteHit = (roll >= d.remoteHit[0] && roll <= d.remoteHit[1]);
        } else {
          remoteHit = (roll === d.remoteHit);
        }
      }
      if (!hit && !remoteHit) return null;
      if (remoteHit && !hit) phaseFromDice = 'remote';
      else if (hit && !remoteHit && d.remoteHit != null) phaseFromDice = 'coterminous';
    }

    var dur = _generatedEventDurationDays(planeName, serial);
    var phase;
    if (profile.phaseBias === 'dice' && phaseFromDice){
      phase = phaseFromDice;
    } else if (typeof profile.phaseBias === 'number'){
      var pRoll = _dN(serial, salt + '_phase', 100);
      phase = (pRoll <= profile.phaseBias) ? 'coterminous' : 'remote';
    } else {
      phase = 'coterminous';
    }

    return {
      startSerial: serial, endSerial: serial + dur - 1,
      durationDays: dur, phase: phase
    };
  }

  // ── LINKED mechanism (Fernia/Risia): single selector die picks which plane rolls ──
  if (profile.mechanism === 'linked'){
    // Use a canonical salt that's the same regardless of which plane we're checking.
    // Sort the two names alphabetically so both planes use the same selector roll.
    var pairKey = [planeName, profile.linkedWith].sort().join('_');
    var selRoll = _dN(serial, 'linked_' + pairKey + '_sel_' + serial, profile.selectorDie);
    if (selRoll !== profile.selectorHit) return null;

    // This plane was selected — now roll the confirmation dice
    var linkedDice = profile.dice || [];
    var linkedPhase = null;
    for (var li = 0; li < linkedDice.length; li++){
      var ld = linkedDice[li];
      var lRoll = _dN(serial, salt + '_ld' + li, ld.die);
      var lHit = (lRoll === ld.hit);
      var lRemHit = (ld.remoteHit != null && lRoll === ld.remoteHit);
      if (!lHit && !lRemHit) return null;
      if (lRemHit && !lHit) linkedPhase = 'remote';
      else if (lHit && !lRemHit) linkedPhase = 'coterminous';
    }

    var lDur = _generatedEventDurationDays(planeName, serial);
    return {
      startSerial: serial, endSerial: serial + lDur - 1,
      durationDays: lDur, phase: linkedPhase || 'coterminous'
    };
  }

  // ── MOONTIED mechanism (Dolurrh): only fires on associated moon's full/new days ──
  if (profile.mechanism === 'moontied'){
    try {
      // Get moon phase on this serial
      var moonPh = moonPhaseAt(profile.moonName, serial);
      if (!moonPh) return null;

      var isFull = _isFullMoonIllum(moonPh.illum);
      var isNew  = _isNewMoonIllum(moonPh.illum);
      if (!isFull && !isNew) return null;

      // Roll the moon die (d20 death saving throw)
      var moonRoll = _dN(serial, salt + '_moon', profile.moonDie);
      var moonRange = profile.moonHitRange || [11, 20];
      if (moonRoll < moonRange[0] || moonRoll > moonRange[1]) return null;

      var moonPhase = isFull ? (profile.fullMoonPhase || 'coterminous') :
                               (profile.newMoonPhase || 'remote');
      var moonDur = (typeof profile.duration === 'number') ? profile.duration : 1;
      return {
        startSerial: serial, endSerial: serial + moonDur - 1,
        durationDays: moonDur, phase: moonPhase,
        moonTriggered: true
      };
    } catch(e){ return null; }
  }

  // ── HYBRID_MOON mechanism (Lamannia): ~70% moon-tied, ~30% standard dice ──
  // On associated moon's full days, roll d20 against moonFullHit range → coterminous.
  // On associated moon's new days, roll d20 against moonNewHit range → remote.
  // On non-qualifying days, fall back to standard dice with lower probability.
  if (profile.mechanism === 'hybrid_moon'){
    try {
      var hmMoonPh = moonPhaseAt(profile.moonName, serial);
      if (hmMoonPh){
        var hmIsFull = _isFullMoonIllum(hmMoonPh.illum);
        var hmIsNew  = _isNewMoonIllum(hmMoonPh.illum);
        if (hmIsFull || hmIsNew){
          // Moon-qualified day: roll the moon die
          var hmMoonRoll = _dN(serial, salt + '_hmoon', profile.moonDie);
          var hmHitRange = hmIsFull ? profile.moonFullHit : profile.moonNewHit;
          if (hmHitRange && hmMoonRoll >= hmHitRange[0] && hmMoonRoll <= hmHitRange[1]){
            var hmDur = _generatedEventDurationDays(planeName, serial);
            var hmPhase = hmIsFull ? 'coterminous' : 'remote';
            return {
              startSerial: serial, endSerial: serial + hmDur - 1,
              durationDays: hmDur, phase: hmPhase,
              moonTriggered: true
            };
          }
          // Moon die missed — no fallback on moon-qualified days
          return null;
        }
      }
    } catch(e){}

    // Non-moon-qualified day: standard fallback dice (same logic as 'standard' mechanism)
    var hmFbDice = profile.fallbackDice || [];
    var hmFbPhaseFromDice = null;
    for (var hfi = 0; hfi < hmFbDice.length; hfi++){
      var hfd = hmFbDice[hfi];
      var hfRoll = _dN(serial, salt + '_hfb' + hfi, hfd.die);
      var hfHit = false;
      if (Array.isArray(hfd.hit)){
        hfHit = (hfRoll >= hfd.hit[0] && hfRoll <= hfd.hit[1]);
      } else {
        hfHit = (hfRoll === hfd.hit);
      }
      var hfRemHit = false;
      if (hfd.remoteHit != null){
        if (Array.isArray(hfd.remoteHit)){
          hfRemHit = (hfRoll >= hfd.remoteHit[0] && hfRoll <= hfd.remoteHit[1]);
        } else {
          hfRemHit = (hfRoll === hfd.remoteHit);
        }
      }
      if (!hfHit && !hfRemHit) return null;
      if (hfRemHit && !hfHit) hmFbPhaseFromDice = 'remote';
      else if (hfHit && !hfRemHit && hfd.remoteHit != null) hmFbPhaseFromDice = 'coterminous';
    }

    var hmFbDur = _generatedEventDurationDays(planeName, serial);
    var hmFbPhase;
    if (profile.phaseBias === 'dice' && hmFbPhaseFromDice){
      hmFbPhase = hmFbPhaseFromDice;
    } else {
      var hmFbPhaseRoll = _dN(serial, salt + '_hfb_phase', 100);
      hmFbPhase = (hmFbPhaseRoll <= 50) ? 'coterminous' : 'remote';
    }
    return {
      startSerial: serial, endSerial: serial + hmFbDur - 1,
      durationDays: hmFbDur, phase: hmFbPhase
    };
  }

  // ── COOLDOWN mechanism (Daanvi): d100 gate → phase pick, with Balancing Act ──
  if (profile.mechanism === 'cooldown'){
    var gateRoll = _dN(serial, salt + '_gate', profile.gateDie);
    var gRange = profile.gateHitRange || [100, 100];
    if (gateRoll < gRange[0] || gateRoll > gRange[1]) return null;

    var phDie = _dN(serial, salt + '_phaseDie', profile.phaseDie);
    // Phase split: lower half = remote, upper half = coterminous (50/50)
    var halfPoint = Math.floor(profile.phaseDie / 2);
    var coolPhase = (phDie <= halfPoint) ? 'remote' : 'coterminous';

    var coolDur = (typeof profile.duration === 'number') ? profile.duration : 10;

    // Daanvi Balancing Act: check if a previous event ended recently
    if (profile.balancingAct){
      // Scan backward to find the most recent event's end
      var scanLimit = coolDur + 12; // event(10d) + balance window(10d) + buffer
      for (var bScan = 1; bScan <= scanLimit; bScan++){
        var prevCheck = serial - bScan;
        // Quick check: did an event START at prevCheck?
        var prevGate = _dN(prevCheck, planeName + '_gen_' + prevCheck + '_gate', profile.gateDie);
        if (prevGate < gRange[0] || prevGate > gRange[1]) continue;
        var prevPhDie = _dN(prevCheck, planeName + '_gen_' + prevCheck + '_phaseDie', profile.phaseDie);
        var prevHalf = Math.floor(profile.phaseDie / 2);
        var prevPhase = (prevPhDie <= prevHalf) ? 'remote' : 'coterminous';
        var prevEnd = prevCheck + coolDur - 1;
        var daysSinceEnd = serial - prevEnd;
        if (daysSinceEnd >= 1 && daysSinceEnd <= 10){
          // Within balancing window. Roll d10.
          var balanceRoll = _dN(serial, salt + '_balance', 10);
          var threshold = 11 - daysSinceEnd; // day 1→10, day 2→9, ..., day 10→1
          if (balanceRoll >= threshold){
            // Force opposite phase
            coolPhase = (prevPhase === 'coterminous') ? 'remote' : 'coterminous';
          }
        }
        break; // Only check the most recent event
      }
    }

    return {
      startSerial: serial, endSerial: serial + coolDur - 1,
      durationDays: coolDur, phase: coolPhase
    };
  }

  return null;
}

// Check whether a plane is in a generated event state on a given serial.
// Scans backward to find events whose duration covers this day.
export var _ANOMALY_MAX_SCAN = 30; // Xoriat can last d20 days

export function _generatedEventAt(planeName, serial){
  if (GENERATED_SEALED[planeName]) return null;
  var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName];
  if (profile && profile.mechanism === 'sealed') return null;
  var evt = _generatedEventStartsOnDay(planeName, serial);
  if (evt) return evt;
  for (var offset = 1; offset <= _ANOMALY_MAX_SCAN; offset++){
    evt = _generatedEventStartsOnDay(planeName, serial - offset);
    if (evt && serial <= evt.endSerial) return evt;
  }
  return null;
}

export function isGeneratedShift(planeName, serial){
  if (GENERATED_SEALED[planeName]) return false;
  // Global toggle: off-cycle planar movement can be disabled
  try { if (ensureSettings().offCyclePlanes === false) return false; } catch(e){ return false; }
  // Suppress if GM has an active override or anchor
  try {
    var ps = getPlanesState();
    if (ps && ps.overrides && ps.overrides[planeName]) return false;
    if (ps && ps.anchors && ps.anchors[planeName]) return false;
    // Check if this event has been individually suppressed
    if (ps && ps.suppressedEvents && ps.suppressedEvents[planeName]){
      var evt = _generatedEventAt(planeName, serial);
      if (evt && ps.suppressedEvents[planeName][evt.startSerial]) return false;
    }
    // GM custom events suppress generated events as if they were canon.
    // For each GM custom event on this plane, find the nearest generated
    // event and suppress it. This prevents double-stacking when a GM
    // manually creates a planar event near a generated one.
    if (ps && ps.gmCustomEvents && ps.gmCustomEvents[planeName]){
      var gmEvts = ps.gmCustomEvents[planeName];
      var thisEvt = _generatedEventAt(planeName, serial);
      if (thisEvt && gmEvts.length > 0){
        // Check if this generated event is the nearest one to any GM custom event
        var profile = PLANAR_GENERATED_EVENT_PROFILE[planeName];
        var expectedPerYear = (profile && profile.expectedPerYear) || 3;
        // Max suppression reach: half a year divided by expected events
        // This prevents suppression from reaching too far
        var maxReach = Math.round(168 / Math.max(1, expectedPerYear));
        for (var gci = 0; gci < gmEvts.length; gci++){
          var gmSer = gmEvts[gci].serial;
          var distToGm = Math.abs(thisEvt.startSerial - gmSer);
          if (distToGm <= maxReach){
            // Is this the NEAREST generated event to this GM event?
            // Scan forward and backward to check
            var isNearest = true;
            for (var scan = 1; scan <= maxReach; scan++){
              var before = _generatedEventAt(planeName, gmSer - scan);
              if (before && before.startSerial !== thisEvt.startSerial &&
                  Math.abs(before.startSerial - gmSer) < distToGm){
                isNearest = false; break;
              }
              var after = _generatedEventAt(planeName, gmSer + scan);
              if (after && after.startSerial !== thisEvt.startSerial &&
                  Math.abs(after.startSerial - gmSer) < distToGm){
                isNearest = false; break;
              }
            }
            if (isNearest) return false; // suppress this generated event
          }
        }
      }
    }
  } catch(e){ return false; }

  // Suppress during canonical coterminous/remote phases
  // (don't stack generated events on top of canonical ones)
  try {
    var canonState = getPlanarState(planeName, serial, { ignoreGenerated: true });
    if (canonState && !canonState.overridden &&
        (canonState.phase === 'coterminous' || canonState.phase === 'remote')){
      // For fixed planes (Kythri/Xoriat), the fixed phase IS canonical — don't suppress.
      // Only suppress for cyclic planes that are currently in an active canonical phase.
      var planeData = _getPlaneData(planeName);
      if (planeData && planeData.type === 'cyclic') return false;
    }
  } catch(e){}

  return !!_generatedEventAt(planeName, serial);
}

export function _generatedPhase(planeName, serial){
  var evt = _generatedEventAt(planeName, serial);
  return (evt && evt.phase) ? evt.phase : 'coterminous';
}

// Find next generated event within maxDays for forecast displays.
export function _nextGeneratedForecast(planeName, serial, maxDays){
  if (GENERATED_SEALED[planeName]) return null;
  try { if (ensureSettings().offCyclePlanes === false) return null; } catch(e){ return null; }
  maxDays = Math.max(0, maxDays|0);
  if (maxDays <= 0) return null;

  var current = isGeneratedShift(planeName, serial) ? _generatedEventAt(planeName, serial) : null;
  if (current){
    return {
      phase: current.phase, daysUntilStart: 0,
      durationDays: current.durationDays,
      startSerial: current.startSerial, endSerial: current.endSerial,
      activeNow: true
    };
  }

  for (var d = 1; d <= maxDays; d++){
    var day = serial + d;
    if (!isGeneratedShift(planeName, day)) continue;
    var evt = _generatedEventAt(planeName, day);
    if (evt && evt.startSerial !== day) continue;
    if (evt){
      return {
        phase: evt.phase, daysUntilStart: d,
        durationDays: evt.durationDays,
        startSerial: evt.startSerial, endSerial: evt.endSerial,
        activeNow: false
      };
    }
  }
  return null;
}


export function handleMoonCommand(m, args){
  // args[0]='moon', args[1]=subcommand, args[2+]=params
  var sub = String(args[1] || '').toLowerCase();
  var st  = ensureSettings();

  // Anyone can view — players see their tier, GM sees exact
  if (!sub || sub === 'show'){
    moonEnsureSequences();
    if (playerIsGM(m.playerid)){
      return whisper(m.who, moonPanelHtml());
    } else {
      return whisper(m.who, moonPlayerPanelHtml());
    }
  }

  // !cal moon lore [name] — available to everyone, whispered to querier
  if (sub === 'lore' || sub === 'info'){
    var loreSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!loreSys || !loreSys.moons) return whisper(m.who, 'No moon data available.');
    var loreName = String(args[2] || '').trim();
    if (!loreName){
      // Show all moons as buttons
      var loreButtons = loreSys.moons.map(function(moon){
        return button(moon.name, 'moon lore ' + moon.name);
      });
      loreButtons.push(button('💎 Ring of Siberys', 'moon lore siberys'));
      return whisper(m.who, _menuBox('🌙 Moon Lore',
        '<div style="margin-bottom:4px;">Select a moon to learn about:</div>' +
        loreButtons.join(' ')
      ));
    }
    // Ring of Siberys special case
    if (loreName.toLowerCase() === 'siberys' || loreName.toLowerCase() === 'ring'){
      return whisper(m.who, _siberysLoreHtml());
    }
    var resolvedLore = _moonParseMoonName(loreName, loreSys);
    if (!resolvedLore) return whisper(m.who, 'Unknown moon: <b>'+esc(loreName)+'</b>. Try <code>!cal moon lore</code> for a list.');
    var loreHtml = _moonLoreHtml(resolvedLore);
    if (!loreHtml) return whisper(m.who, 'No lore available for <b>'+esc(resolvedLore)+'</b>.');
    return whisper(m.who, loreHtml);
  }

  // !cal moon sky [time] — available to everyone, shows which moons are visible
  // time: active bucket when set, otherwise nighttime; explicit aliases like
  // midnight/dawn/noon/dusk still normalize into the six canonical buckets.
  if (sub === 'sky' || sub === 'visible' || sub === 'up'){
    moonEnsureSequences();
    var today = todaySerial();
    var bucket = normalizeTimeBucketKey(args.slice(2).join(' ')) || effectiveTimeBucket('nighttime');
    var timeFrac = bucketMidpointTimeFrac(bucket);
    var timeLabel = bucketLabel(bucket);
    var dateLabel = dateLabelFromSerial(today);
    var visHtml = _moonVisibilityHtml(today, timeFrac);
    if (!visHtml) visHtml = '<div style="opacity:.6;">No visibility data available.</div>';
    var timeButtons = [
      button('Current','moon sky'),
      button('Middle','moon sky middle_of_night'),
      button('Early','moon sky early_morning'),
      button('Morning','moon sky morning'),
      button('Afternoon','moon sky afternoon'),
      button('Evening','moon sky evening'),
      button('Night','moon sky nighttime')
    ].join(' ');
    return whisper(m.who, _menuBox(
      '🌙 Sky at ' + esc(timeLabel) + ' — ' + esc(dateLabel),
      visHtml +
      '<div style="margin-top:6px;font-size:.82em;">' + timeButtons + '</div>'
    ));
  }

  // Player self-query mode (read-only, knowledge-limited).
  if (!playerIsGM(m.playerid)){
    if (sub === 'on' || sub === 'date'){
      var pDateToks = args.slice(2).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
      var pPref = parseDatePrefixForAdd(pDateToks);
      if (!pPref){
        return whisper(m.who, 'Usage: <code>!cal moon on &lt;dateSpec&gt;</code>');
      }
      var pSerial = toSerial(pPref.year, pPref.mHuman - 1, pPref.day);
      var pToday = todaySerial();
      var pHorizon = parseInt(getMoonState().revealHorizonDays, 10) || 7;
      if (pSerial < pToday || pSerial > (pToday + pHorizon)){
        return whisper(m.who, 'That date is beyond your lunar knowledge.');
      }
      moonEnsureSequences(pSerial, pHorizon + 30);
      return whisper(m.who, moonPlayerPanelHtml(pSerial));
    }
    if (sub === 'view' || sub === 'cal'){
      var pViewName = String(args[2] || '').trim();
      var pViewSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
      var pTier = _normalizeMoonRevealTier(getMoonState().revealTier || 'medium');
      var pHorizonView = parseInt(getMoonState().revealHorizonDays, 10) || 7;
      if (!pViewName){
        var pViewBtns = pViewSys.moons.map(function(moon){
          return button(moon.name, 'moon view ' + moon.name);
        });
        return whisper(m.who, _menuBox('🌙 Moon Calendar',
          '<div style="margin-bottom:4px;">Select a moon:</div>' +
          pViewBtns.join(' ') +
          '<div style="margin-top:6px;">'+button('⬅ Back','moon')+'</div>'
        ));
      }
      var pViewMoon = _moonParseMoonName(pViewName, pViewSys);
      if (!pViewMoon) return whisper(m.who, 'Unknown moon: <b>'+esc(pViewName)+'</b>.');
      var pViewSerial = todaySerial();
      if (args[3]){
        var pViewDateToks = args.slice(3).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
        var pViewPref = parseDatePrefixForAdd(pViewDateToks);
        if (pViewPref) pViewSerial = toSerial(pViewPref.year, pViewPref.mHuman - 1, pViewPref.day);
      }
      var pKnownStart = todaySerial();
      var pKnownEnd = pKnownStart + pHorizonView;
      if (pViewSerial < pKnownStart || pViewSerial > pKnownEnd){
        return whisper(m.who, 'That date is beyond your lunar knowledge.');
      }
      moonEnsureSequences(pViewSerial, pHorizonView + 30);
      var pCalBody = _singleMoonPlayerMiniCalHtml(pViewMoon, pViewSerial, pTier, pHorizonView);
      var pPrevS = _shiftSerialByMonth(pViewSerial, -1);
      var pNextS = _shiftSerialByMonth(pViewSerial, 1);
      function _pViewNav(serial, label){
        if (serial < pKnownStart || serial > pKnownEnd){
          return '<span style="opacity:.35;">'+esc(label)+'</span>';
        }
        return button(label, 'moon view ' + pViewMoon + ' ' + _serialToDateSpec(serial));
      }
      var pViewNav = '<div style="margin:4px 0;">'+
        _pViewNav(pPrevS, '◀ Prev')+' '+
        _pViewNav(pNextS, 'Next ▶')+
        '</div>';
      return whisper(m.who, _menuBox('🌙 '+esc(pViewMoon),
        pViewNav + pCalBody +
        '<div style="margin-top:6px;">'+button('⬅ All Moons','moon')+'</div>'
      ));
    }
    return whisper(m.who,
      'Moon: <code>!cal moon</code> &nbsp;·&nbsp; <code>!cal moon on &lt;dateSpec&gt;</code> &nbsp;·&nbsp; <code>!cal moon view &lt;name&gt;</code>'
    );
  }

  // !cal moon send <low|medium|high> [1w|1m|3m|6m|10m|Nd|Nw]
  if (sub === 'send'){
    var tierRaw = String(args[2] || '').toLowerCase();
    if (!tierRaw)
      return whisper(m.who, 'Usage: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>');
    var tierArg = MOON_REVEAL_TIERS[tierRaw] ? tierRaw : null;
    if (!tierArg)
      return whisper(m.who, 'Usage: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>');
    var reqHorizon = _parseMoonRevealRange(args[3], tierArg);
    if (!reqHorizon)
      return whisper(m.who, 'Usage: <code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code>');

    moonEnsureSequences(todaySerial(), reqHorizon + 30);
    var ms0  = getMoonState();
    var cal0 = getCal();
    var cur0 = cal0.current;
    var today0 = toSerial(cur0.year, cur0.month, cur0.day_of_the_month);

    // Upgrade reveal tier (never downgrade)
    var curRank = MOON_REVEAL_TIERS[_normalizeMoonRevealTier(ms0.revealTier)] || 0;
    var newRank = MOON_REVEAL_TIERS[tierArg] || 0;
    if (newRank > curRank) ms0.revealTier = _normalizeMoonRevealTier(tierArg);
    // Use the effective tier (may be higher than requested)
    var effectiveTier = _normalizeMoonRevealTier(ms0.revealTier);
    if (newRank > curRank){
      ms0.revealHorizonDays = reqHorizon;
    } else if (newRank === curRank){
      ms0.revealHorizonDays = Math.max(parseInt(ms0.revealHorizonDays,10)||7, reqHorizon);
    }
    var effectiveHorizon = parseInt(ms0.revealHorizonDays, 10) || reqHorizon;

    var sys0 = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!sys0) return whisper(m.who, 'No moon data for this calendar system.');

    var rows0 = sys0.moons.map(function(moon){
      return _moonRowHtml(moon, today0, effectiveTier, effectiveHorizon);
    });

    var srcLabel0 = MOON_SOURCE_LABELS[effectiveTier] || '';
    var srcLine0  = srcLabel0
      ? '<div style="font-size:.75em;opacity:.4;font-style:italic;margin-top:5px;">'+esc(srcLabel0)+'</div>'
      : '';

    sendToAll(_menuBox(
      '\uD83C\uDF19 Lunar Forecast \u2014 ' + esc(currentDateLabel()),
      rows0.join('') + srcLine0 +
      '<div style="font-size:.75em;opacity:.4;margin-top:3px;">Forecast horizon: '+esc(_rangeLabel(effectiveHorizon))+'</div>'
    ));

    warnGM('Sent '+titleCase(effectiveTier)+' lunar forecast to players ('+_rangeLabel(effectiveHorizon)+').');
    return whisper(m.who, moonPanelHtml());
  }

  // !cal moon on <dateSpec>  — inspect moon states on a specific day
  if (sub === 'on' || sub === 'date'){
    var dateToksOn = args.slice(2).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
    var prefOn = parseDatePrefixForAdd(dateToksOn);
    if (!prefOn){
      return whisper(m.who, 'Usage: <code>!cal moon on &lt;dateSpec&gt;</code> (example: <code>!cal moon on Rhaan 14 998</code>)');
    }
    var serialOn = toSerial(prefOn.year, prefOn.mHuman - 1, prefOn.day);
    moonEnsureSequences(serialOn, MOON_PREDICTION_LIMITS.highMaxDays);
    return whisper(m.who, moonPanelHtml(serialOn));
  }

  // !cal moon seed <word>
  if (sub === 'seed'){
    var word = String(args[2] || '').trim();
    if (!word) return whisper(m.who, 'Usage: <code>!cal moon seed &lt;word&gt;</code>');
    var ms = getMoonState();
    // Global lunar seed: one word deterministically drives all moons.
    ms.systemSeed = word;
    // Clear legacy per-moon overrides so the global seed fully controls generation.
    ms.seeds = {};
    ms.generatedFrom = null;
    ms.generatedThru = 0;
    moonEnsureSequences();
    return whisper(m.who, 'System moon seed set to <b>'+esc(word)+'</b>. Sequences regenerated.');
  }

  // !cal moon full <MoonName> <dateSpec>
  // !cal moon new  <MoonName> <dateSpec>
  // dateSpec uses the same smart rules as !cal add:
  //   14            -> next occurrence of day 14 in any month
  //   Rhaan 14      -> next occurrence of Rhaan 14 (this or next year)
  //   Rhaan 14 999  -> exact date: Rhaan 14, year 999
  if (sub === 'full' || sub === 'new'){
    var moonNameRaw = String(args[2] || '').trim();
    if (!moonNameRaw)
      return whisper(m.who,
        'Usage: <code>!cal moon (full|new) &lt;MoonName&gt; &lt;dateSpec&gt;</code> '+
        '— dateSpec: <code>14</code> or <code>Rhaan 14</code> or <code>Rhaan 14 999</code>'
      );

    var sys2  = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    var mName = _moonParseMoonName(moonNameRaw, sys2);
    if (!mName) return whisper(m.who, 'Unknown moon: <b>'+esc(moonNameRaw)+'</b>');

    // Hand remaining tokens to the shared smart-date parser
    var dateToks = args.slice(3).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
    var pref = parseDatePrefixForAdd(dateToks);
    if (!pref)
      return whisper(m.who,
        'Could not parse date. Try: <code>!cal moon '+sub+' '+esc(mName)+' Rhaan 14</code>'
      );

    var cal2 = getCal();
    var targetSerial = toSerial(pref.year, pref.mHuman - 1, pref.day);
    var ms2 = getMoonState();
    if (!ms2.gmAnchors[mName]) ms2.gmAnchors[mName] = [];
    ms2.gmAnchors[mName].push({ serial: targetSerial, type: sub });
    ms2.generatedFrom = null;
    ms2.generatedThru = 0;
    moonEnsureSequences();

    var monthName = _displayMonthDayParts(pref.mHuman - 1, pref.day).monthName;
    return whisper(m.who,
      '<b>'+esc(mName)+'</b> will be <b>'+sub+'</b> on '+
      esc(String(pref.day))+' '+esc(monthName)+' '+esc(String(pref.year))+'.<br>'+
      '<span style="opacity:.6;font-size:.85em;">Sequence regenerated.</span>'
    );
  }

  // !cal moon view <MoonName> [dateSpec]  — single-moon mini-calendar
  if (sub === 'view' || sub === 'cal'){
    var viewNameRaw = String(args[2] || '').trim();
    var viewSys = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    if (!viewNameRaw){
      // Show picker buttons for each moon
      var viewBtns = viewSys.moons.map(function(moon){
        return button(moon.name, 'moon view ' + moon.name);
      });
      return whisper(m.who, _menuBox('🌙 Moon Calendar',
        '<div style="margin-bottom:4px;">Select a moon:</div>' +
        viewBtns.join(' ') +
        '<div style="margin-top:6px;">'+button('⬅ Back','moon')+'</div>'
      ));
    }
    var viewMoonName = _moonParseMoonName(viewNameRaw, viewSys);
    if (!viewMoonName) return whisper(m.who, 'Unknown moon: <b>'+esc(viewNameRaw)+'</b>. Try <code>!cal moon view</code> for a list.');
    // Optional date spec for navigating months
    var viewSerial = todaySerial();
    if (args[3]){
      var viewDateToks = args.slice(3).map(function(t){ return String(t||'').trim(); }).filter(Boolean);
      var viewPref = parseDatePrefixForAdd(viewDateToks);
      if (viewPref) viewSerial = toSerial(viewPref.year, viewPref.mHuman - 1, viewPref.day);
    }
    moonEnsureSequences(viewSerial, 60);
    var calBody = _singleMoonMiniCalHtml(viewMoonName, viewSerial);
    var prevS = _shiftSerialByMonth(viewSerial, -1);
    var nextS = _shiftSerialByMonth(viewSerial, 1);
    var viewNav = '<div style="margin:4px 0;">'+
      button('◀ Prev','moon view '+viewMoonName+' '+_serialToDateSpec(prevS))+' '+
      button('Next ▶','moon view '+viewMoonName+' '+_serialToDateSpec(nextS))+
      '</div>';
    return whisper(m.who, _menuBox('🌙 '+esc(viewMoonName),
      viewNav + calBody +
      '<div style="margin-top:6px;">'+button('⬅ All Moons','moon')+' '+button('📖 Lore','moon lore '+viewMoonName)+'</div>'
    ));
  }

  // !cal moon reset [<MoonName>]  — remove GM phase overrides
  if (sub === 'reset'){
    var clearName = String(args[2] || '').trim();
    var sys3 = MOON_SYSTEMS[st.calendarSystem] || MOON_SYSTEMS.eberron;
    var mName3 = clearName ? _moonParseMoonName(clearName, sys3) : null;
    var ms3 = getMoonState();
    if (mName3){
      ms3.gmAnchors[mName3] = [];
      ms3.generatedFrom = null;
      ms3.generatedThru = 0;
      moonEnsureSequences();
      return whisper(m.who, 'Phase overrides reset for <b>'+esc(mName3)+'</b>.');
    } else {
      ms3.gmAnchors = {};
      ms3.generatedFrom = null;
      ms3.generatedThru = 0;
      moonEnsureSequences();
      return whisper(m.who, 'All moon phase overrides reset.');
    }
  }

  whisper(m.who,
    'Moon: <code>!cal moon</code> &nbsp;·&nbsp; '+
    '<code>!cal moon view &lt;name&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal moon send (low|medium|high) [1w|1m|3m|6m|10m|Nd|Nw]</code> &nbsp;·&nbsp; '+
    '<code>!cal moon on &lt;dateSpec&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal moon seed &lt;word&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal moon (full|new) &lt;name&gt; &lt;dateSpec&gt;</code> &nbsp;·&nbsp; '+
    '<code>!cal moon reset [&lt;name&gt;]</code>'
  );
}
