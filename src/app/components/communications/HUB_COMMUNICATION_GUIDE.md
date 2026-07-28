# 📧 Hub Communication - Guide Complet

## 🎯 Vue d'Ensemble

Le **Hub Communication** est le cœur du système de gestion des communications clients dans Corevision. Il centralise:

- ✉️ **Emails** reçus et envoyés (via Outlook bridge)
- 📞 **Appels à traiter** (actions manuelles)
- 📋 **Notes** attachées à chaque communication
- 🔗 **Classification automatique** par client
- 📊 **Suivi d'état** de chaque mail (5 étapes)

---

## 🏗️ Architecture

### Structure de Fichiers

```
src/app/components/communications/
├── HubCommunicationView.tsx      # Composant principal (4 onglets)
├── MailDetailPanel.tsx            # Panel latéral avec détails
├── NotesSystem.tsx                # Système de notes complet
├── ClientAssociation.tsx          # Recherche/association client
├── ReplyModal.tsx                 # Modal de réponse
├── AttachmentsDisplay.tsx         # Gestion pièces jointes
├── InterlocutorsFilter.tsx        # Filtrage expéditeurs
└── HUB_COMMUNICATION_GUIDE.md     # Cette documentation
```

### Types de Données

```typescript
// Nouveaux types dans src/app/types/mail.ts

interface HubMail {
  id: string;
  messageId?: string;              // ID Outlook
  from: string;
  to: string[];
  subject: string;
  body: string;                    // Contenu complet
  sentAt: string;
  direction: 'received' | 'sent';
  read: boolean;

  // Classification (Clé du système)
  clientId?: string;               // Lié à quel client
  clientName?: string;
  hubTab?: HubTab;                 // Auto-calculé

  // Traitement
  traitementStatus: MailTraitementStatus;  // Les 5 états
  notes: MailNote[];               // Historique avec timestamps
  attachments: MailAttachment[];    // Pièces jointes

  // Métadonnées
  importedFrom?: 'outlook' | 'manual';
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

type HubTab = 'conversation_client' | 'interne_externe' | 'archive' | 'appels';

type MailTraitementStatus =
  | 'a_traiter'       // 📥
  | 'en_cours'        // 🔵
  | 'a_valider_gl'    // 🟡
  | 'valide_gl'       // 🟢
  | 'termine';        // ✅
```

---

## 📱 Interface - 4 Onglets

### 1️⃣ **💬 Conversation Client**
- **Affiche**: Mails avec `clientId` rempli
- **Auto-classement**: Mail reçu/envoyé vers client identifié
- **Actions**: Voir détails, répondre, changer état, ajouter notes

### 2️⃣ **↔️ Interne/Externe**
- **Affiche**: Mails SANS `clientId` (pas associés à un client)
- **Utilité**: Emails internes, échanges inter-équipes, archives
- **Auto-classement**: Tout ce qui n'a pas de client

### 3️⃣ **📦 Archive**
- **Affiche**: Tous les mails avec statut "Terminé"
- **Utilité**: Historique, recherche, audit
- **Persiste**: Même après archivage

### 4️⃣ **📞 Appels à traiter**
- **Type**: Actions manuelles (non-email)
- **Données**: Client, sujet, deadline, priorité
- **Affichage**: Liste avec statut (Urgent/Normal)

---

## 🔄 Classification des Mails

### Processus Automatique

```
Mail arrive du bridge Outlook
        ↓
Y a-t-il un clientId?
    ├─ OUI  → hubTab = 'conversation_client'
    └─ NON  → hubTab = 'interne_externe'
        ↓
Mail "Terminé"?
    ├─ OUI  → hubTab = 'archive'
    └─ NON  → Reste dans l'onglet d'origine
```

### Association Manuelle (Dans le panel détails)

1. Utilisateur clique sur mail dans "Interne/Externe"
2. Panel détails s'ouvre
3. Champ "Client Associé" → Recherche client
4. Clic [Associer un client]
5. Mail re-classifié → Apparaît dans "Conversation Client"

---

## 📊 Les 5 États de Traitement

| État | Emoji | Signification | Couleur |
|------|-------|---------------|---------|
| **À traiter** | 📥 | Mail urgent, pas vu | Gris |
| **En cours** | 🔵 | En traitement actif | Bleu |
| **À valider GL** | 🟡 | Attente validation | Jaune |
| **Validé GL** | 🟢 | Approuvé, exécution | Vert |
| **Terminé** | ✅ | Complété, archivé | Gris foncé |

### Changement d'État

- **UI**: Dropdown dans le panel détails
- **Persistence**: Sauvegardé immédiatement en BD
- **Effet**: Mail se déplace entre onglets si "Terminé"

---

## 📝 Système de Notes (Nouveau)

### Chaque Note Contient:
- **Contenu**: Texte libre (min 1 caractère)
- **Auteur**: Email + nom de la personne
- **Timestamps**: Date/heure création + dernière édition
- **Actions**: Supprimer (affiche un ✕)

### Affichage:
```
📝 Notes
┌──────────────────────────────────┐
│ [Note 1] 📅 2026-07-20  [✕]     │
│ Vérifier conditions MEP           │
├──────────────────────────────────┤
│ [Note 2] 📅 2026-07-21  [✕]     │
│ Client prioritaire, répondre 24h  │
└──────────────────────────────────┘

Ajouter note:
┌──────────────────────────────────┐
│ [Textarea] Ajoutez votre note... │
│                   [➕ Ajouter]    │
└──────────────────────────────────┘
```

---

## 📎 Pièces Jointes

### Affichage:
```
📎 Pièces jointes (2)
┌────────────────────────────────────┐
│ Tableau_chiffrage.xlsx  1.2 MB     │
│                  [⬇️ Télécharger]   │
├────────────────────────────────────┤
│ Simulation_financière.pdf  2.5 MB  │
│                  [⬇️ Télécharger]   │
└────────────────────────────────────┘
```

### Stockage:
- **Format**: Base64 en PostgreSQL
- **Limite**: 20 MB par mail
- **Endpoint**: `GET /api/hub/mails/:id/attachments/:index`

---

## ✉️ Répondre à un Mail

### Déclencheur:
Clic bouton **[✉️ Répondre]** dans le panel détails

### Modal "Organiser et Préparer Mail":
```
À: pierre.dubois@co.fr           ← Auto-rempli
Sujet: Re: Demande chiffrage     ← Auto "Re:"
Message: [Textarea 400px]        ← Contenu libre

[Annuler]  [📋 Copier]  [✉️ Envoyer via Outlook]
```

### Trois Options:

1. **[✉️ Envoyer via Outlook]**
   - Lance PowerShell Outlook COM
   - Envoie immédiatement
   - Mail marqué "Envoyé" en BD

2. **[📋 Copier le texte]**
   - Copie en clipboard
   - Vous collez dans Outlook manuellement

3. **[Annuler]**
   - Ferme sans rien faire

---

## 🔌 API Requises (À Implémenter)

### Mails

```typescript
// Charger les mails d'un onglet
GET /api/hub/mails?tab=conversation_client&limit=50&skip=0
Response: { mails: HubMail[], total: number, stats: HubStats }

// Charger un mail spécifique
GET /api/hub/mails/:id
Response: HubMail

// Mettre à jour un mail (état, notes, client)
PUT /api/hub/mails/:id
Body: { traitementStatus?, notes?, clientId? }
Response: HubMail

// Ajouter une note
POST /api/hub/mails/:id/notes
Body: { content: string }
Response: { noteId: string, success: boolean }

// Supprimer une note
DELETE /api/hub/mails/:id/notes/:noteId
Response: { success: boolean }

// Envoyer une réponse
POST /api/hub/mails/:id/reply
Body: { to: string[], subject: string, body: string, cc?: string[] }
Response: { success: boolean, messageId?: string }

// Télécharger pièce jointe
GET /api/hub/mails/:id/attachments/:index
Response: File (binary)

// Rechercher mails
POST /api/hub/mails/search
Body: { query: string, tab?: HubTab, dateFrom?, dateTo? }
Response: HubMail[]
```

### Appels

```typescript
// Charger les appels à traiter
GET /api/hub/calls?status=pending
Response: { calls: CallToHandle[], total: number }

// Créer un appel
POST /api/hub/calls
Body: { clientId, subject, dueDate, priority }
Response: CallToHandle

// Marquer appel comme complété
PUT /api/hub/calls/:id
Body: { status: 'completed' }
Response: CallToHandle
```

### Classification

```typescript
// Auto-classer mails
POST /api/hub/mails/:id/classify
Body: { clientId? }
Response: { hubTab: HubTab, success: boolean }

// Stats
GET /api/hub/stats
Response: HubStats
```

---

## 🔄 Flux Complet - Exemple Réel

### Client demande un chiffrage

```
JOUR 1 - Bridge capture mail
├─ messageId: 'outlook-123'
├─ from: 'pierre.dubois@co.fr'
├─ subject: 'Demande de chiffrage initial'
├─ clientId: null          ← Pas encore associé
└─ hubTab: 'interne_externe'

JOUR 1 - 10H30: Vous lisez
├─ Vous ouvrez "↔️ Interne/Externe"
├─ Clic sur le sujet
├─ Panel détails s'ouvre
├─ Vous reconnaissez "Pierre Dubois"
├─ Clic [Associer un client]
├─ Recherche "Pierre Dubois (c-123)"
├─ Mail re-classifié:
│  ├─ clientId: 'c-123'
│  └─ hubTab: 'conversation_client'
├─ Vous changez état → "🔵 En cours"
├─ Vous ajoutez note: "Vérifier conditions MEP"
└─ La note est sauvegardée avec timestamp

JOUR 2: Vous préparez la réponse
├─ Vous allez à "💬 Conversation Client"
├─ Vous voyez le mail (il y est maintenant!)
├─ Clic [✉️ Répondre]
├─ Modal s'ouvre:
│  ├─ À: pierre.dubois@co.fr (auto)
│  ├─ Sujet: Re: Demande de chiffrage (auto "Re:")
│  └─ Message: Votre chiffrage...
├─ Clic [✉️ Envoyer via Outlook]
├─ PowerShell envoie le mail
├─ Réponse ajoutée en BD (direction='sent')
└─ État reste "🔵 En cours" (vous continuez)

JOUR 5: Pierre répond
├─ Bridge capture sa réponse
├─ Mail ajouté avec même threadId
├─ Vous ouvrez la conversation
├─ Vous voyez la réponse + vos notes précédentes
├─ Vous passez à "🟡 À valider GL"
└─ GL reçoit notification

GL valide
├─ GL ouvre le mail
├─ GL ajoute sa note: "✓ OK, accord pour structures"
├─ GL change état → "🟢 Validé GL"
└─ Notification vous parvient

JOUR 7: Vous terminez
├─ Vous finalisez les documents
├─ Vous changez état → "✅ Terminé"
└─ Mail disparaît des onglets "Conversation Client"
    et "Interne/Externe"
    → Apparaît dans "📦 Archive"
```

---

## 🚀 Points Clés

### Auto-Sauvegarde
- ❌ **PAS** d'auto-save transparent
- ✅ Changements persistés **immédiatement** au clic
- ✅ Toast confirmation pour chaque action

### Classification
- ✅ **Automatique** par `clientId` à l'import
- ✅ **Manuelle** possible dans le panel
- ✅ Mail change d'onglet après association

### Notes
- ✅ Historique complet avec timestamps
- ✅ Chaque note tracée (auteur + date)
- ✅ Suppression possible

### États
- ✅ Changeables via dropdown
- ✅ Persistent en BD
- ✅ Déclenche réclassement si "Terminé"

---

## 📊 Compteurs & Badges

### En Header des Onglets:
```
💬 Conversation Client [23]     ← nb mails avec clientId
↔️ Interne/Externe [45]        ← nb mails sans clientId
📦 Archive [12]                 ← nb mails "Terminé"
📞 Appels à traiter [5]         ← nb appels
```

### En Haut de la Page:
```
À traiter: 2          ← En attente d'action
En cours: 1           ← En traitement
À valider GL: 3       ← Attente GL
Non lus: 7            ← À lire
```

---

## 🔒 Sécurité

- **Emails**: Stockés en clair (optionnel: chiffrer en prod)
- **Notes**: Privées à l'utilisateur
- **Pièces jointes**: Base64, pas scan de contenu
- **Auth**: Middleware `requireAuth` sur tous les endpoints

---

## ⚠️ Limitations Actuelles

- ❌ Pas d'intégration Outlook réelle (données démo)
- ❌ Pas d'auto-complétion client (à implémenter)
- ❌ Pas de filtrage par expéditeur (à implémenter)
- ❌ Pas d'export CSV (à implémenter)

---

## 🆘 Troubleshooting

| Problème | Cause | Solution |
|----------|-------|----------|
| Mail n'apparaît pas en "Conversation Client" | Pas de clientId | Associer client manuellement |
| Note ne s'ajoute pas | Textarea vide | Ajouter du texte avant clic |
| État ne change pas | API error | Vérifier console F12 |
| Pièce jointe ne télécharge pas | Pas de URL | Vérifier stockage en BD |

---

**Version**: 2.0 (Rewrite complet)  
**Date**: 28 juillet 2026  
**Auteur**: Claude (AI)
