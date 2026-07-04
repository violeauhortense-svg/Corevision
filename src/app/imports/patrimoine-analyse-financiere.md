Améliorer l’onglet **“Patrimoine” – partie professionnelle** en ajoutant un encart d’analyse financière de l’entreprise.

⚠️ Contraintes importantes :

* Cette modification doit **uniquement ajouter un encart supplémentaire**.
* L’encart doit être **positionné entre la section "Détail Actif / Passif" et la section "Résultat et Dividendes"**.
* **Aucune modification ne doit être apportée à la structure existante du logiciel**, aux autres onglets, ni aux composants déjà présents.
* Les sections existantes doivent rester **strictement identiques** (mêmes champs, mêmes calculs, mêmes données).

---

### Nom de l’encart

**Analyse du cycle d’exploitation et de la trésorerie**

---

### Objectif

Créer un indicateur permettant d’analyser la capacité de l’entreprise à financer son **Besoin en Fonds de Roulement (BFR)** et à identifier une **trésorerie potentiellement mobilisable pour des placements financiers ou une optimisation patrimoniale**.

Les calculs doivent se baser uniquement sur les données déjà présentes dans la fiche entreprise.

---

### Données utilisées

* Trésorerie disponible
* Besoin en Fonds de Roulement (BFR)
* Comptes courants d’associés
* Chiffre d’affaires annuel (si disponible)
* Charges mensuelles (si disponible)

---

### Calculs automatiques à intégrer

1. **Couverture du BFR par la trésorerie**

Ratio = Trésorerie / BFR

Interprétation :

* < 1 → trésorerie insuffisante pour couvrir le cycle d’exploitation
* 1 à 1,5 → situation équilibrée
* > 1,5 → trésorerie excédentaire potentielle

---

2. **Financement du BFR par les comptes courants d’associé**

Ratio = Comptes courants d’associé / BFR

Interprétation :

* > 1 → BFR majoritairement financé par l’associé
* 0,5 à 1 → financement mixte
* < 0,5 → financement principalement interne ou bancaire

---

3. **Trésorerie excédentaire après financement du cycle**

Trésorerie excédentaire = Trésorerie - BFR

---

4. **Trésorerie de sécurité**

Trésorerie de sécurité = Charges mensuelles × 3

(si les charges ne sont pas renseignées, afficher simplement le calcul précédent)

---

5. **Trésorerie potentiellement mobilisable**

Trésorerie mobilisable = Trésorerie - BFR - Trésorerie de sécurité

---

### Interface utilisateur

Créer un encart structuré en trois parties :

**1. Tableau des indicateurs**

| Indicateur               | Calcul           | Résultat    |
| ------------------------ | ---------------- | ----------- |
| Couverture BFR           | Trésorerie / BFR | automatique |
| Financement par associés | CCA / BFR        | automatique |
| Trésorerie excédentaire  | Trésorerie - BFR | automatique |

---

**2. Analyse visuelle**

Ajouter un indicateur visuel ou jauge avec trois niveaux :

* rouge : tension de trésorerie
* orange : équilibre
* vert : trésorerie excédentaire

---

**3. Synthèse**

Afficher un bloc de synthèse :

**“Trésorerie potentiellement mobilisable : XX €”**

avec une courte indication automatique :

* "Trésorerie majoritairement utilisée pour financer le cycle d’exploitation"
* "Situation équilibrée"
* "Excédent de trésorerie pouvant être étudié pour des placements ou optimisations financières"

---

### Design

* Encadré clair et lisible
* Cohérent avec le style existant de l’onglet patrimoine
* Tableaux simples et lecture rapide pour un conseiller patrimonial
* Les résultats doivent se mettre à jour automatiquement lorsque les données financières de l’entreprise sont modifiées
