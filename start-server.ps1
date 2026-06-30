$httpListener = New-Object System.Net.HttpListener
$httpListener.Prefixes.Add("http://localhost:8000/")
$httpListener.Start()
Write-Host "Local Host Server Started at http://localhost:8000/"
Write-Host "Press Ctrl+C to stop the server."

$rootDir = "C:\Users\sujee\.gemini\antigravity\scratch\wedding-invite"

try {
    while ($httpListener.IsListening) {
        $context = $httpListener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Map root path to index.html
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        # Clean path and join with root directory
        $cleanPath = $urlPath.Replace("/", "\").TrimStart('\')
        $filePath = [System.IO.Path]::Combine($rootDir, $cleanPath)
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            
            # Identify MIME types
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".gif"  { "image/gif" }
                ".svg"  { "image/svg+xml" }
                default { "application/octet-stream" }
            }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} finally {
    $httpListener.Stop()
}
