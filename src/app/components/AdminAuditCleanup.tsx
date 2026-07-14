import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, Trash2, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { auditAndCleanupOrphanedData, displayAuditReport } from '../utils/cleanupClientData';

export function AdminAuditCleanup() {
  const [isRunning, setIsRunning] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleRunAudit = async () => {
    try {
      setIsRunning(true);
      setAuditResult(null);

      const result = await auditAndCleanupOrphanedData();

      setAuditResult(result);
      displayAuditReport(result.summary);

      if (result.success) {
        toast.success('✅ Audit terminé avec succès!');
      } else {
        toast.error('⚠️ Audit terminé avec des erreurs. Voir la console.');
      }
    } catch (error) {
      console.error('❌ Erreur audit:', error);
      toast.error('Erreur lors de l\'audit');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-2">🧹 Audit et Nettoyage Global</h3>
          <p className="text-sm text-gray-600 mb-4">
            Scanne TOUTES les données de l'application et supprime les données orphelines
            (RDV, tâches, documents, etc. pour les clients supprimés).
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
            <p className="text-xs text-orange-800">
              <strong>⚠️ Attention:</strong> Cette action scannera et nettoiera la base de données entière.
              Cela peut prendre du temps selon la taille de la base de données.
            </p>
          </div>

          <Button
            onClick={handleRunAudit}
            disabled={isRunning}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Audit en cours...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Lancer l'audit et nettoyer
              </>
            )}
          </Button>

          {auditResult && (
            <div className="mt-4 space-y-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <Eye className="w-4 h-4" />
                {showDetails ? 'Masquer' : 'Afficher'} les résultats
              </button>

              {showDetails && (
                <div className="bg-gray-50 rounded border border-gray-300 p-3 text-xs">
                  <div className="space-y-2 font-mono">
                    {auditResult.success ? (
                      <div className="text-green-700">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4" />
                          <strong>Audit réussi</strong>
                        </div>
                        <div>✅ Clients vérifiés: {auditResult.summary.totalClientsChecked}</div>
                        <div>✅ RDV orphelins supprimés: {auditResult.summary.orphanedRdvRemoved}</div>
                        <div>✅ Tâches orphelines supprimées: {auditResult.summary.orphanedTasksRemoved}</div>
                        <div>✅ Entrées localStorage supprimées: {auditResult.summary.orphanedEntriesRemovedFromStorage}</div>
                      </div>
                    ) : (
                      <div className="text-red-700">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <strong>Audit échoué</strong>
                        </div>
                        <div>Erreurs: {auditResult.summary.errors.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
