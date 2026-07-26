# 🌉 Outlook Bridge V3

Système hybride Python + PowerShell pour synchroniser Outlook ↔ CRM Backend.

## Architecture

```
Outlook (COM API)
       ↓
PowerShell (Scripts)
       ↓
Python Bridge (REST API)
       ↓
Backend CRM (REST API)
```

## Installation

### 1. Prérequis
- Python 3.8+
- Microsoft Outlook installé et configuré
- PowerShell 5.1+

### 2. Cloner et installer

```bash
cd bridge
pip install -r requirements.txt
```

### 3. Configuration

Copier `.env.example` en `.env` et configurer :

```bash
cp .env.example .env
```

Éditer `.env` :
```
BACKEND_URL=http://localhost:3000/make-server-cac859af
DEVICE_ID=device-001  # Identifier ce device uniquement
SYNC_INTERVAL=30      # Sync chaque 30s
```

### 4. Vérifier les permissions PowerShell

```powershell
# Vérifier la politique d'exécution
Get-ExecutionPolicy

# Si "Restricted", changer en "RemoteSigned" (temporaire)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Utilisation

### Démarrer le bridge

```bash
python app.py
```

Le serveur démarre sur `http://127.0.0.1:5001`

### Endpoints

#### 1. Health Check
```bash
curl http://127.0.0.1:5001/health
```

**Réponse:**
```json
{
  "status": "ok",
  "bridge_running": true,
  "backend_healthy": true,
  "device_id": "device-001",
  "sync_interval": 30
}
```

#### 2. Force Sync
```bash
curl -X POST http://127.0.0.1:5001/sync \
  -H "Content-Type: application/json" \
  -d '{"cycles": ["mails", "calendar", "send", "respond"]}'
```

**Réponse:**
```json
{
  "status": "success",
  "results": {
    "mails": {"sent": 15, "duplicates": 2},
    "calendar": {"events_synced": 8},
    "send": {"emails_sent": 3},
    "respond": {"meetings_responded": 1}
  }
}
```

#### 3. Diagnostics
```bash
curl http://127.0.0.1:5001/diagnose
```

#### 4. Status
```bash
curl http://127.0.0.1:5001/status
```

## Les 4 cycles de synchronisation

### Cycle 1: Récupérer les mails (toutes les 30s)
```
export_mails.ps1
  → récupère Inbox + Sent Items (7 derniers jours)
  → détecte les doublons (sujet + from + date + device_id)
  → POST /api/communications/receive
```

### Cycle 2: Récupérer les événements (toutes les 30s)
```
export_calendar.ps1
  → récupère le calendrier (-60 à +90 jours)
  → mappe les statuts de réponse
  → POST /api/agenda-events
```

### Cycle 3: Envoyer les mails en attente (toutes les 30s)
```
GET /api/communications/pending-send
  → send_email.ps1 pour chaque mail
  → PATCH /api/communications/{id}/sent
```

### Cycle 4: Répondre aux réunions (toutes les 30s)
```
GET /api/agenda-events/pending-response
  → respond_meeting.ps1 pour chaque réunion
  → PATCH /api/agenda-events/{id}/responded
```

## Fichiers

```
bridge/
├── app.py                      # Flask API
├── outlook_bridge_v3.py        # Classe principale du bridge
├── requirements.txt            # Dépendances Python
├── .env.example               # Configuration exemple
├── scripts/
│   ├── export_mails.ps1       # Exporte les mails
│   ├── export_calendar.ps1    # Exporte le calendrier
│   ├── send_email.ps1         # Envoie un email
│   └── respond_meeting.ps1    # Répond à une réunion
├── logs/                       # Fichiers logs
└── output/                     # Fichiers temporaires
```

## Logging

Les logs sont écrits dans `logs/bridge_YYYYMMDD.log`

Voir les logs en temps réel :
```bash
tail -f logs/bridge_*.log
```

## Sécurité des doublons

Le backend détecte les doublons avec la clé :
```
MD5(sujet + expéditeur + date + device_id)
```

Cela permet de :
- Éviter les re-imports sur plusieurs devices
- Détecter les mails envoyés depuis Outlook directement (ont le même sujet + from + date)
- Isoler par device_id (si l'utilisateur a deux ordinateurs)

## Dépannage

### "Script not found"
Vérifier que les scripts PowerShell sont dans `scripts/`

### "PowerShell timeout"
Les scripts ont 120s de timeout. Si c'est trop court, modifier dans `outlook_bridge_v3.py` ligne 321.

### "Backend not healthy"
Vérifier que le backend CRM est running sur l'URL définie dans `.env`

### "Permission denied"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Multi-Device Support

Le Bridge peut tourner sur **plusieurs ordinateurs simultanément** sans créer de doublons!

### Configuration multi-device:

1. **Copie le dossier `bridge/`** sur chaque ordinateur
2. **Édite `.env`** sur chaque ordinateur avec un Device ID unique:
   ```
   DEVICE_ID=mon-ordinateur-001    # Sur l'ordinateur 1
   DEVICE_ID=mon-ordinateur-002    # Sur l'ordinateur 2
   DEVICE_ID=mon-ordinateur-003    # Sur l'ordinateur 3
   ```
3. **Lance le Bridge** sur chaque ordinateur: `python app.py`
4. **Zéro doublon!** Les mails sont automatiquement dédupliqués par device_id

### Configuration réseau:

Par défaut, le Bridge écoute sur `0.0.0.0:5001` (accessible depuis n'importe quel ordinateur).

Pour restreindre au localhost uniquement:
```bash
BRIDGE_HOST=127.0.0.1 python app.py
```

## Production

### Lancer en arrière-plan sur Windows

1. Créer un fichier `bridge.bat` :
```batch
@echo off
cd /d C:\path\to\bridge
python app.py
pause
```

2. Créer une tâche planifiée Windows qui lance `bridge.bat` au démarrage

### Monitoring

Vérifier que le bridge tourne :
```bash
curl http://127.0.0.1:5001/health
```

Mettre en place un script de monitoring :
```powershell
# check_bridge.ps1
$response = Invoke-WebRequest -Uri "http://127.0.0.1:5001/health"
if ($response.StatusCode -ne 200) {
    # Redémarrer le bridge, envoyer une alerte, etc.
}
```

## Architecture détaillée

```
┌─────────────────────────────────────────┐
│      Outlook (Application COM)          │
├─────────────────────────────────────────┤
│                                         │
│  Inbox (7 derniers jours)               │
│  Sent Items (7 derniers jours)          │
│  Calendar (-60 à +90 jours)             │
│                                         │
└─────────────────────────────────────────┘
           ↓ (PowerShell COM API)
┌─────────────────────────────────────────┐
│      PowerShell Scripts                  │
├─────────────────────────────────────────┤
│                                         │
│  export_mails.ps1 → JSON                │
│  export_calendar.ps1 → JSON             │
│  send_email.ps1 → Outlook.MailItem      │
│  respond_meeting.ps1 → Outlook.Event    │
│                                         │
└─────────────────────────────────────────┘
           ↓ (subprocess + JSON)
┌─────────────────────────────────────────┐
│      Python Bridge (Threading)          │
├─────────────────────────────────────────┤
│                                         │
│  Main Thread: Flask Server              │
│  Daemon Thread: Polling Loop (30s)      │
│                                         │
│  4 Cycles:                              │
│  1. sync_mails()                        │
│  2. sync_calendar()                     │
│  3. send_pending_emails()               │
│  4. respond_to_meetings()               │
│                                         │
└─────────────────────────────────────────┘
           ↓ (REST API + Auth)
┌─────────────────────────────────────────┐
│      Backend CRM (REST API)              │
├─────────────────────────────────────────┤
│                                         │
│  POST /api/communications/receive       │
│  POST /api/agenda-events                │
│  GET /api/communications/pending-send   │
│  PATCH /api/communications/{id}/sent    │
│  GET /api/agenda-events/pending-response│
│  PATCH /api/agenda-events/{id}/responded│
│                                         │
└─────────────────────────────────────────┘
           ↓ (Database)
┌─────────────────────────────────────────┐
│      KV Store (Deno)                    │
├─────────────────────────────────────────┤
│                                         │
│  communication:{id}                     │
│  agenda_event:{id}                      │
│                                         │
└─────────────────────────────────────────┘
```

## Performance

- Mails: ~100-200ms par export
- Calendar: ~50-100ms par export
- Send: ~500ms-1s par email
- Respond: ~300-500ms par réunion
- Intervalle: 30s (configurable)

Chaque cycle prend ~30-50ms, avec 5s entre chaque pour laisser respirer Outlook.

## Licence

Propriétaire - Corevision
