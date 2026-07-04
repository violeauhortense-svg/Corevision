import React, { useState, useEffect } from 'react';
import { X, Eye, Save, Plus, Trash2, Send, CheckCircle2, Euro, User, Users, Baby, Heart, FileText, Sparkles, TrendingUp, AlertTriangle, Target, BarChart3, Loader, Copy, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { apiBaseUrl, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';
import { clientAPI } from '../services/api';
import { useIncoherences } from '../hooks/useIncoherences';
import { IncoherencesPanel } from './IncoherencesPanel';
import { RapportPatrimonial } from './client-detail/RapportPatrimonial';
import { CompteRenduProgressif } from './client-detail/CompteRenduProgressif';
import { RapportSection } from './CoreVisionAdminDetailModal-rapport-section';

interface Preconisation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface CoreVisionAdminDetailModalProps {
  order: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function CoreVisionAdminDetailModal({ order, onClose, onUpdate }: CoreVisionAdminDetailModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'preconisations' | 'presentation' | 'incoherences' | 'rapport'>('rapport');
  const [audit, setAudit] = useState(order.audit || '');
  const [presentationClient, setPresentationClient] = useState(order.presentationClient || '');
  const [preconisations, setPreconisations] = useState<Preconisation[]>(order.preconisations || []);
  const [newPreconisation, setNewPreconisation] = useState<Partial<Preconisation>>({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
  });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [generatingAudit, setGeneratingAudit] = useState(false);
  const [auditGenere, setAuditGenere] = useState<any>(null);
  const [loadingRapport, setLoadingRapport] = useState(false);

  const bilanData = order.bilanData;
  const profils = order.profilsInvestisseurs;

  // 🆕 Hook Incohérences
  const {
    rapport: rapportIncoherences,
    loading: loadingIncoherences,
    error: errorIncoherences,
    detecter,
    valider,
    ignorer,
    corriger,
  } = useIncoherences(order.clientId);

  // 🆕 Détection automatique au chargement
  useEffect(() => {
    const detectIncoh = async () => {
      if (order.clientId && bilanData) {
        console.log('🔍 Détection automatique des incohérences...');
        await detecter({ ...order, bilanData });
      }
    };
    detectIncoh();
  }, [order.clientId]);

  //  Fonction utilitaire pour mettre à jour une commande (serveur + local)
  const updateOrderData = async (updates: Partial<any>) => {
    let serverUpdateSuccess = false;
    
    // Essayer de mettre à jour sur le serveur
    try {
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/corevision/orders/${order.orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        serverUpdateSuccess = true;
      }
    } catch (error) {
      console.warn('⚠️ Serveur inaccessible, mise à jour en local uniquement');
    }

    // Mettre à jour en local également
    const localOrdersKey = 'corevision_local_orders';
    const localOrders = JSON.parse(localStorage.getItem(localOrdersKey) || '[]');
    const orderIndex = localOrders.findIndex((o: any) => o.orderId === order.orderId);
    
    if (orderIndex !== -1) {
      localOrders[orderIndex] = {
        ...localOrders[orderIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(localOrdersKey, JSON.stringify(localOrders));
      console.log('✅ Commande mise à jour en local');
    }

    return serverUpdateSuccess || orderIndex !== -1;
  };

  const handleSaveAudit = async () => {
    setSaving(true);
    try {
      // 🔥 1. Sauvegarder dans la commande CoreVision
      const success = await updateOrderData({ audit });

      if (success) {
        // 🔥 2. NOUVEAU : Sauvegarder aussi dans la fiche client
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const userId = session?.user?.id || 'default';
          
          const clientDetailKey = `client_detail_${userId}_${order.clientId}`;
          const storedClientDetail = localStorage.getItem(clientDetailKey);
          
          if (storedClientDetail) {
            const clientData = JSON.parse(storedClientDetail);
            clientData.auditCoreVision = audit;
            localStorage.setItem(clientDetailKey, JSON.stringify(clientData));
            console.log('✅ Audit sauvegardé dans la fiche client');
          }
        } catch (error) {
          console.error('⚠️ Erreur lors de la sauvegarde dans la fiche client:', error);
        }
        
        toast.success('✅ Audit sauvegardé');
        onUpdate();
      } else {
        toast.error('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAudit = async () => {
    setGeneratingAudit(true);
    toast.info('🤖 Génération de l\'audit en cours...');

    try {
      // 🔥 UTILISER order.bilanData QUI CONTIENT LES DONNÉES COMPLETES DU CLIENT
      // (patrimoineData, revenusData, impositionData, familyInfo, entreprises)
      let clientData = order.bilanData;

      // Si order.bilanData est absent (anciennes commandes), récupérer via API
      if (!clientData) {
        console.warn('⚠️ order.bilanData absent, récupération via API...');
        clientData = await clientAPI.getById(order.clientId);
      }

      console.log('📦 Données client utilisées pour l\'audit:', clientData);

      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/audit-patrimonial/generer/${order.clientId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            commandeId: order.orderId,
            clientData: clientData // ✅ Envoyer les données complètes du client
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Erreur serveur:', data);
        const errorMsg = data.details || data.error || 'Erreur lors de la génération de l\'audit';
        toast.error(`❌ ${errorMsg}`);
        return;
      }

      if (data.success && data.audit) {
        setAuditGenere(data.audit);
        toast.success('✅ Audit généré automatiquement !');
      } else {
        toast.error('❌ Erreur lors de la génération de l\'audit');
      }
    } catch (error) {
      console.error('Erreur génération audit:', error);
      toast.error('❌ Erreur lors de la génération de l\'audit');
    } finally {
      setGeneratingAudit(false);
    }
  };

  const handleCopyAuditGenere = () => {
    if (!auditGenere) return;
    
    // Formatter l'audit généré en texte
    let texte = `AUDIT PATRIMONIAL AUTOMATIQUE
========================================

`;
    
    // 1. Synthèse
    texte += `1. SYNTHÈSE CLIENT
------------------
Nom : ${order.clientName}
Patrimoine total : ${auditGenere.analyse_patrimoniale.patrimoine_total.toLocaleString('fr-FR')} €
Score global : ${auditGenere.score_global}/10

`;
    
    // 2. Analyse civile
    texte += `2. ANALYSE CIVILE (${auditGenere.analyse_civile.score}/10)
------------------
Régime matrimonial : ${auditGenere.analyse_civile.regime_matrimonial_analyse}

Protection conjoint : ${auditGenere.analyse_civile.protection_conjoint.niveau}
${auditGenere.analyse_civile.protection_conjoint.recommandations.map((r: string) => `  • ${r}`).join('\n')}

Organisation successorale :
${auditGenere.analyse_civile.organisation_successorale.analyse}

Optimisations proposées :
${auditGenere.analyse_civile.organisation_successorale.optimisations.map((o: string) => `  • ${o}`).join('\n')}

`;
    
    // 3. Analyse fiscale
    texte += `3. ANALYSE FISCALE (${auditGenere.analyse_fiscale.score}/10)
------------------
Revenus :
  • IR estimé : ${auditGenere.analyse_fiscale.fiscalite_revenus.ir_estime.toLocaleString('fr-FR')} €
  • PS estimées : ${auditGenere.analyse_fiscale.fiscalite_revenus.ps_estimees.toLocaleString('fr-FR')} €
  • Taux global : ${auditGenere.analyse_fiscale.fiscalite_revenus.taux_global.toFixed(1)}%

Patrimoine :
  • IFI estimé : ${auditGenere.analyse_fiscale.fiscalite_patrimoine.ifi_estime.toLocaleString('fr-FR')} €
  • Assujetti : ${auditGenere.analyse_fiscale.fiscalite_patrimoine.assujetti ? 'Oui' : 'Non'}

Optimisations identifiées :
${auditGenere.analyse_fiscale.optimisations_possibles.map((opt: any) => 
  `  • ${opt.type} : Gain estimé ${opt.gain_estime.toLocaleString('fr-FR')} €\n    ${opt.description}`
).join('\n')}

`;
    
    // 4. Analyse sociale
    texte += `4. ANALYSE SOCIALE (${auditGenere.analyse_sociale.score}/10)
------------------
Statut : ${auditGenere.analyse_sociale.statut_social}
Cotisations estimées : ${auditGenere.analyse_sociale.cotisations_estimees.toLocaleString('fr-FR')} €
Protection sociale : ${auditGenere.analyse_sociale.protection_sociale.niveau}

`;
    
    if (auditGenere.analyse_sociale.optimisation_remuneration) {
      texte += `Optimisation rémunération possible :
  Gain annuel : ${auditGenere.analyse_sociale.optimisation_remuneration.gain_annuel.toLocaleString('fr-FR')} €

`;
    }
    
    // 5. Analyse patrimoniale
    texte += `5. ANALYSE PATRIMONIALE (${auditGenere.analyse_patrimoniale.score}/10)
------------------
Patrimoine total : ${auditGenere.analyse_patrimoniale.patrimoine_total.toLocaleString('fr-FR')} €

Répartition :
  • Immobilier PP : ${auditGenere.analyse_patrimoniale.repartition.immobilier_pp_pct.toFixed(1)}%
  • Immobilier locatif : ${auditGenere.analyse_patrimoniale.repartition.immobilier_locatif_pct.toFixed(1)}%
  • Liquidités : ${auditGenere.analyse_patrimoniale.repartition.liquidites_pct.toFixed(1)}%
  • Assurance-vie : ${auditGenere.analyse_patrimoniale.repartition.assurance_vie_pct.toFixed(1)}%
  • Titres société : ${auditGenere.analyse_patrimoniale.repartition.titres_societe_pct.toFixed(1)}%
  • Portefeuille financier : ${auditGenere.analyse_patrimoniale.repartition.portefeuille_financier_pct.toFixed(1)}%

Diversification (${auditGenere.analyse_patrimoniale.diversification.score}/10) :
${auditGenere.analyse_patrimoniale.diversification.analyse}

Recommandations :
${auditGenere.analyse_patrimoniale.diversification.recommandations.map((r: string) => `  • ${r}`).join('\n')}

`;
    
    // 6. Stratégies proposées
    if (auditGenere.strategies_proposees.length > 0) {
      texte += `6. STRATÉGIES PATRIMONIALES PROPOSÉES (${auditGenere.strategies_proposees.length})
------------------
`;
      auditGenere.strategies_proposees.forEach((strat: any, idx: number) => {
        texte += `
Stratégie ${idx + 1} : ${strat.nom} (Pertinence: ${strat.pertinence}/10)

Objectif : ${strat.objectif}

Conditions : ${strat.conditions}

Avantages : ${strat.avantages}

Risques : ${strat.risques}

Fiscalité : ${strat.fiscalite}

`;
        if (strat.simulation) {
          texte += `Simulation financière :
  • Gain fiscal annuel : ${strat.simulation.gain_fiscal_annuel.toLocaleString('fr-FR')} €
  • Coût mise en place : ${strat.simulation.cout_mise_en_place.toLocaleString('fr-FR')} €
  • Gain sur 10 ans : ${strat.simulation.gain_sur_10ans.toLocaleString('fr-FR')} €

`;
        }
      });
    }
    
    // 7. Préconisations
    if (auditGenere.preconisations.length > 0) {
      texte += `7. PRÉCONISATIONS PRIORITAIRES
------------------
`;
      auditGenere.preconisations.forEach((preco: string, idx: number) => {
        texte += `${idx + 1}. ${preco}\n`;
      });
    }
    
    setAudit(texte);
    toast.success('✅ Audit copié dans l\'éditeur !');
  };

  const handleLoadRapportStructure = async () => {
    setLoadingRapport(true);
    
    try {
      console.log('🔍 Chargement du rapport structuré pour le client:', order.clientId);
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/audit-patrimonial/client/${order.clientId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Données reçues:', data);
      
      if (!data.success || !data.audits || data.audits.length === 0) {
        toast.error('Aucun audit trouvé', {
          description: 'Veuillez d\'abord générer un audit patrimonial avec le bouton "Générer l\'audit"'
        });
        return;
      }

      // Prendre le dernier audit (le plus récent)
      const dernierAudit = data.audits[0];
      console.log('📄 Dernier audit:', dernierAudit);
      
      if (!dernierAudit.rapport_structure) {
        toast.error('Rapport non disponible', {
          description: 'Cet audit ne contient pas de rapport structuré. Veuillez régénérer l\'audit.'
        });
        return;
      }

      const rapport = dernierAudit.rapport_structure;
      console.log('✅ Rapport structuré chargé:', rapport);
      
      // 🔥 Formater le rapport en texte pour l'éditeur
      let texte = `RAPPORT PATRIMONIAL STRUCTURÉ\n========================================\n\n`;
      
      texte += `Client: ${order.clientName}\n`;
      texte += `Date: ${new Date(dernierAudit.date_creation).toLocaleDateString('fr-FR')}\n\n`;
      
      // Section 1: Synthèse exécutive
      if (rapport.section1_synthese) {
        texte += `========================================\n`;
        texte += `1. SYNTHÈSE EXÉCUTIVE\n`;
        texte += `========================================\n\n`;
        texte += `${rapport.section1_synthese.contexte}\n\n`;
        if (rapport.section1_synthese.points_cles?.length > 0) {
          texte += `Points clés:\n`;
          rapport.section1_synthese.points_cles.forEach((point: string) => {
            texte += `  • ${point}\n`;
          });
          texte += `\n`;
        }
      }
      
      // Section 2: Situation actuelle
      if (rapport.section2_situation_actuelle) {
        texte += `========================================\n`;
        texte += `2. SITUATION ACTUELLE\n`;
        texte += `========================================\n\n`;
        
        if (rapport.section2_situation_actuelle.situation_familiale) {
          texte += `Situation familiale:\n${rapport.section2_situation_actuelle.situation_familiale}\n\n`;
        }
        if (rapport.section2_situation_actuelle.situation_professionnelle) {
          texte += `Situation professionnelle:\n${rapport.section2_situation_actuelle.situation_professionnelle}\n\n`;
        }
        if (rapport.section2_situation_actuelle.patrimoine) {
          texte += `Patrimoine:\n${rapport.section2_situation_actuelle.patrimoine}\n\n`;
        }
        if (rapport.section2_situation_actuelle.revenus) {
          texte += `Revenus:\n${rapport.section2_situation_actuelle.revenus}\n\n`;
        }
      }
      
      // Section 3: Analyses détaillées
      if (rapport.section3_analyses) {
        texte += `========================================\n`;
        texte += `3. ANALYSES DÉTAILLÉES\n`;
        texte += `========================================\n\n`;
        
        if (rapport.section3_analyses.analyse_civile) {
          texte += `ANALYSE CIVILE\n`;
          texte += `${rapport.section3_analyses.analyse_civile}\n\n`;
        }
        if (rapport.section3_analyses.analyse_fiscale) {
          texte += `ANALYSE FISCALE\n`;
          texte += `${rapport.section3_analyses.analyse_fiscale}\n\n`;
        }
        if (rapport.section3_analyses.analyse_sociale) {
          texte += `ANALYSE SOCIALE\n`;
          texte += `${rapport.section3_analyses.analyse_sociale}\n\n`;
        }
        if (rapport.section3_analyses.analyse_patrimoniale) {
          texte += `ANALYSE PATRIMONIALE\n`;
          texte += `${rapport.section3_analyses.analyse_patrimoniale}\n\n`;
        }
      }
      
      // Section 4: Problématiques identifiées
      if (rapport.section4_problematiques?.length > 0) {
        texte += `========================================\n`;
        texte += `4. PROBLÉMATIQUES IDENTIFIÉES\n`;
        texte += `========================================\n\n`;
        rapport.section4_problematiques.forEach((prob: any, idx: number) => {
          texte += `${idx + 1}. ${prob.titre}\n`;
          texte += `   Gravité: ${prob.gravite}\n`;
          texte += `   ${prob.description}\n\n`;
        });
      }
      
      // Section 5: Objectifs
      if (rapport.section5_objectifs) {
        texte += `========================================\n`;
        texte += `5. OBJECTIFS\n`;
        texte += `========================================\n\n`;
        
        if (rapport.section5_objectifs.objectifs_declares?.length > 0) {
          texte += `Objectifs déclarés:\n`;
          rapport.section5_objectifs.objectifs_declares.forEach((obj: string) => {
            texte += `  • ${obj}\n`;
          });
          texte += `\n`;
        }
        
        if (rapport.section5_objectifs.objectifs_deduits?.length > 0) {
          texte += `Objectifs identifiés:\n`;
          rapport.section5_objectifs.objectifs_deduits.forEach((obj: string) => {
            texte += `  • ${obj}\n`;
          });
          texte += `\n`;
        }
      }
      
      // Section 6: Recommandations stratégiques
      if (rapport.section6_recommandations?.strategies?.length > 0) {
        texte += `========================================\n`;
        texte += `6. RECOMMANDATIONS STRATÉGIQUES\n`;
        texte += `========================================\n\n`;
        
        if (rapport.section6_recommandations.synthese) {
          texte += `${rapport.section6_recommandations.synthese}\n\n`;
        }
        
        rapport.section6_recommandations.strategies.slice(0, 10).forEach((strat: any, idx: number) => {
          texte += `${idx + 1}. ${strat.nom}\n`;
          texte += `   Pertinence: ${strat.pertinence}/10\n`;
          texte += `   ${strat.objectif}\n\n`;
          if (strat.avantages) {
            texte += `   Avantages: ${strat.avantages}\n`;
          }
          if (strat.simulation?.gain_fiscal_annuel) {
            texte += `   Gain fiscal estimé: ${strat.simulation.gain_fiscal_annuel.toLocaleString('fr-FR')} €/an\n`;
          }
          texte += `\n`;
        });
      }
      
      // Section 7: Plan d'action
      if (rapport.section7_plan_action) {
        texte += `========================================\n`;
        texte += `7. PLAN D'ACTION\n`;
        texte += `========================================\n\n`;
        
        if (rapport.section7_plan_action.actions_immediates?.length > 0) {
          texte += `Actions immédiates (1-3 mois):\n`;
          rapport.section7_plan_action.actions_immediates.forEach((action: string) => {
            texte += `  • ${action}\n`;
          });
          texte += `\n`;
        }
        
        if (rapport.section7_plan_action.actions_court_terme?.length > 0) {
          texte += `Actions court terme (3-6 mois):\n`;
          rapport.section7_plan_action.actions_court_terme.forEach((action: string) => {
            texte += `  • ${action}\n`;
          });
          texte += `\n`;
        }
        
        if (rapport.section7_plan_action.actions_moyen_terme?.length > 0) {
          texte += `Actions moyen terme (6-12 mois):\n`;
          rapport.section7_plan_action.actions_moyen_terme.forEach((action: string) => {
            texte += `  • ${action}\n`;
          });
          texte += `\n`;
        }
      }
      
      // 🔥 Insérer le texte dans le textarea
      setAudit(texte);
      toast.success('Rapport structuré chargé dans l\'éditeur');
      
    } catch (error) {
      console.error('❌ Erreur chargement rapport:', error);
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Impossible de charger le rapport'
      });
    } finally {
      setLoadingRapport(false);
    }
  };

  const handleAddPreconisation = () => {
    if (!newPreconisation.title || !newPreconisation.description) {
      toast.error('❌ Veuillez remplir tous les champs');
      return;
    }

    const preco: Preconisation = {
      id: crypto.randomUUID(),
      title: newPreconisation.title!,
      description: newPreconisation.description!,
      priority: newPreconisation.priority || 'medium',
      category: newPreconisation.category || 'Autre',
    };

    setPreconisations([...preconisations, preco]);
    setNewPreconisation({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
    });
    toast.success('✅ Préconisation ajoutée');
  };

  const handleDeletePreconisation = (id: string) => {
    setPreconisations(preconisations.filter(p => p.id !== id));
    toast.success('✅ Préconisation supprimée');
  };

  const handleSavePreconisations = async () => {
    setSaving(true);
    try {
      const success = await updateOrderData({ preconisations });

      if (success) {
        toast.success('✅ Préconisations sauvegardées');
        onUpdate();
      } else {
        toast.error('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSavePresentation = async () => {
    setSaving(true);
    try {
      const success = await updateOrderData({ presentationClient });

      if (success) {
        toast.success('✅ Présentation sauvegardée');
        onUpdate();
      } else {
        toast.error('❌ Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('❌ Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateAndSend = async () => {
    if (!audit.trim()) {
      toast.error('❌ Veuillez rédiger l\'audit avant de valider');
      return;
    }
    if (preconisations.length === 0) {
      toast.error('❌ Veuillez ajouter au moins une préconisation');
      return;
    }

    setSending(true);
    try {
      // 🔥 ÉTAPE 1 : Mettre à jour la commande CoreVision
      const success = await updateOrderData({
        status: 'completed',
        audit,
        preconisations,
        presentationClient,
        validatedByAdmin: true,
        validatedAt: new Date().toISOString(),
      });

      if (!success) {
        toast.error('❌ Erreur lors de la validation');
        setSending(false);
        return;
      }

      // 🔥 ÉTAPE 2 : Récupérer les données du client
      const clientId = order.clientId;
      console.log('📋 Mise à jour du client:', clientId);
      
      // 🔥 Récupérer le vrai userId depuis la session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'default';
      console.log('👤 User ID récupéré:', userId);
      
      // Charger le client depuis localStorage
      const clientDetailKey = `client_detail_${userId}_${clientId}`;
      const storedClient = localStorage.getItem(clientDetailKey);
      
      if (!storedClient) {
        console.warn('⚠️ Client non trouvé en localStorage avec clé:', clientDetailKey);
        toast.success('✅ Audit validé et envoyé au CGP !');
        onUpdate();
        onClose();
        return;
      }

      const clientData = JSON.parse(storedClient);
      console.log('📦 Données client chargées:', clientData);

      // 🔥 ÉTAPE 3 : Ajouter l'audit, la présentation et les préconisations CoreVision au client
      clientData.auditCoreVision = audit;
      clientData.presentationCoreVision = presentationClient;
      clientData.preconisationsCoreVision = preconisations;
      
      console.log('✅ Données CoreVision sauvegardées:', {
        audit: audit.substring(0, 100) + '...',
        presentation: presentationClient.substring(0, 100) + '...',
        nbPreconisations: preconisations.length
      });

      // 🔥 ÉTAPE 4 : Convertir les préconisations en recommandations
      const corevisionRecommendations = preconisations.map((preco) => ({
        id: preco.id,
        category: preco.category || 'Autre',
        title: preco.title,
        description: preco.description,
        priority: preco.priority,
        deadline: undefined,
        completed: false,
        source: 'corevision' as const,
        validatedByCGP: false, // À valider par le CGP
      }));

      // Fusionner avec les recommandations existantes
      const existingRecommendations = clientData.auditRecommendations || [];
      clientData.auditRecommendations = [...existingRecommendations, ...corevisionRecommendations];

      // 🔥 ÉTAPE 5 : Mettre à jour les tâches R1-R2
      const tasksKey = `client_tasks_${userId}_${clientId}`;
      const storedTasks = localStorage.getItem(tasksKey);
      
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        console.log('📋 Tâches chargées:', tasks);

        // Trouver et valider les tâches R1-R2
        tasks.forEach((task: any) => {
          // Tâche 1 : "Élaboration de la stratégie patrimoniale"
          if (task.title === 'Élaboration de la stratégie patrimoniale' && task.stage === 'R1-R2') {
            task.completed = true;
            task.notes = '✅ Stratégie établie par CoreVision - Analyse terminée';
            task.completedAt = new Date().toISOString();
            console.log('✅ Tâche "Élaboration de la stratégie" validée');
          }

          // Tâche 2 : "Préparation du bilan détaillé"
          if (task.title === 'Préparation du bilan détaillé' && task.stage === 'R1-R2') {
            task.completed = true;
            task.notes = `✅ Bilan préparé par CoreVision\n\n${audit}`;
            task.completedAt = new Date().toISOString();
            console.log('✅ Tâche "Préparation du bilan" validée avec copie audit');
          }

          // Tâche 3 : "Validation des recommandations" → Ajouter les recommandations
          if (task.title === 'Validation des recommandations' && task.stage === 'R1-R2') {
            // Ne pas marquer comme complétée, juste ajouter les recommandations dans les notes
            task.notes = `📋 ${preconisations.length} recommandation(s) CoreVision reçues. Consultez-les dans l'onglet Audit pour validation.`;
            console.log('📋 Tâche "Validation des recommandations" mise à jour');
          }
        });

        localStorage.setItem(tasksKey, JSON.stringify(tasks));
        console.log('✅ Tâches mises à jour');
      }

      // 🔥 ÉTAPE 6 : Sauvegarder le client
      localStorage.setItem(clientDetailKey, JSON.stringify(clientData));
      console.log('✅ Client mis à jour avec audit et recommandations');

      // 🔥 ÉTAPE 7 : Émettre l'vénement de validation admin pour rafraîchir les tâches en temps réel
      window.dispatchEvent(new CustomEvent('adminValidated', { 
        detail: { clientId: order.clientId } 
      }));
      console.log('📡 Événement adminValidated émis pour clientId:', order.clientId);

      toast.success('✅ Audit validé et envoyé au CGP !');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast.error('❌ Erreur lors de la validation');
    } finally {
      setSending(false);
    }
  };

  const calculateTotalPatrimoine = () => {
    if (!bilanData?.patrimoine) return 0;
    const actifs = (bilanData.patrimoine.actifsFinanciers || []).reduce((sum: number, a: any) => sum + (a.value || 0), 0);
    const immo = (bilanData.patrimoine.actifsImmobiliers || []).reduce((sum: number, i: any) => sum + (i.value || 0), 0);
    const passifs = (bilanData.patrimoine.passifs || []).reduce((sum: number, p: any) => sum + (p.value || 0), 0);
    return actifs + immo - passifs;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{order.clientName}</h2>
            <p className="text-purple-100 text-sm mt-1">CGP: {order.cgpName} • {order.cgpEmail}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6">
          {[
            { id: 'rapport', label: '📄 Rapport Patrimonial', icon: '📄' },
            { id: 'preconisations', label: '💡 Préconisations', icon: '💡' },
            { id: 'presentation', label: '💬 Présentation', icon: '💬' },
            { id: 'incoherences', label: '🚨 Incohérences', icon: '🚨' },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${
                activeSubTab === tab.id
                  ? 'text-purple-600 border-purple-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSubTab === 'rapport' && (
            <div>
              <RapportSection 
                clientId={order.clientId}
                clientName={order.clientName}
              />
            </div>
          )}

          {activeSubTab === 'preconisations' && (
            <div className="space-y-6">
              {/* Liste des préconisations */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">💡 Préconisations ({preconisations.length})</h3>
                {preconisations.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-600">Aucune préconisation. Ajoutez-en ci-dessous.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {preconisations.map((preco) => (
                      <div key={preco.id} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{preco.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{preco.description}</p>
                          </div>
                          <button
                            onClick={() => handleDeletePreconisation(preco.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            preco.priority === 'high' 
                              ? 'bg-red-100 text-red-700' 
                              : preco.priority === 'medium'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {preco.priority === 'high' ? '🔴 Prioritaire' : preco.priority === 'medium' ? '🟠 Moyen' : '⚪ Faible'}
                          </span>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                            {preco.category}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulaire d'ajout */}
              <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                <h4 className="font-semibold text-purple-900 mb-3">➕ Ajouter une préconisation</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
                    <input
                      type="text"
                      value={newPreconisation.title}
                      onChange={(e) => setNewPreconisation({ ...newPreconisation, title: e.target.value })}
                      placeholder="Ex: Optimisation fiscale via LMNP"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newPreconisation.description}
                      onChange={(e) => setNewPreconisation({ ...newPreconisation, description: e.target.value })}
                      placeholder="Description détaillée de la préconisation..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                      <select
                        value={newPreconisation.priority}
                        onChange={(e) => setNewPreconisation({ ...newPreconisation, priority: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="high">🔴 Prioritaire</option>
                        <option value="medium">🟠 Moyen</option>
                        <option value="low">⚪ Faible</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                      <input
                        type="text"
                        value={newPreconisation.category}
                        onChange={(e) => setNewPreconisation({ ...newPreconisation, category: e.target.value })}
                        placeholder="Ex: Fiscalité"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddPreconisation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>
              </div>

              <button
                onClick={handleSavePreconisations}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder les préconisations'}
              </button>
            </div>
          )}

          {activeSubTab === 'presentation' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-900 mb-2">💬 Présentation du client</label>
                <p className="text-sm text-gray-600 mb-3">
                  Rédigez une présentation détaillée du client qui sera transmise au CGP après validation.
                </p>
                <textarea
                  value={presentationClient}
                  onChange={(e) => setPresentationClient(e.target.value)}
                  placeholder="Présentation détaillée du client..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={15}
                />
              </div>

              <button
                onClick={handleSavePresentation}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder la présentation'}
              </button>
            </div>
          )}

          {activeSubTab === 'incoherences' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">🚨 Incohérences détectées</h3>
              {loadingIncoherences ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-600">Détection des incohérences en cours...</p>
                </div>
              ) : errorIncoherences ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-600">Erreur lors de la détection des incohérences: {errorIncoherences.message}</p>
                </div>
              ) : rapportIncoherences && rapportIncoherences.length > 0 ? (
                <div className="space-y-3">
                  {rapportIncoherences.map((incoherence: any, idx: number) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{incoherence.titre}</h4>
                          <p className="text-sm text-gray-600 mt-1">{incoherence.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => valider(incoherence.id)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => ignorer(incoherence.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => corriger(incoherence.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          incoherence.severity === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : incoherence.severity === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {incoherence.severity === 'high' ? '🔴 Critique' : incoherence.severity === 'medium' ? '🟠 Moyenne' : '⚪ Faible'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {incoherence.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-gray-600">Aucune incohérence détectée.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer avec validation finale */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Une fois validé, l'audit et les préconisations seront accessibles au CGP
            </p>
            <button
              onClick={handleValidateAndSend}
              disabled={sending || !audit || preconisations.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Valider et envoyer au CGP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}