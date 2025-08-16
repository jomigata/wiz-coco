@echo off
echo ========================================
echo Firebase Hosting 배포 시작
echo ========================================

echo.
echo 1. 기존 빌드 파일 정리...
call npm run clean

echo.
echo 2. 프로덕션 빌드 시작...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ 빌드 실패! 배포를 중단합니다.
    pause
    exit /b 1
)

echo.
echo 3. Firebase 배포 시작...
firebase deploy --only hosting

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Firebase 배포 실패!
    pause
    exit /b 1
)

echo.
echo ✅ Firebase Hosting 배포 완료!
echo 🌐 웹사이트: https://wiz-coco.web.app
echo.
pause 