import { useState } from 'react';
import { Mail, Check, AlertCircle, Clock, MousePointerClick, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Task, EmailSendHistory } from '../types/client';

interface MeetingConfirmationTaskProps {
  task: Task;
  onToggle: (taskId: string) => Promise<void>;
  onUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onSendEmail: (task: Task) => void;
}

export function MeetingConfirmationTask({ 
  task, 
  onToggle, 
  onUpdate, 
  onSendEmail 
}: MeetingConfirmationTaskProps) {
  const [showHistory, setShowHistory] = useState(false);
  
  const emailHistory = task.emailHistory || [];
  const hasHistory = emailHistory.length > 0;
  const lastEmail = emailHistory[emailHistory.length - 1];
  
  // Fonction pour obtenir le style du badge selon le statut
  const getStatusBadge = (status: EmailSendHistory['status']) => {
    switch (status) {
      case 'sent':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Envoyé',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-300'
        };
      case 'delivered':
        return {
          icon: <Check className="w-3 h-3" />,
          label: 'Délivré',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-300'
        };
      case 'opened':
        return {
          icon: <Mail className="w-3 h-3" />,
          label: 'Ouvert',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-300'
        };
      case 'clicked':
        return {
          icon: <MousePointerClick className="w-3 h-3" />,
          label: 'Cliqué',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-300'
        };
      case 'bounced':
        return {
          icon: <XCircle className="w-3 h-3" />,
          label: 'Rebond',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-300'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Erreur',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-300'
        };
      default:
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'En attente',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-300'
        };
    }
  };

  return (
    <div className={`border-2 rounded-xl p-5 transition-all ${
      task.completed
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
        : 'bg-white border-gray-200 hover:border-indigo-300'
    }`}>
      {/* En-tête de la tâche avec checkbox */}
      <div className="flex items-start gap-4 mb-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 mt-1 cursor-pointer"
        />
        <div className="flex-1">
          <h4 className={`font-semibold text-lg ${
            task.completed ? 'text-green-800 line-through' : 'text-gray-900'
          }`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
        </div>
        {task.completed && (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <Check className="w-3 h-3" />
            Complétée
          </span>
        )}
      </div>

      {/* Bouton pour envoyer l'email */}
      <div className="mb-4">
        <button
          onClick={() => onSendEmail(task)}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 text-sm font-medium shadow-md"
        >
          <Mail className="w-4 h-4" />
          {hasHistory ? 'Renvoyer l\'email de confirmation de RDV' : 'Envoyer l\'email de confirmation de RDV'}
        </button>
      </div>

      {/* Statut du dernier envoi - Cartouches */}
      {hasHistory && (
        <div className="space-y-3">
          {/* Dernier envoi - Vue résumée */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-bold text-gray-900">📧 Dernier envoi</h5>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {showHistory ? 'Masquer l\'historique' : `Voir l'historique (${emailHistory.length})`}
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {/* Badge de statut */}
              {(() => {
                const statusBadge = getStatusBadge(lastEmail.status);
                return (
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 ${statusBadge.bgColor} ${statusBadge.textColor} ${statusBadge.borderColor} font-medium text-sm`}>
                    {statusBadge.icon}
                    {statusBadge.label}
                  </span>
                );
              })()}
              
              {/* Badge de date */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200 text-gray-700 text-sm">
                <Clock className="w-3 h-3" />
                {new Date(lastEmail.sentAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {/* Badge de destinataire */}
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border-2 border-gray-200 text-gray-700 text-sm truncate max-w-xs">
                <Mail className="w-3 h-3 flex-shrink-0" />
                {lastEmail.recipient}
              </span>
              
              {/* Badge du nombre total d'envois */}
              {emailHistory.length > 1 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 rounded-lg border-2 border-indigo-300 text-indigo-700 text-sm font-bold">
                  {emailHistory.length} envoi{emailHistory.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Message d'erreur si applicable */}
            {lastEmail.status === 'error' && lastEmail.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700">
                  <strong>Erreur :</strong> {lastEmail.error}
                </p>
              </div>
            )}
          </div>

          {/* Historique complet */}
          {showHistory && emailHistory.length > 1 && (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <h5 className="text-sm font-bold text-gray-900 mb-3">📜 Historique des envois</h5>
              <div className="space-y-2">
                {emailHistory.slice(0, -1).reverse().map((email) => {
                  const statusBadge = getStatusBadge(email.status);
                  return (
                    <div 
                      key={email.id} 
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      {/* Statut */}
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusBadge.bgColor} ${statusBadge.textColor}`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                      </span>
                      
                      {/* Date */}
                      <span className="text-xs text-gray-600">
                        {new Date(email.sentAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      
                      {/* Destinataire */}
                      <span className="text-xs text-gray-600 flex-1 truncate">
                        → {email.recipient}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info supplémentaire */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              <strong>Note :</strong> Les statuts sont mis à jour automatiquement lorsque le client interagit avec l'email (ouverture, clics, etc.)
            </p>
          </div>
        </div>
      )}

      {/* Message si aucun envoi */}
      {!hasHistory && (
        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 text-center border-2 border-dashed border-gray-300">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            Aucun email envoyé pour l'instant
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Cliquez sur le bouton ci-dessus pour envoyer l'email de confirmation
          </p>
        </div>
      )}
    </div>
  );
}