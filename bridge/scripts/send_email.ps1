# ============================================
# send_email.ps1: Envoie un email via Outlook
# ============================================

param(
    [string]$to,
    [string]$subject,
    [string]$body,
    [string]$cc = "",
    [string]$bcc = "",
    [string]$isHtml = "false",
    [string]$fromAddress = ""
)

try {
    # Créer l'objet Outlook
    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")

    # Créer un nouveau mail
    $mail = $outlook.CreateItem(0)  # 0 = olMailItem

    # efipatrimoine.com est l'alias d'un VRAI deuxieme compte Outlook
    # distinct (h.violeau@fiteco.com), pas juste une adresse secondaire
    # sur le compte principal (hortense.violeau@prudentia.fr) - CreateRecipient
    # + .Sender sur le compte principal ne changeait rien a l'envoi reel
    # (confirme par test : le mail partait quand meme de Prudentia).
    # SendUsingAccount avec ce vrai compte est le mecanisme concu pour ca.
    if ($fromAddress) {
        try {
            $targetAccount = $null
            foreach ($acc in $namespace.Session.Accounts) {
                if ($acc.SmtpAddress -eq $fromAddress) { $targetAccount = $acc; break }
            }
            if (-not $targetAccount) {
                # fromAddress est peut-etre un alias (ex: efipatrimoine.com)
                # plutot que l'adresse principale du compte (fiteco.com) -
                # chercher aussi parmi les adresses mandataires (proxy) du
                # compte Exchange.
                foreach ($acc in $namespace.Session.Accounts) {
                    try {
                        $exchUser = $acc.CurrentUser.AddressEntry.GetExchangeUser()
                        if ($exchUser.Address -eq $fromAddress -or $acc.SmtpAddress -like "*fiteco*") {
                            $targetAccount = $acc
                        }
                    } catch {}
                }
            }
            if ($targetAccount) {
                $mail.SendUsingAccount = $targetAccount
                # SendUsingAccount choisit le compte authentifié utilisé
                # pour l'envoi (fiteco.com) mais affiche par défaut SA
                # propre adresse principale, pas forcément l'alias
                # efipatrimoine.com demandé - forcer .Sender en plus,
                # maintenant résolu via ce bon compte (pas le principal),
                # pour que l'adresse visible soit la bonne.
                if ($fromAddress -ne $targetAccount.SmtpAddress) {
                    try {
                        $fromRecipient = $namespace.CreateRecipient($fromAddress)
                        $fromRecipient.Resolve() | Out-Null
                        if ($fromRecipient.Resolved) { $mail.Sender = $fromRecipient }
                    } catch {}
                }
            } else {
                [Console]::Error.WriteLine("Aucun compte Outlook correspondant a '$fromAddress' - envoi avec le compte par defaut.")
            }
        } catch {
            [Console]::Error.WriteLine("Echec reglage SendUsingAccount pour '$fromAddress' : $($_.Exception.Message) - envoi avec le compte par defaut.")
        }
    }

    # Définir les champs
    $mail.To = $to
    $mail.CC = $cc
    $mail.BCC = $bcc
    $mail.Subject = $subject

    # Le questionnaire de découverte (et tout futur mail mis en forme) est
    # envoyé en HTML pour le vrai gras/couleur/mise en page - HTMLBody au
    # lieu de Body dans ce cas, sinon Outlook afficherait les balises
    # telles quelles comme du texte brut.
    if ($isHtml -eq "true") {
        $mail.HTMLBody = $body
    } else {
        $mail.Body = $body
    }

    # Ajouter la signature par défaut
    # (Outlook ajoute automatiquement la signature)

    # Envoyer le mail
    $mail.Send()

    Write-Host "Email sent successfully: $subject"
    exit 0

} catch {
    Write-Error "Error sending email: $_"
    exit 1
}
