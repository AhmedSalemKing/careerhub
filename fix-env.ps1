taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2

Set-Location D:\careerhub\apps\api
npx tsc src/main.ts --outDir dist --module commonjs --target ES2021 --experimentalDecorators --emitDecoratorMetadata --esModuleInterop --skipLibCheck

Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location D:\careerhub\apps\api; node dist/main.js"
Start-Sleep -Seconds 4

Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location D:\careerhub\apps\web; npm run dev -- -p 3000"
Start-Sleep -Seconds 3

Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location D:\careerhub\apps\learn; npm run dev -- -p 3002"
Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit","-Command","Set-Location D:\careerhub; node proxy-server.js"
Start-Sleep -Seconds 3

Start-Process powershell -ArgumentList "-NoExit","-Command","& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel --url http://localhost:8080 --no-autoupdate"

Write-Host ""
Write-Host "DeveWay is RUNNING" -ForegroundColor Green
Write-Host "  Main:  http://localhost:3000" -ForegroundColor Gray
Write-Host "  Learn: http://localhost:3002" -ForegroundColor Gray
Write-Host "  API:   http://localhost:3001" -ForegroundColor Gray
Write-Host "  Proxy: http://localhost:8080" -ForegroundColor Gray
Write-Host ""
Write-Host "CLIENT URL: Check the Cloudflare window" -ForegroundColor Yellow
Write-Host "Copy the .trycloudflare.com link" -ForegroundColor Yellow
Write-Host ""
Write-Host "DONE" -ForegroundColor Green