@echo off
cd /d "%~dp0"
echo Starting Hans Schedule server at http://localhost:8000
echo Press Ctrl+C to stop.
echo.
python -m http.server 8000
pause
