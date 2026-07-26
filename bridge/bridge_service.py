"""
Windows Service pour Outlook Bridge V3
Permet de faire tourner le Bridge en tant que service système

Installation:
  python bridge_service.py install

Démarrage:
  python bridge_service.py start

Arrêt:
  python bridge_service.py stop

Désinstallation:
  python bridge_service.py remove
"""

import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import sys
import os
import logging
from pathlib import Path

# Configurer le logging
log_dir = Path(__file__).parent / "logs"
log_dir.mkdir(exist_ok=True)
logging.basicConfig(
    filename=str(log_dir / "service.log"),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class BridgeService(win32serviceutil.ServiceFramework):
    """Service Windows pour Outlook Bridge V3"""

    _svc_name_ = "OutlookBridgeV3"
    _svc_display_name_ = "Outlook Bridge V3"
    _svc_description_ = "Synchronisation Outlook ↔ Corevision CRM"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.is_alive = True
        self.bridge_process = None

    def SvcStop(self):
        """Arrêter le service"""
        logging.info("🛑 Arrêt du service")
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_alive = False

        if self.bridge_process:
            self.bridge_process.terminate()
            logging.info("✅ Processus Bridge terminé")

    def SvcDoRun(self):
        """Démarrer le service"""
        logging.info("🌉 Démarrage du service Outlook Bridge V3")

        try:
            # Importer ici pour éviter les problèmes de dépendances
            from outlook_bridge_v3 import OutlookBridgeV3
            from app import app
            import threading

            # Démarrer le Bridge
            logging.info("📧 Initialisation du Bridge")
            bridge = OutlookBridgeV3()
            bridge.start()
            logging.info("✅ Bridge démarré")

            # Démarrer Flask dans un thread séparé
            logging.info("🌐 Démarrage du serveur Flask")
            flask_thread = threading.Thread(
                target=lambda: app.run(
                    host='0.0.0.0',
                    port=5001,
                    debug=False,
                    use_reloader=False
                ),
                daemon=True
            )
            flask_thread.start()
            logging.info("✅ Serveur Flask démarré sur 0.0.0.0:5001")

            # Garder le service actif
            servicemanager.LogMsg(
                servicemanager.EVENTLOG_INFORMATION_TYPE,
                servicemanager.PYS_SERVICE_STARTED,
                (self._svc_name_, '')
            )

            # Attendre l'événement d'arrêt
            while self.is_alive:
                win32event.WaitForMultipleObjects(
                    [self.hWaitStop],
                    False,
                    5000
                )

        except Exception as e:
            logging.error(f"❌ Erreur dans le service: {e}", exc_info=True)
            servicemanager.LogErrorMsg(f"Erreur: {e}")
            self.SvcStop()

    def SvcPause(self):
        """Pause du service (non implémentée)"""
        logging.info("⏸️  Service mis en pause")
        pass

    def SvcContinue(self):
        """Reprise du service (non implémentée)"""
        logging.info("▶️  Service repris")
        pass


def handle_command_line(argv):
    """Gérer les arguments de ligne de commande"""
    if len(argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(BridgeService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(BridgeService)


if __name__ == '__main__':
    handle_command_line(sys.argv)
