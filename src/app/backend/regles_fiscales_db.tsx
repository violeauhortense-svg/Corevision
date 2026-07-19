import * as kv from './kv_store.tsx';
import { rulesStore } from './rules_store.tsx';

/**
 * ============================================
 * BASE DE DONNÉES RÈGLES FISCALES
 * ============================================
 *
 * Module de gestion des règles fiscales pour l'ingénierie patrimoniale
 * Stockage via KV Store avec préfixe: regle_fiscale:
 *
 * NOTE: getToutesRegles now delegates to rulesStore to break god node coupling
 */

// Types
export interface RegleFiscale {
  id: string;
  domaine: DomaineRegle;
  regle: string;
  condition: string;
  exception: string | null;
  consequence: string;
  source: string;
  reference: string;
  date_mise_a_jour: string;
  statut_validation: 'validee' | 'en_attente' | 'obsolete';
}

export type DomaineRegle = 
  | 'holding'
  | 'cession_entreprise'
  | 'transmission'
  | 'immobilier'
  | 'remuneration_dirigeant'
  | 'dividendes'
  | 'fiscalite_societe'
  | 'fiscalite_personne_physique';

// ============================================
// CRUD - CREATE
// ============================================

export async function creerRegleFiscale(regle: Omit<RegleFiscale, 'id' | 'date_mise_a_jour'>): Promise<RegleFiscale> {
  const nouvelleRegle: RegleFiscale = {
    ...regle,
    id: `regle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    date_mise_a_jour: new Date().toISOString(),
  };

  await kv.set(`regle_fiscale:${nouvelleRegle.id}`, nouvelleRegle);

  return nouvelleRegle;
}

// ============================================
// CRUD - READ
// ============================================

export async function getRegleFiscale(id: string): Promise<RegleFiscale | null> {
  const regle = await kv.get(`regle_fiscale:${id}`);
  return regle as RegleFiscale | null;
}

export async function getToutesRegles(): Promise<RegleFiscale[]> {
  try {
    const items = await rulesStore.getToutesRegles();
    return items as any as RegleFiscale[];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des règles fiscales:', error);
    return [];
  }
}

export async function getReglesParDomaine(domaine: DomaineRegle): Promise<RegleFiscale[]> {
  try {
    const toutesRegles = await getToutesRegles();
    return toutesRegles.filter(r => r.domaine === domaine);
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des règles pour le domaine ${domaine}:`, error);
    return [];
  }
}

export async function rechercherRegles(query: string): Promise<RegleFiscale[]> {
  try {
    const toutesRegles = await getToutesRegles();
    const queryLower = query.toLowerCase();

    return toutesRegles.filter(r => 
      r.regle.toLowerCase().includes(queryLower) ||
      r.condition.toLowerCase().includes(queryLower) ||
      r.consequence.toLowerCase().includes(queryLower) ||
      r.source.toLowerCase().includes(queryLower)
    );
  } catch (error) {
    console.error('❌ Erreur lors de la recherche des règles fiscales:', error);
    return [];
  }
}

// ============================================
// CRUD - UPDATE
// ============================================

export async function modifierRegleFiscale(
  id: string,
  modifications: Partial<Omit<RegleFiscale, 'id'>>
): Promise<RegleFiscale | null> {
  const regleExistante = await getRegleFiscale(id);
  
  if (!regleExistante) {
    console.warn(`⚠️ Règle fiscale ${id} introuvable`);
    return null;
  }

  const regleModifiee: RegleFiscale = {
    ...regleExistante,
    ...modifications,
    date_mise_a_jour: new Date().toISOString(),
  };

  await kv.set(`regle_fiscale:${id}`, regleModifiee);

  return regleModifiee;
}

// ============================================
// CRUD - DELETE
// ============================================

export async function supprimerRegleFiscale(id: string): Promise<boolean> {
  try {
    await kv.del(`regle_fiscale:${id}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur suppression règle ${id}:`, error);
    return false;
  }
}

// ============================================
// STATS
// ============================================

export async function getStatistiquesRegles() {
  const toutesRegles = await getToutesRegles();

  const stats = {
    total: toutesRegles.length,
    par_domaine: {} as Record<DomaineRegle, number>,
    par_statut: {
      validee: 0,
      en_attente: 0,
      obsolete: 0,
    },
    derniere_mise_a_jour: toutesRegles.length > 0 
      ? toutesRegles.sort((a, b) => 
          new Date(b.date_mise_a_jour).getTime() - new Date(a.date_mise_a_jour).getTime()
        )[0].date_mise_a_jour
      : null,
  };

  // Compter par domaine
  const domaines: DomaineRegle[] = [
    'holding', 'cession_entreprise', 'transmission', 'immobilier',
    'remuneration_dirigeant', 'dividendes', 'fiscalite_societe', 'fiscalite_personne_physique'
  ];

  for (const domaine of domaines) {
    stats.par_domaine[domaine] = toutesRegles.filter(r => r.domaine === domaine).length;
  }

  // Compter par statut
  for (const regle of toutesRegles) {
    stats.par_statut[regle.statut_validation]++;
  }

  return stats;
}

// ============================================
// INITIALISATION - 100+ RÈGLES FISCALES
// ============================================

export async function initialiserReglesFiscales(): Promise<{ success: boolean; count: number }> {
  
  const reglesExistantes = await getToutesRegles();
  
  if (reglesExistantes.length > 0) {
    for (const regle of reglesExistantes) {
      await supprimerRegleFiscale(regle.id);
    }
  }

  const regles: Omit<RegleFiscale, 'id' | 'date_mise_a_jour'>[] = [
    
    // ==========================================
    // DOMAINE: HOLDING (18 règles)
    // ==========================================
    {
      domaine: 'holding',
      regle: 'Régime mère-fille',
      condition: 'Si holding détient ≥ 5% du capital d\'une filiale depuis ≥ 2 ans',
      exception: 'Ne s\'applique pas aux sociétés de personnes non soumises à l\'IS',
      consequence: 'Les dividendes reçus sont exonérés d\'IS à 95% (quote-part de frais et charges de 5% imposable)',
      source: 'Article 145 et 216 du CGI',
      reference: 'CGI art. 145, 216',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Intégration fiscale',
      condition: 'Si holding détient ≥ 95% d\'une filiale pendant l\'exercice complet',
      exception: 'Les filiales en difficulté ou déficitaires peuvent être exclues',
      consequence: 'Neutralisation des flux intra-groupe et imputation des déficits des filiales sur le résultat du groupe',
      source: 'Articles 223 A à 223 U du CGI',
      reference: 'CGI art. 223 A et suivants',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Apport de titres à une holding',
      condition: 'Si apport de titres de participation à une holding avec prise d\'engagement de conservation',
      exception: 'Report annulé en cas de cession avant 3 ans',
      consequence: 'Report d\'imposition de la plus-value d\'apport jusqu\'à cession des titres reçus',
      source: 'Article 150-0 B ter du CGI',
      reference: 'CGI art. 150-0 B ter',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding animatrice',
      condition: 'Si holding exerce une participation active et continue dans la politique du groupe et le contrôle des filiales',
      exception: 'Simple détention passive de titres non éligible',
      consequence: 'Les titres de la holding entrent dans le champ des biens professionnels (exonération partielle IFI, réduction Dutreil)',
      source: 'BOI-PAT-ISF-30-30-20',
      reference: 'BOFiP-PAT-ISF-30-30-20',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Déductibilité des intérêts d\'emprunt de la holding',
      condition: 'Si la holding contracte un emprunt pour acquérir des titres de participation',
      exception: 'Limitation de la déduction si sous-capitalisation ou montage artificiel',
      consequence: 'Les intérêts d\'emprunt sont déductibles du résultat imposable de la holding',
      source: 'Article 212 du CGI et jurisprudence',
      reference: 'CGI art. 212',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et bénéfices distribués',
      condition: 'Si une holding reçoit des dividendes de ses filiales',
      exception: 'Dividendes provenant de sociétés à l\'étranger : régime différent',
      consequence: 'Application du régime mère-fille : exonération à 95%',
      source: 'Article 216 du CGI',
      reference: 'CGI art. 216',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et impôt sur les sociétés',
      condition: 'Si holding soumise à l\'IS',
      exception: 'Option possible pour le régime des sociétés de personnes si conditions remplies',
      consequence: 'Imposition à l\'IS au taux normal ou réduit selon le résultat',
      source: 'Article 206 du CGI',
      reference: 'CGI art. 206',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et charges financières',
      condition: 'Si les charges financières nettes dépassent 3M€ et 30% de l\'EBITDA fiscal',
      exception: 'Entreprises isolées ou tête de groupe d\'intégration fiscale',
      consequence: 'Limitation de la déductibilité des charges financières nettes',
      source: 'Article 212 bis du CGI',
      reference: 'CGI art. 212 bis',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et report d\'imposition',
      condition: 'Si apport de titres à une holding avec engagement collectif de conservation',
      exception: 'Engagement de conservation de 24 mois minimum requis',
      consequence: 'Report d\'imposition de la plus-value d\'apport',
      source: 'Article 150-0 B ter du CGI',
      reference: 'CGI art. 150-0 B ter',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding passive',
      condition: 'Si holding ne participe pas à la gestion active des filiales',
      exception: null,
      consequence: 'Les titres ne constituent pas des biens professionnels (pas d\'exonération IFI)',
      source: 'BOI-PAT-ISF-30-30-20',
      reference: 'BOFiP-PAT-ISF-30-30-20',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et IFI',
      condition: 'Si holding animatrice et contrôle effectif des filiales',
      exception: 'Participation minimale et animation réelle requises',
      consequence: 'Exonération totale d\'IFI des titres de la holding',
      source: 'Article 975 du CGI',
      reference: 'CGI art. 975',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et pacte Dutreil',
      condition: 'Si holding interposée dans un montage avec pacte Dutreil',
      exception: 'La holding doit être opérationnelle (animatrice)',
      consequence: 'Réduction de 75% de la valeur des titres pour le calcul des droits de donation/succession',
      source: 'Article 787 B du CGI',
      reference: 'CGI art. 787 B',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et plus-values professionnelles',
      condition: 'Si cession de titres de participation détenus depuis >2 ans par une holding à l\'IS',
      exception: 'Quote-part de frais et charges de 12% imposable',
      consequence: 'Exonération à 88% de la plus-value de cession',
      source: 'Article 219 I-a quinquies du CGI',
      reference: 'CGI art. 219 I-a quinquies',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et restructuration',
      condition: 'Si opération de fusion, scission ou apport partiel d\'actif',
      exception: 'Conditions du régime de faveur à respecter',
      consequence: 'Report d\'imposition des plus-values latentes',
      source: 'Articles 210 A et suivants du CGI',
      reference: 'CGI art. 210 A',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et TVA',
      condition: 'Si holding exerce une activité économique (prestations de services aux filiales)',
      exception: 'Simple détention de titres = pas d\'activité économique',
      consequence: 'Assujettissement à la TVA et droit à déduction',
      source: 'Article 256 du CGI et jurisprudence CJUE',
      reference: 'CGI art. 256',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et abus de droit',
      condition: 'Si création d\'une holding dans un but exclusivement fiscal',
      exception: null,
      consequence: 'Risque de requalification et de redressement fiscal',
      source: 'Article L64 du LPF',
      reference: 'LPF art. L64',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et CET',
      condition: 'Si holding soumise à la Contribution Économique Territoriale',
      exception: 'Exonération possible en fonction de l\'activité',
      consequence: 'Paiement de la CFE et de la CVAE selon les règles applicables',
      source: 'Articles 1447 et suivants du CGI',
      reference: 'CGI art. 1447',
      statut_validation: 'validee',
    },
    {
      domaine: 'holding',
      regle: 'Holding et SCI',
      condition: 'Si holding détient des parts de SCI',
      exception: 'Attention au régime fiscal de la SCI (IR ou IS)',
      consequence: 'Traitement fiscal dépendant du régime de la SCI',
      source: 'CGI et doctrine administrative',
      reference: 'BOFiP-Sociétés',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: CESSION D'ENTREPRISE (15 règles)
    // ==========================================
    {
      domaine: 'cession_entreprise',
      regle: 'Abattement pour durée de détention (cession avant 01/01/2018)',
      condition: 'Si cession de titres acquis avant le 01/01/2018 et détenus >8 ans',
      exception: 'Régime abrogé pour les cessions postérieures au 01/01/2018',
      consequence: 'Abattement de 85% sur la plus-value après 8 ans de détention',
      source: 'Article 150-0 D du CGI (version antérieure)',
      reference: 'CGI art. 150-0 D ancien',
      statut_validation: 'obsolete',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'PFU - Flat Tax sur cession de titres',
      condition: 'Si cession de valeurs mobilières par un particulier',
      exception: 'Option possible pour le barème progressif de l\'IR',
      consequence: 'Imposition forfaitaire de 30% (12,8% IR + 17,2% PS) sur la plus-value nette',
      source: 'Article 200 A du CGI',
      reference: 'CGI art. 200 A',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Abattement renforcé pour départ à la retraite',
      condition: 'Si cédant part à la retraite dans les 2 ans, cession PME <50M€ CA, détention >5 ans, fonction de direction',
      exception: 'Plafond de 500 000€ de plus-value',
      consequence: 'Abattement fixe de 500 000€ sur la plus-value',
      source: 'Article 150-0 D ter du CGI',
      reference: 'CGI art. 150-0 D ter',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Apport-cession',
      condition: 'Si apport de titres à une société soumise à l\'IS puis cession par cette société dans les 3 ans',
      exception: 'Report annulé si cession avant 3 ans',
      consequence: 'Report d\'imposition de la plus-value d\'apport jusqu\'à cession, transmission ou rachat des titres reçus',
      source: 'Article 150-0 B ter du CGI',
      reference: 'CGI art. 150-0 B ter',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Cession de titres de PME',
      condition: 'Si cession de titres de PME européenne de <250 salariés, CA <50M€, créée <10 ans',
      exception: 'Plafond d\'investissement et de réduction',
      consequence: 'Réduction d\'impôt de 18% du montant réinvesti (plafond 50 000€ pour un célibataire)',
      source: 'Article 150-0 D bis du CGI (Madelin)',
      reference: 'CGI art. 150-0 D bis',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Cession par une société à l\'IS',
      condition: 'Si cession de titres de participation détenus >2 ans par une société soumise à l\'IS',
      exception: 'Quote-part de frais et charges de 12% imposable',
      consequence: 'Exonération à 88% de la plus-value',
      source: 'Article 219 I-a quinquies du CGI',
      reference: 'CGI art. 219 I-a quinquies',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Earn-out (complément de prix)',
      condition: 'Si prix de cession révisable en fonction de résultats futurs',
      exception: 'Modalités de révision à prévoir contractuellement',
      consequence: 'Le complément de prix est imposable l\'année de sa perception',
      source: 'Doctrine administrative BOI-RPPM-PVBMI-20-20',
      reference: 'BOFiP-RPPM-PVBMI-20-20',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Cession d\'entreprise individuelle',
      condition: 'Si cession d\'une entreprise individuelle ou d\'une branche complète d\'activité',
      exception: 'Ne s\'applique pas aux cessions partielles d\'actifs',
      consequence: 'Exonération totale si CA <250 000€ (seuil), sinon exonération partielle jusqu\'à 350 000€',
      source: 'Article 151 septies du CGI',
      reference: 'CGI art. 151 septies',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Cession et pacte Dutreil',
      condition: 'Si cession de titres ayant bénéficié du pacte Dutreil',
      exception: 'Respect des engagements de conservation requis',
      consequence: 'Maintien de l\'abattement de 75% si engagements respectés',
      source: 'Article 787 B du CGI',
      reference: 'CGI art. 787 B',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Plus-value immobilière professionnelle',
      condition: 'Si cession d\'un bien immobilier inscrit à l\'actif d\'une entreprise',
      exception: 'Régime spécifique selon la nature de l\'entreprise',
      consequence: 'Imposition selon le régime des plus-values professionnelles',
      source: 'Articles 39 duodecies et suivants du CGI',
      reference: 'CGI art. 39 duodecies',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Abus de droit en cas de cession',
      condition: 'Si montage de cession visant exclusivement l\'évasion fiscale',
      exception: null,
      consequence: 'Redressement fiscal et pénalités (80% du montant éludé)',
      source: 'Article L64 du LPF',
      reference: 'LPF art. L64',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Cession de droits sociaux démembrés',
      condition: 'Si cession de la nue-propriété ou de l\'usufruit de titres',
      exception: 'Règles spécifiques de calcul de la plus-value',
      consequence: 'Imposition selon la nature du droit cédé (usufruit ou nue-propriété)',
      source: 'Article 150-0 A du CGI et doctrine',
      reference: 'CGI art. 150-0 A',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Cession par non-résident',
      condition: 'Si cession par une personne domiciliée hors de France',
      exception: 'Conventions fiscales internationales applicables',
      consequence: 'Imposition en France si droits dans une société à prépondérance immobilière ou >25% des droits',
      source: 'Article 244 bis A et B du CGI',
      reference: 'CGI art. 244 bis A',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Garantie d\'actif et de passif',
      condition: 'Si clause de garantie dans l\'acte de cession',
      exception: 'Clause purement contractuelle',
      consequence: 'Pas d\'impact fiscal au moment de la cession, traitement ultérieur si mise en jeu',
      source: 'Doctrine et jurisprudence',
      reference: 'Jurisprudence',
      statut_validation: 'validee',
    },
    {
      domaine: 'cession_entreprise',
      regle: 'Réinvestissement du produit de cession',
      condition: 'Si réinvestissement dans une PME dans les 3 ans suivant la cession',
      exception: 'Conditions strictes sur la nature de la PME',
      consequence: 'Réduction d\'IR de 18% du montant réinvesti',
      source: 'Article 150-0 D bis du CGI',
      reference: 'CGI art. 150-0 D bis',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: TRANSMISSION (18 règles)
    // ==========================================
    {
      domaine: 'transmission',
      regle: 'Abattement parent-enfant',
      condition: 'Si donation ou succession en ligne directe (parent-enfant)',
      exception: 'Abattement renouvelable tous les 15 ans',
      consequence: 'Abattement de 100 000€ par parent et par enfant',
      source: 'Article 779 du CGI',
      reference: 'CGI art. 779',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Pacte Dutreil',
      condition: 'Si engagement collectif de conservation de 2 ans puis engagement individuel de 4 ans sur titres d\'entreprise',
      exception: 'Conditions strictes sur l\'activité et la détention',
      consequence: 'Abattement de 75% sur la valeur des titres transmis',
      source: 'Article 787 B du CGI',
      reference: 'CGI art. 787 B',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Donation-partage',
      condition: 'Si donation avec partage des biens entre les héritiers présomptifs',
      exception: 'Irrévocable et valeur figée au jour de la donation',
      consequence: 'Valeur des biens figée au jour de la donation pour le calcul des droits',
      source: 'Articles 1075 et suivants du Code civil',
      reference: 'Code civil art. 1075',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Donation avec réserve d\'usufruit',
      condition: 'Si donation de la nue-propriété avec conservation de l\'usufruit par le donateur',
      exception: 'Valeur de la nue-propriété selon barème fiscal',
      consequence: 'Droits de donation calculés sur la nue-propriété uniquement (avec abattement)',
      source: 'Article 669 du CGI',
      reference: 'CGI art. 669',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Assurance-vie et fiscalité des successions',
      condition: 'Si primes versées avant 70 ans sur un contrat d\'assurance-vie',
      exception: 'Abattement de 152 500€ par bénéficiaire',
      consequence: 'Taxation à 20% jusqu\'à 700 000€ puis 31,25% au-delà (après abattement)',
      source: 'Article 990 I du CGI',
      reference: 'CGI art. 990 I',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Assurance-vie primes après 70 ans',
      condition: 'Si primes versées après 70 ans sur un contrat d\'assurance-vie',
      exception: 'Abattement global de 30 500€ tous bénéficiaires confondus',
      consequence: 'Droits de succession sur les primes versées (après abattement)',
      source: 'Article 757 B du CGI',
      reference: 'CGI art. 757 B',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Donation aux petits-enfants',
      condition: 'Si donation de grand-parent à petit-enfant',
      exception: 'Abattement renouvelable tous les 15 ans',
      consequence: 'Abattement de 31 865€ par grand-parent et par petit-enfant',
      source: 'Article 790 B du CGI',
      reference: 'CGI art. 790 B',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Démembrement de propriété',
      condition: 'Si démembrement entre usufruitier et nu-propriétaire',
      exception: 'Barème fiscal selon l\'âge de l\'usufruitier',
      consequence: 'Répartition de la valeur selon le barème légal (art. 669 CGI)',
      source: 'Article 669 du CGI',
      reference: 'CGI art. 669',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Réunion d\'usufruit',
      condition: 'Si décès de l\'usufruitier, la pleine propriété revient au nu-propriétaire',
      exception: null,
      consequence: 'Pas de droits de succession sur la réunion d\'usufruit',
      source: 'Article 1133 du Code civil',
      reference: 'Code civil art. 1133',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Donation de sommes d\'argent',
      condition: 'Si don familial de sommes d\'argent par personne de -80 ans à descendant majeur',
      exception: 'Abattement spécifique de 31 865€ tous les 15 ans',
      consequence: 'Exonération de droits de donation dans la limite de l\'abattement',
      source: 'Article 790 G du CGI',
      reference: 'CGI art. 790 G',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Rapport des donations',
      condition: 'Si donation antérieure lors de la succession',
      exception: 'Donation hors part successorale si clause expresse',
      consequence: 'Les donations de moins de 15 ans sont rapportées à la succession',
      source: 'Article 843 du CGI',
      reference: 'CGI art. 843',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Transmission de parts de SCI',
      condition: 'Si transmission de parts de SCI détenant de l\'immobilier',
      exception: 'Pacte Dutreil non applicable aux SCI',
      consequence: 'Droits de donation ou succession calculés sur la valeur vénale des parts',
      source: 'Doctrine administrative',
      reference: 'BOFiP-Patrimoine',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Succession entre époux',
      condition: 'Si succession du conjoint survivant',
      exception: null,
      consequence: 'Exonération totale de droits de succession',
      source: 'Article 796-0 bis du CGI',
      reference: 'CGI art. 796-0 bis',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Succession entre partenaires de PACS',
      condition: 'Si succession entre partenaires de PACS',
      exception: null,
      consequence: 'Exonération totale de droits de succession',
      source: 'Article 796-0 bis du CGI',
      reference: 'CGI art. 796-0 bis',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Succession entre frères et sœurs',
      condition: 'Si succession entre frères et sœurs',
      exception: 'Abattement de 15 932€',
      consequence: 'Taxation à 35% jusqu\'à 24 430€ puis 45% au-delà',
      source: 'Article 777 du CGI',
      reference: 'CGI art. 777',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Présent d\'usage',
      condition: 'Si cadeau pour un événement (mariage, anniversaire) proportionné au patrimoine du donateur',
      exception: 'Montant raisonnable en fonction des usages',
      consequence: 'Exonération totale de droits de donation',
      source: 'Article 852 du Code civil et jurisprudence',
      reference: 'Code civil art. 852',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Transmission universelle de patrimoine (TUP)',
      condition: 'Si dissolution d\'une société détenue à 100% par une autre',
      exception: 'Conditions strictes du régime de faveur',
      consequence: 'Neutralité fiscale (pas de taxation immédiate)',
      source: 'Article 1844-5 du Code civil et CGI',
      reference: 'Code civil art. 1844-5',
      statut_validation: 'validee',
    },
    {
      domaine: 'transmission',
      regle: 'Donation graduelle',
      condition: 'Si donation avec obligation de conserver et de transmettre à un second bénéficiaire',
      exception: 'Conditions strictes et formalisme requis',
      consequence: 'Droits de donation payés deux fois (au premier puis au second donataire)',
      source: 'Article 1048 du Code civil',
      reference: 'Code civil art. 1048',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: IMMOBILIER (15 règles)
    // ==========================================
    {
      domaine: 'immobilier',
      regle: 'Plus-value immobilière résidence principale',
      condition: 'Si cession de la résidence principale',
      exception: null,
      consequence: 'Exonération totale d\'impôt sur la plus-value',
      source: 'Article 150 U du CGI',
      reference: 'CGI art. 150 U',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Plus-value immobilière résidence secondaire',
      condition: 'Si cession d\'un bien immobilier autre que la résidence principale',
      exception: 'Abattement pour durée de détention',
      consequence: 'Taxation à 19% (IR) + 17,2% (PS) avec abattements progressifs (exonération totale après 30 ans)',
      source: 'Article 150 U et 150 VC du CGI',
      reference: 'CGI art. 150 U',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'SCI à l\'IR',
      condition: 'Si détention d\'un bien immobilier via une SCI soumise à l\'IR',
      exception: 'Transparence fiscale',
      consequence: 'Les revenus locatifs sont imposés au niveau des associés selon leur quote-part',
      source: 'Article 8 du CGI',
      reference: 'CGI art. 8',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'SCI à l\'IS',
      condition: 'Si SCI opte pour l\'impôt sur les sociétés',
      exception: 'Option irrévocable',
      consequence: 'Imposition des revenus et plus-values au niveau de la société à l\'IS',
      source: 'Article 206 du CGI',
      reference: 'CGI art. 206',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Déficit foncier',
      condition: 'Si les charges déductibles excèdent les revenus fonciers',
      exception: 'Plafond d\'imputation de 10 700€/an (hors intérêts d\'emprunt)',
      consequence: 'Imputation du déficit sur le revenu global dans la limite du plafond',
      source: 'Article 156 du CGI',
      reference: 'CGI art. 156',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Dispositif Pinel',
      condition: 'Si acquisition d\'un logement neuf pour le louer pendant 6, 9 ou 12 ans',
      exception: 'Plafonds de loyer et de ressources du locataire',
      consequence: 'Réduction d\'impôt de 10,5%, 15% ou 17,5% selon la durée d\'engagement',
      source: 'Article 199 novovicies du CGI',
      reference: 'CGI art. 199 novovicies',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Dispositif Denormandie',
      condition: 'Si acquisition d\'un logement ancien à rénover dans le centre-ville avec travaux ≥25% du coût',
      exception: 'Zones éligibles et conditions de travaux',
      consequence: 'Réduction d\'impôt identique au Pinel (10,5% à 17,5%)',
      source: 'Article 199 novovicies du CGI',
      reference: 'CGI art. 199 novovicies',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Loi Malraux',
      condition: 'Si acquisition d\'un immeuble dans un secteur sauvegardé ou ZPPAUP avec travaux de restauration',
      exception: 'Agrément ou déclaration préalable requis',
      consequence: 'Réduction d\'impôt de 22% ou 30% du montant des travaux (plafond 400 000€ sur 4 ans)',
      source: 'Article 199 tervicies du CGI',
      reference: 'CGI art. 199 tervicies',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Loi Monuments Historiques',
      condition: 'Si propriétaire d\'un monument historique classé ou inscrit',
      exception: 'Conditions d\'ouverture au public ou autorisation préalable',
      consequence: 'Déduction des charges et travaux sans plafond sur le revenu global',
      source: 'Article 156 du CGI',
      reference: 'CGI art. 156',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Location meublée non professionnelle (LMNP)',
      condition: 'Si location meublée avec revenus <23 000€/an ou <50% des revenus du foyer',
      exception: 'Régime BIC',
      consequence: 'Imposition des revenus en BIC avec possibilité d\'amortir le bien',
      source: 'Article 155 du CGI',
      reference: 'CGI art. 155',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Location meublée professionnelle (LMP)',
      condition: 'Si location meublée avec revenus >23 000€/an ET >50% des revenus du foyer',
      exception: 'Inscription au RCS',
      consequence: 'Plus-values exonérées si CA <90 000€ et activité >5 ans',
      source: 'Article 151 septies du CGI',
      reference: 'CGI art. 151 septies',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Démembrement immobilier',
      condition: 'Si donation de la nue-propriété d\'un bien immobilier',
      exception: 'Barème fiscal selon l\'âge de l\'usufruitier',
      consequence: 'Droits de donation calculés sur la nue-propriété uniquement',
      source: 'Article 669 du CGI',
      reference: 'CGI art. 669',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'IFI - Résidence principale',
      condition: 'Si détention de la résidence principale',
      exception: 'Abattement de 30% sur la valeur',
      consequence: 'Valeur taxable à l\'IFI = 70% de la valeur vénale',
      source: 'Article 973 du CGI',
      reference: 'CGI art. 973',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'IFI - Dettes déductibles',
      condition: 'Si emprunt immobilier en cours au 1er janvier',
      exception: 'Dettes liées à un bien taxable',
      consequence: 'Le capital restant dû est déductible du patrimoine taxable',
      source: 'Article 974 du CGI',
      reference: 'CGI art. 974',
      statut_validation: 'validee',
    },
    {
      domaine: 'immobilier',
      regle: 'Prêt familial',
      condition: 'Si prêt entre membres de la famille pour l\'acquisition d\'un bien immobilier',
      exception: 'Déclaration obligatoire si montant >5 000€',
      consequence: 'Pas de fiscalité sur les intérêts si taux conforme au marché',
      source: 'Article 242 ter du CGI',
      reference: 'CGI art. 242 ter',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: RÉMUNÉRATION DIRIGEANT (12 règles)
    // ==========================================
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Rémunération du président de SAS',
      condition: 'Si président de SAS perçoit une rémunération',
      exception: null,
      consequence: 'Soumis au régime des salariés (cotisations sociales + IR sur traitements et salaires)',
      source: 'Article 80 ter du CGI',
      reference: 'CGI art. 80 ter',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Rémunération du gérant majoritaire de SARL',
      condition: 'Si gérant détient >50% des parts sociales',
      exception: null,
      consequence: 'Soumis aux cotisations sociales TNS (travailleurs non-salariés) et IR sur traitements et salaires',
      source: 'Article 62 du CGI',
      reference: 'CGI art. 62',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Rémunération du gérant minoritaire de SARL',
      condition: 'Si gérant détient ≤50% des parts sociales',
      exception: null,
      consequence: 'Assimilé salarié (régime général de la sécurité sociale)',
      source: 'Article 80 ter du CGI',
      reference: 'CGI art. 80 ter',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Déductibilité de la rémunération du dirigeant',
      condition: 'Si rémunération versée par une société soumise à l\'IS',
      exception: 'Rémunération doit être normale et justifiée',
      consequence: 'La rémunération est déductible du résultat imposable de la société',
      source: 'Article 39-1 du CGI',
      reference: 'CGI art. 39-1',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Prime exceptionnelle au dirigeant',
      condition: 'Si versement d\'une prime exceptionnelle',
      exception: 'Motivation économique et justification requises',
      consequence: 'Déductible si justifiée et décidée par l\'organe compétent',
      source: 'Doctrine administrative',
      reference: 'BOFiP-BIC',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Rémunération différée',
      condition: 'Si mise en place d\'un mécanisme de rémunération différée (earn-out, bonus pluriannuel)',
      exception: 'Conditions de versement à fixer précisément',
      consequence: 'Imposition l\'année de perception effective',
      source: 'Article 12 du CGI',
      reference: 'CGI art. 12',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Compte courant d\'associé',
      condition: 'Si le dirigeant consent une avance en compte courant à sa société',
      exception: 'Taux d\'intérêt plafonné',
      consequence: 'Les intérêts versés sont déductibles dans la limite du taux légal',
      source: 'Article 39-1-3° du CGI',
      reference: 'CGI art. 39-1-3°',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Actions gratuites (AGA)',
      condition: 'Si attribution gratuite d\'actions aux dirigeants',
      exception: 'Plafond de 10% du capital social',
      consequence: 'Taxation différée avec régime spécifique (gain d\'acquisition + plus-value)',
      source: 'Article 80 quaterdecies du CGI',
      reference: 'CGI art. 80 quaterdecies',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Stock-options',
      condition: 'Si attribution d\'options de souscription ou d\'achat d\'actions',
      exception: 'Conditions de durée et plafonds',
      consequence: 'Taxation au moment de la levée d\'option et de la cession',
      source: 'Article 80 bis du CGI',
      reference: 'CGI art. 80 bis',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'BSPCE (Bons de Souscription de Parts de Créateur d\'Entreprise)',
      condition: 'Si société <15 ans et attribution aux salariés/dirigeants',
      exception: 'Conditions strictes d\'éligibilité',
      consequence: 'Plus-value taxée au PFU (30%) ou sur option au barème IR',
      source: 'Article 163 bis G du CGI',
      reference: 'CGI art. 163 bis G',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Avantages en nature',
      condition: 'Si mise à disposition d\'un véhicule, logement, etc.',
      exception: null,
      consequence: 'Soumis à cotisations sociales et IR selon l\'évaluation forfaitaire ou réelle',
      source: 'Article 82 du CGI',
      reference: 'CGI art. 82',
      statut_validation: 'validee',
    },
    {
      domaine: 'remuneration_dirigeant',
      regle: 'Indemnité de rupture du mandat social',
      condition: 'Si versement d\'une indemnité à la fin du mandat',
      exception: 'Régime social spécifique',
      consequence: 'Imposition à l\'IR avec éventuelle exonération partielle',
      source: 'Article 80 duodecies du CGI',
      reference: 'CGI art. 80 duodecies',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: DIVIDENDES (10 règles)
    // ==========================================
    {
      domaine: 'dividendes',
      regle: 'PFU - Flat Tax sur dividendes',
      condition: 'Si perception de dividendes par une personne physique',
      exception: 'Option possible pour le barème progressif de l\'IR',
      consequence: 'Prélèvement forfaitaire unique de 30% (12,8% IR + 17,2% PS)',
      source: 'Article 200 A du CGI',
      reference: 'CGI art. 200 A',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Option pour le barème progressif de l\'IR',
      condition: 'Si choix d\'imposition au barème progressif pour les dividendes',
      exception: 'Option globale pour l\'ensemble des revenus du capital',
      consequence: 'Abattement de 40% sur les dividendes avant application du barème IR + CSG/CRDS 17,2%',
      source: 'Article 158 du CGI',
      reference: 'CGI art. 158',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Dividendes perçus par une société à l\'IS',
      condition: 'Si dividendes perçus par une société soumise à l\'IS',
      exception: 'Conditions du régime mère-fille',
      consequence: 'Exonération à 95% si régime mère-fille, sinon imposition à l\'IS',
      source: 'Article 216 du CGI',
      reference: 'CGI art. 216',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Dividendes et prélèvements sociaux',
      condition: 'Si perception de dividendes',
      exception: null,
      consequence: 'Prélèvements sociaux de 17,2% (CSG 9,2%, CRDS 0,5%, prélèvement solidarité 7,5%)',
      source: 'Article 1600-0 S du CGI',
      reference: 'CGI art. 1600-0 S',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Acompte de 12,8%',
      condition: 'Si perception de dividendes',
      exception: 'Dispense possible si RFR <50 000€ (célibataire) ou 75 000€ (couple)',
      consequence: 'Prélèvement à la source de 12,8% (acompte d\'IR), régularisé l\'année suivante',
      source: 'Article 117 quater du CGI',
      reference: 'CGI art. 117 quater',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Dividendes du gérant majoritaire de SARL',
      condition: 'Si dividendes perçus par un gérant majoritaire de SARL et dépassent 10% du capital social',
      exception: 'Seuil de 10% du capital social, des primes d\'émission et des sommes en compte courant',
      consequence: 'Fraction excédentaire soumise à cotisations sociales TNS',
      source: 'Article L131-6 du Code de la sécurité sociale',
      reference: 'CSS art. L131-6',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Distribution de réserves',
      condition: 'Si distribution de réserves accumulées',
      exception: null,
      consequence: 'Traitement fiscal identique aux dividendes ordinaires',
      source: 'Article 109 du CGI',
      reference: 'CGI art. 109',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Acompte sur dividendes',
      condition: 'Si versement d\'un acompte sur dividendes en cours d\'exercice',
      exception: 'Conditions strictes (bilan intermédiaire)',
      consequence: 'Taxation au moment du versement de l\'acompte',
      source: 'Article L232-12 du Code de commerce',
      reference: 'Code commerce art. L232-12',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Dividendes de source étrangère',
      condition: 'Si dividendes perçus d\'une société étrangère',
      exception: 'Conventions fiscales internationales',
      consequence: 'Crédit d\'impôt pour éviter la double imposition',
      source: 'Article 158 bis du CGI',
      reference: 'CGI art. 158 bis',
      statut_validation: 'validee',
    },
    {
      domaine: 'dividendes',
      regle: 'Retenue à la source pour non-résidents',
      condition: 'Si bénéficiaire des dividendes est non-résident fiscal français',
      exception: 'Taux réduit selon conventions fiscales',
      consequence: 'Retenue à la source de 12,8% ou taux conventionnel',
      source: 'Article 119 bis du CGI',
      reference: 'CGI art. 119 bis',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: FISCALITÉ SOCIÉTÉ (10 règles)
    // ==========================================
    {
      domaine: 'fiscalite_societe',
      regle: 'Taux réduit d\'IS à 15%',
      condition: 'Si PME avec CA HT <10M€ et capital détenu à ≥75% par des personnes physiques',
      exception: 'Plafond de bénéfices de 42 500€',
      consequence: 'Taux d\'IS de 15% sur les 42 500 premiers euros de bénéfice',
      source: 'Article 219 I-b du CGI',
      reference: 'CGI art. 219 I-b',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Taux normal d\'IS',
      condition: 'Si société soumise à l\'IS',
      exception: null,
      consequence: 'Taux normal de 25% (depuis 2022)',
      source: 'Article 219 I du CGI',
      reference: 'CGI art. 219 I',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Report en arrière des déficits (carry-back)',
      condition: 'Si déficit fiscal constaté',
      exception: 'Plafond du déficit reportable',
      consequence: 'Imputation du déficit sur le bénéfice de l\'exercice précédent (créance d\'impôt)',
      source: 'Article 220 quinquies du CGI',
      reference: 'CGI art. 220 quinquies',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Report en avant des déficits',
      condition: 'Si déficit fiscal non imputé',
      exception: 'Plafond d\'imputation annuelle de 1M€ + 50% du bénéfice excédentaire',
      consequence: 'Report des déficits sans limitation de durée',
      source: 'Article 209 I du CGI',
      reference: 'CGI art. 209 I',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Crédit d\'impôt recherche (CIR)',
      condition: 'Si dépenses de R&D éligibles',
      exception: 'Conditions strictes sur la nature des dépenses',
      consequence: 'Crédit d\'impôt de 30% des dépenses jusqu\'à 100M€, puis 5% au-delà',
      source: 'Article 244 quater B du CGI',
      reference: 'CGI art. 244 quater B',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Amortissements accélérés',
      condition: 'Si acquisition de matériels ou équipements spécifiques (robots, véhicules propres)',
      exception: 'Conditions d\'éligibilité',
      consequence: 'Amortissement dégressif ou exceptionnel',
      source: 'Article 39 A du CGI',
      reference: 'CGI art. 39 A',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Cotisation sur la valeur ajoutée des entreprises (CVAE)',
      condition: 'Si CA >500 000€',
      exception: 'Suppression progressive en cours',
      consequence: 'Cotisation calculée sur la valeur ajoutée (taux progressif jusqu\'à 0,75%)',
      source: 'Article 1586 ter du CGI',
      reference: 'CGI art. 1586 ter',
      statut_validation: 'obsolete',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Contribution sociale de solidarité (C3S)',
      condition: 'Si CA >19M€',
      exception: 'Suppression effective depuis 2017',
      consequence: 'Contribution supprimée',
      source: 'Loi de finances 2016',
      reference: 'LF 2016',
      statut_validation: 'obsolete',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'TVA - Franchise en base',
      condition: 'Si CA <36 800€ (prestations de services) ou <91 900€ (ventes)',
      exception: null,
      consequence: 'Exonération de TVA (pas de collecte ni de déduction)',
      source: 'Article 293 B du CGI',
      reference: 'CGI art. 293 B',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_societe',
      regle: 'Régime réel simplifié de TVA',
      condition: 'Si CA entre les seuils de franchise et 840 000€ (ventes) ou 254 000€ (services)',
      exception: null,
      consequence: 'Déclaration annuelle de TVA avec 2 acomptes semestriels',
      source: 'Article 302 septies A du CGI',
      reference: 'CGI art. 302 septies A',
      statut_validation: 'validee',
    },

    // ==========================================
    // DOMAINE: FISCALITÉ PERSONNE PHYSIQUE (12 règles)
    // ==========================================
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Barème progressif de l\'IR 2026',
      condition: 'Si revenus imposables',
      exception: null,
      consequence: 'Tranches: 0% jusqu\'à 11 294€, 11% jusqu\'à 28 797€, 30% jusqu\'à 82 341€, 41% jusqu\'à 177 106€, 45% au-delà',
      source: 'Article 197 du CGI',
      reference: 'CGI art. 197',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Quotient familial',
      condition: 'Si personnes à charge (enfants, invalides)',
      exception: 'Plafonnement de l\'avantage fiscal',
      consequence: 'Réduction d\'impôt selon le nombre de parts (0,5 ou 1 part par personne à charge)',
      source: 'Article 194 du CGI',
      reference: 'CGI art. 194',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Prélèvement à la source',
      condition: 'Si revenus salariaux, pensions, ou revenus de remplacement',
      exception: null,
      consequence: 'Prélèvement contemporain des revenus selon taux personnalisé',
      source: 'Article 204 A du CGI',
      reference: 'CGI art. 204 A',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Déduction des pensions alimentaires',
      condition: 'Si versement de pensions alimentaires à ascendants ou descendants',
      exception: 'Plafond de 6 674€ par ascendant (2026)',
      consequence: 'Déduction du revenu imposable',
      source: 'Article 156 du CGI',
      reference: 'CGI art. 156',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Frais réels ou abattement de 10%',
      condition: 'Si perception de traitements et salaires',
      exception: 'Option pour frais réels si supérieurs à 10%',
      consequence: 'Déduction forfaitaire de 10% (min 502€, max 14 171€) ou frais réels justifiés',
      source: 'Article 83 du CGI',
      reference: 'CGI art. 83',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Réduction d\'impôt pour dons',
      condition: 'Si dons à des organismes d\'intérêt général',
      exception: 'Plafond de 20% du revenu imposable',
      consequence: 'Réduction d\'impôt de 66% du montant du don (75% pour dons aux associations d\'aide aux personnes en difficulté)',
      source: 'Article 200 du CGI',
      reference: 'CGI art. 200',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Crédit d\'impôt pour emploi à domicile',
      condition: 'Si emploi d\'un salarié à domicile ou recours à un service à la personne',
      exception: 'Plafond de 12 000€ de dépenses (+ 1 500€ par personne à charge)',
      consequence: 'Crédit d\'impôt de 50% des dépenses',
      source: 'Article 199 sexdecies du CGI',
      reference: 'CGI art. 199 sexdecies',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'PER - Plan Épargne Retraite',
      condition: 'Si versements sur un PER',
      exception: 'Plafond de déduction fonction des revenus',
      consequence: 'Déduction des versements du revenu imposable (plafond 10% des revenus ou 35 194€ en 2026)',
      source: 'Article 163 quatervicies du CGI',
      reference: 'CGI art. 163 quatervicies',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Défiscalisation Girardin industriel',
      condition: 'Si investissement dans une entreprise en outre-mer',
      exception: 'Conditions strictes et montage encadré',
      consequence: 'Réduction d\'impôt de 110% à 120% du montant investi',
      source: 'Article 199 undecies B du CGI',
      reference: 'CGI art. 199 undecies B',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Contribution exceptionnelle sur les hauts revenus (CEHR)',
      condition: 'Si RFR >250 000€ (célibataire) ou 500 000€ (couple)',
      exception: null,
      consequence: 'Contribution de 3% entre les seuils et 4% au-delà de 500 000€ (célibataire) ou 1M€ (couple)',
      source: 'Article 223 sexies du CGI',
      reference: 'CGI art. 223 sexies',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'Décote',
      condition: 'Si impôt brut <1 929€ (célibataire) ou 3 191€ (couple)',
      exception: null,
      consequence: 'Réduction de l\'impôt selon formule (1 929€ - 75% de l\'impôt brut)',
      source: 'Article 197 I-3 du CGI',
      reference: 'CGI art. 197 I-3',
      statut_validation: 'validee',
    },
    {
      domaine: 'fiscalite_personne_physique',
      regle: 'IFI - Impôt sur la Fortune Immobilière',
      condition: 'Si patrimoine immobilier net taxable >1 300 000€',
      exception: 'Abattement de 30% sur la résidence principale',
      consequence: 'Barème progressif de 0,5% à 1,5%',
      source: 'Article 964 du CGI',
      reference: 'CGI art. 964',
      statut_validation: 'validee',
    },

  ];

  let count = 0;
  for (const regle of regles) {
    await creerRegleFiscale(regle);
    count++;
  }


  return { success: true, count };
}
