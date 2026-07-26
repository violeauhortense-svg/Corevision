"""
Outlook Bridge Launcher
Démarre le Bridge sans droits admin
"""

import tkinter as tk
from tkinter import messagebox
import subprocess
import os
import sys
import threading
import time
from pathlib import Path
import json

class BridgeLauncher:
    def __init__(self, root):
        self.root = root
        self.root.title("🌉 Outlook Bridge - Launcher")
        self.root.geometry("500x300")
        self.root.resizable(False, False)

        # Config fichier
        self.config_file = Path(__file__).parent / "launcher_config.json"
        self.bridge_process = None
        self.is_running = False

        # Charger la config
        self.load_config()

        # Interface
        self.setup_ui()

        # Vérifier l'état au démarrage
        self.check_bridge_status()

    def load_config(self):
        """Charger la configuration"""
        if self.config_file.exists():
            with open(self.config_file) as f:
                self.config = json.load(f)
        else:
            self.config = {
                'backend_url': 'https://corevision-api.onrender.com/make-server-cac859af',
                'device_id': 'device-001',
                'sync_interval': 30
            }
            self.save_config()

    def save_config(self):
        """Sauvegarder la configuration"""
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)

    def setup_ui(self):
        """Créer l'interface"""
        # Frame principal
        main_frame = tk.Frame(self.root, bg='#f0f0f0')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)

        # Titre
        title = tk.Label(
            main_frame,
            text="🌉 Outlook Bridge",
            font=("Arial", 18, "bold"),
            bg='#f0f0f0'
        )
        title.pack(pady=(0, 5))

        # Statut
        self.status_label = tk.Label(
            main_frame,
            text="🔴 Hors ligne",
            font=("Arial", 16, "bold"),
            fg='red',
            bg='#f0f0f0'
        )
        self.status_label.pack(pady=10)

        # Info
        self.info_label = tk.Label(
            main_frame,
            text="En attente...",
            font=("Arial", 10),
            bg='#f0f0f0',
            fg='#666'
        )
        self.info_label.pack(pady=5)

        # Buttons frame
        button_frame = tk.Frame(main_frame, bg='#f0f0f0')
        button_frame.pack(pady=20)

        # Bouton Démarrer
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

        # Bouton Arrêter
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

        # Device ID
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

        # Fenêtre en arrière-plan
        self.root.iconbitmap('NUL') if sys.platform == 'win32' else None
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)

    def start_bridge(self):
        """Démarrer le Bridge"""
        try:
            # Sauvegarder le Device ID
            self.config['device_id'] = self.device_id_entry.get()
            self.save_config()

            # Créer les variables d'environnement
            env = os.environ.copy()
            env['BACKEND_URL'] = self.config['backend_url']
            env['DEVICE_ID'] = self.config['device_id']
            env['SYNC_INTERVAL'] = str(self.config['sync_interval'])

            # Démarrer le processus
            bridge_dir = Path(__file__).parent
            self.bridge_process = subprocess.Popen(
                [sys.executable, str(bridge_dir / 'app.py')],
                cwd=str(bridge_dir),
                env=env,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
            )

            self.is_running = True
            self.update_ui()
            self.info_label.config(text=f"✅ Bridge démarré (PID: {self.bridge_process.pid})")

            # Vérifier la connexion
            self.verify_bridge()

        except Exception as e:
            messagebox.showerror("Erreur", f"Impossible de démarrer: {e}")

    def stop_bridge(self):
        """Arrêter le Bridge"""
        if self.bridge_process:
            try:
                self.bridge_process.terminate()
                self.bridge_process.wait(timeout=5)
                self.is_running = False
                self.bridge_process = None
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
        except:
            return False

    def verify_bridge(self):
        """Vérifier que le Bridge répond"""
        def check():
            time.sleep(2)  # Attendre le démarrage
            for i in range(10):
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
        """Fermer l'application"""
        if messagebox.askyesno("Quitter", "Voulez-vous fermer le launcher?\n\nNote: Le Bridge continuera de tourner"):
            self.root.destroy()

if __name__ == '__main__':
    root = tk.Tk()
    app = BridgeLauncher(root)
    root.mainloop()
