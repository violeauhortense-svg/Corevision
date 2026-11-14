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

    # efipatrimoine.com est l'alias d'un VRAI deuxieme compte Outlook
    # distinct (h.violeau@fiteco.com), pas juste une adresse secondaire sur
    # le compte principal (hortense.violeau@prudentia.fr). Afficher
    # precisement l'alias efipatrimoine.com comme expediteur reel exige
    # une permission Exchange "Send As" cote IT (teste et confirme : sans
    # elle, Exchange revient toujours a l'adresse principale du compte
    # cible) - en attendant, Hortense a valide fiteco.com comme expediteur
    # de repli (mieux que Prudentia, qui n'a aucun rapport avec son
    # activite EFI Patrimoine/Fiteco).
    #
    # Ce qui marche (confirme par test reel) : creer l'item DIRECTEMENT
    # dans le dossier Brouillons du compte cible (DeliveryStore), pas via
    # Application.CreateItem - l'appartenance au bon store des la creation
    # est ce qu'Exchange respecte reellement a l'envoi, pas une propriete
    # reglee apres coup sur un item d'un autre store.
    $targetAccount = $null
    if ($fromAddress) {
        foreach ($acc in $namespace.Session.Accounts) {
            if ($acc.SmtpAddress -eq $fromAddress -or $acc.SmtpAddress -like "*fiteco*") {
                $targetAccount = $acc
                break
            }
        }
    }

    if ($targetAccount) {
        $mail = $targetAccount.DeliveryStore.GetDefaultFolder(16).Items.Add(0)  # 16 = olFolderDrafts
        $mail.SendUsingAccount = $targetAccount
    } else {
        if ($fromAddress) {
            [Console]::Error.WriteLine("Aucun compte Outlook correspondant a '$fromAddress' - envoi avec le compte par defaut.")
        }
        $mail = $outlook.CreateItem(0)  # 0 = olMailItem
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
