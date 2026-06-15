@echo off
REM Startapp (Python): abre o modal de inicializacao sem janela de console.
REM Duplo-clique aqui. Requer Python 3 (instale: winget install -e --id Python.Python.3.12).
cd /d "%~dp0"

set "PYW="
for %%P in (
  "%LOCALAPPDATA%\Programs\Python\Python312\pythonw.exe"
  "%LOCALAPPDATA%\Programs\Python\Python313\pythonw.exe"
  "%LOCALAPPDATA%\Programs\Python\Python311\pythonw.exe"
) do if not defined PYW if exist "%%~P" set "PYW=%%~P"
if not defined PYW where pythonw >nul 2>&1 && set "PYW=pythonw"
if not defined PYW where python >nul 2>&1 && set "PYW=python"

if not defined PYW (
  echo Python 3 nao encontrado. Instale com:
  echo   winget install -e --id Python.Python.3.12
  pause
  exit /b 1
)

start "" "%PYW%" startapp.py
