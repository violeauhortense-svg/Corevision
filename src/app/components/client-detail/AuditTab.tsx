import { FolderOpen, FileText, CheckCircle, Archive } from 'lucide-react';
import { RecommandationsModule } from './RecommandationsModule';
import type { AuditRecommendation } from './types';

interface Preconisation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface AuditTabProps {
  clientId: string;
  clientName?: string;
  recommendations: AuditRecommendation[];
  onUpdateRecommendations: (recommendations: AuditRecommendation[]) => Promise<void> | void;
  auditCoreVision?: string;
  presentationCoreVision?: string;
  preconisationsCoreVision?: Preconisation[];
  auditCoreVisionValidatedAt?: string;
}

export function AuditTab({
  clientId,
  clientName = 'Client',
  recommendations,
  onUpdateRecommendations,
  auditCoreVision,
  presentationCoreVision,
  preconisationsCoreVision,
  auditCoreVisionValidatedAt,
}: AuditTabProps) {
  const hasDossier = Boolean(auditCoreVision || presentationCoreVision || (preconisationsCoreVision && preconisationsCoreVision.length > 0));

  return (
    <div className="p-6 space-y-8">

      {/* Module Recommandations */}
      <RecommandationsModule clientId={clientId} recommendations={recommendations} onUpdate={onUpdateRecommendations} />

      {/* En-tête */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <Archive className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Audit Patrimonial Validé</h3>
            <p className="text-indigo-100 mt-1">
              Le dossier complet validé depuis CoreVision
            </p>
          </div>
        </div>
      </div>

      {/* Message informatif */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">
              ℹ️ Comment ça marche ?
            </h4>
            <p className="text-sm text-blue-800">
              Ce dossier est rédigé et validé depuis l'outil <strong>CoreVision</strong>.
              Une fois validé, il apparaît ici en lecture seule.
            </p>
          </div>
        </div>
      </div>

      {/* Dossier CoreVision validé */}
      {!hasDossier ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun audit validé
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Le dossier validé depuis CoreVision apparaîtra ici automatiquement
          </p>
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{clientName}</h4>
                <p className="text-sm text-gray-600">Dossier CoreVision</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                VALIDÉ
              </span>
              {auditCoreVisionValidatedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(auditCoreVisionValidatedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>

          {presentationCoreVision && (
            <div>
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                📋 Présentation
              </h5>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{presentationCoreVision}</p>
            </div>
          )}

          {auditCoreVision && (
            <div className="pt-4 border-t border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                📄 Audit
              </h5>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{auditCoreVision}</p>
            </div>
          )}

          {preconisationsCoreVision && preconisationsCoreVision.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                💡 Préconisations ({preconisationsCoreVision.length})
              </h5>
              <div className="space-y-3">
                {preconisationsCoreVision.map((preco) => (
                  <div key={preco.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <h6 className="font-semibold text-gray-900">{preco.title}</h6>
                    <p className="text-sm text-gray-600 mt-1">{preco.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        preco.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : preco.priority === 'medium'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {preco.priority === 'high' ? 'Prioritaire' : preco.priority === 'medium' ? 'Moyen' : 'Faible'}
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {preco.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
