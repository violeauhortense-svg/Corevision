/**
 * Utilitaire de diagnostic pour les documents réglementaires
 * Utilisez ces fonctions dans la console du navigateur pour déboguer
 */

import { supabase } from './api/client';

// 🔍 Afficher tous les documents d'un client
export async function debugClientDocuments(clientId: string) {
  console.log('🔍 === DIAGNOSTIC DOCUMENTS CLIENT ===');
  console.log('Client ID:', clientId);
  
  // 🔥 Essayer de récupérer l'userId depuis la session Supabase
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'default';
  console.log('User ID:', userId);
  console.log('Session:', session ? '✅ Active' : '❌ Aucune');
  
  // Clé correcte
  const clientDetailKey = `client_detail_${userId}_${clientId}`;
  console.log('🔑 Clé localStorage:', clientDetailKey);
  
  // Récupérer les données
  const storedData = localStorage.getItem(clientDetailKey);
  
  if (!storedData) {
    console.error('❌ Aucune donnée trouvée pour cette clé');
    console.log('💡 Essayons avec d\'autres formats...');
    
    // Essayer l'ancien format
    const oldFormatKey = `client_detail_${clientId}_${userId}`;
    const oldData = localStorage.getItem(oldFormatKey);
    if (oldData) {
      console.log('✅ Données trouvées avec l\'ancien format:', oldFormatKey);
      const parsed = JSON.parse(oldData);
      console.log('📋 regulatoryDocs:', parsed.regulatoryDocs);
      return parsed;
    }
    
    return null;
  }
  
  const data = JSON.parse(storedData);
  console.log('✅ Données trouvées');
  console.log('📦 Données complètes:', data);
  console.log('📋 regulatoryDocs:', data.regulatoryDocs);
  console.log('📄 documents:', data.documents);
  
  // Analyser chaque document réglementaire
  if (data.regulatoryDocs && data.regulatoryDocs.length > 0) {
    console.log('\n📊 === ANALYSE DES DOCUMENTS RÉGLEMENTAIRES ===');
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
    console.log('⚠️ Aucun document réglementaire trouvé');
  }
  
  return data;
}

// 🔄 Forcer la mise à jour des documents
export async function forceDocumentsUpdate(clientId: string) {
  console.log('🔄 Forçage de la mise à jour des documents pour le client:', clientId);
  
  // D'abord afficher l'état actuel
  await debugClientDocuments(clientId);
  
  // Puis émettre l'événement
  window.dispatchEvent(new CustomEvent('documentsUpdated', { 
    detail: { clientId, source: 'diagnostic' } 
  }));
  console.log('✅ Événement documentsUpdated émis');
}

// 📋 Lister toutes les clés localStorage relatives aux clients
export function listClientKeys() {
  console.log('🔍 === TOUTES LES CLÉS CLIENT DANS LOCALSTORAGE ===');
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
          console.log(`    → Array de ${parsed.length} éléments`);
        } else if (typeof parsed === 'object') {
          console.log(`    → Objet avec clés:`, Object.keys(parsed).slice(0, 5).join(', '));
        }
      } catch (e) {
        console.log(`    → Données non-JSON`);
      }
    }
  });
}

// 🔧 Obtenir l'userId actuel
export async function getCurrentUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id || 'default';
  console.log('👤 User ID actuel:', userId);
  console.log('📧 Email:', session?.user?.email || 'Non connecté');
  console.log('🔐 Session active:', !!session);
  return userId;
}

// 🔍 Vérifier la cohérence des données pour un client
export async function verifyClientDataConsistency(clientId: string) {
  console.log('\n🔍 === VÉRIFICATION DE COHÉRENCE DES DONNÉES ===\n');
  
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
  
  console.log('🔑 Clés testées:');
  let foundKey: string | null = null;
  let foundData: any = null;
  
  possibleKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      console.log(`  ✅ ${key} - TROUVÉ`);
      if (!foundKey) {
        foundKey = key;
        foundData = JSON.parse(data);
      }
    } else {
      console.log(`  ❌ ${key} - NON TROUVÉ`);
    }
  });
  
  if (!foundKey) {
    console.error('\n❌ AUCUNE DONNÉE TROUVÉE POUR CE CLIENT');
    return null;
  }
  
  console.log(`\n✅ Données trouvées avec la clé: ${foundKey}`);
  console.log('\n📊 === ANALYSE DES DOCUMENTS ===\n');
  
  if (foundData.regulatoryDocs) {
    console.log(`Nombre de documents réglementaires: ${foundData.regulatoryDocs.length}`);
    
    foundData.regulatoryDocs.forEach((doc: any, i: number) => {
      console.log(`\n${i + 1}. ${doc.name}`);
      console.log(`   Status: ${doc.status}`);
      console.log(`   Has content: ${!!doc.content ? '✅' : '❌'}`);
      console.log(`   Has data: ${!!doc.data ? '✅' : '❌'}`);
      console.log(`   Has uploadedFile: ${!!doc.uploadedFile ? '✅' : '❌'}`);
    });
  } else {
    console.log('⚠️ Aucun document réglementaire');
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
  
  console.log('🛠️ Utilitaires de diagnostic chargés:');
  console.log('  - await debugClientDocuments(clientId)');
  console.log('  - await forceDocumentsUpdate(clientId)');
  console.log('  - listClientKeys()');
  console.log('  - await getCurrentUserId()');
  console.log('  - await verifyClientDataConsistency(clientId)');
}
