import { useState } from 'react';
import { 
  CheckCircle, Circle, Target, Calendar, TrendingUp, Clock, 
  Play, Check, Plus, Edit2, ChevronDown, ChevronUp,
  Flag, Users, DollarSign, AlertCircle, X, FileText, TrendingDown,
  Building2, Briefcase, PiggyBank, Home, Shield, Gift, BarChart3, ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl, publicAnonKey } from '../../utils/api/info';
import type { Objectif } from './types';
import { DetailPanelEnriched } from './DetailPanelEnriched';

interface ObjectifsTabProps {
  clientId: string;
  clientName: string;
  objectifs: Objectif[];
  onUpdateObjectifs: (objs: Objectif[]) => void;
  patrimoineNet: number;
  cgpAbonnement?: 'mensuel' | 'annuel' | 'aucun';
  session?: any;
  // ?? DONNÉES COMPLETES POUR L'AUDIT
  bilanData?: {
    patrimoineData?: any;
    revenusData?: any;
    impositionData?: any;
    familyInfo?: any;
    entreprises?: any[];
  };
}

// Liste des objectifs prédéfinis avec icônes et couleurs
const OBJECTIFS_PREDEFINIS = [
  { 
    id: 'diag-pat', 
    label: 'Diagnostic patrimonial complet', 
    category: 'Diagnostic',
    icon: FileText,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700'
  },
  { 
    id: 'opt-fisc', 
    label: 'Optimisation fiscale', 
    category: 'Fiscal',
    icon: TrendingDown,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    textColor: 'text-green-700'
  },
  { 
    id: 'acq-immo', 
    label: 'Acquisition immobilière', 
    category: 'Immobilier',
    icon: Home,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700'
  },
  { 
    id: 'epargne-fin', 
    label: 'Épargne financière', 
    category: 'Épargne',
    icon: PiggyBank,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-300',
    textColor: 'text-pink-700'
  },
  { 
    id: 'prep-retraite', 
    label: 'Préparation retraite', 
    category: 'Retraite',
    icon: Clock,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700'
  },
  { 
    id: 'transmission', 
    label: 'Transmission patrimoine', 
    category: 'Transmission',
    icon: Users,
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-300',
    textColor: 'text-indigo-700'
  },
  { 
    id: 'opt-dirigeant', 
    label: 'Optimisation dirigeant', 
    category: 'Professionnel',
    icon: Briefcase,
    color: 'from-cyan-500 to-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    textColor: 'text-cyan-700'
  },
  { 
    id: 'struct-holding', 
    label: 'Structuration holding', 
    category: 'Professionnel',
    icon: Building2,
    color: 'from-teal-500 to-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-300',
    textColor: 'text-teal-700'
  },
  { 
    id: 'prot-sociale', 
    label: 'Protection sociale', 
    category: 'Protection',
    icon: Shield,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
    textColor: 'text-red-700'
  },
  { 
    id: 'donation', 
    label: 'Donation / Donation-partage', 
    category: 'Transmission',
    icon: Gift,
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-300',
    textColor: 'text-violet-700'
  },
];

export function ObjectifsTab({
  clientId,
  clientName,
  objectifs,
  onUpdateObjectifs,
  patrimoineNet,
  cgpAbonnement,
  session,
  bilanData,
}: ObjectifsTabProps) {
  const [selectedObjectifId, setSelectedObjectifId] = useState<string | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [devisGenere, setDevisGenere] = useState(false);
  const [devisId, setDevisId] = useState('');
  const [montantDevis, setMontantDevis] = useState(0);

  // Vérifier si un objectif prédéfini est sélectionné
  const isObjectifSelected = (predefinedId: string) => {
    return objectifs.some(obj => obj.id === predefinedId);
  };

  // Obtenir les détails d'un objectif
  const getObjectifDetails = (predefinedId: string): Objectif | null => {
    return objectifs.find(obj => obj.id === predefinedId) || null;
  };

  // Toggle checkbox
  const handleToggleObjectif = (predefinedId: string, label: string, category: string) => {
    if (isObjectifSelected(predefinedId)) {
      // Décocher : supprimer l'objectif
      if (confirm('Voulez-vous supprimer cet objectif ?')) {
        onUpdateObjectifs(objectifs.filter(obj => obj.id !== predefinedId));
        toast.success('Objectif retiré');
        if (selectedObjectifId === predefinedId) {
          setSelectedObjectifId(null);
          setShowDetailPanel(false);
        }
      }
    } else {
      // Cocher : ajouter l'objectif avec valeurs par défaut
      const now = new Date().toISOString();
      const newObjectif: Objectif = {
        id: predefinedId,
        category: category,
        description: label,
        status: 'À planifier',
        priority: 'medium',
        progress: 0,
        included: true,
        mandatory: false,
        dateCreation: now,
        dateModification: now,
      };
      onUpdateObjectifs([...objectifs, newObjectif]);
      toast.success('Objectif ajouté');
      // Ouvrir automatiquement le panneau de détails
      setSelectedObjectifId(predefinedId);
      setShowDetailPanel(true);
    }
  };

  // Ouvrir le panneau de détails
  const handleOpenDetail = (predefinedId: string) => {
    if (!isObjectifSelected(predefinedId)) {
      toast.error('Veuillez d\'abord cocher cet objectif');
      return;
    }
    setSelectedObjectifId(predefinedId);
    setShowDetailPanel(true);
  };

  // Sauvegarder les détails
  const handleSaveDetails = (details: Partial<Objectif>) => {
    if (!selectedObjectifId) return;

    const now = new Date().toISOString();
    onUpdateObjectifs(objectifs.map(obj =>
      obj.id === selectedObjectifId ? {
        ...obj,
        ...details,
        dateCreation: obj.dateCreation || now,
        dateModification: now,
      } : obj
    ));
    toast.success('Détails sauvegardés');
  };

  // Statistiques
  const stats = {
    total: objectifs.length,
    enCours: objectifs.filter(o => o.status === 'En cours').length,
    termines: objectifs.filter(o => o.status === 'Terminé').length,
    planifier: objectifs.filter(o => o.status === 'À planifier').length,
    progressMoyen: objectifs.length > 0 
      ? Math.round(objectifs.reduce((sum, o) => sum + (o.progress || 0), 0) / objectifs.length)
      : 0,
  };

  // Obtenir la couleur du statut
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'À planifier': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'En cours': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Terminé': return 'bg-green-100 text-green-700 border-green-300';
      case 'En pause': return 'bg-orange-100 text-orange-700 border-orange-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const selectedObjectif = selectedObjectifId ? getObjectifDetails(selectedObjectifId) : null;

  // Calcul du montant du devis
  const calculerMontantDevis = () => {
    const montantSocle = 320;
    let montantObjectifs = 0;
    let montantDirigeants = 0;
    let montantStructuration = 0;
    
    objectifs.filter(o => o.included).forEach(obj => {
      if (obj.id === 'opt-dirigeant') {
        montantDirigeants = obj.nombreSocietes && obj.nombreSocietes > 4 ? 420 : 210;
      } else if (obj.id === 'struct-holding') {
        montantStructuration = obj.nombreSocietes && obj.nombreSocietes > 4 ? 420 : 210;
      } else if (!obj.mandatory) {
        montantObjectifs += 120;
      }
    });
    
    let montantTotal = montantSocle + montantObjectifs + montantDirigeants + montantStructuration;
    
    // Remise abonnement
    let remiseAbonnement = 0;
    if (cgpAbonnement === 'mensuel') {
      remiseAbonnement = 10;
    } else if (cgpAbonnement === 'annuel') {
      remiseAbonnement = 20;
    }
    
    montantTotal = Math.max(0, montantTotal - remiseAbonnement);
    return montantTotal;
  };

  // Générer le devis
  const genererDevis = () => {
    const montantTotal = calculerMontantDevis();
    const newDevisId = `devis-${clientId}-${Date.now()}`;
    setDevisId(newDevisId);
    setMontantDevis(montantTotal);
    setDevisGenere(true);
    setShowDevisModal(true);
    toast.success('? Devis généré');
  };

  // Valider la commande
  const validerCommande = async () => {
    try {
      const orderId = `order-${clientId}-${Date.now()}`;
      
      // ?? Récupérer les infos CGP depuis la session
      const cgpName = session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'CGP';
      const cgpEmail = session?.user?.email || '';
      
      console.log('?? DEBUG - Session complète:', session);
      console.log('?? DEBUG - CGP Name:', cgpName);
      console.log('?? DEBUG - CGP Email:', cgpEmail);
      console.log('?? DEBUG - Objectifs sélectionnés:', objectifs.filter(o => o.included));
      
      // Préparer la commande CoreVision
      const order = {
        orderId,
        clientId,
        clientName,
        cgpName,
        cgpEmail,
        objectifs: objectifs.filter(o => o.included),
        montant: montantDevis,
        validatedAt: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        // ?? DONNÉES COMPLÈTES POUR L'AUDIT
        bilanData: bilanData || null,
      };

      console.log('?? DEBUG - Commande à envoyer:', order);

      // Envoyer au serveur — pas de fallback localStorage (données sensibles)
      const token = session?.access_token || publicAnonKey;
      const response = await fetch(
        `${apiBaseUrl}/corevision/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(order),
        }
      );

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        throw new Error(responseData.error || `Erreur serveur ${response.status}`);
      }

      toast.success('? Commande validée et envoyée à CoreVision !');
      setShowDevisModal(false);
      setDevisGenere(false);
    } catch (error) {
      console.error('? Erreur lors de la validation:', error);
      toast.error('? Erreur lors de la validation de la commande');
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Objectifs patrimoniaux</h2>
        </div>
      </div>

      {/* Dashboard capacités financières */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">?? Vue financière du foyer</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-gray-600">Matelas de sécurité</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {bilanData?.revenusData ?
                (Math.round((bilanData.revenusData.revenusNetsMensuel || 0) * 3)).toLocaleString('fr-FR')
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">3x revenus mensuel</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xs text-gray-600">Liquidité perso</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {bilanData?.patrimoineData?.liquiditesPersonnelles ?
                (bilanData.patrimoineData.liquiditesPersonnelles).toLocaleString('fr-FR')
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Disponible après matelas</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="w-5 h-5 text-orange-600" />
              <span className="text-xs text-gray-600">Capacité épargne</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {bilanData?.revenusData ?
                (Math.round((bilanData.revenusData.revenusNetsMensuel || 0) * 0.2)).toLocaleString('fr-FR')
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">20% des revenus mensuels</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-gray-600">Liquidité pro</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {bilanData?.entreprises && bilanData.entreprises.length > 0 ?
                (Math.round((bilanData.entreprises[0]?.tresorerie || 0) - (bilanData.entreprises[0]?.bfr || 0))).toLocaleString('fr-FR')
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Trésorerie - BFR</p>
          </div>
        </div>
      </div>

      {/* Layout principal : Liste + Panneau de détails */}
      <div className="grid grid-cols-12 gap-6">
        {/* Liste des objectifs prédéfinis */}
        <div className={showDetailPanel ? 'col-span-5' : 'col-span-12'}>
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ?? Sélectionnez vos objectifs
              </h3>
              
              {/* Bouton Commander l'audit */}
              {!devisGenere ? (
                <button
                  onClick={genererDevis}
                  disabled={objectifs.filter(o => o.included).length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="font-medium">Commander l'audit</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Devis généré</span>
                  <button
                    onClick={() => setShowDevisModal(true)}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Voir
                  </button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Cochez les objectifs qui correspondent aux besoins du client, puis cliquez dessus pour renseigner les détails.
            </p>

            <div className="space-y-3">
              {OBJECTIFS_PREDEFINIS.map((obj) => {
                const isSelected = isObjectifSelected(obj.id);
                const details = getObjectifDetails(obj.id);
                const Icon = obj.icon;

                return (
                  <div
                    key={obj.id}
                    className={`group relative overflow-hidden rounded-xl border-2 transition-all cursor-pointer transform hover:scale-[1.02] ${
                      isSelected
                        ? `${obj.bgColor} ${obj.borderColor} shadow-lg`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    } ${selectedObjectifId === obj.id ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}`}
                    onClick={() => isSelected && handleOpenDetail(obj.id)}
                  >
                    {/* Bande de couleur latérale */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${obj.color}`}></div>

                    <div className="flex items-center gap-4 p-4 pl-6">
                      {/* Icône colorée avec dégradé */}
                      <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${obj.color} flex items-center justify-center shadow-lg transform transition-transform group-hover:rotate-6`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Checkbox */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleObjectif(obj.id, obj.label, obj.category);
                        }}
                        className="flex-shrink-0"
                      >
                        {isSelected ? (
                          <CheckCircle className="w-7 h-7 text-blue-600 cursor-pointer hover:text-blue-700 transform transition-transform hover:scale-110" />
                        ) : (
                          <Circle className="w-7 h-7 text-gray-400 cursor-pointer hover:text-gray-600 transform transition-transform hover:scale-110" />
                        )}
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-base ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {obj.label}
                        </p>
                        <p className={`text-xs font-medium ${obj.textColor}`}>
                          {obj.category}
                        </p>
                        
                        {/* ?? TRAÇABILITÉ */}
                        {isSelected && details && (details.dateCreation || details.dateModification || details.dateSaisie) && (
                          <p className="text-xs text-gray-400 mt-1">
                            {details.dateCreation && `?? Créé le ${new Date(details.dateCreation).toLocaleDateString('fr-FR')}`}
                            {details.dateModification && ` • ?? Modifié le ${new Date(details.dateModification).toLocaleDateString('fr-FR')}`}
                            {!details.dateCreation && !details.dateModification && details.dateSaisie && `?? ${new Date(details.dateSaisie).toLocaleDateString('fr-FR')}`}
                          </p>
                        )}
                      </div>

                      {/* Badge statut et progression */}
                      {isSelected && details && (
                        <div className="flex items-center gap-3">
                          {/* Priorité */}
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm ${getPriorityColor(details.priority)}`}>
                            {details.priority === 'high' ? '?? Haute' : details.priority === 'medium' ? '? Moyenne' : '?? Basse'}
                          </span>

                          {/* Statut */}
                          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border-2 shadow-sm ${getStatusColor(details.status)}`}>
                            {details.status}
                          </span>

                          {/* Progression circulaire */}
                          {details.progress !== undefined && (
                            <div className="relative w-12 h-12">
                              <svg className="transform -rotate-90 w-12 h-12">
                                <circle
                                  cx="24"
                                  cy="24"
                                  r="20"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                  className="text-gray-200"
                                />
                                <circle
                                  cx="24"
                                  cy="24"
                                  r="20"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 20}`}
                                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - details.progress / 100)}`}
                                  className={`${
                                    details.progress === 100 ? 'text-green-600' :
                                    details.progress >= 50 ? 'text-blue-600' :
                                    'text-orange-500'
                                  } transition-all duration-500`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-700">{details.progress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Flèche */}
                      {isSelected && (
                        <ChevronDown 
                          className={`w-6 h-6 text-gray-400 transition-transform ${
                            selectedObjectifId === obj.id ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </div>

                    {/* Effet de brillance au survol */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panneau de détails (à droite) */}
        {showDetailPanel && selectedObjectif && (
          <div className="col-span-7">
            <DetailPanelEnriched
              objectif={selectedObjectif}
              allObjectifs={objectifs}
              onSave={handleSaveDetails}
              onClose={() => {
                setShowDetailPanel(false);
                setSelectedObjectifId(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Modale devis */}
      {showDevisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">?? Devis d'Audit Patrimonial</h3>
                  <p className="text-blue-100 text-sm">Client: {clientName}</p>
                  <p className="text-blue-100 text-xs mt-1">Référence: {devisId}</p>
                </div>
                <button
                  onClick={() => setShowDevisModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-6">
              {/* Objectifs inclus */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Prestations incluses ({objectifs.filter(o => o.included).length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {objectifs.filter(o => o.included).map((obj) => {
                    const predef = OBJECTIFS_PREDEFINIS.find(p => p.id === obj.id);
                    const Icon = predef?.icon || Target;
                    return (
                      <div key={obj.id} className={`${predef?.bgColor} border ${predef?.borderColor} rounded-lg p-3 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${predef?.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{obj.category}</p>
                          <p className="text-xs text-gray-600">{obj.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Détail montant */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  Détail de la tarification
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Socle diagnostic obligatoire</span>
                    <span className="font-medium text-gray-900">320 €</span>
                  </div>
                  {objectifs.filter(o => o.included && !o.mandatory && o.id !== 'opt-dirigeant' && o.id !== 'struct-holding').length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        Objectifs standards ({objectifs.filter(o => o.included && !o.mandatory && o.id !== 'opt-dirigeant' && o.id !== 'struct-holding').length} × 120 €)
                      </span>
                      <span className="font-medium text-gray-900">
                        {objectifs.filter(o => o.included && !o.mandatory && o.id !== 'opt-dirigeant' && o.id !== 'struct-holding').length * 120} €
                      </span>
                    </div>
                  )}
                  {objectifs.find(o => o.id === 'opt-dirigeant' && o.included) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Dirigeant – société simple</span>
                      <span className="font-medium text-gray-900">210 €</span>
                    </div>
                  )}
                  {objectifs.find(o => o.id === 'struct-holding' && o.included) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Structuration avancée</span>
                      <span className="font-medium text-gray-900">210 €</span>
                    </div>
                  )}
                  {cgpAbonnement && cgpAbonnement !== 'aucun' && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Remise abonnement {cgpAbonnement}</span>
                      <span className="font-medium">-{cgpAbonnement === 'mensuel' ? '10' : '20'} €</span>
                    </div>
                  )}
                  <div className="border-t-2 border-blue-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Montant total</span>
                      <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {montantDevis.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avertissement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    Validation de la commande
                  </p>
                  <p className="text-sm text-yellow-700">
                    En validant, vous confirmez que le client accepte ce devis. Une commande sera envoyée à l'équipe CoreVision pour production de l'audit.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setShowDevisModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={validerCommande}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg transform hover:scale-105"
              >
                <ShoppingCart className="w-4 h-4 inline mr-2" />
                Valider la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
