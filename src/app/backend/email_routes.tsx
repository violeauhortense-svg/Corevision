// ============================================
// EMAIL ROUTES MODULE
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { getEmailService, wrapEmailHtml, type EmailMessage } from "./emailService.ts";

// Helper: Send DER signature email
async function sendDERSignatureEmail(params: {
  clientId: string;
  clientEmail: string;
  clientName: string;
  signatureLink: string;
  spouseEmail?: string | null;
  spouseName?: string | null;
  spouseSignatureLink?: string | null;
  conseillerName: string;
  conseillerEmail: string;
}) {
  const {
    clientId,
    clientEmail,
    clientName,
    signatureLink,
    spouseEmail,
    spouseName,
    spouseSignatureLink,
    conseillerName,
    conseillerEmail,
  } = params;

  const generateEmailHTML = (recipientName: string, link: string, hasSpouse: boolean, isSpouse: boolean) => {
    const spouseNote = hasSpouse
      ? (isSpouse
        ? `<p style="font-size: 14px; color: #6b7280;"><strong>Note :</strong> Votre conjoint(e) ${clientName} a également reçu un email avec son propre lien de signature.</p>`
        : `<p style="font-size: 14px; color: #6b7280;"><strong>Note :</strong> Votre conjoint(e) ${spouseName} recevra également un email avec son propre lien de signature.</p>`)
      : '';

    return `
      <div style="max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0;">✍️ Signature du Document d'Entrée en Relation (DER)</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Bonjour <strong>${recipientName}</strong>,</p>

          <p>Votre conseiller <strong>${conseillerName || 'votre conseiller'}</strong> vous invite à signer électroniquement votre Document d'Entrée en Relation.</p>

          <p>Ce document est nécessaire pour :</p>
          <ul>
            <li>Formaliser notre collaboration</li>
            <li>Respecter les obligations réglementaires</li>
            <li>Débuter votre suivi patrimonial</li>
          </ul>

          <div style="text-align: center;">
            <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold;">
              ✍️ Signer le DER électroniquement
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            <em>La signature prend moins de 2 minutes. Le document est sécurisé et confidentiel.</em>
          </p>
          ${spouseNote}
        </div>
      </div>
    `;
  };

  const emailService = getEmailService();
  const replyToEmail = conseillerEmail || 'contact@cvh-patrimoine.com';
  const replyToName = conseillerName || 'Votre Conseiller';

  // Send email to client
  const clientEmailHtml = generateEmailHTML(clientName, signatureLink, !!spouseEmail, false);

  await emailService.sendEmail({
    to: clientEmail,
    subject: `Signature du DER - ${conseillerName || 'Votre Conseiller'}`,
    htmlContent: wrapEmailHtml(clientEmailHtml),
    replyTo: { email: replyToEmail, name: replyToName },
    from: { email: 'contact@cvh-patrimoine.com', name: 'CRM-CoreVision' },
  });


  // Send email to spouse if present
  if (spouseEmail && spouseName && spouseSignatureLink) {

    const spouseEmailHtml = generateEmailHTML(spouseName, spouseSignatureLink, true, true);

    await emailService.sendEmail({
      to: spouseEmail,
      subject: `Signature du DER - ${conseillerName || 'Votre Conseiller'}`,
      htmlContent: wrapEmailHtml(spouseEmailHtml),
      replyTo: { email: replyToEmail, name: replyToName },
      from: { email: 'contact@cvh-patrimoine.com', name: 'CRM-CoreVision' },
    }).catch(err => {
      console.error('⚠️ Erreur envoi email conjoint (non bloquant):', err);
    });

  }

  // Mettre à jour le statut d'envoi
  const clientToken = signatureLink.split('token=').pop();
  const derSig = await kv.get(`der_signature:client:${clientId}`);
  if (derSig) {
    derSig.sentAt = new Date().toISOString();
    await kv.set(`der_signature:${clientToken}`, { ...derSig, signerType: 'client' });
    if (spouseSignatureLink) {
      const spouseToken = spouseSignatureLink.split('token=').pop();
      await kv.set(`der_signature:${spouseToken}`, { ...derSig, signerType: 'spouse' });
    }
    await kv.set(`der_signature:client:${clientId}`, derSig);
  }
}

export function setupEmailRoutes(app: Hono, verifyAuth: Function) {
  
  // Send presentation email
  app.post("/make-server-cac859af/send-presentation-email", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      const { 
        clientId,
        clientEmail, 
        clientName, 
        emailContent,
        emailType,
        conseillerName, 
        conseillerEmail, 
        conseillerPhone,
        clientData,
        cgpProfile,
        derFullContent,
        derToken,
        appUrl,
        spouseEmail,
        spouseName
      } = body;

      console.log('  - Client Email:', clientEmail);
      console.log('  - Client Name:', clientName);
      console.log('  - Spouse Email:', spouseEmail);
      console.log('  - Spouse Name:', spouseName);
      console.log('  - Email Type:', emailType);
      console.log('  - Client ID:', clientId);
      
      if (!clientEmail) {
        return c.json({ error: 'Client email not provided' }, 400);
      }

      if (!emailContent) {
        return c.json({ error: 'Email content not provided' }, 400);
      }

      // Générer un token DER si c'est un email de présentation
      let finalEmailContent = emailContent;
      if (emailType === 'presentation' && clientId) {
        
        const clientToken = derToken || crypto.randomUUID();
        const spouseToken = spouseEmail && spouseName ? crypto.randomUUID() : null;
        
        const derSignature = {
          id: crypto.randomUUID(),
          clientId,
          userId: user.id,
          createdAt: new Date().toISOString(),
          derContent: JSON.stringify({ clientData, cgpProfile }),
          derFullContent: derFullContent || '',
          // Client
          clientToken,
          clientEmail,
          clientName,
          clientSigned: false,
          clientSignedAt: null,
          clientSignatureData: null,
          // Conjoint (optionnel)
          spouseToken,
          spouseEmail: spouseEmail || null,
          spouseName: spouseName || null,
          spouseSigned: false,
          spouseSignedAt: null,
          spouseSignatureData: null,
          // Status global
          fullySigned: false,
        };

        await kv.set(`der_signature:${clientToken}`, { ...derSignature, signerType: 'client' });
        if (spouseToken) {
          await kv.set(`der_signature:${spouseToken}`, { ...derSignature, signerType: 'spouse' });
        }
        await kv.set(`der_signature:client:${clientId}`, derSignature);
        
        const finalAppUrl = appUrl || Deno.env.get('APP_URL') || 'http://localhost:5173';
        const clientSignatureLink = `${finalAppUrl}?page=sign-der&token=${clientToken}`;
        const spouseSignatureLink = spouseToken ? `${finalAppUrl}?page=sign-der&token=${spouseToken}` : null;
        
        const regexHash = /https?:\/\/[^\s]+[#].*sign[_-]?der[\/=][^\s&]+/g;
        const regexQuery = /https?:\/\/[^\s]+[?].*page=sign-der.*token=[^\s&]+/g;
        finalEmailContent = emailContent.replace(regexHash, clientSignatureLink).replace(regexQuery, clientSignatureLink);
        
      }

      const emailService = getEmailService();


      let htmlContent = finalEmailContent.replace(/\n/g, '<br>');

      htmlContent = htmlContent.replace(
        /(https?:\/\/[^\s<]+\/#\/sign-der\/[^\s<]+)/g,
        '<div style="text-align: center; margin: 20px 0;"><a href="$1" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">✍️ Visualiser et Signer le DER</a></div>'
      );

      const subject = emailType === 'presentation'
        ? `Rendez-vous avec ${conseillerName || 'votre conseiller'}`
        : `Confirmation de rendez-vous - ${conseillerName || 'Votre conseiller'}`;

      const replyToEmail = conseillerEmail || 'contact@cvh-patrimoine.com';
      const replyToName = conseillerName || 'Votre Conseiller';

      // Send to client
      const clientResult = await emailService.sendEmail({
        to: clientEmail,
        subject: subject,
        htmlContent: wrapEmailHtml(htmlContent),
        replyTo: { email: replyToEmail, name: replyToName },
        from: { email: 'contact@cvh-patrimoine.com', name: 'CRM-CoreVision' },
      });


      let spouseEmailSentTo: string | null = null;

      // Send to spouse if applicable
      if (emailType === 'presentation' && clientId && spouseEmail && spouseName) {

        const derSig = await kv.get(`der_signature:client:${clientId}`);

        if (derSig && derSig.spouseToken) {
          const finalAppUrl = appUrl || Deno.env.get('APP_URL') || 'http://localhost:5173';
          const spouseSignatureLink = `${finalAppUrl}?page=sign-der&token=${derSig.spouseToken}`;

          console.log('  - spouseEmail:', spouseEmail);
          console.log('  - spouseSignatureLink:', spouseSignatureLink);

          // Replace client link with spouse link
          let spouseEmailContent = finalEmailContent;
          const regexHash = /https?:\/\/[^\s]+[#].*sign[_-]?der[\/=][^\s&]+/g;
          const regexQuery = /https?:\/\/[^\s]+[?].*page=sign-der.*token=[^\s&]+/g;
          spouseEmailContent = spouseEmailContent.replace(regexHash, spouseSignatureLink).replace(regexQuery, spouseSignatureLink);

          let spouseHtmlContent = spouseEmailContent.replace(/\n/g, '<br>');
          spouseHtmlContent = spouseHtmlContent.replace(
            /(https?:\/\/[^\s<]+\/#\/sign-der\/[^\s<]+)/g,
            '<div style="text-align: center; margin: 20px 0;"><a href="$1" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">✍️ Visualiser et Signer le DER</a></div>'
          );

          await emailService.sendEmail({
            to: spouseEmail,
            subject: subject,
            htmlContent: wrapEmailHtml(spouseHtmlContent),
            replyTo: { email: replyToEmail, name: replyToName },
            from: { email: 'contact@cvh-patrimoine.com', name: 'CRM-CoreVision' },
          }).catch(err => {
            console.error('⚠️ Erreur envoi email au conjoint:', err);
          });

          spouseEmailSentTo = spouseEmail;
        } else {
          console.error('❌ spouseToken manquant dans derSig');
        }
      }

      return c.json({
        success: true,
        emailSentTo: clientEmail,
        spouseEmailSentTo: spouseEmailSentTo,
        mode: 'email-service',
      });
    } catch (err) {
      console.error('❌ Error sending presentation email:', err);
      return c.json({ error: 'Failed to send email: ' + err.message }, 500);
    }
  });

  // Send meeting confirmation email with DER link
  app.post("/make-server-cac859af/send-email", async (c) => {
    
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      console.error('❌ Auth error:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      const { 
        to,
        subject,
        htmlContent,
        clientId,
        emailType
      } = body;

      console.log('  - Destinataire:', to);
      console.log('  - Sujet:', subject);
      console.log('  - Type:', emailType);
      console.log('  - Client ID:', clientId);
      console.log('  - Body complet:', JSON.stringify(body, null, 2));
      
      if (!to || to.trim() === '') {
        console.error('❌ Email destinataire manquant ou vide!');
        console.error('   Body reçu:', JSON.stringify(body, null, 2));
        return c.json({ 
          error: 'Email destinataire non fourni',
          debug: {
            received_to: to,
            body_keys: Object.keys(body),
          }
        }, 400);
      }

      if (!htmlContent) {
        return c.json({ error: 'Contenu email non fourni' }, 400);
      }

      // Récupérer les infos du profil CGP pour le reply-to
      const profile = await kv.get(`profile:${user.id}`);
      const replyToEmail = profile?.companyEmail || 'contact@cvh-patrimoine.com';
      const replyToName = profile ? `${profile.firstName} ${profile.lastName}` : 'Votre Conseiller';

      const emailService = getEmailService();


      await emailService.sendEmail({
        to: to,
        subject: subject || 'Message de votre conseiller',
        htmlContent: wrapEmailHtml(htmlContent),
        replyTo: { email: replyToEmail, name: replyToName },
        from: { email: 'contact@cvh-patrimoine.com', name: 'CRM-CoreVision' },
      });


      return c.json({
        success: true,
        emailSentTo: to,
        mode: 'email-service',
      });
    } catch (err) {
      console.error('❌ Error sending email:', err);
      return c.json({ error: 'Failed to send email: ' + err.message }, 500);
    }
  });
}
