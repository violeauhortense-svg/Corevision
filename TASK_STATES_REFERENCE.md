# 🎯 Référence - Les 3 États d'une Tâche

**Fichiers associés:**
- Backend: `src/app/backend/task_states.tsx` (validation + logique)
- Backend: `src/app/backend/task_routes.tsx` (endpoints)
- Frontend: `src/app/components/TasksTab.tsx` (UI + actions)

---

## 📊 Les 3 États

### **☑️ VALIDÉE** (`validated`)

**Signification:**
- La tâche est cochée ✓
- La date de validation est enregistrée
- Qui a validé est tracé (user.id)

**Compte pour progression?** ✅ **OUI**

**Quand l'utiliser:**
- Utilisateur clique "✅ Valider"
- La tâche a été complétée normalement

**Données enregistrées:**
```typescript
{
  id: string,
  title: string,
  completed: true,           // ← Important!
  status: 'validated',       // ← État
  validated_at: ISO8601,     // ← Timestamp
  validated_by: user_id,     // ← Audit trail
  validated_by_name: email,  // ← Lisible
  updated_at: ISO8601,
}
```

---

### **⊘ NON CONCERNÉE** (`na`)

**Signification:**
- La tâche ne s'applique PAS pour ce client
- Équivalente à "validée" pour la progression
- Exemples: "Signature par époux" si client célibataire

**Compte pour progression?** ✅ **OUI** (pareil que validée)

**Quand l'utiliser:**
- Utilisateur clique "⊘ Non concernée"
- La tâche ne s'applique pas à ce client

**Données enregistrées:**
```typescript
{
  id: string,
  title: string,
  completed: true,        // ← Important!
  status: 'na',           // ← État
  na_at: ISO8601,         // ← Timestamp
  na_by: user_id,         // ← Audit trail
  na_by_name: email,      // ← Lisible
  updated_at: ISO8601,
}
```

---

### **☐ NON VALIDÉE** (`pending`)

**Signification:**
- La tâche doit encore être complétée
- État par défaut quand la tâche est créée
- La progression est BLOQUÉE tant qu'il reste des tâches pending

**Compte pour progression?** ❌ **NON**

**Quand l'utiliser:**
- État initial (automatique)
- Utilisateur annule sa validation (repasse en pending)

**Données enregistrées:**
```typescript
{
  id: string,
  title: string,
  completed: false,      // ← Important!
  status: 'pending',     // ← État
  updated_at: ISO8601,
  // Pas de validated_at / validated_by
  // Pas de na_at / na_by
}
```

---

## 🔄 Flux des états

```
   ┌─────────────────────────────────────┐
   │  ☐ PENDING (état initial)           │
   │  Utilisateur doit compléter         │
   └────────────┬────────────────────────┘
                │
         [Utilisateur agit]
                │
        ┌───────┴────────┐
        │                │
    ✅ VALIDER       ⊘ N.A.
        │                │
        ▼                ▼
   ┌─────────────┐  ┌─────────────┐
   │ ☑️ VALIDÉE  │  │ ⊘ NON CONC. │
   │ completed   │  │ completed   │
   │ validated   │  │ na          │
   └─────────────┘  └─────────────┘
        │                │
        └───────┬────────┘
                │
        (Les 2 comptent pour
         la progression)
                │
                ▼
    [Si TOUS les autres sont OK]
                │
                ▼
    ✨ PROGRESSION au statut suivant
```

---

## 💾 Comment appeler le backend

### **Mettre à jour une tâche**

```bash
PATCH /clients/:clientId/tache/:taskIdx
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "validated",    # OU "na" OU "pending"
  "completed": true,        # OU false
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Task marked as ✅ Validée",
  "task": { /* tâche mise à jour */ },
  "client": { /* client complet */ },
  "stats": {
    "taskStatus": "validated",
    "allCompleted": false,
    "counts": {
      "validated": 2,
      "na": 1,
      "pending": 1,
    }
  }
}
```

**Codes d'erreur:**
- `400` - Status invalide ou taskIdx invalide
- `401` - Authentification échouée
- `404` - Client introuvable
- `500` - Erreur serveur

---

### **Progresser vers le statut suivant**

```bash
POST /clients/:clientId/progress
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "fromStatus": "Prospect",
  "toStatus": "Découverte",
}
```

**Réponse (succès):**
```json
{
  "success": true,
  "message": "Client progressed to \"Découverte\"",
  "client": { /* client complet */ },
  "previousStatus": "Prospect",
  "newTaskCount": 4,
}
```

**Réponse (erreur - tâches pendantes):**
```json
{
  "error": "Cannot progress: 1 task(s) still pending in \"Prospect\"",
  "code": "TASKS_NOT_COMPLETED",
  "stats": {
    "validated": 3,
    "na": 0,
    "pending": 1,  # ← Blocage!
    "total": 4,
  }
}
```

HTTP Status: `422 Unprocessable Entity`

---

## 🎨 Frontend - Comment afficher les états

### **Badges**

```typescript
// src/app/backend/task_states.tsx export TASK_STATE_LABELS

export const TASK_STATE_LABELS: Record<TaskState, string> = {
  validated: '✅ Validée',
  na: '⊘ Non concernée',
  pending: '☐ Non validée',
};

// Usage dans TasksTab.tsx:
<span className={getStateBadgeClass(task.status)}>
  {TASK_STATE_LABELS[task.status]}
</span>
```

### **Boutons d'action**

```typescript
// Afficher les 3 boutons d'action:
<button onClick={() => handleTaskUpdate(taskIdx, 'validated')}>
  ✅ Valider
</button>

<button onClick={() => handleTaskUpdate(taskIdx, 'na')}>
  ⊘ Non concernée
</button>

<button onClick={() => handleTaskUpdate(taskIdx, 'pending')}>
  ☐ Réinitialiser
</button>
```

### **Info tooltip au survol**

```typescript
// Montrer qui a validé et quand:
<div 
  title={
    task.status === 'validated'
      ? `Validée par ${task.validated_by_name} le ${formatDate(task.validated_at)}`
      : task.status === 'na'
      ? `Non concernée. Marquée par ${task.na_by_name} le ${formatDate(task.na_at)}`
      : 'En attente de validation'
  }
>
  {task.title}
</div>
```

---

## 📊 Logique de progression

### **Blocages**

La progression est **BLOQUÉE** si:
- ❌ Il reste 1+ tâches en état `pending`

La progression est **AUTORISÉE** si:
- ✅ TOUTES les tâches sont `validated` OU `na`

### **Exemple: Prospect → Découverte**

```
Prospect a 4 tâches:
├─ p1: Origine          → ✅ validated
├─ p2: Contact RDV      → ⊘ na
├─ p3: Doc comptable    → ✅ validated
└─ p4: Interne          → ☐ pending  ← BLOQUE!

Réponse serveur:
{
  "error": "Cannot progress: 1 task(s) still pending",
  "code": "TASKS_NOT_COMPLETED",
  "stats": {
    "validated": 2,
    "na": 1,
    "pending": 1,  # ← Le problème
  }
}

Frontend affiche:
"❌ Complétez 1 tâche avant de progresser"
```

Après validation de p4:
```
Prospect:
├─ p1: ✅ validated
├─ p2: ⊘ na
├─ p3: ✅ validated
└─ p4: ✅ validated  ← DÉBLOQUÉ!

Bouton "➡️ Passer à Découverte" s'affiche
```

---

## 🔒 Validation & Sécurité

### **Validation côté backend**

```typescript
// src/app/backend/task_states.tsx

// 1. État valide?
isValidTaskState('validated')  // true
isValidTaskState('foo')        // false

// 2. L'état compte-t-il pour progression?
isTaskCompleted('validated')   // true
isTaskCompleted('na')          // true
isTaskCompleted('pending')     // false

// 3. TOUTES les tâches sont complétées?
areAllTasksCompleted(tasks)    // true/false

// 4. Stats par état?
countTasksByState(tasks)
// { validated: 2, na: 1, pending: 1 }
```

### **Cas limites**

```
Edge case 1: Tâche sans status?
→ Défaut à 'pending' lors de création

Edge case 2: Repasser de 'validated' à 'pending'?
→ Efface les métadonnées validated_at/validated_by

Edge case 3: 2 clics simultanés?
→ Dernier gagne (dernière sauvegarde écrase)
→ Solution P0: Transactions PostgreSQL (déjà documenté)
```

---

## 📝 Checklist: Mettre à jour une tâche

**Backend fait:**
- ✅ Validation stricte des états
- ✅ Enregistrement des timestamps
- ✅ Tracage audit (qui, quand)
- ✅ Vérification avant progression
- ✅ Codes d'erreur standards

**Frontend doit faire:**
- [ ] Importer `TASK_STATE_LABELS` et `TASK_STATES`
- [ ] Afficher badges avec styles appropriés
- [ ] Montrer 3 boutons: Valider / N.A. / Réinitialiser
- [ ] Afficher tooltip avec info validation
- [ ] Afficher compteur: "X/4 complétées"
- [ ] Désactiver bouton progression si tasks pending
- [ ] Afficher message d'erreur si progression échoue

---

## 🚀 Prochaines étapes

### **P0 - Maintenant**
- ✅ Validation stricte des états (FAIT)
- ✅ Vérification de completion (FAIT)
- [ ] Mettre à jour frontend pour afficher les 3 boutons

### **P1 - Bientôt**
- [ ] Transactions PostgreSQL (pour la race condition)
- [ ] Audit trail avec IDs uniques (voir TASK_VALIDATION_IMPROVEMENTS.md)

### **P2 - Plus tard**
- [ ] Cache frontend
- [ ] Validation côté client avant envoi

