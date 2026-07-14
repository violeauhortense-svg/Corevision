// ============================================
// HELPERS POUR LA GESTION DES DOCUMENTS DEMANDÉS
// ============================================

import { taskAPI, clientAPI } from '../services/api';
import { apiBaseUrl, publicAnonKey } from './api/info';

export interface RequestedDocument {
  id: string;
  name: string;
  status: 'requested' | 'received';
  requestedDate: string;
  receivedDate?: string;
  fileUrl?: string;
  fileName?: string;
}

/**
 * Crée ou met à jour la liste des documents demandés pour un client
 */
export async function createDocumentRequests(
  clientId: string,
  documentsToRequest: string[]
): Promise<boolean> {
  try {
    console.log('?? Création des demandes de documents pour client:', clientId);
    console.log('?? Documents demandés:', documentsToRequest);

    // 1. Récupérer le statut actuel du client pour créer la tâche au bon stage
    const clientData = await clientAPI.getById(clientId);
    const currentStage = clientData.status || 'R0';
    
    console.log('?? Statut actuel du client:', currentStage);

    // 2. Récupérer toutes les tâches du client via l'API
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);
    
    console.log('?? Tâches trouvées pour ce client:', clientTasks.length);
    
    // 3. Trouver la tâche "Réception des documents clients"
    let task = clientTasks.find((t: any) => 
      t.title?.includes('Réception des documents clients')
    );
    
    // Si la tâche n'existe pas, créer une tâche au stage actuel du client
    if (!task) {
      console.log(`?? Tâche "Réception des documents clients" non trouvée, création au stage ${currentStage}...`);
      
      // Créer une tâche au stage actuel du client
      const newTask = await taskAPI.create(clientId, {
        titre: 'Réception des documents clients',
        description: 'Documents demandés par email',
        priorite: 'normale',
        date_echeance: '',
        stage: currentStage, // ? Utiliser le stage actuel du client
      });
      
      task = newTask;
      console.log('? Tâche créée au stage:', currentStage, 'avec ID:', task.id);
    } else {
      console.log('? Tâche trouvée:', task.title);
    }
    
    // 4. Créer la structure des documents demandés
    const requestedDocuments: RequestedDocument[] = documentsToRequest.map((docName, index) => ({
      id: `doc_${Date.now()}_${index}`,
      name: docName,
      status: 'requested' as const,
      requestedDate: new Date().toISOString(),
    }));
    
    // 5. Mettre à jour la tâche avec les documents demandés
    const updatedTask = {
      ...task,
      documentRequests: {
        requestedDocuments: requestedDocuments,
        totalRequested: requestedDocuments.length,
        totalReceived: 0,
        allReceived: false,
      },
      description: `?? ${requestedDocuments.length} document(s) demandé(s) - 0 reçu(s)`,
      completed: false,
    };
    
    // 6. Sauvegarder via l'API
    await taskAPI.update(task.id, updatedTask);
    
    console.log('? Demandes de documents créées avec succès');
    return true;
  } catch (error) {
    console.error('? Erreur création demandes documents:', error);
    return false;
  }
}

/**
 * Récupère la liste des documents demandés pour un client
 */
export async function getRequestedDocuments(clientId: string): Promise<RequestedDocument[]> {
  try {
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);

    // Chercher d'abord dans "Collecter documents et infos..." (source principale)
    let task = clientTasks.find((t: any) =>
      t.title?.includes('Collecter documents')
    );

    // Fallback: chercher dans "Réception des documents clients"
    if (!task) {
      task = clientTasks.find((t: any) =>
        t.title?.includes('Réception des documents clients')
      );
    }

    if (!task || !task.documentRequests) return [];

    return task.documentRequests.requestedDocuments || [];
  } catch (error) {
    console.error('? Erreur récupération documents demandés:', error);
    return [];
  }
}

/**
 * Upload un document et met à jour le statut
 */
export async function uploadRequestedDocument(
  clientId: string,
  documentId: string,
  file: File
): Promise<boolean> {
  try {
    console.log('?? Upload du document:', documentId);
    console.log('?? Fichier:', file.name, 'Taille:', file.size);
    
    // 1. Upload du fichier vers le serveur
    const formData = new FormData();
    formData.append('file', file);
    formData.append('clientId', clientId);
    formData.append('documentType', 'requested_document');
    
    console.log('?? Envoi vers serveur...');
    
    const uploadResponse = await fetch(
      `${apiBaseUrl}/upload-document`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: formData,
      }
    );
    
    console.log('?? Response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('? Erreur serveur:', errorText);
      throw new Error(`Erreur serveur (${uploadResponse.status}): ${errorText}`);
    }
    
    const responseData = await uploadResponse.json();
    console.log('? Response data:', responseData);
    
    if (!responseData.fileUrl) {
      console.error('? Pas de fileUrl dans la réponse:', responseData);
      throw new Error('Pas d\'URL de fichier dans la réponse');
    }
    
    const { fileUrl } = responseData;
    console.log('? Fichier uploadé:', fileUrl);
    
    // 2. Récupérer la tâche via l'API
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);
    
    const task = clientTasks.find((t: any) => 
      t.title?.includes('Réception des documents clients')
    );
    
    if (!task || !task.documentRequests) {
      console.warn('?? Aucune demande de document trouvée');
      return false;
    }
    
    // 3. Mettre à jour le document spécifique - CRÉER UNE COPIE PROFONDE
    const updatedDocumentRequests = JSON.parse(JSON.stringify(task.documentRequests));
    const docIndex = updatedDocumentRequests.requestedDocuments.findIndex(
      (doc: RequestedDocument) => doc.id === documentId
    );
    
    if (docIndex === -1) {
      console.warn('?? Document demandé non trouvé:', documentId);
      return false;
    }
    
    // Mettre à jour le document
    updatedDocumentRequests.requestedDocuments[docIndex].status = 'received';
    updatedDocumentRequests.requestedDocuments[docIndex].receivedDate = new Date().toISOString();
    updatedDocumentRequests.requestedDocuments[docIndex].fileUrl = fileUrl;
    updatedDocumentRequests.requestedDocuments[docIndex].fileName = file.name;
    
    console.log('?? Document mis à jour:', updatedDocumentRequests.requestedDocuments[docIndex]);
    
    // 4. Recalculer les totaux
    const totalReceived = updatedDocumentRequests.requestedDocuments.filter(
      (doc: RequestedDocument) => doc.status === 'received'
    ).length;
    
    updatedDocumentRequests.totalReceived = totalReceived;
    updatedDocumentRequests.allReceived = totalReceived === updatedDocumentRequests.totalRequested;
    
    // 5. Préparer les mises à jour de la tâche
    const taskUpdates: any = {
      documentRequests: updatedDocumentRequests,
      description: `?? ${updatedDocumentRequests.totalRequested} document(s) demandé(s) - ${totalReceived} reçu(s)`,
      completed: false,
    };
    
    if (updatedDocumentRequests.allReceived) {
      taskUpdates.completed = true;
      taskUpdates.description = `? Tous les documents ont été reçus (${totalReceived}/${updatedDocumentRequests.totalRequested})`;
    }
    
    console.log('?? Sauvegarde de la tâche avec:', taskUpdates);
    
    // 6. Sauvegarder via l'API avec un merge explicite
    const updatedTask = {
      ...task,
      ...taskUpdates,
    };
    
    console.log('?? Tâche complète avant sauvegarde:', JSON.stringify(updatedTask, null, 2));
    
    await taskAPI.update(task.id, updatedTask);
    
    console.log('? Document marqué comme reçu et sauvegardé');
    
    // 7. Vérification : relire la tâche pour confirmer la sauvegarde
    const verificationTasks = await taskAPI.getAll();
    const verifiedTask = verificationTasks.find((t: any) => t.id === task.id);
    
    console.log('?? Vérification de la tâche rechargée:', JSON.stringify(verifiedTask?.documentRequests, null, 2));
    
    if (verifiedTask?.documentRequests?.requestedDocuments[docIndex]?.status === 'received') {
      console.log('? Vérification réussie : le document est bien enregistré comme "received"');
      
      // ? NOUVEAU : Double vérification avec relecture directe du localStorage
      const userId = localStorage.getItem('user_id') || 'default';
      const tasksKey = `client_tasks_${userId}_${clientId}`;
      const directCheck = localStorage.getItem(tasksKey);
      
      if (directCheck) {
        const directTasks = JSON.parse(directCheck);
        const directTask = directTasks.find((t: any) => t.id === task.id);
        console.log('?? Vérification directe localStorage:', {
          found: !!directTask,
          hasDocumentRequests: !!directTask?.documentRequests,
          docStatus: directTask?.documentRequests?.requestedDocuments[docIndex]?.status
        });
      }
      
      return true;
    } else {
      console.error('? Vérification échouée : le document n\'est pas enregistré correctement');
      console.error('État attendu: received, état actuel:', verifiedTask?.documentRequests?.requestedDocuments[docIndex]?.status);
      return false;
    }
  } catch (error) {
    console.error('? Erreur upload document:', error);
    return false;
  }
}

/**
 * Supprime un document demandé
 */
export async function deleteRequestedDocument(
  clientId: string,
  documentId: string
): Promise<boolean> {
  try {
    const allTasks = await taskAPI.getAll();
    const clientTasks = allTasks.filter((t: any) => t.clientId === clientId);
    
    const task = clientTasks.find((t: any) => 
      t.title?.includes('Réception des documents clients')
    );
    
    if (!task || !task.documentRequests) return false;
    
    // Filtrer le document à supprimer
    task.documentRequests.requestedDocuments = task.documentRequests.requestedDocuments.filter(
      (doc: RequestedDocument) => doc.id !== documentId
    );
    
    // Recalculer les totaux
    task.documentRequests.totalRequested = task.documentRequests.requestedDocuments.length;
    const totalReceived = task.documentRequests.requestedDocuments.filter(
      (doc: RequestedDocument) => doc.status === 'received'
    ).length;
    task.documentRequests.totalReceived = totalReceived;
    task.documentRequests.allReceived = totalReceived === task.documentRequests.totalRequested;
    
    // Mettre à jour la description
    task.description = `?? ${task.documentRequests.totalRequested} document(s) demandé(s) - ${totalReceived} reçu(s)`;
    
    if (task.documentRequests.allReceived && task.documentRequests.totalRequested > 0) {
      task.completed = true;
    } else {
      task.completed = false;
    }
    
    // Sauvegarder via l'API
    await taskAPI.update(task.id, task);
    
    console.log('? Document demandé supprimé');
    return true;
  } catch (error) {
    console.error('? Erreur suppression document:', error);
    return false;
  }
}
