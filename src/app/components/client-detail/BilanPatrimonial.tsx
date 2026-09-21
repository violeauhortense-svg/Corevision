import { useLayoutEffect, useRef, useState } from 'react';
import { X, FileText, CornerDownRight } from 'lucide-react';
import type { ClientData, FamilyInfo, PatrimoineItem, RevenuItem, ImpositionData, Objectif } from './types';

// Formes libres ici (pas d'import du type Entreprise, non exporté par
// PatrimoineProfessionnel.tsx) - seuls les champs effectivement lus sont
// déclarés, le reste passe par l'index signature.
interface EntrepriseAssocie {
  nom: string;
  parts: number;
  typeDetention: 'pleine-propriete' | 'usufruit' | 'nue-propriete';
  membreFoyer?: boolean;
}
interface EntrepriseBilan {
  id: string;
  nom: string;
  statutJuridique: string;
  fiscalite?: string;
  associes?: EntrepriseAssocie[];
  estFiliale?: boolean;
  societeMere?: string;
  passifs?: { capitalSocial?: number; reservesLegales?: number; reservesLibres?: number };
  [key: string]: any;
}

interface BilanPatrimonialProps {
  clientData: ClientData;
  familyInfo: FamilyInfo;
  actifsFinanciers: PatrimoineItem[];
  immobilier: PatrimoineItem[];
  passifs: PatrimoineItem[];
  revenus: RevenuItem[];
  imposition: ImpositionData;
  objectifs: Objectif[];
  entreprises: EntrepriseBilan[];
  onClose: () => void;
}

const TYPE_DETENTION_LABELS: Record<string, string> = {
  'pleine-propriete': 'pleine propriété',
  'usufruit': 'usufruit',
  'nue-propriete': 'nue-propriété',
};

function getCapitauxPropres(e: EntrepriseBilan): number {
  return (e.passifs?.capitalSocial || 0) + (e.passifs?.reservesLegales || 0) + (e.passifs?.reservesLibres || 0);
}

const CATEGORIE_LABELS: Record<string, string> = {
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

function calculateAge(birthDate?: string): number | null {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  if (isNaN(bd.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const monthDiff = today.getMonth() - bd.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < bd.getDate())) {
    age--;
  }
  return age;
}

export function BilanPatrimonial({
  clientData,
  familyInfo,
  actifsFinanciers,
  immobilier,
  passifs,
  revenus,
  imposition,
  objectifs,
  entreprises,
  onClose,
}: BilanPatrimonialProps) {
  const calculateTotal = (items: PatrimoineItem[]) => items.reduce((sum, item) => sum + (item.value || 0), 0);

  const totalActifsFinanciers = calculateTotal(actifsFinanciers || []);
  const totalActifsImmobiliers = calculateTotal(immobilier || []);
  const totalPassifs = calculateTotal(passifs || []);
  const totalPatrimoineProfessionnel = (entreprises || []).reduce((sum, e) => sum + getCapitauxPropres(e), 0);
  const patrimoineNet = totalActifsFinanciers + totalActifsImmobiliers - totalPassifs + totalPatrimoineProfessionnel;

  const totalRevenus = (revenus || []).reduce((sum, r) => sum + (r.montantAnnuel || 0), 0);

  const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value || 0);

  const clientAge = calculateAge(clientData?.birthDate);
  const spouse = familyInfo?.spouse;
  const spouseAge = calculateAge(spouse?.birthDate);
  const children = familyInfo?.children || [];
  const objectifsInclus = (objectifs || []).filter((o) => o.included);

  // Schéma de détention : les entreprises "racines" (pas filiales, ou dont
  // la société mère n'est pas elle-même dans la liste) portent l'arbre ;
  // chaque filiale est rattachée à sa mère par égalité stricte de nom
  // (même logique que "Filiales de X" dans l'onglet Patrimoine).
  const entreprisesList = entreprises || [];
  const getFiliales = (nom: string) => entreprisesList.filter((e) => e.estFiliale && e.societeMere === nom);
  const entreprisesRacines = entreprisesList.filter(
    (e) => !e.estFiliale || !e.societeMere || !entreprisesList.some((m) => m.nom === e.societeMere)
  );

  // Nom complet -> civilité, pour choisir l'icône 👨/👩 des associés
  // "membre du foyer" dans le schéma de détention (même construction de nom
  // que getMembresFoyer() dans PatrimoineProfessionnel.tsx).
  const genreMap = new Map<string, 'homme' | 'femme' | undefined>();
  if (clientData?.firstName) {
    genreMap.set(`${clientData.firstName} ${clientData.lastName}`.trim(), clientData.genre);
  }
  if (spouse?.firstName) {
    genreMap.set(`${spouse.firstName} ${spouse.lastName}`.trim(), spouse.genre);
  }
  children.forEach((c) => {
    if (c.firstName) {
      genreMap.set(`${c.firstName} ${c.lastName || clientData?.lastName || ''}`.trim(), c.genre);
    }
  });

  // Une personne physique associée à plusieurs entreprises ne doit
  // apparaître qu'une seule fois dans le schéma - on regroupe donc ses
  // détentions (une ligne par entreprise, avec son %) sous un unique
  // avatar, plutôt que de répéter l'avatar dans chaque bulle.
  const personnesPhysiques = new Map<string, { genre?: 'homme' | 'femme'; holdings: { entreprise: string; parts: number; typeDetention: string }[] }>();
  entreprisesList.forEach((e) => {
    (e.associes || []).forEach((a) => {
      if (!a.membreFoyer) return;
      if (!personnesPhysiques.has(a.nom)) {
        personnesPhysiques.set(a.nom, { genre: genreMap.get(a.nom), holdings: [] });
      }
      personnesPhysiques.get(a.nom)!.holdings.push({ entreprise: e.nom, parts: a.parts, typeDetention: a.typeDetention });
    });
  });

  // Traits reliant chaque personne physique aux entreprises qu'elle
  // détient : on mesure la position réelle de l'avatar et de chaque bulle
  // après rendu (leurs refs sont enregistrées par les enfants) pour tracer
  // un <svg> par-dessus, plutôt que de deviner des coordonnées.
  const diagramRef = useRef<HTMLDivElement>(null);
  const personRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const bubbleRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [detentionLines, setDetentionLines] = useState<{ key: string; x1: number; y1: number; x2: number; y2: number; parts: number }[]>([]);

  useLayoutEffect(() => {
    const computeLines = () => {
      const container = diagramRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const next: { key: string; x1: number; y1: number; x2: number; y2: number; parts: number }[] = [];

      personnesPhysiques.forEach((p, nom) => {
        const personEl = personRefs.current.get(nom);
        if (!personEl) return;
        const personRect = personEl.getBoundingClientRect();
        const x1 = personRect.left + personRect.width / 2 - containerRect.left;
        const y1 = personRect.bottom - containerRect.top;

        p.holdings.forEach((h, i) => {
          const bubbleEl = bubbleRefs.current.get(h.entreprise);
          if (!bubbleEl) return;
          const bubbleRect = bubbleEl.getBoundingClientRect();
          const x2 = bubbleRect.left + bubbleRect.width / 2 - containerRect.left;
          const y2 = bubbleRect.top - containerRect.top;
          next.push({ key: `${nom}-${h.entreprise}-${i}`, x1, y1, x2, y2, parts: h.parts });
        });
      });

      setDetentionLines(next);
    };

    computeLines();
    window.addEventListener('resize', computeLines);
    return () => window.removeEventListener('resize', computeLines);
  }, [entreprisesList, personnesPhysiques.size]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Bilan Patrimonial - {clientData.firstName} {clientData.lastName}</h2>
              <p className="text-blue-100 text-sm">
                Document de synthèse - {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1 : COMPOSITION DU FOYER */}
          <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              👥 1. COMPOSITION DU FOYER
            </h3>

            {(familyInfo?.maritalStatus || familyInfo?.regimeMatrimonial) && (
              <div className="bg-white rounded-lg border-2 border-pink-200 p-5 mb-4 shadow-sm">
                <h4 className="font-semibold text-pink-900 mb-4 flex items-center gap-2">
                  💑 Régime matrimonial
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {familyInfo?.maritalStatus && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Situation familiale</p>
                      <p className="font-semibold text-gray-900">{familyInfo.maritalStatus}</p>
                    </div>
                  )}
                  {familyInfo?.regimeMatrimonial && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Régime matrimonial</p>
                      <p className="font-semibold text-gray-900">{familyInfo.regimeMatrimonial}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* CLIENT PRINCIPAL */}
              <div className="bg-white rounded-lg border-2 border-blue-300 p-5 shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                    {clientData.firstName?.charAt(0)}{clientData.lastName?.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                        👤 CLIENT PRINCIPAL
                      </span>
                      {clientData.majorationPartFiscale && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                          ⭐ Majoration
                        </span>
                      )}
                      {clientAge !== null && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {clientAge} ans
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-bold text-gray-900 mb-3">
                      {clientData.firstName} {clientData.lastName}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {clientData.birthDate && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">🎂 Date de naissance :</span>
                          <span className="font-medium text-gray-900">{clientData.birthDate}</span>
                        </div>
                      )}
                      {clientData.activite && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">💼 Activité :</span>
                          <span className="font-medium text-gray-900">{clientData.activite}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">✉️ Email :</span>
                        <span className="font-medium text-gray-900">{clientData.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">📱 Téléphone :</span>
                        <span className="font-medium text-gray-900">{clientData.phone}</span>
                      </div>
                      {clientData.address && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <span className="text-gray-500">🏠 Adresse :</span>
                          <span className="font-medium text-gray-900">{clientData.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONJOINT */}
              {spouse && spouse.firstName && (
                <div className="bg-white rounded-lg border-2 border-pink-300 p-5 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                      {spouse.firstName?.charAt(0)}{spouse.lastName?.charAt(0)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-bold">
                          💑 CONJOINT
                        </span>
                        {spouse.majorationPartFiscale && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                            ⭐ Majoration
                          </span>
                        )}
                        {spouseAge !== null && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded text-xs font-semibold">
                            {spouseAge} ans
                          </span>
                        )}
                      </div>

                      <h4 className="text-xl font-bold text-gray-900 mb-3">
                        {spouse.firstName} {spouse.lastName}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {spouse.birthDate && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">🎂 Date de naissance :</span>
                            <span className="font-medium text-gray-900">{spouse.birthDate}</span>
                          </div>
                        )}
                        {spouse.profession && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">💼 Profession :</span>
                            <span className="font-medium text-gray-900">{spouse.profession}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ENFANTS */}
              {children.map((enfant, index) => {
                const age = calculateAge(enfant.birthDate);
                let lienParente = '';
                if (enfant.isChildOfClient && enfant.isChildOfSpouse) {
                  lienParente = 'Enfant commun';
                } else if (enfant.isChildOfClient) {
                  lienParente = 'Enfant du client';
                } else if (enfant.isChildOfSpouse) {
                  lienParente = 'Enfant du conjoint';
                }

                return (
                  <div key={enfant.id || index} className="bg-white rounded-lg border-2 border-green-300 p-5 shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg">
                        {enfant.firstName?.charAt(0)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                            👶 ENFANT {index + 1}
                          </span>
                          {age !== null && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                              {age} an{age > 1 ? 's' : ''}
                            </span>
                          )}
                          {enfant.isChargeFiscale && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                              💰 À charge fiscalement
                            </span>
                          )}
                          {enfant.majorationPartFiscale && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                              ⭐ Majoration
                            </span>
                          )}
                        </div>

                        <h4 className="text-xl font-bold text-gray-900 mb-3">
                          {enfant.firstName}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {enfant.birthDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">🎂 Date de naissance :</span>
                              <span className="font-medium text-gray-900">{enfant.birthDate}</span>
                            </div>
                          )}
                          {lienParente && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">👨‍👩‍👧 Lien de parenté :</span>
                              <span className="font-medium text-gray-900">{lienParente}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2 : PATRIMOINE */}
          <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
            <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
              💰 2. PATRIMOINE
            </h3>

            <div className="bg-white p-4 rounded-lg border border-green-300 mb-4">
              <h4 className="font-semibold text-green-800 mb-3">📊 Vue d'ensemble</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">Actifs financiers</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(totalActifsFinanciers)}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="text-xs text-purple-600 font-medium mb-1">Actifs immobiliers</p>
                  <p className="text-lg font-bold text-purple-900">{formatCurrency(totalActifsImmobiliers)}</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Patrimoine pro.</p>
                  <p className="text-lg font-bold text-indigo-900">{formatCurrency(totalPatrimoineProfessionnel)}</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-xs text-red-600 font-medium mb-1">Passifs</p>
                  <p className="text-lg font-bold text-red-900">{formatCurrency(totalPassifs)}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded border-2 border-green-400">
                  <p className="text-xs text-green-600 font-medium mb-1">PATRIMOINE NET</p>
                  <p className="text-xl font-bold text-green-900">{formatCurrency(patrimoineNet)}</p>
                </div>
              </div>
            </div>

            {entreprisesList.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">🏢 Patrimoine professionnel</h4>
                <div className="space-y-2">
                  {entreprisesList.map((e) => (
                    <div key={e.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">
                        {e.nom} <span className="text-xs text-gray-500">({e.statutJuridique})</span>
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(getCapitauxPropres(e))}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2 italic">
                  💡 Valeur = capitaux propres (capital social + réserves) de chaque société
                </p>
              </div>
            )}

            {actifsFinanciers && actifsFinanciers.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">💳 Actifs financiers</h4>
                <div className="space-y-2">
                  {actifsFinanciers.map((actif) => (
                    <div key={actif.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{actif.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(actif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {immobilier && immobilier.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-green-200 mb-3">
                <h4 className="font-semibold text-green-800 mb-3">🏠 Actifs immobiliers</h4>
                <div className="space-y-2">
                  {immobilier.map((actif) => (
                    <div key={actif.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm text-gray-700">{actif.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(actif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {passifs && passifs.length > 0 && (
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3">📉 Passifs (Dettes)</h4>
                <div className="space-y-2">
                  {passifs.map((passif) => (
                    <div key={passif.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm text-gray-700">{passif.name}</span>
                      <span className="text-sm font-semibold text-red-900">{formatCurrency(passif.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3 : SCHÉMA DE DÉTENTION */}
          <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
            <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
              🔗 3. SCHÉMA DE DÉTENTION
            </h3>

            {entreprisesRacines.length === 0 ? (
              <div className="bg-white p-4 rounded-lg border border-indigo-200 text-center text-gray-500">
                Aucune entreprise renseignée pour ce client
              </div>
            ) : (
              <div ref={diagramRef} className="relative">
                {/* Traits reliant chaque personne physique aux entreprises
                    qu'elle détient, tracés par-dessus le contenu à partir
                    des positions réelles mesurées après rendu. */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                  {detentionLines.map((l) => {
                    const midX = (l.x1 + l.x2) / 2;
                    const midY = (l.y1 + l.y2) / 2;
                    return (
                      <g key={l.key}>
                        <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#818cf8" strokeWidth={2} />
                        <rect x={midX - 16} y={midY - 9} width={32} height={18} rx={9} fill="white" stroke="#818cf8" />
                        <text x={midX} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#4338ca">
                          {l.parts}%
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="relative" style={{ zIndex: 1 }}>
                  {/* Personnes physiques - une seule fois chacune, même si
                      associées à plusieurs entreprises, avec le détail de
                      chaque détention (entreprise + %) en dessous, et un
                      trait tracé vers chaque bulle concernée. */}
                  {personnesPhysiques.size > 0 && (
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                      {Array.from(personnesPhysiques.entries()).map(([nom, p]) => (
                        <div key={nom} className="bg-white rounded-xl border-2 border-sky-300 p-3 shadow-sm w-44 flex flex-col items-center">
                          <div
                            ref={(el) => {
                              if (el) personRefs.current.set(nom, el);
                              else personRefs.current.delete(nom);
                            }}
                            className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md border-2 bg-sky-50 border-sky-300"
                          >
                            {p.genre === 'homme' ? '👨' : p.genre === 'femme' ? '👩' : '🧑'}
                          </div>
                          <span className="text-sm font-semibold text-gray-900 mt-1 text-center">{nom}</span>
                          <div className="w-full mt-2 space-y-1">
                            {p.holdings.map((h, i) => (
                              <div key={i} className="flex items-center justify-between text-xs bg-sky-50 rounded px-2 py-1">
                                <span className="text-gray-700 truncate">🏢 {h.entreprise}</span>
                                <span className="font-bold text-indigo-700 shrink-0 ml-1">{h.parts}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-center gap-8">
                    {entreprisesRacines.map((e) => (
                      <EntrepriseDetentionNode
                        key={e.id}
                        entreprise={e}
                        getFiliales={getFiliales}
                        depth={0}
                        registerBubble={(nom, el) => {
                          if (el) bubbleRefs.current.set(nom, el);
                          else bubbleRefs.current.delete(nom);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4 : REVENUS ET IMPOSITION */}
          <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
            <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              💼 4. REVENUS ET IMPOSITION
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Revenus */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">💵 Revenus annuels</h4>
                {revenus && revenus.length > 0 ? (
                  <div className="space-y-2">
                    {revenus.map((r) => (
                      <div key={r.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {CATEGORIE_LABELS[r.categorie] || r.categorie} ({r.beneficiaireNom})
                        </span>
                        <span className="font-semibold text-gray-900">{formatCurrency(r.montantAnnuel)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-purple-200">
                      <span className="font-semibold text-purple-900">Total</span>
                      <span className="font-bold text-purple-900">{formatCurrency(totalRevenus)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun revenu renseigné</p>
                )}
              </div>

              {/* Imposition */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3">📊 Situation fiscale</h4>
                <div className="space-y-3">
                  {imposition?.impotRevenu ? (
                    <div>
                      <span className="text-xs text-gray-600">Impôt sur le revenu</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(imposition.impotRevenu)}</p>
                    </div>
                  ) : null}
                  {imposition?.tmi && (
                    <div>
                      <span className="text-xs text-gray-600">Tranche Marginale d'Imposition</span>
                      <p className="text-lg font-semibold text-purple-900">{imposition.tmi} %</p>
                    </div>
                  )}
                  {imposition?.prelevementsSociaux ? (
                    <div>
                      <span className="text-xs text-gray-600">Prélèvements sociaux</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(imposition.prelevementsSociaux)}</p>
                    </div>
                  ) : null}
                  {imposition?.ifi ? (
                    <div>
                      <span className="text-xs text-gray-600">IFI</span>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(imposition.ifi)}</p>
                    </div>
                  ) : null}
                  {imposition?.nombreParts && (
                    <div>
                      <span className="text-xs text-gray-600">Nombre de parts fiscales</span>
                      <p className="text-lg font-semibold text-gray-900">{imposition.nombreParts}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5 : OBJECTIFS */}
          <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50">
            <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
              🎯 5. OBJECTIFS PATRIMONIAUX
            </h3>

            {objectifsInclus.length > 0 ? (
              <div className="space-y-3">
                {objectifsInclus.map((objectif, index) => (
                  <div
                    key={objectif.id || index}
                    className="bg-white p-4 rounded-lg border border-orange-200"
                  >
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-orange-900">
                          {objectif.category}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">
                          {objectif.description}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 ml-3 shrink-0">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded whitespace-nowrap">
                          ✓ Inclus
                        </span>
                        {objectif.mandatory && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded whitespace-nowrap">
                            ⚠️ Obligatoire
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-lg border border-orange-200 text-center text-gray-500">
                Aucun objectif patrimonial retenu
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// Un nœud de l'arbre de détention : les associés personnes morales (autres
// entreprises), en bulle au-dessus de la bulle de l'entreprise - les
// personnes physiques sont affichées une seule fois, globalement, au-dessus
// de tout l'arbre (voir personnesPhysiques dans BilanPatrimonial) - et
// récursivement les filiales (rattachées par égalité stricte de nom, même
// logique que "Filiales de X" dans l'onglet Patrimoine) en dessous, avec le
// % de détention de la mère indiqué sur le lien.
function EntrepriseDetentionNode({
  entreprise,
  getFiliales,
  depth,
  registerBubble,
}: {
  entreprise: EntrepriseBilan;
  getFiliales: (nom: string) => EntrepriseBilan[];
  depth: number;
  registerBubble: (nom: string, el: HTMLDivElement | null) => void;
}) {
  const filiales = getFiliales(entreprise.nom);
  const allAssocies = entreprise.associes || [];
  // Part de la société mère dans cette filiale, pour l'afficher sur le lien
  // "↳ filiale" plutôt que comme une associée en double de sa propre bulle.
  const mereAssocie = entreprise.estFiliale && entreprise.societeMere
    ? allAssocies.find((a) => a.nom === entreprise.societeMere)
    : undefined;
  // Associés personnes morales seulement - les personnes physiques sont
  // regroupées une seule fois au-dessus de tout l'arbre.
  const associesMoraux = allAssocies.filter((a) => !a.membreFoyer && a !== mereAssocie);

  return (
    <div className="flex flex-col items-center">
      {depth > 0 && (
        <div className="flex items-center gap-1 text-indigo-500 text-xs font-semibold mb-2">
          <CornerDownRight className="w-3.5 h-3.5" />
          filiale{mereAssocie ? ` (${mereAssocie.parts}%)` : ''}
        </div>
      )}

      {/* Associés personnes morales : à l'extérieur, au-dessus de la bulle */}
      {associesMoraux.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mb-1">
          {associesMoraux.map((a, i) => (
            <div key={i} className="flex flex-col items-center w-20">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-md border-2 bg-gray-100 border-gray-300">
                🏢
              </div>
              <span className="text-[11px] font-medium text-gray-800 mt-1 text-center leading-tight break-words w-full">
                {a.nom}
              </span>
              <span className="text-xs font-bold text-indigo-700">{a.parts}%</span>
              <span className="text-[9px] text-gray-400 text-center leading-tight">
                {TYPE_DETENTION_LABELS[a.typeDetention] || a.typeDetention}
              </span>
              <div className="w-0.5 h-3 bg-indigo-300 mt-0.5" />
            </div>
          ))}
        </div>
      )}

      {/* Bulle de l'entreprise */}
      <div
        ref={(el) => registerBubble(entreprise.nom, el)}
        className="rounded-[2rem] border-4 border-indigo-300 bg-gradient-to-br from-indigo-100 via-white to-white px-6 py-4 text-center shadow-lg min-w-[160px] max-w-[240px]"
      >
        <div className="text-2xl">🏢</div>
        <div className="font-bold text-gray-900 text-sm mt-1 break-words">{entreprise.nom}</div>
        <div className="inline-block mt-1 px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold">
          {entreprise.statutJuridique}
        </div>
        {entreprise.fiscalite && (
          <div className="text-[10px] text-gray-500 mt-1">{entreprise.fiscalite}</div>
        )}
      </div>

      {allAssocies.length === 0 && (
        <p className="text-xs text-gray-400 italic mt-2">Aucun associé renseigné</p>
      )}

      {filiales.length > 0 && (
        <div className="flex flex-col items-center mt-3">
          <div className="w-0.5 h-4 bg-indigo-300" />
          <div className="flex flex-wrap justify-center gap-6">
            {filiales.map((f) => (
              <EntrepriseDetentionNode key={f.id} entreprise={f} getFiliales={getFiliales} depth={depth + 1} registerBubble={registerBubble} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
