# Export mails from Outlook (including 3-month history on first sync)

param([string]$InitialSync = "false")

try {
    $Outlook = New-Object -ComObject Outlook.Application
    $Namespace = $Outlook.GetNamespace("MAPI")
    $MailFolder = $Namespace.GetDefaultFolder(6)  # 6 = Inbox

    if ($InitialSync -eq "true") {
        $StartDate = (Get-Date).AddMonths(-3)
        Write-Host "📧 Initial sync: 3 months history"
    } else {
        $StartDate = (Get-Date).AddHours(-1)
        Write-Host "📧 Normal sync: last hour"
    }

    $Mails = @()
    foreach ($Item in $MailFolder.Items) {
        if ($Item.ReceivedTime -ge $StartDate) {
            $Mail = @{
                subject = $Item.Subject
                from = $Item.SenderName
                to = $Item.To
                date = $Item.ReceivedTime.ToString("yyyy-MM-dd HH:mm:ss")
            }
            $Mails += $Mail
        }
    }

    $Result = @{
        status = "ok"
        count = $Mails.Count
        mails = $Mails
    } | ConvertTo-Json -Depth 10

    Write-Host $Result
} catch {
    Write-Host (ConvertTo-Json @{status = "error"; message = $_.Exception.Message})
}
