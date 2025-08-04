@echo off
echo 🚀 Firebase 배포 시작 (환경변수 검증 포함)...
echo ================================================
echo.

echo 🔍 1단계: 환경변수 검증...
call npm run verify-env
if %errorlevel% neq 0 (
    echo ❌ 환경변수 검증 실패!
    echo 💡 해결 방법:
    echo 1. env.local.example 파일을 .env.local로 복사
    echo 2. Firebase Console에서 실제 값으로 교체
    echo 3. 이 스크립트를 다시 실행
    pause
    exit /b 1
)
echo ✅ 환경변수 검증 통과!
echo.

echo 📦 2단계: 프로젝트 빌드...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 완료!
echo.

echo 🔥 3단계: Firebase CLI 확인...
call firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI가 설치되지 않았습니다!
    echo 💡 설치 방법: npm install -g firebase-tools
    pause
    exit /b 1
)
echo ✅ Firebase CLI 확인 완료!
echo.

echo 🚀 4단계: Firebase Hosting 배포...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo ❌ 배포 실패!
    pause
    exit /b 1
)
echo ✅ 배포 완료!
echo.

echo 🎉 배포 성공!
echo ================================================
echo 🌍 사이트 URL: https://wiz-coco.web.app
echo 📅 배포 시간: %date% %time%
echo.
echo 🔍 확인 사항:
echo 1. 메인 페이지 로딩 확인
echo 2. MBTI 테스트 기능 확인
echo 3. 로그인/회원가입 기능 확인
echo 4. 반응형 디자인 확인
echo.
echo 📊 성능 최적화 완료:
echo - 정적 파일 압축
echo - 이미지 최적화
echo - 캐싱 전략 적용
echo - 번들 크기 최적화
echo ================================================
echo.

pause 