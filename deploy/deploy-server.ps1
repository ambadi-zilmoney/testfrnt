# Build the React app and upload it to the EC2 server over SSH (PowerShell).
# Each deploy goes into /var/www/<domain>/releases/<timestamp>, then the "current"
# symlink is switched atomically. The last 5 releases are kept for rollback.
#
# Usage:
#   .\deploy\deploy-server.ps1 -Server ubuntu@203.0.113.10 -Domain example.com
#   .\deploy\deploy-server.ps1 -Server ubuntu@203.0.113.10 -Domain example.com -KeyFile C:\keys\my-key.pem
#
# Requires: the built-in OpenSSH client (ssh/scp) and SSH access to the server.
param(
    [Parameter(Mandatory = $true)][string]$Server,
    [Parameter(Mandatory = $true)][string]$Domain,
    [string]$KeyFile
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

$sshOpts = @()
if ($KeyFile) { $sshOpts = @('-i', $KeyFile) }

function Invoke-Step([string]$Message, [scriptblock]$Command) {
    Write-Host "==> $Message"
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "Step failed: $Message" }
}

$release = Get-Date -Format 'yyyyMMdd-HHmmss'
$root = "/var/www/$Domain"
$target = "$root/releases/$release"

Invoke-Step 'Installing dependencies' { npm ci --no-audit --no-fund }
Invoke-Step 'Building (mode: production)' { npm run build }

Invoke-Step "Uploading build to $Server`:$target" {
    ssh @sshOpts $Server "mkdir -p '$target'"
    scp @sshOpts -r -q dist/* "${Server}:$target/"
}

Invoke-Step 'Switching to the new release' {
    ssh @sshOpts $Server @"
set -e
ln -sfn '$target' '$root/current.tmp' && mv -Tf '$root/current.tmp' '$root/current'
cd '$root/releases' && ls -1dt */ | tail -n +6 | xargs -r rm -rf
"@
}

Write-Host "==> Done: https://$Domain"
