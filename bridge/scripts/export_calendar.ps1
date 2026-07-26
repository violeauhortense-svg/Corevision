# Export calendar from Outlook - IMPROVED VERSION
param([string]$InitialSync = "false")

try {
    $Outlook = New-Object -ComObject Outlook.Application
    $Namespace = $Outlook.GetNamespace("MAPI")
    $CalendarFolder = $Namespace.GetDefaultFolder(9)  # 9 = Calendar
    
    if ($InitialSync -eq "true") {
        $StartDate = (Get-Date).AddMonths(-3)
        $EndDate = (Get-Date).AddMonths(1)
    } else {
        $StartDate = (Get-Date).AddHours(-1)
        $EndDate = (Get-Date).AddDays(7)
    }
    
    $Events = @()
    $ItemCount = 0
    
    foreach ($Item in $CalendarFolder.Items) {
        $ItemCount++
        try {
            if ($Item.Start -ge $StartDate -and $Item.Start -le $EndDate) {
                $Event = @{
                    subject = [string]$Item.Subject
                    start = $Item.Start.ToString("yyyy-MM-dd HH:mm:ss")
                    end = $Item.End.ToString("yyyy-MM-dd HH:mm:ss")
                    location = [string]$Item.Location
                }
                $Events += $Event
            }
        } catch {
            # Skip items with errors
        }
    }
    
    $Result = @{
        status = "ok"
        count = $Events.Count
        total_items = $ItemCount
        events = $Events
    } | ConvertTo-Json -Depth 10
    
    Write-Host $Result
} catch {
    $ErrorMsg = @{
        status = "error"
        message = $_.Exception.Message
        line = $_.InvocationInfo.ScriptLineNumber
    } | ConvertTo-Json -Depth 10
    Write-Host $ErrorMsg
}
