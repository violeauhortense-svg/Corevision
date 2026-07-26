"""
Flask API pour le Bridge Outlook
Endpoints pour gérer la synchronisation et les diagnostics
"""

from flask import Flask, jsonify, request
import logging
from outlook_bridge_v3 import OutlookBridgeV3, Config

# ============================================
# CONFIGURATION FLASK
# ============================================

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Instance du bridge
bridge = OutlookBridgeV3()

# Logging
logger = logging.getLogger(__name__)

# ============================================
# ENDPOINTS
# ============================================

@app.route('/health', methods=['GET'])
def health():
    """
    Vérifier que le bridge est en cours d'exécution
    GET /health
    """
    return jsonify({
        'status': 'ok',
        'bridge_running': bridge.running,
        'backend_healthy': bridge.health_check(),
        'device_id': Config.DEVICE_ID,
        'sync_interval': Config.SYNC_INTERVAL
    }), 200

@app.route('/sync', methods=['POST'])
def force_sync():
    """
    Force une synchronisation immédiate
    POST /sync

    Body optionnel:
    {
        "cycles": ["mails", "calendar", "send", "respond"]  # Par défaut : tous
    }
    """
    try:
        cycles = request.json.get('cycles', ['mails', 'calendar', 'send', 'respond']) if request.json else ['mails', 'calendar', 'send', 'respond']

        results = {}

        if 'mails' in cycles:
            sent, duplicates = bridge.sync_mails()
            results['mails'] = {
                'sent': sent,
                'duplicates': duplicates
            }

        if 'calendar' in cycles:
            sent = bridge.sync_calendar()
            results['calendar'] = {
                'events_synced': sent
            }

        if 'send' in cycles:
            sent = bridge.send_pending_emails()
            results['send'] = {
                'emails_sent': sent
            }

        if 'respond' in cycles:
            responded = bridge.respond_to_meetings()
            results['respond'] = {
                'meetings_responded': responded
            }

        return jsonify({
            'status': 'success',
            'results': results
        }), 200

    except Exception as e:
        logger.error(f"Error forcing sync: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/diagnose', methods=['GET'])
def diagnose():
    """
    Diagnostics du bridge
    GET /diagnose
    """
    try:
        return jsonify({
            'status': 'ok',
            'bridge': {
                'running': bridge.running,
                'device_id': Config.DEVICE_ID,
                'sync_interval': Config.SYNC_INTERVAL
            },
            'backend': {
                'url': Config.BACKEND_URL,
                'healthy': bridge.health_check(),
                'timeout': Config.BACKEND_TIMEOUT
            },
            'paths': {
                'scripts': str(Config.SCRIPTS_DIR),
                'logs': str(Config.LOGS_DIR),
                'log_file': str(Config.LOG_FILE)
            }
        }), 200

    except Exception as e:
        logger.error(f"Error running diagnostics: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@app.route('/status', methods=['GET'])
def status():
    """
    État détaillé du bridge
    GET /status
    """
    return jsonify({
        'status': 'running' if bridge.running else 'stopped',
        'device_id': Config.DEVICE_ID,
        'backend_url': Config.BACKEND_URL,
        'sync_interval': Config.SYNC_INTERVAL,
        'log_file': str(Config.LOG_FILE)
    }), 200

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}")
    return jsonify({'error': 'Internal server error'}), 500

# ============================================
# MAIN
# ============================================

if __name__ == '__main__':
    import os

    logger.info("🌉 Starting Outlook Bridge Flask API...")

    # Démarrer le bridge
    bridge.start()

    # Récupérer le host depuis l'environnement (par défaut: 0.0.0.0 pour écouter sur tous les ordinateurs)
    # Mettre à 127.0.0.1 si tu veux restreindre au localhost uniquement
    host = os.getenv('BRIDGE_HOST', '0.0.0.0')
    port = int(os.getenv('BRIDGE_PORT', 5001))

    logger.info(f"🌐 Listening on {host}:{port}")
    if host == '0.0.0.0':
        logger.info("   ✅ Accessible from any computer on this network")
        logger.info("   🔐 Make sure your firewall allows port 5001")

    # Démarrer le serveur Flask
    app.run(
        host=host,
        port=port,
        debug=False,
        use_reloader=False  # Désactiver le reloader pour ne pas dupliquer le bridge
    )
