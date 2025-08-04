# PowerShell Firebase 토큰 검증 스크립트

$token = "1//0gAPQL2pA35NPCgYIARAAGBASNwF-L9IrfFhKm0PxCSgF8CUhBnddPfW-KFndg5s5l6YUBo3WpzamLHg-1pRL269_ExnDhYIxHfg"

Write-Host "🔍 Firebase 토큰 확인 중..." -ForegroundColor Cyan
Write-Host "토큰: $($token.Substring(0, 20))..." -ForegroundColor Yellow

# 토큰 형식 확인
if ($token.StartsWith("1//")) {
    Write-Host "✅ 토큰 형식이 올바릅니다 (Firebase CI 토큰)" -ForegroundColor Green
} else {
    Write-Host "❌ 토큰 형식이 올바르지 않습니다" -ForegroundColor Red
}

# 토큰 길이 확인
if ($token.Length -gt 100) {
    Write-Host "✅ 토큰 길이가 적절합니다" -ForegroundColor Green
} else {
    Write-Host "❌ 토큰 길이가 너무 짧습니다" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 이 토큰을 GitHub Secrets에 설정하세요:" -ForegroundColor Cyan
Write-Host "Name: FIREBASE_TOKEN" -ForegroundColor White
Write-Host "Value: $token" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔗 설정 링크:" -ForegroundColor Cyan
Write-Host "https://github.com/jomigata/wiz-coco/settings/secrets/actions" -ForegroundColor Blue 