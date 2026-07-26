"""
OutlookBridgeV3: Synchronisation Outlook ↔ CRM Backend
Récupère mails et événements via PowerShell COM, envoie au backend REST API
"""

import os
import json
import time
import logging
import subprocess
import threading
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from dataclasses import dataclass
from hashlib import md5

# ============================================
# CONFIGURATION
# ============================================

class Config:
    # Backend
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3000/make-server-cac859af')
    BACKEND_TIMEOUT = 30

    # Bridge
    DEVICE_ID = os.getenv('DEVICE_ID', 'default-device')
    SYNC_INTERVAL = 30  # secondes

    # Paths
    BRIDGE_DIR = Path(__file__).parent
    SCRIPTS_DIR = BRIDGE_DIR / 'scripts'
    OUTPUT_DIR = BRIDGE_DIR / 'output'
    LOGS_DIR = BRIDGE_DIR / 'logs'

    # Créer les répertoires
    OUTPUT_DIR.mkdir(exist_ok=True)
    LOGS_DIR.mkdir(exist_ok=True)

    # Logging
    LOG_FILE = LOGS_DIR / f'bridge_{datetime.now().strftime("%Y%m%d")}.log'

# ============================================
# LOGGING
# ============================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(Config.LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# DATA MODELS
# ============================================

@dataclass
class Mail:
    subject: str
    from_address: str
    to: str
    received_date: str
    body: str
    html_body: Optional[str] = None
    attachments: List[Dict] = None

    def get_duplicate_key(self) -> str:
        """Clé de détection de doublon : sujet + expéditeur + date + device_id"""
        key = f"{self.subject}|{self.from_address}|{self.received_date}|{Config.DEVICE_ID}"
        return md5(key.encode()).hexdigest()

@dataclass
class CalendarEvent:
    subject: str
    start: str
    end: str
    organizer: str
    required_attendees: List[str]
    outlook_entry_id: str
    response_status: str  # 'accepted' | 'tentative' | 'declined' | 'not_responded'

class OutlookBridgeV3:
    """Bridge Outlook ↔ CRM Backend"""

    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = Config.BACKEND_TIMEOUT
        self.running = False
        self.last_sync = {}

        logger.info("🌉 OutlookBridgeV3 initialized")

    # ============================================
    # CYCLE 1: Récupérer les mails
    # ============================================

    def sync_mails(self) -> Tuple[int, int]:
        """
        Récupère les mails via PowerShell, les envoie au backend
        Retourne : (mails_envoyés, doublons)
        """
        try:
            logger.info("📧 [CYCLE 1] Récupération des mails...")

            # Exécuter le script PowerShell
            mails_json = self._run_powershell('export_mails.ps1')
            if not mails_json:
                logger.warning("❌ Pas de mails reçus de PowerShell")
                return 0, 0

            mails = json.loads(mails_json)
            logger.info(f"📧 {len(mails)} mails reçus de PowerShell")

            sent_count = 0
            duplicate_count = 0

            for mail_data in mails:
                mail = Mail(**mail_data)

                # Vérifier les doublons
                duplicate_key = mail.get_duplicate_key()

                # POST au backend
                response = self.session.post(
                    f"{Config.BACKEND_URL}/communications/receive",
                    json={
                        'from': mail.from_address,
                        'to': mail.to.split(';'),
                        'subject': mail.subject,
                        'body': mail.body,
                        'bodyHtml': mail.html_body,
                        'receivedAt': mail.received_date,
                        'attachments': mail.attachments or [],
                        'duplicate_key': duplicate_key,
                        'device_id': Config.DEVICE_ID
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    if result.get('duplicate'):
                        duplicate_count += 1
                        logger.debug(f"⊘ Doublon détecté : {mail.subject}")
                    else:
                        sent_count += 1
                        logger.info(f"✅ Mail envoyé : {mail.subject}")
                else:
                    logger.error(f"❌ Erreur envoi mail : {response.status_code} - {response.text}")

            logger.info(f"📧 [CYCLE 1] Résumé : {sent_count} envoyés, {duplicate_count} doublons")
            return sent_count, duplicate_count

        except Exception as e:
            logger.error(f"❌ [CYCLE 1] Erreur : {e}")
            return 0, 0

    # ============================================
    # CYCLE 2: Récupérer les événements
    # ============================================

    def sync_calendar(self) -> int:
        """
        Récupère les événements Outlook et les envoie au backend
        Retourne : nombre d'événements envoyés
        """
        try:
            logger.info("📅 [CYCLE 2] Récupération du calendrier...")

            # Exécuter le script PowerShell
            events_json = self._run_powershell('export_calendar.ps1')
            if not events_json:
                logger.warning("❌ Pas d'événements reçus de PowerShell")
                return 0

            events = json.loads(events_json)
            logger.info(f"📅 {len(events)} événements reçus de PowerShell")

            sent_count = 0

            for event_data in events:
                event = CalendarEvent(**event_data)

                # POST au backend
                response = self.session.post(
                    f"{Config.BACKEND_URL}/agenda-events",
                    json={
                        'title': event.subject,
                        'startDate': event.start,
                        'endDate': event.end,
                        'outlookEventId': event.outlook_entry_id,
                        'status': event.response_status,
                        'attendees': [
                            {'email': attendee, 'status': event.response_status}
                            for attendee in event.required_attendees
                        ],
                        'source': 'outlook',
                        'device_id': Config.DEVICE_ID
                    }
                )

                if response.status_code == 200:
                    sent_count += 1
                    logger.info(f"✅ Événement envoyé : {event.subject}")
                else:
                    logger.error(f"❌ Erreur envoi événement : {response.status_code}")

            logger.info(f"📅 [CYCLE 2] Résumé : {sent_count} événements envoyés")
            return sent_count

        except Exception as e:
            logger.error(f"❌ [CYCLE 2] Erreur : {e}")
            return 0

    # ============================================
    # CYCLE 3: Envoyer les mails en attente
    # ============================================

    def send_pending_emails(self) -> int:
        """
        Récupère les mails en attente du backend et les envoie via Outlook
        Retourne : nombre de mails envoyés
        """
        try:
            logger.info("📤 [CYCLE 3] Récupération des mails en attente...")

            # GET les mails en attente
            response = self.session.get(
                f"{Config.BACKEND_URL}/communications/pending-send",
                params={'device_id': Config.DEVICE_ID}
            )

            if response.status_code != 200:
                logger.warning(f"❌ Erreur GET pending emails : {response.status_code}")
                return 0

            pending_mails = response.json().get('communications', [])
            logger.info(f"📤 {len(pending_mails)} mails en attente")

            sent_count = 0

            for mail in pending_mails:
                # Exécuter le script PowerShell pour envoyer
                ps_result = self._run_powershell(
                    'send_email.ps1',
                    {
                        'to': ','.join(mail.get('to', [])),
                        'subject': mail.get('subject', ''),
                        'body': mail.get('body', ''),
                        'cc': ','.join(mail.get('cc', [])),
                        'bcc': ','.join(mail.get('bcc', []))
                    }
                )

                if ps_result and 'success' in ps_result.lower():
                    sent_count += 1
                    logger.info(f"✅ Mail envoyé : {mail.get('subject')}")

                    # PATCH au backend pour marquer comme envoyé
                    self.session.patch(
                        f"{Config.BACKEND_URL}/communications/{mail['id']}/sent"
                    )
                else:
                    logger.error(f"❌ Erreur envoi mail : {mail.get('subject')}")

            logger.info(f"📤 [CYCLE 3] Résumé : {sent_count} mails envoyés")
            return sent_count

        except Exception as e:
            logger.error(f"❌ [CYCLE 3] Erreur : {e}")
            return 0

    # ============================================
    # CYCLE 4: Répondre aux réunions
    # ============================================

    def respond_to_meetings(self) -> int:
        """
        Récupère les réunions en attente de réponse et répond via Outlook
        Retourne : nombre de réponses envoyées
        """
        try:
            logger.info("📞 [CYCLE 4] Récupération des réunions en attente...")

            # GET les réunions en attente
            response = self.session.get(
                f"{Config.BACKEND_URL}/agenda-events/pending-response",
                params={'device_id': Config.DEVICE_ID}
            )

            if response.status_code != 200:
                logger.warning(f"❌ Erreur GET pending responses : {response.status_code}")
                return 0

            pending_events = response.json().get('events', [])
            logger.info(f"📞 {len(pending_events)} réunions en attente")

            responded_count = 0

            for event in pending_events:
                # Exécuter le script PowerShell pour répondre
                ps_result = self._run_powershell(
                    'respond_meeting.ps1',
                    {
                        'entry_id': event.get('outlookEventId'),
                        'response': event.get('pending_response')  # 'accept' | 'decline' | 'tentative'
                    }
                )

                if ps_result and 'success' in ps_result.lower():
                    responded_count += 1
                    logger.info(f"✅ Réponse envoyée : {event.get('title')} ({event.get('pending_response')})")

                    # PATCH au backend pour marquer comme traité
                    self.session.patch(
                        f"{Config.BACKEND_URL}/agenda-events/{event['id']}/responded",
                        json={'response': event.get('pending_response')}
                    )
                else:
                    logger.error(f"❌ Erreur réponse réunion : {event.get('title')}")

            logger.info(f"📞 [CYCLE 4] Résumé : {responded_count} réponses envoyées")
            return responded_count

        except Exception as e:
            logger.error(f"❌ [CYCLE 4] Erreur : {e}")
            return 0

    # ============================================
    # UTILITIES
    # ============================================

    def _run_powershell(self, script_name: str, params: Dict = None) -> Optional[str]:
        """
        Exécute un script PowerShell et retourne l'output
        """
        try:
            script_path = Config.SCRIPTS_DIR / script_name

            if not script_path.exists():
                logger.error(f"❌ Script non trouvé : {script_path}")
                return None

            # Construire la commande PowerShell
            cmd = [
                'powershell',
                '-NoProfile',
                '-ExecutionPolicy', 'Bypass',
                '-File', str(script_path)
            ]

            # Ajouter les paramètres
            if params:
                for key, value in params.items():
                    cmd.extend(['-', key, str(value)])

            # Exécuter
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=120
            )

            if result.returncode != 0:
                logger.error(f"❌ PowerShell error : {result.stderr}")
                return None

            return result.stdout.strip()

        except subprocess.TimeoutExpired:
            logger.error(f"❌ PowerShell timeout : {script_name}")
            return None
        except Exception as e:
            logger.error(f"❌ PowerShell execution error : {e}")
            return None

    # ============================================
    # POLLING THREAD
    # ============================================

    def start(self):
        """Démarre le polling continu"""
        self.running = True
        thread = threading.Thread(target=self._polling_loop, daemon=True)
        thread.start()
        logger.info("🚀 Bridge started (polling every 30s)")

    def stop(self):
        """Arrête le polling"""
        self.running = False
        logger.info("🛑 Bridge stopped")

    def _polling_loop(self):
        """Boucle de polling continu"""
        while self.running:
            try:
                # Cycle 1: Mails
                self.sync_mails()
                time.sleep(5)

                # Cycle 2: Calendar
                self.sync_calendar()
                time.sleep(5)

                # Cycle 3: Send pending
                self.send_pending_emails()
                time.sleep(5)

                # Cycle 4: Respond meetings
                self.respond_to_meetings()
                time.sleep(5)

                # Attendre avant le prochain cycle
                logger.info(f"⏳ Prochain sync dans {Config.SYNC_INTERVAL}s...")
                time.sleep(Config.SYNC_INTERVAL - 20)

            except Exception as e:
                logger.error(f"❌ Polling loop error : {e}")
                time.sleep(5)

    def health_check(self) -> bool:
        """Vérifie que le backend est accessible"""
        try:
            response = self.session.get(f"{Config.BACKEND_URL}/health", timeout=5)
            return response.status_code == 200
        except Exception:
            return False

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    bridge = OutlookBridgeV3()
    bridge.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("⏹️ Shutting down...")
        bridge.stop()
