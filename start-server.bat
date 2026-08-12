@echo off
setlocal enabledelayedexpansion
title PromptDeck Local Server
cd /d "%~dp0"

set PORT=4173
set LAN_HOST=192.168.14.160

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js not found. Please install Node.js and try again.
  echo.
  pause
  exit /b 1
)

set "PID_LIST="
for /f "tokens=5" %%p in ('netstat -aon ^| findstr /r /c:"LISTENING" ^| findstr /r /c:":%PORT% "') do (
  echo !PID_LIST! | findstr /c:" %%p " >nul
  if errorlevel 1 set "PID_LIST=!PID_LIST! %%p "
)

if defined PID_LIST (
  echo.
  echo Port %PORT% is already in use by process^(es^):!PID_LIST!
  echo (This is likely PromptDeck server^(s^) left running from before, possibly bound to different interfaces.)
  choice /M "Stop them and continue"
  if errorlevel 2 (
    echo.
    echo Cancelled. Server was not started.
    pause
    exit /b 1
  )
  for %%p in (!PID_LIST!) do (
    taskkill /F /PID %%p >nul 2>&1
  )
  timeout /t 1 /nobreak >nul
  echo Previous process^(es^) stopped.
)

echo.
echo Starting PromptDeck Local Server...
echo Address: http://localhost:%PORT%
echo Address: http://127.0.0.1:%PORT%
echo LAN Address: http://%LAN_HOST%:%PORT%/
echo To terminate: Ctrl+C
echo.
set "PROMPTDECK_HOST=0.0.0.0"
set "PROMPTDECK_PORT=%PORT%"
node server/local-server.js
echo.
echo Server process exited.
pause
