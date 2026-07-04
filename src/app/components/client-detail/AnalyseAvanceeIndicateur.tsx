import { CheckCircle, AlertCircle, Loader, TrendingUp, FileText } from 'lucide-react';

interface AnalyseAvanceeProps {
  analyseAvancee?: any;
}

export function AnalyseAvanceeIndicateur({ analyseAvancee }: AnalyseAvanceeProps) {
  if (!analyseAvancee) {
    return null;
  }

  const etapes = [
    {
      nom: 'Normalisation',
      numero: 1,
      icon: '📊',
      data: analyseAvancee.etape1_normalisation,
      score: analyseAvancee.etape1_normalisation?.completude
    },
    {
      nom: 'Diagnostic Factuel',
      numero: 2,
      icon: '🔍',
      data: analyseAvancee.etape2_diagnostic,
      score: 100
    },
    {
      nom: 'Analyse Critique',
      numero: 3,
      icon: '⚖️',
      data: analyseAvancee.etape3_critique,
      score: analyseAvancee.etape3_critique?.score_swot ? analyseAvancee.etape3_critique.score_swot * 10 : 0
    },
    {
      nom: 'Identification Enjeux',
      numero: 4,
      icon: '🎯',
      data: analyseAvancee.etape4_enjeux,
      score: analyseAvancee.etape4_enjeux?.enjeux_prioritaires?.length ? 100 : 0
    },
    {
      nom: 'Stratégies',
      numero: 5,
      icon: '💡',
      data: analyseAvancee.etape5_strategies,
      score: analyseAvancee.etape5_strategies?.strategies_proposees?.length ? 100 : 0
    },
    {
      nom: 'Rédaction Finale',
      numero: 6,
      icon: '📝',
      data: analyseAvancee.etape6_rapport,
      score: 100
    },
    {
      nom: 'Contrôle Qualité',
      numero: 7,
      icon: '✅',
      data: analyseAvancee.etape7_controle,
      score: analyseAvancee.etape7_controle?.completude
    }
  ];

  const totalScore = etapes.reduce((sum, etape) => sum + (etape.score || 0), 0) / etapes.length;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Analyse IA Avancée - 7 Étapes</h3>
            <p className="text-sm text-gray-600">Architecture complète de diagnostic patrimonial</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-indigo-600">{Math.round(totalScore)}%</div>
          <div className="text-sm text-gray-600">Score global</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {etapes.map((etape, index) => (
          <div key={index} className="relative">
            <div className={`bg-white rounded-lg p-3 border-2 transition-all hover:shadow-md ${
              etape.data ? 'border-green-300' : 'border-gray-200'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-2">{etape.icon}</div>
                <div className="text-xs font-bold text-gray-900 mb-1">Étape {etape.numero}</div>
                <div className="text-xs text-gray-600 mb-2 h-8 flex items-center justify-center">
                  {etape.nom}
                </div>
                {etape.data ? (
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold text-green-700">
                      {Math.round(etape.score || 100)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1">
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">N/A</span>
                  </div>
                )}
              </div>
            </div>
            {index < etapes.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-1.5 transform -translate-y-1/2 text-gray-300">
                →
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Détails de validation */}
      {analyseAvancee.etape7_controle && (
        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Contrôle Qualité Final
            </h4>
            {analyseAvancee.etape7_controle.validation_finale ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Validé
              </span>
            ) : (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                À réviser
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600 mb-1">Cohérence</div>
              <div className="font-semibold text-gray-900">
                {analyseAvancee.etape7_controle.coherence_interne ? '✅' : '❌'}
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Complétude</div>
              <div className="font-semibold text-gray-900">
                {Math.round(analyseAvancee.etape7_controle.completude)}%
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Pertinence</div>
              <div className="font-semibold text-gray-900">
                {analyseAvancee.etape7_controle.pertinence}/10
              </div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Lisibilité</div>
              <div className="font-semibold text-gray-900">
                {analyseAvancee.etape7_controle.lisibilite}/10
              </div>
            </div>
          </div>
          {analyseAvancee.etape7_controle.alertes && analyseAvancee.etape7_controle.alertes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">Alertes :</div>
              {analyseAvancee.etape7_controle.alertes.map((alerte: string, index: number) => (
                <div key={index} className="text-sm text-orange-600 flex items-start gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{alerte}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
