import { useState, useEffect } from 'react';
import { CompteRenduProgressif } from './client-detail/CompteRenduProgressif';

interface RapportSectionProps {
  clientId: string;
  clientName: string;
}

export function RapportSection({ clientId, clientName }: RapportSectionProps) {
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadClientData();
  }, [clientId]);
  
  const loadClientData = () => {
    try {
      // Méthode 1 : Chercher dans les clés clients_*
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('clients_'));
      
      for (const key of allKeys) {
        try {
          const storedClients = localStorage.getItem(key);
          if (storedClients) {
            const clients = JSON.parse(storedClients);
            const client = clients.find((c: any) => c.id === clientId);
            if (client) {
              console.log('✅ Client trouvé pour rapport progressif:', client);
              setClientData(client);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.error(`❌ Erreur parsing ${key}:`, e);
        }
      }
      
      // Méthode 2 : Chercher dans client_detail_*
      const clientDetailKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('client_detail_') && key.includes(clientId)
      );
      
      for (const key of clientDetailKeys) {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const client = JSON.parse(data);
            console.log('✅ Client trouvé via client_detail:', client);
            setClientData(client);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error(`❌ Erreur parsing ${key}:`, e);
        }
      }
      
      // Méthode 3 : Créer un profil minimal
      console.warn('⚠️ Client non trouvé - création profil minimal');
      setClientData({
        id: clientId,
        nom: clientName?.split(' ')[1] || 'Inconnu',
        prenom: clientName?.split(' ')[0] || 'Client',
        age_client: 45,
        situation_familiale: 'marie',
        regime_matrimonial: 'communaute',
        nombre_enfants: 0,
        tmi: 30,
        revenus_salaires: 0,
        patrimoine_net: 0,
        objectifs: ['Optimisation fiscale', 'Préparation retraite']
      });
      setLoading(false);
      
    } catch (error) {
      console.error('❌ Erreur chargement données client:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données client...</p>
        </div>
      </div>
    );
  }
  
  return (
    <CompteRenduProgressif 
      clientId={clientId}
      clientName={clientName}
      clientData={clientData}
    />
  );
}
