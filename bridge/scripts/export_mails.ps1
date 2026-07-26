# Export mails from Outlook - IMPROVED VERSION
param([string]$InitialSync = "false")

try {
    $Outlook = New-Object -ComObject Outlook.Application
    $Namespace = $Outlook.GetNamespace("MAPI")
    $MailFolder = $Namespace.GetDefaultFolder(6)  # 6 = Inbox
    
    if ($InitialSync -eq "true") {
        $StartDate = (Get-Date).AddMonths(-3)
    } else {
        $StartDate = (Get-Date).AddHours(-1)
    }
    
    $Mails = @()
    $ItemCount = 0
    
    foreach ($Item in $MailFolder.Items) {
        $ItemCount++
        try {
            if ($Item.ReceivedTime -ge $StartDate) {
                $Mail = @{
                    subject = [string]$Item.Subject
                    from = [string]$Item.SenderName
                    date = $Item.ReceivedTime.ToString("yyyy-MM-dd HH:mm:ss")
                }
                $Mails += $Mail
            }
        } catch {
            # Skip items with errors
        }
    }
    
    $Result = @{
        status = "ok"
        count = $Mails.Count
        total_items = $ItemCount
        mails = $Mails
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
