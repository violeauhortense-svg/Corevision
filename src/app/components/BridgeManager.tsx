import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Terminal, Settings } from 'lucide-react';
import { Card } from './ui/card';
import { toast } from 'sonner';
import { apiBaseUrl } from '../utils/api/info';

interface BridgeStatus {
  status: 'ok' | 'error';
  bridge_running: boolean;
  backend_healthy?: boolean;
  device_id?: string;
  sync_interval?: number;
  last_sync?: string;
}

export function BridgeManager() {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  // 'pc-hortense-001' correspond au DEVICE_ID réellement configuré dans
  // bridge/.env - l'ancien défaut ('device-001') ne correspondait à rien
  // de réel, donc le statut n'aurait jamais pu s'afficher "en ligne"
  // même une fois le bridge correctement démarré.
  const [deviceId, setDeviceId] = useState(localStorage.getItem('bridge_device_id') || 'pc-hortense-001');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    checkBridgeStatus();
    const interval = setInterval(checkBridgeStatus, 3000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const checkBridgeStatus = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bridge/status/${deviceId}`);
      if (response.ok) {
        const data = await response.json();
        setBridgeStatus(data);
        if (data.bridge_running) {
          addLog(`✅ Bridge en ligne`);
        } else {
          addLog(`❌ Bridge hors ligne`);
        }
      }
    } catch (error) {
      setBridgeStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message: string) => {
    setLogs(prev => [...prev.slice(-9), message]);
  };

  const handleForcedSync = async () => {
    if (!bridgeStatus?.bridge_running) {
      toast.error('Bridge non disponible');
      return;
    }

    try {
      setSyncing(true);
      addLog('🔄 Synchronisation en cours...');

      const response = await fetch(`http://127.0.0.1:5001/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cycles: ['mails', 'calendar', 'send', 'respond'] })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('✅ Synchronisation terminée!');

        const mails = result.results.mails?.sent || 0;
        const events = result.results.calendar?.events_synced || 0;
        const emails = result.results.send?.emails_sent || 0;
        const responses = result.results.respond?.meetings_responded || 0;

        addLog(`✅ Sync réussie: ${mails} mails, ${events} calendriers, ${emails} emails, ${responses} réponses`);
        checkBridgeStatus();
      } else {
        toast.error('Erreur lors de la synchronisation');
        addLog(`❌ Erreur: ${response.statusText}`);
      }
    } catch (error) {
      toast.error('Impossible de synchroniser');
      addLog(`❌ Erreur: ${error}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveDeviceId = () => {
    localStorage.setItem('bridge_device_id', deviceId);
    toast.success(`Device ID: ${deviceId}`);
  };

  // Fichiers statiques (public/downloads/) plutôt que des routes backend
  // dédiées - ni /download/install-bridge-service ni /download/bridge-
  // launcher n'ont jamais existé côté backend, ces deux boutons ne
  // téléchargeaient donc jamais rien.
  const downloadAutostartScript = (filename: 'install_autostart.bat' | 'install_autostart.ps1') => {
    const link = document.createElement('a');
    link.href = `/downloads/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`✅ ${filename} téléchargé`);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Bridge Outlook</h1>
          </div>
          <p className="text-gray-600">Synchronisation automatique Outlook ↔ Corevision</p>
        </div>

        {/* Status Card */}
        <Card className={`p-8 mb-8 border-l-4 text-center ${bridgeStatus?.bridge_running ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <div className="flex justify-center mb-4">
            {bridgeStatus?.bridge_running ? (
              <CheckCircle2 className="w-16 h-16 text-green-600 animate-pulse" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-600" />
            )}
          </div>

          <h2 className={`text-3xl font-bold mb-2 ${bridgeStatus?.bridge_running ? 'text-green-900' : 'text-red-900'}`}>
            {bridgeStatus?.bridge_running ? '🟢 BRIDGE EN LIGNE' : '🔴 BRIDGE HORS LIGNE'}
          </h2>

          <p className={`text-lg mb-6 ${bridgeStatus?.bridge_running ? 'text-green-700' : 'text-red-700'}`}>
            {bridgeStatus?.bridge_running
              ? 'Synchronisation en cours toutes les 30 secondes'
              : 'Installation requise - Clique ci-dessous'}
          </p>

          {bridgeStatus?.bridge_running && (
            <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-white/50 p-3 rounded">
                <p className="text-xs text-gray-600">Device ID</p>
                <p className="font-mono font-bold text-green-900">{bridgeStatus.device_id}</p>
              </div>
              <div className="bg-white/50 p-3 rounded">
                <p className="text-xs text-gray-600">Dernière sync</p>
                <p className="font-mono text-green-900">{bridgeStatus.last_sync || 'Bientôt...'}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            {bridgeStatus?.bridge_running ? (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">La synchronisation est automatique toutes les 30 secondes</p>
                  <p className="text-xs text-gray-500">Les nouveaux mails et événements apparaissent automatiquement</p>
                </div>
              </>
            ) : (
              <button
                onClick={checkBridgeStatus}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Vérifier
              </button>
            )}
          </div>
        </Card>

        {/* Setup Instructions */}
        {!bridgeStatus?.bridge_running && (
          <div className="space-y-4 mb-8">
            <Card className="p-6 bg-green-50 border border-green-200">
              <h3 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                ✨ Lancement automatique (sans droits admin)
              </h3>
              <div className="space-y-3 text-sm text-green-800">
                <p>
                  OutlookBridge.exe se relance tout seul à chaque ouverture de session Windows, et se relance
                  automatiquement s'il plante - plus besoin d'y penser.
                </p>
                <div className="bg-white p-3 rounded space-y-2">
                  <p><strong>Étape 1:</strong> Télécharge <code>OutlookBridge.exe</code> (menu de gauche) et les deux fichiers ci-dessous</p>
                  <p><strong>Étape 2:</strong> Place les 3 fichiers dans le même dossier</p>
                  <p><strong>Étape 3:</strong> Double-clique sur <code>install_autostart.bat</code> (lance aussi le bridge immédiatement)</p>
                  <p><strong>Étape 4:</strong> Reviens ici et clique "Vérifier"</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => downloadAutostartScript('install_autostart.bat')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                >
                  ⬇️ install_autostart.bat
                </button>
                <button
                  onClick={() => downloadAutostartScript('install_autostart.ps1')}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                >
                  ⬇️ install_autostart.ps1
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Configuration */}
        <Card className="p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device ID (ce cet ordinateur)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="Ex: mon-ordinateur-001"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveDeviceId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                >
                  Sauvegarder
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Permet de synchroniser depuis plusieurs ordinateurs sans doublons
              </p>
            </div>
          </div>
        </Card>

        {/* Logs */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold">Logs</h3>
          </div>

          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-32 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">En attente de connexion au Bridge...</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
