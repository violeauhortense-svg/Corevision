import { useState, useEffect } from 'react';
import { CheckCircle2, Send, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl, publicAnonKey } from '../utils/api/info';

interface CoreVisionWorkflowProps {
  clientId: string;
  taskTitle: string;
  coreVisionOrderValidated: boolean;
  onValidateRecommendations?: (recommendations: any[]) => void;
  onTaskCompleted?: () => void; // Nouvelle callback pour compléter la tâche
}

export function CoreVisionWorkflow({ 
  clientId, 
  taskTitle, 
  coreVisionOrderValidated,
  onValidateRecommendations,
  onTaskCompleted
}: CoreVisionWorkflowProps) {
  const [auditReceived, setAuditReceived] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderExists, setOrderExists] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(true);
  const [auditValidatedByAdmin, setAuditValidatedByAdmin] = useState(false); // Nouveau état
  
  const isElaborationTask = taskTitle.toLowerCase().includes('élaboration de la stratégie patrimoniale');
  const isPreparationTask = taskTitle.toLowerCase().includes('préparation du bilan détaillé');
  const isValidationTask = taskTitle.toLowerCase().includes('validation des recommandations');
  const isLivrablesTask = taskTitle.toLowerCase().includes('livrables prêts pour présentation');
  
  // Vérifier si une commande existe côté serveur
  useEffect(() => {
    const checkOrderExists = async () => {
      try {
        const response = await fetch(
          `${apiBaseUrl}/corevision/orders`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const order = data.orders.find((o: any) => o.clientId === clientId);
          setOrderExists(!!order);
        }
      } catch (error) {
        console.error('Erreur vérification commande:', error);
      } finally {
        setCheckingOrder(false);
      }
    };

    if (isElaborationTask || isPreparationTask || isValidationTask || isLivrablesTask) {
      checkOrderExists();
    } else {
      setCheckingOrder(false);
    }
  }, [clientId, isElaborationTask, isPreparationTask, isValidationTask, isLivrablesTask]);
  
  // ?? Écouter l'événement de validation admin pour rafraîchir en temps réel
  useEffect(() => {
    const handleAdminValidation = (event: CustomEvent) => {
      if (event.detail && event.detail.clientId === clientId) {
        console.log('?? Événement adminValidated reçu pour le client:', clientId);
        
        // Rafraîchir l'état en vérifiant à nouveau le localStorage
        const localOrdersKey = 'corevision_local_orders';
        const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
        const localOrder = localOrders.find((o: any) => o.clientId === clientId);
        
        if (localOrder && localOrder.validatedByAdmin) {
          setAuditValidatedByAdmin(true);
          
          // Pour la tâche de validation, charger les recommandations
          if (isValidationTask && localOrder.preconisations && localOrder.preconisations.length > 0) {
            setRecommendations(localOrder.preconisations);
            setAuditReceived(true);
          }
          
          // Auto-compléter la tâche si applicable
          if ((isElaborationTask || isPreparationTask || isLivrablesTask) && onTaskCompleted) {
            const taskKey = `corevision_task_completed_${clientId}_${taskTitle}`;
            const alreadyCompleted = localStorage.getItem(taskKey);
            
            if (!alreadyCompleted) {
              localStorage.setItem(taskKey, 'true');
              onTaskCompleted();
            }
          }
        }
      }
    };
    
    window.addEventListener('adminValidated', handleAdminValidation as EventListener);
    
    return () => {
      window.removeEventListener('adminValidated', handleAdminValidation as EventListener);
    };
  }, [clientId, isElaborationTask, isPreparationTask, isValidationTask, isLivrablesTask, taskTitle, onTaskCompleted]);
  
  // Vérifier automatiquement si l'audit est validé par l'admin (pour la tâche de validation)
  useEffect(() => {
    // Ne s'exécute que si c'est la tâche de validation
    if (!isValidationTask) return;
    
    const checkAuditValidation = async () => {
      try {
        // ?? PRIORITÉ 1: Vérifier d'abord les commandes locales
        const localOrdersKey = 'corevision_local_orders';
        const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
        const localOrder = localOrders.find((o: any) => o.clientId === clientId);
        
        if (localOrder) {
          console.log('?? Commande locale trouvée pour client:', clientId, localOrder);
          
          if (localOrder.validatedByAdmin && localOrder.preconisations && localOrder.preconisations.length > 0) {
            console.log('? Audit validé par admin (localStorage):', localOrder);
            
            // Charger depuis localStorage
            const savedKey = `corevision_recommendations_${clientId}`;
            const saved = localStorage.getItem(savedKey);
            
            if (saved) {
              const savedData = JSON.parse(saved);
              setRecommendations(savedData.recommendations);
              setAuditReceived(savedData.auditReceived);
            } else {
              // Sinon charger depuis la commande locale
              setRecommendations(localOrder.preconisations);
              setAuditReceived(true);
              // Sauvegarder dans localStorage
              localStorage.setItem(savedKey, JSON.stringify({
                recommendations: localOrder.preconisations,
                auditReceived: true,
              }));
            }
            setAuditValidatedByAdmin(true);
            return; // ? Sortir ici, pas besoin de vérifier le serveur
          }
        }
        
        // ?? PRIORITÉ 2: Vérifier le serveur (seulement si pas de commande locale)
        const response = await fetch(
          `${apiBaseUrl}/corevision/orders`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const order = data.orders.find((o: any) => o.clientId === clientId);
          
          if (order && order.validatedByAdmin && order.preconisations && order.preconisations.length > 0) {
            // Charger depuis localStorage d'abord
            const savedKey = `corevision_recommendations_${clientId}`;
            const saved = localStorage.getItem(savedKey);
            
            if (saved) {
              const savedData = JSON.parse(saved);
              setRecommendations(savedData.recommendations);
              setAuditReceived(savedData.auditReceived);
            } else {
              // Sinon charger depuis le serveur
              setRecommendations(order.preconisations);
              setAuditReceived(true);
              // Sauvegarder dans localStorage
              localStorage.setItem(savedKey, JSON.stringify({
                recommendations: order.preconisations,
                auditReceived: true,
              }));
            }
            setAuditValidatedByAdmin(true);
          }
        }
      } catch (error) {
        console.error('? Erreur vérification audit:', error);
      }
    };

    checkAuditValidation();
  }, [clientId, isValidationTask]);
  
  // Vérifier si l'audit est validé par l'admin (pour les tâches d'élaboration et préparation)
  useEffect(() => {
    // Ne s'exécute que si c'est une tâche d'élaboration ou préparation
    if (!isElaborationTask && !isPreparationTask) return;
    
    const checkAuditCompletion = async () => {
      try {
        // ?? PRIORITÉ 1: Vérifier d'abord les commandes locales
        const localOrdersKey = 'corevision_local_orders';
        const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
        const localOrder = localOrders.find((o: any) => o.clientId === clientId);
        
        if (localOrder) {
          console.log('?? Commande locale trouvée pour élaboration/préparation:', clientId, localOrder);
          
          if (localOrder.validatedByAdmin) {
            setAuditValidatedByAdmin(true);
            
            // Valider automatiquement la tâche si la callback est fournie
            if (onTaskCompleted) {
              const taskKey = `corevision_task_completed_${clientId}_${taskTitle}`;
              const alreadyCompleted = localStorage.getItem(taskKey);
              
              if (!alreadyCompleted) {
                localStorage.setItem(taskKey, 'true');
                onTaskCompleted();
              }
            }
            return; // ? Sortir ici, pas besoin de vérifier le serveur
          }
        }
        
        // ?? PRIORITÉ 2: Vérifier le serveur (seulement si pas de commande locale)
        const response = await fetch(
          `${apiBaseUrl}/corevision/orders`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const order = data.orders.find((o: any) => o.clientId === clientId);
          
          if (order && order.validatedByAdmin) {
            setAuditValidatedByAdmin(true);
            
            // Valider automatiquement la tâche si la callback est fournie
            if (onTaskCompleted) {
              // Vérifier si la tâche n'a pas déjà été complétée pour éviter les appels multiples
              const taskKey = `corevision_task_completed_${clientId}_${taskTitle}`;
              const alreadyCompleted = localStorage.getItem(taskKey);
              
              if (!alreadyCompleted) {
                localStorage.setItem(taskKey, 'true');
                onTaskCompleted();
              }
            }
          }
        }
      } catch (error) {
        console.error('? Erreur vérification completion audit:', error);
      }
    };

    checkAuditCompletion();
  }, [clientId, isElaborationTask, isPreparationTask, taskTitle, onTaskCompleted]);
  
  // Vérifier si l'audit est validé par l'admin (pour la tâche "Livrables prêts pour présentation")
  useEffect(() => {
    // Ne s'exécute que si c'est la tâche des livrables
    if (!isLivrablesTask) return;
    
    const checkLivrablesCompletion = async () => {
      try {
        // ?? PRIORITÉ 1: Vérifier d'abord les commandes locales
        const localOrdersKey = 'corevision_local_orders';
        const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
        const localOrder = localOrders.find((o: any) => o.clientId === clientId);
        
        if (localOrder) {
          console.log('?? Commande locale trouvée pour livrables:', clientId, localOrder);
          
          if (localOrder.validatedByAdmin) {
            console.log('? Audit validé par admin (localStorage) - Livrables prêts');
            setAuditValidatedByAdmin(true);
            
            // Valider automatiquement la tâche si la callback est fournie
            if (onTaskCompleted) {
              const taskKey = `corevision_task_completed_${clientId}_${taskTitle}`;
              const alreadyCompleted = localStorage.getItem(taskKey);
              
              if (!alreadyCompleted) {
                localStorage.setItem(taskKey, 'true');
                onTaskCompleted();
              }
            }
            return; // ? Sortir ici, pas besoin de vérifier le serveur
          }
        }
        
        // ?? PRIORITÉ 2: Vérifier le serveur (seulement si pas de commande locale)
        const response = await fetch(
          `${apiBaseUrl}/corevision/orders`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const order = data.orders.find((o: any) => o.clientId === clientId);
          
          if (order && order.validatedByAdmin) {
            setAuditValidatedByAdmin(true);
            
            // Valider automatiquement la tâche si la callback est fournie
            if (onTaskCompleted) {
              const taskKey = `corevision_task_completed_${clientId}_${taskTitle}`;
              const alreadyCompleted = localStorage.getItem(taskKey);
              
              if (!alreadyCompleted) {
                localStorage.setItem(taskKey, 'true');
                onTaskCompleted();
              }
            }
          }
        }
      } catch (error) {
        console.error('? Erreur vérification completion livrables:', error);
      }
    };

    checkLivrablesCompletion();
  }, [clientId, isLivrablesTask, taskTitle, onTaskCompleted]);
  
  // Une commande est validée si elle existe localement OU côté serveur
  const hasValidOrder = coreVisionOrderValidated || orderExists;
  
  // Afficher un loader pendant la vérification
  if (checkingOrder && (isElaborationTask || isPreparationTask || isValidationTask || isLivrablesTask)) {
    return (
      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
          <p className="text-sm text-gray-600">Vérification du statut CoreVision...</p>
        </div>
      </div>
    );
  }
  
  // Pour les tâches d'élaboration et préparation
  if (isElaborationTask || isPreparationTask) {
    if (!hasValidOrder) {
      return (
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ?? Validez d'abord la commande CoreVision dans l'onglet <strong>Objectifs</strong> pour démarrer le traitement.
          </p>
        </div>
      );
    }
    
    // Si l'audit est validé par l'admin, afficher un badge de succès
    if (auditValidatedByAdmin) {
      return (
        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                ? Traitement terminé par CoreVision
              </p>
              <p className="text-xs text-green-700">
                {isElaborationTask 
                  ? "La stratégie patrimoniale a été élaborée avec succès. L'audit et les recommandations sont disponibles."
                  : "Le bilan détaillé et les analyses sont prêts. Les recommandations CoreVision peuvent être consultées."
                }
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Sinon, afficher un message simple
    return (
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700">
          {isElaborationTask 
            ? "L'équipe CoreVision élabore actuellement la stratégie patrimoniale adaptée aux objectifs du client."
            : "L'équipe CoreVision prépare le bilan détaillé avec l'ensemble des analyses et recommandations."
          }
        </p>
      </div>
    );
  }
  
  // Pour la tâche de validation des recommandations
  if (isValidationTask) {
    if (!hasValidOrder) {
      return (
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ?? Aucune commande CoreVision n'a été passée. Cette tâche nécessite que l'élaboration de la stratégie ait été confiée à CoreVision.
          </p>
        </div>
      );
    }
    
    if (!auditReceived) {
      // Simple message d'attente
      return (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            L'équipe CoreVision finalise l'audit et les recommandations. Vous serez notifié automatiquement dès qu'ils seront prêts.
          </p>
        </div>
      );
    }
    
    // Audit reçu ? Rediriger vers l'onglet Audit pour validation
    return (
      <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <p className="text-sm font-semibold text-purple-900 mb-2">
          ? {recommendations.length} recommandation(s) CoreVision reçue(s)
        </p>
        <p className="text-sm text-purple-800 mb-3">
          Les recommandations sont disponibles dans l'onglet <strong>Audit</strong> du client. Consultez-les et validez-les pour compléter cette tâche.
        </p>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'audit' } }));
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          <FileText className="w-4 h-4" />
          Aller à l'onglet Audit
        </button>
      </div>
    );
  }
  
  // Pour la tâche "Livrables prêts pour présentation"
  if (isLivrablesTask) {
    if (!hasValidOrder) {
      return (
        <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            ?? Validez d'abord la commande CoreVision dans l'onglet <strong>Objectifs</strong> pour démarrer le traitement.
          </p>
        </div>
      );
    }
    
    // Si l'audit est validé par l'admin, afficher un badge de succès
    if (auditValidatedByAdmin) {
      return (
        <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900 mb-1">
                ? Livrables prêts
              </p>
              <p className="text-xs text-green-700">
                L'audit, les recommandations et la présentation client sont finalisés et disponibles pour présentation.
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Sinon, afficher le badge "En cours"
    return (
      <div className="mt-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 rounded-full bg-purple-200 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-purple-900 mb-1">
              ?? En cours de traitement par CoreVision
            </p>
            <p className="text-xs text-purple-700">
              L'équipe CoreVision finalise les livrables pour la présentation client.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
