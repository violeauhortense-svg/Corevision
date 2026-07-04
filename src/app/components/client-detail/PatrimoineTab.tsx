import { useState } from 'react';
import { 
  Edit, Plus, Trash2, ChevronUp, ChevronDown,
  Home, Briefcase, CreditCard, Building2, Wallet 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { toast } from 'sonner';
import type { PatrimoineItem } from './types';
import { PatrimoineProfessionnel } from './PatrimoineProfessionnel';
import { ActifFinancierForm } from '../ActifFinancierForm';
import { ActifImmobilierForm } from '../ActifImmobilierForm';
import { PassifForm } from '../PassifForm';
import type { ActifFinancier, ActifImmobilier, Passif } from '../../types/client';

interface PatrimoineTabProps {
  actifsFinanciers: PatrimoineItem[];
  immobilier: PatrimoineItem[];
  passifs: PatrimoineItem[];
  onUpdateActifs: (actifs: PatrimoineItem[]) => void;
  onUpdateImmobilier: (immobilier: PatrimoineItem[]) => void;
  onUpdatePassifs: (passifs: PatrimoineItem[]) => void;
  clientData?: any;
  familyInfo?: any;
  // 🆕 NOUVEAU : Props pour le patrimoine professionnel
  entreprises?: any[];
  onUpdateEntreprises?: (entreprises: any[]) => void;
}

type ViewMode = 'personnel' | 'professionnel';

export function PatrimoineTab({
  actifsFinanciers,
  immobilier,
  passifs,
  onUpdateActifs,
  onUpdateImmobilier,
  onUpdatePassifs,
  clientData,
  familyInfo,
  entreprises,
  onUpdateEntreprises,
}: PatrimoineTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('personnel');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // États pour les formulaires
  const [showActifFinancierForm, setShowActifFinancierForm] = useState(false);
  const [showActifImmobilierForm, setShowActifImmobilierForm] = useState(false);
  const [showPassifForm, setShowPassifForm] = useState(false);

  // 🆕 États pour le patrimoine professionnel
  const [societes, setSocietes] = useState<PatrimoineItem[]>([]);
  const [comptesCourants, setComptesCourants] = useState<PatrimoineItem[]>([]);
  const [dividendesAPercevoir, setDividendesAPercevoir] = useState(0);
  const [tresoreriePro, setTresoreriePro] = useState(0);

  // Calculs des totaux PERSONNELS
  const totalActifsFinanciers = actifsFinanciers.reduce((sum, a) => sum + a.value, 0);
  const totalImmobilier = immobilier.reduce((sum, i) => sum + i.value, 0);
  const totalPassifs = passifs.reduce((sum, p) => sum + p.value, 0);
  const patrimoineNetPersonnel = totalActifsFinanciers + totalImmobilier - totalPassifs;

  // Calculs des totaux PROFESSIONNELS
  const totalSocietes = societes.reduce((sum, s) => sum + s.value, 0);
  const totalComptesCourants = comptesCourants.reduce((sum, c) => sum + c.value, 0);
  const patrimoineNetProfessionnel = totalSocietes + totalComptesCourants + dividendesAPercevoir + tresoreriePro;

  // Total global
  const patrimoineNetTotal = patrimoineNetPersonnel + patrimoineNetProfessionnel;

  // Catégories
  const categoriesActifs = [
    { value: 'assurance_vie', label: 'Assurance-vie' },
    { value: 'pea', label: 'PEA' },
    { value: 'cto', label: 'Compte-titres ordinaire' },
    { value: 'per', label: 'PER' },
    { value: 'livret_a', label: 'Livret A' },
    { value: 'ldds', label: 'LDDS' },
    { value: 'lep', label: 'LEP' },
    { value: 'compte_courant', label: 'Compte courant' },
    { value: 'autre', label: 'Autre' },
  ];

  const categoriesImmobilier = [
    { value: 'residence_principale', label: 'Résidence principale' },
    { value: 'residence_secondaire', label: 'Résidence secondaire' },
    { value: 'locatif_nu', label: 'Locatif nu' },
    { value: 'locatif_meuble', label: 'Locatif meublé' },
    { value: 'scpi', label: 'SCPI' },
    { value: 'sci', label: 'SCI' },
    { value: 'terrain', label: 'Terrain' },
    { value: 'autre', label: 'Autre' },
  ];

  const categoriesPassifs = [
    { value: 'pret_immobilier', label: 'Prêt immobilier' },
    { value: 'credit_consommation', label: 'Crédit à la consommation' },
    { value: 'pret_etudiant', label: 'Prêt étudiant' },
    { value: 'autre', label: 'Autre' },
  ];

  // Données pour les graphiques
  const chartDataPersonnel = [
    { name: 'Actifs financiers', value: totalActifsFinanciers, color: '#3b82f6', id: 'personnel-actifs' },
    { name: 'Immobilier', value: totalImmobilier, color: '#10b981', id: 'personnel-immo' },
    { name: 'Passifs', value: totalPassifs, color: '#ef4444', id: 'personnel-passifs' },
  ].filter((item) => item.value > 0);

  const chartDataGlobal = [
    { name: 'Patrimoine personnel', value: patrimoineNetPersonnel, color: '#3b82f6', id: 'global-personnel' },
    { name: 'Patrimoine professionnel', value: patrimoineNetProfessionnel, color: '#f59e0b', id: 'global-professionnel' },
  ].filter((item) => item.value > 0);

  // Handler pour ajouter un actif financier
  const handleAddActifFinancier = (actif: Omit<ActifFinancier, 'id' | 'color'>) => {
    const now = new Date().toISOString();
    const newActif: PatrimoineItem = {
      id: `actif-${Date.now()}`,
      name: actif.name,
      value: actif.value,
      category: actif.type.toLowerCase().replace(/-/g, '_'),
      type: actif.type,
      dateOuverture: actif.dateOuverture,
      clauseBeneficiaire: actif.clauseBeneficiaire,
      clausePersonnalisee: actif.clausePersonnalisee,
      dateCreation: now,
      dateModification: now,
    };
    const updatedActifs = [...actifsFinanciers, newActif];
    onUpdateActifs(updatedActifs);
    setShowActifFinancierForm(false);
    toast.success('Actif financier ajouté !');
  };

  // Handler pour ajouter un actif immobilier
  const handleAddActifImmobilier = (actif: Omit<ActifImmobilier, 'id' | 'color'>) => {
    const now = new Date().toISOString();
    const newActif: PatrimoineItem = {
      id: `immo-${Date.now()}`,
      name: actif.name,
      value: actif.valeurActuelle,
      category: actif.type.toLowerCase().replace(/ /g, '_'),
      type: actif.type,
      dateAcquisition: actif.dateAcquisition,
      prixAcquisition: actif.prixAcquisition,
      valeurActuelle: actif.valeurActuelle,
      regimeFiscal: actif.regimeFiscal,
      autresPrecision: actif.autresPrecision,
      loyerAnnuel: actif.loyerAnnuel,
      dateCreation: now,
      dateModification: now,
    };
    const updatedImmobilier = [...immobilier, newActif];
    onUpdateImmobilier(updatedImmobilier);
    setShowActifImmobilierForm(false);
    toast.success('Actif immobilier ajouté !');
  };

  // Handler pour ajouter un passif
  const handleAddPassif = (passif: Omit<Passif, 'id' | 'color'>) => {
    const now = new Date().toISOString();
    const newPassif: PatrimoineItem = {
      id: `passif-${Date.now()}`,
      name: passif.name,
      value: passif.capitalRestantDu,
      category: passif.type,
      typePassif: passif.type,
      linkedActifId: passif.linkedActifId,
      linkedActifName: passif.linkedActifName,
      capitalInitial: passif.capitalInitial,
      tauxEmprunt: passif.tauxEmprunt,
      typeTaux: passif.typeTaux,
      dateDebut: passif.dateDebut,
      nombreEcheances: passif.nombreEcheances,
      dateFin: passif.dateFin,
      capitalRestantDu: passif.capitalRestantDu,
      mensualite: passif.mensualite,
      dureeInitiale: passif.dureeInitiale,
      dureeRestante: passif.dureeRestante,
      echeancesRestantes: passif.echeancesRestantes,
      dateCreation: now,
      dateModification: now,
    };
    const updatedPassifs = [...passifs, newPassif];
    onUpdatePassifs(updatedPassifs);
    setShowPassifForm(false);
    toast.success('Passif ajouté !');
  };

  // Supprimer un élément
  const handleDeleteItem = (item: PatrimoineItem, type: 'actif' | 'immobilier' | 'passif') => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return;

    if (type === 'actif') {
      onUpdateActifs(actifsFinanciers.filter(a => a.id !== item.id));
    } else if (type === 'immobilier') {
      onUpdateImmobilier(immobilier.filter(i => i.id !== item.id));
    } else if (type === 'passif') {
      onUpdatePassifs(passifs.filter(p => p.id !== item.id));
    }

    toast.success('Élément supprimé');
  };

  // Formater les montants
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Rendu d'une carte de section
  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: PatrimoineItem[],
    total: number,
    color: string,
    type: 'actif' | 'immobilier' | 'passif',
    categories: Array<{ value: string; label: string }>,
    onAdd: () => void
  ) => {
    const sectionKey = `${type}-section`;
    const isExpanded = expandedSection === sectionKey;

    return (
      <div className={`bg-white border-2 ${color} rounded-lg overflow-hidden`}>
        <div className="p-4 flex items-center justify-between hover:bg-gray-50">
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          >
            {icon}
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{items.length} élément(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-900">{formatAmount(total)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              title="Ajouter un élément"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Aucun élément</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      {item.category && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {categories.find(c => c.value === item.category)?.label || item.category}
                        </span>
                      )}
                    </div>
                    {item.type && <p className="text-xs text-gray-500 mt-1">Type: {item.type}</p>}
                    {item.dateAcquisition && (
                      <p className="text-xs text-gray-500">Acquisition: {new Date(item.dateAcquisition).toLocaleDateString('fr-FR')}</p>
                    )}
                    {item.loyerAnnuel && item.loyerAnnuel > 0 && (
                      <p className="text-xs text-gray-500">Loyer annuel: {formatAmount(item.loyerAnnuel)}</p>
                    )}
                    {item.capitalRestantDu && (
                      <p className="text-xs text-gray-500">CRD: {formatAmount(item.capitalRestantDu)}</p>
                    )}
                    {item.mensualite && item.mensualite > 0 && (
                      <p className="text-xs text-gray-500">Mensualité: {formatAmount(item.mensualite)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{formatAmount(item.value)}</span>
                    <button
                      onClick={() => handleDeleteItem(item, type)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // Convertir les actifs immobiliers pour le PassifForm
  const actifsImmobiliersForPassif: ActifImmobilier[] = immobilier.map(item => ({
    id: item.id,
    name: item.name,
    value: item.value,
    type: (item.type || 'Résidence principale') as any,
    dateAcquisition: item.dateAcquisition || '',
    prixAcquisition: item.prixAcquisition || 0,
    valeurActuelle: item.valeurActuelle || item.value,
    regimeFiscal: item.regimeFiscal,
    autresPrecision: item.autresPrecision,
    loyerAnnuel: item.loyerAnnuel,
    color: item.color || '#10b981',
  }));

  return (
    <div className="space-y-6">
      {/* En-tête avec switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900">Patrimoine</h2>
        </div>

        {/* Toggle Personnel / Professionnel */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('personnel')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'personnel'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home className="w-4 h-4 inline mr-2" />
            Personnel
          </button>
          <button
            onClick={() => setViewMode('professionnel')}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'professionnel'
                ? 'bg-white text-orange-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Professionnel
          </button>
        </div>
      </div>

      {/* Carte synthèse globale */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Patrimoine personnel net</p>
            <p className="text-3xl font-bold text-blue-600">{formatAmount(patrimoineNetPersonnel)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Patrimoine professionnel net</p>
            <p className="text-3xl font-bold text-orange-600">{formatAmount(patrimoineNetProfessionnel)}</p>
          </div>
          <div className="text-center border-l-2 border-purple-300">
            <p className="text-sm text-gray-600 mb-1">Patrimoine NET TOTAL</p>
            <p className="text-4xl font-bold text-purple-600">{formatAmount(patrimoineNetTotal)}</p>
          </div>
        </div>

        {/* Graphique global */}
        {chartDataGlobal.length > 0 && (
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartDataGlobal}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / patrimoineNetTotal) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartDataGlobal.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatAmount(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* VUE PATRIMOINE PERSONNEL */}
      {viewMode === 'personnel' && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Home className="w-6 h-6 text-blue-600" />
            Patrimoine personnel
          </h3>

          {/* Graphique détaillé personnel */}
          {chartDataPersonnel.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Répartition du patrimoine personnel</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartDataPersonnel}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatAmount(entry.value)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartDataPersonnel.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}\
                  </Pie>
                  <Tooltip formatter={(value: number) => formatAmount(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Section Actifs financiers */}
          {renderSection(
            'Actifs financiers',
            <Briefcase className="w-6 h-6 text-blue-600" />,
            actifsFinanciers,
            totalActifsFinanciers,
            'border-blue-200',
            'actif',
            categoriesActifs,
            () => setShowActifFinancierForm(true)
          )}

          {/* Section Immobilier */}
          {renderSection(
            'Patrimoine immobilier',
            <Home className="w-6 h-6 text-green-600" />,
            immobilier,
            totalImmobilier,
            'border-green-200',
            'immobilier',
            categoriesImmobilier,
            () => setShowActifImmobilierForm(true)
          )}

          {/* Section Passifs */}
          {renderSection(
            'Passifs',
            <CreditCard className="w-6 h-6 text-red-600" />,
            passifs,
            totalPassifs,
            'border-red-200',
            'passif',
            categoriesPassifs,
            () => setShowPassifForm(true)
          )}
        </div>
      )}

      {/* VUE PATRIMOINE PROFESSIONNEL */}
      {viewMode === 'professionnel' && (
        <PatrimoineProfessionnel 
          clientData={clientData}
          familyInfo={familyInfo}
          entreprises={entreprises}
          onUpdate={onUpdateEntreprises} 
        />
      )}

      {/* FORMULAIRE D'AJOUT ACTIF FINANCIER */}
      {showActifFinancierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <ActifFinancierForm
              onAdd={handleAddActifFinancier}
              onCancel={() => setShowActifFinancierForm(false)}
              familyInfo={familyInfo || { spouse: null, children: [], maritalStatus: 'Célibataire' }}
              clientName={clientData ? `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() : 'Client'}
            />
          </div>
        </div>
      )}

      {/* FORMULAIRE D'AJOUT ACTIF IMMOBILIER */}
      {showActifImmobilierForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <ActifImmobilierForm
              onAdd={handleAddActifImmobilier}
              onCancel={() => setShowActifImmobilierForm(false)}
              familyInfo={familyInfo || { spouse: null }}
              clientName={clientData?.nom ? `${clientData.prenom || ''} ${clientData.nom}`.trim() : 'Client'}
            />
          </div>
        </div>
      )}

      {/* FORMULAIRE D'AJOUT PASSIF */}
      {showPassifForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl">
            <PassifForm
              actifsImmobiliers={actifsImmobiliersForPassif}
              onAdd={handleAddPassif}
              onCancel={() => setShowPassifForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}