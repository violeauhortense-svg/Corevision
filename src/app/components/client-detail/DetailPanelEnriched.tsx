import { useState, useEffect } from 'react';
import {
  X, Check, ChevronDown, ChevronUp, Calendar, Clock, Target,
  TrendingUp, Users, DollarSign, AlertCircle, Link, Sparkles,
  PieChart, Shield, Lock, Zap, Home, PiggyBank, Gift, Building2, Briefcase
} from 'lucide-react';
import type { Objectif } from './types';

interface DetailPanelEnrichedProps {
  objectif: Objectif;
  allObjectifs: Objectif[];
  onSave: (details: Partial<Objectif>) => void;
  onClose: () => void;
}

export function DetailPanelEnriched({ objectif, allObjectifs, onSave, onClose }: DetailPanelEnrichedProps) {
  // États de base
  const [description, setDescription] = useState(objectif.description || '');
  const [status, setStatus] = useState(objectif.status || 'À planifier');
  const [priority, setPriority] = useState(objectif.priority || 'medium');
  const [startDate, setStartDate] = useState(objectif.startDate || '');
  const [endDate, setEndDate] = useState(objectif.endDate || '');
  const [progress, setProgress] = useState(objectif.progress || 0);
  const [responsable, setResponsable] = useState(objectif.responsable || '');
  const [budget, setBudget] = useState(objectif.budget || 0);
  const [notes, setNotes] = useState(objectif.notes || '');

  // États pour le socle universel - TEMPORALITÉ
  const [horizon, setHorizon] = useState(objectif.horizon || 'moyen');
  const [dateCible, setDateCible] = useState(objectif.dateCible || '');
  const [flexibilite, setFlexibilite] = useState(objectif.flexibilite || 'modulable');

  // États pour le socle universel - INTENSITÉ
  const [montantCible, setMontantCible] = useState(objectif.montantCible || 0);
  const [effortEpargne, setEffortEpargne] = useState(objectif.effortEpargne || 0);
  const [prioriteNumerique, setPrioriteNumerique] = useState(objectif.prioriteNumerique || 3);

  // États pour le socle universel - RISQUE
  const [profilRisque, setProfilRisque] = useState(objectif.profilRisque || 'equilibre');
  const [acceptationPerte, setAcceptationPerte] = useState(objectif.acceptationPerte || 10);
  const [sensibiliteVolatilite, setSensibiliteVolatilite] = useState(objectif.sensibiliteVolatilite || 'moyenne');

  // États pour le socle universel - CONTRAINTES
  const [liquidite, setLiquidite] = useState(objectif.liquidite || 'courte');
  const [contraintesFiscales, setContraintesFiscales] = useState(objectif.contraintesFiscales || '');
  const [contraintesPersonnelles, setContraintesPersonnelles] = useState(objectif.contraintesPersonnelles || '');

  // États pour objectifs combinés
  const [linkedObjectifs, setLinkedObjectifs] = useState<string[]>(objectif.linkedObjectifs || []);

  // États pour l'accordéon
  const [expandedSections, setExpandedSections] = useState<{
    temporalite: boolean;
    intensite: boolean;
    risque: boolean;
    contraintes: boolean;
    combiner: boolean;
  }>({
    temporalite: true,
    intensite: false,
    risque: false,
    contraintes: false,
    combiner: false,
  });

  // Score de complétude
  const [completudeScore, setCompletudeScore] = useState(0);

  // Calculer le score de complétude
  useEffect(() => {
    calculateCompletudeScore();
  }, [
    description, status, priority, startDate, endDate, responsable, budget,
    horizon, dateCible, flexibilite,
    montantCible, effortEpargne, prioriteNumerique,
    profilRisque, acceptationPerte, sensibiliteVolatilite,
    liquidite, contraintesFiscales, contraintesPersonnelles
  ]);

  const calculateCompletudeScore = () => {
    let totalFields = 0;
    let filledFields = 0;

    // Champs de base (20%)
    const baseFields = [description, status, priority, startDate, endDate, responsable];
    totalFields += baseFields.length;
    filledFields += baseFields.filter(f => f && f !== '' && f !== 0).length;

    // Temporalité (20%)
    const temporaliteFields = [horizon, dateCible, flexibilite];
    totalFields += temporaliteFields.length;
    filledFields += temporaliteFields.filter(f => f && f !== '').length;

    // Intensité (20%)
    const intensiteFields = [montantCible, effortEpargne, prioriteNumerique];
    totalFields += intensiteFields.length;
    filledFields += intensiteFields.filter(f => f && f !== 0).length;

    // Risque (20%)
    const risqueFields = [profilRisque, acceptationPerte, sensibiliteVolatilite];
    totalFields += risqueFields.length;
    filledFields += risqueFields.filter(f => f && f !== '' && f !== 0).length;

    // Contraintes (20%)
    const contraintesFields = [liquidite, contraintesFiscales, contraintesPersonnelles];
    totalFields += contraintesFields.length;
    filledFields += contraintesFields.filter(f => f && f !== '').length;

    const score = Math.round((filledFields / totalFields) * 100);
    setCompletudeScore(score);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleToggleLinkedObjectif = (objectifId: string) => {
    setLinkedObjectifs(prev =>
      prev.includes(objectifId)
        ? prev.filter(id => id !== objectifId)
        : [...prev, objectifId]
    );
  };

  const handleSave = () => {
    onSave({
      description,
      status,
      priority,
      startDate,
      endDate,
      progress,
      responsable,
      budget,
      notes,
      horizon,
      dateCible,
      flexibilite,
      montantCible,
      effortEpargne,
      prioriteNumerique,
      profilRisque,
      acceptationPerte,
      sensibiliteVolatilite,
      liquidite,
      contraintesFiscales,
      contraintesPersonnelles,
      linkedObjectifs,
      completudeScore,
    });
  };

  return (
    <div className="bg-white border-2 border-blue-300 rounded-lg p-6 sticky top-6 shadow-xl">
      {/* En-tête avec score de complétude */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{objectif.category}</h3>
            
            {/* Badge de complétude */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              completudeScore >= 80 ? 'bg-green-100 text-green-700' :
              completudeScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              <Sparkles className="w-3 h-3" />
              {completudeScore}% complété
            </div>
          </div>
          <p className="text-sm text-gray-600">{objectif.description}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📝 Description détaillée
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez précisément l'objectif..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* === SOCLE UNIVERSEL === */}

        {/* 1. TEMPORALITÉ */}
        <div className="border-2 border-indigo-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('temporalite')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-gray-900">⏰ Temporalité</span>
            </div>
            {expandedSections.temporalite ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {expandedSections.temporalite && (
            <div className="p-4 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horizon temporel
                </label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value as 'court' | 'moyen' | 'long')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="court">📅 Court terme (&lt; 3 ans)</option>
                  <option value="moyen">📆 Moyen terme (3-10 ans)</option>
                  <option value="long">🗓️ Long terme (&gt; 10 ans)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date cible
                </label>
                <input
                  type="date"
                  value={dateCible}
                  onChange={(e) => setDateCible(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flexibilité du timing
                </label>
                <select
                  value={flexibilite}
                  onChange={(e) => setFlexibilite(e.target.value as 'rigide' | 'modulable' | 'flexible')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="rigide">🔒 Rigide (date impérative)</option>
                  <option value="modulable">🔄 Modulable (quelques mois)</option>
                  <option value="flexible">✨ Flexible (sans urgence)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 2. INTENSITÉ */}
        <div className="border-2 border-orange-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('intensite')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-gray-900">⚡ Intensité</span>
            </div>
            {expandedSections.intensite ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {expandedSections.intensite && (
            <div className="p-4 space-y-4 bg-white">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Montant cible
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Montant que le client souhaite obtenir lorsque l'objectif/temps est réalisé
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Annuel (€)</label>
                    <input
                      type="number"
                      value={montantCible}
                      onChange={(e) => {
                        const annual = parseFloat(e.target.value) || 0;
                        setMontantCible(annual);
                      }}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mensuel (€)</label>
                    <input
                      type="number"
                      value={Math.round(montantCible / 12)}
                      onChange={(e) => {
                        const monthly = parseFloat(e.target.value) || 0;
                        setMontantCible(monthly * 12);
                      }}
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PiggyBank className="w-4 h-4 inline mr-1" />
                  Capacité d'épargne mensuelle (€)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Montant de capacité d'épargne potentiel disponible
                </p>
                <input
                  type="number"
                  value={effortEpargne}
                  onChange={(e) => setEffortEpargne(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité relative : {prioriteNumerique} / 5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={prioriteNumerique}
                  onChange={(e) => setPrioriteNumerique(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 - Faible</span>
                  <span>5 - Critique</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Check className="w-4 h-4 inline mr-2" />
          Sauvegarder
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
