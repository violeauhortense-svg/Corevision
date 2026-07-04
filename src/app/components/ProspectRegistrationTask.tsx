import { useState, useEffect } from 'react';
import { CheckCircle, Circle, Calendar, Edit2, Save, X } from 'lucide-react';
import type { Task } from '../types/client';

interface ProspectRegistrationTaskProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

const PROSPECT_ORIGINS = [
  'Recommandation client',
  'Recommandation confrère',
  'Recommandation professionnelle (banquier, notaire, avocat, expert-comptable)',
  'Site web / Formulaire de contact',
  'Réseaux sociaux (LinkedIn, Facebook, Instagram)',
  'Publicité en ligne (Google Ads, Facebook Ads)',
  'Publicité traditionnelle (presse, radio, affichage)',
  'Salon professionnel / Événement',
  'Conférence / Formation',
  'Prospection téléphonique',
  'Prospection par email',
  'Démarchage direct',
  'Partenariat commercial',
  'Annuaire professionnel',
  'Bouche-à-oreille',
  'Client existant (nouveau projet)',
  'Ancien client (réactivation)',
  'Autre',
];

export function ProspectRegistrationTask({ task, onUpdate }: ProspectRegistrationTaskProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localOrigin, setLocalOrigin] = useState(task.prospectOrigin || '');
  const [localReferrer, setLocalReferrer] = useState(task.referrerName || '');

  // Synchroniser avec les props
  useEffect(() => {
    setLocalOrigin(task.prospectOrigin || '');
    setLocalReferrer(task.referrerName || '');
  }, [task.prospectOrigin, task.referrerName]);

  const handleSave = () => {
    onUpdate(task.id, {
      prospectOrigin: localOrigin,
      referrerName: localReferrer,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalOrigin(task.prospectOrigin || '');
    setLocalReferrer(task.referrerName || '');
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    onUpdate(task.id, {
      completed: !task.completed,
    });
  };

  // Vérifier si l'origine nécessite un nom de recommandateur
  const needsReferrerName = localOrigin === 'Recommandation client' || localOrigin === 'Recommandation confrère';

  return (
    <div className={`border-2 rounded-lg transition-all ${
      task.completed 
        ? 'border-green-300 bg-green-50/50' 
        : 'border-blue-300 bg-blue-50/50'
    }`}>
      <div className="p-4">
        {/* En-tête avec titre et toggle */}
        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={handleToggleComplete}
            className="mt-1 flex-shrink-0 transition-transform hover:scale-110"
          >
            {task.completed ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Circle className="w-6 h-6 text-blue-600" />
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className={`text-lg font-bold ${
                task.completed ? 'text-green-900' : 'text-blue-900'
              }`}>
                {task.title}
              </h4>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              )}
            </div>
            
            {/* Badge de statut */}
            <div className="flex items-center gap-2 mt-2">
              {task.completed && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  ✓ Validé
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                Créé le {new Date(task.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        {/* Formulaire des détails */}
        <div className="ml-9 space-y-3 border-t border-gray-200 pt-4">
          {/* Origine du prospect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Origine du prospect <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <select
                value={localOrigin}
                onChange={(e) => setLocalOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionnez une origine</option>
                {PROSPECT_ORIGINS.map((origin) => (
                  <option key={origin} value={origin}>
                    {origin}
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                {localOrigin || <span className="text-gray-400 italic">Non renseigné</span>}
              </div>
            )}
          </div>

          {/* Nom du recommandateur (conditionnel) */}
          {(needsReferrerName || localReferrer) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du recommandateur {needsReferrerName && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={localReferrer}
                  onChange={(e) => setLocalReferrer(e.target.value)}
                  placeholder="Nom et prénom du recommandateur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg">
                  {localReferrer || <span className="text-gray-400 italic">Non renseigné</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Note informative */}
        {task.completed && !isEditing && (
          <div className="ml-9 mt-3 p-2 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800">
              ✓ Cette tâche est validée mais reste modifiable à tout moment
            </p>
          </div>
        )}
      </div>
    </div>
  );
}