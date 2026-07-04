# Audit : Modal Email de Confirmation de RDV

**Date**: 29 avril 2026  
**Status**: ❌ PROBLÈME IDENTIFIÉ  
**Sévérité**: 🔴 CRITIQUE - Modal ne s'affiche pas

---

## Problème

Quand on clique sur le bouton "Envoyer l'email de confirmation de RDV" dans le composant `MeetingConfirmationTask`, **le modal ne s'ouvre pas**.

### Root Cause

**Le modal est jamais rendu** dans le composant parent (`TaskTabNew.tsx`).

---

## Flux actuel

```
MeetingConfirmationTask
   ↓ (click button)
   ↓ onSendEmail(task)
   ↓
TaskTabNew.tsx - onSendEmail
   setSelectedTaskForEmail(task)      ✅
   setShowEmailModal(true)             ✅
   ↓
   Modal est-il rendu?                 ❌ NON !
```

### Code en question

**File**: `src/app/components/client-detail/TaskTabNew.tsx`

**Ligne 576-579** : Définition de `onSendEmail`
```typescript
onSendEmail={(task: Task) => {
  setSelectedTaskForEmail(task);
  setShowEmailModal(true);
}}
```

**Ligne 118-119** : States définis mais jamais utilisés
```typescript
const [showEmailModal, setShowEmailModal] = useState(false);
const [selectedTaskForEmail, setSelectedTaskForEmail] = useState<Task | null>(null);
```

**Ligne 587** : Fin du fichier - **Aucun modal rendu**
```typescript
      </div>
    </div>
  );  // ← FIN DU FICHIER - PAS DE MODAL !
}
```

---

## Ce qui manque

### ❌ Le modal n'existe pas
Il n'y a **aucun composant** nommé `EmailConfirmationModal` ou similaire.

### ❌ Le modal n'est pas rendu
Même s'il existait, il ne serait pas appelé dans le JSX de `TaskTabNew`.

### ❌ Les props ne sont pas utilisées
Les states `showEmailModal` et `selectedTaskForEmail` sont créées mais jamais consommés.

---

## Trace du problème

### Fichier: `TaskTabNew.tsx`
- ✅ States créés (ligne 118-119)
- ✅ Callback `onSendEmail` défini (ligne 576-579)
- ✅ Callback passé à `TaskStageAccordion` (ligne 580)
- ❌ **Modal jamais rendu dans le return**

### Fichier: `TaskStageAccordion.tsx`
- ✅ Reçoit `onSendEmail` en prop (ligne 35)
- ✅ Passe à `MeetingConfirmationTask` (ligne 254)
- ✅ Affiche le bouton d'envoi

### Fichier: `MeetingConfirmationTask.tsx`
- ✅ Appelle `onSendEmail(task)` au click (ligne 121)
- ✅ Le composant fonctionne correctement

---

## Solution

Ajouter le rendu du modal dans `TaskTabNew.tsx` **avant la fermeture du composant**.

### Étape 1 : Importer un composant de modal d'email

Tu dois d'abord créer ou importer un composant de modal. Voici les options :

#### Option A : Utiliser un composant existant (à adapter)
Chercher un composant modal d'email existant dans `/src/app/components/mails/`

#### Option B : Créer un nouveau composant
Créer `src/app/components/EmailConfirmationModal.tsx`

### Étape 2 : Importer dans `TaskTabNew.tsx`
```typescript
import { EmailConfirmationModal } from './EmailConfirmationModal';
```

### Étape 3 : Rendre le modal dans le JSX

Ajouter avant la fermeture du composant (avant la dernière `</div>` ligne 586) :

```typescript
      {/* Modal d'email de confirmation de RDV */}
      {showEmailModal && selectedTaskForEmail && (
        <EmailConfirmationModal
          isOpen={showEmailModal}
          task={selectedTaskForEmail}
          clientId={clientId}
          onClose={() => {
            setShowEmailModal(false);
            setSelectedTaskForEmail(null);
          }}
          onSuccess={() => {
            setShowEmailModal(false);
            setSelectedTaskForEmail(null);
            // Recharger les tâches pour mettre à jour l'historique d'envoi
            loadTasks();
          }}
        />
      )}
```

---

## Passage de tâches entre stages

### Actuellement
Le modal "Envoyer l'email de confirmation de RDV" existe dans :
- **Stage**: "RDV découverte - finalisation de remplissage des infos et objectifs clients"
- **Type de tâche**: `MeetingConfirmationTask`

### À déplacer vers
- **Stage**: "Contacter le client / planifier le premier rendez-vous"
- **Type de tâche**: `MeetingConfirmationTask` (même composant)

#### Action requise
Modifier les templates de tâches pour placer `MeetingConfirmationTask` dans le bon stage.

**Files à modifier**:
- `src/app/hooks/useTaskTemplates.ts` ou équivalent
- Les définitions de stages/templates

---

## Points clés

1. **Le composant `MeetingConfirmationTask` fonctionne** ✅
   - Affiche le bouton correctement
   - Appelle `onSendEmail` au click

2. **Le callback `onSendEmail` fonctionne partiellement** ⚠️
   - Sélectionne la tâche ✅
   - Ouvre le state du modal ✅
   - Mais le modal n'est jamais affiché ❌

3. **Le modal n'existe pas ou n'est pas rendu** ❌
   - Les states existent mais ne sont pas consommés
   - Aucun composant modal ne s'affiche

---

## Checklist de correction

- [ ] Créer ou localiser un composant `EmailConfirmationModal`
- [ ] Importer le composant dans `TaskTabNew.tsx`
- [ ] Rendre le modal dans le JSX (avant ligne 587)
- [ ] Tester que le modal s'ouvre au click du bouton
- [ ] Adapter le template de tâches pour placer `MeetingConfirmationTask` au bon stage
- [ ] Vérifier que l'email s'envoie correctement
- [ ] Tester la fermeture du modal (bouton Cancel, succès)

---

## Architecture attendue

```
TaskTabNew.tsx (parent)
  ├─ State: showEmailModal ✅ (exists but unused)
  ├─ State: selectedTaskForEmail ✅ (exists but unused)
  ├─ Function: onSendEmail() ✅
  ├─ Render: TaskStageAccordion ✅
  │   └─ Render: MeetingConfirmationTask ✅
  │       └─ Button click → onSendEmail() ✅
  │           └─ Opens modal ❌ MISSING
  │
  └─ Render: EmailConfirmationModal ❌ MISSING
```

---

## Notes

- **Pas d'erreur console** - Le code ne crash pas, juste le modal ne s'affiche pas
- **States existent** - Preuve que quelqu'un a commencé à implémenter mais ne l'a pas terminé
- **Pattern correct** - Les states et callbacks sont dans la bonne structure, il manque juste le rendu du modal
