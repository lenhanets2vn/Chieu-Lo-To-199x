@echo off
setlocal
cd /d "%~dp0"
title LO TO 199X - CAP NHAT FIRESTORE RULES
set "PROJECT_ID=loto-83a1a"
set "DATABASE_ID=(default)"
echo ================================================
echo  LO TO 199X - FIRESTORE DEFAULT DATABASE RULES
echo ================================================
echo Project: %PROJECT_ID%
echo Database: %DATABASE_ID%
echo.
if not exist "firebase.json" (
  echo [LOI] Khong tim thay firebase.json. Hay chay CMD trong thu muc Full Source.
  pause
  exit /b 1
)
if not exist "firestore.rules" (
  echo [LOI] Khong tim thay firestore.rules.
  pause
  exit /b 1
)
where firebase >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Firebase CLI. Chay: npm install -g firebase-tools
  pause
  exit /b 1
)
echo [1/3] Dang nhap Firebase (neu chua dang nhap)...
call firebase login
if errorlevel 1 (
  echo [LOI] Khong the dang nhap Firebase.
  pause
  exit /b 1
)
echo.
echo [2/3] Kiem tra default database trong du an...
call firebase firestore:databases:get "%DATABASE_ID%" --project "%PROJECT_ID%"
if errorlevel 1 (
  echo [LOI] Default database khong ton tai hoac tai khoan thieu quyen.
  echo KHONG tu dong tao database moi hoac doi sang default.
  pause
  exit /b 1
)
echo.
echo [3/3] Trien khai chi Firestore Security Rules...
call firebase deploy --only firestore:rules --project "%PROJECT_ID%"
if errorlevel 1 (
  echo [LOI] Deploy that bai. Kiem tra quy tac va quyen truy cap Firebase.
  pause
  exit /b 1
)
echo.
echo [OK] Lenh deploy rules thanh cong. Cap nhat frontend tren Render/Vercel cung ban.
echo Luu y: giao dich tao/join phong CAN rules moi, khong su dung code va rules lech phien ban.
pause
endlocal
