# ============================================
# export_calendar.ps1: Exporte les événements Outlook
# ============================================

try {
    # Créer l'objet Outlook
    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")

    # Récupérer le calendrier par défaut
    $calendar = $namespace.GetDefaultFolder(9)  # 9 = olFolderCalendar

    $events = @()

    # Filtre : événements entre -60 et +90 jours
    $startDate = (Get-Date).AddDays(-60)
    $endDate = (Get-Date).AddDays(90)

    # Récupérer tous les événements
    foreach ($item in $calendar.Items) {
        if ($item.Start -ge $startDate -and $item.Start -le $endDate) {
            # Mapper le statut de réponse
            $responseStatus = switch ($item.ResponseStatus) {
                1 { "not_responded" }    # olResponseNotReceived
                2 { "accepted" }         # olResponseAccepted
                3 { "declined" }         # olResponseDeclined
                4 { "tentative" }        # olResponseTentativelyAccepted
                default { "not_responded" }
            }

            # Récupérer les attendees requis
            $requiredAttendees = @()
            foreach ($recipient in $item.Recipients) {
                if ($recipient.Type -eq 1) {  # 1 = olTo (required)
                    $requiredAttendees += $recipient.Address
                }
            }

            $event = @{
                subject = $item.Subject
                start = $item.Start.ToString("o")
                end = $item.End.ToString("o")
                organizer = $item.Organizer
                required_attendees = $requiredAttendees
                outlook_entry_id = $item.EntryID
                response_status = $responseStatus
            }

            $events += $event
        }
    }

    # Retourner le JSON
    $events | ConvertTo-Json -Depth 5

} catch {
    Write-Error "Error exporting calendar: $_"
    exit 1
}
