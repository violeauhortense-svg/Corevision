# Module Pré-analyse - Documentation

## 📋 Vue d'ensemble

Le module Pré-analyse offre une vue stratégique complète et immédiate du patrimoine client avec des outils d'analyse avancés et des recommandations automatiques.

## 🎯 Fonctionnalités principales

### 1️⃣ Profils Client
- **Profil fiscal** : Classification automatique selon la pression fiscale
- **Profil patrimonial** : Segmentation par niveau de patrimoine
- **Profil risque** : Évaluation basée sur la répartition d'actifs

### 1.5 🏛️ Pyramide Patrimoniale (NOUVEAU)
**Objectif** : Visualisation stratégique de la répartition du patrimoine par étage

#### Les 4 étages de la pyramide :
1. **💧 Liquidités (Base - 20% cible)**
   - Livrets, comptes courants, fonds euros
   - Sécurité et disponibilité immédiate

2. **💰 Revenus (30% cible)**
   - Obligations, SCPI, immobilier locatif
   - Génération de revenus réguliers

3. **🌱 Croissance (35% cible)**
   - Actions, PEA, immobilier non loué
   - Développement du patrimoine

4. **🏔️ Transmission (15% cible)**
   - Assurance-vie, donations, démembrement
   - Optimisation successorale

#### Visualisation
- **Barres comparatives** : Actuel vs Cible pour chaque étage
- **Indicateur de qualité** : Excellente / Bonne / À améliorer / À restructurer
- **Tableau récapitulatif** : Montants et ajustements nécessaires
- **Actions prioritaires** : Top 3 des optimisations à réaliser

#### Exploitation IA
Les données de la pyramide sont structurées pour alimenter :
- Recommandations automatiques de rééquilibrage
- Détection des déséquilibres structurels
- Suggestions de produits adaptés par étage

### 1.6 💰 Capacité d'Épargne (NOUVEAU)
**Objectif** : Calcul précis de la capacité d'épargne selon le profil

#### Mode Particulier - Méthode 50/30/20
```
Revenu disponible = Revenus - Impôts - Charges
├─ 50% → Besoins essentiels (logement, alimentation, santé)
├─ 30% → Envies & Loisirs (vacances, shopping, loisirs)
└─ 20% → Épargne & Investissement (cible)
```

**Visualisation** :
- 3 barres de progression (50% / 30% / 20%)
- Graphique circulaire de répartition
- Indicateurs mensuels et annuels
- Niveau de qualité : Excellent / Bon / Moyen / Faible

#### Mode Professionnel - Analyse via BFR
```
BFR = Stock + Créances clients - Dettes fournisseurs
Trésorerie = Résultat exploitation - BFR - Impôts
Capacité d'épargne = Trésorerie disponible
```

**Visualisation** :
- Détail des composantes du BFR
- Calcul de la trésorerie disponible
- Formule détaillée du BFR
- Recommandations d'optimisation du cycle d'exploitation

#### Recommandations automatiques
- **Particulier** : Automatisation, objectif 20%, diversification
- **Professionnel** : Optimisation délais, réduction stock, réserve trésorerie

### 2️⃣ Calculs Patrimoniaux
Tous les indicateurs clés avec visualisation graphique

### 3️⃣ Indicateurs et Scoring
Scoring détaillé sur 7 dimensions patrimoniales

### 4️⃣ Problèmes Détectés
Détection automatique des points d'attention avec niveau de sévérité

### 5️⃣ Simulations & Projections
Projections sur 10/20/30 ans (retraite, succession, fiscalité, performance)

### 6️⃣ Recommandations IA
Recommandations patrimoniales générées par Mistral AI

## 🔧 Architecture technique

### Fichiers
```
pre-analyse/
├── ProfilsClient.tsx            # Profils client
├── CalculsPatrimoniaux.tsx      # Calculs patrimoniaux
├── PyramidePatrimoniale.tsx     # 🆕 Pyramide patrimoniale
├── CapaciteEpargne.tsx          # 🆕 Capacité d'épargne
├── ProblemesDetectes.tsx        # Détection problèmes
├── SimulationsProjections.tsx   # Simulations
├── types.ts                     # Typages TypeScript
├── utils.ts                     # Fonctions utilitaires
└── README.md                    # Documentation
```

### Calculs intelligents

#### Pyramide patrimoniale
Les actifs sont automatiquement catégorisés :
- **Liquidités** : Détecte livrets, comptes, fonds euros
- **Revenus** : Identifie obligations, SCPI, immobilier locatif
- **Croissance** : Repère actions, PEA, crypto, immobilier non loué
- **Transmission** : Trouve assurances-vie (hors fonds euros)

#### Capacité d'épargne
Le calcul s'adapte automatiquement :
- Type client détecté (particulier vs professionnel)
- Méthode de calcul appropriée
- Recommandations personnalisées
- Niveau de performance évalué

## 🎨 Design

### Principes
- **Progressive disclosure** : Information par niveaux
- **Visual hierarchy** : Titres, couleurs, espacements
- **Data visualization** : Barres, jauges, graphiques
- **Action-oriented** : Boutons, recommandations claires

### Couleurs
- **Liquidités** : Cyan (💧)
- **Revenus** : Blue (💰)
- **Croissance** : Green (🌱)
- **Transmission** : Purple (🏔️)
- **Alertes** : Red/Orange/Yellow selon sévérité

## 🚀 Utilisation

### Import
```typescript
import { PyramidePatrimoniale } from './pre-analyse/PyramidePatrimoniale';
import { CapaciteEpargne } from './pre-analyse/CapaciteEpargne';
```

### Pyramide Patrimoniale
```tsx
<PyramidePatrimoniale 
  patrimoineTotal={calculs.patrimoineTotal}
  liquidites={pyramideData.liquidites}
  revenusPatrimoine={pyramideData.revenusPatrimoine}
  croissance={pyramideData.croissance}
  transmission={pyramideData.transmission}
/>
```

### Capacité d'Épargne
```tsx
<CapaciteEpargne 
  totalRevenus={calculs.totalRevenus}
  impotTotal={calculs.impotTotal}
  chargesAnnuelles={calculs.chargesAnnuelles}
  typeClient="particulier" // ou "professionnel"
  // Pour professionnels uniquement :
  chiffreAffaires={500000}
  chargesExploitation={350000}
  stockMoyen={50000}
  creancesClients={80000}
  dettesFournisseurs={60000}
/>
```

## 📊 Données exploitables par l'IA

### Structure de sortie
Les deux modules génèrent des données structurées exploitables :

```typescript
// Pyramide
{
  etages: [
    {
      nom: string,
      actuel: number,      // %
      cible: number,       // %
      ecart: number,       // %
      montantActuel: number,
      montantCible: number,
      ajustement: number   // montant à déplacer
    }
  ],
  qualiteAllocation: 'Excellente' | 'Bonne' | 'À améliorer' | 'À restructurer',
  actionsPrioritaires: string[]
}

// Capacité d'épargne
{
  capaciteEpargne: number,
  tauxEpargne: number,    // %
  niveau: 'excellent' | 'bon' | 'moyen' | 'faible',
  recommandation: string,
  details: {
    // Particulier
    besoins: number,
    envies: number,
    epargne: number,
    // OU Professionnel
    bfr: number,
    tresorerie: number
  }
}
```

## 🔮 Évolutions futures

### Court terme
- [ ] Détection automatique particulier/professionnel
- [ ] Historique de la pyramide patrimoniale
- [ ] Objectifs d'épargne personnalisés

### Moyen terme
- [ ] Simulation de rééquilibrage de la pyramide
- [ ] Calcul BFR enrichi (délais réels)
- [ ] Export PDF des analyses

### Long terme
- [ ] Recommandations IA spécifiques à chaque étage
- [ ] Alertes automatiques sur déséquilibres
- [ ] Intégration avec module Objectifs

## 📝 Notes techniques

### Performance
- Calculs en `useMemo` pour optimisation
- Pas de recalcul inutile
- Rendu conditionnel des composants lourds

### Robustesse
- Protection contre valeurs nulles/undefined
- Fallback sur catégories manquantes
- Gestion des cas limites (patrimoine = 0, etc.)

### Accessibilité
- Attributs aria appropriés
- Contraste couleurs respecté
- Navigation clavier fonctionnelle

---

**Dernière mise à jour** : Avril 2026
**Version** : 2.0
**Auteur** : Équipe CoreVision
