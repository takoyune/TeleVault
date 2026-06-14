# Start TeleDrive backend (FastAPI on http://127.0.0.1:8000)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = "C:\Python314\python.exe"
if (-not (Test-Path $python)) {
  Write-Error "Python not found at $python. Install Python 3.11+ or edit this script."
}
Set-Location (Join-Path $root "backend")
& $python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
