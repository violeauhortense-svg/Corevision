# Architecture - Système de Gestion des Mails

## 📐 Architecture Générale

```
┌─────────────────────────────────────────────────────────────┐
│                     MailsView.tsx                            │
│            (Hub Communication - Page Principale)             │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴────────────────────────────────┐
         │                                         │
    ┌────▼──────────────┐             ┌──────────▼─────────┐
    │ MailManagementTab │             │ Autres Tabs        │
    │   (NOUVEAU)       │             │ (Conversations,    │
    │                   │             │  Inbox, Templates, │
    │ - 4 Onglets       │             │  Internal)         │
    │ - 5 États         │             └────────────────────┘
    │ - Auto-save       │
    │ - Reply Modal     │
    └────────────────────┘
```

## 🔄 Flux de Données

```
User Input (Add Notes / Change Status)
        ↓
  State Update (React)
        ↓
  Trigger Auto-Save (debounce 1500ms)
        ↓
  API Call: PUT /api/mails/:mailId
        ↓
  Toast: "Sauvegardé"
        ↓
  State Persisted
```

## 📦 Composants et Responsibilities

### MailManagementTab.tsx (Composant Principal)
```
Responsabilités:
├── Charger les mails depuis l'API
├── Filtrer par onglet (4 catégories)
├── Chercher par texte
├── Afficher liste des mails
├── Ouvrir le panneau détails
├── Gérer les états de traitement (5 états)
├── Trigger sauvegarde automatique
└── Intégrer la modale de réponse
```

### ReplyModal.tsx
```
Responsabilités:
├── Formulaire de réponse
├── Validation du sujet/corps
├── Gestion du CC
├── Appel API: POST /api/mails/:mailId/reply
├── Intégration avec Outlook (À implémenter)
└── Retour au component parent
```

### useAutoSave Hook
```
Responsabilités:
├── Debouncer les changements (1500ms par défaut)
├── Appeler la fonction onSave passée en prop
├── Gérer l'état de sauvegarde (idle/saving/saved/error)
├── Toast de feedback
└── Cleanup sur unmount
```

## 🗄️ Types de Données

```typescript
// Types principaux dans mail.ts

type MailProcessingStatus = 
  | 'a_traiter'      // Besoin de traitement
  | 'en_cours'       // Actuellement en traitement
  | 'a_valider_gl'   // En attente de validation GL
  | 'valide_gl'      // Validé par GL
  | 'termine';       // Traitement terminé

interface MailMessage {
  id: string;
  conversationId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  isHtml: boolean;
  sentAt: string;
  direction: 'sent' | 'received';
  read: boolean;
  
  // NOUVEAUX CHAMPS
  processingStatus?: MailProcessingStatus;     // État de traitement
  processingNotes?: string;                    // Notes personnalisées
  processingAssignedTo?: string;               // Assigné à qui
  processedAt?: string;                        // Date de traitement initial
  lastModifiedAt?: string;                     // Dernière modification
}
```

## 🎨 États de Traitement - Diagramme

```
                 ┌─────────────────────┐
                 │   Mail Reçu/Créé    │
                 └──────────┬──────────┘
                            │
                            ▼
                   ┌─────────────────────┐
                   │   À traiter (🔴)    │
                   │  Alert, need action │
                   └──────────┬──────────┘
                              │
                              │ Clic "En cours"
                              ▼
                   ┌─────────────────────┐
                   │   En cours (🔵)     │
                   │ Processing started  │
                   └──────────┬──────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                Réponse envoyée    Travail terminé
                    │                    │
                    ▼                    ▼
        ┌─────────────────────┐ ┌──────────────────┐
        │ À valider GL (🟡)   │ │ À valider GL(🟡) │
        │ Await GL approval   │ │ Await GL approval│
        └──────────┬──────────┘ └────────┬─────────┘
                   │                      │
                   │ GL approves          │ GL approves
                   ▼                      ▼
        ┌─────────────────────┐ ┌──────────────────┐
        │ Validé GL (🟢)      │ │ Validé GL (🟢)   │
        │ Approved by GL      │ │ Approved by GL   │
        └──────────┬──────────┘ └────────┬─────────┘
                   │                      │
                   └──────────┬───────────┘
                              │
                       Clic "Terminé"
                              │
                              ▼
                   ┌─────────────────────┐
                   │  Terminé (⚪)       │
                   │ Archived, Done      │
                   └─────────────────────┘
```

## 🔌 Points d'Intégration API

### À Implémenter

```typescript
// GET /api/mails - Charger les mails
GET /api/mails?status=a_traiter&skip=0&limit=20
Response: {
  mails: MailMessage[],
  total: number,
  unread: number
}

// PUT /api/mails/:mailId - Mettre à jour un mail
PUT /api/mails/e1
Body: {
  processingStatus: 'en_cours',
  processingNotes: 'Notes de traitement...',
  processingAssignedTo: 'user@corevision.fr'
}
Response: MailMessage (updated)

// POST /api/mails/:mailId/reply - Envoyer une réponse
POST /api/mails/e1/reply
Body: {
  subject: 'RE: Question sur assurance-vie',
  body: 'Réponse du conseiller...',
  cc?: ['another@corevision.fr']
}
Response: { success: true, messageId: 'sent-123' }

// POST /api/mails/search - Chercher des mails
POST /api/mails/search
Body: {
  query: 'dupont',
  status?: MailProcessingStatus,
  from?: string,
  dateFrom?: string
}
Response: MailMessage[]
```

## 💾 Stockage Données

### Base de Données (Supabase/DB)

```sql
-- Table mails (extension existante)
ALTER TABLE mails ADD COLUMN (
  processing_status VARCHAR(20) DEFAULT 'a_traiter',
  processing_notes TEXT,
  processing_assigned_to VARCHAR(255),
  processed_at TIMESTAMP,
  last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performance
CREATE INDEX idx_mails_processing_status ON mails(processing_status);
CREATE INDEX idx_mails_assigned_to ON mails(processing_assigned_to);
CREATE INDEX idx_mails_last_modified ON mails(last_modified_at DESC);
```

## 🔐 Permissions & Sécurité

```
Conseiller:
├── Peut voir ses propres mails
├── Peut modifier notes/statuts
├── Peut répondre aux clients
└── Ne peut pas voir les autres

GL (Gestionnaire):
├── Peut voir tous les mails
├── Peut valider/rejeter
├── Peut ajouter commentaires
└── Peut réassigner

Administrateur:
├── Accès complet
├── Peut archiver en masse
└── Peut voir l'historique complet
```

## 📊 Performance

```
Loading: ~500ms (demo), <100ms (production avec cache)
Auto-save: 1500ms debounce + 100-200ms API
Rendering: 60fps (virtualization sur liste longue si besoin)
Memory: ~2-5MB pour 100 mails en mémoire
```

## 🧪 Tests à Ajouter

```typescript
// MailManagementTab.test.tsx
- Charger les mails correctement
- Filtrer par onglet
- Chercher dans la barre
- Changer l'état de traitement
- Auto-save déclenche après debounce
- Notes sauvegardées automatiquement
- Modal de réponse s'ouvre/se ferme

// ReplyModal.test.tsx
- Valider sujet/corps requis
- Ajouter/supprimer CC
- Envoyer la réponse
- Fermer sans envoyer

// Types.test.ts
- MailProcessingStatus type checking
- MailMessage interface compliance
```

## 🚀 Déploiement

```
1. Database Migration:
   - ALTER TABLE mails ADD COLUMN...
   - CREATE INDEX...

2. Backend:
   - Implémenter endpoints API
   - Validation des statuts
   - Sécurité d'accès

3. Frontend:
   - Vérifier build: npm run build
   - Test en local: npm run dev
   - Deploy sur Vercel/Production

4. Post-deploy:
   - Monitoring des erreurs API
   - Toast notifications
   - Vérifier sauvegarde auto
```

## 📈 Métriques à Tracker

```
- Nombre de mails "À traiter" (KPI)
- Temps moyen entre réception et "Terminé"
- Taux d'erreur de sauvegarde
- Nombre de réponses envoyées par jour
- Efficacité GL (temps de validation)
```
