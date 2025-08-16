@echo off
echo ========================================
echo 🚫 로컬 배포가 비활성화되었습니다
echo ========================================

echo.
echo 📋 현재 배포 정책:
echo - 로컬 배포: ❌ 비활성화
echo - GitHub Actions: ✅ 활성화
echo - Firebase Hosting: ✅ 자동 배포
echo.

echo 🔄 배포 방법:
echo 1. 코드를 GitHub에 푸시
echo 2. GitHub Actions가 자동으로 실행
echo 3. Firebase Hosting에 자동 배포
echo.

echo 🌐 배포된 사이트:
echo - URL: https://wiz-coco.web.app
echo - 상태: GitHub Actions로 자동 관리
echo.

echo 📊 GitHub Actions 상태 확인:
echo - Actions: https://github.com/jomigata/wiz-coco/actions
echo - 배포 로그: GitHub 저장소의 Actions 탭에서 확인
echo.

echo ⚠️  주의사항:
echo - 로컬에서 npm run deploy:* 명령어는 작동하지 않습니다
echo - 모든 배포는 GitHub Actions를 통해 자동화됩니다
echo - 수동 배포가 필요한 경우 GitHub에서 workflow_dispatch를 사용하세요
echo.

pause 