$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
try {
    $listener.Start()
    Write-Host "Listening on port 8080..."
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $url = $request.RawUrl.Split('?')[0]
        $path = Join-Path "C:\AntiGravity\Participating" $url.TrimStart('/')
        if (Test-Path $path -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($path)
            $response.ContentType = if ($path.EndsWith(".pdf")) { "application/pdf" } else { "text/html" }
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Close()
}
