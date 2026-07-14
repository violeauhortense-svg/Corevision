/**
 * Utilitaire de diagnostic pour les documents réglementaires
 * Utilisez ces fonctions dans la console du navigateur pour déboguer
 */

import { supabase } from './api/client';

// 🔍 Afficher tous les documents d'un client
export async function debugClientDocuments(clientId: string) {
  console.log('Client ID:', clientId);
  
  // 🔥 Essayer de récupérer l'userId depuis la session Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'default';
  console.log('User ID:', userId);
  
  // Clé correcte
  const clientDetailKey = `client_detail_${userId}_${clientId}`;
  
  // Récupérer les données
  const storedData = localStorage.getItem(clientDetailKey);
  
  if (!storedData) {
    console.error('❌ Aucune donnée trouvée pour cette clé');
    
    // Essayer l'ancien format
    const oldFormatKey = `client_detail_${clientId}_${userId}`;
    const oldData = localStorage.getItem(oldFormatKey);
    if (oldData) {
      const parsed = JSON.parse(oldData);
      return parsed;
    }
    
    return null;
  }
  
  const data = JSON.parse(storedData);
  
  // Analyser chaque document réglementaire
  if (data.regulatoryDocs && data.regulatoryDocs.length > 0) {
    data.regulatoryDocs.forEach((doc: any, index: number) => {
      console.log(`\n${index + 1}. ${doc.name}`);
      console.log('   - ID:', doc.id);
      console.log('   - Status:', doc.status);
      console.log('   - Required for stage:', doc.requiredForStage);
      console.log('   - Has content:', !!doc.content);
      console.log('   - Has data:', !!doc.data);
      console.log('   - Has uploadedFile:', !!doc.uploadedFile);
      if (doc.uploadedFile) {
        console.log('   - UploadedFile has content:', !!doc.uploadedFile.content);
      }
      if (doc.completedDate) {
        console.log('   - Completed date:', doc.completedDate);
      }
      if (doc.validatedAt) {
        console.log('   - Validated at:', doc.validatedAt);
      }
    });
  } else {
  }
  
  return data;
}

// 🔄 Forcer la mise à jour des documents
export async function forceDocumentsUpdate(clientId: string) {
  
  // D'abord afficher l'état actuel
  await debugClientDocuments(clientId);
  
  // Puis émettre l'événement
  window.dispatchEvent(new CustomEvent('documentsUpdated', { 
    detail: { clientId, source: 'diagnostic' } 
  }));
}

// 📋 Lister toutes les clés localStorage relatives aux clients
export function listClientKeys() {
  const keys = Object.keys(localStorage);
  const clientKeys = keys.filter(k => k.includes('client'));
  
  console.log(`Trouvé ${clientKeys.length} clés contenant "client":`);
  clientKeys.forEach(key => {
    console.log(`  - ${key}`);
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
        } else if (typeof parsed === 'object') {
        }
      } catch (e) {
      }
    }
  });
}

// 🔧 Obtenir l'userId actuel
export async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'default';
  return userId;
}

// 🔍 Vérifier la cohérence des données pour un client
export async function verifyClientDataConsistency(clientId: string) {
  
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'default';
  
  console.log(`Client ID: ${clientId}`);
  console.log(`User ID: ${userId}\n`);
  
  // Vérifier toutes les clés possibles
  const possibleKeys = [
    `client_detail_${userId}_${clientId}`,
    `client_detail_${clientId}_${userId}`,
    `client_detail_default_${clientId}`,
  ];
  
  let foundKey: string | null = null;
  let foundData: any = null;
  
  possibleKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      if (!foundKey) {
        foundKey = key;
        foundData = JSON.parse(data);
      }
    } else {
    }
  });
  
  if (!foundKey) {
    console.error('\n❌ AUCUNE DONNÉE TROUVÉE POUR CE CLIENT');
    return null;
  }
  
  
  if (foundData.regulatoryDocs) {
    console.log(`Nombre de documents réglementaires: ${foundData.regulatoryDocs.length}`);
    
    foundData.regulatoryDocs.forEach((doc: any, i: number) => {
      console.log(`\n${i + 1}. ${doc.name}`);
      console.log(`   Status: ${doc.status}`);
    });
  } else {
  }
  
  return foundData;
}

// Exposer les fonctions globalement pour faciliter le debug
if (typeof window !== 'undefined') {
  (window as any).debugClientDocuments = debugClientDocuments;
  (window as any).forceDocumentsUpdate = forceDocumentsUpdate;
  (window as any).listClientKeys = listClientKeys;
  (window as any).getCurrentUserId = getCurrentUserId;
  (window as any).verifyClientDataConsistency = verifyClientDataConsistency;
  
  console.log('  - await debugClientDocuments(clientId)');
  console.log('  - await forceDocumentsUpdate(clientId)');
  console.log('  - listClientKeys()');
  console.log('  - await getCurrentUserId()');
  console.log('  - await verifyClientDataConsistency(clientId)');
}
