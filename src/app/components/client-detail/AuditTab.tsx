import { useState, useEffect } from 'react';
import { FolderOpen, FileText, Clock, CheckCircle, Archive } from 'lucide-react';

interface AuditTabProps {
  clientId: string;
  clientName?: string;
}

export function AuditTab({ clientId, clientName = 'Client' }: AuditTabProps) {
  const [dossiersArchives, setDossiersArchives] = useState<any[]>([]);
  
  useEffect(() => {
    chargerDossiersArchives();
  }, [clientId]);
  
  const chargerDossiersArchives = () => {
    // Chercher tous les audits figés pour ce client
    const allKeys = Object.keys(localStorage).filter(key => 
      key.startsWith(`audit_fige_${clientId}_`)
    );
    
    const dossiers = allKeys.map(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          return JSON.parse(data);
        } catch (e) {
          return null;
        }
      }
      return null;
    }).filter(d => d !== null);
    
    // Trier par date de figement (plus récent en premier)
    dossiers.sort((a, b) => 
      new Date(b.dateFigement || 0).getTime() - new Date(a.dateFigement || 0).getTime()
    );
    
    setDossiersArchives(dossiers);
  };
  
  return (
    <div className="p-6 space-y-6">
      
      {/* En-tête */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
            <Archive className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Audits Patrimon iaux Validés</h3>
            <p className="text-indigo-100 mt-1">
              Consultez les dossiers complets figés et archivés
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
              Les dossiers complets sont créés et validés depuis l'outil <strong>CoreVision</strong>. 
              Une fois validés, ils apparaissent ici en lecture seule comme archive permanente.
            </p>
          </div>
        </div>
      </div>
      
      {/* Liste des audits archivés */}
      {dossiersArchives.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun audit validé
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            Les dossiers clients validés depuis CoreVision apparaîtront ici automatiquement
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
            <Archive className="w-5 h-5 text-indigo-600" />
            Dossiers Archivés ({dossiersArchives.length})
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {dossiersArchives.map((dossier, index) => (
              <div 
                key={index}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all hover:border-indigo-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{dossier.clientName}</h4>
                      <p className="text-sm text-gray-600">Audit Patrimonial Complet</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    VALIDÉ
                  </span>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {dossier.dateDecouverte && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Découverte</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(dossier.dateDecouverte).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  )}
                  {dossier.dateGenerationAudit && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Génération</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(dossier.dateGenerationAudit).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  )}
                  {dossier.datePresentation && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Présentation</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(dossier.datePresentation).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  )}
                  {dossier.dateFigement && (
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-xs text-gray-500">Archivage</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(dossier.dateFigement).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Progression et contenu */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Complétude</span>
                    <span className="font-bold text-green-600">{dossier.progression}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${dossier.progression}%` }}
                    />
                  </div>
                  
                  {/* Sections complétées */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Sections générées :</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(dossier.sections || {}).map(([key, section]: [string, any]) => (
                        section.status === 'completed' && (
                          <span 
                            key={key}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" />
                            {key.replace('section', 'Section ').replace('_', ' ')}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
}
