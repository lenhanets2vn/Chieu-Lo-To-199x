@echo off
setlocal
cd /d "%~dp0"
title LO TO 199X - RULES VA DON DEP CHAT PHONG
set "PROJECT_ID=loto-83a1a"
echo ================================================
echo  CAP NHAT RULES + CLOUD FUNCTION DON CHAT PHONG
 echo ================================================
echo Khong dua source functions len Render/Vercel runtime.
echo Lenh nay yeu cau du an Firebase co Cloud Functions 2nd gen va billing phu hop.
echo.
where firebase >nul 2>nul
if errorlevel 1 (
  echo [LOI] Cai Firebase CLI: npm install -g firebase-tools
  pause
  exit /b 1
)
call firebase login
if errorlevel 1 (pause & exit /b 1)
echo.
echo [1/2] Cap nhat Security Rules cho database co ten...
call firebase deploy --only firestore:rules --project "%PROJECT_ID%"
if errorlevel 1 (
  echo [LOI] Rules chua deploy. Dung lai.
  pause
  exit /b 1
)
echo.
echo [2/2] Cai dependencies backend va trien khai function don phong khi dong...
call npm --prefix functions install --no-audit --no-fund
if errorlevel 1 (
  echo [LOI] Khong the cai packages cho Cloud Functions.
  pause
  exit /b 1
)
call firebase deploy --only functions:cleanupClosedRoom --project "%PROJECT_ID%"
if errorlevel 1 (
  echo [CANH BAO] Function chua deploy. Tin nhan phong da dong se bi an boi Rules, nhung chua xoa vat ly.
  pause
  exit /b 1
)
echo [OK] Hoan tat. Upload source frontend len GitHub va redeploy Render/Vercel.
pause
endlocal
