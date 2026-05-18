param(
    [string]$Pptx = "C:\Users\chris\Github\powershell\deck\PowerShell-x-AI-Harness-CLIs.pptx",
    [string]$OutDir = "C:\Users\chris\Github\powershell\deck\slides"
)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$ppt = New-Object -ComObject PowerPoint.Application
$pres = $ppt.Presentations.Open($Pptx, $true, $false, $false)

# Export each slide as PNG at 1920 wide
for ($i = 1; $i -le $pres.Slides.Count; $i++) {
    $num = "{0:D2}" -f $i
    $out = Join-Path $OutDir "slide-$num.png"
    $pres.Slides.Item($i).Export($out, "PNG", 1920, 1080)
    Write-Host "Exported slide $num"
}

$pres.Close()
$ppt.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($pres) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null
[GC]::Collect()
