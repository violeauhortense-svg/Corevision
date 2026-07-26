# ============================================
# respond_meeting.ps1: Répond à une réunion
# ============================================

param(
    [string]$entry_id,      # EntryID Outlook de la réunion
    [string]$response       # 'accept', 'decline', 'tentative'
)

try {
    # Créer l'objet Outlook
    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")

    # Récupérer l'objet réunion par EntryID
    $item = $namespace.GetItemFromID($entry_id)

    if ($item -eq $null) {
        Write-Error "Meeting not found with EntryID: $entry_id"
        exit 1
    }

    # Mapper la réponse à l'énumération Outlook
    $responseEnum = switch ($response) {
        "accept" { 2 }      # olMeetingAccepted
        "decline" { 3 }     # olMeetingDeclined
        "tentative" { 4 }   # olMeetingTentativelyAccepted
        default { 1 }       # olMeetingNotResponded
    }

    # Répondre à la réunion
    $item.Respond($responseEnum, $true)

    Write-Host "Meeting response sent: $response"
    exit 0

} catch {
    Write-Error "Error responding to meeting: $_"
    exit 1
}
