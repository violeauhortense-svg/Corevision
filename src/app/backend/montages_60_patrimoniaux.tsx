import { MontagePatrimonial } from './shared/montage_types.ts';

/**
 * ============================================
 * 60 MONTAGES PATRIMONIAUX PROFESSIONNELS
 * ============================================
 * 
 * Couvrant 7 domaines clés :
 * 1. Structuration holding (9 montages)
 * 2. Transmission d'entreprise (9 montages)
 * 3. Optimisation fiscale dirigeant (9 montages)
 * 4. Immobilier patrimonial (9 montages)
 * 5. Réinvestissement après cession (8 montages)
 * 6. Structuration familiale (8 montages)
 * 7. Préparation retraite (8 montages)
 */

export const MONTAGES_60_PROFESSIONNELS: Omit<MontagePatrimonial, 'id' | 'date_creation' | 'date_modification'>[] = [
  
  // ==========================================
  // 1. STRUCTURATION HOLDING (9 montages)
  // ==========================================
  {
    nom_montage: "Holding patrimoniale classique",
    objectif: "Centraliser la gestion du patrimoine financier et optimiser la transmission",
    conditions: "Patrimoine financier >500k€ ; Plusieurs actifs à gérer ; Plusieurs héritiers ; Résident fiscal français",
    avantages: "Régime mère-fille (exonération 95% des dividendes) ; Transmission progressive par donation de parts ; Effet de levier via emprunt ; Centralisation de la gestion",
    risques: "Coûts de structure (3-5k€/an) ; Formalisme comptable et juridique ; Risque de requalification si montage artificiel ; Dilution du contrôle",
    etapes_juridiques: "1. Création de la holding (SAS ou SARL)\n2. Apport des titres de participations existants\n3. Mise en place d'une convention de trésorerie\n4. Donation progressive des parts de holding\n5. Assemblées générales annuelles",
    fiscalite: "IS à 15% jusqu'à 42 500€ puis 25% ; Dividendes remontants exonérés à 95% (quote-part 5%) ; Donation de parts avec abattements 100k€ par enfant/15 ans ; Pacte Dutreil possible (-75%)",
    source: "CGI art. 145, 216, 787 B - BOFiP-IS",
    tags: ["holding", "structuration", "gestion patrimoniale", "transmission"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding animatrice",
    objectif: "Créer une structure opérationnelle pour animer un groupe de sociétés",
    conditions: "Détention d'au moins 2 filiales ; Participation active à la gestion ; Prestations de services aux filiales ; Contrôle effectif",
    avantages: "Exonération IFI totale des titres ; Éligibilité au pacte Dutreil ; TVA déductible sur frais de structure ; Biens professionnels",
    risques: "Obligation de prouver l'animation effective ; Contrôles fiscaux fréquents ; Coûts de personnel et de structure ; Responsabilité étendue",
    etapes_juridiques: "1. Création de la holding avec objet d'animation\n2. Mise en place de conventions de prestations de services\n3. Recrutement d'un dirigeant opérationnel\n4. Facturation mensuelle aux filiales\n5. Assemblées de coordination trimestrielles",
    fiscalite: "TVA sur prestations facturées ; Déductibilité des charges de structure ; Exonération IFI si animation prouvée ; IS normal sur bénéfices",
    source: "BOI-PAT-ISF-30-30-20 ; CGI art. 975",
    tags: ["holding animatrice", "IFI", "groupe", "biens professionnels"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding de reprise avec LBO",
    objectif: "Acquérir une société cible avec effet de levier financier",
    conditions: "Cible identifiée avec EBITDA >500k€ ; Apport personnel 20-30% ; Capacité d'endettement ; Business plan solide",
    avantages: "Effet de levier important (jusqu'à 80% d'emprunt) ; Déductibilité des intérêts d'emprunt ; Montée en capital progressive ; ROI potentiel élevé",
    risques: "Risque de surendettement ; Dépendance aux performances de la cible ; Covenant bancaires contraignants ; Responsabilité personnelle",
    etapes_juridiques: "1. Création de la holding de reprise (NewCo)\n2. Levée de fonds propres et dette senior/mezzanine\n3. Acquisition des titres de la cible\n4. Fusion holding-cible ou dividendes remontants\n5. Remboursement progressif de la dette",
    fiscalite: "Intérêts d'emprunt déductibles du résultat de la holding ; Plus-value professionnelle si cession ultérieure ; Optimisation par fusion après 3 ans",
    source: "CGI art. 39, 219 - Doctrine LBO",
    tags: ["holding", "LBO", "reprise", "effet de levier"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding avec SCI d'intermédiation",
    objectif: "Structurer un patrimoine immobilier d'entreprise via holding",
    conditions: "Immobilier professionnel ; Holding existante ou à créer ; Volonté d'isoler le risque immobilier ; Crédit-bail envisageable",
    avantages: "Séparation actifs/exploitation ; Crédit-bail interne fiscalement intéressant ; Protection du patrimoine immobilier ; Transmission facilitée",
    risques: "Double niveau de structure (coûts) ; Complexité fiscale ; Risque de requalification en abus de droit ; Rigidité du montage",
    etapes_juridiques: "1. Création d'une SCI détenue par la holding\n2. Apport ou acquisition de l'immobilier par la SCI\n3. Bail commercial entre SCI et société d'exploitation\n4. Option IS pour la SCI si pertinent\n5. Convention de trésorerie holding-SCI",
    fiscalite: "Loyers déductibles du résultat d'exploitation ; IS sur revenus locatifs de la SCI ; Neutralité des flux en groupe d'intégration fiscale",
    source: "CGI art. 206, 223 A - Doctrine administrative",
    tags: ["holding", "SCI", "immobilier professionnel", "crédit-bail"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding passive (portefeuille titres)",
    objectif: "Gérer un portefeuille de participations sans animation",
    conditions: "Portefeuille de titres diversifié ; Pas de volonté d'animation opérationnelle ; Objectif de rendement ; Horizon LT",
    avantages: "Simplicité de gestion ; Régime mère-fille applicable ; Mutualisation des risques ; Transmission progressive possible",
    risques: "Pas d'exonération IFI (holding passive) ; Absence d'avantages liés à l'animation ; Quote-part de frais et charges 5%",
    etapes_juridiques: "1. Création de la holding (SAS recommandée)\n2. Apport ou acquisition de participations\n3. Gestion du portefeuille de titres\n4. Perception des dividendes (régime mère-fille)\n5. Distribution ou réinvestissement",
    fiscalite: "Dividendes reçus: exonération 95% ; IS sur la quote-part de 5% ; Pas d'exonération IFI ; Plus-values titres: exonération à 88%",
    source: "CGI art. 145, 216, 219 I-a quinquies",
    tags: ["holding passive", "portefeuille", "titres", "dividendes"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Holding avec intégration fiscale",
    objectif: "Optimiser la fiscalité d'un groupe de sociétés",
    conditions: "Holding détenant ≥95% de filiales ; Clôture d'exercice commune ; Toutes sociétés soumises à l'IS ; Capital >1,5M€",
    avantages: "Imputation des déficits des filiales sur bénéfices du groupe ; Un seul IS à payer ; Neutralisation des flux internes ; Cash pooling fiscal",
    risques: "Seuil de détention strict (95%) ; Formalisme lourd (liasse fiscale consolidée) ; Solidarité fiscale du groupe ; Sortie pénalisante",
    etapes_juridiques: "1. Structuration du groupe avec détentions ≥95%\n2. Option pour l'intégration fiscale (engagement 5 ans)\n3. Désignation de la société mère intégrante\n4. Conventions d'intégration fiscale\n5. Liasse fiscale consolidée annuelle",
    fiscalite: "IS unique au niveau de la holding ; Déficits des filiales imputables sur résultat groupe ; Plus-values intra-groupe neutralisées",
    source: "CGI art. 223 A à 223 U",
    tags: ["holding", "intégration fiscale", "groupe", "optimisation IS"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding familiale multi-générations",
    objectif: "Pérenniser le patrimoine familial sur plusieurs générations",
    conditions: "Patrimoine familial conséquent ; Plusieurs générations impliquées ; Volonté de gouvernance familiale ; Vision LT",
    avantages: "Pérennité du patrimoine familial ; Gouvernance organisée (conseil de famille) ; Donations croisées intergénérationnelles ; Fiscalité optimisée",
    risques: "Conflits familiaux potentiels ; Complexité de gouvernance ; Coûts de structure élevés ; Dilution du capital",
    etapes_juridiques: "1. Création de la holding familiale avec statuts adaptés\n2. Apport des actifs par les générations seniors\n3. Pacte d'actionnaires et règlement intérieur\n4. Conseil de famille et comités spécialisés\n5. Donations progressives aux générations juniors",
    fiscalite: "Donations intergénérationnelles avec abattements spécifiques (31 865€ grands-parents/petits-enfants) ; Cumul avec abattements parents/enfants",
    source: "CGI art. 779, 790 B - Doctrine family office",
    tags: ["holding familiale", "multi-générations", "gouvernance", "pérennité"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding avec management package",
    objectif: "Associer les managers clés au capital de la holding",
    conditions: "Reprise ou développement d'entreprise ; Managers clés à fidéliser ; Capital de la holding disponible ; Objectif de croissance",
    avantages: "Alignement d'intérêts actionnaires/managers ; Motivation et fidélisation ; Effet de levier sur performance ; Traitement fiscal favorable",
    risques: "Dilution des fondateurs ; Complexité juridique (statuts, pacte) ; Litiges potentiels en cas de départ ; Valorisation des actions",
    etapes_juridiques: "1. Création ou restructuration de la holding\n2. Définition du management package (%, vesting, conditions)\n3. Souscription ou acquisition d'actions par les managers\n4. Pacte d'actionnaires avec clauses spécifiques\n5. Mécanismes de sortie (bad leaver, good leaver)",
    fiscalite: "Acquisition d'actions: gain d'acquisition imposable en TS ; Plus-value de cession: PFU 30% ou abattement renforcé si départ retraite",
    source: "CGI art. 80 quaterdecies, 150-0 D ter - Doctrine",
    tags: ["holding", "management package", "association capital", "managers"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Holding de consolidation sectorielle",
    objectif: "Regrouper plusieurs entreprises d'un même secteur",
    conditions: "Secteur fragmenté ; Cibles identifiées ; Capacité de financement ; Synergies industrielles ; Équipe de direction",
    avantages: "Création de valeur par synergies ; Économies d'échelle ; Position dominante sectorielle ; Valorisation attractive pour cession future",
    risques: "Complexité d'intégration post-acquisition ; Risque industriel ; Financement lourd ; Dépendance au secteur",
    etapes_juridiques: "1. Création de la holding de consolidation\n2. Levée de fonds (capital + dette)\n3. Acquisitions successives des cibles\n4. Intégration opérationnelle et synergies\n5. Création de valeur et exit stratégique",
    fiscalite: "Régime de groupe avec intégration fiscale ; Plus-values professionnelles en cas de cession ultérieure ; Optimisation par LBO secondaire",
    source: "CGI art. 223 A, 219 - Private equity doctrine",
    tags: ["holding", "consolidation", "croissance externe", "synergies"],
    complexite: "complexe",
    statut: "actif"
  },

  // ==========================================
  // 2. TRANSMISSION D'ENTREPRISE (9 montages)
  // ==========================================
  {
    nom_montage: "Pacte Dutreil classique",
    objectif: "Transmettre une entreprise familiale avec abattement fiscal de 75%",
    conditions: "Entreprise opérationnelle ; Engagement collectif 2 ans + individuel 4 ans ; Fonction de direction ; Activité poursuivie",
    avantages: "Abattement exceptionnel de 75% sur valeur des titres ; Cumul avec abattements de droit commun ; Préservation de l'outil de travail familial",
    risques: "Engagements de conservation contraignants (6 ans au total) ; Sanctions lourdes si rupture ; Direction effective obligatoire ; Complexité administrative",
    etapes_juridiques: "1. Signature de l'engagement collectif de conservation (2 ans minimum)\n2. Donation ou succession des titres\n3. Déclaration fiscale avec annexe pacte Dutreil\n4. Engagement individuel de conservation (4 ans)\n5. Exercice d'une fonction de direction effective",
    fiscalite: "Abattement de 75% sur la valeur des titres ; Puis abattements classiques (100k€/enfant) ; Barème progressif sur valeur nette taxable ; IFI: exonération si biens professionnels",
    source: "CGI art. 787 B - BOFiP-ENR-DMTG-10-20-40",
    tags: ["pacte dutreil", "transmission entreprise", "abattement 75%", "succession"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Donation-partage transgénérationnelle",
    objectif: "Transmettre directement aux petits-enfants avec accord des enfants",
    conditions: "Présence de petits-enfants ; Accord unanime des enfants ; Patrimoine suffisant ; Volonté de saut de génération",
    avantages: "Saut de génération fiscalement efficace ; Abattements grands-parents/petits-enfants (31 865€) ; Réduction de 2 transmissions à 1 seule",
    risques: "Accord des enfants indispensable ; Irrévocabilité ; Risque de conflits familiaux ; Perte de contrôle par les enfants",
    etapes_juridiques: "1. Réunion familiale et accord de principe\n2. Évaluation du patrimoine à transmettre\n3. Acte notarié de donation-partage transgénérationnelle\n4. Accord exprès de chaque enfant renonçant\n5. Enregistrement et déclaration fiscale",
    fiscalite: "Abattement de 31 865€ par grand-parent et par petit-enfant ; Barème progressif 5% à 45% ; Renouvelable tous les 15 ans",
    source: "Code civil art. 1078-4 - CGI art. 790 B",
    tags: ["donation", "transmission", "petits-enfants", "saut de génération"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Cession progressive avec earn-out",
    objectif: "Vendre son entreprise avec complément de prix lié aux résultats futurs",
    conditions: "Entreprise avec potentiel de croissance ; Acheteur acceptant earn-out ; Période d'observation 2-5 ans ; Métriques définies",
    avantages: "Prix de cession optimisé si objectifs atteints ; Réduction du risque pour l'acquéreur ; Implication du cédant pendant transition ; Fiscalité étalée",
    risques: "Incertitude sur prix final ; Conflits potentiels sur calcul earn-out ; Implication prolongée du cédant ; Complexité contractuelle",
    etapes_juridiques: "1. Négociation et accord sur structure earn-out\n2. Définition précise des indicateurs (CA, EBITDA, etc.)\n3. Cession initiale avec clause earn-out\n4. Période d'observation et reporting\n5. Versement complémentaire selon performance",
    fiscalite: "Prix initial: PFU 30% ou barème IR + abattements ; Earn-out: imposé l'année de perception ; Possibilité d'abattement renforcé départ retraite",
    source: "CGI art. 150-0 D, 150-0 D ter - BOI-RPPM-PVBMI-20-20",
    tags: ["cession", "earn-out", "transmission", "prix variable"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Donation avec clause de retour conventionnel",
    objectif: "Transmettre tout en conservant une possibilité de retour des biens",
    conditions: "Donation à un enfant ; Risque d'imprévu (décès prématuré de l'enfant) ; Clause prévue dans l'acte ; Biens identifiés",
    avantages: "Sécurité pour le donateur ; Transmission anticipée ; Fiscalité de la donation appliquée ; Protection en cas de prédécès du donataire",
    risques: "Clause limitée aux biens donnés (pas les fruits) ; Complexité rédactionnelle ; Risque de requalification ; Obligation de retour effectif",
    etapes_juridiques: "1. Rédaction de l'acte de donation avec clause de retour\n2. Définition des cas de retour (décès du donataire)\n3. Enregistrement devant notaire\n4. En cas de retour: réintégration automatique\n5. Pas de nouveaux droits de mutation",
    fiscalite: "Droits de donation payés initialement ; Pas de nouveaux droits en cas de retour ; Abattements de droit commun applicables",
    source: "Code civil art. 951 - CGI art. 757",
    tags: ["donation", "clause retour", "sécurité", "transmission"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "OBO - Owner Buy Out",
    objectif: "Le dirigeant rachète son entreprise à lui-même pour optimiser la fiscalité",
    conditions: "Dirigeant détenant 100% ; Valorisation attractive ; Capacité d'endettement ; Objectif de transmission future optimisée",
    avantages: "Restructuration du capital ; Financement par la dette avec déductibilité des intérêts ; Préparation d'une transmission ou LBO ultérieur",
    risques: "Complexité fiscale ; Risque de requalification en abus de droit ; Endettement personnel ; Coûts de montage élevés",
    etapes_juridiques: "1. Création d'une holding de reprise\n2. Levée de dette bancaire senior/mezzanine\n3. Apport ou cession des titres opérationnels à la holding\n4. Remboursement de la dette par dividendes remontants\n5. Restructuration ultérieure",
    fiscalite: "Apport avec report d'imposition (CGI 150-0 B ter) ; Intérêts d'emprunt déductibles ; Régime mère-fille sur dividendes remontants",
    source: "CGI art. 150-0 B ter, 216 - Doctrine LBO",
    tags: ["OBO", "reprise", "restructuration", "effet de levier"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Transmission avec démembrement temporaire",
    objectif: "Transmettre la nue-propriété avec extinction programmée de l'usufruit",
    conditions: "Actif transmissible ; Donateur âgé ; Volonté de réduction rapide de l'IFI ; Accord des nus-propriétaires",
    avantages: "Fiscalité optimisée par barème âge ; Sortie de l'IFI rapide ; Transmission effective à terme ; Conservation temporaire des revenus",
    risques: "Perte définitive de la propriété ; Blocage de la gestion ; Conflit potentiel usufruitier/nus-propriétaires ; Extinction automatique",
    etapes_juridiques: "1. Évaluation selon barème fiscal (âge de l'usufruitier)\n2. Acte de donation de nue-propriété devant notaire\n3. Déclaration fiscale avec barème appliqué\n4. Conservation de l'usufruit par le donateur\n5. Extinction de l'usufruit au décès (réunion automatique)",
    fiscalite: "Droits calculés sur nue-propriété seule ; Barème fiscal selon âge : 10% (91+ ans), 20% (81-90 ans), 30% (71-80 ans), 40% (61-70 ans), 50% (51-60 ans)",
    source: "CGI art. 669 - Barème de l'usufruit",
    tags: ["démembrement", "usufruit", "transmission", "barème fiscal"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Cession à un fonds de private equity",
    objectif: "Céder son entreprise à un fonds d'investissement avec accompagnement",
    conditions: "Entreprise rentable avec potentiel de croissance ; EBITDA >1M€ ; Management en place ; Secteur porteur",
    avantages: "Liquidité immédiate partielle ; Réinvestissement possible au capital ; Accompagnement professionnel ; Création de valeur avec le fonds",
    risques: "Perte de contrôle majoritaire ; Pression sur performance ; Horizon de sortie 5-7 ans ; Gouvernance exigeante",
    etapes_juridiques: "1. Sélection et négociation avec fonds\n2. Due diligence approfondie (legal, financial, tax)\n3. Cession majoritaire avec réinvestissement partiel\n4. Pacte d'actionnaires et management package\n5. Accompagnement et création de valeur\n6. Exit du fonds (revente ou IPO)",
    fiscalite: "Plus-value de cession au PFU 30% ou barème + abattements ; Abattement renforcé départ retraite (500k€) si éligible ; Réinvestissement: report d'imposition",
    source: "CGI art. 150-0 D, 150-0 D ter - AFIC doctrine",
    tags: ["cession", "private equity", "LBO", "croissance"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Transmission progressive via donations graduelles",
    objectif: "Transmettre par paliers sur plusieurs années",
    conditions: "Patrimoine conséquent ; Volonté d'étalement dans le temps ; Plusieurs enfants ; Horizon 15-30 ans",
    avantages: "Utilisation optimale des abattements renouvelables (100k€/15 ans) ; Transmission en douceur ; Maintien du contrôle progressif ; Souplesse",
    risques: "Processus long ; Nécessité de répéter les actes notariés ; Coûts cumulés ; Changements législatifs possibles",
    etapes_juridiques: "1. Planification sur 15-30 ans des donations\n2. Première donation (100k€ par enfant)\n3. Attente de 15 ans pour renouvellement abattement\n4. Deuxième donation (nouveau 100k€)\n5. Répétition jusqu'à transmission complète",
    fiscalite: "Abattement de 100 000€ par parent et par enfant tous les 15 ans ; Barème progressif sur montant excédentaire ; Cumul possible avec assurance-vie",
    source: "CGI art. 779 - Doctrine transmission progressive",
    tags: ["donation", "transmission progressive", "abattements", "étalement"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "Transmission avec trust (droit international)",
    objectif: "Protéger et transmettre un patrimoine international via trust",
    conditions: "Patrimoine international ; Résidence multi-juridictionnelle ; Volonté de protection contre litiges ; Connaissance du droit anglo-saxon",
    avantages: "Protection patrimoniale élevée ; Confidentialité ; Gestion professionnelle ; Transmission hors succession ; Flexibilité",
    risques: "Complexité juridique extrême ; Fiscalité française pénalisante (exit tax, IFI) ; Coûts élevés ; Contrôles fiscaux fréquents ; Déclarations multiples",
    etapes_juridiques: "1. Sélection de la juridiction (Jersey, Guernesey, etc.)\n2. Création du trust et désignation trustee\n3. Transfert des actifs au trust\n4. Déclarations fiscales françaises (trust déclaratif)\n5. Gestion du trust selon deed of trust",
    fiscalite: "Exit tax si actifs français >800k€ ; IFI sur actifs français ; Impôt sur distributions ; Droits de succession si bénéficiaire français",
    source: "CGI art. 792-0 bis, 167 bis - Convention fiscales",
    tags: ["trust", "international", "protection", "succession"],
    complexite: "complexe",
    statut: "actif"
  },

  // ==========================================
  // 3. OPTIMISATION FISCALE DIRIGEANT (9 montages)
  // ==========================================
  {
    nom_montage: "Arbitrage rémunération / dividendes",
    objectif: "Optimiser le mix rémunération-dividendes du dirigeant",
    conditions: "Dirigeant de société à l'IS ; Dividendes distribuables ; Calcul actualisé charges sociales ; Situation personnelle analysée",
    avantages: "Optimisation de la charge sociale globale ; Modulation selon besoins de trésorerie ; Flexibilité fiscale ; Cotisations retraite adaptées",
    risques: "Équilibre à trouver (cotisations retraite) ; Contrôles URSSAF possibles ; Revenus irréguliers pour dividendes ; Disponibilité des réserves",
    etapes_juridiques: "1. Analyse de la situation (TMI, PS, cotisations)\n2. Calcul du point d'équilibre rémunération/dividendes\n3. Décision annuelle en AG sur rémunération\n4. Dividendes votés en AG après approbation des comptes\n5. Ajustements annuels selon situation",
    fiscalite: "Rémunération: IR au barème + charges sociales 45-80% ; Dividendes: PFU 30% ou barème+40% abattement ; Gérant majoritaire: CS sur dividendes >10% capital",
    source: "CGI art. 62, 200 A - CSS art. L131-6",
    tags: ["rémunération", "dividendes", "optimisation", "dirigeant"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Intéressement et participation dirigeant",
    objectif: "Mettre en place intéressement/participation incluant le dirigeant",
    conditions: "Société ≥1 salarié ; Accord d'intéressement/participation ; Inclusion du dirigeant possible si assimilé salarié (président SAS)",
    avantages: "Exonération de charges sociales (patronales et salariales) ; Déductibilité du résultat IS ; Motivation collective ; Flat tax sur placement",
    risques: "Formalisme lourd (accord, dépôt DIRECCTE) ; Inclusion de tous les salariés (égalité) ; Plafonds limités ; Disponibilité différée (5 ans)",
    etapes_juridiques: "1. Négociation et rédaction accord d'intéressement\n2. Dépôt auprès de la DIRECCTE\n3. Calcul annuel selon formule définie\n4. Versement sur PEE/PERCO ou déblocage immédiat\n5. Déclarations sociales et fiscales",
    fiscalite: "Intéressement: exonéré de charges sociales, imposable IR ; Participation: exonérée charges + IR si placée ; Abondement employeur: exonéré jusqu'à 3 290€/an",
    source: "Code du travail L3312-1 - CGI art. 163 bis AA",
    tags: ["intéressement", "participation", "dirigeant", "charges sociales"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Actions gratuites (AGA) pour dirigeants",
    objectif: "Rémunérer le dirigeant en actions gratuites de la société",
    conditions: "Société par actions (SA, SAS) ; Attribution plafonnée à 10% du capital ; Période d'acquisition (1 an min) + conservation (1 an min)",
    avantages: "Fiscalité attractive (gain d'acquisition + plus-value) ; Pas de sortie de trésorerie immédiate ; Alignement actionnaire-dirigeant ; Motivation LT",
    risques: "Dilution des actionnaires existants ; Plafond de 10% du capital ; Durée d'acquisition/conservation contraignante ; Risque de départ avant acquisition",
    etapes_juridiques: "1. AG extraordinaire autorisant le plan AGA\n2. Conseil d'administration attribuant les actions\n3. Période d'acquisition (1 an minimum)\n4. Période de conservation (1 an minimum)\n5. Cession libre après périodes",
    fiscalite: "Gain d'acquisition (valeur à attribution): imposé en TS (charges sociales réduites) ; Plus-value de cession: PFU 30% ou barème ; Employer: taxe de 20% sur gain",
    source: "CGI art. 80 quaterdecies - Code de commerce L225-197-1",
    tags: ["actions gratuites", "AGA", "rémunération", "dirigeant"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Stock-options pour dirigeants",
    objectif: "Octroyer des options de souscription/achat d'actions",
    conditions: "Société par actions ; Dirigeant salarié ou mandataire ; AG autorisant le plan ; Prix d'exercice fixé",
    avantages: "Pas de sortie de cash avant levée ; Fiscalité de la plus-value différée ; Motivation sur performance boursière ; Flexibilité",
    risques: "Complexité fiscale et sociale ; Charges patronales sur rabais éventuel ; Risque de dépréciation des actions ; Plafonds d'attribution",
    etapes_juridiques: "1. AG extraordinaire autorisant plan de stock-options\n2. Conseil d'administration attribuant les options\n3. Période d'incessibilité (4 ans depuis 2018)\n4. Levée des options par le bénéficiaire\n5. Cession des actions acquises",
    fiscalite: "Rabais éventuel (prix < valeur): imposé en TS ; Gain de levée: imposable si rabais >5% ou ≥30% ; Plus-value de cession: PFU 30% ou barème avec abattements",
    source: "CGI art. 80 bis, 163 bis C - Code commerce L225-177",
    tags: ["stock-options", "SO", "rémunération", "options"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "BSPCE (Bons de Souscription de Parts de Créateur d'Entreprise)",
    objectif: "Attribuer des bons permettant de souscrire des actions à prix préférentiel",
    conditions: "Société <15 ans ; Non cotée ; Capital détenu à 25% min par personnes physiques ; Bénéficiaire: salarié ou dirigeant",
    avantages: "Fiscalité très avantageuse (PFU 30% sur plus-value globale) ; Pas de charges sociales sur gain ; Motivation forte ; Flexibilité",
    risques: "Conditions d'éligibilité strictes ; Dilution du capital ; Valorisation au moment de l'exercice ; Risque de perte si start-up échoue",
    etapes_juridiques: "1. Vérification éligibilité société (<15 ans)\n2. AG extraordinaire autorisant émission BSPCE\n3. Conseil attribuant les BSPCE aux bénéficiaires\n4. Exercice des BSPCE (souscription d'actions)\n5. Cession des actions à terme",
    fiscalite: "Gain total (levée + cession): PFU 30% ou barème IR ; Pas de charges sociales ; Abattement pour durée de détention possible si option barème",
    source: "CGI art. 163 bis G - Code de commerce L228-98",
    tags: ["BSPCE", "start-up", "rémunération", "fiscalité avantageuse"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Compte courant d'associé rémunéré",
    objectif: "Rémunérer le dirigeant via intérêts sur avance en compte courant",
    conditions: "Dirigeant associé ; Avance de trésorerie à la société ; Capital social intégralement libéré ; Taux d'intérêt encadré",
    avantages: "Intérêts déductibles du résultat IS ; Pas de charges sociales ; Rendement garanti pour le dirigeant ; Souplesse de trésorerie",
    risques: "Plafonnement du taux d'intérêt déductible ; Risque de non remboursement si difficulté ; Imposition IR des intérêts perçus ; Risque de requalification",
    etapes_juridiques: "1. Avance en compte courant d'associé formalisée\n2. Convention réglementée si nécessaire (SARL, SA)\n3. Calcul des intérêts selon taux légal plafonné\n4. Comptabilisation et déductibilité IS\n5. Déclaration fiscale annuelle (IFU)",
    fiscalite: "Intérêts perçus: PFU 30% ou barème IR ; Intérêts versés: déductibles IS dans limite taux légal (TME + 1,74% en 2026) ; Déclaration IFU",
    source: "CGI art. 39-1-3°, 212 - Taux TMPEO",
    tags: ["compte courant", "intérêts", "rémunération", "trésorerie"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "PEE / PERCO dirigeant",
    objectif: "Bénéficier d'un plan d'épargne entreprise avec abondement",
    conditions: "Dirigeant assimilé salarié (président SAS, DG SA) ; PEE/PERCO mis en place dans l'entreprise ; Versements volontaires possibles",
    avantages: "Abondement employeur exonéré (jusqu'à 3 290€/an) ; Plus-values et revenus exonérés d'IR ; Disponibilité à 5 ans (PEE) ou retraite (PERCO)",
    risques: "Blocage des fonds 5 ans ; Plafonds de versement ; Risque de marché sur supports investis ; Abondement soumis au forfait social (20%)",
    etapes_juridiques: "1. Mise en place du PEE/PERCO dans l'entreprise\n2. Adhésion du dirigeant au plan\n3. Versements volontaires + abondement employeur\n4. Choix des supports d'investissement\n5. Déblocage après 5 ans ou cas de déblocage anticipé",
    fiscalite: "Versements: pas de déduction IR ; Abondement: exonéré IR et charges salariales (forfait social 20% pour employeur) ; Plus-values: exonérées IR (PS 17,2%)",
    source: "Code du travail L3332-1 - CGI art. 163 bis AA",
    tags: ["PEE", "PERCO", "épargne salariale", "abondement"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "Véhicule de fonction vs indemnités kilométriques",
    objectif: "Optimiser le choix entre véhicule de fonction et IK",
    conditions: "Dirigeant avec déplacements professionnels ; Choix entre véhicule société ou personnel ; Calcul IK précis ; Usage mixte",
    avantages: "Véhicule: déductibilité IS, pas d'avance de frais ; IK: souplesse, déduction forfaitaire importante ; Optimisation selon usage",
    risques: "Véhicule: avantage en nature imposable et charges sociales ; IK: justificatifs requis, plafonds ; TVS sur véhicule de fonction",
    etapes_juridiques: "1. Analyse de l'usage (km pro/an, % professionnel)\n2. Calcul comparatif véhicule vs IK\n3. Si véhicule: acquisition ou LOA par société\n4. Si IK: remboursement sur note de frais\n5. Déclarations sociales et fiscales",
    fiscalite: "Véhicule: AVN imposable IR + charges sociales (évaluation forfaitaire) ; IK: déduction IR selon barème km ; TVS sur véhicule polluant",
    source: "CGI art. 39-4, 82 - Barème IK URSSAF",
    tags: ["véhicule", "IK", "avantage nature", "optimisation"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "Portage salarial pour dirigeant en transition",
    objectif: "Exercer une activité de conseil en étant salarié d'une société de portage",
    conditions: "Dirigeant en transition ou cumul d'activités ; Missions de conseil ; Société de portage agréée ; Facturation clients",
    avantages: "Statut salarié (protection sociale, chômage) ; Simplicité administrative ; Pas de création société ; Flexibilité",
    risques: "Frais de gestion portage (5-10%) ; Cotisations sociales élevées (salarié) ; Dépendance à la société de portage ; Image moins corporate",
    etapes_juridiques: "1. Adhésion à une société de portage agréée\n2. Recherche et négociation des missions\n3. Facturation via la société de portage\n4. Portage paie le salaire après prélèvement frais\n5. Bulletin de salaire mensuel",
    fiscalite: "Revenus imposés en traitements et salaires ; Charges sociales complètes du salarié ; Abattement 10% sur salaires ; Pas d'IS ni de TVA à gérer",
    source: "Code du travail L1254-1 - Régime salarié",
    tags: ["portage salarial", "conseil", "statut salarié", "transition"],
    complexite: "simple",
    statut: "actif"
  },

  // ==========================================
  // 4. IMMOBILIER PATRIMONIAL (9 montages)
  // ==========================================
  {
    nom_montage: "SCI à l'IR familiale",
    objectif: "Détenir et transmettre un patrimoine immobilier en famille",
    conditions: "Un ou plusieurs biens immobiliers ; Plusieurs associés familiaux ; Volonté de gestion collective ; Transmission progressive",
    avantages: "Transparence fiscale (IR) ; Transmission par donation de parts ; Éviter l'indivision ; Gestion simplifiée entre héritiers",
    risques: "Formalisme (AG, comptabilité) ; Risque de mésentente familiale ; Droits d'enregistrement 5% sur apport ; Responsabilité indéfinie des associés",
    etapes_juridiques: "1. Rédaction des statuts de la SCI\n2. Apport ou acquisition des biens immobiliers\n3. Immatriculation au greffe (pas de RCS)\n4. Gestion annuelle (AG, comptes)\n5. Donation progressive de parts sociales",
    fiscalite: "Revenus fonciers imposés au niveau des associés (IR) ; Donation de parts avec abattements 100k€/15 ans ; Plus-value immobilière classique à la cession",
    source: "Code civil art. 1832 - CGI revenus fonciers",
    tags: ["SCI", "immobilier", "famille", "transmission"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "SCI à l'IS avec amortissements",
    objectif: "Optimiser la fiscalité locative via l'IS et les amortissements",
    conditions: "Patrimoine immobilier locatif ; Revenus fonciers élevés (TMI ≥30%) ; Horizon de détention LT ; Option IS irrévocable",
    avantages: "IS à 15% puis 25% (vs TMI 30-45%) ; Amortissements déductibles réduisant IS ; Charges financières 100% déductibles ; Constitution de réserves",
    risques: "Plus-value immobilière taxée à l'IS (25%) ; Plus-value sur parts sociales à la cession ; Option IS irrévocable ; Formalisme comptable lourd",
    etapes_juridiques: "1. Création SCI à l'IR\n2. Option pour l'IS (irrévocable) dans 3 mois ou 5 ans\n3. Acquisition immobilier et mise en location\n4. Comptabilité complète avec amortissements\n5. Liasse fiscale annuelle IS",
    fiscalite: "IS à 15% jusqu'à 42 500€ puis 25% ; Amortissement immobilier déductible (composants) ; Plus-value cession immeuble: IS 25% ; Plus-value parts: 30% PFU",
    source: "CGI art. 206, 219 - Doctrine SCI IS",
    tags: ["SCI IS", "immobilier", "amortissements", "optimisation"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Démembrement immobilier avec donation",
    objectif: "Donner la nue-propriété d'un bien tout en conservant l'usufruit",
    conditions: "Bien immobilier productif de revenus ; Donateur souhaitant conserver revenus ; Transmission anticipée ; Héritiers identifiés",
    avantages: "Donation avec droits réduits (nue-propriété) ; Conservation des loyers par le donateur ; Sortie de l'IFI progressive ; Réunion automatique au décès",
    risques: "Perte de libre disposition du bien ; Impossibilité de vendre seul ; Mésentente avec nus-propriétaires ; Fiscalité complexe si vente",
    etapes_juridiques: "1. Évaluation du bien et calcul barème usufruit\n2. Acte notarié de donation de nue-propriété\n3. Conservation usufruit par donateur\n4. Perception des loyers par usufruitier\n5. Extinction usufruit au décès (réunion gratuite)",
    fiscalite: "Droits de donation sur valeur nue-propriété (barème âge) ; Loyers imposables à l'usufruitier ; Réunion usufruit: pas de nouveaux droits ; IFI: valeur en PP",
    source: "CGI art. 669, 760 - Revenus fonciers",
    tags: ["démembrement", "immobilier", "usufruit", "donation"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "LMNP - Location Meublée Non Professionnelle",
    objectif: "Investir dans l'immobilier meublé avec fiscalité BIC avantageuse",
    conditions: "Acquisition d'un bien meublé ; Mise en location meublée ; Revenus locatifs <23k€ ou <50% revenus foyer ; Gestion ou mandat",
    avantages: "Régime BIC avec amortissement du bien ; Déduction charges réelles ; Récupération TVA si résidence services ; Pas de charges sociales",
    risques: "Formalisme comptable ; Gestion plus lourde que location nue ; Marché de la location meublée ; Risque de requalification en LMP",
    etapes_juridiques: "1. Acquisition du bien meublé (résidence services ou classique)\n2. Déclaration LMNP au greffe (P0i)\n3. Option micro-BIC ou réel simplifié\n4. Mise en location meublée avec bail\n5. Déclaration annuelle BIC (2031 si réel)",
    fiscalite: "Micro-BIC: abattement 50% ; Réel: amortissement déductible (25-40 ans) ; Plus-value: régime BIC si <5 ans, régime PV immo si ≥5 ans",
    source: "CGI art. 155, 39 C - BOI-BIC-CHAMP-40",
    tags: ["LMNP", "meublé", "BIC", "amortissement"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "LMP - Location Meublée Professionnelle",
    objectif: "Exercer une activité de location meublée professionnelle avec avantages fiscaux",
    conditions: "Revenus locatifs >23k€ ET >50% revenus du foyer ; Inscription au RCS ; Activité habituelle et régulière ; Gestion active",
    avantages: "Exonération IFI (biens professionnels) ; Exonération plus-value si CA <90k€ et activité ≥5 ans ; Déduction déficit sur RG ; Cotisations retraite",
    risques: "Charges sociales TNS (SSI) ; Seuils de revenus stricts ; Formalisme lourd (RCS, comptabilité) ; Cessation complexe",
    etapes_juridiques: "1. Vérification des seuils (23k€ et 50%)\n2. Inscription au RCS en tant que LMP\n3. Affiliation au SSI (sécurité sociale)\n4. Comptabilité commerciale complète\n5. Déclaration BIC professionnelle",
    fiscalite: "BIC professionnel avec charges sociales TNS ; Exonération IFI si conditions ; Exonération PV si CA <90k€, activité ≥5 ans, retraite ; Déficit imputable RG",
    source: "CGI art. 155, 151 septies - BOI-BIC-CHAMP-40",
    tags: ["LMP", "professionnel", "exonération", "IFI"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Investissement Pinel",
    objectif: "Réduire son IR via l'acquisition d'un logement neuf à louer",
    conditions: "Acquisition logement neuf ou VEFA ; Zones éligibles (A, A bis, B1) ; Engagement location 6/9/12 ans ; Plafonds loyer et ressources locataire",
    avantages: "Réduction IR de 10,5% (6 ans), 15% (9 ans), 17,5% (12 ans) ; Constitution patrimoine ; Loyers perçus ; Transmission future",
    risques: "Engagement de location contraignant ; Plafonds loyers réduisant rentabilité ; Marché locatif tendu ; Revente difficile pendant engagement",
    etapes_juridiques: "1. Acquisition logement neuf en zone éligible\n2. Engagement de location (6, 9 ou 12 ans)\n3. Mise en location dans 12 mois\n4. Respect plafonds loyers et ressources locataire\n5. Déclaration annuelle (2044 EB)",
    fiscalite: "Réduction IR: 10,5% (6 ans), 15% (9 ans), 17,5% (12 ans) sur prix acquisition plafonné 300k€ ; Loyers imposables en RF ; Plus-value immo classique à terme",
    source: "CGI art. 199 novovicies - BOI-IR-RICI-360",
    tags: ["Pinel", "défiscalisation", "neuf", "réduction IR"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Dispositif Denormandie",
    objectif: "Rénover un logement ancien en centre-ville avec réduction IR",
    conditions: "Acquisition ancien dans communes éligibles ; Travaux représentant ≥25% du coût total ; Engagement location 6/9/12 ans ; Plafonds loyer/ressources",
    avantages: "Réduction IR identique au Pinel (10,5% à 17,5%) ; Prix d'acquisition inférieur au neuf ; Rénovation du patrimoine ancien ; Centres-villes",
    risques: "Obligation de travaux lourds ; Coût et durée des travaux ; Plafonds de loyers contraignants ; Marché locatif variable",
    etapes_juridiques: "1. Acquisition logement ancien en zone éligible\n2. Réalisation travaux ≥25% (performance énergétique)\n3. Engagement de location 6/9/12 ans\n4. Mise en location dans 12 mois après travaux\n5. Déclaration 2044 EB annuelle",
    fiscalite: "Réduction IR identique Pinel sur prix acquisition + travaux plafonné 300k€ ; 25% minimum de travaux obligatoires ; Loyers imposables RF",
    source: "CGI art. 199 novovicies - Loi Denormandie 2019",
    tags: ["Denormandie", "ancien", "rénovation", "centre-ville"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Déficit foncier",
    objectif: "Créer un déficit foncier déductible du revenu global via travaux",
    conditions: "Bien immobilier locatif nu ; Travaux de rénovation/amélioration ; Revenus fonciers insuffisants ; Engagement location 3 ans",
    avantages: "Imputation déficit sur RG jusqu'à 10 700€/an ; Report excédent sur RF pendant 10 ans ; Rénovation du bien ; Valorisation patrimoine",
    risques: "Obligation de location 3 ans ; Travaux non déductibles (construction, agrandissement) ; Déficit >10 700€ non imputable RG ; Contrôle fiscal",
    etapes_juridiques: "1. Détention d'un bien locatif nu (ou acquisition)\n2. Réalisation de travaux déductibles\n3. Mise ou maintien en location nue\n4. Déclaration revenus fonciers (2044)\n5. Imputation déficit sur RG (max 10 700€)",
    fiscalite: "Déficit foncier imputable sur RG jusqu'à 10 700€/an ; Excédent reportable sur RF 10 ans ; Intérêts emprunt: déficit reportable RF uniquement",
    source: "CGI art. 156-I-3° - BOI-RFPI-BASE-20-80",
    tags: ["déficit foncier", "travaux", "déduction RG", "rénovation"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Monuments Historiques",
    objectif: "Investir dans un monument historique avec déduction illimitée des charges",
    conditions: "Immeuble classé MH ou inscrit ISMH ; Ouverture au public ou autorisation préfecture ; Travaux de restauration ; Détention ≥15 ans",
    avantages: "Déduction illimitée des charges et travaux sur RG ; Pas de plafonnement 10 700€ ; Valorisation patrimoniale exceptionnelle ; Prestige",
    risques: "Coûts très élevés (acquisition + travaux) ; Contraintes architecte des bâtiments de France ; Marché de niche restreint ; Engagement 15 ans",
    etapes_juridiques: "1. Acquisition immeuble classé/inscrit MH\n2. Autorisation préfecture pour travaux\n3. Réalisation travaux avec ABF\n4. Mise en location ou ouverture public\n5. Déclaration déduction charges (2044 spéciale)",
    fiscalite: "Déduction 100% charges et travaux sur RG sans plafond ; Engagement détention 15 ans ; Plus-value immobilière classique à la revente",
    source: "CGI art. 156-I-3° - BOI-RFPI-BASE-20-80-30",
    tags: ["monuments historiques", "MH", "déduction illimitée", "patrimoine"],
    complexite: "complexe",
    statut: "actif"
  },

  // ==========================================
  // 5. RÉINVESTISSEMENT APRÈS CESSION (8 montages)
  // ==========================================
  {
    nom_montage: "Réinvestissement Madelin (150-0 D bis)",
    objectif: "Réduire l'IR en réinvestissant le produit de cession dans une PME",
    conditions: "Cession de titres ou entreprise ; Réinvestissement dans PME <7 ans dans 3 ans ; Souscription capital de PME européenne ; Conservation 5 ans",
    avantages: "Réduction IR de 18% du montant réinvesti ; Plafond 50k€ (célibataire) ou 100k€ (couple) ; Soutien à l'économie ; Diversification",
    risques: "Engagement conservation 5 ans ; Risque de perte en capital (PME) ; Plafond de réduction limité ; Sélection PME complexe",
    etapes_juridiques: "1. Cession de titres ou entreprise\n2. Identification PME éligible (CA <50M€, <250 salariés)\n3. Souscription au capital dans les 3 ans\n4. Conservation des titres 5 ans minimum\n5. Déclaration réduction IR (2042 RICI)",
    fiscalite: "Réduction IR de 18% du montant investi ; Plafond 50k€ (célibataire), 100k€ (couple) ; Cumul possible avec autres niches (10k€ global)",
    source: "CGI art. 150-0 D bis - BOI-RPPM-PVBMI-30-10-60",
    tags: ["réinvestissement", "madelin", "PME", "réduction IR"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "FIP / FCPI - Fonds d'investissement de proximité",
    objectif: "Réinvestir dans un fonds avec réduction IR et report d'imposition",
    conditions: "Produit de cession disponible ; Souscription de parts de FIP/FCPI avant 31/12 ; Conservation 5 ans minimum ; Plafonds respectés",
    avantages: "Réduction IR de 18% (FIP) ou 25% (FCPI innovation) ; Diversification via fonds ; Gestion professionnelle ; Report d'imposition possible",
    risques: "Risque en capital élevé ; Liquidité faible pendant 5 ans ; Frais de gestion importants ; Performance variable",
    etapes_juridiques: "1. Sélection d'un FIP/FCPI agréé AMF\n2. Souscription de parts avant 31/12\n3. Conservation minimum 5 ans\n4. Gestion par société de gestion\n5. Rachat ou cession après 5 ans",
    fiscalite: "Réduction IR de 18% (FIP) ou 25% (FCPI) du montant investi ; Plafond 12k€ (célibataire), 24k€ (couple) ; Plus-values: exonération si conservation ≥5 ans",
    source: "CGI art. 199 terdecies-0 A - AMF",
    tags: ["FIP", "FCPI", "réinvestissement", "fonds"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Apport-cession avec holding",
    objectif: "Différer l'imposition de la plus-value en apportant les titres à une holding",
    conditions: "Détention de titres à céder ; Création ou utilisation holding à l'IS ; Engagement conservation 3 ans ; Réinvestissement d'au moins 50%",
    avantages: "Report d'imposition de la plus-value jusqu'à cession par la holding ; Réinvestissement sans fiscalité immédiate ; Diversification possible",
    risques: "Engagement 3 ans strict ; Report annulé si cession avant 3 ans ; Holding doit réinvestir ≥50% dans 2 ans ; Complexité du montage",
    etapes_juridiques: "1. Création ou utilisation holding à l'IS\n2. Apport des titres à la holding (report d'imposition)\n3. Engagement de conservation 3 ans\n4. Holding peut céder et réinvestir (≥50% dans 2 ans)\n5. Cession des titres de holding après 3 ans",
    fiscalite: "Report d'imposition de la plus-value d'apport ; Holding: régime mère-fille et plus-value professionnelle ; Cession finale: imposition de la plus-value initiale",
    source: "CGI art. 150-0 B ter - BOI-RPPM-PVBMI-30-10-40",
    tags: ["apport-cession", "holding", "report", "réinvestissement"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Investissement en Private Equity / FCPR",
    objectif: "Réinvestir le produit de cession dans des fonds de capital investissement",
    conditions: "Montant significatif à investir (>100k€) ; Horizon 5-10 ans ; Acceptation du risque ; Diversification géographique/sectorielle",
    avantages: "Potentiel de performance élevé ; Diversification sectorielle ; Gestion professionnelle ; Accès à des deals institutionnels",
    risques: "Risque en capital important ; Liquidité nulle pendant durée ; Frais élevés (2% gestion + 20% performance) ; Appels de fonds progressifs",
    etapes_juridiques: "1. Sélection de FCPR ou fonds PE (AMF agréé)\n2. Souscription avec engagement de capital\n3. Appels de fonds progressifs (tirage)\n4. Investissements dans sociétés cibles\n5. Distributions au fil des cessions (7-10 ans)",
    fiscalite: "Plus-values: PFU 30% ou barème avec abattement durée ; Distributions imposées année de perception ; Pas de réduction IR sauf FCPI",
    source: "AMF - Code monétaire et financier",
    tags: ["private equity", "FCPR", "réinvestissement", "capital investissement"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Rachat d'entreprise en LBO",
    objectif: "Utiliser le produit de cession pour racheter une nouvelle entreprise",
    conditions: "Cible identifiée avec EBITDA régulier ; Apport 20-40% fonds propres ; Dette senior/mezzanine 60-80% ; Management en place ou à recruter",
    avantages: "Effet de levier important ; ROI potentiel très élevé ; Expérience entrepreneuriale ; Valorisation par opérations",
    risques: "Engagement personnel lourd ; Risque de surendettement ; Dépendance performance cible ; Covenants bancaires stricts",
    etapes_juridiques: "1. Sourcing et sélection cible (EBITDA >500k€)\n2. LOI et exclusivité\n3. Due diligence complète\n4. Montage financier (dette + equity)\n5. Closing et prise de contrôle\n6. Plan de création de valeur 100 jours",
    fiscalite: "Plus-value de cession initiale: PFU 30% ou abattements ; Intérêts d'emprunt holding: déductibles IS ; Plus-value finale si revente ultérieure",
    source: "CGI art. 150-0 D - Pratique LBO",
    tags: ["LBO", "rachat", "effet de levier", "acquisition"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Diversification internationale (assurance-vie luxembourgeoise)",
    objectif: "Réinvestir à l'international avec protection et diversification",
    conditions: "Produit de cession >500k€ ; Volonté de diversification géographique ; Transmission optimisée ; Horizon LT",
    avantages: "Large univers d'investissement (tous actifs) ; Protection renforcée ; Transmission hors succession ; Confidentialité ; Gestion privée",
    risques: "Coûts de gestion élevés (1-2%/an) ; Complexité administrative ; Fiscalité française applicable ; Déclarations IFU et IFI",
    etapes_juridiques: "1. Sélection assureur luxembourgeois agréé\n2. Ouverture contrat et versement unique\n3. Allocation stratégique multi-actifs\n4. Gestion déléguée ou conseillée\n5. Transmission aux bénéficiaires désignés",
    fiscalite: "Rachats: PFU 30% (après abattements 4 600€/9 200€) ; Décès: 20% après 700k€, 31,25% après 1M€ ; Abattement 152 500€ par bénéficiaire",
    source: "CGI art. 990 I - Convention franco-luxembourgeoise",
    tags: ["assurance-vie", "luxembourg", "diversification", "international"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Investissement immobilier commercial",
    objectif: "Réinvestir dans l'immobilier d'entreprise avec rendement sécurisé",
    conditions: "Produit de cession disponible ; Capacité d'emprunt complémentaire ; Bail commercial longue durée ; Locataire solvable",
    avantages: "Rendement stable (4-7%) ; Bail commercial sécurisé (3/6/9) ; Indexation loyers ; Valorisation du capital ; Transmission facilitée",
    risques: "Liquidité faible ; Vacance locative possible ; Charges de copropriété ; Obsolescence du bien ; Taxe foncière",
    etapes_juridiques: "1. Sélection bien commercial (bureaux, commerces, entrepôt)\n2. Audit juridique et technique\n3. Acquisition avec emprunt éventuel\n4. Signature bail commercial avec locataire\n5. Gestion (directe ou mandat)",
    fiscalite: "Loyers imposables en RF (régime réel) ; Amortissements non déductibles (IR) ; Plus-value immobilière commerciale ; IFI si PP",
    source: "CGI revenus fonciers - Code de commerce baux commerciaux",
    tags: ["immobilier commercial", "bail 3/6/9", "rendement", "investissement"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Constitution de portefeuille obligataire",
    objectif: "Sécuriser le capital avec un portefeuille obligataire diversifié",
    conditions: "Besoin de sécurité après cession ; Horizon 5-10 ans ; Acceptation rendement modéré ; Diversification émetteurs",
    avantages: "Sécurité du capital ; Revenus réguliers (coupons) ; Liquidité ; Diversification géographique/sectorielle ; Volatilité limitée",
    risques: "Rendement faible (2-4%) ; Risque de taux (baisse valeur si hausse taux) ; Risque de crédit ; Inflation",
    etapes_juridiques: "1. Définition profil risque et allocation\n2. Sélection obligations (souveraines, corporate, HY)\n3. Construction portefeuille diversifié\n4. Gestion active ou passive (ETF obligataires)\n5. Réinvestissement des coupons ou distribution",
    fiscalite: "Coupons: PFU 30% ou barème IR ; Plus-values: PFU 30% ; Compte-titres ou PEA (si ETF éligibles) ; Assurance-vie possible",
    source: "CGI art. 200 A - Marchés financiers",
    tags: ["obligations", "portefeuille", "sécurité", "revenus"],
    complexite: "simple",
    statut: "actif"
  },

  // ==========================================
  // 6. STRUCTURATION FAMILIALE (8 montages)
  // ==========================================
  {
    nom_montage: "Donation-partage classique",
    objectif: "Répartir équitablement son patrimoine entre ses héritiers de son vivant",
    conditions: "Patrimoine à transmettre ; Plusieurs enfants ; Volonté d'égalité et de paix familiale ; Biens évaluables",
    avantages: "Valeurs figées au jour de la donation (pas de rapport) ; Égalité garantie entre enfants ; Paix familiale ; Abattements fiscaux",
    risques: "Irrévocabilité de la donation ; Nécessité d'accord de tous ; Difficultés si biens hétérogènes ; Réévaluation impossible",
    etapes_juridiques: "1. Inventaire et évaluation du patrimoine\n2. Répartition équitable entre enfants\n3. Acte notarié de donation-partage\n4. Acceptation de chaque enfant\n5. Enregistrement et déclaration fiscale",
    fiscalite: "Abattement 100 000€ par parent et par enfant ; Barème progressif 5% à 45% ; Valeurs figées définitivement ; Renouvelable tous les 15 ans",
    source: "Code civil art. 1075 - CGI art. 779",
    tags: ["donation-partage", "transmission", "égalité", "famille"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Assurance-vie multi-bénéficiaires",
    objectif: "Transmettre hors succession avec fiscalité avantageuse",
    conditions: "Constitution épargne ; Désignation bénéficiaires ; Versements avant 70 ans privilégiés ; Contrat diversifié",
    avantages: "Transmission hors succession ; Abattement 152 500€ par bénéficiaire ; Clause bénéficiaire flexible ; Gestion du vivant",
    risques: "Versements après 70 ans moins avantageux ; Abattement global 30 500€ ; Requalification possible si primes excessives ; Disponibilité",
    etapes_juridiques: "1. Souscription contrat assurance-vie\n2. Désignation précise des bénéficiaires\n3. Versements programmés (avant 70 ans de préférence)\n4. Gestion et arbitrages du contrat\n5. Transmission automatique au décès",
    fiscalite: "Versements avant 70 ans: 20% après 152 500€/bénéficiaire ; Versements après 70 ans: droits de succession sur primes (abattement 30 500€ global) ; Plus-values exonérées",
    source: "CGI art. 990 I, 757 B - Code des assurances",
    tags: ["assurance-vie", "transmission", "bénéficiaires", "hors succession"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "SCI familiale avec usufruitiers multiples",
    objectif: "Gérer un patrimoine immobilier familial avec démembrement",
    conditions: "Patrimoine immobilier familial ; Plusieurs générations ; Volonté de conservation ; Démembrement organisé",
    avantages: "Transmission progressive ; Conservation revenus par seniors ; Éviter indivision ; Fiscalité optimisée par démembrement",
    risques: "Complexité de gestion multi-usufruitiers ; Conflits potentiels ; Blocage décisions importantes ; Coûts structure",
    etapes_juridiques: "1. Création SCI familiale\n2. Apport immobilier à la SCI\n3. Donation de nue-propriété parts aux enfants\n4. Conservation usufruit par parents\n5. Gestion avec accord usufruitiers et nus-propriétaires",
    fiscalite: "Revenus fonciers imposés aux usufruitiers ; Donation de nue-propriété avec abattements ; Réunion usufruit gratuite au décès ; IFI sur valeur usufruit",
    source: "Code civil SCI - CGI art. 669",
    tags: ["SCI familiale", "démembrement", "usufruit", "immobilier"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Présents d'usage familiaux",
    objectif: "Transmettre des sommes modestes sans droits de donation",
    conditions: "Événements familiaux (anniversaire, mariage, Noël) ; Montants proportionnés au patrimoine ; Usage établi dans la famille",
    avantages: "Aucune fiscalité ni formalisme ; Souplesse totale ; Tradition familiale ; Répartition selon besoins",
    risques: "Montant doit être raisonnable (proportionnalité) ; Risque de requalification si montants excessifs ; Preuve de l'usage ; Conflits héritiers",
    etapes_juridiques: "1. Identification de l'événement familial\n2. Détermination du montant raisonnable\n3. Don en espèces ou chèque\n4. Pas de formalisme ni déclaration\n5. Conservation preuves (contexte, montant)",
    fiscalite: "Exonération totale si présent d'usage caractérisé ; Pas de déclaration ; Pas de droits de donation ; Non rapportable à succession",
    source: "Code civil art. 852 - Jurisprudence",
    tags: ["présents d'usage", "dons", "exonération", "famille"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "Don familial de sommes d'argent (31 865€)",
    objectif: "Transmettre de l'argent aux enfants/petits-enfants avec exonération spécifique",
    conditions: "Donateur <80 ans ; Donataire majeur ; Don en pleine propriété ; Sommes d'argent uniquement",
    avantages: "Abattement spécifique de 31 865€ cumulable avec abattement classique ; Renouvelable tous les 15 ans ; Formalisme simplifié",
    risques: "Conditions d'âge strictes (<80 ans) ; Donataire doit être majeur ; Uniquement sommes d'argent ; Déclaration obligatoire",
    etapes_juridiques: "1. Vérification conditions (âges)\n2. Don en espèces, chèque ou virement\n3. Déclaration fiscale (formulaire 2735)\n4. Enregistrement aux impôts dans 1 mois\n5. Renouvellement possible après 15 ans",
    fiscalite: "Exonération spécifique de 31 865€ par donateur et par donataire ; Cumulable avec abattement 100k€ ligne directe ; Renouvelable tous les 15 ans",
    source: "CGI art. 790 G - Formulaire 2735",
    tags: ["don familial", "argent", "exonération", "31865"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "Pacte adjoint à la donation-partage",
    objectif: "Organiser la gouvernance et la gestion future des biens donnés",
    conditions: "Donation-partage réalisée ou en cours ; Volonté d'organiser la gestion future ; Biens nécessitant gouvernance ; Accord des donataires",
    avantages: "Gouvernance organisée ; Prévention des conflits ; Clauses de rachat, préemption ; Protection du patrimoine familial",
    risques: "Complexité rédactionnelle ; Opposabilité aux tiers limitée ; Coûts notariés ; Révision difficile",
    etapes_juridiques: "1. Donation-partage principale\n2. Rédaction du pacte adjoint (clauses spécifiques)\n3. Signature par tous les donataires\n4. Enregistrement devant notaire\n5. Respect des clauses du pacte",
    fiscalite: "Fiscalité de la donation-partage applicable ; Pacte n'a pas d'incidence fiscale propre ; Clauses opposables entre parties",
    source: "Code civil art. 1078-10 - Pratique notariale",
    tags: ["pacte adjoint", "donation-partage", "gouvernance", "clauses"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Mandat de protection future",
    objectif: "Organiser la gestion de son patrimoine en cas d'incapacité future",
    conditions: "Personne soucieuse de préparer l'avenir ; Désignation d'un mandataire de confiance ; Définition des pouvoirs ; Anticipation perte d'autonomie",
    avantages: "Protection sur-mesure ; Évite la mise sous tutelle judiciaire ; Mandataire choisi librement ; Activation simple (certificat médical)",
    risques: "Confiance absolue dans le mandataire requise ; Contrôle limité une fois activé ; Révocation complexe ; Coûts notariés",
    etapes_juridiques: "1. Désignation du mandataire de confiance\n2. Définition précise des pouvoirs (gestion patrimoniale)\n3. Acte notarié recommandé (ou sous seing privé)\n4. Activation par certificat médical (constat incapacité)\n5. Gestion par le mandataire selon directives",
    fiscalite: "Pas d'incidence fiscale directe ; Actes de gestion: fiscalité classique ; Mandataire responsable déclarations fiscales",
    source: "Code civil art. 477 et suivants",
    tags: ["mandat", "protection future", "incapacité", "anticipation"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Tontine immobilière",
    objectif: "Acquérir un bien immobilier en tontine avec accroissement automatique au survivant",
    conditions: "Acquisition à plusieurs (couple, frères/sœurs) ; Clause tontine dans l'acte ; Volonté d'accroissement automatique ; Anticipation du décès",
    avantages: "Transmission automatique au survivant ; Pas de droits de succession sur l'accroissement ; Simplicité ; Protection du survivant",
    risques: "Irrévocabilité ; Impossibilité de vendre sa part ; Fiscalité sur plus-value lors de l'accroissement ; Risque de conflit",
    etapes_juridiques: "1. Acquisition immobilière à plusieurs\n2. Insertion clause tontine dans acte notarié\n3. Inscription au service de publicité foncière\n4. Au décès: accroissement automatique au survivant\n5. Pas de succession sur la part du défunt",
    fiscalite: "Pas de droits de succession sur l'accroissement ; Plus-value imposable si revente ultérieure ; IFI sur valeur totale pour survivant",
    source: "Code civil art. 1844-9 - CGI",
    tags: ["tontine", "immobilier", "accroissement", "survivant"],
    complexite: "moyen",
    statut: "actif"
  },

  // ==========================================
  // 7. PRÉPARATION RETRAITE (8 montages)
  // ==========================================
  {
    nom_montage: "PER individuel avec versements déductibles",
    objectif: "Se constituer une épargne retraite avec déduction fiscale des versements",
    conditions: "Actif en exercice ; Revenus imposables ; Horizon retraite ; Plafond de déduction disponible",
    avantages: "Déduction fiscale des versements (économie IR) ; Capitalisation jusqu'à retraite ; Sortie en rente ou capital ; Transmission possible",
    risques: "Blocage jusqu'à retraite (sauf cas exceptionnels) ; Imposition à la sortie ; Frais de gestion ; Risque de marché",
    etapes_juridiques: "1. Ouverture PER individuel auprès assureur/banque\n2. Versements volontaires (réguliers ou ponctuels)\n3. Déduction fiscale annuelle (plafond 10% revenus)\n4. Gestion du capital jusqu'à retraite\n5. Liquidation en rente ou capital à la retraite",
    fiscalite: "Versements déductibles IR (plafond 10% revenus ou 35 194€ en 2026) ; Sortie en capital: IR au barème + PS 17,2% ; Sortie en rente: IR après abattement 10%",
    source: "CGI art. 163 quatervicies - Loi PACTE",
    tags: ["PER", "retraite", "déduction", "épargne"],
    complexite: "simple",
    statut: "actif"
  },
  {
    nom_montage: "Article 83 (régime obligatoire d'entreprise)",
    objectif: "Mettre en place un régime de retraite supplémentaire pour les salariés",
    conditions: "Entreprise avec salariés ; Catégorie objective de bénéficiaires ; Cotisations employeur obligatoires ; Sortie en rente uniquement",
    avantages: "Cotisations employeur déductibles IS ; Exonération charges sociales (plafonds) ; Avantage social pour salariés ; Fidélisation",
    risques: "Obligation pour tous salariés de la catégorie ; Coût récurrent pour l'employeur ; Sortie rente viagère uniquement ; Complexité gestion",
    etapes_juridiques: "1. Décision unilatérale employeur ou accord collectif\n2. Définition catégories objectives de salariés\n3. Souscription contrat article 83 auprès assureur\n4. Cotisations employeur régulières\n5. Liquidation en rente à la retraite",
    fiscalite: "Cotisations employeur: déductibles IS, exonérées CS (plafond 5% PASS) ; Rente imposable IR après abattement 10% ; PS 10,1% sur rentes",
    source: "CGI art. 83, 163 bis - Code de la SS",
    tags: ["article 83", "retraite entreprise", "rente", "salariés"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Contrat Madelin (TNS)",
    objectif: "Constituer une retraite complémentaire pour travailleurs non-salariés",
    conditions: "Statut TNS (gérant majoritaire, profession libérale, artisan) ; Revenus professionnels ; Cotisations régulières ; Sortie en rente",
    avantages: "Cotisations déductibles du BIC/BNC (économie IR et CS) ; Plafonds élevés (jusqu'à 76k€/an) ; Complément retraite ; Protection sociale",
    risques: "Sortie en rente viagère uniquement ; Cotisations obligatoires si contrat souscrit ; Coûts de gestion ; Blocage jusqu'à retraite",
    etapes_juridiques: "1. Souscription contrat Madelin auprès assureur\n2. Versements réguliers déductibles\n3. Déclaration fiscale déduction (2035/2031)\n4. Capitalisation jusqu'à retraite\n5. Liquidation en rente viagère",
    fiscalite: "Cotisations déductibles du revenu professionnel (plafonds Madelin élevés) ; Rente imposable IR après abattement 10% ; PS 10,1% sur rentes",
    source: "CGI art. 154 bis - Loi Madelin",
    tags: ["madelin", "TNS", "retraite", "déduction"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "PERCO (Plan Épargne Retraite Collectif)",
    objectif: "Épargner pour la retraite via plan collectif d'entreprise",
    conditions: "Entreprise ≥1 salarié ; PERCO mis en place ; Versements volontaires salariés ; Abondement employeur possible ; Blocage retraite",
    avantages: "Abondement employeur (max 3 x versement salarié) ; Exonération IR sur abondement ; Transfert intéressement/participation ; Sortie capital ou rente",
    risques: "Blocage jusqu'à retraite ; Forfait social 20% sur abondement ; Frais de gestion ; Risque de marché",
    etapes_juridiques: "1. Mise en place PERCO par accord collectif\n2. Adhésion volontaire des salariés\n3. Versements + abondement employeur\n4. Gestion jusqu'à retraite\n5. Déblocage à la retraite (capital ou rente)",
    fiscalite: "Versements salariés: non déductibles IR ; Abondement: exonéré IR et CS salariales (forfait social 20%) ; Sortie capital: exonération IR (PS 17,2% sur gains)",
    source: "Code du travail L3334-1 - CGI",
    tags: ["PERCO", "épargne retraite", "abondement", "collectif"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Investissement locatif pour complément retraite",
    objectif: "Se constituer des revenus locatifs réguliers pour compléter la retraite",
    conditions: "Capacité d'investissement ou emprunt ; Acquisition bien locatif ; Mise en location ; Gestion locative ; Horizon LT",
    avantages: "Revenus locatifs réguliers et pérennes ; Constitution patrimoine transmissible ; Valorisation du capital ; Déduction charges et intérêts",
    risques: "Vacance locative ; Impayés ; Travaux d'entretien ; Fiscalité des revenus fonciers ; Gestion contraignante",
    etapes_juridiques: "1. Acquisition bien locatif (avec emprunt éventuel)\n2. Mise en location (nue ou meublée)\n3. Gestion locative (directe ou mandat)\n4. Perception des loyers\n5. Patrimoine disponible à la retraite (revenus + capital)",
    fiscalite: "Revenus fonciers imposables IR au barème ; Déduction charges et intérêts d'emprunt ; Déficit foncier possible ; Plus-value à la revente",
    source: "CGI revenus fonciers - Pratique investissement locatif",
    tags: ["investissement locatif", "retraite", "revenus", "immobilier"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Viager occupé ou libre",
    objectif: "Acquérir un bien immobilier en viager pour complément retraite futur",
    conditions: "Capacité de payer bouquet + rente ; Acceptation du risque viager ; Bien occupé (décote) ou libre ; Crédirentier âgé",
    avantages: "Prix d'acquisition réduit (viager occupé) ; Rente déductible partiellement ; Constitution patrimoine progressif ; Transmission facilitée",
    risques: "Aléa sur durée de vie du crédirentier ; Rente à payer à vie ; Bien occupé (pas de loyers) ; Complexité juridique",
    etapes_juridiques: "1. Recherche et sélection bien en viager\n2. Négociation bouquet et rente viagère\n3. Acte notarié de vente en viager\n4. Paiement bouquet + rentes mensuelles/trimestrielles\n5. Libération du bien au décès du crédirentier",
    fiscalite: "Bouquet: pas de fiscalité ; Rentes: déductibilité partielle selon âge crédirentier ; Crédirentier: rente imposable IR (abattement selon âge)",
    source: "Code civil art. 1968 - CGI revenus fonciers",
    tags: ["viager", "rente", "acquisition", "retraite"],
    complexite: "complexe",
    statut: "actif"
  },
  {
    nom_montage: "Rachat de trimestres de retraite",
    objectif: "Améliorer sa pension en rachetant des trimestres manquants",
    conditions: "Trimestres manquants pour carrière complète ; Études supérieures ou années incomplètes ; Budget disponible ; Rachat avant retraite",
    avantages: "Amélioration pension de retraite ; Départ anticipé possible ; Déduction fiscale des rachats ; Rentabilité si longévité",
    risques: "Coût élevé (jusqu'à 6-7k€/trimestre) ; Rentabilité dépend de l'espérance de vie ; Déduction fiscale limitée ; Calcul complexe",
    etapes_juridiques: "1. Simulation auprès caisse de retraite\n2. Demande de rachat de trimestres\n3. Choix option (taux seul ou taux + durée)\n4. Paiement échelonné possible\n5. Validation trimestres et impact pension",
    fiscalite: "Versements déductibles du revenu imposable ; Amélioration de la pension (imposable IR après abattement 10%) ; Rentabilité fiscale selon TMI",
    source: "Code de la SS L351-14-1 - CGI",
    tags: ["rachat trimestres", "retraite", "pension", "déduction"],
    complexite: "moyen",
    statut: "actif"
  },
  {
    nom_montage: "Cumul emploi-retraite optimisé",
    objectif: "Cumuler pension de retraite et revenus d'activité",
    conditions: "Retraite liquidée à taux plein ; Cessation activité salariée préalable ; Reprise activité possible immédiatement ; Tous régimes liquidés",
    avantages: "Cumul pension + revenus sans limite ; Complément de revenus significatif ; Maintien activité professionnelle ; Cotisations sans droits nouveaux",
    risques: "Conditions de taux plein strictes ; Pas de nouveaux droits à retraite ; Cotisations à fonds perdu ; Fiscalité cumulative (pension + revenus)",
    etapes_juridiques: "1. Liquidation de toutes les pensions (régimes de base + complémentaires)\n2. Cessation de l'activité salariée\n3. Reprise d'activité (chez nouvel employeur après 6 mois)\n4. Cumul pension + salaire\n5. Déclarations fiscales cumulées",
    fiscalite: "Pension imposable IR (abattement 10%) ; Revenus d'activité imposables IR (abattement 10% si salaire) ; Cumul peut faire augmenter TMI ; CSG/CRDS sur pension et salaire",
    source: "Code de la SS L161-22 - Réforme retraites",
    tags: ["cumul emploi-retraite", "pension", "activité", "complément"],
    complexite: "moyen",
    statut: "actif"
  },
];
