import { taskAPI, clientAPI } from '../services/api';
import type { Task } from '../types/client';

export interface MeetingProposal {
  id: string;
  clientId: string;
  date: string; // ISO date
  time: string; // HH:mm
  location: 'cabinet' | 'client' | 'visio' | 'autre';
  locationOther?: string;
  documentsRequested: string[];
  sentTo: string[]; // emails
  emailContent: string;
  uploadToken: string;
  createdAt: string;
  sentAt?: string;
  emailHistory?: EmailHistoryEntry[];
  rdvId?: string; // Lié au RDV créé dans l'agenda
}

export interface EmailHistoryEntry {
  id: string;
  sentAt: string;
  sentTo: string;
  subject: string;
  status: 'sent' | 'delivered' | 'replied';
  htmlContent?: string;
  repliedAt?: string;
  replyContent?: string;
}

export interface MeetingRDV {
  id: string;
  clientId: string;
  date: string; // ISO date
  time: string; // HH:mm
  location: string;
  documentsRequested: string[];
  uploadToken: string;
  createdAt: string;
  proposalId?: string;
}

/**
 * Crée un RDV et l'ajoute au calendrier du client
 */
export async function createMeetingRDV(
  clientId: string,
  proposal: {
    date: string;
    time: string;
    location: string;
    documentsRequested: string[];
    uploadToken: string;
  }
): Promise<MeetingRDV | null> {
  try {
    const rdv: MeetingRDV = {
      id: `rdv_${Date.now()}`,
      clientId,
      date: proposal.date,
      time: proposal.time,
      location: proposal.location,
      documentsRequested: proposal.documentsRequested,
      uploadToken: proposal.uploadToken,
      createdAt: new Date().toISOString(),
    };

    // Récupérer le client et ajouter le RDV à son profil
    const clientData = await clientAPI.getById(clientId);
    const updatedClient = {
      ...clientData,
      rdvs: [...(clientData.rdvs || []), rdv],
    };

    await clientAPI.update(clientId, updatedClient);

    return rdv;
  } catch (error) {
    console.error('❌ Erreur création RDV:', error);
    return null;
  }
}

/**
 * Crée les documents demandés dans la tâche "Collecter documents..."
 */
export async function createDocumentRequests(
  clientId: string,
  documentsRequested: string[],
  rdvId: string
): Promise<boolean> {
  try {
    // Récupérer toutes les tâches du client
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);

    // Trouver la tâche "Collecter documents..."
    let task = clientTasks.find((t: any) =>
      t.title?.includes('Collecter documents et infos')
    );

    // Si la tâche n'existe pas, la créer
    if (!task) {
      const clientData = await clientAPI.getById(clientId);
      const currentStage = clientData.status || 'R0-R1 - Découverte';

      task = await taskAPI.create(clientId, {
        titre: 'Collecter documents et infos (perso + pro)',
        description: 'Documents demandés par email',
        priorite: 'normal',
        date_echeance: '',
        stage: currentStage,
      });
    }

    // Créer la structure des documents demandés
    const requestedDocuments = documentsRequested.map((docName, index) => ({
      id: `doc_${Date.now()}_${index}`,
      name: docName,
      status: 'requested' as const,
      requestedDate: new Date().toISOString(),
    }));

    // Mettre à jour la tâche avec les documents et lien au RDV
    const updatedTask = {
      ...task,
      documentRequests: {
        requestedDocuments,
        totalRequested: requestedDocuments.length,
        totalReceived: 0,
        allReceived: false,
      },
      rdvId: rdvId, // Lien au RDV
      description: `📋 ${requestedDocuments.length} document(s) demandé(s) - 0 reçu(s)`,
      completed: false,
    };

    await taskAPI.update(task.id, updatedTask);

    return true;
  } catch (error) {
    console.error('❌ Erreur création documents demandés:', error);
    return false;
  }
}

/**
 * Met à jour la date de la tâche "RDV découverte..." avec la date du RDV
 */
export async function updateDiscoveryMeetingDeadline(
  clientId: string,
  rdvDate: string,
  rdvTime: string,
  rdvId: string
): Promise<boolean> {
  try {
    // Récupérer toutes les tâches du client
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);

    // Trouver la tâche "RDV découverte..."
    const task = clientTasks.find((t: any) =>
      t.title?.includes('RDV découverte – finalisation')
    );

    if (!task) {
      console.warn('⚠️ Tâche "RDV découverte..." non trouvée');
      return false;
    }

    // Créer une date complète avec l'heure pour l'échéance
    const [year, month, day] = rdvDate.split('-');
    const deadlineDate = new Date(`${year}-${month}-${day}T${rdvTime}:00`);

    // Mettre à jour la tâche
    const updatedTask = {
      ...task,
      deadline: deadlineDate.toISOString(),
      rdvId: rdvId, // Lien au RDV
    };

    await taskAPI.update(task.id, updatedTask);

    return true;
  } catch (error) {
    console.error('❌ Erreur mise à jour échéance RDV découverte:', error);
    return false;
  }
}

/**
 * Enregistre l'historique d'envoi d'email
 */
export async function recordEmailHistory(
  clientId: string,
  rdvId: string,
  emailTo: string[],
  subject: string,
  content: string
): Promise<boolean> {
  try {
    // Récupérer toutes les tâches du client
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);

    // Chercher une tâche avec le rdvId pour enregistrer l'historique
    const task = clientTasks.find((t: any) => t.rdvId === rdvId);

    if (task) {
      const emailHistory = task.emailHistory || [];
      emailHistory.push({
        id: `email_${Date.now()}`,
        sentAt: new Date().toISOString(),
        sentTo: emailTo.join(', '),
        subject,
        status: 'sent',
        htmlContent: content,
      });

      const updatedTask = {
        ...task,
        emailHistory,
      };

      await taskAPI.update(task.id, updatedTask);
    }

    return true;
  } catch (error) {
    console.error('❌ Erreur enregistrement historique email:', error);
    return false;
  }
}

/**
 * Génère un token sécurisé pour le dépôt de documents
 */
export function generateUploadToken(clientId: string, rdvId: string): string {
  const timestamp = Date.now();
  const expiresAt = timestamp + 30 * 24 * 60 * 60 * 1000; // 30 jours
  const data = `${clientId}:${rdvId}:${expiresAt}`;

  // Simple base64 encoding (en production, utiliser JWT ou crypto)
  const token = Buffer.from(data).toString('base64');
  return token;
}

/**
 * Valide un token de dépôt
 */
export function validateUploadToken(token: string): {
  valid: boolean;
  clientId?: string;
  rdvId?: string;
} {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [clientId, rdvId, expiresAt] = decoded.split(':');

    const now = Date.now();
    if (now > parseInt(expiresAt)) {
      return { valid: false };
    }

    return { valid: true, clientId, rdvId };
  } catch (error) {
    console.error('❌ Token invalide:', error);
    return { valid: false };
  }
}

/**
 * Génère automatiquement le contenu de l'email en fonction des infos du RDV
 * - Incluez la section "documents" UNIQUEMENT si des documents sont sélectionnés
 * - Reformule de façon professionnelle et fluide
 * - Si location = "Chez le client", inclut l'adresse du client
 */
export function generateEmailContent(params: {
  clientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  documentsRequested: string[];
  spouseName?: string;
  clientAddress?: string;
}): string {
  const { clientName, date, time, location, documentsRequested, spouseName, clientAddress } = params;

  // Formater la date en français
  const dateObj = new Date(date + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Contenu de base
  let locationLine = `📍 ${location}`;

  // Ajouter l'adresse si lieu = "Chez le client"
  if (location.toLowerCase().includes('client') && clientAddress) {
    locationLine += ` - ${clientAddress}`;
  }

  let content = `Bonjour ${clientName},

Suite à notre dernière conversation téléphonique, je vous confirme le rendez-vous prévu :

📅 ${dateFormatted}
⏰ ${time}
${locationLine}`;

  // Ajouter la section documents UNIQUEMENT si des documents sont demandés
  if (documentsRequested && documentsRequested.length > 0) {
    content += `

Afin de pouvoir anticiper au mieux cet entretien, je vous prie de bien vouloir me communiquer préalablement les pièces justificatives suivantes :`;

    documentsRequested.forEach((doc) => {
      content += `\n  • ${doc}`;
    });

    content += `

Pour déposer vos documents de façon sécurisée et confidentielle, vous pouvez utiliser le lien de dépôt qui vous est transmis ci-dessous. Ce lien de dépôt sera valable 30 jours.`;
  }

  content += `

Je reste à votre entière disposition pour tout complément d'information ou question.

Cordialement,`;

  if (spouseName) {
    content += `\n\n(Un email identique a également été transmis à votre conjoint(e))`;
  }

  return content;
}
