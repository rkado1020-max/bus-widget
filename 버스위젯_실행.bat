@echo off
cd /d "%~dp0"
start "" /min node server.js
timeout /t 2 >nul
start "" chrome --app=http://localhost:3939 --window-size=380,460 --window-position=1500,80
