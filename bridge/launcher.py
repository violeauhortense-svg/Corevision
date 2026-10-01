"""
Outlook Bridge Launcher
Démarre le Bridge sans droits admin - et sans aucune dépendance externe une
fois empaqueté en .exe autonome (PyInstaller) : Python et toutes les
librairies sont embarqués dans l'exécutable, rien à installer sur la
machine qui le lance.
"""

import tkinter as tk
from tkinter import messagebox
import sys
import threading
import time
from pathlib import Path
import json

from werkzeug.serving import make_server

from outlook_bridge_v3 import Config
import app as flask_bridge_app  # expose `app` (Flask) et `bridge` (OutlookBridgeV3)


def _app_dir() -> Path:
    # A côté du .exe réel une fois empaqueté (jamais dans le dossier
    # temporaire d'extraction PyInstaller, qui disparaît à la fermeture) -
    # c'est là que vit launcher_config.json, pour persister d'un
    # lancement à l'autre.
    if getattr(sys, 'frozen', False):
        return Path(sys.executable).parent
    return Path(__file__).parent


class ServerThread(threading.Thread):
    """Lance le serveur Flask dans CE process, sur un thread dédié.
    Remplace l'ancien subprocess.Popen([sys.executable, 'app.py']) : une
    fois empaqueté en .exe autonome, il n'y a plus de python.exe séparé ni
    de app.py à côté - juste cet unique exécutable."""

    def __init__(self, flask_app, host, port):
        super().__init__(daemon=True)
        self.srv = make_server(host, port, flask_app)

    def run(self):
        self.srv.serve_forever()

    def shutdown(self):
        self.srv.shutdown()


class BridgeLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("🌉 Outlook Bridge - Launcher")
        self.root.geometry("500x300")
        self.root.resizable(False, False)

        self.config_file = _app_dir() / "launcher_config.json"
        self.server_thread = None
        self.is_running = False

        self.load_config()
        self.setup_ui()

    def load_config(self):
        """Charger la configuration"""
        if self.config_file.exists():
            with open(self.config_file, encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = {
                # URL publique du backend (tunnel ngrok) - jamais
                # localhost, puisque ce launcher peut tourner sur un
                # ordinateur différent de celui qui héberge le backend.
                'backend_url': 'https://impromptu-unguided-equivocal.ngrok-free.dev/api',
                'device_id': 'device-001',
                'sync_interval': 30
            }
            self.save_config()

    def save_config(self):
        """Sauvegarder la configuration"""
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2)

    def setup_ui(self):
        """Créer l'interface"""
        main_frame = tk.Frame(self.root, bg='#f0f0f0')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        title = tk.Label(
            main_frame,
            text="🌉 Outlook Bridge",
            font=("Arial", 18, "bold"),
            bg='#f0f0f0'
        )
        title.pack(pady=(0, 5))

        self.status_label = tk.Label(
            main_frame,
            text="🔴 Hors ligne",
            font=("Arial", 16, "bold"),
            fg='red',
            bg='#f0f0f0'
        )
        self.status_label.pack(pady=10)

        self.info_label = tk.Label(
            main_frame,
            text="En attente...",
            font=("Arial", 10),
            bg='#f0f0f0',
            fg='#666'
        )
        self.info_label.pack(pady=5)

        button_frame = tk.Frame(main_frame, bg='#f0f0f0')
        button_frame.pack(pady=20)

        self.start_btn = tk.Button(
            button_frame,
            text="▶️  Démarrer Bridge",
            command=self.start_bridge,
            font=("Arial", 11, "bold"),
            bg='#4CAF50',
            fg='white',
            width=20,
            height=2
        )
        self.start_btn.pack(pady=5)

        self.stop_btn = tk.Button(
            button_frame,
            text="⏹️  Arrêter Bridge",
            command=self.stop_bridge,
            font=("Arial", 11, "bold"),
            bg='#f44336',
            fg='white',
            width=20,
            height=2,
            state=tk.DISABLED
        )
        self.stop_btn.pack(pady=5)

        config_frame = tk.Frame(main_frame, bg='#f0f0f0')
        config_frame.pack(pady=10, fill=tk.X)

        tk.Label(
            config_frame,
            text="Device ID:",
            font=("Arial", 9),
            bg='#f0f0f0'
        ).pack(side=tk.LEFT)

        self.device_id_entry = tk.Entry(
            config_frame,
            font=("Arial", 9),
            width=20
        )
        self.device_id_entry.pack(side=tk.LEFT, padx=5)
        self.device_id_entry.insert(0, self.config['device_id'])

        tk.Button(
            config_frame,
            text="💾 Sauvegarder",
            command=self.save_device_id,
            font=("Arial", 8),
            bg='#2196F3',
            fg='white'
        ).pack(side=tk.LEFT, padx=2)

        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def start_bridge(self):
        """Démarrer le Bridge"""
        try:
            self.config['device_id'] = self.device_id_entry.get()
            self.save_config()

            # Applique la config choisie avant de démarrer - Config est une
            # classe toute simple, la modifier directement a le même effet
            # que les variables d'environnement utilisées par le passé.
            Config.BACKEND_URL = self.config['backend_url']
            Config.DEVICE_ID = self.config['device_id']
            Config.SYNC_INTERVAL = self.config['sync_interval']

            self.server_thread = ServerThread(flask_bridge_app.app, '127.0.0.1', 5001)
            self.server_thread.start()
            flask_bridge_app.bridge.start()

            self.is_running = True
            self.update_ui()
            self.info_label.config(text="✅ Bridge démarré")

            self.verify_bridge()

        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de démarrer: {e}")

    def stop_bridge(self):
        """Arrêter le Bridge"""
        try:
            flask_bridge_app.bridge.stop()
            if self.server_thread:
                self.server_thread.shutdown()
                self.server_thread = None
            self.is_running = False
            self.update_ui()
            self.info_label.config(text="Bridge arrêté")
        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible d'arrêter: {e}")

    def check_bridge_status(self):
        """Vérifier l'état du Bridge"""
        try:
            import urllib.request
            response = urllib.request.urlopen('http://127.0.0.1:5001/health', timeout=2)
            return response.status == 200
        except Exception:
            return False

    def verify_bridge(self):
        """Vérifier que le Bridge répond"""
        def check():
            time.sleep(1)
            for _ in range(10):
                if self.check_bridge_status():
                    self.status_label.config(text="🟢 En ligne!", fg='green')
                    self.info_label.config(text="Synchronisation en cours...")
                    return
                time.sleep(1)
            self.info_label.config(text="⚠️  Bridge démarre (peut prendre plus de temps)")

        threading.Thread(target=check, daemon=True).start()

    def save_device_id(self):
        """Sauvegarder le Device ID"""
        self.config['device_id'] = self.device_id_entry.get()
        self.save_config()
        messagebox.showinfo("✅", "Device ID sauvegardé!")

    def update_ui(self):
        """Mettre à jour l'interface"""
        if self.is_running:
            self.status_label.config(text="🟡 Démarrage...", fg='orange')
            self.start_btn.config(state=tk.DISABLED)
            self.stop_btn.config(state=tk.NORMAL)
            self.device_id_entry.config(state=tk.DISABLED)
        else:
            self.status_label.config(text="🔴 Hors ligne", fg='red')
            self.start_btn.config(state=tk.NORMAL)
            self.stop_btn.config(state=tk.DISABLED)
            self.device_id_entry.config(state=tk.NORMAL)

    def on_closing(self):
        """Fermer l'application - arrête aussi le Bridge s'il tourne, pour
        que fermer cette fenêtre coupe bien la synchronisation."""
        if self.is_running:
            if messagebox.askyesno("Quitter", "Fermer le launcher arrêtera aussi la synchronisation des mails.\n\nContinuer ?"):
                self.stop_bridge()
                self.root.destroy()
        else:
            self.root.destroy()


if __name__ == '__main__':
    root = tk.Tk()
    launcher = BridgeLauncher(root)
    root.mainloop()
