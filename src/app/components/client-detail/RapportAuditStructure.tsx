import { useState } from 'react';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  BarChart3,
  MapPin,
  CheckCircle,
  Clock,
  Euro,
  User,
  Users,
  Heart,
  PieChart,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  Zap,
  Calendar,
  Trophy,
  Shield,
  Building,
  Home,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Award,
  XCircle,
  Info
} from 'lucide-react';

interface RapportAuditStructureProps {
  rapport: any;
  clientName: string;
}

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  Euro,
  PieChart,
  User,
  Users,
  Heart,
  AlertTriangle,
  Calculator: PieChart,
  Shield,
  Target,
  Wallet,
  Home,
  Building
};

// Composant de score circulaire
const CircularScore = ({ score, size = 120, color = '#3b82f6' }: { score: number; size?: number; color?: string }) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-3xl font-bold" style={{ color }}>{score}</div>
          <div className="text-xs text-gray-500">/10</div>
        </div>
      </div>
    </div>
  );
};

// Barre de progression
const ProgressBar = ({ value, max, label, color = '#3b82f6' }: { value: number; max: number; label: string; color?: string }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-900">{value.toLocaleString('fr-FR')} €</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
};

export function RapportAuditStructure({ rapport, clientName }: RapportAuditStructureProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    synthese: true,
    situation: true,
    analyse: true,
    problematiques: true,
    objectifs: true,
    recommandations: true,
    planAction: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!rapport) {
    return (
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-8 text-center shadow-lg">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-10 h-10 text-yellow-600" />
        </div>
        <h3 className="text-xl font-bold text-yellow-900 mb-2">Aucun rapport disponible</h3>
        <p className="text-yellow-700">Veuillez générer un audit patrimonial pour visualiser le rapport structuré</p>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, section, gradient, badge }: any) => (
    <button
      onClick={() => toggleSection(section)}
      className={`w-full flex items-center justify-between px-8 py-5 bg-gradient-to-r ${gradient} text-white rounded-2xl hover:shadow-xl transition-all duration-300 group`}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-7 h-7" />
        </div>
        <div className="text-left">
          <h3 className="text-2xl font-bold">{title}</h3>
          {badge && <span className="text-sm text-white/80">{badge}</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {expandedSections[section] ? (
          <ChevronUp className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" />
        ) : (
          <ChevronDown className="w-6 h-6 group-hover:translate-y-[2px] transition-transform" />
        )}
      </div>
    </button>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 🎨 EN-TÊTE PREMIUM */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 text-white shadow-2xl overflow-hidden">
        {/* Effet de fond */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-black mb-2">Rapport Patrimonial</h1>
                <p className="text-indigo-100 text-lg">Analyse complète & stratégie personnalisée</p>
              </div>
            </div>
            <button className="flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105 transform">
              <Download className="w-5 h-5" />
              Télécharger PDF
            </button>
          </div>
          
          <div className="flex items-center gap-6 text-indigo-100 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 w-fit">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-semibold text-lg">{clientName}</span>
            </div>
            <div className="w-1 h-6 bg-white/30"></div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>{new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 SYNTHÈSE EXÉCUTIVE */}
      {rapport.section1_synthese && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={Award} 
            title="Synthèse Exécutive" 
            section="synthese" 
            gradient="from-emerald-500 to-teal-600"
            badge="Vue d'ensemble de votre situation"
          />
          {expandedSections.synthese && (
            <div className="p-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-l-4 border-emerald-500 rounded-2xl p-6 mb-6 shadow-sm">
                <p className="text-gray-800 text-lg leading-relaxed">{rapport.section1_synthese.contexte}</p>
              </div>
              
              {rapport.section1_synthese.points_cles?.length > 0 && (
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-emerald-600" />
                    Points clés
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rapport.section1_synthese.points_cles.map((point: string, index: number) => (
                      <div key={index} className="bg-white border-2 border-emerald-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <p className="text-gray-700 leading-relaxed">{point}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 👤 SITUATION ACTUELLE */}
      {rapport.situation_actuelle && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={User} 
            title="Situation Actuelle" 
            section="situation" 
            gradient="from-blue-500 to-cyan-600"
            badge="Votre profil patrimonial"
          />
          {expandedSections.situation && (
            <div className="p-8">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-l-4 border-blue-500 rounded-2xl p-6 mb-8 shadow-sm">
                <p className="text-gray-800 text-lg leading-relaxed">{rapport.situation_actuelle.synthese}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rapport.situation_actuelle.donnees_cles.map((donnee: any, index: number) => {
                  const IconComponent = ICON_MAP[donnee.icon] || User;
                  return (
                    <div key={index} className="group bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <IconComponent className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{donnee.label}</p>
                      </div>
                      <p className="text-3xl font-black text-gray-900">{donnee.valeur}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📈 ANALYSES DÉTAILLÉES */}
      {rapport.analyse_patrimoniale && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={TrendingUp} 
            title="Analyses Détaillées" 
            section="analyse" 
            gradient="from-green-500 to-emerald-600"
            badge="4 domaines analysés"
          />
          {expandedSections.analyse && (
            <div className="p-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-2xl p-6 mb-8 shadow-sm">
                <p className="text-gray-800 text-lg leading-relaxed">{rapport.analyse_patrimoniale.synthese}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rapport.analyse_patrimoniale.analyses_detaillees.map((analyse: any, index: number) => (
                  <div key={index} className="bg-white border-2 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300" style={{ borderColor: analyse.couleur }}>
                    <div className="px-6 py-5 relative overflow-hidden" style={{ backgroundColor: `${analyse.couleur}15` }}>
                      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 transform translate-x-8 -translate-y-8">
                        <TrendingUp className="w-full h-full" style={{ color: analyse.couleur }} />
                      </div>
                      <div className="relative z-10 flex items-center justify-between">
                        <h4 className="font-black text-xl text-gray-900">{analyse.titre}</h4>
                        <CircularScore score={analyse.score} size={80} color={analyse.couleur} />
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-5">
                      {analyse.points_forts.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-sm font-bold text-green-700 uppercase tracking-wide">Points Forts</p>
                          </div>
                          <ul className="space-y-2">
                            {analyse.points_forts.map((point: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-gray-700">
                                <span className="text-green-500 font-bold text-lg mt-0.5">✓</span>
                                <span className="flex-1">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {analyse.points_attention.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            </div>
                            <p className="text-sm font-bold text-orange-700 uppercase tracking-wide">Points d'Attention</p>
                          </div>
                          <ul className="space-y-2">
                            {analyse.points_attention.map((point: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-gray-700">
                                <span className="text-orange-500 font-bold text-lg mt-0.5">⚠</span>
                                <span className="flex-1">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⚠️ PROBLÉMATIQUES */}
      {rapport.problematiques_identifiees && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={AlertTriangle} 
            title="Problématiques Identifiées" 
            section="problematiques" 
            gradient="from-orange-500 to-red-600"
            badge={`${rapport.problematiques_identifiees.problemes?.length || 0} problématique(s)`}
          />
          {expandedSections.problematiques && (
            <div className="p-8">
              {!rapport.problematiques_identifiees.problemes || rapport.problematiques_identifiees.problemes.length === 0 ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-10 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-900 mb-2">Situation saine</h4>
                  <p className="text-green-700 text-lg">Aucune problématique majeure identifiée dans votre patrimoine</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {rapport.problematiques_identifiees.problemes.map((probleme: any, index: number) => {
                    const IconComponent = ICON_MAP[probleme.icon] || AlertTriangle;
                    const graviteConfig = {
                      haute: {
                        gradient: 'from-red-50 to-red-100',
                        border: 'border-red-400',
                        icon: 'bg-red-500',
                        badge: 'bg-red-100 text-red-800',
                        text: 'text-red-600'
                      },
                      moyenne: {
                        gradient: 'from-orange-50 to-orange-100',
                        border: 'border-orange-400',
                        icon: 'bg-orange-500',
                        badge: 'bg-orange-100 text-orange-800',
                        text: 'text-orange-600'
                      },
                      faible: {
                        gradient: 'from-yellow-50 to-yellow-100',
                        border: 'border-yellow-400',
                        icon: 'bg-yellow-500',
                        badge: 'bg-yellow-100 text-yellow-800',
                        text: 'text-yellow-600'
                      }
                    };
                    
                    const config = graviteConfig[probleme.gravite as keyof typeof graviteConfig];
                    
                    return (
                      <div key={index} className={`bg-gradient-to-r ${config.gradient} border-3 ${config.border} rounded-2xl p-6 hover:shadow-xl transition-all`}>
                        <div className="flex items-start gap-5">
                          <div className={`w-14 h-14 ${config.icon} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                            <IconComponent className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="font-bold text-xl text-gray-900 flex-1">{probleme.titre}</h4>
                              <span className={`px-4 py-1.5 ${config.badge} rounded-full text-sm font-bold uppercase tracking-wide shadow-sm`}>
                                {probleme.gravite}
                              </span>
                            </div>
                            <p className="text-gray-700 text-lg mb-3 leading-relaxed">{probleme.description}</p>
                            {probleme.impact_financier && (
                              <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200 w-fit shadow-sm">
                                <Euro className="w-5 h-5 text-gray-600" />
                                <span className="text-gray-600 font-medium">Impact estimé:</span>
                                <span className="font-black text-xl text-gray-900">{probleme.impact_financier.toLocaleString('fr-FR')} €</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🎯 OBJECTIFS */}
      {rapport.objectifs && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={Target} 
            title="Objectifs" 
            section="objectifs" 
            gradient="from-purple-500 to-pink-600"
            badge="Vos priorités patrimoniales"
          />
          {expandedSections.objectifs && (
            <div className="p-8 space-y-8">
              {rapport.objectifs.objectifs_declares?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Vos Objectifs Déclarés</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {rapport.objectifs.objectifs_declares.map((objectif: string, index: number) => (
                      <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-6 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-800 font-semibold text-lg flex-1">{objectif}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {rapport.objectifs.objectifs_deduits?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-amber-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Objectifs Identifiés</h4>
                  </div>
                  <div className="space-y-4">
                    {rapport.objectifs.objectifs_deduits.map((objectif: any, index: number) => {
                      const prioriteConfig = {
                        haute: { gradient: 'from-red-50 to-red-100', border: 'border-red-300', badge: 'bg-red-100 text-red-800' },
                        moyenne: { gradient: 'from-orange-50 to-orange-100', border: 'border-orange-300', badge: 'bg-orange-100 text-orange-800' },
                        faible: { gradient: 'from-blue-50 to-blue-100', border: 'border-blue-300', badge: 'bg-blue-100 text-blue-800' }
                      };
                      const config = prioriteConfig[objectif.priorite as keyof typeof prioriteConfig] || prioriteConfig.faible;
                      
                      return (
                        <div key={index} className={`bg-gradient-to-r ${config.gradient} border-2 ${config.border} rounded-2xl p-6`}>
                          <div className="flex items-start gap-4">
                            <Zap className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-bold text-xl text-gray-900 flex-1">{objectif.titre}</h5>
                                <span className={`px-4 py-1.5 ${config.badge} rounded-full text-sm font-bold uppercase shadow-sm`}>
                                  Priorité {objectif.priorite}
                                </span>
                              </div>
                              <p className="text-gray-700 text-lg leading-relaxed">{objectif.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 💡 RECOMMANDATIONS STRATÉGIQUES */}
      {rapport.recommandations_strategiques && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={Lightbulb} 
            title="Recommandations Stratégiques" 
            section="recommandations" 
            gradient="from-indigo-500 to-purple-600"
            badge={`${rapport.recommandations_strategiques.strategies?.length || 0} stratégie(s) proposée(s)`}
          />
          {expandedSections.recommandations && (
            <div className="p-8">
              {rapport.recommandations_strategiques.synthese && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-2xl p-6 mb-8 shadow-sm">
                  <p className="text-gray-800 text-lg leading-relaxed">{rapport.recommandations_strategiques.synthese}</p>
                </div>
              )}
              
              <div className="space-y-6">
                {rapport.recommandations_strategiques.strategies?.slice(0, 10).map((strategie: any, index: number) => (
                  <div key={index} className="border-2 border-indigo-200 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 bg-white">
                    <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 px-8 py-5 flex items-center justify-between border-b-2 border-indigo-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                          {index + 1}
                        </div>
                        <h5 className="font-black text-xl text-gray-900">{strategie.nom}</h5>
                      </div>
                      <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-2 shadow-md border border-indigo-200">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-600">Pertinence:</span>
                        <span className="text-2xl font-black text-indigo-600">{strategie.pertinence}/10</span>
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-5">
                      <div>
                        <h6 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Objectif</h6>
                        <p className="text-gray-800 text-lg leading-relaxed">{strategie.objectif}</p>
                      </div>
                      
                      {strategie.simulation && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowUpRight className="w-5 h-5 text-green-600" />
                              <p className="text-xs font-bold text-green-700 uppercase tracking-wide">Gain Fiscal / An</p>
                            </div>
                            <p className="text-3xl font-black text-green-900">
                              {strategie.simulation.gain_fiscal_annuel?.toLocaleString('fr-FR')} €
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowDownRight className="w-5 h-5 text-blue-600" />
                              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Coût Mise en Place</p>
                            </div>
                            <p className="text-3xl font-black text-blue-900">
                              {strategie.simulation.cout_mise_en_place?.toLocaleString('fr-FR')} €
                            </p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-5 hover:shadow-lg transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-purple-600" />
                              <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">Gain sur 10 Ans</p>
                            </div>
                            <p className="text-3xl font-black text-purple-900">
                              {strategie.simulation.gain_sur_10ans?.toLocaleString('fr-FR')} €
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📅 PLAN D'ACTION */}
      {rapport.plan_action && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          <SectionHeader 
            icon={MapPin} 
            title="Plan d'Action" 
            section="planAction" 
            gradient="from-emerald-500 to-green-600"
            badge="Feuille de route personnalisée"
          />
          {expandedSections.planAction && (
            <div className="p-8 space-y-8">
              {rapport.plan_action.actions_immediates?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-red-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Actions Immédiates</h4>
                    <span className="px-4 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-bold">1-3 mois</span>
                  </div>
                  <div className="space-y-4">
                    {rapport.plan_action.actions_immediates.map((action: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-800 text-lg font-semibold flex-1">{action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {rapport.plan_action.actions_court_terme?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Actions Court Terme</h4>
                    <span className="px-4 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-bold">3-6 mois</span>
                  </div>
                  <div className="space-y-4">
                    {rapport.plan_action.actions_court_terme.map((action: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                          <ArrowRight className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                          <p className="text-gray-800 text-lg font-semibold flex-1">{action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {rapport.plan_action.actions_moyen_terme?.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">Actions Moyen Terme</h4>
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">6-12 mois</span>
                  </div>
                  <div className="space-y-4">
                    {rapport.plan_action.actions_moyen_terme.map((action: string, index: number) => (
                      <div key={index} className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-2xl p-6 hover:shadow-lg transition-all">
                        <div className="flex items-start gap-4">
                          <ArrowRight className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                          <p className="text-gray-800 text-lg font-semibold flex-1">{action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🛡️ PIED DE PAGE */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-3xl p-10 text-center shadow-lg">
        <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-700 font-semibold text-lg mb-2">
          Document Confidentiel
        </p>
        <p className="text-gray-500 text-sm">
          Ce rapport patrimonial est strictement confidentiel et à usage personnel uniquement.
        </p>
        <div className="mt-4 pt-4 border-t border-gray-300">
          <p className="text-gray-400 text-xs">
            Généré automatiquement par le système CoreVision • {new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );
}
