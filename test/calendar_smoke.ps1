$ErrorActionPreference = 'Stop'

$calendarPath = Join-Path $PSScriptRoot '..\calendar.js'
$source = Get-Content $calendarPath -Raw

function Assert-Match {
  param(
    [string] $Pattern,
    [string] $Message
  )
  if ($source -notmatch $Pattern) {
    throw $Message
  }
}

function Assert-Count {
  param(
    [string] $Pattern,
    [int] $Expected,
    [string] $Message
  )
  $count = ([regex]::Matches($source, $Pattern)).Count
  if ($count -ne $Expected) {
    throw "$Message (expected $Expected, got $count)"
  }
}

function Assert-NotMatch {
  param(
    [string] $Pattern,
    [string] $Message
  )
  if ($source -match $Pattern) {
    throw $Message
  }
}

Assert-Match 'var CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS = 90;' 'Specific-date weather reveal cap should be present.'
Assert-Match "specific:\s*['""]Divination Reveal['""]" 'Weather source labels should include the divination reveal label.'
Assert-Match 'playerReveal:\s*\{\s*byLocation:\s*\{\}\s*\}' 'Weather reveal state should be stored per location.'
Assert-Match 'function sendSpecificWeatherReveal\(m, tokens\)' 'Specific-date weather reveal command handler should exist.'
Assert-Match "sendSpecificWeatherReveal\(m, args\.slice\(2\)\);" 'Weather reveal command should fall through to specific-date reveals.'
Assert-Match 'if \(parsed\.startSerial < today\)' 'Specific-date weather reveals should reject any range that starts in the past.'
Assert-Match "if \(locSub === ['""]recent['""]\)" 'Weather location menu should support recent-location quick switches.'
Assert-Match 'function _historyRecord\(serial\)' 'Weather history lookups should be factored into a helper.'
Assert-Match "warnGM\(['""]Usage: weather generate " 'Manual weather generation should be bounded by the configured forecast horizon.'
Assert-Match 'if \(targetSer < todayNow\)' 'Weather rerolls should refuse archived past days.'
Assert-Match 'var prevRec = _forecastRecord\(targetSer - 1\) \|\| _historyRecord\(targetSer - 1\);' 'Weather rerolls should reuse yesterday history for continuity when needed.'
Assert-Match 'var regenNext = _generateDayWeather\(targetSer \+ 1, newRec, ws2\.location \|\| null\);' 'Weather reroll cascades should stay on the current location.'

Assert-Match "return parts\.monthName \+ ['""] ['""] \+ d\.day \+ ['""] ['""] \+ d\.year;" 'Button date specs should stay parser-friendly after Harptos formatting changes.'
Assert-Match "label:\s*_ordinal\(day\) \+ ['""] of ['""] \+ String\(m\.name \|\| ?\(?(mi \+ 1)\)?\)" 'Harptos display labels should use ordinal-of-month formatting.'
Assert-Match "if \(st\.calendarSystem === ['""]faerunian['""] && !mobj\.isIntercalary\)\s*\{\s*return \(\(\(parseInt\(d, 10\) \|\| 1\) - 1\) % wdlen \+ wdlen\) % wdlen;" 'Harptos weekday math should restart each tenday.'
Assert-Match "_renderHarptosFestivalStrip\(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, ['""]full['""]\)" 'Harptos intercalary days should render with the festival strip helper.'

Assert-Match "var typeLabel = .*['""]Total Eclipse['""] : .*['""]Partial Eclipse['""] : ['""]Transit['""];" 'Eclipse classification thresholds should match the task requirements.'
Assert-Match "return \[\s*_eclipseTimingClause\(['""]start['""], event, serial\),\s*_eclipseTimingClause\(['""]peak['""], event, serial\),\s*_eclipseTimingClause\(['""]end['""], event, serial\)" 'Eclipse lifecycle text should include start, peak, and end timing.'
Assert-Match "var dt = 1 / 96;" 'Eclipse sampling should use 15-minute increments.'
Assert-Count 'function getEclipses\(' 1 'There should be exactly one active getEclipses implementation.'
Assert-Count 'function _eclipseNotableToday\(' 1 'There should be exactly one active _eclipseNotableToday implementation.'
Assert-Count '(?m)^function _getEclipsesLegacy\(' 0 'Legacy eclipse detector should no longer be active code.'
Assert-Count '(?m)^function _eclipseNotableTodayLegacy\(' 0 'Legacy eclipse notable-text formatter should no longer be active code.'

Assert-Match "function _activeManifestZonesForSerial\(serial\)\s*\{\s*return serial === todaySerial\(\) \? _activeManifestZoneEntries\(\) : \[\];" 'Manifest-zone overlays should stay limited to the current day.'
Assert-Match "warnGM\(['""]Aryth is full\. Consider a manifest zone\.['""]\);" 'Aryth-full reminder should still fire on date advancement.'
Assert-Match "warnGM\(['""]Aryth is no longer full\. Consider deactivating:" 'Aryth exit reminder should still fire for tracked manifest zones.'
Assert-Match "if \(!playerIsGM\(m\.playerid\)\)\s*\{" 'Weather command handler should still split GM and player behavior.'
Assert-Match "Shorter off-cycle shifts are tied to Aryth full/new moons through the moontied generator\." 'Dolurrh notes should describe the implemented Aryth-linked generator.'
Assert-Match "!cal settings \(group\|labels\|events\|moons\|weather\|weathermechanics\|wxmechanics\|hazards\|weatherhazards\|wxhazards\|planes\|offcycle\|buttons\)" 'Settings usage text should include wxmechanics, hazards aliases, and offcycle.'
Assert-Match "!cal moon send \(low\|medium\|high\) \[1w\|1m\|3m\|6m\|10m\|Nd\|Nw\]" 'Moon help text should advertise the supported week/day range tokens.'
Assert-Match "!cal planes send \[low\|medium\|high\] \[1d\|3d\|6d\|10d\|1m\|3m\|6m\|10m\|Nd\|Nw\]" 'Plane help text should advertise the supported day/week/month range tokens.'
Assert-NotMatch 'moons-system-design\.md' 'Stale moon design-file references should be removed from calendar.js.'
Assert-NotMatch 'Generated events should be tied to Aryth full/new moons rather than independent dice rolls' 'Outdated Dolurrh TODO text should be removed from calendar.js.'

Write-Output 'PASS: calendar smoke checks'
