import { useState, useEffect } from 'react';
import { CheckCircle2, FileText, AlertCircle, TrendingUp, ShoppingCart, Package, Clock } from 'lucide-react';
import { CoreVisionWorkflow } from './CoreVisionWorkflow';
import { toast } from 'sonner';
import type { Task } from '../types/client';
import { supabase } from '../utils/api/client';

interface AuditPatrimonialTaskProps {
  task: Task;
  clientId: string;
  onToggle: (taskId: string) => Promise<void>;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

export function AuditPatrimonialTask({ task, clientId, onToggle, onUpdate }: AuditPatrimonialTaskProps) {
  const [clientData, setClientData] = useState<any>(null);
  const [orderValidated, setOrderValidated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [auditStatus, setAuditStatus] = useState<'none' | 'ordered' | 'in_progress' | 'completed'>('none');

  // Vérifier si c'est une des tâches R1-R2 liées à l'audit
  const isElaborationTask = task.title.toLowerCase().includes('élaboration de la stratégie patrimoniale');
  const isPreparationTask = task.title.toLowerCase().includes('préparation du bilan détaillé');
  const isValidationTask = task.title.toLowerCase().includes('validation des recommandations');
  const isLivrablesTask = task.title.toLowerCase().includes('livrables prêts pour présentation');

  // Charger les données du client et vérifier si une commande d'audit est validée
  useEffect(() => {
    const loadData = async () => {
      try {
        // 🔥 CORRECTION: Utiliser la session Supabase
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || 'default';
        const clientDetailKey = `client_detail_${userId}_${clientId}`;
        console.log('🔑 Clé localStorage utilisée:', clientDetailKey);
        console.log('👤 User ID:', userId);
        const storedData = localStorage.getItem(clientDetailKey);

        if (storedData) {
          const data = JSON.parse(storedData);
          setClientData(data);
        }
        
        // Vérifier si une commande d'audit a été validée pour ce client
        const devisList = JSON.parse(localStorage.getItem('devis_list') || '[]');
        const clientOrder = devisList.find((d: any) => 
          d.clientId === clientId && d.statut === 'validé'
        );
        
        if (clientOrder) {
          console.log('✅ Commande d\'audit trouvée pour le client:', clientId);
          setOrderValidated(true);
          
          // Déterminer le statut de l'audit en vérifiant les commandes CoreVision
          checkAuditProgress();
        } else {
          console.log('⚠️ Aucune commande d\'audit validée pour ce client');
          setOrderValidated(false);
          setAuditStatus('none');
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      }
    };

    loadData();
    
    // Écouter l'événement de validation de commande
    const handleOrderValidated = (event: CustomEvent) => {
      if (event.detail && event.detail.clientId === clientId) {
        console.log('🎉 Événement orderValidated reçu pour le client:', clientId);
        setOrderValidated(true);
        checkAuditProgress();
      }
    };

    window.addEventListener('orderValidated', handleOrderValidated as EventListener);
    
    return () => {
      window.removeEventListener('orderValidated', handleOrderValidated as EventListener);
    };
  }, [clientId]);

  // Vérifier le statut de progression de l'audit
  const checkAuditProgress = async () => {
    try {
      // Vérifier les commandes locales
      const localOrdersKey = 'corevision_local_orders';
      const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
      const localOrder = localOrders.find((o: any) => o.clientId === clientId);
      
      if (localOrder) {
        if (localOrder.validatedByAdmin) {
          setAuditStatus('completed');
        } else if (localOrder.audit || localOrder.preconisations?.length > 0) {
          setAuditStatus('in_progress');
        } else {
          setAuditStatus('ordered');
        }
        return;
      }
      
      // Si pas de commande locale, considérer comme commandé
      setAuditStatus('ordered');
    } catch (error) {
      console.error('Erreur vérification progression audit:', error);
      setAuditStatus('ordered');
    }
  };

  // Callback quand la tâche est complétée via le workflow
  const handleTaskCompleted = async () => {
    try {
      await onUpdate(task.id, {
        completed: true,
        completedAt: new Date().toISOString(),
      });
      toast.success(`✅ Tâche "${task.title}" complétée`);
    } catch (error) {
      console.error('Erreur complétion tâche:', error);
      toast.error('❌ Erreur lors de la complétion de la tâche');
    }
  };

  // Fonction pour aller à l'onglet objectifs
  const goToObjectifsTab = () => {
    // Émettre un événement personnalisé pour changer d'onglet
    window.dispatchEvent(new CustomEvent('switchTab', { detail: { tab: 'objectifs' } }));
  };

  // Description de la tâche selon le type
  const getTaskDescription = () => {
    if (isElaborationTask) {
      return "Analyse approfondie de la situation patrimoniale du client et élaboration d'une stratégie personnalisée via CoreVision.";
    } else if (isPreparationTask) {
      return "Préparation du bilan patrimonial détaillé incluant les recommandations et scénarios proposés.";
    } else if (isValidationTask) {
      return "Validation finale des recommandations avant présentation au client. L'audit doit être approuvé par l'administrateur.";
    } else if (isLivrablesTask) {
      return "Tous les livrables (audit, présentation) sont prêts et validés pour être présentés au client.";
    }
    return "";
  };

  // Icône selon le type de tâche
  const getTaskIcon = () => {
    if (isElaborationTask) return TrendingUp;
    if (isPreparationTask) return FileText;
    if (isValidationTask) return CheckCircle2;
    if (isLivrablesTask) return FileText;
    return FileText;
  };

  // Couleur selon le type de tâche
  const getTaskColor = () => {
    if (isElaborationTask) return { border: 'border-purple-300', bg: 'from-purple-50 to-purple-100' };
    if (isPreparationTask) return { border: 'border-blue-300', bg: 'from-blue-50 to-blue-100' };
    if (isValidationTask) return { border: 'border-green-300', bg: 'from-green-50 to-green-100' };
    if (isLivrablesTask) return { border: 'border-indigo-300', bg: 'from-indigo-50 to-indigo-100' };
    return { border: 'border-gray-300', bg: 'from-gray-50 to-gray-100' };
  };

  // Obtenir le badge de statut de l'audit
  const getAuditStatusBadge = () => {
    // 🔥 Ne pas afficher de badge si la tâche est déjà complétée
    if (task.completed) return null;
    
    if (!orderValidated || auditStatus === 'none') return null;
    
    switch (auditStatus) {
      case 'ordered':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-300 text-amber-800 text-xs font-medium rounded-full">
            <Package className="w-3.5 h-3.5" />
            <span>En attente CoreVision</span>
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-300 text-blue-800 text-xs font-medium rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>CoreVision en cours</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-medium rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audit finalisé</span>
          </div>
        );
      default:
        return null;
    }
  };

  const Icon = getTaskIcon();
  const colors = getTaskColor();

  return (
    <div className={`p-4 border-l-4 ${colors.border} bg-gradient-to-r ${colors.bg} rounded-lg shadow-sm`}>
      {/* Header de la tâche */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(task.id)}
            disabled={loading}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-purple-500'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
          </button>

          <div className="flex-1">
            <h4
              className={`font-semibold transition-all ${
                task.completed
                  ? 'text-gray-500 line-through'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              {getTaskDescription()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge de statut de l'audit */}
          {getAuditStatusBadge()}
          
          {/* Badge de tâche complétée */}
          {task.completed && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Complété
            </span>
          )}
        </div>
      </div>

      {/* Indicateur icône */}
      <div className="ml-9 mb-4 flex items-center gap-2 text-sm text-gray-700">
        <Icon className="w-5 h-5 text-purple-600" />
        <span className="font-medium">Tâche liée à l'audit patrimonial CoreVision</span>
      </div>

      {/* Vérification de la commande */}
      {!orderValidated && !task.completed && (
        <div className="ml-9 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900 mb-2">
                ⚠️ Commande d'audit requise
              </p>
              <p className="text-sm text-yellow-800 mb-3">
                Pour débloquer cette tâche, vous devez d'abord valider une commande d'audit patrimonial dans l'onglet "Objectifs".
              </p>
              <button
                onClick={goToObjectifsTab}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
              >
                <ShoppingCart className="w-4 h-4" />
                Aller à l'onglet Objectifs
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 Affichage des notes de la tâche si elle a été traitée par CoreVision */}
      {orderValidated && !task.completed && task.notes && (
        <div className="ml-9 mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-purple-900 whitespace-pre-wrap">{task.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Workflow CoreVision */}
      {!task.completed && orderValidated && (
        <div className="ml-9">
          <CoreVisionWorkflow
            clientId={clientId}
            taskTitle={task.title}
            coreVisionOrderValidated={orderValidated}
            onTaskCompleted={handleTaskCompleted}
          />
        </div>
      )}

      {/* Si déjà complété */}
      {task.completed && (
        <div className="ml-9 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">
                Tâche complétée
              </p>
              <p className="text-sm text-green-700">
                Complété le {new Date(task.completedAt || '').toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
