@echo off
echo ========================================
echo Firestore 보안 규칙 배포 시작
echo ========================================
echo.

echo 1. Firebase 프로젝트 상태 확인...
firebase projects:list

echo.
echo 2. Firestore 보안 규칙 배포...
firebase deploy --only firestore:rules

echo.
echo 3. 배포 완료 확인...
firebase firestore:rules:get

echo.
echo ========================================
echo 배포 완료!
echo ========================================
pause
