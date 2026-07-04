// ============================================
// SIGNATURE ÉLECTRONIQUE DES DOCUMENTS
// ============================================

import { getEmailService, wrapEmailHtml, type EmailMessage } from "./emailService.ts";

export function setupSignatureRoutes(app: any, supabaseAdmin: any, kv: any) {
  // Route POST /signature/send - Envoyer les documents pour signature
  app.post("/make-server-cac859af/signature/send", async (c: any) => {
    try {
      const formData = await c.req.formData();
      
      const clientId = formData.get('clientId');
      const recipient = formData.get('recipient');
      const clientName = formData.get('clientName');
      const clientEmail = formData.get('clientEmail');
      const conjointName = formData.get('conjointName');
      const conjointEmail = formData.get('conjointEmail');
      const customMessageStr = formData.get('customMessage');

      if (!clientId || !recipient || !clientName || !clientEmail) {
        return c.json({ error: "Données manquantes" }, 400);
      }

      console.log(`📧 Envoi signature - Client: ${clientName}, Destinataire: ${recipient}`);

      // Parser le message personnalisé si fourni
      let customMessage = null;
      if (customMessageStr && typeof customMessageStr === 'string') {
        try {
          customMessage = JSON.parse(customMessageStr);
          console.log('📝 Message personnalisé reçu:', customMessage);
        } catch (e) {
          console.warn('⚠️ Impossible de parser customMessage, utilisation du message par défaut');
        }
      }

      // Générer les tokens
      const clientToken = `sig_${clientId}_client_${Date.now()}`;
      const conjointToken = `sig_${clientId}_conjoint_${Date.now()}`;

      // Récupérer le profil CGP pour l'email
      const cgpProfile = await kv.get(`profile_default`);
      const cgpName = cgpProfile?.nom && cgpProfile?.prenom 
        ? `${cgpProfile.prenom} ${cgpProfile.nom}`
        : 'Votre conseiller';
      const cgpEmail = cgpProfile?.email || 'contact@cgp.fr';

      // Préparer les documents
      const documents: any[] = [];
      
      // Parser les documents du formData
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('client_generated_') && typeof value === 'string') {
          const doc = JSON.parse(value);
          documents.push({
            id: doc.id,
            name: doc.name,
            content: doc.content,
            type: 'generated'
          });
        } else if (key.startsWith('client_file_')) {
          const file = value as File;
          const arrayBuffer = await file.arrayBuffer();
          
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, Array.from(chunk));
          }
          const base64 = btoa(binary);
          
          documents.push({
            id: `file_${Date.now()}_${key}`,
            name: file.name,
            content: base64,
            type: 'file',
            mimeType: file.type
          });
        }
      }

      console.log(`📄 Documents parsés: ${documents.length}`);

      // Envoyer pour le client
      if (recipient === 'client' || recipient === 'both') {
        await kv.set(`signature_${clientToken}`, {
          clientId,
          signataire: 'client',
          signataireNom: clientName,
          signataireEmail: clientEmail,
          cgpName,
          cgpEmail,
          documents,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        const frontendUrl = 'https://jaw-karate-78155897.figma.site';
        const signatureUrl = `${frontendUrl}?page=sign-documents&token=${clientToken}`;
        
        await sendSignatureEmail({
          to: clientEmail,
          signataireNom: clientName,
          cgpName,
          documents,
          signatureUrl,
          customMessage
        });

        console.log(`✅ Email envoyé à ${clientEmail}`);
      }

      // Envoyer pour le conjoint
      if (recipient === 'conjoint' || recipient === 'both') {
        if (!conjointName || !conjointEmail) {
          return c.json({ error: "Données conjoint manquantes" }, 400);
        }

        await kv.set(`signature_${conjointToken}`, {
          clientId,
          signataire: 'conjoint',
          signataireNom: conjointName,
          signataireEmail: conjointEmail,
          cgpName,
          cgpEmail,
          documents,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });

        const frontendUrl = 'https://jaw-karate-78155897.figma.site';
        const signatureUrl = `${frontendUrl}?page=sign-documents&token=${conjointToken}`;
        
        await sendSignatureEmail({
          to: conjointEmail,
          signataireNom: conjointName,
          cgpName,
          documents,
          signatureUrl,
          customMessage
        });

        console.log(`✅ Email envoyé à ${conjointEmail}`);
      }

      return c.json({ 
        success: true,
        message: "Emails envoyés avec succès"
      });
    } catch (error: any) {
      console.error("❌ Erreur envoi signature:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route GET /signature/data/:token - Récupérer les données de signature
  app.get("/make-server-cac859af/signature/data/:token", async (c: any) => {
    try {
      const token = c.req.param('token');
      
      const data = await kv.get(`signature_${token}`);
      
      if (!data) {
        return c.json({ error: "Token invalide ou expiré" }, 404);
      }

      const documentsWithUrls = data.documents.map((doc: any) => {
        if (doc.type === 'generated') {
          const base64Content = btoa(unescape(encodeURIComponent(doc.content)));
          return {
            id: doc.id,
            name: doc.name,
            url: `data:text/plain;base64,${base64Content}`
          };
        } else if (doc.type === 'file') {
          return {
            id: doc.id,
            name: doc.name,
            url: `data:${doc.mimeType};base64,${doc.content}`
          };
        } else {
          return {
            id: doc.id,
            name: doc.name,
            url: doc.url || ''
          };
        }
      });

      return c.json({
        ...data,
        documents: documentsWithUrls
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération données:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route POST /signature/validate - Valider la signature
  app.post("/make-server-cac859af/signature/validate", async (c: any) => {
    try {
      const body = await c.req.json();
      const { token, signatureDate } = body;

      if (!token || !signatureDate) {
        return c.json({ error: "Données manquantes" }, 400);
      }

      const data = await kv.get(`signature_${token}`);
      
      if (!data) {
        return c.json({ error: "Token invalide" }, 404);
      }

      if (data.status === 'signed') {
        return c.json({ error: "Documents déjà signés" }, 400);
      }

      await kv.set(`signature_${token}`, {
        ...data,
        status: 'signed',
        signedAt: signatureDate,
      });

      await sendCGPNotificationEmail({
        cgpEmail: data.cgpEmail,
        cgpName: data.cgpName,
        signataireNom: data.signataireNom,
        clientId: data.clientId,
        signedAt: signatureDate,
      });

      console.log(`✅ Signature validée pour ${data.signataireNom}`);

      return c.json({ 
        success: true,
        message: "Signature enregistrée avec succès",
        clientId: data.clientId,
      });
    } catch (error: any) {
      console.error("❌ Erreur validation signature:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  // Route GET /signature/client/:clientId - Récupérer toutes les signatures d'un client
  app.get("/make-server-cac859af/signature/client/:clientId", async (c: any) => {
    try {
      const clientId = c.req.param('clientId');
      
      const allSignatures = await kv.getByPrefix('signature_');
      
      const clientSignatures = allSignatures
        .filter((sig: any) => sig.clientId === clientId && sig.status === 'signed')
        .map((sig: any) => ({
          token: sig.token || Object.keys(sig)[0],
          signataire: sig.signataire,
          signataireNom: sig.signataireNom,
          signataireEmail: sig.signataireEmail,
          documents: sig.documents,
          signedAt: sig.signedAt,
          status: sig.status,
        }));

      return c.json({ 
        success: true,
        signatures: clientSignatures
      });
    } catch (error: any) {
      console.error("❌ Erreur récupération signatures client:", error);
      return c.json({ error: error.message }, 500);
    }
  });

  console.log("✅ Routes de signature électronique configurées");
}

// Fonction pour envoyer l'email de signature
async function sendSignatureEmail({ to, signataireNom, cgpName, documents, signatureUrl, customMessage }: any) {
  const docsListHtml = documents.map((doc: any, idx: number) =>
    `<div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: #f3f4f6; border-radius: 6px; margin-bottom: 6px;">
      <span style="color: #667eea; font-weight: bold;">${idx + 1}.</span>
      <span style="color: #1f2937;">${doc.name}</span>
    </div>`
  ).join('');

  let emailContent;
  let emailSubject = '📝 Signature électronique de vos documents patrimoniaux';

  if (customMessage) {
    emailSubject = customMessage.subject || emailSubject;

    emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📝 Signature électronique</h1>
          <p style="margin-top: 10px; opacity: 0.9;">Documents patrimoniaux</p>
        </div>

        <div style="background-color: #ffffff; padding: 40px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px;">Bonjour <strong>${signataireNom}</strong>,</p>

          <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-left: 4px solid #667eea; border-radius: 4px;">
            <p style="white-space: pre-line; margin: 0;">${customMessage.intro || ''}</p>
          </div>

          <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px;">📋 À propos de ces documents</h3>
          <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-left: 4px solid #8b5cf6; border-radius: 4px;">
            <p style="white-space: pre-line; margin: 0;">${customMessage.importance || ''}</p>
          </div>

          <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px;">📄 Documents à signer</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            ${docsListHtml}
          </div>

          <h3 style="color: #667eea; margin-top: 25px; margin-bottom: 15px;">✍️ Comment signer ?</h3>
          <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px;">
            <p style="white-space: pre-line; margin: 0;">${customMessage.instructions || ''}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signatureUrl}"
               style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              👉 Signer mes documents
            </a>
          </div>

          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 30px;">
            <p style="white-space: pre-line; margin: 0; font-size: 13px; color: #065f46;">${customMessage.conclusion || ''}</p>
          </div>

          <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
            <p style="margin-bottom: 5px;">Cordialement,</p>
            <p style="font-weight: bold; font-size: 16px; color: #667eea;">${cgpName}</p>
          </div>
        </div>

        <div style="margin-top: 30px; padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #6b7280;">
          <p><strong>📧 Email envoyé via votre plateforme CRM CGP</strong></p>
          <p style="margin-top: 8px;">© 2026 - Gestion de Patrimoine - Tous droits réservés</p>
        </div>
      </div>
    `;
  } else {
    emailContent = `
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📝 Signature électronique</h1>
        </div>

        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 16px; color: #333;">Bonjour ${signataireNom},</p>

          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            Suite à votre rendez-vous avec <strong>${cgpName}</strong>, veuillez trouver ci-dessous le lien pour
            signer électroniquement vos documents patrimoniaux.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">📄 Documents à signer :</h3>
            <div style="font-size: 14px; color: #333; line-height: 1.8;">
              ${documents.map((doc: any) => `• ${doc.name}`).join('<br>')}
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${signatureUrl}"
               style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              👉 Signer mes documents
            </a>
          </div>

          <div style="background: #e0e7ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #4c51bf;">
              🔒 <strong>Signature sécurisée :</strong> Ce lien est personnel et sécurisé.
              Votre signature aura la même valeur juridique qu'une signature manuscrite.
            </p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Cordialement,<br>
            <strong>${cgpName}</strong>
          </p>
        </div>

        <div style="background: #1f2937; padding: 20px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © 2026 - Gestion de Patrimoine - Tous droits réservés
          </p>
        </div>
      </div>
    `;
  }

  const emailService = getEmailService();

  await emailService.sendEmail({
    to: to,
    subject: emailSubject,
    htmlContent: wrapEmailHtml(emailContent),
    from: { email: 'contact@cvh-patrimoine.com', name: cgpName },
  });

  console.log(`✅ Email envoyé avec succès à ${to}`);
}

// Fonction pour envoyer la notification au CGP
async function sendCGPNotificationEmail({ cgpEmail, cgpName, signataireNom, clientId, signedAt }: any) {
  const dateSignature = new Date(signedAt).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const emailContent = `
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">✅ Documents signés</h1>
      </div>

      <div style="padding: 30px; background: #f9fafb;">
        <p style="font-size: 16px; color: #333;">Bonjour ${cgpName},</p>

        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          <strong>${signataireNom}</strong> vient de signer électroniquement ses documents.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 14px; color: #333;">
            📅 <strong>Date de signature :</strong> ${dateSignature}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #333;">
            👤 <strong>Signataire :</strong> ${signataireNom}
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          Les documents signés sont disponibles dans l'onglet <strong>Documents réglementaires</strong> du client.
        </p>
      </div>

      <div style="background: #1f2937; padding: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          Notification automatique - CRM Gestion de Patrimoine
        </p>
      </div>
    </div>
  `;

  try {
    const emailService = getEmailService();

    await emailService.sendEmail({
      to: cgpEmail,
      subject: `✅ ${signataireNom} a signé ses documents`,
      htmlContent: wrapEmailHtml(emailContent),
      from: { email: 'contact@cvh-patrimoine.com', name: 'CRM Patrimoine' },
    });

    console.log(`✅ Notification CGP envoyée à ${cgpEmail}`);
  } catch (error) {
    console.error('❌ Erreur envoi notification CGP:', error);
  }
}
