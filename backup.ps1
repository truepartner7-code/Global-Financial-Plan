# ============================================================
# 보험 시뮬레이터 버전 백업 스크립트
# 사용법: .\backup.ps1 [-Message "수정 내용 메모"]
# ============================================================

param(
    [string]$Message = ""
)

$ProjectRoot = "C:\AntiGravity\Participating"
$BackupRoot  = "$ProjectRoot\_backups"
$Timestamp   = Get-Date -Format "yyyyMMdd_HHmmss"
$DateLabel   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 백업 대상 파일 (핵심 소스파일만)
$FilesToBackup = @(
    "index.html",
    "script.js",
    "styles.css",
    "simple_server.ps1"
)

# 백업 폴더 생성
$BackupDir = "$BackupRoot\$Timestamp"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

# 파일 복사
$CopiedFiles = @()
foreach ($file in $FilesToBackup) {
    $src = "$ProjectRoot\$file"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination "$BackupDir\$file" -Force
        $CopiedFiles += $file
        Write-Host "  OK $file" -ForegroundColor Green
    } else {
        Write-Host "  SKIP $file (없음)" -ForegroundColor Yellow
    }
}

# 메모 텍스트 결정
$MemoText = $Message
if (-not $MemoText) { $MemoText = "(메모 없음)" }

# 메타데이터 저장
$MetaObj = [PSCustomObject]@{
    timestamp = $DateLabel
    message   = $MemoText
    files     = $CopiedFiles
}
$MetaObj | ConvertTo-Json -Depth 3 | Out-File -FilePath "$BackupDir\backup_info.json" -Encoding utf8

# changelog.md 업데이트
$ChangelogPath = "$BackupRoot\changelog.md"
if (-not (Test-Path $ChangelogPath)) {
    "# BACKUP HISTORY`n" | Out-File -FilePath $ChangelogPath -Encoding utf8
}

$FileList = $CopiedFiles -join ", "
$Entry = "## $Timestamp  ---  $DateLabel`n메모: $MemoText`n파일: $FileList`n`n---`n`n"

$Existing = ""
if (Test-Path $ChangelogPath) {
    $Existing = Get-Content $ChangelogPath -Raw -Encoding utf8
    $Existing = $Existing -replace "^# BACKUP HISTORY\r?\n+", ""
}
$NewContent = "# BACKUP HISTORY`n`n$Entry$Existing"
$NewContent | Out-File -FilePath $ChangelogPath -Encoding utf8 -NoNewline

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  BACKUP COMPLETE!" -ForegroundColor Cyan
Write-Host "  Location: _backups\$Timestamp" -ForegroundColor Cyan
Write-Host "  Time: $DateLabel" -ForegroundColor Cyan
if ($Message) {
    Write-Host "  Note: $Message" -ForegroundColor Cyan
}
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
