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

Assert-Match "return parts\.monthName \+ ['""] ['""] \+ d\.day \+ ['""] ['""] \+ d\.year;" 'Button date specs should stay parser-friendly after Harptos formatting changes.'
Assert-Match "label:\s*_ordinal\(day\) \+ ['""] of ['""] \+ String\(m\.name \|\| ?\(?(mi \+ 1)\)?\)" 'Harptos display labels should use ordinal-of-month formatting.'
Assert-Match "if \(st\.calendarSystem === ['""]faerunian['""] && !mobj\.isIntercalary\)\s*\{\s*return \(\(\(parseInt\(d, 10\) \|\| 1\) - 1\) % wdlen \+ wdlen\) % wdlen;" 'Harptos weekday math should restart each tenday.'
Assert-Match "_renderHarptosFestivalStrip\(y, mi, mobj, dimActive, extraEventsFn, includeCalendarEvents, ['""]full['""]\)" 'Harptos intercalary days should render with the festival strip helper.'

Assert-NotMatch '\bgetEclipses\b' 'Eclipse engine should be excised from calendar.js.'
Assert-NotMatch '\b_moonVisibilityHtml\b' 'Sky-position renderer should be excised from calendar.js.'
Assert-NotMatch '\bnighttimeLightHtml\b' 'Nighttime lighting renderer should be excised from calendar.js.'

Assert-Match "Shorter off-cycle shifts are tied to Aryth full/new moons through the moontied generator\." 'Dolurrh notes should describe the implemented Aryth-linked generator.'
Assert-Match "!cal moon send \(low\|medium\|high\) \[1w\|1m\|3m\|6m\|10m\|Nd\|Nw\]" 'Moon help text should advertise the supported week/day range tokens.'
Assert-Match "!cal planes send \[low\|medium\|high\] \[1d\|3d\|6d\|10d\|1m\|3m\|6m\|10m\|Nd\|Nw\]" 'Plane help text should advertise the supported day/week/month range tokens.'
Assert-NotMatch 'moons-system-design\.md' 'Stale moon design-file references should be removed from calendar.js.'
Assert-NotMatch 'Generated events should be tied to Aryth full/new moons rather than independent dice rolls' 'Outdated Dolurrh TODO text should be removed from calendar.js.'

Write-Output 'PASS: calendar smoke checks'
