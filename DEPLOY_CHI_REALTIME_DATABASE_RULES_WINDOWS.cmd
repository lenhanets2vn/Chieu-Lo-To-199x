@echo off
setlocal
cd /d "%~dp0"
title LO TO 199X - SUA LOI RULES REALTIME DATABASE
set "PROJECT_ID=loto-83a1a"
echo =============================================
echo  SUA LOI RTDB RULES - numChildren()
echo  Project: %PROJECT_ID%
echo =============================================
echo.
if not exist database.rules.json (
  echo [LOI] Khong tim thay database.rules.json
  pause
  exit /b 1
)
where firebase >nul 2>nul
if errorlevel 1 (
  echo [LOI] Can cai Firebase CLI: npm install -g firebase-tools
  pause
  exit /b 1
)
echo [THONG TIN] Dang tai Rules moi cho Realtime Database.
echo [CANH BAO] Frontend cu su dung slot UID ngau nhien se KHONG tuong thich.
echo [CANH BAO] Can deploy frontend ZIP moi cung phien ban.
echo.
call firebase deploy --only database --project %PROJECT_ID%
if errorlevel 1 goto fail
echo [THANH CONG] Da cap nhat RTDB Rules tren project %PROJECT_ID%.
echo [TIEP THEO] Deploy frontend moi theo README.
pause
exit /b 0
:fail
echo [LOI] Trien khai that bai, hay doc CHINH XAC dong loi phia tren.
pause
exit /b 1
