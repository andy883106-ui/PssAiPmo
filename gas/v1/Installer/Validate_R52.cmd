@echo off
setlocal
cd /d "%~dp0\.."
node Validation\validate-r52.js
echo.
pause
endlocal
