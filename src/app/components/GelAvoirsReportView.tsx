import { Shield, CheckCircle2, AlertTriangle, Calendar, User, FileText, CheckCircle, Lock } from 'lucide-react';

interface GelAvoirsReportViewProps {
  content: string;
}

export function GelAvoirsReportView({ content }: GelAvoirsReportViewProps) {
  const isClean = content.includes('AUCUNE CORRESPONDANCE');
  const isAlert = content.includes('CORRESPONDANCES TROUVÉES');
  
  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-8 space-y-6">
      {/* Header avec statut */}
      <div className={`rounded-xl p-8 text-center ${
        isClean 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : 'bg-gradient-to-r from-red-500 to-orange-600'
      } shadow-2xl`}>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Shield className="w-16 h-16 text-white" />
          <div className="text-left">
            <h2 className="text-3xl font-bold text-white mb-1">
              RAPPORT DE VÉRIFICATION
            </h2>
            <p className="text-xl text-white/90 font-semibold">
              Gel des Avoirs & Sanctions Financières
            </p>
          </div>
        </div>
        
        {isClean ? (
          <div className="bg-white/20 backdrop-blur rounded-lg p-4 mt-4">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">
                ✅ AUCUNE CORRESPONDANCE TROUVÉE
              </span>
            </div>
            <p className="text-white/90 mt-2 text-sm">
              Le dossier peut être traité normalement
            </p>
          </div>
        ) : (
          <div className="bg-white/20 backdrop-blur rounded-lg p-4 mt-4">
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-8 h-8 text-white" />
              <span className="text-2xl font-bold text-white">
                ⚠️ ALERTE : CORRESPONDANCES TROUVÉES
              </span>
            </div>
            <p className="text-white/90 mt-2 text-sm">
              Actions requises - Suspendre toute opération
            </p>
          </div>
        )}
      </div>

      {/* Date de vérification */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Date de vérification</p>
            <p className="text-lg font-bold text-gray-900">
              {content.match(/Date de vérification : (.+)/)?.[1] || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Identité vérifiée */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-100 rounded-lg">
            <User className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Identité Vérifiée</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Nom complet', icon: '👤' },
            { label: 'Prénom', icon: '✍️' },
            { label: 'Nom', icon: '📝' },
            { label: 'Date de naissance', icon: '🎂' },
            { label: 'Lieu de naissance', icon: '📍' },
            { label: 'Nationalité', icon: '🌍' },
            { label: 'Résidence fiscale', icon: '🏠' },
            { label: 'Profession', icon: '💼' }
          ].map(({ label, icon }) => {
            const regex = new RegExp(`• ${label}\\s+: (.+)`, 'i');
            const value = content.match(regex)?.[1]?.trim() || 'Non renseigné';
            return (
              <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                  <span>{icon}</span>
                  <span className="font-medium">{label}</span>
                </p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Listes consultées */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Listes Consultées</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Direction générale du Trésor (France)', flag: '🇫🇷' },
            { name: 'Union Européenne - Listes consolidées', flag: '🇪🇺' },
            { name: 'OFAC (USA)', flag: '🇺🇸' }
          ].map(({ name, flag }) => (
            <div key={name} className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-2xl">{flag}</span>
              <span className="text-sm font-medium text-gray-900">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Résultat détaillé */}
      <div className={`rounded-xl shadow-lg p-6 ${
        isClean 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' 
          : 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300'
      }`}>
        <div className="flex items-start gap-4">
          {isClean ? (
            <div className="p-4 bg-green-500 rounded-xl">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          ) : (
            <div className="p-4 bg-red-500 rounded-xl">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
          )}
          
          <div className="flex-1">
            {isClean ? (
              <>
                <h3 className="text-2xl font-bold text-green-900 mb-3">
                  ✅ Aucune Correspondance
                </h3>
                <p className="text-green-800 mb-4 leading-relaxed">
                  Le client ne figure sur aucune des listes de sanctions financières consultées.
                </p>
                <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-green-200">
                  <p className="font-semibold text-green-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Le dossier peut être traité normalement
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-green-800">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Aucune restriction ne s'applique
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Relation commerciale autorisée
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                      Opérations financières non bloquées
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-red-900 mb-3">
                  ⚠️ ALERTE : Correspondances Trouvées
                </h3>
                <p className="text-red-800 mb-4 leading-relaxed">
                  Des correspondances ont été détectées sur les listes de sanctions. Actions immédiates requises.
                </p>
                <div className="bg-white/60 backdrop-blur rounded-lg p-4 border border-red-300">
                  <p className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Actions Requises Immédiatement
                  </p>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">1.</span>
                      <span>Vérifier manuellement chaque correspondance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">2.</span>
                      <span>S'assurer qu'il ne s'agit pas d'un homonyme</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">3.</span>
                      <span>Suspendre immédiatement toute opération</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">4.</span>
                      <span>Contacter TRACFIN sans délai</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 font-bold mt-0.5">5.</span>
                      <span>Documenter toutes les démarches entreprises</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Conformité réglementaire */}
      <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white/20 backdrop-blur rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold">Conformité Réglementaire</h3>
        </div>
        
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 space-y-3">
          <p className="text-sm leading-relaxed text-white/90">
            Cette vérification est réalisée conformément :
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
              <span>Règlement (UE) 2015/847 relatif aux virements de fonds</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
              <span>Article L. 561-10-2 du Code monétaire et financier</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
              <span>Obligations de gel des avoirs (article L. 562-4 CMF)</span>
            </li>
          </ul>
          
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              ⚠️ Conservation obligatoire : 5 ans minimum
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-600 pt-4">
        <p className="font-medium">
          Généré par CRM Patrimoine - {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
}
