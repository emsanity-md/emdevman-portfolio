<#
.SYNOPSIS
  Renders public/assets/images/og.png - the share card.

.DESCRIPTION
  A hand-made image would drift from the design the moment a token changed, and
  the tokens are the design here: v3 is a monochrome ink page, so the card is
  built from the same ramp globals.css declares for it rather than from colours
  picked in an image editor. The values below are `html[data-design="v3"].dark`
  (globals.css): --background #0c0c0f, --foreground #f4f4f5,
  --muted-foreground #a0a0a8, --faint #8a8a92, --border #2a2a30.

      pwsh -File scripts/generate-og-image.ps1

  Drawn with GDI+ rather than SVG, and that is not a preference. The obvious
  route is an SVG through sharp, but resvg - the rasteriser inside sharp - does
  not honour `@font-face` at all: an embedded face renders pixel-identical to a
  deliberately bogus family name, so the name on the card comes out in whatever
  serif fontdb falls back to and nothing in the output says so. It is also
  WOFF2-blind, which rules out the pixel face regardless.

  Two things follow, and both are constraints rather than choices:

  - The labels are set in Geist Mono, not the pixel face. `geist` ships v3's
    display font as woff2 only, so the mono is the micro-label register the
    design uses everywhere else.
  - The script is Windows-only, because a PrivateFontCollection is how a font
    gets into GDI+ without being installed.

  The fonts come from node_modules, which is where next keeps them.
#>

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$fonts = Join-Path $root "node_modules/geist/dist/fonts"
$outFile = Join-Path $root "public/assets/images/og.png"

# v3 dark, from globals.css. Named as in the stylesheet so a token change here is
# a token change there.
$INK = [System.Drawing.ColorTranslator]::FromHtml("#0c0c0f")   # --background
$PAPER = [System.Drawing.ColorTranslator]::FromHtml("#f4f4f5") # --foreground
$MUTED = [System.Drawing.ColorTranslator]::FromHtml("#a0a0a8") # --muted-foreground
$FAINT = [System.Drawing.ColorTranslator]::FromHtml("#8a8a92") # --faint
$HAIRLINE = [System.Drawing.ColorTranslator]::FromHtml("#2a2a30") # --border

# 1200x630 is the size every platform expects and 1.91:1 the ratio they crop to.
# The card this replaced was the avatar: 1024x1040, transparent and square, so
# each preview took half of it and kept a face on an empty background.
$WIDTH = 1200
$HEIGHT = 630

$collection = New-Object System.Drawing.Text.PrivateFontCollection
$collection.AddFontFile((Join-Path $fonts "geist-sans/Geist-Bold.ttf"))
$collection.AddFontFile((Join-Path $fonts "geist-mono/GeistMono-Medium.ttf"))
$collection.AddFontFile((Join-Path $fonts "geist-mono/GeistMono-Bold.ttf"))

# The family each file declares in its own name table, which is not always the
# name it is filed under: GeistMono-Bold calls itself "Geist Mono", and
# GeistMono-Medium calls itself "Geist Mono Medium" - the missing e is the
# font's, not a typo here.
#
# The FontFamily object is handed to Font, never its name. Built from a name,
# every one of these silently became Microsoft Sans Serif: the name goes through
# GDI's font mapper, which cannot see a private collection, and nothing in the
# output says so - the card just comes out in the wrong typeface.
$family = {
  param($Name)
  $match = $collection.Families | Where-Object { $_.Name -eq $Name } | Select-Object -First 1
  if (-not $match) { throw "no font family named '$Name' in the collection" }
  $match
}

$sans = & $family "Geist"
$mono = & $family "Geist Mono Medium"
$monoBold = & $family "Geist Mono"

$bitmap = New-Object System.Drawing.Bitmap($WIDTH, $HEIGHT, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear($INK)

function New-Brush($color) {
  New-Object System.Drawing.SolidBrush($color)
}

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $path
}

# GDI+ positions a string by its box, not its baseline, and every y in the
# design is a baseline. Dropping the line height lands close enough to tune by
# eye, which is what the card was drawn with.
function Draw-Text($text, $fontFamily, [float]$size, $color, [float]$x, [float]$baseline) {
  $font = New-Object System.Drawing.Font($fontFamily, $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $y = $baseline - $font.GetHeight($graphics)
  $graphics.DrawString($text, $font, (New-Brush $color), $x, $y, [System.Drawing.StringFormat]::GenericTypographic)
  $font.Dispose()
}

# Micro-labels are 9-11px mono, uppercase, 0.1em tracked - the signature
# register, and what every section marker on the site is set in. The sizes are
# scaled up for a card read at a third of a phone's width.
#
# GDI+ has no letter-spacing, so a label is drawn one glyph at a time and
# stepped by a measured advance. Measuring each glyph instead would be wrong
# twice over: GenericTypographic is the only format that reports a glyph
# unpadded, and it reports a space as zero wide, so a per-glyph loop closes up
# every word gap. One advance is exact here because the face is monospaced.
# Drawing glyph by glyph also drops kerning, which even tracking wants anyway.
function Draw-Tracked($text, $fontFamily, [float]$size, $color, [float]$x, [float]$baseline, [float]$tracking) {
  $font = New-Object System.Drawing.Font($fontFamily, $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = New-Brush $color
  $format = [System.Drawing.StringFormat]::GenericTypographic
  $y = $baseline - $font.GetHeight($graphics)
  $step = $graphics.MeasureString("0", $font, 1000, $format).Width + $tracking
  $cursor = $x
  foreach ($char in $text.ToCharArray()) {
    $graphics.DrawString($char, $font, $brush, $cursor, $y, $format)
    $cursor += $step
  }
  $brush.Dispose()
  $font.Dispose()
}

# The monogram, the way the top bar inverts it: paper chip, ink label.
$chip = New-RoundedPath 88 72 76 76 14
$graphics.FillPath((New-Brush $PAPER), $chip)
$chip.Dispose()

# ESB, centred in the chip.
$esb = New-Object System.Drawing.Font($monoBold, 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$esbSize = $graphics.MeasureString("ESB", $esb, 1000, [System.Drawing.StringFormat]::GenericTypographic)
$graphics.DrawString(
  "ESB",
  $esb,
  (New-Brush $INK),
  (88 + (76 - $esbSize.Width) / 2),
  (72 + (76 - $esbSize.Height) / 2),
  [System.Drawing.StringFormat]::GenericTypographic
)
$esb.Dispose()

Draw-Tracked "FULL-STACK DEVELOPER" $mono 23 $FAINT 188 122 2

$pen = New-Object System.Drawing.Pen($HAIRLINE, 1)
$graphics.DrawLine($pen, 88, 204, 640, 204)

Draw-Text "Emmanuel" $sans 104 $PAPER 86 330
Draw-Text "Bitancor" $sans 104 $PAPER 86 428

Draw-Tracked "SELECTED WORK, BUILT TO BE ACCESSIBLE" $mono 21 $MUTED 88 500 2
Draw-Tracked "emmanuelbitancor.vercel.app" $mono 20 $FAINT 88 580 2

# The portrait, full height and running 130px off the right edge, so the figure
# owns the right of the card and the type column keeps a clear 560px.
$portrait = [System.Drawing.Image]::FromFile((Join-Path $root "public/assets/images/profile3.png"))
$scale = $HEIGHT / $portrait.Height
$portraitWidth = [int]($portrait.Width * $scale)
$graphics.DrawImage($portrait, (New-Object System.Drawing.Rectangle(($WIDTH - $portraitWidth + 130), 0, $portraitWidth, $HEIGHT)))
$portrait.Dispose()

$bitmap.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

$kb = [math]::Round((Get-Item $outFile).Length / 1KB)
Write-Output "og.png  ${WIDTH}x${HEIGHT}  $kb KB"
