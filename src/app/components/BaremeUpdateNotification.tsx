/**
 * 🔔 NOTIFICATION - MISE À JOUR DES BARÈMES
 * 
 * Affiche une notification quand les barèmes sont mis à jour
 * Permet de recharger l'application pour utiliser les nouveaux barèmes
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';

export function BaremeUpdateNotification() {
  const [showNotification, setShowNotification] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Vérifier les mises à jour toutes les 5 minutes
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/make-server-cac859af/baremes/2026`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Récupérer la date de dernière mise à jour stockée localement
          const storedUpdate = localStorage.getItem('baremes_last_update');
          
          if (storedUpdate && data.updated && storedUpdate !== data.updated) {
            // Les barèmes ont été mis à jour
            setLastUpdate(data.updated);
            setShowNotification(true);
          }
          
          // Sauvegarder la date actuelle si elle n'existe pas
          if (!storedUpdate && data.updated) {
            localStorage.setItem('baremes_last_update', data.updated);
          }
        }
      } catch (error) {
        // Erreur silencieuse : le serveur peut ne pas être disponible ou la route peut ne pas exister
        // Ce n'est pas critique pour l'application
        console.debug('⚠️ Impossible de vérifier les mises à jour des barèmes (non critique):', error instanceof Error ? error.message : 'erreur réseau');
      }
    };

    // Vérifier au montage avec un délai pour laisser le temps au serveur de démarrer
    const initialTimeout = setTimeout(checkUpdates, 2000);

    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkUpdates, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = () => {
    if (lastUpdate) {
      localStorage.setItem('baremes_last_update', lastUpdate);
    }
    window.location.reload();
  };

  const handleDismiss = () => {
    if (lastUpdate) {
      localStorage.setItem('baremes_last_update', lastUpdate);
    }
    setShowNotification(false);
  };

  if (!showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 border border-blue-500">
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
          
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Barèmes fiscaux mis à jour</h3>
            <p className="text-sm text-blue-100 mb-3">
              Les barèmes fiscaux ont été actualisés. Rechargez l'application pour utiliser les nouveaux
              barèmes dans vos calculs.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 bg-white text-blue-600 rounded text-sm font-medium hover:bg-blue-50 flex items-center gap-1"
              >
                <RefreshCw className="size-4" />
                Recharger
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-blue-700 text-white rounded text-sm font-medium hover:bg-blue-800"
              >
                Plus tard
              </button>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="text-blue-100 hover:text-white flex-shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}