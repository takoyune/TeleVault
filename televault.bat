@echo off
setlocal enabledelayedexpansion

:: Check if script is run with arguments
if "%~1"=="" (
    :: No arguments: run interactive menu
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0teledrive.ps1" menu
) else (
    :: Forward arguments to PowerShell script
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0teledrive.ps1" %*
)
