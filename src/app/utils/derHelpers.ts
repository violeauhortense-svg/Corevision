// ============================================
// HELPERS POUR LA GÉNÉRATION ET GESTION DER
// ============================================

import { supabase } from './api/client';
import { clientAPI } from '../services/api';
import { apiBaseUrl, publicAnonKey } from './api/info';

/**
 * Helper pour récupérer l'userId depuis la session Supabase
 */
export async function getUserId(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }
    
    // Fallback: essayer localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.id) return user.id;
    }
    
    // Par défaut
    return 'default';
  } catch (error) {
    console.error('? Erreur récupération userId:', error);
    return 'default';
  }
}

interface SpouseInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  birthDate?: string;
  profession?: string;
}

interface ClientFullData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  maritalStatus?: string;
  spouse?: SpouseInfo;
}

interface DERGenerationResult {
  clientLink: string;
  clientToken: string;
  spouseLink?: string;
  spouseToken?: string;
  hasSpouse: boolean;
}

/**
 * Charge les données complètes du client incluant les infos du conjoint
 */
export async function loadClientWithSpouse(clientId: string): Promise<ClientFullData | null> {
  try {
    const clientData = await clientAPI.getById(clientId);
    
    // Vérifier si le client a un conjoint avec email
    const hasSpouse = 
      clientData.maritalStatus === 'Marié(e)' || 
      clientData.maritalStatus === 'Pacsé(e)';
    
    const spouseHasEmail = hasSpouse && clientData.spouse?.email;
    
    return {
      ...clientData,
      spouse: spouseHasEmail ? clientData.spouse : undefined,
    };
  } catch (error) {
    console.error('? Erreur chargement client avec conjoint:', error);
    return null;
  }
}

/**
 * Génère les liens DER pour le client et le conjoint (si existe)
 */
export async function generateDERLinksForCouple(
  clientData: ClientFullData,
  cabinetInfo: any
): Promise<DERGenerationResult | null> {
  try {
    const hasSpouse = !!clientData.spouse?.email;
    
    // 1. Générer le lien pour le client
    console.log('?? Génération du lien DER pour le client:', clientData.prenom, clientData.nom);
    
    const clientResponse = await fetch(
      `${apiBaseUrl}/clients/${clientData.id}/der/generate-link`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: `${clientData.prenom} ${clientData.nom}`,
          clientEmail: clientData.email,
        }),
      }
    );
    
    if (!clientResponse.ok) {
      throw new Error('Échec génération lien client');
    }
    
    const clientLinkData = await clientResponse.json();
    const clientToken = clientLinkData.signatureUrl.match(/[?&]token=([^&]+)/)?.[1];
    
    if (!clientToken) {
      throw new Error('Token client non extrait');
    }
    
    // Générer le contenu DER
    const derContent = generateDERContent(clientData, cabinetInfo);
    
    // Stocker les données du client dans localStorage
    const clientDERData = {
      clientId: clientData.id, // ? Ajouter le clientId
      clientName: `${clientData.prenom} ${clientData.nom}`,
      clientEmail: clientData.email,
      spouseName: hasSpouse ? `${clientData.spouse.firstName} ${clientData.spouse.lastName}` : null,
      spouseEmail: hasSpouse ? clientData.spouse.email : null,
      signerType: 'client',
      clientSigned: false,
      spouseSigned: false,
      hasSpouse: hasSpouse, // ? Ajouter le flag hasSpouse
      createdAt: new Date().toISOString(),
      derContent: derContent,
    };
    
    localStorage.setItem(`der_token_${clientToken}`, JSON.stringify(clientDERData));
    console.log('? Données DER client stockées dans localStorage');
    
    const result: DERGenerationResult = {
      clientLink: clientLinkData.signatureUrl,
      clientToken: clientToken,
      hasSpouse: hasSpouse,
    };
    
    // 2. Si conjoint existe, générer son lien
    if (hasSpouse && clientData.spouse) {
      console.log('?? Génération du lien DER pour le conjoint:', clientData.spouse.firstName);
      
      const spouseResponse = await fetch(
        `${apiBaseUrl}/clients/${clientData.id}/der/generate-link`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientName: `${clientData.spouse.firstName} ${clientData.spouse.lastName}`,
            clientEmail: clientData.spouse.email,
          }),
        }
      );
      
      if (spouseResponse.ok) {
        const spouseLinkData = await spouseResponse.json();
        const spouseToken = spouseLinkData.signatureUrl.match(/[?&]token=([^&]+)/)?.[1];
        
        if (spouseToken) {
          // Stocker les données du conjoint dans localStorage
          const spouseDERData = {
            clientId: clientData.id, // ? Ajouter le clientId
            clientName: `${clientData.prenom} ${clientData.nom}`,
            clientEmail: clientData.email,
            spouseName: `${clientData.spouse.firstName} ${clientData.spouse.lastName}`,
            spouseEmail: clientData.spouse.email,
            signerType: 'spouse',
            clientSigned: false,
            spouseSigned: false,
            hasSpouse: hasSpouse, // ? Ajouter le flag hasSpouse
            createdAt: new Date().toISOString(),
            derContent: derContent,
          };
          
          localStorage.setItem(`der_token_${spouseToken}`, JSON.stringify(spouseDERData));
          console.log('? Données DER conjoint stockées dans localStorage');
          
          result.spouseLink = spouseLinkData.signatureUrl;
          result.spouseToken = spouseToken;
        }
      } else {
        console.warn('?? Échec génération lien conjoint, continue sans');
      }
    }
    
    return result;
  } catch (error) {
    console.error('? Erreur génération liens DER:', error);
    return null;
  }
}

/**
 * Génère le contenu HTML du DER
 */
function generateDERContent(clientData: ClientFullData, cabinetInfo: any): string {
  return `
----------------------------------------------------------??--------------------
                        DOCUMENT D'ENTRÉE EN RELATION (DER)
-------------------------------------------------------------------------------

Document établi le : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

?????????????????????????????????????????????????????????????????????????

?? INFORMATIONS SUR LE CABINET

Raison sociale : ${cabinetInfo?.companyName || 'Cabinet de Conseil'}
Adresse : ${cabinetInfo?.companyAddress || ''}
Code postal : ${cabinetInfo?.companyPostalCode || ''}
Ville : ${cabinetInfo?.companyCity || ''}
Téléphone : ${cabinetInfo?.companyPhone || ''}
Email : ${cabinetInfo?.companyEmail || ''}
N° ORIAS : ${cabinetInfo?.oriasNumber || 'Non renseigné'}

Conseiller en charge : ${cabinetInfo?.firstName || ''} ${cabinetInfo?.lastName || ''}

???????????????????????????????????????????????????????????????????????????

?? INFORMATIONS CLIENT

Nom : ${clientData.nom}
Prénom : ${clientData.prenom}
Email : ${clientData.email}
Téléphone : ${clientData.telephone || 'Non renseigné'}

${clientData.spouse ? `
?? CONJOINT

Nom : ${clientData.spouse.lastName || ''}
Prénom : ${clientData.spouse.firstName || ''}
Email : ${clientData.spouse.email || ''}
` : ''}

???????????????????????????????????????????????????????????????????????????

1. PRÉSENTATION DU CABINET ET DU CONSEILLER

Notre cabinet est spécialisé dans le conseil en gestion de patrimoine. Nous accompagnons nos clients dans :

• Vous accompagner dans la structuration, l'optimisation et la sécurisation de votre patrimoine.
• Apporter une vision globale et cohérente de vos finances personnelles et professionnelles.
• Vous aider à prendre des décisions éclairées, en fonction de vos objectifs à court, moyen et long terme.
• Proposer des stratégies adaptées, dans un cadre réglementé et transparent.

???????????????????????????????????????????????????????????????????????????

2. OBJET DU PREMIER RENDEZ-VOUS

Ce premier rendez-vous a pour objectif de :

• Échange pour comprendre votre situation, vos priorités et vos attentes.
• Point structuré sur les différents éléments de votre patrimoine (revenus, charges, épargne, investissements, projets).
• Présentation des premières pistes de réflexion et de la méthodologie d'accompagnement, sans engagement à ce stade.

Il s'agit d'une rencontre exploratoire et sans engagement de votre part. À l'issue de cet échange, vous pourrez décider librement de poursuivre ou non notre collaboration.

???????????????????????????????????????????????????????????????????????????

3. INFORMATIONS RÉGLEMENTAIRES

Immatriculation ORIAS
Notre cabinet est immatriculé au registre des intermédiaires en assurance, banque et finance (ORIAS) sous le numéro ${cabinetInfo?.oriasNumber || '[à renseigner]'}.
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

??????????????????????????????????????????????????????????????????????

4. RÉMUNÉRATION ET TRANSPARENCE

Notre rémunération peut prendre différentes formes selon les services rendus :
• Honoraires de conseil (facturation directe au client)
• Commissions perçues des compagnies d'assurance ou établissements financiers
• Rétrocessions sur frais de gestion

Le détail de notre rémunération vous sera communiqué avant toute souscription ou engagement de votre part, conformément à la réglementation en vigueur.

???????????????????????????????????????????????????????????????????????????

5. PROTECTION DES DONNÉES PERSONNELLES (RGPD)

Les informations que vous nous communiquez sont nécessaires à l'analyse de votre situation patrimoniale et à l'élaboration de nos recommandations.

• Responsable du traitement : ${cabinetInfo?.companyName || 'Notre Cabinet'}
• Finalité : Conseil en gestion de patrimoine, relation client
• Durée de conservation : Durée de la relation client + 5 ans (obligations légales)
• Droits : Vous disposez d'un droit d'accès, de rectification, d'opposition et d'effacement de vos données

Pour exercer vos droits, vous pouvez nous contacter à l'adresse : ${cabinetInfo?.companyEmail || 'contact@cabinet.fr'}

???????????????????????????????????????????????????????????????????????????

6. LUTTE CONTRE LE BLANCHIMENT ET LE FINANCEMENT DU TERRORISME

Conformément à la réglementation, nous sommes tenus de procéder à la vérification de votre identité et de l'origine de vos fonds.

Nous pourrons vous demander de fournir :
• Une pièce d'identité en cours de validité
• Un justificatif de domicile de moins de 3 mois
• Des justificatifs relatifs à l'origine de vos fonds (bulletins de salaire, avis d'imposition, etc.)

Ces documents sont conservés de manière sécurisée et confidentielle.

???????????????????????????????????????????????????????????????????????????

7. ABSENCE DE CONSEIL À CE STADE

Ce premier rendez-vous ne constitue pas une prestation de conseil formalisée. Il s'agit d'une prise de contact destinée à :
• Comprendre vos besoins et vos attentes
• Présenter notre méthodologie et nos services
• ??tablir une relation de confiance mutuelle

Aucune recommandation d'investissement ou décision patrimoniale ne sera prise lors de ce premier échange.

???????????????????????????????????????????????????????????????????????????

?? MENTIONS LÉGALES

Ce document d'entrée en relation est établi conformément aux articles L. 521-3 et suivants du Code monétaire et financier, ainsi qu'aux dispositions de la directive européenne MIF 2.

Il matérialise le début de notre relation professionnelle et atteste de la communication des informations réglementaires obligatoires.

???????????????????????????????????????????????????????????????????????????

En signant ce document, vous attestez avoir pris connaissance de ces informations et acceptez les conditions d'entrée en relation avec notre cabinet.

-------------------------------------------------------------------------------
                             FIN DU DOCUMENT
---------------------------------------------------------------------------
  `.trim();
}

/**
 * Met à jour le statut de la tâche avec les informations de suivi DER
 */
export async function updateTaskWithDERStatus(
  taskId: string,
  status: 'email_sent' | 'client_signed' | 'spouse_signed' | 'all_signed',
  additionalData?: {
    emailSentDate?: string;
    clientSignedDate?: string;
    spouseSignedDate?: string;
    emailHistory?: any[]; // ? Nouveau : historique des emails
  },
  clientId?: string // ? Nouveau : clientId optionnel pour trouver les bonnes tâches
): Promise<boolean> {
  try {
    // Récupérer la tâche actuelle depuis localStorage
    const userId = await getUserId();
    
    // ? CORRECTION : Essayer plusieurs emplacements de stockage
    const possibleKeys = [];
    
    if (clientId) {
      possibleKeys.push(`client_tasks_${userId}_${clientId}`);
    }
    possibleKeys.push(`tasks_${userId}`);
    
    let storedTasks = null;
    let tasksKey = '';
    
    // Essayer chaque clé jusqu'à en trouver une qui fonctionne
    for (const key of possibleKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        storedTasks = data;
        tasksKey = key;
        break;
      }
    }
    
    if (!storedTasks) {
      console.error('? ERREUR: Aucune tâche trouvée dans localStorage');
      console.error('   Clés essayées:', possibleKeys);
      console.error('   TaskId recherché:', taskId);
      console.error('   ClientId:', clientId);
      
      // ?? Au lieu de retourner false, émettre un événement pour forcer le rechargement
      return false;
    }
    
    const tasks = JSON.parse(storedTasks);
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    
    if (taskIndex === -1) {
      console.error('?? Tâche non trouvée:', taskId);
      console.error('   Tâches disponibles:', tasks.map((t: any) => ({ id: t.id, title: t.title || t.titre })));
      return false;
    }
    
    const task = tasks[taskIndex];
    
    // Mettre à jour selon le statut
    switch (status) {
      case 'email_sent':
        // ? Initialiser derStatus avec hasSpouse si fourni dans additionalData
        task.derStatus = {
          emailSent: true,
          emailSentDate: additionalData?.emailSentDate || new Date().toISOString(),
          clientSigned: false,
          spouseSigned: false,
          hasSpouse: task.derStatus?.hasSpouse || false, // ? Conserver le flag hasSpouse
        };
        
        // ? Ajouter l'historique des emails
        if (additionalData?.emailHistory) {
          task.emailHistory = additionalData.emailHistory;
        }
        
        task.description = `?? Email envoyé le ${new Date(additionalData?.emailSentDate || new Date()).toLocaleDateString('fr-FR')}`;
        // ? CORRECTION : La tâche reste "en_cours", elle n'est JAMAIS terminée à ce stade
        task.statut = 'en_cours';
        task.completed = false; // ? Forcer completed à false
        break;
        
      case 'client_signed':
        task.derStatus = {
          ...task.derStatus,
          clientSigned: true,
          clientSignedDate: additionalData?.clientSignedDate || new Date().toISOString(),
        };
        task.description = `? Signé par le client le ${new Date(additionalData?.clientSignedDate || new Date()).toLocaleDateString('fr-FR')}`;
        
        // ? Valider la tâche UNIQUEMENT si pas de conjoint OU si conjoint a déjà signé
        if (!task.derStatus.hasSpouse || task.derStatus.spouseSigned) {
          task.statut = 'terminée';
          task.completed = true;
        } else {
          task.statut = 'en_cours';
        }
        break;
        
      case 'spouse_signed':
        task.derStatus = {
          ...task.derStatus,
          spouseSigned: true,
          spouseSignedDate: additionalData?.spouseSignedDate || new Date().toISOString(),
        };
        task.description = `? Signé par le conjoint le ${new Date(additionalData?.spouseSignedDate || new Date()).toLocaleDateString('fr-FR')}`;
        
        // ? Valider la tâche UNIQUEMENT si client a déjà signé
        if (task.derStatus.clientSigned) {
          task.statut = 'terminée';
          task.completed = true;
        } else {
          task.statut = 'en_cours';
        }
        break;
        
      case 'all_signed':
        task.derStatus = {
          ...task.derStatus,
          clientSigned: true,
          spouseSigned: true,
        };
        task.statut = 'terminée';
        task.completed = true;
        task.description = '? DER signé par tous les signataires';
        break;
    }
    
    // Sauvegarder
    tasks[taskIndex] = task;
    localStorage.setItem(tasksKey, JSON.stringify(tasks));
    
    return true;
  } catch (error) {
    console.error('? Erreur mise à jour tâche DER:', error);
    return false;
  }
}

/**
 * ? NOUVEAU : Trouve et met à jour automatiquement la tâche DER pour un client
 */
export async function updateDERTaskByClientId(
  clientId: string,
  signerType: 'client' | 'spouse',
  hasSpouse: boolean
): Promise<boolean> {
  try {
    
    // Récupérer toutes les tâches depuis localStorage
    const userId = await getUserId();
    const tasksKey = `client_tasks_${userId}_${clientId}`;
    const storedTasks = localStorage.getItem(tasksKey);
    
    if (!storedTasks) {
      return false;
    }
    
    const tasks = JSON.parse(storedTasks);
    
    // Chercher la tâche DER pour ce client (titre contient "Signature DER" et clientId correspond)
    const taskIndex = tasks.findIndex((t: any) => 
      t.clientId === clientId && 
      (t.titre?.includes('Signature DER') || t.type === 'signature_der')
    );
    
    if (taskIndex === -1) {
      console.warn(`?? Aucune tâche DER trouvée pour le client: ${clientId}`);
      return false;
    }
    
    const task = tasks[taskIndex];
    
    // Initialiser derStatus si inexistant
    if (!task.derStatus) {
      task.derStatus = {
        emailSent: true,
        clientSigned: false,
        spouseSigned: false,
        hasSpouse: hasSpouse,
      };
    }
    
    const now = new Date().toISOString();
    const dateStr = new Date().toLocaleDateString('fr-FR');
    
    // ? Récupérer la date d'envoi de l'email (note permanente)
    const emailSentDate = task.derStatus.emailSentDate 
      ? new Date(task.derStatus.emailSentDate).toLocaleDateString('fr-FR')
      : dateStr;
    const emailNote = `?? Email envoyé le ${emailSentDate}`;
    
    // Mettre à jour selon le signataire
    if (signerType === 'client') {
      task.derStatus.clientSigned = true;
      task.derStatus.clientSignedDate = now;
      
      if (hasSpouse) {
        // Si conjoint existe, vérifier s'il a déjà signé
        if (task.derStatus.spouseSigned) {
          // Les deux ont signé ? Tâche TERMINÉE
          task.statut = 'terminée';
          task.completed = true;
          task.description = `? DER signé par le couple le ${dateStr} | ${emailNote}`;
        } else {
          // Client signé, conjoint pas encore ? Tâche EN_COURS
          task.statut = 'en_cours';
          task.completed = false;
          task.description = `? Client a signé le DER - En attente du conjoint | ${emailNote}`;
        }
      } else {
        // Pas de conjoint ? Tâche TERMINÉE immédiatement
        task.statut = 'terminée';
        task.completed = true;
        task.description = `? DER signé le ${dateStr} | ${emailNote}`;
      }
    } else {
      // Conjoint signe
      task.derStatus.spouseSigned = true;
      task.derStatus.spouseSignedDate = now;
      
      // Vérifier si client a déjà signé
      if (task.derStatus.clientSigned) {
        // Les deux ont signé ? Tâche TERMINÉE
        task.statut = 'terminée';
        task.completed = true;
        task.description = `? DER signé par le couple le ${dateStr} | ${emailNote}`;
      } else {
        // Conjoint signé, client pas encore ? Tâche EN_COURS
        task.statut = 'en_cours';
        task.completed = false;
        task.description = `? Conjoint a signé le DER - En attente du client | ${emailNote}`;
      }
    }
    
    // Sauvegarder
    tasks[taskIndex] = task;
    localStorage.setItem(tasksKey, JSON.stringify(tasks));
    
    return true;
  } catch (error) {
    console.error('? Erreur mise à jour tâche DER par clientId:', error);
    return false;
  }
}
