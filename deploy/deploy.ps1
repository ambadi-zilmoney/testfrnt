# Build the React app and publish it to S3 + CloudFront (PowerShell version of deploy.sh).
#
# Usage:
#   .\deploy\deploy.ps1 -StackName example-frontend
#   .\deploy\deploy.ps1 -Bucket <bucket> -DistributionId <id>
param(
    [string]$StackName,
    [string]$Bucket,
    [string]$DistributionId
)

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

function Invoke-Step([string]$Message, [scriptblock]$Command) {
    Write-Host "==> $Message"
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "Step failed: $Message" }
}

function Get-StackOutput([string]$Key) {
    aws cloudformation describe-stacks --region us-east-1 --stack-name $StackName `
        --query "Stacks[0].Outputs[?OutputKey=='$Key'].OutputValue" --output text
}

if ($StackName) {
    if (-not $Bucket) { $Bucket = Get-StackOutput 'BucketName' }
    if (-not $DistributionId) { $DistributionId = Get-StackOutput 'DistributionId' }
}
if (-not $Bucket) { throw 'Pass -StackName, or -Bucket (and -DistributionId)' }

Invoke-Step 'Installing dependencies' { npm ci --no-audit --no-fund }
Invoke-Step 'Building (mode: production)' { npm run build }

# No --delete: users on the previous index.html keep loading its (hashed) assets.
Invoke-Step 'Uploading fingerprinted assets (cached for 1 year)' {
    aws s3 sync dist/ "s3://$Bucket/" --exclude 'index.html' `
        --cache-control 'public, max-age=31536000, immutable'
}

# Uploaded last, so it never points at assets that don't exist yet.
Invoke-Step 'Uploading index.html (never cached)' {
    aws s3 cp dist/index.html "s3://$Bucket/index.html" `
        --cache-control 'no-cache, no-store, must-revalidate' `
        --content-type 'text/html; charset=utf-8'
}

if ($DistributionId) {
    Invoke-Step 'Invalidating CloudFront cache for index.html' {
        aws cloudfront create-invalidation --distribution-id $DistributionId --paths '/index.html' '/' | Out-Null
    }
}

Write-Host '==> Done'
