/**
 * 🔍 PANEL INCOHÉRENCES - Affichage et gestion des incohérences détectées
 * 
 * Phase 3 : UI de validation avec traçabilité
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Incoherence,
  RapportIncoherences,
  GraviteIncoherence,
  StatutIncoherence,
} from '../services/incoherencesService';

interface IncoherencesPanelProps {
  rapport: RapportIncoherences;
  onValider: (incoherenceId: string, commentaire?: string) => Promise<void>;
  onIgnorer: (incoherenceId: string, raison: string) => Promise<void>;
  onCorriger: (incoherenceId: string, commentaire?: string) => Promise<void>;
  loading?: boolean;
}

export function IncoherencesPanel({
  rapport,
  onValider,
  onIgnorer,
  onCorriger,
  loading = false,
}: IncoherencesPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [commentaireModal, setCommentaireModal] = useState<{
    show: boolean;
    incoherenceId: string;
    action: 'valider' | 'ignorer' | 'corriger';
  } | null>(null);
  const [commentaire, setCommentaire] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAction = async (
    action: 'valider' | 'ignorer' | 'corriger',
    incoherenceId: string
  ) => {
    if (action === 'ignorer') {
      // Ignorer nécessite une raison obligatoire
      setCommentaireModal({ show: true, incoherenceId, action });
      return;
    }

    // Valider et corriger peuvent avoir un commentaire optionnel
    setCommentaireModal({ show: true, incoherenceId, action });
  };

  const confirmAction = async () => {
    if (!commentaireModal) return;

    const { incoherenceId, action } = commentaireModal;

    setActionInProgress(incoherenceId);

    try {
      if (action === 'valider') {
        await onValider(incoherenceId, commentaire || undefined);
      } else if (action === 'ignorer') {
        if (!commentaire.trim()) {
          alert('Une raison est obligatoire pour ignorer une incohérence');
          return;
        }
        await onIgnorer(incoherenceId, commentaire);
      } else if (action === 'corriger') {
        await onCorriger(incoherenceId, commentaire || undefined);
      }

      setCommentaireModal(null);
      setCommentaire('');
    } finally {
      setActionInProgress(null);
    }
  };

  const getGraviteIcon = (gravite: GraviteIncoherence) => {
    switch (gravite) {
      case 'critique':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'elevee':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'moyenne':
        return <Info className="w-5 h-5 text-yellow-500" />;
      case 'faible':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getGraviteBadge = (gravite: GraviteIncoherence) => {
    const colors = {
      critique: 'bg-red-100 text-red-800 border-red-200',
      elevee: 'bg-orange-100 text-orange-800 border-orange-200',
      moyenne: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      faible: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${colors[gravite]}`}
      >
        {gravite.charAt(0).toUpperCase() + gravite.slice(1)}
      </span>
    );
  };

  const getStatutBadge = (statut: StatutIncoherence) => {
    const config = {
      detectee: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <Eye className="w-3 h-3" />,
        label: 'Détectée',
      },
      validee: {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Validée',
      },
      ignoree: {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <XCircle className="w-3 h-3" />,
        label: 'Ignorée',
      },
      corrigee: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Wrench className="w-3 h-3" />,
        label: 'Corrigée',
      },
    };

    const { color, icon, label } = config[statut];

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border inline-flex items-center gap-1 ${color}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const incoherencesActives = rapport.incoherences.filter(
    (i) => i.statut === 'detectee'
  );
  const incoherencesResolues = rapport.incoherences.filter(
    (i) => i.statut !== 'detectee'
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Incohérences détectées
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {rapport.scoreCoherence}
            </span>
            <span className="text-sm text-gray-500">/100</span>
          </div>
        </div>

        {/* Statistiques par gravité */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="text-2xl font-bold text-red-600">
              {rapport.parGravite.critique}
            </div>
            <div className="text-xs text-red-600">Critiques</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="text-2xl font-bold text-orange-600">
              {rapport.parGravite.elevee}
            </div>
            <div className="text-xs text-orange-600">Élevées</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <div className="text-2xl font-bold text-yellow-600">
              {rapport.parGravite.moyenne}
            </div>
            <div className="text-xs text-yellow-600">Moyennes</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-2xl font-bold text-blue-600">
              {rapport.parGravite.faible}
            </div>
            <div className="text-xs text-blue-600">Faibles</div>
          </div>
        </div>

        {/* Statistiques par statut */}
        <div className="grid grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">
              {rapport.parStatut.detectee} détectées
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">
              {rapport.parStatut.validee} validées
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600">
              {rapport.parStatut.ignoree} ignorées
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">
              {rapport.parStatut.corrigee} corrigées
            </span>
          </div>
        </div>
      </div>

      {/* Liste des incohérences actives */}
      {incoherencesActives.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            À traiter ({incoherencesActives.length})
          </h4>
          {incoherencesActives.map((incoherence) => (
            <IncoherenceCard
              key={incoherence.id}
              incoherence={incoherence}
              expanded={expandedId === incoherence.id}
              onToggle={() => toggleExpand(incoherence.id)}
              onValider={() => handleAction('valider', incoherence.id)}
              onIgnorer={() => handleAction('ignorer', incoherence.id)}
              onCorriger={() => handleAction('corriger', incoherence.id)}
              actionInProgress={actionInProgress === incoherence.id}
              getGraviteIcon={getGraviteIcon}
              getGraviteBadge={getGraviteBadge}
              getStatutBadge={getStatutBadge}
            />
          ))}
        </div>
      )}

      {/* Liste des incohérences résolues */}
      {incoherencesResolues.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700">
            Résolues ({incoherencesResolues.length})
          </h4>
          {incoherencesResolues.map((incoherence) => (
            <IncoherenceCard
              key={incoherence.id}
              incoherence={incoherence}
              expanded={expandedId === incoherence.id}
              onToggle={() => toggleExpand(incoherence.id)}
              getGraviteIcon={getGraviteIcon}
              getGraviteBadge={getGraviteBadge}
              getStatutBadge={getStatutBadge}
              readonly
            />
          ))}
        </div>
      )}

      {/* Modal commentaire */}
      {commentaireModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {commentaireModal.action === 'valider'
                ? 'Valider l\'incohérence'
                : commentaireModal.action === 'ignorer'
                ? 'Ignorer l\'incohérence'
                : 'Marquer comme corrigée'}
            </h3>

            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder={
                commentaireModal.action === 'ignorer'
                  ? 'Raison (obligatoire)...'
                  : 'Commentaire (optionnel)...'
              }
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setCommentaireModal(null);
                  setCommentaire('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={actionInProgress !== null}
              >
                Annuler
              </button>
              <button
                onClick={confirmAction}
                disabled={
                  actionInProgress !== null ||
                  (commentaireModal.action === 'ignorer' && !commentaire.trim())
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPOSANT CARTE INCOHÉRENCE
// ============================================

interface IncoherenceCardProps {
  incoherence: Incoherence;
  expanded: boolean;
  onToggle: () => void;
  onValider?: () => void;
  onIgnorer?: () => void;
  onCorriger?: () => void;
  actionInProgress?: boolean;
  getGraviteIcon: (gravite: GraviteIncoherence) => React.ReactNode;
  getGraviteBadge: (gravite: GraviteIncoherence) => React.ReactNode;
  getStatutBadge: (statut: StatutIncoherence) => React.ReactNode;
  readonly?: boolean;
}

function IncoherenceCard({
  incoherence,
  expanded,
  onToggle,
  onValider,
  onIgnorer,
  onCorriger,
  actionInProgress = false,
  getGraviteIcon,
  getGraviteBadge,
  getStatutBadge,
  readonly = false,
}: IncoherenceCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* En-tête cliquable */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getGraviteIcon(incoherence.gravite)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-medium text-gray-900">{incoherence.titre}</h4>
              <div className="flex items-center gap-2">
                {getGraviteBadge(incoherence.gravite)}
                {getStatutBadge(incoherence.statut)}
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600">{incoherence.description}</p>

            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 rounded">
                {incoherence.categorie}
              </span>
              <span>•</span>
              <span>{incoherence.regleId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Détails expandables */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
          {/* Conséquence */}
          <div>
            <h5 className="text-xs font-semibold text-gray-700 mb-1">
              Conséquence
            </h5>
            <p className="text-sm text-gray-600">{incoherence.consequence}</p>
          </div>

          {/* Champs affectés */}
          <div>
            <h5 className="text-xs font-semibold text-gray-700 mb-1">
              Champs affectés
            </h5>
            <div className="flex flex-wrap gap-1">
              {incoherence.champsAffectes.map((champ, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200"
                >
                  {champ}
                </span>
              ))}
            </div>
          </div>

          {/* Valeurs actuelles */}
          <div>
            <h5 className="text-xs font-semibold text-gray-700 mb-1">
              Valeurs actuelles
            </h5>
            <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-auto">
              {JSON.stringify(incoherence.valeursActuelles, null, 2)}
            </pre>
          </div>

          {/* Suggestions de résolution */}
          <div>
            <h5 className="text-xs font-semibold text-gray-700 mb-2">
              Suggestions de résolution
            </h5>
            <ul className="space-y-1">
              {incoherence.suggestionsResolution.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Traçabilité si résolu */}
          {incoherence.statut !== 'detectee' && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h5 className="text-xs font-semibold text-gray-700 mb-2">
                Traçabilité
              </h5>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  <span className="font-medium">Par :</span>{' '}
                  {incoherence.utilisateurResolution || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Le :</span>{' '}
                  {incoherence.dateResolution
                    ? new Date(incoherence.dateResolution).toLocaleString('fr-FR')
                    : 'N/A'}
                </div>
                {incoherence.commentaireResolution && (
                  <div>
                    <span className="font-medium">Commentaire :</span>{' '}
                    {incoherence.commentaireResolution}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          {!readonly && incoherence.statut === 'detectee' && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={onValider}
                disabled={actionInProgress}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Valider
              </button>
              <button
                onClick={onIgnorer}
                disabled={actionInProgress}
                className="flex-1 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Ignorer
              </button>
              <button
                onClick={onCorriger}
                disabled={actionInProgress}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wrench className="w-4 h-4" />
                Corriger
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
