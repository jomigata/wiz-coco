@echo off
chcp 65001 >nul
echo ========================================
echo 🧠 WizCoCo AI 심리상담 시스템 배포 시작
echo ========================================

echo.
echo 📋 AI 심리상담 시스템 배포 모드:
echo - 사용자 입력: ❌ 불필요
echo - 키보드 엔터: ❌ 불필요
echo - 마우스 클릭: ❌ 불필요
echo - 완전 자동: ✅ 활성화
echo.

echo 🔄 AI 심리상담 시스템 배포 실행 중...
echo.

echo 🧠 AI 심리상담 시스템 구성 요소:
echo 1. 4단계 심리검사 프로그램
echo    - 통합 자기 점검 (Holistic Self-Check)
echo    - 집중 탐색 모듈 (Focused Exploration)
echo    - 강점 및 자원 탐색 (Strength Discovery)
echo    - 상담 청사진 (Counseling Blueprint)
echo.
echo 2. 상담사 관리 시스템
echo    - 상담사 대시보드
echo    - 내담자 관리
echo    - 위험신호 모니터링
echo    - AI 채팅 상담
echo.
echo 3. 분석 및 보고 시스템
echo    - 진행 상황 분석
echo    - 통합 보고서 생성
echo    - 시스템 설정
echo.

echo 🔄 AI 심리상담 시스템 배포 실행 중...
node scripts/ai-counseling-deploy.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo 🎉 AI 심리상담 시스템 배포가 성공적으로 완료되었습니다!
    echo 🌐 GitHub Actions가 자동으로 실행됩니다
    echo 📊 상태 확인: https://github.com/jomigata/wiz-coco/actions
    echo 🌐 배포된 사이트: https://wiz-coco.web.app
    echo.
    echo 🧠 AI 심리상담 시스템 접근 방법:
    echo 1. 메인 페이지에서 "AI 심리상담 시스템" 메뉴 클릭
    echo 2. 4단계 심리검사 프로그램 시작
    echo 3. 상담사 대시보드에서 내담자 관리
    echo 4. AI 위험신호 모니터링 확인
    echo.
    echo 📊 배포 통계:
    echo - 총 페이지: 7개
    echo - API 엔드포인트: 5개
    echo - 데이터베이스 테이블: 5개
    echo - 컴포넌트: 1개 (Navigation 업데이트)
) else (
    echo.
    echo ❌ AI 심리상담 시스템 배포 중 오류가 발생했습니다
    echo 🔍 오류 로그를 확인해주세요
    echo.
    echo 🔧 문제 해결 방법:
    echo 1. 필수 파일 존재 여부 확인
    echo 2. 데이터베이스 스키마 검증
    echo 3. API 라우트 구성 확인
    echo 4. 컴포넌트 통합 상태 확인
)

echo.
echo ⏳ 10초 후 자동으로 창이 닫힙니다...
timeout /t 10 /nobreak >nul
