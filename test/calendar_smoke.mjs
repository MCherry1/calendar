import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const calendarPath = path.join(__dirname, '..', 'calendar.js');
const source = fs.readFileSync(calendarPath, 'utf8');

function assertMatch(pattern, message, flags = '') {
  if (!new RegExp(pattern, flags).test(source)) {
    throw new Error(message);
  }
}

function assertCount(pattern, expected, message, flags = '') {
  const count = [...source.matchAll(new RegExp(pattern, flags.includes('g') ? flags : `${flags}g`))].length;
  if (count !== expected) {
    throw new Error(`${message} (expected ${expected}, got ${count})`);
  }
}

function assertNotMatch(pattern, message, flags = '') {
  if (new RegExp(pattern, flags).test(source)) {
    throw new Error(message);
  }
}

assertMatch(String.raw`var CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS = 90;`, 'Specific-date weather reveal cap should be present.');
assertMatch(String.raw`specific:\s*['"]Divination Reveal['"]`, 'Weather source labels should include the divination reveal label.');
assertMatch(String.raw`playerReveal:\s*\{\s*byLocation:\s*\{\}\s*\}`, 'Weather reveal state should be stored per location.');
assertMatch(String.raw`function sendSpecificWeatherReveal\(m, tokens\)`, 'Specific-date weather reveal command handler should exist.');
assertMatch(String.raw`sendSpecificWeatherReveal\(m, args\.slice\(2\)\);`, 'Weather reveal command should fall through to specific-date reveals.');
assertMatch(String.raw`if \(parsed\.startSerial < today\)`, 'Specific-date weather reveals should reject any range that starts in the past.');
assertMatch(String.raw`if \(locSub === ['"]recent['"]\)`, 'Weather location menu should support recent-location quick switches.');
assertMatch(String.raw`function _historyRecord\(serial\)`, 'Weather history lookups should be factored into a helper.');
assertMatch(String.raw`warnGM\(['"]Usage: weather generate `, 'Manual weather generation should be bounded by the configured forecast horizon.');
assertMatch(String.raw`if \(targetSer < todayNow\)`, 'Weather rerolls should refuse archived past days.');
assertMatch(String.raw`var prevRec = _forecastRecord\(targetSer - 1\) \|\| _historyRecord\(targetSer - 1\);`, 'Weather rerolls should reuse yesterday history for continuity when needed.');
assertMatch(String.raw`var regenNext = _generateDayWeather\(targetSer \+ 1, newRec, ws2\.location \|\| null\);`, 'Weather reroll cascades should stay on the current location.');

assertMatch(String.raw`return parts\.monthName \+ ['"] ['"] \+ d\.day \+ ['"] ['"] \+ d\.year;`, 'Button date specs should stay parser-friendly after Harptos formatting changes.');
assertMatch(String.raw`label:\s*_ordinal\(day\) \+ ['"] of ['"] \+ String\(m\.name \|\| mi \+ 1\)`, 'Harptos display labels should use ordinal-of-month formatting.');
assertMatch(String.raw`if \(progression === ['"]month_reset['"] && !mobj\.isIntercalary\)\s*\{\s*return \(\(\(parseInt\(d, 10\) \|\| 1\) - 1\) % wdlen \+ wdlen\) % wdlen;`, 'Harptos weekday math should restart each tenday.');
assertMatch(String.raw`_renderHarptosFestivalStrip\(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, ['"]full['"]\)`, 'Harptos intercalary days should render with the festival strip helper.');

assertMatch(String.raw`var typeLabel = .*['"]Total Eclipse['"] : .*['"]Partial Eclipse['"] : ['"]Transit['"];`, 'Eclipse classification thresholds should match the task requirements.');
assertMatch(String.raw`return \[\s*_eclipseTimingClause\(['"]start['"], event, serial\),\s*_eclipseTimingClause\(['"]peak['"], event, serial\),\s*_eclipseTimingClause\(['"]end['"], event, serial\)`, 'Eclipse lifecycle text should include start, peak, and end timing.');
assertMatch(String.raw`var dt = 1 / 96;`, 'Eclipse sampling should use 15-minute increments.');
assertCount(String.raw`function getEclipses\(`, 1, 'There should be exactly one active getEclipses implementation.');
assertCount(String.raw`function _eclipseNotableToday\(`, 1, 'There should be exactly one active _eclipseNotableToday implementation.');
assertCount(String.raw`^function _getEclipsesLegacy\(`, 0, 'Legacy eclipse detector should no longer be active code.', 'm');
assertCount(String.raw`^function _eclipseNotableTodayLegacy\(`, 0, 'Legacy eclipse notable-text formatter should no longer be active code.', 'm');

assertMatch(String.raw`function _activeManifestZonesForSerial\(serial\)\s*\{\s*return serial === todaySerial\(\) \? _activeManifestZoneEntries\(\) : \[\];`, 'Manifest-zone overlays should stay limited to the current day.');
assertMatch(String.raw`warnGM\(['"]Aryth is full\. Consider a manifest zone\.['"]\);`, 'Aryth-full reminder should still fire on date advancement.');
assertMatch(String.raw`warnGM\(['"]Aryth is no longer full\. Consider deactivating:`, 'Aryth exit reminder should still fire for tracked manifest zones.');
assertMatch(String.raw`if \(!playerIsGM\(m\.playerid\)\)\s*\{`, 'Weather command handler should still split GM and player behavior.');
assertMatch(String.raw`Shorter off-cycle shifts are tied to Aryth full/new moons through the moontied generator\.`, 'Dolurrh notes should describe the implemented Aryth-linked generator.');
assertMatch(String.raw`!cal settings \(group\|labels\|events\|moons\|weather\|weathermechanics\|wxmechanics\|planes\|offcycle\|buttons\)`, 'Settings usage text should include wxmechanics and offcycle.');
assertMatch(String.raw`!cal moon send \(low\|medium\|high\) \[1w\|1m\|3m\|6m\|10m\|Nd\|Nw\]`, 'Moon help text should advertise the supported week/day range tokens.');
assertMatch(String.raw`!cal planes send \[low\|medium\|high\] \[1d\|3d\|6d\|10d\|1m\|3m\|6m\|10m\|Nd\|Nw\]`, 'Plane help text should advertise the supported day/week/month range tokens.');
assertNotMatch(String.raw`moons-system-design\.md`, 'Stale moon design-file references should be removed from calendar.js.');
assertNotMatch(String.raw`Generated events should be tied to Aryth full/new moons rather than independent dice rolls`, 'Outdated Dolurrh TODO text should be removed from calendar.js.');

console.log('PASS: calendar smoke checks');
