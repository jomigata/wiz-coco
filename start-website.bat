@echo off
echo 웹사이트를 시작합니다...
echo.
echo 서버 상태를 확인합니다...

REM 서버가 실행 중인지 확인
netstat -an | findstr :3000 > nul
if %errorlevel% equ 0 (
    echo 서버가 이미 실행 중입니다.
) else (
    echo 서버를 시작합니다...
    start "Next.js Server" cmd /k "npm run dev"
    timeout /t 5 /nobreak > nul
)

echo.
echo 브라우저에서 웹사이트를 엽니다...
start http://localhost:3000

echo.
echo 완료! 브라우저가 자동으로 열립니다.
echo 웹사이트 주소: http://localhost:3000
echo.
pause 