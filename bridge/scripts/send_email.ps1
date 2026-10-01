# ============================================
# send_email.ps1: Envoie un email via Outlook
# ============================================

param(
    [string]$to,
    [string]$subject,
    [string]$body,
    [string]$cc = "",
    [string]$bcc = "",
    [string]$isHtml = "false"
)

try {
    # Créer l'objet Outlook
    $outlook = New-Object -ComObject Outlook.Application

    # Créer un nouveau mail
    $mail = $outlook.CreateItem(0)  # 0 = olMailItem

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
