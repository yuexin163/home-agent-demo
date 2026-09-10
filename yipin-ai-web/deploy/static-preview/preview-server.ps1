$ErrorActionPreference = "Stop"
$root = (Resolve-Path $PSScriptRoot).Path
$url = "http://127.0.0.1:4173/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)
$listener.Start()
Start-Process $url

Write-Host "Yipin Smart Home preview is running: $url"
Write-Host "Keep this window open while previewing the website."

function Get-ContentType([string]$extension) {
  switch ($extension.ToLowerInvariant()) {
    ".css"  { return "text/css; charset=utf-8" }
    ".gif"  { return "image/gif" }
    ".html" { return "text/html; charset=utf-8" }
    ".ico"  { return "image/x-icon" }
    ".jpeg" { return "image/jpeg" }
    ".jpg"  { return "image/jpeg" }
    ".js"   { return "text/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".pdf"  { return "application/pdf" }
    ".png"  { return "image/png" }
    ".svg"  { return "image/svg+xml" }
    ".txt"  { return "text/plain; charset=utf-8" }
    ".webp" { return "image/webp" }
    ".woff" { return "font/woff" }
    ".woff2" { return "font/woff2" }
    default  { return "application/octet-stream" }
  }
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($requestPath)) { $requestPath = "index.html" }
      $candidate = Join-Path $root $requestPath.Replace('/', [IO.Path]::DirectorySeparatorChar)
      if (Test-Path -LiteralPath $candidate -PathType Container) { $candidate = Join-Path $candidate "index.html" }
      $filePath = [IO.Path]::GetFullPath($candidate)

      if (-not $filePath.StartsWith($root) -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        $context.Response.StatusCode = 404
        $message = [Text.Encoding]::UTF8.GetBytes("Not Found")
        $context.Response.OutputStream.Write($message, 0, $message.Length)
      } else {
        $bytes = [IO.File]::ReadAllBytes($filePath)
        $context.Response.StatusCode = 200
        $context.Response.ContentType = Get-ContentType ([IO.Path]::GetExtension($filePath))
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } finally {
      $context.Response.OutputStream.Close()
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
