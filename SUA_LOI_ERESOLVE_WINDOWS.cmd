@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo === FIX NPM ERESOLVE: VITE 8 / ESBUILD ===
echo This will remove node_modules and stale lockfiles in THIS PROJECT FOLDER ONLY.
echo It will NOT delete TypeScript source code or public/soundpack.
choice /C YN /M "Proceed with dependency reset?"
if errorlevel 2 exit /b 0
if exist node_modules rmdir /S /Q node_modules
if exist package-lock.json del /F /Q package-lock.json
if exist npm-shrinkwrap.json del /F /Q npm-shrinkwrap.json
if exist bun.lock del /F /Q bun.lock
if exist bun.lockb del /F /Q bun.lockb
echo Verifying package.json ...
node tools\check-dependencies.mjs || goto :error
echo Installing compatible dependencies ...
call npm install --no-audit --no-fund || goto :error
echo Running TypeScript check ...
call npm run lint || goto :error
echo Building Vite ...
call npm run build || goto :error
echo SUCCESS: dependency reset and build complete.
pause
exit /b 0
:error
echo FAILED: copy this console output. Do not use --force / --legacy-peer-deps.
pause
exit /b 1
