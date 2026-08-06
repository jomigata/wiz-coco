# WizCoCo — Cursor Marketplace 플러그인 설치 페이지 일괄 열기
# 각 탭에서 "Add to Cursor" 클릭 → 프로젝트(workspace) 범위 권장

$urls = @(
    # 1단계 — 혼자/소규모 개발
    'https://cursor.com/marketplace/cursor/pr-review-canvas',
    'https://cursor.com/marketplace/figma',
    'https://cursor.com/marketplace/google-drive',
    # 2단계 — 운영·분석
    'https://cursor.com/marketplace/datadog',
    'https://cursor.com/marketplace/amplitude',
    # 3단계 — 상담사 업무
    'https://cursor.com/marketplace/linear',
    'https://cursor.com/marketplace/cursor/docs-canvas',
    # 3단계 — 배포·장애 / 결제·알림
    'https://cursor.com/marketplace/slack',
    'https://cursor.com/marketplace/gmail'
)

Write-Host 'WizCoCo Cursor 플러그인 마켓플레이스를 엽니다...'
Write-Host '각 페이지에서 Add to Cursor → Workspace(프로젝트) 설치 권장'
Write-Host ''

foreach ($url in $urls) {
    Start-Process $url
    Start-Sleep -Milliseconds 800
}

Write-Host '완료. Cursor 재시작 후 Customize > Tools & MCP 에서 Connect 하세요.'
Write-Host '가이드: docs/cursor-plugins-wizcoco-ko.md'
