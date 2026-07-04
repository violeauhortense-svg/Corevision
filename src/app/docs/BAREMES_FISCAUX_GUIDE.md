# 📊 Guide de mise à jour des barèmes fiscaux

## 🎯 Objectif

Ce guide explique comment mettre à jour les barèmes fiscaux de l'application CRM sans toucher au code.

---

## 🔧 Système mis en place

### Architecture

```
Frontend (React)
    ↓
fiscalCalculatorDynamic.ts (avec cache 5 min)
    ↓
Routes Backend (/baremes/:annee)
    ↓
KV Store Supabase
```

### Fichiers créés

1. **`/services/fiscalCalculatorDynamic.ts`** - Service de calcul fiscal dynamique
2. **`/supabase/functions/server/baremes_routes.tsx`** - Routes backend pour gérer les barèmes
3. **`/hooks/useBaremesFiscaux.ts`** - Hook React pour charger les barèmes
4. **`/components/admin/BaremesFiscauxAdmin.tsx`** - Interface d'administration
5. **`/components/BaremeUpdateNotification.tsx`** - Notification de mise à jour

---

## 📝 Comment mettre à jour les barèmes

### Méthode 1 : Interface graphique (RECOMMANDÉ)

1. **Connectez-vous** à l'application avec le compte admin (`violeau.hortense@gmail.com`)

2. **Accédez à l'interface** :
   - Cliquez sur le bouton **"Barèmes Fiscaux"** dans la sidebar (visible uniquement pour l'admin)
   - Icône : 🧮 Calculator

3. **Consultez les sources officielles** :
   - Les liens vers impots.gouv.fr, service-public.fr et BOFIP sont affichés en haut de la page
   - Vérifiez les barèmes 2026 officiels

4. **Modifiez les barèmes** :
   - **Barème IR** : 5 tranches avec min, max, taux et label
   - **Barème IFI** : 6 tranches avec les mêmes paramètres
   - **Prélèvements sociaux** : CSG, CRDS, Prélèvement solidarité
   - **Abattements** : Plafonds, planchers, décotes

5. **Enregistrez** :
   - Cliquez sur le bouton **"Enregistrer"**
   - Un message de confirmation apparaît
   - Le cache est automatiquement invalidé

6. **Rechargez** :
   - Les utilisateurs connectés reçoivent une notification
   - Ils peuvent recharger l'application pour utiliser les nouveaux barèmes

---

### Méthode 2 : API REST (pour automatisation)

#### Récupérer les barèmes actuels

```bash
GET https://{projectId}.supabase.co/functions/v1/make-server-cac859af/baremes/2026
Authorization: Bearer {publicAnonKey}
```

**Réponse** :
```json
{
  "annee": "2026",
  "baremeIR": [...],
  "baremeIFI": [...],
  "prelevementsSociaux": {...},
  "abattements": {...}
}
```

#### Mettre à jour les barèmes

```bash
PUT https://{projectId}.supabase.co/functions/v1/make-server-cac859af/baremes/2026
Authorization: Bearer {publicAnonKey}
Content-Type: application/json

{
  "baremeIR": [
    { "min": 0, "max": 11294, "taux": 0, "label": "Tranche 1 : 0%" },
    { "min": 11294, "max": 28797, "taux": 0.11, "label": "Tranche 2 : 11%" },
    ...
  ],
  "baremeIFI": [...],
  "prelevementsSociaux": {...},
  "abattements": {...}
}
```

---

## 📅 Calendrier de mise à jour

### Chaque année (Décembre/Janvier)

1. **Décembre** : La Loi de Finances est publiée au Journal Officiel
2. **Janvier** : Vérifier les barèmes sur impots.gouv.fr
3. **Mise à jour** : Modifier les barèmes via l'interface d'admin
4. **Test** : Vérifier les calculs avec des cas clients réels
5. **Communication** : Informer les utilisateurs de la mise à jour

### Checklist annuelle

- [ ] Barème IR (5 tranches)
- [ ] Abattement 10% plafonné
- [ ] Décote (seuils et plafonds)
- [ ] Plafond micro-foncier (15 000 €)
- [ ] Barème IFI (si changement)
- [ ] Prélèvements sociaux (17,2% stable depuis 2018)

---

## 🔍 Sources officielles

### 1. Impots.gouv.fr

**URL** : https://www.impots.gouv.fr

**Sections importantes** :
- Barème de l'impôt sur le revenu
- Tranches et taux d'imposition
- Abattements et plafonds

### 2. Service Public

**URL** : https://www.service-public.fr/particuliers/vosdroits/F1419

**Contenu** :
- Barème IR actualisé
- Exemples de calcul
- FAQ

### 3. BOFIP (Bulletin Officiel des Finances Publiques)

**URL** : https://bofip.impots.gouv.fr

**Sections** :
- IR-BASE (Impôt sur le revenu - Base)
- Barèmes progressifs
- Documentation technique

### 4. Loi de Finances

**Publication** : Fin décembre au Journal Officiel

**Contenu** :
- Barèmes officiels pour l'année suivante
- Indexation sur l'inflation
- Modifications fiscales

---

## ⚙️ Détails techniques

### Cache

- **Durée** : 5 minutes
- **Invalidation** : Automatique après mise à jour
- **Stockage** : Variable locale `baremesCached`

### Fallback

Si les barèmes ne peuvent pas être chargés depuis Supabase, le système utilise des **barèmes par défaut** définis dans `getDefaultBaremes()`.

### Barèmes 2026 actuels (estimation)

**Source** : Indexation +4,8% sur 2025 (à vérifier avec la Loi de Finances officielle)

#### Barème IR
- Tranche 1 : 0 → 11 294 € (0%)
- Tranche 2 : 11 294 → 28 797 € (11%)
- Tranche 3 : 28 797 → 82 341 € (30%)
- Tranche 4 : 82 341 → 177 106 € (41%)
- Tranche 5 : > 177 106 € (45%)

#### Prélèvements sociaux
- CSG : 9,2%
- CRDS : 0,5%
- Prélèvement solidarité : 7,5%
- **Total : 17,2%**

#### Abattements
- Plafond abattement 10% : 13 522 €
- Plancher abattement 10% : 472 €
- Plafond décote célibataire : 1 929 €
- Plafond décote couple : 3 191 €
- Plafond micro-foncier : 15 000 €

---

## 🐛 Dépannage

### Les barèmes ne se chargent pas

1. Vérifier la connexion à Supabase
2. Vérifier les logs du serveur backend
3. Tester l'endpoint `/baremes/2026` avec Postman
4. Vérifier que les barèmes sont bien stockés dans le KV Store

### Les calculs sont incorrects

1. Vérifier les barèmes dans l'interface d'admin
2. Comparer avec les sources officielles
3. Tester avec un cas simple (ex: célibataire, 30 000 € de revenu)
4. Vérifier les logs de calcul dans la console

### La notification ne s'affiche pas

1. Vérifier le localStorage (`baremes_last_update`)
2. Forcer un rechargement : `localStorage.removeItem('baremes_last_update')`
3. Vérifier que l'endpoint retourne bien un champ `updated`

---

## 📚 Ressources complémentaires

- **Code source** : `/services/fiscalCalculatorDynamic.ts`
- **Documentation API** : `/supabase/functions/server/baremes_routes.tsx`
- **Interface admin** : `/components/admin/BaremesFiscauxAdmin.tsx`

---

## ✅ Checklist de mise en production

- [x] Routes backend enregistrées dans le serveur
- [x] Interface d'administration créée
- [x] Hook React pour charger les barèmes
- [x] Composants migrés vers le système dynamique
- [x] Notification de mise à jour implémentée
- [x] Guide de mise à jour rédigé
- [x] Barèmes 2026 initialisés (à vérifier avec sources officielles)

---

**Dernière mise à jour** : 16 mars 2026  
**Auteur** : Système automatisé CoreVision CRM
