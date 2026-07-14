import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Loader2, X, FileText, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl, publicAnonKey } from '../utils/api/info';
import { supabase } from '../utils/api/client';

interface GelAvoirsCheckerProps {
  clientId: string;
  clientData: {
    firstName: string;
    lastName: string;
    name: string;
    email: string;
    phone: string;
    birthDate?: string;
    birthPlace?: string;
    nationality?: string;
    fiscalResidence?: string;
    profession?: string;
  };
  familyInfo?: {
    situationFamiliale?: string;
  };
  onReportGenerated?: (reportData: any) => void;
}

interface VerificationResult {
  date: string;
  status: 'clean' | 'alert' | 'error';
  matches: {
    source: string;
    name: string;
    details: string;
    score: number;
  }[];
  checkedLists: string[];
}

export function GelAvoirsChecker({ clientId, clientData, familyInfo, onReportGenerated }: GelAvoirsCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [history, setHistory] = useState<VerificationResult[]>([]);

  const performCheck = async () => {
    setLoading(true);
    setShowModal(true);

    try {
      // Préparer les données pour la vérification
      const searchData = {
        firstName: clientData.firstName,
        lastName: clientData.lastName,
        fullName: clientData.name,
        birthDate: clientData.birthDate,
        birthPlace: clientData.birthPlace,
        nationality: clientData.nationality || 'France',
        fiscalResidence: clientData.fiscalResidence || 'France',
        profession: clientData.profession,
      };

      console.log('?? Vérification gel des avoirs pour:', searchData);

      // Appel au backend pour vérifier les listes
      const response = await fetch(
        `${apiBaseUrl}/sanctions/check`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            searchData,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        const verification: VerificationResult = {
          date: new Date().toISOString(),
          status: result.matches && result.matches.length > 0 ? 'alert' : 'clean',
          matches: result.matches || [],
          checkedLists: result.checkedLists || [],
        };

        setVerificationResult(verification);
        
        // Ajouter à l'historique
        const newHistory = [verification, ...history];
        setHistory(newHistory);
        
        // Sauvegarder dans localStorage
        localStorage.setItem(
          `gel_avoirs_history_${clientId}`,
          JSON.stringify(newHistory)
        );

        // Générer et enregistrer automatiquement le rapport
        const reportContent = generateReportContent(verification);
        
        if (onReportGenerated) {
          onReportGenerated({
            name: `Rapport Gel des Avoirs - ${clientData.lastName}`,
            content: reportContent,
            date: verification.date,
            status: verification.status,
          });
        }

        if (verification.status === 'clean') {
          toast.success('? Aucune correspondance trouvée - Rapport enregistré dans les documents réglementaires');
        } else {
          toast.error('?? ALERTE : Correspondances trouvées - Rapport enregistré dans les documents réglementaires');
        }
      } else {
        throw new Error('Erreur lors de la vérification');
      }
    } catch (error) {
      console.error('? Erreur vérification gel des avoirs:', error);
      
      const errorResult: VerificationResult = {
        date: new Date().toISOString(),
        status: 'error',
        matches: [],
        checkedLists: [],
      };
      
      setVerificationResult(errorResult);
      toast.error('? Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!verificationResult) return;

    const report = `
+----------------------------------------------------------------+
¦          RAPPORT DE VÉRIFICATION - GEL DES AVOIRS            ¦
+----------------------------------------------------------------+

?? Date de vérification : ${new Date(verificationResult.date).toLocaleString('fr-FR')}

?? IDENTITÉ VÉRIFIÉE
??????????????????????????????????????????????????????????????
• Nom complet       : ${clientData.name}
• Prénom            : ${clientData.firstName}
• Nom               : ${clientData.lastName}
• Date de naissance : ${clientData.birthDate || 'Non renseignée'}
• Lieu de naissance : ${clientData.birthPlace || 'Non renseigné'}
• Nationalité       : ${clientData.nationality || 'Non renseignée'}
• Résidence fiscale : ${clientData.fiscalResidence || 'Non renseignée'}
• Profession        : ${clientData.profession || 'Non renseignée'}

?? LISTES CONSULTÉES
??????????????????????????????????????????????????????????????
${verificationResult.checkedLists.map(list => `? ${list}`).join('\\n')}

${verificationResult.status === 'clean' ? `
? RÉSULTAT : AUCUNE CORRESPONDANCE
??????????????????????????????????????????????????????????????
Aucune correspondance n'a été trouvée sur les listes de sanctions
financières consultées.

Le client ne figure pas sur :
• La liste du Trésor français (sanctions financières)
• Les listes consolidées de l'Union Européenne
• La liste OFAC (Office of Foreign Assets Control - USA)

? Le dossier peut être traité normalement.
` : `
?? ALERTE : CORRESPONDANCES TROUVÉES
??????????????????????????????????????????????????????????????
${verificationResult.matches.length} correspondance(s) trouvée(s) :

${verificationResult.matches.map((match, i) => `
${i + 1}. ${match.name}
   Source       : ${match.source}
   Score        : ${match.score}%
   Détails      : ${match.details}
`).join('\\n')}

?? ACTION REQUISE
??????????????????????????????????????????????????????????????
1. Vérifier manuellement chaque correspondance
2. S'assurer qu'il ne s'agit pas d'un homonyme
3. En cas de correspondance avérée, suspendre immédiatement 
   toute opération et contacter TRACFIN
4. Documenter toutes les démarches entreprises
`}

??????????????????????????????????????????????????????????????
?? CONFORMITÉ RÉGLEMENTAIRE
??????????????????????????????????????????????????????????????
Cette vérification est r??alisée conformément :
• Au règlement (UE) 2015/847 relatif aux virements de fonds
• À l'article L. 561-10-2 du Code monétaire et financier
• Aux obligations de gel des avoirs (article L. 562-4 CMF)

Conservez ce rapport pendant 5 ans minimum.

??????????????????????????????????????????????????????????????
Généré par CRM Patrimoine - ${new Date().toLocaleString('fr-FR')}
`;

    // Télécharger le fichier
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Gel_Avoirs_${clientData.lastName}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('?? Rapport téléchargé');

    // Sauvegarder dans les documents réglementaires
    try {
      // ?? CORRECTION: Utiliser la session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'default';
      const clientDetailKey = `client_detail_${userId}_${clientId}`;
      console.log('?? Clé localStorage utilisée:', clientDetailKey);
      console.log('?? User ID:', userId);
      const storedData = localStorage.getItem(clientDetailKey);

      if (storedData) {
        const clientDetail = JSON.parse(storedData);
        const regulatoryDocs = clientDetail.regulatoryDocs || [];

        // Vérifier si le document existe déjà
        const existingIndex = regulatoryDocs.findIndex((doc: any) => doc.id === 'r4');
        
        const gelAvoirsDoc = {
          id: 'r4',
          name: 'Gel des avoirs',
          status: verificationResult.status === 'clean' ? 'completed' as const : 'pending' as const, // ? Changé : 'completed' si clean, 'pending' si alert
          requiredForStage: 'R1',
          completedDate: verificationResult.status === 'clean' ? verificationResult.date : undefined,
          validatedAt: verificationResult.date,
          content: report,
          date: verificationResult.date,
          alertStatus: verificationResult.status,
        };

        if (existingIndex !== -1) {
          regulatoryDocs[existingIndex] = gelAvoirsDoc;
          console.log('?? Rapport Gel des Avoirs mis à jour dans les documents réglementaires');
        } else {
          regulatoryDocs.push(gelAvoirsDoc);
          console.log('?? Rapport Gel des Avoirs ajouté aux documents réglementaires');
        }

        // Sauvegarder les modifications
        clientDetail.regulatoryDocs = regulatoryDocs;
        localStorage.setItem(clientDetailKey, JSON.stringify(clientDetail));

        // ?? Émettre un événement pour notifier la mise à jour des documents
        window.dispatchEvent(new CustomEvent('documentsUpdated', { 
          detail: { clientId: clientData.id, documentType: 'GelAvoirs' } 
        }));
        console.log('?? Événement documentsUpdated émis');

        toast.success('? Rapport enregistré dans les documents réglementaires');
      }
    } catch (error) {
      console.error('? Erreur sauvegarde dans documents réglementaires:', error);
      toast.error('?? Rapport téléchargé mais erreur lors de la sauvegarde');
    }

    if (onReportGenerated) {
      onReportGenerated({
        name: `Rapport Gel des Avoirs - ${clientData.lastName}`,
        content: report,
        date: verificationResult.date,
        status: verificationResult.status,
      });
    }
  };

  const generateReportContent = (verification: VerificationResult) => `
+----------------------------------------------------------------+
¦          RAPPORT DE VÉRIFICATION - GEL DES AVOIRS            ¦
+----------------------------------------------------------------+

?? Date de vérification : ${new Date(verification.date).toLocaleString('fr-FR')}

?? IDENTITÉ VÉRIFIÉE
?????????????????????????????????????????????????????????????
• Nom complet       : ${clientData.name}
• Prénom            : ${clientData.firstName}
• Nom               : ${clientData.lastName}
• Date de naissance : ${clientData.birthDate || 'Non renseignée'}
• Lieu de naissance : ${clientData.birthPlace || 'Non renseigné'}
• Nationalité       : ${clientData.nationality || 'Non renseignée'}
• Résidence fiscale : ${clientData.fiscalResidence || 'Non renseignée'}
• Profession        : ${clientData.profession || 'Non renseignée'}

?? LISTES CONSULTÉES
??????????????????????????????????????????????????????????????
${verification.checkedLists.map(list => `? ${list}`).join('\n')}

${verification.status === 'clean' ? `
? RÉSULTAT : AUCUNE CORRESPONDANCE
??????????????????????????????????????????????????????????????
Aucune correspondance n'a été trouvée sur les listes de sanctions
financières consultées.

Le client ne figure pas sur :
• La liste du Trésor français (sanctions financières)
• Les listes consolidées de l'Union Européenne
• La liste OFAC (Office of Foreign Assets Control - USA)

? Le dossier peut être traité normalement.
` : `
?? ALERTE : CORRESPONDANCES TROUVÉES
??????????????????????????????????????????????????????????????
${verification.matches.length} correspondance(s) trouvée(s) :

${verification.matches.map((match, i) => `
${i + 1}. ${match.name}
   Source       : ${match.source}
   Score        : ${match.score}%
   Détails      : ${match.details}
`).join('\n')}

?? ACTION REQUISE
??????????????????????????????????????????????????????????????
1. Vérifier manuellement chaque correspondance
2. S'assurer qu'il ne s'agit pas d'un homonyme
3. En cas de correspondance avérée, suspendre immédiatement 
   toute opération et contacter TRACFIN
4. Documenter toutes les démarches entreprises
`}

??????????????????????????????????????????????????????????????
?? CONFORMITÉ RÉGLEMENTAIRE
?????????????????????????????????????????????????????????????
Cette vérification est réalisée conformément :
• Au règlement (UE) 2015/847 relatif aux virements de fonds
• À l'article L. 561-10-2 du Code monétaire et financier
• Aux obligations de gel des avoirs (article L. 562-4 CMF)

Conservez ce rapport pendant 5 ans minimum.

????????????????????????????????????????????????????????????????
Généré par CRM Patrimoine - ${new Date().toLocaleString('fr-FR')}
`;

  return (
    <>
      {/* Bouton de vérification */}
      <button
        onClick={performCheck}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Vérification en cours...</span>
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            <span className="font-medium">Vérifier Gel des Avoirs</span>
          </>
        )}
      </button>

      {/* Modal de résultats */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className={`p-6 border-b ${
              verificationResult?.status === 'clean' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                : verificationResult?.status === 'alert'
                ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
                : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {verificationResult?.status === 'clean' ? (
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                  ) : verificationResult?.status === 'alert' ? (
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Shield className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {loading && 'Vérification en cours...'}
                      {!loading && verificationResult?.status === 'clean' && '? Aucune correspondance'}
                      {!loading && verificationResult?.status === 'alert' && '?? ALERTE : Correspondances trouvées'}
                      {!loading && verificationResult?.status === 'error' && '? Erreur de vérification'}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Vérification du gel des avoirs • {clientData.name}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-4" />
                  <p className="text-gray-600 mb-2">Consultation des listes de sanctions en cours...</p>
                  <p className="text-sm text-gray-500">
                    Cette opération peut prendre quelques secondes
                  </p>
                </div>
              ) : verificationResult ? (
                <div className="space-y-6">
                  {/* Informations vérifiées */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      ?? Identité vérifiée
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Nom complet :</span>
                        <span className="ml-2 font-medium text-gray-900">{clientData.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date de naissance :</span>
                        <span className="ml-2 font-medium text-gray-900">{clientData.birthDate || 'Non renseignée'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Lieu de naissance :</span>
                        <span className="ml-2 font-medium text-gray-900">{clientData.birthPlace || 'Non renseigné'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Nationalité :</span>
                        <span className="ml-2 font-medium text-gray-900">{clientData.nationality || 'Non renseignée'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Résidence fiscale :</span>
                        <span className="ml-2 font-medium text-gray-900">{clientData.fiscalResidence || 'Non renseignée'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Profession :</span>
                        <span className="ml-2 font-medium text-gray-900">{clientData.profession || 'Non renseignée'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Listes consultées */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      ?? Listes consultées
                    </h4>
                    <div className="space-y-2">
                      {verificationResult.checkedLists.map((list, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-blue-800">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>{list}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Résultats */}
                  {verificationResult.status === 'clean' ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-green-900 text-lg mb-2">
                            Aucune correspondance trouvée
                          </h4>
                          <p className="text-sm text-green-800 mb-3">
                            Le client ne figure sur aucune des listes de sanctions financières consultées.
                          </p>
                          <p className="text-sm text-green-700 font-medium">
                            ? Le dossier peut être traité normalement
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : verificationResult.status === 'alert' ? (
                    <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-red-900 text-lg mb-2">
                            ?? ALERTE : Correspondances trouvées
                          </h4>
                          <p className="text-sm text-red-800 mb-3">
                            {verificationResult.matches.length} correspondance(s) trouvée(s) sur les listes de sanctions.
                          </p>
                        </div>
                      </div>

                      {/* Correspondances */}
                      <div className="space-y-3">
                        {verificationResult.matches.map((match, i) => (
                          <div key={i} className="bg-white rounded-lg p-4 border border-red-200">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{match.name}</h5>
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                Score: {match.score}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Source :</strong> {match.source}
                            </p>
                            <p className="text-sm text-gray-700">
                              {match.details}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Actions requises */}
                      <div className="mt-4 p-4 bg-red-100 rounded-lg">
                        <h5 className="font-semibold text-red-900 mb-2">?? Actions requises :</h5>
                        <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                          <li>Vérifier manuellement chaque correspondance</li>
                          <li>S'assurer qu'il ne s'agit pas d'un homonyme</li>
                          <li>En cas de correspondance avérée, suspendre toute opération</li>
                          <li>Contacter TRACFIN immédiatement</li>
                          <li>Documenter toutes les démarches</li>
                        </ul>
                      </div>
                    </div>
                  ) : null}

                  {/* Note légale */}
                  <div className="bg-gray-100 rounded-lg p-4 text-xs text-gray-600">
                    <p className="font-semibold mb-2">?? Conformité réglementaire :</p>
                    <p className="mb-2">
                      Cette vérification est réalisée conformément au règlement (UE) 2015/847 relatif aux virements de fonds, 
                      à l'article L. 561-10-2 du Code monétaire et financier et aux obligations de gel des avoirs (article L. 562-4 CMF).
                    </p>
                    <p className="font-medium text-gray-700">
                      ?? Conservez ce rapport pendant 5 ans minimum.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            {!loading && verificationResult && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="text-xs text-gray-600">
                  Vérification effectuée le {new Date(verificationResult.date).toLocaleString('fr-FR')}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={downloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le rapport
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
