# ============================================
# export_mails.ps1: Exporte les mails Outlook
# ============================================

param(
    [int]$DaysBack = 7  # Exporter les mails des 7 derniers jours
)

try {
    # Créer l'objet Outlook
    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")

    # Récupérer les dossiers Inbox et Sent Items
    $inbox = $namespace.GetDefaultFolder(6)  # 6 = olFolderInbox
    $sent = $namespace.GetDefaultFolder(5)   # 5 = olFolderSentMail

    $mails = @()
    $cutoffDate = (Get-Date).AddDays(-$DaysBack)

    # ============================================
    # Exporter les mails reçus
    # ============================================

    foreach ($item in $inbox.Items) {
        if ($item.ReceivedTime -gt $cutoffDate) {
            $mail = @{
                subject = $item.Subject
                from_address = $item.SenderEmailAddress
                to = $item.To
                received_date = $item.ReceivedTime.ToString("o")
                body = $item.Body
                html_body = if ($item.HTMLBody) { $item.HTMLBody } else { $null }
                attachments = @()
            }

            # Récupérer les attachements
            foreach ($attachment in $item.Attachments) {
                $mail.attachments += @{
                    name = $attachment.FileName
                    size = $attachment.Size
                    mimeType = "application/octet-stream"
                }
            }

            $mails += $mail
        }
    }

    # ============================================
    # Exporter les mails envoyés
    # ============================================

    foreach ($item in $sent.Items) {
        if ($item.SentOn -gt $cutoffDate) {
            $mail = @{
                subject = $item.Subject
                from_address = $namespace.CurrentUser.EmailAddress
                to = $item.To
                received_date = $item.SentOn.ToString("o")
                body = $item.Body
                html_body = if ($item.HTMLBody) { $item.HTMLBody } else { $null }
                attachments = @()
            }

            # Récupérer les attachements
            foreach ($attachment in $item.Attachments) {
                $mail.attachments += @{
                    name = $attachment.FileName
                    size = $attachment.Size
                    mimeType = "application/octet-stream"
                }
            }

            $mails += $mail
        }
    }

    # Retourner le JSON
    $mails | ConvertTo-Json -Depth 5

} catch {
    Write-Error "Error exporting mails: $_"
    exit 1
}
