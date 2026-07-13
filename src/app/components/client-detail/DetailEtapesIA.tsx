import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, TrendingUp, Target, Lightbulb, FileText, Shield } from 'lucide-react';

interface DetailEtapesIAProps {
  analyseAvancee: any;
}

export function DetailEtapesIA({ analyseAvancee }: DetailEtapesIAProps) {
  const [expandedEtape, setExpandedEtape] = useState<number | null>(null);

  if (!analyseAvancee) return null;

  const toggleEtape = (etapeNum: number) => {
    setExpandedEtape(expandedEtape === etapeNum ? null : etapeNum);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Détails des 7 Étapes IA</h3>

      {/* ÉTAPE 1 : NORMALISATION */}
      {analyseAvancee.etape1_normalisation && (
        <EtapeCard
          numero={1}
          titre="Normalisation des Données"
          icon="📊"
          expanded={expandedEtape === 1}
          onToggle={() => toggleEtape(1)}
          score={analyseAvancee.etape1_normalisation.completude}
        >
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Complétude des données</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${analyseAvancee.etape1_normalisation.completude}%` }}
                  />
                </div>
                <span className="text-blue-900 font-bold">{analyseAvancee.etape1_normalisation.completude}%</span>
              </div>
            </div>

            {analyseAvancee.etape1_normalisation.alertes && analyseAvancee.etape1_normalisation.alertes.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Alertes détectées
                </h4>
                <ul className="space-y-1">
                  {analyseAvancee.etape1_normalisation.alertes.map((alerte: string, index: number) => (
                    <li key={index} className="text-sm text-orange-800">{alerte}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </EtapeCard>
      )}

      {/* ÉTAPE 2 : DIAGNOSTIC FACTUEL */}
      {analyseAvancee.etape2_diagnostic && (
        <EtapeCard
          numero={2}
          titre="Diagnostic Factuel"
          icon="🔍"
          expanded={expandedEtape === 2}
          onToggle={() => toggleEtape(2)}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DiagnosticItem 
                label="Situation familiale" 
                value={analyseAvancee.etape2_diagnostic.situation_familiale} 
              />
              <DiagnosticItem 
                label="Situation patrimoniale" 
                value={analyseAvancee.etape2_diagnostic.situation_patrimoniale} 
              />
              <DiagnosticItem 
                label="Situation fiscale" 
                value={analyseAvancee.etape2_diagnostic.situation_fiscale} 
              />
              <DiagnosticItem 
                label="Situation sociale" 
                value={analyseAvancee.etape2_diagnostic.situation_sociale} 
              />
            </div>

            {analyseAvancee.etape2_diagnostic.metriques_cles && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-3">Métriques clés</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analyseAvancee.etape2_diagnostic.metriques_cles.map((metrique: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-center">
                      <div className="text-xs text-gray-600 mb-1">{metrique.label}</div>
                      <div className="text-lg font-bold text-indigo-900">{metrique.valeur}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </EtapeCard>
      )}

      {/* ÉTAPE 3 : ANALYSE CRITIQUE */}
      {analyseAvancee.etape3_critique && (
        <EtapeCard
          numero={3}
          titre="Analyse Critique (SWOT)"
          icon="⚖️"
          expanded={expandedEtape === 3}
          onToggle={() => toggleEtape(3)}
          score={analyseAvancee.etape3_critique.score_swot * 10}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SWOTSection 
              title="Points forts" 
              items={analyseAvancee.etape3_critique.points_forts}
              color="green"
              icon={<CheckCircle className="w-5 h-5" />}
            />
            <SWOTSection 
              title="Opportunités" 
              items={analyseAvancee.etape3_critique.opportunites}
              color="blue"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <SWOTSection 
              title="Points faibles" 
              items={analyseAvancee.etape3_critique.points_faibles}
              color="orange"
              icon={<AlertCircle className="w-5 h-5" />}
            />
            <SWOTSection 
              title="Risques" 
              items={analyseAvancee.etape3_critique.risques}
              color="red"
              icon={<Shield className="w-5 h-5" />}
            />
          </div>
        </EtapeCard>
      )}

      {/* ÉTAPE 4 : ENJEUX */}
      {analyseAvancee.etape4_enjeux && (
        <EtapeCard
          numero={4}
          titre="Identification des Enjeux"
          icon="🎯"
          expanded={expandedEtape === 4}
          onToggle={() => toggleEtape(4)}
        >
          <div className="space-y-3">
            {analyseAvancee.etape4_enjeux.enjeux_prioritaires.map((enjeu: any, index: number) => (
              <div key={index} className="bg-white border-2 border-purple-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    {enjeu.titre}
                  </h4>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      enjeu.impact === 'haute' ? 'bg-red-100 text-red-700' :
                      enjeu.impact === 'moyenne' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {enjeu.impact.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      enjeu.urgence === 'immediate' ? 'bg-red-100 text-red-700' :
                      enjeu.urgence === 'court_terme' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {enjeu.urgence.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{enjeu.description}</p>
              </div>
            ))}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-900 font-medium">{analyseAvancee.etape4_enjeux.synthese_enjeux}</p>
            </div>
          </div>
        </EtapeCard>
      )}

      {/* ÉTAPE 5 : STRATÉGIES */}
      {analyseAvancee.etape5_strategies && (
        <EtapeCard
          numero={5}
          titre="Stratégies Recommandées"
          icon="💡"
          expanded={expandedEtape === 5}
          onToggle={() => toggleEtape(5)}
        >
          <div className="space-y-4">
            {analyseAvancee.etape5_strategies.strategies_proposees.slice(0, 5).map((strategie: any, index: number) => (
              <div key={index} className="bg-white border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-1">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                      {strategie.titre}
                    </h4>
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {strategie.domaine}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {strategie.gain_potentiel > 0 ? `+${strategie.gain_potentiel.toLocaleString('fr-FR')} €` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">{strategie.delai}</div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-3">{strategie.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {strategie.avantages && strategie.avantages.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="font-semibold text-green-900 mb-1">✅ Avantages</div>
                      <ul className="space-y-1">
                        {strategie.avantages.map((av: string, i: number) => (
                          <li key={i} className="text-green-800">• {av}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {strategie.risques && strategie.risques.length > 0 && (
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="font-semibold text-orange-900 mb-1">⚠️ Risques</div>
                      <ul className="space-y-1">
                        {strategie.risques.map((r: string, i: number) => (
                          <li key={i} className="text-orange-800">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className={`px-2 py-1 rounded-full font-bold ${
                    strategie.complexite === 'faible' ? 'bg-green-100 text-green-700' :
                    strategie.complexite === 'moyenne' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    Complexité : {strategie.complexite}
                  </span>
                </div>
              </div>
            ))}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900 font-medium">{analyseAvancee.etape5_strategies.priorisation}</p>
            </div>
          </div>
        </EtapeCard>
      )}

      {/* ÉTAPE 6 : RÉDACTION FINALE */}
      {analyseAvancee.etape6_rapport && (
        <EtapeCard
          numero={6}
          titre="Rédaction Finale"
          icon="📝"
          expanded={expandedEtape === 6}
          onToggle={() => toggleEtape(6)}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2">{analyseAvancee.etape6_rapport.titre}</h4>
              <p className="text-sm text-gray-700 mb-4">{analyseAvancee.etape6_rapport.introduction}</p>
              
              {analyseAvancee.etape6_rapport.chapitres && analyseAvancee.etape6_rapport.chapitres.map((chapitre: any, index: number) => (
                <div key={index} className="mb-4 last:mb-0">
                  <h5 className="font-semibold text-gray-900 mb-2">{chapitre.titre}</h5>
                  <p className="text-sm text-gray-700 mb-2">{chapitre.contenu}</p>
                  {chapitre.sous_sections && chapitre.sous_sections.map((ss: any, i: number) => (
                    <div key={i} className="ml-4 mt-2 text-sm">
                      <div className="font-medium text-gray-800">{ss.titre}</div>
                      <div className="text-gray-600">{ss.contenu}</div>
                    </div>
                  ))}
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-gray-300">
                <h5 className="font-semibold text-gray-900 mb-2">Conclusion</h5>
                <p className="text-sm text-gray-700">{analyseAvancee.etape6_rapport.conclusion}</p>
              </div>
            </div>
          </div>
        </EtapeCard>
      )}

      {/* ÉTAPE 7 : CONTRÔLE QUALITÉ */}
      {analyseAvancee.etape7_qualite && (
        <EtapeCard
          numero={7}
          titre="Contrôle Qualité"
          icon="✅"
          expanded={expandedEtape === 7}
          onToggle={() => toggleEtape(7)}
          score={analyseAvancee.etape7_qualite.score_qualite * 10}
        >
          <div className="space-y-4">
            {/* Score global */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900">Score Qualité Global</h4>
                <div className="text-3xl font-bold text-green-600">
                  {analyseAvancee.etape7_qualite.score_qualite.toFixed(1)}/10
                </div>
              </div>
              <div className="mt-3 bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${analyseAvancee.etape7_qualite.score_qualite * 10}%` }}
                />
              </div>
            </div>

            {/* Points forts */}
            {analyseAvancee.etape7_qualite.points_forts && analyseAvancee.etape7_qualite.points_forts.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Points forts du rapport
                </h4>
                <ul className="space-y-2">
                  {analyseAvancee.etape7_qualite.points_forts.map((pf: string, index: number) => (
                    <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <span>{pf}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Faiblesses identifiées */}
            {analyseAvancee.etape7_qualite.faiblesses && analyseAvancee.etape7_qualite.faiblesses.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Axes d'amélioration
                </h4>
                <div className="space-y-3">
                  {analyseAvancee.etape7_qualite.faiblesses.map((faiblesse: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                            {faiblesse.type}
                          </span>
                          <span className={`ml-2 text-xs font-bold px-2 py-1 rounded-full ${
                            faiblesse.gravite === 'haute' ? 'bg-red-100 text-red-700' :
                            faiblesse.gravite === 'moyenne' ? 'bg-orange-100 text-orange-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {faiblesse.gravite.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 mb-2 font-medium">{faiblesse.description}</p>
                      <div className="bg-blue-50 border-l-4 border-blue-400 pl-3 py-2">
                        <p className="text-xs text-blue-900">
                          <strong>💡 Amélioration :</strong> {faiblesse.amelioration_proposee}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandations globales */}
            {analyseAvancee.etape7_qualite.recommandations_globales && analyseAvancee.etape7_qualite.recommandations_globales.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Recommandations pour améliorer le rapport
                </h4>
                <ul className="space-y-2">
                  {analyseAvancee.etape7_qualite.recommandations_globales.map((reco: string, index: number) => (
                    <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-blue-600 font-bold">→</span>
                      <span>{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </EtapeCard>
      )}
    </div>
  );
}

// Composants utilitaires
function EtapeCard({ numero, titre, icon, expanded, onToggle, score, children }: any) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div className="text-left">
            <div className="font-bold text-gray-900">Étape {numero} : {titre}</div>
            {score !== undefined && (
              <div className="text-sm text-gray-600">Score : {Math.round(score)}%</div>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {expanded && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function DiagnosticItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="text-xs font-semibold text-gray-600 mb-1">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

function SWOTSection({ title, items, color, icon }: any) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    red: 'bg-red-50 border-red-200 text-red-900'
  };

  const itemColorClasses = {
    green: 'text-green-800',
    blue: 'text-blue-800',
    orange: 'text-orange-800',
    red: 'text-red-800'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h4 className="font-bold mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h4>
      {items && items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((item: string, index: number) => (
            <li key={index} className={`text-sm ${itemColorClasses[color as keyof typeof itemColorClasses]}`}>
              • {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600 italic">Aucun élément identifié</p>
      )}
    </div>
  );
}
