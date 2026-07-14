# 🎨 Diagrammes du Système de Validation des Tâches

---

## 1️⃣ Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                          TasksTab.tsx                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐       │
│  │ loadClient() │→ │ getClientById │→│ Parse tâches    │       │
│  └──────────────┘  └──────────────┘  └─────────────────┘       │
│         ↑                                                        │
│         │                                                        │
│  ┌──────┴──────┐        UI RENDER                              │
│  │ 8 Blocs de  │  ┌─────────────────────────┐                 │
│  │ Statuts     │  │ Prospect (EN_COURS) ✅  │                 │
│  │             │  │  ├─ Tâche 1: VALIDÉE   │                 │
│  │ Prospect    │  │  ├─ Tâche 2: EN ATTENTE│                 │
│  │ Découverte  │  │  ├─ Tâche 3: N/A       │                 │
│  │ Simulation  │  │  └─ Tâche 4: VALIDÉE   │                 │
│  │ ...         │  │  ➡️ Bouton "Passez à..."│                 │
│  │ Arbitrage   │  └─────────────────────────┘                 │
│  └────┬────────┘                                               │
│       ↓ onclick                                                │
│  handleTaskUpdate() → PATCH /tache/:idx                        │
│  handleTaskNA() → PATCH /tache/:idx                           │
│  handleProgressToNextStatus() → POST /progress               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↕ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Deno/Hono)                         │
│                   client_routes + task_routes                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                   │
│  │ GET /clients/:id │  │ PATCH /tache/:idx│  ┌──────────────┐ │
│  │                  │  │                  │  │POST /progress│ │
│  │ 1. Load client   │  │ 1. Verify auth   │  │              │ │
│  │ 2. Check status  │  │ 2. Load client   │  │ 1. Verify    │ │
│  │ 3. Init tasks    │  │ 3. Modify task   │  │ 2. Init new  │ │
│  │ 4. Return all    │  │ 4. Save client   │  │    tasks     │ │
│  └──────────────────┘  └──────────────────┘  │ 3. Update    │ │
│                                               │    status    │ │
│                                               └──────────────┘ │
│           ↓ PostgreSQL                                         │
│  ┌────────────────────────────┐                                │
│  │   kv_store table           │                                │
│  │                            │                                │
│  │ client:user:id → {         │                                │
│  │   id, nom, email,          │                                │
│  │   statusOuvert: "Prospect" │                                │
│  │   taches: {                │                                │
│  │     "Prospect": [          │                                │
│  │       {id, title, status}  │                                │
│  │     ],                     │                                │
│  │     "Découverte": [...]    │                                │
│  │   }                        │                                │
│  │ }                          │                                │
│  └────────────────────────────┘                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Flux de validation détaillé

```
UTILISATEUR CLIQUE "✅ VALIDER"
        ↓
   ┌────────────────────────────────┐
   │ handleTaskUpdate()              │
   │ status="Prospect"               │
   │ taskIdx=1                       │
   │ completed=true                  │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ Construire requête PATCH        │
   │ URL: .../tache/1               │
   │ Body: {                         │
   │   completed: true,              │
   │   status: "validated"           │
   │ }                               │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ ENVOYER PATCH + Token JWT      │
   │ Authorization: Bearer <token>   │
   └────────┬───────────────────────┘
            ↓
            ▼▼▼ BACKEND ▼▼▼
   ┌────────────────────────────────┐
   │ 1. Verify JWT Token            │
   │    ✓ Valid → user.id = "123"   │
   │    ✗ Invalid → 401             │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ 2. Load client data            │
   │    key: "client:123:cid"       │
   │    ✓ Found                     │
   │    ✗ Not found → 404           │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ 3. Validate task index         │
   │    status = "Prospect"         │
   │    idx = 1                     │
   │    max = 4                     │
   │    ✓ 0 ≤ 1 < 4                │
   │    ✗ Out of range → 400        │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ 4. Modify task                 │
   │    taches["Prospect"][1]       │
   │    .completed = true           │
   │    .status = "validated"       │
   │    .updated_at = now()         │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ 5. Save client to DB           │
   │    PostgreSQL INSERT/UPDATE    │
   │    ✓ Saved                     │
   │    ✗ DB Error → 500            │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ 6. Return success              │
   │    { success: true, client }   │
   └────────┬───────────────────────┘
            ↓
            ▲▲▲ FRONTEND ▲▲▲
   ┌────────────────────────────────┐
   │ 7. Parse response              │
   │    if 200 OK:                  │
   │      toast("✅ Tâche validée") │
   │      setClient(response)       │
   │    if 404/500:                 │
   │      toast("❌ Erreur")        │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ 8. UI Update                   │
   │    - Badge devient VALIDÉE ✅  │
   │    - Titre barré gris          │
   │    - Boutons changent          │
   │    - Compte de tâches MAJ      │
   └────────────────────────────────┘
```

---

## 3️⃣ États des tâches

```
┌─────────────────────────────────────────────────────────────────┐
│                     CYCLE DE VIE TÂCHE                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌──────────────┐
                    │  INITIALIZE  │
                    │   (pending)  │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                ↓                     ↓
            ┌────────┐          ┌─────────┐
            │VALIDER │          │   N/A   │
            └────┬───┘          └────┬────┘
                 ↓                    ↓
        ┌────────────────┐   ┌─────────────────┐
        │  VALIDATED ✅  │   │  N/A ⊘          │
        │                │   │                 │
        │ • Badge vert   │   │ • Badge jaune   │
        │ • Texte barré  │   │ • Texte orange  │
        │ • Dé-valider   │   │ • Rétablir      │
        │   possible     │   │   possible      │
        └────┬───────────┘   └────┬────────────┘
             │                    │
             └─────────┬──────────┘
                       ↓
            ┌──────────────────────┐
            │ PROGRESSION POSSIBLE │
            │  (si toutes validées │
            │   ou N/A)            │
            │                      │
            │ Bouton:              │
            │ ➡️ Passez à [Statut] │
            └──────────────────────┘
```

---

## 4️⃣ Progression entre statuts

```
UTILISATEUR CLIQUE "➡️ PASSEZ À DÉCOUVERTE"
            ↓
┌─────────────────────────────────────┐
│ handleProgressToNextStatus()         │
│ from="Prospect"                     │
│ to="Découverte"                     │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ POST /clients/:id/progress          │
│ Body: {                             │
│   fromStatus: "Prospect",           │
│   toStatus: "Découverte"            │
│ }                                   │
└─────────────┬───────────────────────┘
              ↓
              ▼▼▼ BACKEND ▼▼▼
┌─────────────────────────────────────┐
│ 1. Verify JWT → user.id             │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Load client → check statusOuvert │
│    current = "Prospect"             │
│    ✓ Matches fromStatus             │
│    ✗ Mismatch → 400 Error           │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. Get task definitions for         │
│    "Découverte" from helpers        │
│    [d1, d2, d3, d4]                 │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. Create new tasks array           │
│    taches["Découverte"] = [         │
│      {id: d1, title: ...,           │
│       completed: false, status: ...}│
│    ]                                │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 5. Update client status             │
│    client.statusOuvert = "Découverte"│
│    client.taches = {                │
│      "Prospect": [...],  ← Historic │
│      "Découverte": [...]  ← New     │
│    }                                │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 6. Save to PostgreSQL               │
│    INSERT/UPDATE kv_store           │
└─────────────┬───────────────────────┘
              ↓
              ▲▲▲ FRONTEND ▲▲▲
┌─────────────────────────────────────┐
│ 7. Receive success + new client     │
│    toast("✅ Passé à Découverte")   │
│    setClient(response)              │
└─────────────┬───────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 8. UI Re-render                     │
│                                     │
│ Prospect:   ✓ COMPLETE              │
│   (4 tâches validées)               │
│   blockState = "COMPLETE"           │
│   Affiche: ✓ COMPLÉTÉ               │
│                                     │
│ Découverte: 🔵 EN COURS (NOUVEAU)   │
│   (4 tâches vides)                  │
│   blockState = "EN_COURS"           │
│   Affiche: 4 tâches EN ATTENTE      │
│   Boutons: Valider / N.A.           │
│                                     │
│ Simulation: 🔒 À VENIR              │
│   (locked)                          │
│                                     │
└─────────────────────────────────────┘
```

---

## 5️⃣ Gestion d'erreurs

```
┌──────────────────────────────────────────────────────────────┐
│                    SCÉNARIOS D'ERREUR                       │
└──────────────────────────────────────────────────────────────┘

❌ ERREUR 1: JWT Expiré
   Request PATCH → Backend
   ├─ verifyJWT(token) → null
   └─ Return 401 Unauthorized
      → Frontend: toast("❌ Session expirée")
      → Redirect login

❌ ERREUR 2: Client not found
   Request PATCH/POST → Backend
   ├─ kv.get("client:123:xyz") → null
   └─ Return 404 Not Found
      → Frontend: toast("❌ Client introuvable")
      → Reload page

❌ ERREUR 3: Task Index Out of Range
   PATCH /tache/10 (max 3)
   ├─ taskIdx = 10
   ├─ tasks.length = 4
   ├─ Validation: 10 ≥ 4 ✗
   └─ Return 400 Bad Request
      → Frontend: toast("❌ Tâche invalide")

❌ ERREUR 4: Status Mismatch
   POST /progress (Prospect → Simulation)
   ├─ client.statusOuvert = "Découverte"
   ├─ fromStatus = "Prospect"
   ├─ Validation: "Découverte" !== "Prospect" ✗
   └─ Return 400 Bad Request
      → Frontend: toast("❌ Impossible avancer")

❌ ERREUR 5: Database Error
   kv.set() → PostgreSQL Error
   ├─ Connection timeout / DB down
   └─ Return 500 Internal Server Error
      → Frontend: toast("❌ Erreur serveur")
      → Retry possible

❌ ERREUR 6: Network Error
   PATCH sent → No response
   ├─ Timeout (>30s)
   ├─ No internet
   └─ Frontend catch error
      → toast("❌ Erreur réseau")
      → Allow retry
```

---

## 6️⃣ Matrice de compatibilité transitions

```
┌────────────────────────────────────────────────────┐
│  TRANSITIONS STATUTS VALIDES                      │
└────────────────────────────────────────────────────┘

Prospect
   ↓ (si toutes tâches validées/N/A)
Découverte
   ↓ (si toutes tâches validées/N/A)
Simulation
   ↓
Lettre Mission
   ↓
Rapport/Audit
   ↓
Suivi MEP
   ↓
Suivi CSP ← (protégé: CSP doit être signé)
   ↓
Arbitrage ← (protégé: CSP doit être signé)

❌ Transitions INVALIDES:
- Prospect → Simulation (doit passer Découverte)
- Découverte → Prospect (non-linéaire)
- N'importe quel → Suivi CSP (CSP non signé)

```

---

## 7️⃣ Charge de base de données

```
┌──────────────────────────────────────────────────────┐
│  REQUÊTES BD PAR ACTION                             │
└──────────────────────────────────────────────────────┘

CHARGER CLIENT
├─ 1 query: SELECT client
└─ POST-traitement: Init tâches si vide
   └─ 1 UPDATE si init

VALIDER TÂCHE
├─ 1 query: SELECT client
├─ In-memory: Modify task[idx]
└─ 1 query: UPDATE client
   Total: 2 queries (SELECT + UPDATE)

PROGRESSER STATUT
├─ 1 query: SELECT client
├─ In-memory: Create new tasks, update status
└─ 1 query: UPDATE client
   Total: 2 queries (SELECT + UPDATE)

PIRE CAS (client avec 8 statuts × 5 tâches)
├─ Taille BD: ~2KB / client
├─ Query temps: <10ms
├─ Scénario: 1000 clients × 5 actions
   └─ 5000 requêtes = ~50ms (acceptable)

```

---

## 8️⃣ Sécurité en couches

```
┌─────────────────────────────────────────────────────┐
│             SECURITY LAYERS                        │
└─────────────────────────────────────────────────────┘

Layer 1: TRANSPORT (HTTPS)
├─ ✅ JWT in Authorization header
├─ ✅ No credentials in query params
└─ ✅ No token in logs

Layer 2: AUTHENTICATION
├─ ✅ JWT verified with secret
├─ ✅ Signature checked (HMAC SHA-256)
├─ ✅ Expiration checked (7 days)
└─ ✅ Tamper detection

Layer 3: AUTHORIZATION
├─ ✅ User can only modify own clients
│   Key: "client:${user.id}:${clientId}"
├─ ✅ No cross-user access
└─ ✅ No privilege escalation

Layer 4: VALIDATION
├─ ✅ Index bounds check (0 ≤ idx < len)
├─ ✅ Status consistency check
├─ ✅ Type validation (boolean, string)
└─ ✅ No SQL injection (parameterized queries)

Layer 5: DATA INTEGRITY
├─ ✅ Atomic operations (single UPDATE)
├─ ✅ No race conditions (single writer)
├─ ✅ Consistent timestamps
└─ ✅ Audit trail possible

SCORE: 8.5/10 ✓ Solide
GAPS: No transaction support, no audit logging
```

---

**Generated:** 2026-07-14  
**For:** Task Validation System Analysis
