import { useState } from 'react';
import {
  CheckCircle, Circle, Target, AlertCircle, X, FileText, TrendingDown,
  Users, DollarSign, Building2, Briefcase, PiggyBank, Home, Shield,
  Gift, ShoppingCart, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl } from '../../utils/api/info';
import type { Objectif } from './types';

interface ObjectifsTabProps {
  clientId: string;
  clientName: string;
  objectifs: Objectif[];
  onUpdateObjectifs: (objs: Objectif[]) => void;
  patrimoineNet: number;
  cgpAbonnement?: 'mensuel' | 'annuel' | 'aucun';
  session?: any;
  // 📋 DONNÉES COMPLETES POUR L'AUDIT
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
    }
  };

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
    toast.success('✅ Devis généré');
  };

  // Valider la commande
  const validerCommande = async () => {
    try {
      const orderId = `order-${clientId}-${Date.now()}`;

      // `session` EST l'objet utilisateur ({email, name, role}) renvoyé par
      // /api/auth/signin, pas un wrapper avec un champ .user (même piège
      // que Sidebar.tsx/App.tsx avant leur correction).
      const cgpName = session?.name || session?.email?.split('@')[0] || 'CGP';
      const cgpEmail = session?.email || '';

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
        // 📋 DONNÉES COMPLÈTES POUR L'AUDIT
        bilanData: bilanData || null,
      };

      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${apiBaseUrl}/api/corevision/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(order),
        }
      );

      if (!response.ok) {
        const responseData = await response.json().catch(() => ({}));
        throw new Error(responseData.error || `Erreur serveur ${response.status}`);
      }

      toast.success('✅ Commande validée et envoyée à CoreVision !');
      setShowDevisModal(false);
      setDevisGenere(false);
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      toast.error('❌ Erreur lors de la validation de la commande');
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

      {/* Liste des objectifs prédéfinis */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🎯 Sélectionnez vos objectifs
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
          Cochez les objectifs qui correspondent aux besoins du client.
        </p>

        <div className="space-y-3">
          {OBJECTIFS_PREDEFINIS.map((obj) => {
            const isSelected = isObjectifSelected(obj.id);
            const details = getObjectifDetails(obj.id);
            const Icon = obj.icon;

            return (
              <div
                key={obj.id}
                className={`group relative overflow-hidden rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                  isSelected
                    ? `${obj.bgColor} ${obj.borderColor} shadow-lg`
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Bande de couleur latérale */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b ${obj.color}`}></div>

                <div
                  className="flex items-center gap-4 p-4 pl-6 cursor-pointer"
                  onClick={() => handleToggleObjectif(obj.id, obj.label, obj.category)}
                >
                  {/* Icône colorée avec dégradé */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${obj.color} flex items-center justify-center shadow-lg transform transition-transform group-hover:rotate-6`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Checkbox */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle className="w-7 h-7 text-blue-600 transform transition-transform hover:scale-110" />
                    ) : (
                      <Circle className="w-7 h-7 text-gray-400 transform transition-transform hover:scale-110" />
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

                    {/* 📅 TRAÇABILITÉ */}
                    {isSelected && details && details.dateCreation && (
                      <p className="text-xs text-gray-400 mt-1">
                        📅 Ajouté le {new Date(details.dateCreation).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modale devis */}
      {showDevisModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* En-tête */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2">📋 Devis d'Audit Patrimonial</h3>
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
                      <span className="text-gray-700">Dirigeant + société simple</span>
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
