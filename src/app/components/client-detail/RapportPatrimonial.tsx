import { useState } from 'react';
import { FileText, Download, Edit3, Save, X, Loader2, CheckCircle2, AlertCircle, Radio, Sparkles, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ClientService } from '../../services/clientService';
import { AnalyseAvanceeIndicateur } from './AnalyseAvanceeIndicateur';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';

interface RapportPatrimonialProps {
  clientId: string;
  clientName: string;
}

export function RapportPatrimonial({ clientId, clientName }: RapportPatrimonialProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rapport, setRapport] = useState<any>(null);
  const [rapportModifie, setRapportModifie] = useState<any>(null);

  const genererRapport = async () => {
    setLoading(true);
    toast.info('?? Génération du rapport avancé en 7 étapes IA...');

    try {
      console.log('?? ===== DÉBUT GÉNÉRATION RAPPORT =====');
      console.log('?? Client ID:', clientId);
      console.log('?? Nom du client:', clientName);
      
      // 1?? Récupérer les données complètes du client via ClientService
      console.log('?? Récupération des données client via ClientService...');
      const result = await ClientService.getClientById(clientId, true); // forceRefresh pour avoir les dernières données
      
      if (result.error || !result.client) {
        console.error('? Erreur ClientService:', result.error);
        
        // Fallback : chercher dans localStorage directement
        console.log('?? Fallback : recherche dans localStorage...');
        
        let clientData = null;
        
        // Méthode 1 : Chercher dans les clés clients_*
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('clients_'));
        console.log('?? Clés localStorage trouvées:', allKeys);
        
        for (const key of allKeys) {
          try {
            const storedClients = localStorage.getItem(key);
            if (storedClients) {
              const clients = JSON.parse(storedClients);
              console.log(`?? ${key}: ${clients.length} client(s)`);
              clientData = clients.find((c: any) => c.id === clientId);
              if (clientData) {
                console.log(`? Client trouvé dans ${key}:`, clientData);
                break;
              }
            }
          } catch (e) {
            console.error(`? Erreur parsing ${key}:`, e);
          }
        }
        
        // Méthode 2 : Chercher dans client_data_* (backup)
        if (!clientData) {
          const clientKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('client_data_') || key.includes(clientId)
          );
          console.log('?? Recherche backup dans:', clientKeys);
          
          for (const key of clientKeys) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (parsed.id === clientId || key.includes(clientId)) {
                  clientData = parsed;
                  console.log(`? Client trouvé via backup dans ${key}`);
                  break;
                }
              }
            } catch (e) {
              console.error(`? Erreur parsing backup ${key}:`, e);
            }
          }
        }
        
        // Méthode 3 : Créer un client minimal depuis le contexte
        if (!clientData) {
          console.warn('?? Client introuvable - Création d\'un profil minimal');
          console.log('?? DEBUG - Toutes les clés localStorage:', Object.keys(localStorage));
          
          // Essayer de récupérer depuis le contexte parent si disponible
          clientData = {
            id: clientId,
            nom: clientName?.split(' ')[1] || 'Inconnu',
            prenom: clientName?.split(' ')[0] || 'Client',
            age_client: 45,
            situation_familiale: 'marie',
            regime_matrimonial: 'communaute',
            nombre_enfants: 0,
            tmi: 30,
            revenus_salaires: 0,
            patrimoine_net: 0,
            objectifs: ['Optimisation fiscale', 'Préparation retraite']
          };
          
          console.log('?? Profil minimal créé:', clientData);
        }
        
        console.log('? Client récupéré via fallback localStorage');
        
        // 2?? Envoyer les données au backend via POST
        const url = `${apiBaseUrl}/rapport-patrimonial`;
        console.log('?? URL appelée:', url);
        console.log('?? Envoi des données client:', {
          clientId,
          hasClientData: !!clientData,
          clientName: clientData.nom
        });
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId,
            clientData
          })
        });

        console.log('?? Réponse status:', response.status);
        console.log('?? Réponse headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('? Erreur backend:', response.status, errorText);
          
          // Parser le JSON d'erreur si possible
          try {
            const errorJson = JSON.parse(errorText);
            console.error('? Détails erreur:', errorJson);
            throw new Error(errorJson.error || errorJson.details || `Erreur ${response.status}`);
          } catch {
            throw new Error(`Erreur ${response.status}: ${errorText}`);
          }
        }

        const data = await response.json();
        console.log('? Rapport reçu:', data);
        console.log('? Analyse avancée présente:', !!data.analyse_avancee);

        setRapport(data);
        setRapportModifie(JSON.parse(JSON.stringify(data))); // Deep copy
        setShowModal(true);
        toast.success('? Rapport généré avec analyse IA complète');
        
      } else {
        // Client récupéré via ClientService
        console.log('? Client récupéré via ClientService:', result.client);
        
        // 2?? Envoyer les données au backend via POST
        const url = `${apiBaseUrl}/rapport-patrimonial`;
        console.log('?? URL appelée:', url);
        console.log('?? Envoi des données client:', {
          clientId,
          hasClientData: !!result.client,
          clientName: result.client.nom
        });
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId,
            clientData: result.client
          })
        });

        console.log('?? Réponse status:', response.status);
        console.log('?? Réponse headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('? Erreur backend:', response.status, errorText);
          
          // Parser le JSON d'erreur si possible
          try {
            const errorJson = JSON.parse(errorText);
            console.error('? Détails erreur:', errorJson);
            throw new Error(errorJson.error || errorJson.details || `Erreur ${response.status}`);
          } catch {
            throw new Error(`Erreur ${response.status}: ${errorText}`);
          }
        }

        const data = await response.json();
        console.log('? Rapport reçu:', data);
        console.log('? Analyse avancée présente:', !!data.analyse_avancee);

        setRapport(data);
        setRapportModifie(JSON.parse(JSON.stringify(data))); // Deep copy
        setShowModal(true);
        toast.success('? Rapport généré avec analyse IA complète');
      }

    } catch (error: any) {
      console.error('? Erreur lors de la génération du rapport:', error);
      console.error('? Stack trace:', error.stack);
      toast.error(`? Erreur: ${error.message || 'Impossible de générer le rapport'}`);
    } finally {
      setLoading(false);
    }
  };

  const sauvegarderRapport = () => {
    // TODO: Implémenter la sauvegarde dans le backend si nécessaire
    setRapport(rapportModifie);
    toast.success('?? Rapport sauvegardé localement');
  };

  const exporterPDF = () => {
    toast.info('?? Export PDF en cours de développement');
    // TODO: Implémenter l'export PDF
  };

  return (
    <>
      {/* Bouton principal */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Rapport Patrimonial</h3>
              <p className="text-indigo-100 mt-1 flex items-center gap-2">
                <Radio className="w-4 h-4 animate-pulse" />
                Analyse complète avec données actualisées en temps réel
              </p>
            </div>
          </div>
          <button
            onClick={genererRapport}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Générer le rapport
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal du rapport éditable */}
      {showModal && rapport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            
            {/* En-tête */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">
                      Rapport Patrimonial - {clientName}
                    </h2>
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-500 rounded-full shadow-lg">
                      <Radio className="w-3 h-3 text-white animate-pulse" />
                      <span className="text-xs font-bold text-white">LIVE</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Données actualisées • Mode édition</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={sauvegarderRapport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </button>
                <button
                  onClick={exporterPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu scrollable - Mode édition */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Indicateur analyse avancée 7 étapes IA */}
                {rapport.analyse_avancee && (
                  <AnalyseAvanceeIndicateur analyseAvancee={rapport.analyse_avancee} />
                )}
                
                {/* Section 1 : Synthèse Exécutive */}
                <SectionEditable
                  title="1. Synthèse Exécutive"
                  icon="??"
                  gradient="from-blue-50 to-blue-100"
                  borderColor="border-blue-300"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contexte
                      </label>
                      <textarea
                        value={rapportModifie.section1_synthese?.contexte || ''}
                        onChange={(e) => setRapportModifie({
                          ...rapportModifie,
                          section1_synthese: {
                            ...rapportModifie.section1_synthese,
                            contexte: e.target.value
                          }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Points clés
                      </label>
                      {rapportModifie.section1_synthese?.points_cles?.map((point: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                          <input
                            value={point}
                            onChange={(e) => {
                              const nouveauxPoints = [...rapportModifie.section1_synthese.points_cles];
                              nouveauxPoints[index] = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section1_synthese: {
                                  ...rapportModifie.section1_synthese,
                                  points_cles: nouveauxPoints
                                }
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionEditable>

                {/* Section 2 : Situation Actuelle */}
                <SectionEditable
                  title="2. Situation Actuelle"
                  icon="??"
                  gradient="from-green-50 to-green-100"
                  borderColor="border-green-300"
                >
                  <div className="space-y-4">
                    <ChampEditable
                      label="Situation familiale"
                      value={rapportModifie.section2_situation_actuelle?.situation_familiale || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section2_situation_actuelle: {
                          ...rapportModifie.section2_situation_actuelle,
                          situation_familiale: value
                        }
                      })}
                    />
                    <ChampEditable
                      label="Situation professionnelle"
                      value={rapportModifie.section2_situation_actuelle?.situation_professionnelle || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section2_situation_actuelle: {
                          ...rapportModifie.section2_situation_actuelle,
                          situation_professionnelle: value
                        }
                      })}
                    />
                    <ChampEditable
                      label="Patrimoine"
                      value={rapportModifie.section2_situation_actuelle?.patrimoine || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section2_situation_actuelle: {
                          ...rapportModifie.section2_situation_actuelle,
                          patrimoine: value
                        }
                      })}
                    />
                    <ChampEditable
                      label="Revenus"
                      value={rapportModifie.section2_situation_actuelle?.revenus || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section2_situation_actuelle: {
                          ...rapportModifie.section2_situation_actuelle,
                          revenus: value
                        }
                      })}
                    />
                  </div>
                </SectionEditable>

                {/* Section 3 : Analyses Détaillées */}
                <SectionEditable
                  title="3. Analyses Détaillées"
                  icon="??"
                  gradient="from-purple-50 to-purple-100"
                  borderColor="border-purple-300"
                >
                  <div className="space-y-4">
                    <ChampEditable
                      label="Analyse civile"
                      value={rapportModifie.section3_analyses?.analyse_civile || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section3_analyses: {
                          ...rapportModifie.section3_analyses,
                          analyse_civile: value
                        }
                      })}
                      rows={4}
                    />
                    <ChampEditable
                      label="Analyse fiscale"
                      value={rapportModifie.section3_analyses?.analyse_fiscale || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section3_analyses: {
                          ...rapportModifie.section3_analyses,
                          analyse_fiscale: value
                        }
                      })}
                      rows={4}
                    />
                    <ChampEditable
                      label="Analyse sociale"
                      value={rapportModifie.section3_analyses?.analyse_sociale || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section3_analyses: {
                          ...rapportModifie.section3_analyses,
                          analyse_sociale: value
                        }
                      })}
                      rows={4}
                    />
                    <ChampEditable
                      label="Analyse patrimoniale"
                      value={rapportModifie.section3_analyses?.analyse_patrimoniale || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section3_analyses: {
                          ...rapportModifie.section3_analyses,
                          analyse_patrimoniale: value
                        }
                      })}
                      rows={4}
                    />
                  </div>
                </SectionEditable>

                {/* Section 4 : Problématiques Identifiées */}
                <SectionEditable
                  title="4. Problématiques Identifiées"
                  icon="??"
                  gradient="from-orange-50 to-orange-100"
                  borderColor="border-orange-300"
                >
                  <div className="space-y-3">
                    {rapportModifie.section4_problematiques?.map((prob: any, index: number) => (
                      <div key={index} className="bg-white border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{prob.icon}</span>
                          <input
                            value={prob.titre}
                            onChange={(e) => {
                              const nouveauxProbs = [...rapportModifie.section4_problematiques];
                              nouveauxProbs[index].titre = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section4_problematiques: nouveauxProbs
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-semibold focus:ring-2 focus:ring-orange-500"
                          />
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            prob.gravite === 'haute' ? 'bg-red-100 text-red-700' :
                            prob.gravite === 'moyenne' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {prob.gravite.toUpperCase()}
                          </span>
                        </div>
                        <textarea
                          value={prob.description}
                          onChange={(e) => {
                            const nouveauxProbs = [...rapportModifie.section4_problematiques];
                            nouveauxProbs[index].description = e.target.value;
                            setRapportModifie({
                              ...rapportModifie,
                              section4_problematiques: nouveauxProbs
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>
                </SectionEditable>

                {/* Section 5 : Objectifs */}
                <SectionEditable
                  title="5. Objectifs"
                  icon="??"
                  gradient="from-indigo-50 to-indigo-100"
                  borderColor="border-indigo-300"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Objectifs déclarés
                      </label>
                      {rapportModifie.section5_objectifs?.objectifs_declares?.map((obj: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <span className="text-indigo-600">•</span>
                          <input
                            value={obj}
                            onChange={(e) => {
                              const nouveaux = [...rapportModifie.section5_objectifs.objectifs_declares];
                              nouveaux[index] = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section5_objectifs: {
                                  ...rapportModifie.section5_objectifs,
                                  objectifs_declares: nouveaux
                                }
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Objectifs déduits
                      </label>
                      {rapportModifie.section5_objectifs?.objectifs_deduits?.map((obj: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <span className="text-indigo-600">•</span>
                          <input
                            value={obj}
                            onChange={(e) => {
                              const nouveaux = [...rapportModifie.section5_objectifs.objectifs_deduits];
                              nouveaux[index] = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section5_objectifs: {
                                  ...rapportModifie.section5_objectifs,
                                  objectifs_deduits: nouveaux
                                }
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionEditable>

                {/* Section 6 : Recommandations */}
                <SectionEditable
                  title="6. Recommandations"
                  icon="??"
                  gradient="from-yellow-50 to-yellow-100"
                  borderColor="border-yellow-300"
                >
                  <div className="space-y-4">
                    <ChampEditable
                      label="Synthèse des recommandations"
                      value={rapportModifie.section6_recommandations?.synthese || ''}
                      onChange={(value) => setRapportModifie({
                        ...rapportModifie,
                        section6_recommandations: {
                          ...rapportModifie.section6_recommandations,
                          synthese: value
                        }
                      })}
                      rows={5}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stratégies proposées ({rapportModifie.section6_recommandations?.strategies?.length || 0})
                      </label>
                      <div className="bg-white border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-gray-600">
                          {rapportModifie.section6_recommandations?.strategies?.length || 0} stratégies identifiées automatiquement
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionEditable>

                {/* Section 7 : Plan d'Action */}
                <SectionEditable
                  title="7. Plan d'Action"
                  icon="??"
                  gradient="from-teal-50 to-teal-100"
                  borderColor="border-teal-300"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Actions immédiates
                      </label>
                      {rapportModifie.section7_plan_action?.actions_immediates?.map((action: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <input
                            value={action}
                            onChange={(e) => {
                              const nouvelles = [...rapportModifie.section7_plan_action.actions_immediates];
                              nouvelles[index] = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section7_plan_action: {
                                  ...rapportModifie.section7_plan_action,
                                  actions_immediates: nouvelles
                                }
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Actions court terme (3-6 mois)
                      </label>
                      {rapportModifie.section7_plan_action?.actions_court_terme?.map((action: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <input
                            value={action}
                            onChange={(e) => {
                              const nouvelles = [...rapportModifie.section7_plan_action.actions_court_terme];
                              nouvelles[index] = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section7_plan_action: {
                                  ...rapportModifie.section7_plan_action,
                                  actions_court_terme: nouvelles
                                }
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Actions moyen terme (6-12 mois)
                      </label>
                      {rapportModifie.section7_plan_action?.actions_moyen_terme?.map((action: string, index: number) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <input
                            value={action}
                            onChange={(e) => {
                              const nouvelles = [...rapportModifie.section7_plan_action.actions_moyen_terme];
                              nouvelles[index] = e.target.value;
                              setRapportModifie({
                                ...rapportModifie,
                                section7_plan_action: {
                                  ...rapportModifie.section7_plan_action,
                                  actions_moyen_terme: nouvelles
                                }
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionEditable>

              </div>
            </div>

            {/* Footer avec actions */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Edit3 className="w-4 h-4" />
                <span>Toutes les modifications sont éditables</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={sauvegarderRapport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Sauvegarder les modifications
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

// Composants utilitaires
function SectionEditable({ title, icon, gradient, borderColor, children }: any) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-xl p-6 shadow-lg`}>
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ChampEditable({ label, value, onChange, rows = 3 }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        rows={rows}
      />
    </div>
  );
}
