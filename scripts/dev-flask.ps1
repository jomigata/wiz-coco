$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backend = Join-Path $root 'backend'
$venvPython = Join-Path $backend '.venv\Scripts\python.exe'

if (-not (Test-Path $venvPython)) {
  Write-Host 'backend/.venv 없음 — npm run setup:local 을 먼저 실행하세요.' -ForegroundColor Red
  exit 1
}

$envFile = Join-Path $backend '.env'
if (-not (Test-Path $envFile)) {
  Write-Host 'backend/.env 없음 — npm run setup:local 을 먼저 실행하세요.' -ForegroundColor Red
  exit 1
}

Set-Location $backend
Write-Host 'Flask API → http://localhost:5000' -ForegroundColor Cyan
& $venvPython app.py
