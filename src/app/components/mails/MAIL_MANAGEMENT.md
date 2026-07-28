# Système de Gestion des Mails

## 📋 Vue d'ensemble

Le système de gestion des mails permet un traitement complet et organisé des emails avec sauvegarde **automatique** sans clic sur un bouton.

## 🎯 Caractéristiques principales

### 1. **4 Onglets de Classification**
- **Conversation Client** : Mails reçus des clients
- **Interne/Externe** : Mails envoyés et communications internes
- **Archive** : Mails traités et terminés
- **Appels** : Mails liés à des appels/rendez-vous

### 2. **5 États de Traitement**
```
À traiter → En cours → À valider GL → Validé GL → Terminé
```

Chaque mail peut passer par ces états pour suivre sa progression de traitement:
- 🔴 **À traiter** : Mail récemment reçu, en attente de traitement
- 🔵 **En cours** : Traitement en cours
- 🟡 **À valider GL** : En attente de validation par le GL (Gestionnaire)
- 🟢 **Validé GL** : Approuvé par le GL
- ⚪ **Terminé** : Traitement complété

### 3. **Panel Détails Complet**
Quand vous cliquez sur un mail, vous accédez à:
- 📧 Sujet et contenu complet du mail
- 📝 **Notes de traitement** avec sauvegarde automatique
- 🏷️ État actuel
- 👤 Assigné à
- 📅 Date de dernière modification
- 💬 Bouton de réponse

### 4. **Sauvegarde Automatique** ✨ (CRITIQUE)
- Les notes se sauvegardent **automatiquement** après 1.5 secondes d'inactivité
- Pas besoin de cliquer sur un bouton [✅ Enregistrer]
- Indicateur visuel : "Sauvegarde..." puis "Sauvegardé"
- Toast de confirmation en cas d'erreur

## 🔧 Configuration des États

Les états sont définis dans `MailManagementTab.tsx`:

```typescript
const PROCESSING_STATUS_CONFIG = {
  a_traiter: { label: 'À traiter', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Clock },
  a_valider_gl: { label: 'À valider GL', color: 'bg-yellow-100 text-yellow-800', icon: MessageSquare },
  valide_gl: { label: 'Validé GL', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  termine: { label: 'Terminé', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 },
};
```

## 📂 Structure des fichiers

```
src/app/components/mails/
├── MailManagementTab.tsx      # Composant principal (4 onglets, 5 états)
├── ReplyModal.tsx             # Modale de réponse au client
├── MailsView.tsx              # Vue intégrant le nouvel onglet
└── MAIL_MANAGEMENT.md         # Cette documentation

src/app/types/
├── mail.ts                    # Types mis à jour avec MailProcessingStatus

src/app/hooks/
└── useAutoSave.ts             # Hook pour sauvegarde automatique avec debounce
```

## 🚀 Utilisation

### Accès
1. Aller au "Hub Communication"
2. Cliquer sur l'onglet "Gestion des Mails" (défaut au chargement)

### Traiter un Mail
1. Chercher le mail via la barre de recherche
2. Cliquer sur un mail pour ouvrir le panneau détails
3. **Optionnel** : Changer l'état de traitement
4. Ajouter des notes (sauvegarde auto en 1.5s)
5. **Optionnel** : Cliquer "Répondre au client" pour envoyer une réponse via Outlook

### Suivi des Mails
- Stats en haut : "À traiter" et "En cours" visibles en un coup d'œil
- Changement d'état immédiat et automatiquement sauvegardé
- Historique via le champ "Dernier modification"

## 🔄 Flux de Traitement Typique

```
Mail reçu
    ↓
État: "À traiter" (Auto-assigné)
    ↓
Lire le mail et ajouter des notes
    ↓
Changer état à "En cours"
(Notes sauvegardées auto)
    ↓
Traiter / Répondre au client
    ↓
Changer état à "À valider GL"
    ↓
GL valide → État: "Validé GL"
    ↓
Finaliser → État: "Terminé"
(Mail archivé automatiquement)
```

## 🔌 Intégration avec Outlook

La modale de réponse permet d'envoyer directement via Outlook (à implémenter):
- Sujet pré-rempli avec "RE:"
- Destinataire automatique
- Support du CC
- Corps du message personnalisable

## 📊 Types Mis à Jour

```typescript
type MailProcessingStatus = 'a_traiter' | 'en_cours' | 'a_valider_gl' | 'valide_gl' | 'termine';

interface MailMessage {
  // ... champs existants ...
  processingStatus?: MailProcessingStatus;        // État de traitement
  processingNotes?: string;                        // Notes personnalisées
  processingAssignedTo?: string;                   // Email du responsable
  processedAt?: string;                            // Date de traitement initial
  lastModifiedAt?: string;                         // Dernière modification
}
```

## ⚙️ API à Implémenter

À faire côté backend:

```typescript
// GET /api/mails
// Récupère les mails avec statuts

// PUT /api/mails/:mailId
// Met à jour le statut et les notes

// POST /api/mails/:mailId/reply
// Envoie une réponse via Outlook

// POST /api/mails/:mailId/mark-as-read
// Marque comme lu
```

## 🎨 Personnalisation

### Changer les couleurs des états
Modifiez `PROCESSING_STATUS_CONFIG` dans `MailManagementTab.tsx`

### Changer le délai de sauvegarde auto
```typescript
handleAutoSave(updated); // Par défaut: 1500ms de debounce
```

### Ajouter des états supplémentaires
1. Ajouter le type dans `mail.ts`: `type MailProcessingStatus = ... | 'new_state'`
2. Ajouter la config dans `PROCESSING_STATUS_CONFIG`
3. Mettre à jour les filtres d'onglets si nécessaire

## 🐛 Dépannage

### Notes ne se sauvegardent pas
- Vérifier la connexion internet
- Vérifier la console pour les erreurs API
- Le toast affichera "Erreur lors de la sauvegarde"

### Changement d'état ne fonctionne pas
- Vérifier que le mail n'est pas en "Terminé"
- Recharger la page si bloqué

### Modale de réponse ne s'ouvre pas
- Vérifier que c'est un mail reçu (`direction === 'received'`)
- Vérifier que l'état n'est pas "Terminé"

## 📝 Notes de Développement

- Sauvegarde avec **debounce** (1500ms) pour éviter trop d'appels API
- Les états sont cliquables pour changement rapide
- Les onglets filtre automatiquement par type et statut
- Stats en temps réel au chargement
- Support du responsive design
