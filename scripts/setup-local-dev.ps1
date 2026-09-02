$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host '=== WizCoCo 로컬 개발 환경 설정 ===' -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host 'Python이 없습니다. winget install Python.Python.3.12 실행 후 터미널을 다시 여세요.' -ForegroundColor Red
  exit 1
}

if (-not (Test-Path 'backend\.venv')) {
  Write-Host 'Python venv 생성...' 
  python -m venv backend\.venv
}

$pip = Join-Path $root 'backend\.venv\Scripts\pip.exe'
Write-Host 'Flask 의존성 설치...'
& $pip install -r backend\requirements.txt

if (-not (Test-Path '.env.local')) {
  Copy-Item '.env.local.example' '.env.local'
  Write-Host '생성: .env.local (NEXT_PUBLIC_FLASK_API_URL=http://localhost:5000)' -ForegroundColor Green
}

if (-not (Test-Path 'backend\.env')) {
  Copy-Item 'backend\.env.example' 'backend\.env'
  Add-Content 'backend\.env' "`nCOST_SAVER_MODE=true`nPUBLIC_SITE_URL=http://localhost:3000"
  Write-Host '생성: backend/.env (COST_SAVER_MODE=true)' -ForegroundColor Green
}

$keyPath = Join-Path $root 'backend\serviceAccountKey.json'
$githubKey = Get-ChildItem -Path (Join-Path $root 'Firebase_GitHub') -Filter '*.json' -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not (Test-Path $keyPath) -and $githubKey) {
  $rel = '../Firebase_GitHub/' + $githubKey.Name
  $envPath = Join-Path $root 'backend\.env'
  if (Test-Path $envPath) {
    (Get-Content $envPath -Raw) -replace 'FIREBASE_CREDENTIALS_PATH=.*', "FIREBASE_CREDENTIALS_PATH=$rel" | Set-Content $envPath -NoNewline
  }
  Write-Host "Firebase 키 연결: $rel" -ForegroundColor Green
} elseif (Test-Path $keyPath) {
  Write-Host 'Firebase serviceAccountKey.json 확인됨' -ForegroundColor Green
} else {
  Write-Host ''
  Write-Host '⚠ Firebase Admin 키 필요: backend/serviceAccountKey.json 또는 Firebase_GitHub/*.json' -ForegroundColor Yellow
  Write-Host '  Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 JSON' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '완료. 실행: npm run dev' -ForegroundColor Green
