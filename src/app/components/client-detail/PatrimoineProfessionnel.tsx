import { useState, useEffect } from 'react';
import { 
  Edit2, Plus, Trash2, Building2, Users, FileText, TrendingUp, 
  ChevronDown, ChevronUp, Save, X, BarChart3, DollarSign, Link2,
  Briefcase, Calculator, PieChart as PieChartIcon, TrendingDown, Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import { ValorisationSection } from './ValorisationSection';
import { OptimisationRemunerationModal } from '../OptimisationRemunerationModal';

interface Associe {
  id: string;
  nom: string;
  parts: number;
  typeDetention: 'pleine-propriete' | 'usufruit' | 'nue-propriete';
  membreFoyer?: boolean;
}

interface Remuneration {
  id: string;
  membreFoyer: string; // ID ou nom du membre
  montantBrut: number;
}

interface Exercice {
  id: string;
  annee: number;
  resultatNet: number;
  dividendes: number;
  remunerations: Remuneration[];
}

interface ActifPassifItem {
  id: string;
  libelle: string;
  valeur: number;
}

interface AjustementValorisation {
  immobilisationsCorporelles: number;
  immobilisationsIncorporelles: number;
  immobilisationsFinancieres: number;
  sourceValorisation: 'client' | 'tiers' | 'non-specifie';
  commentaire?: string;
}

interface Entreprise {
  id: string;
  nom: string;
  statutJuridique: string;
  fiscalite: string;
  secteurActivite?: string;
  dateCreation?: string;
  dateCloture?: string;
  nomDirigeant?: string;
  associes: Associe[];
  actifs: {
    immobilisationsCorporelles: number;
    immobilisationsIncorporelles: number;
    immobilisationsFinancieres: number;
    stocks: number;
    creancesClients: number;
    disponibilites: number;
    autresActifs: ActifPassifItem[];
  };
  passifs: {
    capitalSocial: number;
    reservesLegales: number;
    reservesLibres: number;
    dettesBancaires: number;
    comptesAssocies: number;
    dettesFournisseurs: number;
    dettesFiscalesSociales: number;
    autresPassifs: ActifPassifItem[];
  };
  exercices: Exercice[];
  estFiliale: boolean;
  societeMere?: string;
  filialesIds: string[];
  ajustementValorisation?: AjustementValorisation;
  bfr?: number; // Besoin en Fonds de Roulement
}

interface PatrimoineProfessionnelProps {
  onUpdate?: (entreprises: Entreprise[]) => void;
  clientData?: any;
  familyInfo?: any;
  // 🆕 NOUVEAU : Passer les entreprises existantes en props
  entreprises?: Entreprise[];
}

const STATUTS_JURIDIQUES = ['SARL', 'SAS', 'SASU', 'EURL', 'SA', 'SCI', 'EI', 'EIRL', 'Autre'];
const FISCALITES = ['IS (Impôt sur les Sociétés)', 'IR (Impôt sur le Revenu)', 'Micro-entreprise', 'Réel simplifié', 'Réel normal', 'Autre'];
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function PatrimoineProfessionnel({ onUpdate, clientData, familyInfo, entreprises: entreprisesInitiales }: PatrimoineProfessionnelProps) {
  // 🔥 CORRECTION : Utiliser les entreprises passées en props au lieu de [] vide
  const [entreprises, setEntreprises] = useState<Entreprise[]>(entreprisesInitiales || []);
  const [selectedEntreprise, setSelectedEntreprise] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Modals
  const [showAddEntreprise, setShowAddEntreprise] = useState(false);
  const [showEditEntreprise, setShowEditEntreprise] = useState<string | null>(null);
  const [showAddAssocie, setShowAddAssocie] = useState<string | null>(null);
  const [showAddExercice, setShowAddExercice] = useState<string | null>(null);
  const [showAddActif, setShowAddActif] = useState<string | null>(null);
  const [showAddPassif, setShowAddPassif] = useState<string | null>(null);
  const [showOptimisation, setShowOptimisation] = useState<string | null>(null);

  // Form states
  const [entrepriseForm, setEntrepriseForm] = useState({
    nom: '',
    statutJuridique: 'SARL',
    fiscalite: 'IS (Impôt sur les Sociétés)',
    secteurActivite: '',
    dateCreation: '',
    dateCloture: '',
    nomDirigeant: '',
    estFiliale: false,
    societeMere: '',
  });

  const [associeForm, setAssocie] = useState({ 
    selection: 'foyer',
    nom: '', 
    parts: 0, 
    typeDetention: 'pleine-propriete' as const
  });
  const [exerciceForm, setExerciceForm] = useState({ annee: new Date().getFullYear(), resultatNet: 0, dividendes: 0, remunerations: [] as Remuneration[] });
  const [remunerationForm, setRemunerationForm] = useState({ membreFoyer: '', montantBrut: 0 });
  const [actifForm, setActifForm] = useState({ libelle: '', valeur: 0 });
  const [passifForm, setPassifForm] = useState({ libelle: '', valeur: 0 });

  // États pour la valorisation d'entreprise
  const [valorisationParams, setValorisationParams] = useState<Record<string, {
    multipleRentabilite: number;
    tauxRendement: number;
    multipleSectoriel: number;
    ebitda: number;
  }>>({});

  // Helpers
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  // Construire la liste des membres du foyer
  const getMembresFoyer = () => {
    const membres: { value: string; label: string }[] = [];
    
    if (clientData?.firstName && clientData?.lastName) {
      membres.push({
        value: `${clientData.firstName} ${clientData.lastName}`,
        label: `${clientData.firstName} ${clientData.lastName} (Client principal)`
      });
    }
    
    if (familyInfo?.maritalStatus && ['Marié(e)', 'Pacsé(e)'].includes(familyInfo.maritalStatus)) {
      if (familyInfo?.spouse?.firstName && familyInfo?.spouse?.lastName) {
        membres.push({
          value: `${familyInfo.spouse.firstName} ${familyInfo.spouse.lastName}`,
          label: `${familyInfo.spouse.firstName} ${familyInfo.spouse.lastName} (Conjoint)`
        });
      }
    }
    
    if (familyInfo?.children && familyInfo.children.length > 0) {
      familyInfo.children.forEach((child: any, index: number) => {
        if (child.firstName) {
          membres.push({
            value: `${child.firstName} ${child.lastName || clientData?.lastName || ''}`,
            label: `${child.firstName} ${child.lastName || clientData?.lastName || ''} (Enfant)`
          });
        }
      });
    }
    
    return membres;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Initialiser le formulaire associé avec le premier membre du foyer
  useEffect(() => {
    if (showAddAssocie) {
      const membres = getMembresFoyer();
      if (membres.length > 0) {
        setAssocie({
          selection: membres[0].value,
          nom: membres[0].value,
          parts: 0,
          typeDetention: 'pleine-propriete'
        });
      } else {
        // Si aucun membre du foyer, initialiser sur "autre"
        setAssocie({
          selection: 'autre',
          nom: '',
          parts: 0,
          typeDetention: 'pleine-propriete'
        });
      }
    }
  }, [showAddAssocie, clientData, familyInfo]);

  // Initialiser le formulaire de rémunération avec le premier membre du foyer
  useEffect(() => {
    if (showAddExercice) {
      const membres = getMembresFoyer();
      if (membres.length > 0) {
        setRemunerationForm({
          membreFoyer: membres[0].label,
          montantBrut: 0
        });
      }
    }
  }, [showAddExercice, clientData, familyInfo]);

  // CRUD Entreprise
  const handleAddEntreprise = () => {
    if (!entrepriseForm.nom) {
      toast.error('Le nom de l\'entreprise est obligatoire');
      return;
    }

    const newEntreprise: Entreprise = {
      id: `entreprise-${Date.now()}`,
      nom: entrepriseForm.nom,
      statutJuridique: entrepriseForm.statutJuridique,
      fiscalite: entrepriseForm.fiscalite,
      secteurActivite: entrepriseForm.secteurActivite,
      dateCreation: entrepriseForm.dateCreation,
      dateCloture: entrepriseForm.dateCloture,
      nomDirigeant: entrepriseForm.nomDirigeant,
      associes: [],
      actifs: {
        immobilisationsCorporelles: 0,
        immobilisationsIncorporelles: 0,
        immobilisationsFinancieres: 0,
        stocks: 0,
        creancesClients: 0,
        disponibilites: 0,
        autresActifs: [],
      },
      passifs: {
        capitalSocial: 0,
        reservesLegales: 0,
        reservesLibres: 0,
        dettesBancaires: 0,
        comptesAssocies: 0,
        dettesFournisseurs: 0,
        dettesFiscalesSociales: 0,
        autresPassifs: [],
      },
      exercices: [],
      estFiliale: entrepriseForm.estFiliale,
      societeMere: entrepriseForm.societeMere,
      filialesIds: [],
    };

    setEntreprises([...entreprises, newEntreprise]);
    setShowAddEntreprise(false);
    setEntrepriseForm({ nom: '', statutJuridique: 'SARL', fiscalite: 'IS (Impôt sur les Sociétés)', secteurActivite: '', dateCreation: '', dateCloture: '', nomDirigeant: '', estFiliale: false, societeMere: '' });
    toast.success('Entreprise ajoutée');
    onUpdate?.([...entreprises, newEntreprise]);
  };

  const handleDeleteEntreprise = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      const updated = entreprises.filter(e => e.id !== id);
      setEntreprises(updated);
      toast.success('Entreprise supprimée');
      onUpdate?.(updated);
    }
  };

  // CRUD Associé
  const handleAddAssocie = (entrepriseId: string) => {
    if (!associeForm.nom || associeForm.parts <= 0) {
      toast.error('Nom et parts obligatoires');
      return;
    }

    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          associes: [...e.associes, { 
            id: `associe-${Date.now()}`, 
            nom: associeForm.nom, 
            parts: associeForm.parts,
            typeDetention: associeForm.typeDetention,
            membreFoyer: associeForm.selection !== 'autre'
          }],
        };
      }
      return e;
    });

    setEntreprises(updated);
    setShowAddAssocie(null);
    setAssocie({ selection: 'foyer', nom: '', parts: 0, typeDetention: 'pleine-propriete' });
    toast.success('Associé ajouté');
    onUpdate?.(updated);
  };

  const handleDeleteAssocie = (entrepriseId: string, associeId: string) => {
    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return { ...e, associes: e.associes.filter(a => a.id !== associeId) };
      }
      return e;
    });
    setEntreprises(updated);
    toast.success('Associé supprimé');
    onUpdate?.(updated);
  };

  // CRUD Exercice
  const handleAddExercice = (entrepriseId: string) => {
    if (exerciceForm.annee < 2000 || exerciceForm.annee > 2100) {
      toast.error('Année invalide');
      return;
    }

    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          exercices: [...e.exercices, { 
            id: `exercice-${Date.now()}`, 
            annee: exerciceForm.annee, 
            resultatNet: exerciceForm.resultatNet, 
            dividendes: exerciceForm.dividendes,
            remunerations: exerciceForm.remunerations
          }].sort((a, b) => b.annee - a.annee),
        };
      }
      return e;
    });

    setEntreprises(updated);
    setShowAddExercice(null);
    setExerciceForm({ annee: new Date().getFullYear(), resultatNet: 0, dividendes: 0, remunerations: [] });
    toast.success('Exercice ajouté');
    onUpdate?.(updated);
  };

  const handleDeleteExercice = (entrepriseId: string, exerciceId: string) => {
    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return { ...e, exercices: e.exercices.filter(ex => ex.id !== exerciceId) };
      }
      return e;
    });
    setEntreprises(updated);
    toast.success('Exercice supprimé');
    onUpdate?.(updated);
  };

  // Gestion des rémunérations dans le formulaire d'exercice
  const handleAddRemunerationToForm = () => {
    if (!remunerationForm.membreFoyer || remunerationForm.montantBrut <= 0) {
      toast.error('Veuillez sélectionner un membre et saisir un montant');
      return;
    }

    const nouvelleRemuneration: Remuneration = {
      id: `remuneration-${Date.now()}`,
      membreFoyer: remunerationForm.membreFoyer,
      montantBrut: remunerationForm.montantBrut
    };

    setExerciceForm({
      ...exerciceForm,
      remunerations: [...exerciceForm.remunerations, nouvelleRemuneration]
    });
    
    setRemunerationForm({ membreFoyer: '', montantBrut: 0 });
    toast.success('Rémunération ajoutée');
  };

  const handleRemoveRemunerationFromForm = (remunerationId: string) => {
    setExerciceForm({
      ...exerciceForm,
      remunerations: exerciceForm.remunerations.filter(r => r.id !== remunerationId)
    });
  };

  // Update Actif/Passif
  const updateActifPassif = (entrepriseId: string, field: string, value: number) => {
    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        const keys = field.split('.');
        if (keys.length === 2) {
          return {
            ...e,
            [keys[0]]: {
              ...e[keys[0] as 'actifs' | 'passifs'],
              [keys[1]]: value,
            },
          };
        }
      }
      return e;
    });
    setEntreprises(updated);
    onUpdate?.(updated);
  };

  // Add custom actif/passif
  const handleAddAutreActif = (entrepriseId: string) => {
    if (!actifForm.libelle || actifForm.valeur <= 0) {
      toast.error('Libellé et valeur obligatoires');
      return;
    }

    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          actifs: {
            ...e.actifs,
            autresActifs: [...e.actifs.autresActifs, { id: `actif-${Date.now()}`, libelle: actifForm.libelle, valeur: actifForm.valeur }],
          },
        };
      }
      return e;
    });

    setEntreprises(updated);
    setShowAddActif(null);
    setActifForm({ libelle: '', valeur: 0 });
    toast.success('Actif ajouté');
    onUpdate?.(updated);
  };

  const handleAddAutrePassif = (entrepriseId: string) => {
    if (!passifForm.libelle || passifForm.valeur <= 0) {
      toast.error('Libellé et valeur obligatoires');
      return;
    }

    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          passifs: {
            ...e.passifs,
            autresPassifs: [...e.passifs.autresPassifs, { id: `passif-${Date.now()}`, libelle: passifForm.libelle, valeur: passifForm.valeur }],
          },
        };
      }
      return e;
    });

    setEntreprises(updated);
    setShowAddPassif(null);
    setPassifForm({ libelle: '', valeur: 0 });
    toast.success('Passif ajouté');
    onUpdate?.(updated);
  };

  const handleDeleteAutreActif = (entrepriseId: string, actifId: string) => {
    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          actifs: { ...e.actifs, autresActifs: e.actifs.autresActifs.filter(a => a.id !== actifId) },
        };
      }
      return e;
    });
    setEntreprises(updated);
    onUpdate?.(updated);
  };

  const handleDeleteAutrePassif = (entrepriseId: string, passifId: string) => {
    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          passifs: { ...e.passifs, autresPassifs: e.passifs.autresPassifs.filter(p => p.id !== passifId) },
        };
      }
      return e;
    });
    setEntreprises(updated);
    onUpdate?.(updated);
  };

  // Calculs
  const getTotalActif = (entreprise: Entreprise) => {
    return entreprise.actifs.immobilisationsCorporelles + 
           entreprise.actifs.immobilisationsIncorporelles + 
           entreprise.actifs.immobilisationsFinancieres + 
           entreprise.actifs.stocks + 
           entreprise.actifs.creancesClients + 
           entreprise.actifs.disponibilites + 
           entreprise.actifs.autresActifs.reduce((sum, a) => sum + a.valeur, 0);
  };

  const getTotalPassif = (entreprise: Entreprise) => {
    return entreprise.passifs.capitalSocial +
           entreprise.passifs.reservesLegales +
           entreprise.passifs.reservesLibres +
           entreprise.passifs.dettesBancaires + 
           entreprise.passifs.comptesAssocies + 
           entreprise.passifs.dettesFournisseurs + 
           entreprise.passifs.dettesFiscalesSociales + 
           entreprise.passifs.autresPassifs.reduce((sum, p) => sum + p.valeur, 0);
  };

  const getCapitauxPropres = (entreprise: Entreprise) => {
    // Les capitaux propres = Capital social + Réserves légales + Réserves libres
    return entreprise.passifs.capitalSocial + 
           entreprise.passifs.reservesLegales + 
           entreprise.passifs.reservesLibres;
  };

  const getTotalDettes = (entreprise: Entreprise) => {
    // Total des dettes (hors capitaux propres)
    return entreprise.passifs.dettesBancaires + 
           entreprise.passifs.comptesAssocies + 
           entreprise.passifs.dettesFournisseurs + 
           entreprise.passifs.dettesFiscalesSociales + 
           entreprise.passifs.autresPassifs.reduce((sum, p) => sum + p.valeur, 0);
  };

  // Calculs pour l'analyse du cycle d'exploitation
  const getBFR = (entreprise: Entreprise) => {
    // Utiliser le BFR saisi si disponible, sinon calcul automatique
    return entreprise.bfr ?? (entreprise.actifs.stocks + entreprise.actifs.creancesClients - entreprise.passifs.dettesFournisseurs);
  };

  const getTresorerie = (entreprise: Entreprise) => {
    return entreprise.actifs.disponibilites;
  };

  const getComptesAssocies = (entreprise: Entreprise) => {
    return entreprise.passifs.comptesAssocies;
  };

  const getCouvertureBFR = (entreprise: Entreprise) => {
    const bfr = getBFR(entreprise);
    if (bfr === 0) return null;
    return getTresorerie(entreprise) / bfr;
  };

  const getFinancementParAssocies = (entreprise: Entreprise) => {
    const bfr = getBFR(entreprise);
    if (bfr === 0) return null;
    return getComptesAssocies(entreprise) / bfr;
  };

  const getTresorerieExcedentaire = (entreprise: Entreprise) => {
    return getTresorerie(entreprise) - getBFR(entreprise);
  };

  const getTresorerieSecurite = (chargesMensuelles?: number) => {
    if (!chargesMensuelles) return 0;
    return chargesMensuelles * 3;
  };

  const getTresorerieMobilisable = (entreprise: Entreprise, chargesMensuelles?: number) => {
    return getTresorerie(entreprise) - getBFR(entreprise) - getTresorerieSecurite(chargesMensuelles);
  };

  const getAnalyseSituation = (entreprise: Entreprise) => {
    const couverture = getCouvertureBFR(entreprise);
    if (couverture === null || couverture < 1) {
      return { niveau: 'rouge', message: 'Trésorerie majoritairement utilisée pour financer le cycle d\'exploitation' };
    } else if (couverture >= 1 && couverture <= 1.5) {
      return { niveau: 'orange', message: 'Situation équilibrée' };
    } else {
      return { niveau: 'vert', message: 'Excédent de trésorerie pouvant être étudié pour des placements ou optimisations financières' };
    }
  };

  // Fonctions de valorisation d'entreprise
  const getValorisationParams = (entrepriseId: string) => {
    return valorisationParams[entrepriseId] || {
      multipleRentabilite: 5,
      tauxRendement: 0.05,
      multipleSectoriel: 8,
      ebitda: 0,
    };
  };

  const updateValorisationParams = (entrepriseId: string, params: Partial<typeof valorisationParams[string]>) => {
    setValorisationParams(prev => ({
      ...prev,
      [entrepriseId]: { ...getValorisationParams(entrepriseId), ...params }
    }));
  };

  const updateAjustementValorisation = (entrepriseId: string, ajustement: Partial<AjustementValorisation>) => {
    const updated = entreprises.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          ajustementValorisation: {
            ...e.ajustementValorisation,
            immobilisationsCorporelles: e.ajustementValorisation?.immobilisationsCorporelles ?? e.actifs.immobilisationsCorporelles,
            immobilisationsIncorporelles: e.ajustementValorisation?.immobilisationsIncorporelles ?? e.actifs.immobilisationsIncorporelles,
            immobilisationsFinancieres: e.ajustementValorisation?.immobilisationsFinancieres ?? e.actifs.immobilisationsFinancieres,
            sourceValorisation: e.ajustementValorisation?.sourceValorisation ?? 'non-specifie',
            commentaire: e.ajustementValorisation?.commentaire ?? '',
            ...ajustement
          } as AjustementValorisation
        };
      }
      return e;
    });
    setEntreprises(updated);
    onUpdate?.(updated);
  };

  const calculateValorisation = (entreprise: Entreprise) => {
    const params = getValorisationParams(entreprise.id);
    const totalActif = getTotalActif(entreprise);
    const totalPassif = getTotalPassif(entreprise);
    
    // Calcul des moyennes sur 3 ans
    const exercicesRecents = entreprise.exercices.slice(0, 3);
    const resultatMoyen = exercicesRecents.length > 0 
      ? exercicesRecents.reduce((sum, ex) => sum + ex.resultatNet, 0) / exercicesRecents.length
      : 0;
    const dividendesMoyens = exercicesRecents.length > 0
      ? exercicesRecents.reduce((sum, ex) => sum + ex.dividendes, 0) / exercicesRecents.length
      : 0;

    // Calcul actif ajusté pour valorisation (si ajustements présents)
    let totalActifAjuste = totalActif;
    if (entreprise.ajustementValorisation) {
      // On retire les immobilisations comptables et on ajoute les ajustées
      totalActifAjuste = totalActif 
        - entreprise.actifs.immobilisationsCorporelles
        - entreprise.actifs.immobilisationsIncorporelles
        - entreprise.actifs.immobilisationsFinancieres
        + entreprise.ajustementValorisation.immobilisationsCorporelles
        + entreprise.ajustementValorisation.immobilisationsIncorporelles
        + entreprise.ajustementValorisation.immobilisationsFinancieres;
    }

    // 1. Valeur patrimoniale (avec actif ajusté)
    const valeurPatrimoniale = totalActifAjuste - totalPassif;

    // 2. Valeur de rentabilité
    const valeurRentabilite = resultatMoyen * params.multipleRentabilite;

    // 3. Valeur de rendement
    const valeurRendement = params.tauxRendement > 0 
      ? dividendesMoyens / params.tauxRendement 
      : 0;

    // 4. Valeur comparative (EBITDA)
    const valeurComparative = params.ebitda * params.multipleSectoriel;

    // 5. Valeur finale pondérée
    let valeurFinale = 0;
    if (entreprise.statutJuridique === 'SCI') {
      // Pour les SCI : 2×patrimoniale + 1×rentabilité
      valeurFinale = (2 * valeurPatrimoniale + valeurRentabilite) / 3;
    } else {
      // Pour les autres : 30% patrimoniale + 40% rentabilité + 30% comparative
      valeurFinale = 0.3 * valeurPatrimoniale + 0.4 * valeurRentabilite + 0.3 * valeurComparative;
    }

    return {
      valeurPatrimoniale,
      valeurRentabilite,
      valeurRendement,
      valeurComparative,
      valeurFinale,
      resultatMoyen,
      dividendesMoyens,
      totalActifAjuste,
      ajustementApplique: !!entreprise.ajustementValorisation,
    };
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          Patrimoine Professionnel
        </h3>
        <button
          onClick={() => setShowAddEntreprise(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une entreprise
        </button>
      </div>

      {/* Liste des entreprises */}
      {entreprises.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">Aucune entreprise renseignée</p>
          <p className="text-sm text-gray-500">Cliquez sur "Ajouter une entreprise" pour commencer</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entreprises.map((entreprise) => {
            const totalActif = getTotalActif(entreprise);
            const totalPassif = getTotalPassif(entreprise);
            const capitauxPropres = getCapitauxPropres(entreprise);
            const totalDettes = getTotalDettes(entreprise);
            const totalParts = entreprise.associes.reduce((sum, a) => sum + a.parts, 0);

            return (
              <div key={entreprise.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
                {/* En-tête entreprise */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-6 h-6" />
                        <h4 className="text-2xl font-bold">{entreprise.nom}</h4>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="bg-white bg-opacity-90 px-3 py-1 rounded-lg shadow-sm text-blue-900 font-semibold">
                          {entreprise.statutJuridique}
                        </span>
                        <span className="bg-white bg-opacity-90 px-3 py-1 rounded-lg shadow-sm text-blue-900 font-semibold">
                          {entreprise.fiscalite}
                        </span>
                        {entreprise.estFiliale && (
                          <span className="bg-yellow-400 bg-opacity-90 text-yellow-900 px-3 py-1 rounded-full flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            Filiale de {entreprise.societeMere}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEntreprise(entreprise.id)}
                      className="text-white hover:text-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Informations clés */}
                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-blue-900 font-bold mb-1">Secteur d'activité</p>
                      <p className="text-sm font-semibold text-gray-900">{entreprise.secteurActivite || 'Non renseigné'}</p>
                    </div>
                    <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-blue-900 font-bold mb-1">Date de création</p>
                      <p className="text-sm font-semibold text-gray-900">{entreprise.dateCreation || 'Non renseignée'}</p>
                    </div>
                    <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-blue-900 font-bold mb-1">Clôture des comptes</p>
                      <p className="text-sm font-semibold text-gray-900">{entreprise.dateCloture || 'Non renseignée'}</p>
                    </div>
                    <div className="bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
                      <p className="text-xs text-blue-900 font-bold mb-1">
                        {['SARL', 'EURL', 'SCI'].includes(entreprise.statutJuridique) ? 'Gérant' : 'Président'}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">{entreprise.nomDirigeant || 'Non renseigné'}</p>
                    </div>
                  </div>
                </div>

                {/* Sections détaillées */}
                <div className="p-6 space-y-4">
                  {/* 1️⃣ INFORMATIONS GÉNÉRALES */}
                  <div className="border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${entreprise.id}-info`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-gray-900">1️⃣ Informations générales & Associés</span>
                      </div>
                      {expandedSections[`${entreprise.id}-info`] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections[`${entreprise.id}-info`] && (
                      <div className="p-4 border-t-2 border-gray-200 space-y-4">
                        {/* Informations de base */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h5 className="font-semibold text-gray-900 mb-3">📋 Informations de base</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 mb-1">Statut juridique</p>
                              <p className="font-semibold text-gray-900">{entreprise.statutJuridique}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">Fiscalité</p>
                              <p className="font-semibold text-gray-900">{entreprise.fiscalite}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">Secteur d'activité</p>
                              <p className="font-semibold text-gray-900">{entreprise.secteurActivite || 'Non renseigné'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 mb-1">Dirigeant</p>
                              <p className="font-semibold text-gray-900">{entreprise.nomDirigeant || 'Non renseigné'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">Répartition des parts</h5>
                          <button
                            onClick={() => setShowAddAssocie(entreprise.id)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter un associé
                          </button>
                        </div>

                        {entreprise.associes.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">Aucun associé renseigné</p>
                        ) : (
                          <div className="space-y-2">
                            {entreprise.associes.map((associe) => (
                              <div key={associe.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-gray-900">{associe.nom}</p>
                                    {associe.membreFoyer && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Foyer</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {associe.parts}% - {
                                      associe.typeDetention === 'pleine-propriete' ? 'Pleine propriété' :
                                      associe.typeDetention === 'usufruit' ? 'Usufruit' :
                                      'Nue-propriété'
                                    }
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleDeleteAssocie(entreprise.id, associe.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Graphique répartition */}
                        {entreprise.associes.length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4 mt-4">
                            <ResponsiveContainer width="100%" height={200}>
                              <PieChart>
                                <Pie
                                  data={entreprise.associes.map((a, idx) => ({ 
                                    name: a.nom, 
                                    value: a.parts, 
                                    typeDetention: a.typeDetention === 'pleine-propriete' ? 'PP' : 
                                                   a.typeDetention === 'usufruit' ? 'US' : 'NP',
                                    fill: COLORS[idx % COLORS.length] 
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent, typeDetention }) => `${name} ${(percent * 100).toFixed(0)}% (${typeDetention})`}
                                  outerRadius={80}
                                  dataKey="value"
                                >
                                  {entreprise.associes.map((_, idx) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="text-xs text-gray-500 mt-2 text-center">
                              PP = Pleine propriété | US = Usufruit | NP = Nue-propriété
                            </div>
                            {totalParts !== 100 && (
                              <div className={`text-sm mt-2 text-center font-medium ${totalParts > 100 ? 'text-red-600' : 'text-orange-600'}`}>
                                ⚠️ Total des parts : {totalParts.toFixed(2)}% {totalParts > 100 ? '(dépassement)' : '(incomplet)'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2️⃣ ACTIF / PASSIF */}
                  <div className="border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${entreprise.id}-actifpassif`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-gray-900">2️⃣ Détail Actif / Passif</span>
                      </div>
                      {expandedSections[`${entreprise.id}-actifpassif`] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections[`${entreprise.id}-actifpassif`] && (
                      <div className="p-4 border-t-2 border-gray-200">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* ACTIF */}
                          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                            <h5 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5" />
                              ACTIF
                            </h5>
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700">Immobilisations corporelles</label>
                                <input
                                  type="number"
                                  value={entreprise.actifs.immobilisationsCorporelles || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'actifs.immobilisationsCorporelles', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Immobilisations incorporelles</label>
                                <input
                                  type="number"
                                  value={entreprise.actifs.immobilisationsIncorporelles || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'actifs.immobilisationsIncorporelles', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Immobilisations financières</label>
                                <input
                                  type="number"
                                  value={entreprise.actifs.immobilisationsFinancieres || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'actifs.immobilisationsFinancieres', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Stocks</label>
                                <input
                                  type="number"
                                  value={entreprise.actifs.stocks || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'actifs.stocks', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Créances clients</label>
                                <input
                                  type="number"
                                  value={entreprise.actifs.creancesClients || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'actifs.creancesClients', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Disponibilités</label>
                                <input
                                  type="number"
                                  value={entreprise.actifs.disponibilites || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'actifs.disponibilites', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>

                              {/* Autres actifs */}
                              <div className="border-t-2 border-green-300 pt-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-gray-700">Autres actifs</p>
                                  <button
                                    onClick={() => setShowAddActif(entreprise.id)}
                                    className="text-xs text-green-600 hover:text-green-700"
                                  >
                                    + Ajouter
                                  </button>
                                </div>
                                {entreprise.actifs.autresActifs.map((actif) => (
                                  <div key={actif.id} className="flex items-center justify-between bg-white rounded p-2 mb-2">
                                    <span className="text-sm">{actif.libelle}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold">{formatEuro(actif.valeur)}</span>
                                      <button
                                        onClick={() => handleDeleteAutreActif(entreprise.id, actif.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-green-100 rounded-lg p-3 mt-3">
                                <p className="text-sm font-medium text-green-900">Total Actif</p>
                                <p className="text-2xl font-bold text-green-900">{formatEuro(totalActif)}</p>
                              </div>
                            </div>
                          </div>

                          {/* PASSIF */}
                          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                            <h5 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 rotate-180" />
                              PASSIF
                            </h5>
                            <div className="space-y-3">
                              {/* Capitaux propres */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-xs font-bold text-blue-900 mb-2">💼 Capitaux propres</p>
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Capital social</label>
                                    <input
                                      type="number"
                                      value={entreprise.passifs.capitalSocial || 0}
                                      onChange={(e) => updateActifPassif(entreprise.id, 'passifs.capitalSocial', parseFloat(e.target.value) || 0)}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Réserves légales</label>
                                    <input
                                      type="number"
                                      value={entreprise.passifs.reservesLegales || 0}
                                      onChange={(e) => updateActifPassif(entreprise.id, 'passifs.reservesLegales', parseFloat(e.target.value) || 0)}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700">Réserves libres</label>
                                    <input
                                      type="number"
                                      value={entreprise.passifs.reservesLibres || 0}
                                      onChange={(e) => updateActifPassif(entreprise.id, 'passifs.reservesLibres', parseFloat(e.target.value) || 0)}
                                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Dettes */}
                              <div>
                                <label className="text-xs font-medium text-gray-700">Dettes bancaires</label>
                                <input
                                  type="number"
                                  value={entreprise.passifs.dettesBancaires || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'passifs.dettesBancaires', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Comptes associés</label>
                                <input
                                  type="number"
                                  value={entreprise.passifs.comptesAssocies || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'passifs.comptesAssocies', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Dettes fournisseurs</label>
                                <input
                                  type="number"
                                  value={entreprise.passifs.dettesFournisseurs || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'passifs.dettesFournisseurs', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700">Dettes fiscales et sociales</label>
                                <input
                                  type="number"
                                  value={entreprise.passifs.dettesFiscalesSociales || 0}
                                  onChange={(e) => updateActifPassif(entreprise.id, 'passifs.dettesFiscalesSociales', parseFloat(e.target.value) || 0)}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>

                              {/* Autres passifs */}
                              <div className="border-t-2 border-red-300 pt-3 mt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-gray-700">Autres passifs</p>
                                  <button
                                    onClick={() => setShowAddPassif(entreprise.id)}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    + Ajouter
                                  </button>
                                </div>
                                {entreprise.passifs.autresPassifs.map((passif) => (
                                  <div key={passif.id} className="flex items-center justify-between bg-white rounded p-2 mb-2">
                                    <span className="text-sm">{passif.libelle}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold">{formatEuro(passif.valeur)}</span>
                                      <button
                                        onClick={() => handleDeleteAutrePassif(entreprise.id, passif.id)}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="bg-red-100 rounded-lg p-3 mt-3">
                                <p className="text-sm font-medium text-red-900">Total Passif</p>
                                <p className="text-2xl font-bold text-red-900">{formatEuro(totalPassif)}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Résumé */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-6">
                          <div className="grid grid-cols-4 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Total Actif</p>
                              <p className="text-xl font-bold text-blue-900">{formatEuro(totalActif)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Passif</p>
                              <p className="text-xl font-bold text-blue-900">{formatEuro(totalPassif)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Capitaux Propres</p>
                              <p className="text-xl font-bold text-green-900">
                                {formatEuro(capitauxPropres)}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Total Dettes</p>
                              <p className="text-xl font-bold text-red-900">
                                {formatEuro(totalDettes)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t-2 border-blue-300">
                            <p className="text-xs text-gray-600 mb-2">Taux d'endettement (Dettes / Actif)</p>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full ${totalDettes / totalActif > 0.7 ? 'bg-red-500' : totalDettes / totalActif > 0.4 ? 'bg-orange-500' : 'bg-green-500'}`}
                                  style={{ width: `${totalActif > 0 ? Math.min(100, (totalDettes / totalActif) * 100) : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold text-blue-900">
                                {totalActif > 0 ? ((totalDettes / totalActif) * 100).toFixed(1) : 0}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 italic">
                              💡 Total Passif = Capitaux propres + Dettes (équilibre : Actif = Passif)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3️⃣ ANALYSE DU CYCLE D'EXPLOITATION ET DE LA TRÉSORERIE */}
                  <div className="border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${entreprise.id}-analyse-tresorerie`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-900">3️⃣ Analyse du cycle d'exploitation et de la trésorerie</span>
                      </div>
                      {expandedSections[`${entreprise.id}-analyse-tresorerie`] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections[`${entreprise.id}-analyse-tresorerie`] && (
                      <div className="p-6 space-y-6">
                        {/* Saisie du BFR */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">💼 Besoin en Fonds de Roulement (BFR)</h4>
                            {entreprise.bfr === undefined && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Calcul automatique</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">BFR (€)</label>
                              <input
                                type="number"
                                value={entreprise.bfr ?? ''}
                                onChange={(e) => {
                                  const updated = entreprises.map(ent => {
                                    if (ent.id === entreprise.id) {
                                      return {
                                        ...ent,
                                        bfr: e.target.value ? parseFloat(e.target.value) : undefined
                                      };
                                    }
                                    return ent;
                                  });
                                  setEntreprises(updated);
                                  onUpdate?.(updated);
                                }}
                                placeholder={`Auto: ${formatEuro(entreprise.actifs.stocks + entreprise.actifs.creancesClients - entreprise.passifs.dettesFournisseurs)}`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="bg-white rounded-lg p-3 border-2 border-emerald-200 w-full">
                                <p className="text-xs text-gray-600 mb-1">BFR utilisé</p>
                                <p className="text-xl font-bold text-emerald-900">{formatEuro(getBFR(entreprise))}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            💡 Si non renseigné, le BFR est calculé automatiquement : Stocks + Créances clients - Dettes fournisseurs
                          </p>
                        </div>

                        {/* 1. Tableau des indicateurs */}
                        <div className="bg-white border-2 border-emerald-100 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">📊 Indicateurs clés</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-emerald-50">
                                <tr>
                                  <th className="text-left p-3 font-semibold text-gray-700">Indicateur</th>
                                  <th className="text-left p-3 font-semibold text-gray-700">Calcul</th>
                                  <th className="text-right p-3 font-semibold text-gray-700">Résultat</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                  <td className="p-3 font-medium">Couverture BFR</td>
                                  <td className="p-3 text-gray-600">Trésorerie / BFR</td>
                                  <td className="p-3 text-right font-semibold">
                                    {getCouvertureBFR(entreprise) !== null 
                                      ? getCouvertureBFR(entreprise)!.toFixed(2) 
                                      : 'N/A'}
                                  </td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                  <td className="p-3 font-medium">Financement par associés</td>
                                  <td className="p-3 text-gray-600">Comptes courants / BFR</td>
                                  <td className="p-3 text-right font-semibold">
                                    {getFinancementParAssocies(entreprise) !== null 
                                      ? getFinancementParAssocies(entreprise)!.toFixed(2) 
                                      : 'N/A'}
                                  </td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                  <td className="p-3 font-medium">Trésorerie excédentaire</td>
                                  <td className="p-3 text-gray-600">Trésorerie - BFR</td>
                                  <td className="p-3 text-right font-semibold">
                                    {formatEuro(getTresorerieExcedentaire(entreprise))}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 2. Analyse visuelle */}
                        <div className="bg-white border-2 border-emerald-100 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">🎯 Situation de trésorerie</h4>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                                <div 
                                  className={`h-6 rounded-full transition-all ${
                                    getAnalyseSituation(entreprise).niveau === 'vert' ? 'bg-green-500' :
                                    getAnalyseSituation(entreprise).niveau === 'orange' ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ 
                                    width: `${
                                      getCouvertureBFR(entreprise) !== null && getCouvertureBFR(entreprise)! > 0
                                        ? Math.min(100, (getCouvertureBFR(entreprise)! / 2) * 100)
                                        : 0
                                    }%` 
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-bold min-w-[60px] text-right">
                                {getCouvertureBFR(entreprise) !== null 
                                  ? (getCouvertureBFR(entreprise)! * 100).toFixed(0) + '%'
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="w-3 h-3 bg-red-500 rounded"></span>
                              <span>Tension (&lt;1)</span>
                              <span className="w-3 h-3 bg-orange-500 rounded ml-3"></span>
                              <span>Équilibre (1-1.5)</span>
                              <span className="w-3 h-3 bg-green-500 rounded ml-3"></span>
                              <span>Excédent (&gt;1.5)</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Synthèse */}
                        <div className={`border-2 rounded-lg p-4 ${
                          getAnalyseSituation(entreprise).niveau === 'vert' ? 'bg-green-50 border-green-200' :
                          getAnalyseSituation(entreprise).niveau === 'orange' ? 'bg-orange-50 border-orange-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`text-2xl ${
                              getAnalyseSituation(entreprise).niveau === 'vert' ? 'text-green-600' :
                              getAnalyseSituation(entreprise).niveau === 'orange' ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {getAnalyseSituation(entreprise).niveau === 'vert' ? '✅' :
                               getAnalyseSituation(entreprise).niveau === 'orange' ? '⚠️' : '❌'}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-lg mb-2">
                                Trésorerie potentiellement mobilisable : {formatEuro(getTresorerieMobilisable(entreprise))}
                              </p>
                              <p className="text-sm text-gray-700 italic">
                                {getAnalyseSituation(entreprise).message}
                              </p>
                            </div>
                          </div>
                          
                          {/* Détails complémentaires */}
                          <div className="mt-4 pt-4 border-t border-gray-300 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">BFR</p>
                              <p className="font-bold">{formatEuro(getBFR(entreprise))}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {entreprise.bfr !== undefined ? '✏️ Saisi manuellement' : '🔄 Calcul auto'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600">Trésorerie (Actif)</p>
                              <p className="font-bold">{formatEuro(getTresorerie(entreprise))}</p>
                              <p className="text-xs text-gray-500 mt-1">📊 Depuis Disponibilités</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Comptes courants (Passif)</p>
                              <p className="font-bold">{formatEuro(getComptesAssocies(entreprise))}</p>
                              <p className="text-xs text-gray-500 mt-1">📊 Depuis Comptes associés</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4️⃣ RÉSULTAT ET DIVIDENDES */}
                  <div className="border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${entreprise.id}-resultat`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-gray-900">4️⃣ Résultat et Dividendes</span>
                      </div>
                      {expandedSections[`${entreprise.id}-resultat`] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections[`${entreprise.id}-resultat`] && (
                      <div className="p-4 border-t-2 border-gray-200 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-gray-900">Historique des exercices</h5>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setShowOptimisation(entreprise.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md text-sm font-medium"
                            >
                              <Sparkles className="w-4 h-4" />
                              Optimiser la rémunération
                            </button>
                            <button
                              onClick={() => setShowAddExercice(entreprise.id)}
                              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                            >
                              <Plus className="w-4 h-4" />
                              Ajouter un exercice
                            </button>
                          </div>
                        </div>

                        {entreprise.exercices.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">Aucun exercice renseigné</p>
                        ) : (
                          <>
                            {/* Tableau */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Année</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Résultat net</th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-900">Dividendes</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-900">Rémunérations</th>
                                    <th className="px-4 py-3"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {entreprise.exercices.map((ex) => (
                                    <tr key={ex.id} className="border-t border-gray-200">
                                      <td className="px-4 py-3 font-medium">{ex.annee}</td>
                                      <td className={`px-4 py-3 text-right font-semibold ${ex.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatEuro(ex.resultatNet)}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-purple-600">
                                        {formatEuro(ex.dividendes)}
                                      </td>
                                      <td className="px-4 py-3">
                                        {ex.remunerations && ex.remunerations.length > 0 ? (
                                          <div className="space-y-1">
                                            {ex.remunerations.map((remun) => (
                                              <div key={remun.id} className="text-xs bg-green-50 rounded px-2 py-1 border border-green-200">
                                                <span className="font-medium text-gray-900">{remun.membreFoyer}</span>
                                                <span className="text-green-700 ml-1">({formatEuro(remun.montantBrut)})</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 text-xs italic">Aucune</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          onClick={() => handleDeleteExercice(entreprise.id, ex.id)}
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Graphique */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={entreprise.exercices.slice().reverse().map(ex => ({
                                  ...ex,
                                  remunerationsTotales: ex.remunerations?.reduce((sum, r) => sum + r.montantBrut, 0) || 0
                                }))}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="annee" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => formatEuro(value as number)} />
                                  <Legend />
                                  <Bar dataKey="resultatNet" fill="#10b981" name="Résultat net" />
                                  <Bar dataKey="dividendes" fill="#8b5cf6" name="Dividendes" />
                                  <Bar dataKey="remunerationsTotales" fill="#f59e0b" name="Rémunérations" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 5️⃣ VALORISATION DE L'ENTREPRISE */}
                  <div className="border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${entreprise.id}-valorisation`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-gray-900">💰 Valorisation de l'entreprise</span>
                      </div>
                      {expandedSections[`${entreprise.id}-valorisation`] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections[`${entreprise.id}-valorisation`] && (
                      <ValorisationSection
                        entreprise={entreprise}
                        valorisation={calculateValorisation(entreprise)}
                        params={getValorisationParams(entreprise.id)}
                        totalActif={getTotalActif(entreprise)}
                        totalPassif={getTotalPassif(entreprise)}
                        formatEuro={formatEuro}
                        updateValorisationParams={updateValorisationParams}
                        updateAjustementValorisation={updateAjustementValorisation}
                      />
                    )}
                  </div>

                  {/* 4️⃣ LIENS STRUCTURES */}
                  <div className="border-2 border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleSection(`${entreprise.id}-liens`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 text-orange-600" />
                        <span className="font-semibold text-gray-900">4️⃣ Liens entre structures</span>
                      </div>
                      {expandedSections[`${entreprise.id}-liens`] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    
                    {expandedSections[`${entreprise.id}-liens`] && (
                      <div className="p-4 border-t-2 border-gray-200 space-y-4">
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
                          <h5 className="font-semibold text-orange-900 mb-3">Statut de l'entreprise</h5>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={entreprise.estFiliale}
                                onChange={(e) => {
                                  const updated = entreprises.map(ent => 
                                    ent.id === entreprise.id ? { ...ent, estFiliale: e.target.checked } : ent
                                  );
                                  setEntreprises(updated);
                                  onUpdate?.(updated);
                                }}
                                className="w-4 h-4"
                              />
                              <label className="text-sm font-medium text-gray-900">Cette entreprise est une filiale</label>
                            </div>

                            {entreprise.estFiliale && (
                              <div className="mt-3">
                                <label className="text-xs font-medium text-gray-700 block mb-1">Société mère</label>
                                <input
                                  type="text"
                                  value={entreprise.societeMere || ''}
                                  onChange={(e) => {
                                    const updated = entreprises.map(ent => 
                                      ent.id === entreprise.id ? { ...ent, societeMere: e.target.value } : ent
                                    );
                                    setEntreprises(updated);
                                    onUpdate?.(updated);
                                  }}
                                  placeholder="Nom de la société mère"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Filiales */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                          <h5 className="font-semibold text-blue-900 mb-2">Filiales de {entreprise.nom}</h5>
                          {entreprises.filter(e => e.estFiliale && e.societeMere === entreprise.nom).length === 0 ? (
                            <p className="text-sm text-gray-600 italic">Aucune filiale détectée</p>
                          ) : (
                            <ul className="space-y-2">
                              {entreprises.filter(e => e.estFiliale && e.societeMere === entreprise.nom).map((filiale) => (
                                <li key={filiale.id} className="flex items-center gap-2 bg-white rounded p-2">
                                  <Building2 className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">{filiale.nom}</span>
                                  <span className="text-xs text-gray-500">({filiale.statutJuridique})</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      
      {/* Modal Ajouter Entreprise */}
      {showAddEntreprise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter une entreprise</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nom de l'entreprise *</label>
                <input
                  type="text"
                  value={entrepriseForm.nom || ''}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, nom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: SAS DUPONT"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Statut juridique</label>
                <select
                  value={entrepriseForm.statutJuridique}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, statutJuridique: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {STATUTS_JURIDIQUES.map(statut => (
                    <option key={statut} value={statut}>{statut}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Fiscalité</label>
                <select
                  value={entrepriseForm.fiscalite}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, fiscalite: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {FISCALITES.map(fisc => (
                    <option key={fisc} value={fisc}>{fisc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Secteur d'activité</label>
                <input
                  type="text"
                  value={entrepriseForm.secteurActivite || ''}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, secteurActivite: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Conseil, Immobilier, Commerce..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date de création</label>
                <input
                  type="date"
                  value={entrepriseForm.dateCreation || ''}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, dateCreation: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date de clôture des comptes</label>
                <input
                  type="text"
                  value={entrepriseForm.dateCloture || ''}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, dateCloture: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: 31/12"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Nom du {['SARL', 'EURL', 'SCI'].includes(entrepriseForm.statutJuridique) ? 'gérant' : 'président'}
                </label>
                <input
                  type="text"
                  value={entrepriseForm.nomDirigeant || ''}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, nomDirigeant: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={entrepriseForm.estFiliale}
                  onChange={(e) => setEntrepriseForm({...entrepriseForm, estFiliale: e.target.checked})}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">Cette entreprise est une filiale</label>
              </div>
              {entrepriseForm.estFiliale && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Société mère</label>
                  <input
                    type="text"
                    value={entrepriseForm.societeMere || ''}
                    onChange={(e) => setEntrepriseForm({...entrepriseForm, societeMere: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nom de la société mère"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddEntreprise(false)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddEntreprise}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Associé */}
      {showAddAssocie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter un associé</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Sélection de l'associé *</label>
                <select
                  value={associeForm.selection}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'autre') {
                      setAssocie({...associeForm, selection: value, nom: ''});
                    } else {
                      setAssocie({...associeForm, selection: value, nom: value});
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {getMembresFoyer().map((membre) => (
                    <option key={membre.value} value={membre.value}>
                      {membre.label}
                    </option>
                  ))}
                  <option value="autre">Autre (hors foyer fiscal)</option>
                </select>
              </div>
              
              {associeForm.selection === 'autre' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nom de l'associé *</label>
                  <input
                    type="text"
                    value={associeForm.nom || ''}
                    onChange={(e) => setAssocie({...associeForm, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nom Prénom"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Type de détention *</label>
                <select
                  value={associeForm.typeDetention}
                  onChange={(e) => setAssocie({...associeForm, typeDetention: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="pleine-propriete">Pleine propriété</option>
                  <option value="usufruit">Usufruit</option>
                  <option value="nue-propriete">Nue-propriété</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Parts (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={associeForm.parts || 0}
                  onChange={(e) => setAssocie({...associeForm, parts: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddAssocie(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAddAssocie(showAddAssocie)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Exercice */}
      {showAddExercice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ajouter un exercice</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-900">
                ℹ️ <strong>Note :</strong> Saisissez ici les éléments définitifs de l'exercice comptable. 
                Les simulations et projections se font dans un autre onglet.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Année *</label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={exerciceForm.annee || new Date().getFullYear()}
                  onChange={(e) => setExerciceForm({...exerciceForm, annee: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Résultat net (€)</label>
                <input
                  type="number"
                  value={exerciceForm.resultatNet || 0}
                  onChange={(e) => setExerciceForm({...exerciceForm, resultatNet: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Dividendes distribués (€)</label>
                <input
                  type="number"
                  value={exerciceForm.dividendes || 0}
                  onChange={(e) => setExerciceForm({...exerciceForm, dividendes: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Section Rémunérations */}
              <div className="border-t-2 border-gray-200 pt-4 mt-4">
                <h4 className="text-sm font-bold text-gray-900 mb-3">💰 Rémunérations brutes</h4>
                
                {/* Liste des rémunérations ajoutées */}
                {exerciceForm.remunerations.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {exerciceForm.remunerations.map((remun) => (
                      <div key={remun.id} className="flex items-center justify-between bg-green-50 rounded-lg p-2 border border-green-200">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{remun.membreFoyer}</p>
                          <p className="text-xs text-gray-600">{formatEuro(remun.montantBrut)} brut</p>
                        </div>
                        <button
                          onClick={() => handleRemoveRemunerationFromForm(remun.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire d'ajout de rémunération */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Membre du foyer</label>
                    <select
                      value={remunerationForm.membreFoyer}
                      onChange={(e) => setRemunerationForm({...remunerationForm, membreFoyer: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Sélectionner un membre</option>
                      {getMembresFoyer().map(membre => (
                        <option key={membre.value} value={membre.label}>
                          {membre.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Montant brut (€)</label>
                    <input
                      type="number"
                      value={remunerationForm.montantBrut || 0}
                      onChange={(e) => setRemunerationForm({...remunerationForm, montantBrut: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Ex: 45000"
                    />
                  </div>
                  <button
                    onClick={handleAddRemunerationToForm}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter cette rémunération
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddExercice(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAddExercice(showAddExercice)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Actif */}
      {showAddActif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter un actif</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Libellé *</label>
                <input
                  type="text"
                  value={actifForm.libelle || ''}
                  onChange={(e) => setActifForm({...actifForm, libelle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Véhicule de fonction"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Valeur (€) *</label>
                <input
                  type="number"
                  value={actifForm.valeur || 0}
                  onChange={(e) => setActifForm({...actifForm, valeur: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddActif(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAddAutreActif(showAddActif)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajouter Passif */}
      {showAddPassif && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ajouter un passif</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Libellé *</label>
                <input
                  type="text"
                  value={passifForm.libelle || ''}
                  onChange={(e) => setPassifForm({...passifForm, libelle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ex: Emprunt bancaire court terme"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Valeur (€) *</label>
                <input
                  type="number"
                  value={passifForm.valeur || 0}
                  onChange={(e) => setPassifForm({...passifForm, valeur: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddPassif(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleAddAutrePassif(showAddPassif)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Optimisation Rémunération */}
      {showOptimisation && (() => {
        const entreprise = entreprises.find(e => e.id === showOptimisation);
        if (!entreprise) return null;
        
        return (
          <OptimisationRemunerationModal
            entreprise={{
              id: entreprise.id,
              nom: entreprise.nom,
              formeJuridique: entreprise.formeJuridique,
              capital: entreprise.capital,
              compteCourant: entreprise.compteCourantAssocie,
              regimeFiscal: entreprise.regimeFiscal,
              exercices: entreprise.exercices
            }}
            foyerData={{
              autresRevenus: 0,
              nbParts: 1
            }}
            onClose={() => setShowOptimisation(null)}
            onApply={(remuneration, dividendes) => {
              // Optionnel : appliquer automatiquement les valeurs dans un nouvel exercice
              toast.success(`Scénario appliqué : ${formatEuro(remuneration)} en rémunération + ${formatEuro(dividendes)} en dividendes`);
            }}
          />
        );
      })()}
    </div>
  );
}