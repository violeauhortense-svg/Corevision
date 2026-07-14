// ============================================
// RDV ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getEmailService, wrapEmailHtml } from "./emailService.ts";
import { UPLOADS_DIR } from "./storage.tsx";

interface RDVProposal {
  clientId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: 'cabinet' | 'client' | 'visio' | 'autre';
  locationOther?: string;
  documentsRequested: string[];
  sendToSpouse: boolean;
  emailContent: string;
  clientEmail: string;
  clientName: string;
  spouseEmail?: string;
  spouseName?: string;
}

function generateUploadToken(clientId: string, rdvId: string): string {
  const timestamp = Date.now();
  const expiresAt = timestamp + 30 * 24 * 60 * 60 * 1000; // 30 jours
  const data = `${clientId}:${rdvId}:${expiresAt}`;
  const token = btoa(data); // Base64 encode
  return token;
}

function validateUploadToken(token: string): { valid: boolean; clientId?: string; rdvId?: string } {
  try {
    const decoded = atob(token); // Base64 decode
    const [clientId, rdvId, expiresAt] = decoded.split(':');

    const now = Date.now();
    if (now > parseInt(expiresAt)) {
      return { valid: false };
    }

    return { valid: true, clientId, rdvId };
  } catch {
    return { valid: false };
  }
}

// Fonctions pour les demandes comptables
function generateAccountantRequestToken(clientId: string, requestId: string, accountantEmail: string): string {
  const timestamp = Date.now();
  const expiresAt = timestamp + 30 * 24 * 60 * 60 * 1000; // 30 jours
  const data = `${clientId}:${requestId}:${accountantEmail}:${expiresAt}`;
  const token = btoa(data); // Base64 encode
  return token;
}

function validateAccountantRequestToken(token: string): { valid: boolean; clientId?: string; requestId?: string; accountantEmail?: string } {
  try {
    const decoded = atob(token); // Base64 decode
    const [clientId, requestId, accountantEmail, expiresAt] = decoded.split(':');

    const now = Date.now();
    if (now > parseInt(expiresAt)) {
      return { valid: false };
    }

    return { valid: true, clientId, requestId, accountantEmail };
  } catch {
    return { valid: false };
  }
}

function getLocationDisplay(location: string, locationOther?: string): string {
  switch (location) {
    case 'cabinet':
      return 'Au cabinet';
    case 'client':
      return 'Chez le client';
    case 'visio':
      return 'En visio';
    case 'autre':
      return locationOther || 'À définir';
    default:
      return '';
  }
}

function generateMeetingProposalEmail(params: {
  recipientName: string;
  date: string;
  time: string;
  location: string;
  documentsRequested: string[];
  uploadLink: string;
  emailContent?: string;
  hasSpouse: boolean;
  isSpouse: boolean;
  spouseName?: string;
}): string {
  const {
    recipientName,
    date,
    time,
    location,
    documentsRequested,
    uploadLink,
    emailContent,
    hasSpouse,
    isSpouse,
    spouseName,
  } = params;

  const dateObj = new Date(date);
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const documentsList =
    documentsRequested.length > 0
      ? documentsRequested.map((doc) => `<li>${doc}</li>`).join('')
      : '<li>Documents à préciser</li>';

  const spouseNote = hasSpouse
    ? isSpouse
      ? `<p style="font-size: 13px; color: #6b7280;"><strong>Note :</strong> Votre conjoint(e) a également reçu un email avec le même lien de dépôt.</p>`
      : `<p style="font-size: 13px; color: #6b7280;"><strong>Note :</strong> Votre conjoint(e) ${spouseName} recevra également un email avec le même lien de dépôt.</p>`
    : '';

  const customContent = emailContent ? `<p style="color: #374151;">${emailContent.replace(/\n/g, '<br>')}</p>` : '';

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">📅 Confirmation de votre rendez-vous</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>Bonjour <strong>${recipientName}</strong>,</p>

        <p>Nous confirmons votre rendez-vous pour notre entretien de bilan patrimonial.</p>

        ${customContent}

        <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 16px;">📅 <strong>Détails du rendez-vous:</strong></h3>
          <div style="color: #374151; line-height: 1.8;">
            <p style="margin: 8px 0;"><strong>Date:</strong> ${dateFormatted}</p>
            <p style="margin: 8px 0;"><strong>Heure:</strong> ${time}</p>
            <p style="margin: 8px 0;"><strong>Lieu:</strong> ${location}</p>
          </div>
        </div>

        <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 15px 0; color: #10b981; font-size: 16px;">📋 <strong>Documents à apporter:</strong></h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            ${documentsList}
          </ul>
        </div>

        <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; margin: 25px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 15px 0; color: #0284c7; font-size: 16px;">🔒 <strong>Dépôt sécurisé de vos pièces:</strong></h3>
          <p style="margin: 0 0 15px 0; color: #374151;">Vous pouvez déposer vos documents de manière sécurisée et confidentielle (RGPD) en cliquant sur le lien ci-dessous:</p>
          <div style="text-align: center;">
            <a href="${uploadLink}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
              📤 Déposer mes documents
            </a>
          </div>
          <p style="font-size: 12px; color: #0c4a6e; margin: 10px 0 0 0;">Ce lien sera valide pendant 30 jours.</p>
        </div>

        ${location === 'visio' ? `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>📞 Pour les rendez-vous en visio:</strong><br>Un lien de visioconférence vous sera transmis ultérieurement.</p>
          </div>
        ` : ''}

        <p style="font-size: 13px; color: #6b7280; margin-top: 20px;">
          N'hésitez pas à nous contacter si vous avez des questions ou si vous devez modifier ce rendez-vous.
        </p>

        ${spouseNote}

        <div style="border-top: 1px solid #e5e7eb; margin-top: 30px; padding-top: 20px; font-size: 12px; color: #9ca3af;">
          <p style="margin: 5px 0;">© 2026 Corevision - Tous droits réservés</p>
          <p style="margin: 5px 0;">Ce message est confidentiel et destiné uniquement au(x) destinataire(s) indiqué(s).</p>
        </div>
      </div>
    </div>
  `;
}

export function setupRDVRoutes(app: Hono) {
  // ============================================
  // POST /api/rdv/create-proposal
  // Créer une proposition de RDV
  // ============================================
  app.post("/make-server-cac859af/rdv/create-proposal", async (c) => {
    try {
      const body = (await c.req.json()) as RDVProposal;


      // Générer les IDs
      const rdvId = `rdv_${Date.now()}`;
      const uploadToken = generateUploadToken(body.clientId, rdvId);
      const uploadLink = `${c.req.url.split('/make-server-cac859af')[0]}/rdv/upload?token=${uploadToken}&clientId=${body.clientId}&rdvId=${rdvId}`;

      // Préparer les données du RDV
      const rdvData = {
        id: rdvId,
        clientId: body.clientId,
        date: body.date,
        time: body.time,
        location: getLocationDisplay(body.location, body.locationOther),
        locationRaw: body.location,
        documentsRequested: body.documentsRequested,
        uploadToken,
        createdAt: new Date().toISOString(),
      };

      // Sauvegarder le RDV dans KV store
      await kv.set(`rdv:${rdvId}`, rdvData);

      // Préparer les emails
      const emailService = getEmailService();
      const recipientEmails = [body.clientEmail];
      if (body.sendToSpouse && body.spouseEmail) {
        recipientEmails.push(body.spouseEmail);
      }

      // Envoyer l'email au client
      const clientEmailHtml = generateMeetingProposalEmail({
        recipientName: body.clientName,
        date: body.date,
        time: body.time,
        location: getLocationDisplay(body.location, body.locationOther),
        documentsRequested: body.documentsRequested,
        uploadLink,
        emailContent: body.emailContent || undefined,
        hasSpouse: body.sendToSpouse && !!body.spouseEmail,
        isSpouse: false,
        spouseName: body.spouseName,
      });

      await emailService.sendEmail({
        to: body.clientEmail,
        subject: `Confirmation de votre rendez-vous - ${new Date(body.date).toLocaleDateString('fr-FR')}`,
        htmlContent: wrapEmailHtml(clientEmailHtml),
        from: { email: 'contact@cvh-patrimoine.com', name: 'CoreVision' },
      });

      // Envoyer l'email au conjoint si applicable
      let spouseEmailHtml: string | undefined;
      if (body.sendToSpouse && body.spouseEmail && body.spouseName) {
        spouseEmailHtml = generateMeetingProposalEmail({
          recipientName: body.spouseName,
          date: body.date,
          time: body.time,
          location: getLocationDisplay(body.location, body.locationOther),
          documentsRequested: body.documentsRequested,
          uploadLink,
          emailContent: body.emailContent || undefined,
          hasSpouse: true,
          isSpouse: true,
          spouseName: body.clientName,
        });

        await emailService.sendEmail({
          to: body.spouseEmail,
          subject: `Confirmation de votre rendez-vous - ${new Date(body.date).toLocaleDateString('fr-FR')}`,
          htmlContent: wrapEmailHtml(spouseEmailHtml),
          from: { email: 'contact@cvh-patrimoine.com', name: 'CoreVision' },
        });
      }


      // Préparer les infos du RDV pour créer l'événement d'agenda
      const agendaEvent = {
        clientId: body.clientId,
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        title: `RDV - Bilan Patrimonial`,
        date: `${body.date}T${body.time}:00`,
        time: body.time,
        location: getLocationDisplay(body.location, body.locationOther),
        locationType: body.location,
        meetingType: 'R1' as const,
        description: `Documents demandés: ${body.documentsRequested.join(', ') || 'Aucun'}`,
      };

      // Préparer les infos d'email pour l'historique
      const emailInfo = {
        subject: `Confirmation de votre rendez-vous - ${new Date(body.date).toLocaleDateString('fr-FR')}`,
        clientEmailHtml,
        spouseEmailHtml: body.sendToSpouse && body.spouseEmail && body.spouseName ? spouseEmailHtml : undefined,
      };

      return c.json({
        success: true,
        rdvId,
        uploadToken,
        uploadLink,
        emailsSent: recipientEmails,
        agendaEvent,
        emailInfo,
      });
    } catch (error) {
      console.error('❌ Erreur création proposition RDV:', error);
      return c.json({ error: String(error) }, 500);
    }
  });

  // ============================================
  // POST /api/rdv/secure-upload
  // Upload sécurisé des documents
  // ============================================
  app.post("/make-server-cac859af/rdv/secure-upload", async (c) => {
    try {
      const token = c.req.query('token');
      const clientId = c.req.query('clientId');
      const rdvId = c.req.query('rdvId');

      if (!token || !clientId || !rdvId) {
        return c.json({ error: 'Missing required parameters' }, 400);
      }

      // Valider le token
      const validation = validateUploadToken(token);
      if (!validation.valid || validation.clientId !== clientId || validation.rdvId !== rdvId) {
        console.error('❌ Token invalide ou expiré');
        return c.json({ error: 'Invalid or expired token' }, 401);
      }

      // Récupérer le fichier
      const formData = await c.req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return c.json({ error: 'No file provided' }, 400);
      }

      // Créer le dossier de destination
      const uploadDir = `${UPLOADS_DIR}/rdv/${clientId}/${rdvId}`;
      await Deno.mkdir(uploadDir, { recursive: true });

      // Sauvegarder le fichier
      const filePath = `${uploadDir}/${file.name}`;
      const buffer = await file.arrayBuffer();
      await Deno.writeFile(filePath, new Uint8Array(buffer));



      return c.json({
        success: true,
        fileName: file.name,
        filePath: `/make-server-cac859af/rdv/download/${clientId}/${rdvId}/${file.name}`,
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Erreur upload document:', error);
      return c.json({ error: String(error) }, 500);
    }
  });

  // ============================================
  // GET /api/rdv/download/{clientId}/{rdvId}/{fileName}
  // Télécharger un document uploadé
  // ============================================
  app.get("/make-server-cac859af/rdv/download/:clientId/:rdvId/:fileName", async (c) => {
    try {
      const { clientId, rdvId, fileName } = c.req.param();

      const filePath = `${UPLOADS_DIR}/rdv/${clientId}/${rdvId}/${fileName}`;

      // Vérifier que le fichier existe
      try {
        await Deno.stat(filePath);
      } catch {
        return c.json({ error: 'File not found' }, 404);
      }

      // Lire et servir le fichier
      const fileBuffer = await Deno.readFile(filePath);
      c.header('Content-Type', 'application/octet-stream');
      c.header('Content-Disposition', `attachment; filename="${fileName}"`);

      return c.body(fileBuffer);
    } catch (error) {
      console.error('❌ Erreur téléchargement document:', error);
      return c.json({ error: String(error) }, 500);
    }
  });

  // Route pour créer une demande comptable avec lien de dépôt sécurisé
  app.post("/make-server-cac859af/accountant-request/create-proposal", async (c) => {
    try {
      const body = await c.req.json() as any;
      const { clientId, accountantEmail, accountantName, companyName, documentsRequested, emailContent } = body;

      // Générer un ID unique pour la demande
      const requestId = `accountant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Générer le token sécurisé (valide 30 jours, spécifique à l'email du comptable)
      const uploadToken = generateAccountantRequestToken(clientId, requestId, accountantEmail);
      const uploadLink = `${c.req.url.split('/make-server-cac859af')[0]}/accountant-request/upload?token=${uploadToken}`;

      // Créer le contenu de l'email avec le lien de dépôt
      const emailWithLink = `${emailContent}

---

<div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 20px; margin: 25px 0; border-radius: 4px;">
  <h3 style="margin: 0 0 15px 0; color: #0284c7; font-size: 16px;">🔒 <strong>Dépôt sécurisé de vos pièces:</strong></h3>
  <p style="margin: 0 0 15px 0; color: #374151;">Vous pouvez déposer vos documents de manière sécurisée et confidentielle (RGPD) en cliquant sur le lien ci-dessous:</p>
  <div style="text-align: center;">
    <a href="${uploadLink}" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">
      📤 Déposer mes documents
    </a>
  </div>
  <p style="font-size: 12px; color: #0c4a6e; margin: 10px 0 0 0;">Ce lien sera valide pendant 30 jours et ne peut être accédé que par ${accountantEmail}.</p>
</div>`;

      // Sauvegarder la demande dans KV store
      await kv.set(`accountant_request:${requestId}`, {
        clientId,
        requestId,
        accountantEmail,
        accountantName,
        companyName,
        documentsRequested,
        uploadToken,
        uploadLink,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Envoyer l'email au comptable
      const emailService = getEmailService();
      try {
        const htmlEmail = wrapEmailHtml(emailWithLink);
        await emailService.sendEmail({
          to: [accountantEmail],
          subject: `Demande de documents comptables - ${companyName}`,
          text: emailContent,
          html: htmlEmail,
        });
      } catch (emailError) {
        console.warn('⚠️ Erreur lors de l\'envoi de l\'email:', emailError);
      }


      return c.json({
        success: true,
        requestId,
        uploadToken,
        uploadLink,
        accountantEmail,
        accountantName,
        companyName,
      });
    } catch (error) {
      console.error('❌ Erreur création demande comptable:', error);
      return c.json({ error: String(error) }, 500);
    }
  });

  // Route pour uploader les documents avec validation du token
  app.post("/make-server-cac859af/accountant-request/upload", async (c) => {
    try {
      const token = c.req.query('token');
      if (!token) {
        return c.json({ error: 'Token manquant' }, 400);
      }

      // Valider le token
      const validation = validateAccountantRequestToken(token);
      if (!validation.valid) {
        console.error('❌ Token invalide ou expiré');
        return c.json({ error: 'Lien expiré ou invalide. Veuillez demander un nouveau lien.' }, 401);
      }

      const { clientId, requestId, accountantEmail } = validation;
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      const userEmail = formData.get('userEmail') as string;

      // Vérifier que l'email correspond
      if (userEmail !== accountantEmail) {
        console.error('❌ Email non autorisé:', { expected: accountantEmail, received: userEmail });
        return c.json({ error: 'Accès non autorisé. Vous n\'êtes pas le destinataire de cette demande.' }, 403);
      }

      if (!file) {
        return c.json({ error: 'Aucun fichier trouvé' }, 400);
      }

      // Créer le répertoire de destination
      const uploadDir = `${UPLOADS_DIR}/accountant_requests/${clientId}/${requestId}`;
      try {
        await Deno.mkdir(uploadDir, { recursive: true });
      } catch (e) {
      }

      // Sauvegarder le fichier
      const fileName = file.name;
      const filePath = `${uploadDir}/${fileName}`;
      const fileBuffer = await file.arrayBuffer();
      await Deno.writeFile(filePath, new Uint8Array(fileBuffer));

      // Mettre à jour la demande dans KV
      const requestData = await kv.get(`accountant_request:${requestId}`);
      if (requestData) {
        requestData.uploadedFiles = requestData.uploadedFiles || [];
        requestData.uploadedFiles.push({
          name: fileName,
          uploadedAt: new Date().toISOString(),
          uploadedBy: accountantEmail,
        });
        await kv.set(`accountant_request:${requestId}`, requestData);
      }


      return c.json({
        success: true,
        fileName,
        requestId,
        message: 'Document uploadé avec succès!',
      });
    } catch (error) {
      console.error('❌ Erreur upload document comptable:', error);
      return c.json({ error: String(error) }, 500);
    }
  });
}
