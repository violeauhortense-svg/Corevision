# Implementation : Modal Email de Confirmation de RDV

**Date**: 29 avril 2026  
**Status**: ✅ COMPLÉTÉ  
**Solution**: Solution 2 - Modal adapté

---

## Ce qui a été fait

### 1. ✅ Créé le composant `EmailConfirmationModal.tsx`

**Location**: `src/app/components/EmailConfirmationModal.tsx`

**Fonctionnalités**:
- ✅ Affiche les données du client depuis l'API (`clientAPI.getById`)
- ✅ Récupère automatiquement l'email du client (`clientData.email`)
- ✅ Affiche l'option d'envoyer aussi au conjoint si existe (`familyInfo.spouse.email`)
- ✅ Checkbox pour sélectionner conjoint si applicable
- ✅ Textarea pour personnaliser le contenu (ou utiliser template par défaut)
- ✅ Boutons Annuler / Envoyer
- ✅ Gestion de l'état de chargement et d'envoi
- ✅ Notifications avec `toast`

### 2. ✅ Intégré le modal dans `TaskTabNew.tsx`

**Modifications**:
- Ajouté l'import du composant `EmailConfirmationModal`
- Ajouté le rendu du modal avant la fermeture du composant
- Connecté les states `showEmailModal` et `selectedTaskForEmail`
- Implémenté les callbacks `onClose` et `onSuccess`

### 3. ✅ Déplacé la tâche au bon stage

**Modifications** dans `TaskStageAccordion.tsx`:
- ✅ Changé le rendu de `MeetingConfirmationTask` de la tâche "RDV découverte – finalisation..." 
- ✅ Vers la tâche "Contacter le client / planifier le premier rendez-vous" (R0 - Prospect)
- ✅ Le bouton "Envoyer l'email de confirmation de RDV" apparaît maintenant au bon endroit

---

## Architecture

```
TaskTabNew.tsx
  ├─ State: showEmailModal ✅
  ├─ State: selectedTaskForEmail ✅
  ├─ Render: TaskStageAccordion ✅
  │   └─ Render: MeetingConfirmationTask ✅
  │       └─ Button click → onSendEmail() ✅
  │           └─ Opens modal ✅
  │
  └─ Render: EmailConfirmationModal ✅
      ├─ Load: clientAPI.getById(clientId) ✅
      ├─ Display: clientData.email ✅
      ├─ Display: familyInfo.spouse.email (optionnel) ✅
      └─ Send: (à connecter à l'API backend)
```

---

## Données utilisées

### Email du Client
```typescript
clientData.email
// Récupéré automatiquement par clientAPI.getById(clientId)
```

### Email du Conjoint (si existe)
```typescript
familyInfo.spouse.email
// Affiché avec checkbox pour sélection optionnelle
```

### Données affichées
- Client: `{firstName} {lastName}` + `{email}`
- Conjoint (si marié/pacsé): `{spouse.firstName} {spouse.lastName}` + `{spouse.email}`

---

## Flux utilisateur

1. Utilisateur clique sur "Envoyer l'email de confirmation de RDV" dans `MeetingConfirmationTask`
2. Modal s'ouvre
3. Modal charge les données du client
4. Affiche:
   - Email du client (déjà pré-rempli)
   - Email du conjoint avec checkbox (si existe)
   - Textarea pour personnaliser le contenu
5. Utilisateur peut:
   - Personnaliser le contenu (ou laisser le template par défaut)
   - Cocher/décocher conjoint
   - Cliquer "Envoyer"
6. Emails envoyés à:
   - Client (toujours)
   - Conjoint (si checkbox cochée et email existe)
7. Modal se ferme + toast succès + tâches rechargées

---

## Prochaines étapes

### ⏳ À faire

1. **Connecter l'API d'envoi d'email**
   - Décommenter/adapter le `fetch` vers ton endpoint d'envoi d'email
   - Route suggestion: `/api/email/send-confirmation` ou équivalent

2. **Implémenter le backend**
   - Créer l'endpoint qui :
     - Reçoit: `clientId`, `to`, `toSpouse`, `subject`, `htmlContent`
     - Envoie via le nouveau `emailService` (Phase 1 Brevo removal)
     - Mets à jour l'historique d'envoi de la tâche

3. **Mettre à jour l'historique d'envoi**
   - Une fois l'email envoyé, mettre à jour `task.emailHistory`
   - Permet au composant `MeetingConfirmationTask` de afficher le statut

### ✅ Complété

4. **Déplacer la tâche au bon stage** ✅
   - ✅ `MeetingConfirmationTask` déplacée de:
     - ✅ "RDV découverte - finalisation..." → "Contacter le client / planifier le premier rendez-vous"
   - ✅ Modifié: `src/app/components/client-detail/TaskStageAccordion.tsx`

---

## Code à compléter

### Dans `EmailConfirmationModal.tsx` (ligne ~120)

```typescript
// TODO: Décommenter et adapter cette section
const response = await fetch('/api/email/send-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientId,
    to: clientData.email,
    toSpouse: sendToSpouse ? familyInfo?.spouse?.email : null,
    spouseName: sendToSpouse ? `${familyInfo?.spouse?.firstName} ${familyInfo?.spouse?.lastName}` : null,
    subject: 'Confirmation de votre rendez-vous',
    htmlContent: finalContent,
  }),
});

if (!response.ok) {
  throw new Error('Erreur lors de l\'envoi');
}

// Optionnel: Mettre à jour le task emailHistory
// await taskAPI.update(task?.id, {
//   ...task,
//   emailHistory: [
//     ...(task?.emailHistory || []),
//     {
//       id: crypto.randomUUID(),
//       recipient: clientData.email,
//       sentAt: new Date().toISOString(),
//       status: 'sent',
//     }
//   ]
// });
```

---

## Tests à faire

- [ ] Cliquer sur le bouton "Envoyer l'email de confirmation de RDV"
- [ ] Vérifier que le modal s'ouvre
- [ ] Vérifier que l'email du client est pré-rempli
- [ ] Vérifier que le conjoint apparaît dans la liste (si marié/pacsé)
- [ ] Modifier le contenu et envoyer
- [ ] Vérifier que le toast "Email envoyé" apparaît
- [ ] Vérifier que les tâches se rechargent
- [ ] Vérifier que le statut d'envoi s'affiche dans `MeetingConfirmationTask`

---

## Notes importantes

1. **Modal chargement automatique** ✅
   - Les données du client et conjoint sont chargées automatiquement
   - Pas besoin de passer les données en props

2. **Email du conjoint optionnel** ✅
   - S'affiche seulement si `familyInfo.spouse.email` existe
   - Utilisateur peut cocher/décocher avant envoi

3. **Template par défaut** ✅
   - Si textarea vide, utilise un template par défaut
   - Utilisateur peut personnaliser

4. **Intégration Phase 1 Brevo Removal** ✅
   - Le modal prêt pour utiliser le nouveau `emailService`
   - Juste besoin de connecter l'API d'envoi

---

## Architecture complète

```
MeetingConfirmationTask
  └─ Button: "Envoyer l'email de confirmation"
      └─ onClick: onSendEmail(task)
          └─ TaskTabNew.onSendEmail()
              ├─ setSelectedTaskForEmail(task)
              └─ setShowEmailModal(true)
                  └─ EmailConfirmationModal
                      ├─ Load: clientAPI.getById(clientId)
                      ├─ Get: clientData.email
                      ├─ Get: familyInfo.spouse.email
                      ├─ Display: Both emails
                      └─ Send: API call (à implémenter)
```

✅ **Le frontend est prêt. Besoin d'implémenter le backend d'envoi.**
