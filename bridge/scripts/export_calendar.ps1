# Export calendar from Outlook
# Outputs a plain JSON array (not wrapped), using the exact field names
# outlook_bridge_v3.py's CalendarEvent dataclass expects: subject, start,
# end, organizer, required_attendees, outlook_entry_id, response_status.
param([string]$InitialSync = "false")

# Force UTF-8 on the output stream - without this, Write-Host encodes
# using the console's codepage (cp1252 on this machine), which mangles
# every accented character (e/e/e...) into replacement chars before
# Python even sees the bytes.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Get-ResponseStatusString($OlResponseStatus) {
    # olResponseNone=0, olResponseOrganized=1, olResponseTentative=2,
    # olResponseAccepted=3, olResponseDeclined=4, olResponseNotResponded=5
    switch ([int]$OlResponseStatus) {
        3 { return "accepted" }
        4 { return "declined" }
        2 { return "tentative" }
        default { return "not_responded" }
    }
}

try {
    $Outlook = New-Object -ComObject Outlook.Application
    $Namespace = $Outlook.GetNamespace("MAPI")
    $CalendarFolder = $Namespace.GetDefaultFolder(9)  # olFolderCalendar

    # -60/+90 days with IncludeRecurrences expands every occurrence of
    # every recurring meeting across that whole 150-day window on each
    # 30s poll - that's what was actually timing out (240s), not a
    # backend/network issue. A recurring sync only needs to look far
    # enough ahead to catch new/changed appointments since last time.
    if ($InitialSync -eq "true") {
        $StartDate = (Get-Date).AddDays(-60)
        $EndDate = (Get-Date).AddDays(90)
    } else {
        $StartDate = (Get-Date).AddDays(-7)
        $EndDate = (Get-Date).AddDays(30)
    }

    # IMPORTANT: with IncludeRecurrences=$true, iterating $Items directly
    # walks every occurrence of every recurring meeting across the item's
    # ENTIRE series (years), then filters by date afterwards - that's what
    # was actually timing out, regardless of how narrow $StartDate/$EndDate
    # were. Items.Restrict() applies the date filter at the folder level
    # BEFORE recurrence expansion, which is the correct/fast pattern for
    # Outlook COM.
    $Items = $CalendarFolder.Items
    $Items.IncludeRecurrences = $true
    $Items.Sort("[Start]")

    # Outlook's Restrict() parses date literals using the machine's
    # current regional settings, not a fixed format - this machine is
    # fr-FR (dd/MM/yyyy). Hardcoding "MM/dd/yyyy" here silently produced
    # invalid dates for any day-of-month > 12 (e.g. "10/19/2026" parsed
    # as day 10, month 19 - invalid), which made Restrict() return zero
    # items every single cycle. "g" auto-formats to the current culture,
    # so it always matches what Outlook expects on this machine.
    $FilterStart = $StartDate.ToString("g")
    $FilterEnd = $EndDate.ToString("g")
    $Filter = "[Start] <= '$FilterEnd' AND [End] >= '$FilterStart'"
    $RestrictedItems = $Items.Restrict($Filter)

    $Events = @()

    foreach ($Item in $RestrictedItems) {
        try {
            $Attendees = @()
            if ($Item.RequiredAttendees) {
                $Attendees = $Item.RequiredAttendees -split ';' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
            }

            $Event = @{
                subject             = [string]$Item.Subject
                start               = $Item.Start.ToString("yyyy-MM-dd HH:mm:ss")
                end                 = $Item.End.ToString("yyyy-MM-dd HH:mm:ss")
                organizer           = [string]$Item.Organizer
                required_attendees  = @($Attendees)
                outlook_entry_id    = [string]$Item.EntryID
                response_status     = Get-ResponseStatusString $Item.ResponseStatus
            }
            $Events += $Event
        } catch {
            # Skip items that error out
        }
    }

    if ($Events.Count -eq 0) {
        Write-Host "[]"
    } elseif ($Events.Count -eq 1) {
        Write-Host "[$($Events | ConvertTo-Json -Depth 10)]"
    } else {
        Write-Host ($Events | ConvertTo-Json -Depth 10)
    }
} catch {
    Write-Host "[]"
    [Console]::Error.WriteLine("export_calendar.ps1 error: $($_.Exception.Message)")
}
