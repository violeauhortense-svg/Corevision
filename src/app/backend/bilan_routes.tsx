// Routes pour les bilans patrimoniaux avec signature électronique
import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getEmailService, wrapEmailHtml, type EmailMessage } from "./emailService.ts";

export function setupBilanRoutes(app: Hono, verifyAuth: Function) {
  
  // Generate bilan patrimonial signature link (PROTECTED)
  app.post("/make-server-cac859af/bilan-signatures/generate", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const { clientId, clientName, clientEmail, spouseName, spouseEmail, bilanData } = await c.req.json();
      
      if (!clientId || !clientName || !clientEmail || !bilanData) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      // Générer un token unique
      const token = crypto.randomUUID();
      
      // Sauvegarder dans le KV store avec support pour 2 signataires
      const bilanSignature = {
        token,
        clientId,
        clientName,
        clientEmail,
        spouseName: spouseName || null,
        spouseEmail: spouseEmail || null,
        bilanData, // Contient toutes les données du bilan
        userId: user.id,
        createdAt: new Date().toISOString(),
        
        // Signature client
        clientSigned: false,
        clientSignedAt: null,
        clientSignatureData: null,
        
        // Signature conjoint (si existe)
        spouseSigned: false,
        spouseSignedAt: null,
        spouseSignatureData: null,
        
        emailSentAt: null,
      };
      
      await kv.set(`bilan_signature:${token}`, bilanSignature);
      await kv.set(`bilan_signature:client:${clientId}`, { token, clientId });
      
      
      return c.json({ token, signatureUrl: `?page=sign-bilan&token=${token}` });
    } catch (err) {
      console.error('Error generating bilan signature:', err);
      return c.json({ error: 'Failed to generate signature link: ' + err.message }, 500);
    }
  });

  // Get bilan signature by token (PUBLIC - needed for signature page)
  app.get("/make-server-cac859af/bilan-signature/:token", async (c) => {
    try {
      const token = c.req.param('token');
      const bilanSignature = await kv.get(`bilan_signature:${token}`);
      
      if (!bilanSignature) {
        return c.json({ error: 'Bilan not found' }, 404);
      }
      
      return c.json({ bilanSignature });
    } catch (err) {
      console.error('Error fetching bilan signature:', err);
      return c.json({ error: 'Failed to fetch bilan signature: ' + err.message }, 500);
    }
  });

  // Sign bilan (PUBLIC - no auth required, signature page)
  app.post("/make-server-cac859af/bilan-signature/:token/sign", async (c) => {
    try {
      const token = c.req.param('token');
      const { signatureData, signerType } = await c.req.json();
      
      if (!signatureData) {
        return c.json({ error: 'Missing signature data' }, 400);
      }
      
      const bilanSignature = await kv.get(`bilan_signature:${token}`);
      
      if (!bilanSignature) {
        return c.json({ error: 'Bilan not found' }, 404);
      }
      
      // Vérifier selon le signataire
      if (signerType === 'client') {
        if (bilanSignature.clientSigned) {
          return c.json({ error: 'Client already signed' }, 400);
        }
        // Mettre à jour avec la signature du client
        bilanSignature.clientSigned = true;
        bilanSignature.clientSignedAt = new Date().toISOString();
        bilanSignature.clientSignatureData = signatureData;
      } else if (signerType === 'spouse') {
        if (bilanSignature.spouseSigned) {
          return c.json({ error: 'Spouse already signed' }, 400);
        }
        // Mettre à jour avec la signature du conjoint
        bilanSignature.spouseSigned = true;
        bilanSignature.spouseSignedAt = new Date().toISOString();
        bilanSignature.spouseSignatureData = signatureData;
      }
      
      // Si les deux ont signé (ou pas de conjoint), marquer comme complètement signé
      const hasSpouse = bilanSignature.spouseEmail && bilanSignature.spouseName;
      const isFullySigned = bilanSignature.clientSigned && (!hasSpouse || bilanSignature.spouseSigned);
      
      if (isFullySigned) {
        bilanSignature.signedAt = new Date().toISOString();
        
        // 🎯 VALIDATION AUTOMATIQUE DE LA TÂCHE
        
        // Récupérer toutes les tâches du client
        const clientTasks = await kv.getByPrefix(`task:${bilanSignature.userId}:${bilanSignature.clientId}:`);
        
        // Chercher la tâche de compte rendu de RDV
        for (const taskEntry of clientTasks) {
          const task = taskEntry.value;
          
          if (task.title && (
            task.title.toLowerCase().includes('compte rendu') ||
            task.title.toLowerCase().includes('bilan patrimonial') ||
            task.title.toLowerCase().includes('rdv')
          )) {
            
            // Ne valider QUE si pas déjà validée
            if (!task.completed) {
              const updatedTask = {
                ...task,
                completed: true,
                completedAt: new Date().toISOString(),
                completedBy: hasSpouse ? 'both_signed' : 'client_signed',
                bilanToken: token, // Garder une référence au bilan
              };
              
              await kv.set(`task:${bilanSignature.userId}:${bilanSignature.clientId}:${task.id}`, updatedTask);
            } else {
            }
          }
        }
      } else {
      }
      
      await kv.set(`bilan_signature:${token}`, bilanSignature);
      
      return c.json({ success: true, bilanSignature });
    } catch (err) {
      console.error('Error signing bilan:', err);
      return c.json({ error: 'Failed to sign bilan: ' + err.message }, 500);
    }
  });

  // Send bilan signature email via Brevo (PROTECTED)
  app.post("/make-server-cac859af/bilan-signatures/send-email", async (c) => {
    
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      console.error('❌ Auth error:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const { token, clientEmail, clientName, spouseEmail, spouseName, senderName, senderEmail, customMessage } = await c.req.json();
      
      if (!token || !clientEmail || !clientName) {
        console.error('❌ Paramètres manquants');
        return c.json({ error: 'Missing required fields' }, 400);
      }

      const bilanSignature = await kv.get(`bilan_signature:${token}`);
      
      if (!bilanSignature) {
        console.error('❌ Bilan non trouvé pour token:', token);
        return c.json({ error: 'Bilan not found' }, 404);
      }

      // Générer le lien de signature
      const signatureUrl = `https://jaw-karate-78155897.figma.site/?page=sign-bilan&token=${token}`;

      const emailService = getEmailService();

      // Récupérer les objectifs depuis bilanData (SEULEMENT ceux inclus)
      const objectifs = (bilanSignature.bilanData?.objectifsData || []).filter((obj: any) => obj.inclus);
      let objectifsHTML = '';
      
      if (objectifs && objectifs.length > 0) {
        objectifsHTML = `
          <h3 style="color: #4F46E5; font-size: 18px; margin-top: 25px; margin-bottom: 15px;">🎯 Vos Objectifs Patrimoniaux</h3>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin-bottom: 10px; font-weight: bold;">Vous avez émis le souhait d'optimiser les objectifs suivants prioritairement :</p>
            <ul style="margin-left: 20px; line-height: 1.8;">
              ${objectifs.map((obj: any) => `
                <li style="margin-bottom: 8px;">
                  <strong>${obj.categorie || obj.titre || obj.title || 'Objectif'}</strong>
                  ${obj.commentaire || obj.comment ? `<br><span style="color: #6b7280; font-size: 14px;">${obj.commentaire || obj.comment}</span>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }

      // Utiliser le message personnalisé si fourni
      const subject = customMessage?.subject || 'Compte-rendu de notre entretien';
      const intro = customMessage?.intro || `Pour commencer, je souhaite vous remercier pour votre écoute et votre participation lors de ce 1er entretien.\nCe compte rendu est tout simplement un résumé afin de partir sur une base de travail solide.`;
      const criteres = customMessage?.criteres || `Lors de ces échanges, nous avons notamment évoqué et validé ensemble, les critères à prendre en compte impérativement dans la mise en place d'un projet d'optimisation de patrimoine :\n\n1) la Sécurité,\n2) la Disponibilité de votre argent,\n3) la Rentabilité.`;
      const leviers = customMessage?.leviers || `Ce sont les critères que nous atteignons ensemble en utilisant tout ou partie des effets de levier suivants :\n1) Financement par l'intermédiaire d'une banque partenaire,\n2) Placements avec l'appui de gestionnaires de renom pour la mise en place de solutions haut de gamme,\n3) Economies d'impôt si possible en profitant des lois mises en place par l'état,\n4) Revenus locatifs perçus de la part d'un locataire, le cas échéant.`;
      const conclusion = customMessage?.conclusion || `Mon travail consiste donc avant tout à vous informer (lors du 1er rdv) puis vous conseiller (lors du 2ème rdv) dans la mise en place de solution(s) permettant l'atteinte de vos objectifs.\n\nEn tant que conseiller(ère) en stratégies patrimoniales, je vous propose de vous accompagner, dès maintenant et dans la durée, dans les différentes démarches de développement de votre patrimoine de façon méthodique et structurée.\n\nJe vous remercie de valider ce compte rendu en le signant électroniquement.`;

      // Fonction pour générer le HTML de l'email
      const generateEmailHTML = (recipientName: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white; padding: 40px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background-color: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
            .section { margin-bottom: 30px; padding: 20px; background: #f9fafb; border-left: 4px solid #4F46E5; border-radius: 4px; }
            .button { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 25px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
            .footer { margin-top: 30px; padding: 30px; background: #f9fafb; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #6b7280; }
            h3 { color: #4F46E5; margin-top: 25px; margin-bottom: 15px; }
            .highlight { background: #fef3c7; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">📊 Compte-rendu de notre entretien</h1>
              <p style="margin-top: 10px; opacity: 0.9;">Document patrimonial à signer</p>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Bonjour <strong>${recipientName}</strong>,</p>
              
              <div class="section">
                <p style="white-space: pre-line;">${intro}</p>
              </div>

              <h3>🎯 Critères d'optimisation patrimoniale</h3>
              <div class="section">
                <p style="white-space: pre-line;">${criteres}</p>
              </div>

              <h3>🔧 Effets de levier</h3>
              <div class="section">
                <p style="white-space: pre-line;">${leviers}</p>
              </div>

              ${objectifsHTML}

              <h3>📝 Signature électronique requise</h3>
              <div class="section">
                <p style="white-space: pre-line;">${conclusion}</p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${signatureUrl}" class="button" style="color: white;">
                  ✍️ Consulter et signer le compte-rendu
                </a>
              </div>
              
              <p style="font-size: 13px; color: #6b7280; background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                🔒 <strong>Ce lien est personnel et sécurisé.</strong><br>
                La signature électronique a la même valeur juridique qu'une signature manuscrite conformément au règlement eIDAS (UE) n°910/2014.
              </p>
              
              <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
                <p style="margin-bottom: 5px;">Bien cordialement,</p>
                <p style="font-weight: bold; font-size: 16px; color: #4F46E5;">${senderName}</p>
              </div>
            </div>
            <div class="footer">
              <p><strong>📧 Email envoyé via votre plateforme CRM CGP</strong></p>
              <p style="margin-top: 8px;">Pour toute question, contactez directement votre conseiller(ère)</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Préparer les destinataires
      const recipients = [];
      const emailsSent = [];

      // Toujours envoyer au client
      const clientSignatureUrl = `${signatureUrl}&signer=client`;
      
      const clientEmailData = {
        sender: {
          name: senderName || 'Votre Conseiller',
          email: senderEmail || 'contact@cvh-patrimoine.com',
        },
        to: [{ email: clientEmail, name: clientName }],
        subject: subject,
        htmlContent: generateEmailHTML(clientName).replace(signatureUrl, clientSignatureUrl),
      };


      await emailService.sendEmail({
        to: clientEmail,
        subject: subject,
        htmlContent: wrapEmailHtml(clientEmailData.htmlContent),
        from: clientEmailData.sender,
      });

      emailsSent.push({ email: clientEmail, type: 'client' });

      // Envoyer au conjoint si existe
      let spouseResult = null;
      if (spouseEmail && spouseName) {
        
        const spouseSignatureUrl = `${signatureUrl}&signer=spouse`;
        
        const spouseEmailData = {
          sender: {
            name: senderName || 'Votre Conseiller',
            email: senderEmail || 'contact@cvh-patrimoine.com',
          },
          to: [{ email: spouseEmail, name: spouseName }],
          subject: subject,
          htmlContent: generateEmailHTML(spouseName).replace(signatureUrl, spouseSignatureUrl),
        };

        await emailService.sendEmail({
          to: spouseEmail,
          subject: subject,
          htmlContent: wrapEmailHtml(spouseEmailData.htmlContent),
          from: spouseEmailData.sender,
        });

        emailsSent.push({ email: spouseEmail, type: 'spouse' });
      }

      // Mettre à jour la date d'envoi
      bilanSignature.emailSentAt = new Date().toISOString();
      await kv.set(`bilan_signature:${token}`, bilanSignature);


      return c.json({
        success: true,
        recipientCount: emailsSent.length,
        recipients: emailsSent.map(r => r.email)
      });
    } catch (err) {
      console.error('❌ Error sending bilan email:', err);
      return c.json({ error: 'Failed to send email: ' + err.message }, 500);
    }
  });

  // Get all bilan signatures for user (PROTECTED)
  app.get("/make-server-cac859af/bilan-signatures/all", async (c) => {
    
    const { user, error } = await verifyAuthRequest(c.req);
    
    
    if (error || !user) {
      console.error('❌ Auth failed, returning 401');
      return c.json({ error: error || 'Unauthorized' }, 401);
    }


    try {
      const allBilans = await kv.getByPrefix('bilan_signature:');
      
      // Filtrer uniquement ceux de l'utilisateur (exclure les clés "client:")
      const userBilans = allBilans.filter((b: any) => 
        b.value?.userId === user.id && b.value?.token
      );
      
      
      const bilanSignatures = userBilans.map((b: any) => b.value);
      
      
      return c.json({ bilanSignatures });
    } catch (err) {
      console.error('❌ Error fetching all bilan signatures:', err);
      return c.json({ error: 'Failed to fetch bilan signatures: ' + err.message }, 500);
    }
  });

  // Get bilan status by client ID (PUBLIC - no auth)
  app.get("/make-server-cac859af/bilan-signature/status/:clientId", async (c) => {
    try {
      const clientId = c.req.param('clientId');
      
      // Chercher le mapping client -> token
      const clientMapping = await kv.get(`bilan_signature:client:${clientId}`);
      
      if (!clientMapping || !clientMapping.token) {
        return c.json({ bilanSignature: null });
      }
      
      // Récupérer le bilan complet
      const bilanSignature = await kv.get(`bilan_signature:${clientMapping.token}`);
      
      if (!bilanSignature) {
        return c.json({ bilanSignature: null });
      }

      return c.json({ bilanSignature });
    } catch (err) {
      console.error('❌ Error fetching bilan status:', err);
      return c.json({ error: 'Failed to fetch bilan status: ' + err.message }, 500);
    }
  });

  // Delete bilan signature (PROTECTED)
  app.delete("/make-server-cac859af/bilan-signature/:token", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const token = c.req.param('token');
      const bilanSignature = await kv.get(`bilan_signature:${token}`);
      
      if (!bilanSignature) {
        return c.json({ error: 'Bilan not found' }, 404);
      }
      
      // Vérifier que le bilan appartient à l'utilisateur
      if (bilanSignature.userId !== user.id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
      
      // Supprimer le bilan
      await kv.del(`bilan_signature:${token}`);
      await kv.del(`bilan_signature:client:${bilanSignature.clientId}`);
      
      
      return c.json({ success: true });
    } catch (err) {
      console.error('Error deleting bilan signature:', err);
      return c.json({ error: 'Failed to delete bilan signature: ' + err.message }, 500);
    }
  });

  // Get bilan document as HTML (PUBLIC - no auth required)
  app.get("/make-server-cac859af/bilan-document/:token", async (c) => {
    try {
      const token = c.req.param('token');
      
      const bilanSignature = await kv.get(`bilan_signature:${token}`);
      
      if (!bilanSignature) {
        console.error('❌ Bilan non trouvé pour token:', token);
        return c.json({ error: 'Bilan not found' }, 404);
      }

      // Générer le HTML du bilan complet avec signature
      const bilanHTML = generateBilanDocumentHTML(bilanSignature);
      
      // Retourner le HTML directement pour visualisation
      return c.html(bilanHTML);
    } catch (err) {
      console.error('❌ Error fetching bilan document:', err);
      return c.json({ error: 'Failed to fetch bilan document: ' + err.message }, 500);
    }
  });
}

// Fonction pour générer le HTML du bilan patrimonial
function generateBilanDocumentHTML(bilanSignature: any): string {
  const { clientName, bilanData, clientSignedAt, clientSignatureData } = bilanSignature;
  const data = bilanData;
  
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bilan Patrimonial - ${clientName}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #f9fafb;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2 8px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #4F46E5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        h1 {
          color: #4F46E5;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        h2 {
          color: #4F46E5;
          font-size: 20px;
          margin-top: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }
        .info-item {
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }
        .info-label {
          font-weight: bold;
          color: #6b7280;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 5px;
        }
        .info-value {
          font-size: 16px;
          color: #111827;
        }
        .amount {
          font-weight: bold;
          color: #10b981;
          font-size: 18px;
        }
        .signature-section {
          margin-top: 50px;
          padding: 30px;
          background: #f0fdf4;
          border: 2px solid #10b981;
          border-radius: 8px;
          text-align: center;
        }
        .signature-image {
          max-width: 300px;
          margin: 20px auto;
          display: block;
          border: 1px solid #d1d5db;
          background: white;
          padding: 10px;
        }
        .signature-date {
          color: #6b7280;
          font-size: 14px;
          margin-top: 10px;
        }
        .badge {
          display: inline-block;
          padding: 6px 12px;
          background: #10b981;
          color: white;
          border-radius: 999px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 10px;
        }
        @media print {
          body { background: white; padding: 0; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Bilan Patrimonial</h1>
          <p style="color: #6b7280; margin: 10px 0;">${clientName}</p>
          <p style="color: #9ca3af; font-size: 14px;">Document généré le ${new Date(bilanSignature.createdAt).toLocaleDateString('fr-FR')}</p>
        </div>

        <h2> Informations personnelles</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Prénom</div>
            <div class="info-value">${data.clientData?.firstName || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Nom</div>
            <div class="info-value">${data.clientData?.lastName || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date de naissance</div>
            <div class="info-value">${data.clientData?.birthDate ? new Date(data.clientData.birthDate).toLocaleDateString('fr-FR') : '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Téléphone</div>
            <div class="info-value">${data.clientData?.phone || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${data.clientData?.email || '-'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Adresse</div>
            <div class="info-value">${data.clientData?.address || '-'}</div>
          </div>
        </div>

        <h2>💰 Situation patrimoniale</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Patrimoine immobilier</div>
            <div class="amount">${(data.patrimoine?.immobilier || 0).toLocaleString('fr-FR')} €</div>
          </div>
          <div class="info-item">
            <div class="info-label">Patrimoine financier</div>
            <div class="amount">${(data.patrimoine?.financier || 0).toLocaleString('fr-FR')} €</div>
          </div>
          <div class="info-item">
            <div class="info-label">Patrimoine professionnel</div>
            <div class="amount">${(data.patrimoine?.professionnel || 0).toLocaleString('fr-FR')} €</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total patrimoine</div>
            <div class="amount">${((data.patrimoine?.immobilier || 0) + (data.patrimoine?.financier || 0) + (data.patrimoine?.professionnel || 0)).toLocaleString('fr-FR')} €</div>
          </div>
        </div>

        <h2> Revenus et charges</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Revenus annuels</div>
            <div class="info-value">${(data.revenus?.annuels || 0).toLocaleString('fr-FR')} €</div>
          </div>
          <div class="info-item">
            <div class="info-label">Charges mensuelles</div>
            <div class="info-value">${(data.charges?.mensuelles || 0).toLocaleString('fr-FR')} €</div>
          </div>
          <div class="info-item">
            <div class="info-label">Épargne mensuelle</div>
            <div class="info-value">${(data.epargne?.mensuelle || 0).toLocaleString('fr-FR')} €</div>
          </div>
          <div class="info-item">
            <div class="info-label">Taux d'épargne</div>
            <div class="info-value">${data.tauxEpargne || '-'}%</div>
          </div>
        </div>

        ${clientSignedAt ? `
          <div class="signature-section">
            <p style="font-weight: bold; margin: 0 0 10px 0; font-size: 18px;">✅ Document signé électroniquement</p>
            <div class="signature-details" style="margin: 20px 0; padding: 20px; background: white; border: 1px solid #d1d5db; border-radius: 8px;">
              <p style="margin: 5px 0;"><strong>Signé par :</strong> ${clientSignatureData?.prenom || ''} ${clientSignatureData?.nom || ''}</p>
              <p style="margin: 5px 0;"><strong>Email :</strong> ${clientSignatureData?.email || ''}</p>
            </div>
            <div class="signature-date">Signé le ${new Date(clientSignedAt).toLocaleDateString('fr-FR')} à ${new Date(clientSignedAt).toLocaleTimeString('fr-FR')}</div>
            <span class="badge">DOCUMENT SIGNÉ</span>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              La signature électronique a la même valeur juridique qu'une signature manuscrite conformément au règlement eIDAS (UE) n°910/2014.
            </p>
          </div>
        ` : ''}
      </div>
    </body>
    </html>
  `;
}
