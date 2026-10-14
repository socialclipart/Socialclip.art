@echo off
title Sportwagen Vorschau-Server
cd /d "%~dp0"
where py >nul 2>nul && (py server.py & goto :end)
where python >nul 2>nul && (python server.py & goto :end)
echo.
echo  Python ist nicht installiert.
echo  Bitte von https://www.python.org/downloads/ installieren
echo  (beim Installieren "Add python.exe to PATH" anhaken) und erneut starten.
echo.
:end
pause
