import { useState, useEffect } from 'react';
import { 
  Database, Play, CheckCircle2, XCircle, Plus, Trash2, 
  ExternalLink, Clock, AlertCircle, Calendar, Filter, Search
} from 'lucide-react';
import { toast } from 'sonner';

// Types
interface Source {
  id: string;
  name: string;
  url: string;
  type: 'official' | 'custom';
}

interface CollecteHistory {
  id: string;
  date: string;
  status: 'success' | 'error';
  sourcesCount: number;
  itemsCollected: number;
  duration: string;
  errorMessage?: string;
}

interface ChunkJuridique {
  id: string;
  texte: string;
  sujet: string;
  source: string;
  reference: string;
  date: string;
}

interface RegleFiscale {
  id: string;
  titre?: string;
  regle?: string;
  condition?: string;
  consequence?: string;
  description?: string;
  categorie?: string;
  domaine?: string;
  source: string;
  reference?: string;
  date_extraction?: string;
  dateUpdate?: string;
  date_mise_a_jour?: string;
  statut?: 'validé' | 'en attente' | 'obsolète';
}

interface MontagePatrimonial {
  id: string;
  nom?: string;
  montage?: string;
  nom_montage?: string;  // Champ utilisé par les montages statiques
  description?: string;
  objectif: string;
  conditions?: string;
  categorie?: string;
  complexite?: string;
  fiscalite?: string;
  economie_estimee?: string;
  score_confiance?: number;
  date_generation?: string;
}

interface UpdateLog {
  id: string;
  date: string;
  type: 'regle' | 'montage' | 'source';
  action: 'ajout' | 'modification' | 'suppression';
  description: string;
}

interface RegleSociale {
  id: string;
  domaine: string;
  regle: string;
  condition: string;
  base_calcul: string;
  taux: string;
  plafond: string;
  consequence: string;
  source: string;
  reference: string;
  date_mise_a_jour: string;
  statut_validation: 'validé' | 'en_attente' | 'à_vérifier';
}

interface RegleRetraite {
  id: string;
  regime: 'CNAV' | 'AGIRC-ARRCO' | 'Régime général' | 'Complémentaire';
  regle: string;
  condition: string;
  formule: string;
  taux: string;
  plafond: string;
  age_legal: string;
  trimestres_requis: string;
  consequence: string;
  source: string;
  reference: string;
  date_mise_a_jour: string;
  statut_validation: 'validé' | 'en_attente' | 'à_vérifier';
}

// Sources officielles par défaut
const DEFAULT_SOURCES: Source[] = [
  { id: '1', name: 'BOFiP', url: 'https://bofip.impots.gouv.fr', type: 'official' },
  { id: '2', name: 'Légifrance', url: 'https://www.legifrance.gouv.fr', type: 'official' },
  { id: '3', name: 'AMF', url: 'https://www.amf-france.org', type: 'official' },
];

export function SourcesCollecteTab() {
  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isCollecting, setIsCollecting] = useState(false);
  const [lastCollecte, setLastCollecte] = useState<CollecteHistory | null>(null);
  const [collecteHistory, setCollecteHistory] = useState<CollecteHistory[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  
  // Vraies données collectées depuis le backend
  const [reglesFiscales, setReglesFiscales] = useState<RegleFiscale[]>([]);
  const [montagesPatrimoniaux, setMontagesPatrimoniaux] = useState<MontagePatrimonial[]>([]);
  const [updateLogs, setUpdateLogs] = useState<UpdateLog[]>([]);
  const [isLoadingRegles, setIsLoadingRegles] = useState(true);
  const [isLoadingMontages, setIsLoadingMontages] = useState(true);

  // États pour filtres et pagination des règles fiscales
  const [filtretitre, setFiltreTitre] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreDescription, setFiltreDescription] = useState('');
  const [filtreSource, setFiltreSource] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [reglesAffichees, setReglesAffichees] = useState(10); // Nombre de règles à afficher

  // États pour filtres et pagination des montages patrimoniaux
  const [filtreMontageNom, setFiltreMontageNom] = useState('');
  const [filtreMontageCategorie, setFiltreMontageCategorie] = useState('');
  const [filtreMontageObjectif, setFiltreMontageObjectif] = useState('');
  const [filtreMontageComplexite, setFiltreMontageComplexite] = useState('');
  const [filtreMontageEconomie, setFiltreMontageEconomie] = useState('');
  const [montagesAffiches, setMontagesAffiches] = useState(10); // Nombre de montages à afficher

  // États pour règles sociales
  const [reglesSociales, setReglesSociales] = useState<RegleSociale[]>([]);
  const [isLoadingReglesSociales, setIsLoadingReglesSociales] = useState(true);
  const [isCollectingSocial, setIsCollectingSocial] = useState(false);
  
  // États pour filtres et pagination des règles sociales
  const [filtreSocialRegle, setFiltreSocialRegle] = useState('');
  const [filtreSocialDomaine, setFiltreSocialDomaine] = useState('');
  const [filtreSocialTaux, setFiltreSocialTaux] = useState('');
  const [filtreSocialPlafond, setFiltreSocialPlafond] = useState('');
  const [filtreSocialSource, setFiltreSocialSource] = useState('');
  const [reglesSocialesAffichees, setReglesSocialesAffichees] = useState(10);

  // États pour règles retraite
  const [reglesRetraite, setReglesRetraite] = useState<RegleRetraite[]>([]);
  const [isLoadingReglesRetraite, setIsLoadingReglesRetraite] = useState(true);
  const [isCollectingRetraite, setIsCollectingRetraite] = useState(false);
  
  // États pour filtres et pagination des règles retraite
  const [filtreRetraiteRegle, setFiltreRetraiteRegle] = useState('');
  const [filtreRetraiteRegime, setFiltreRetraiteRegime] = useState('');
  const [filtreRetraiteAge, setFiltreRetraiteAge] = useState('');
  const [filtreRetraiteTrimestres, setFiltreRetraiteTrimestres] = useState('');
  const [filtreRetraiteSource, setFiltreRetraiteSource] = useState('');
  const [reglesRetraiteAffichees, setReglesRetraiteAffichees] = useState(10);

  // États pour le simulateur patrimonial
  const [montageSelectionne, setMontageSelectionne] = useState<string>('');
  const [capitalInitial, setCapitalInitial] = useState<number>(100000);
  const [apportAnnuel, setApportAnnuel] = useState<number>(0);
  const [tauxRendement, setTauxRendement] = useState<number>(5);
  const [dureeAnnees, setDureeAnnees] = useState<number>(10);
  const [trancheMarginalIR, setTrancheMarginalIR] = useState<number>(30);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  // Charger les stats et données au démarrage
  useEffect(() => {
    loadStats();
    loadReglesCollectees();
    loadMontagesCollectes();
    loadReglesSociales();
    loadReglesRetraite();
  }, []);

  // Charger les règles fiscales collectées
  const loadReglesCollectees = async () => {
    setIsLoadingRegles(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/regles/toutes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        // ⚠️ DEBUGGING DÉTAILLÉ
        console.log('=== 🔍 ANALYSE COMPLÈTE DES RÈGLES ===');
        console.log('Total de règles reçues:', data.regles?.length);
        console.log('Nombre de règles statiques:', data.statiques);
        console.log('Nombre de règles collectées:', data.collectees);
        
        if (data.regles && data.regles.length > 0) {
          console.log('\n--- Première règle (RAW) ---');
          console.log(JSON.stringify(data.regles[0], null, 2));
          
          console.log('\n--- Analyse des champs disponibles ---');
          const firstRule = data.regles[0];
          console.log('Champs présents:', Object.keys(firstRule));
          console.log('id:', firstRule.id);
          console.log('titre:', firstRule.titre);
          console.log('regle:', firstRule.regle);
          console.log('domaine:', firstRule.domaine);
          console.log('categorie:', firstRule.categorie);
          console.log('condition:', firstRule.condition);
          console.log('consequence:', firstRule.consequence);
          console.log('description:', firstRule.description);
          console.log('source:', firstRule.source);
          console.log('reference:', firstRule.reference);
          console.log('date_extraction:', firstRule.date_extraction);
          console.log('date_mise_a_jour:', firstRule.date_mise_a_jour);
          
          console.log('\n--- Test du mapping ---');
          console.log('Titre affiché:', firstRule.titre || firstRule.regle || 'Sans titre');
          console.log('Catégorie affichée:', firstRule.categorie || firstRule.domaine || 'Général');
          console.log('Description affichée:', firstRule.description || firstRule.consequence || firstRule.condition || '-');
          console.log('Source affichée:', firstRule.source || firstRule.reference || '-');
        }
        console.log('=== FIN ANALYSE ===\n');
        
        if (data.success && data.regles) {
          setReglesFiscales(data.regles);
        }
      }
    } catch (error) {
      console.error('Erreur chargement règles:', error);
    } finally {
      setIsLoadingRegles(false);
    }
  };

  // Charger les montages patrimoniaux collectés
  const loadMontagesCollectes = async () => {
    setIsLoadingMontages(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/montages/tous`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🏗️ TOUS les montages (statiques + collectés):', data);
        
        if (data.success && data.montages) {
          setMontagesPatrimoniaux(data.montages);
        }
      }
    } catch (error) {
      console.error('Erreur chargement montages:', error);
    } finally {
      setIsLoadingMontages(false);
    }
  };

  // Charger les stats de collecte
  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/collecte-juridique/stats`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats collecte:', data);
        
        if (data.stats && data.stats.last_collecte) {
          const lastCol = data.stats.last_collecte;
          setLastCollecte({
            id: `collecte_${lastCol.date}`,
            date: lastCol.date,
            status: lastCol.errors && lastCol.errors.length > 0 ? 'error' : 'success',
            sourcesCount: 2, // BOFiP + Legifrance
            itemsCollected: lastCol.total || 0,
            duration: '12s',
            errorMessage: lastCol.errors && lastCol.errors.length > 0 ? lastCol.errors.join(', ') : undefined
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Ajouter une source
  const handleAddSource = () => {
    if (!newSourceName || !newSourceUrl) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    const newSource: Source = {
      id: `custom_${Date.now()}`,
      name: newSourceName,
      url: newSourceUrl,
      type: 'custom'
    };

    setSources([...sources, newSource]);
    setNewSourceName('');
    setNewSourceUrl('');
    toast.success(`Source "${newSourceName}" ajoutée`);

    // Ajouter au journal
    const log: UpdateLog = {
      id: `log_${Date.now()}`,
      date: new Date().toLocaleString('fr-FR'),
      type: 'source',
      action: 'ajout',
      description: `Nouvelle source: ${newSourceName}`
    };
    setUpdateLogs([log, ...updateLogs]);
  };

  // Supprimer une source
  const handleDeleteSource = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    if (source.type === 'official') {
      toast.error('Impossible de supprimer une source officielle');
      return;
    }

    if (!confirm(`Supprimer la source "${source.name}" ?`)) {
      return;
    }

    setSources(sources.filter(s => s.id !== sourceId));
    toast.success('Source supprimée');

    // Ajouter au journal
    const log: UpdateLog = {
      id: `log_${Date.now()}`,
      date: new Date().toLocaleString('fr-FR'),
      type: 'source',
      action: 'suppression',
      description: `Source supprimée: ${source.name}`
    };
    setUpdateLogs([log, ...updateLogs]);
  };

  // Lancer la collecte
  const handleLaunchCollecte = async () => {
    setIsCollecting(true);
    toast.info('Collecte des données en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/collecte-juridique/run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la collecte');
      }

      const result = await response.json();
      console.log('✅ Résultat collecte:', result);

      const newCollecte: CollecteHistory = {
        id: `collecte_${Date.now()}`,
        date: new Date().toISOString(),
        status: result.success && result.errors.length === 0 ? 'success' : 'error',
        sourcesCount: 2, // BOFiP + Legifrance
        itemsCollected: result.total || 0,
        duration: result.duration || '0s',
        errorMessage: result.errors.length > 0 ? result.errors.join(', ') : undefined
      };

      setLastCollecte(newCollecte);
      setCollecteHistory([newCollecte, ...collecteHistory]);
      
      if (result.success) {
        toast.success(`Collecte terminée : ${result.total} documents récupérés (BOFiP: ${result.bofip_count}, Legifrance: ${result.legifrance_count})`);
      } else {
        toast.error('Collecte terminée avec des erreurs');
      }

      // Ajouter au journal
      const log: UpdateLog = {
        id: `log_${Date.now()}`,
        date: new Date().toLocaleString('fr-FR'),
        type: 'regle',
        action: 'ajout',
        description: `Collecte automatique : ${result.total} documents collectés`
      };
      setUpdateLogs([log, ...updateLogs]);

      // Recharger les stats et les données
      await loadStats();
      await loadReglesCollectees();
      
      // Attendre 5 secondes puis recharger les montages (ils sont générés en arrière-plan)
      setTimeout(() => {
        loadMontagesCollectes();
        toast.info('Vérification des montages générés...', { duration: 2000 });
      }, 5000);

    } catch (error) {
      console.error('Erreur collecte:', error);
      toast.error('Erreur lors de la collecte : ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      const newCollecte: CollecteHistory = {
        id: `collecte_${Date.now()}`,
        date: new Date().toISOString(),
        status: 'error',
        sourcesCount: 2,
        itemsCollected: 0,
        duration: '0s',
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      setLastCollecte(newCollecte);
    } finally {
      setIsCollecting(false);
    }
  };

  // Initialiser les 110 règles fiscales statiques
  const handleInitialiserRegles = async () => {
    const confirmed = confirm('Initialiser les 110 règles fiscales statiques dans la base de données ?');
    if (!confirmed) return;

    toast.info('Initialisation en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/regles/initialiser`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();
      console.log('📋 Résultat brut de l\'API:', result);

      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        console.error('❌ Détails erreur:', result.error);
        console.error('❌ Stack trace:', result.details);
        throw new Error(result.error || 'Erreur lors de l\'initialisation');
      }

      console.log('✅ Résultat initialisation:', result);

      toast.success(`${result.count} règles fiscales initialisées avec succès !`);
      
      // Recharger les règles
      await loadReglesCollectees();

    } catch (error) {
      console.error('❌ Erreur initialisation complète:', error);
      toast.error('Erreur lors de l\'initialisation : ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const getStatutColor = (statut: RegleFiscale['statut']) => {
    switch (statut) {
      case 'validé':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'en attente':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'obsolète':
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Filtrer les règles fiscales
  const reglesFiltrees = reglesFiscales.filter((regle) => {
    const titre = (regle.titre || regle.regle || '').toLowerCase();
    const categorie = (regle.categorie || regle.domaine || '').toLowerCase();
    const description = (regle.description || regle.consequence || regle.condition || '').toLowerCase();
    const source = (regle.source || regle.reference || '').toLowerCase();
    const date = regle.date_extraction || regle.dateUpdate || regle.date_mise_a_jour || '';

    return (
      titre.includes(filtretitre.toLowerCase()) &&
      categorie.includes(filtreCategorie.toLowerCase()) &&
      description.includes(filtreDescription.toLowerCase()) &&
      source.includes(filtreSource.toLowerCase()) &&
      date.includes(filtreDate)
    );
  });

  // Règles à afficher avec pagination
  const reglesAfficher = reglesFiltrees.slice(0, reglesAffichees);

  // Fonction pour charger plus de règles
  const chargerPlusDeRegles = () => {
    setReglesAffichees(prev => prev + 10);
  };

  // Filtrer les montages patrimoniaux
  const montagesFiltres = montagesPatrimoniaux.filter((montage) => {
    const nom = (montage.nom || montage.montage || montage.nom_montage || '').toLowerCase();
    const categorie = (montage.categorie || '').toLowerCase();
    const objectif = (montage.objectif || '').toLowerCase();
    const complexite = (montage.complexite || '').toLowerCase();
    const economie = (montage.economie_estimee || montage.fiscalite || '').toLowerCase();

    return (
      nom.includes(filtreMontageNom.toLowerCase()) &&
      categorie.includes(filtreMontageCategorie.toLowerCase()) &&
      objectif.includes(filtreMontageObjectif.toLowerCase()) &&
      complexite.includes(filtreMontageComplexite.toLowerCase()) &&
      economie.includes(filtreMontageEconomie.toLowerCase())
    );
  });

  // Montages à afficher avec pagination
  const montagesAfficher = montagesFiltres.slice(0, montagesAffiches);

  // Fonction pour charger plus de montages
  const chargerPlusDeMontages = () => {
    setMontagesAffiches(prev => prev + 10);
  };

  // Charger les règles sociales
  const loadReglesSociales = async () => {
    setIsLoadingReglesSociales(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/extracteur-regles-sociales/regles`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Règles sociales:', data);
        
        if (data.success && data.regles) {
          setReglesSociales(data.regles);
        }
      }
    } catch (error) {
      console.error('Erreur chargement règles sociales:', error);
    } finally {
      setIsLoadingReglesSociales(false);
    }
  };

  // Lancer la collecte des règles sociales
  const handleLaunchCollecteSocial = async () => {
    setIsCollectingSocial(true);
    toast.info('Collecte des règles sociales en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/collecteur-social/run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la collecte');
      }

      const result = await response.json();
      console.log('✅ Résultat collecte:', result);

      const newCollecte: CollecteHistory = {
        id: `collecte_${Date.now()}`,
        date: new Date().toISOString(),
        status: result.success && result.errors.length === 0 ? 'success' : 'error',
        sourcesCount: 2, // BOFiP + Legifrance
        itemsCollected: result.total || 0,
        duration: result.duration || '0s',
        errorMessage: result.errors.length > 0 ? result.errors.join(', ') : undefined
      };

      setLastCollecte(newCollecte);
      setCollecteHistory([newCollecte, ...collecteHistory]);
      
      if (result.success) {
        toast.success(`Collecte terminée : ${result.total} documents récupérés (BOFiP: ${result.bofip_count}, Legifrance: ${result.legifrance_count})`);
      } else {
        toast.error('Collecte terminée avec des erreurs');
      }

      // Ajouter au journal
      const log: UpdateLog = {
        id: `log_${Date.now()}`,
        date: new Date().toLocaleString('fr-FR'),
        type: 'regle',
        action: 'ajout',
        description: `Collecte automatique : ${result.total} documents collectés`
      };
      setUpdateLogs([log, ...updateLogs]);

      // Recharger les stats et les données
      await loadStats();
      await loadReglesCollectees();
      
      // Attendre 5 secondes puis recharger les montages (ils sont générés en arrière-plan)
      setTimeout(() => {
        loadMontagesCollectes();
        toast.info('Vérification des montages générés...', { duration: 2000 });
      }, 5000);

    } catch (error) {
      console.error('Erreur collecte:', error);
      toast.error('Erreur lors de la collecte : ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      const newCollecte: CollecteHistory = {
        id: `collecte_${Date.now()}`,
        date: new Date().toISOString(),
        status: 'error',
        sourcesCount: 2,
        itemsCollected: 0,
        duration: '0s',
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      };
      setLastCollecte(newCollecte);
    } finally {
      setIsCollectingSocial(false);
    }
  };

  // Filtrer les règles sociales
  const reglesSocialesFiltrees = reglesSociales.filter((regle) => {
    const regleText = regle.regle.toLowerCase();
    const domaine = regle.domaine.toLowerCase();
    const taux = regle.taux.toLowerCase();
    const plafond = regle.plafond.toLowerCase();
    const source = regle.source.toLowerCase();

    return (
      regleText.includes(filtreSocialRegle.toLowerCase()) &&
      domaine.includes(filtreSocialDomaine.toLowerCase()) &&
      taux.includes(filtreSocialTaux.toLowerCase()) &&
      plafond.includes(filtreSocialPlafond.toLowerCase()) &&
      source.includes(filtreSocialSource.toLowerCase())
    );
  });

  // Règles sociales à afficher avec pagination
  const reglesSocialesAfficher = reglesSocialesFiltrees.slice(0, reglesSocialesAffichees);

  // Fonction pour charger plus de règles sociales
  const chargerPlusDeReglesSociales = () => {
    setReglesSocialesAffichees(prev => prev + 10);
  };

  // Initialiser les règles sociales statiques
  const handleInitialiserReglesSociales = async () => {
    const confirmed = confirm('Initialiser les 15 règles sociales statiques dans la base de données ?');
    if (!confirmed) return;

    toast.info('Initialisation en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/extracteur-regles-sociales/initialiser`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'initialisation');
      }

      toast.success(`${result.count} règles sociales initialisées avec succès !`);
      
      // Recharger les règles
      await loadReglesSociales();

    } catch (error) {
      console.error('❌ Erreur initialisation règles sociales:', error);
      toast.error('Erreur lors de l\'initialisation : ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Charger les règles retraite
  const loadReglesRetraite = async () => {
    setIsLoadingReglesRetraite(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/extracteur-regles-retraite/regles`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('🏛️ Règles retraite:', data);
        
        if (data.success && data.regles) {
          setReglesRetraite(data.regles);
        }
      }
    } catch (error) {
      console.error('Erreur chargement règles retraite:', error);
    } finally {
      setIsLoadingReglesRetraite(false);
    }
  };

  // Lancer la collecte des règles retraite
  const handleLaunchCollecteRetraite = async () => {
    setIsCollectingRetraite(true);
    toast.info('Collecte des règles retraite en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/collecteur-retraite/run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la collecte');
      }

      const result = await response.json();
      console.log('✅ Résultat collecte retraite:', result);

      if (result.success) {
        toast.success(`Collecte terminée : ${result.total} documents récupérés (CNAV: ${result.cnav_count}, AGIRC-ARRCO: ${result.agirc_arrco_count}, Service-Public: ${result.service_public_count})`);
      } else {
        toast.error('Collecte terminée avec des erreurs');
      }

      // Recharger les données
      await loadReglesRetraite();

    } catch (error) {
      console.error('Erreur collecte retraite:', error);
      toast.error('Erreur lors de la collecte : ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCollectingRetraite(false);
    }
  };

  // Initialiser les règles retraite statiques
  const handleInitialiserReglesRetraite = async () => {
    const confirmed = confirm('Initialiser les 25 règles retraite statiques dans la base de données ?');
    if (!confirmed) return;

    toast.info('Initialisation en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/extracteur-regles-retraite/initialiser`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'initialisation');
      }

      toast.success(`${result.count} règles retraite initialisées avec succès !`);
      
      // Recharger les règles
      await loadReglesRetraite();

    } catch (error) {
      console.error('❌ Erreur initialisation règles retraite:', error);
      toast.error('Erreur lors de l\'initialisation : ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Filtrer les règles retraite
  const reglesRetraiteFiltrees = reglesRetraite.filter((regle) => {
    const regleText = regle.regle.toLowerCase();
    const regime = regle.regime.toLowerCase();
    const age = regle.age_legal.toLowerCase();
    const trimestres = regle.trimestres_requis.toLowerCase();
    const source = regle.source.toLowerCase();

    return (
      regleText.includes(filtreRetraiteRegle.toLowerCase()) &&
      regime.includes(filtreRetraiteRegime.toLowerCase()) &&
      age.includes(filtreRetraiteAge.toLowerCase()) &&
      trimestres.includes(filtreRetraiteTrimestres.toLowerCase()) &&
      source.includes(filtreRetraiteSource.toLowerCase())
    );
  });

  // Règles retraite à afficher avec pagination
  const reglesRetraiteAfficher = reglesRetraiteFiltrees.slice(0, reglesRetraiteAffichees);

  // Fonction pour charger plus de règles retraite
  const chargerPlusDeReglesRetraite = () => {
    setReglesRetraiteAffichees(prev => prev + 10);
  };

  // Lancer une simulation patrimoniale
  const handleLancerSimulation = async () => {
    if (!montageSelectionne) {
      toast.error('Veuillez sélectionner un montage patrimonial');
      return;
    }

    setIsSimulating(true);
    toast.info('Simulation en cours...');

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const parametres = {
        montage_id: montageSelectionne,
        capital_initial: capitalInitial,
        apport_annuel: apportAnnuel,
        taux_rendement_annuel: tauxRendement,
        duree_annees: dureeAnnees,
        tranche_marginale_ir: trancheMarginalIR,
        taux_ps: 17.2,
        frais_gestion_annuels: 0.5
      };

      const response = await fetch(
        `${apiBaseUrl}/make-server-cac859af/simulateur-patrimonial/simuler`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parametres, sauvegarder: false })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la simulation');
      }

      setSimulationResult(result.simulation);
      toast.success('Simulation terminée !');

    } catch (error) {
      console.error('❌ Erreur simulation:', error);
      toast.error('Erreur lors de la simulation : ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Bloc Sources juridiques */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-600" />
            Sources juridiques
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Liste des sources */}
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Database className={`w-4 h-4 ${source.type === 'official' ? 'text-blue-600' : 'text-gray-600'}`} />
                  <div>
                    <p className="font-medium text-gray-900">{source.name}</p>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {source.url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                {source.type === 'custom' && (
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Ajouter une source */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Ajouter une source personnalisée</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nom de la source"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
              <input
                type="url"
                placeholder="https://..."
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
              <button
                onClick={handleAddSource}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bloc Collecte des données */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Play className="w-5 h-5 text-slate-600" />
            Collecte des données
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {/* Bouton lancer collecte */}
          <button
            onClick={handleLaunchCollecte}
            disabled={isCollecting}
            className="w-full px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg font-medium hover:from-slate-800 hover:to-black transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCollecting ? (
              <>
                <Clock className="w-5 h-5 animate-spin" />
                Collecte en cours...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Lancer la collecte
              </>
            )}
          </button>

          {/* Dernière collecte */}
          {lastCollecte && (
            <div className={`p-4 rounded-lg border-2 ${lastCollecte.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                {lastCollecte.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 mb-1">
                    Dernière collecte : {new Date(lastCollecte.date).toLocaleString('fr-FR')}
                  </p>
                  <div className="text-sm space-y-1">
                    <p className="text-gray-700">
                      <strong>Statut :</strong> {lastCollecte.status === 'success' ? 'Succès' : 'Erreur'}
                    </p>
                    <p className="text-gray-700">
                      <strong>Sources consultées :</strong> {lastCollecte.sourcesCount}
                    </p>
                    <p className="text-gray-700">
                      <strong>Éléments récupérés :</strong> {lastCollecte.itemsCollected}
                    </p>
                    <p className="text-gray-700">
                      <strong>Durée :</strong> {lastCollecte.duration}
                    </p>
                    {lastCollecte.errorMessage && (
                      <p className="text-red-700">
                        <strong>Erreur :</strong> {lastCollecte.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bloc Règles fiscales */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            Règles fiscales collectées ({reglesFiscales.length})
          </h3>
          <div className="flex items-center gap-3">
            {isLoadingRegles ? (
              <Clock className="w-5 h-5 animate-spin text-slate-600" />
            ) : (
              <button
                onClick={handleInitialiserRegles}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Initialiser les 110 règles
              </button>
            )}
          </div>
        </div>
        {reglesFiscales.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Aucune règle fiscale collectée pour le moment.<br/>
              <span className="text-sm">Lancez une collecte pour extraire automatiquement les règles fiscales.</span>
            </p>
          </div>
        ) : (
          <>
            {/* Filtres de recherche */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Filtrer les règles</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Rechercher par titre..."
                  value={filtretitre}
                  onChange={(e) => setFiltreTitre(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Rechercher par catégorie..."
                  value={filtreCategorie}
                  onChange={(e) => setFiltreCategorie(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Rechercher par description..."
                  value={filtreDescription}
                  onChange={(e) => setFiltreDescription(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Rechercher par source..."
                  value={filtreSource}
                  onChange={(e) => setFiltreSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Rechercher par date..."
                  value={filtreDate}
                  onChange={(e) => setFiltreDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {reglesFiltrees.length} règle{reglesFiltrees.length > 1 ? 's' : ''} trouvée{reglesFiltrees.length > 1 ? 's' : ''} sur {reglesFiscales.length}
              </p>
            </div>

            {/* Tableau des règles */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Titre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date extraction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reglesAfficher.map((regle, index) => (
                    <tr key={regle.id || `regle-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {regle.titre || regle.regle || 'Sans titre'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {regle.categorie || regle.domaine || 'Général'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                        {regle.description || regle.consequence || regle.condition || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600">
                        {regle.source || regle.reference || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {regle.date_extraction 
                          ? new Date(regle.date_extraction).toLocaleDateString('fr-FR')
                          : regle.dateUpdate 
                          ? new Date(regle.dateUpdate).toLocaleDateString('fr-FR')
                          : regle.date_mise_a_jour
                          ? new Date(regle.date_mise_a_jour).toLocaleDateString('fr-FR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Bouton charger plus */}
              {reglesFiltrees.length > reglesAffichees && (
                <div className="p-6 text-center border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={chargerPlusDeRegles}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Charger 10 règles supplémentaires ({reglesFiltrees.length - reglesAffichees} restantes)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 4. Bloc Montages patrimoniaux */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-slate-600" />
            Montages patrimoniaux générés automatiquement ({montagesPatrimoniaux.length})
          </h3>
          {isLoadingMontages && (
            <Clock className="w-5 h-5 animate-spin text-slate-600" />
          )}
        </div>
        {montagesPatrimoniaux.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Aucun montage patrimonial génér pour le moment.<br/>
              <span className="text-sm">Les montages seront générés automatiquement après une collecte de règles fiscales.</span>
            </p>
          </div>
        ) : (
          <>
            {/* Filtres de recherche */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Filtrer les montages</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Rechercher par nom..."
                  value={filtreMontageNom}
                  onChange={(e) => setFiltreMontageNom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Rechercher par catégorie..."
                  value={filtreMontageCategorie}
                  onChange={(e) => setFiltreMontageCategorie(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Rechercher par objectif..."
                  value={filtreMontageObjectif}
                  onChange={(e) => setFiltreMontageObjectif(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  key="filtre-montage-complexite"
                  type="text"
                  placeholder="Rechercher par complexité..."
                  value={filtreMontageComplexite}
                  onChange={(e) => setFiltreMontageComplexite(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  key="filtre-montage-economie"
                  type="text"
                  placeholder="Rechercher par économie..."
                  value={filtreMontageEconomie}
                  onChange={(e) => setFiltreMontageEconomie(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {montagesFiltres.length} montage{montagesFiltres.length > 1 ? 's' : ''} trouvé{montagesFiltres.length > 1 ? 's' : ''} sur {montagesPatrimoniaux.length}
              </p>
            </div>

            {/* Tableau des montages */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Montage</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Objectif</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Complexité</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Économies estimées</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Score IA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {montagesAfficher.map((montage, index) => (
                    <tr key={montage.id || `montage-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {montage.nom_montage || montage.nom || montage.montage || 'Sans nom'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          {montage.categorie || 'Général'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-sm truncate">
                        {montage.objectif}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          montage.complexite === 'Simple' ? 'bg-green-50 text-green-700 border-green-200' :
                          montage.complexite === 'Moyenne' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {montage.complexite || 'Moyenne'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {montage.economie_estimee || montage.fiscalite || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {montage.score_confiance ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  montage.score_confiance >= 80 ? 'bg-green-500' :
                                  montage.score_confiance >= 60 ? 'bg-orange-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${montage.score_confiance}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {montage.score_confiance}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Bouton charger plus */}
              {montagesFiltres.length > montagesAffiches && (
                <div className="p-6 text-center border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={chargerPlusDeMontages}
                    className="px-6 py-2.5 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Charger 10 montages supplémentaires ({montagesFiltres.length - montagesAffiches} restants)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 5. Bloc Règles sociales URSSAF */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Règles sociales URSSAF ({reglesSociales.length})
          </h3>
          <div className="flex items-center gap-3">
            {isLoadingReglesSociales ? (
              <Clock className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <button
                onClick={handleInitialiserReglesSociales}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Initialiser les règles sociales
              </button>
            )}
          </div>
        </div>
        {reglesSociales.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Aucune règle sociale collectée pour le moment.<br/>
              <span className="text-sm">Cliquez sur le bouton ci-dessus pour initialiser les règles sociales URSSAF.</span>
            </p>
          </div>
        ) : (
          <>
            {/* Filtres de recherche */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Filtrer les règles sociales</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  key="filtre-social-regle"
                  type="text"
                  placeholder="Rechercher par règle..."
                  value={filtreSocialRegle}
                  onChange={(e) => setFiltreSocialRegle(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  key="filtre-social-domaine"
                  type="text"
                  placeholder="Rechercher par domaine..."
                  value={filtreSocialDomaine}
                  onChange={(e) => setFiltreSocialDomaine(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  key="filtre-social-taux"
                  type="text"
                  placeholder="Rechercher par taux..."
                  value={filtreSocialTaux}
                  onChange={(e) => setFiltreSocialTaux(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  key="filtre-social-plafond"
                  type="text"
                  placeholder="Rechercher par plafond..."
                  value={filtreSocialPlafond}
                  onChange={(e) => setFiltreSocialPlafond(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <input
                  key="filtre-social-source"
                  type="text"
                  placeholder="Rechercher par source..."
                  value={filtreSocialSource}
                  onChange={(e) => setFiltreSocialSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {reglesSocialesFiltrees.length} règle{reglesSocialesFiltrees.length > 1 ? 's' : ''} trouvée{reglesSocialesFiltrees.length > 1 ? 's' : ''} sur {reglesSociales.length}
              </p>
            </div>

            {/* Tableau des règles sociales */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Règle</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Domaine</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Taux</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plafond</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date MAJ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reglesSocialesAfficher.map((regle, index) => (
                    <tr key={regle.id || `regle-sociale-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md">
                        {regle.regle}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {regle.domaine}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                        {regle.taux}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {regle.plafond}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600">
                        {regle.source}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(regle.date_mise_a_jour).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          regle.statut_validation === 'validé' ? 'bg-green-50 text-green-700 border-green-200' :
                          regle.statut_validation === 'en_attente' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {regle.statut_validation === 'validé' ? 'Validé' :
                           regle.statut_validation === 'en_attente' ? 'En attente' :
                           'À vérifier'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Bouton charger plus */}
              {reglesSocialesFiltrees.length > reglesSocialesAffichees && (
                <div className="p-6 text-center border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={chargerPlusDeReglesSociales}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Charger 10 règles supplémentaires ({reglesSocialesFiltrees.length - reglesSocialesAffichees} restantes)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 6. Bloc Règles retraite */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-600" />
            Règles retraite ({reglesRetraite.length})
          </h3>
          <div className="flex items-center gap-3">
            {isLoadingReglesRetraite ? (
              <Clock className="w-5 h-5 animate-spin text-purple-600" />
            ) : (
              <>
                <button
                  onClick={handleInitialiserReglesRetraite}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Initialiser les règles retraite
                </button>
                <button
                  onClick={handleLaunchCollecteRetraite}
                  disabled={isCollectingRetraite}
                  className="px-4 py-2 bg-purple-700 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCollectingRetraite ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {isCollectingRetraite ? 'Collecte en cours...' : 'Lancer collecte règles retraite'}
                </button>
              </>
            )}
          </div>
        </div>
        {reglesRetraite.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              Aucune règle retraite collectée pour le moment.<br/>
              <span className="text-sm">Cliquez sur le bouton ci-dessus pour initialiser les règles retraite.</span>
            </p>
          </div>
        ) : (
          <>
            {/* Stats des règles retraite */}
            <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {reglesRetraite.filter(r => r.regime === 'CNAV').length}
                  </p>
                  <p className="text-xs text-purple-900 mt-1">CNAV</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {reglesRetraite.filter(r => r.regime === 'AGIRC-ARRCO').length}
                  </p>
                  <p className="text-xs text-purple-900 mt-1">AGIRC-ARRCO</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {reglesRetraite.filter(r => r.statut_validation === 'validé').length}
                  </p>
                  <p className="text-xs text-purple-900 mt-1">Validées</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">
                    {reglesRetraite.filter(r => r.date_mise_a_jour).length > 0 
                      ? new Date(Math.max(...reglesRetraite.map(r => new Date(r.date_mise_a_jour).getTime()))).toLocaleDateString('fr-FR')
                      : '-'
                    }
                  </p>
                  <p className="text-xs text-purple-900 mt-1">Dernière MAJ</p>
                </div>
              </div>
            </div>

            {/* Filtres de recherche */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">Filtrer les règles retraite</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Rechercher règle..."
                  value={filtreRetraiteRegle}
                  onChange={(e) => setFiltreRetraiteRegle(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Régime..."
                  value={filtreRetraiteRegime}
                  onChange={(e) => setFiltreRetraiteRegime(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Âge légal..."
                  value={filtreRetraiteAge}
                  onChange={(e) => setFiltreRetraiteAge(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Trimestres requis..."
                  value={filtreRetraiteTrimestres}
                  onChange={(e) => setFiltreRetraiteTrimestres(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Source..."
                  value={filtreRetraiteSource}
                  onChange={(e) => setFiltreRetraiteSource(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tableau des règles retraite */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Règle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Régime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Âge légal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Trimestres requis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      MAJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reglesRetraiteAfficher.map((regle) => (
                    <tr key={regle.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{regle.regle}</p>
                        <p className="text-xs text-gray-500 mt-1">{regle.formule}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          {regle.regime}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {regle.age_legal}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {regle.trimestres_requis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {regle.source}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {regle.date_mise_a_jour ? new Date(regle.date_mise_a_jour).toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                          regle.statut_validation === 'validé' ? 'bg-green-50 text-green-700 border-green-200' :
                          regle.statut_validation === 'en_attente' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {regle.statut_validation || 'validé'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Bouton charger plus */}
              {reglesRetraiteFiltrees.length > reglesRetraiteAffichees && (
                <div className="p-6 text-center border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={chargerPlusDeReglesRetraite}
                    className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Charger 10 règles supplémentaires ({reglesRetraiteFiltrees.length - reglesRetraiteAffichees} restantes)
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 7. Bloc Simulateurs patrimoniaux */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-600" />
            Simulateurs patrimoniaux
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Testez les simulateurs avec vos règles fiscales, sociales, retraite et montages collectés
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulaire de simulation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Paramètres de simulation</h4>
              
              {/* Sélection du montage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montage patrimonial
                </label>
                <select
                  value={montageSelectionne}
                  onChange={(e) => setMontageSelectionne(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un montage...</option>
                  {montagesPatrimoniaux.map((montage) => (
                    <option key={montage.id} value={montage.id}>
                      {montage.nom_montage || montage.nom || montage.montage}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capital initial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capital initial (€)
                </label>
                <input
                  type="number"
                  value={capitalInitial}
                  onChange={(e) => setCapitalInitial(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                  step="1000"
                />
              </div>

              {/* Apport annuel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apport annuel (€)
                </label>
                <input
                  type="number"
                  value={apportAnnuel}
                  onChange={(e) => setApportAnnuel(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                  step="1000"
                />
              </div>

              {/* Taux de rendement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taux de rendement annuel (%)
                </label>
                <input
                  type="number"
                  value={tauxRendement}
                  onChange={(e) => setTauxRendement(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="0"
                  max="20"
                  step="0.1"
                />
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durée (années)
                </label>
                <input
                  type="number"
                  value={dureeAnnees}
                  onChange={(e) => setDureeAnnees(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  min="1"
                  max="30"
                />
              </div>

              {/* Tranche marginale IR */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tranche marginale IR (%)
                </label>
                <select
                  value={trancheMarginalIR}
                  onChange={(e) => setTrancheMarginalIR(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="0">0% (non imposable)</option>
                  <option value="11">11%</option>
                  <option value="30">30%</option>
                  <option value="41">41%</option>
                  <option value="45">45%</option>
                </select>
              </div>

              {/* Bouton de simulation */}
              <button
                onClick={handleLancerSimulation}
                disabled={isSimulating || !montageSelectionne}
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-indigo-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Simulation en cours...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Lancer la simulation
                  </>
                )}
              </button>
            </div>

            {/* Résultats de simulation */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 mb-4">Résultats</h4>
              
              {!simulationResult ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">
                    Aucune simulation lancée.<br/>
                    <span className="text-sm">Configurez les paramètres et lancez une simulation.</span>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Montage utilisé */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-indigo-900 mb-1">
                      Montage simulé
                    </p>
                    <p className="text-lg font-semibold text-indigo-700">
                      {simulationResult.montage.nom_montage || simulationResult.montage.nom}
                    </p>
                  </div>

                  {/* Métriques principales */}
                  <div className="grid grid-cols-2 gap-3">
                    <div key="metric-capital" className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-900 mb-1">Capital final</p>
                      <p className="text-xl font-bold text-green-700">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(simulationResult.capital_final)}
                      </p>
                    </div>

                    <div key="metric-plusvalue" className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-blue-900 mb-1">Plus-value</p>
                      <p className="text-xl font-bold text-blue-700">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(simulationResult.plus_value)}
                      </p>
                    </div>

                    <div key="metric-rendement" className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-purple-900 mb-1">Rendement global</p>
                      <p className="text-xl font-bold text-purple-700">
                        {simulationResult.rendement_global.toFixed(2)}%
                      </p>
                    </div>

                    <div key="metric-rendement-annuel" className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-amber-900 mb-1">Rendement annuel moyen</p>
                      <p className="text-xl font-bold text-amber-700">
                        {simulationResult.taux_rendement_annuel_moyen.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Fiscalité */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-900 mb-2">Fiscalité totale</p>
                    <p className="text-2xl font-bold text-red-700">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(simulationResult.total_fiscalite)}
                    </p>
                    {simulationResult.economie_fiscale_vs_bareme && simulationResult.economie_fiscale_vs_bareme > 0 && (
                      <p className="text-xs text-red-700 mt-1">
                        Économie vs barème classique : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(simulationResult.economie_fiscale_vs_bareme)}
                      </p>
                    )}
                  </div>

                  {/* Métriques avancées */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div key="metric-adv-investi" className="flex justify-between">
                        <span className="text-gray-600">Total investi :</span>
                        <span className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(simulationResult.total_investis)}
                        </span>
                      </div>
                      <div key="metric-adv-horizon" className="flex justify-between">
                        <span className="text-gray-600">Horizon optimal :</span>
                        <span className="font-semibold text-gray-900">
                          {simulationResult.horizon_optimal} ans
                        </span>
                      </div>
                      <div key="metric-adv-seuil" className="flex justify-between">
                        <span className="text-gray-600">Seuil de rentabilité :</span>
                        <span className="font-semibold text-gray-900">
                          Année {simulationResult.seuil_rentabilite}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Flux annuels (aperçu) */}
                  {simulationResult.flux_annuels && simulationResult.flux_annuels.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 mb-3">
                        Flux annuels ({simulationResult.flux_annuels.length} années)
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {simulationResult.flux_annuels.slice(0, 5).map((flux: any) => (
                          <div key={flux.annee} className="flex justify-between text-xs bg-white p-2 rounded border border-gray-200">
                            <span className="font-medium text-gray-700">Année {flux.annee}</span>
                            <span className="text-gray-900 font-semibold">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(flux.capital_fin)}
                            </span>
                          </div>
                        ))}
                        {simulationResult.flux_annuels.length > 5 && (
                          <p className="text-xs text-gray-500 text-center pt-2">
                            ... et {simulationResult.flux_annuels.length - 5} autres années
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistiques du simulateur */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              <div key="stat-montages" className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                <Database className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-indigo-700">{montagesPatrimoniaux.length}</p>
                <p className="text-sm text-indigo-900">Montages disponibles</p>
              </div>
              <div key="stat-regles-fiscales" className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <Database className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{reglesFiscales.length}</p>
                <p className="text-sm text-blue-900">Règles fiscales</p>
              </div>
              <div key="stat-regles-sociales" className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                <Database className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-700">{reglesSociales.length}</p>
                <p className="text-sm text-emerald-900">Règles sociales</p>
              </div>
              <div key="stat-regles-retraite" className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <Database className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-700">{reglesRetraite.length}</p>
                <p className="text-sm text-purple-900">Règles retraite</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. Bloc Journal des mises à jour */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-600" />
            Journal des mises à jour ({updateLogs.length})
          </h3>
        </div>
        <div className="p-6">
          {updateLogs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucune activité récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {updateLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${
                    log.action === 'ajout' ? 'bg-green-100' : 
                    log.action === 'modification' ? 'bg-blue-100' : 
                    'bg-red-100'
                  }`}>
                    {log.action === 'ajout' ? (
                      <Plus className="w-4 h-4 text-green-700" />
                    ) : log.action === 'modification' ? (
                      <AlertCircle className="w-4 h-4 text-blue-700" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{log.description}</p>
                      <span className="text-xs text-gray-500">{log.date}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Type: <span className="font-medium">{log.type}</span> • Action: <span className="font-medium">{log.action}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}