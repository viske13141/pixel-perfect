param(
  [Parameter(Mandatory = $true)]
  [string]$ManifestPath
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$entries = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
$expectedFrames = @(88..120)
$actualFrames = @($entries | ForEach-Object { [int]$_.frame } | Sort-Object)
if (($actualFrames -join ',') -ne ($expectedFrames -join ',')) {
  throw 'Manifest must contain exactly one generated image for each frame from 88 to 120.'
}
foreach ($entry in $entries) {
  if (-not (Test-Path -LiteralPath $entry.source)) {
    throw ('Generated image missing for frame {0}: {1}' -f $entry.frame, $entry.source)
  }
}

$backupDirectory = Join-Path $projectRoot 'backups/frames-original-label'
New-Item -ItemType Directory -Path $backupDirectory -Force | Out-Null
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }
$encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]95
)
try {
  foreach ($entry in ($entries | Sort-Object frame)) {
    $fileName = 'f{0:D3}.jpg' -f [int]$entry.frame
    $destination = Join-Path $projectRoot ('public/frames/' + $fileName)
    $backup = Join-Path $backupDirectory $fileName
    if (-not (Test-Path -LiteralPath $backup)) {
      Copy-Item -LiteralPath $destination -Destination $backup
    }
    $image = [System.Drawing.Image]::FromFile($entry.source)
    $bitmap = New-Object System.Drawing.Bitmap(1280, 720)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.DrawImage($image, 0, 0, 1280, 720)
      $bitmap.Save($destination, $jpegCodec, $encoderParameters)
    }
    finally {
      $graphics.Dispose()
      $bitmap.Dispose()
      $image.Dispose()
    }
    Write-Output ('Updated ' + $fileName)
  }
}
finally {
  $encoderParameters.Dispose()
}
