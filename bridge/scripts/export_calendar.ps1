# Export calendar events from Outlook (including 3-month history on first sync)

param([string]$InitialSync = "false")

try {
    $Outlook = New-Object -ComObject Outlook.Application
    $Namespace = $Outlook.GetNamespace("MAPI")
    $CalendarFolder = $Namespace.GetDefaultFolder(9)  # 9 = Calendar

    if ($InitialSync -eq "true") {
        $StartDate = (Get-Date).AddMonths(-3)
        $EndDate = (Get-Date).AddMonths(1)
        Write-Host "📅 Initial sync: 3 months history + 1 month future"
    } else {
        $StartDate = (Get-Date).AddHours(-1)
        $EndDate = (Get-Date).AddDays(7)
        Write-Host "📅 Normal sync: last hour + next 7 days"
    }

    $Events = @()
    foreach ($Item in $CalendarFolder.Items) {
        if ($Item.Start -ge $StartDate -and $Item.Start -le $EndDate) {
            $Event = @{
                subject = $Item.Subject
                start = $Item.Start.ToString("yyyy-MM-dd HH:mm:ss")
                end = $Item.End.ToString("yyyy-MM-dd HH:mm:ss")
                location = $Item.Location
                attendees = @($Item.Recipients | ForEach-Object { $_.Name })
            }
            $Events += $Event
        }
    }

    $Result = @{
        status = "ok"
        count = $Events.Count
        events = $Events
    } | ConvertTo-Json -Depth 10

    Write-Host $Result
} catch {
    Write-Host (ConvertTo-Json @{status = "error"; message = $_.Exception.Message})
}
