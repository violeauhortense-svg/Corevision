import { useState, useEffect, useMemo, useRef } from 'react';
import { Euro, TrendingUp, Calculator, PieChart, Plus, Trash2, Save, X, Edit2, RefreshCw, AlertTriangle, Info, Eye } from 'lucide-react';
import { 
  calculerImpotRevenu, 
  calculerPrelevementsSociaux, 
  calculerIFI,
  type RevenuFiscal,
  type DetailCalculIR,
  type DetailCalculPS,
  type DetailCalculIFI
} from '../services/fiscalCalculatorDynamic';
import {
  calculerImpotRevenuSync,
  calculerPrelevementsSociauxSync,
  calculerIFISync,
  calculerNombreParts,
} from '../services/fiscalCalculatorSync';
import { FiscalDetailModal } from './FiscalDetailModal';

type CategorieRevenu = 
  | 'salarie_non_cadre'
  | 'salarie_cadre'
  | 'gerant_sarl_majoritaire'
  | 'gerant_sarl_minoritaire'
  | 'president_sas'
  | 'auto_entrepreneur'
  | 'fonctionnaire_cat_a'
  | 'fonctionnaire_autre'
  | 'fonctionnaire_collectivite'
  | 'retraite'
  | 'interimaire'
  | 'cdd'
  | 'intermittent'
  | 'dividende';

interface RevenuItem {
  id: string;
  categorie: CategorieRevenu;
  beneficiaire: 'client' | 'conjoint' | 'enfant';
  beneficiaireNom: string;
  montantAnnuel: number;
  montantMensuel: number;
}

interface ImpositionData {
  traitementsSalairesPensions: number;
  revenusTNS: number;
  locationsMeublesNonPro: number;
  locationsMeublesRegime?: 'micro' | 'reel';
  revenusValeursMobilieres: number;
  plusValueMobiliere: number;
  revenusFonciers: number;
  revenusFonciersRegime?: 'micro' | 'reel';
  nombreParts: number;
  trancheMarginaleTMI: number;
  impotSurRevenu: number;
  prelevementsSociaux?: number; // 🔥 NOUVEAU - PS calculés
  IFI: number;
  // Flags pour les modifications manuelles
  traitementsSalairesPensionsModifieeManuellement?: boolean;
  revenusTNSModifieeManuellement?: boolean;
  locationsMeublesModifieeManuellement?: boolean;
  revenusFonciersModifies?: boolean;
  // Justifications
  justificationTraitementsSalairesPensions?: string;
  justificationRevenusTNS?: string;
  justificationLocationsMeubles?: string;
  justificationRevenusFonciers?: string;
}

interface RevenusImpositionFormProps {
  revenus: RevenuItem[];
  imposition: ImpositionData;
  onSave: (revenus: RevenuItem[], imposition: ImpositionData) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  familyInfo?: any;
  patrimoineImmobilierNet?: number;
  clientData?: any;
  totalLoyersNus?: number;
  totalLoyersMeubles?: number;
}

export function RevenusImpositionForm({ 
  revenus: initialRevenus, 
  imposition: initialImposition, 
  onSave, 
  isEditing,
  onToggleEdit,
  familyInfo,
  patrimoineImmobilierNet,
  clientData,
  totalLoyersNus,
  totalLoyersMeubles
}: RevenusImpositionFormProps) {
  const [revenus, setRevenus] = useState<RevenuItem[]>(initialRevenus);
  console.log('🔵 RevenusImpositionForm - Rendu du composant');
  
  const [imposition, setImposition] = useState<ImpositionData>(initialImposition);
  const [showAddRevenu, setShowAddRevenu] = useState(false);
  const [newRevenu, setNewRevenu] = useState<Partial<RevenuItem>>({
    categorie: 'salarie_non_cadre',
    beneficiaire: 'client',
    montantAnnuel: 0,
  });

  // États pour les calculs fiscaux automatiques
  const [calculIR, setCalculIR] = useState<DetailCalculIR | null>(null);
  const [calculPS, setCalculPS] = useState<DetailCalculPS | null>(null);
  const [calculIFI, setCalculIFI] = useState<DetailCalculIFI | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 🔥 SYNCHRONISATION : Mettre à jour l'état local quand les props changent
  useEffect(() => {
    console.log('🔄 Synchronisation revenus depuis props:', initialRevenus.length, 'revenus');
    setRevenus(initialRevenus);
  }, [initialRevenus]);

  useEffect(() => {
    console.log('🔄 Synchronisation imposition depuis props');
    setImposition(initialImposition);
  }, [initialImposition]);

  const categorieLabels: Record<CategorieRevenu, string> = {
    salarie_non_cadre: 'Salarié non cadre',
    salarie_cadre: 'Salarié cadre',
    gerant_sarl_majoritaire: 'Gérant SARL Majoritaire (TNS)',
    gerant_sarl_minoritaire: 'Gérant SARL Minoritaire (TAS)',
    president_sas: 'Président/DG de SAS',
    auto_entrepreneur: 'Auto-Entrepreneur',
    fonctionnaire_cat_a: 'Fonctionnaire Cat A',
    fonctionnaire_autre: 'Fonctionnaire autre catégorie',
    fonctionnaire_collectivite: 'Fonctionnaire collectivité territoriale',
    retraite: 'Retraité',
    interimaire: 'Intérimaire',
    cdd: 'CDD',
    intermittent: 'Intermittent du spectacle',
    dividende: 'Dividende',
  };

  // Mapping des catégories vers les sections fiscales
  const categoriesToTNS: CategorieRevenu[] = [
    'gerant_sarl_majoritaire',
    'gerant_sarl_minoritaire',
    'president_sas'
  ];

  const getBeneficiaireNom = (type: 'client' | 'conjoint' | 'enfant', enfantId?: string) => {
    if (type === 'client') {
      return clientData?.firstName || 'Client';
    }
    if (type === 'conjoint') {
      return familyInfo?.spouse?.firstName || 'Conjoint';
    }
    if (type === 'enfant' && enfantId) {
      const enfant = familyInfo?.children?.find((e: any) => e.id === enfantId);
      return enfant?.firstName || 'Enfant';
    }
    return '';
  };

  const beneficiaireColors = {
    client: 'bg-blue-600',
    conjoint: 'bg-pink-600',
    enfant: 'bg-green-600',
  };

  // Obtenir les bénéficiaires disponibles
  const getBeneficiairesDisponibles = () => {
    const beneficiaires: { value: string; label: string }[] = [
      { value: 'client', label: clientData?.firstName || 'Client' }
    ];

    // Ajouter conjoint s'il existe
    if (familyInfo && (familyInfo.maritalStatus === 'Marié(e)' || familyInfo.maritalStatus === 'Pacsé(e)')) {
      if (familyInfo.spouse?.firstName) {
        beneficiaires.push({
          value: 'conjoint',
          label: familyInfo.spouse.firstName
        });
      }
    }

    // Ajouter les enfants s'ils existent
    if (familyInfo?.children && familyInfo.children.length > 0) {
      familyInfo.children.forEach((child: any) => {
        beneficiaires.push({
          value: `enfant_${child.id}`,
          label: child.firstName
        });
      });
    }

    return beneficiaires;
  };

  const beneficiairesDisponibles = getBeneficiairesDisponibles();

  // 🎯 OPTIMISATION: Utiliser useRef pour éviter les recalculs inutiles
  const prevFamilyInfoRef = useRef<string>('');
  const calculEnCoursRef = useRef(false);
  
  // 🏠 Ref pour le dernier calcul de revenu foncier (évite les recalculs en boucle)
  const dernierCalculFoncierRef = useRef({ loyers: 0, regime: 'micro' as 'micro' | 'reel', montant: 0 });

  // 📊 CALCUL STABLE DU NOMBRE DE PARTS FISCALES avec useMemo
  const nombrePartsCalcule = useMemo(() => {
    if (!familyInfo) return 1; // Valeur par défaut
    
    try {
      const parts = calculerNombreParts(familyInfo);
      console.log('📊 Calcul nombre de parts:', {
        maritalStatus: familyInfo.maritalStatus,
        children: familyInfo.children?.length || 0,
        childrenFiscaux: familyInfo.children?.filter((e: any) => e.isChargeFiscale || e.aChargeFiscalement).length || 0,
        partsCalculees: parts
      });
      return parts;
    } catch (error) {
      console.error('❌ Erreur calcul nombre de parts:', error);
      return 1;
    }
  }, [
    familyInfo?.maritalStatus,
    familyInfo?.children?.length,
    JSON.stringify(familyInfo?.children?.map((c: any) => ({ isCharge: c.isChargeFiscale || c.aChargeFiscalement, handicap: c.handicap }))),
    familyInfo?.clientMajoration,
    familyInfo?.spouse?.majoration,
    familyInfo?.spouse?.majorationPartFiscale
  ]);

  // Synchroniser le nombre de parts calculé avec l'état imposition
  useEffect(() => {
    if (nombrePartsCalcule > 0 && Math.abs(imposition.nombreParts - nombrePartsCalcule) > 0.01 && !calculEnCoursRef.current) {
      console.log('🔄 Mise à jour nombre de parts:', imposition.nombreParts, '→', nombrePartsCalcule);
      calculEnCoursRef.current = true;
      setImposition(prev => {
        calculEnCoursRef.current = false;
        return { ...prev, nombreParts: nombrePartsCalcule };
      });
    }
  }, [nombrePartsCalcule]);

  // 💰 CALCUL STABLE DES REVENUS avec useMemo
  const revenusCalcules = useMemo(() => {
    let traitements = 0;
    let tns = 0;

    revenus.forEach((revenu) => {
      if (categoriesToTNS.includes(revenu.categorie)) {
        tns += revenu.montantAnnuel;
      } else {
        traitements += revenu.montantAnnuel;
      }
    });

    console.log('💰 Calcul revenus salariés/TNS:', { traitements, tns });
    return { traitements, tns };
  }, [JSON.stringify(revenus.map(r => ({ cat: r.categorie, montant: r.montantAnnuel })))]);

  // 🏠 CALCUL SIMPLE DES REVENUS FONCIERS (sans useMemo pour éviter les problèmes de dépendances)
  // Cette fonction calcule le revenu foncier mais NE déclenche PAS de re-render
  const calculerRevenuFoncier = (loyers: number, regime: 'micro' | 'reel') => {
    if (regime === 'micro') {
      return loyers * 0.70; // Micro-foncier : abattement de 30%
    } else {
      return loyers; // Régime réel : loyers bruts
    }
  };
  
  // ✅ Version stabilisée avec useMemo pour éviter les recalculs multiples
  const revenuFoncierStable = useMemo(() => {
    const loyers = totalLoyersNus || 0;
    const regime = imposition.revenusFonciersRegime || 'micro';
    return calculerRevenuFoncier(loyers, regime);
  }, [totalLoyersNus, imposition.revenusFonciersRegime]);

  // 🔄 Synchroniser les revenus calculés avec l'état imposition (UNIQUEMENT quand les DONNÉES changent)
  useEffect(() => {
    if (calculEnCoursRef.current) {
      console.log('⏸️ Calcul en cours, skip synchronisation revenus');
      return;
    }

    // 🏠 Calculer le revenu foncier avec le régime ACTUEL
    const loyersBrutsNus = totalLoyersNus || 0;
    const regimeActuel = imposition.revenusFonciersRegime || 'micro';
    const revenuFoncierCalcule = calculerRevenuFoncier(loyersBrutsNus, regimeActuel);
    
    // ⚠️ VÉRIFIER si c'est vraiment différent du dernier calcul pour éviter les boucles
    const dernierCalcul = dernierCalculFoncierRef.current;
    const loyersOntChange = Math.abs(loyersBrutsNus - dernierCalcul.loyers) > 1;
    const regimeAChange = regimeActuel !== dernierCalcul.regime;
    const foncierAChange = !imposition.revenusFonciersModifies && 
                           Math.abs(imposition.revenusFonciers - revenuFoncierCalcule) > 1;

    const needsUpdate = 
      (!imposition.traitementsSalairesPensionsModifieeManuellement && imposition.traitementsSalairesPensions !== revenusCalcules.traitements) ||
      (!imposition.revenusTNSModifieeManuellement && imposition.revenusTNS !== revenusCalcules.tns) ||
      (!imposition.locationsMeublesModifieeManuellement && imposition.locationsMeublesNonPro !== (totalLoyersMeubles || 0)) ||
      (loyersOntChange && foncierAChange); // ⚠️ Ne mettre à jour QUE si les loyers ont changé

    if (needsUpdate) {
      const updates: string[] = [];
      if (!imposition.traitementsSalairesPensionsModifieeManuellement && imposition.traitementsSalairesPensions !== revenusCalcules.traitements) {
        updates.push(`traitements: ${imposition.traitementsSalairesPensions} → ${revenusCalcules.traitements}`);
      }
      if (!imposition.revenusTNSModifieeManuellement && imposition.revenusTNS !== revenusCalcules.tns) {
        updates.push(`TNS: ${imposition.revenusTNS} → ${revenusCalcules.tns}`);
      }
      if (loyersOntChange && foncierAChange) {
        updates.push(`foncier: ${imposition.revenusFonciers} → ${revenuFoncierCalcule} (régime: ${regimeActuel})`);
      }
      
      console.log('🔄 Mise à jour revenus:', updates.join(', '));
      
      calculEnCoursRef.current = true;
      setImposition(prev => {
        const nouveauRevenuFoncier = prev.revenusFonciersModifies 
          ? prev.revenusFonciers 
          : calculerRevenuFoncier(totalLoyersNus || 0, prev.revenusFonciersRegime || 'micro');
        
        // 💾 Mettre à jour le ref pour le prochain calcul
        dernierCalculFoncierRef.current = {
          loyers: totalLoyersNus || 0,
          regime: prev.revenusFonciersRegime || 'micro',
          montant: nouveauRevenuFoncier
        };
        
        return {
          ...prev,
          traitementsSalairesPensions: prev.traitementsSalairesPensionsModifieeManuellement 
            ? prev.traitementsSalairesPensions 
            : revenusCalcules.traitements,
          revenusTNS: prev.revenusTNSModifieeManuellement 
            ? prev.revenusTNS 
            : revenusCalcules.tns,
          locationsMeublesNonPro: prev.locationsMeublesModifieeManuellement 
            ? prev.locationsMeublesNonPro 
            : (totalLoyersMeubles || 0),
          revenusFonciers: nouveauRevenuFoncier,
        };
      });
      
      // Remettre le flag à false APRÈS le rendu
      setTimeout(() => {
        calculEnCoursRef.current = false;
      }, 100); // ⚠️ 100ms au lieu de 0 pour laisser le temps au re-render
    }
  }, [revenusCalcules.traitements, revenusCalcules.tns, totalLoyersMeubles, totalLoyersNus]);
  // ⚠️ PAS de dépendance sur imposition.revenusFonciersRegime !

  // Fonction pour calculer les valeurs automatiques
  const calculerValeursAutomatiques = () => {
    const regime = imposition.revenusFonciersRegime || 'micro';
    return {
      traitements: revenusCalcules.traitements,
      tns: revenusCalcules.tns,
      locationsMeubles: totalLoyersMeubles || 0,
      revenusFonciers: calculerRevenuFoncier(totalLoyersNus || 0, regime)
    };
  };

  const revenuFiscalTotal = 
    imposition.traitementsSalairesPensions +
    imposition.revenusTNS +
    imposition.locationsMeublesNonPro +
    imposition.revenusValeursMobilieres +
    imposition.plusValueMobiliere +
    imposition.revenusFonciers;

  const afficherIFI = patrimoineImmobilierNet && patrimoineImmobilierNet > 1300000;

  const totalRevenus = revenus.reduce((sum, r) => sum + r.montantAnnuel, 0);

  const handleAddRevenu = () => {
    if (!newRevenu.beneficiaire || !newRevenu.montantAnnuel) {
      return;
    }

    let beneficiaireType: 'client' | 'conjoint' | 'enfant' = 'client';
    let beneficiaireNom = '';
    let enfantId = '';

    const beneficiaireValue = newRevenu.beneficiaire as string;
    if (beneficiaireValue.startsWith('enfant_')) {
      beneficiaireType = 'enfant';
      enfantId = beneficiaireValue.replace('enfant_', '');
      const enfant = familyInfo?.children?.find((e: any) => e.id === enfantId);
      beneficiaireNom = enfant?.firstName || 'Enfant';
    } else {
      beneficiaireType = beneficiaireValue as 'client' | 'conjoint';
      if (beneficiaireType === 'client') {
        beneficiaireNom = clientData?.firstName || 'Client';
      } else {
        beneficiaireNom = familyInfo?.spouse?.firstName || 'Conjoint';
      }
    }

    const revenu: RevenuItem = {
      id: crypto.randomUUID(),
      categorie: newRevenu.categorie || 'salarie_non_cadre',
      beneficiaire: beneficiaireType,
      beneficiaireNom: beneficiaireNom,
      montantAnnuel: newRevenu.montantAnnuel,
      montantMensuel: newRevenu.montantAnnuel / 12,
    };

    setRevenus([...revenus, revenu]);
    setNewRevenu({ categorie: 'salarie_non_cadre', beneficiaire: 'client', montantAnnuel: 0 });
    setShowAddRevenu(false);
  };

  const handleDeleteRevenu = (id: string) => {
    setRevenus(revenus.filter(r => r.id !== id));
  };

  const handleSave = () => {
    // S'assurer que le nombre de parts est à jour avant de sauvegarder
    const impositionToSave = {
      ...imposition,
      nombreParts: nombrePartsCalcule
    };
    onSave(revenus, impositionToSave);
    onToggleEdit();
  };

  // 🧮 CALCUL IR STABLE avec version SYNC (affichage immédiat) + async (précis)
  const calculIRStable = useMemo(() => {
    // ✅ TOUJOURS calculer, même si parts = 0 (on utilisera 1 par défaut)
    const partsEffectives = nombrePartsCalcule > 0 ? nombrePartsCalcule : 1;
    
    try {
      const revenusFiscal: RevenuFiscal = {
        traitementsSalairesPensions: imposition.traitementsSalairesPensions || 0,
        revenusTNS: imposition.revenusTNS || 0,
        locationsMeublesNonPro: imposition.locationsMeublesNonPro || 0,
        revenusFonciers: imposition.revenusFonciers || 0,
        reveusValeursCapitauxMobiliers: imposition.revenusValeursMobilieres || 0,
        plusValueMobiliere: imposition.plusValueMobiliere || 0,
      };
      
      // ✅ Version SYNC pour affichage immédiat
      const detailIR = calculerImpotRevenuSync(revenusFiscal, partsEffectives);
      console.log('🧮 Calcul IR (SYNC):', { 
        revenus: revenusFiscal, 
        parts: partsEffectives,
        TMI: detailIR.TMI,
        impotFinal: detailIR.impotFinal
      });
      return detailIR;
    } catch (error) {
      console.error('❌ Erreur calcul IR:', error);
      // ✅ Retourner un objet par défaut plutôt que null
      return {
        impotFinal: 0,
        revenuImposable: 0,
        quotientFamilial: 0,
        TMI: 0,
        tauxMoyenImposition: 0,
        details: []
      };
    }
  }, [
    imposition.traitementsSalairesPensions,
    imposition.revenusTNS,
    imposition.locationsMeublesNonPro,
    imposition.revenusFonciers,
    imposition.revenusValeursMobilieres,
    imposition.plusValueMobiliere,
    nombrePartsCalcule
  ]);
  
  // ✅ Calcul IR ASYNC pour obtenir les barèmes dynamiques
  useEffect(() => {
    const partsEffectives = nombrePartsCalcule > 0 ? nombrePartsCalcule : 1;
    
    const revenusFiscal: RevenuFiscal = {
      traitementsSalairesPensions: imposition.traitementsSalairesPensions || 0,
      revenusTNS: imposition.revenusTNS || 0,
      locationsMeublesNonPro: imposition.locationsMeublesNonPro || 0,
      revenusFonciers: imposition.revenusFonciers || 0,
      reveusValeursCapitauxMobiliers: imposition.revenusValeursMobilieres || 0,
      plusValueMobiliere: imposition.plusValueMobiliere || 0,
    };
    
    calculerImpotRevenu(revenusFiscal, partsEffectives)
      .then(detailIR => {
        console.log('🧮 Calcul IR (ASYNC - barèmes dynamiques):', detailIR);
        // On met à jour seulement si le résultat est différent
        if (calculIR?.impotFinal !== detailIR.impotFinal) {
          setCalculIR(detailIR);
        }
      })
      .catch(error => {
        console.error('❌ Erreur calcul IR async:', error);
      });
  }, [
    imposition.traitementsSalairesPensions,
    imposition.revenusTNS,
    imposition.locationsMeublesNonPro,
    imposition.revenusFonciers,
    imposition.revenusValeursMobilieres,
    imposition.plusValueMobiliere,
    nombrePartsCalcule,
  ]);

  // 🧮 CALCUL PS STABLE avec version SYNC
  const calculPSStable = useMemo(() => {
    try {
      const revenusFiscal: RevenuFiscal = {
        traitementsSalairesPensions: imposition.traitementsSalairesPensions || 0,
        revenusTNS: imposition.revenusTNS || 0,
        locationsMeublesNonPro: imposition.locationsMeublesNonPro || 0,
        revenusFonciers: imposition.revenusFonciers || 0,
        reveusValeursCapitauxMobiliers: imposition.revenusValeursMobilieres || 0,
        plusValueMobiliere: imposition.plusValueMobiliere || 0,
      };
      
      // ✅ Version SYNC pour affichage immédiat
      const detailPS = calculerPrelevementsSociauxSync(revenusFiscal);
      console.log('💰 Calcul PS (SYNC):', detailPS);
      return detailPS;
    } catch (error) {
      console.error('❌ Erreur calcul PS:', error);
      // ✅ Retourner un objet par défaut
      return {
        prelevementsSociauxTotal: 0,
        total: 0,
        detailsRevenusFonciers: { revenusFonciers: 0, taux: 0.172, montant: 0 },
        detailsRevenusCapitaux: { revenus: 0, taux: 0.172, montant: 0 },
        detailsPlusValuesMobilieres: { plusValue: 0, taux: 0.172, montant: 0 }
      };
    }
  }, [
    imposition.traitementsSalairesPensions,
    imposition.revenusTNS,
    imposition.locationsMeublesNonPro,
    imposition.revenusFonciers,
    imposition.revenusValeursMobilieres,
    imposition.plusValueMobiliere,
  ]);
  
  // ✅ Calcul PS ASYNC pour obtenir les barèmes dynamiques
  useEffect(() => {
    const revenusFiscal: RevenuFiscal = {
      traitementsSalairesPensions: imposition.traitementsSalairesPensions,
      revenusTNS: imposition.revenusTNS,
      locationsMeublesNonPro: imposition.locationsMeublesNonPro,
      revenusFonciers: imposition.revenusFonciers,
      reveusValeursCapitauxMobiliers: imposition.revenusValeursMobilieres,
      plusValueMobiliere: imposition.plusValueMobiliere,
    };
    
    calculerPrelevementsSociaux(revenusFiscal)
      .then(detailPS => {
        console.log('💰 Calcul PS (ASYNC - barèmes dynamiques):', detailPS);
        if (calculPS?.prelevementsSociauxTotal !== detailPS.prelevementsSociauxTotal) {
          setCalculPS(detailPS);
        }
      })
      .catch(error => {
        console.error('❌ Erreur calcul PS async:', error);
      });
  }, [
    imposition.traitementsSalairesPensions,
    imposition.revenusTNS,
    imposition.locationsMeublesNonPro,
    imposition.revenusFonciers,
    imposition.revenusValeursMobilieres,
    imposition.plusValueMobiliere,
  ]);

  // 🏠 CALCUL IFI STABLE avec version SYNC
  const calculIFIStable = useMemo(() => {
    if (!patrimoineImmobilierNet || patrimoineImmobilierNet <= 800000) return null;
    
    try {
      // ✅ Version SYNC pour affichage immédiat
      const detailIFI = calculerIFISync(patrimoineImmobilierNet, 0);
      console.log('🏠 Calcul IFI (SYNC):', { patrimoine: patrimoineImmobilierNet, ifi: detailIFI.ifiFinal });
      return detailIFI;
    } catch (error) {
      console.error('❌ Erreur calcul IFI:', error);
      return null;
    }
  }, [patrimoineImmobilierNet]);
  
  // ✅ Calcul IFI ASYNC pour obtenir les barèmes dynamiques
  useEffect(() => {
    if (!patrimoineImmobilierNet || patrimoineImmobilierNet <= 800000) {
      setCalculIFI(null);
      return;
    }
    
    calculerIFI(patrimoineImmobilierNet, 0)
      .then(detailIFI => {
        console.log('🏠 Calcul IFI (ASYNC - barèmes dynamiques):', detailIFI);
        if (calculIFI?.ifiFinal !== detailIFI.ifiFinal) {
          setCalculIFI(detailIFI);
        }
      })
      .catch(error => {
        console.error('❌ Erreur calcul IFI async:', error);
      });
  }, [patrimoineImmobilierNet]);

  // ✅ Utiliser les valeurs calculées stables si disponibles, sinon les valeurs de l'état
  // (DOIT être après calculIRStable et calculIFIStable pour éviter l'erreur "Cannot access before initialization")
  const impotSurRevenuAffiche = calculIRStable?.impotFinal ?? imposition.impotSurRevenu;
  const ifiAffiche = calculIFIStable?.ifiFinal ?? imposition.IFI;
  
  // 🎯 Fallback pour l'affichage : utiliser calculIR (async) si disponible, sinon calculIRStable (sync)
  const calculIRDisplay = calculIR || calculIRStable;
  const calculPSDisplay = calculPS || calculPSStable;
  const calculIFIDisplay = calculIFI || calculIFIStable;
  
  // 🐛 DEBUG : Logs pour voir ce qui est défini
  console.log('🐛 DEBUG Module Calcul:', {
    calculIRStable: calculIRStable ? 'DÉFINI' : 'NULL',
    calculIR: calculIR ? 'DÉFINI' : 'NULL',
    calculIRDisplay: calculIRDisplay ? 'DÉFINI' : 'NULL',
    nombrePartsCalcule,
    impotFinal: calculIRDisplay?.impotFinal
  });
  
  const totalImpots = impotSurRevenuAffiche + (afficherIFI ? ifiAffiche : 0);
  const tauxImpositionGlobal = totalRevenus > 0 ? (totalImpots / totalRevenus) * 100 : 0;
  const revenuNetApresImpots = totalRevenus - totalImpots;

  // Mettre à jour les états de calcul
  useEffect(() => {
    if (calculIRStable) setCalculIR(calculIRStable);
  }, [calculIRStable]);

  useEffect(() => {
    if (calculPSStable) setCalculPS(calculPSStable);
  }, [calculPSStable]);

  useEffect(() => {
    if (calculIFIStable) setCalculIFI(calculIFIStable);
  }, [calculIFIStable]);

  // 🔄 SYNCHRONISER IR/TMI/IFI/PS avec l'état imposition (SÉPARÉ du calcul)
  useEffect(() => {
    if (calculEnCoursRef.current || isEditing || !calculIRStable) return;

    const needsUpdateIR = 
      Math.abs(imposition.trancheMarginaleTMI - calculIRStable.TMI) > 0.1 ||
      Math.abs(imposition.impotSurRevenu - calculIRStable.impotFinal) > 1;

    const needsUpdateIFI = calculIFIStable && 
      calculIFIStable.ifiFinal > 0 && 
      Math.abs(imposition.IFI - calculIFIStable.ifiFinal) > 1;

    const needsUpdatePS = calculPSStable &&
      calculPSStable.prelevementsSociauxTotal > 0 &&
      Math.abs((imposition.prelevementsSociaux || 0) - calculPSStable.prelevementsSociauxTotal) > 1;

    if (needsUpdateIR || needsUpdateIFI || needsUpdatePS) {
      const updates: string[] = [];
      if (needsUpdateIR) {
        updates.push(`IR: ${imposition.impotSurRevenu} → ${calculIRStable.impotFinal}, TMI: ${imposition.trancheMarginaleTMI}% → ${calculIRStable.TMI}%`);
      }
      if (needsUpdateIFI) {
        updates.push(`IFI: ${imposition.IFI} → ${calculIFIStable.ifiFinal}`);
      }
      if (needsUpdatePS) {
        updates.push(`PS: ${imposition.prelevementsSociaux || 0} → ${calculPSStable.prelevementsSociauxTotal}`);
      }
      
      console.log('🔄 Mise à jour impôts:', updates.join(', '));
      
      calculEnCoursRef.current = true;
      setImposition(prev => {
        calculEnCoursRef.current = false;
        return {
          ...prev,
          ...(needsUpdateIR ? {
            trancheMarginaleTMI: calculIRStable.TMI,
            impotSurRevenu: calculIRStable.impotFinal,
          } : {}),
          ...(needsUpdateIFI ? {
            IFI: calculIFIStable.ifiFinal,
          } : {}),
          ...(needsUpdatePS ? {
            prelevementsSociaux: calculPSStable.prelevementsSociauxTotal,
          } : {}),
        };
      });
    }
  }, [calculIRStable, calculIFIStable, calculPSStable, isEditing]);

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-blue-900">Revenus totaux</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalRevenus.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-blue-700 mt-1">{(totalRevenus / 12).toLocaleString('fr-FR')} € /mois</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-red-900">Impôts totaux</p>
          </div>
          <p className="text-2xl font-bold text-red-900">{totalImpots.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-red-700 mt-1">{(tauxImpositionGlobal || 0).toFixed(1)}% des revenus</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <Euro className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-green-900">Revenu net après impôts</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{revenuNetApresImpots.toLocaleString('fr-FR')} €</p>
          <p className="text-xs text-green-700 mt-1">{(revenuNetApresImpots / 12).toLocaleString('fr-FR')} € /mois</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm font-medium text-purple-900">TMI</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {calculIRStable ? calculIRStable.TMI : imposition.trancheMarginaleTMI}%
          </p>
          <p className="text-xs text-purple-700 mt-1">{nombrePartsCalcule} parts fiscales</p>
          {calculIRStable && Math.abs(imposition.trancheMarginaleTMI - calculIRStable.TMI) > 0.1 && (
            <p className="text-xs text-orange-600 mt-1">⏳ Sync...</p>
          )}
        </div>
      </div>

      {/* 🧮 MODULE CALCULS FISCAUX AUTOMATIQUES - TOUJOURS AFFICHÉ */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="w-6 h-6 text-white" />
              <h3 className="text-xl font-bold text-white">💰 Calculs Fiscaux Automatiques</h3>
            </div>
            <button
              onClick={() => setShowDetailModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-medium backdrop-blur-sm border border-white/30"
            >
              <Eye className="w-4 h-4" />
              Voir les détails complets
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* Impôt sur le Revenu */}
            <div className="bg-white rounded-lg border-2 border-blue-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Impôt sur le Revenu</h4>
                    <p className="text-xs text-gray-600">Barème progressif 2026 (1ère tranche : 11 600 €)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{(calculIRDisplay?.impotFinal ?? 0).toLocaleString('fr-FR')} €</p>
                  <p className="text-xs text-gray-600 mt-1">
                    soit {((calculIRDisplay?.impotFinal ?? 0) / 12).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € /mois
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-blue-100">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Revenu imposable</p>
                  <p className="text-lg font-bold text-gray-900">{(calculIRDisplay?.revenuImposable || 0).toLocaleString('fr-FR')} €</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Nombre de parts</p>
                  <p className="text-lg font-bold text-blue-600">{(calculIRDisplay?.nombreParts || nombrePartsCalcule || 1).toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Quotient familial</p>
                  <p className="text-lg font-bold text-gray-900">{(calculIRDisplay?.quotientFamilial || 0).toLocaleString('fr-FR')} €</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-100">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">TMI (Tranche marginale)</p>
                  <p className="text-lg font-bold text-purple-600">{(calculIRDisplay?.TMI || 0).toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-1">Taux moyen</p>
                  <p className="text-lg font-bold text-indigo-600">{(calculIRDisplay?.tauxMoyen || calculIRDisplay?.tauxMoyenImposition || 0).toFixed(2)}%</p>
                </div>
              </div>
            </div>

            {/* Prélèvements Sociaux - TOUJOURS AFFICHÉ */}
            {calculPSDisplay && (
              <div className="bg-white rounded-lg border-2 border-green-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Euro className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Prélèvements Sociaux</h4>
                      <p className="text-xs text-gray-600">CSG + CRDS + PS (17,2%)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-green-600">{(calculPSDisplay?.prelevementsSociauxTotal || 0).toLocaleString('fr-FR')} €</p>
                    <p className="text-xs text-gray-600 mt-1">
                      soit {((calculPSDisplay?.prelevementsSociauxTotal || 0) / 12).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} € /mois
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 pt-3 border-t border-green-100">
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Revenus fonciers</p>
                    <p className="text-sm font-bold text-gray-900">{(calculPSDisplay?.detailsRevenusFonciers?.montant || 0).toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Revenus capitaux</p>
                    <p className="text-sm font-bold text-gray-900">{(calculPSDisplay?.detailsRevenusCapitaux?.montant || 0).toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Plus-values</p>
                    <p className="text-sm font-bold text-gray-900">{(calculPSDisplay?.detailsPlusValuesMobilieres?.montant || 0).toLocaleString('fr-FR')} €</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600 mb-1">Taux global</p>
                    <p className="text-sm font-bold text-green-600">17,2%</p>
                  </div>
                </div>
              </div>
            )}

            {/* IFI */}
            {calculIFIDisplay && calculIFIDisplay.ifiFinal > 0 && (
              <div className="bg-white rounded-lg border-2 border-amber-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <PieChart className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">IFI</h4>
                      <p className="text-xs text-gray-600">Impôt sur la Fortune Immobilière</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-amber-600">{(calculIFIDisplay?.ifiFinal || 0).toLocaleString('fr-FR')} €</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Section Revenus */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-white" />
            <h3 className="text-xl font-bold text-white">Revenus du foyer</h3>
          </div>
          {isEditing && (
            <button
              onClick={() => setShowAddRevenu(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter un revenu
            </button>
          )}
        </div>

        <div className="p-6">
          {revenus.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aucun revenu enregistré</p>
              <p className="text-sm text-gray-500">Ajoutez les différentes sources de revenus du foyer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenus.map((revenu) => (
                <div key={revenu.id} className="border-2 rounded-lg p-4 bg-gray-50 transition-all hover:shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold">
                          {categorieLabels[revenu.categorie]}
                        </span>
                        <span className={`px-3 py-1 ${beneficiaireColors[revenu.beneficiaire]} text-white rounded-full text-xs font-semibold`}>
                          {revenu.beneficiaireNom}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-600">Annuel: </span>
                          <span className="font-bold">{revenu.montantAnnuel.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Mensuel: </span>
                          <span className="font-semibold">{revenu.montantMensuel.toLocaleString('fr-FR')} €</span>
                        </div>
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteRevenu(revenu.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Ajout Revenu */}
      {showAddRevenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-900">Ajouter un revenu</h4>
              <button onClick={() => setShowAddRevenu(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bénéficiaire *</label>
                <select
                  value={newRevenu.beneficiaire}
                  onChange={(e) => setNewRevenu({ ...newRevenu, beneficiaire: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {beneficiairesDisponibles.map((ben) => (
                    <option key={ben.value} value={ben.value}>{ben.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
                <select
                  value={newRevenu.categorie}
                  onChange={(e) => setNewRevenu({ ...newRevenu, categorie: e.target.value as any })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(categorieLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Montant annuel (net imposable €) *</label>
                <input
                  type="number"
                  value={newRevenu.montantAnnuel || ''}
                  onChange={(e) => setNewRevenu({ ...newRevenu, montantAnnuel: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowAddRevenu(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleAddRevenu} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Imposition */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 flex items-center gap-3">
          <Calculator className="w-6 h-6 text-white" />
          <h3 className="text-xl font-bold text-white">Imposition du foyer</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <PieChart className="w-6 h-6 text-purple-600" />
              <div className="flex-1">
                <p className="font-semibold text-purple-900">Nombre de parts fiscales</p>
                <p className="text-sm text-purple-700 mt-1">
                  ✅ Calculé automatiquement depuis la situation familiale
                  {familyInfo && (
                    <> ({familyInfo.maritalStatus}, {familyInfo.children?.filter((e: any) => e.isChargeFiscale || e.aChargeFiscalement).length || 0} enfant(s) à charge)</>
                  )}
                </p>
                {Math.abs(imposition.nombreParts - nombrePartsCalcule) > 0.01 && (
                  <p className="text-xs text-orange-600 mt-1 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                    ⚠️ Synchronisation en cours... (actuel: {imposition.nombreParts} → cible: {nombrePartsCalcule})
                  </p>
                )}
              </div>
              <div className="text-4xl font-bold text-purple-900">{nombrePartsCalcule}</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Catégories de revenus imposables
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Catégorie 1 - Traitements, salaires, pensions */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-blue-900">1. Traitements, salaires, pensions (€)</label>
                  {imposition.traitementsSalairesPensionsModifieeManuellement && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Modifié manuellement
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={imposition.traitementsSalairesPensions || ''}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    setImposition({ 
                      ...imposition, 
                      traitementsSalairesPensions: newValue,
                      traitementsSalairesPensionsModifieeManuellement: true
                    });
                  }}
                  disabled={!isEditing}
                  className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-50 disabled:cursor-not-allowed text-blue-900 font-semibold text-lg"
                />
                {!imposition.traitementsSalairesPensionsModifieeManuellement && (
                  <p className="text-xs text-blue-700 mt-1">Calculé automatiquement depuis les revenus</p>
                )}
                {imposition.traitementsSalairesPensionsModifieeManuellement && isEditing && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-blue-900 mb-1">Justification de la modification *</label>
                    <textarea
                      value={imposition.justificationTraitementsSalairesPensions || ''}
                      onChange={(e) => setImposition({ ...imposition, justificationTraitementsSalairesPensions: e.target.value })}
                      placeholder="Expliquez pourquoi vous modifiez ce montant..."
                      rows={2}
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                {imposition.traitementsSalairesPensionsModifieeManuellement && !isEditing && imposition.justificationTraitementsSalairesPensions && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                    <strong>Justification :</strong> {imposition.justificationTraitementsSalairesPensions}
                  </div>
                )}
                {imposition.traitementsSalairesPensionsModifieeManuellement && isEditing && (
                  <button
                    onClick={() => {
                      const valeursAuto = calculerValeursAutomatiques();
                      setImposition({ 
                        ...imposition, 
                        traitementsSalairesPensions: valeursAuto.traitements,
                        traitementsSalairesPensionsModifieeManuellement: false,
                        justificationTraitementsSalairesPensions: ''
                      });
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Revenir au calcul automatique
                  </button>
                )}
              </div>

              {/* Catégorie 2 - Revenus TNS */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-orange-900">2. Revenus des TNS (BIC,BNC,BA) (€)</label>
                  {imposition.revenusTNSModifieeManuellement && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Modifié manuellement
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={imposition.revenusTNS || ''}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    setImposition({ 
                      ...imposition, 
                      revenusTNS: newValue,
                      revenusTNSModifieeManuellement: true
                    });
                  }}
                  disabled={!isEditing}
                  className="w-full border-2 border-orange-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-orange-50 disabled:cursor-not-allowed text-orange-900 font-semibold text-lg"
                />
                {!imposition.revenusTNSModifieeManuellement && (
                  <p className="text-xs text-orange-700 mt-1">Calculé automatiquement depuis les revenus</p>
                )}
                {imposition.revenusTNSModifieeManuellement && isEditing && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-orange-900 mb-1">Justification de la modification *</label>
                    <textarea
                      value={imposition.justificationRevenusTNS || ''}
                      onChange={(e) => setImposition({ ...imposition, justificationRevenusTNS: e.target.value })}
                      placeholder="Expliquez pourquoi vous modifiez ce montant..."
                      rows={2}
                      className="w-full border border-orange-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}
                {imposition.revenusTNSModifieeManuellement && !isEditing && imposition.justificationRevenusTNS && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                    <strong>Justification :</strong> {imposition.justificationRevenusTNS}
                  </div>
                )}
                {imposition.revenusTNSModifieeManuellement && isEditing && (
                  <button
                    onClick={() => {
                      const valeursAuto = calculerValeursAutomatiques();
                      setImposition({ 
                        ...imposition, 
                        revenusTNS: valeursAuto.tns,
                        revenusTNSModifieeManuellement: false,
                        justificationRevenusTNS: ''
                      });
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-orange-700 hover:text-orange-900"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Revenir au calcul automatique
                  </button>
                )}
              </div>

              {/* Catégorie 3 - Locations meublées */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-yellow-900">3. Locations meublées non pro (€)</label>
                  {imposition.locationsMeublesModifieeManuellement && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Modifié manuellement
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={imposition.locationsMeublesNonPro || ''}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    setImposition({ 
                      ...imposition, 
                      locationsMeublesNonPro: newValue,
                      locationsMeublesModifieeManuellement: true
                    });
                  }}
                  disabled={!isEditing}
                  className="w-full border-2 border-yellow-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-yellow-50 disabled:cursor-not-allowed text-yellow-900 font-semibold text-lg mb-2"
                />
                <select
                  value={imposition.locationsMeublesRegime || 'micro'}
                  onChange={(e) => setImposition({ ...imposition, locationsMeublesRegime: e.target.value as 'micro' | 'reel' })}
                  disabled={!isEditing}
                  className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-yellow-50"
                >
                  <option value="micro">Régime micro</option>
                  <option value="reel">Régime réel</option>
                </select>
                {!imposition.locationsMeublesModifieeManuellement && (
                  <p className="text-xs text-yellow-700 mt-1">Calculé automatiquement depuis le patrimoine</p>
                )}
                {imposition.locationsMeublesModifieeManuellement && isEditing && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-yellow-900 mb-1">Justification de la modification *</label>
                    <textarea
                      value={imposition.justificationLocationsMeubles || ''}
                      onChange={(e) => setImposition({ ...imposition, justificationLocationsMeubles: e.target.value })}
                      placeholder="Expliquez pourquoi vous modifiez ce montant..."
                      rows={2}
                      className="w-full border border-yellow-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                )}
                {imposition.locationsMeublesModifieeManuellement && !isEditing && imposition.justificationLocationsMeubles && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                    <strong>Justification :</strong> {imposition.justificationLocationsMeubles}
                  </div>
                )}
                {imposition.locationsMeublesModifieeManuellement && isEditing && (
                  <button
                    onClick={() => {
                      const valeursAuto = calculerValeursAutomatiques();
                      setImposition({ 
                        ...imposition, 
                        locationsMeublesNonPro: valeursAuto.locationsMeubles,
                        locationsMeublesModifieeManuellement: false,
                        justificationLocationsMeubles: ''
                      });
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-yellow-700 hover:text-yellow-900"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Revenir au calcul automatique
                  </button>
                )}
              </div>

              {/* Catégorie 4 */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-indigo-900 mb-2">4. Revenus valeurs & capitaux mobiliers (€)</label>
                <input
                  type="number"
                  value={imposition.revenusValeursMobilieres || ''}
                  onChange={(e) => setImposition({ ...imposition, revenusValeursMobilieres: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className="w-full border-2 border-indigo-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-50 disabled:text-indigo-900 font-semibold text-lg"
                />
              </div>

              {/* Catégorie 5 */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                <label className="block text-sm font-semibold text-green-900 mb-2">5. Plus-value mobilière (€)</label>
                <input
                  type="number"
                  value={imposition.plusValueMobiliere || ''}
                  onChange={(e) => setImposition({ ...imposition, plusValueMobiliere: parseFloat(e.target.value) || 0 })}
                  disabled={!isEditing}
                  className="w-full border-2 border-green-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-green-50 disabled:text-green-900 font-semibold text-lg"
                />
              </div>

              {/* Catégorie 6 - Revenus fonciers */}
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-teal-900">6. Revenus fonciers imposables (€)</label>
                  {imposition.revenusFonciersModifies && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Modifié manuellement
                    </span>
                  )}
                </div>
                
                {/* Sélecteur de régime */}
                <select
                  value={imposition.revenusFonciersRegime || 'micro'}
                  onChange={(e) => setImposition({ ...imposition, revenusFonciersRegime: e.target.value as 'micro' | 'reel' })}
                  disabled={!isEditing}
                  className="w-full border-2 border-teal-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-teal-50 mb-2 font-medium"
                >
                  <option value="micro">📊 Régime micro-foncier (abattement 30%, max 15 000€)</option>
                  <option value="reel">📝 Régime réel (déduction charges réelles)</option>
                </select>

                <div className="bg-teal-100 border border-teal-300 rounded-lg p-2 mb-2 text-xs text-teal-900">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      {imposition.revenusFonciersRegime === 'micro' ? (
                        <p>
                          <strong>Micro-foncier :</strong> Saisissez le revenu imposable (loyers bruts × 70%). 
                          L'abattement de 30% est déjà appliqué. Plafonné à 15 000€ de loyers bruts.
                        </p>
                      ) : (
                        <p>
                          <strong>Régime réel :</strong> Saisissez le revenu imposable (loyers bruts - charges déductibles réelles).
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <input
                  type="number"
                  value={imposition.revenusFonciers || ''}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value) || 0;
                    setImposition({ 
                      ...imposition, 
                      revenusFonciers: newValue,
                      revenusFonciersModifies: true
                    });
                  }}
                  disabled={!isEditing}
                  placeholder={imposition.revenusFonciersRegime === 'micro' ? 'Ex: 7000 (pour 10000€ de loyers bruts)' : 'Ex: 6000 (loyers - charges)'}
                  className="w-full border-2 border-teal-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-teal-50 disabled:cursor-not-allowed text-teal-900 font-semibold text-lg"
                />
                
                {!imposition.revenusFonciersModifies && totalLoyersNus && totalLoyersNus > 0 && (
                  <div>
                    <p className="text-xs text-teal-700 mt-2 bg-teal-50 border border-teal-200 rounded px-2 py-1">
                      ✅ Calculé automatiquement : {totalLoyersNus.toLocaleString('fr-FR')} € de loyers bruts
                      {imposition.revenusFonciersRegime === 'micro' && (
                        <> × 70% (micro-foncier) = <strong>{calculerRevenuFoncier(totalLoyersNus, 'micro').toLocaleString('fr-FR')} €</strong></>
                      )}
                    </p>
                    {Math.abs(imposition.revenusFonciers - calculerRevenuFoncier(totalLoyersNus || 0, imposition.revenusFonciersRegime || 'micro')) > 1 && (
                      <p className="text-xs text-orange-600 mt-1 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                        ⚠️ Synchronisation en cours... (actuel: {imposition.revenusFonciers.toLocaleString('fr-FR')} € → cible: {calculerRevenuFoncier(totalLoyersNus || 0, imposition.revenusFonciersRegime || 'micro').toLocaleString('fr-FR')} €)
                      </p>
                    )}
                  </div>
                )}
                {!imposition.revenusFonciersModifies && (!totalLoyersNus || totalLoyersNus === 0) && (
                  <p className="text-xs text-gray-500 mt-1">Aucun bien locatif nu détecté dans le patrimoine</p>
                )}
                
                {/* Avertissement si dépassement plafond micro-foncier */}
                {imposition.revenusFonciersRegime === 'micro' && totalLoyersNus && totalLoyersNus > 15000 && (
                  <div className="mt-2 p-3 bg-orange-50 border-l-4 border-orange-400 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-orange-900">
                        <p className="font-semibold">⚠️ Attention : Plafond micro-foncier dépassé</p>
                        <p className="mt-1">
                          Vos loyers bruts ({totalLoyersNus.toLocaleString('fr-FR')} €) dépassent le plafond de 15 000 €. 
                          Vous devez obligatoirement passer au régime réel.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {imposition.revenusFonciersModifies && isEditing && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-teal-900 mb-1">Justification de la modification *</label>
                    <textarea
                      value={imposition.justificationRevenusFonciers || ''}
                      onChange={(e) => setImposition({ ...imposition, justificationRevenusFonciers: e.target.value })}
                      placeholder="Expliquez pourquoi vous modifiez ce montant..."
                      rows={2}
                      className="w-full border border-teal-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                )}
                {imposition.revenusFonciersModifies && !isEditing && imposition.justificationRevenusFonciers && (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-900">
                    <strong>Justification :</strong> {imposition.justificationRevenusFonciers}
                  </div>
                )}
                {imposition.revenusFonciersModifies && isEditing && (
                  <button
                    onClick={() => {
                      const valeursAuto = calculerValeursAutomatiques();
                      setImposition({ 
                        ...imposition, 
                        revenusFonciers: valeursAuto.revenusFonciers,
                        revenusFonciersModifies: false,
                        justificationRevenusFonciers: ''
                      });
                    }}
                    className="mt-2 flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Revenir au calcul automatique
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">Revenu fiscal de référence (calculé)</p>
                <p className="text-xs text-blue-700">Somme de toutes les catégories ci-dessus</p>
              </div>
              <p className="text-3xl font-bold text-blue-900">{revenuFiscalTotal.toLocaleString('fr-FR')} €</p>
            </div>
          </div>

          {afficherIFI && (
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                  <Euro className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">IFI - Impôt sur la Fortune Immobilière</p>
                  <p className="text-xs text-amber-700">Patrimoine immobilier net : {patrimoineImmobilierNet?.toLocaleString('fr-FR')} € (seuil IFI dépassé)</p>
                </div>
              </div>
              <input
                type="number"
                value={imposition.IFI || ''}
                onChange={(e) => setImposition({ ...imposition, IFI: parseFloat(e.target.value) || 0 })}
                disabled={!isEditing}
                className="w-full border-2 border-amber-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-amber-50 disabled:text-amber-900 font-bold text-lg"
              />
            </div>
          )}
          
          {!afficherIFI && patrimoineImmobilierNet !== undefined && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Euro className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Pas d'IFI applicable</p>
                <p className="text-xs text-green-700">Patrimoine immobilier net : {patrimoineImmobilierNet?.toLocaleString('fr-FR')} € (sous le seuil de 1 300 000 €)</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails */}
      <FiscalDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        calculIR={calculIRDisplay}
        calculPS={calculPSDisplay}
        calculIFI={calculIFIDisplay}
      />

      {isEditing && (
        <div className="flex justify-end gap-3">
          <button
            onClick={onToggleEdit}
            className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            <X className="w-5 h-5" />
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg"
          >
            <Save className="w-5 h-5" />
            Enregistrer les modifications
          </button>
        </div>
      )}
    </div>
  );
}
