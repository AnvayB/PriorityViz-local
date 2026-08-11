# PriorityViz — Windows Task Scheduler setup
# Run from PowerShell inside the priorityviz-local folder:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-task.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$scriptPath = Join-Path $scriptDir "send-daily-summary.js"

# Find node.exe
$nodePath = (Get-Command node -ErrorAction SilentlyContinue).Source
if (-not $nodePath) {
    Write-Error "Node.js not found. Install it from https://nodejs.org and re-run this script."
    exit 1
}

# Read send time from email-config.json or data file (default 18:00)
$sendHour = 18
$sendMinute = 0
$configPath = Join-Path $projectDir "email-config.json"
if (Test-Path $configPath) {
    try {
        $config = Get-Content $configPath | ConvertFrom-Json
        if ($config.dataFilePath -and (Test-Path $config.dataFilePath)) {
            $data = Get-Content $config.dataFilePath | ConvertFrom-Json
            if ($data.emailSettings.sendTime) {
                $parts = $data.emailSettings.sendTime -split ":"
                $sendHour   = [int]$parts[0]
                $sendMinute = [int]$parts[1]
            }
        }
    } catch {}
}

$taskName = "PriorityViz Daily Email"
$action   = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$scriptPath`"" -WorkingDirectory $projectDir
$trigger  = New-ScheduledTaskTrigger -Daily -At (Get-Date -Hour $sendHour -Minute $sendMinute -Second 0)
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -StartWhenAvailable

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -RunLevel Highest

Write-Host ""
Write-Host "Scheduled task '$taskName' created — runs daily at $($sendHour.ToString('D2')):$($sendMinute.ToString('D2'))." -ForegroundColor Green
Write-Host "Test it now with:  node `"$scriptPath`"" -ForegroundColor Cyan
