[CmdletBinding()]
param(
  [string]$Roll20ApiUrl,
  [switch]$SkipPull,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$calendarScript = Join-Path $repoRoot 'calendar.js'
$localConfigPath = Join-Path $PSScriptRoot 'Launch-Roll20ApiSync.local.ps1'

if (Test-Path $localConfigPath) {
  . $localConfigPath
}

if (-not $PSBoundParameters.ContainsKey('Roll20ApiUrl') -and (Get-Variable -Name Roll20ApiUrl -Scope Local -ErrorAction SilentlyContinue)) {
  $Roll20ApiUrl = $ExecutionContext.SessionState.PSVariable.GetValue('Roll20ApiUrl')
}

if (-not (Test-Path $calendarScript)) {
  throw "Expected Roll20 script not found: $calendarScript"
}

if (-not $SkipPull) {
  $git = Get-Command git -ErrorAction Stop
  Write-Host "Pulling latest changes in $repoRoot..."
  & $git.Source -C $repoRoot pull --ff-only
  if ($LASTEXITCODE -ne 0) {
    throw "git pull failed with exit code $LASTEXITCODE."
  }
}

Write-Host "Building calendar.js from TypeScript source..."
& npm run build --prefix $repoRoot
if ($LASTEXITCODE -ne 0) {
  throw "npm run build failed with exit code $LASTEXITCODE."
}

$currentCommit = (& git -C $repoRoot rev-parse --short HEAD).Trim()
$modifiedFiles = (& git -C $repoRoot status --short).Trim()

Write-Host "Ready to upload $calendarScript"
Write-Host "Current commit: $currentCommit"

if ($modifiedFiles) {
  Write-Warning "Working tree has local changes. The autouploader will sync the file currently on disk."
}

if (-not $Roll20ApiUrl) {
  Write-Warning "No Roll20 API page URL is configured yet."
  Write-Host "Create tools/Launch-Roll20ApiSync.local.ps1 from the example file and set `$Roll20ApiUrl there."
  Write-Host "Then rerun this launcher after your Roll20 autouploader extension is configured to watch calendar.js."
  return
}

if ($NoBrowser) {
  Write-Host "Skipping browser launch. Open this URL when you're ready:"
  Write-Host $Roll20ApiUrl
  return
}

$edge = Get-Command msedge.exe -ErrorAction SilentlyContinue
if ($edge) {
  Start-Process -FilePath $edge.Source -ArgumentList $Roll20ApiUrl | Out-Null
} else {
  Start-Process $Roll20ApiUrl | Out-Null
}

Write-Host "Opened Roll20 API page in your browser."
