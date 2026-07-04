# Implémentation : Modal de Proposition de RDV

**Date**: 30 avril 2026  
**Status**: ✅ FRONTEND COMPLÉTÉ - EN ATTENTE BACKEND  
**Solution**: Modal complet avec 8 catégories de documents, propositions de RDV, lien sécurisé

---

## ✅ Ce qui a été fait

### 1. ✅ Créé le composant `MeetingProposalModal.tsx`

**Location**: `src/app/components/MeetingProposalModal.tsx`

**Fonctionnalités**:
- ✅ Date picker + heure du RDV
- ✅ Sélection du lieu (Cabinet, Chez le client, Visio, Autre)
- ✅ Checkboxes pour 49 documents répartis en 8 catégories
- ✅ Récupération automatique des infos du client et conjoint
- ✅ Template d'email modifiable avec infos du RDV
- ✅ Mention du lien de dépôt sécurisé dans l'email
- ✅ Sélection client + conjoint si existe
- ✅ Gestion d'état (loading, sending)
- ✅ Notifications avec toast

**Catégories de documents (49 total)**:
1. État civil & situation personnelle (5)
2. Revenus & fiscalité (6)
3. Patrimoine immobilier (7)
4. Patrimoine financier (7)
5. Prévoyance & assurances (4)
6. Patrimoine professionnel (12)
7. Transmission & succession (6)
8. Passif & engagements (4)

### 2. ✅ Intégré le modal dans `TaskTabNew.tsx`

**Modifications**:
- ✅ Ajouté import du composant
- ✅ Ajouté states `showMeetingProposalModal` et `selectedTaskForMeeting`
- ✅ Mis à jour le callback `onSendEmail` pour ouvrir le modal
- ✅ Rendu du modal avec callbacks `onClose` et `onSuccess`

### 3. ✅ Créé les helpers `meetingHelpers.ts`

**Location**: `src/app/utils/meetingHelpers.ts`

**Fonctions**:
- ✅ `createMeetingRDV()` - créer un RDV dans le client
- ✅ `createDocumentRequests()` - créer la liste de documents dans tâche
- ✅ `updateDiscoveryMeetingDeadline()` - mettre à jour échéance "RDV découverte..."
- ✅ `recordEmailHistory()` - enregistrer l'historique d'envoi
- ✅ `generateUploadToken()` - générer un token sécurisé (base64 + expiration 30 jours)
- ✅ `validateUploadToken()` - valider un token

---

## ⏳ À faire (Backend - Endpoints Deno)

### 1. **Endpoint: POST `/api/rdv/create-proposal`**

Recevra:
```json
{
  "clientId": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:mm",
  "location": "cabinet|client|visio|autre",
  "locationOther": "string (si autre)",
  "documentsRequested": ["doc1", "doc2", ...],
  "sendToSpouse": boolean,
  "emailContent": "string"
}
```

Doit faire:
1. Créer un RDV (`createMeetingRDV`)
2. Créer la liste de documents (`createDocumentRequests`)
3. Mettre à jour l'échéance de "RDV découverte..." (`updateDiscoveryMeetingDeadline`)
4. Générer un token de dépôt sécurisé (`generateUploadToken`)
5. Préparer l'email avec lien de dépôt
6. Envoyer l'email au client et conjoint (si applicable)
7. Enregistrer l'historique (`recordEmailHistory`)

Répondra:
```json
{
  "success": true,
  "rdvId": "string",
  "uploadToken": "string",
  "uploadLink": "https://tonapp/rdv/upload?token=xxx"
}
```

### 2. **Endpoint: POST `/api/rdv/secure-upload`**

Dépôt sécurisé des documents.

Recevra:
```
- token: string (query param)
- clientId: string (query param)
- rdvId: string (query param)
- file: File (multipart)
```

Doit faire:
1. Valider le token (`validateUploadToken`)
2. Créer le dossier `/storage/rdv/{clientId}/{rdvId}/` si nécessaire
3. Sauvegarder le fichier
4. Générer un URL accessible du fichier
5. Marquer le document comme "reçu" dans la tâche
6. Vérifier si tous les documents sont reçus → valider la tâche

Répondra:
```json
{
  "success": true,
  "fileUrl": "string",
  "fileName": "string"
}
```

### 3. **Endpoint: POST `/api/rdv/send-email`** (optionnel)

Si l'envoi d'email n'est pas fait directement dans l'endpoint create-proposal.

---

## 📧 Template d'email

L'email contient automatiquement:
- Date + heure + lieu du RDV
- Liste des documents à apporter
- **Lien sécurisé de dépôt**: `https://tonapp/rdv/upload?token={token}&clientId={clientId}&rdvId={rdvId}`
- Message pour visio: "Un lien de visioconférence vous sera transmis ultérieurement"
- Contenu modifiable par l'utilisateur

---

## 📁 Structure des fichiers stockés

```
/storage/
  /rdv/
    /{clientId}/
      /{rdvId}/
        document1.pdf
        document2.docx
        ...
```

---

## 🔒 Sécurité du dépôt

- **Token**: base64 encodé avec expiration 30 jours
- **Validation**: vérifier token + dates avant accepter upload
- **Accès**: URL unique par RDV, pas d'authentification requise (RGPD-friendly)
- **Stockage**: fichiers sauvegardés en `/storage`, pas accessible directement via HTTP

---

## 📊 Flux complet utilisateur

1. ✅ Utilisateur clique "Envoyer l'email de confirmation de RDV"
2. ✅ Modal s'ouvre avec:
   - Sélection date + heure
   - Choix du lieu (4 options)
   - Checkboxes documents (49 au total)
   - Template email modifiable
3. ⏳ Utilisateur clique "Envoyer la proposition"
4. ⏳ Backend crée:
   - RDV dans le client
   - Documents demandés dans tâche
   - Échéance "RDV découverte..." = date RDV
   - Token de dépôt sécurisé
5. ⏳ Email envoyé au client + conjoint avec:
   - Infos du RDV
   - Lien de dépôt sécurisé
6. ⏳ Client reçoit email
7. ⏳ Client clique lien → page dépôt (drag & drop)
8. ⏳ Client upload documents
9. ⏳ Documents validés automatiquement dans tâche
10. ⏳ Une fois tous docs reçus → tâche validée automatiquement

---

## 🎯 Points clés

1. **Documents**: 49 documents répartis en 8 catégories
2. **Lien sécurisé**: Token base64 valide 30 jours
3. **Auto-validation**: Documents uploadés = validés automatiquement
4. **RDV lié**: Lien RDV-Tâche pour suivi complet
5. **Historique**: Email enregistré avec date/heure/statut
6. **Modification possible**: Après envoi, modification date/lieu + tracking

---

## ⚠️ Notes importantes

- Le lien de dépôt est **sans authentification** (RGPD: pas de compte client)
- Le token expire après **30 jours**
- Une fois uploadé, le document valide la case automatiquement
- L'historique d'email enregistre **envoi + réponse** (pas d'ouverture)

---

## 📝 Fichiers créés/modifiés

**Créés**:
- `src/app/components/MeetingProposalModal.tsx` (850 lignes)
- `src/app/utils/meetingHelpers.ts` (270 lignes)
- `MEETING_PROPOSAL_IMPLEMENTATION.md` (cette doc)

**Modifiés**:
- `src/app/components/client-detail/TaskTabNew.tsx`:
  - Import `MeetingProposalModal`
  - States pour le modal
  - Callback `onSendEmail` relié au modal
  - Rendu du modal

---

## 🚀 Prochaines étapes (Backend à implémenter)

1. **Créer `/api/rdv/create-proposal`** endpoint
   - Appeler les helpers
   - Envoyer email
   - Générer token de dépôt

2. **Créer `/api/rdv/secure-upload`** endpoint
   - Valider token
   - Sauvegarder fichiers
   - Mettre à jour tâches

3. **Tester le workflow complet**
   - Proposer RDV
   - Recevoir email avec lien
   - Upload documents
   - Vérifier validation auto

---

## ✨ État du projet

| Partie | Status | Détail |
|--------|--------|--------|
| Frontend Modal | ✅ Complété | MeetingProposalModal.tsx prêt |
| Helpers | ✅ Complété | meetingHelpers.ts prêt |
| Integration | ✅ Complétée | TaskTabNew.tsx wired |
| Backend Endpoints | ⏳ À faire | 2 endpoints nécessaires |
| Email Service | ⏳ À faire | Intégrer avec emailService |
| Upload Storage | ⏳ À faire | Créer `/storage/rdv` |
| Documentation | ✅ Complétée | Ce fichier |

---

Le modal est **100% prêt du côté frontend**. L'implémentation backend utilisera les helpers créés. 🎉
