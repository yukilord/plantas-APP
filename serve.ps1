$ErrorActionPreference = "Stop"

$root = [System.IO.Path]::GetFullPath($PSScriptRoot).TrimEnd("\")
$prefix = "http://127.0.0.1:8000/"
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

$contentTypes = @{
    ".css"  = "text/css; charset=utf-8"
    ".html" = "text/html; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
}

try {
    $listener.Start()
    Write-Host "Herbanário disponível em $prefix"
    Write-Host "Prima Ctrl+C para parar o servidor."
    Start-Process $prefix

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response

        try {
            $relativePath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
            if ([string]::IsNullOrWhiteSpace($relativePath)) {
                $relativePath = "index.html"
            }

            $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
            $insideRoot = $filePath.StartsWith("$root\", [System.StringComparison]::OrdinalIgnoreCase)

            if (-not $insideRoot -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
                $response.StatusCode = 404
            }
            else {
                $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
                if ($contentTypes.ContainsKey($extension)) {
                    $response.ContentType = $contentTypes[$extension]
                }

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        catch {
            Write-Warning "Erro ao servir o pedido: $_"
            $response.StatusCode = 500
        }
        finally {
            $response.Close()
        }
    }
}
finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
    $listener.Close()
}
