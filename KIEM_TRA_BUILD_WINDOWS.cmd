@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo [1/9] Check Node and npm
where node >nul 2>&1 || goto :error
node --version
where npm >nul 2>&1 || goto :error
npm --version
echo [2/9] Check Vite and esbuild compatibility
node tools\check-dependencies.mjs || goto :error
echo [3/9] Verify game + soundpack files
node tools\verify-project.mjs || goto :error
echo [4/9] Install dependencies (NO force, NO legacy-peer-deps)
call npm install --no-audit --no-fund || goto :error
echo [5/9] TypeScript type-check
call npm run lint || goto :error
echo [6/9] Test audio scheduling with mocked AudioContext
call npm run test:audio || goto :error
echo [7/9] Test 90 unique numbers and 1/5 five-number packs
call npm run test:game || goto :error
echo [8/9] Vite production build
call npm run build || goto :error
echo [9/9] Check dist output
if not exist dist\index.html goto :error
echo.
echo SUCCESS: npm install, typecheck, audio simulation and Vite build all passed.
echo IMPORTANT: open the actual AI Studio Preview for final browser checks.
pause
exit /b 0
:error
echo.
echo FAILED: copy complete console logs. DO NOT use --force or --legacy-peer-deps.
pause
exit /b 1
