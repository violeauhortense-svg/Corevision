// ============================================
// DER ROUTES MODULE - VERSION STORAGE PUBLIC
// ============================================

import type { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";
import { generateDERDocumentHTML } from "./helpers.tsx";
import { supabaseAdminCompat as supabaseAdmin } from "./storage.tsx";

const DER_BUCKET_NAME = 'make-cac859af-der-documents';

// Initialiser le bucket public au démarrage
async function ensureDERBucketExists() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === DER_BUCKET_NAME);
    
    if (!bucketExists) {
      console.log('🪣 Création du bucket DER public...');
      const { data, error } = await supabaseAdmin.storage.createBucket(DER_BUCKET_NAME, {
        public: true, // BUCKET PUBLIC - pas besoin d'auth pour lire
        fileSizeLimit: 5242880, // 5MB
      });
      
      if (error) {
        // Ignorer l'erreur 409 (bucket déjà existant)
        if (error.statusCode === '409' || error.message?.includes('already exists')) {
          console.log('✅ Bucket DER existe déjà (conflit ignoré)');
        } else {
          console.error('❌ Erreur création bucket:', error);
        }
      } else {
        console.log('✅ Bucket DER créé avec succès');
      }
    } else {
      console.log('✅ Bucket DER existe déjà');
    }
  } catch (err) {
    console.error('❌ Erreur initialisation bucket:', err);
  }
}

// Appeler l'initialisation
ensureDERBucketExists();

// Fonction pour générer le contenu textuel du DER
function generateDERTextContent(clientData: any, cgpProfile: any): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  return `
═══════════════════════════════════════════════════════════════════════════════
                        DOCUMENT D'ENTRÉE EN RELATION (DER)
═══════════════════════════════════════════════════════════════════════════════

Document établi le : ${dateStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 INFORMATIONS SUR LE CABINET

Raison sociale : ${cgpProfile?.companyName || 'Cabinet de Conseil'}
Adresse : ${cgpProfile?.companyAddress || ''}
Code postal : ${cgpProfile?.companyPostalCode || ''}
Ville : ${cgpProfile?.companyCity || ''}
Téléphone : ${cgpProfile?.companyPhone || ''}
Email : ${cgpProfile?.companyEmail || ''}
N° ORIAS : ${cgpProfile?.oriasNumber || 'Non renseigné'}
${cgpProfile?.rcs ? `RCS : ${cgpProfile.rcs}` : ''}

Conseiller en charge : ${cgpProfile?.firstName || ''} ${cgpProfile?.lastName || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 INFORMATIONS CLIENT

Nom : ${clientData?.nom || clientData?.lastName || ''}
Prénom : ${clientData?.prenom || clientData?.firstName || ''}
Email : ${clientData?.email || ''}
Téléphone : ${clientData?.telephone || clientData?.phone || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. PRÉSENTATION DU CABINET ET DU CONSEILLER

Notre cabinet est spécialisé dans le conseil en gestion de patrimoine. Nous accompagnons nos clients dans :

– Vous accompagner dans la structuration, l'optimisation et la sécurisation de votre patrimoine.
– Apporter une vision globale et cohérente de vos finances personnelles et professionnelles.
– Vous aider à prendre des décisions éclairées, en fonction de vos objectifs à court, moyen et long terme.
– Proposer des stratégies adaptées, dans un cadre réglementé et transparent.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. OBJET DU PREMIER RENDEZ-VOUS

Ce premier rendez-vous a pour objectif de :

– Échange pour comprendre votre situation, vos priorités et vos attentes.
– Point structuré sur les différents éléments de votre patrimoine (revenus, charges, épargne, investissements, projets).
– Présentation des premières pistes de réflexion et de la méthodologie d'accompagnement, sans engagement à ce stade.

Il s'agit d'une rencontre exploratoire et sans engagement de votre part. À l'issue de cet échange, vous pourrez décider librement de poursuivre ou non notre collaboration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. INFORMATIONS RGLEMENTAIRES

Immatriculation ORIAS
Notre cabinet est immatriculé au registre des intermédiaires en assurance, banque et finance (ORIAS) sous le numéro ${cgpProfile?.oriasNumber || '[à renseigner]'}.
Vous pouvez vérifier notre inscription sur www.orias.fr

Capacité professionnelle
Nous disposons des compétences et habilitations nécessaires pour vous conseiller dans les domaines suivants :
• Placements financiers (assurance-vie, compte-titres, PEA)
• Immobilier et SCPI
• Protection sociale et prévoyance
• Optimisation fiscale et transmission de patrimoine
• Crédit et financement

Responsabilité civile professionnelle
Notre cabinet est couvert par une assurance responsabilité civile professionnelle souscrite auprès d'un assureur agréé.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. RÉMUNÉRATION ET TRANSPARENCE

Notre rémunération peut prendre différentes formes selon les services rendus :
• Honoraires de conseil (facturation directe au client)
• Commissions perçues des compagnies d'assurance ou établissements financiers
• Rétrocessions sur frais de gestion

Le détail de notre rémunération vous sera communiqué avant toute souscription ou engagement de votre part, conformément à la réglementation en vigueur.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5. PROTECTION DES DONNÉES PERSONNELLES (RGPD)

Les informations que vous nous communiquez sont nécessaires à l'analyse de votre situation patrimoniale et à l'élaboration de nos recommandations.

• Responsable du traitement : ${cgpProfile?.companyName || 'Notre Cabinet'}
• Finalité : Conseil en gestion de patrimoine, relation client
• Durée de conservation : Durée de la relation client + 5 ans (obligations légales)
• Droits : Vous disposez d'un droit d'accès, de rectification, d'opposition et d'effacement de vos données

Pour exercer vos droits, vous pouvez nous contacter à l'adresse : ${cgpProfile?.companyEmail || 'contact@cabinet.fr'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

6. LUTTE CONTRE LE BLANCHIMENT ET LE FINANCEMENT DU TERRORISME

Conformément à la réglementation, nous sommes tenus de procéder à la vérification de votre identité et de l'origine de vos fonds.

Nous pourrons vous demander de fournir :
• Une pièce d'identité en cours de validité
• Un justificatif de domicile de moins de 3 mois
• Des justificatifs relatifs à l'origine de vos fonds (bulletins de salaire, avis d'imposition, etc.)

Ces documents sont conservés de manière sécurisée et confidentielle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. ABSENCE DE CONSEIL À CE STADE

Ce premier rendez-vous ne constitue pas une prestation de conseil formalisée. Il s'agit d'une prise de contact destinée à :
• Comprendre vos besoins et vos attentes
• Présenter notre méthodologie et nos services
• Établir une relation de confiance mutuelle

Aucune recommandation d'investissement ou décision patrimoniale ne sera prise lors de ce premier échange.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 MENTIONS LÉGALES

Ce document d'entrée en relation est établi conformément aux articles L. 521-3 et suivants du Code monétaire et financier, ainsi qu'aux dispositions de la directive européenne MIF 2.

Il matérialise le début de notre relation professionnelle et atteste de la communication des informations réglementaires obligatoires.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

En signant ce document, vous attestez avoir pris connaissance de ces informations et acceptez les conditions d'entrée en relation avec notre cabinet.

═══════════════════════════════════════════════════════════════════════════════
                             FIN DU DOCUMENT
═══════════════════════════════════════════════════════════════════════════════
`.trim();
}

export function setupDERRoutes(app: Hono, verifyAuth: Function) {
  
  // Generate DER signature link
  app.post("/make-server-cac859af/generate-der-signature", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const body = await c.req.json();
      const { clientId, clientEmail, clientName, spouseEmail, spouseName, derContent } = body;

      // Générer les tokens
      const clientToken = crypto.randomUUID();
      const spouseToken = spouseEmail && spouseName ? crypto.randomUUID() : null;
      
      const derSignature = {
        id: crypto.randomUUID(),
        clientId,
        userId: user.id,
        createdAt: new Date().toISOString(),
        derContent: derContent || '',
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

      // Sauvegarder avec les deux tokens
      await kv.set(`der_signature:${clientToken}`, { ...derSignature, signerType: 'client' });
      if (spouseToken) {
        await kv.set(`der_signature:${spouseToken}`, { ...derSignature, signerType: 'spouse' });
      }
      await kv.set(`der_signature:client:${clientId}`, derSignature);

      console.log('✅ DER signature tokens générés pour client:', clientId);

      return c.json({ 
        clientToken, 
        spouseToken,
        derSignature 
      }, 201);
    } catch (err) {
      console.error('Error generating DER signature:', err);
      return c.json({ error: 'Failed to generate DER signature: ' + err.message }, 500);
    }
  });

  // Get DER signature by token (PUBLIC)
  app.get("/make-server-cac859af/der-signature/:token", async (c) => {
    try {
      const token = c.req.param('token');
      const derSignature = await kv.get(`der_signature:${token}`);
      
      if (!derSignature) {
        return c.json({ error: 'DER signature not found' }, 404);
      }

      return c.json({ derSignature });
    } catch (err) {
      console.error('Error fetching DER signature:', err);
      return c.json({ error: 'Failed to fetch DER signature: ' + err.message }, 500);
    }
  });

  // Get DER signature by client ID (PROTECTED)
  app.get("/make-server-cac859af/clients/:clientId/der-signature", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      const derSignature = await kv.get(`der_signature:client:${clientId}`);
      
      if (!derSignature) {
        return c.json({ derSignature: null });
      }

      return c.json({ derSignature });
    } catch (err) {
      console.error('Error fetching client DER signature:', err);
      return c.json({ error: 'Failed to fetch DER signature: ' + err.message }, 500);
    }
  });

  // Submit DER signature (PUBLIC)
  app.post("/make-server-cac859af/der-signature/:token", async (c) => {
    try {
      const token = c.req.param('token');
      const body = await c.req.json();
      const { signatureData } = body;

      const derData = await kv.get(`der_signature:${token}`);
      
      if (!derData) {
        return c.json({ error: 'DER signature not found' }, 404);
      }

      const signerType = derData.signerType; // 'client' ou 'spouse'
      
      // Vérifier si déjà signé
      if (signerType === 'client' && derData.clientSigned) {
        return c.json({ error: 'Client has already signed' }, 400);
      }
      if (signerType === 'spouse' && derData.spouseSigned) {
        return c.json({ error: 'Spouse has already signed' }, 400);
      }

      // Récupérer l'enregistrement principal
      const mainDER = await kv.get(`der_signature:client:${derData.clientId}`);
      
      if (!mainDER) {
        return c.json({ error: 'Main DER record not found' }, 404);
      }

      // Mettre à jour la signature - créer un nouvel objet mutable
      const updatedDER: any = {
        ...mainDER,
        clientId: mainDER.clientId,
        userId: mainDER.userId,
        clientToken: mainDER.clientToken,
        spouseToken: mainDER.spouseToken,
        clientSigned: mainDER.clientSigned || false,
        spouseSigned: mainDER.spouseSigned || false,
        clientSignedAt: mainDER.clientSignedAt || null,
        spouseSignedAt: mainDER.spouseSignedAt || null,
        clientSignatureData: mainDER.clientSignatureData || null,
        spouseSignatureData: mainDER.spouseSignatureData || null,
        fullySigned: mainDER.fullySigned || false,
      };
      
      if (signerType === 'client') {
        updatedDER.clientSigned = true;
        updatedDER.clientSignedAt = new Date().toISOString();
        updatedDER.clientSignatureData = signatureData;
      } else if (signerType === 'spouse') {
        updatedDER.spouseSigned = true;
        updatedDER.spouseSignedAt = new Date().toISOString();
        updatedDER.spouseSignatureData = signatureData;
      }

      // Vérifier si tout le monde a signé
      const needsSpouseSignature = updatedDER.spouseToken !== null;
      updatedDER.fullySigned = updatedDER.clientSigned && (!needsSpouseSignature || updatedDER.spouseSigned);

      // Sauvegarder les modifications - créer des objets simples sans méthodes
      await kv.set(`der_signature:${updatedDER.clientToken}`, JSON.parse(JSON.stringify({ ...updatedDER, signerType: 'client' })));
      if (updatedDER.spouseToken) {
        await kv.set(`der_signature:${updatedDER.spouseToken}`, JSON.parse(JSON.stringify({ ...updatedDER, signerType: 'spouse' })));
      }
      await kv.set(`der_signature:client:${updatedDER.clientId}`, JSON.parse(JSON.stringify(updatedDER)));

      // Si tout le monde a signé, valider automatiquement la tâche
      if (updatedDER.fullySigned) {
        console.log('✅ DER complètement signé, validation automatique de la tâche');
        const clientTasks = await kv.getByPrefix(`task:${updatedDER.userId}:${updatedDER.clientId}:`);
        
        for (const task of clientTasks) {
          if (task.title && task.title.toLowerCase().includes('der')) {
            const updatedTask = {
              ...task,
              completed: true,
              completedAt: new Date().toISOString(),
              completedBy: 'all_signatures',
            };
            
            await kv.set(`task:${updatedDER.userId}:${updatedDER.clientId}:${task.id}`, updatedTask);
            console.log('✅ Tâche DER validée automatiquement');
          }
        }
        
        // ✅ NOUVEAU : Enregistrer le DER dans les documents réglementaires du client
        console.log('📋 Enregistrement du DER dans les documents réglementaires...');
        const client = await kv.get(`client:${updatedDER.userId}:${updatedDER.clientId}`);
        
        if (client) {
          // Créer le document réglementaire pour le client
          const clientRegulatoryDoc = {
            id: crypto.randomUUID(),
            type: 'der',
            name: `DER (Document d'Entrée en Relation) - ${updatedDER.clientName}`,
            status: 'signed',
            requiredForStage: 'R0-R1',
            completedDate: updatedDER.clientSignedAt,
            signerType: 'client',
            
            // ✅ Données de signature client
            signedBy: `${updatedDER.clientSignatureData?.prenom || ''} ${updatedDER.clientSignatureData?.nom || ''}`.trim(),
            signedAt: updatedDER.clientSignedAt,
            signatureData: updatedDER.clientSignatureData,
            
            // ✅ Lien vers le document DER complet
            derToken: updatedDER.clientToken,
            documentUrl: `/der-document/${updatedDER.clientToken}`,
            
            // Métadonnées
            createdAt: updatedDER.clientSignedAt,
            clientId: updatedDER.clientId,
            clientName: updatedDER.clientName,
            clientEmail: updatedDER.clientEmail,
            
            // Contenu DER
            derContent: updatedDER.derContent,
          };
          
          // Si conjoint existe et a signé, créer aussi son document
          const regulatoryDocs = [clientRegulatoryDoc];
          
          if (updatedDER.spouseToken && updatedDER.spouseSigned) {
            const spouseRegulatoryDoc = {
              id: crypto.randomUUID(),
              type: 'der',
              name: `DER (Document d'Entrée en Relation) - ${updatedDER.spouseName}`,
              status: 'signed',
              requiredForStage: 'R0-R1',
              completedDate: updatedDER.spouseSignedAt,
              signerType: 'spouse',
              
              // ✅ Données de signature conjoint
              signedBy: `${updatedDER.spouseSignatureData?.prenom || ''} ${updatedDER.spouseSignatureData?.nom || ''}`.trim(),
              signedAt: updatedDER.spouseSignedAt,
              signatureData: updatedDER.spouseSignatureData,
              
              // ✅ Lien vers le document DER complet
              derToken: updatedDER.spouseToken,
              documentUrl: `/der-document/${updatedDER.spouseToken}`,
              
              // Métadonnées
              createdAt: updatedDER.spouseSignedAt,
              clientId: updatedDER.clientId,
              clientName: updatedDER.spouseName,
              clientEmail: updatedDER.spouseEmail,
              
              // Contenu DER
              derContent: updatedDER.derContent,
            };
            
            regulatoryDocs.push(spouseRegulatoryDoc);
          }
          
          // Ajouter aux documents réglementaires du client
          const updatedClient = {
            ...client,
            regulatoryDocs: [
              ...(client.regulatoryDocs || []).filter((doc: any) => {
                // Remplacer les documents DER existants
                return doc.type !== 'der';
              }),
              ...regulatoryDocs
            ],
          };
          
          await kv.set(`client:${updatedDER.userId}:${updatedDER.clientId}`, updatedClient);
          console.log('✅ DER enregistré dans les documents réglementaires');
          console.log('📅 Date de signature client:', updatedDER.clientSignedAt);
          if (updatedDER.spouseSigned) {
            console.log('📅 Date de signature conjoint:', updatedDER.spouseSignedAt);
          }
        } else {
          console.warn('⚠️ Client non trouvé, impossible d\'enregistrer le DER dans les documents réglementaires');
        }
      }
      
      return c.json({ derSignature: updatedDER });
    } catch (err) {
      console.error('Error submitting DER signature:', err);
      return c.json({ error: 'Failed to submit DER signature: ' + err.message }, 500);
    }
  });

  // Get all DER signatures for user (PROTECTED)
  app.get("/make-server-cac859af/der-signatures", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const allDers = await kv.getByPrefix(`der_signature:client:`);
      const userDers = allDers.filter((der: any) => der.userId === user.id);
      
      return c.json({ derSignatures: userDers });
    } catch (err) {
      console.error('Error fetching all DER signatures:', err);
      return c.json({ error: 'Failed to fetch DER signatures: ' + err.message }, 500);
    }
  });

  // Delete DER signature (PROTECTED)
  app.delete("/make-server-cac859af/der-signature/:token", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const token = c.req.param('token');
      const derSignature = await kv.get(`der_signature:${token}`);
      
      if (!derSignature) {
        return c.json({ error: 'DER not found' }, 404);
      }
      
      if (derSignature.userId !== user.id) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
      
      await kv.del(`der_signature:${token}`);
      await kv.del(`der_signature:client:${derSignature.clientId}`);
      
      console.log(`✅ DER supprimé pour le client ${derSignature.clientId}`);
      
      return c.json({ success: true });
    } catch (err) {
      console.error('Error deleting DER signature:', err);
      return c.json({ error: 'Failed to delete DER signature: ' + err.message }, 500);
    }
  });

  // Get DER document as HTML (PUBLIC)
  app.get("/make-server-cac859af/der-document/:token", async (c) => {
    console.log(' GET /der-document/:token - Route appelée');
    try {
      const token = c.req.param('token');
      console.log('🔑 Token reçu:', token);
      
      const derSignature = await kv.get(`der_signature:${token}`);
      console.log('📦 DER trouvé:', !!derSignature);
      
      if (!derSignature) {
        console.error('❌ DER non trouvé pour token:', token);
        return c.json({ error: 'DER not found' }, 404);
      }

      console.log('✅ Génération du HTML pour:', derSignature.clientName);
      const derHTML = generateDERDocumentHTML(derSignature);
      
      return c.html(derHTML);
    } catch (err) {
      console.error('❌ Error fetching DER document:', err);
      return c.json({ error: 'Failed to fetch DER document: ' + err.message }, 500);
    }
  });

  // Preview DER document for client (PROTECTED)
  app.get("/make-server-cac859af/clients/:clientId/der/preview", async (c) => {
    const { user, error } = await verifyAuthRequest(c.req);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    try {
      const clientId = c.req.param('clientId');
      
      // Récupérer les infos du client
      const client = await kv.get(`client:${user.id}:${clientId}`);
      if (!client) {
        return c.json({ error: 'Client not found' }, 404);
      }

      // Récupérer les infos du profil CGP
      const profile = await kv.get(`profile:${user.id}`);
      if (!profile) {
        return c.json({ error: 'Profile not found' }, 404);
      }

      // Créer un objet temporaire pour la prévisualisation
      const previewData = {
        clientName: `${client.prenom} ${client.nom}`,
        clientEmail: client.email,
        spouseName: client.spouseName || null,
        spouseEmail: client.spouseEmail || null,
        derContent: '', // Peut être ajouté si besoin
        // Infos du CGP depuis le profil
        cgpName: `${profile.firstName} ${profile.lastName}`,
        companyName: profile.companyName || '',
        companyAddress: profile.companyAddress || '',
        companyPostalCode: profile.companyPostalCode || '',
        companyCity: profile.companyCity || '',
        companyPhone: profile.companyPhone || '',
        companyEmail: profile.companyEmail || '',
      };

      const derHTML = generateDERDocumentHTML(previewData);
      
      return c.html(derHTML);
    } catch (err) {
      console.error('Error generating DER preview:', err);
      return c.json({ error: 'Failed to generate DER preview: ' + err.message }, 500);
    }
  });

  // Generate DER link for specific client (PROTECTED)
  app.post("/make-server-cac859af/clients/:clientId/der/generate-link", async (c) => {
    // ⚠️ NOTE: Cette route accepte publicAnonKey en mode localStorage
    // L'authentification est optionnelle pour permettre le fonctionnement en mode localStorage
    const authHeader = c.req.header('Authorization');
    let userId = 'default'; // Fallback en mode localStorage
    
    // Tenter l'authentification si un header est fourni
    if (authHeader && !authHeader.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNldnpscWRlbmNuY3JpaXNyb2JmIiwicm9sZSI6ImFub24i')) {
      const { user, error } = await verifyAuth(authHeader);
      if (user) {
        userId = user.id;
      }
    } else {
      // Mode localStorage : utiliser l'userId depuis localStorage (géré côté client)
      // On récupère l'userId depuis le clientId stocké
      const clientId = c.req.param('clientId');
      const existingClient = await kv.get(`client:default:${clientId}`);
      if (existingClient) {
        userId = 'default';
      }
    }

    try {
      const clientId = c.req.param('clientId');
      const body = await c.req.json();
      const { clientName, clientEmail, spouseName, spouseEmail } = body;

      console.log('🔐 Génération lien DER pour client:', clientId, 'userId:', userId);

      // Vérifier si un DER existe déjà pour ce client
      const existingDER = await kv.get(`der_signature:client:${clientId}`);
      if (existingDER) {
        console.log('✅ DER existant trouvé, retour du lien existant');
        // Retourner le lien existant avec le bon format (query params)
        // IMPORTANT : Utiliser l'URL de production, pas l'URL de preview iframe
        const baseUrl = Deno.env.get('APP_URL') || 'https://jaw-karate-78155897.figma.site';
        return c.json({
          signatureUrl: `${baseUrl}?page=sign-der&token=${existingDER.clientToken}`,
          spouseSignatureUrl: existingDER.spouseToken ? `${baseUrl}?page=sign-der&token=${existingDER.spouseToken}` : null,
        });
      }

      // Générer les tokens
      const clientToken = crypto.randomUUID();
      const spouseToken = spouseEmail && spouseName ? crypto.randomUUID() : null;
      
      // Récupérer les infos du client et du CGP pour générer le contenu du DER
      let derContent = '';
      try {
        const client = await kv.get(`client:${userId}:${clientId}`);
        const cgpProfile = await kv.get(`profile:${userId}`);
        
        if (client && cgpProfile) {
          derContent = generateDERTextContent(client, cgpProfile);
          console.log('✅ Contenu DER généré:', derContent.length, 'caractères');
        } else {
          console.warn('⚠️ Client ou profil CGP non trouvé, DER sans contenu');
        }
      } catch (err) {
        console.error('❌ Erreur génération contenu DER:', err);
      }
      
      const derSignature = {
        id: crypto.randomUUID(),
        clientId,
        userId: userId,
        createdAt: new Date().toISOString(),
        derContent: derContent, // Contenu textuel du DER
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

      // Sauvegarder avec les deux tokens
      await kv.set(`der_signature:${clientToken}`, { ...derSignature, signerType: 'client' });
      if (spouseToken) {
        await kv.set(`der_signature:${spouseToken}`, { ...derSignature, signerType: 'spouse' });
      }
      await kv.set(`der_signature:client:${clientId}`, derSignature);

      console.log('✅ DER signature link generated for client:', clientId);

      // Construire les URLs de signature avec le bon format (query params)
      // Format attendu par App.tsx : ?page=sign-der&token=xxx
      // IMPORTANT : Utiliser l'URL de production, pas l'URL de preview iframe
      const baseUrl = Deno.env.get('APP_URL') || 'https://jaw-karate-78155897.figma.site';
      
      return c.json({
        signatureUrl: `${baseUrl}?page=sign-der&token=${clientToken}`,
        spouseSignatureUrl: spouseToken ? `${baseUrl}?page=sign-der&token=${spouseToken}` : null,
      });
    } catch (err) {
      console.error('Error generating DER link:', err);
      return c.json({ error: 'Failed to generate DER link: ' + err.message }, 500);
    }
  });
}
