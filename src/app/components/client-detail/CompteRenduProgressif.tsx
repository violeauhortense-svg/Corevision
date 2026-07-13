import { useState, useEffect } from 'react';
import { FileText, ChevronRight, Edit3, Save, Check, Loader2, Sparkles, Clock, FolderOpen, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl, publicAnonKey } from '../../utils/supabase/info';

interface CompteRenduProgressifProps {
  clientId: string;
  clientName: string;
  clientData: any;
}

interface SectionStatus {
  status: 'pending' | 'generating' | 'completed' | 'error';
  contenu?: string;
  prompt?: string;
  dateGeneration?: string;
}

interface DossierClientComplet {
  // Métadonnées
  clientId: string;
  clientName: string;
  dateDecouverte?: string;
  dateGenerationAudit?: string;
  datePresentation?: string;
  dateValidationRecommandations?: string;
  
  // Données saisies
  donneesFoyer: any;
  donneesRevenus: any;
  donneesPatrimoine: any;
  donneesObjectifs: any;
  
  // Documents
  documentsPermanents: any[];
  documentsAnnuels: Record<string, any[]>; // Classés par année
  
  // Rapport progressif
  sections: {
    section1_synthese: SectionStatus;
    section2_situation: SectionStatus;
    section3_analyses: SectionStatus;
    section4_problematiques: SectionStatus;
    section5_objectifs: SectionStatus;
    section6_recommandations: SectionStatus;
    section7_plan_action: SectionStatus;
  };
  
  // Statut global
  statut: 'brouillon' | 'en_cours' | 'valide' | 'archive';
  progression: number; // 0-100%
}

export function CompteRenduProgressif({ clientId, clientName, clientData }: CompteRenduProgressifProps) {
  const [dossier, setDossier] = useState<DossierClientComplet | null>(null);
  const [promptsEditables, setPromptsEditables] = useState<Record<string, string>>({});
  const [showPromptEditor, setShowPromptEditor] = useState<string | null>(null);
  
  // Charger le dossier existant ou créer un nouveau
  useEffect(() => {
    chargerOuCreerDossier();
  }, [clientId]);
  
  const chargerOuCreerDossier = async () => {
    try {
      // Chercher dans localStorage d'abord
      const key = `dossier_client_${clientId}`;
      const stored = localStorage.getItem(key);
      
      if (stored) {
        setDossier(JSON.parse(stored));
      } else {
        // Créer un nouveau dossier
        const nouveauDossier: DossierClientComplet = {
          clientId,
          clientName,
          dateDecouverte: new Date().toISOString().split('T')[0],
          donneesFoyer: clientData?.familyInfo || {},
          donneesRevenus: clientData?.revenus || {},
          donneesPatrimoine: clientData?.patrimoineData || {},
          donneesObjectifs: clientData?.objectifs || {},
          documentsPermanents: [],
          documentsAnnuels: {},
          sections: {
            section1_synthese: { status: 'pending' },
            section2_situation: { status: 'pending' },
            section3_analyses: { status: 'pending' },
            section4_problematiques: { status: 'pending' },
            section5_objectifs: { status: 'pending' },
            section6_recommandations: { status: 'pending' },
            section7_plan_action: { status: 'pending' }
          },
          statut: 'brouillon',
          progression: 0
        };
        
        setDossier(nouveauDossier);
        sauvegarderDossier(nouveauDossier);
      }
      
      // Initialiser les prompts par défaut
      initialiserPrompts();
    } catch (error) {
      console.error('Erreur chargement dossier:', error);
      toast.error('Erreur lors du chargement du dossier');
    }
  };
  
  const sauvegarderDossier = (dossierAJour: DossierClientComplet) => {
    const key = `dossier_client_${clientId}`;
    localStorage.setItem(key, JSON.stringify(dossierAJour));
    toast.success('?? Sauvegarde automatique réussie');
  };
  
  const initialiserPrompts = () => {
    setPromptsEditables({
      section1_synthese: "Rédige une synthèse exécutive professionnelle du dossier patrimonial. Contexte + 5 points clés maximum. Ton formel.",
      section2_situation: "Analyse la situation actuelle : familiale, professionnelle, patrimoine, revenus. Sois factuel et précis.",
      section3_analyses: "Réalise les 4 analyses détaillées : A) Civile B) Fiscale C) Sociale D) Patrimoniale. 200-300 mots chacune.",
      section4_problematiques: "Identifie les problématiques majeures avec gravité (haute/moyenne/faible) et description détaillée.",
      section5_objectifs: "Liste les objectifs déclarés et déduits à partir du profil client.",
      section6_recommandations: "Propose des recommandations concrètes et actionnables avec impact chiffré si possible.",
      section7_plan_action: "Crée un plan d'action en 3 horizons : immédiat, court terme (3-6 mois), moyen terme (6-12 mois)."
    });
  };
  
  const genererSection = async (sectionKey: keyof typeof dossier.sections) => {
    if (!dossier) return;
    
    try {
      // Mettre à jour le statut
      const dossierUpdate = {
        ...dossier,
        sections: {
          ...dossier.sections,
          [sectionKey]: { status: 'generating' as const }
        }
      };
      setDossier(dossierUpdate);
      
      toast.info(`?? Génération de la section en cours...`);
      
      // Appeler l'API backend avec le prompt personnalisé
      const response = await fetch(
        `${apiBaseUrl}/generer-section-rapport`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            clientId,
            clientData,
            sectionKey,
            prompt: promptsEditables[sectionKey],
            donneesContexte: {
              foyer: dossier.donneesFoyer,
              revenus: dossier.donneesRevenus,
              patrimoine: dossier.donneesPatrimoine,
              objectifs: dossier.donneesObjectifs
            }
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      
      const result = await response.json();
      
      // Mettre à jour la section avec le contenu généré
      const dossierFinal = {
        ...dossier,
        sections: {
          ...dossier.sections,
          [sectionKey]: {
            status: 'completed' as const,
            contenu: result.contenu,
            prompt: promptsEditables[sectionKey],
            dateGeneration: new Date().toISOString()
          }
        }
      };
      
      // Calculer la progression
      const nbCompleted = Object.values(dossierFinal.sections).filter(s => s.status === 'completed').length;
      dossierFinal.progression = Math.round((nbCompleted / 7) * 100);
      
      setDossier(dossierFinal);
      sauvegarderDossier(dossierFinal);
      
      toast.success(`? Section générée avec succès`);
      
    } catch (error: any) {
      console.error('Erreur génération section:', error);
      
      const dossierError = {
        ...dossier,
        sections: {
          ...dossier.sections,
          [sectionKey]: { status: 'error' as const }
        }
      };
      setDossier(dossierError);
      
      toast.error(`? Erreur: ${error.message}`);
    }
  };
  
  const modifierContenuSection = (sectionKey: keyof typeof dossier.sections, nouveauContenu: string) => {
    if (!dossier) return;
    
    const dossierUpdate = {
      ...dossier,
      sections: {
        ...dossier.sections,
        [sectionKey]: {
          ...dossier.sections[sectionKey],
          contenu: nouveauContenu
        }
      }
    };
    
    setDossier(dossierUpdate);
    sauvegarderDossier(dossierUpdate);
  };
  
  const validerDossier = () => {
    if (!dossier) return;
    
    // Vérifier que toutes les sections sont complètes
    const toutesCompletes = Object.values(dossier.sections).every(s => s.status === 'completed');
    
    if (!toutesCompletes) {
      toast.error('?? Toutes les sections doivent être générées avant validation');
      return;
    }
    
    // Vérifier les dates obligatoires
    if (!dossier.dateDecouverte || !dossier.datePresentation) {
      toast.error('?? Dates de découverte et présentation requises');
      return;
    }
    
    const dossierValide = {
      ...dossier,
      statut: 'valide' as const,
      dateValidationRecommandations: new Date().toISOString().split('T')[0]
    };
    
    setDossier(dossierValide);
    sauvegarderDossier(dossierValide);
    
    // Créer une copie figée dans l'onglet Audit
    const auditFige = {
      ...dossierValide,
      statut: 'archive' as const,
      dateFigement: new Date().toISOString()
    };
    localStorage.setItem(`audit_fige_${clientId}_${Date.now()}`, JSON.stringify(auditFige));
    
    toast.success('? Dossier validé et archivé dans l\'onglet Audit');
  };
  
  if (!dossier) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  const sections = [
    { key: 'section1_synthese', titre: '1. Synthèse Exécutive', icon: '??', color: 'blue' },
    { key: 'section2_situation', titre: '2. Situation Actuelle', icon: '??', color: 'green' },
    { key: 'section3_analyses', titre: '3. Analyses Détaillées (A-B-C-D)', icon: '??', color: 'purple' },
    { key: 'section4_problematiques', titre: '4. Problématiques', icon: '??', color: 'orange' },
    { key: 'section5_objectifs', titre: '5. Objectifs', icon: '??', color: 'indigo' },
    { key: 'section6_recommandations', titre: '6. Recommandations', icon: '??', color: 'yellow' },
    { key: 'section7_plan_action', titre: '7. Plan d\'Action', icon: '??', color: 'teal' }
  ];
  
  return (
    <div className="space-y-6">
      
      {/* En-tête avec progression */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-lg backdrop-blur-sm">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Dossier Client Complet</h3>
              <p className="text-indigo-100 mt-1">{clientName}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{dossier.progression}%</div>
            <div className="text-indigo-100 text-sm">Progression</div>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500 rounded-full"
            style={{ width: `${dossier.progression}%` }}
          />
        </div>
      </div>
      
      {/* Dates obligatoires */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Dates de Suivi
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Découverte <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dossier.dateDecouverte || ''}
              onChange={(e) => {
                const updated = { ...dossier, dateDecouverte: e.target.value };
                setDossier(updated);
                sauvegarderDossier(updated);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Génération Audit
            </label>
            <input
              type="date"
              value={dossier.dateGenerationAudit || ''}
              onChange={(e) => {
                const updated = { ...dossier, dateGenerationAudit: e.target.value };
                setDossier(updated);
                sauvegarderDossier(updated);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Présentation <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={dossier.datePresentation || ''}
              onChange={(e) => {
                const updated = { ...dossier, datePresentation: e.target.value };
                setDossier(updated);
                sauvegarderDossier(updated);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Validation Reco
            </label>
            <input
              type="date"
              value={dossier.dateValidationRecommandations || ''}
              onChange={(e) => {
                const updated = { ...dossier, dateValidationRecommandations: e.target.value };
                setDossier(updated);
                sauvegarderDossier(updated);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      
      {/* Sections du rapport */}
      <div className="space-y-4">
        {sections.map((section) => {
          const sectionKey = section.key as keyof typeof dossier.sections;
          const sectionData = dossier.sections[sectionKey];
          
          return (
            <div key={section.key} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
              
              {/* En-tête de section */}
              <div className={`bg-gradient-to-r from-${section.color}-50 to-${section.color}-100 p-4 border-b border-${section.color}-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <h4 className="font-bold text-gray-900">{section.titre}</h4>
                    
                    {/* Badge statut */}
                    {sectionData.status === 'completed' && (
                      <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Complétée
                      </span>
                    )}
                    {sectionData.status === 'generating' && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Génération...
                      </span>
                    )}
                    {sectionData.status === 'error' && (
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        Erreur
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Bouton modifier prompt */}
                    <button
                      onClick={() => setShowPromptEditor(showPromptEditor === section.key ? null : section.key)}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Prompt
                    </button>
                    
                    {/* Bouton générer */}
                    <button
                      onClick={() => genererSection(sectionKey)}
                      disabled={sectionData.status === 'generating'}
                      className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {sectionData.status === 'completed' ? 'Régénérer' : 'Générer'}
                    </button>
                  </div>
                </div>
                
                {/* Éditeur de prompt */}
                {showPromptEditor === section.key && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personnaliser le prompt IA :
                    </label>
                    <textarea
                      value={promptsEditables[section.key] || ''}
                      onChange={(e) => setPromptsEditables({ ...promptsEditables, [section.key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      rows={3}
                    />
                  </div>
                )}
              </div>
              
              {/* Contenu de la section */}
              {sectionData.status === 'completed' && sectionData.contenu && (
                <div className="p-4 bg-gray-50">
                  <textarea
                    value={sectionData.contenu}
                    onChange={(e) => modifierContenuSection(sectionKey, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none font-sans text-gray-800"
                    rows={8}
                  />
                  {sectionData.dateGeneration && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Généré le {new Date(sectionData.dateGeneration).toLocaleString('fr-FR')}
                    </div>
                  )}
                </div>
              )}
              
            </div>
          );
        })}
      </div>
      
      {/* Bouton de validation finale */}
      <div className="bg-white rounded-lg border-2 border-green-300 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-1">Validation du Dossier</h4>
            <p className="text-sm text-gray-600">
              Toutes les sections doivent être complètes et les dates renseignées
            </p>
          </div>
          <button
            onClick={validerDossier}
            disabled={dossier.progression < 100}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold flex items-center gap-2 text-lg"
          >
            <Check className="w-5 h-5" />
            Valider & Figer dans Audit
          </button>
        </div>
      </div>
      
    </div>
  );
}
