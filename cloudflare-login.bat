@echo off
setlocal
title PromptDeck Cloudflare Login
cd /d "%~dp0"

rem Installs wrangler on first use (npx --yes) and opens the Cloudflare login in a browser.
rem Uses npx.cmd so the PowerShell script execution policy does not block it.
set "NPX=C:\Program Files\nodejs\npx.cmd"
if not exist "%NPX%" (
  where npx.cmd >nul 2>&1
  if errorlevel 1 (
    echo.
    echo [ERROR] Node.js not found. Please install Node.js and try again.
    echo.
    pause
    exit /b 1
  )
  set "NPX=npx.cmd"
)

echo.
echo [1/2] Installing wrangler if needed and opening the Cloudflare login page...
echo       Log in to Cloudflare in the browser and click "Allow".
echo.
call "%NPX%" --yes wrangler login
if errorlevel 1 (
  echo.
  echo [ERROR] Login did not finish. Check the message above and run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo [2/2] Checking the logged-in account...
echo.
call "%NPX%" --yes wrangler whoami
echo.
echo Done. You can close this window.
pause
