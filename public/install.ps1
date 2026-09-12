# Resursee Desktop Installer for Windows
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "==> Downloading Resursee for Windows (x64)..." -ForegroundColor Cyan
$tempDir = [System.IO.Path]::GetTempPath()
$installerPath = Join-Path $tempDir "Resursee_Setup_x64.exe"

# Query GitHub API for latest release assets
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/JohnDivina/Resursee/releases/latest" -Headers @{ "User-Agent" = "Resursee-Installer" }
    $asset = $release.assets | Where-Object { $_.name -like "*x64*.exe" -or $_.name -like "*.msi" -or $_.name -like "*setup*.exe" } | Select-Object -First 1

    if ($asset) {
        Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $installerPath -UseBasicParsing
    } else {
        # Fallback direct tag link
        $fallbackUrl = "https://github.com/JohnDivina/Resursee/releases/download/v0.1.0/Resursee_0.1.0_x64-setup.exe"
        Invoke-WebRequest -Uri $fallbackUrl -OutFile $installerPath -UseBasicParsing
    }
} catch {
    Write-Warning "Could not automatically download Windows asset. Opening release page..."
    Start-Process "https://github.com/JohnDivina/Resursee/releases/latest"
    exit 0
}

if (Test-Path $installerPath) {
    Write-Host "==> Installing Resursee..." -ForegroundColor Cyan
    Start-Process -FilePath $installerPath -Wait
    Write-Host "==> Resursee installed successfully!" -ForegroundColor Green
} else {
    Write-Host "==> Opening Resursee GitHub Releases page to download .exe manually..." -ForegroundColor Cyan
    Start-Process "https://github.com/JohnDivina/Resursee/releases/latest"
}
