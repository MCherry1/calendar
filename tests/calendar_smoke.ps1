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

Assert-Match 'var CONFIG_WEATHER_SPECIFIC_REVEAL_MAX_DAYS = 90;' 'Specific-date weather reveal cap should be present.'
Assert-Match "specific:\s*'Divination Reveal'" 'Weather source labels should include the divination reveal label.'
Assert-Match 'playerReveal:\s*\{\s*byLocation:\s*\{\}\s*\}' 'Weather reveal state should be stored per location.'
Assert-Match 'function sendSpecificWeatherReveal\(m, tokens\)' 'Specific-date weather reveal command handler should exist.'
Assert-Match "sendSpecificWeatherReveal\(m, args\.slice\(2\)\);" 'Weather reveal command should fall through to specific-date reveals.'
Assert-Match "if \(locSub === 'recent'\)" 'Weather location menu should support recent-location quick switches.'

Assert-Match "return parts\.monthName \+ ' ' \+ d\.day \+ ' ' \+ d\.year;" 'Button date specs should stay parser-friendly after Harptos formatting changes.'
Assert-Match "return \{ title:'Next ' \+ _displayMonthDayParts\(md\.mi, d2\)\.label" 'Next-date titles should use the display date helper.'
Assert-Match "label:\s*_ordinal\(day\) \+ ' of ' \+ String\(m\.name \|\| \(mi \+ 1\)\)" 'Harptos display labels should use ordinal-of-month formatting.'
Assert-Match "if \(st\.calendarSystem === 'faerunian' && !mobj\.isIntercalary\)\{\s*return \(\(\(parseInt\(d, 10\) \|\| 1\) - 1\) % wdlen \+ wdlen\) % wdlen;" 'Harptos weekday math should restart each tenday.'
Assert-Match "_renderHarptosFestivalStrip\(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, 'full'\)" 'Harptos intercalary days should render with the festival strip helper.'

Assert-Match "var typeLabel = \(cover > 0\.98\) \? 'Total Eclipse' : \(sizeRatio > 0\.75 \? 'Partial Eclipse' : 'Transit'\);" 'Eclipse classification thresholds should match the task requirements.'
Assert-Match "return \[\s*_eclipseTimingClause\('start', event, serial\)," 'Eclipse lifecycle text should include start, peak, and end timing.'
Assert-Match "var dt = 1 / 96;" 'Eclipse sampling should use 15-minute increments.'
Assert-Count 'function getEclipses\(' 1 'There should be exactly one active getEclipses implementation.'
Assert-Count 'function _eclipseNotableToday\(' 1 'There should be exactly one active _eclipseNotableToday implementation.'

Assert-Match "function _activeManifestZonesForSerial\(serial\)\{\s*return \(serial === todaySerial\(\)\) \? _activeManifestZoneEntries\(\) : \[\];" 'Manifest-zone overlays should stay limited to the current day.'
Assert-Match "warnGM\('Aryth is full\. Consider a manifest zone\.'\);" 'Aryth-full reminder should still fire on date advancement.'
Assert-Match "warnGM\('Aryth is no longer full\. Consider deactivating:" 'Aryth exit reminder should still fire for tracked manifest zones.'
Assert-Match "if \(!playerIsGM\(m\.playerid\)\)\{" 'Weather command handler should still split GM and player behavior.'

Write-Output 'PASS: calendar smoke checks'
