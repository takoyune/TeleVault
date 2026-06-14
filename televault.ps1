# teledrive.ps1
# Unified control script for starting, stopping, and checking the status of TeleDrive

param(
    [Parameter(Mandatory=$false, Position=0)]
    [ValidateSet("start", "stop", "status", "restart", "menu")]
    [string]$Action = "menu",

    [Parameter(Mandatory=$false)]
    [switch]$Background,

    [Parameter(Mandatory=$false)]
    [string]$Python = "C:\Python314\python.exe",

    [Parameter(Mandatory=$false)]
    [string]$Node = "node"
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Get root directory of the project
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($RootDir)) {
    $RootDir = Get-Location
}

# Config paths
$StateFile = Join-Path $RootDir ".teledrive.state"
$BackendPort = 8000
$FrontendPort = 5173

# Helper: Print styled messages
function Write-Header($text) {
    Write-Host "" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "=========================================================" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "[OK] $text" -ForegroundColor Green
}

function Write-Info($text) {
    Write-Host "[i] $text" -ForegroundColor Cyan
}

function Write-WarningMsg($text) {
    Write-Host "[!] $text" -ForegroundColor Yellow
}

function Write-ErrorMsg($text) {
    Write-Host "[ERR] $text" -ForegroundColor Red
}

# Helper: Get process listening on a port
function Get-ProcessByPort($port) {
    # Method 1: Get-NetTCPConnection (PowerShell 5.1+)
    $connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($connection) {
        $proc = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) { return $proc }
    }
    # Method 2: Fallback to netstat
    $netstat = netstat -ano | Select-String "LISTENING" | Select-String ":$port\s+" | Select-Object -First 1
    if ($netstat) {
        $parts = $netstat.Line.Trim() -split '\s+'
        $pid = $parts[-1]
        if ($pid -match '^\d+$') {
            $proc = Get-Process -Id [int]$pid -ErrorAction SilentlyContinue
            if ($proc) { return $proc }
        }
    }
    return $null
}

# Helper: Force kill process and its tree
function Kill-ProcessSafe($processId) {
    if ($processId) {
        $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Info "Stopping process $($proc.ProcessName) (PID: $processId)..."
            # Kill child processes if possible using taskkill /t
            taskkill /pid $processId /f /t > $null 2>&1
            # Standard stop process fallback
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
}

# Helper: Detect Python executable
function Detect-Python {
    if (Test-Path $Python) {
        return $Python
    }
    $detected = Get-Command python -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($detected) { return $detected }
    
    $detected3 = Get-Command python3 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
    if ($detected3) { return $detected3 }
    
    return $null
}

# Helper: Detect Node executable
function Detect-Node {
    if ($Node -ne "node" -and (Test-Path $Node)) {
        return $Node
    }
    # Check standard paths
    $common = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe"
    )
    foreach ($path in $common) {
        if (Test-Path $path) {
            return $path
        }
    }
    if (Get-Command node -ErrorAction SilentlyContinue) {
        return "node"
    }
    return $null
}

# Action: Check Status
function Show-Status {
    Write-Header "TeleDrive Status Check"
    
    $backendProc = Get-ProcessByPort $BackendPort
    $frontendProc = Get-ProcessByPort $FrontendPort
    
    $runningCount = 0
    
    if ($backendProc) {
        Write-Success "Backend: RUNNING on port $BackendPort (PID: $($backendProc.Id))"
        $runningCount++
    } else {
        Write-WarningMsg "Backend: STOPPED (Port $BackendPort is free)"
    }
    
    if ($frontendProc) {
        Write-Success "Frontend: RUNNING on port $FrontendPort (PID: $($frontendProc.Id))"
        $runningCount++
    } else {
        Write-WarningMsg "Frontend: STOPPED (Port $FrontendPort is free)"
    }
    
    if ($backendProc -and $frontendProc) {
        Write-Host ""
        Write-Host "TeleDrive is fully active!" -ForegroundColor Green
        Write-Host "Access the Web UI here: http://localhost:5173" -ForegroundColor Green
    } elseif ($backendProc) {
        Write-Host ""
        Write-Host "Backend is active on port $BackendPort." -ForegroundColor Green
    } elseif ($frontendProc) {
        Write-Host ""
        Write-Host "Frontend is active on port $FrontendPort." -ForegroundColor Green
    } else {
        Write-Info "TeleDrive is completely stopped."
    }
    Write-Host ""
}

# Action: Start Services
function Start-TeleDrive {
    Write-Header "Starting TeleDrive Services"
    
    # Check if already running
    $backendProc = Get-ProcessByPort $BackendPort
    $frontendProc = Get-ProcessByPort $FrontendPort
    
    if ($backendProc -or $frontendProc) {
        Write-WarningMsg "TeleDrive is already running (partially or fully)."
        Show-Status
        return
    }
    
    # Detect dependencies
    $resolvedPython = Detect-Python
    $resolvedNode = Detect-Node
    
    if (-not $resolvedPython -and -not $resolvedNode) {
        Write-ErrorMsg "Neither Python nor Node.js was detected. Cannot start any services."
        return
    }
    
    $StartBackend = $false
    $StartFrontend = $false
    
    if ($resolvedPython) {
        $StartBackend = $true
        Write-Info "Detected Python: $resolvedPython"
    } else {
        Write-WarningMsg "Python not found. Backend will not be started."
    }
    
    if ($resolvedNode) {
        $StartFrontend = $true
        Write-Info "Detected Node:   $resolvedNode"
    } else {
        Write-WarningMsg "Node.js not found. Frontend will not be started (Backend only)."
    }
    
    $backendWorkDir = Join-Path $RootDir "backend"
    $frontendWorkDir = Join-Path $RootDir "frontend"
    
    $backendProcess = $null
    $frontendProcess = $null
    
    if ($Background) {
        $LogsDir = Join-Path $RootDir "logs"
        if (-not (Test-Path $LogsDir)) {
            New-Item -ItemType Directory -Path $LogsDir -ErrorAction SilentlyContinue | Out-Null
        }
        
        if ($StartBackend) {
            $BackendLog = Join-Path $LogsDir "backend.log"
            Write-Info "Starting Backend in background (logs: logs/backend.log)..."
            $backendProcess = Start-Process -FilePath $resolvedPython -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendWorkDir -NoNewWindow -RedirectStandardOutput $BackendLog -RedirectStandardError $BackendLog -PassThru
        }
        
        if ($StartFrontend) {
            $FrontendLog = Join-Path $LogsDir "frontend.log"
            Write-Info "Starting Frontend in background (logs: logs/frontend.log)..."
            $frontendProcess = Start-Process -FilePath $resolvedNode -ArgumentList "node_modules\vite\bin\vite.js" -WorkingDirectory $frontendWorkDir -NoNewWindow -RedirectStandardOutput $FrontendLog -RedirectStandardError $FrontendLog -PassThru
        }
    } else {
        if ($StartBackend) {
            Write-Info "Launching Backend in a new window..."
            $backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k title TeleDrive Backend && `"$resolvedPython`" -m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory $backendWorkDir -PassThru
        }
        
        if ($StartFrontend) {
            Write-Info "Launching Frontend in a new window..."
            $frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/k title TeleDrive Frontend && `"$resolvedNode`" node_modules\vite\bin\vite.js" -WorkingDirectory $frontendWorkDir -PassThru
        }
    }
    
    # Wait for processes to initialize
    Write-Info "Waiting for services to open ports (timeout 12s)..."
    
    $backendCheck = $null
    $frontendCheck = $null
    
    for ($i = 1; $i -le 12; $i++) {
        if ($StartBackend -and -not $backendCheck) {
            $backendCheck = Get-ProcessByPort $BackendPort
        }
        if ($StartFrontend -and -not $frontendCheck) {
            $frontendCheck = Get-ProcessByPort $FrontendPort
        }
        
        $backendOk = (-not $StartBackend) -or $backendCheck
        $frontendOk = (-not $StartFrontend) -or $frontendCheck
        
        if ($backendOk -and $frontendOk) {
            break
        }
        
        Start-Sleep -Seconds 1
    }
    
    $success = $true
    if ($StartBackend -and -not $backendCheck) {
        Write-ErrorMsg "Backend did not start on port $BackendPort"
        $success = $false
    }
    if ($StartFrontend -and -not $frontendCheck) {
        Write-ErrorMsg "Frontend did not start on port $FrontendPort"
        $success = $false
    }
    
    if ($success) {
        # Save state
        $backendCmdPid = $null
        $backendActualPid = $null
        if ($StartBackend) {
            $backendCmdPid = $backendProcess.Id
            $backendActualPid = $backendCheck.Id
        }
        
        $frontendCmdPid = $null
        $frontendActualPid = $null
        if ($StartFrontend) {
            $frontendCmdPid = $frontendProcess.Id
            $frontendActualPid = $frontendCheck.Id
        }
        
        $state = @{
            BackendCmdPid = $backendCmdPid
            FrontendCmdPid = $frontendCmdPid
            BackendActualPid = $backendActualPid
            FrontendActualPid = $frontendActualPid
            Timestamp = (Get-Date).ToString("o")
        }
        $state | ConvertTo-Json | Out-File $StateFile -Force
        
        Write-Success "TeleDrive started successfully!"
        if ($StartFrontend) {
            Write-Host "Access the Web UI: http://localhost:5173" -ForegroundColor Green
        } else {
            Write-Host "Backend is running at http://127.0.0.1:8000" -ForegroundColor Green
        }
    } else {
        Write-ErrorMsg "Failed to start services. Check port conflicts or log files."
    }
}

# Action: Stop Services
function Stop-TeleDrive {
    Write-Header "Stopping TeleDrive Services"
    
    # 1. Try stopping using PIDs from state file
    if (Test-Path $StateFile) {
        try {
            $state = Get-Content $StateFile -Raw | ConvertFrom-Json
            Write-Info "Found state file. Stopping registered processes..."
            Kill-ProcessSafe $state.BackendCmdPid
            Kill-ProcessSafe $state.FrontendCmdPid
            Kill-ProcessSafe $state.BackendActualPid
            Kill-ProcessSafe $state.FrontendActualPid
        } catch {
            Write-WarningMsg "Failed to parse state file. Will fallback to port search."
        }
        Remove-Item $StateFile -ErrorAction SilentlyContinue | Out-Null
    }
    
    # 2. Port-based fallback to clean up any orphaned processes
    Write-Info "Checking ports to ensure cleanup..."
    $backendProc = Get-ProcessByPort $BackendPort
    if ($backendProc) {
        Write-WarningMsg "Found orphaned backend process (PID: $($backendProc.Id)) on port $BackendPort. Terminating..."
        Kill-ProcessSafe $backendProc.Id
    }
    
    $frontendProc = Get-ProcessByPort $FrontendPort
    if ($frontendProc) {
        Write-WarningMsg "Found orphaned frontend process (PID: $($frontendProc.Id)) on port $FrontendPort. Terminating..."
        Kill-ProcessSafe $frontendProc.Id
    }
    
    Write-Success "All TeleDrive services stopped."
}

# Interactive Menu
function Show-Menu {
    do {
        Clear-Host
        Write-Host "=========================================================" -ForegroundColor Cyan
        Write-Host "     TeleVault / TeleDrive Control Panel (Windows)      " -ForegroundColor Cyan
        Write-Host "=========================================================" -ForegroundColor Cyan
        
        # Quick status display in menu
        $b = Get-ProcessByPort $BackendPort
        $f = Get-ProcessByPort $FrontendPort
        $bStat = "STOPPED"
        $bColor = "Red"
        if ($b) { 
            $bStat = "RUNNING (PID: $($b.Id))" 
            $bColor = "Green"
        }
        
        $fStat = "STOPPED"
        $fColor = "Red"
        if ($f) { 
            $fStat = "RUNNING (PID: $($f.Id))" 
            $fColor = "Green"
        }
        
        Write-Host "  Backend Status:  " -NoNewline
        Write-Host $bStat -ForegroundColor $bColor
        Write-Host "  Frontend Status: " -NoNewline
        Write-Host $fStat -ForegroundColor $fColor
        Write-Host "=========================================================" -ForegroundColor Cyan
        Write-Host "  1. Start TeleDrive"
        Write-Host "  2. Start TeleDrive (Background Mode)"
        Write-Host "  3. Stop TeleDrive"
        Write-Host "  4. Restart TeleDrive"
        Write-Host "  5. Check Status Details"
        Write-Host "  6. Exit"
        Write-Host "=========================================================" -ForegroundColor Cyan
        Write-Host ""
        
        $choice = Read-Host "Select an option (1-6)"
        
        switch ($choice) {
            "1" { Start-TeleDrive; Read-Host "Press Enter to return to menu" }
            "2" { $Background = $true; Start-TeleDrive; Read-Host "Press Enter to return to menu" }
            "3" { Stop-TeleDrive; Read-Host "Press Enter to return to menu" }
            "4" { Stop-TeleDrive; Start-TeleDrive; Read-Host "Press Enter to return to menu" }
            "5" { Show-Status; Read-Host "Press Enter to return to menu" }
            "6" { return }
            default { Write-WarningMsg "Invalid option. Please try again."; Start-Sleep -Seconds 1 }
        }
    } while ($true)
}

# Execution Entry Point
switch ($Action) {
    "start"   { Start-TeleDrive }
    "stop"    { Stop-TeleDrive }
    "status"  { Show-Status }
    "restart" { Stop-TeleDrive; Start-TeleDrive }
    "menu"    { Show-Menu }
    default   { Show-Menu }
}
