@echo off
setlocal
cd /d "%~dp0"
title LO TO 199X - CAP NHAT RULES FIRESTORE + REALTIME DATABASE
set "PROJECT_ID=loto-83a1a"
echo ==================================================
echo  LO TO 199X - FIRESTORE + RTDB RULES
 echo ==================================================
echo [CHU Y] Hay tao Realtime Database tren Firebase Console truoc.
echo [CHU Y] Xac nhan project la: %PROJECT_ID%
echo.
where firebase >nul 2>nul
if errorlevel 1 (
  echo [LOI] Cai Firebase CLI: npm install -g firebase-tools
  pause
  exit /b 1
)
if not exist database.rules.json (
  echo [LOI] Thieu database.rules.json
  pause
  exit /b 1
)
call firebase login
if errorlevel 1 goto fail
call firebase deploy --only database,firestore:rules,firestore:indexes --project %PROJECT_ID%
if errorlevel 1 goto fail
echo [THANH CONG] Da trien khai Rules va Indexes.
echo Sau do dat VITE_FIREBASE_DATABASE_URL tren Render/Vercel va deploy frontend.
pause
exit /b 0
:fail
echo [LOI] Trien khai that bai. Doc dong loi phia tren de phan biet cu phap Rules, IAM va RTDB database.
pause
exit /b 1
