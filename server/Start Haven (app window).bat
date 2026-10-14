@echo off
rem Haven Schedule - local launcher.
rem Starts the local server if it is not already running, then opens the app
rem in its own window. Safe to double-click repeatedly.
rem
rem Note: goto is used instead of "if ( ... )" blocks on purpose - the app
rem folder name contains parentheses, and expanding such a value inside a
rem parenthesised block breaks cmd's parser.

setlocal
set "PYW=C:\Users\ASUS\.workbuddy-ai\binaries\python\versions\3.13.12\pythonw.exe"
set "PROJ=C:\Users\ASUS\AIAPPS~1\(1)HAV~1"

if exist "%PROJ%\server\launch_local.py" goto :check_python
for /d %%D in ("%USERPROFILE%\AI Apps\*Hav*") do set "PROJ=%%D"

:check_python
if not exist "%PYW%" goto :no_python

if not exist "%PROJ%\server\launch_local.py" goto :no_proj

start "" "%PYW%" "%PROJ%\server\launch_local.py"
exit /b 0

:no_python
echo Could not find Python at:
echo   %PYW%
echo.
pause
exit /b 1

:no_proj
echo Could not find the app folder. Looked in:
echo   %PROJ%
echo.
pause
exit /b 1
