# Export mails from Outlook
# Outputs a plain JSON array (not wrapped), one object per mail, using
# the exact field names outlook_bridge_v3.py's Mail dataclass expects:
# subject, from_address, to, received_date, body, html_body, attachments.
param([string]$InitialSync = "false")

# Force UTF-8 on the output stream - without this, Write-Host encodes
# using the console's codepage (cp1252 on this machine), which mangles
# every accented character (e/e/e...) into replacement chars before
# Python even sees the bytes.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

try {
    $Outlook = New-Object -ComObject Outlook.Application
    $Namespace = $Outlook.GetNamespace("MAPI")
    $Inbox = $Namespace.GetDefaultFolder(6)   # olFolderInbox
    $Sent = $Namespace.GetDefaultFolder(5)    # olFolderSentMail

    # Full HTML bodies for a whole week of mail can take Outlook's COM API
    # longer to walk than the bridge's subprocess timeout allows, which
    # silently dropped every sync ("0 mails" with no error). 2 days is
    # enough to survive a weekend/short outage while staying fast; use a
    # longer window only for a genuine first-time sync.
    if ($InitialSync -eq "true") {
        $StartDate = (Get-Date).AddDays(-7)
    } else {
        $StartDate = (Get-Date).AddDays(-2)
    }

    $Mails = @()
    $FilterDate = $StartDate.ToString("MM/dd/yyyy HH:mm")

    # Restrict() filters at the folder level instead of walking every item
    # in the mailbox and checking dates after the fact - same fix as
    # export_calendar.ps1, keeps this fast as the mailbox grows.
    foreach ($FolderInfo in @(
        @{ Folder = $Inbox; DateField = "ReceivedTime" },
        @{ Folder = $Sent; DateField = "SentOn" }
    )) {
        $Filter = "[$($FolderInfo.DateField)] >= '$FilterDate'"
        $RestrictedItems = $FolderInfo.Folder.Items.Restrict($Filter)

        foreach ($Item in $RestrictedItems) {
            try {
                $ReceivedOrSent = if ($Item.PSObject.Properties.Match('ReceivedTime').Count -gt 0 -and $Item.ReceivedTime) { $Item.ReceivedTime } else { $Item.SentOn }
                $Attachments = @()
                foreach ($Att in $Item.Attachments) {
                    $Attachments += @{ name = [string]$Att.FileName }
                }

                $FromAddress = try { [string]$Item.SenderEmailAddress } catch { [string]$Item.SenderName }
                $ToAddress = try { [string]$Item.To } catch { "" }

                $Mail = @{
                    subject       = [string]$Item.Subject
                    from_address  = $FromAddress
                    to            = $ToAddress
                    received_date = $ReceivedOrSent.ToString("yyyy-MM-dd HH:mm:ss")
                    body          = [string]$Item.Body
                    html_body     = [string]$Item.HTMLBody
                    attachments   = $Attachments
                }
                $Mails += $Mail
            } catch {
                # Skip items that error out (e.g. non-mail items in the folder)
            }
        }
    }

    # ConvertTo-Json on a single-item array collapses it to a bare object
    # instead of a one-element array (a well-known PS 5.1 quirk, and
    # -AsArray isn't available on Windows PowerShell 5.1) - wrap it back
    # into brackets explicitly so json.loads() on the Python side always
    # gets a list, even for exactly one mail.
    if ($Mails.Count -eq 0) {
        Write-Host "[]"
    } elseif ($Mails.Count -eq 1) {
        Write-Host "[$($Mails | ConvertTo-Json -Depth 10)]"
    } else {
        Write-Host ($Mails | ConvertTo-Json -Depth 10)
    }
} catch {
    Write-Host "[]"
    [Console]::Error.WriteLine("export_mails.ps1 error: $($_.Exception.Message)")
}
