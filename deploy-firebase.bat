@echo off
echo 🚀 Firebase 직접 배포 시작...
echo.

echo 📦 프로젝트 빌드 중...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 완료!
echo.

echo 🌐 Firebase Hosting 배포 중...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ❌ 배포 실패!
    pause
    exit /b 1
)
echo ✅ 배포 완료!
echo.

echo 🎉 배포 성공!
echo 🌍 사이트 URL: https://wiz-coco.web.app
echo.

pause 