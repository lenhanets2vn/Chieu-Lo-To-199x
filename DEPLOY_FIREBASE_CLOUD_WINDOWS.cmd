@echo off
setlocal
cd /d "%~dp0"
echo =========================================
echo   LO TO HOI CHO 199x - FIREBASE RULES
 echo =========================================
echo.
echo Khong can va KHONG duoc dua service account private key vao source.
echo Du an: leafy-concept-qt8c4
 echo Firestore named database da khai bao tai firebase.json
 echo.
where firebase >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Firebase CLI. Cai Node.js, sau do mo CMD va chay:
  echo npm install -g firebase-tools
  pause
  exit /b 1
)
call firebase login
if errorlevel 1 (
  echo [LOI] Dang nhap Firebase that bai.
  pause
  exit /b 1
)
call firebase deploy --only firestore --project leafy-concept-qt8c4
if errorlevel 1 (
  echo [LOI] Deploy Firestore that bai. Kiem tra quyen IAM va database ID trong firebase.json.
  pause
  exit /b 1
)
echo.
echo [OK] Da gui cau hinh Firestore len Firebase. Hay kiem tra Console.
pause
endlocal
