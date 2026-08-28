# ── Test: Restart Safety (Scenario B - Redis wipe + reconciliation) ──

Write-Host "`n=== STEP 1: Schedule a test email 90s out ===" -ForegroundColor Cyan
$scheduledTime = (Get-Date).ToUniversalTime().AddSeconds(90).ToString("yyyy-MM-ddTHH:mm:ssZ")
$body = @{
    to = "restart-test@example.com"
    subject = "Restart Safety Test"
    body = "If this sends, reconciliation worked."
    senderId = "92697b11-dd8b-408c-8c5b-d128bf6d5a87"
    scheduledAt = $scheduledTime
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:4000/api/emails/schedule" -Method Post -ContentType "application/json" -Body $body
$emailId = $response.email.id
Write-Host "Scheduled email id: $emailId for $scheduledTime"

Write-Host "`n=== STEP 2: Confirm it's SCHEDULED ===" -ForegroundColor Cyan
$check1 = Invoke-RestMethod -Uri "http://localhost:4000/api/emails/scheduled" -Method Get
$found1 = $check1.emails | Where-Object { $_.id -eq $emailId }
if ($found1) {
    Write-Host "PASS: email is SCHEDULED in DB" -ForegroundColor Green
} else {
    Write-Host "FAIL: email not found in /scheduled" -ForegroundColor Red
    exit
}

Write-Host "`n=== STEP 3: Wipe Redis entirely (simulate queue loss) ===" -ForegroundColor Cyan
docker exec reachinbox-redis redis-cli FLUSHALL
Write-Host "Redis flushed. The job that was in Redis for $emailId is now gone."

Write-Host "`n=== STEP 4: Restart the API server manually now ===" -ForegroundColor Yellow
Write-Host "Go to your server terminal, Ctrl+C it, then run: npx ts-node src/server.ts"
Write-Host "Watch for '[reconciler] re-enqueued orphaned email $emailId'"
Read-Host "Press Enter here once the server has restarted and reconciliation log appeared"

Write-Host "`n=== STEP 5: Waiting up to 90s for the worker to send it ===" -ForegroundColor Cyan
$maxWait = 90
$elapsed = 0
$sent = $false
while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 5
    $elapsed += 5
    $sentCheck = Invoke-RestMethod -Uri "http://localhost:4000/api/emails/sent" -Method Get
    $foundSent = $sentCheck.emails | Where-Object { $_.id -eq $emailId }
    if ($foundSent) {
        $sent = $true
        break
    }
    Write-Host "...still waiting ($elapsed s elapsed)"
}

Write-Host "`n=== RESULT ===" -ForegroundColor Cyan
if ($sent) {
    Write-Host "PASS: email $emailId survived a full Redis wipe and was sent after reconciliation." -ForegroundColor Green
} else {
    Write-Host "FAIL: email $emailId never made it to SENT within ${maxWait}s." -ForegroundColor Red
}