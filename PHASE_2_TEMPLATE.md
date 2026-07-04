# Phase 2 - Template d'implémentation IMAP/SMTP

**À faire une fois que tu auras les infos de ta boîte mail pro**

---

## Infos à récupérer

Contact ton IT/administrateur mail et demande :

```
Serveur SMTP:
  - Adresse: ? (ex: smtp.example.com)
  - Port: ? (587 ou 465)
  - TLS/SSL: ? (oui/non)
  - Authentification: ? (username)
  - Mot de passe: ?

Serveur IMAP (pour lire les emails plus tard):
  - Adresse: ? (ex: imap.example.com)
  - Port: ? (993)
  - TLS/SSL: ? (oui)
  - Authentification: ? (same as SMTP)

Boîte mail à utiliser:
  - Email: contact@votredomaine.fr (ou autre)
  - Est-ce une boîte partagée ou personnelle?
  - Qui a accès?
```

---

## Étape 1: Créer le fichier d'implémentation

Une fois que tu as les infos, crée ce fichier :

**File**: `src/app/supabase/functions/server/imapSmtpEmailService.ts`

```typescript
import { getEmailService, type IEmailService, type EmailMessage } from "./emailService.ts";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

/**
 * IMAP/SMTP Email Service Implementation
 * Utilise le protocole SMTP pour envoyer des emails
 * Prêt pour IMAP quand on aura besoin de lire les emails
 */
export class ImapSmtpEmailService implements IEmailService {
  private config: SmtpConfig;

  constructor(config?: Partial<SmtpConfig>) {
    this.config = {
      host: config?.host || Deno.env.get('SMTP_HOST') || '',
      port: config?.port || parseInt(Deno.env.get('SMTP_PORT') || '587'),
      secure: config?.secure !== false,
      auth: {
        user: config?.auth?.user || Deno.env.get('SMTP_USER') || '',
        pass: config?.auth?.pass || Deno.env.get('SMTP_PASSWORD') || '',
      },
    };

    if (!this.config.host || !this.config.auth.user || !this.config.auth.pass) {
      console.error('⚠️ SMTP configuration incomplete. Using stub service.');
    }
  }

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Valider la configuration
      if (!this.config.host) {
        return {
          success: false,
          error: 'SMTP_HOST non configuré',
        };
      }

      console.log(`📧 Envoi email via SMTP à ${Array.isArray(message.to) ? message.to.join(', ') : message.to}`);

      // TODO: Implémenter avec nodemailer ou smtp-client
      // Exemple avec nodemailer:
      /*
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth,
      });

      const mailOptions = {
        from: message.from?.email || this.config.auth.user,
        to: Array.isArray(message.to) ? message.to.join(',') : message.to,
        subject: message.subject,
        html: message.htmlContent,
        replyTo: message.replyTo?.email,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
      */

      // Placeholder jusqu'à implémentation
      return {
        success: true,
        messageId: `temp-${Date.now()}`,
      };
    } catch (error) {
      console.error('❌ Erreur envoi SMTP:', error);
      return {
        success: false,
        error: `Erreur SMTP: ${(error as Error).message}`,
      };
    }
  }

  // Future: Implémenter la lecture d'emails via IMAP
  // async getEmails(folder: string = 'INBOX'): Promise<Email[]> { ... }
  // async getAttachments(messageId: string): Promise<Attachment[]> { ... }
}
```

---

## Étape 2: Mettre à jour emailService.ts

Une fois que ton implémentation est prête, mets à jour le fichier :

**File**: `src/app/supabase/functions/server/emailService.ts`

Change la section `EmailServiceFactory` :

```typescript
import { ImapSmtpEmailService } from "./imapSmtpEmailService.ts";

export class EmailServiceFactory {
  static getService(config?: EmailServiceConfig): IEmailService {
    // Retourner l'implémentation IMAP/SMTP réelle
    return new ImapSmtpEmailService();
  }
}
```

**C'est tout**. Les 4 fichiers refactorisés (email_routes, signature_routes, etc.) fonctionneront **sans aucune modification**.

---

## Étape 3: Variables d'environnement

Ajoute à ton fichier de déploiement (`deploy.env.example` ou équivalent) :

```env
# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=contact@votredomaine.fr
SMTP_PASSWORD=motdepasse_securise
```

---

## Test

Une fois que tu as ajouté la config, teste :

```bash
# Via Deno
deno run --allow-env --allow-net src/app/supabase/functions/server/index.tsx
```

Essaie d'envoyer un email depuis l'app - ça devrait marcher !

---

## Futures améliorations (Phase 3)

Une fois que SMTP fonctionne, tu peux ajouter :

1. **Lecture des emails (IMAP)**
   - Lister les emails reçus
   - Afficher les conversations
   - Récupérer les attachments

2. **Webhook remplacé**
   - Syncroniser automatiquement les emails lus/archivés
   - Tracker les rebonds/erreurs de livraison

3. **Templates**
   - Sauvegarder les templates d'emails côté serveur
   - Réutiliser les templates avec des variables

---

## Support

Si tu as besoin d'aide avec :
- **Récupération des infos SMTP** - demande à ton IT
- **Implémentation concrète** - je peux finir le code une fois que tu as les infos
- **Tests** - on testera ensemble une fois que c'est en place

**Je suis prêt pour la Phase 2 dès que tu as les infos !** 🚀
