$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Fail([string]$Message) {
  throw $Message
}

function Run([string]$File, [string[]]$Arguments, [string]$WorkingDirectory) {
  Push-Location $WorkingDirectory
  try {
    & $File @Arguments
    if ($LASTEXITCODE -ne 0) {
      Fail ("Command failed: " + $File + " " + ($Arguments -join ' '))
    }
  } finally {
    Pop-Location
  }
}

$installerDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$packageDir = Split-Path -Parent $installerDir
$configPath = Join-Path $installerDir 'install-config.json'
$templatePath = Join-Path $installerDir 'install-config.template.json'
$backendPatch = Join-Path $packageDir 'Patch\PSS_Workflow_R52.gs'
$frontendPatch = Join-Path $packageDir 'Patch\PSS_Workflow_R52.html'

if (-not (Test-Path $configPath)) {
  Copy-Item $templatePath $configPath
  Fail 'Created install-config.json. Fill scriptId and deploymentId, then run again.'
}

$config = Get-Content -Raw -Encoding UTF8 $configPath | ConvertFrom-Json
$scriptId = [string]$config.scriptId
$deploymentId = [string]$config.deploymentId
$description = [string]$config.description
if ([string]::IsNullOrWhiteSpace($scriptId) -or $scriptId -like 'PASTE_*') {
  Fail 'scriptId is missing in install-config.json.'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Fail 'Node.js 20 or later is required.'
}
if (-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)) {
  Fail 'npx.cmd was not found. Reinstall Node.js with npm.'
}
if (-not (Test-Path $backendPatch) -or -not (Test-Path $frontendPatch)) {
  Fail 'Patch files are missing.'
}

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$workRoot = Join-Path $packageDir ('work\PMO_R52_' + $stamp)
$backupRoot = Join-Path $packageDir 'backups'
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

Write-Host 'Step 1/5: Downloading the current Apps Script HEAD...'
Run 'npx.cmd' @('--yes','@google/clasp@latest','clone',$scriptId) $workRoot

$indexFiles = @(Get-ChildItem -Path $workRoot -Recurse -File -Filter 'Index.html')
if ($indexFiles.Count -ne 1) {
  Fail ('Expected exactly one Index.html, found ' + $indexFiles.Count + '.')
}
$indexPath = $indexFiles[0].FullName
$sourceRoot = Split-Path -Parent $indexPath

Write-Host 'Step 2/5: Creating a local backup before patching...'
$backupZip = Join-Path $backupRoot ('PMO_HEAD_before_R52_' + $stamp + '.zip')
Compress-Archive -Path (Join-Path $workRoot '*') -DestinationPath $backupZip -Force

Write-Host 'Step 3/5: Injecting the R5.2 backend and frontend...'
Copy-Item $backendPatch (Join-Path $sourceRoot 'PSS_Workflow_R52.gs') -Force
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$indexText = [System.IO.File]::ReadAllText($indexPath, $utf8NoBom)
$frontText = [System.IO.File]::ReadAllText($frontendPatch, $utf8NoBom)

# Repair a known R5.1 source truncation. A previous cleanup cut the URL regex
# at "^https?:\/\" and made the whole dynamic project module fail to parse.
$projectCellPattern = '(?s)function projectCellHtmlV18\(row,column\)\{.*?\}\s*window\.loadProjects='
$projectCellReplacement = @'
function projectCellHtmlV18(row,column){
  const value=(row.cells&&row.cells[column.key])||'';
  if(!value)return'';
  if(column.type==='url'&&/^https?:\/\//.test(value))return '<a target="_blank" rel="noopener" href="'+esc(value)+'">Open</a>';
  return esc(value)
}
window.loadProjects=
'@
if ([regex]::IsMatch($indexText, $projectCellPattern)) {
  $indexText = [regex]::Replace($indexText, $projectCellPattern, $projectCellReplacement, 1)
}

$markerPattern = '(?s)\s*<!-- PSS AI-PMO V20\.5 R5\.2 - inject before </body> in the existing Index\.html -->.*?<script id="pmoR52Front">.*?</script>\s*'
if ([regex]::IsMatch($indexText, $markerPattern)) {
  $indexText = [regex]::Replace($indexText, $markerPattern, "`r`n" + $frontText + "`r`n", 1)
} elseif ($indexText -match '</body>') {
  $indexText = [regex]::Replace($indexText, '</body>', "`r`n" + $frontText + "`r`n</body>", 1)
} else {
  Fail 'The downloaded Index.html has no </body> tag.'
}
[System.IO.File]::WriteAllText($indexPath, $indexText, $utf8NoBom)

if ($indexText -notmatch 'id="pmoR52Front"' -or $indexText -notmatch 'pmoR52Style') {
  Fail 'Frontend injection verification failed.'
}
if ($indexText -match "column\.type==='url'&&/\^https\?:\\/\\\s") {
  Fail 'Known R5.1 projectCellHtmlV18 regex corruption is still present.'
}
if (-not (Test-Path (Join-Path $sourceRoot 'PSS_Workflow_R52.gs'))) {
  Fail 'Backend patch verification failed.'
}

Write-Host 'Step 4/5: Uploading the patched HEAD...'
Run 'npx.cmd' @('--yes','@google/clasp@latest','push','--force') $workRoot

Write-Host 'Step 5/5: Updating the existing web app deployment...'
if (-not [string]::IsNullOrWhiteSpace($deploymentId) -and $deploymentId -notlike 'PASTE_*') {
  Run 'npx.cmd' @('--yes','@google/clasp@latest','deploy','--deploymentId',$deploymentId,'--description',$description) $workRoot
  Write-Host 'Deployment updated.'
} else {
  Write-Warning 'deploymentId is empty. HEAD was pushed, but the /exec deployment was not updated.'
}

Write-Host ''
Write-Host 'R5.2 source installation completed.'
Write-Host ('Local backup: ' + $backupZip)
Write-Host 'Next: run setupPssWorkFlowR52() and runPssWorkFlowSelfTestR52() once in Apps Script.'
