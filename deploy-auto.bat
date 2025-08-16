@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 WizCoCo 완전 자동화 배포 시작
echo ========================================

echo.
echo 📋 자동화 모드:
echo - 사용자 입력: ❌ 불필요
echo - 키보드 엔터: ❌ 불필요
echo - 마우스 클릭: ❌ 불필요
echo - 완전 자동: ✅ 활성화
echo.

echo 🔄 자동 배포 실행 중...
echo.
echo 📋 배포 모드 선택:
echo 1. 기본 자동 배포 (권장)
echo 2. 고속 배포 (Git 지연 문제 해결)
echo.
echo 🔄 기본 자동 배포 실행 중...
node scripts/auto-deploy.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 자동 배포가 성공적으로 완료되었습니다!
    echo 🌐 GitHub Actions가 자동으로 실행됩니다
    echo 📊 상태 확인: https://github.com/jomigata/wiz-coco/actions
) else (
    echo.
    echo ❌ 자동 배포 중 오류가 발생했습니다
    echo 🔍 오류 로그를 확인해주세요
)

echo.
echo ⏳ 5초 후 자동으로 창이 닫힙니다...
timeout /t 5 /nobreak >nul
