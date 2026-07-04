// Fonction pour récupérer le statut d'un bilan patrimonial
export async function getBilanStatus(clientId: string, accessToken: string) {
  try {
    const response = await fetch(
      `https://gejcydsstilihnefbaqk.supabase.co/functions/v1/make-server-cac859af/bilan-signatures/all`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      const { bilanSignatures } = await response.json();
      const clientBilan = bilanSignatures.find((b: any) => b.clientId === clientId);
      
      if (!clientBilan) {
        return 'not-generated'; // Pas encore généré
      }
      
      if (clientBilan.signedAt) {
        return 'signed'; // Signé
      }
      
      if (clientBilan.emailSentAt) {
        return 'sent'; // Envoyé mais pas signé
      }
      
      return 'generated'; // Généré mais pas envoyé
    }
    
    return 'not-generated';
  } catch (error) {
    console.error('Erreur récupération statut bilan:', error);
    return 'not-generated';
  }
}

// Fonction pour récupérer le badge de statut pour une tâche de compte rendu RDV
export function getBilanStatusBadge(status: string) {
  switch (status) {
    case 'signed':
      return {
        text: 'Bilan signé',
        color: 'bg-green-100 text-green-700 border-green-300',
        icon: '✅',
      };
    case 'sent':
      return {
        text: 'En attente signature',
        color: 'bg-blue-100 text-blue-700 border-blue-300',
        icon: '📧',
      };
    case 'generated':
      return {
        text: 'Bilan généré',
        color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        icon: '📄',
      };
    default:
      return {
        text: 'Non envoyé',
        color: 'bg-gray-100 text-gray-700 border-gray-300',
        icon: '⏳',
      };
  }
}
